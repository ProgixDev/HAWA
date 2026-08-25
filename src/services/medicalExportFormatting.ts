import type {DailyJournalEntry, FlowIntensity, MoodLevel} from '../types/journal';
import {formatFullDate} from '../utils/cycleMath';

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

const MOOD_LABELS: Record<MoodLevel, string> = {
  veryGood: 'Très bien',
  good: 'Bien',
  neutral: 'Neutre',
  stressed: 'Stressée',
  irritable: 'Irritable',
  anxious: 'Anxieuse',
  sad: 'Triste',
  tired: 'Fatiguée',
  motivated: 'Motivée',
};

const FLOW_LABELS: Record<FlowIntensity, string> = {
  none: 'Aucun',
  light: 'Léger',
  moderate: 'Modéré',
  heavy: 'Abondant',
  veryHeavy: 'Très abondant',
};

/** Filters real dailyJournalStore entries down to the selected lookback
 * window. `now` is an explicit parameter (never `new Date()` internally) so
 * this stays deterministic and testable. 'all' returns every entry
 * unfiltered, matching the pre-existing DataExportScreen behavior. */
export function filterEntriesByPeriod(
  entries: DailyJournalEntry[],
  period: ExportPeriod,
  now: Date,
): DailyJournalEntry[] {
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

function formatEnumOrRaw<T extends string>(value: T | undefined, labels: Record<T, string>): string | undefined {
  if (!value) {return undefined;}
  return labels[value] ?? value;
}

/** Turns one non-encrypted journal field into readable lines — never a raw
 * `JSON.stringify()` dump. Object-shaped fields become one "Champ : valeur"
 * line per populated sub-field (its own `note` sub-field included, since
 * that free-text note belongs to THIS category, not the separate top-level
 * "Notes privées" category). Returns an empty array when the day has nothing
 * recorded for this category — the caller drops it rather than showing an
 * empty section. */
export function formatCategoryValue(category: string, entry: DailyJournalEntry): string[] {
  switch (category) {
    case 'cycle':
      return entry.cycleDay !== undefined ? [`Jour du cycle : ${entry.cycleDay}`] : [];

    case 'flow': {
      const flow = entry.flow;
      if (!flow) {return [];}
      const lines: string[] = [];
      const intensity = formatEnumOrRaw(flow.intensity, FLOW_LABELS);
      if (intensity) {lines.push(`Flux : ${intensity}`);}
      if (flow.color) {lines.push(`Couleur : ${flow.color}`);}
      if (flow.clots) {lines.push(`Caillots : ${flow.clots}`);}
      if (flow.protections?.length) {lines.push(`Protections : ${flow.protections.join(', ')}`);}
      if (flow.periodStart) {lines.push('Début des règles');}
      if (flow.periodEnd) {lines.push('Fin des règles');}
      if (flow.pain) {lines.push(`Douleur : ${flow.pain}`);}
      if (flow.note) {lines.push(`Note : ${flow.note}`);}
      return lines;
    }

    case 'symptoms': {
      const symptoms = entry.symptoms;
      if (!symptoms || (!symptoms.names?.length && !symptoms.note)) {return [];}
      const lines: string[] = [];
      if (symptoms.names?.length) {lines.push(`Symptômes : ${symptoms.names.join(', ')}`);}
      if (symptoms.severity) {lines.push(`Intensité : ${symptoms.severity}`);}
      if (symptoms.painLocation) {lines.push(`Localisation : ${symptoms.painLocation}`);}
      if (symptoms.note) {lines.push(`Note : ${symptoms.note}`);}
      return lines;
    }

    case 'mood': {
      const mood = entry.mood;
      if (!mood) {return [];}
      const lines: string[] = [];
      const level = formatEnumOrRaw(mood.level, MOOD_LABELS);
      if (level) {lines.push(`Humeur : ${level}`);}
      if (mood.energy !== undefined) {lines.push(`Énergie : ${mood.energy}/5`);}
      if (mood.stress !== undefined) {lines.push(`Stress : ${mood.stress}/5`);}
      if (mood.irritability !== undefined) {lines.push(`Irritabilité : ${mood.irritability}/5`);}
      if (mood.motivation !== undefined) {lines.push(`Motivation : ${mood.motivation}/5`);}
      if (mood.note) {lines.push(`Note : ${mood.note}`);}
      return lines;
    }

    case 'sleep': {
      const sleep = entry.sleep;
      if (!sleep) {return [];}
      const lines: string[] = [];
      if (sleep.bedtime) {lines.push(`Coucher : ${sleep.bedtime}`);}
      if (sleep.wakeTime) {lines.push(`Réveil : ${sleep.wakeTime}`);}
      if (sleep.duration) {lines.push(`Durée : ${sleep.duration}`);}
      if (sleep.quality) {lines.push(`Qualité : ${sleep.quality}`);}
      if (sleep.awakenings !== undefined) {lines.push(`Réveils nocturnes : ${sleep.awakenings}`);}
      if (sleep.wakeFeeling) {lines.push(`Ressenti au réveil : ${sleep.wakeFeeling}`);}
      if (sleep.note) {lines.push(`Note : ${sleep.note}`);}
      return lines;
    }

    case 'activity': {
      const activity = entry.activity;
      if (!activity || activity.none) {return activity?.none ? ['Aucune activité'] : [];}
      const lines: string[] = [];
      if (activity.type) {lines.push(`Type : ${activity.type}`);}
      if (activity.durationMinutes !== undefined) {lines.push(`Durée : ${activity.durationMinutes} min`);}
      if (activity.intensity) {lines.push(`Intensité : ${activity.intensity}`);}
      if (activity.feeling) {lines.push(`Ressenti : ${activity.feeling}`);}
      if (activity.note) {lines.push(`Note : ${activity.note}`);}
      return lines;
    }

    case 'hydration': {
      const hydration = entry.hydration;
      if (!hydration) {return [];}
      const lines: string[] = [`Eau bue : ${hydration.milliliters} ml`];
      if (hydration.glasses !== undefined) {lines.push(`Verres : ${hydration.glasses}`);}
      return lines;
    }

    case 'temperature': {
      const temperature = entry.temperature;
      if (!temperature) {return [];}
      const lines: string[] = [`Température : ${temperature.value}°${temperature.unit}`];
      if (temperature.time) {lines.push(`Heure de prise : ${temperature.time}`);}
      if (temperature.method) {lines.push(`Méthode : ${temperature.method}`);}
      if (temperature.note) {lines.push(`Note : ${temperature.note}`);}
      return lines;
    }

    case 'weight': {
      const weight = entry.weight;
      if (!weight?.value) {return [];}
      const lines: string[] = [`Poids : ${weight.value} ${weight.unit}`];
      if (weight.moment) {lines.push(`Moment : ${weight.moment}`);}
      if (weight.note) {lines.push(`Note : ${weight.note}`);}
      return lines;
    }

    case 'cervicalMucus': {
      const cervicalMucus = entry.cervicalMucus;
      if (!cervicalMucus) {return [];}
      const lines: string[] = [`Glaire cervicale : ${cervicalMucus.type}`];
      if (cervicalMucus.note) {lines.push(`Note : ${cervicalMucus.note}`);}
      return lines;
    }

    case 'lhTest': {
      const lhTest = entry.lhTest;
      if (!lhTest) {return [];}
      const resultLabel = lhTest.result === 'positive' ? 'Positif' : lhTest.result === 'negative' ? 'Négatif' : 'Non valide';
      const lines: string[] = [`Test d’ovulation (LH) : ${resultLabel}`];
      if (lhTest.time) {lines.push(`Heure : ${lhTest.time}`);}
      if (lhTest.note) {lines.push(`Note : ${lhTest.note}`);}
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
  const rows = [['date', 'categorie', 'valeur'].join(CSV_DELIMITER)];
  notices.forEach(notice => {
    rows.push(['', escapeCsvField('Estimation'), escapeCsvField(notice)].join(CSV_DELIMITER));
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
