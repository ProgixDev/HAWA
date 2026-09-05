import type {OnboardingLocation, SchoolId} from '../state/onboardingPreferences';

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type NextPrayer = {
  hijriDate: string;
  name: PrayerName;
  time: string;
  at: Date;
};

// A prayer window is [start, end). Per the HAWA product rule, each window's
// end is the NEXT prayer's start, EXCEPT Fajr — Fajr's window closes at
// Sunrise, not at Dhuhr, since Sunrise ends the Fajr prayer time. Isha's
// window crosses midnight and only closes at the next day's Fajr.
export type PrayerWindow = {
  name: PrayerName;
  start: Date;
  end: Date;
};

export type PrayerSchedule = {
  date: Date;
  timezone: string;
  hijriDate: string;
  hijriDay: string;
  fajrAngle?: number;
  /** Today's 5 prayers, in order, for display ("Horaires du jour"). */
  windows: PrayerWindow[];
  /**
   * Same windows plus the tail end of the previous day's Isha window
   * (yesterday's Isha start → today's Fajr start), so a datetime anywhere
   * in the 24h day — including the small hours before today's Fajr — falls
   * inside exactly one window. Use this for purity/prayer-due comparisons.
   */
  purityWindows: PrayerWindow[];
  /**
   * Tomorrow's Fajr window (start = tomorrow's Fajr, end = tomorrow's
   * Sunrise) — the "next prayer" once `now` has moved past today's Isha
   * start, since today's own windows no longer contain a future prayer.
   */
  nextDayFirstWindow: PrayerWindow;
};

type ApiDay = {
  timings: Record<PrayerName, string> & {Sunrise: string};
  date: {hijri: {day: string; month: {en: string}; year: string}};
  meta: {
    timezone: string;
    method?: {name?: string; params?: {Fajr?: number}};
  };
};

type ApiResponse = {code: number; data: ApiDay};
const PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const normalizeCountry = (country: string) =>
  country.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const calculationMethodFor = (country: string) => {
  const normalized = normalizeCountry(country);
  if (normalized.includes('alger')) {return 19;}
  if (normalized.includes('maroc') || normalized.includes('morocco')) {return 21;}
  if (normalized.includes('france')) {return 12;}
  if (normalized.includes('tunisie') || normalized.includes('tunisia')) {return 18;}
  return 3;
};

const dateParts = (date: Date, timezone?: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    ...(timezone ? {timeZone: timezone} : {}),
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '';
  return `${value('day')}-${value('month')}-${value('year')}`;
};

/**
 * Shifts a "DD-MM-YYYY" day key by whole calendar days. This is pure
 * calendar arithmetic anchored at UTC noon — it never looks at wall-clock
 * time — so it can't roll over by an extra day depending on what time of
 * day the caller happens to run (unlike adding/subtracting a fixed number
 * of hours to a Date, which drifts by a day whenever the anchor time is on
 * the "wrong" side of noon).
 */
const shiftDayKey = (dayKey: string, deltaDays: number): string => {
  const [day, month, year] = dayKey.split('-').map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const shifted = new Date(anchor.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(shifted.getUTCDate())}-${pad(shifted.getUTCMonth() + 1)}-${shifted.getUTCFullYear()}`;
};

const fetchDay = async (
  day: string,
  location: OnboardingLocation,
  school: SchoolId | null,
): Promise<ApiDay> => {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    method: String(calculationMethodFor(location.country)),
    school: school === 'hanafi' ? '1' : '0',
    iso8601: 'true',
  });
  const response = await fetch(`https://api.aladhan.com/v1/timings/${day}?${params}`);
  if (!response.ok) {throw new Error('PRAYER_HTTP_ERROR');}
  const payload = await response.json() as ApiResponse;
  if (payload.code !== 200 || !payload.data?.meta?.timezone) {
    throw new Error('PRAYER_TIMINGS_UNAVAILABLE');
  }
  return payload.data;
};

const nextFromDay = (day: ApiDay, now: Date): NextPrayer | undefined => {
  for (const name of PRAYERS) {
    const at = new Date(day.timings[name]);
    if (!Number.isNaN(at.getTime()) && at.getTime() > now.getTime()) {
      return {
        name,
        at,
        time: new Intl.DateTimeFormat('fr-FR', {
          timeZone: day.meta.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(at),
        hijriDate: `${day.date.hijri.day} ${day.date.hijri.month.en} ${day.date.hijri.year}`,
      };
    }
  }
  return undefined;
};

export async function fetchNextPrayer(
  location: OnboardingLocation,
  school: SchoolId | null,
  now = new Date(),
): Promise<NextPrayer | undefined> {
  const initialDay = dateParts(now, location.timezone);
  let today = await fetchDay(initialDay, location, school);
  const localDay = dateParts(now, today.meta.timezone);
  if (localDay !== initialDay) {
    today = await fetchDay(localDay, location, school);
  }
  const todayPrayer = nextFromDay(today, now);
  if (todayPrayer) {return todayPrayer;}

  const tomorrow = dateParts(
    new Date(now.getTime() + 36 * 60 * 60 * 1000),
    today.meta.timezone,
  );
  return nextFromDay(await fetchDay(tomorrow, location, school), now);
}

const PRAYER_ORDER: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

/**
 * Fetches the full day's 5 prayer windows for `date`, plus enough of the
 * surrounding days to build purity-check windows that correctly handle
 * Isha crossing midnight (its window only ends at the *next* day's Fajr).
 */
export async function fetchPrayerSchedule(
  location: OnboardingLocation,
  school: SchoolId | null,
  date = new Date(),
): Promise<PrayerSchedule> {
  const initialDay = dateParts(date, location.timezone);
  let today = await fetchDay(initialDay, location, school);
  const localDay = dateParts(date, today.meta.timezone);
  if (localDay !== initialDay) {
    today = await fetchDay(localDay, location, school);
  }
  const tz = today.meta.timezone;

  const previousDayKey = shiftDayKey(localDay, -1);
  const nextDayKey = shiftDayKey(localDay, 1);

  const [previousDay, nextDay] = await Promise.all([
    fetchDay(previousDayKey, location, school),
    fetchDay(nextDayKey, location, school),
  ]);

  const [fajrStart, dhuhrStart, asrStart, maghribStart, ishaStart] =
    PRAYER_ORDER.map(name => new Date(today.timings[name]));
  const sunrise = new Date(today.timings.Sunrise);
  const nextFajr = new Date(nextDay.timings.Fajr);
  const nextSunrise = new Date(nextDay.timings.Sunrise);
  const previousIshaStart = new Date(previousDay.timings.Isha);

  // Fajr's window closes at Sunrise, not at Dhuhr — Sunrise is only a
  // timing boundary here, never treated as one of the five prayers.
  const windows: PrayerWindow[] = [
    {name: 'Fajr', start: fajrStart, end: sunrise},
    {name: 'Dhuhr', start: dhuhrStart, end: asrStart},
    {name: 'Asr', start: asrStart, end: maghribStart},
    {name: 'Maghrib', start: maghribStart, end: ishaStart},
    {name: 'Isha', start: ishaStart, end: nextFajr},
  ];

  const purityWindows: PrayerWindow[] = [
    {name: 'Isha', start: previousIshaStart, end: windows[0].start},
    ...windows,
  ];

  return {
    date,
    timezone: tz,
    hijriDate: `${today.date.hijri.day} ${today.date.hijri.month.en} ${today.date.hijri.year}`,
    hijriDay: today.date.hijri.day,
    fajrAngle: today.meta.method?.params?.Fajr,
    windows,
    purityWindows,
    nextDayFirstWindow: {name: 'Fajr', start: nextFajr, end: nextSunrise},
  };
}

export const formatRemainingPrayerTime = (at: Date, now = new Date()) => {
  const minutes = Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {return `Dans ${remainingMinutes} min`;}
  if (remainingMinutes === 0) {return `Dans ${hours} h`;}
  return `Dans ${hours} h ${remainingMinutes.toString().padStart(2, '0')}`;
};
