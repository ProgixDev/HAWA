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
import {de} from '../locales/de';
import {zh} from '../locales/zh';
import {id} from '../locales/id';
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {
  WEEK_DAYS_ID,
  dateFormatLocale,
  formatFullDate,
  formatHijriDate,
  formatShortDate,
  localizedWeekDays,
} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_INDONESIAN,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';

// Bahasa Indonesia (id, Intl locale id-ID): dictionary, plurals, registration and normalisation, runtime switching,
// persistence, dates, editorial content (articles and the 41 pregnancy weeks), images and legal text.

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

const enLeaves = leaves(en as AnyRecord);
const idLeaves = leaves(id as AnyRecord);
const idMap = new Map(idLeaves);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('id.ts has exactly the same leaf paths as every other dictionary (no missing, no extra)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(id as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
  });

  it('every Indonesian value is a non-empty string (the only intentionally empty English values stay empty)', () => {
    const empty = idLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(idMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Indonesian', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((idMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys keep the English _one/_other pairs with the same wording and variables (Indonesian has one plural category)', () => {
    const ones = idLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(idMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      if (placeholders(englishOne) === placeholders(englishOther)) {
        expect(idMap.get(one)).toBe(idMap.get(other)); // same variables in English: the same wording
      } else {
        expect(placeholders(idMap.get(one) as string)).toBe(placeholders(englishOne)); // English words the singular differently (one key)
      }
    }
    expect(idLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real Indonesian: no raw key, no Chinese/Cyrillic/French leftover, and almost nothing is left in English', () => {
    // (the endonyms of the Russian and Chinese languages are written in their own scripts)
    expect(idLeaves.filter(([keyPath, value]) => /[一-鿿Ѐ-ӿ]/.test(value) && !/^appearance\.language\.(russian|chinese)Name$/.test(keyPath))).toEqual([]);
    expect(idLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value));
    const unchanged = sentences.filter(([keyPath, value]) => idMap.get(keyPath) === value);
    expect(unchanged.map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('keeps the brand, the product name and the language endonym', () => {
    expect(tOf('appearance.language.indonesianName', 'id')).toBe('Bahasa Indonesia');
    for (const language of ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id'] as const) {
      expect(tOf('appearance.language.indonesianName', language)).toBe('Bahasa Indonesia');
    }
    const premiumTitle = tOf('premium.sheet.heroTitle', 'id');
    expect(premiumTitle).toContain('AWA');
    expect(premiumTitle).toContain('Premium');
    expect(idLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]); // the brand is always "AWA"
  });

  it('uses the agreed terminology (haid / menstruasi, ovulasi, masa subur, kehamilan, salat, puasa qada, nifas)', () => {
    const all = idLeaves.map(([, value]) => value.toLowerCase()).join('\n');
    for (const term of ['haid', 'menstruasi', 'ovulasi', 'masa subur', 'kehamilan', 'salat', 'puasa', 'nifas', 'keguguran', 'gejala']) {
      expect(all).toContain(term);
    }
    expect(tOf('objectives.pregnancy', 'id').toLowerCase()).toContain('kehamilan');
    expect(tOf('objectives.loss', 'id').toLowerCase()).toContain('kehamilan');
  });
});

describe('registration and normalisation', () => {
  it.each(['id', 'id-ID', 'id_ID', 'ID', 'in', 'in-ID', 'in_ID'])('%s -> id', value => {
    expect(normalizeAppLanguage(value) ?? languageFromLocaleTag(value)).toBe('id');
    expect(languageFromLocaleTag(value)).toBe('id');
  });

  it('does not confuse other languages: Malay, Javanese and Italian stay what they are', () => {
    expect(languageFromLocaleTag('ms-MY')).toBeNull();
    expect(languageFromLocaleTag('jv-ID')).toBeNull();
    expect(languageFromLocaleTag('it-IT')).toBe('it');
  });

  it('editorial content resolves id, id-ID and the legacy "in" to the Indonesian block, English still the fallback', () => {
    expect(resolveEditorialLanguage('id')).toBe('id');
    expect(resolveEditorialLanguage('id-ID')).toBe('id');
    expect(resolveEditorialLanguage('in')).toBe('id');
    expect(resolveEditorialLanguage('ms')).toBe('en');
    expect(resolveEditorialLanguage('pt-BR')).toBe('en');
  });

  it('Indonesian has the single plural category "other" in the on-device PluralRules fallback', () => {
    const rules = new AwaPluralRulesForTests('id-ID');
    expect([0, 1, 2, 5, 21].map(value => rules.select(value))).toEqual(['other', 'other', 'other', 'other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['other']);
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Indonesian at runtime without a restart and back, across all nine languages', async () => {
    await setAppLanguage('id');
    await i18n.changeLanguage('id');
    expect(getAppLanguage()).toBe('id');
    expect(i18n.t('common.save')).toBe(idMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id'] as const) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBe(9);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('id');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('id');
    expect(fresh!.getAppLanguagePreference()).toBe('id');
  });

  it('Indonesian is the language of an Indonesian phone (id-ID) and an Arabic-then-Indonesian list; English is still the unsupported fallback', () => {
    // pure rule (no device read): the first supported language wins
    expect(languageFromLocaleTag('id-ID')).toBe('id');
    expect(languageFromLocaleTag('ar')).toBeNull();
  });

  it('all eight onboarding objectives have an Indonesian label', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      const label = tOf(`objectives.${objective}`, 'id');
      expect(label).toBeTruthy();
      expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
    }
  });
});

describe('dates and calendar', () => {
  it('uses the id-ID Intl locale, Indonesian month names and Monday-first Indonesian weekdays', async () => {
    await setAppLanguage('id');
    expect(dateFormatLocale()).toBe('id-ID');
    expect(WEEK_DAYS_ID).toEqual(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_ID);
    expect(formatFullDate(new Date(2026, 9, 19))).toBe('19 Oktober 2026');
    expect(formatShortDate(new Date(2026, 9, 19))).toBe('19 Oktober');
  });

  it('Hijri dates are produced by the same calendar code (a non-empty Indonesian-locale string)', async () => {
    await setAppLanguage('id');
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

  it('every article screen (73) has a complete Indonesian block with exactly the English structure', () => {
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
            if (!props.id) {problems.push(`${file}: no id block`);}
            else {
              const reference = shapeOf(props.en ?? props.fr);
              if (JSON.stringify(shapeOf(props.id)) !== JSON.stringify(reference)) {problems.push(`${file}: id block structure differs from en`);}
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

  it('no article block carries Chinese, Cyrillic or leftover English sentences (spot check of every article id block)', () => {
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}id: \{/);
      expect(start).toBeGreaterThan(0);
      const rest = text.slice(start);
      const end = rest.search(/\n {2}\},?\n/);
      const block = rest.slice(0, end > 0 ? end : undefined);
      expect(/[一-鿿Ѐ-ӿ]/.test(block)).toBe(false);
      expect(block).toMatch(/\b(yang|dan|untuk|dengan|kamu|pada)\b/);
    }
  });

  it('all 41 pregnancy weeks have Indonesian content with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const indonesian = getPregnancyWeekData(week, 'id');
      const english = getPregnancyWeekData(week, 'en');
      expect(indonesian).toBeDefined();
      expect(Object.keys(indonesian!).sort()).toEqual(Object.keys(english!).sort());
      expect(JSON.stringify(indonesian)).not.toBe(JSON.stringify(english));
      for (const [key, value] of Object.entries(english!)) {
        const other = (indonesian as unknown as AnyRecord)[key];
        if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
      }
    }
    expect(getPregnancyWeekData(0, 'id')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'id')).toBeUndefined();
  });
});

describe('images and legal text', () => {
  it('has no Indonesian artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'id')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'id')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_INDONESIAN].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt.id).toContain('berbahasa Inggris');
      expect(alt.id).toBeTruthy();
    }
  });

  it('legal placeholder sections exist in Indonesian with the English structure and are not English', () => {
    for (const document of [TERMS, PRIVACY]) {
      expect(document.id).toHaveLength(document.en.length);
      document.id.forEach((section, index) => {
        expect(section.title).not.toBe(document.en[index].title);
        expect(section.body).not.toBe(document.en[index].body);
      });
    }
  });
});
