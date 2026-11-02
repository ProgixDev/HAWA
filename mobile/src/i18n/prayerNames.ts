import type {TFunction} from 'i18next';

// Display names of the five daily prayers. The identifiers (services/prayerTimes.ts PrayerName: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha') never change; only
// the label shown to the user is looked up here. A language that defines `prayerTimes.names.<id>` (Arabic: الفجر، الظهر، العصر، المغرب، العشاء) shows it; every other
// language has no such key, so the lookup returns the identifier itself — exactly the transliterated name AWA has always shown.
export function localizedPrayerName(t: TFunction, name: string): string {
  return String(t(`prayerTimes.names.${name.toLowerCase()}`, {defaultValue: name}));
}
