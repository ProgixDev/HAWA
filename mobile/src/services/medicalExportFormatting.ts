import type {
  CervicalMucusType,
  DailyJournalEntry,
  FlowIntensity,
  MoodLevel,
  SymptomSeverity,
} from '../types/journal';
import {formatFullDate} from '../utils/cycleMath';
import i18n from '../i18n';

// Pure data-shaping/serialization logic for the Medical Export feature
// (DataExportScreen). Deliberately free of any native import (no
// react-native-fs, no react-native-share, no Keychain-backed decryption) so
// this file stays trivially unit-testable in Jest without native mocking —
// see medicalExportOrchestrator.ts for the async glue that decrypts
// note/intimacy sections and calls into this module with plain data.

export type ExportPeriod = 'all' | '3m' | '6m' | '12m';

/** One category's human-readable lines for one day — never the raw
 * JSON-serialized field. Empty `lines` means "this category was selected but
 * has no recorded value for this day," and the caller must drop it rather
 * than render an empty section. */
export type ExportCategoryValue = {
  category: string;
  label: string;
  lines: string[];
};

export type ExportDayEntry = {
  date: string;
  categories: ExportCategoryValue[];
};

export type ExportReportModel = {
  objectiveLabel: string;
  periodLabel: string;
  generatedAtLabel: string;
  /** Freeform, clearly-labeled-as-such lines shown right under the period —
   * e.g. TTC's estimated ovulation day/fertile window. Every line must
   * already spell out "(estimation)"/"estimée" itself; this model never
   * presents a prediction as a confirmed fact. Empty for objectives with no
   * predicted values (Postpartum, Menopause, Contraception, etc.). */
  notices: string[];
  totalDays: number;
  categoryCounts: {label: string; count: number}[];
  days: {date: string; dateLabel: string; categories: {label: string; lines: string[]}[]}[];
};

// i18n (Phase 6): this is a plain data-shaping file, not a component, so it
// cannot call `useTranslation()`. Every label map below is built with the
// i18n singleton (same pattern as menopauseJournalConfig.ts's own
// MENOPAUSE_MOOD_LABELS etc.) and kept as a plain `Record<Enum, string>`,
// refreshed IN PLACE on `languageChanged` via `Object.assign()` — so every
// existing call site (`MOOD_LABELS[mood]`, `formatEnumOrRaw(value, LABELS)`)
// keeps working unchanged; only the object's own values are ever replaced.

function buildMoodLabels(): Record<MoodLevel, string> {
  return {
    veryGood: i18n.t('export.enums.mood.veryGood'),
    good: i18n.t('export.enums.mood.good'),
    neutral: i18n.t('export.enums.mood.neutral'),
    stressed: i18n.t('export.enums.mood.stressed'),
    irritable: i18n.t('export.enums.mood.irritable'),
    anxious: i18n.t('export.enums.mood.anxious'),
    sad: i18n.t('export.enums.mood.sad'),
    tired: i18n.t('export.enums.mood.tired'),
    motivated: i18n.t('export.enums.mood.motivated'),
  };
}
const MOOD_LABELS: Record<MoodLevel, string> = buildMoodLabels();
i18n.on('languageChanged', () => Object.assign(MOOD_LABELS, buildMoodLabels()));

function buildFlowLabels(): Record<FlowIntensity, string> {
  return {
    none: i18n.t('export.enums.flow.none'),
    light: i18n.t('export.enums.flow.light'),
    moderate: i18n.t('export.enums.flow.moderate'),
    heavy: i18n.t('export.enums.flow.heavy'),
    veryHeavy: i18n.t('export.enums.flow.veryHeavy'),
  };
}
const FLOW_LABELS: Record<FlowIntensity, string> = buildFlowLabels();
i18n.on('languageChanged', () => Object.assign(FLOW_LABELS, buildFlowLabels()));

// 'severe' is what the symptom screen persists for BOTH its "Forte" and "Très
// forte" choices (see INTENSITIES in JournalSymptomsScreen.tsx) — the stored
// value cannot tell them apart, so the export says exactly that instead of
// guessing one.
function buildSeverityLabels(): Record<SymptomSeverity, string> {
  return {
    mild: i18n.t('export.enums.severity.mild'),
    moderate: i18n.t('export.enums.severity.moderate'),
    severe: i18n.t('export.enums.severity.severe'),
  };
}
const SEVERITY_LABELS: Record<SymptomSeverity, string> = buildSeverityLabels();
i18n.on('languageChanged', () => Object.assign(SEVERITY_LABELS, buildSeverityLabels()));

// Same wording the TTC Calendar/Statistics show for each cervical-mucus type.
function buildCervicalMucusLabels(): Record<CervicalMucusType, string> {
  return {
    dry: i18n.t('export.enums.cervicalMucus.dry'),
    sticky: i18n.t('export.enums.cervicalMucus.sticky'),
    creamy: i18n.t('export.enums.cervicalMucus.creamy'),
    watery: i18n.t('export.enums.cervicalMucus.watery'),
    eggWhite: i18n.t('export.enums.cervicalMucus.eggWhite'),
  };
}
const CERVICAL_MUCUS_LABELS: Record<CervicalMucusType, string> = buildCervicalMucusLabels();
i18n.on('languageChanged', () => Object.assign(CERVICAL_MUCUS_LABELS, buildCervicalMucusLabels()));

// Same wording as the "Protection utilisée ?" choices of the intimacy screens.
function buildProtectionLabels(): Record<'yes' | 'no' | 'unknown', string> {
  return {
    yes: i18n.t('export.enums.protection.yes'),
    no: i18n.t('export.enums.protection.no'),
    unknown: i18n.t('export.enums.protection.unknown'),
  };
}
const PROTECTION_LABELS: Record<'yes' | 'no' | 'unknown', string> = buildProtectionLabels();
i18n.on('languageChanged', () => Object.assign(PROTECTION_LABELS, buildProtectionLabels()));

/** Filters real dailyJournalStore entries down to the selected lookback
 * window. `now` is an explicit parameter (never `new Date()` internally) so
 * this stays deterministic and testable. 'all' returns every entry
 * unfiltered, matching the pre-existing DataExportScreen behavior. */
export function filterEntriesByPeriod<T extends {date: string}>(
  entries: T[],
  period: ExportPeriod,
  now: Date,
): T[] {
  if (period === 'all') {return entries;}
  const months = Number(period.replace('m', ''));
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return entries.filter(entry => new Date(`${entry.date}T12:00:00`) >= cutoff);
}

/** 'YYYY-MM-DD' local date-key convention (see CLAUDE.md) — used for
 * filenames, never `toISOString()` (UTC-based, can shift near midnight). */
export function toDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

/** The two dates that belong in the exported filename. For a fixed lookback
 * window, `from` is the real cutoff date. For 'all', `from` is the earliest
 * date actually present in `entries` (falling back to `now` if there is no
 * data at all) — always a real, meaningful pair of dates, never a
 * placeholder string. */
export function computeExportFilenameDates(
  entries: readonly {date: string}[],
  period: ExportPeriod,
  now: Date,
): {fromKey: string; toKey: string} {
  const toKey = toDateKey(now);
  if (period !== 'all') {
    const months = Number(period.replace('m', ''));
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - months);
    return {fromKey: toDateKey(cutoff), toKey};
  }
  const sortedDates = entries.map(entry => entry.date).sort();
  return {fromKey: sortedDates[0] ?? toKey, toKey};
}

/** French label of a shared flow intensity ('light' -> 'Léger'). Raw value if
 * unknown. Exposed so dedicated readers (SOPK) print the same wording as the
 * generic 'flow' category. */
export function formatFlowIntensityLabel(intensity: FlowIntensity): string {
  return FLOW_LABELS[intensity] ?? intensity;
}

/** Human-readable label for an internal enum value, using a label map that
 * already exists in the app. An UNKNOWN value (never seen before, legacy, or
 * corrupted) falls back to the raw stored value unchanged — never an invented
 * translation, never "undefined". Own-property lookup so a value such as
 * "constructor" can never resolve to an inherited function. */
export function formatEnumOrRaw(
  value: string | undefined,
  labels: Readonly<Record<string, string>>,
): string | undefined {
  if (!value) {return undefined;}
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value;
}

/** Label of the intimacy "protection" answer ('yes' | 'no' | 'unknown'). */
export function formatProtectionLabel(protection: string): string {
  return formatEnumOrRaw(protection, PROTECTION_LABELS) ?? protection;
}

// Daily-journal sections whose free-text `note` is encrypted at rest
// (dailyJournalStore.ts encrypts EVERY `<section>.note`), with the label each
// note is filed under in the sensitive "notes" category.
function buildSectionNoteLabels(): Record<
  'symptoms' | 'mood' | 'flow' | 'sleep' | 'activity' | 'temperature' | 'weight' | 'cervicalMucus' | 'lhTest',
  string
> {
  return {
    symptoms: i18n.t('export.sectionNotes.symptoms'),
    mood: i18n.t('export.sectionNotes.mood'),
    flow: i18n.t('export.sectionNotes.flow'),
    sleep: i18n.t('export.sectionNotes.sleep'),
    activity: i18n.t('export.sectionNotes.activity'),
    temperature: i18n.t('export.sectionNotes.temperature'),
    weight: i18n.t('export.sectionNotes.weight'),
    cervicalMucus: i18n.t('export.sectionNotes.cervicalMucus'),
    lhTest: i18n.t('export.sectionNotes.lhTest'),
  };
}
const SECTION_NOTE_LABELS = buildSectionNoteLabels();
i18n.on('languageChanged', () => Object.assign(SECTION_NOTE_LABELS, buildSectionNoteLabels()));

type NoteSection = keyof typeof SECTION_NOTE_LABELS;

/** One "Section : note" line per requested daily-journal section that carries
 * a free-text note. These notes are ENCRYPTED at rest, so they belong to the
 * sensitive "notes" export category (explicit opt-in + private unlock) — never
 * inside the plain symptoms / mood / flow / sleep... categories, whose
 * default-on selection would otherwise export decrypted free text under a
 * non-sensitive label. `sections` is filtered to the ones the caller's
 * objective actually offers, in the order given. */
export function formatSectionNoteLines(entry: DailyJournalEntry, sections: readonly string[]): string[] {
  const lines: string[] = [];
  sections.forEach(section => {
    if (!(section in SECTION_NOTE_LABELS)) {return;}
    const note = (entry[section as NoteSection] as {note?: string} | undefined)?.note;
    if (note) {lines.push(`${SECTION_NOTE_LABELS[section as NoteSection]} : ${note}`);}
  });
  return lines;
}

/** Turns one non-encrypted journal field into readable lines — never a raw
 * `JSON.stringify()` dump. Object-shaped fields become one "Champ : valeur"
 * line per populated sub-field. The per-section free-text `note` sub-field is
 * deliberately NOT emitted here: it is encrypted at rest, so it is exported
 * only through formatSectionNoteLines() under the sensitive "notes" category.
 * Returns an empty array when the day has nothing recorded for this category —
 * the caller drops it rather than showing an empty section. */
export function formatCategoryValue(category: string, entry: DailyJournalEntry): string[] {
  switch (category) {
    case 'cycle':
      return entry.cycleDay !== undefined ? [`${i18n.t('export.fields.cycleDay')} : ${entry.cycleDay}`] : [];

    case 'flow': {
      const flow = entry.flow;
      if (!flow) {return [];}
      const lines: string[] = [];
      const intensity = formatEnumOrRaw(flow.intensity, FLOW_LABELS);
      if (intensity) {lines.push(`${i18n.t('export.fields.flow')} : ${intensity}`);}
      if (flow.color) {lines.push(`${i18n.t('export.fields.color')} : ${flow.color}`);}
      if (flow.clots) {lines.push(`${i18n.t('export.fields.clots')} : ${flow.clots}`);}
      if (flow.protections?.length) {lines.push(`${i18n.t('export.fields.protections')} : ${flow.protections.join(', ')}`);}
      if (flow.periodStart) {lines.push(i18n.t('export.fields.periodStart'));}
      if (flow.periodEnd) {lines.push(i18n.t('export.fields.periodEnd'));}
      if (flow.pain) {lines.push(`${i18n.t('export.fields.pain')} : ${flow.pain}`);}
      return lines;
    }

    case 'symptoms': {
      const symptoms = entry.symptoms;
      if (!symptoms?.names?.length) {return [];}
      const lines: string[] = [];
      lines.push(`${i18n.t('export.fields.symptoms')} : ${symptoms.names.join(', ')}`);
      const severity = formatEnumOrRaw(symptoms.severity, SEVERITY_LABELS);
      if (severity) {lines.push(`${i18n.t('export.fields.intensity')} : ${severity}`);}
      if (symptoms.painLocation) {lines.push(`${i18n.t('export.fields.location')} : ${symptoms.painLocation}`);}
      return lines;
    }

    case 'mood': {
      const mood = entry.mood;
      if (!mood) {return [];}
      const lines: string[] = [];
      const level = formatEnumOrRaw(mood.level, MOOD_LABELS);
      if (level) {lines.push(`${i18n.t('export.fields.mood')} : ${level}`);}
      if (mood.energy !== undefined) {lines.push(`${i18n.t('export.fields.energy')} : ${mood.energy}/5`);}
      if (mood.stress !== undefined) {lines.push(`${i18n.t('export.fields.stress')} : ${mood.stress}/5`);}
      if (mood.irritability !== undefined) {lines.push(`${i18n.t('export.fields.irritability')} : ${mood.irritability}/5`);}
      if (mood.motivation !== undefined) {lines.push(`${i18n.t('export.fields.motivation')} : ${mood.motivation}/5`);}
      return lines;
    }

    case 'sleep': {
      const sleep = entry.sleep;
      if (!sleep) {return [];}
      const lines: string[] = [];
      if (sleep.bedtime) {lines.push(`${i18n.t('export.fields.bedtime')} : ${sleep.bedtime}`);}
      if (sleep.wakeTime) {lines.push(`${i18n.t('export.fields.wakeTime')} : ${sleep.wakeTime}`);}
      if (sleep.duration) {lines.push(`${i18n.t('export.fields.duration')} : ${sleep.duration}`);}
      if (sleep.quality) {lines.push(`${i18n.t('export.fields.quality')} : ${sleep.quality}`);}
      if (sleep.awakenings !== undefined) {lines.push(`${i18n.t('export.fields.nightWakenings')} : ${sleep.awakenings}`);}
      if (sleep.wakeFeeling) {lines.push(`${i18n.t('export.fields.wakeFeeling')} : ${sleep.wakeFeeling}`);}
      return lines;
    }

    case 'activity': {
      const activity = entry.activity;
      if (!activity || activity.none) {return activity?.none ? [i18n.t('export.fields.noActivity')] : [];}
      const lines: string[] = [];
      if (activity.type) {lines.push(`${i18n.t('export.fields.type')} : ${activity.type}`);}
      if (activity.durationMinutes !== undefined) {lines.push(`${i18n.t('export.fields.duration')} : ${activity.durationMinutes} min`);}
      if (activity.intensity) {lines.push(`${i18n.t('export.fields.intensity')} : ${activity.intensity}`);}
      if (activity.feeling) {lines.push(`${i18n.t('export.fields.feeling')} : ${activity.feeling}`);}
      return lines;
    }

    case 'hydration': {
      const hydration = entry.hydration;
      if (!hydration) {return [];}
      const lines: string[] = [`${i18n.t('export.fields.waterDrunk')} : ${hydration.milliliters} ml`];
      if (hydration.glasses !== undefined) {lines.push(`${i18n.t('export.fields.glasses')} : ${hydration.glasses}`);}
      return lines;
    }

    case 'temperature': {
      const temperature = entry.temperature;
      if (!temperature) {return [];}
      const lines: string[] = [`${i18n.t('export.fields.temperature')} : ${temperature.value}°${temperature.unit}`];
      if (temperature.time) {lines.push(`${i18n.t('export.fields.measurementTime')} : ${temperature.time}`);}
      if (temperature.method) {lines.push(`${i18n.t('export.fields.method')} : ${temperature.method}`);}
      return lines;
    }

    case 'weight': {
      const weight = entry.weight;
      if (!weight?.value) {return [];}
      const lines: string[] = [`${i18n.t('export.fields.weight')} : ${weight.value} ${weight.unit}`];
      if (weight.moment) {lines.push(`${i18n.t('export.fields.moment')} : ${weight.moment}`);}
      return lines;
    }

    case 'cervicalMucus': {
      const cervicalMucus = entry.cervicalMucus;
      if (!cervicalMucus) {return [];}
      return [`${i18n.t('export.fields.cervicalMucus')} : ${formatEnumOrRaw(cervicalMucus.type, CERVICAL_MUCUS_LABELS) ?? cervicalMucus.type}`];
    }

    case 'lhTest': {
      const lhTest = entry.lhTest;
      if (!lhTest) {return [];}
      const resultLabel = lhTest.result === 'positive'
        ? i18n.t('export.enums.lhResult.positive')
        : lhTest.result === 'negative'
          ? i18n.t('export.enums.lhResult.negative')
          : i18n.t('export.enums.lhResult.invalid');
      const lines: string[] = [`${i18n.t('export.fields.lhTest')} : ${resultLabel}`];
      if (lhTest.time) {lines.push(`${i18n.t('export.fields.time')} : ${lhTest.time}`);}
      return lines;
    }

    default:
      return [];
  }
}

/** Escapes one CSV field per RFC 4180: wraps in double quotes and doubles any
 * internal quote whenever the value contains a comma, a semicolon, a double
 * quote, or a line break (CR or LF) — so multiline notes and values
 * containing the delimiter can never corrupt the row structure. */
export function escapeCsvField(value: string): string {
  if (/[",;\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ';' — not ',' — because French-locale Excel (the app's whole audience)
// treats ',' as the decimal separator and uses ';' as its default CSV list
// separator; opening a comma-delimited file directly (double-click) in
// French Excel puts every value into a single column regardless of encoding.
// escapeCsvField() already quotes any value containing ';' (see its own
// trigger regex), so switching the delimiter needed no escaping change.
const CSV_DELIMITER = ';';

/** Builds the export CSV — one row per (date, category, valeur), preserving
 * the pre-existing long/tall row shape, but with real escaping and
 * human-readable values instead of a raw, doubly-escaped JSON dump. Only
 * ever receives days/categories that were ALREADY filtered by the caller to
 * the user's selected period and categories — this function has no
 * filtering logic of its own and cannot silently include anything more.
 * `notices` (e.g. TTC's estimated ovulation/fertile window) are emitted as
 * their own rows with an empty date and the fixed category "Estimation" —
 * each notice string must already spell out that it is an estimate. */
export function buildExportCsv(days: ExportDayEntry[], notices: string[] = []): string {
  const rows = [[
    i18n.t('export.csv.headerDate'),
    i18n.t('export.csv.headerCategory'),
    i18n.t('export.csv.headerValue'),
  ].join(CSV_DELIMITER)];
  notices.forEach(notice => {
    rows.push(['', escapeCsvField(i18n.t('export.csv.estimationLabel')), escapeCsvField(notice)].join(CSV_DELIMITER));
  });
  days.forEach(day => {
    day.categories.forEach(categoryValue => {
      if (!categoryValue.lines.length) {return;}
      const value = categoryValue.lines.join(' ; ');
      rows.push(
        [escapeCsvField(day.date), escapeCsvField(categoryValue.label), escapeCsvField(value)].join(CSV_DELIMITER),
      );
    });
  });
  return rows.join('\r\n');
}

/** Builds the plain-data model consumed by the PDF generator (and directly
 * unit-testable without touching pdf-lib). `days` must already be sorted
 * chronologically and contain only the user's selected categories — this
 * function never re-derives either. */
export function buildExportReportModel(
  days: ExportDayEntry[],
  objectiveLabel: string,
  periodLabel: string,
  generatedAtLabel: string,
  notices: string[] = [],
): ExportReportModel {
  const daysWithData = days.filter(day => day.categories.some(category => category.lines.length > 0));

  const countsByLabel = new Map<string, number>();
  daysWithData.forEach(day => {
    day.categories.forEach(category => {
      if (!category.lines.length) {return;}
      countsByLabel.set(category.label, (countsByLabel.get(category.label) ?? 0) + 1);
    });
  });

  return {
    objectiveLabel,
    periodLabel,
    generatedAtLabel,
    notices,
    totalDays: daysWithData.length,
    categoryCounts: Array.from(countsByLabel.entries()).map(([label, count]) => ({label, count})),
    days: daysWithData.map(day => ({
      date: day.date,
      dateLabel: formatFullDate(new Date(`${day.date}T12:00:00`)),
      categories: day.categories
        .filter(category => category.lines.length > 0)
        .map(category => ({label: category.label, lines: category.lines})),
    })),
  };
}
