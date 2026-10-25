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
import {ptPT, ptBR, ptBRFull} from '../../testUtils/portugueseDictionaries';
import {
  getAppLanguage,
  languageFromLocaleTag,
  normalizeAppLanguage,
  pickSupportedLanguage,
  resetAppLanguageForTests,
  setAppLanguage,
  type AwaAppLanguage,
} from '../../state/themePreferences';
import {WEEK_DAYS_PT, dateFormatLocale, formatFullDate, formatHijriDate, formatHijriDay, formatShortDate, localizedWeekDays} from '../../utils/cycleMath';
import {resolveEditorialLanguage} from '../editorialLanguage';
import {
  EDITORIAL_IMAGES_MISSING_PORTUGUESE,
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  hasLocalizedEditorialImage,
  resolveEditorialImage,
} from '../editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {TERMS, PRIVACY} from '../../screens/LegalDocumentScreen';
import {AwaPluralRulesForTests} from '../pluralRules';
import {applyPortugueseOverlay, withBrazilianPortuguese} from '../ptBrEditorial';
import {PT_BR_ARTICLE_OVERLAY, PT_BR_WEEK_OVERLAY} from '../ptBrEditorialOverlay';

// Português: ONE complete European-Portuguese translation ('pt-PT', Portugal — the base) and a Brazilian OVERLAY ('pt-BR', Brasil — only the
// words, spellings and constructions that differ). These tests pin the dictionary integrity of both, the overlay mechanics (i18next fallback
// pt-BR → pt-PT → en; withBrazilianPortuguese for the 73 articles; the pregnancy weeks), plurals (pt-PT: 0 is "other", pt-BR: 0 is "one"),
// registration and locale detection, runtime switching, persistence, dates, editorial content, images and legal text.
// PDF / typography / notifications have their own suites (medicalExportPortugueseLayout, notificationPortugueseLocalization).

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
const L = '(?<![\\p{L}])';
const R = '(?![\\p{L}])';
// forms that exist only in Brazilian Portuguese — they must never appear in the Portugal base
const BRAZIL_ONLY = new RegExp(`${L}(celular(es)?|tela(s)?|usuári[oa]s?|salvar|compartilh\\w+|arquivos?|baixar|configurações|absorventes?|camisinhas?|ultrassom|ultrassonografia|gestantes?|banheiro|equipes?|Islã|você|vocês|gerenciar|deletar|aspecto|recepção|contato|ônibus)${R}`, 'iu');
// forms that exist only in European Portuguese — they must not be left in the Brazilian overlay
const EUROPEAN_ONLY = new RegExp(`${L}(telemóvel|telemóveis|ecrã|ecrãs|utilizador(es)?|guardar|ficheiros?|partilhar|definições|autocarro|equipa|subscrição|subscrições|pequeno-almoço|casa de banho|islão|bebé|bebés|facto|contacto|receção|aspeto|conceção|contraceção|contracetivo|perceção|ecografia|ecografias|penso higiénico|pensos higiénicos|afrontamentos|palavra-passe|transferir|eliminar)${R}`, 'iu');
const TU_FORMS = new RegExp(`${L}(teu|tua|teus|tuas|tens|podes|queres|sabes)${R}`, 'iu');
const PRE_AO90 = new RegExp(`${L}(acção|acções|óptimo|óptima|direcção|objectivo|actividade|activo|activa|exacto|espectáculo|concepção|contracepção|contraceptivo)${R}`, 'iu');

const enLeaves = leaves(en as AnyRecord);
const ptLeaves = leaves(ptPT as AnyRecord);
const ptMap = new Map(ptLeaves);
const brLeaves = leaves(ptBR as AnyRecord);
const brFullLeaves = leaves(ptBRFull as AnyRecord);
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da'] as const;
const ENDONYM = /^appearance\.language\.[a-zA-Z]+Name$/;
// Values kept as written on purpose (e-mail examples, the product name, the Arabic greeting with its ʿayn mark, confirmation words, Premium pill)
const AS_WRITTEN = new Set([
  'help.helpSupport.modal.placeholderEmail', 'profile.awaADeuxTitle', 'profile.awaADeuxSectionTitle', 'awaADeux.partnerSide.invitation.title',
  'auth.forgotPassword.emailFieldPlaceholder', 'cycleHome.greeting', 'awaADeux.partnerSide.home.greeting', 'personalInformation.greeting',
  'backupUtility.export.premium.pill', 'discreetLauncher.discreetTitle', 'premium.sheet.heroTitle', 'premium.sheet.heroBadge',
]);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Portugal dictionary integrity (pt-PT)', () => {
  it('ptPT.ts has exactly the same leaf paths as every other dictionary — fifteen-language parity, no missing, no extra', () => {
    const paths = (dictionary: AnyRecord) => leaves(dictionary).map(([keyPath]) => keyPath).sort();
    const reference = paths(en as AnyRecord);
    expect(reference.length).toBe(6248);
    expect(paths(ptPT as AnyRecord)).toEqual(reference);
    for (const dictionary of [fr, es, itDictionary, tr, de, zh, id, hi, sq, ja, ko, bn]) {
      expect(paths(dictionary as AnyRecord)).toEqual(reference);
    }
    // Russian has four plural forms: besides the shared keys it carries the extra _few / _many ones.
    expect(paths(ru as AnyRecord).filter(keyPath => !/_(few|many)$/.test(keyPath))).toEqual(reference);
    expect(new Set(reference).size).toBe(reference.length); // no duplicate key paths
    expect(brFullLeaves.map(([keyPath]) => keyPath).sort()).toEqual(reference); // the overlay never adds a key
  });

  it('every Portuguese value is non-empty exactly where the English one is', () => {
    const empty = ptLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    const englishEmpty = enLeaves.filter(([, value]) => value.trim().length === 0).map(([keyPath]) => keyPath).sort();
    expect(empty).toEqual(englishEmpty);
  });

  it('interpolation placeholders are identical to English in every string', () => {
    const wrong = enLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(ptMap.get(keyPath) as string)).map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('line breaks that exist in English exist in the same number in Portuguese', () => {
    const wrong = enLeaves
      .filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((ptMap.get(keyPath) as string).match(/\n/g) ?? []).length)
      .map(([keyPath]) => keyPath);
    expect(wrong).toEqual([]);
  });

  it('plural keys: both categories exist and are written separately (singular vs plural), with the English variables', () => {
    const ones = ptLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_one'));
    expect(ones.length).toBeGreaterThan(60);
    let identical = 0;
    for (const one of ones) {
      const other = one.replace(/_one$/, '_other');
      expect(ptMap.get(other)).toBeDefined();
      const englishOne = enLeaves.find(([keyPath]) => keyPath === one)![1];
      expect(placeholders(ptMap.get(one) as string)).toBe(placeholders(englishOne));
      expect(placeholders(ptMap.get(other) as string)).toBe(placeholders(enLeaves.find(([keyPath]) => keyPath === other)![1]));
      if (ptMap.get(one) === ptMap.get(other)) {identical += 1;}
    }
    // Portuguese has two categories: singular and plural almost never read the same ("1 dia" / "{{count}} dias")
    expect(identical).toBeLessThan(Math.ceil(ones.length * 0.05));
    expect(ptLeaves.filter(([keyPath]) => /_(few|many|zero|two)$/.test(keyPath))).toEqual([]);
  });

  it('is real European Portuguese: no raw key, no foreign script, no zero-width characters, nothing left in English', () => {
    expect(ptLeaves.filter(([keyPath, value]) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Devanagari}\p{Script=Arabic}]/u.test(value) && !ENDONYM.test(keyPath))).toEqual([]);
    expect(ptLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]); // a leaked i18n key
    expect(ptLeaves.filter(([, value]) => INVISIBLE.test(value))).toEqual([]);
    const sentences = enLeaves.filter(([keyPath, value]) => value.length > 30 && /[a-z]{3}/.test(value.replace(/\{\{[^}]*\}\}/g, '')) && !AS_WRITTEN.has(keyPath));
    expect(sentences.filter(([keyPath, value]) => ptMap.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('uses European Portuguese: no Brazilian-only word, no tu-form, no pre-AO90 spelling, no decomposed accent', () => {
    expect(ptLeaves.filter(([, value]) => BRAZIL_ONLY.test(value)).map(([keyPath, value]) => `${keyPath}: ${(value.match(BRAZIL_ONLY) ?? [])[0]}`)).toEqual([]);
    expect(ptLeaves.filter(([, value]) => TU_FORMS.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(ptLeaves.filter(([, value]) => PRE_AO90.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(ptLeaves.filter(([, value]) => value !== value.normalize('NFC')).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('every accented letter is a precomposed Latin-1 letter (á à â ã é ê í ó ô õ ú ç …): drawable by the standard PDF font and by Inter', () => {
    const letters = new Set(ptLeaves.concat(brLeaves).map(([, value]) => value).join('').match(/\p{L}/gu));
    const outside = [...letters].filter(letter => !/[A-Za-zÀ-ÿªº]/.test(letter)); // (ª º: the ordinal indicators of "1.º trimestre" — Latin-1, drawn by Helvetica)
    // (the endonyms of the other languages are written in their own scripts)
    expect(outside.filter(letter => !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Arabic}ğĞşŞıİ]/u.test(letter))).toEqual([]);
    const all = ptLeaves.map(([, value]) => value).join('');
    for (const char of ['á', 'à', 'â', 'ã', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç']) {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
  });

  it('keeps the brand (feminine: "a AWA"), the product names and the language endonyms identical in every language', () => {
    for (const language of ALL_LANGUAGES) {
      expect(tOf('appearance.language.portugueseName', language)).toBe('Português (Portugal)');
      expect(tOf('appearance.language.portugueseBrazilName', language)).toBe('Português (Brasil)');
    }
    expect(tOf('premium.sheet.heroTitle', 'pt-PT')).toContain('AWA');
    expect(ptLeaves.filter(([, value]) => /(?<![\p{L}])(o|O|do|no|ao|pelo|um) AWA(?![\p{L}])/u.test(value))).toEqual([]);
    expect(tOf('appearanceThemeNames.awa-original', 'pt-PT')).toBe('AWA Original');
    expect(tOf('profile.awaADeuxTitle', 'pt-BR')).toBe('AWA Together');
  });

  it('uses the agreed terminology and the polite third-person form', () => {
    const all = ptLeaves.map(([, value]) => value).join('\n');
    for (const term of ['menstruação', 'ovulação', 'gravidez', 'pós-parto', 'menopausa', 'contraceção', 'sintomas', 'temperatura', 'oração', 'jejum', 'nifas', 'Qada', 'Guardar', 'ecrã']) {
      expect([term, all.toLowerCase().includes(term.toLowerCase())]).toEqual([term, true]);
    }
    expect(tOf('common.save', 'pt-PT')).toBe('Guardar');
    expect(tOf('objectives.pregnancy', 'pt-PT')).toContain('gravidez');
    expect((all.match(/(?<![\p{L}])(o|a) seu|(?<![\p{L}])(os|as) seus?/giu) ?? []).length).toBeGreaterThan(300);
    // religious proper names keep one spelling
    expect(all).not.toMatch(/Ramadan(?![\p{L}])/u);
    expect(all).toMatch(/Ramadão/);
  });

  it('physical-activity options Hiking and Cardio and the palette names are translated', () => {
    const activity = (ptPT as unknown as {journalOptions: {cycleActivityType: Record<string, string>}}).journalOptions.cycleActivityType;
    expect(activity.hiking).toBe('Caminhada na natureza');
    expect(activity.cardio).toBe('Cardio');
    const names = (ptPT as unknown as {appearanceThemeNames: Record<string, string>}).appearanceThemeNames;
    expect(Object.keys(names).sort()).toEqual(['awa-original', 'lavender-night', 'midnight', 'ocean-calm', 'rose-quartz', 'sage-serenity', 'warm-sand']);
    expect(names['awa-original']).toBe('AWA Original');
    expect(new Set(Object.values(names)).size).toBe(7);
  });

  it('the article category tabs are short single-line labels', () => {
    for (const key of ['all', 'medical', 'religious', 'featured']) {
      for (const language of ['pt-PT', 'pt-BR'] as const) {
        const label = tOf(`library.screen.tabs.${key}`, language);
        expect(label.length).toBeLessThanOrEqual(14);
        expect(label).not.toContain('\n');
      }
    }
  });
});

describe('Brazilian overlay (pt-BR)', () => {
  it('is an overlay: every key exists in the Portugal dictionary, none is added, arrays are never partial', () => {
    expect(brLeaves.length).toBeGreaterThan(1500);
    expect(brLeaves.length).toBeLessThan(ptLeaves.length * 0.6); // only what differs
    expect(brLeaves.filter(([keyPath]) => !ptMap.has(keyPath)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('keeps every placeholder and line break of the Portugal text', () => {
    expect(brLeaves.filter(([keyPath, value]) => placeholders(value) !== placeholders(ptMap.get(keyPath) as string)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(brLeaves.filter(([keyPath, value]) => (value.match(/\n/g) ?? []).length !== ((ptMap.get(keyPath) as string).match(/\n/g) ?? []).length).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('every overlay string really differs from Portugal and is Brazilian: no Portugal-only form, no tu-form, NFC, brand "a AWA"', () => {
    // (a plural family is always complete in the overlay — see the brdict builder — so its unchanged half is a copy; every other key differs)
    expect(brLeaves.filter(([keyPath, value]) => value === ptMap.get(keyPath) && !/_(one|other)$/.test(keyPath)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(brLeaves.filter(([, value]) => EUROPEAN_ONLY.test(value)).map(([keyPath, value]) => `${keyPath}: ${(value.match(EUROPEAN_ONLY) ?? [])[0]}`)).toEqual([]);
    expect(brLeaves.filter(([, value]) => TU_FORMS.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(brLeaves.filter(([, value]) => value !== value.normalize('NFC') || INVISIBLE.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
    expect(brLeaves.filter(([, value]) => /(?<![\p{L}])(o|O|do|no|ao|pelo|um) AWA(?![\p{L}])/u.test(value)).map(([keyPath]) => keyPath)).toEqual([]);
  });

  it('reads Brazilian where it differs (Salvar, Configurações, tela, celular …) and keeps the Portugal text everywhere else', () => {
    expect(tOf('common.save', 'pt-BR')).toBe('Salvar');
    expect(tOf('common.save', 'pt-PT')).toBe('Guardar');
    const all = brFullLeaves.map(([, value]) => value).join('\n');
    for (const term of ['Salvar', 'Configurações', 'tela', 'celular']) {
      expect([term, all.includes(term)]).toEqual([term, true]);
    }
    expect(tOf('journalOptions.cycleActivityType.hiking', 'pt-BR')).toBe('Trilha');
    // a key that has no Brazilian overlay reads exactly as in Portugal (i18next falls back pt-BR → pt-PT)
    const untouched = ptLeaves.map(([keyPath]) => keyPath).find(keyPath => !brLeaves.some(([bk]) => bk === keyPath) && !ENDONYM.test(keyPath) && !keyPath.endsWith('_other') && !keyPath.includes('['))!;
    expect(tOf(untouched, 'pt-BR')).toBe(tOf(untouched, 'pt-PT'));
    // the endonyms are the same in both
    expect(tOf('appearance.language.portugueseBrazilName', 'pt-BR')).toBe('Português (Brasil)');
  });

  it('the merged Brazilian dictionary has no raw key, no English sentence left, and the fallback chain ends in English only for a key nobody has', () => {
    expect(brFullLeaves.filter(([, value]) => /^[a-z][A-Za-z]+(\.[A-Za-z_]+){2,}$/.test(value))).toEqual([]);
    const sentences = enLeaves.filter(([keyPath, value]) => value.length > 30 && /[a-z]{3}/.test(value.replace(/\{\{[^}]*\}\}/g, '')) && !AS_WRITTEN.has(keyPath));
    const merged = new Map(brFullLeaves);
    expect(sentences.filter(([keyPath, value]) => merged.get(keyPath) === value).map(([keyPath]) => keyPath)).toEqual([]);
    expect(i18n.t('no.such.key.anywhere', {lng: 'pt-BR'})).toBe('no.such.key.anywhere');
  });
});

describe('Portuguese plurals', () => {
  it('pt-PT (CLDR): "one" only for exactly 1 — "0 dias", "1 dia", "2 dias"', () => {
    const rules = new AwaPluralRulesForTests('pt-PT');
    expect([0, 1, 2, 5, 11, 21, 100].map(value => rules.select(value))).toEqual(['other', 'one', 'other', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5].map(value => rules.select(value))).toEqual(['other', 'other']);
    expect(rules.resolvedOptions().pluralCategories).toEqual(['one', 'other']);
  });

  it('pt-BR (CLDR "pt"): "one" for the integer part 0 or 1 — "0 dia", "1 dia", "2 dias"', () => {
    const rules = new AwaPluralRulesForTests('pt-BR');
    expect([0, 1, 2, 5, 21, 100].map(value => rules.select(value))).toEqual(['one', 'one', 'other', 'other', 'other', 'other']);
    expect([0.5, 1.5, 2.5].map(value => rules.select(value))).toEqual(['one', 'one', 'other']);
    expect(new AwaPluralRulesForTests('pt').select(0)).toBe('one'); // the bare language is the Brazilian/ICU rule
  });

  it.each(['pt-PT', 'pt-BR'] as const)("agrees with the engine's own Intl.PluralRules(%s) for integers and the common fractions", language => {
    const native = new Intl.PluralRules(language);
    const shim = new AwaPluralRulesForTests(language);
    for (const value of [...Array.from({length: 121}, (_, index) => index), 0.5, 1.5, 2.5, 10.5]) {
      expect([value, shim.select(value)]).toEqual([value, native.select(value)]);
    }
  });

  it('resolves through i18next with the right form per variant', () => {
    expect(tOf('export.pdf.daysCount', 'pt-PT', {count: 0})).toBe('0 dias');
    expect(tOf('export.pdf.daysCount', 'pt-PT', {count: 1})).toBe('1 dia');
    expect(tOf('export.pdf.daysCount', 'pt-PT', {count: 28})).toBe('28 dias');
    expect(tOf('export.pdf.daysCount', 'pt-BR', {count: 0})).toBe('0 dia');
    expect(tOf('export.pdf.daysCount', 'pt-BR', {count: 1})).toBe('1 dia');
    expect(tOf('export.pdf.daysCount', 'pt-BR', {count: 28})).toBe('28 dias');
  });

  it('every plural pair resolves to a different singular and plural text', () => {
    const bases = ptLeaves.map(([keyPath]) => keyPath).filter(keyPath => keyPath.endsWith('_other') && ptMap.get(keyPath)!.includes('{{count}}')).map(keyPath => keyPath.replace(/_other$/, ''));
    expect(bases.length).toBeGreaterThan(40);
    let same = 0;
    for (const base of bases.slice(0, 60)) {
      if (tOf(base, 'pt-PT', {count: 1}).replace('1', '#') === tOf(base, 'pt-PT', {count: 2}).replace('2', '#')) {same += 1;}
    }
    expect(same).toBeLessThan(4);
  });
});

describe('registration and normalisation', () => {
  it.each(['pt', 'pt-PT', 'pt_PT', 'PT', 'Pt-pt', 'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST', 'pt-TL', 'pt-MO', 'pt-Latn-PT', 'pt-PT.UTF-8', '  pt-PT  ', 'pt-PT-u-nu-latn'])('%s -> pt-PT (Portugal, the base text)', value => {
    expect(languageFromLocaleTag(value)).toBe('pt-PT');
  });

  it.each(['pt-BR', 'pt_BR', 'PT-br', 'Pt-Br', 'pt-Latn-BR', 'pt-BR.UTF-8', 'pt-BR-u-nu-latn', '  pt-BR  '])('%s -> pt-BR (Brazil, never silently Portugal)', value => {
    expect(languageFromLocaleTag(value)).toBe('pt-BR');
  });

  it.each([['pt', 'pt-PT'], ['pt-PT', 'pt-PT'], ['pt_pt', 'pt-PT'], ['PT-AO', 'pt-PT'], ['pt-BR', 'pt-BR'], ['pt_br', 'pt-BR'], ['PT-BR', 'pt-BR']])('a stored %s normalises to %s', (value, expected) => {
    expect(normalizeAppLanguage(value)).toBe(expected);
  });

  it('does not confuse other languages: Spanish, Galician, Italian, Catalan, Tagalog and the others stay what they are', () => {
    for (const tag of ['gl-ES', 'ca-ES', 'tl-PH', 'tpi', 'ptx']) {
      expect([tag, languageFromLocaleTag(tag)]).toEqual([tag, null]);
    }
    expect(languageFromLocaleTag('es-ES')).toBe('es');
    expect(languageFromLocaleTag('it-IT')).toBe('it');
    expect(languageFromLocaleTag('ko-KR')).toBe('ko');
    expect(languageFromLocaleTag('ja-JP')).toBe('ja');
  });

  it("picks the phone's first supported language: Portuguese variants included, English for an unsupported list", () => {
    expect(pickSupportedLanguage(['pt-BR', 'en-GB'])).toBe('pt-BR');
    expect(pickSupportedLanguage(['pt-PT', 'pt-BR'])).toBe('pt-PT');
    expect(pickSupportedLanguage(['th-TH', 'pt-BR', 'fr-FR'])).toBe('pt-BR');
    expect(pickSupportedLanguage(['vi-VN', 'th-TH'])).toBe('en');
    expect(pickSupportedLanguage(['en-GB', 'pt-BR'])).toBe('en'); // the phone's first supported language wins
  });

  it('editorial content: pt, pt-PT and the African variants → the Portugal block; pt-BR and pt-Latn-BR → the Brazilian one; English stays the fallback', () => {
    for (const value of ['pt', 'pt-PT', 'pt_PT', 'PT', 'pt-AO', 'pt-MZ', 'pt-Latn-PT']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'pt-PT']);
    }
    for (const value of ['pt-BR', 'pt_BR', 'PT-br', 'pt-Latn-BR', 'pt-BR-u-nu-latn']) {
      expect([value, resolveEditorialLanguage(value)]).toEqual([value, 'pt-BR']);
    }
    expect(resolveEditorialLanguage('th')).toBe('en');
    expect(resolveEditorialLanguage('ptx')).toBe('en');
    expect(resolveEditorialLanguage(undefined)).toBe('en');
    expect(ALL_LANGUAGES.map(language => resolveEditorialLanguage(language))).toEqual(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da']);
  });
});

describe('runtime switching and persistence', () => {
  it('switches between Portugal and Brazil at runtime without a restart, and across all the languages', async () => {
    await setAppLanguage('pt-PT');
    await i18n.changeLanguage('pt-PT');
    expect(getAppLanguage()).toBe('pt-PT');
    expect(i18n.t('common.save')).toBe('Guardar');
    await setAppLanguage('pt-BR');
    await i18n.changeLanguage('pt-BR');
    expect(getAppLanguage()).toBe('pt-BR');
    expect(i18n.t('common.save')).toBe('Salvar');
    const saves = new Set<string>();
    for (const language of ALL_LANGUAGES) {
      await i18n.changeLanguage(language);
      saves.add(i18n.t('common.save'));
    }
    expect(saves.size).toBeGreaterThanOrEqual(13); // (Spanish "Guardar" = pt-PT, Japanese "保存" = Chinese; every other word differs)
    expect(tOf('common.save', 'pt-PT')).not.toBe(tOf('common.save', 'pt-BR'));
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe((fr as AnyRecord & {common: {save: string}}).common.save);
  });

  it.each(['pt-PT', 'pt-BR'] as const)('persists the manual choice %s across a restart', async language => {
    await setAppLanguage(language);
    expect(await AsyncStorage.getItem('@awa/appearance/language-v1')).toBe(language);
    let fresh: typeof import('../../state/themePreferences') | undefined;
    jest.isolateModules(() => {
      fresh = require('../../state/themePreferences');
    });
    await fresh!.hydrateAppearancePreferences();
    expect(fresh!.getAppLanguage()).toBe(language);
  });

  it('all eight onboarding objectives have a Portuguese label in both variants', () => {
    for (const objective of ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss']) {
      for (const language of ['pt-PT', 'pt-BR'] as const) {
        const label = tOf(`objectives.${objective}`, language);
        expect(label).toBeTruthy();
        expect(label).not.toBe(tOf(`objectives.${objective}`, 'en'));
      }
    }
  });
});

describe('dates and calendar', () => {
  it('uses pt-PT / pt-BR Intl locales, "21 de outubro de 2026" in both, Western digits and Monday-first abbreviated weekdays', async () => {
    await setAppLanguage('pt-PT');
    expect(dateFormatLocale()).toBe('pt-PT');
    expect(WEEK_DAYS_PT).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_PT);
    expect(formatFullDate(new Date(2026, 9, 21))).toBe('21 de outubro de 2026');
    expect(formatShortDate(new Date(2026, 9, 21))).toBe('21 de outubro');
    await setAppLanguage('pt-BR');
    expect(dateFormatLocale()).toBe('pt-BR');
    expect(localizedWeekDays()).toEqual(WEEK_DAYS_PT);
    expect(formatFullDate(new Date(2026, 9, 21))).toBe('21 de outubro de 2026');
    expect(formatShortDate(new Date(2026, 9, 1))).toBe('1 de outubro');
  });

  it('month and weekday names of both locales are the Portuguese ones', () => {
    for (const locale of ['pt-PT', 'pt-BR']) {
      const months = Array.from({length: 12}, (_, month) => new Intl.DateTimeFormat(locale, {month: 'long'}).format(new Date(2026, month, 1)));
      expect(months).toEqual(['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']);
      const days = Array.from({length: 7}, (_, index) => new Intl.DateTimeFormat(locale, {weekday: 'long'}).format(new Date(2026, 9, 19 + index)));
      expect(days).toEqual(['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo']);
    }
  });

  it('numbers differ by region (pt-PT groups with a space, pt-BR with a dot; both use the decimal comma) — the app never hand-formats them', () => {
    expect((1234.5).toLocaleString('pt-BR')).toBe('1.234,5');
    expect((1234.5).toLocaleString('pt-PT')).toMatch(/^1[\s  ]?234,5$/);
    expect((37.5).toLocaleString('pt-PT')).toBe('37,5');
    expect((37.5).toLocaleString('pt-BR')).toBe('37,5');
  });

  it('Hijri dates keep the ICU Portuguese formatting (day, month name, year, "AH"), in both variants', async () => {
    for (const language of ['pt-PT', 'pt-BR'] as const) {
      await setAppLanguage(language);
      expect(formatHijriDate(new Date(2026, 2, 1))).toMatch(/^12 de Ramadan de 1447/);
      expect(formatHijriDay(new Date(2026, 2, 1))).toBe('12');
    }
  });
});

describe('editorial content', () => {
  const libraryDir = path.resolve(__dirname, '../../screens/library');

  const propsOf = (node: ts.ObjectLiteralExpression) =>
    Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replace(/['"]/g, ''), p.initializer]));
  const evalLiteral = (node: ts.Node): unknown => {
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {return evalLiteral(node.expression);}
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {return node.text;}
    if (ts.isNumericLiteral(node)) {return Number(node.text);}
    if (ts.isArrayLiteralExpression(node)) {return node.elements.map(evalLiteral);}
    if (ts.isObjectLiteralExpression(node)) {
      return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replace(/['"]/g, ''), evalLiteral(p.initializer)]));
    }
    return node.getText();
  };
  const shapeOf = (value: unknown): unknown => (typeof value === 'string' ? 's' : Array.isArray(value) ? value.map(shapeOf) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shapeOf(v)])) : value);

  const articleFiles = fs.readdirSync(libraryDir).filter(file => /ArticleScreen\.tsx$/.test(file));
  /** For each article screen: the evaluated `en` (or fr for the hand-written one) and `pt-PT` blocks. */
  const articles = articleFiles.map(file => {
    const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2019, true, ts.ScriptKind.TSX);
    let block: {reference?: unknown; portugal?: unknown; hasWrapper: boolean} | undefined;
    const visit = (node: ts.Node): void => {
      if (ts.isObjectLiteralExpression(node)) {
        const props = propsOf(node);
        if (props.zh && props.fr && (props.en || file.startsWith('UnderstandCycle')) && ts.isObjectLiteralExpression(props.zh)) {
          block = {
            reference: evalLiteral(props.en ?? props.fr),
            portugal: props['pt-PT'] ? evalLiteral(props['pt-PT']) : undefined,
            hasWrapper: text.includes(`withBrazilianPortuguese('${file.replace('ArticleScreen.tsx', '')}'`),
          };
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    return {name: file.replace('ArticleScreen.tsx', ''), block};
  });

  it('every article screen (73) has a complete Portuguese (Portugal) block with exactly the English structure, wrapped for Brazil', () => {
    expect(articles.length).toBe(73);
    const problems: string[] = [];
    for (const {name, block} of articles) {
      if (!block) {problems.push(`${name}: content object not found`); continue;}
      if (!block.portugal) {problems.push(`${name}: no 'pt-PT' block`); continue;}
      if (JSON.stringify(shapeOf(block.portugal)) !== JSON.stringify(shapeOf(block.reference))) {problems.push(`${name}: 'pt-PT' structure differs from the reference`);}
      if (!block.hasWrapper) {problems.push(`${name}: not wrapped with withBrazilianPortuguese`);}
    }
    expect(problems).toEqual([]);
  });

  it('every article Portuguese block is Portuguese prose: accents present, polite form, no foreign script, no Brazilian-only word', () => {
    for (const {name, block} of articles) {
      const strings: string[] = [];
      const walk = (value: unknown): void => {if (typeof value === 'string') {strings.push(value);} else if (Array.isArray(value)) {value.forEach(walk);} else if (value && typeof value === 'object') {Object.values(value).forEach(walk);}};
      walk(block!.portugal);
      const all = strings.join('\n');
      expect([name, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Devanagari}]/u.test(all)]).toEqual([name, false]);
      expect([name, BRAZIL_ONLY.test(all)]).toEqual([name, false]);
      expect([name, TU_FORMS.test(all)]).toEqual([name, false]);
      expect([name, /(?<![\p{L}])(o|O|do|no|ao|pelo|um) AWA(?![\p{L}])/u.test(all)]).toEqual([name, false]);
      expect([name, /[ãõçáéíóúêô]/i.test(all)]).toEqual([name, true]);
    }
  });

  it('the Brazilian overlay of the articles: every path exists in the Portugal block as a string and differs from it; no Portugal-only form is left in it', () => {
    const names = new Set(articles.map(a => a.name));
    expect(Object.keys(PT_BR_ARTICLE_OVERLAY).filter(name => !names.has(name))).toEqual([]);
    expect(Object.values(PT_BR_ARTICLE_OVERLAY).reduce((sum, overlay) => sum + Object.keys(overlay).length, 0)).toBeGreaterThan(1000);
    const problems: string[] = [];
    for (const {name, block} of articles) {
      const overlay = PT_BR_ARTICLE_OVERLAY[name] ?? {};
      const adapted = applyPortugueseOverlay(block!.portugal, overlay);
      const baseFlat = new Map<string, string>();
      const flatten = (value: unknown, p: string): void => {
        if (typeof value === 'string') {baseFlat.set(p, value);} else if (Array.isArray(value)) {value.forEach((v, i) => flatten(v, `${p}[${i}]`));} else if (value && typeof value === 'object') {for (const [k, v] of Object.entries(value)) {flatten(v, p ? `${p}.${k}` : k);}}
      };
      flatten(block!.portugal, '');
      for (const [p, value] of Object.entries(overlay)) {
        const base = baseFlat.get(p);
        if (base === undefined) {problems.push(`${name}: overlay path ${p} does not exist`); continue;}
        if (value === base) {problems.push(`${name}.${p}: overlay equals the Portugal text`);}
        if (EUROPEAN_ONLY.test(value)) {problems.push(`${name}.${p}: Portugal-only form "${(value.match(EUROPEAN_ONLY) ?? [])[0]}"`);}
        if (placeholders(value) !== placeholders(base)) {problems.push(`${name}.${p}: placeholders differ`);}
      }
      if (JSON.stringify(shapeOf(adapted)) !== JSON.stringify(shapeOf(block!.portugal))) {problems.push(`${name}: the adapted block changes the structure`);}
    }
    expect(problems).toEqual([]);
  });

  it('withBrazilianPortuguese gives the content a pt-BR block: the Portugal block with the overlay applied, without touching the Portugal block or the other languages', () => {
    const content = {'pt-PT': {title: 'Registo do ecrã', list: ['guardar', 'ficheiro']}, en: {title: 'x'}} as const;
    const wrapped = withBrazilianPortuguese('NoSuchArticle', content);
    expect(wrapped['pt-BR']).toEqual(content['pt-PT']); // no overlay for an unknown article: identical text
    expect(wrapped['pt-BR']).not.toBe(content['pt-PT']); // but a copy
    expect(wrapped['pt-PT']).toBe(content['pt-PT']);
    expect(wrapped.en).toBe(content.en);
    expect(applyPortugueseOverlay(content['pt-PT'], {title: 'Registro da tela', 'list[1]': 'arquivo', 'missing.path': 'x', 'list[9]': 'y'})).toEqual({title: 'Registro da tela', list: ['guardar', 'arquivo']});
    expect(content['pt-PT'].title).toBe('Registo do ecrã'); // never mutated
  });

  it('all 41 pregnancy weeks have Portuguese content (Portugal and Brazil) with the English field structure', () => {
    for (let week = 1; week <= 41; week += 1) {
      const english = getPregnancyWeekData(week, 'en');
      for (const language of ['pt-PT', 'pt-BR'] as const) {
        const portuguese = getPregnancyWeekData(week, language);
        expect(portuguese).toBeDefined();
        expect(Object.keys(portuguese!).sort()).toEqual(Object.keys(english!).sort());
        expect(JSON.stringify(portuguese)).not.toBe(JSON.stringify(english));
        expect(/[ãõçáéíóúêô]/i.test(JSON.stringify(portuguese))).toBe(true);
        for (const [key, value] of Object.entries(english!)) {
          const other = (portuguese as unknown as AnyRecord)[key];
          if (Array.isArray(value)) {expect((other as unknown[]).length).toBe(value.length);}
        }
      }
    }
    expect(getPregnancyWeekData(0, 'pt-PT')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'pt-BR')).toBeUndefined();
    expect(Object.keys(PT_BR_WEEK_OVERLAY).length).toBeGreaterThan(30);
  });

  it('pregnancy-week figures survive the translation in both variants: every number of the English text is in the Portuguese text', () => {
    const missing: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const english = JSON.stringify(getPregnancyWeekData(week, 'en'));
      for (const language of ['pt-PT', 'pt-BR'] as const) {
        const portuguese = JSON.stringify(getPregnancyWeekData(week, language));
        for (const number of english.match(/\d+/g) ?? []) {
          if (!portuguese.includes(number)) {missing.push(`${language} week ${week}: ${number}`);}
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('the Brazilian weeks differ from Portugal only through the overlay, and Portugal stays untouched when Brazil is read', () => {
    const before = JSON.stringify(getPregnancyWeekData(20, 'pt-PT'));
    const brazil = JSON.stringify(getPregnancyWeekData(20, 'pt-BR'));
    expect(JSON.stringify(getPregnancyWeekData(20, 'pt-PT'))).toBe(before);
    expect(brazil).not.toBe(before);
    expect(Object.keys(PT_BR_WEEK_OVERLAY[20] ?? {}).length).toBeGreaterThan(0);
  });
});

describe('images and legal text', () => {
  it('has no Portuguese artwork: the resolver returns the English one, the alt text says the lettering is English, and the gap is listed', () => {
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'pt-PT')).toBe(false);
    expect(hasLocalizedEditorialImage(CYCLE_PHASES_HERO, 'pt-BR')).toBe(false);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'pt-PT')).toBe(CYCLE_PHASES_HERO.en);
    expect(resolveEditorialImage(CYCLE_PHASES_HERO, 'pt-BR')).toBe(CYCLE_PHASES_HERO.en);
    expect([...EDITORIAL_IMAGES_MISSING_PORTUGUESE].sort()).toEqual(['activité', 'activité_grossesse', 'cycle-phases-hero', 'grossesse_semiane']);
    for (const alt of Object.values(EDITORIAL_IMAGE_ALT)) {
      expect(alt['pt-PT']).toContain('inglês');
      expect(alt['pt-BR']).toContain('inglês');
      expect(alt['pt-BR']).not.toBe(alt['pt-PT']);
    }
  });

  it('legal placeholder sections exist for Portugal and Brazil with the English structure, in the right variant', () => {
    for (const document of [TERMS, PRIVACY]) {
      for (const language of ['pt-PT', 'pt-BR'] as const) {
        expect(document[language]).toHaveLength(document.en.length);
        document[language].forEach((section, index) => {
          expect(section.title).not.toBe(document.en[index].title);
          expect(section.body).not.toBe(document.en[index].body);
          expect(section.body).toMatch(/[ãõçáéíóúêô]|(?<![\p{L}])(de|do|da|os)(?![\p{L}])/u);
          expect(section.body).toMatch(/\.$/);
        });
      }
    }
    expect(TERMS['pt-PT'][0].body).toContain('Termos de Utilização');
    expect(TERMS['pt-BR'][0].body).toContain('Termos de Uso');
    expect(TERMS['pt-BR'].map(s => s.body).join(' ')).toContain('usuários');
  });
});
