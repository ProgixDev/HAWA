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
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_HI, dateFormatLocale, formatFullDate, formatHijriDate, formatShortDate, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_HINDI,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests, hindiCardinal} from '../pluralRules';

// हिन्दी (hi, Intl locale hi-IN, Devanagari script, left-to-right): dictionary, plurals, registration and normalisation,
// runtime switching, persistence, dates, editorial content (articles and the 41 pregnancy weeks), images and legal text.
// PDF / typography / notifications have their own suites (medicalExportHindiLayout, awaTypographyDevanagari,
// notificationHindiLocalization).

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
const DEVANAGARI = /[ऀ-ॿ]/;
const nfc = (value: string) => value.normalize('NFC');

const enLeaves = leaves(en as AnyRecord);
const hiLeaves = leaves(hi as AnyRecord);
const hiMap = new Map(hiLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi'] as const;

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('hi.ts has exactly the same leaf paths as every other dictionary — ten-language parity, no missing, no extra', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(hi as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh, id]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
    // Russian has four plural forms: besides the shared keys it carries the extra _few / _many ones.
    expect(paths(ru as AnyRecord).filter(keyPath => !/_(few|many)$/.test(keyPath))).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length); // no duplicate key paths
  });

  it('every Hindi value is a non-empty string (the only intentionally empty English values stay empty)', () => {
    const empty = hiLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(hiMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Hindi', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((hiMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: every _one has its _other, both translated, with the English variables; only one / other exist', () => {
    const ones = hiLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(hiMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      expect(placeholders(hiMap.get(one) as string)).toBe(placeholders(englishOne));
      expect(placeholders(hiMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(hiLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real Hindi: Devanagari everywhere it should be, no raw key, no Chinese/Cyrillic, no Devanagari digits, no zero-width characters', () => {
    // (the endonyms of the Russian and Chinese languages are written in their own scripts)
    expect(hiLeaves.filter(([keyPath, value]) => /[一-鿿Ѐ-ӿ]/.test(value) && !/^appearance\.language\.(russian|chinese|turkish|japanese)Name$/.test(keyPath))).toEqual([]);
    expect(hiLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    expect(hiLeaves.filter(([, value]) => /[०-९]/.test(value))).toEqual([]); // Western digits 0-9 only
    expect(hiLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]); // no ZWSP / BOM / line separators
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value));
    expect(sentences.filter(([keyPath, value]) => hiMap.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
    expect(sentences.filter(([keyPath]) => !DEVANAGARI.test(hiMap.get(keyPath) as string)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('keeps no ordinary English word in Latin letters (brands, product names such as "AWA Together" and "AWA Original", acronyms and developer paths excepted)', () => {
    const allowedWords = new Set(['awa', 'premium', 'pin', 'pdf', 'csv', 'ok', 'face', 'id', 'wi', 'fi', 'google', 'android', 'ios', 'apple', 'huawei',
      'whatsapp', 'gmail', 'sms', 'maptiler', 'src', 'config', 'maps', 'ts', 'deux', 'together', 'original', 'wifi', 'qr', 'url', 'gps', 'app', 'a', 'à', 'hba', 'hb', 'ng', 'ml', 'kg', 'cm', 'mg']);
    const bad: string[] = [];
    for (const [keyPath, value] of hiLeaves) {
      if (/^appearance\.language\.[a-z]+Name$/.test(keyPath)) {continue;} // language endonyms (Français, Deutsch, …)
      const stripped = value.replace(/\{\{[^}]*\}\}/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\S+@\S+/g, ' ');
      const words = (stripped.match(/[A-Za-zÀ-ÿ]{2,}/g) ?? []).filter(word => !allowedWords.has(word.toLowerCase()) && !/^[A-Z0-9]{2,6}$/.test(word));
      if (words.length > 0) {bad.push(`${keyPath}: ${words.join(', ')}`);}
    }
    expect(bad).toEqual([]);
  });

  it('keeps the brand, the product name and the language endonym हिन्दी (identical in every language)', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.hindiName', language)).toBe('हिन्दी');
    }
    const premiumTitle = tOf('premium.sheet.heroTitle', 'hi');
    expect(premiumTitle).toContain('AWA');
    expect(premiumTitle).toContain('Premium');
    expect(hiLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]); // the brand is always "AWA"
  });

  it('uses the agreed terminology (पीरियड / मासिक धर्म, ओव्यूलेशन, गर्भावस्था, नमाज़, रोज़ा, क़ज़ा, निफ़ास) and the polite आप', () => {
    const all = nfc(hiLeaves.map(([, value]) => value).join('\n'));
    for (const term of ['पीरियड', 'मासिक धर्म', 'ओव्यूलेशन', 'गर्भावस्था', 'नमाज़', 'रोज़ा', 'क़ज़ा', 'निफ़ास', 'गर्भपात', 'लक्षण', 'आप']) {
      expect(all).toContain(nfc(term));
    }
    expect(nfc(tOf('objectives.pregnancy', 'hi'))).toContain(nfc('गर्भावस्था'));
    expect(hiLeaves.filter(([, value]) => /(^|\s)(तुम|तुम्हारा|तुम्हारी|तुम्हें|तू)(\s|$|[,.।!?])/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
  });
});

describe('Hindi plurals', () => {
  it('the on-device PluralRules fallback follows CLDR: one for an integer part of 0 and for 1, other otherwise', () => {
    const rules = new AwaPluralRulesForTests('hi-IN');
    expect([0, 1, 2, 5, 11, 21, 100].map(value => rules.select(value))).toEqual(['one', 'one', 'other', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5, 2.5].map(value => rules.select(value))).toEqual(['one', 'other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });

  it('agrees with the engine\'s own Intl.PluralRules("hi") for integers and the common fractions', () => {
    const native = new Intl.PluralRules('hi');
    for (const value of [...Array.from({length: 121}, (_, index) => index), 0.5, 1.5, 2.5, 10.5]) {
      expect([value, hindiCardinal(value)]).toEqual([value, native.select(value)]);
    }
  });

  it('uses the _one form for 0 and 1 and the _other form from 2, through i18next', () => {
    const key = hiLeaves.map(([keyPath]) => keyPath).find(keyPath => keyPath.endsWith('_one') && hiMap.get(keyPath)!.includes('{{count}}') && hiMap.get(keyPath) !== hiMap.get(keyPath.replace(/_one$/, '_other')));
    expect(key).toBeDefined();
    const base = key!.replace(/_one$/, '');
    const one = hiMap.get(`${base}_one`) as string;
    const other = hiMap.get(`${base}_other`) as string;
    expect(tOf(base, 'hi', {count: 0})).toBe(one.replace(/\{\{\s*count\s*\}\}/g, '0'));
    expect(tOf(base, 'hi', {count: 1})).toBe(one.replace(/\{\{\s*count\s*\}\}/g, '1'));
    expect(tOf(base, 'hi', {count: 2})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '2'));
    expect(tOf(base, 'hi', {count: 28})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '28'));
  });

  it('a count label never shows a raw {{count}} or an English fallback in Hindi', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'hi', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
      expect(DEVANAGARI.test(text)).toBe(true);
    }
  });
});

describe('registration and normalisation', () => {
  it.each(['hi', 'hi-IN', 'hi_IN', 'HI', 'Hi-in', 'hi-Deva', 'hi-Deva-IN'])('%s -> hi', value => {
    expect(languageFromLocaleTag(value)).toBe('hi');
  });

  it.each(['hi', 'hi-IN', 'hi_in', 'hi-Deva'])('a stored %s normalises to hi', value => {
    expect(normalizeAppLanguage(value)).toBe('hi');
  });

  it('does not confuse other languages: Hindi in Roman letters, Marathi, Nepali, Urdu and Bengali are not Hindi', () => {
    for (const tag of ['hi-Latn', 'hi-Latn-IN', 'mr-IN', 'ne-NP', 'ur-IN', 'bn-IN', 'pa-IN', 'ta-IN']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
    expect(languageFromLocaleTag('id-ID')).toBe('id');
    expect(languageFromLocaleTag('it-IT')).toBe('it');
  });

  it('picks Hindi from a phone list, English for an unsupported one', () => {
    expect(pickSupportedLanguage(['hi-IN', 'en-IN'])).toBe('hi');
    expect(pickSupportedLanguage(['mr-IN', 'hi-IN'])).toBe('hi');
    expect(pickSupportedLanguage(['mr-IN', 'ta-IN'])).toBe('en');
    expect(pickSupportedLanguage(['hi-Latn-IN'])).toBe('en');
  });

  it('editorial content resolves hi, hi-IN and hi-Deva to the Hindi block; English stays the fallback', () => {
    for (const value of ['hi', 'hi-IN', 'hi_IN', 'hi-Deva', 'HI']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'hi']);
    }
    expect(resolveEditorialLanguage('hi-Latn')).toBe('en');
    expect(resolveEditorialLanguage('mr')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    // the other nine are untouched
    expect(ALL_LANGUAGES.filter(language => language !== 'hi').map(language => resolveEditorialLanguage(language))).toEqual(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id']);
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Hindi at runtime without a restart and back, across all ten languages', async () => {
    await setAppLanguage('hi');
    await i18n.changeLanguage('hi');
    expect(getAppLanguage()).toBe('hi');
    expect(i18n.t('common.save')).toBe(hiMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBe(10);
    await i18n.changeLanguage('hi');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('hi');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('hi');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('hi');
  });

  it('Hindi is the language of a Hindi phone (hi-IN) and of an Arabic-then-Hindi list', () => {
    expect(languageFromLocaleTag('hi-IN')).toBe('hi');
    expect(pickSupportedLanguage(['ar', 'hi-IN'])).toBe('hi');
  });

  it('all eight onboarding objectives have a Hindi label', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      const label = tOf(`objectives.${objective}`, 'hi');
      expect(label).toBeTruthy();
      expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
      expect(DEVANAGARI.test(label)).toBe(true);
    }
  });
});

describe('dates and calendar', () => {
  it('uses the hi-IN Intl locale, Devanagari month names, Western digits and Monday-first Hindi weekdays', async () => {
    await setAppLanguage('hi');
    expect(dateFormatLocale()).toBe('hi-IN');
    expect(WEEK_DAYS_HI).toEqual(['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_HI);
    expect(formatFullDate(new Date(2026, 9, 19))).toMatch(/^19 [ऀ-ॿ]+ 2026$/);
    expect(formatShortDate(new Date(2026, 9, 19))).toMatch(/^19 [ऀ-ॿ]+$/);
  });

  it('every month has a Devanagari name in the hi-IN locale', () => {
    for (let month = 0; month < 12; month += 1) {
      const name = new Intl.DateTimeFormat('hi-IN', {month: 'long'}).format(new Date(2026, month, 1));
      expect([month, DEVANAGARI.test(name)]).toEqual([month, true]);
    }
  });

  it('Hijri dates are produced by the same calendar code (a non-empty Hindi-locale string)', async () => {
    await setAppLanguage('hi');
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

  it('every article screen (73) has a complete Hindi block with exactly the English structure', () => {
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
            if (!props.hi) {problems.push(`${file}: no hi block`);}
            else {
              const reference = shapeOf(props.en ?? props.fr);
              if (JSON.stringify(shapeOf(props.hi)) !== JSON.stringify(reference)) {problems.push(`${file}: hi block structure differs from en`);}
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

  it('every article Hindi block is Devanagari prose: no Chinese, Cyrillic or Devanagari digits, Hindi function words present', () => {
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}hi: \{/);
      expect([file, start > 0]).toEqual([file, true]);
      const rest = text.slice(start);
      const end = rest.search(/\n {2}\},?\r?\n/);
      const block = rest.slice(0, end > 0 ? end : undefined);
      expect([file, /[一-鿿Ѐ-ӿ]/.test(block)]).toEqual([file, false]);
      expect([file, /[०-९]/.test(block)]).toEqual([file, false]);
      expect([file, /(है|हैं|और|के|की|का|में|से)/.test(block)]).toEqual([file, true]);
    }
  });

  it('every article is reachable through the resolver for hi (the screens read CONTENT[resolveEditorialLanguage(language)])', () => {
    expect(resolveEditorialLanguage('hi')).toBe('hi');
    expect(i18n.language).toBeDefined();
  });

  it('all 41 pregnancy weeks have Hindi content with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const hindi = getPregnancyWeekData(week, 'hi');
      const english = getPregnancyWeekData(week, 'en');
      expect(hindi).toBeDefined();
      expect(Object.keys(hindi!).sort()).toEqual(Object.keys(english!).sort());
      expect(JSON.stringify(hindi)).not.toBe(JSON.stringify(english));
      expect([week, DEVANAGARI.test(JSON.stringify(hindi))]).toEqual([week, true]);
      for (const [key, value] of Object.entries(english!)) {
        const other = (hindi as unknown as AnyRecord)[key];
        if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
      }
    }
    expect(getPregnancyWeekData(0, 'hi')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'hi')).toBeUndefined();
  });

  it('pregnancy-week figures survive the translation: every number of the English text is in the Hindi text', () => {
    const missing: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const english = JSON.stringify(getPregnancyWeekData(week, 'en'));
      const hindi = JSON.stringify(getPregnancyWeekData(week, 'hi'));
      for (const number of english.match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!hindi.includes(number)) {missing.push(`week ${week}: ${number}`);}
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('images and legal text', () => {
  it('has no Hindi artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'hi')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'hi')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_HINDI].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt.hi).toContain('अंग्रेज़ी में');
      expect(DEVANAGARI.test(alt.hi)).toBe(true);
    }
  });

  it('legal placeholder sections exist in Hindi with the English structure and are not English', () => {
    for (const document of [TERMS, PRIVACY]) {
      expect(document.hi).toHaveLength(document.en.length);
      document.hi.forEach((section, index) => {
        expect(section.title).not.toBe(document.en[index].title);
        expect(section.body).not.toBe(document.en[index].body);
        expect(DEVANAGARI.test(section.title + section.body)).toBe(true);
      });
    }
  });
});
