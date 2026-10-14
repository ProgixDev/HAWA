import fs from 'fs';
import path from 'path';
import vm from 'vm';
import ts from 'typescript';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../index';
import {en} from '../locales/en';
import {fr} from '../locales/fr';
import {es} from '../locales/es';
import {it as itDictionary} from '../locales/it';
import {tr} from '../locales/tr';
import {ru} from '../locales/ru';
import {de} from '../locales/de';
import {
  getAppLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {
  WEEK_DAYS,
  WEEK_DAYS_DE,
  WEEK_DAYS_EN,
  WEEK_DAYS_ES,
  WEEK_DAYS_IT,
  WEEK_DAYS_RU,
  WEEK_DAYS_TR,
  capitalize,
  dateFormatLocale,
  formatFullDate,
  formatHijriDate,
  formatShortDate,
  localizedWeekDays,
} from '../../utils/cycleMath';
import {foldForConfirmation, lowerCaseFor, upperCaseFor} from '../../utils/textCase';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_GERMAN,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import {AwaPluralRulesForTests} from '../pluralRules';
import {phaseLabelFontSize} from '../../components/home/CycleProgressRing';

// German (de) — dictionary, plurals, runtime, persistence, dates and case rules, editorial content, images, legal text.

type AnyRecord = Record<string, unknown>;

function leaves(obj: AnyRecord, prefix = ''): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? leaves(value as AnyRecord, keyPath)
      : [[keyPath, String(value)] as [string, string]];
  });
}
const placeholders = (value: string) => (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).map(p => p.replace(/\s/g, '')).sort().join('|');
const tOf = (key: string, lng: AwaAppLanguage, options: AnyRecord = {}) => i18n.t(key, {lng, ...options}) as string;

async function freshLaunchLanguage(): Promise<string> {
  let fresh: typeof import('../../state/themePreferences') | undefined;
  jest.isolateModules(() => {
    fresh = require('../../state/themePreferences');
  });
  await fresh!.hydrateAppearancePreferences();
  return fresh!.getAppLanguage();
}

const enLeaves = leaves(en as AnyRecord);
const deLeaves = leaves(de as AnyRecord);
const deMap = new Map(deLeaves);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('de.ts has exactly the same leaf paths as en.ts and every other dictionary (no missing, no extra)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(de as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
  });

  it('every German value is a non-empty string (the only intentionally empty English values stay empty)', () => {
    const empty = deLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => placeholders(value) !== placeholders(deMap.get(keyPath) as string))
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in German', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((deMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural groups are _one/_other pairs with the same variables (German has exactly the English two forms)', () => {
    const ones = deLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(deMap.has(other)).toBe(true);
      const withoutCount = (value: string) => placeholders(value).split('|').filter(name => name !== '{{count}}').join('|');
      expect(withoutCount(deMap.get(one) as string)).toBe(withoutCount(deMap.get(other) as string));
      const english = enLeaves.find(([keyPath]) => keyPath === one)?.[1] ?? '';
      if (english.includes('{{count}}')) {
        expect(deMap.get(one)).toContain('{{count}}');
        expect(deMap.get(other)).toContain('{{count}}');
      }
    }
    // no stray Russian-style forms
    expect(deLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real German: umlauts and ß appear, nothing is transliterated ("ae/oe/ue") in common words, no mojibake', () => {
    const all = deLeaves.map(([, value]) => value).join(' ');
    for (const letter of ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü']) {
      expect(all).toContain(letter);
    }
    for (const wrong of [/\bfuer\b/i, /\bueber\b/i, /\bSchwangerschaftswoche\b.*\bwoechentlich\b/i, /\bkoennen\b/i, /\bmoechte\b/i, /\bwaehlen\b/i]) {
      expect(wrong.test(all)).toBe(false);
    }
    const mojibake = deLeaves.filter(([, value]) => /Ã[\u0080-¿]|Â[\u0080-¿]|�|\\u[0-9a-f]{4}/i.test(value)).map(([keyPath]) => keyPath);
    expect(mojibake).toEqual([]);
    expect(deLeaves.filter(([, value]) => /[А-Яа-яЁё]/.test(value) && !enLeaves.some(([, e]) => e === value)).map(([k]) => k)).toEqual([]);
  });

  it('no French, English, Spanish or Italian sentence was left behind in a German string', () => {
    const FOREIGN = new Set(
      ('pour avec vous votre vos tes des les une est dans sur cette ces nous elle être tout plus mais ' +
        'para con los las una del por que como más pero sus tus esta este estos también cuando ' +
        'della delle degli gli nel nella sono che questo questa tuo tua tuoi non anche quando dal dei ' +
        'the and your you with for this that are have will can not').split(' '),
    );
    const leaked = deLeaves
      .filter(([, value]) => value.toLowerCase().split(/[^a-zäöüßàâçéèêëîïôûù]+/).filter(word => FOREIGN.has(word)).length >= 3)
      .map(([keyPath, value]) => `${keyPath}: ${value.slice(0, 70)}`);
    expect(leaked).toEqual([]);
  });

  it('strings identical to English are brand names, endonyms, symbols or very short labels only (never a sentence)', () => {
    const sentences = enLeaves
      .filter(([keyPath, value]) => deMap.get(keyPath) === value && /[A-Za-z]{4,}/.test(value) && value.split(/\s+/).length > 4)
      .map(([keyPath, value]) => `${keyPath}: ${value}`);
    expect(sentences).toEqual([]);
  });

  it('uses a consistent informal "du": no formal-address forms (Ihnen/Ihrem, "Sie können/sollten/…")', () => {
    // "Sie"/"Ihre" alone also mean "she/they/her" (third person: daughter profile, partner, "they stay on this device"),
    // so only the forms that can only be the polite "you" are rejected.
    const formal = deLeaves
      .filter(([, value]) => /\b(Ihnen|Ihrem)\b/.test(value) || /\bSie (können|sollten|möchten|müssen|dürfen|wollen|erhalten|finden|sehen|haben Ihre)\b/.test(value))
      .map(([k, v]) => `${k}: ${v.slice(0, 60)}`);
    expect(formal).toEqual([]);
    expect(deLeaves.filter(([, value]) => /"[^"\n]{2,}"/.test(value)).map(([k]) => k)).toEqual([]); // „…“, never straight quotes
  });

  it('the product wording is German and consistent: «AWA Gemeinsam», «LÖSCHEN», «Deutsch»', () => {
    expect(deLeaves.filter(([, value]) => /AWA (Together|Pareja|Insieme|à deux|Birlikte|Вместе)/.test(value))).toEqual([]);
    expect(deMap.get('dataPrivacy.deleteAccount.confirmWord')).toBe('LÖSCHEN');
    for (const dictionary of [en, fr, es, itDictionary, tr, ru, de]) {
      expect((dictionary as AnyRecord & {appearance: {language: {germanName: string}}}).appearance.language.germanName).toBe('Deutsch');
    }
  });

  it('the core vocabulary follows the glossary', () => {
    expect(deMap.get('navigation.home')).toBeTruthy();
    expect(deMap.get('navigation.statistics')).toBe('Statistik');
    expect(deMap.get('navigation.calendar')).toBe('Kalender');
    expect(deMap.get('navigation.profile')).toBe('Profil');
    const joined = deLeaves.map(([, v]) => v.toLowerCase()).join(' ');
    for (const term of ['zyklus', 'eisprung', 'schwangerschaft', 'wochenbett', 'symptom', 'erinnerung', 'benachrichtigung', 'wechseljahre', 'verhütung']) {
      expect(joined).toContain(term);
    }
  });
});

describe('German plurals (one / other)', () => {
  it('i18next picks "1 Tag" / "2 Tage" for a real key, including 0 and large numbers', () => {
    const key = 'statistics.daysPlural';
    const one = deMap.get(`${key}_one`) as string;
    const other = deMap.get(`${key}_other`) as string;
    expect(tOf(key, 'de', {count: 1})).toBe(one.replace('{{count}}', '1'));
    for (const n of [0, 2, 5, 11, 21, 25]) {
      expect(tOf(key, 'de', {count: n})).toBe(other.replace('{{count}}', String(n)));
    }
    expect(one).not.toBe(other);
  });

  it('the on-device fallback (engines without Intl.PluralRules) gives German the one/other rule', () => {
    const rules = new AwaPluralRulesForTests('de-DE');
    expect(rules.select(1)).toBe('one');
    for (const n of [0, 2, 5, 11, 21, 100]) {
      expect(rules.select(n)).toBe('other');
    }
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });
});

describe('registration, default, fallback and persistence', () => {
  it('German is registered with the real de.ts dictionary next to the six others', () => {
    const bundle = i18n.getResourceBundle('de', 'translation') as AnyRecord;
    expect(bundle).toBeTruthy();
    expect(leaves(bundle).length).toBe(deLeaves.length);
    for (const language of ['en', 'fr', 'es', 'it', 'tr', 'ru', 'de']) {
      expect(i18n.hasResourceBundle(language, 'translation')).toBe(true);
    }
  });

  it('English stays the default language and the fallback', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
    expect(getAppLanguage()).toBe('en');
  });

  it('a key missing in German falls back to ENGLISH — never French, Spanish, Italian, Turkish or Russian', async () => {
    const instance = i18n.createInstance();
    await instance.init({
      resources: {en: {translation: {only: 'English only'}}, de: {translation: {}}, fr: {translation: {only: 'Français'}}},
      lng: 'de',
      fallbackLng: 'en',
    });
    expect(instance.t('only')).toBe('English only');
  });

  it('German can be selected, is persisted and survives a restart; every language still works', async () => {
    await setAppLanguage('de');
    expect(getAppLanguage()).toBe('de');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('de');
    expect(await freshLaunchLanguage()).toBe('de');
    for (const language of ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de'] as AwaAppLanguage[]) {
      await setAppLanguage(language);
      expect(getAppLanguage()).toBe(language);
      expect(await freshLaunchLanguage()).toBe(language);
    }
  });

  it('selecting German updates the live UI immediately and does not touch stored user data', async () => {
    await AsyncStorage.setItem('@hawa/personal-information/v1', JSON.stringify({marker: 'keep-me'}));
    await setAppLanguage('de');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(i18n.language).toBe('de');
    expect(i18n.t('common.save')).toBe(deMap.get('common.save'));
    expect(await AsyncStorage.getItem('@hawa/personal-information/v1')).toBe(JSON.stringify({marker: 'keep-me'}));
    await setAppLanguage('fr');
    await setAppLanguage('de');
    expect(await AsyncStorage.getItem('@hawa/personal-information/v1')).toBe(JSON.stringify({marker: 'keep-me'}));
  });

  it('existing stored languages are preserved and an invalid value never becomes German', async () => {
    for (const stored of ['fr', 'en', 'es', 'it', 'tr', 'ru']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', stored);
      expect(await freshLaunchLanguage()).toBe(stored);
    }
    for (const invalid of ['de-DE', 'DE', 'german', 'deutsch', '']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', invalid);
      expect(await freshLaunchLanguage()).toBe('en');
    }
    await AsyncStorage.removeItem('@awa/appearance/language-v1');
    expect(await freshLaunchLanguage()).toBe('en');
  });

  it('is never chosen automatically (no device, SIM, IP or location based detection)', async () => {
    expect(await freshLaunchLanguage()).toBe('en');
    for (const relative of ['src/services/countryDetection.ts', 'src/i18n/index.ts', 'src/state/themePreferences.ts']) {
      const file = path.join(__dirname, '..', '..', '..', relative);
      if (!fs.existsSync(file)) {continue;}
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(/setAppLanguage\(\s*['"]de['"]/);
    }
  });

  it('switches at runtime: EN -> DE -> FR -> DE with no restart', async () => {
    expect(tOf('common.save', 'en')).toBe('Save');
    await i18n.changeLanguage('de');
    expect(i18n.t('common.save')).toBe(deMap.get('common.save'));
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe(fr.common.save);
    await i18n.changeLanguage('de');
    expect(i18n.t('common.save')).toBe(deMap.get('common.save'));
  });
});

describe('German dates, weekdays and time', () => {
  const sample = new Date(2026, 9, 5, 12); // Monday 5 October 2026

  it('uses de-DE and leaves the other languages’ locales alone', async () => {
    await setAppLanguage('de');
    expect(dateFormatLocale()).toBe('de-DE');
    for (const [language, locale] of [['en', 'en-US'], ['fr', 'fr-FR'], ['es', 'es-ES'], ['it', 'it-IT'], ['tr', 'tr-TR'], ['ru', 'ru-RU']] as const) {
      await setAppLanguage(language);
      expect(dateFormatLocale()).toBe(locale);
    }
  });

  it('weekdays are Monday-first German abbreviations, and the others are unchanged', async () => {
    expect(WEEK_DAYS_DE).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    await setAppLanguage('de');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_DE);
    await setAppLanguage('ru');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_RU);
    await setAppLanguage('tr');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_TR);
    await setAppLanguage('it');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_IT);
    await setAppLanguage('es');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_ES);
    await setAppLanguage('en');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_EN);
    await setAppLanguage('fr');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS);
  });

  it('full weekday and month names are German (March is „März“, with the umlaut)', async () => {
    await setAppLanguage('de');
    const weekday = (offset: number) =>
      new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long'}).format(new Date(2026, 9, 5 + offset, 12));
    expect([0, 1, 2, 3, 4, 5, 6].map(offset => capitalize(weekday(offset)))).toEqual([
      'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
    ]);
    const months = Array.from({length: 12}, (_, month) =>
      new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long'}).format(new Date(2026, month, 15, 12)));
    expect(months).toEqual([
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
    ]);
  });

  it('short and long dates read in German („5. Oktober“); stored date keys are language-independent', async () => {
    await setAppLanguage('de');
    expect(formatShortDate(sample)).toBe('5. Oktober');
    expect(formatFullDate(sample)).toBe('5. Oktober 2026');
    const key = sample.toLocaleDateString('en-CA');
    await setAppLanguage('en');
    expect(sample.toLocaleDateString('en-CA')).toBe(key);
    expect(key).toBe('2026-10-05');
  });

  it('times use the 24-hour clock in German (00:30 is never „24:30“)', async () => {
    await setAppLanguage('de');
    const evening = new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(2026, 9, 5, 18, 5));
    const midnight = new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(2026, 9, 5, 0, 30));
    expect(evening).toBe('18:05');
    expect(midnight).toBe('00:30');
  });

  it('the Hijri helper does not throw in German', async () => {
    await setAppLanguage('de');
    expect(() => formatHijriDate(sample)).not.toThrow();
  });

  it('umlauts and ß survive capitalization and case folding', async () => {
    await setAppLanguage('de');
    expect(capitalize('übersicht')).toBe('Übersicht');
    expect(capitalize('äpfel')).toBe('Äpfel');
    expect(upperCaseFor('löschen', 'de')).toBe('LÖSCHEN');
    expect(lowerCaseFor('LÖSCHEN', 'de')).toBe('löschen');
    expect(upperCaseFor('straße', 'de')).toBe('STRASSE'); // JS rule: ß has no capital form in this runtime
    expect(upperCaseFor('iyi', 'de')).toBe('IYI'); // Turkish i-rules stay Turkish-only
  });

  it('the typed destructive-confirmation word accepts every way it may be typed', () => {
    const expected = foldForConfirmation('LÖSCHEN', 'de');
    for (const typed of ['LÖSCHEN', 'löschen', 'Löschen', ' löschen ']) {
      expect(foldForConfirmation(typed, 'de')).toBe(expected);
    }
    expect(foldForConfirmation('loeschen', 'de')).not.toBe(expected);
  });
});

describe('cycle ring label: long German/Russian phase names are shrunk, never broken mid-word', () => {
  it('keeps the original size for every name that already fits (fr/en/es/it/tr/short German)', () => {
    for (const label of ['Follicular phase', 'Phase folliculaire', 'Fase folicular', 'Fase follicolare', 'Foliküler faz', 'Eisprung', 'Periode', 'Lutealphase', 'Овуляция']) {
      expect(phaseLabelFontSize(label, 116)).toBe(9.5);
    }
  });

  it('scales long single words down (Фолликулярная, Follikelphase, Menstruationsphase) within the 7–9.5 band', () => {
    const russian = phaseLabelFontSize('Фолликулярная фаза', 116);
    expect(russian).toBeLessThan(9.5);
    expect(russian).toBeGreaterThanOrEqual(7);
    expect(phaseLabelFontSize('Follikelphase', 116)).toBeLessThanOrEqual(9.5);
    expect(phaseLabelFontSize('Menstruationsphase', 116)).toBe(7);
    expect(phaseLabelFontSize(null, 116)).toBe(9.5);
  });

  it('bottom-navigation labels stay short enough for a 360 dp tab (no mid-word break, no ellipsis)', () => {
    for (const key of ['navigation.home', 'navigation.calendar', 'navigation.statistics', 'navigation.profile']) {
      const label = deMap.get(key) as string;
      expect(label.length).toBeLessThanOrEqual(10);
      expect(label).not.toMatch(/\s/);
    }
    // the primary buttons that share a row with another control are single short words
    for (const key of ['common.save', 'common.cancel', 'common.continue', 'common.apply', 'common.back', 'common.close']) {
      expect((deMap.get(key) as string).length).toBeLessThanOrEqual(14);
    }
  });

  it('German phase names in the dictionary are short enough for the ring', () => {
    for (const key of ['cyclePhase.menstruation', 'cyclePhase.follicular', 'cyclePhase.ovulation', 'cyclePhase.luteal']) {
      const label = deMap.get(key) as string;
      expect(label).toBeTruthy();
      const longest = Math.max(...label.split(/\s+/).map(word => word.length));
      expect([key, longest <= 14]).toEqual([key, true]);
    }
  });
});

describe('editorial content: library articles, pregnancy weeks, legal text', () => {
  const libraryDir = path.join(__dirname, '..', '..', 'screens', 'library');
  const articleFiles = fs.readdirSync(libraryDir).filter(file => file.endsWith('ArticleScreen.tsx'));

  const contentOf = (file: string): {en: unknown; de: unknown} | null => {
    const source = fs.readFileSync(path.join(libraryDir, file), 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2019, true, ts.ScriptKind.TSX);
    let found: {en: unknown; de: unknown} | null = null;
    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node) && !found) {
        const props = node.properties.filter(ts.isPropertyAssignment);
        const named = (name: string) => props.find(property => property.name.getText() === name);
        const enProp = named('en');
        const ruProp = named('ru');
        const deProp = named('de');
        if (enProp && ruProp && deProp && ts.isObjectLiteralExpression(enProp.initializer) && ts.isObjectLiteralExpression(deProp.initializer)) {
          const evaluate = (n: ts.Node) => vm.runInNewContext(`(${source.slice(n.getStart(), n.getEnd())})`);
          found = {en: evaluate(enProp.initializer), de: evaluate(deProp.initializer)};
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return found;
  };

  const shape = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(shape)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value as AnyRecord).map(([key, child]) => [key, shape(child)]))
        : typeof value;
  const strings = (value: unknown): string[] =>
    typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(strings) : value && typeof value === 'object' ? Object.values(value as AnyRecord).flatMap(strings) : [];

  it('resolveEditorialLanguage knows German and still defaults to English', () => {
    expect(resolveEditorialLanguage('de')).toBe('de');
    for (const language of ['fr', 'es', 'it', 'tr', 'ru', 'en']) {
      expect(resolveEditorialLanguage(language)).toBe(language);
    }
    for (const other of ['nl', '', null, undefined, 'de-DE']) {
      expect(resolveEditorialLanguage(other as string | null | undefined)).toBe('en');
    }
  });

  it('all 72 localized library articles have a German block with exactly the English structure', () => {
    const withContent = articleFiles.map(file => [file, contentOf(file)] as const);
    const missing = withContent.filter(([, content]) => content === null).map(([file]) => file);
    // UnderstandCycleArticleScreen is the legacy, French-original screen with its own CONTENT shape (checked separately).
    expect(missing.filter(file => file !== 'UnderstandCycleArticleScreen.tsx')).toEqual([]);
    expect(withContent.filter(([, content]) => content !== null).length).toBe(72);
    const different = withContent
      .filter(([, content]) => content !== null)
      .filter(([, content]) => JSON.stringify(shape((content as {en: unknown}).en)) !== JSON.stringify(shape((content as {de: unknown}).de)))
      .map(([file]) => file);
    expect(different).toEqual([]);
  });

  it('every German article is actually translated: it differs from English in the vast majority of strings', () => {
    const offenders: string[] = [];
    let umlauts = 0;
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const german = strings(content.de);
      const same = english.filter((value, index) => value === german[index] && /[A-Za-z]{4,}/.test(value)).length;
      if (same / Math.max(english.length, 1) > 0.1) {offenders.push(`${file}: ${same}/${english.length}`);}
      german.forEach(value => {
        umlauts += (value.match(/[äöüßÄÖÜ]/g) ?? []).length;
      });
    }
    expect(offenders).toEqual([]);
    expect(umlauts).toBeGreaterThan(3000);
  });

  it('German articles keep the numbers and placeholders of the English text', () => {
    const wrong: string[] = [];
    const numbers = (text: string) => (text.replace(/\{\{[^}]*\}\}/g, ' ').match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const german = strings(content.de);
      english.forEach((value, index) => {
        if (placeholders(value) !== placeholders(german[index] ?? '')) {wrong.push(`${file}#${index}`);}
        if (numbers(value) !== numbers(german[index] ?? '')) {wrong.push(`${file}#${index} numbers`);}
      });
    }
    expect(wrong).toEqual([]);
  });

  it('all 41 pregnancy weeks resolve to German content with the English fields, distinct from every other language', () => {
    for (let week = 1; week <= 41; week += 1) {
      const german = getPregnancyWeekData(week, 'de');
      const english = getPregnancyWeekData(week, 'en');
      expect(german).toBeDefined();
      expect(Object.keys(german as object).sort()).toEqual(Object.keys(english as object).sort());
      expect(german?.babyDescription).not.toBe(english?.babyDescription);
      expect(german?.bodyChanges).toHaveLength((english?.bodyChanges ?? []).length);
      expect(german?.toKnow).toHaveLength((english?.toKnow ?? []).length);
      expect(german?.week).toBe(week);
      expect(german?.babyImage).toBe(english?.babyImage);
      expect(german?.sourceRefs).toEqual(english?.sourceRefs);
      for (const other of ['fr', 'es', 'it', 'tr', 'ru'] as const) {
        expect(german?.babyDescription).not.toBe(getPregnancyWeekData(week, other)?.babyDescription);
      }
    }
  });

  it('pregnancy week figures are preserved exactly (decimal comma only)', () => {
    const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (let week = 1; week <= 41; week += 1) {
      const german = getPregnancyWeekData(week, 'de');
      const english = getPregnancyWeekData(week, 'en');
      for (const field of ['length', 'comparison'] as const) {
        if (english?.[field]) {
          expect([week, field, numbers(String(german?.[field] ?? ''))]).toEqual([week, field, numbers(String(english[field]))]);
        }
      }
      expect(numbers([german?.babyDescription, ...(german?.bodyChanges ?? []), ...(german?.toKnow ?? [])].join(' '))).toBe(
        numbers([english?.babyDescription, ...(english?.bodyChanges ?? []), ...(english?.toKnow ?? [])].join(' ')),
      );
    }
  });

  it('legal placeholder text exists in German with the same sections as English', () => {
    expect(Object.keys(TERMS).sort()).toEqual(['de', 'en', 'es', 'fr', 'ru', 'tr', 'zh']);
    expect(Object.keys(PRIVACY).sort()).toEqual(['de', 'en', 'es', 'fr', 'ru', 'tr', 'zh']);
    expect(TERMS.de).toHaveLength(TERMS.en.length);
    expect(PRIVACY.de).toHaveLength(PRIVACY.en.length);
    TERMS.de.concat(PRIVACY.de).forEach(section => {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.body.trim().length).toBeGreaterThan(0);
    });
    expect(TERMS.de[0].title).not.toBe(TERMS.en[0].title);
  });
});

describe('text-in-image illustrations', () => {
  it('German uses the English artwork explicitly (no German lettering exists) and says so in the description', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'de')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'de')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_GERMAN].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const key of ['pregnancyFollowUp', 'pregnancyExercise', 'exercise'] as const) {
      const alt = EDITORIAL_IMAGE_ALT[key].de;
      expect(alt).toMatch(/^Illustration:/);
      expect(alt).toContain('auf Englisch');
      expect(alt).not.toBe(EDITORIAL_IMAGE_ALT[key].en);
    }
  });
});

describe('categorical labels and journal options', () => {
  it('stored French values display as German labels and unknown values pass through; storage never changes', async () => {
    await setAppLanguage('de');
    await i18n.changeLanguage('de');
    const t = i18n.t.bind(i18n) as (key: string, options?: AnyRecord) => string;
    const label = journalOptionLabel('cycleSymptom', 'Crampes', t as never);
    expect(label).not.toBe('Crampes');
    expect(label.trim().length).toBeGreaterThan(0);
    expect(journalOptionLabel('cycleSymptom', 'valeur-inconnue', t as never)).toBe('valeur-inconnue');
  });
});
