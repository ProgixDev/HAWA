import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

import CyclePhasesArticleScreen from '../CyclePhasesArticleScreen';
import ConceptionStartArticleScreen from '../ConceptionStartArticleScreen';
import BirthControlPillsArticleScreen from '../BirthControlPillsArticleScreen';
import PcosIntroArticleScreen from '../PcosIntroArticleScreen';
import PregnancyWeeklyArticleScreen from '../PregnancyWeeklyArticleScreen';
import PostpartumRecoveryArticleScreen from '../PostpartumRecoveryArticleScreen';
import MiscarriageGriefArticleScreen from '../MiscarriageGriefArticleScreen';
import MenopauseTransitionArticleScreen from '../MenopauseTransitionArticleScreen';
import FiqhWomenIntroArticleScreen from '../FiqhWomenIntroArticleScreen';
import FirstPeriodArticleScreen from '../FirstPeriodArticleScreen';

// PHASE (Spanish localization) — ITEM 2: representative runtime rendering.
//
// One real article screen per content group is actually mounted (not just
// inspected as source) in French, English, and Spanish, asserting the
// rendered text matches that language's distinctive CONTENT.<lang>.badge
// (and no other language's). This follows the exact render/switch pattern
// established by Phase7LEditorialLocalization.test.tsx, extended to the
// third language.

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
  // The app's current default language is English, not French — pin French
  // explicitly so every "FR first" assertion below is independent of that
  // default.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

type ArticleCase = {
  group: string;
  Component: React.ComponentType<any>;
  fr: string;
  en: string;
  es: string;
};

// One correctly-categorized representative file per content group, with its
// `badge` field (a short, distinctive, single-line string) in all three
// languages, taken verbatim from each screen's own CONTENT object.
const CASES: ArticleCase[] = [
  {group: 'Cycle/menstruation', Component: CyclePhasesArticleScreen, fr: 'Cycle menstruel', en: 'Menstrual cycle', es: 'Ciclo menstrual'},
  {group: 'Trying to conceive', Component: ConceptionStartArticleScreen, fr: 'ESSAYER DE CONCEVOIR', en: 'TRYING TO CONCEIVE', es: 'INTENTAR CONCEBIR'},
  {group: 'Contraception', Component: BirthControlPillsArticleScreen, fr: 'PILULE CONTRACEPTIVE', en: 'BIRTH CONTROL PILL', es: 'PÍLDORA ANTICONCEPTIVA'},
  {group: 'PCOS/irregular cycles', Component: PcosIntroArticleScreen, fr: 'SOPK • GUIDE ESSENTIEL', en: 'PCOS • ESSENTIAL GUIDE', es: 'SOP • GUÍA ESENCIAL'},
  {group: 'Pregnancy', Component: PregnancyWeeklyArticleScreen, fr: 'GROSSESSE • VUE D’ENSEMBLE', en: 'PREGNANCY • OVERVIEW', es: 'EMBARAZO • VISIÓN GENERAL'},
  {group: 'Postpartum', Component: PostpartumRecoveryArticleScreen, fr: 'POST-PARTUM • RÉCUPÉRATION', en: 'POSTPARTUM • RECOVERY', es: 'POSPARTO • RECUPERACIÓN'},
  {group: 'Pregnancy loss', Component: MiscarriageGriefArticleScreen, fr: 'APRÈS UNE FAUSSE COUCHE • SOUTIEN ÉMOTIONNEL', en: 'AFTER A MISCARRIAGE • EMOTIONAL SUPPORT', es: 'DESPUÉS DE UNA PÉRDIDA DEL EMBARAZO • APOYO EMOCIONAL'},
  {group: 'Perimenopause/menopause', Component: MenopauseTransitionArticleScreen, fr: 'PÉRIMÉNOPAUSE & MÉNOPAUSE', en: 'PERIMENOPAUSE & MENOPAUSE', es: 'PERIMENOPAUSIA Y MENOPAUSIA'},
  {group: 'Spiritual/fiqh', Component: FiqhWomenIntroArticleScreen, fr: 'FIQH FÉMININ', en: 'WOMEN’S FIQH', es: 'FIQH FEMENINO'},
  {group: 'Daughter/first period', Component: FirstPeriodArticleScreen, fr: 'PREMIÈRES RÈGLES', en: 'FIRST PERIOD', es: 'PRIMERA MENSTRUACIÓN'},
];

describe('ITEM 2 — one representative article per content group renders in FR / EN / ES', () => {
  it.each(CASES)('$group — renders its own badge in each language and never another language\'s', async ({Component, fr, en, es}) => {
    const frRenderer = await renderScreen(Component);
    expect(textsOf(frRenderer)).toContain(fr);
    expect(textsOf(frRenderer)).not.toContain(en);
    expect(textsOf(frRenderer)).not.toContain(es);

    await switchLanguage('en');
    const enTexts = textsOf(frRenderer);
    expect(enTexts).toContain(en);
    expect(enTexts).not.toContain(fr);
    expect(enTexts).not.toContain(es);

    await switchLanguage('es');
    const esTexts = textsOf(frRenderer);
    expect(esTexts).toContain(es);
    expect(esTexts).not.toContain(fr);
    expect(esTexts).not.toContain(en);
  });
});

describe('ITEM 2 (runtime switch, single mounted instance) — EN -> ES -> FR -> EN, no remount', () => {
  it('ConceptionStartArticleScreen reacts live to every language change on the SAME renderer instance', async () => {
    await switchLanguage('en');
    const renderer = await renderScreen(ConceptionStartArticleScreen);
    expect(textsOf(renderer)).toContain('TRYING TO CONCEIVE');

    await switchLanguage('es');
    expect(textsOf(renderer)).toContain('INTENTAR CONCEBIR');
    expect(textsOf(renderer)).not.toContain('TRYING TO CONCEIVE');
    expect(textsOf(renderer)).not.toContain('ESSAYER DE CONCEVOIR');

    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain('ESSAYER DE CONCEVOIR');
    expect(textsOf(renderer)).not.toContain('INTENTAR CONCEBIR');
    expect(textsOf(renderer)).not.toContain('TRYING TO CONCEIVE');

    await switchLanguage('en');
    expect(textsOf(renderer)).toContain('TRYING TO CONCEIVE');
    expect(textsOf(renderer)).not.toContain('ESSAYER DE CONCEVOIR');
    expect(textsOf(renderer)).not.toContain('INTENTAR CONCEBIR');
  });
});
