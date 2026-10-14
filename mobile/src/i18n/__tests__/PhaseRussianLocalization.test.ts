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
import {
  getAppLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {
  WEEK_DAYS,
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
import {capitalizeFor, foldForConfirmation, lowerCaseFor, upperCaseFor} from '../../utils/textCase';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {EDITORIAL_IMAGES_MISSING_RUSSIAN, EDITORIAL_IMAGE_ALT, CYCLE_PHASES_HERO, resolveEditorialImage, hasLocalizedEditorialImage} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import {russianCardinal, AwaPluralRulesForTests} from '../pluralRules';

// Russian (ru) — dictionary, plurals, runtime, persistence, dates and case rules, editorial content, images, legal text.

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
const ruLeaves = leaves(ru as AnyRecord);
const ruMap = new Map(ruLeaves);
const SUFFIX = /_(one|few|many|other)$/;
const stripPlural = (keyPath: string) => keyPath.replace(SUFFIX, '');

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('ru.ts has every English key (plural pairs expanded to one/few/many/other) and nothing else', () => {
    const expected = new Set<string>();
    enLeaves.forEach(([keyPath]) => {
      if (/_(one|other)$/.test(keyPath)) {
        const base = stripPlural(keyPath);
        ['one', 'few', 'many', 'other'].forEach(form => expected.add(`${base}_${form}`));
      } else {
        expected.add(keyPath);
      }
    });
    expect(expected.size).toBeGreaterThan(6000);
    expect([...ruMap.keys()].sort()).toEqual([...expected].sort());
  });

  it('every non-plural English key exists in the other four dictionaries too (parity unchanged)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    for (const dictionary of [fr, es, itDictionary, tr]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
  });

  it('every Russian value is a non-empty string (the only intentionally empty English value stays empty)', () => {
    const empty = ruLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath);
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath);
    expect(empty.sort()).toEqual(englishEmpty.sort());
  });

  it('interpolation placeholders are identical to English in every string (all four plural forms included)', () => {
    const enMap = new Map(enLeaves);
    const wrong: string[] = [];
    ruLeaves.forEach(([keyPath, value]) => {
      const source = enMap.has(keyPath) ? enMap.get(keyPath) : enMap.get(`${stripPlural(keyPath)}_other`);
      if (source === undefined) {wrong.push(`${keyPath} (no source)`); return;}
      if (placeholders(source) !== placeholders(value)) {wrong.push(keyPath);}
    });
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Russian', () => {
    const enMap = new Map(enLeaves);
    const wrong = ruLeaves
      .filter(([keyPath, value]) => {
        const source = enMap.get(keyPath) ?? enMap.get(`${stripPlural(keyPath)}_other`) ?? '';
        return (source.match(/\n/g) ?? []).length !== (value.match(/\n/g) ?? []).length;
      })
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('every plural group has all four Russian forms and each form keeps the count variable of English', () => {
    const bases = new Set(ruLeaves.map(([keyPath]) => keyPath).filter(k => SUFFIX.test(k)).map(stripPlural));
    expect(bases.size).toBeGreaterThan(80);
    const enMap = new Map(enLeaves);
    for (const base of bases) {
      for (const form of ['one', 'few', 'many', 'other']) {
        expect(ruMap.has(`${base}_${form}`)).toBe(true);
      }
      // English "one" may legitimately read "a/an" instead of the number; the other forms keep the count.
      if ((enMap.get(`${base}_one`) ?? '').includes('{{count}}')) {
        expect(ruMap.get(`${base}_one`)).toContain('{{count}}');
      }
      if ((enMap.get(`${base}_other`) ?? '').includes('{{count}}')) {
        for (const form of ['few', 'many', 'other']) {
          expect(ruMap.get(`${base}_${form}`)).toContain('{{count}}');
        }
      }
    }
  });

  it('is real Russian: Cyrillic everywhere a word is expected, no leftover English/French/Spanish/Italian sentences', () => {
    const FOREIGN = new Set(
      ('the and your you with for this that are have will can not ' +
        'pour avec vous votre vos des les une est dans sur cette ces nous elle être tout plus mais ' +
        'para con los las una del por que como más pero sus esta este también cuando ' +
        'della delle degli gli nel nella sono che questo questa tuo tua non anche quando ' +
        've bir için ile bu daha çok').split(' '),
    );
    const leaked = ruLeaves
      .filter(([, value]) => value.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿœ]+/).filter(word => FOREIGN.has(word)).length >= 2)
      .map(([keyPath, value]) => `${keyPath}: ${value.slice(0, 60)}`);
    expect(leaked).toEqual([]);
    const withoutCyrillic = ruLeaves.filter(([, value]) => /[A-Za-z]{4,}/.test(value.replace(/\{\{[^}]*\}\}/g, '')) && !/[А-Яа-яЁё]/.test(value));
    // Only brands/endonyms/technical labels may be Latin-only (short, never a sentence).
    expect(withoutCyrillic.filter(([, value]) => value.split(/\s+/).length > 3).map(([keyPath, value]) => `${keyPath}: ${value}`)).toEqual([]);
    const cyrillicLetters = ruLeaves.map(([, value]) => (value.match(/[А-Яа-яЁё]/g) ?? []).length).reduce((a, b) => a + b, 0);
    expect(cyrillicLetters).toBeGreaterThan(100000);
  });

  it('uses no mojibake and no escaped unicode in a string', () => {
    const bad = ruLeaves.filter(([, value]) => /Ã[\u0080-¿]|Â[\u0080-¿]|�|\\u[0-9a-f]{4}|Р[\u0080-¿]С[\u0080-¿]/i.test(value)).map(([k]) => k);
    expect(bad).toEqual([]);
  });

  it('the product wording is consistent: «AWA Вместе», «УДАЛИТЬ», «Русский»', () => {
    const mentions = ruLeaves.filter(([, value]) => /AWA (Together|Pareja|Insieme|à deux|Birlikte)/.test(value));
    expect(mentions).toEqual([]);
    expect(ruMap.get('dataPrivacy.deleteAccount.confirmWord')).toBe('УДАЛИТЬ');
    for (const dictionary of [en, fr, es, itDictionary, tr, ru]) {
      expect((dictionary as AnyRecord & {appearance: {language: {russianName: string}}}).appearance.language.russianName).toBe('Русский');
    }
  });

  it('the core vocabulary follows the requested terminology', () => {
    expect(ruMap.get('navigation.home')).toBeTruthy();
    expect(ruMap.get('navigation.statistics')).toMatch(/Статистика/);
    expect(ruMap.get('navigation.calendar')).toMatch(/Календарь/);
    const joined = ruLeaves.map(([, v]) => v.toLowerCase()).join(' ');
    for (const term of ['месячные', 'овуляци', 'беременност', 'послеродов', 'симптом', 'напоминани', 'уведомлени', 'менопауз', 'контрацепци']) {
      expect(joined).toContain(term);
    }
  });
});

describe('Russian plural categories (CLDR)', () => {
  it('maps integers to one / few / many exactly as Russian grammar requires, fractions to other', () => {
    const forms = (values: number[]) => values.map(n => russianCardinal(n));
    expect(forms([1, 21, 31, 101, 1001])).toEqual(Array(5).fill('one'));
    expect(forms([2, 3, 4, 22, 23, 24, 102, 104])).toEqual(Array(8).fill('few'));
    expect(forms([0, 5, 6, 9, 10, 11, 12, 13, 14, 15, 19, 20, 25, 30, 100, 111, 112, 114, 1000])).toEqual(Array(19).fill('many'));
    expect(forms([1.5, 0.5, 2.5])).toEqual(['other', 'other', 'other']);
  });

  it('the on-device fallback (engines without Intl.PluralRules) agrees with the CLDR rule for Russian', () => {
    const rules = new AwaPluralRulesForTests('ru');
    expect(rules.resolvedOptions().pluralCategories.sort()).toEqual(['few', 'many', 'one', 'other']);
    [0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, 1.5].forEach(n => {
      expect(rules.select(n)).toBe(russianCardinal(n));
    });
    // every other language keeps the one/other rule i18next already used on the device
    const english = new AwaPluralRulesForTests('en-US');
    expect(english.select(1)).toBe('one');
    expect(english.select(2)).toBe('other');
    expect(english.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });

  it('i18next resolves the right Russian form for a real key (1 день / 2 дня / 5 дней / 21 день / 11 дней)', async () => {
    const key = 'statistics.daysPlural';
    const out = (count: number) => tOf(key, 'ru', {count});
    expect(out(1)).toBe(ruMap.get(`${key}_one`)?.replace('{{count}}', '1'));
    expect(out(2)).toBe(ruMap.get(`${key}_few`)?.replace('{{count}}', '2'));
    expect(out(5)).toBe(ruMap.get(`${key}_many`)?.replace('{{count}}', '5'));
    expect(out(21)).toBe(ruMap.get(`${key}_one`)?.replace('{{count}}', '21'));
    expect(out(11)).toBe(ruMap.get(`${key}_many`)?.replace('{{count}}', '11'));
    expect(out(24)).toBe(ruMap.get(`${key}_few`)?.replace('{{count}}', '24'));
    expect(out(0)).toBe(ruMap.get(`${key}_many`)?.replace('{{count}}', '0'));
    expect(out(5)).not.toMatch(/\{\{/);
  });

  it('forms differ where Russian grammar requires it (day/days/days)', () => {
    const key = 'statistics.daysPlural';
    const one = ruMap.get(`${key}_one`) as string;
    const few = ruMap.get(`${key}_few`) as string;
    const many = ruMap.get(`${key}_many`) as string;
    expect(new Set([one.replace('{{count}}', ''), few.replace('{{count}}', ''), many.replace('{{count}}', '')]).size).toBe(3);
  });
});

describe('registration, default, fallback and persistence', () => {
  it('Russian is registered with the real ru.ts dictionary next to the five others', () => {
    const bundle = i18n.getResourceBundle('ru', 'translation') as AnyRecord;
    expect(bundle).toBeTruthy();
    expect(leaves(bundle).length).toBe(ruLeaves.length);
    for (const language of ['en', 'fr', 'es', 'it', 'tr', 'ru']) {
      expect(i18n.hasResourceBundle(language, 'translation')).toBe(true);
    }
  });

  it('English stays the default language and the fallback', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
    expect(getAppLanguage()).toBe('en');
  });

  it('a key missing in Russian falls back to ENGLISH — never French, Spanish, Italian or Turkish', async () => {
    const instance = i18n.createInstance();
    await instance.init({
      resources: {en: {translation: {only: 'English only'}}, ru: {translation: {}}, fr: {translation: {only: 'Français'}}},
      lng: 'ru',
      fallbackLng: 'en',
    });
    expect(instance.t('only')).toBe('English only');
  });

  it('Russian can be selected, is persisted and survives a restart; every language still works', async () => {
    await setAppLanguage('ru');
    expect(getAppLanguage()).toBe('ru');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('ru');
    expect(await freshLaunchLanguage()).toBe('ru');
    for (const language of ['fr', 'en', 'es', 'it', 'tr', 'ru'] as AwaAppLanguage[]) {
      await setAppLanguage(language);
      expect(getAppLanguage()).toBe(language);
      expect(await freshLaunchLanguage()).toBe(language);
    }
  });

  it('selecting Russian updates the live UI language immediately (i18n follows the preference store)', async () => {
    expect(i18n.language).toBe('en');
    await setAppLanguage('ru');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(i18n.language).toBe('ru');
    expect(i18n.t('common.save')).toBe(ruMap.get('common.save'));
  });

  it('existing stored languages are preserved and an invalid value never becomes Russian', async () => {
    for (const stored of ['fr', 'en', 'es', 'it', 'tr']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', stored);
      expect(await freshLaunchLanguage()).toBe(stored);
    }
    for (const invalid of ['ru-RU', 'RU', 'russian', 'рус', '']) {
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
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(/setAppLanguage\(\s*['"]ru['"]/);
    }
  });

  it('switches at runtime: EN -> RU -> FR -> RU with no restart', async () => {
    expect(tOf('common.save', 'en')).toBe('Save');
    await i18n.changeLanguage('ru');
    expect(i18n.t('common.save')).toBe(ruMap.get('common.save'));
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe(fr.common.save);
    await i18n.changeLanguage('ru');
    expect(i18n.t('common.save')).toBe(ruMap.get('common.save'));
  });

  it('the language is app-wide: it is not stored per profile', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', '..', 'state', 'themePreferences.ts'), 'utf8');
    expect(source).toContain("'@awa/appearance/language-v1'");
    expect(source).not.toMatch(/language-v1[^'\n]*profile/i);
  });
});

describe('Russian dates, weekdays and time', () => {
  const sample = new Date(2026, 9, 5, 12); // Monday 5 October 2026

  it('uses ru-RU and leaves the other languages’ locales alone', async () => {
    await setAppLanguage('ru');
    expect(dateFormatLocale()).toBe('ru-RU');
    for (const [language, locale] of [['en', 'en-US'], ['fr', 'fr-FR'], ['es', 'es-ES'], ['it', 'it-IT'], ['tr', 'tr-TR']] as const) {
      await setAppLanguage(language);
      expect(dateFormatLocale()).toBe(locale);
    }
  });

  it('weekdays are Monday-first Russian abbreviations, and the others are unchanged', async () => {
    expect(WEEK_DAYS_RU).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
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

  it('full weekday and month names are Russian (months in the genitive after a day number)', async () => {
    await setAppLanguage('ru');
    const weekday = (offset: number) =>
      new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long'}).format(new Date(2026, 9, 5 + offset, 12));
    expect([0, 1, 2, 3, 4, 5, 6].map(offset => capitalize(weekday(offset)))).toEqual([
      'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
    ]);
    const months = Array.from({length: 12}, (_, month) =>
      new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long'}).format(new Date(2026, month, 15, 12)));
    expect(months).toEqual([
      '15 января', '15 февраля', '15 марта', '15 апреля', '15 мая', '15 июня',
      '15 июля', '15 августа', '15 сентября', '15 октября', '15 ноября', '15 декабря',
    ]);
  });

  it('short and long dates read in Russian; stored date keys are language-independent', async () => {
    await setAppLanguage('ru');
    expect(formatShortDate(sample)).toBe('5 октября');
    expect(formatFullDate(sample)).toMatch(/^5 октября 2026/);
    const key = sample.toLocaleDateString('en-CA');
    await setAppLanguage('en');
    expect(sample.toLocaleDateString('en-CA')).toBe(key);
    expect(key).toBe('2026-10-05');
  });

  it('times use the 24-hour clock in Russian', async () => {
    await setAppLanguage('ru');
    const evening = new Date(2026, 9, 5, 18, 5);
    const formatted = new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hour12: false}).format(evening);
    expect(formatted).toBe('18:05');
    const midnight = new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(2026, 9, 5, 0, 30));
    expect(midnight).toBe('00:30');
  });

  it('the Hijri helper does not throw in Russian', async () => {
    await setAppLanguage('ru');
    expect(() => formatHijriDate(sample)).not.toThrow();
  });

  it('Cyrillic letters survive capitalization and case folding', async () => {
    await setAppLanguage('ru');
    expect(capitalize('октябрь')).toBe('Октябрь');
    expect(capitalize('ёлка')).toBe('Ёлка');
    expect(upperCaseFor('удалить', 'ru')).toBe('УДАЛИТЬ');
    expect(lowerCaseFor('УДАЛИТЬ', 'ru')).toBe('удалить');
    expect(capitalizeFor('щёки', 'ru')).toBe('Щёки');
    // Turkish dotted/dotless i rules stay Turkish-only
    expect(upperCaseFor('iyi', 'ru')).toBe('IYI');
  });

  it('the typed destructive-confirmation word accepts every way it may be typed', () => {
    const expected = foldForConfirmation('УДАЛИТЬ', 'ru');
    for (const typed of ['УДАЛИТЬ', 'удалить', 'Удалить', ' удалить ']) {
      expect(foldForConfirmation(typed, 'ru')).toBe(expected);
    }
    expect(foldForConfirmation('удалите', 'ru')).not.toBe(expected);
  });
});

describe('editorial content: library articles, pregnancy weeks, legal text', () => {
  const libraryDir = path.join(__dirname, '..', '..', 'screens', 'library');
  const articleFiles = fs.readdirSync(libraryDir).filter(file => file.endsWith('ArticleScreen.tsx'));

  const contentOf = (file: string): {en: unknown; ru: unknown} | null => {
    const source = fs.readFileSync(path.join(libraryDir, file), 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2019, true, ts.ScriptKind.TSX);
    let found: {en: unknown; ru: unknown} | null = null;
    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node) && !found) {
        const props = node.properties.filter(ts.isPropertyAssignment);
        const named = (name: string) => props.find(property => property.name.getText() === name);
        const enProp = named('en');
        const itProp = named('it');
        const ruProp = named('ru');
        if (enProp && itProp && ruProp && ts.isObjectLiteralExpression(enProp.initializer) && ts.isObjectLiteralExpression(ruProp.initializer)) {
          const evaluate = (n: ts.Node) => vm.runInNewContext(`(${source.slice(n.getStart(), n.getEnd())})`);
          found = {en: evaluate(enProp.initializer), ru: evaluate(ruProp.initializer)};
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

  it('resolveEditorialLanguage knows Russian and still defaults to English', () => {
    expect(resolveEditorialLanguage('ru')).toBe('ru');
    for (const language of ['fr', 'es', 'it', 'tr', 'en']) {
      expect(resolveEditorialLanguage(language)).toBe(language);
    }
    for (const other of ['nl', '', null, undefined, 'ru-RU']) {
      expect(resolveEditorialLanguage(other as string | null | undefined)).toBe('en');
    }
  });

  it('all 72 localized library articles have a Russian block with exactly the English structure', () => {
    const withContent = articleFiles.map(file => [file, contentOf(file)] as const);
    expect(withContent.length).toBeGreaterThanOrEqual(72);
    const missing = withContent.filter(([, content]) => content === null).map(([file]) => file);
    // UnderstandCycleArticleScreen is a legacy, French-only screen (no CONTENT object for any language).
    expect(missing.filter(file => file !== 'UnderstandCycleArticleScreen.tsx')).toEqual([]);
    expect(withContent.filter(([, content]) => content !== null).length).toBe(72);
    const different = withContent
      .filter(([, content]) => content !== null)
      .filter(([, content]) => JSON.stringify(shape((content as {en: unknown}).en)) !== JSON.stringify(shape((content as {ru: unknown}).ru)))
      .map(([file]) => file);
    expect(different).toEqual([]);
  });

  it('every Russian article is actually translated and written in Cyrillic', () => {
    const offenders: string[] = [];
    let cyrillic = 0;
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const russian = strings(content.ru);
      const same = english.filter((value, index) => value === russian[index] && /[A-Za-z]{4,}/.test(value)).length;
      if (same / Math.max(english.length, 1) > 0.1) {offenders.push(`${file}: ${same}/${english.length}`);}
      russian.forEach(value => {
        cyrillic += (value.match(/[А-Яа-яЁё]/g) ?? []).length;
      });
    }
    expect(offenders).toEqual([]);
    expect(cyrillic).toBeGreaterThan(150000);
  });

  // Strings where Russian legitimately spells an English figure as a word: "3rd trimester" → «третьего триместра»,
  // "2nd trimester" → «втором триместре», "over 24 hours" → «в сутки». Every other number must match exactly.
  const ORDINAL_OR_UNIT_WORDING = new Set([
    'BabyDevelopmentArticleScreen.tsx#18',
    'BabyDevelopmentArticleScreen.tsx#24',
    'BreastfeedingArticleScreen.tsx#30',
  ]);

  it('Russian articles keep the numbers and placeholders of the English text', () => {
    const wrong: string[] = [];
    const numbers = (text: string) => (text.replace(/\{\{[^}]*\}\}/g, ' ').match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const russian = strings(content.ru);
      english.forEach((value, index) => {
        if (placeholders(value) !== placeholders(russian[index] ?? '')) {wrong.push(`${file}#${index}`);}
        if (numbers(value) !== numbers(russian[index] ?? '') && !ORDINAL_OR_UNIT_WORDING.has(`${file}#${index}`)) {
          wrong.push(`${file}#${index} numbers`);
        }
      });
    }
    expect(wrong).toEqual([]);
  });

  it('all 41 pregnancy weeks resolve to Russian content with the English fields, distinct from every other language', () => {
    for (let week = 1; week <= 41; week += 1) {
      const russian = getPregnancyWeekData(week, 'ru');
      const english = getPregnancyWeekData(week, 'en');
      expect(russian).toBeDefined();
      expect(english).toBeDefined();
      expect(Object.keys(russian as object).sort()).toEqual(Object.keys(english as object).sort());
      expect(russian?.babyDescription).not.toBe(english?.babyDescription);
      expect(russian?.babyDescription).toMatch(/[А-Яа-яЁё]/);
      expect(russian?.bodyChanges).toHaveLength((english?.bodyChanges ?? []).length);
      expect(russian?.toKnow).toHaveLength((english?.toKnow ?? []).length);
      expect(russian?.week).toBe(week);
      expect(russian?.babyImage).toBe(english?.babyImage);
      expect(russian?.sourceRefs).toEqual(english?.sourceRefs);
      for (const other of ['fr', 'es', 'it', 'tr'] as const) {
        expect(russian?.babyDescription).not.toBe(getPregnancyWeekData(week, other)?.babyDescription);
      }
    }
  });

  it('pregnancy week figures are preserved exactly (decimal comma only)', () => {
    const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (let week = 1; week <= 41; week += 1) {
      const russian = getPregnancyWeekData(week, 'ru');
      const english = getPregnancyWeekData(week, 'en');
      for (const field of ['length', 'comparison'] as const) {
        if (english?.[field]) {
          expect([week, field, numbers(String(russian?.[field] ?? ''))]).toEqual([week, field, numbers(String(english[field]))]);
        }
      }
      expect(numbers([russian?.babyDescription, ...(russian?.bodyChanges ?? []), ...(russian?.toKnow ?? [])].join(' '))).toBe(
        numbers([english?.babyDescription, ...(english?.bodyChanges ?? []), ...(english?.toKnow ?? [])].join(' ')),
      );
    }
  });

  it('legal placeholder text exists in Russian with the same sections as English', () => {
    expect(Object.keys(TERMS).sort()).toEqual(['de', 'en', 'es', 'fr', 'ru', 'tr', 'zh']);
    expect(Object.keys(PRIVACY).sort()).toEqual(['de', 'en', 'es', 'fr', 'ru', 'tr', 'zh']);
    expect(TERMS.ru).toHaveLength(TERMS.en.length);
    expect(PRIVACY.ru).toHaveLength(PRIVACY.en.length);
    TERMS.ru.concat(PRIVACY.ru).forEach(section => {
      expect(section.title).toMatch(/[А-Яа-яЁё]/);
      expect(section.body).toMatch(/[А-Яа-яЁё]/);
    });
  });
});

describe('text-in-image illustrations', () => {
  it('Russian uses the English artwork explicitly (no Russian lettering exists) and says so in the description', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'ru')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'ru')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_RUSSIAN].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const key of ['pregnancyFollowUp', 'pregnancyExercise', 'exercise'] as const) {
      const alt = EDITORIAL_IMAGE_ALT[key].ru;
      expect(alt).toMatch(/^Иллюстрация:/);
      expect(alt).toContain('на английском языке');
      expect(alt).not.toBe(EDITORIAL_IMAGE_ALT[key].en);
    }
  });
});

describe('categorical labels and journal options', () => {
  it('stored French values display as Russian labels and unknown values pass through; storage never changes', async () => {
    await setAppLanguage('ru');
    await i18n.changeLanguage('ru');
    const t = i18n.t.bind(i18n) as (key: string, options?: AnyRecord) => string;
    const label = journalOptionLabel('cycleSymptom', 'Crampes', t as never);
    expect(label).not.toBe('Crampes');
    expect(label).toMatch(/[А-Яа-яЁё]/);
    expect(journalOptionLabel('cycleSymptom', 'valeur-inconnue', t as never)).toBe('valeur-inconnue');
  });
});
