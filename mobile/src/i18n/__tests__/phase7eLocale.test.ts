import i18n from '../index';
import {fr} from '../locales/fr';
import {resetAppLanguageForTests} from '../../state/themePreferences';

// Phase 7E (Profile / General Health / Personal Information / Appearance /
// Library chrome residual localization) — dictionary-level coverage for the
// `personalInformation.*`, `generalHealth.*` and `appearanceThemes.*`
// namespaces, plus the `library.featured.*` / `library.readingControls.*`
// keys merged into the pre-existing `library` namespace.

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST — Phase 7E dictionary French byte-identical to the original hardcoded copy', () => {
  it.each([
    ['personalInformation.title', 'Informations personnelles'],
    ['personalInformation.basicInfoSection', 'Informations de base'],
    ['personalInformation.preferencesSection', 'Préférences personnelles'],
    ['personalInformation.languageLabel', 'Langue'],
    ['personalInformation.timeFormatLabel', 'Format de l’heure'],
    ['personalInformation.calendars.doubleLabel', 'Double'],
    ['personalInformation.toastUpdated', 'Informations mises à jour ✓'],
    ['generalHealth.title', 'Santé générale'],
    ['generalHealth.physicalSectionTitle', 'Informations physiques'],
    ['generalHealth.medicalSectionTitle', 'Informations médicales'],
    ['generalHealth.goalsSectionTitle', 'Objectifs de santé'],
    ['generalHealth.bmiClasses.normal', 'Normal'],
    ['generalHealth.bmiClasses.insufficientData', 'Données insuffisantes'],
    ['generalHealth.toastUpdated', 'Informations mises à jour'],
    ['appearanceThemes.awa-original', 'Doux et harmonieux'],
    ['appearanceThemes.midnight', 'Profond et sophistiqué'],
    ['library.featured.momentBadge', 'ARTICLE DU MOMENT'],
    ['library.featured.newHeading', 'Nouveautés'],
    ['library.readingControls.notStartedTitle', 'Commencer la lecture'],
    ['library.readingControls.pauseButton', 'Mettre en pause'],
  ])('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });
});

describe('TEST — Phase 7E dictionary English coverage', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const namespaces: Array<[string, Record<string, unknown>]> = [
    ['personalInformation', fr.personalInformation],
    ['generalHealth', fr.generalHealth],
    ['appearanceThemes', fr.appearanceThemes],
  ];

  namespaces.forEach(([name, dict]) => {
    const allKeys = keyPaths(dict, name);

    it.each(allKeys)(`${name}: %s has a non-empty English string distinct from the raw key`, async key => {
      await i18n.changeLanguage('en');
      const value = i18n.t(key);
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
      expect(value).not.toBe(key);
      await i18n.changeLanguage('fr');
    });
  });

  const libraryFeaturedKeys = keyPaths(fr.library.featured, 'library.featured');
  const libraryReadingControlsKeys = keyPaths(fr.library.readingControls, 'library.readingControls');

  it.each([...libraryFeaturedKeys, ...libraryReadingControlsKeys])('%s has a non-empty English string distinct from the raw key', async key => {
    await i18n.changeLanguage('en');
    const value = i18n.t(key);
    expect(typeof value).toBe('string');
    expect((value as string).length).toBeGreaterThan(0);
    expect(value).not.toBe(key);
    await i18n.changeLanguage('fr');
  });
});

describe('TEST — COUNTRIES/CONDITIONS/ALLERGIES/GOALS stay outside the dictionary (no data migration)', () => {
  it('personalInformation has no countries namespace — the stored value IS the display string', () => {
    expect((fr.personalInformation as Record<string, unknown>).countries).toBeUndefined();
  });

  it('generalHealth has no conditions/allergies/goals namespace — the stored value IS the display string', () => {
    const dict = fr.generalHealth as Record<string, unknown>;
    expect(dict.conditions).toBeUndefined();
    expect(dict.allergies).toBeUndefined();
    expect(dict.goals).toBeUndefined();
  });
});
