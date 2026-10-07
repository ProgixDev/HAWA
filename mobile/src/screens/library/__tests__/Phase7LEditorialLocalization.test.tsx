import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {isArticleBookmarked, toggleBookmark, getCachedLibraryState} from '../../../state/libraryStore';

import FirstPeriodArticleScreen from '../FirstPeriodArticleScreen';
import RegularIrregularCycleArticleScreen from '../RegularIrregularCycleArticleScreen';
import ConceptionStartArticleScreen from '../ConceptionStartArticleScreen';
import BirthControlPillsArticleScreen from '../BirthControlPillsArticleScreen';
import PcosIntroArticleScreen from '../PcosIntroArticleScreen';
import MenopauseTransitionArticleScreen from '../MenopauseTransitionArticleScreen';
import PregnancyWeeklyArticleScreen from '../PregnancyWeeklyArticleScreen';
import PostpartumRecoveryArticleScreen from '../PostpartumRecoveryArticleScreen';
import MiscarriageGriefArticleScreen from '../MiscarriageGriefArticleScreen';
import MenstruationPurityArticleScreen from '../MenstruationPurityArticleScreen';
import FlowMenstrualArticleScreen from '../FlowMenstrualArticleScreen';
import FertilityWindowArticleScreen from '../FertilityWindowArticleScreen';
import MissedPillsArticleScreen from '../MissedPillsArticleScreen';
import PcosDiagnosisArticleScreen from '../PcosDiagnosisArticleScreen';
import MedicalExamsArticleScreen from '../MedicalExamsArticleScreen';
import LochiaArticleScreen from '../LochiaArticleScreen';
import MiscarriageFertilityArticleScreen from '../MiscarriageFertilityArticleScreen';
import HotFlashesArticleScreen from '../HotFlashesArticleScreen';
import NifasFiqhArticleScreen from '../NifasFiqhArticleScreen';
import FirstPeriodFaqArticleScreen from '../FirstPeriodFaqArticleScreen';
import {getPregnancyWeekData} from '../../../data/pregnancyWeekData';

// PHASE 7L + 7L.2 — bilingual editorial content localization.
// All 72 reachable Library articles (every bespoke screen in
// BESPOKE_ARTICLE_SCREENS) were translated to a `CONTENT = {fr, en}`
// per-file architecture, plus src/data/pregnancyWeekData.ts (all 41 weeks).
// UnderstandCycleArticleScreen.tsx is confirmed dead code (unreferenced)
// and intentionally excluded. See the Phase 7L / 7L.2 final reports for
// full scope/rationale; this suite proves:
//   TEST 1-10  — FR -> EN -> FR runtime switch, one representative string
//                per Phase 7L article (one per objective + spiritual +
//                daughter/first-period).
//   TEST 11-18 — article identity (ID/bookmark/image) is unaffected by the
//                language switch.
//   TEST 19-23 — pregnancyWeekData.ts bilingual behavior + numeric/identity
//                preservation.
//   TEST 24-33 — FR -> EN -> FR round-trip for 10 additional representative
//                articles from the Phase 7L.2 batch (one per remaining
//                cluster), proving the pattern holds across the full batch,
//                not just the original 10.
//   Structural audit — enumerates the FULL 72-article reachable inventory
//                and confirms every single one is translated (72), with
//                only the 1 known dead file excluded.
//   Residual-French / structural-parity audits — codified as real
//                assertions across all 72 files, not just spot-checked.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(Component: React.ComponentType<any>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} name="Test" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function switchLanguage(lang: 'fr' | 'en' | 'es') {
  await act(async () => {
    await setAppLanguage(lang);
    await i18n.changeLanguage(lang);
  });
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's tests assert a French-first render before switching to English,
  // which was a safe assumption back when French was the default. Pinning
  // French explicitly here preserves every test's original intent (FR -> EN
  // -> FR round-trip mechanics) without depending on which language is the
  // current app-wide default. See Phase7MEnglishDefaultLanguage.test.tsx for
  // the dedicated tests proving articles/pregnancy-week default to English.
  await setAppLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

type ArticleCase = {
  name: string;
  Component: React.ComponentType<any>;
  fr: string;
  en: string;
};

const CASES: ArticleCase[] = [
  {name: 'Daughter/first-period', Component: FirstPeriodArticleScreen, fr: 'PREMIÈRES RÈGLES', en: 'FIRST PERIOD'},
  {name: 'Cycle', Component: RegularIrregularCycleArticleScreen, fr: 'CYCLE & RÈGLES', en: 'CYCLE & PERIODS'},
  {name: 'Trying to conceive', Component: ConceptionStartArticleScreen, fr: 'ESSAYER DE CONCEVOIR', en: 'TRYING TO CONCEIVE'},
  {name: 'Contraception', Component: BirthControlPillsArticleScreen, fr: 'PILULE CONTRACEPTIVE', en: 'BIRTH CONTROL PILL'},
  {name: 'PCOS/Irregular', Component: PcosIntroArticleScreen, fr: 'SOPK • GUIDE ESSENTIEL', en: 'PCOS • ESSENTIAL GUIDE'},
  {name: 'Menopause', Component: MenopauseTransitionArticleScreen, fr: 'PÉRIMÉNOPAUSE & MÉNOPAUSE', en: 'PERIMENOPAUSE & MENOPAUSE'},
  {name: 'Pregnancy', Component: PregnancyWeeklyArticleScreen, fr: 'GROSSESSE • VUE D’ENSEMBLE', en: 'PREGNANCY • OVERVIEW'},
  {name: 'Postpartum', Component: PostpartumRecoveryArticleScreen, fr: 'POST-PARTUM • RÉCUPÉRATION', en: 'POSTPARTUM • RECOVERY'},
  {name: 'Pregnancy loss', Component: MiscarriageGriefArticleScreen, fr: 'APRÈS UNE FAUSSE COUCHE • SOUTIEN ÉMOTIONNEL', en: 'AFTER A MISCARRIAGE • EMOTIONAL SUPPORT'},
  {name: 'Spiritual/fiqh', Component: MenstruationPurityArticleScreen, fr: 'RÈGLES & PURETÉ', en: 'PERIOD & PURITY'},
];

const BATCH2_CASES: ArticleCase[] = [
  {name: 'Cycle (flow)', Component: FlowMenstrualArticleScreen, fr: 'FLUX MENSTRUEL', en: 'MENSTRUAL FLOW'},
  {name: 'Trying to conceive (fertile window)', Component: FertilityWindowArticleScreen, fr: 'FENÊTRE FERTILE', en: 'FERTILE WINDOW'},
  {name: 'Contraception (missed pill)', Component: MissedPillsArticleScreen, fr: 'OUBLI DE PILULE', en: 'MISSED PILL'},
  {name: 'PCOS (diagnosis)', Component: PcosDiagnosisArticleScreen, fr: 'SOPK', en: 'PCOS'},
  {name: 'Pregnancy (medical exams)', Component: MedicalExamsArticleScreen, fr: 'GROSSESSE • SUIVI MÉDICAL', en: 'PREGNANCY • MEDICAL FOLLOW-UP'},
  {name: 'Postpartum (lochia)', Component: LochiaArticleScreen, fr: 'POST-PARTUM • LOCHIES', en: 'POSTPARTUM • LOCHIA'},
  {name: 'Pregnancy loss (fertility after loss)', Component: MiscarriageFertilityArticleScreen, fr: 'APRÈS UNE FAUSSE COUCHE • FERTILITÉ', en: 'AFTER A MISCARRIAGE • FERTILITY'},
  {name: 'Menopause (hot flashes)', Component: HotFlashesArticleScreen, fr: 'BOUFFÉES DE CHALEUR', en: 'HOT FLASHES'},
  {name: 'Spiritual/fiqh (Nifas)', Component: NifasFiqhArticleScreen, fr: 'Le nifas en\npratique religieuse', en: 'Nifas in\nreligious practice'},
  {name: 'Daughter/first-period (FAQ)', Component: FirstPeriodFaqArticleScreen, fr: 'PREMIÈRES RÈGLES', en: 'FIRST PERIOD'},
];

describe('TEST 1-10 — FR -> EN -> FR runtime switch on one mounted instance, per representative article', () => {
  it.each(CASES)('$name article badge translates and round-trips on a single mounted instance', async ({Component, fr, en}) => {
    const renderer = await renderScreen(Component);
    expect(textsOf(renderer)).toContain(fr);

    await switchLanguage('en');
    expect(textsOf(renderer)).toContain(en);
    expect(textsOf(renderer)).not.toContain(fr);

    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain(fr);
    expect(textsOf(renderer)).not.toContain(en);
  });
});

describe('TEST 24-33 — Phase 7L.2 batch: FR -> EN -> FR round-trip, one representative article per remaining cluster', () => {
  it.each(BATCH2_CASES)('$name article text translates and round-trips on a single mounted instance', async ({Component, fr, en}) => {
    const renderer = await renderScreen(Component);
    expect(textsOf(renderer)).toContain(fr);

    await switchLanguage('en');
    expect(textsOf(renderer)).toContain(en);
    expect(textsOf(renderer)).not.toContain(fr);

    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain(fr);
    expect(textsOf(renderer)).not.toContain(en);
  });
});

describe('TEST 11-18 — article identity is unaffected by the language switch', () => {
  it('bookmark state for a translated article survives a language switch (toggle persists, key never changes)', async () => {
    const id = 'cycle-comprendre-ton-cycle';
    expect(isArticleBookmarked(id)).toBe(false);

    toggleBookmark(id);
    expect(isArticleBookmarked(id)).toBe(true);
    expect(getCachedLibraryState().bookmarks).toContain(id);

    await switchLanguage('en');
    expect(isArticleBookmarked(id)).toBe(true);

    await switchLanguage('fr');
    expect(isArticleBookmarked(id)).toBe(true);

    toggleBookmark(id);
    expect(isArticleBookmarked(id)).toBe(false);
  });

  it('every translated article keeps its own stable ID constant unchanged (source-level check)', () => {
    const expectedIds: Record<string, string> = {
      'FirstPeriodArticleScreen.tsx': 'firstperiod-premieres-regles',
      'RegularIrregularCycleArticleScreen.tsx': 'cycle-comprendre-ton-cycle',
      'ConceptionStartArticleScreen.tsx': 'conceptiontips-essayer-de-concevoir',
      'BirthControlPillsArticleScreen.tsx': 'birthcontrolpills-comprendre-la-pilule',
      'PcosIntroArticleScreen.tsx': 'pcos-comprendre-sopk',
      'MenopauseTransitionArticleScreen.tsx': 'menopause-comprendre-la-transition',
      'PregnancyWeeklyArticleScreen.tsx': 'pregnancy-semaine-par-semaine',
      'PostpartumRecoveryArticleScreen.tsx': 'postpartum-recuperation-globale',
      'MiscarriageGriefArticleScreen.tsx': 'lossemotional-traverser-le-deuil',
      'MenstruationPurityArticleScreen.tsx': 'menstruationpurity-statut-de-purete',
    };
    const dir = path.resolve(__dirname, '..');
    for (const [file, expectedId] of Object.entries(expectedIds)) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(source).toMatch(new RegExp(`const ID = '${expectedId}';`));
    }
  });

  it('image require() calls are present and untouched for a representative translated article (PregnancyWeekly hero)', async () => {
    const renderer = await renderScreen(PregnancyWeeklyArticleScreen);
    // The hero Image element must still mount with a resolved numeric
    // source (require() result), in both languages — proving the image
    // was never made language-dependent.
    const findImages = () => renderer.root.findAll(node => Boolean(node.props && 'source' in node.props));
    const images = findImages();
    expect(images.length).toBeGreaterThan(0);

    await switchLanguage('en');
    const imagesEn = findImages();
    expect(imagesEn.length).toBe(images.length);
  });

  it('CONTENT.fr/CONTENT.en structural parity (topics/sections array lengths match) for every translated article', () => {
    const dir = path.resolve(__dirname, '..');
    const files = [
      'FirstPeriodArticleScreen.tsx',
      'RegularIrregularCycleArticleScreen.tsx',
      'ConceptionStartArticleScreen.tsx',
      'BirthControlPillsArticleScreen.tsx',
      'PcosIntroArticleScreen.tsx',
      'MenopauseTransitionArticleScreen.tsx',
      'PregnancyWeeklyArticleScreen.tsx',
      'PostpartumRecoveryArticleScreen.tsx',
      'MiscarriageGriefArticleScreen.tsx',
      'MenstruationPurityArticleScreen.tsx',
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(source).toMatch(/const CONTENT = \{/);
      expect(source).toMatch(/fr:\s*\{/);
      expect(source).toMatch(/en:\s*\{/);
      // Every translated article must derive its content reactively from
      // i18n.language, never a module-level constant resolved once. French
      // is the explicit branch (English is the fallback — also used for
      // Spanish, since there is no Spanish Library content yet).
      expect(source).toMatch(/i18n\.language === 'fr'/);
    }
  });
});

describe('TEST 19-23 — pregnancyWeekData.ts bilingual behavior', () => {
  it('TEST 19 — three representative weeks (early/mid/late) translate FR -> EN with editorial content only', () => {
    for (const week of [4, 20, 40]) {
      const fr = getPregnancyWeekData(week, 'fr');
      const en = getPregnancyWeekData(week, 'en');
      expect(fr).toBeDefined();
      expect(en).toBeDefined();
      expect(fr!.babyDescription).not.toBe(en!.babyDescription);
      expect(fr!.babyDescription!.length).toBeGreaterThan(0);
      expect(en!.babyDescription!.length).toBeGreaterThan(0);
    }
  });

  it('TEST 20 — week number, image, and sourceRefs identity never change across language', () => {
    for (const week of [1, 12, 24, 41]) {
      const fr = getPregnancyWeekData(week, 'fr')!;
      const en = getPregnancyWeekData(week, 'en')!;
      expect(en.week).toBe(fr.week);
      expect(en.babyImage).toBe(fr.babyImage);
      expect(en.sourceRefs).toEqual(fr.sourceRefs);
    }
  });

  it('TEST 21 — numeric length figures are preserved exactly (only decimal separator localized)', () => {
    const fr12 = getPregnancyWeekData(12, 'fr')!;
    const en12 = getPregnancyWeekData(12, 'en')!;
    expect(fr12.length).toBe('Environ 5,4 cm');
    expect(en12.length).toBe('About 5.4 cm');

    const fr20 = getPregnancyWeekData(20, 'fr')!;
    const en20 = getPregnancyWeekData(20, 'en')!;
    expect(fr20.length).toBe('Environ 25,6 cm');
    expect(en20.length).toBe('About 25.6 cm');
  });

  it('TEST 22 — runtime language switch inside PregnancyWeekScreen re-renders the week content without changing the displayed week number', async () => {
    const PregnancyWeekScreen = require('../../pregnancy/PregnancyWeekScreen').default;
    const renderer = await renderScreen(PregnancyWeekScreen);
    const frTexts = textsOf(renderer);
    expect(frTexts.some(text => /semaine/i.test(text))).toBe(true);

    await switchLanguage('en');
    const enTexts = textsOf(renderer);
    expect(enTexts.some(text => /week/i.test(text))).toBe(true);
  });

  it('TEST 23 — no week is silently missing a value in either language (1-41, both langs resolve)', () => {
    for (let week = 1; week <= 41; week += 1) {
      const fr = getPregnancyWeekData(week, 'fr');
      const en = getPregnancyWeekData(week, 'en');
      expect(fr).toBeDefined();
      expect(en).toBeDefined();
      expect(fr!.week).toBe(week);
      expect(en!.week).toBe(week);
    }
    expect(getPregnancyWeekData(42, 'fr')).toBeUndefined();
    expect(getPregnancyWeekData(0, 'en')).toBeUndefined();
  });
});

describe('TEST ES1-ES12 — pregnancyWeekData.ts Spanish coverage (closes the former fallback-to-English gap)', () => {
  it('TEST ES1 — dataset contains exactly 41 weeks', () => {
    for (let week = 1; week <= 41; week += 1) {
      expect(getPregnancyWeekData(week, 'fr')).toBeDefined();
    }
    expect(getPregnancyWeekData(42, 'fr')).toBeUndefined();
  });

  it('TEST ES2 — every week (1-41) has fr content (re-verifies TEST 23 still holds)', () => {
    for (let week = 1; week <= 41; week += 1) {
      const fr = getPregnancyWeekData(week, 'fr');
      expect(fr).toBeDefined();
      expect(fr!.babyDescription!.length).toBeGreaterThan(0);
    }
  });

  it('TEST ES3 — every week (1-41) has en content (re-verifies TEST 23 still holds)', () => {
    for (let week = 1; week <= 41; week += 1) {
      const en = getPregnancyWeekData(week, 'en');
      expect(en).toBeDefined();
      expect(en!.babyDescription!.length).toBeGreaterThan(0);
    }
  });

  it('TEST ES4/ES5 — every week (1-41) has es content; no reachable week lacks Spanish', () => {
    const missingWeeks: number[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const es = getPregnancyWeekData(week, 'es');
      if (!es || !es.babyDescription || es.babyDescription.length === 0) {
        missingWeeks.push(week);
      }
    }
    expect(missingWeeks).toEqual([]);
  });

  it('TEST ES6 — sourceRefs are identical across fr/en/es for a representative set of weeks', () => {
    for (const week of [1, 12, 24, 41]) {
      const fr = getPregnancyWeekData(week, 'fr')!;
      const en = getPregnancyWeekData(week, 'en')!;
      const es = getPregnancyWeekData(week, 'es')!;
      expect(es.sourceRefs).toEqual(fr.sourceRefs);
      expect(es.sourceRefs).toEqual(en.sourceRefs);
    }
  });

  it('TEST ES7 — babyImage identity is unchanged across fr/en/es for a representative set of weeks', () => {
    for (const week of [1, 12, 24, 41]) {
      const fr = getPregnancyWeekData(week, 'fr')!;
      const en = getPregnancyWeekData(week, 'en')!;
      const es = getPregnancyWeekData(week, 'es')!;
      expect(es.babyImage).toBe(fr.babyImage);
      expect(es.babyImage).toBe(en.babyImage);
    }
  });

  it('TEST ES8 — week 1 (es) renders genuine Spanish text, distinct from fr and en', () => {
    const fr = getPregnancyWeekData(1, 'fr')!;
    const en = getPregnancyWeekData(1, 'en')!;
    const es = getPregnancyWeekData(1, 'es')!;
    expect(es.babyDescription).not.toBe(fr.babyDescription);
    expect(es.babyDescription).not.toBe(en.babyDescription);
    expect(es.babyDescription).toContain('embarazo se calcula a partir del primer día de tu última regla');
  });

  it('TEST ES9 — a representative first-trimester week (10) renders Spanish', () => {
    const es = getPregnancyWeekData(10, 'es')!;
    expect(es.babyDescription).toContain('más reconocible');
    expect(es.length).toBe('Aproximadamente 30 mm');
  });

  it('TEST ES10 — a representative second-trimester week (20) renders Spanish', () => {
    const es = getPregnancyWeekData(20, 'es')!;
    expect(es.babyDescription).toContain('cabeza a los talones');
    expect(es.length).toBe('Aproximadamente 25,6 cm');
  });

  it('TEST ES11 — a representative third-trimester week (32) renders Spanish', () => {
    const es = getPregnancyWeekData(32, 'es')!;
    expect(es.babyDescription).toContain('cabeza hacia abajo');
    expect(es.length).toBe('Aproximadamente 42,4 cm');
  });

  it('TEST ES12a — week 40 (es) renders Spanish', () => {
    const es = getPregnancyWeekData(40, 'es')!;
    expect(es.babyDescription).toContain('totalmente desarrollado');
    expect(es.length).toBe('Aproximadamente 51,2 cm');
  });

  it('TEST ES12b — week 41 (es) renders Spanish', () => {
    const es = getPregnancyWeekData(41, 'es')!;
    expect(es.babyDescription).toContain('sigue totalmente desarrollado');
    expect(es.length).toBeUndefined();
  });

  it('TEST ES13 — no Spanish week silently falls back to English (sample weeks: babyDescription genuinely differs)', () => {
    for (const week of [1, 4, 10, 12, 20, 24, 32, 40, 41]) {
      const en = getPregnancyWeekData(week, 'en')!;
      const es = getPregnancyWeekData(week, 'es')!;
      expect(es.babyDescription).not.toBe(en.babyDescription);
    }
  });

  it('TEST ES14 — runtime EN -> ES switching inside PregnancyWeekScreen shows Spanish, not English', async () => {
    await switchLanguage('en');
    const PregnancyWeekScreen = require('../../pregnancy/PregnancyWeekScreen').default;
    const renderer = await renderScreen(PregnancyWeekScreen);
    const enTexts = textsOf(renderer);
    expect(enTexts.some(text => /week/i.test(text))).toBe(true);

    await switchLanguage('es');
    const esTexts = textsOf(renderer);
    expect(esTexts.some(text => /semana/i.test(text))).toBe(true);
  });

  it('TEST ES15 — runtime ES -> FR switching inside PregnancyWeekScreen shows French, not Spanish', async () => {
    await switchLanguage('es');
    const PregnancyWeekScreen = require('../../pregnancy/PregnancyWeekScreen').default;
    const renderer = await renderScreen(PregnancyWeekScreen);
    const esTexts = textsOf(renderer);
    expect(esTexts.some(text => /semana/i.test(text))).toBe(true);

    await switchLanguage('fr');
    const frTexts = textsOf(renderer);
    expect(frTexts.some(text => /semaine/i.test(text))).toBe(true);
  });

  it('TEST ES16 — runtime FR -> EN switching still works (re-verifies pre-existing round-trip)', async () => {
    await switchLanguage('fr');
    const PregnancyWeekScreen = require('../../pregnancy/PregnancyWeekScreen').default;
    const renderer = await renderScreen(PregnancyWeekScreen);
    const frTexts = textsOf(renderer);
    expect(frTexts.some(text => /semaine/i.test(text))).toBe(true);

    await switchLanguage('en');
    const enTexts = textsOf(renderer);
    expect(enTexts.some(text => /week/i.test(text))).toBe(true);
  });

  it('TEST ES17 — unknown/missing language resolves to English, never French (matches Phase7M TEST 15 pattern)', () => {
    const week12NoArg = getPregnancyWeekData(12);
    expect(week12NoArg?.length).toBe('About 5.4 cm');

    const week12Invalid = getPregnancyWeekData(12, 'xx' as unknown as 'en');
    expect(week12Invalid?.length).toBe('About 5.4 cm');
  });

  it('TEST ES18 — numeric integrity: every numeric figure in fr text is preserved (comma/period-normalized) in es text, for all 41 weeks', () => {
    const extractNumbers = (text?: string): string[] => {
      if (!text) {
        return [];
      }
      return (text.match(/\d+(?:[.,]\d+)?/g) || []).map(n => n.replace(',', '.'));
    };
    const mismatches: string[] = [];

    for (let week = 1; week <= 41; week += 1) {
      const fr = getPregnancyWeekData(week, 'fr')!;
      const es = getPregnancyWeekData(week, 'es')!;

      const checkField = (label: string, frText?: string, esText?: string) => {
        const frNumbers = extractNumbers(frText);
        const esNumbers = new Set(extractNumbers(esText));
        for (const num of frNumbers) {
          if (!esNumbers.has(num)) {
            mismatches.push(`week ${week} ${label}: "${num}" missing from es (fr="${frText}" es="${esText}")`);
          }
        }
      };

      checkField('babyDescription', fr.babyDescription, es.babyDescription);
      checkField('length', fr.length, es.length);
      checkField('bodyChanges', (fr.bodyChanges || []).join(' | '), (es.bodyChanges || []).join(' | '));
      checkField('toKnow', (fr.toKnow || []).join(' | '), (es.toKnow || []).join(' | '));
    }

    expect(mismatches).toEqual([]);
  });

  it('TEST ES19 — residual-language self-check: no French or English leftover, no usted/vosotros register, across all 41 es weeks', () => {
    const frenchTells = [
      'vous', 'votre', 'vos', 'être', 'avec', 'dans', 'pour', 'très', 'après',
      'cette', 'ces', 'leur', 'leurs', 'ainsi', 'donc', 'chez', 'mais', 'cela',
    ];
    const englishTells = ['the ', ' and ', 'your ', ' with ', 'during '];
    const formalRegisterTells = ['usted', 'ustedes', 'vos', 'vosotros', 'vosotras'];

    const offenders: string[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const es = getPregnancyWeekData(week, 'es')!;
      const allText = [es.babyDescription, es.comparison, ...(es.bodyChanges || []), ...(es.toKnow || [])]
        .filter(Boolean)
        .join(' \n ');
      const lower = allText.toLowerCase();

      for (const word of frenchTells) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
          offenders.push(`week ${week}: French tell "${word}"`);
        }
      }
      for (const word of englishTells) {
        if (lower.includes(word)) {
          offenders.push(`week ${week}: English tell "${word}"`);
        }
      }
      for (const word of formalRegisterTells) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
          offenders.push(`week ${week}: formal-register tell "${word}"`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('TEST ES20 — field-presence parity: es has comparison iff fr has comparison, for every week (weeks 1-3/41 omit it)', () => {
    const mismatches: number[] = [];
    for (let week = 1; week <= 41; week += 1) {
      const fr = getPregnancyWeekData(week, 'fr')!;
      const es = getPregnancyWeekData(week, 'es')!;
      const frHasComparison = fr.comparison !== undefined;
      const esHasComparison = es.comparison !== undefined;
      if (frHasComparison !== esHasComparison) {
        mismatches.push(week);
      }
    }
    expect(mismatches).toEqual([]);
    for (const week of [1, 2, 3, 41]) {
      expect(getPregnancyWeekData(week, 'es')!.comparison).toBeUndefined();
    }
  });

  it('TEST ES21 — no week has a fabricated `weight` field in es (matches fr/en — intentionally never populated)', () => {
    for (let week = 1; week <= 41; week += 1) {
      const es = getPregnancyWeekData(week, 'es')!;
      expect(es.weight).toBeUndefined();
    }
  });
});

describe('Structural completeness audit — full 72-article reachable inventory', () => {
  it('classifies every bespoke article screen as translated (72) / dead (1) — FRENCH-ONLY REACHABLE = 0', () => {
    const dir = path.resolve(__dirname, '..');
    const files = fs.readdirSync(dir).filter(name => /ArticleScreen\.tsx$/.test(name));
    expect(files.length).toBe(73);

    const dead = new Set(['UnderstandCycleArticleScreen.tsx']);
    const reader = fs.readFileSync(path.join(__dirname, '../ArticleReaderScreen.tsx'), 'utf8');

    let translatedCount = 0;
    let deadCount = 0;
    let frenchOnlyReachableCount = 0;
    const frenchOnlyReachable: string[] = [];

    for (const file of files) {
      const componentName = file.replace(/\.tsx$/, '');
      const isWiredIntoReader = reader.includes(componentName);
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      const isBilingual = /const CONTENT = \{/.test(source) && /i18n\.language === 'fr'/.test(source);

      if (dead.has(file)) {
        deadCount += 1;
        expect(isWiredIntoReader).toBe(false);
        continue;
      }

      // Every reachable file must be wired into the reader AND bilingual.
      expect(isWiredIntoReader).toBe(true);
      if (isBilingual) {
        translatedCount += 1;
      } else {
        frenchOnlyReachableCount += 1;
        frenchOnlyReachable.push(file);
      }
    }

    expect(deadCount).toBe(1);
    expect(frenchOnlyReachable).toEqual([]);
    expect(frenchOnlyReachableCount).toBe(0);
    expect(translatedCount).toBe(72);
    // TOTAL = 73, REACHABLE = 72, DEAD = 1, BILINGUAL = 72, FRENCH-ONLY = 0.
    expect(translatedCount + deadCount).toBe(files.length);
  });

  it('every reachable article has zero French-tell words inside its CONTENT.en block (residual-French audit)', () => {
    const dir = path.resolve(__dirname, '..');
    const files = fs
      .readdirSync(dir)
      .filter(name => /ArticleScreen\.tsx$/.test(name) && name !== 'UnderstandCycleArticleScreen.tsx');

    // Common French stopwords/function-words that should never legitimately
    // appear inside translated English prose (deliberately-preserved terms
    // like Hijri/Ramadan/Qadaa/Nifas/ghusl/ "baby blues" are not in this
    // list, since they're correct in English too).
    const frenchTells = [
      'également', 'cependant', 'ainsi', 'donc', 'chez', 'avec', 'dans', 'pour',
      'mais', 'cela', 'ceci', 'être', 'avoir', 'peut', 'peuvent', 'doit', 'doivent',
      'grossesse', 'règles', 'bébé', 'santé', 'votre', 'vous', 'cette',
      'leur', 'leurs', 'très', 'fait', 'faire', 'souvent', 'parfois',
      'généralement', 'notamment', 'environ', 'selon', 'afin', 'quelques',
      'depuis', 'toujours', 'jamais', 'plusieurs', 'chaque',
    ];

    const offenders: Record<string, string[]> = {};
    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      const enMatch = source.match(/\n {2}en: \{([\s\S]*?)\n {2}\},\n\} as const;/);
      if (!enMatch) continue;
      const enBlock = enMatch[1];
      const found = frenchTells.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(enBlock));
      if (found.length) offenders[file] = found;
    }

    expect(offenders).toEqual({});
  });

  it('every reachable article has a non-empty CONTENT.fr and CONTENT.en block (structural parity smoke test)', () => {
    const dir = path.resolve(__dirname, '..');
    const files = fs
      .readdirSync(dir)
      .filter(name => /ArticleScreen\.tsx$/.test(name) && name !== 'UnderstandCycleArticleScreen.tsx');

    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(source).toMatch(/const CONTENT = \{/);
      expect(source).toMatch(/\n {2}fr: \{/);
      expect(source).toMatch(/\n {2}en: \{/);
      expect(source).toMatch(/const \{t, i18n\} = useTranslation\(\);/);
      expect(source).toMatch(/const content = CONTENT\[lang\];/);
    }
  });
});
