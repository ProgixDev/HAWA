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
import {zh} from '../locales/zh';
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
  WEEK_DAYS_ZH,
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
  EDITORIAL_IMAGES_MISSING_CHINESE,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import {AwaPluralRulesForTests} from '../pluralRules';
import {planCycleRingText} from '../../components/home/cycleRingLayout';

// Simplified Chinese (zh, zh-CN) — dictionary, plurals, runtime, persistence, dates and case rules, editorial content,
// images, legal text. The language code is the bare "zh"; its Intl locale is "zh-CN".

type AnyRecord = Record<string, unknown>;
const CJK = /[一-鿿]/;

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
const zhLeaves = leaves(zh as AnyRecord);
const zhMap = new Map(zhLeaves);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('zh.ts has exactly the same leaf paths as en.ts, fr, es, it, tr and de (no missing, no extra)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(zh as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
  });

  it('every Chinese value is a non-empty string (the only intentionally empty English values stay empty)', () => {
    const empty = zhLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => placeholders(value) !== placeholders(zhMap.get(keyPath) as string))
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Chinese', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((zhMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys keep the English _one/_other pairs (same variables); Chinese has no few/many forms', () => {
    const ones = zhLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(zhMap.has(other)).toBe(true);
      const withoutCount = (value: string) => placeholders(value).split('|').filter(name => name !== '{{count}}').join('|');
      expect(withoutCount(zhMap.get(one) as string)).toBe(withoutCount(zhMap.get(other) as string));
      const english = enLeaves.find(([keyPath]) => keyPath === one)?.[1] ?? '';
      if (english.includes('{{count}}')) {
        expect(zhMap.get(one)).toContain('{{count}}');
        expect(zhMap.get(other)).toContain('{{count}}');
      }
    }
    expect(zhLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real Chinese: nearly every sentence carries hanzi, there is no mojibake and no Cyrillic/German/Turkish leftover', () => {
    const withLetters = zhLeaves.filter(([keyPath, value]) => /[A-Za-z]{3,}/.test(enLeaves.find(([k]) => k === keyPath)?.[1] ?? '') && value.trim().length > 0);
    const noHanzi = withLetters.filter(([, value]) => !CJK.test(value));
    // brand names / abbreviations / technical identifiers only (PDF, PIN, AWA, ng/ml, BMI …)
    expect(noHanzi.every(([, value]) => value.split(/\s+/).length <= 3)).toBe(true);
    expect(zhLeaves.map(([, value]) => value).join('').match(/[\u4e00-\u9fff]/g)?.length).toBeGreaterThan(40000);
    const mojibake = zhLeaves.filter(([, value]) => /Ã[\u0080-¿]|Â[\u0080-¿]|�|\\u[0-9a-f]{4}/i.test(value)).map(([k]) => k);
    expect(mojibake).toEqual([]);
    // the language endonyms (Русский, Türkçe, Deutsch…) are the only legitimate foreign letters
    expect(
      zhLeaves.filter(([keyPath, value]) => !keyPath.startsWith('appearance.language.') && /[А-Яа-яЁёäöüßğışİ]/.test(value)).map(([k]) => k),
    ).toEqual([]);
  });

  it('uses the informal-polite 你 (never 您), fullwidth punctuation next to hanzi, and no straight quotes', () => {
    expect(zhLeaves.filter(([, value]) => value.includes('您')).map(([k]) => k)).toEqual([]);
    const halfwidth = zhLeaves
      .filter(([, value]) => /[一-鿿][,?!;]\s?[一-鿿]|[一-鿿]\.(\s|$)/.test(value))
      .map(([k]) => k);
    expect(halfwidth).toEqual([]);
    expect(zhLeaves.filter(([, value]) => /"[^"\n]{2,}"/.test(value)).map(([k]) => k)).toEqual([]);
  });

  it('the product wording is Chinese and consistent: «AWA 高级版», «AWA 同行», «删除», «简体中文»', () => {
    expect(zhMap.get('premium.sheet.heroTitle')).toBe('AWA 高级版');
    expect(zhLeaves.filter(([, value]) => /Premium/.test(value)).map(([k]) => k)).toEqual([]);
    expect(zhLeaves.filter(([, value]) => /AWA (Together|Pareja|Insieme|à deux|Birlikte|Вместе|Gemeinsam)/.test(value))).toEqual([]);
    expect(zhMap.get('dataPrivacy.deleteAccount.confirmWord')).toBe('删除');
    for (const dictionary of [en, fr, es, itDictionary, tr, ru, de, zh]) {
      expect((dictionary as AnyRecord & {appearance: {language: {chineseName: string}}}).appearance.language.chineseName).toBe('简体中文');
    }
  });

  it('the core vocabulary follows the glossary (月经, 月经周期, 排卵, 易孕期, 怀孕, 产后, 症状, 多囊卵巢综合征, 围绝经期)', () => {
    expect(zhMap.get('navigation.statistics')).toBeTruthy();
    expect(zhMap.get('navigation.calendar')).toBe('日历');
    const joined = zhLeaves.map(([, v]) => v).join(' ');
    for (const term of ['月经', '月经周期', '排卵', '易孕期', '怀孕', '产后', '症状', '多囊卵巢综合征', '围绝经期', '提醒', '通知', '备孕', '避孕']) {
      expect([term, joined.includes(term)]).toEqual([term, true]);
    }
  });
});

describe('Chinese plurals (a single category)', () => {
  it('i18next gives the same wording for 1, 0, 2 and large numbers, with the number interpolated', () => {
    const key = 'statistics.daysPlural';
    const other = zhMap.get(`${key}_other`) as string;
    for (const n of [0, 1, 2, 5, 11, 21, 100]) {
      expect(tOf(key, 'zh', {count: n})).toBe(other.replace('{{count}}', String(n)));
    }
  });

  it('the on-device fallback (engines without Intl.PluralRules) gives Chinese the single "other" category', () => {
    const rules = new AwaPluralRulesForTests('zh-CN');
    for (const n of [0, 1, 2, 5, 11, 100]) {
      expect(rules.select(n)).toBe('other');
    }
    expect(rules.resolvedOptions().pluralCategories).toEqual(['other']);
    expect(new AwaPluralRulesForTests('de').select(1)).toBe('one'); // the other languages are untouched
  });
});

describe('registration, default, fallback and persistence', () => {
  it('Chinese is registered with the real zh.ts dictionary next to the seven others', () => {
    const bundle = i18n.getResourceBundle('zh', 'translation') as AnyRecord;
    expect(bundle).toBeTruthy();
    expect(leaves(bundle).length).toBe(zhLeaves.length);
    for (const language of ['en', 'fr', 'es', 'it', 'tr', 'ru', 'de', 'zh']) {
      expect(i18n.hasResourceBundle(language, 'translation')).toBe(true);
    }
  });

  it('English stays the default language and the fallback', () => {
    expect((i18n.options.fallbackLng as unknown as {default: string[]}).default).toEqual(['en']);
    expect(getAppLanguage()).toBe('en');
  });

  it('a key missing in Chinese falls back to ENGLISH — never French, Spanish, Italian, Turkish, Russian or German', async () => {
    const instance = i18n.createInstance();
    await instance.init({
      resources: {en: {translation: {only: 'English only'}}, zh: {translation: {}}, fr: {translation: {only: 'Français'}}},
      lng: 'zh',
      fallbackLng: 'en',
    });
    expect(instance.t('only')).toBe('English only');
  });

  it('Chinese can be selected, is persisted and survives a restart; every language still works', async () => {
    await setAppLanguage('zh');
    expect(getAppLanguage()).toBe('zh');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('zh');
    expect(await freshLaunchLanguage()).toBe('zh');
    for (const language of ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh'] as AwaAppLanguage[]) {
      await setAppLanguage(language);
      expect(getAppLanguage()).toBe(language);
      expect(await freshLaunchLanguage()).toBe(language);
    }
  });

  it('selecting Chinese updates the live UI immediately and does not touch stored user data', async () => {
    await AsyncStorage.setItem('@hawa/personal-information/v1', JSON.stringify({marker: 'keep-me'}));
    await setAppLanguage('zh');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(i18n.language).toBe('zh');
    expect(i18n.t('common.save')).toBe(zhMap.get('common.save'));
    expect(await AsyncStorage.getItem('@hawa/personal-information/v1')).toBe(JSON.stringify({marker: 'keep-me'}));
    await setAppLanguage('de');
    await setAppLanguage('zh');
    expect(await AsyncStorage.getItem('@hawa/personal-information/v1')).toBe(JSON.stringify({marker: 'keep-me'}));
  });

  it('existing stored languages are preserved and an invalid value never becomes Chinese', async () => {
    for (const stored of ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', stored);
      expect(await freshLaunchLanguage()).toBe(stored);
    }
    for (const invalid of ['chinese', '中文', 'zh-TW', 'zh-Hant', 'zhx', 'z', '']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', invalid);
      expect(await freshLaunchLanguage()).toBe('en');
    }
    await AsyncStorage.removeItem('@awa/appearance/language-v1');
    expect(await freshLaunchLanguage()).toBe('en');
  });

  it('zh-CN / zh-Hans (and case / underscore variants) are accepted as aliases, normalised to zh without losing the preference', async () => {
    for (const alias of ['zh-CN', 'zh-cn', 'zh_CN', 'zh-Hans', 'zh-Hans-CN', 'ZH', ' zh-CN ']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', alias);
      expect([alias, await freshLaunchLanguage()]).toEqual([alias, 'zh']);
      // the preference is rewritten under the canonical code, never reset
      await new Promise(resolve => setTimeout(resolve, 0));
      expect([alias, await AsyncStorage.getItem('@awa/appearance/language-v1')]).toEqual([alias, 'zh']);
    }
    expect(resolveEditorialLanguage('zh-CN')).toBe('zh');
    expect(resolveEditorialLanguage('zh-Hans')).toBe('zh');
    expect(resolveEditorialLanguage('zh_CN')).toBe('zh');
    expect(resolveEditorialLanguage('zh-TW')).toBe('en');
  });

  it('is never chosen automatically (no device, SIM, IP or location based detection)', async () => {
    expect(await freshLaunchLanguage()).toBe('en');
    for (const relative of ['src/services/countryDetection.ts', 'src/i18n/index.ts', 'src/state/themePreferences.ts']) {
      const file = path.join(__dirname, '..', '..', '..', relative);
      if (!fs.existsSync(file)) {continue;}
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(/setAppLanguage\(\s*['"]zh['"]/);
    }
  });

  it('switches at runtime through every language: EN -> ZH -> FR -> ZH -> DE -> ZH with no restart or stale text', async () => {
    expect(tOf('common.save', 'en')).toBe('Save');
    for (const [code, expected] of [
      ['zh', zhMap.get('common.save')],
      ['fr', fr.common.save],
      ['zh', zhMap.get('common.save')],
      ['de', de.common.save],
      ['zh', zhMap.get('common.save')],
    ] as const) {
      await i18n.changeLanguage(code);
      expect(i18n.t('common.save')).toBe(expected);
    }
  });
});

describe('Chinese dates, weekdays and time', () => {
  const sample = new Date(2026, 9, 5, 12); // Monday 5 October 2026

  it('uses zh-CN and leaves the other languages’ locales alone', async () => {
    await setAppLanguage('zh');
    expect(dateFormatLocale()).toBe('zh-CN');
    for (const [language, locale] of [['en', 'en-US'], ['fr', 'fr-FR'], ['es', 'es-ES'], ['it', 'it-IT'], ['tr', 'tr-TR'], ['ru', 'ru-RU'], ['de', 'de-DE']] as const) {
      await setAppLanguage(language);
      expect(dateFormatLocale()).toBe(locale);
    }
  });

  it('weekdays are Monday-first Chinese (周一 … 周日), and the others are unchanged', async () => {
    expect(WEEK_DAYS_ZH).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
    await setAppLanguage('zh');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_ZH);
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

  it('full weekday and month names are Chinese (星期一 … 星期日, 一月 … 十二月)', async () => {
    await setAppLanguage('zh');
    const weekday = (offset: number) =>
      new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long'}).format(new Date(2026, 9, 5 + offset, 12));
    expect([0, 1, 2, 3, 4, 5, 6].map(offset => weekday(offset))).toEqual([
      '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日',
    ]);
    const month = (m: number) => new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long'}).format(new Date(2026, m, 15, 12));
    expect(month(0)).toBe('一月');
    expect(month(11)).toBe('十二月');
  });

  it('short and long dates read in Chinese (10月5日, 2026年10月5日); stored date keys are language-independent', async () => {
    await setAppLanguage('zh');
    expect(formatShortDate(sample)).toBe('10月5日');
    expect(formatFullDate(sample)).toBe('2026年10月5日');
    const key = sample.toLocaleDateString('en-CA');
    await setAppLanguage('en');
    expect(sample.toLocaleDateString('en-CA')).toBe(key);
    expect(key).toBe('2026-10-05');
  });

  it('times use the 24-hour clock in Chinese (00:30 is never „24:30“)', async () => {
    await setAppLanguage('zh');
    const midnight = new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(2026, 9, 5, 0, 30));
    const evening = new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(2026, 9, 5, 18, 5));
    expect(midnight).toBe('00:30');
    expect(evening).toBe('18:05');
  });

  it('the Hijri helper does not throw in Chinese', async () => {
    await setAppLanguage('zh');
    expect(() => formatHijriDate(sample)).not.toThrow();
  });

  it('case helpers leave hanzi untouched and the other languages’ rules intact', async () => {
    await setAppLanguage('zh');
    expect(capitalize('月经周期')).toBe('月经周期');
    expect(upperCaseFor('月经 awa', 'zh')).toBe('月经 AWA');
    expect(lowerCaseFor('月经 AWA', 'zh')).toBe('月经 awa');
    expect(upperCaseFor('iyi', 'zh')).toBe('IYI'); // Turkish i-rules stay Turkish-only
    expect(upperCaseFor('löschen', 'de')).toBe('LÖSCHEN');
  });

  it('the typed destructive-confirmation word accepts the exact word with stray spaces', () => {
    const expected = foldForConfirmation('删除', 'zh');
    for (const typed of ['删除', ' 删除 ', '删除\n']) {
      expect(foldForConfirmation(typed, 'zh')).toBe(expected);
    }
    expect(foldForConfirmation('删', 'zh')).not.toBe(expected);
  });
});

describe('cycle ring label: Chinese phase names are short, stay on one line and keep the largest size', () => {
  it('the four phase names are at most 6 characters, drawn on one line at 9 sp or more', () => {
    const keys = ['cyclePhase.menstruation', 'cyclePhase.follicular', 'cyclePhase.ovulation', 'cyclePhase.luteal'];
    const labels = keys.map(key => zhMap.get(key) as string);
    const plan = planCycleRingText({size: 116, caption: zhMap.get('journalNote.cycleDayLabel') as string, phaseLabels: labels});
    keys.forEach((key, index) => {
      const label = labels[index];
      expect(label).toBeTruthy();
      expect([key, Array.from(label).length <= 6]).toEqual([key, true]);
      expect([key, plan.phaseLines[label]]).toEqual([key, [label]]);
    });
    expect(plan.phase.fontSize).toBeGreaterThanOrEqual(9);
  });

  it('bottom-navigation labels and shared buttons stay short enough for a 360 dp row', () => {
    for (const key of ['navigation.home', 'navigation.calendar', 'navigation.statistics', 'navigation.profile']) {
      const label = zhMap.get(key) as string;
      expect(Array.from(label).length).toBeLessThanOrEqual(5);
      expect(label).not.toMatch(/\s/);
    }
    for (const key of ['common.save', 'common.cancel', 'common.continue', 'common.apply', 'common.back', 'common.close']) {
      expect(Array.from(zhMap.get(key) as string).length).toBeLessThanOrEqual(6);
    }
  });
});

describe('editorial content: library articles, pregnancy weeks, legal text', () => {
  const libraryDir = path.join(__dirname, '..', '..', 'screens', 'library');
  const articleFiles = fs.readdirSync(libraryDir).filter(file => file.endsWith('ArticleScreen.tsx'));

  const contentOf = (file: string): {en: unknown; zh: unknown} | null => {
    const source = fs.readFileSync(path.join(libraryDir, file), 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2019, true, ts.ScriptKind.TSX);
    let found: {en: unknown; zh: unknown} | null = null;
    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node) && !found) {
        const props = node.properties.filter(ts.isPropertyAssignment);
        const named = (name: string) => props.find(property => property.name.getText() === name);
        const enProp = named('en');
        const deProp = named('de');
        const zhProp = named('zh');
        if (enProp && deProp && zhProp && ts.isObjectLiteralExpression(enProp.initializer) && ts.isObjectLiteralExpression(zhProp.initializer)) {
          const evaluate = (n: ts.Node) => vm.runInNewContext(`(${source.slice(n.getStart(), n.getEnd())})`);
          found = {en: evaluate(enProp.initializer), zh: evaluate(zhProp.initializer)};
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

  it('resolveEditorialLanguage knows Chinese and still defaults to English', () => {
    expect(resolveEditorialLanguage('zh')).toBe('zh');
    for (const language of ['fr', 'es', 'it', 'tr', 'ru', 'de', 'en']) {
      expect(resolveEditorialLanguage(language)).toBe(language);
    }
    for (const other of ['nl', '', null, undefined, 'zh-TW', 'zh-Hant']) {
      expect(resolveEditorialLanguage(other as string | null | undefined)).toBe('en');
    }
  });

  it('all 72 localized library articles have a Chinese block with exactly the English structure', () => {
    const withContent = articleFiles.map(file => [file, contentOf(file)] as const);
    const missing = withContent.filter(([, content]) => content === null).map(([file]) => file);
    // UnderstandCycleArticleScreen is the legacy, French-original screen with its own CONTENT shape (checked below).
    expect(missing.filter(file => file !== 'UnderstandCycleArticleScreen.tsx')).toEqual([]);
    expect(withContent.filter(([, content]) => content !== null).length).toBe(72);
    const different = withContent
      .filter(([, content]) => content !== null)
      .filter(([, content]) => JSON.stringify(shape((content as {en: unknown}).en)) !== JSON.stringify(shape((content as {zh: unknown}).zh)))
      .map(([file]) => file);
    expect(different).toEqual([]);
  });

  it('every Chinese article is actually translated: hanzi in (nearly) every text string, none left in English', () => {
    const offenders: string[] = [];
    let hanzi = 0;
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const chinese = strings(content.zh);
      const untranslated = english.filter((value, index) => value === chinese[index] && /[A-Za-z]{4,}/.test(value) && value.includes(' ')).length;
      if (untranslated / Math.max(english.length, 1) > 0.05) {offenders.push(`${file}: ${untranslated}/${english.length}`);}
      chinese.forEach(value => {
        hanzi += (value.match(/[一-鿿]/g) ?? []).length;
      });
    }
    expect(offenders).toEqual([]);
    expect(hanzi).toBeGreaterThan(40000);
  });

  it('Chinese articles keep the numbers and placeholders of the English text', () => {
    const wrong: string[] = [];
    const ORDINAL_OR_WORDED = /\b(1st|2nd|3rd)\b|\bin 3 steps\b|\b\d+ in \d+\b|\b3rd trimester\b/i;
    const numbers = (text: string) => (text.replace(/\{\{[^}]*\}\}/g, ' ').match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const chinese = strings(content.zh);
      english.forEach((value, index) => {
        if (placeholders(value) !== placeholders(chinese[index] ?? '')) {wrong.push(`${file}#${index}`);}
        // Ordinals and counted words are written as Chinese numerals ("1st trimester" -> 孕早期, "in 3 steps" -> 分三步,
        // "8 in 10" -> 八成); every other figure (measures, durations, counts, dates) must stay identical.
        if (ORDINAL_OR_WORDED.test(value)) {return;}
        if (numbers(value) !== numbers(chinese[index] ?? '')) {wrong.push(`${file}#${index} numbers: ${numbers(value)} | ${numbers(chinese[index] ?? '')}`);}
      });
    }
    expect(wrong).toEqual([]);
  });

  it('all 41 pregnancy weeks resolve to Chinese content with the English fields, distinct from every other language', () => {
    for (let week = 1; week <= 41; week += 1) {
      const chinese = getPregnancyWeekData(week, 'zh');
      const english = getPregnancyWeekData(week, 'en');
      expect(chinese).toBeDefined();
      expect(Object.keys(chinese as object).sort()).toEqual(Object.keys(english as object).sort());
      expect(chinese?.babyDescription).not.toBe(english?.babyDescription);
      expect(chinese?.babyDescription).toMatch(CJK);
      expect(chinese?.bodyChanges).toHaveLength((english?.bodyChanges ?? []).length);
      expect(chinese?.toKnow).toHaveLength((english?.toKnow ?? []).length);
      expect(chinese?.week).toBe(week);
      expect(chinese?.babyImage).toBe(english?.babyImage);
      expect(chinese?.sourceRefs).toEqual(english?.sourceRefs);
      for (const other of ['fr', 'es', 'it', 'tr', 'ru', 'de'] as const) {
        expect(chinese?.babyDescription).not.toBe(getPregnancyWeekData(week, other)?.babyDescription);
      }
    }
  });

  it('pregnancy week figures are preserved exactly', () => {
    const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (let week = 1; week <= 41; week += 1) {
      const chinese = getPregnancyWeekData(week, 'zh');
      const english = getPregnancyWeekData(week, 'en');
      for (const field of ['length', 'comparison'] as const) {
        if (english?.[field]) {
          expect([week, field, numbers(String(chinese?.[field] ?? ''))]).toEqual([week, field, numbers(String(english[field]))]);
        }
      }
      expect(numbers([chinese?.babyDescription, ...(chinese?.bodyChanges ?? []), ...(chinese?.toKnow ?? [])].join(' '))).toBe(
        numbers([english?.babyDescription, ...(english?.bodyChanges ?? []), ...(english?.toKnow ?? [])].join(' ')),
      );
    }
  });

  it('the legacy "understand your cycle" article has a Chinese block and falls back to French only for en/es/it/tr', () => {
    const source = fs.readFileSync(path.join(libraryDir, 'UnderstandCycleArticleScreen.tsx'), 'utf8');
    expect(source).toMatch(/\n {2}zh: \{/);
    expect(source).toContain("i18n.language === 'zh' ? 'zh'");
  });

  it('legal placeholder text exists in Chinese with the same sections as English', () => {
    expect(Object.keys(TERMS).sort()).toEqual(['bn', 'de', 'en', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'pt-BR', 'pt-PT', 'ru', 'sq', 'tr', 'zh']);
    expect(Object.keys(PRIVACY).sort()).toEqual(['bn', 'de', 'en', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'pt-BR', 'pt-PT', 'ru', 'sq', 'tr', 'zh']);
    expect(TERMS.zh).toHaveLength(TERMS.en.length);
    expect(PRIVACY.zh).toHaveLength(PRIVACY.en.length);
    TERMS.zh.concat(PRIVACY.zh).forEach(section => {
      expect(section.title).toMatch(CJK);
      expect(section.body).toMatch(CJK);
    });
  });
});

describe('text-in-image illustrations', () => {
  it('Chinese uses the English artwork explicitly (no Chinese lettering exists) and says so in the description', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'zh')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'zh')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_CHINESE].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const key of ['pregnancyFollowUp', 'pregnancyExercise', 'exercise'] as const) {
      const alt = EDITORIAL_IMAGE_ALT[key].zh;
      expect(alt).toMatch(/^插图：/);
      expect(alt).toContain('英文');
      expect(alt).not.toBe(EDITORIAL_IMAGE_ALT[key].en);
    }
  });
});

describe('categorical labels and journal options', () => {
  it('stored French values display as Chinese labels and unknown values pass through; storage never changes', async () => {
    await setAppLanguage('zh');
    await i18n.changeLanguage('zh');
    const t = i18n.t.bind(i18n) as (key: string, options?: AnyRecord) => string;
    const label = journalOptionLabel('cycleSymptom', 'Crampes', t as never);
    expect(label).not.toBe('Crampes');
    expect(label).toMatch(CJK);
    expect(journalOptionLabel('cycleSymptom', 'valeur-inconnue', t as never)).toBe('valeur-inconnue');
  });
});

describe('Premium localization', () => {
  it('the title and every card/sheet string are Chinese and keep "AWA" unchanged', () => {
    const premium = (zh as AnyRecord & {profile: {premiumCard: Record<string, unknown>}}).profile.premiumCard;
    expect(zhMap.get('premium.sheet.heroTitle')).toBe('AWA 高级版');
    expect(zhMap.get('profile.premiumCard.discoverPremium')).toMatch(CJK);
    expect(zhMap.get('profile.premiumCard.activeSubscription')).toMatch(CJK);
    const premiumValues = leaves(premium as AnyRecord).map(([, value]) => value);
    expect(premiumValues.filter(value => /Premium/.test(value))).toEqual([]);
    const premiumLeaves = zhLeaves.filter(([keyPath]) => keyPath.startsWith('premium.') || keyPath.startsWith('profile.premiumCard.'));
    expect(premiumLeaves.length).toBeGreaterThan(40);
    expect(premiumLeaves.filter(([, value]) => !CJK.test(value) && /[A-Za-z]{3,}/.test(value) && !/^AWA$/.test(value)).map(([k]) => k)).toEqual([]);
  });
});
