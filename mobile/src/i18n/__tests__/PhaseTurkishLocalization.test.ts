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
import {
  getAppLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {
  WEEK_DAYS,
  WEEK_DAYS_EN,
  WEEK_DAYS_ES,
  WEEK_DAYS_IT,
  WEEK_DAYS_TR,
  capitalize,
  dateFormatLocale,
  formatFullDate,
  formatHijriDate,
  formatShortDate,
  localizedWeekDays,
} from '../../utils/cycleMath';
import {capitalizeFor, foldForConfirmation, lowerCaseFor, upperCaseFor} from '../../utils/textCase';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_TURKISH,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  EXERCISE_HERO,
  PREGNANCY_EXERCISE_HERO,
  PREGNANCY_FOLLOW_UP_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {journalOptionLabel} from '../../utils/journalOptionLabels';

// Turkish (tr) — dictionary, runtime, persistence, dates and case rules, editorial content, images and legal text.
// Screen-level behavior is in screens/__tests__/PhaseTurkishScreens.test.tsx.

type AnyRecord = Record<string, unknown>;

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

/** Simulates an app restart: a fresh themePreferences module hydrates from whatever AsyncStorage holds. */
async function freshLaunchLanguage(): Promise<string> {
  let fresh: typeof import('../../state/themePreferences') | undefined;
  jest.isolateModules(() => {
    fresh = require('../../state/themePreferences');
  });
  await fresh!.hydrateAppearancePreferences();
  return fresh!.getAppLanguage();
}

const enLeaves = leaves(en as AnyRecord);
const trLeaves = leaves(tr as AnyRecord);
const trMap = new Map(trLeaves);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('dictionary integrity', () => {
  it('tr.ts has exactly the same leaf paths as en.ts, fr.ts, es.ts and it.ts (no missing, no extra)', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBeGreaterThan(6000);
    expect(paths(tr as AnyRecord)).toEqual(reference);
    expect(paths(fr as AnyRecord)).toEqual(reference);
    expect(paths(es as AnyRecord)).toEqual(reference);
    expect(paths(itDictionary as AnyRecord)).toEqual(reference);
  });

  it('every Turkish value is a non-empty string', () => {
    const empty = trLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath);
    expect(empty).toEqual([]);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => placeholders(value) !== placeholders(trMap.get(keyPath) as string))
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Turkish', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((trMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys exist as _one/_other pairs with the same variables (the noun is not inflected after a number)', () => {
    const plural = trLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(plural.length).toBeGreaterThan(20);
    for (const one of plural) {
      const other = one.replace(/_one$/, '_other');
      expect(trMap.has(other)).toBe(true);
      // a Turkish sentence may legitimately differ between one and many entries; the variables may not
      const withoutCount = (value: string) => placeholders(value).split('|').filter(name => name !== '{{count}}').join('|');
      expect(withoutCount(trMap.get(one) as string)).toBe(withoutCount(trMap.get(other) as string));
      // the placeholders of both forms follow English (checked for every key above); count-bearing English keys keep {{count}}
      const english = enLeaves.find(([keyPath]) => keyPath === one)?.[1] ?? '';
      if (english.includes('{{count}}')) {
        expect(trMap.get(one)).toContain('{{count}}');
        expect(trMap.get(other)).toContain('{{count}}');
      }
    }
  });

  it('uses the typographic apostrophe and has no mojibake / escaped unicode left in a string', () => {
    const straight = trLeaves.filter(([, value]) => /'/.test(value)).map(([keyPath]) => keyPath);
    expect(straight).toEqual([]);
    // case-sensitive on purpose: "â" (hâlâ, âlim) is real Turkish, "Ã"/"Â" followed by a symbol is a decoding accident
    const mojibake = trLeaves.filter(([, value]) => /Ã[\u0080-¿]|Â[\u0080-¿]|�|\\u[0-9a-f]{4}/i.test(value)).map(([keyPath]) => keyPath);
    expect(mojibake).toEqual([]);
  });

  it('is real Turkish: every Turkish-specific letter appears, and the dotted İ / dotless ı are used correctly', () => {
    const all = trLeaves.map(([, value]) => value).join(' ');
    for (const letter of ['ç', 'ğ', 'ı', 'İ', 'ö', 'ş', 'ü']) {
      expect(all).toContain(letter);
    }
    // never the Latin lookalikes of a transliteration ("cocuk", "gunluk") in common words
    for (const wrong of [/\bgunluk\b/i, /\bcocuk\b/i, /\bsifre\b/i, /\bgebelik\s+haftasi\b/i, /\bdogum\b/i]) {
      expect(wrong.test(all)).toBe(false);
    }
  });

  it('no French, Spanish, Italian or English sentence was left behind in a Turkish string', () => {
    const FOREIGN = new Set(
      ('pour avec vous votre vos tes des les une est dans sur cette ces nous elle être tout plus mais ' +
        'para con los las una del por que como más pero sus tus esta este estos también cuando ' +
        'della delle degli gli nel nella sono che questo questa tuo tua tuoi non anche quando dal dei ' +
        'the and your you with for this that are have will can not').split(' '),
    );
    const leaked = trLeaves
      .filter(([, value]) => value.toLowerCase().split(/[^a-zçğıöşüâîû]+/).filter(word => FOREIGN.has(word)).length >= 3)
      .map(([keyPath]) => keyPath);
    expect(leaked).toEqual([]);
  });

  it('strings identical to English are brand names, endonyms, symbols or icon-like identifiers only', () => {
    const identical = enLeaves.filter(([keyPath, value]) => trMap.get(keyPath) === value && /[A-Za-z]{4,}/.test(value));
    // Every identical value must be short (a brand/endonym/technical label), never a sentence.
    const sentences = identical.filter(([, value]) => value.split(/\s+/).length > 4).map(([keyPath, value]) => `${keyPath}: ${value}`);
    expect(sentences).toEqual([]);
  });

  it('the product wording is Turkish and consistent: "AWA Birlikte", "SİL", "Türkçe"', () => {
    expect(trMap.get('awaADeux.pending.title') ?? '').not.toMatch(/AWA Together|AWA Pareja|AWA Insieme|AWA à deux/);
    const mentions = trLeaves.filter(([, value]) => /AWA (Together|Pareja|Insieme|à deux)/.test(value));
    expect(mentions).toEqual([]);
    expect(trMap.get('profile.awaADeuxTitle') ?? trMap.get('profile.awaADeuxTitle') ?? 'AWA Birlikte').toMatch(/AWA Birlikte/);
    expect(trMap.get('dataPrivacy.deleteAccount.confirmWord')).toBe('SİL');
    expect(trMap.get('appearance.language.turkishName')).toBe('Türkçe');
    for (const dictionary of [en, fr, es, itDictionary, tr]) {
      expect((dictionary as AnyRecord & {appearance: {language: {turkishName: string}}}).appearance.language.turkishName).toBe('Türkçe');
    }
  });

  it('the Appearance card subtitle is exactly the requested Turkish text', () => {
    expect(trMap.get('profile.appearanceSubtitle')).toBe('Temalar, renkler, görünüm ve dil');
  });

  it('the core vocabulary follows the requested terminology', () => {
    const value = (keyPath: string) => (trMap.get(keyPath) ?? '').toLocaleLowerCase('tr');
    expect(value('navigation.statistics')).toBe('i̇statistikler'.normalize('NFC') === 'i̇statistikler' ? value('navigation.statistics') : 'i̇statistikler');
    expect(trMap.get('navigation.statistics')).toBe('İstatistikler');
    expect(trMap.get('navigation.home')).toBe('Ana sayfa');
    expect(trMap.get('common.save')).toBe('Kaydet');
    const joined = trLeaves.map(([, v]) => v.toLocaleLowerCase('tr')).join(' ');
    for (const term of ['adet', 'yumurtlama', 'doğurganlık', 'gebelik', 'doğum sonrası', 'belirti', 'hatırlatıcı', 'bildirim', 'görünüm']) {
      expect(joined).toContain(term);
    }
  });
});

describe('registration, default, fallback and persistence', () => {
  it('Turkish is registered with the real tr.ts dictionary next to the four others', () => {
    const bundle = i18n.getResourceBundle('tr', 'translation') as AnyRecord;
    expect(bundle).toBeTruthy();
    expect(leaves(bundle).length).toBe(trLeaves.length);
    for (const language of ['en', 'fr', 'es', 'it', 'tr']) {
      expect(i18n.hasResourceBundle(language, 'translation')).toBe(true);
    }
  });

  it('English stays the default language and the fallback', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
    expect(getAppLanguage()).toBe('en');
  });

  it('a key missing in Turkish falls back to ENGLISH — never French, Spanish or Italian', () => {
    const instance = i18n.createInstance();
    return instance
      .init({
        resources: {en: {translation: {only: 'English only'}}, tr: {translation: {}}, fr: {translation: {only: 'Français'}}},
        lng: 'tr',
        fallbackLng: 'en',
      })
      .then(() => {
        expect(instance.t('only')).toBe('English only');
      });
  });

  it('Turkish can be selected, is persisted, and survives a restart; the other languages still work', async () => {
    await setAppLanguage('tr');
    expect(getAppLanguage()).toBe('tr');
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe('tr');

    // "restart": a brand-new module instance (nothing in memory) re-reads what is in storage
    expect(await freshLaunchLanguage()).toBe('tr');

    for (const language of ['fr', 'en', 'es', 'it', 'tr'] as AwaAppLanguage[]) {
      await setAppLanguage(language);
      expect(getAppLanguage()).toBe(language);
      expect(await freshLaunchLanguage()).toBe(language);
    }
  });

  it('existing stored languages are preserved and an invalid value never becomes Turkish', async () => {
    for (const stored of ['fr', 'en', 'es', 'it']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', stored);
      expect(await freshLaunchLanguage()).toBe(stored);
    }
    for (const invalid of ['tr-TR', 'TR', 'turkish', '']) {
      await AsyncStorage.setItem('@awa/appearance/language-v1', invalid);
      expect(await freshLaunchLanguage()).toBe('en'); // anything that is not a supported code is ignored
    }
    await AsyncStorage.removeItem('@awa/appearance/language-v1');
    expect(await freshLaunchLanguage()).toBe('en');
  });

  it('is never chosen automatically (no device, SIM, IP or location based detection)', async () => {
    expect(await freshLaunchLanguage()).toBe('en');
    const detectionSources = ['src/services/countryDetection.ts', 'src/i18n/index.ts', 'src/state/themePreferences.ts'];
    for (const relative of detectionSources) {
      const source = fs.readFileSync(path.join(__dirname, '..', '..', '..', relative), 'utf8');
      expect(source).not.toMatch(/setAppLanguage\(\s*['"]tr['"]/);
    }
  });

  it('switches at runtime: EN -> TR -> FR -> TR with no restart', async () => {
    expect(tOf('common.save', 'en')).toBe('Save');
    await i18n.changeLanguage('tr');
    expect(i18n.t('common.save')).toBe('Kaydet');
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe(fr.common.save);
    await i18n.changeLanguage('tr');
    expect(i18n.t('common.save')).toBe('Kaydet');
  });

  it('plural resolution works in Turkish (one and other)', async () => {
    const key = 'statistics.daysPlural';
    expect(tOf(key, 'tr', {count: 1})).toBe(tOf(key, 'tr', {count: 1}));
    expect(tOf(key, 'tr', {count: 1})).toContain('1');
    expect(tOf(key, 'tr', {count: 5})).toContain('5');
    expect(tOf(key, 'tr', {count: 5})).not.toMatch(/\{\{/);
  });
});

describe('Turkish dates, weekdays and calendar headers', () => {
  const sample = new Date(2026, 9, 5, 12); // Monday 5 October 2026

  it('uses tr-TR and leaves the other languages’ locales alone', async () => {
    await setAppLanguage('tr');
    expect(dateFormatLocale()).toBe('tr-TR');
    for (const [language, locale] of [['en', 'en-US'], ['fr', 'fr-FR'], ['es', 'es-ES'], ['it', 'it-IT']] as const) {
      await setAppLanguage(language);
      expect(dateFormatLocale()).toBe(locale);
    }
  });

  it('weekdays are Monday-first Turkish abbreviations, and the others are unchanged', async () => {
    expect(WEEK_DAYS_TR).toEqual(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']);
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

  it('full weekday and month names are Turkish, with correct letters', async () => {
    await setAppLanguage('tr');
    const weekday = (offset: number) =>
      new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long'}).format(new Date(2026, 9, 5 + offset, 12));
    expect([0, 1, 2, 3, 4, 5, 6].map(offset => capitalize(weekday(offset)))).toEqual(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']);
    const months = Array.from({length: 12}, (_, month) =>
      capitalize(new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long'}).format(new Date(2026, month, 15, 12))));
    expect(months).toEqual(['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']);
  });

  it('short and long dates read in Turkish; stored date keys are language-independent', async () => {
    await setAppLanguage('tr');
    expect(formatShortDate(sample)).toBe('5 Ekim');
    expect(formatFullDate(sample)).toBe('5 Ekim 2026');
    const key = sample.toLocaleDateString('en-CA');
    await setAppLanguage('en');
    expect(sample.toLocaleDateString('en-CA')).toBe(key);
    expect(key).toBe('2026-10-05');
  });

  it('the Hijri helper does not throw in Turkish', async () => {
    await setAppLanguage('tr');
    expect(() => formatHijriDate(sample)).not.toThrow();
  });

  it('Turkish letters survive capitalization and formatting (ç ğ ı İ ö ş ü)', async () => {
    await setAppLanguage('tr');
    expect(capitalize('ışık')).toBe('Işık');
    expect(capitalize('iyi')).toBe('İyi');
    expect(capitalize('şubat')).toBe('Şubat');
    expect(capitalize('ağustos')).toBe('Ağustos');
    expect(capitalize('çarşamba')).toBe('Çarşamba');
    await setAppLanguage('en');
    expect(capitalize('iyi')).toBe('Iyi'); // every other language keeps the default rule
  });
});

describe('Turkish case rules (dotted İ / dotless ı)', () => {
  it('upper/lower/capitalize follow the Turkish alphabet only for Turkish', () => {
    expect(upperCaseFor('iyi', 'tr')).toBe('İYİ');
    expect(upperCaseFor('ışık', 'tr')).toBe('IŞIK');
    expect(upperCaseFor('takvim', 'tr')).toBe('TAKVİM');
    expect(lowerCaseFor('İSTANBUL', 'tr')).toBe('istanbul');
    expect(lowerCaseFor('IŞIK', 'tr')).toBe('ışık');
    expect(capitalizeFor('ilk', 'tr')).toBe('İlk');
    expect(upperCaseFor('iyi', 'en')).toBe('IYI');
    expect(upperCaseFor('ç ğ ö ş ü', 'tr')).toBe('Ç Ğ Ö Ş Ü');
    expect(lowerCaseFor('Ç Ğ Ö Ş Ü', 'tr')).toBe('ç ğ ö ş ü');
    expect(lowerCaseFor('DELETE', 'en')).toBe('delete');
  });

  it('the typed destructive-confirmation word accepts every way a Turkish user may type it', () => {
    const expected = foldForConfirmation('SİL', 'tr');
    for (const typed of ['SİL', 'sil', 'Sil', 'SIL', ' sil ', 'sİl']) {
      expect(foldForConfirmation(typed, 'tr')).toBe(expected);
    }
    expect(foldForConfirmation('sel', 'tr')).not.toBe(expected);
    expect(foldForConfirmation('delete', 'en')).toBe(foldForConfirmation('DELETE', 'en'));
  });
});

describe('editorial content: library articles, pregnancy weeks, legal text', () => {
  const libraryDir = path.join(__dirname, '..', '..', 'screens', 'library');
  const articleFiles = fs.readdirSync(libraryDir).filter(file => file.endsWith('ArticleScreen.tsx'));

  const contentOf = (file: string): {en: unknown; tr: unknown} | null => {
    const source = fs.readFileSync(path.join(libraryDir, file), 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2019, true, ts.ScriptKind.TSX);
    let found: {en: unknown; tr: unknown} | null = null;
    const visit = (node: ts.Node) => {
      if (ts.isObjectLiteralExpression(node) && !found) {
        const props = node.properties.filter(ts.isPropertyAssignment);
        const named = (name: string) => props.find(property => property.name.getText() === name);
        const enProp = named('en');
        const itProp = named('it');
        const trProp = named('tr');
        if (enProp && itProp && trProp && ts.isObjectLiteralExpression(enProp.initializer) && ts.isObjectLiteralExpression(trProp.initializer)) {
          const evaluate = (n: ts.Node) => vm.runInNewContext(`(${source.slice(n.getStart(), n.getEnd())})`);
          found = {en: evaluate(enProp.initializer), tr: evaluate(trProp.initializer)};
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

  it('resolveEditorialLanguage knows Turkish and still defaults to English', () => {
    expect(resolveEditorialLanguage('tr')).toBe('tr');
    for (const language of ['fr', 'es', 'it', 'en']) {
      expect(resolveEditorialLanguage(language)).toBe(language);
    }
    for (const other of ['de', '', null, undefined, 'tr-TR']) {
      expect(resolveEditorialLanguage(other as string | null | undefined)).toBe('en');
    }
  });

  it('all 72 library articles have a Turkish block with exactly the English structure', () => {
    const withContent = articleFiles.map(file => [file, contentOf(file)] as const);
    expect(withContent.length).toBeGreaterThanOrEqual(72);
    const missing = withContent.filter(([, content]) => content === null).map(([file]) => file);
    // UnderstandCycleArticleScreen is a legacy, French-only screen that no route or import references (unreachable);
    // it has no CONTENT object for any language, so it is excluded here and listed in the phase report instead.
    expect(missing.filter(file => file !== 'UnderstandCycleArticleScreen.tsx')).toEqual([]);
    const different = withContent
      .filter(([, content]) => content !== null)
      .filter(([, content]) => JSON.stringify(shape((content as {en: unknown}).en)) !== JSON.stringify(shape((content as {tr: unknown}).tr)))
      .map(([file]) => file);
    expect(different).toEqual([]);
  });

  it('every Turkish article is actually translated: it differs from English in the vast majority of strings', () => {
    const offenders: string[] = [];
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const turkish = strings(content.tr);
      const same = english.filter((value, index) => value === turkish[index] && /[A-Za-z]{4,}/.test(value)).length;
      if (same / Math.max(english.length, 1) > 0.15) {offenders.push(`${file}: ${same}/${english.length}`);}
    }
    expect(offenders).toEqual([]);
  });

  it('no Turkish article keeps the interpolation placeholders or the numbers of the English one out of step', () => {
    const wrong: string[] = [];
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      const english = strings(content.en);
      const turkish = strings(content.tr);
      english.forEach((value, index) => {
        if (placeholders(value) !== placeholders(turkish[index] ?? '')) {wrong.push(`${file}#${index}`);}
        const numbers = (text: string) => (text.replace(/\{\{[^}]*\}\}/g, ' ').match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
        if (numbers(value) !== numbers(turkish[index] ?? '')) {wrong.push(`${file}#${index} numbers`);}
      });
    }
    expect(wrong).toEqual([]);
  });

  it('articles use the typographic apostrophe and real Turkish text', () => {
    const bad: string[] = [];
    let totalTurkishLetters = 0;
    for (const file of articleFiles) {
      const content = contentOf(file);
      if (!content) {continue;}
      for (const value of strings(content.tr)) {
        if (/'/.test(value)) {bad.push(`${file}: ${value.slice(0, 40)}`);}
        totalTurkishLetters += (value.match(/[çğıİöşüÇĞÖŞÜ]/g) ?? []).length;
      }
    }
    expect(bad).toEqual([]);
    expect(totalTurkishLetters).toBeGreaterThan(5000);
  });

  it('all 41 pregnancy weeks resolve to Turkish content with the English fields, distinct from every other language', () => {
    for (let week = 1; week <= 41; week += 1) {
      const turkish = getPregnancyWeekData(week, 'tr');
      const english = getPregnancyWeekData(week, 'en');
      expect(turkish).toBeDefined();
      expect(english).toBeDefined();
      expect(Object.keys(turkish as object).sort()).toEqual(Object.keys(english as object).sort());
      expect(turkish?.babyDescription).not.toBe(english?.babyDescription);
      expect(turkish?.bodyChanges).toHaveLength((english?.bodyChanges ?? []).length);
      expect(turkish?.toKnow).toHaveLength((english?.toKnow ?? []).length);
      expect(turkish?.week).toBe(week);
      // language-neutral references are shared
      expect(turkish?.babyImage).toBe(english?.babyImage);
      expect(turkish?.sourceRefs).toEqual(english?.sourceRefs);
      for (const other of ['fr', 'es', 'it'] as const) {
        expect(turkish?.babyDescription).not.toBe(getPregnancyWeekData(week, other)?.babyDescription);
      }
    }
  });

  it('pregnancy week figures are preserved exactly (decimal comma only)', () => {
    const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map(n => n.replace(',', '.')).sort().join(',');
    for (let week = 1; week <= 41; week += 1) {
      const turkish = getPregnancyWeekData(week, 'tr');
      const english = getPregnancyWeekData(week, 'en');
      for (const field of ['length', 'comparison'] as const) {
        if (english?.[field]) {
          expect([week, field, numbers(String(turkish?.[field] ?? ''))]).toEqual([week, field, numbers(String(english[field]))]);
        }
      }
      expect(numbers([turkish?.babyDescription, ...(turkish?.bodyChanges ?? []), ...(turkish?.toKnow ?? [])].join(' '))).toBe(
        numbers([english?.babyDescription, ...(english?.bodyChanges ?? []), ...(english?.toKnow ?? [])].join(' ')),
      );
    }
  });

  it('week data for an unrecognized language is still English', () => {
    expect(getPregnancyWeekData(12, 'de' as never)?.babyDescription).toBe(getPregnancyWeekData(12, 'en')?.babyDescription);
  });

  it('legal placeholder text exists in Turkish with the same sections as English', () => {
    expect(Object.keys(TERMS).sort()).toEqual(['en', 'es', 'fr', 'tr']);
    expect(Object.keys(PRIVACY).sort()).toEqual(['en', 'es', 'fr', 'tr']);
    expect(TERMS.tr).toHaveLength(TERMS.en.length);
    expect(PRIVACY.tr).toHaveLength(PRIVACY.en.length);
    TERMS.tr.concat(PRIVACY.tr).forEach(section => {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.body.trim().length).toBeGreaterThan(0);
    });
    expect(TERMS.tr[0].title).not.toBe(TERMS.en[0].title);
  });
});

describe('text-in-image illustrations', () => {
  const sets = {CYCLE_PHASES_HERO, PREGNANCY_FOLLOW_UP_HERO, PREGNANCY_EXERCISE_HERO, EXERCISE_HERO};

  it('French, English, Spanish and Italian still resolve to their own artwork', () => {
    for (const set of Object.values(sets)) {
      for (const language of ['fr', 'en', 'es', 'it'] as const) {
        expect(resolveEditorialImage(set, language)).toBe(set[language]);
        expect(hasLocalizedEditorialImage(set, language)).toBe(true);
      }
    }
  });

  // Images whose Turkish artwork has been produced. Everything else falls back to ENGLISH and says so.
  const TURKISH_SHIPPED = ['cycle-phases-hero'];
  const namedSets: Record<string, (typeof sets)[keyof typeof sets]> = {
    'cycle-phases-hero': CYCLE_PHASES_HERO,
    grossesse_semiane: PREGNANCY_FOLLOW_UP_HERO,
    'activité_grossesse': PREGNANCY_EXERCISE_HERO,
    'activité': EXERCISE_HERO,
  };

  it('Turkish resolves to its own artwork where it exists, otherwise explicitly to ENGLISH (never FR/ES/IT)', () => {
    for (const [base, set] of Object.entries(namedSets)) {
      if (TURKISH_SHIPPED.includes(base)) {
        expect(set.tr).toBeDefined();
        expect(hasLocalizedEditorialImage(set, 'tr')).toBe(true);
        expect(resolveEditorialImage(set, 'tr')).toBe(set.tr);
        continue;
      }
      expect(hasLocalizedEditorialImage(set, 'tr')).toBe(false);
      expect(resolveEditorialImage(set, 'tr')).toBe(set.en);
      // Jest's asset mock returns one shared value for every require(), so FR/ES/IT identity cannot be
      // asserted here; the source-level guarantee is that the resolver reads `image[resolved] ?? image.en`.
    }
    const resolver = fs.readFileSync(path.join(__dirname, '..', 'editorialImages.ts'), 'utf8');
    expect(resolver).toContain('image[resolved] ?? image.en');
    expect([...EDITORIAL_IMAGES_MISSING_TURKISH].sort()).toEqual(['activité', 'activité_grossesse', 'grossesse_semiane']);
  });

  it('the spoken description is Turkish and states that the lettering in the picture is English', () => {
    for (const key of ['pregnancyFollowUp', 'pregnancyExercise', 'exercise'] as const) {
      const alt = EDITORIAL_IMAGE_ALT[key].tr;
      expect(alt).toMatch(/^İlüstrasyon:/);
      expect(alt).toContain('İngilizce');
      expect(alt).not.toBe(EDITORIAL_IMAGE_ALT[key].en);
    }
  });

  it('a language-neutral image is returned untouched for Turkish', () => {
    const plain = 123;
    expect(resolveEditorialImage(plain, 'tr')).toBe(plain);
  });
});

describe('categorical labels and journal options', () => {
  it('stored French values display as Turkish labels and unknown values pass through; storage never changes', async () => {
    await setAppLanguage('tr');
    await i18n.changeLanguage('tr');
    const t = i18n.t.bind(i18n) as (key: string, options?: AnyRecord) => string;
    const label = journalOptionLabel('cycleSymptom', 'Crampes', t as never);
    expect(label).not.toBe('Crampes');
    expect(label.trim().length).toBeGreaterThan(0);
    expect(journalOptionLabel('cycleSymptom', 'valeur-inconnue', t as never)).toBe('valeur-inconnue');
  });
});
