import type {OnboardingLocation, SchoolId} from '../state/onboardingPreferences';

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type NextPrayer = {
  hijriDate: string;
  name: PrayerName;
  time: string;
  at: Date;
};

type ApiDay = {
  timings: Record<PrayerName, string>;
  date: {hijri: {day: string; month: {en: string}; year: string}};
  meta: {timezone: string};
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

export const formatRemainingPrayerTime = (at: Date, now = new Date()) => {
  const minutes = Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {return `Dans ${remainingMinutes} min`;}
  if (remainingMinutes === 0) {return `Dans ${hours} h`;}
  return `Dans ${hours} h ${remainingMinutes.toString().padStart(2, '0')}`;
};
