import i18n from '../i18n';

// Short hour / minute units for durations shown as "8 h 30 min". Latin-script languages keep "h" / "min"; languages that do not
// write them that way get their own abbreviation (Arabic: س = ساعة, د = دقيقة — the same س the sleep chips already use).
const UNITS: Record<string, {hour: string; minute: string}> = {
  ar: {hour: 'س', minute: 'د'},
};

const unitsFor = (): {hour: string; minute: string} => UNITS[(i18n.language ?? '').split('-')[0]] ?? {hour: 'h', minute: 'min'};

export const hourUnit = (): string => unitsFor().hour;
export const minuteUnit = (): string => unitsFor().minute;

/** "8 h 30 min" (ar: "8 س 30 د"). */
export function formatHoursMinutes(totalMinutes: number): string {
  const {hour, minute} = unitsFor();
  return `${Math.floor(totalMinutes / 60)} ${hour} ${String(totalMinutes % 60).padStart(2, '0')} ${minute}`;
}
