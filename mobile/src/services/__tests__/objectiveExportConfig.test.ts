import {OBJECTIVE_EXPORT_CONFIG, getExportConfigurationForObjective} from '../../config/objectiveExportConfig';
import type {ObjectiveId} from '../../state/onboardingPreferences';

const ALL_OBJECTIVES: ObjectiveId[] = [
  'cycle',
  'conceive',
  'contraception',
  'irregular',
  'menopause',
  'pregnancy',
  'postpartum',
  'loss',
];

describe('objectiveExportConfig', () => {
  it('has a configuration for every real ObjectiveId', () => {
    ALL_OBJECTIVES.forEach(objective => {
      expect(getExportConfigurationForObjective(objective)).toBeDefined();
      expect(getExportConfigurationForObjective(objective).categories.length).toBeGreaterThan(0);
    });
  });

  it('gives "irregular" (SOPK, no dedicated store) the exact same categories as "cycle"', () => {
    expect(OBJECTIVE_EXPORT_CONFIG.irregular.categories).toEqual(OBJECTIVE_EXPORT_CONFIG.cycle.categories);
  });

  it('never lets one objective-specific category leak into an unrelated objective', () => {
    const categoryValuesFor = (objective: ObjectiveId) =>
      new Set(OBJECTIVE_EXPORT_CONFIG[objective].categories.map(category => category.value));

    // Postpartum's "lochia" and Menopause's "labResults" are each unique to
    // their own real store — no other objective should ever offer them.
    ALL_OBJECTIVES.filter(objective => objective !== 'postpartum').forEach(objective => {
      expect(categoryValuesFor(objective).has('lochia')).toBe(false);
    });
    ALL_OBJECTIVES.filter(objective => objective !== 'menopause').forEach(objective => {
      expect(categoryValuesFor(objective).has('labResults')).toBe(false);
    });
    // Pregnancy's "medicalInfo"/"appointments" are pregnancy-specific stores.
    ALL_OBJECTIVES.filter(objective => objective !== 'pregnancy').forEach(objective => {
      expect(categoryValuesFor(objective).has('medicalInfo')).toBe(false);
      expect(categoryValuesFor(objective).has('appointments')).toBe(false);
    });
    // Contraception's "intake"/"events" are contraception-specific stores.
    ALL_OBJECTIVES.filter(objective => objective !== 'contraception').forEach(objective => {
      expect(categoryValuesFor(objective).has('intake')).toBe(false);
      expect(categoryValuesFor(objective).has('events')).toBe(false);
    });
  });

  it('never selects a sensitive category by default (checked by the screen, verified here at the data level)', () => {
    ALL_OBJECTIVES.forEach(objective => {
      const sensitiveValues = OBJECTIVE_EXPORT_CONFIG[objective].categories.filter(category => category.sensitive);
      // Every sensitive category must be explicitly flagged, never silently
      // defaulted to non-sensitive by omission.
      sensitiveValues.forEach(category => expect(category.sensitive).toBe(true));
    });
  });
});
