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
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_KO, dateFormatLocale, formatFullDate, formatHijriDate, formatHijriDay, formatHijriMonthYear, formatShortDate, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_KOREAN,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';

// 한국어 (ko, Intl locale ko-KR, Hangul, horizontal left-to-right): dictionary, plurals, registration and normalisation, runtime
// switching, persistence, dates, editorial content (articles and the 41 pregnancy weeks), images and legal text.
// PDF / typography / notifications have their own suites (medicalExportKoreanLayout, awaTypographyKorean,
// notificationKoreanLocalization).

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
const CONJOINING_JAMO = new RegExp('[' + String.fromCharCode(0x1100) + '-' + String.fromCharCode(0x11ff) + ']');
const FULLWIDTH_PUNCTUATION = new RegExp('[' + String.fromCharCode(0x3001, 0x3002, 0x300c, 0x300d, 0x300e, 0x300f, 0xff08, 0xff09, 0xff1a, 0xff01, 0xff1f, 0xff0c) + ']');
const HANGUL = /\p{Script=Hangul}/u;

const enLeaves = leaves(en as AnyRecord);
const koLeaves = leaves(ko as AnyRecord);
const koMap = new Map(koLeaves);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko'] as const;
const ENDONYM = /^appearance\.language\.[A-Za-z]+Name$/;
// Values that are kept in Latin letters on purpose (an e-mail example, the product name)
const LATIN_ON_PURPOSE = new Set(['help.helpSupport.modal.placeholderEmail', 'profile.awaADeuxTitle', 'profile.awaADeuxSectionTitle', 'awaADeux.partnerSide.invitation.title']);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('ko.ts has exactly the same leaf paths as every other dictionary — fifteen-language parity, no missing, no extra', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBe(6247);
    expect(paths(ko as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh, id, hi, sq, ja, bn]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
    // Russian has four plural forms: besides the shared keys it carries the extra _few / _many ones.
    expect(paths(ru as AnyRecord).filter(keyPath => !/_(few|many)$/.test(keyPath))).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length); // no duplicate key paths
  });

  it('every Korean value is a non-empty string (the intentionally empty English values stay empty, plus the welcome brand prefix)', () => {
    const empty = koLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    // "Welcome to AWA" is drawn as "Welcome" / "to" + "AWA": Korean says 「환영해요」 + 「AWA」 and has no word to put between them.
    expect(empty).toEqual([...englishEmpty, 'onboarding.welcome.brandPrefix'].sort());
    expect(koMap.get('onboarding.welcome.title')).toBe('환영해요');
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(koMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Korean', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((koMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: Korean has one category, so every _one carries exactly the wording of its _other, with the English variables', () => {
    const ones = koLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(koMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      const englishOther = enLeaves.find(([keyPath]) => keyPath === other)![1];
      if (placeholders(englishOne) === placeholders(englishOther)) {
        expect(koMap.get(one)).toBe(koMap.get(other));
      } else {
        // the single English singular sentence that has no {{count}} (miscarriageDate.conflicts.journal) is translated on its own
        expect(placeholders(koMap.get(one) as string)).toBe(placeholders(englishOne));
      }
      expect(placeholders(koMap.get(other) as string)).toBe(placeholders(englishOther));
    }
    expect(koLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real Korean: no raw key, no Hanja / kana / Cyrillic / Devanagari / Arabic text, no zero-width characters, almost nothing left in English', () => {
    // (the endonyms of the other languages are written in their own scripts)
    expect(koLeaves.filter(([keyPath, value]) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Devanagari}\p{Script=Arabic}]/u.test(value) && !ENDONYM.test(keyPath))).toEqual([]);
    expect(koLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    expect(koLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]);
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value));
    expect(sentences.filter(([keyPath, value]) => koMap.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
    // every English word-text has Hangul in Korean, except the few values kept in Latin letters on purpose
    const noHangul = enLeaves
      .filter(([keyPath, value]) => /[A-Za-z]{4,}/.test(value.replace(/\{\{[^}]*\}\}/g, '')) && !ENDONYM.test(keyPath))
      .filter(([keyPath]) => !HANGUL.test(koMap.get(keyPath) as string))
      .filter(([keyPath, value]) => (koMap.get(keyPath) as string).toLowerCase() !== value.toLowerCase()) // product and technical names (Premium, PCOS, Face ID …) are the English ones
      .map(([keyPath]) => keyPath)
      .filter(keyPath => !LATIN_ON_PURPOSE.has(keyPath));
    expect(noHangul).toEqual([]);
  });

  it('long Korean texts contain Hangul (not Chinese, English or French text under a Korean key)', () => {
    const bad = koLeaves.filter(([keyPath, value]) => value.length > 40 && !HANGUL.test(value) && !ENDONYM.test(keyPath)).map(([keyPath, value]) => `${keyPath}: ${value.slice(0, 50)}`);
    expect(bad).toEqual([]);
  });

  it('characters are normalised: precomposed Hangul syllables (NFC), no conjoining jamo, Western digits, no full-width punctuation', () => {
    expect(koLeaves.filter(([, value]) => value !== value.normalize('NFC') || CONJOINING_JAMO.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(koLeaves.filter(([, value]) => /[０-９Ａ-Ｚａ-ｚ]/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(koLeaves.filter(([, value]) => FULLWIDTH_PUNCTUATION.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    const all = koLeaves.map(([, value]) => value).join('\n');
    for (const char of ['가', '기', '임', '산']) {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
  });

  it('follows the Korean typographic rules: no space before punctuation, counters attached to the number, no particle glued to a variable', () => {
    expect(koLeaves.filter(([, value]) => /[가-힣] [.,?!]/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(koLeaves.filter(([, value]) => /\d (일|주|개월|회|세|분|시간|명|번|일째|주차)(?![가-힣])/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(koLeaves.filter(([, value]) => /\}\}(은|는|이|가|을|를|과|와|으로|로)(?![가-힣])/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(koLeaves.filter(([, value]) => /"/.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('keeps the brand, the product names and the language endonym 한국어 (identical in every language)', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.koreanName', language)).toBe('한국어');
    }
    expect(tOf('premium.sheet.heroTitle', 'ko')).toContain('AWA');
    expect(koLeaves.filter(([, value]) => /\bAwa\b/.test(value))).toEqual([]); // the brand is always "AWA"
    expect(tOf('appearanceThemeNames.awa-original', 'ko')).toBe('AWA Original');
    expect(tOf('profile.awaADeuxTitle', 'ko')).toBe('AWA Together');
  });

  it('uses the agreed terminology (생리, 배란, 임신, 산후, 갱년기, 피임, 예배, 금식, 니파스, 카다) and the polite 해요체 style', () => {
    const all = koLeaves.map(([, value]) => value).join('\n');
    for (const term of ['생리', '배란', '임신', '산후', '갱년기', '피임', '증상', '기초체온', '예배', '금식', '니파스', '카다']) {
      expect([term, all.includes(term)]).toEqual([term, true]);
    }
    expect(tOf('objectives.pregnancy', 'ko')).toContain('임신');
    expect((all.match(/요[.!?]/g) ?? []).length).toBeGreaterThan(500);
    // the formal 합니다체 is limited to a handful of fixed phrases (the welcome title, legal placeholders)
    expect(koLeaves.filter(([, value]) => /습니다[.!?]/.test(value)).length).toBeLessThan(40);
  });
});

describe('Korean plurals', () => {
  it('the on-device PluralRules fallback follows CLDR ko: the single category "other", whatever the number', () => {
    const rules = new AwaPluralRulesForTests('ko-KR');
    expect([0, 1, 2, 5, 11, 21, 100].map(value => rules.select(value))).toEqual(['other', 'other', 'other', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5].map(value => rules.select(value))).toEqual(['other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['other']);
  });

  it('agrees with the engine\'s own Intl.PluralRules("ko") for integers and the common fractions', () => {
    const native = new Intl.PluralRules('ko');
    const shim = new AwaPluralRulesForTests('ko');
    for (const value of [...Array.from({length: 121}, (_, index) => index), 0.5, 1.5, 2.5, 10.5]) {
      expect([value, shim.select(value)]).toEqual([value, native.select(value)]);
    }
  });

  it('uses the same counter wording for 0, 1, 2 and 28 through i18next (일 with the number attached, no space)', () => {
    for (const count of [0, 1, 2, 3, 7, 28, 41]) {
      const text = tOf('export.pdf.daysCount', 'ko', {count});
      expect(text).toContain(String(count));
      expect(text).not.toContain('{{');
      expect(text).toMatch(new RegExp(`${count}일`));
    }
  });

  it('every plural pair resolves through i18next to the same text for count 1 and count 2 (one category)', () => {
    const bases = koLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_other') && koMap.get(keyPath)!.includes('{{count}}')).map(keyPath => keyPath.replace(/_other$/, ''));
    expect(bases.length).toBeGreaterThan(40);
    for (const base of bases.slice(0, 30)) {
      expect(tOf(base, 'ko', {count: 1}).replace('1', '#')).toBe(tOf(base, 'ko', {count: 2}).replace('2', '#'));
    }
  });
});

describe('registration and normalisation', () => {
  it.each(['ko', 'ko-KR', 'ko_KR', 'KO', 'Ko-kr', 'ko-Kore', 'ko-Kore-KR', 'ko-KR.UTF-8', '  ko-KR  ', 'ko-KR-u-ca-dangi', 'ko-KR-u-nu-latn', 'ko-KP'])('%s -> ko', value => {
    expect(languageFromLocaleTag(value)).toBe('ko');
  });

  it.each(['ko', 'ko-KR', 'ko_kr', 'ko-Kore', 'KO-KR'])('a stored %s normalises to ko', value => {
    expect(normalizeAppLanguage(value)).toBe('ko');
  });

  it('does not confuse other languages: Thai, Vietnamese, Japanese, Chinese variants and the other eleven stay what they are', () => {
    for (const tag of ['th-TH', 'vi-VN', 'ms-MY', 'tl-PH']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
    expect(languageFromLocaleTag('ja-JP')).toBe('ja');
    expect(languageFromLocaleTag('zh-CN')).toBe('zh');
    expect(languageFromLocaleTag('it-IT')).toBe('it');
    expect(languageFromLocaleTag('sq-AL')).toBe('sq');
    expect(languageFromLocaleTag('hi-IN')).toBe('hi');
  });

  it('picks Korean from a phone list, English for an unsupported one', () => {
    expect(pickSupportedLanguage(['ko-KR', 'en-GB'])).toBe('ko');
    expect(pickSupportedLanguage(['th-TH', 'ko-KR'])).toBe('ko');
    expect(pickSupportedLanguage(['th-TH', 'vi-VN'])).toBe('en');
    expect(pickSupportedLanguage(['en-GB', 'ko-KR'])).toBe('en'); // the phone's first supported language wins
  });

  it('editorial content resolves ko, ko-KR and ko-Kore to the Korean block; English stays the fallback', () => {
    for (const value of ['ko', 'ko-KR', 'ko_KR', 'KO', 'ko-Kore', 'ko-Kore-KR']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'ko']);
    }
    expect(resolveEditorialLanguage('th')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    expect(ALL_LANGUAGES.filter(language => language !== 'ko').map(language => resolveEditorialLanguage(language))).toEqual(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja']);
  });
});

describe('runtime switching and persistence', () => {
  it('switches to Korean at runtime without a restart and back, across all thirteen languages', async () => {
    await setAppLanguage('ko');
    await i18n.changeLanguage('ko');
    expect(getAppLanguage()).toBe('ko');
    expect(i18n.t('common.save')).toBe(koMap.get('common.save'));
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.continue'));
    }
    expect(saves.size).toBe(13);
    await i18n.changeLanguage('ko');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it('persists the choice across a restart', async () => {
    await setAppLanguage('ko');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('ko');
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe('ko');
  });

  it('all eight onboarding objectives have a Korean label', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      const label = tOf(`objectives.${objective}`, 'ko');
      expect(label).toBeTruthy();
      expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
    }
  });

  it('the physical-activity options Hiking and Cardio and the palette names are translated', () => {
    const activity = (ko as unknown as {journalOptions: {cycleActivityType: Record<string, string>}}).journalOptions.cycleActivityType;
    expect(activity.hiking).toBe('하이킹');
    expect(activity.cardio).toBe('유산소 운동');
    const names = (ko as unknown as {appearanceThemeNames: Record<string, string>}).appearanceThemeNames;
    expect(Object.keys(names).sort()).toEqual(['awa-original', 'lavender-night', 'midnight', 'ocean-calm', 'rose-quartz', 'sage-serenity', 'warm-sand']);
    expect(names['awa-original']).toBe('AWA Original');
    expect(new Set(Object.values(names)).size).toBe(7);
  });

  it('the article category tabs are short single-line labels', () => {
    for (const key of ['all', 'medical', 'religious', 'featured']) {
      const label = tOf(`library.screen.tabs.${key}`, 'ko');
      expect(label.length).toBeLessThanOrEqual(6);
      expect(label).not.toContain('\n');
    }
  });
});

describe('dates and calendar', () => {
  it('uses the ko-KR Intl locale, year-month-day order with 년 월 일, Western digits and Monday-first Hangul weekdays', async () => {
    await setAppLanguage('ko');
    expect(dateFormatLocale()).toBe('ko-KR');
    expect(WEEK_DAYS_KO).toEqual(['월', '화', '수', '목', '금', '토', '일']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_KO);
    expect(formatFullDate(new Date(2026, 9, 21))).toBe('2026년 10월 21일');
    expect(formatShortDate(new Date(2026, 9, 21))).toBe('10월 21일');
  });

  it('every month has its Korean name (N월) in the ko-KR locale', () => {
    const months = Array.from({length: 12}, (_, month) => new Intl.DateTimeFormat('ko-KR', {month: 'long'}).format(new Date(2026, month, 1)));
    expect(months).toEqual(['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']);
  });

  it('weekday names of the locale are 월요일 … 일요일', () => {
    const days = Array.from({length: 7}, (_, index) => new Intl.DateTimeFormat('ko-KR', {weekday: 'long'}).format(new Date(2026, 9, 19 + index)));
    expect(days).toEqual(['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']);
  });

  it('Hijri dates use the era 히즈라력 and the month names of the Unicode locale data (ICU would print a bare number: "AH 1447년 9월 12일")', async () => {
    await setAppLanguage('ko');
    expect(formatHijriDate(new Date(2026, 2, 1))).toBe('히즈라력 1447년 라마단 12일');
    expect(formatHijriDay(new Date(2026, 2, 1))).toBe('12');
    expect(formatHijriMonthYear(new Date(2026, 2, 1))).toBe('히즈라력 1447년 라마단');
    // a sweep over two years meets all twelve month names, never a bare number + 월
    const seen = new Set<string>();
    for (let offset = 0; offset < 760; offset += 7) {
      const label = formatHijriMonthYear(new Date(2025, 0, 1 + offset)) as string;
      expect(label).toMatch(/^히즈라력 \d{4}년 [^\d월]+$/);
      seen.add(label.replace(/^히즈라력 \d{4}년 /, ''));
    }
    expect([...seen].sort()).toEqual(
      ['무하람', '사파르', '라비 알 아왈', '라비 알 쎄니', '주마다 알 아왈', '주마다 알 쎄니', '라잡', '쉐아반', '라마단', '쉐왈', '듀 알 까다', '듀 알 히자'].sort(),
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

  it('every article screen (73) has a complete Korean block with exactly the English structure', () => {
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
            if (!props.ko) {problems.push(`${file}: no ko block`);}
            else {
              const reference = shapeOf(props.en ?? props.fr);
              if (JSON.stringify(shapeOf(props.ko)) !== JSON.stringify(reference)) {problems.push(`${file}: ko block structure differs from en`);}
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

  it('every article Korean block is Korean prose: Hangul present, no Hanja / kana / Cyrillic / Devanagari, no full-width punctuation', () => {
    for (const file of articleFiles) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}ko: \{/);
      expect([file, start > 0]).toEqual([file, true]);
      const rest = text.slice(start);
      const end = rest.search(/\n {2}\},?\r?\n/);
      const block = rest.slice(0, end > 0 ? end : undefined);
      expect([file, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Devanagari}]/u.test(block)]).toEqual([file, false]);
      expect([file, FULLWIDTH_PUNCTUATION.test(block) || CONJOINING_JAMO.test(block)]).toEqual([file, false]);
      expect([file, HANGUL.test(block) && /(요\.|요,|니다\.)/.test(block)]).toEqual([file, true]);
    }
  });

  it('all 41 pregnancy weeks have Korean content with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const korean = getPregnancyWeekData(week, 'ko');
      const english = getPregnancyWeekData(week, 'en');
      expect(korean).toBeDefined();
      expect(Object.keys(korean!).sort()).toEqual(Object.keys(english!).sort());
      expect(JSON.stringify(korean)).not.toBe(JSON.stringify(english));
      expect(HANGUL.test(JSON.stringify(korean))).toBe(true);
      for (const [key, value] of Object.entries(english!)) {
        const other = (korean as unknown as AnyRecord)[key];
        if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
      }
    }
    expect(getPregnancyWeekData(0, 'ko')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'ko')).toBeUndefined();
  });

  it('pregnancy-week figures survive the translation: every number of the English text is in the Korean text', () => {
    const missing: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const english = JSON.stringify(getPregnancyWeekData(week, 'en'));
      const korean = JSON.stringify(getPregnancyWeekData(week, 'ko'));
      for (const number of english.match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!korean.includes(number)) {missing.push(`week ${week}: ${number}`);}
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('images and legal text', () => {
  it('has no Korean artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'ko')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'ko')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_KOREAN].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt.ko).toContain('영어');
    }
  });

  it('legal placeholder sections exist in Korean with the English structure and are not English', () => {
    for (const document of [TERMS, PRIVACY]) {
      expect(document.ko).toHaveLength(document.en.length);
      document.ko.forEach((section, index) => {
        expect(section.title).not.toBe(document.en[index].title);
        expect(section.body).not.toBe(document.en[index].body);
        expect(section.body).toMatch(/[가-힣]/);
        expect(section.body).toMatch(/(니다|요)\.$/);
      });
    }
  });
});
