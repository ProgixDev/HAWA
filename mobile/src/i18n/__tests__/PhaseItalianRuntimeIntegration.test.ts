import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../index';
import {en} from '../locales/en';
import {fr} from '../locales/fr';
import {es} from '../locales/es';
import {it as itDictionary} from '../locales/it';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import {
  WEEK_DAYS,
  WEEK_DAYS_EN,
  WEEK_DAYS_ES,
  WEEK_DAYS_IT,
  dateFormatLocale,
  formatFullDate,
  formatHijriDate,
  localizedWeekDays,
} from '../../utils/cycleMath';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {setCyclePreferences} from '../../state/onboardingPreferences';
import {buildCycleExportDays} from '../../services/medicalExportReaders';
import {buildExportCsv} from '../../services/medicalExportFormatting';

jest.mock('../../services/privateNotesEncryption', () => ({resolveNoteSection: jest.fn().mockResolvedValue({data: null})}));
jest.mock('../../services/privateJournalEncryption', () => ({resolveIntimacySection: jest.fn().mockResolvedValue({data: null})}));

// Italian integration — dictionary/runtime-level coverage (no React render):
// registration, English default + fallback, runtime switching, date/weekday
// localization, notification copy, export labels, categorical value display,
// AWA Insieme wording, the typed destructive-confirmation word, and the
// explicit English fallback for editorial content that has no Italian yet.

type AnyRecord = Record<string, unknown>;

function leaves(obj: AnyRecord, prefix = ''): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? leaves(value as AnyRecord, path)
      : [[path, String(value)] as [string, string]];
  });
}

const placeholders = (value: string) => (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).map(p => p.replace(/\s/g, '')).sort().join('|');
const t = (key: string, lng: AwaAppLanguage, options: AnyRecord = {}) => i18n.t(key, {lng, ...options}) as string;

async function switchLanguage(language: AwaAppLanguage) {
  await setAppLanguage(language);
  await i18n.changeLanguage(language);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('registration, default and fallback', () => {
  it('Italian is registered in i18next with the real it.ts dictionary', () => {
    expect(i18n.hasResourceBundle('it', 'translation')).toBe(true);
    expect(t('common.back', 'it')).toBe(itDictionary.common.back);
    expect(t('profile.awaADeuxTitle', 'it')).toBe(itDictionary.profile.awaADeuxTitle);
  });

  it('all four languages are registered side by side', () => {
    for (const lng of ['en', 'fr', 'es', 'it']) {
      expect(i18n.hasResourceBundle(lng, 'translation')).toBe(true);
    }
  });

  it('a fresh i18next instance is configured for English (lng and fallbackLng), not Italian', () => {
    let fresh!: typeof i18n;
    jest.isolateModules(() => {
      fresh = require('../index').default;
    });
    expect(fresh.options.lng).toBe('en');
    const fallback = fresh.options.fallbackLng;
    expect([fallback].flat()).toEqual(['en']);
  });

  it('fallbackLng stays English on the live instance', () => {
    const fallback = i18n.options.fallbackLng;
    expect([fallback].flat()).toContain('en');
    expect([fallback].flat()).not.toContain('fr');
    expect([fallback].flat()).not.toContain('es');
    expect([fallback].flat()).not.toContain('it');
  });

  it('a key missing in Italian falls back to ENGLISH — never French or Spanish (isolated instance using the real fallbackLng)', async () => {
    // A separate i18next instance: addResource on the shared instance would write
    // into the (by-reference) en/fr/es dictionary objects and pollute other tests.
    const probe = i18n.createInstance();
    await probe.init({
      resources: {
        en: {translation: {probe: 'English probe'}},
        fr: {translation: {probe: 'Sonde française'}},
        es: {translation: {probe: 'Sonda española'}},
        it: {translation: {}},
      },
      lng: 'it',
      fallbackLng: i18n.options.fallbackLng,
    });
    expect(probe.t('probe')).toBe('English probe');
  });

  it('it.ts has exactly the same leaf paths and placeholders as en.ts, fr.ts and es.ts', () => {
    const enLeaves = new Map(leaves(en as AnyRecord));
    const itLeaves = new Map(leaves(itDictionary as AnyRecord));
    expect(itLeaves.size).toBe(enLeaves.size);
    for (const other of [fr, es]) {
      expect(new Set(leaves(other as AnyRecord).map(([p]) => p))).toEqual(new Set(itLeaves.keys()));
    }
    const bad = [...enLeaves].filter(([path, value]) => placeholders(value) !== placeholders(itLeaves.get(path) ?? ''));
    expect(bad).toEqual([]);
  });

  it('Italian strings use the typographic apostrophe (no straight apostrophes) and no mojibake', () => {
    const offenders = leaves(itDictionary as AnyRecord).filter(([, value]) => value.includes("'") || /[ÃÂ�]/.test(value));
    expect(offenders).toEqual([]);
  });
});

describe('runtime switching EN -> IT -> FR -> ES -> IT', () => {
  it('each step resolves the same key to that language, with no restart', async () => {
    const key = 'appearance.languageRowTitle';
    const expectedFor = (language: AwaAppLanguage) => t(key, language);
    const sequence: AwaAppLanguage[] = ['en', 'it', 'fr', 'es', 'it'];
    const seen: string[] = [];
    for (const language of sequence) {
      await switchLanguage(language);
      expect(i18n.language).toBe(language);
      expect(i18n.t(key)).toBe(expectedFor(language));
      seen.push(i18n.t(key));
    }
    expect(new Set(seen).size).toBe(4);
  });
});

describe('Italian dates, weekdays and calendar headers', () => {
  const monday = new Date(2026, 9, 5);

  it('uses it-IT, and the other languages keep their locales', async () => {
    await switchLanguage('it');
    expect(dateFormatLocale()).toBe('it-IT');
    await switchLanguage('fr');
    expect(dateFormatLocale()).toBe('fr-FR');
    await switchLanguage('en');
    expect(dateFormatLocale()).toBe('en-US');
    await switchLanguage('es');
    expect(dateFormatLocale()).toBe('es-ES');
  });

  it('localizedWeekDays() is Monday-first Italian abbreviations, and other languages are unchanged', async () => {
    await switchLanguage('it');
    expect(localizedWeekDays()).toEqual(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']);
    expect(WEEK_DAYS_IT).toEqual(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']);
    await switchLanguage('fr');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS);
    await switchLanguage('en');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_EN);
    await switchLanguage('es');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_ES);
  });

  it('full weekday names are Italian: lunedì … domenica', async () => {
    await switchLanguage('it');
    const formatter = new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long'});
    const names = Array.from({length: 7}, (_, offset) => formatter.format(new Date(2026, 9, 5 + offset)));
    expect(names).toEqual(['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']);
  });

  it('month headers and full dates are Italian ("ottobre 2026", "5 ottobre 2026")', async () => {
    await switchLanguage('it');
    expect(new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long', year: 'numeric'}).format(monday)).toBe('ottobre 2026');
    expect(formatFullDate(monday)).toBe('5 ottobre 2026');
  });

  it('24-hour time and dates do not shift: stored date keys are language-independent', async () => {
    await switchLanguage('it');
    const keyIt = monday.toLocaleDateString('en-CA');
    await switchLanguage('fr');
    expect(monday.toLocaleDateString('en-CA')).toBe(keyIt);
    expect(keyIt).toBe('2026-10-05');
  });

  it('the Hijri date helper does not throw in Italian', async () => {
    await switchLanguage('it');
    expect(() => formatHijriDate(monday)).not.toThrow();
  });
});

describe('Italian notification copy', () => {
  it('channel and fallback copy are Italian', () => {
    expect(t('notifications.channelName', 'it')).toBe('Promemoria di AWA');
    expect(t('notifications.fallbackTitle', 'it')).toBe('Promemoria di AWA');
  });

  it.each([
    'notifications.cycle.upcomingPeriod.title',
    'notifications.cycle.ovulation.title',
    'notifications.conception.lhTest.title',
    'notifications.contraception.reminderTitle.pill',
    'notifications.menopause.dailyTracking.title',
  ])('%s resolves to Italian, not English/French/Spanish', key => {
    const italian = t(key, 'it');
    expect(italian).not.toBe(key);
    expect(italian).not.toContain('{{');
    for (const other of ['en', 'fr', 'es'] as const) {
      expect(italian).not.toBe(t(key, other));
    }
  });

  it('every notifications.* string has an Italian value with identical placeholders; none is left in English except documented cases', () => {
    const enNotifications = new Map(leaves((en as AnyRecord).notifications as AnyRecord));
    const itNotifications = new Map(leaves((itDictionary as AnyRecord).notifications as AnyRecord));
    expect([...itNotifications.keys()]).toEqual([...enNotifications.keys()]);
    const identical = [...enNotifications].filter(([path, value]) => itNotifications.get(path) === value && /[A-Za-z]{4,}/.test(value.replace(/\{\{[^}]*\}\}/g, '')));
    expect(identical).toEqual([]);
    for (const [path, value] of enNotifications) {
      expect(placeholders(itNotifications.get(path) ?? '')).toBe(placeholders(value));
    }
  });

  it('the Prayer/Qadaa/Nifas and AWA Insieme notification categories exist in Italian', () => {
    expect(t('inAppNotifications.category.qadaa', 'it')).toBe('Digiuno (Qadaa)');
    expect(t('inAppNotifications.category.nifas', 'it')).toBe('Nifas');
  });
});

describe('Italian export labels and categorical values', () => {
  const now = new Date('2026-08-25T12:00:00');

  beforeEach(async () => {
    await saveJournalSection('2026-08-20', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4});
    await setCyclePreferences({
      lastPeriodStart: new Date('2026-08-01T12:00:00'),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'yes',
    });
  });

  it('CSV headers, category label and value labels are Italian', async () => {
    await switchLanguage('it');
    const days = await buildCycleExportDays(['mood'], '3m', now);
    const csv = buildExportCsv(days.days, days.notices);
    expect(csv.split('\n')[0].trim()).toBe('data;categoria;valore');
    const moodDay = days.days.find(day => day.date === '2026-08-20');
    expect(moodDay?.categories.find(c => c.category === 'mood')?.label).toBe('Umore');
    expect(moodDay?.categories.find(c => c.category === 'mood')?.lines[0]).toBe('Umore : Bene');
  });

  it('the stored mood value is untouched by the export language (same stored string in every language)', async () => {
    const lines: Record<string, string | undefined> = {};
    for (const language of ['it', 'en', 'fr', 'es'] as const) {
      await switchLanguage(language);
      const days = await buildCycleExportDays(['mood'], '3m', now);
      lines[language] = days.days.find(d => d.date === '2026-08-20')?.categories.find(c => c.category === 'mood')?.lines[0];
    }
    expect(new Set(Object.values(lines)).size).toBe(4); // four different display strings…
    expect(lines.en).toBe('Mood : Good'); // …derived from one stored value, other languages unchanged
    expect(lines.fr).toBe('Humeur : Bien');
  });

  it('export section/enum dictionaries cover every English key in Italian', () => {
    const enExport = leaves((en as AnyRecord).export as AnyRecord).map(([p]) => p);
    const itExport = new Set(leaves((itDictionary as AnyRecord).export as AnyRecord).map(([p]) => p));
    expect(enExport.filter(p => !itExport.has(p))).toEqual([]);
  });

  it('stored French categorical values display as Italian labels; unknown values pass through; storage keys never change', () => {
    const italian = (key: string, options?: Record<string, unknown>) => t(key, 'it', options);
    expect(journalOptionLabel('cycleSymptom', 'Crampes', italian)).toBe('Crampi');
    expect(journalOptionLabel('cycleSymptom', 'Maux de tête', italian)).toBe('Mal di testa');
    expect(journalOptionLabel('cycleSymptom', 'valeur-inconnue', italian)).toBe('valeur-inconnue');
  });
});

describe('AWA Insieme wording', () => {
  const itLeaves = leaves(itDictionary as AnyRecord);

  it('the canonical product name is "AWA Insieme" and no other language’s name leaks in', () => {
    expect(itDictionary.profile.awaADeuxTitle).toBe('AWA Insieme');
    const leaked = itLeaves.filter(([, value]) => /AWA Together|AWA à deux|AWA Pareja/.test(value));
    expect(leaked).toEqual([]);
    expect(itLeaves.some(([, value]) => value.includes('AWA Insieme'))).toBe(true);
  });

  it('the invitation flow remains email-only: no PIN / QR / manual-code strings in the Italian pairing copy', () => {
    const pairing = leaves((itDictionary.awaADeux as AnyRecord).pairing as AnyRecord);
    const enPairing = leaves(((en.awaADeux as unknown) as AnyRecord).pairing as AnyRecord);
    expect(pairing.map(([p]) => p)).toEqual(enPairing.map(([p]) => p));
    expect(pairing.filter(([, value]) => /\bPIN\b|\bQR\b|codice di (abbinamento|associazione)|inserisci il codice/i.test(value))).toEqual([]);
  });

  it('partner-name wording helpers have Italian neutral labels', () => {
    expect(t('awaADeux.neutralPartnerLabel', 'it')).toBe('il tuo partner');
    expect(t('awaADeux.neutralPartnerSubject', 'it')).toBe('Il tuo partner');
  });
});

describe('typed destructive-confirmation word', () => {
  it('Italian uses ELIMINA for both destructive flows, sourced from the dictionary', () => {
    expect(itDictionary.backupUtility.delete.confirmWord).toBe('ELIMINA');
    expect(itDictionary.dataPrivacy.deleteAccount.confirmWord).toBe('ELIMINA');
    expect(t('backupUtility.delete.confirmWord', 'it')).toBe('ELIMINA');
  });

  it('the other languages keep their own words (no cross-contamination)', () => {
    expect(t('backupUtility.delete.confirmWord', 'en')).toBe('DELETE');
    expect(t('backupUtility.delete.confirmWord', 'fr')).toBe('SUPPRIMER');
    expect(t('backupUtility.delete.confirmWord', 'es')).toBe('ELIMINAR');
  });
});

describe('editorial content: explicit English fallback, never French or Spanish', () => {
  it('pregnancy week data now has real Italian content, distinct from English, French and Spanish', () => {
    for (const week of [4, 12, 20, 40]) {
      const italian = getPregnancyWeekData(week, 'it');
      expect(italian?.babyDescription).toBeTruthy();
      for (const other of ['en', 'fr', 'es'] as const) {
        expect(italian?.babyDescription).not.toBe(getPregnancyWeekData(week, other)?.babyDescription);
      }
    }
  });

  it('pregnancy week data for an unrecognized language is the English content — never French, Spanish or Italian', () => {
    for (const week of [4, 12, 20, 40]) {
      for (const invalid of ['de', 'IT', 'it-IT', '', undefined, null]) {
        expect(getPregnancyWeekData(week, invalid as never)).toEqual(getPregnancyWeekData(week, 'en'));
      }
    }
  });

  it('legal documents have no Italian text yet — the screen resolves Italian to English (TERMS/PRIVACY only have fr/en/es)', () => {
    expect(Object.keys(TERMS).sort()).toEqual(['en', 'es', 'fr']);
    expect(Object.keys(PRIVACY).sort()).toEqual(['en', 'es', 'fr']);
  });
});
