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
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_JA, dateFormatLocale, formatFullDate, formatHijriDate, formatHijriDay, formatHijriMonthYear, formatShortDate, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_JAPANESE,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';

// 日本語 (ja, Intl locale ja-JP, hiragana + katakana + kanji, horizontal left-to-right): dictionary, plurals, registration and
// normalisation, runtime switching, persistence, dates, editorial content (articles and the 41 pregnancy weeks), images and legal text.
// PDF / typography / notifications have their own suites (medicalExportJapaneseLayout, awaTypographyJapanese,
// notificationJapaneseLocalization).

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
const COMBINING_KANA = new RegExp('[' + String.fromCharCode(0x3099, 0x309a) + ']');
const HALFWIDTH_KATAKANA = new RegExp('[' + String.fromCharCode(0xff61) + '-' + String.fromCharCode(0xff9f) + ']');
// forms that exist only in Simplified Chinese (the Japanese form is different): a sign of Chinese habits in the text
const SIMPLIFIED_ONLY = /[这们个么为说时间过对开关经动术药发产现实种应问题请让还没选择设录记]/;
const J = '[\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Han}]';
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

const enLeaves = leaves(en as AnyRecord);
const jaLeaves = leaves(ja as AnyRecord);
const jaMap = new Map(jaLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja'] as const;
const ENDONYM = /^appearance\.language\.[A-Za-z]+Name$/;
// Values that are kept in Latin letters on purpose (an e-mail example, the product name)
const LATIN_ON_PURPOSE = new Set(['help.helpSupport.modal.placeholderEmail', 'profile.awaADeuxTitle', 'profile.awaADeuxSectionTitle', 'awaADeux.partnerSide.invitation.title']);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('ja.ts has exactly the same leaf paths as every other dictionary — twelve-language parity, no missing, no extra', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(ja as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh, id, hi, sq]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
    // Russian has four plural forms: besides the shared keys it carries the extra _few / _many ones.
    expect(paths(ru as AnyRecord).filter(keyPath => !/_(few|many)$/.test(keyPath))).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length); // no duplicate key paths
  });

  it('every Japanese value is a non-empty string (the intentionally empty English values stay empty, plus the welcome brand prefix)', () => {
    const empty = jaLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    // "Welcome to AWA" is drawn as "Welcome" / "to" + "AWA": Japanese says 「ようこそ」 + 「AWA」 and has no word to put between them.
    expect(empty).toEqual([...englishEmpty, 'onboarding.welcome.brandPrefix'].sort());
    expect(jaMap.get('onboarding.welcome.title')).toBe('ようこそ');
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(jaMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Japanese', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((jaMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: Japanese has one category, so every _one carries exactly the wording of its _other, with the English variables', () => {
    const ones = jaLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(jaMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      if (placeholders(englishOne) === placeholders(englishOther)) {
        expect(jaMap.get(one)).toBe(jaMap.get(other));
      } else {
        // the single English singular sentence that has no {{count}} (miscarriageDate.conflicts.journal) is translated on its own
        expect(placeholders(jaMap.get(one) as string)).toBe(placeholders(englishOne));
      }
      expect(placeholders(jaMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(jaLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real Japanese: no raw key, no Hangul / Cyrillic / Devanagari / Arabic text, no zero-width characters, almost nothing left in English', () => {
    // (the endonyms of the other languages are written in their own scripts)
    expect(jaLeaves.filter(([keyPath, value]) => /[\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Devanagari}\p{Script=Arabic}]/u.test(value) && !ENDONYM.test(keyPath))).toEqual([]);
    expect(jaLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    expect(jaLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]);
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value));
    expect(sentences.filter(([keyPath, value]) => jaMap.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
    // every English word-text has Japanese characters in Japanese, except the few values kept in Latin letters on purpose
    const noJapanese = enLeaves
      .filter(([keyPath, value]) => /[A-Za-z]{4,}/.test(value.replace(/\{\{[^}]*\}\}/g, '')) && !ENDONYM.test(keyPath))
      .filter(([keyPath]) => !/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(jaMap.get(keyPath) as string))
      .filter(([keyPath, value]) => (jaMap.get(keyPath) as string).toLowerCase() !== value.toLowerCase()) // product and technical names (Premium, PCOS, Face ID …) are the English ones
      .map(([keyPath]) => keyPath)
      .filter(keyPath => !LATIN_ON_PURPOSE.has(keyPath));
    expect(noJapanese).toEqual([]);
  });

  it('long Japanese texts contain kana (not Chinese, English or French text under a Japanese key)', () => {
    const bad = jaLeaves.filter(([keyPath, value]) => value.length > 40 && !KANA.test(value) && !ENDONYM.test(keyPath)).map(([keyPath, value]) => `${keyPath}: ${value.slice(0, 50)}`);
    expect(bad).toEqual([]);
  });

  it('characters are normalised: precomposed kana (NFC), full-width katakana only, Western digits, Japanese forms of the kanji', () => {
    expect(jaLeaves.filter(([, value]) => value !== value.normalize('NFC') || COMBINING_KANA.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => HALFWIDTH_KATAKANA.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => /[０-９]/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([keyPath, value]) => SIMPLIFIED_ONLY.test(value) && !ENDONYM.test(keyPath)).map(([keyPath]) => keyPath)).toEqual([]);
    const all = jaLeaves.map(([, value]) => value).join('\n');
    for (const char of ['あ', 'ア', '経', '産', '薬']) {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
  });

  it('follows the Japanese typographic rules: full-width punctuation, no ASCII comma / period after Japanese, no spaces between Japanese words', () => {
    expect(jaLeaves.filter(([, value]) => new RegExp(`${J}[,.]( |$)`, 'u').test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => new RegExp(`${J}[!?]`, 'u').test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => new RegExp(`${J} ${J}`, 'u').test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => /[、。！？：）」』] | [、。！？：）」』]/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => /\d (日|週|か月|回|歳|分|時間|件|個|枚|杯)/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(jaLeaves.filter(([, value]) => /"/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('keeps the brand, the product names and the language endonym 日本語 (identical in every language)', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.japaneseName', language)).toBe('日本語');
    }
    expect(tOf('premium.sheet.heroTitle', 'ja')).toContain('AWA');
    expect(jaLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]); // the brand is always "AWA"
    expect(tOf('appearanceThemeNames.awa-original', 'ja')).toBe('AWA Original');
    expect(tOf('profile.awaADeuxTitle', 'ja')).toBe('AWA Together');
  });

  it('uses the agreed terminology (生理, 排卵, 妊娠, 産後, 更年期, 避妊, 礼拝, 断食, ニファース, カダー) and the polite です・ます style', () => {
    const all = jaLeaves.map(([, value]) => value).join('\n');
    for (const term of ['生理', '排卵', '妊娠', '産後', '更年期', '避妊', '症状', '基礎体温', '礼拝', '断食', 'ニファース', 'カダー']) {
      expect([term, all.includes(term)]).toEqual([term, true]);
    }
    expect(tOf('objectives.pregnancy', 'ja')).toContain('妊娠');
    expect((all.match(/ます/g) ?? []).length).toBeGreaterThan(500);
    // plain-form sentence endings ("〜だ。", "〜である。") do not appear in the interface
    expect(jaLeaves.filter(([, value]) => /だ。|である。/.test(value))).toEqual([]);
  });
});

describe('Japanese plurals', () => {
  it('the on-device PluralRules fallback follows CLDR ja: the single category "other", whatever the number', () => {
    const rules = new AwaPluralRulesForTests('ja-JP');
    expect([0, 1, 2, 5, 11, 21, 100].map(value => rules.select(value))).toEqual(['other', 'other', 'other', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5].map(value => rules.select(value))).toEqual(['other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['other']);
  });

  it('agrees with the engine\'s own Intl.PluralRules("ja") for integers and the common fractions', () => {
    const native = new Intl.PluralRules('ja');
    const shim = new AwaPluralRulesForTests('ja');
    for (const value of [...Array.from({length: 121}, (_, index) => index), 0.5, 1.5, 2.5, 10.5]) {
      expect([value, shim.select(value)]).toEqual([value, native.select(value)]);
    }
  });

  it('uses the same counter wording for 0, 1, 2 and 28 through i18next (日 with the number attached, no space)', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'ja', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
      expect(text).toMatch(new RegExp(`${count}日`));
    }
  });

  it('every plural pair resolves through i18next to the same text for count 1 and count 2 (one category)', () => {
    const bases = jaLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_other') && jaMap.get(keyPath)!.includes('{{count}}')).map(keyPath => keyPath.replace(/_other$/, ''));
    expect(bases.length).toBeGreaterThan(40);
    for (const base of bases.slice(0, 30)) {
      expect(tOf(base, 'ja', {count: 1}).replace('1', '#')).toBe(tOf(base, 'ja', {count: 2}).replace('2', '#'));
    }
  });
});

describe('registration and normalisation', () => {
  it.each(['ja', 'ja-JP', 'ja_JP', 'JA', 'Ja-jp', 'ja-Jpan', 'ja-Jpan-JP', 'ja-JP.UTF-8', '  ja-JP  ', 'ja-JP-u-ca-japanese', 'ja-JP-u-nu-latn', 'ja-JP-x-lvariant-JP'])('%s -> ja', value => {
    expect(languageFromLocaleTag(value)).toBe('ja');
  });

  it.each(['ja', 'ja-JP', 'ja_jp', 'ja-Jpan', 'JA-JP'])('a stored %s normalises to ja', value => {
    expect(normalizeAppLanguage(value)).toBe('ja');
  });

  it('does not confuse other languages: Thai, Vietnamese, Korean, Chinese variants and the other eleven stay what they are', () => {
    for (const tag of ['ms-MY', 'tl-PH']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
    expect(languageFromLocaleTag('ko-KR')).toBe('ko'); // Korean is supported since the 13th language
    expect(languageFromLocaleTag('zh-CN')).toBe('zh');
    expect(languageFromLocaleTag('it-IT')).toBe('it');
    expect(languageFromLocaleTag('sq-AL')).toBe('sq');
    expect(languageFromLocaleTag('hi-IN')).toBe('hi');
  });

  it('picks Japanese from a phone list, English for an unsupported one', () => {
    expect(pickSupportedLanguage(['ja-JP', 'en-GB'])).toBe('ja');
    expect(pickSupportedLanguage(['ms-MY', 'ja-JP'])).toBe('ja');
    expect(pickSupportedLanguage(['ms-MY', 'tl-PH'])).toBe('en');
    expect(pickSupportedLanguage(['en-GB', 'ja-JP'])).toBe('en'); // the phone's first supported language wins
  });

  it('editorial content resolves ja, ja-JP and ja-Jpan to the Japanese block; English stays the fallback', () => {
    for (const value of ['ja', 'ja-JP', 'ja_JP', 'JA', 'ja-Jpan', 'ja-Jpan-JP']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'ja']);
    }
    expect(resolveEditorialLanguage('ms')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    expect(ALL_LANGUAGES.filter(language => language !== 'ja').map(language => resolveEditorialLanguage(language))).toEqual(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq']);
    expect(resolveEditorialLanguage('ko')).toBe('ko'); // Korean has its own block since the 13th language
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Japanese at runtime without a restart and back, across all twelve languages', async () => {
    await setAppLanguage('ja');
    await i18n.changeLanguage('ja');
    expect(getAppLanguage()).toBe('ja');
    expect(i18n.t('common.save')).toBe(jaMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.continue'));
    }
    expect(saves.size).toBe(12);
    await i18n.changeLanguage('ja');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('ja');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('ja');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('ja');
  });

  it('all eight onboarding objectives have a Japanese label', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      const label = tOf(`objectives.${objective}`, 'ja');
      expect(label).toBeTruthy();
      expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
    }
  });

  it('the physical-activity options Hiking and Cardio and the palette names are translated', () => {
    const activity = (ja as unknown as {journalOptions: {cycleActivityType: Record<string, string>}}).journalOptions.cycleActivityType;
    expect(activity.hiking).toBe('ハイキング');
    expect(activity.cardio).toBe('有酸素運動');
    const names = (ja as unknown as {appearanceThemeNames: Record<string, string>}).appearanceThemeNames;
    expect(Object.keys(names).sort()).toEqual(['awa-original', 'lavender-night', 'midnight', 'ocean-calm', 'rose-quartz', 'sage-serenity', 'warm-sand']);
    expect(names['awa-original']).toBe('AWA Original');
    expect(new Set(Object.values(names)).size).toBe(7);
  });

  it('the article category tabs are short single-line labels', () => {
    for (const key of ['all', 'medical', 'religious', 'featured']) {
      const label = tOf(`library.screen.tabs.${key}`, 'ja');
      expect(label.length).toBeLessThanOrEqual(4);
      expect(label).not.toContain('\n');
    }
  });
});

describe('dates and calendar', () => {
  it('uses the ja-JP Intl locale, year-month-day order with the 年月日 characters, Western digits and Monday-first kanji weekdays', async () => {
    await setAppLanguage('ja');
    expect(dateFormatLocale()).toBe('ja-JP');
    expect(WEEK_DAYS_JA).toEqual(['月', '火', '水', '木', '金', '土', '日']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_JA);
    expect(formatFullDate(new Date(2026, 9, 19))).toBe('2026年10月19日');
    expect(formatShortDate(new Date(2026, 9, 19))).toBe('10月19日');
  });

  it('every month has its Japanese name (N月) in the ja-JP locale', () => {
    const months = Array.from({length: 12}, (_, month) => new Intl.DateTimeFormat('ja-JP', {month: 'long'}).format(new Date(2026, month, 1)));
    expect(months).toEqual(['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']);
  });

  it('weekday names of the locale are the single kanji 月 火 水 木 金 土 日 (with 曜日 spelled out)', () => {
    const days = Array.from({length: 7}, (_, index) => new Intl.DateTimeFormat('ja-JP', {weekday: 'long'}).format(new Date(2026, 9, 19 + index)));
    expect(days).toEqual(['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']);
  });

  it('Hijri dates use the era ヒジュラ暦 and the Japanese Muslim month names (CLDR has none: ICU would print "AH1447年9月12日")', async () => {
    await setAppLanguage('ja');
    expect(formatHijriDate(new Date(2026, 2, 1))).toBe('ヒジュラ暦1447年ラマダーン12日');
    expect(formatHijriDay(new Date(2026, 2, 1))).toBe('12');
    expect(formatHijriMonthYear(new Date(2026, 2, 1))).toBe('ヒジュラ暦1447年ラマダーン');
    // a sweep over two years meets all twelve month names, never a bare number + 月
    const seen = new Set<string>();
    for (let offset = 0; offset < 760; offset += 7) {
      const label = formatHijriMonthYear(new Date(2025, 0, 1 + offset)) as string;
      expect(label).toMatch(/^ヒジュラ暦\d{4}年[^\d月]+$/);
      seen.add(label.replace(/^ヒジュラ暦\d{4}年/, ''));
    }
    expect([...seen].sort()).toEqual(
      ['ムハッラム', 'サファル', 'ラビーウ・アル＝アウワル', 'ラビーウ・アル＝アーヒル', 'ジュマーダー・アル＝ウーラー', 'ジュマーダー・アル＝アーヒラ', 'ラジャブ', 'シャアバーン', 'ラマダーン', 'シャウワール', 'ズー・アル＝カアダ', 'ズー・アル＝ヒッジャ'].sort(),
    );
  });

  it('other languages keep their ICU Hijri formatting (French is unchanged)', async () => {
    await setAppLanguage('fr');
    expect(formatHijriDate(new Date(2026, 2, 1))).toMatch(/ramadan/i);
    expect(formatHijriDay(new Date(2026, 2, 1))).toBe('12');
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

  it('every article screen (73) has a complete Japanese block with exactly the English structure', () => {
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
            if (!props.ja) {problems.push(`${file}: no ja block`);}
            else {
              const reference = shapeOf(props.en ?? props.fr);
              if (JSON.stringify(shapeOf(props.ja)) !== JSON.stringify(reference)) {problems.push(`${file}: ja block structure differs from en`);}
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

  it('every article Japanese block is Japanese prose: kana present, no Hangul / Cyrillic / Devanagari, no half-width katakana, no Simplified-only forms', () => {
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}ja: \{/);
      expect([file, start > 0]).toEqual([file, true]);
      const rest = text.slice(start);
      const end = rest.search(/\n {2}\},?\r?\n/);
      const block = rest.slice(0, end > 0 ? end : undefined);
      expect([file, /[\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Devanagari}]/u.test(block)]).toEqual([file, false]);
      expect([file, HALFWIDTH_KATAKANA.test(block) || COMBINING_KANA.test(block)]).toEqual([file, false]);
      expect([file, SIMPLIFIED_ONLY.test(block)]).toEqual([file, false]);
      expect([file, /[ぁ-んァ-ヶ]/.test(block) && /(です|ます|ください|ません|ましょう|ある|する)/.test(block)]).toEqual([file, true]);
    }
  });

  it('all 41 pregnancy weeks have Japanese content with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const japanese = getPregnancyWeekData(week, 'ja');
      const english = getPregnancyWeekData(week, 'en');
      expect(japanese).toBeDefined();
      expect(Object.keys(japanese!).sort()).toEqual(Object.keys(english!).sort());
      expect(JSON.stringify(japanese)).not.toBe(JSON.stringify(english));
      expect(KANA.test(JSON.stringify(japanese))).toBe(true);
      for (const [key, value] of Object.entries(english!)) {
        const other = (japanese as unknown as AnyRecord)[key];
        if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
      }
    }
    expect(getPregnancyWeekData(0, 'ja')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'ja')).toBeUndefined();
  });

  it('pregnancy-week figures survive the translation: every number of the English text is in the Japanese text', () => {
    const missing: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const english = JSON.stringify(getPregnancyWeekData(week, 'en'));
      const japanese = JSON.stringify(getPregnancyWeekData(week, 'ja'));
      for (const number of english.match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!japanese.includes(number)) {missing.push(`week ${week}: ${number}`);}
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('images and legal text', () => {
  it('has no Japanese artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'ja')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'ja')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_JAPANESE].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt.ja).toContain('英語');
    }
  });

  it('legal placeholder sections exist in Japanese with the English structure and are not English', () => {
    for (const document of [TERMS, PRIVACY]) {
      expect(document.ja).toHaveLength(document.en.length);
      document.ja.forEach((section, index) => {
        expect(section.title).not.toBe(document.en[index].title);
        expect(section.body).not.toBe(document.en[index].body);
        expect(section.body).toMatch(/[ぁ-ん]/);
        expect(section.body).toMatch(/(です|ます)。$/);
      });
    }
  });
});
