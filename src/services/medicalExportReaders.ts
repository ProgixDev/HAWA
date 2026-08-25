import type {DailyJournalEntry} from '../types/journal';
import {getAllJournalEntries} from '../state/dailyJournalStore';
import {resolveNoteSection} from './privateNotesEncryption';
import {resolveIntimacySection} from './privateJournalEncryption';
import {
  formatCategoryValue,
  filterEntriesByPeriod,
  type ExportCategoryValue,
  type ExportDayEntry,
  type ExportPeriod,
} from './medicalExportFormatting';

import {
  getCyclePreferences,
  getHasConfirmedCycleData,
  hydrateCyclePreferences,
} from '../state/onboardingPreferences';
import {ovulationDayFor, upcomingDateForCycleDay, formatFullDate} from '../utils/cycleMath';

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
import {getMenopausePreferences, hydrateMenopausePreferences} from '../state/menopausePreferences';

// One reader per objective — the ONLY place that reads each objective's real
// canonical store(s) for the Medical Export feature. Every reader returns
// the SAME plain {days, notices} shape so medicalExportOrchestrator.ts / the
// CSV+PDF builders in medicalExportFormatting.ts stay fully objective-
// agnostic. A reader only ever reads the stores that objective actually
// displays on its own Dashboard/Calendar/Statistics (see
// objectiveExportConfig.ts's per-objective comment trail) — never another
// objective's store, so cross-objective leakage is structurally impossible:
// there is no shared "give me everything" function, only these 7 narrow
// ones, each hand-written against one objective's real data.

export type ObjectiveExportData = {days: ExportDayEntry[]; notices: string[]};

function sortByDate(days: ExportDayEntry[]): ExportDayEntry[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

/* ============================================================
 * CYCLE / IRREGULAR (SOPK) — shared dailyJournalStore
 * ============================================================ */

const CYCLE_CATEGORY_LABELS: Record<string, string> = {
  cycle: 'Cycle',
  flow: 'Flux menstruel',
  symptoms: 'Symptômes',
  mood: 'Humeur',
  sleep: 'Sommeil',
  activity: 'Activité',
  hydration: 'Hydratation',
  temperature: 'Température',
  notes: 'Notes privées',
  weight: 'Poids',
  intimacy: 'Vie intime',
};

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
        return {category, label, lines: data?.text ? [data.text] : []};
      }

      if (category === 'intimacy') {
        const {data} = await resolveIntimacySection(entry);
        if (!data) {return {category, label, lines: []};}
        const lines: string[] = [];
        const answerLabel = data.answer === 'yes' ? 'Oui' : data.answer === 'no' ? 'Non' : 'Préfère ne pas répondre';
        lines.push(`Rapport : ${answerLabel}`);
        if (data.time) {lines.push(`Heure : ${data.time}`);}
        if (data.protection) {lines.push(`Protection : ${data.protection}`);}
        if (data.libido) {lines.push(`Libido : ${data.libido}`);}
        if (data.discomfort) {lines.push(`Inconfort : ${data.discomfort}`);}
        if (data.note) {lines.push(`Note : ${data.note}`);}
        return {category, label, lines};
      }

      return {category, label, lines: formatCategoryValue(category, entry)};
    }),
  );
}

/** 'cycle' and 'irregular' (SOPK, no dedicated store — see
 * objectiveExportConfig.ts) both read the shared dailyJournalStore. */
export async function buildCycleExportDays(
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
      categories: await buildDailyJournalCategories(entry, selectedCategories, CYCLE_CATEGORY_LABELS),
    })),
  );
  return {days, notices: []};
}

/* ============================================================
 * CONCEIVE (TTC)
 * ============================================================ */

const CONCEIVE_CATEGORY_LABELS: Record<string, string> = {
  temperature: 'Température basale',
  lhTest: 'Tests d’ovulation (LH)',
  cervicalMucus: 'Glaire cervicale',
  symptoms: 'Symptômes',
  mood: 'Humeur',
  intimacy: 'Rapports / Vie intime',
  notes: 'Notes privées',
};

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
    const ovulationDay = ovulationDayFor(basics.cycleDuration);
    const fertileStartDay = Math.max(1, ovulationDay - 5);
    const fertileEndDay = ovulationDay + 1;
    const ovulationDate = upcomingDateForCycleDay(basics, ovulationDay, now);
    const fertileStart = upcomingDateForCycleDay(basics, fertileStartDay, now);
    const fertileEnd = upcomingDateForCycleDay(basics, fertileEndDay, now);
    notices.push(`Ovulation estimée (estimation, non un fait confirmé) : ${formatFullDate(ovulationDate)}.`);
    notices.push(
      `Fenêtre de fertilité estimée (estimation) : du ${formatFullDate(fertileStart)} au ${formatFullDate(fertileEnd)}.`,
    );
  }

  return {days: sortByDate(days), notices};
}

/* ============================================================
 * PREGNANCY
 * ============================================================ */

function formatPregnancyMedicalEntry(entry: PregnancyMedicalEntry): string[] {
  const lines: string[] = [];
  if (entry.date) {lines.push(`Date de référence : ${entry.date}`);}
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

  if (selectedCategories.includes('symptoms')) {
    journal.symptoms.forEach(entry => {
      ensureDay(entry.date).push({
        category: 'symptoms',
        label: 'Symptômes',
        lines: entry.symptoms.length ? [entry.symptoms.join(', ')].concat(entry.note ? [`Note : ${entry.note}`] : []) : [],
      });
    });
  }
  if (selectedCategories.includes('weight')) {
    journal.weights.forEach(entry => {
      ensureDay(entry.date).push({category: 'weight', label: 'Poids', lines: [`${entry.valueKg} kg`]});
    });
  }
  if (selectedCategories.includes('medicalInfo')) {
    journal.medicalInformationHistory.forEach(entry => {
      const date = entry.date ?? entry.updatedAt.slice(0, 10);
      ensureDay(date).push({category: 'medicalInfo', label: 'Informations médicales', lines: formatPregnancyMedicalEntry(entry)});
    });
  }
  if (selectedCategories.includes('appointments')) {
    events.forEach(event => {
      const typeLabel = event.type === 'appointment' ? 'Rendez-vous' : 'Examen';
      const lines = [event.title, event.practitioner ? `Praticien·ne : ${event.practitioner}` : '', event.notes ? `Note : ${event.notes}` : '']
        .filter(Boolean);
      ensureDay(event.date).push({category: 'appointments', label: `${typeLabel} / Examens`, lines});
    });
  }
  if (selectedCategories.includes('mood') || selectedCategories.includes('sleep')) {
    dailyEntries.forEach(entry => {
      (['mood', 'sleep'] as const).forEach(category => {
        if (!selectedCategories.includes(category)) {return;}
        const lines = formatCategoryValue(category, entry);
        if (lines.length) {
          ensureDay(entry.date).push({category, label: category === 'mood' ? 'Humeur' : 'Sommeil', lines});
        }
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

const INTAKE_STATUS_LABELS: Record<string, string> = {taken: 'Pris', missed: 'Oublié', late: 'En retard'};
const CONTRACEPTION_EVENT_LABELS: Record<string, string> = {
  ring_insertion: 'Pose de l’anneau',
  ring_removal: 'Retrait de l’anneau',
  ring_replacement: 'Remplacement de l’anneau',
  patch_application: 'Pose du patch',
  patch_removal: 'Retrait du patch',
  patch_replacement: 'Remplacement du patch',
};

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
        label: 'Suivi de prise',
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
          label: 'Anneau / Patch',
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
      const lines = [entry.feelings?.length ? `Ressenti : ${entry.feelings.join(', ')}` : '', entry.notes ? `Note : ${entry.notes}` : ''].filter(
        Boolean,
      );
      if (lines.length) {ensureDay(entry.date).push({category: 'journal', label: 'Journal', lines});}
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
  const methodLabels: Record<string, string> = {pill: 'Pilule', ring: 'Anneau', patch: 'Patch', other: 'Autre méthode'};
  if (method) {notices.push(`Méthode de contraception active : ${methodLabels[method] ?? method}.`);}

  return {days: sortByDate(days), notices};
}

/* ============================================================
 * POSTPARTUM
 * ============================================================ */

const POSTPARTUM_FIELD_LABELS: Record<string, string> = {
  fatigue: 'Fatigue',
  sleep: 'Sommeil',
  mood: 'Humeur',
  pain: 'Douleurs',
  physicalRecovery: 'Récupération physique',
};

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
      if (category === 'mood' && entry.moodNote) {lines.push(`Note : ${entry.moodNote}`);}
      if (category === 'sleep' && entry.sleepDuration !== undefined) {lines.push(`Durée : ${entry.sleepDuration} h`);}
      ensureDay(entry.date).push({category, label: POSTPARTUM_FIELD_LABELS[category], lines});
    });
  });

  if (selectedCategories.includes('lochia')) {
    Object.values(getAllPostpartumLochiaEntries()).forEach(entry => {
      const lines = [`Flux : ${entry.flow}`, `Couleur : ${entry.color}`, `Consistance : ${entry.consistency}`];
      if (entry.symptoms.length) {lines.push(`Symptômes associés : ${entry.symptoms.join(', ')}`);}
      if (entry.note) {lines.push(`Note : ${entry.note}`);}
      ensureDay(entry.date).push({category: 'lochia', label: 'Lochies', lines});
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
      if (entry.bleedingColor) {lines.push(`Couleur : ${entry.bleedingColor}`);}
      if (entry.bleedingNote) {lines.push(`Note : ${entry.bleedingNote}`);}
      categories.push({category: 'bleeding', label: 'Saignements', lines});
    }
    if (selectedCategories.includes('symptoms') && entry.physicalSymptoms?.length) {
      const lines = [entry.physicalSymptoms.join(', ')];
      if (entry.physicalSymptomsNote) {lines.push(`Note : ${entry.physicalSymptomsNote}`);}
      categories.push({category: 'symptoms', label: 'Symptômes physiques', lines});
    }
    if (selectedCategories.includes('notes') && entry.personalNotes) {
      categories.push({category: 'notes', label: 'Notes personnelles', lines: [entry.personalNotes]});
    }
    return {date: entry.date, categories};
  });

  return {days: sortByDate(days), notices: []};
}

/* ============================================================
 * MENOPAUSE
 * ============================================================ */

const MENOPAUSE_SYMPTOM_LABELS: Record<string, string> = {
  hot_flashes: 'Bouffées de chaleur',
  night_sweats: 'Sueurs nocturnes',
  sleep_disturbances: 'Troubles du sommeil',
  fatigue: 'Fatigue',
  mood_changes: 'Variations d’humeur',
  brain_fog: 'Brouillard mental',
};

export async function buildMenopauseExportDays(
  selectedCategories: string[],
  period: ExportPeriod,
  now: Date,
): Promise<ObjectiveExportData> {
  await Promise.all([hydrateMenopauseJournal(), hydrateMenopausePreferences()]);

  const byDate = new Map<string, ExportCategoryValue[]>();
  const ensureDay = (date: string) => {
    if (!byDate.has(date)) {byDate.set(date, []);}
    return byDate.get(date)!;
  };

  const hormonalTreatmentTracked = getMenopausePreferences().hormonalTreatmentStatus === 'track';

  Object.values(getAllMenopauseJournalEntries()).forEach(entry => {
    if (selectedCategories.includes('symptoms') && entry.symptoms?.length) {
      const lines = [entry.symptoms.map(symptom => MENOPAUSE_SYMPTOM_LABELS[symptom] ?? symptom).join(', ')];
      if (entry.symptomIntensity) {lines.push(`Intensité : ${entry.symptomIntensity}`);}
      ensureDay(entry.date).push({category: 'symptoms', label: 'Symptômes', lines});
    }
    if (selectedCategories.includes('mood') && entry.mood) {
      ensureDay(entry.date).push({category: 'mood', label: 'Humeur', lines: [entry.mood]});
    }
    if (selectedCategories.includes('sleep') && (entry.sleepDurationHours !== undefined || entry.sleepQuality)) {
      const lines: string[] = [];
      if (entry.sleepDurationHours !== undefined) {lines.push(`Durée : ${entry.sleepDurationHours} h`);}
      if (entry.sleepQuality) {lines.push(`Qualité : ${entry.sleepQuality}`);}
      ensureDay(entry.date).push({category: 'sleep', label: 'Sommeil', lines});
    }
    if (selectedCategories.includes('energy') && entry.energyLevel) {
      ensureDay(entry.date).push({category: 'energy', label: 'Énergie', lines: [entry.energyLevel]});
    }
    // Only surfaced if hormonal-treatment tracking is actually enabled —
    // never presents a treatment field as relevant when the user opted out.
    if (selectedCategories.includes('treatment') && hormonalTreatmentTracked && entry.treatmentStatus) {
      const lines = [entry.treatmentStatus === 'taken' ? 'Traitement pris' : 'Traitement non pris'];
      if (entry.treatmentNote) {lines.push(`Note : ${entry.treatmentNote}`);}
      ensureDay(entry.date).push({category: 'treatment', label: 'Traitement hormonal', lines});
    }
    if (selectedCategories.includes('notes') && entry.notes) {
      ensureDay(entry.date).push({category: 'notes', label: 'Notes du jour', lines: [entry.notes]});
    }
  });

  if (selectedCategories.includes('labResults')) {
    getMenopauseLabResults().forEach(result => {
      const typeLabel = result.type === 'fsh' ? 'FSH' : 'Estradiol';
      // Value only, never an interpretation — no "normal"/"anormal" judgment.
      ensureDay(result.date).push({
        category: 'labResults',
        label: 'Résultats d’analyses',
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
