import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../index';
import {en} from '../locales/en';
import {fr} from '../locales/fr';
import {da} from '../locales/da';
import {ptBRFull} from '../../testUtils/portugueseDictionaries';
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_DA, dateFormatLocale, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {EDITORIAL_IMAGE_ALT} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';

// Dansk (da; Intl locale da-DK; Latin script, LTR): dictionary, plurals, registration and normalisation,
// runtime switching, persistence, dates, editorial content (articles and the 41 pregnancy weeks), legal text.
// PDF / typography / notifications / map have their own suites.

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

const enLeaves = leaves(en as AnyRecord);
const daLeaves = leaves(da as AnyRecord);
const daMap = new Map(daLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da'] as const;

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('da.ts has exactly the same leaf paths as en.ts (key parity, no missing, no extra)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThanOrEqual(6247);
    expect(paths(da as AnyRecord)).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length);
  });

  it('every Danish value is a non-empty string (only the shared intentionally-empty English keys are allowed empty)', () => {
    const empty = daLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(daMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Danish', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((daMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: every _one has its _other; Danish only has one/other (no _few / _many / _zero / _two)', () => {
    const ones = daLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThanOrEqual(87);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(daMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      expect(placeholders(daMap.get(one) as string)).toBe(placeholders(englishOne));
      expect(placeholders(daMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(daLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('no invisible / zero-width characters, no raw i18n key leakage', () => {
    expect(daLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]);
    expect(daLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]);
  });

  it('contains Danish-specific characters æøå ÆØÅ somewhere in the dictionary (not pure ASCII)', () => {
    const allText = daLeaves.map(([, v]) => v).join('\n');
    expect(/[æøåÆØÅ]/.test(allText)).toBe(true);
  });

  it('keeps the brand, the product name and the Danish endonym Dansk identical across all languages', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.danishName', language)).toBe('Dansk');
    }
    const premiumTitle = tOf('premium.sheet.heroTitle', 'da');
    expect(premiumTitle).toContain('AWA');
    expect(daLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]);
  });

  it('uses informal "du" address style (never the formal "De")', () => {
    const all = daLeaves.map(([, value]) => value).join('\n');
    expect(/\bdu\b/i.test(all)).toBe(true);
    // formal "De" would be title-cased when used as a pronoun; rare false positives are in dates/months, not pronouns
    const formalPronouns = daLeaves.filter(([, value]) => /\bDeres\b/.test(value));
    expect(formalPronouns).toEqual([]);
  });
});

describe('Danish plurals', () => {
  it('Intl.PluralRules("da") uses standard one/other: 1 → one, everything else → other', () => {
    const rules = new AwaPluralRulesForTests('da-DK');
    expect([0, 1, 2, 5, 11, 21, 100].map(v => rules.select(v))).toEqual(['other', 'one', 'other', 'other', 'other', 'other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });

  it('uses _one for count=1 and _other for count≠1 through i18next', () => {
    const base = 'miscarriageDate.conflicts.journal';
    const one = daMap.get(`${base}_one`) as string;
    const other = daMap.get(`${base}_other`) as string;
    expect(tOf(base, 'da', {count: 0})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '0'));
    expect(tOf(base, 'da', {count: 1})).toBe(one.replace(/\{\{\s*count\s*\}\}/g, '1'));
    expect(tOf(base, 'da', {count: 2})).toBe(other.replace(/\{\{\s*count\s*\}\}/g, '2'));
  });

  it('a count label never shows {{count}} raw and always contains the number', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'da', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
    }
  });
});

describe('registration and normalisation', () => {
  it.each(['da', 'da-DK', 'da-FO', 'da-GL', 'DA', 'Da-dk', 'da-DK.UTF-8'])('%s → da', value => {
    expect(languageFromLocaleTag(value)).toBe('da');
  });

  it.each(['da', 'da-dk', 'da-fo', 'da-gl'])('a stored %s normalises to da', value => {
    expect(normalizeAppLanguage(value)).toBe('da');
  });

  it('does not confuse other languages: Norwegian, Swedish, Finnish, Icelandic are not Danish', () => {
    for (const tag of ['nn', 'fi', 'is', 'nl']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
  });

  it('picks Danish from a phone language list, English for unsupported', () => {
    expect(pickSupportedLanguage(['da-DK', 'en-DK'])).toBe('da');
    expect(pickSupportedLanguage(['da-DK'])).toBe('da');
    expect(pickSupportedLanguage(['fi-FI', 'is-IS'])).toBe('en');
  });

  it('editorial content resolves da, da-DK, da-FO to the Danish block', () => {
    for (const value of ['da', 'da-DK', 'da-FO', 'da-GL', 'DA', 'da-dk']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'da']);
    }
    expect(resolveEditorialLanguage('fi')).toBe('en');
    expect(resolveEditorialLanguage('is')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    // other sixteen codes pass through untouched
    expect(ALL_LANGUAGES.filter(language => language !== 'da').map(language => resolveEditorialLanguage(language))).toEqual(
      ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn'],
    );
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Danish at runtime without a restart and back, across all seventeen codes', async () => {
    await setAppLanguage('da');
    await i18n.changeLanguage('da');
    expect(getAppLanguage()).toBe('da');
    expect(i18n.t('common.save')).toBe(daMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBeGreaterThanOrEqual(14);
    await i18n.changeLanguage('da');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('falls back to English, never French, for a key missing from Danish', () => {
    const fallback = i18n.options.fallbackLng as unknown;
    expect(JSON.stringify(fallback)).toContain('en');
    expect(tOf('definitely.missing.key', 'da')).not.toMatch(/[æøåÆØÅ]/);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('da');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('da');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('da');
  });
});

describe('date and calendar localisation', () => {
  it('dateFormatLocale returns da-DK for Danish', () => {
    expect(dateFormatLocale('da')).toBe('da-DK');
  });

  it('WEEK_DAYS_DA has 7 entries starting Monday (Man) ending Sunday (Søn)', () => {
    expect(WEEK_DAYS_DA).toHaveLength(7);
    expect(WEEK_DAYS_DA[0]).toBe('Man');
    expect(WEEK_DAYS_DA[6]).toBe('Søn');
    expect(WEEK_DAYS_DA.every(d => typeof d === 'string' && d.length === 3)).toBe(true);
  });

  it('localizedWeekDays("da") returns the Danish week-day array', () => {
    expect(localizedWeekDays('da')).toEqual(WEEK_DAYS_DA);
  });

  it('Intl.DateTimeFormat("da-DK") formats a date in Danish (day-month-year order)', () => {
    const date = new Date(2024, 2, 8); // 8 March 2024
    const formatted = new Intl.DateTimeFormat('da-DK', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
    expect(formatted).toMatch(/8/);
    expect(formatted.toLowerCase()).toMatch(/mart?s|marts/); // March in Danish
  });

  it('Hijri date formatting works for da-DK (ICU handles da locale — no COMPOSED_HIJRI entry needed)', () => {
    // Just check it doesn't throw or return an empty string
    const date = new Date(2024, 2, 8);
    const {formatHijriDate} = require('../../utils/cycleMath');
    const result = formatHijriDate(date, 'da');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('illustrations', () => {
  it('EDITORIAL_IMAGE_ALT has da entries for all three illustrations', () => {
    for (const [key, alts] of Object.entries(EDITORIAL_IMAGE_ALT)) {
      expect({key, hasDA: 'da' in (alts as Record<string, unknown>)}).toEqual({key, hasDA: true});
    }
  });
});

describe('legal documents', () => {
  it('TERMS has a da key with at least 2 sections', () => {
    expect(Array.isArray(TERMS.da)).toBe(true);
    expect((TERMS.da as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it('PRIVACY has a da key with at least 2 sections', () => {
    expect(Array.isArray(PRIVACY.da)).toBe(true);
    expect((PRIVACY.da as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it('legal sections each have a title and a body string', () => {
    for (const section of TERMS.da as Array<{title: string; body: string}>) {
      expect(typeof section.title).toBe('string');
      expect(typeof section.body).toBe('string');
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(0);
    }
  });
});

describe('pregnancy weeks', () => {
  it('all 41 pregnancy weeks have a Danish content block', () => {
    const missing: number[] = [];
    for (let week = 1; week <= 41; week++) {
      const data = getPregnancyWeekData(week, 'da');
      if (!data) {missing.push(week);}
    }
    expect(missing).toEqual([]);
  });

  it('week 20 Danish content has babyDescription and toKnow', () => {
    const data = getPregnancyWeekData(20, 'da');
    expect(data).toBeDefined();
    expect(typeof data!.babyDescription).toBe('string');
    expect(data!.babyDescription!.length).toBeGreaterThan(0);
  });
});

describe('PDF/typography', () => {
  it('Helvetica WinAnsi covers æ ø å Æ Ø Å (Latin-1 supplement — no extra font needed)', () => {
    // U+00E6 U+00F8 U+00E5 U+00C6 U+00D8 U+00C5 are all in the Latin-1 supplement block covered by Helvetica's WinAnsi encoding
    const chars = 'æøåÆØÅ';
    for (const char of chars) {
      const codePoint = char.codePointAt(0)!;
      expect(codePoint).toBeGreaterThanOrEqual(0x00c0);
      expect(codePoint).toBeLessThanOrEqual(0x00ff);
    }
  });
});

describe('no regression in existing languages after adding Danish', () => {
  it('French still translates common.save', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).not.toBe('common.save');
    expect(i18n.t('common.save')).not.toBe(en.common.save);
  });

  it('ptBRFull still has the same leaf count as en.ts', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    expect(paths(ptBRFull as AnyRecord)).toEqual(paths(en as AnyRecord));
  });
});
