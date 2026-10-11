// "HH:mm" as AWA stores it for reminders, appointments and journal times.
//
// The stored value must not depend on the language the phone is displaying: it used to be produced with
// Intl.DateTimeFormat(locale, {hour12: false}), and under en-US that renders midnight as "24:30" (V8 verified; the
// "h24" hour cycle). A "24:30" that is later split on ":" and fed to `new Date(y, m, d, 24, 30)` is the NEXT day at
// 00:30 — a reminder (or an appointment time) a whole day late, and a list sorted after 23:59.

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** 'HH:mm', 24-hour, zero-padded, from the LOCAL time of `date`. Locale-independent: "00:30", never "24:30". */
export function formatTimeOfDay(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Reads a stored "HH:mm". null for anything that is not a time of day.
 *
 * Records written by earlier builds can contain "24:xx" for 00:xx (see above). That is read as 00:xx of the SAME
 * day — what the person picked — so no stored value needs rewriting.
 */
export function parseTimeOfDay(value: string | null | undefined): {hours: number; minutes: number} | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(value);
  if (!match) {
    return null;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours === 24 && minutes < 60) {
    hours = 0;
  }
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return {hours, minutes};
}

/**
 * A stored time of day as it is SHOWN: the canonical 24-hour "HH:mm" when `value` is a time of day (a legacy "24:30"
 * reads as "00:30"), otherwise the value exactly as stored. For read-only displays of stored text; never written back.
 */
export function normalizeTimeOfDay(value: string): string {
  const parsed = parseTimeOfDay(value);
  return parsed ? `${pad2(parsed.hours)}:${pad2(parsed.minutes)}` : value;
}

/** A `Date` on `base`'s calendar day (local) at the given stored time; `fallback` when it cannot be read. */
export function dateAtTimeOfDay(base: Date, value: string | null | undefined, fallback: string = '00:00'): Date {
  const parsed = parseTimeOfDay(value) ?? parseTimeOfDay(fallback) ?? {hours: 0, minutes: 0};
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), parsed.hours, parsed.minutes, 0, 0);
}
