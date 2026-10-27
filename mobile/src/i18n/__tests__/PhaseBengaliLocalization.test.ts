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
import {ja} from '../locales/ja';
import {ko} from '../locales/ko';
import {bn} from '../locales/bn';
import {ptPT, ptBRFull} from '../../testUtils/portugueseDictionaries';
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_BN, dateFormatLocale, formatFullDate, formatHijriDate, formatShortDate, localizedWeekDays} from '../../utils/cycleMath';
import {foldForConfirmation} from '../../utils/textCase';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_BENGALI,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests, hindiCardinal} from '../pluralRules';

// বাংলা (bn; Intl locale bn-BD, bn-IN accepted; Bengali script, left-to-right): dictionary, plurals, registration and normalisation,
// runtime switching, persistence, dates, editorial content (articles and the 41 pregnancy weeks), images and legal text.
// PDF / typography / notifications / map have their own suites (medicalExportBengaliLayout, awaTypographyBengali,
// notificationBengaliLocalization, mapLanguage).

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
const INVISIBLE = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0x2028, 0x2029, 0xfeff) + ']');
const BENGALI = /[ঀ-৿]/;
const nfc = (value: string) => value.normalize('NFC');

const enLeaves = leaves(en as AnyRecord);
const bnLeaves = leaves(bn as AnyRecord);
const bnMap = new Map(bnLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da'] as const;

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('bn.ts has exactly the same leaf paths as every other dictionary — sixteen-code parity, no missing, no extra', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBe(6272);
    expect(paths(bn as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh, id, hi, sq, ja, ko, ptPT]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
    // the Brazilian overlay is complete once merged over Portugal's text
    expect(paths(ptBRFull as AnyRecord)).toEqual(reference);
    // Russian has four plural forms: besides the shared keys it carries the extra _few / _many ones.
    expect(paths(ru as AnyRecord).filter(keyPath => !/_(few|many)$/.test(keyPath))).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length); // no duplicate key paths
  });

  it('every Bengali value is a non-empty string (the only intentionally empty English values stay empty)', () => {
    const empty = bnLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    // onboarding.welcome.brandPrefix is the "Welcome / to / AWA" lockup's middle word: Bengali says « স্বাগতম » + (nothing) + « AWA » (see the review checklist)
    expect(empty).toEqual([...englishEmpty, 'onboarding.welcome.brandPrefix'].sort());
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(bnMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Bengali', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((bnMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: every _one has its _other, both with the English variables; only one / other exist (88 _one keys: 87 copies + 1 hand-translated)', () => {
    const ones = bnLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBe(88);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(bnMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      expect(placeholders(bnMap.get(one) as string)).toBe(placeholders(englishOne));
      expect(placeholders(bnMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(bnLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
    // Bengali does not inflect after a number: a _one text is its _other text, except the one sentence that differs in English
    const different = ones.filter(one => bnMap.get(one) !== bnMap.get(one.replace(/_one$/, '_other')));
    expect(different).toEqual(['miscarriageDate.conflicts.journal_one']);
  });

  it('is real Bengali: Bengali script where it should be, NFC, no raw key, no foreign script, no Bengali digits, no Assamese ৰ ৱ, no zero-width characters', () => {
    // (the endonyms of the other languages are written in their own scripts)
    expect(bnLeaves.filter(([keyPath, value]) => /[一-鿿Ѐ-ӿऀ-ॣ०-ॿ؀-ۿ가-힯぀-ヿ]/.test(value) && !/^appearance\.language\.[a-zA-Z]+Name$/.test(keyPath))).toEqual([]);
    expect(bnLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    expect(bnLeaves.filter(([, value]) => /[০-৯]/.test(value))).toEqual([]); // Western digits 0-9 only
    expect(bnLeaves.filter(([, value]) => /[ৰৱ]/.test(value))).toEqual([]); // Assamese-only letters
    expect(bnLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]); // no ZWSP / ZWNJ / ZWJ / BOM / line separators
    expect(bnLeaves.filter(([, value]) => value !== nfc(value)).map(([keyPath]) => keyPath)).toEqual([]); // ড় ঢ় য় are the standard letters
    expect(bnLeaves.filter(([, value]) => /॥/.test(value))).toEqual([]); // the dari U+0964, never the double danda
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value));
    expect(sentences.filter(([keyPath, value]) => bnMap.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
    expect(sentences.filter(([keyPath]) => !BENGALI.test(bnMap.get(keyPath) as string)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('punctuation: the dari ends a Bengali sentence (no ASCII full stop after Bengali text), no space before , ? ! ।, no Bengali case ending glued to a non-numeric variable', () => {
    expect(bnLeaves.filter(([, value]) => /[ঀ-৿]\.(\s|$)/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(bnLeaves.filter(([, value]) => /[ঀ-৿] [।,?!]/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    const numeric = 'count|day|days|total|value|hours|hour|month|months|year|week|weeks|minutes|minute|max|min|goal|current|breakDays|cyclesAnalyzed|trackedDays|seconds|activeDays|digit|angle|gregorianYear|dayStart|dayEnd|dominant|length|shortest|longest|cycles|tracked|duration|rank|build|number|age';
    const glued = new RegExp(`\\{\\{(?!(?:${numeric})\\}\\})[\\w.]+\\}\\}[ঀ-৿]`);
    expect(bnLeaves.filter(([, value]) => glued.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('keeps no ordinary English word in Latin letters (brands, product names such as "AWA Together" and "AWA Original", lab acronyms and developer paths excepted)', () => {
    const allowedWords = new Set(['awa', 'premium', 'pin', 'pdf', 'csv', 'ok', 'face', 'id', 'wi', 'fi', 'google', 'android', 'ios', 'apple', 'huawei',
      'whatsapp', 'gmail', 'sms', 'maptiler', 'src', 'config', 'maps', 'ts', 'deux', 'together', 'original', 'wifi', 'qr', 'url', 'gps', 'app', 'a', 'à', 'hba', 'hb', 'ng', 'ml', 'kg', 'cm', 'mg', 'fsh', 'lh', 'hcg', 'bmi', 'iud', 'pcos', 'touch', 'play', 'store']);
    const bad: string[] = [];
    for (const [keyPath, value] of bnLeaves) {
      if (/^appearance\.language\.[A-Za-z]+Name$/.test(keyPath)) {continue;} // language endonyms (Français, Deutsch, …)
      const stripped = value.replace(/\{\{[^}]*\}\}/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\S+@\S+/g, ' ');
      const words = (stripped.match(/[A-Za-zÀ-ÿ]{2,}/g) ?? []).filter(word => !allowedWords.has(word.toLowerCase()) && !/^[A-Z0-9]{2,6}$/.test(word));
      if (words.length > 0) {bad.push(`${keyPath}: ${words.join(', ')}`);}
    }
    expect(bad).toEqual([]);
  });

  it('keeps the brand, the product name and the language endonym বাংলা (identical in every language)', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.bengaliName', language)).toBe('বাংলা');
    }
    const premiumTitle = tOf('premium.sheet.heroTitle', 'bn');
    expect(premiumTitle).toContain('AWA');
    expect(premiumTitle).toContain('Premium');
    expect(bnLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]); // the brand is always "AWA"
  });

  it('uses the agreed terminology (মাসিক, ডিম্বস্ফোটন, গর্ভাবস্থা, নামাজ, রোজা, কাজা, নিফাস, ইস্তিহাযা, হিজরি, প্রসব) and the polite আপনি, never তুমি / তুই', () => {
    const all = nfc(bnLeaves.map(([, value]) => value).join('\n'));
    for (const term of ['মাসিক', 'ডিম্বস্ফোটন', 'গর্ভাবস্থা', 'নামাজ', 'রোজা', 'কাজা', 'নিফাস', 'ইস্তিহাযা', 'হিজরি', 'প্রসব', 'গর্ভপাত', 'লক্ষণ', 'আপনি', 'আপনার']) {
      expect(all).toContain(nfc(term));
    }
    expect(nfc(tOf('objectives.pregnancy', 'bn'))).toContain(nfc('গর্ভাবস্থা'));
    expect(bnLeaves.filter(([, value]) => /(^|[^ঀ-৿])(তুমি|তোমার|তোমাকে|তোমাদের|তুই|তোর)(?![ঀ-৿])/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('uses Bangladeshi Muslim vocabulary for prayer and fasting, not the Hindi / Urdu forms', () => {
    const all = nfc(bnLeaves.map(([, value]) => value).join('\n'));
    for (const avoided of ['नमाज़', 'रोज़ा', 'ক়জা', 'সালাত আদায়']) {
      expect([avoided, all.includes(avoided)]).toEqual([avoided, false]);
    }
  });
});

describe('Bengali plurals', () => {
  it('the on-device PluralRules fallback follows CLDR: one for an integer part of 0 and for 1, other otherwise', () => {
    const rules = new AwaPluralRulesForTests('bn-BD');
    expect([0, 1, 2, 5, 11, 21, 100].map(value => rules.select(value))).toEqual(['one', 'one', 'other', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5, 2.5].map(value => rules.select(value))).toEqual(['one', 'other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
    expect(new AwaPluralRulesForTests('bn-IN').select(1)).toBe('one');
  });

  it('agrees with the engine\'s own Intl.PluralRules("bn") for integers and the common fractions', () => {
    const native = new Intl.PluralRules('bn');
    for (const value of [...Array.from({length: 121}, (_, index) => index), 0.5, 1.5, 2.5, 10.5]) {
      expect([value, hindiCardinal(value)]).toEqual([value, native.select(value)]);
    }
  });

  it('uses the _one form for 0 and 1 and the _other form from 2, through i18next (one hand-translated pair proves the machinery)', () => {
    const base = 'miscarriageDate.conflicts.journal';
    const one = bnMap.get(`${base}_one`) as string;
    const other = bnMap.get(`${base}_other`) as string;
    expect(one).not.toBe(other);
    expect(tOf(base, 'bn', {count: 0})).toBe(one.replace(/\{\{\s*count\s*\}\}/g, '0'));
    expect(tOf(base, 'bn', {count: 1})).toBe(one.replace(/\{\{\s*count\s*\}\}/g, '1'));
    expect(tOf(base, 'bn', {count: 2})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '2'));
    expect(tOf(base, 'bn', {count: 28})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '28'));
  });

  it('a count label never shows a raw {{count}} or an English fallback in Bengali, and reads the same after a number (no inflection)', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'bn', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
      expect(BENGALI.test(text)).toBe(true);
    }
    expect(tOf('export.pdf.daysCount', 'bn', {count: 1}).replace('1', '#')).toBe(tOf('export.pdf.daysCount', 'bn', {count: 7}).replace('7', '#'));
  });
});

describe('registration and normalisation', () => {
  it.each(['bn', 'bn-BD', 'bn-IN', 'bn_BD', 'bn_IN', 'BN', 'Bn-bd', 'bn-Beng', 'bn-Beng-BD', 'bn-Beng-IN', 'bn-BD.UTF-8'])('%s -> bn', value => {
    expect(languageFromLocaleTag(value)).toBe('bn');
  });

  it.each(['bn', 'bn-BD', 'bn-IN', 'bn_bd', 'bn_in', 'bn-Beng'])('a stored %s normalises to bn', value => {
    expect(normalizeAppLanguage(value)).toBe('bn');
  });

  it('does not confuse other languages: Bengali in Roman letters, Assamese, Hindi, Urdu and Nepali are not Bengali', () => {
    for (const tag of ['bn-Latn', 'bn-Latn-BD', 'bn_Latn', 'as', 'as-IN', 'ur-IN', 'ur-PK']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
    expect(languageFromLocaleTag('ne-NP')).toBe('ne'); // Nepali is a supported language of its own
    expect(languageFromLocaleTag('hi-IN')).toBe('hi');
    expect(languageFromLocaleTag('id-ID')).toBe('id');
  });

  it('picks Bengali from a phone list, English for an unsupported one', () => {
    expect(pickSupportedLanguage(['bn-BD', 'en-BD'])).toBe('bn');
    expect(pickSupportedLanguage(['as-IN', 'bn-IN'])).toBe('bn');
    expect(pickSupportedLanguage(['as-IN', 'ur-IN'])).toBe('en');
    expect(pickSupportedLanguage(['bn-Latn-BD'])).toBe('en');
  });

  it('editorial content resolves bn, bn-BD, bn-IN and bn-Beng to the Bengali block; English stays the fallback', () => {
    for (const value of ['bn', 'bn-BD', 'bn_IN', 'bn-Beng', 'BN', 'bn-Beng-BD']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'bn']);
    }
    expect(resolveEditorialLanguage('bn-Latn')).toBe('en');
    expect(resolveEditorialLanguage('as')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    // the other sixteen codes are untouched
    expect(ALL_LANGUAGES.filter(language => language !== 'bn').map(language => resolveEditorialLanguage(language))).toEqual(
      ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'da'],
    );
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Bengali at runtime without a restart and back, across all sixteen codes', async () => {
    await setAppLanguage('bn');
    await i18n.changeLanguage('bn');
    expect(getAppLanguage()).toBe('bn');
    expect(i18n.t('common.save')).toBe(bnMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBeGreaterThanOrEqual(14); // pt-PT / pt-BR (and a few others) may share the word
    await i18n.changeLanguage('bn');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('falls back to English, never French, for a key a Bengali dictionary would lack', () => {
    const fallback = i18n.options.fallbackLng as unknown;
    expect(JSON.stringify(fallback)).toContain('en');
    expect(tOf('definitely.missing.key', 'bn')).not.toMatch(/[ঀ-৿]/);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('bn');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('bn');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('bn');
  });

  it('Bengali is the language of a Bangladeshi and of a West Bengal phone, and of an Arabic-then-Bengali list', () => {
    expect(languageFromLocaleTag('bn-BD')).toBe('bn');
    expect(languageFromLocaleTag('bn-IN')).toBe('bn');
    expect(pickSupportedLanguage(['ar', 'bn-BD'])).toBe('bn');
  });

  it('all eight onboarding objectives have a Bengali label', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      const label = tOf(`objectives.${objective}`, 'bn');
      expect(label).toBeTruthy();
      expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
      expect(BENGALI.test(label)).toBe(true);
    }
  });
});

describe('dates and calendar', () => {
  it('uses the bn-BD Intl locale with Latin digits, Bengali month names and Monday-first Bengali weekdays', async () => {
    await setAppLanguage('bn');
    expect(dateFormatLocale()).toBe('bn-BD-u-nu-latn');
    expect(WEEK_DAYS_BN).toEqual(['সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি', 'রবি']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_BN);
    expect(formatFullDate(new Date(2026, 9, 19))).toMatch(/^19 [ঀ-৿]+,? 2026$/);
    expect(formatShortDate(new Date(2026, 9, 19))).toMatch(/^19 [ঀ-৿]+$/);
  });

  it('every month has a Bengali name in the bn-BD locale, and no Bengali digit is produced', () => {
    for (let month = 0; month < 12; month += 1) {
      const name = new Intl.DateTimeFormat('bn-BD-u-nu-latn', {month: 'long'}).format(new Date(2026, month, 1));
      expect([month, BENGALI.test(name), /[০-৯]/.test(name)]).toEqual([month, true, false]);
    }
  });

  it('Hijri dates are composed with Bengali month names (ICU prints the month as a number): « 12 রমজান 1447 হিজরি »', async () => {
    await setAppLanguage('bn');
    const hijri = formatHijriDate(new Date(2026, 2, 1));
    expect(typeof hijri).toBe('string');
    expect(hijri as string).toMatch(/^\d{1,2} [ঀ-৿ ]+ 1447 হিজরি$/);
    expect(hijri as string).not.toMatch(/AH|[০-৯]/);
    const months = new Set<string>();
    for (let offset = 0; offset < 360; offset += 29) {
      months.add((formatHijriDate(new Date(2026, 0, 1 + offset)) as string).replace(/^\d+ | \d+ হিজরি$/g, ''));
    }
    expect(months.size).toBeGreaterThanOrEqual(11); // twelve distinct names over a year, none of them a number
    for (const month of months) {
      expect([month, BENGALI.test(month), /\d/.test(month)]).toEqual([month, true, false]);
    }
  });
});

describe('typed confirmation word', () => {
  it('compares a typed Bengali word after NFC and without zero-width joiners, so every keyboard spelling matches', () => {
    const word = 'মুছুন';
    expect(foldForConfirmation(word, 'bn')).toBe(foldForConfirmation(word.normalize('NFD'), 'bn'));
    expect(foldForConfirmation('মু‍ছু‌ন', 'bn')).toBe(foldForConfirmation(word, 'bn'));
    expect(foldForConfirmation(' মুছুন ', 'bn').trim()).toBe(foldForConfirmation(word, 'bn'));
    expect(foldForConfirmation('মুছুনা', 'bn')).not.toBe(foldForConfirmation(word, 'bn'));
    expect(tOf('backupUtility.delete.confirmWord', 'bn')).toBe(word);
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

  it('every article screen (73) has a complete Bengali block with exactly the English structure', () => {
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
            if (!props.bn) {problems.push(`${file}: no bn block`);}
            else {
              const reference = shapeOf(props.en ?? props.fr);
              if (JSON.stringify(shapeOf(props.bn)) !== JSON.stringify(reference)) {problems.push(`${file}: bn block structure differs from en`);}
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

  it('every article Bengali block is Bengali prose: no Chinese, Cyrillic, Devanagari, Bengali digits or Assamese letters, Bengali function words present, NFC', () => {
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}bn: \{/);
      expect([file, start > 0]).toEqual([file, true]);
      const rest = text.slice(start);
      const end = rest.search(/\n {2}\},?\r?\n/);
      const block = rest.slice(0, end > 0 ? end : undefined);
      expect([file, /[一-鿿Ѐ-ӿऀ-ॣ०-ॿ]/.test(block)]).toEqual([file, false]);
      expect([file, /[০-ৱ]/.test(block)]).toEqual([file, false]);
      expect([file, INVISIBLE.test(block)]).toEqual([file, false]);
      expect([file, block === nfc(block)]).toEqual([file, true]);
      expect([file, /(এবং|ও |এর|করে|হয়|জন্য|থেকে|আপনার)/.test(block)]).toEqual([file, true]);
    }
  });

  it('every article is reachable through the resolver for bn (the screens read CONTENT[resolveEditorialLanguage(language)])', () => {
    expect(resolveEditorialLanguage('bn')).toBe('bn');
    expect(i18n.language).toBeDefined();
  });

  it('all 41 pregnancy weeks have Bengali content with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const bengali = getPregnancyWeekData(week, 'bn');
      const english = getPregnancyWeekData(week, 'en');
      expect(bengali).toBeDefined();
      expect(Object.keys(bengali!).sort()).toEqual(Object.keys(english!).sort());
      expect(JSON.stringify(bengali)).not.toBe(JSON.stringify(english));
      expect([week, BENGALI.test(JSON.stringify(bengali))]).toEqual([week, true]);
      for (const [key, value] of Object.entries(english!)) {
        const other = (bengali as unknown as AnyRecord)[key];
        if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
      }
    }
    expect(getPregnancyWeekData(0, 'bn')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'bn')).toBeUndefined();
  });

  it('pregnancy-week figures survive the translation: every number of the English text is in the Bengali text', () => {
    const missing: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const english = JSON.stringify(getPregnancyWeekData(week, 'en'));
      const bengali = JSON.stringify(getPregnancyWeekData(week, 'bn'));
      for (const number of english.match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!bengali.includes(number)) {missing.push(`week ${week}: ${number}`);}
      }
    }
    expect(missing).toEqual([]);
  });

  it('the size comparisons the audit replaced are familiar to Bengali readers (week 34: খরমুজ, not a watermelon; week 38: no rhubarb)', () => {
    const week34 = JSON.stringify(getPregnancyWeekData(34, 'bn'));
    const week38 = JSON.stringify(getPregnancyWeekData(38, 'bn'));
    expect(week34).toContain('খরমুজ');
    expect(week38).not.toContain('রেউচিনি');
  });
});

describe('images and legal text', () => {
  it('has no Bengali artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'bn')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'bn')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_BENGALI].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt.bn).toContain('ইংরেজিতে');
      expect(BENGALI.test(alt.bn)).toBe(true);
    }
  });

  it('legal placeholder sections exist in Bengali with the English structure and are not English', () => {
    for (const document of [TERMS, PRIVACY]) {
      expect(document.bn).toHaveLength(document.en.length);
      document.bn.forEach((section, index) => {
        expect(section.title).not.toBe(document.en[index].title);
        expect(section.body).not.toBe(document.en[index].body);
        expect(BENGALI.test(section.title + section.body)).toBe(true);
      });
    }
  });
});
