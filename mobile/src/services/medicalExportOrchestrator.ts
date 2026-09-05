import type {ObjectiveId} from '../state/onboardingPreferences';
import {getExportConfigurationForObjective} from '../config/objectiveExportConfig';
import {
  buildCycleExportDays,
  buildConceiveExportDays,
  buildContraceptionExportDays,
  buildMenopauseExportDays,
  buildMiscarriageExportDays,
  buildPostpartumExportDays,
  buildPregnancyExportDays,
  type ObjectiveExportData,
} from './medicalExportReaders';
import {
  buildExportCsv,
  buildExportReportModel,
  computeExportFilenameDates,
  type ExportPeriod,
  type ExportReportModel,
} from './medicalExportFormatting';
import {getAllJournalEntries} from '../state/dailyJournalStore';

// Objective-aware dispatch: the active objective determines BOTH which
// categories are valid (checked below — never trusts the caller blindly)
// AND which reader actually runs, so one objective's data can never leak
// into another's export. Each reader in medicalExportReaders.ts only ever
// touches that objective's own real canonical store(s) — there is no
// generic "read everything" fallback.

export type MedicalExportResult =
  | {kind: 'empty'}
  | {kind: 'csv'; content: string; fromKey: string; toKey: string}
  | {kind: 'pdf'; model: ExportReportModel; fromKey: string; toKey: string};

const PERIOD_LABELS: Record<ExportPeriod, string> = {
  all: 'Tout l’historique',
  '3m': '3 derniers mois',
  '6m': '6 derniers mois',
  '12m': '12 derniers mois',
};

const READERS: Record<
  ObjectiveId,
  (selectedCategories: string[], period: ExportPeriod, now: Date) => Promise<ObjectiveExportData>
> = {
  cycle: buildCycleExportDays,
  // Same real backing stores as Cycle — no dedicated SOPK store exists.
  irregular: buildCycleExportDays,
  conceive: buildConceiveExportDays,
  pregnancy: buildPregnancyExportDays,
  contraception: buildContraceptionExportDays,
  postpartum: buildPostpartumExportDays,
  loss: buildMiscarriageExportDays,
  menopause: buildMenopauseExportDays,
};

/** Builds either the CSV content or the PDF report model for the Medical
 * Export screen, from the ACTIVE OBJECTIVE's real canonical store(s),
 * filtered to exactly the period and categories the user selected — never
 * anything more, and never another objective's data. Returns
 * `{kind: 'empty'}` when there is nothing to export (no categories selected,
 * an invalid category for this objective, or no entry in range has any
 * recorded value for them), so the caller can show the existing clear
 * "no data" message instead of generating a misleading empty file. */
export async function buildMedicalExport(
  objective: ObjectiveId,
  period: ExportPeriod,
  format: 'csv' | 'pdf',
  selectedCategories: string[],
  now: Date = new Date(),
): Promise<MedicalExportResult> {
  const config = getExportConfigurationForObjective(objective);
  const validValues = new Set(config.categories.map(category => category.value));
  // Defensive: silently drops any category that isn't actually valid for
  // this objective — a UI bug could never smuggle a cross-objective
  // category value through to a reader.
  const categories = selectedCategories.filter(category => validValues.has(category));
  if (!categories.length) {return {kind: 'empty'};}

  const reader = READERS[objective];
  const {days, notices} = await reader(categories, period, now);

  const hasAnyData = days.some(day => day.categories.some(category => category.lines.length > 0));
  if (!hasAnyData) {return {kind: 'empty'};}

  // Filenames stay based on the shared dailyJournalStore's date range for
  // objectives that use it (cycle/irregular/conceive), and on the actually
  // exported days for objectives with their own dedicated store(s) — always
  // real dates, never a placeholder.
  const filenameSource = objective === 'cycle' || objective === 'irregular' || objective === 'conceive'
    ? await getAllJournalEntries()
    : days;
  const {fromKey, toKey} = computeExportFilenameDates(filenameSource, period, now);

  if (format === 'csv') {
    return {kind: 'csv', content: buildExportCsv(days, notices), fromKey, toKey};
  }

  const model = buildExportReportModel(
    days,
    config.label,
    PERIOD_LABELS[period],
    new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(now),
    notices,
  );
  return {kind: 'pdf', model, fromKey, toKey};
}
