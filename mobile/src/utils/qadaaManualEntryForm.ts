import {hijriPartsFor, isRamadan} from './hijriCalendar';
import {
  QADAA_MAX_DAYS_PER_ENTRY,
  QADAA_MAX_NOTE_LENGTH,
  type QadaaCompletionEntry,
  type QadaaManualEntry,
  type QadaaManualEntryInput,
  type QadaaYearSystem,
} from '../state/qadaaLedgerStore';
import {addDays, formatFullDate, startOfDay} from './cycleMath';

// Validation + French wording for the manual Qadaa form and the history cards.
// Manual entries are USER-DECLARED: nothing here infers a religious reason, and
// nothing requires an exact missed-fast date — a year is optional and an entry
// without one is simply an "ancien solde".

// The two calendars can never be confused: Hijri years are ~1300–1500, Gregorian
// ones ~1950–2100.
const MIN_HIJRI_YEAR = 1300;
const MIN_GREGORIAN_YEAR = 1950;

export type QadaaManualFormValues = {
  /** Raw text of "Nombre de jours". */
  quantityText: string;
  /** false = "Ancien solde / année inconnue" (no year is stored). */
  knowsYear: boolean;
  /** Raw text of the year field (Hijri e.g. 1445, or Gregorian e.g. 2018). */
  yearText: string;
  note: string;
};

export type QadaaManualFormField = 'quantity' | 'year';

export type QadaaManualFormResult =
  | {ok: true; value: Omit<QadaaManualEntryInput, 'id'>}
  | {ok: false; field: QadaaManualFormField; message: string};

/** Which calendar a typed year belongs to, or null when it is out of range. */
export function classifyQadaaYear(year: number, now: Date = new Date()): QadaaYearSystem | null {
  if (!Number.isInteger(year)) {return null;}
  const currentHijri = hijriPartsFor(now).year;
  if (year >= MIN_HIJRI_YEAR && year <= currentHijri) {return 'hijri';}
  if (year >= MIN_GREGORIAN_YEAR && year <= now.getFullYear()) {return 'gregorian';}
  return null;
}

export function validateQadaaManualForm(values: QadaaManualFormValues, now: Date = new Date()): QadaaManualFormResult {
  const quantityText = values.quantityText.trim();
  if (!quantityText) {
    return {ok: false, field: 'quantity', message: 'Indique le nombre de jours.'};
  }
  // Digits only: "2.5", "-3", "1e3", "0x10", "٢" are all rejected rather than parsed loosely.
  if (!/^\d{1,4}$/.test(quantityText)) {
    return {ok: false, field: 'quantity', message: 'Entre un nombre entier de jours (par exemple 2).'};
  }
  const quantity = Number(quantityText);
  if (quantity < 1) {
    return {ok: false, field: 'quantity', message: 'Le nombre de jours doit être d’au moins 1.'};
  }
  if (quantity > QADAA_MAX_DAYS_PER_ENTRY) {
    return {ok: false, field: 'quantity', message: `Le nombre de jours ne peut pas dépasser ${QADAA_MAX_DAYS_PER_ENTRY}.`};
  }

  const note = values.note.trim().slice(0, QADAA_MAX_NOTE_LENGTH) || null;

  if (!values.knowsYear) {
    return {ok: true, value: {quantity, year: null, yearSystem: null, note}};
  }

  const yearText = values.yearText.trim();
  if (!/^\d{4}$/.test(yearText)) {
    return {ok: false, field: 'year', message: 'Entre une année à 4 chiffres (par exemple 1445 ou 2018), ou choisis « Année inconnue ».'};
  }
  const year = Number(yearText);
  const yearSystem = classifyQadaaYear(year, now);
  if (!yearSystem) {
    return {ok: false, field: 'year', message: 'Cette année ne semble pas valide. Utilise une année hégirienne (ex. 1445) ou grégorienne (ex. 2018).'};
  }
  return {ok: true, value: {quantity, year, yearSystem, note}};
}

export const formatQadaaDayCount = (count: number): string => `${count} ${count === 1 ? 'jour' : 'jours'}`;

/** "Ramadan 1445 AH" / "Ramadan 2018" / "Ancien solde". */
export function formatQadaaManualTitle(entry: Pick<QadaaManualEntry, 'year' | 'yearSystem'>): string {
  if (entry.year === null) {return 'Ancien solde';}
  return entry.yearSystem === 'hijri' ? `Ramadan ${entry.year} AH` : `Ramadan ${entry.year}`;
}

export function formatQadaaManualSummary(entry: Pick<QadaaManualEntry, 'quantity'>): string {
  return `${formatQadaaDayCount(entry.quantity)} ajouté${entry.quantity === 1 ? '' : 's'} manuellement`;
}

/** Values to pre-fill the form when editing an existing manual entry. */
export function manualEntryToFormValues(entry: QadaaManualEntry): QadaaManualFormValues {
  return {
    quantityText: String(entry.quantity),
    knowsYear: entry.year !== null,
    yearText: entry.year !== null ? String(entry.year) : '',
    note: entry.note ?? '',
  };
}

export function formatQadaaCompletionTitle(entry: Pick<QadaaCompletionEntry, 'completedOn' | 'completedAt'>): string {
  const [year, month, day] = entry.completedOn.split('-').map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(entry.completedAt);
  return formatFullDate(date);
}

export function formatQadaaCompletionSummary(entry: Pick<QadaaCompletionEntry, 'quantity' | 'origin'>): string {
  const base = `${formatQadaaDayCount(entry.quantity)} rattrapé${entry.quantity === 1 ? '' : 's'}`;
  return entry.origin === 'MIGRATED' ? `${base} (suivi précédent)` : base;
}

/* ============================================================
 * "Add days" form helpers (stepper, dynamic CTA, Ramadan year list)
 * ========================================================== */

/** Next quantity text for the − / + buttons: never below 1, never above the cap; an empty or invalid text restarts from the minimum (1). */
export function stepQadaaQuantityText(current: string, delta: 1 | -1): string {
  const text = current.trim();
  const parsed = /^\d{1,4}$/.test(text) ? Number(text) : NaN;
  if (Number.isNaN(parsed)) {return '1';}
  return String(Math.min(QADAA_MAX_DAYS_PER_ENTRY, Math.max(1, parsed + delta)));
}

/** The number of days a quantity text stands for, or null when it is not (yet) a valid 1–999 integer. */
export function parseQadaaQuantityText(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,4}$/.test(trimmed)) {return null;}
  const value = Number(trimmed);
  return value >= 1 && value <= QADAA_MAX_DAYS_PER_ENTRY ? value : null;
}

/** "Ajouter 2 jours à rattraper" — updates with the quantity, correct singular / plural. */
export function formatQadaaSubmitLabel(quantityText: string, editing: boolean): string {
  if (editing) {return 'Enregistrer les modifications';}
  const quantity = parseQadaaQuantityText(quantityText);
  return quantity === null ? 'Ajouter des jours à rattraper' : `Ajouter ${formatQadaaDayCount(quantity)} à rattraper`;
}

export type QadaaRamadanYearOption = {
  /** The year stored in the ledger (a Hijri Ramadan year for generated options). */
  year: number;
  yearSystem: QadaaYearSystem;
  /** Gregorian year in which that Ramadan begins (null for a preserved legacy value). */
  gregorianYear: number | null;
  /** First day of that Ramadan (null for a preserved legacy value). */
  ramadanStart: Date | null;
  /** "2023 (1444 AH)". */
  label: string;
};

export const QADAA_YEAR_OPTIONS_COUNT = 50;

/**
 * The Ramadans a user can pick, most recent first: every Ramadan that has already
 * begun (the current one included while it is running), going back
 * QADAA_YEAR_OPTIONS_COUNT years. Both numbers of each label come from AWA's own
 * Hijri utilities (the ICU islamic calendar + the user's Hijri adjustment) — no
 * hard-coded mapping: the Ramadan start date is found by walking the calendar, its
 * Hijri year is read from hijriPartsFor(), and its Gregorian year is that date's.
 * Hijri Ramadans are 354 or 355 days apart, so the previous one is located from a
 * probe 354 days back and then verified to be a Ramadan day.
 *
 * `preserve` keeps an existing entry's stored year selectable even when it is not in
 * the generated list (e.g. an entry saved earlier with a Gregorian year), so editing
 * it never silently rewrites its year.
 */
export function buildQadaaRamadanYearOptions(
  today: Date = new Date(),
  preserve?: {year: number; yearSystem: QadaaYearSystem} | null,
  count: number = QADAA_YEAR_OPTIONS_COUNT,
): QadaaRamadanYearOption[] {
  const options: QadaaRamadanYearOption[] = [];

  // A Ramadan is the run of consecutive days for which isRamadan() is true — the
  // very rule the automatic Qadaa counting uses — so its "start" is the first day of
  // that run. (hijriMonthStart() is deliberately not used here: it stops at Hijri
  // day 1, which ICU's islamic calendar can skip at local midnight, and would then
  // return the previous month's start.)
  const runStart = (date: Date): Date => {
    let first = date;
    for (let guard = 0; guard < 40 && isRamadan(addDays(first, -1)); guard += 1) {
      first = addDays(first, -1);
    }
    return first;
  };

  let cursor = startOfDay(today);
  for (let guard = 0; guard < 400 && !isRamadan(cursor); guard += 1) {
    cursor = addDays(cursor, -1);
  }
  if (isRamadan(cursor)) {
    let start = runStart(cursor);
    for (let index = 0; index < count; index += 1) {
      const year = hijriPartsFor(start).year;
      const gregorianYear = start.getFullYear();
      options.push({year, yearSystem: 'hijri', gregorianYear, ramadanStart: start, label: `${gregorianYear} (${year} AH)`});

      // Two Ramadans are 354 or 355 days apart; the probes tolerate a one-day
      // difference in where ICU places the first day.
      const probe = [354, 355, 353, 356, 352].map(days => addDays(start, -days)).find(isRamadan);
      if (!probe) {break;}
      const previous = runStart(probe);
      if (hijriPartsFor(previous).year >= year) {break;}
      start = previous;
    }
  }

  if (preserve && !options.some(option => option.year === preserve.year && option.yearSystem === preserve.yearSystem)) {
    // The user's own stored value goes first, so it is what an edit shows selected.
    options.unshift({
      year: preserve.year,
      yearSystem: preserve.yearSystem,
      gregorianYear: null,
      ramadanStart: null,
      label: preserve.yearSystem === 'hijri' ? `${preserve.year} AH` : String(preserve.year),
    });
  }
  return options;
}
