import {BackHandler, I18nManager} from 'react-native';

import i18n from '../index';
import {ar} from '../locales/ar';
import {en} from '../locales/en';
import {arabicCardinal} from '../pluralRules';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  applyLayoutDirectionForLanguage,
  closeAppForLayoutDirection,
  isRtlLanguage,
  layoutDirectionRestartNeeded,
  layoutDirectionRestartTarget,
} from '../layoutDirection';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {languageFromLocaleTag, normalizeAppLanguage, resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {WEEK_DAYS_AR, dateFormatLocale, formatHijriDate, formatHijriMonthYear, localizedWeekDays} from '../../utils/cycleMath';
import {arabicAdjustment, containsArabicScript, isLatinOnlyField} from '../../theme/awaTypography';
import {isDirectionalIconName, patchAwaIconMirror} from '../../theme/installAwaRtl';
import {mapLanguageFor} from '../../services/maps/mapLanguage';

type AnyRecord = Record<string, unknown>;
const leaves = (node: unknown, path = ''): Array<[string, string]> =>
  typeof node === 'string'
    ? [[path, node]]
    : node && typeof node === 'object'
      ? Object.entries(node as AnyRecord).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key))
      : [];
const enLeaves = leaves(en);
const arLeaves = leaves(ar);
const arMap = new Map(arLeaves);
const enMap = new Map(enLeaves);
const withoutCount = (value: string): string =>
  (value.match(/\{\{[^}]+\}\}/g) ?? [])
    .filter(item => item !== '{{count}}')
    .sort()
    .join('|');
const PLURAL_EXTRA =/_(zero|two|few|many)$/;
const placeholders = (value: string): string => (value.match(/\{\{[^}]+\}\}/g) ?? []).sort().join('|');

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Arabic dictionary', () => {
  it('has every English key plus only the extra Arabic plural forms', () => {
    expect(enLeaves.filter(([key]) => !arMap.has(key))).toEqual([]);
    expect(arLeaves.filter(([key]) => !enMap.has(key) && !PLURAL_EXTRA.test(key) && !key.startsWith('prayerTimes.names.')).map(([key]) => key)).toEqual([]);
    // 352 extra plural forms + the 5 Arabic prayer display names (prayerTimes.names.*, see i18n/prayerNames.ts)
    expect(arLeaves.length - enLeaves.length).toBe(357);
  });

  it('every plural family carries all six CLDR forms', () => {
    const families = new Set(enLeaves.map(([key]) => key.match(/^(.*)_other$/)?.[1]).filter(Boolean) as string[]);
    expect(families.size).toBeGreaterThan(80);
    for (const family of families) {
      for (const form of ['zero', 'one', 'two', 'few', 'many', 'other']) {
        expect([family, arMap.has(`${family}_${form}`)]).toEqual([family, true]);
      }
    }
  });

  it('keeps every interpolation placeholder (only spelled-out zero / one / two forms may omit {{count}})', () => {
    const bad = arLeaves.filter(([key, value]) => {
      const base = enMap.has(key) ? key : key.replace(PLURAL_EXTRA, '_other');
      const source = enMap.get(base) ?? '';
      if (/_(zero|one|two)$/.test(key)) {
        return withoutCount(value) !== withoutCount(source);
      }
      return placeholders(value) !== placeholders(source);
    });
    expect(bad.map(([key]) => key)).toEqual([]);
  });

  it('uses Western digits and no CJK / Cyrillic text outside the language names', () => {
    expect(arLeaves.filter(([, value]) => /[٠-٩۰-۹]/.test(value))).toEqual([]);
    expect(arLeaves.filter(([key, value]) => !key.startsWith('appearance.language.') && /[Ѐ-ӿ぀-鿿]/.test(value))).toEqual([]);
  });

  it('is real Arabic: the user-facing sentences contain Arabic letters', () => {
    const sentences = enLeaves.filter(([, value]) => value.length > 30 && /[a-z]{3}/.test(value.replace(/{{[^}]+}}/g, '')) && !/^[a-z]+(\.[A-Za-z_]+){2,}$/.test(value));
    expect(sentences.length).toBeGreaterThan(500);
    expect(sentences.filter(([key]) => !/[؀-ۿ]/.test(arMap.get(key) ?? ''))).toEqual([]);
  });
});

describe('Arabic plural categories', () => {
  it.each([
    [0, 'zero'], [1, 'one'], [2, 'two'], [3, 'few'], [10, 'few'], [11, 'many'], [99, 'many'], [100, 'other'], [102, 'other'], [103, 'few'], [111, 'many'], [1.5, 'other'],
  ] as Array<[number, string]>)('%s -> %s', (count, category) => {
    expect(arabicCardinal(count)).toBe(category);
  });

  it('i18next picks the right Arabic form for every category', async () => {
    await i18n.changeLanguage('ar');
    const t = i18n.getFixedT('ar');
    const family = enLeaves.find(([k]) => k.endsWith('_other'))![0].replace(/_other$/, '');
    expect(arMap.has(`${family}_few`)).toBe(true);
    const forms = [0, 1, 2, 5, 12, 100].map(count => t(family, {count}));
    expect(new Set(forms).size).toBeGreaterThan(3);
    await i18n.changeLanguage('en');
  });
});

describe('Arabic registration and detection', () => {
  it('is a stored / detected language, with regional tags resolving to ar', () => {
    for (const tag of ['ar', 'ar-SA', 'ar_EG', 'ar-DZ', 'ar-001', 'AR-ma', 'ar-Arab-SA']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, 'ar']);
    }
    expect(normalizeAppLanguage('ar')).toBe('ar');
    expect(normalizeAppLanguage('ar-sa')).toBe('ar');
    expect(resolveEditorialLanguage('ar-EG')).toBe('ar');
    expect(languageFromLocaleTag('en-US')).toBe('en-US');
    expect(languageFromLocaleTag('he')).toBeNull();
    expect(normalizeAppLanguage('kmr')).toBeNull();
  });

  it('persists the Arabic choice', async () => {
    await setAppLanguage('ar');
    expect(normalizeAppLanguage('ar')).toBe('ar');
    await setAppLanguage('fr');
    await resetAppLanguageForTests();
  });

  it('the map provider knows Arabic', () => {
    expect(mapLanguageFor('ar')).toBe('ar');
  });
});

describe('Arabic editorial content', () => {
  it('has an Arabic block for every pregnancy week', () => {
    for (let week = 1; week <= 41; week += 1) {
      const data = getPregnancyWeekData(week, 'ar');
      expect(data).toBeDefined();
      expect(JSON.stringify(data)).toMatch(/[؀-ۿ]/);
    }
  });
});

describe('Arabic dates', () => {
  it('uses the Gregorian Arabic locale with Western digits and Arabic weekday abbreviations', async () => {
    await setAppLanguage('ar');
    expect(dateFormatLocale()).toBe('ar-u-nu-latn');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_AR);
    expect(localizedWeekDays()).toHaveLength(7);
    const text = new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(2026, 8, 3));
    expect(text).toMatch(/[؀-ۿ]/);
    expect(text).toMatch(/2026/);
    expect(text).not.toMatch(/[٠-٩]/);
    await resetAppLanguageForTests();
  });

  it('formats the Hijri date and month with Arabic month names and the era mark', async () => {
    await setAppLanguage('ar');
    const day = formatHijriDate(new Date(2026, 2, 1));
    const month = formatHijriMonthYear(new Date(2026, 2, 1));
    expect(day).toMatch(/[؀-ۿ]/);
    expect(day).toMatch(/هـ$/);
    expect(month).toMatch(/هـ$/);
    await resetAppLanguageForTests();
  });
});

describe('layout direction', () => {
  const setRunning = (rtl: boolean) => {
    Object.defineProperty(I18nManager, 'isRTL', {value: rtl, configurable: true});
  };
  const allow = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => undefined);
  const force = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);
  afterEach(() => {
    allow.mockClear();
    force.mockClear();
    setRunning(false);
    applyLayoutDirectionForLanguage('en');
  });

  it('only Arabic is right-to-left', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('ar-SA')).toBe(true);
    for (const language of ['en', 'en-US', 'fr', 'zh', 'zh-Hant', 'pt-BR', 'ja']) {
      expect([language, isRtlLanguage(language)]).toEqual([language, false]);
    }
  });

  it('en -> ar -> fr: flags follow the language, the restart prompt appears once and clears, no loop', () => {
    setRunning(false);
    expect(applyLayoutDirectionForLanguage('en')).toBe(false);
    expect(applyLayoutDirectionForLanguage('ar')).toBe(true);
    expect(allow).toHaveBeenLastCalledWith(true);
    expect(force).toHaveBeenLastCalledWith(true);
    expect(layoutDirectionRestartNeeded()).toBe(true);
    expect(layoutDirectionRestartTarget()).toBe('ar');
    // back to a left-to-right language before the restart: direction already matches, prompt withdrawn
    expect(applyLayoutDirectionForLanguage('fr')).toBe(false);
    expect(force).toHaveBeenLastCalledWith(false);
    expect(allow).toHaveBeenLastCalledWith(false);
    expect(layoutDirectionRestartNeeded()).toBe(false);
  });

  it('after a restart in Arabic nothing is pending; leaving Arabic asks once more, and after that restart nothing is pending', () => {
    setRunning(true);
    expect(applyLayoutDirectionForLanguage('ar')).toBe(false);
    expect(layoutDirectionRestartNeeded()).toBe(false);
    expect(applyLayoutDirectionForLanguage('fr')).toBe(true);
    expect(layoutDirectionRestartTarget()).toBe('fr');
    setRunning(false);
    expect(applyLayoutDirectionForLanguage('fr')).toBe(false);
    expect(layoutDirectionRestartNeeded()).toBe(false);
  });

  it('the prompt button closes the app', () => {
    const exit = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => undefined);
    closeAppForLayoutDirection();
    expect(exit).toHaveBeenCalledTimes(1);
    exit.mockRestore();
  });
});

describe('RTL typography and icons', () => {
  it('mirrors only directional icons', () => {
    for (const name of ['chevron-left', 'chevron-right', 'arrow-left', 'arrow-right', 'chevron-double-right', 'arrow-left-bold', 'skip-next', 'undo']) {
      expect([name, isDirectionalIconName(name)]).toEqual([name, true]);
    }
    for (const name of ['chevron-down', 'chevron-up', 'arrow-up', 'arrow-left-right', 'heart', 'calendar-month-outline', 'trash-can-outline', 'dots-horizontal']) {
      expect([name, isDirectionalIconName(name)]).toEqual([name, false]);
    }
  });

  it('the icon layer mirrors a directional glyph under RTL, keeps its own transform, and does nothing under LTR', () => {
    const render = jest.fn((props: Record<string, unknown>) => props);
    const component = {render} as unknown as {render: (props: Record<string, unknown>, ref: unknown) => Record<string, unknown>};
    const undo = patchAwaIconMirror(component as never);
    Object.defineProperty(I18nManager, 'isRTL', {value: false, configurable: true});
    expect(component.render({name: 'chevron-left', style: {color: 'red'}}, null)).toEqual({name: 'chevron-left', style: {color: 'red'}});
    Object.defineProperty(I18nManager, 'isRTL', {value: true, configurable: true});
    const mirrored = component.render({name: 'chevron-left', style: {transform: [{rotate: '90deg'}]}}, null) as {style: Array<{transform?: unknown[]}>};
    expect(mirrored.style[1].transform).toEqual([{rotate: '90deg'}, {scaleX: -1}]);
    const plain = component.render({name: 'heart', style: {color: 'red'}}, null);
    expect(plain).toEqual({name: 'heart', style: {color: 'red'}});
    undo();
    Object.defineProperty(I18nManager, 'isRTL', {value: false, configurable: true});
  });

  it('detects Arabic text, raises its line height and resets tracking, and keeps Latin fields identifiable', () => {
    expect(containsArabicScript('مرحبا')).toBe(true);
    expect(containsArabicScript('Hello 123')).toBe(false);
    expect(arabicAdjustment({fontSize: 16, lineHeight: 20})).toEqual({lineHeight: 24});
    expect(arabicAdjustment({fontSize: 16, lineHeight: 28})).toBeNull();
    expect(arabicAdjustment({fontSize: 16, lineHeight: 28, letterSpacing: 0.5})).toEqual({letterSpacing: 0});
    expect(isLatinOnlyField({keyboardType: 'email-address'})).toBe(true);
    expect(isLatinOnlyField({secureTextEntry: true})).toBe(true);
    expect(isLatinOnlyField({keyboardType: 'default'})).toBe(false);
  });
});
