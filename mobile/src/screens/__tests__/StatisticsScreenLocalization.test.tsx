import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import StatisticsScreen from '../StatisticsScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Phase 2 localization — Statistics is read-only (never persists anything),
// so unlike the Journal entry screens, its flow-intensity/period labels are
// pure display text and are fully translated — no data-bearing gap here.
// Symptom NAMES are the user's own saved data (stored in French forever,
// per Phase 7H's journalOptionLabel architecture) but their DISPLAY label
// is translated per app language via journalOptionLabel('cycleSymptom', ...)
// — only the persisted/compared value stays French (see Phase 7H.1).

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <StatisticsScreen navigation={{} as never} route={{key: 'test', name: 'Statistics'} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  await resetAppLanguageForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('StatisticsScreen — localization', () => {
  it('renders empty states in French by default', async () => {
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Statistiques');
    expect(texts).toContain('Aucun flux enregistré ce mois-ci');
    expect(texts).toContain('Aucun symptôme enregistré ce mois-ci');
    expect(texts).toContain('Pas encore assez de cycles enregistrés');
  });

  it('renders empty states in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Statistics');
    expect(texts).toContain('Understand your body through your trends');
    expect(texts).toContain('No flow recorded this month');
    expect(texts).toContain('No symptoms recorded this month');
    expect(texts).toContain('Not enough cycles recorded yet');
    expect(texts.some(text => /^\d+ months?$/.test(text))).toBe(true);
    expect(texts).not.toContain('Statistiques');
    expect(texts).not.toContain('Pas encore assez de cycles enregistrés');
  });

  it('translates flow-intensity labels (pure display text, no persisted data involved) in English', async () => {
    await setAppLanguage('en');
    await saveJournalSection('2026-09-20', 'flow', {intensity: 'moderate'});
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Moderate');
    expect(texts.some(text => /^1 day$/.test(text))).toBe(true);
    expect(texts).not.toContain('Moyen');
  });

  it('translates the display label of the user’s own saved symptom names in English (persisted value stays French)', async () => {
    await setAppLanguage('en');
    await saveJournalSection('2026-09-20', 'symptoms', {names: ['Crampes'], severity: 'mild'});
    const texts = allTexts(await renderScreen());
    expect(texts).toContain('Most frequent symptoms');
    expect(texts).toContain('Cramps');
    expect(texts).not.toContain('Crampes');
  });
});
