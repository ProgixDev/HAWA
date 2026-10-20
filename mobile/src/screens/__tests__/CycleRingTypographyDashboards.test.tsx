import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import CycleHomeScreen from '../CycleHomeScreen';
import {planCycleRingText} from '../../components/home/cycleRingLayout';
import {setCyclePreferences} from '../../state/onboardingPreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import i18n from '../../i18n';

// The cycle ring of the main dashboard and of a daughter's dashboard is ONE component (CycleProgressRing, through
// HeroCycleCard): the same caption / number / phase typography, planned for the language, whoever is shown. This renders
// both dashboards for the same cycle day and compares what is really drawn, in the languages with the longest copy.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const SMALL_PHONE: Metrics = {frame: {x: 0, y: 0, width: 320, height: 640}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderDashboard() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={SMALL_PHONE}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <CycleHomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'home', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const styleOf = (node: ReactTestRenderer.ReactTestInstance) => StyleSheet.flatten(node.props.style) as Record<string, unknown>;

const COPY = {
  fr: {caption: 'Jour du cycle', phases: ['Phase menstruelle', 'Phase folliculaire', 'Fenêtre fertile', 'Ovulation', 'Phase lutéale'], day4: 'Phase menstruelle', day8: 'Phase folliculaire'},
  ru: {caption: 'День цикла', phases: ['Менструальная фаза', 'Фолликулярная фаза', 'Фертильное окно', 'Овуляция', 'Лютеиновая фаза'], day4: 'Менструальная фаза', day8: 'Фолликулярная фаза'},
  de: {caption: 'Zyklustag', phases: ['Menstruation', 'Follikelphase', 'Fruchtbares Fenster', 'Eisprung', 'Lutealphase'], day4: 'Menstruation', day8: 'Follikelphase'},
  it: {caption: 'Giorno del ciclo', phases: ['Fase mestruale', 'Fase follicolare', 'Finestra fertile', 'Ovulazione', 'Fase luteale'], day4: 'Fase mestruale', day8: 'Fase follicolare'},
} as const;

/** The three ring texts of a rendered dashboard, found by what they say — their drawn styles, captured at once. */
function ringTexts(renderer: ReactTestRenderer.ReactTestRenderer, language: keyof typeof COPY, day: number, phase: string) {
  const plan = planCycleRingText({size: 116, caption: COPY[language].caption, phaseLabels: COPY[language].phases});
  const texts = renderer.root.findAllByType(Text);
  const caption = texts.find(node => textOf(node) === COPY[language].caption)!;
  const number = texts.find(node => textOf(node) === String(day) && styleOf(node).fontSize === plan.number.fontSize)!;
  const phaseText = texts.find(node => node.props.accessibilityLabel === phase)!;
  return {
    plan,
    caption: styleOf(caption),
    number: styleOf(number),
    phaseText: styleOf(phaseText),
    phaseContent: textOf(phaseText),
    allowFontScaling: [caption, number, phaseText].map(node => node.props.allowFontScaling),
  };
}

beforeEach(async () => {
  jest.useFakeTimers();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe.each(Object.keys(COPY) as Array<keyof typeof COPY>)('main and daughter dashboards — %s', language => {
  beforeEach(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });

  it.each([
    ['day 4, menstruation', 3, 4, 'day4'],
    ['day 8, follicular', 7, 8, 'day8'],
  ] as const)('%s: the same ring typography, planned to fit the circle', async (_title, dayOffset, day, phaseKey) => {
    jest.setSystemTime(new Date(2026, 8, 1 + dayOffset, 10, 0, 0));
    const phase = COPY[language][phaseKey];

    // the mother's own cycle: period start 1 Sep, 5-day period, 28-day regular cycle
    await setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const owner = ringTexts(await renderDashboard(), language, day, phase);

    // a daughter with the same cycle
    const daughter = await addManagedProfile({
      type: 'daughter',
      firstName: 'Lina',
      birthDate: '2014-01-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-01',
      periodLength: 5,
      cycleLength: 28,
      regularity: 'yes',
    });
    await setActiveProfileId(daughter.id);
    await seedManagedProfileCycleIfNeeded(daughter.id);
    const child = ringTexts(await renderDashboard(), language, day, phase);

    for (const part of ['caption', 'number', 'phaseText'] as const) {
      expect([language, part, child[part]]).toEqual([language, part, owner[part]]);
    }
    expect(child.phaseContent).toBe(owner.phaseContent);
    // and it is the planned, smaller-than-11 caption: nothing is left at the old 11 / 9.5
    expect(owner.caption.fontSize).toBe(owner.plan.caption.fontSize);
    expect(owner.caption.fontSize as number).toBeLessThan(11);
    expect(owner.phaseText.fontSize).toBe(owner.plan.phase.fontSize);
    expect(owner.phaseContent).toBe(owner.plan.phaseLines[phase].join('\n'));
    await setActiveProfileId(OWNER_PROFILE_ID);
  });
});

describe('the ring stays readable on the system font sizes', () => {
  it('draws its three texts without font scaling, so a large system font cannot push them out of the disc', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    jest.setSystemTime(new Date(2026, 8, 4, 10, 0, 0));
    await setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const {allowFontScaling} = ringTexts(await renderDashboard(), 'fr', 4, 'Phase menstruelle');
    expect(allowFontScaling).toEqual([false, false, false]);
  });
});
