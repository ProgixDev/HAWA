import type {DailyJournalEntry} from '../types/journal';
import {getAllJournalEntries} from '../state/dailyJournalStore';
import {resolveNoteSection} from './privateNotesEncryption';
import {resolveIntimacySection} from './privateJournalEncryption';
import {
  formatCategoryValue,
  formatEnumOrRaw,
  formatFlowIntensityLabel,
  formatProtectionLabel,
  formatSectionNoteLines,
  filterEntriesByPeriod,
  type ExportCategoryValue,
  type ExportDayEntry,
  type ExportPeriod,
} from './medicalExportFormatting';

import {
  getCyclePreferences,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
} from '../state/onboardingPreferences';
import {getConfirmedPeriodHistory, hydrateConfirmedPeriodHistory} from '../state/confirmedPeriodHistoryStore';
import {upcomingFertileWindow, formatFullDate} from '../utils/cycleMath';

import {getPregnancyJournalState, type PregnancyMedicalEntry} from '../state/pregnancyJournalStore';
import {getPregnancyMedicalEvents} from '../state/pregnancyMedicalEventsStore';
import {getPregnancyDating, hydratePregnancyDating} from '../state/pregnancyPreferences';
import {computePregnancyStatus} from '../utils/pregnancyTrackingUtils';

import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
} from '../state/contraceptionPreferences';
import {
  getAllContraceptionIntakeRecords,
  hydrateContraceptionIntakeHistory,
} from '../state/contraceptionIntakeHistoryStore';
import {getAllContraceptionEvents, hydrateContraceptionEvents} from '../state/contraceptionEventStore';
import {hydrateContraceptionJournal} from '../state/contraceptionJournalStore';

import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
} from '../state/postpartumJournalStore';
import {getAllPostpartumLochiaEntries, hydratePostpartumLochia} from '../state/postpartumLochiaStore';

import {
  getAllMiscarriageJournalEntries,
  hydrateMiscarriageJournal,
} from '../state/miscarriageJournalStore';

import {
  getAllMenopauseJournalEntries,
  getMenopauseLabResults,
  hydrateMenopauseJournal,
} from '../state/menopauseJournalStore';
import {
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_INTENSITY_LABELS,
  MENOPAUSE_LAB_TYPE_LABELS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_SLEEP_QUALITY_LABELS,
  MENOPAUSE_SYMPTOM_OPTIONS,
  MENOPAUSE_TREATMENT_STATUS_LABELS,
} from '../config/menopauseJournalConfig';

import {getAllIrregularJournalEntries, hydrateIrregularJournal} from '../state/irregularJournalStore';
import {classifyIrregularPeriodDay, getIrregularFatigueSymptoms} from '../utils/irregularJournalSelectors';
import i18n from '../i18n';

// i18n (Phase 6): a plain data-reading file, not a component, so it cannot
// call `useTranslation()`. Every fixed category/field label below is built
// with the i18n singleton and kept as a plain `Record<string, string>`,
// refreshed IN PLACE on `languageChanged` (same pattern as
// menopauseJournalConfig.ts / medicalExportFormatting.ts) — every call site
// below (`CYCLE_CATEGORY_LABELS.periods`, `labels[category]`, etc.) keeps
// working unchanged. User-generated values (a free-text note, an entered
// symptom name, a decrypted journal answer) are NEVER touched by this file —
// only the FIXED label text around them is translated.

// One reader per objective — the ONLY place that reads each objective's real
// canonical store(s) for the Medical Export feature. Every reader returns
// the SAME plain {days, notices} shape so medicalExportOrchestrator.ts / the
// CSV+PDF builders in medicalExportFormatting.ts stay fully objective-
// agnostic. A reader only ever reads the stores that objective actually
// displays on its own Dashboard/Calendar/Statistics (see
// objectiveExportConfig.ts's per-objective comment trail) — never another
// objective's store, so cross-objective leakage is structurally impossible:
// there is no shared "give me everything" function, only these narrow
// ones, each hand-written against one objective's real data.

export type ObjectiveExportData = {days: ExportDayEntry[]; notices: string[]};

function sortByDate(days: ExportDayEntry[]): ExportDayEntry[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

/* ============================================================
 * CYCLE — shared dailyJournalStore
 * ============================================================ */

// Exactly the categories objectiveExportConfig.ts offers for 'cycle' — the
// ones Cycle can really record. 'periods' comes from the period histories,
// the rest from the shared dailyJournalStore. (No temperature / weight /
// journal cycleDay: Cycle has no writer for them.)
function buildCycleCategoryLabels(): Record<string, string> {
  return {
    periods: i18n.t('export.data.cycle.categories.periods'),
    flow: i18n.t('export.data.cycle.categories.flow'),
    symptoms: i18n.t('export.data.cycle.categories.symptoms'),
    mood: i18n.t('export.data.cycle.categories.mood'),
    sleep: i18n.t('export.data.cycle.categories.sleep'),
    activity: i18n.t('export.data.cycle.categories.activity'),
    hydration: i18n.t('export.data.cycle.categories.hydration'),
    notes: i18n.t('export.data.cycle.categories.notes'),
    intimacy: i18n.t('export.data.cycle.categories.intimacy'),
  };
}
const CYCLE_CATEGORY_LABELS: Record<string, string> = buildCycleCategoryLabels();
i18n.on('languageChanged', () => Object.assign(CYCLE_CATEGORY_LABELS, buildCycleCategoryLabels()));

async function buildDailyJournalCategories(
  entry: DailyJournalEntry,
  selectedCategories: string[],
  labels: Record<string, string>,
): Promise<ExportCategoryValue[]> {
  return Promise.all(
    selectedCategories.map(async (category): Promise<ExportCategoryValue> => {
      const label = labels[category] ?? category;

      if (category === 'notes') {
        const {data} = await resolveNoteSection(entry);
        // The day's "Notes personnelles" text, then every per-section free-text
        // note (symptoms / mood / flow / sleep / activity / temperature ...) of
        // the sections THIS objective offers — all of them encrypted at rest, so
        // all of them live under this sensitive category (M43), never inside the
        // plain symptoms / mood / ... categories.
        const sectionNotes = formatSectionNoteLines(entry, Object.keys(labels));
        return {category, label, lines: [...(data?.text ? [data.text] : []), ...sectionNotes]};
      }

      if (category === 'intimacy') {
        const {data} = await resolveIntimacySection(entry);
        if (!data) {return {category, label, lines: []};}
        const lines: string[] = [];
        const answerLabel = data.answer === 'yes'
          ? i18n.t('export.data.yes')
          : data.answer === 'no'
            ? i18n.t('export.data.no')
            : i18n.t('export.data.preferNotToSay');
        lines.push(`${i18n.t('export.data.intimacy.intercourse')} : ${answerLabel}`);
        if (data.time) {lines.push(`${i18n.t('export.fields.time')} : ${data.time}`);}
        if (data.protection) {lines.push(`${i18n.t('export.data.intimacy.protection')} : ${formatProtectionLabel(data.protection)}`);}
        if (data.libido) {lines.push(`${i18n.t('export.data.intimacy.libido')} : ${data.libido}`);}
        if (data.discomfort) {lines.push(`${i18n.t('export.data.intimacy.discomfort')} : ${data.discomfort}`);}
        if (data.note) {lines.push(`${i18n.t('export.data.note')} : ${data.note}`);}
        return {category, label, lines};
      }

      return {category, label, lines: formatCategoryValue(category, entry)};
    }),
  );
}

export type CyclePeriodExportRecord = {
  /** Local 'YYYY-MM-DD' start of the recorded period (the export day it is filed under). */
  startDate: string;
  /** Local 'YYYY-MM-DD' end the user CONFIRMED ("Mes règles sont terminées",
   * Calendar / Cycle-information edit) — null when no end was ever confirmed. */
  confirmedEndDate: string | null;
  /** The end stored in the recorded period history when it is NOT confirmed
   * (derived from the configured period length / still running) — reported as
   * an estimate, never as a fact. Null when a confirmed end exists. */
  estimatedEndDate: string | null;
};

const localDateKey = (date: Date): string => date.toLocaleDateString('en-CA');

/** Merges the two real period sources — read-only, nothing is derived:
 * the recorded period history (start of each period the user recorded) and
 * the confirmed-end history (start + the end the user confirmed). A confirmed
 * end always wins; a recorded period without one keeps its stored end only as
 * an explicitly-labelled estimate. A confirmed occurrence with no recorded
 * counterpart is still exported. */
export function buildCyclePeriodRecords(
  recorded: readonly {startDate: string; endDate: string}[],
  confirmed: readonly {id: string; periodEndDateTime: string}[],
): CyclePeriodExportRecord[] {
  const confirmedEndByStart = new Map<string, string>();
  confirmed.forEach(occurrence => {
    const end = new Date(occurrence.periodEndDateTime);
    if (!Number.isNaN(end.getTime())) {
      confirmedEndByStart.set(occurrence.id, localDateKey(end));
    }
  });

  const byStart = new Map<string, CyclePeriodExportRecord>();
  recorded.forEach(record => {
    const confirmedEndDate = confirmedEndByStart.get(record.startDate) ?? null;
    byStart.set(record.startDate, {
      startDate: record.startDate,
      confirmedEndDate,
      estimatedEndDate: !confirmedEndDate && record.endDate >= record.startDate ? record.endDate : null,
    });
  });
  confirmedEndByStart.forEach((confirmedEndDate, startDate) => {
    if (!byStart.has(startDate)) {
      byStart.set(startDate, {startDate, confirmedEndDate, estimatedEndDate: null});
    }
  });
  return Array.from(byStart.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function formatCyclePeriodLines(record: CyclePeriodExportRecord): string[] {
  const lines = [i18n.t('export.data.cycle.periodStart')];
  if (record.confirmedEndDate) {
    lines.push(`${i18n.t('export.data.cycle.periodConfirmedEnd')} : ${formatFullDate(new Date(`${record.confirmedEndDate}T12:00:00`))}`);
  } else {
    lines.push(i18n.t('export.data.cycle.periodUnconfirmedEnd'));
    if (record.estimatedEndDate) {
      lines.push(
        `${i18n.t('export.data.cycle.periodEstimatedEnd')} : ${formatFullDate(new Date(`${record.estimatedEndDate}T12:00:00`))}`,
      );
    }
  }
  return lines;
}

/** 'cycle' = the period dates (recorded + confirmed histories) plus the
 * shared dailyJournalStore categories Cycle's journal can save. ('irregular'
 * / SOPK has its own dedicated reader below — buildIrregularExportDays.) A
 * category Cycle cannot record (e.g. a stale 'weight' / 'temperature'
 * selection) is ignored, never read. */
export async function buildCycleExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  const categories = selectedCategories.filter(category => category in CYCLE_CATEGORY_LABELS);
  const journalCategories = categories.filter(category => category !== 'periods');

  const allEntries = await getAllJournalEntries();
  const filtered = filterEntriesByPeriod(allEntries, period, now);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const journalDays = await Promise.all(
    sorted.map(async entry => ({
      date: entry.date,
      categories: await buildDailyJournalCategories(entry, journalCategories, CYCLE_CATEGORY_LABELS),
    })),
  );

  if (!categories.includes('periods')) {
    return {days: journalDays, notices: []};
  }

  await Promise.all([hydrateCyclePreferences(), hydrateConfirmedPeriodHistory()]);
  const periodRecords = filterEntriesByPeriod(
    buildCyclePeriodRecords(getRecordedPeriodHistory(), getConfirmedPeriodHistory()).map(record => ({
      ...record,
      date: record.startDate,
    })),
    period,
    now,
  );

  // The period entry leads its day (config order), then that day's journal
  // categories; a period start with no journal entry still gets its own day.
  const daysByDate = new Map<string, ExportDayEntry>(journalDays.map(day => [day.date, day]));
  periodRecords.forEach(record => {
    const periodCategory: ExportCategoryValue = {
      category: 'periods',
      label: CYCLE_CATEGORY_LABELS.periods,
      lines: formatCyclePeriodLines(record),
    };
    const existing = daysByDate.get(record.date);
    daysByDate.set(record.date, {
      date: record.date,
      categories: existing ? [periodCategory, ...existing.categories] : [periodCategory],
    });
  });

  return {days: sortByDate(Array.from(daysByDate.values())), notices: []};
}

/* ============================================================
 * IRREGULAR (SOPK) — irregularJournalStore + shared `flow` section
 * ============================================================ */

function buildIrregularCategoryLabels(): Record<
  'period' | 'acne' | 'hairGrowth' | 'pain' | 'fatigue' | 'mood' | 'weight' | 'notes',
  string
> {
  return {
    period: i18n.t('export.data.irregular.categories.period'),
    acne: i18n.t('export.data.irregular.categories.acne'),
    hairGrowth: i18n.t('export.data.irregular.categories.hairGrowth'),
    pain: i18n.t('export.data.irregular.categories.pain'),
    fatigue: i18n.t('export.data.irregular.categories.fatigue'),
    mood: i18n.t('export.data.irregular.categories.mood'),
    weight: i18n.t('export.data.irregular.categories.weight'),
    notes: i18n.t('export.data.irregular.categories.notes'),
  };
}
const IRREGULAR_CATEGORY_LABELS = buildIrregularCategoryLabels();
i18n.on('languageChanged', () => Object.assign(IRREGULAR_CATEGORY_LABELS, buildIrregularCategoryLabels()));

// Per-category free-text notes (details[category].note), in display order —
// reuses IRREGULAR_CATEGORY_LABELS' own (already language-aware) label for
// each category rather than a second, separately-translated copy, except
// 'fatigue' whose note-source label is plain "Fatigue" — distinct from the
// checkbox category's own "Fatigue & symptômes" — so it keeps its own key.
function buildIrregularNoteSources(): readonly (readonly [Exclude<keyof typeof IRREGULAR_CATEGORY_LABELS, 'notes'>, string])[] {
  return [
    ['period', IRREGULAR_CATEGORY_LABELS.period],
    ['acne', IRREGULAR_CATEGORY_LABELS.acne],
    ['hairGrowth', IRREGULAR_CATEGORY_LABELS.hairGrowth],
    ['pain', IRREGULAR_CATEGORY_LABELS.pain],
    ['mood', IRREGULAR_CATEGORY_LABELS.mood],
    ['fatigue', i18n.t('export.data.irregular.fatigueNoteLabel')],
    ['weight', IRREGULAR_CATEGORY_LABELS.weight],
  ];
}

/** SOPK reader. The real data lives in irregularJournalStore (acne, hair
 * growth, weight, pain, mood, fatigue + per-category details/notes), except
 * the "Règles" answer whose flow is mirrored into the shared dailyJournalStore
 * `flow` section. The period line is classified with the canonical
 * classifyIrregularPeriodDay helper, so "Non" (no bleeding), "Spotting" and a
 * real period flow are never confused — the shared `flow.intensity` is 'none'
 * for both "Non" and "Spotting" and must not be read alone. Nothing is
 * derived or invented: only fields that were actually saved are exported. */
export async function buildIrregularExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  await hydrateIrregularJournal();
  const irregularByDate = getAllIrregularJournalEntries();
  const flowByDate = new Map<string, DailyJournalEntry['flow']>();
  (await getAllJournalEntries()).forEach(entry => flowByDate.set(entry.date, entry.flow));

  const dates = Array.from(new Set([...Object.keys(irregularByDate), ...flowByDate.keys()])).map(date => ({date}));
  const inPeriod = filterEntriesByPeriod(dates, period, now);

  const wants = (category: keyof typeof IRREGULAR_CATEGORY_LABELS) => selectedCategories.includes(category);

  const days: ExportDayEntry[] = [];
  inPeriod.forEach(({date}) => {
    const entry = irregularByDate[date];
    const flow = flowByDate.get(date);
    const details = entry?.details;
    const categories: ExportCategoryValue[] = [];
    const push = (category: keyof typeof IRREGULAR_CATEGORY_LABELS, lines: string[]) => {
      if (lines.length) {categories.push({category, label: IRREGULAR_CATEGORY_LABELS[category], lines});}
    };

    if (wants('period')) {
      const kind = classifyIrregularPeriodDay(flow, entry);
      if (kind) {
        const lines: string[] = [];
        if (kind === 'period') {
          const intensity = flow?.intensity && flow.intensity !== 'none'
            ? formatFlowIntensityLabel(flow.intensity)
            : details?.period?.flowIntensity; // SOPK's own stored label when no shared flow exists — user/config data, never translated here
          lines.push(intensity ? `${i18n.t('export.fields.flow')} : ${intensity}` : i18n.t('export.data.yes'));
        } else if (kind === 'spotting') {
          lines.push(i18n.t('export.data.irregular.spotting'));
        } else {
          lines.push(i18n.t('export.data.irregular.noPeriod'));
        }
        const painLevel = details?.period?.painLevel ?? flow?.pain;
        if (painLevel) {lines.push(`${i18n.t('export.fields.pain')} : ${painLevel}`);}
        push('period', lines);
      }
    }

    if (wants('acne') && entry?.acne) {
      const lines = [entry.acne];
      if (details?.acne?.areas?.length) {lines.push(`${i18n.t('export.data.zones')} : ${details.acne.areas.join(', ')}`);}
      push('acne', lines);
    }

    if (wants('hairGrowth') && entry?.hairGrowth) {
      const lines = [entry.hairGrowth];
      if (details?.hairGrowth?.areas?.length) {lines.push(`${i18n.t('export.data.zones')} : ${details.hairGrowth.areas.join(', ')}`);}
      push('hairGrowth', lines);
    }

    if (wants('pain') && entry?.pain) {
      const lines = [entry.pain];
      // In the SOPK pain form `areas` holds the pain TYPES and `symptoms` the
      // body ZONES (see IrregularJournalEntryScreen.tsx).
      if (details?.pain?.areas?.length) {lines.push(`${i18n.t('export.data.types')} : ${details.pain.areas.join(', ')}`);}
      if (details?.pain?.symptoms?.length) {lines.push(`${i18n.t('export.data.zones')} : ${details.pain.symptoms.join(', ')}`);}
      push('pain', lines);
    }

    if (wants('fatigue') && entry) {
      const associated = getIrregularFatigueSymptoms(entry);
      const lines: string[] = [];
      if (entry.fatigue) {lines.push(entry.fatigue);}
      if (associated.length) {lines.push(`${i18n.t('export.data.associatedSymptoms')} : ${associated.join(', ')}`);}
      push('fatigue', lines);
    }

    if (wants('mood') && entry?.mood) {push('mood', [entry.mood]);}

    if (wants('weight') && entry?.weight) {
      const lines = [entry.weight];
      if (details?.weight?.weightFeeling) {lines.push(`${i18n.t('export.fields.feeling')} : ${details.weight.weightFeeling}`);}
      push('weight', lines);
    }

    if (wants('notes')) {
      const lines: string[] = [];
      buildIrregularNoteSources().forEach(([key, label]) => {
        // The period note is mirrored into the shared flow.note; prefer the
        // SOPK copy and only fall back to flow.note when it is absent.
        const note = details?.[key]?.note || (key === 'period' ? flow?.note : undefined);
        if (note) {lines.push(`${label} : ${note}`);}
      });
      push('notes', lines);
    }

    if (categories.length) {days.push({date, categories});}
  });

  return {days: sortByDate(days), notices: []};
}

/* ============================================================
 * CONCEIVE (TTC)
 * ============================================================ */

function buildConceiveCategoryLabels(): Record<string, string> {
  return {
    temperature: i18n.t('export.data.conceive.categories.temperature'),
    lhTest: i18n.t('export.data.conceive.categories.lhTest'),
    cervicalMucus: i18n.t('export.data.conceive.categories.cervicalMucus'),
    symptoms: i18n.t('export.data.conceive.categories.symptoms'),
    mood: i18n.t('export.data.conceive.categories.mood'),
    intimacy: i18n.t('export.data.conceive.categories.intimacy'),
    notes: i18n.t('export.data.conceive.categories.notes'),
  };
}
const CONCEIVE_CATEGORY_LABELS: Record<string, string> = buildConceiveCategoryLabels();
i18n.on('languageChanged', () => Object.assign(CONCEIVE_CATEGORY_LABELS, buildConceiveCategoryLabels()));

export async function buildConceiveExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  const allEntries = await getAllJournalEntries();
  const filtered = filterEntriesByPeriod(allEntries, period, now);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const days = await Promise.all(
    sorted.map(async entry => ({
      date: entry.date,
      categories: await buildDailyJournalCategories(entry, selectedCategories, CONCEIVE_CATEGORY_LABELS),
    })),
  );

  // Estimated ovulation day / fertile window — same formula already used by
  // ConceiveDashboard.tsx (ovulationDayFor + a 6-day fertile window ending
  // the day after ovulation), never recomputed differently here. Only shown
  // once real cycle data has actually been confirmed — never derived from
  // the still-default onboarding placeholder.
  const notices: string[] = [];
  await hydrateCyclePreferences();
  if (getHasConfirmedCycleData()) {
    const preferences = getCyclePreferences();
    const basics = {
      lastPeriodStart: preferences.lastPeriodStart,
      cycleDuration: preferences.cycleDuration,
      periodDuration: preferences.periodDuration,
    };
    // One coherent window (start <= ovulation <= end) — see
    // upcomingFertileWindow in cycleMath.ts.
    const {start: fertileStart, end: fertileEnd, ovulation: ovulationDate} = upcomingFertileWindow(basics, now);
    notices.push(i18n.t('export.data.conceive.ovulationNotice', {date: formatFullDate(ovulationDate)}));
    notices.push(
      i18n.t('export.data.conceive.fertileWindowNotice', {
        start: formatFullDate(fertileStart),
        end: formatFullDate(fertileEnd),
      }),
    );
  }

  return {days: sortByDate(days), notices};
}

/* ============================================================
 * PREGNANCY
 * ============================================================ */

function formatPregnancyMedicalEntry(entry: PregnancyMedicalEntry): string[] {
  const lines: string[] = [];
  if (entry.date) {lines.push(`${i18n.t('export.data.pregnancy.referenceDate')} : ${entry.date}`);}
  lines.push(entry.note);
  return lines;
}

export async function buildPregnancyExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  const journal = await getPregnancyJournalState();
  const events = await getPregnancyMedicalEvents();
  const dailyEntries = filterEntriesByPeriod(await getAllJournalEntries(), period, now);

  const byDate = new Map<string, ExportCategoryValue[]>();
  const ensureDay = (date: string) => {
    if (!byDate.has(date)) {byDate.set(date, []);}
    return byDate.get(date)!;
  };
  // Every ENCRYPTED free-text note of this objective (symptom notes, appointment
  // / exam notes, the daily journal's per-section mood / sleep notes) is filed
  // under ONE sensitive 'notes' category per day (M43) — never inside the plain
  // symptoms / appointments / mood / sleep categories.
  const notesByDate = new Map<string, string[]>();
  const addNote = (date: string, line: string) => {
    notesByDate.set(date, [...(notesByDate.get(date) ?? []), line]);
  };
  const wantsNotes = selectedCategories.includes('notes');

  if (selectedCategories.includes('symptoms')) {
    journal.symptoms.forEach(entry => {
      ensureDay(entry.date).push({
        category: 'symptoms',
        label: i18n.t('export.fields.symptoms'),
        lines: entry.symptoms.length ? [entry.symptoms.join(', ')] : [],
      });
    });
  }
  if (wantsNotes) {
    journal.symptoms.forEach(entry => {
      if (entry.note) {addNote(entry.date, `${i18n.t('export.fields.symptoms')} : ${entry.note}`);}
    });
  }
  if (selectedCategories.includes('weight')) {
    journal.weights.forEach(entry => {
      ensureDay(entry.date).push({category: 'weight', label: i18n.t('export.fields.weight'), lines: [`${entry.valueKg} kg`]});
    });
  }
  if (selectedCategories.includes('medicalInfo')) {
    journal.medicalInformationHistory.forEach(entry => {
      const date = entry.date ?? entry.updatedAt.slice(0, 10);
      ensureDay(date).push({category: 'medicalInfo', label: i18n.t('export.data.pregnancy.medicalInfo'), lines: formatPregnancyMedicalEntry(entry)});
    });
  }
  if (selectedCategories.includes('appointments')) {
    events.forEach(event => {
      const typeLabel = event.type === 'appointment' ? i18n.t('export.data.pregnancy.appointment') : i18n.t('export.data.pregnancy.exam');
      const lines = [event.title, event.practitioner ? `${i18n.t('export.data.pregnancy.practitioner')} : ${event.practitioner}` : ''].filter(Boolean);
      ensureDay(event.date).push({category: 'appointments', label: `${typeLabel} / ${i18n.t('export.data.pregnancy.appointmentsCategorySuffix')}`, lines});
    });
  }
  if (wantsNotes) {
    events.forEach(event => {
      if (event.notes) {
        const typeLabel = event.type === 'appointment' ? i18n.t('export.data.pregnancy.appointment') : i18n.t('export.data.pregnancy.exam');
        addNote(event.date, `${typeLabel} (${event.title}) : ${event.notes}`);
      }
    });
  }
  if (selectedCategories.includes('mood') || selectedCategories.includes('sleep')) {
    dailyEntries.forEach(entry => {
      (['mood', 'sleep'] as const).forEach(category => {
        if (!selectedCategories.includes(category)) {return;}
        const lines = formatCategoryValue(category, entry);
        if (lines.length) {
          ensureDay(entry.date).push({category, label: category === 'mood' ? i18n.t('export.fields.mood') : i18n.t('export.sectionNotes.sleep'), lines});
        }
      });
    });
  }
  if (wantsNotes) {
    dailyEntries.forEach(entry => {
      formatSectionNoteLines(entry, ['mood', 'sleep']).forEach(line => addNote(entry.date, line));
    });
  }
  notesByDate.forEach((lines, date) => {
    ensureDay(date).push({category: 'notes', label: i18n.t('export.data.notesPersonnelles'), lines});
  });

  const days: ExportDayEntry[] = Array.from(byDate.entries())
    .filter(([date]) => {
      if (period === 'all') {return true;}
      const months = Number(period.replace('m', ''));
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      return new Date(`${date}T12:00:00`) >= cutoff;
    })
    .map(([date, categories]) => ({date, categories}));

  const notices: string[] = [];
  await hydratePregnancyDating();
  const dating = getPregnancyDating();
  if (dating.date) {
    const status = computePregnancyStatus(dating.method, new Date(dating.date), now);
    if (status.week > 0) {
      notices.push(`Semaine de grossesse estimée (estimation basée sur le mode de datation choisi) : ${status.week}.`);
    }
  }

  return {days: sortByDate(days), notices};
}

/* ============================================================
 * CONTRACEPTION
 * ============================================================ */

function buildIntakeStatusLabels(): Record<string, string> {
  return {
    taken: i18n.t('export.data.contraception.intakeStatus.taken'),
    missed: i18n.t('export.data.contraception.intakeStatus.missed'),
    late: i18n.t('export.data.contraception.intakeStatus.late'),
  };
}
const INTAKE_STATUS_LABELS: Record<string, string> = buildIntakeStatusLabels();
i18n.on('languageChanged', () => Object.assign(INTAKE_STATUS_LABELS, buildIntakeStatusLabels()));

function buildContraceptionEventLabels(): Record<string, string> {
  return {
    ring_insertion: i18n.t('export.data.contraception.events.ringInsertion'),
    ring_removal: i18n.t('export.data.contraception.events.ringRemoval'),
    ring_replacement: i18n.t('export.data.contraception.events.ringReplacement'),
    patch_application: i18n.t('export.data.contraception.events.patchApplication'),
    patch_removal: i18n.t('export.data.contraception.events.patchRemoval'),
    patch_replacement: i18n.t('export.data.contraception.events.patchReplacement'),
  };
}
const CONTRACEPTION_EVENT_LABELS: Record<string, string> = buildContraceptionEventLabels();
i18n.on('languageChanged', () => Object.assign(CONTRACEPTION_EVENT_LABELS, buildContraceptionEventLabels()));

export async function buildContraceptionExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  await Promise.all([hydrateContraceptionIntakeHistory(), hydrateContraceptionEvents(), hydrateContraceptionJournal()]);

  const byDate = new Map<string, ExportCategoryValue[]>();
  const ensureDay = (date: string) => {
    if (!byDate.has(date)) {byDate.set(date, []);}
    return byDate.get(date)!;
  };

  if (selectedCategories.includes('intake')) {
    Object.values(getAllContraceptionIntakeRecords()).forEach(record => {
      ensureDay(record.date).push({
        category: 'intake',
        label: i18n.t('export.data.contraception.categories.intake'),
        lines: [INTAKE_STATUS_LABELS[record.status] ?? record.status],
      });
    });
  }
  if (selectedCategories.includes('events')) {
    Object.values(getAllContraceptionEvents())
      .flat()
      .forEach(event => {
        ensureDay(event.date).push({
          category: 'events',
          label: i18n.t('export.data.contraception.categories.events'),
          lines: [CONTRACEPTION_EVENT_LABELS[event.type] ?? event.type],
        });
      });
  }
  if (selectedCategories.includes('journal')) {
    // No getAll* helper exists for this store — hydrateContraceptionJournal()
    // itself resolves to the full EntriesByDate map, so it doubles as the
    // read here (same value the store already holds in memory).
    const journalEntries = await hydrateContraceptionJournal();
    Object.values(journalEntries).forEach(entry => {
      const lines = [
        entry.feelings?.length ? `${i18n.t('export.fields.feeling')} : ${entry.feelings.join(', ')}` : '',
        entry.notes ? `${i18n.t('export.data.note')} : ${entry.notes}` : '',
      ].filter(Boolean);
      if (lines.length) {ensureDay(entry.date).push({category: 'journal', label: i18n.t('export.data.contraception.categories.journal'), lines});}
    });
  }

  const days: ExportDayEntry[] = Array.from(byDate.entries())
    .filter(([date]) => {
      if (period === 'all') {return true;}
      const months = Number(period.replace('m', ''));
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      return new Date(`${date}T12:00:00`) >= cutoff;
    })
    .map(([date, categories]) => ({date, categories}));

  const notices: string[] = [];
  await hydrateContraceptionPreferences();
  const method = getContraceptionPreferences().method;
  const methodLabels: Record<string, string> = {
    pill: i18n.t('export.data.contraception.methods.pill'),
    ring: i18n.t('export.data.contraception.methods.ring'),
    patch: i18n.t('export.data.contraception.methods.patch'),
    other: i18n.t('export.data.contraception.methods.other'),
  };
  if (method) {notices.push(i18n.t('export.data.contraception.activeMethodNotice', {method: methodLabels[method] ?? method}));}

  return {days: sortByDate(days), notices};
}

/* ============================================================
 * POSTPARTUM
 * ============================================================ */

function buildPostpartumFieldLabels(): Record<string, string> {
  return {
    fatigue: i18n.t('export.data.postpartum.categories.fatigue'),
    sleep: i18n.t('export.data.postpartum.categories.sleep'),
    mood: i18n.t('export.data.postpartum.categories.mood'),
    pain: i18n.t('export.data.postpartum.categories.pain'),
    physicalRecovery: i18n.t('export.data.postpartum.categories.physicalRecovery'),
  };
}
const POSTPARTUM_FIELD_LABELS: Record<string, string> = buildPostpartumFieldLabels();
i18n.on('languageChanged', () => Object.assign(POSTPARTUM_FIELD_LABELS, buildPostpartumFieldLabels()));

export async function buildPostpartumExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  await Promise.all([hydratePostpartumJournal(), hydratePostpartumLochia()]);

  const byDate = new Map<string, ExportCategoryValue[]>();
  const ensureDay = (date: string) => {
    if (!byDate.has(date)) {byDate.set(date, []);}
    return byDate.get(date)!;
  };

  const journalCategories = ['fatigue', 'sleep', 'mood', 'pain', 'physicalRecovery'] as const;
  Object.values(getAllPostpartumJournalEntries()).forEach(entry => {
    journalCategories.forEach(category => {
      if (!selectedCategories.includes(category)) {return;}
      const value = entry[category];
      if (!value) {return;}
      const lines = [String(value)];
      if (category === 'sleep' && entry.sleepDuration !== undefined) {lines.push(`${i18n.t('export.fields.duration')} : ${entry.sleepDuration} h`);}
      ensureDay(entry.date).push({category, label: POSTPARTUM_FIELD_LABELS[category], lines});
    });
    // The mood free-text note is ENCRYPTED at rest (postpartumJournalStore) — it
    // belongs to the sensitive 'notes' category, not to the plain 'mood' one (M43).
    if (selectedCategories.includes('notes') && entry.moodNote) {
      ensureDay(entry.date).push({category: 'notes', label: i18n.t('export.data.notesPersonnelles'), lines: [`${i18n.t('export.fields.mood')} : ${entry.moodNote}`]});
    }
  });

  if (selectedCategories.includes('lochia')) {
    Object.values(getAllPostpartumLochiaEntries()).forEach(entry => {
      const lines = [
        `${i18n.t('export.fields.flow')} : ${entry.flow}`,
        `${i18n.t('export.fields.color')} : ${entry.color}`,
        `${i18n.t('export.data.postpartum.consistency')} : ${entry.consistency}`,
      ];
      if (entry.symptoms.length) {lines.push(`${i18n.t('export.data.associatedSymptoms')} : ${entry.symptoms.join(', ')}`);}
      if (entry.note) {lines.push(`${i18n.t('export.data.note')} : ${entry.note}`);}
      ensureDay(entry.date).push({category: 'lochia', label: i18n.t('export.data.postpartum.categories.lochia'), lines});
    });
  }

  const days: ExportDayEntry[] = Array.from(byDate.entries())
    .filter(([date]) => {
      if (period === 'all') {return true;}
      const months = Number(period.replace('m', ''));
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      return new Date(`${date}T12:00:00`) >= cutoff;
    })
    .map(([date, categories]) => ({date, categories}));

  // Deliberately no notices/data sourced from postpartumNifasReminderStore.ts
  // here — that store is religious-reminder scheduling bookkeeping, never
  // medical/tracked data (see the audit this task was built from).
  return {days: sortByDate(days), notices: []};
}

/* ============================================================
 * MISCARRIAGE ('loss')
 * ============================================================ */

export async function buildMiscarriageExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  await hydrateMiscarriageJournal();
  const entries = Object.values(getAllMiscarriageJournalEntries()).filter(entry => {
    if (period === 'all') {return true;}
    const months = Number(period.replace('m', ''));
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - months);
    return new Date(`${entry.date}T12:00:00`) >= cutoff;
  });

  const days: ExportDayEntry[] = entries.map(entry => {
    const categories: ExportCategoryValue[] = [];
    if (selectedCategories.includes('bleeding') && entry.bleeding) {
      const lines = [entry.bleeding];
      if (entry.bleedingColor) {lines.push(`${i18n.t('export.fields.color')} : ${entry.bleedingColor}`);}
      categories.push({category: 'bleeding', label: i18n.t('export.data.loss.categories.bleeding'), lines});
    }
    if (selectedCategories.includes('symptoms') && entry.physicalSymptoms?.length) {
      categories.push({category: 'symptoms', label: i18n.t('export.data.loss.categories.symptoms'), lines: [entry.physicalSymptoms.join(', ')]});
    }
    // personalNotes AND the two free-text annotations attached to bleeding /
    // symptoms are all ENCRYPTED at rest (miscarriageJournalStore
    // SENSITIVE_FIELDS) — they all live under the sensitive 'notes' category (M43).
    if (selectedCategories.includes('notes')) {
      const lines = [
        ...(entry.personalNotes ? [entry.personalNotes] : []),
        ...(entry.bleedingNote ? [`${i18n.t('export.data.loss.categories.bleeding')} : ${entry.bleedingNote}`] : []),
        ...(entry.physicalSymptomsNote ? [`${i18n.t('export.data.loss.categories.symptoms')} : ${entry.physicalSymptomsNote}`] : []),
      ];
      if (lines.length) {categories.push({category: 'notes', label: i18n.t('export.data.notesPersonnelles'), lines});}
    }
    return {date: entry.date, categories};
  });

  return {days: sortByDate(days), notices: []};
}

/* ============================================================
 * MENOPAUSE
 * ============================================================ */

// Single source: the same option list the Menopause journal itself renders.
// MENOPAUSE_SYMPTOM_OPTIONS is itself refreshed in place on `languageChanged`
// (see menopauseJournalConfig.ts) — this derived lookup is rebuilt from it on
// the same event, rather than only once at import time, so it never goes
// stale after a language switch.
function buildMenopauseSymptomLabels(): Record<string, string> {
  return Object.fromEntries(MENOPAUSE_SYMPTOM_OPTIONS.map(option => [option.id, option.label]));
}
const MENOPAUSE_SYMPTOM_LABELS: Record<string, string> = buildMenopauseSymptomLabels();
i18n.on('languageChanged', () => Object.assign(MENOPAUSE_SYMPTOM_LABELS, buildMenopauseSymptomLabels()));

export async function buildMenopauseExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  // Deliberately NOT reading menopausePreferences: the CURRENT tracking
  // preference only steers what the journal offers today, it never decides
  // whether a treatment / lab result that was genuinely RECORDED in the
  // selected range is exported (M27: current preference != historical data).
  await hydrateMenopauseJournal();

  const byDate = new Map<string, ExportCategoryValue[]>();
  const ensureDay = (date: string) => {
    if (!byDate.has(date)) {byDate.set(date, []);}
    return byDate.get(date)!;
  };

  Object.values(getAllMenopauseJournalEntries()).forEach(entry => {
    if (selectedCategories.includes('symptoms') && entry.symptoms?.length) {
      const lines = [entry.symptoms.map(symptom => MENOPAUSE_SYMPTOM_LABELS[symptom] ?? symptom).join(', ')];
      if (entry.symptomIntensity) {
        lines.push(`${i18n.t('export.fields.intensity')} : ${formatEnumOrRaw(entry.symptomIntensity, MENOPAUSE_INTENSITY_LABELS)}`);
      }
      ensureDay(entry.date).push({category: 'symptoms', label: i18n.t('export.data.menopause.categories.symptoms'), lines});
    }
    if (selectedCategories.includes('mood') && entry.mood) {
      ensureDay(entry.date).push({
        category: 'mood',
        label: i18n.t('export.data.menopause.categories.mood'),
        lines: [formatEnumOrRaw(entry.mood, MENOPAUSE_MOOD_LABELS) as string],
      });
    }
    if (selectedCategories.includes('sleep') && (entry.sleepDurationHours !== undefined || entry.sleepQuality)) {
      const lines: string[] = [];
      if (entry.sleepDurationHours !== undefined) {lines.push(`${i18n.t('export.fields.duration')} : ${entry.sleepDurationHours} h`);}
      if (entry.sleepQuality) {
        lines.push(`${i18n.t('export.fields.quality')} : ${formatEnumOrRaw(entry.sleepQuality, MENOPAUSE_SLEEP_QUALITY_LABELS)}`);
      }
      ensureDay(entry.date).push({category: 'sleep', label: i18n.t('export.data.menopause.categories.sleep'), lines});
    }
    if (selectedCategories.includes('energy') && entry.energyLevel) {
      ensureDay(entry.date).push({
        category: 'energy',
        label: i18n.t('export.data.menopause.categories.energy'),
        lines: [formatEnumOrRaw(entry.energyLevel, MENOPAUSE_ENERGY_LABELS) as string],
      });
    }
    // Exported whenever a treatment status was genuinely recorded on that day,
    // regardless of the CURRENT hormonal-treatment tracking preference (M27).
    if (selectedCategories.includes('treatment') && entry.treatmentStatus) {
      const lines = [formatEnumOrRaw(entry.treatmentStatus, MENOPAUSE_TREATMENT_STATUS_LABELS) as string];
      if (entry.treatmentNote) {lines.push(`${i18n.t('export.data.note')} : ${entry.treatmentNote}`);}
      ensureDay(entry.date).push({category: 'treatment', label: i18n.t('export.data.menopause.categories.treatment'), lines});
    }
    if (selectedCategories.includes('notes') && entry.notes) {
      ensureDay(entry.date).push({category: 'notes', label: i18n.t('export.data.menopause.categories.notes'), lines: [entry.notes]});
    }
  });

  if (selectedCategories.includes('labResults')) {
    getMenopauseLabResults().forEach(result => {
      const typeLabel = formatEnumOrRaw(result.type, MENOPAUSE_LAB_TYPE_LABELS);
      // Value only, never an interpretation — no "normal"/"anormal" judgment.
      ensureDay(result.date).push({
        category: 'labResults',
        label: i18n.t('export.data.menopause.categories.labResults'),
        lines: [`${typeLabel} : ${result.value}${result.unit ? ` ${result.unit}` : ''}`],
      });
    });
  }

  const days: ExportDayEntry[] = Array.from(byDate.entries())
    .filter(([date]) => {
      if (period === 'all') {return true;}
      const months = Number(period.replace('m', ''));
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      return new Date(`${date}T12:00:00`) >= cutoff;
    })
    .map(([date, categories]) => ({date, categories}));

  return {days: sortByDate(days), notices: []};
}
