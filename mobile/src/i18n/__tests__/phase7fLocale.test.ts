import i18n from '../index';
import {fr} from '../locales/fr';
import {resetAppLanguageForTests} from '../../state/themePreferences';

// Phase 7F (Prayer / Hijri / Qadaa / spiritual feature localization) —
// dictionary-level coverage for the `prayerTimes.*`, `hijriCalendar.*` and
// `qadaa.*` namespaces. Prayer names (Fajr/Dhuhr/Asr/Maghrib/Isha) are never
// part of this dictionary — they're already the universal Arabic-
// transliterated form rendered directly from services/prayerTimes.ts's
// PrayerName type in both languages.

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST — Phase 7F dictionary French byte-identical to the original hardcoded copy', () => {
  it.each([
    ['prayerTimes.title', 'Horaires de prière'],
    ['prayerTimes.schedule.title', 'Horaires du jour'],
    ['prayerTimes.purity.title', 'Statut de pureté'],
    ['prayerTimes.purity.pureTitle', 'Pureté retrouvée'],
    ['prayerTimes.aboutHijri', 'À propos du calendrier Hijri'],
    ['hijriCalendar.title', 'Calendrier Hijri'],
    ['hijriCalendar.ramadanPill', 'Ramadan'],
    ['hijriCalendar.shortcutsTitle', 'Repères spirituels'],
    ['qadaa.title', 'Jeûnes à rattraper'],
    ['qadaa.eyebrow', 'JEÛNES À RATTRAPER'],
    ['qadaa.allHamdulillahSubtitle', 'Al-hamdulillah, tu es à jour dans tes jeûnes à rattraper.'],
    ['qadaa.aboutText', 'Les jours de jeûne manqués à cause des règles pendant Ramadan doivent être rattrapés plus tard. Allâh sait mieux.'],
    ['qadaa.allMadeUp', 'Tout est rattrapé'],
    ['qadaa.previousBalance', 'Ancien solde'],
  ])('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });

  it.each([
    ['qadaa.dayCount', {count: 1}, '1 jour'],
    ['qadaa.dayCount', {count: 2}, '2 jours'],
    ['qadaa.remainingDays', {count: 1}, '1 jour restant'],
    ['qadaa.remainingDays', {count: 5}, '5 jours restants'],
    ['qadaa.addedManually', {count: 1}, '1 jour ajouté manuellement'],
    ['qadaa.addedManually', {count: 2}, '2 jours ajoutés manuellement'],
    ['qadaa.ramadanYearHijri', {year: 1445}, 'Ramadan 1445 AH'],
    ['qadaa.ramadanYearGregorian', {year: 2018}, 'Ramadan 2018'],
  ])('%s(%o) → %s', (key, options, expected) => {
    expect(i18n.t(key, options)).toBe(expected);
  });
});

describe('TEST — Phase 7F dictionary English coverage', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const namespaces: Array<[string, Record<string, unknown>]> = [
    ['prayerTimes', fr.prayerTimes],
    ['hijriCalendar', fr.hijriCalendar],
    ['qadaa', fr.qadaa],
  ];

  namespaces.forEach(([name, dict]) => {
    const allKeys = keyPaths(dict, name);

    it.each(allKeys)(`${name}: %s has a non-empty English string distinct from the raw key`, async key => {
      await i18n.changeLanguage('en');
      // Plural keys need a `count` to resolve — probe with 1 and 2.
      const value = /_one$|_other$/.test(key) ? i18n.t(key.replace(/_one$|_other$/, ''), {count: key.endsWith('_one') ? 1 : 2}) : i18n.t(key);
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
      expect(value).not.toBe(key);
      await i18n.changeLanguage('fr');
    });
  });
});

describe('TEST — prayer names are never part of this dictionary (Fajr/Dhuhr/Asr/Maghrib/Isha stay untranslated)', () => {
  it('no prayerTimes/hijriCalendar/qadaa key holds a prayer name as its own value', () => {
    const allText = JSON.stringify([fr.prayerTimes, fr.hijriCalendar, fr.qadaa]);
    // The names only ever appear inside interpolation placeholders like
    // {{prayerName}}, never as a literal translated value of their own.
    expect(allText).not.toMatch(/"(Fajr|Dhuhr|Asr|Maghrib|Isha)"/);
  });
});
