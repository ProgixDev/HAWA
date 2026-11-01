import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../index';
import {en} from '../locales/en';
import {fr} from '../locales/fr';
import {ms} from '../locales/ms';
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
import {WEEK_DAYS_MS, dateFormatLocale, formatHijriDate, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {EDITORIAL_IMAGE_ALT} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';

// Bahasa Melayu (ms; Intl locale ms-MY; standard Malaysian Malay, Latin script, LTR): dictionary, plurals, registration and
// normalisation, runtime switching, persistence, dates (composed Hijri), editorial content (articles and the 41 pregnancy weeks), legal text.
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
const msLeaves = leaves(ms as AnyRecord);
const msMap = new Map(msLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da', 'ms'] as const;

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('ms.ts has exactly the same leaf paths as en.ts (key parity, no missing, no extra)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThanOrEqual(6273);
    expect(paths(ms as AnyRecord)).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length);
  });

  it('every Malay value is a non-empty string (only the shared intentionally-empty English keys are allowed empty)', () => {
    const empty = msLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(msMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Malay', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((msMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: every _one has its _other; Malay has a single CLDR category (other), so no _few / _many / _zero / _two', () => {
    const ones = msLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThanOrEqual(87);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(msMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      expect(placeholders(msMap.get(one) as string)).toBe(placeholders(englishOne));
      expect(placeholders(msMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(msLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('no invisible / zero-width characters, no raw i18n key leakage', () => {
    expect(msLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]);
    expect(msLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]);
  });

  it('keeps the brand, the product name and the Malay endonym Bahasa Melayu identical across all languages', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.malayName', language)).toBe('Bahasa Melayu');
    }
    const premiumTitle = tOf('premium.sheet.heroTitle', 'ms');
    expect(premiumTitle).toContain('AWA');
    expect(msLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]);
  });

  it('uses Malay (Latin script) — no Arabic-script (Jawi), Cyrillic or CJK characters in the dictionary', () => {
    // the endonyms of the OTHER languages in the language list (appearance.language.*Name: Русский, 简体中文, Қазақ тілі ...) are native-script by design
    const all = msLeaves.filter(([keyPath]) => !keyPath.startsWith('appearance.language.')).map(([, value]) => value).join('\n');
    expect(/[؀-ۿЀ-ӿ぀-ヿ一-鿿]/.test(all)).toBe(false);
  });

  it('keeps the Arabic greeting As-salamu ‘alaykum and uses the Malay religious vocabulary (haid, nifas, Zulhijjah)', () => {
    expect(msMap.get('cycleHome.greeting')).toBe('As-salamu ‘alaykum,');
    const all = msLeaves.map(([, value]) => value).join('\n');
    expect(/\bhaid\b/i.test(all)).toBe(true);
    expect(/\bnifas\b/i.test(all)).toBe(true);
    expect(all).toContain('Zulhijjah');
  });
});

describe('Malay plurals', () => {
  it('Intl.PluralRules("ms") has the single CLDR category "other" for every count', () => {
    const rules = new AwaPluralRulesForTests('ms-MY');
    expect([0, 1, 2, 5, 11, 21, 100].map(v => rules.select(v))).toEqual(['other', 'other', 'other', 'other', 'other', 'other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['other']);
  });

  it('a count label never shows {{count}} raw and always contains the number', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'ms', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
    }
  });
});

describe('registration and normalisation', () => {
  it.each(['ms', 'ms-MY', 'ms-BN', 'ms-SG', 'MS', 'Ms-my', 'ms_MY', 'ms-Latn-MY'])('%s → ms', value => {
    expect(languageFromLocaleTag(value)).toBe('ms');
  });

  it.each(['ms', 'ms-my', 'msa', 'may', 'malay', 'ms_MY', 'ms-latn'])('a stored %s normalises to ms', value => {
    expect(normalizeAppLanguage(value)).toBe('ms');
  });

  it('does not confuse other languages: Indonesian stays id, Javanese / Sundanese / Minangkabau are not Malay', () => {
    expect(languageFromLocaleTag('id')).toBe('id');
    for (const tag of ['jv', 'su', 'min', 'af']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
  });

  it('picks Malay from a phone language list, English for unsupported', () => {
    expect(pickSupportedLanguage(['ms-MY', 'en-MY'])).toBe('ms');
    expect(pickSupportedLanguage(['ms-MY'])).toBe('ms');
    expect(pickSupportedLanguage(['jv-ID', 'su-ID'])).toBe('en');
  });

  it('editorial content resolves ms, ms-MY, ms-Latn-MY to the Malay block', () => {
    for (const value of ['ms', 'ms-MY', 'ms_MY', 'ms-Latn-MY', 'MS', 'ms-my']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'ms']);
    }
    expect(resolveEditorialLanguage('jv')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    // the other codes pass through untouched
    expect(ALL_LANGUAGES.filter(language => language !== 'ms').map(language => resolveEditorialLanguage(language))).toEqual(
      ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da'],
    );
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Malay at runtime without a restart and back', async () => {
    await setAppLanguage('ms');
    await i18n.changeLanguage('ms');
    expect(getAppLanguage()).toBe('ms');
    expect(i18n.t('common.save')).toBe(msMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBeGreaterThanOrEqual(14);
    await i18n.changeLanguage('ms');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('falls back to English, never French, for a key missing from Malay', () => {
    const fallback = i18n.options.fallbackLng as unknown;
    expect(JSON.stringify(fallback)).toContain('en');
    expect(tOf('definitely.missing.key', 'ms')).not.toMatch(/[àâçéèêëîïôûùüÿœ]/i);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('ms');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('ms');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('ms');
  });
});

describe('date and calendar localisation', () => {
  it('dateFormatLocale returns ms-MY for Malay', () => {
    expect(dateFormatLocale('ms')).toBe('ms-MY');
  });

  it('WEEK_DAYS_MS has 7 entries starting Monday (Isn) ending Sunday (Ahd)', () => {
    expect(WEEK_DAYS_MS).toEqual(['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd']);
    expect(WEEK_DAYS_MS.every(d => typeof d === 'string' && d.length === 3)).toBe(true);
  });

  it('localizedWeekDays("ms") returns the Malay week-day array', () => {
    expect(localizedWeekDays('ms')).toEqual(WEEK_DAYS_MS);
  });

  it('Intl.DateTimeFormat("ms-MY") formats a date in Malay (day-month-year order, March = Mac)', () => {
    const date = new Date(2024, 2, 8); // 8 March 2024
    const formatted = new Intl.DateTimeFormat('ms-MY', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
    expect(formatted).toMatch(/8/);
    expect(formatted).toMatch(/Mac/);
  });

  it('Hijri dates are composed from the numeric Islamic parts with the Malay month names (Syaaban 1445H around 8 March 2024)', async () => {
    // formatHijriDate(date) reads the app language, so Malay must be the active app language
    await setAppLanguage('ms');
    try {
      const result = formatHijriDate(new Date(2024, 2, 8));
      expect(typeof result).toBe('string');
      expect(result as string).toMatch(/^\d{1,2} Syaaban 1445H$/);
    } finally {
      await resetAppLanguageForTests();
    }
  });
});

describe('illustrations', () => {
  it('EDITORIAL_IMAGE_ALT has ms entries for all three illustrations, saying that the lettering is English', () => {
    for (const [key, alts] of Object.entries(EDITORIAL_IMAGE_ALT)) {
      const alt = (alts as Record<string, string>).ms;
      expect({key, hasMS: typeof alt === 'string' && alt.length > 0}).toEqual({key, hasMS: true});
      expect(alt).toContain('bahasa Inggeris');
    }
  });
});

describe('legal documents', () => {
  it('TERMS and PRIVACY have an ms key with at least 2 sections', () => {
    expect(Array.isArray(TERMS.ms)).toBe(true);
    expect((TERMS.ms as unknown[]).length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(PRIVACY.ms)).toBe(true);
    expect((PRIVACY.ms as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it('legal sections each have a title and a body string', () => {
    for (const section of [...(TERMS.ms as Array<{title: string; body: string}>), ...(PRIVACY.ms as Array<{title: string; body: string}>)]) {
      expect(typeof section.title).toBe('string');
      expect(typeof section.body).toBe('string');
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(0);
    }
  });
});

describe('pregnancy weeks', () => {
  it('all 41 pregnancy weeks have a Malay content block that differs from English', () => {
    const missing: number[] = [];
    for (let week = 1; week <= 41; week++) {
      const data = getPregnancyWeekData(week, 'ms');
      const english = getPregnancyWeekData(week, 'en');
      if (!data || !data.babyDescription || data.babyDescription === english?.babyDescription) {missing.push(week);}
    }
    expect(missing).toEqual([]);
  });

  it('week 20 Malay content has babyDescription, length, comparison and toKnow', () => {
    const data = getPregnancyWeekData(20, 'ms');
    expect(data).toBeDefined();
    expect(typeof data!.babyDescription).toBe('string');
    expect(data!.length).toBe('Kira-kira 25.6 cm');
    expect(data!.comparison).toBe('Pisang');
    expect(data!.toKnow!.length).toBeGreaterThan(0);
  });
});

describe('PDF/typography', () => {
  it('every letter of the Malay interface (language endonyms excluded) is inside Latin-1, so Helvetica WinAnsi covers it and no extra PDF font is needed', () => {
    const outside = new Set<string>();
    for (const [keyPath, value] of msLeaves) {
      if (keyPath.startsWith('appearance.language.')) {continue;}
      for (const char of value) {
        if (/\p{L}/u.test(char) && char.codePointAt(0)! > 0xff) {outside.add(char);}
      }
    }
    expect([...outside]).toEqual([]);
  });
});

describe('no regression in existing languages after adding Malay', () => {
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
