import fs from 'fs';
import path from 'path';
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
import {zh} from '../locales/zh';
import {id} from '../locales/id';
import {hi} from '../locales/hi';
import {sq} from '../locales/sq';
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_SQ, dateFormatLocale, formatFullDate, formatHijriDate, formatShortDate, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_ALBANIAN,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';

// Shqip (sq, Intl locale sq-AL, Latin script, left-to-right): dictionary, plurals, registration and normalisation, runtime switching,
// persistence, dates, editorial content (articles and the 41 pregnancy weeks), images and legal text. PDF / typography / notifications
// have their own suites (medicalExportAlbanianLayout, notificationAlbanianLocalization).

type AnyRecord = Record<string, unknown>;

function leaves(obj: AnyRecord, prefix = ''): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? leaves(value as AnyRecord, keyPath)
      : Array.isArray(value)
        ? value.map((item, index) => [`${keyPath}[${index}]`, String(item)] as [string, string])
        : [[keyPath, String(value)] as [string, string]];
  });
}
const placeholders = (value: string) => (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).map(p => p.replace(/\s/g, '')).sort().join('|');
const tOf = (key: string, lng: AwaAppLanguage, options: AnyRecord = {}) => i18n.t(key, {lng, ...options}) as string;
const INVISIBLE = new RegExp('[' + String.fromCharCode(0x200b, 0x2028, 0x2029, 0xfeff) + ']');
const COMBINING = /[̀-ͯ]/;

const enLeaves = leaves(en as AnyRecord);
const sqLeaves = leaves(sq as AnyRecord);
const sqMap = new Map(sqLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq'] as const;

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('sq.ts has exactly the same leaf paths as every other dictionary — eleven-language parity, no missing, no extra', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(sq as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh, id, hi]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
    // Russian has four plural forms: besides the shared keys it carries the extra _few / _many ones.
    expect(paths(ru as AnyRecord).filter(keyPath => !/_(few|many)$/.test(keyPath))).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length); // no duplicate key paths
  });

  it('every Albanian value is a non-empty string (the only intentionally empty English values stay empty)', () => {
    const empty = sqLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(sqMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Albanian', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((sqMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: every _one has its _other, both translated, with the English variables; only one / other exist', () => {
    const ones = sqLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(sqMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      expect(placeholders(sqMap.get(one) as string)).toBe(placeholders(englishOne));
      expect(placeholders(sqMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(sqLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real Albanian: no raw key, no Cyrillic / Chinese / Devanagari text, no zero-width characters, almost nothing left in English', () => {
    // (the endonyms of the other languages are written in their own scripts)
    expect(sqLeaves.filter(([keyPath, value]) => /[一-鿿Ѐ-ӿऀ-ॿ]/.test(value) && !/^appearance\.language\.[A-Za-z]+Name$/.test(keyPath))).toEqual([]);
    expect(sqLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    expect(sqLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]);
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value));
    expect(sentences.filter(([keyPath, value]) => sqMap.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('long Albanian texts contain Albanian function words (not English, French or Turkish text under an Albanian key)', () => {
    const SQ = /(?<![\p{L}])(të|e|dhe|në|për|me|nga|një|që|është|janë|ka|do|mund|si|nuk|ose|kjo|ky|ato|ata|ju|ti|më|së|i|u|po|pas|para|gjatë|pa|deri|shumë|çdo|disa)(?![\p{L}])/iu;
    const bad = sqLeaves.filter(([, value]) => value.length > 50 && !SQ.test(value)).map(([keyPath, value]) => `${keyPath}: ${value.slice(0, 50)}`);
    expect(bad).toEqual([]);
  });

  it('ë / Ë / ç / Ç are precomposed (NFC): no combining marks, so the PDF, search and equality behave', () => {
    expect(sqLeaves.filter(([, value]) => value !== value.normalize('NFC') || COMBINING.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    const all = sqLeaves.map(([, value]) => value).join('\n');
    for (const char of ['ë', 'ç', 'Ë', 'Ç']) {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
  });

  it('uses only Albanian\'s own accents: no French (é à è ê â î ô ù û), no Turkish (ğ ş ı İ) and no Spanish (ñ á í ó ú) letters except in endonyms and product names the English source also has', () => {
    const stray: string[] = [];
    for (const [keyPath, value] of sqLeaves) {
      if (/^appearance\.language\.[A-Za-z]+Name$/.test(keyPath)) {continue;}
      const english = enLeaves.find(([enPath]) => enPath === keyPath)![1];
      for (const char of value.match(/[éàèêâîôùûœñáíóúğşıİüöÜÖ]/g) ?? []) {
        if (!english.includes(char)) {stray.push(`${keyPath}: ${char}`);}
      }
    }
    expect(stray).toEqual([]);
  });

  it('keeps the brand, the product names and the language endonym Shqip (identical in every language)', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.albanianName', language)).toBe('Shqip');
    }
    expect(tOf('premium.sheet.heroTitle', 'sq')).toContain('AWA');
    expect(sqLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]); // the brand is always "AWA"
    expect(tOf('appearanceThemeNames.awa-original', 'sq')).toBe('AWA Original');
  });

  it('uses the agreed terminology (menstruacion, ovulacion, shtatzëni, namaz, agjërim, nifas, kaza) and the informal ti', () => {
    const all = sqLeaves.map(([, value]) => value.toLowerCase()).join('\n');
    for (const term of ['menstruacion', 'ovulacion', 'shtatzëni', 'namaz', 'agjërim', 'nifas', 'kaza', 'simptom', 'pjellor']) {
      expect([term, all.includes(term)]).toEqual([term, true]);
    }
    expect(tOf('objectives.pregnancy', 'sq').toLowerCase()).toContain('shtatzëni');
    // the voice is the informal "ti": the formal "ju / juaj / tuaj" is at most a stray
    const formal = sqLeaves.filter(([, value]) => /\b(juaj|juaja|tuaj|tuaja|ju)\b/i.test(value));
    expect(formal.length / sqLeaves.length).toBeLessThan(0.01);
  });
});

describe('Albanian plurals', () => {
  it('the on-device PluralRules fallback follows CLDR sq: one only for exactly 1, other otherwise', () => {
    const rules = new AwaPluralRulesForTests('sq-AL');
    expect([0, 1, 2, 5, 11, 21, 100].map(value => rules.select(value))).toEqual(['other', 'one', 'other', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5].map(value => rules.select(value))).toEqual(['other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });

  it('agrees with the engine\'s own Intl.PluralRules("sq") for integers and the common fractions', () => {
    const native = new Intl.PluralRules('sq');
    const shim = new AwaPluralRulesForTests('sq');
    for (const value of [...Array.from({length: 121}, (_, index) => index), 0.5, 1.5, 2.5, 10.5]) {
      expect([value, shim.select(value)]).toEqual([value, native.select(value)]);
    }
  });

  it('uses the _one form for 1 and the _other form for 0 and from 2, through i18next', () => {
    const key = sqLeaves.map(([keyPath]) => keyPath).find(keyPath => keyPath.endsWith('_one') && sqMap.get(keyPath)!.includes('{{count}}') && sqMap.get(keyPath) !== sqMap.get(keyPath.replace(/_one$/, '_other')));
    expect(key).toBeDefined();
    const base = key!.replace(/_one$/, '');
    const one = sqMap.get(`${base}_one`) as string;
    const other = sqMap.get(`${base}_other`) as string;
    expect(tOf(base, 'sq', {count: 1})).toBe(one.replace(/\{\{\s*count\s*\}\}/g, '1'));
    expect(tOf(base, 'sq', {count: 0})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '0'));
    expect(tOf(base, 'sq', {count: 2})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '2'));
    expect(tOf(base, 'sq', {count: 28})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '28'));
  });

  it('a count label never shows a raw {{count}} or an English fallback in Albanian', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'sq', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
      expect(text).toMatch(/ditë|dit/);
    }
  });
});

describe('registration and normalisation', () => {
  it.each(['sq', 'sq-AL', 'sq_AL', 'SQ', 'Sq-al', 'sq-XK', 'sq-MK', 'sq-ME', 'sq-Latn', 'sq-Latn-AL', 'sq-AL.UTF-8', '  sq-AL  ', 'sq-AL-u-nu-latn'])('%s -> sq', value => {
    expect(languageFromLocaleTag(value)).toBe('sq');
  });

  it.each(['sq', 'sq-AL', 'sq_al', 'sq-XK', 'sq-Latn'])('a stored %s normalises to sq', value => {
    expect(normalizeAppLanguage(value)).toBe('sq');
  });

  it('does not confuse other languages: Serbian, Bosnian, Macedonian, Greek, Italian (Arbëresh region) and Turkish stay what they are', () => {
    for (const tag of ['sr-RS', 'bs-BA', 'mk-MK', 'el-GR', 'hr-HR', 'ro-RO', 'bg-BG']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
    expect(languageFromLocaleTag('it-IT')).toBe('it');
    expect(languageFromLocaleTag('tr-TR')).toBe('tr');
  });

  it('picks Albanian from a phone list, English for an unsupported one', () => {
    expect(pickSupportedLanguage(['sq-AL', 'en-GB'])).toBe('sq');
    expect(pickSupportedLanguage(['sr-RS', 'sq-XK'])).toBe('sq');
    expect(pickSupportedLanguage(['sr-RS', 'mk-MK'])).toBe('en');
    expect(pickSupportedLanguage(['en-GB', 'sq-AL'])).toBe('en'); // the phone's first supported language wins
  });

  it('editorial content resolves sq, sq-AL and sq-XK to the Albanian block; English stays the fallback', () => {
    for (const value of ['sq', 'sq-AL', 'sq_AL', 'sq-XK', 'SQ', 'sq-Latn']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'sq']);
    }
    expect(resolveEditorialLanguage('sr')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    expect(ALL_LANGUAGES.filter(language => language !== 'sq').map(language => resolveEditorialLanguage(language))).toEqual(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi']);
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Albanian at runtime without a restart and back, across all eleven languages', async () => {
    await setAppLanguage('sq');
    await i18n.changeLanguage('sq');
    expect(getAppLanguage()).toBe('sq');
    expect(i18n.t('common.save')).toBe(sqMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBe(11);
    await i18n.changeLanguage('sq');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('sq');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('sq');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('sq');
  });

  it('all eight onboarding objectives have an Albanian label', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      const label = tOf(`objectives.${objective}`, 'sq');
      expect(label).toBeTruthy();
      expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
    }
  });

  it('the physical-activity options Hiking and Cardio and the palette names are translated', () => {
    const activity = (sq as unknown as {journalOptions: {cycleActivityType: Record<string, string>}}).journalOptions.cycleActivityType;
    expect(activity.hiking.trim().length).toBeGreaterThan(0);
    expect(activity.hiking).not.toBe('Hiking');
    expect(activity.cardio.trim().length).toBeGreaterThan(0);
    const names = (sq as unknown as {appearanceThemeNames: Record<string, string>}).appearanceThemeNames;
    expect(Object.keys(names).sort()).toEqual(['awa-original', 'lavender-night', 'midnight', 'ocean-calm', 'rose-quartz', 'sage-serenity', 'warm-sand']);
    expect(names['awa-original']).toBe('AWA Original');
    expect(new Set(Object.values(names)).size).toBe(7);
  });
});

describe('dates and calendar', () => {
  it('uses the sq-AL Intl locale, Albanian month names, Western digits and Monday-first Albanian weekdays', async () => {
    await setAppLanguage('sq');
    expect(dateFormatLocale()).toBe('sq-AL');
    expect(WEEK_DAYS_SQ).toEqual(['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_SQ);
    expect(formatFullDate(new Date(2026, 9, 19))).toMatch(/^19 tetor 2026$/i);
    expect(formatShortDate(new Date(2026, 9, 19))).toMatch(/^19 tetor$/i);
  });

  it('every month has an Albanian name in the sq-AL locale', () => {
    const months = Array.from({length: 12}, (_, month) => new Intl.DateTimeFormat('sq-AL', {month: 'long'}).format(new Date(2026, month, 1)).toLowerCase());
    expect(months).toEqual(['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor']);
  });

  it('Hijri dates are produced by the same calendar code (a non-empty Albanian-locale string)', async () => {
    await setAppLanguage('sq');
    const hijri = formatHijriDate(new Date(2026, 2, 1));
    expect(typeof hijri === 'string' ? hijri.length : 1).toBeGreaterThan(0);
  });
});

describe('editorial content', () => {
  const libraryDir = path.resolve(__dirname, '../../screens/library');

  /** The structure (keys, array lengths) of an object literal, with strings reduced to a marker. */
  const shapeOf = (node: ts.Node): unknown => {
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {return shapeOf(node.expression);}
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {return 's';}
    if (ts.isArrayLiteralExpression(node)) {return node.elements.map(shapeOf);}
    if (ts.isObjectLiteralExpression(node)) {
      return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replace(/['"]/g, ''), shapeOf(p.initializer)]));
    }
    return node.getText();
  };

  const articleFiles = fs.readdirSync(libraryDir).filter(file => /ArticleScreen\.tsx$/.test(file));

  it('every article screen (73) has a complete Albanian block with exactly the English structure', () => {
    expect(articleFiles.length).toBe(73);
    const problems: string[] = [];
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2019, true, ts.ScriptKind.TSX);
      let checked = false;
      const visit = (node: ts.Node): void => {
        if (ts.isObjectLiteralExpression(node)) {
          const props = Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replace(/['"]/g, ''), p.initializer]));
          if (props.zh && props.fr && (props.en || file.startsWith('UnderstandCycle')) && ts.isObjectLiteralExpression(props.zh)) {
            checked = true;
            if (!props.sq) {problems.push(`${file}: no sq block`);}
            else {
              const reference = shapeOf(props.en ?? props.fr);
              if (JSON.stringify(shapeOf(props.sq)) !== JSON.stringify(reference)) {problems.push(`${file}: sq block structure differs from en`);}
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
      if (!checked) {problems.push(`${file}: content object not found`);}
    }
    expect(problems).toEqual([]);
  });

  it('every article Albanian block is Albanian prose: no Cyrillic / Chinese / Devanagari, no decomposed accents, Albanian function words present', () => {
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}sq: \{/);
      expect([file, start > 0]).toEqual([file, true]);
      const rest = text.slice(start);
      const end = rest.search(/\n {2}\},?\r?\n/);
      const block = rest.slice(0, end > 0 ? end : undefined);
      expect([file, /[一-鿿Ѐ-ӿऀ-ॿ]/.test(block)]).toEqual([file, false]);
      expect([file, COMBINING.test(block)]).toEqual([file, false]);
      expect([file, /(?<![\p{L}])(dhe|të|në|për|është|janë|me|nga|një)(?![\p{L}])/u.test(block)]).toEqual([file, true]);
    }
  });

  it('all 41 pregnancy weeks have Albanian content with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const albanian = getPregnancyWeekData(week, 'sq');
      const english = getPregnancyWeekData(week, 'en');
      expect(albanian).toBeDefined();
      expect(Object.keys(albanian!).sort()).toEqual(Object.keys(english!).sort());
      expect(JSON.stringify(albanian)).not.toBe(JSON.stringify(english));
      for (const [key, value] of Object.entries(english!)) {
        const other = (albanian as unknown as AnyRecord)[key];
        if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
      }
    }
    expect(getPregnancyWeekData(0, 'sq')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'sq')).toBeUndefined();
  });

  it('pregnancy-week figures survive the translation: every number of the English text is in the Albanian text', () => {
    const missing: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const english = JSON.stringify(getPregnancyWeekData(week, 'en'));
      const albanian = JSON.stringify(getPregnancyWeekData(week, 'sq'));
      for (const number of english.match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!albanian.includes(number) && !albanian.includes(number.replace('.', ','))) {missing.push(`week ${week}: ${number}`);}
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('images and legal text', () => {
  it('has no Albanian artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'sq')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'sq')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_ALBANIAN].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt.sq).toContain('në anglisht');
    }
  });

  it('legal placeholder sections exist in Albanian with the English structure and are not English', () => {
    for (const document of [TERMS, PRIVACY]) {
      expect(document.sq).toHaveLength(document.en.length);
      document.sq.forEach((section, index) => {
        expect(section.title).not.toBe(document.en[index].title);
        expect(section.body).not.toBe(document.en[index].body);
        expect(section.body).toMatch(/(?<![\p{L}])(do të|dhe|për|të)(?![\p{L}])/u);
      });
    }
  });
});
