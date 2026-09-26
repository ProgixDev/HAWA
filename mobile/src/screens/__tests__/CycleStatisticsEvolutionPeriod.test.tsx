import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import StatisticsScreen from '../StatisticsScreen';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {saveJournalSection} from '../../state/dailyJournalStore';

// M19 - the Cycle Statistics "Évolution du flux" / "Évolution par mois" rows
// are computed ONLY from real journal entries inside the SELECTED period
// (1/3/6/12 months) - no placeholder/preview data, honest empty states, and
// the rows change when the period changes.
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
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

async function selectPeriod(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const button = renderer.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  await act(async () => {
    button!.props.onPress();
  });
  await flush();
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('Cycle Statistics - evolution rows use real data and the selected period', () => {
  it('no data: honest empty states, no flow labels or symptom names are shown', async () => {
    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    expect(texts).toContain('Aucun flux enregistré ce mois-ci');
    expect(texts).toContain('Aucun symptôme enregistré ce mois-ci');
    expect(texts).toContain('Pas encore assez de cycles enregistrés');
    expect(texts).not.toContain('Léger');
    expect(texts).not.toContain('Moyen');
    expect(texts).not.toContain('Abondant');
  });

  it('insufficient data: a single recorded day is shown as recorded, nothing is extrapolated into a trend or an average', async () => {
    await saveJournalSection('2026-09-20', 'flow', {intensity: 'moderate'});
    const renderer = await renderScreen();
    const texts = allTexts(renderer);
    expect(texts).toContain('Moyen');
    expect(texts).toContain('1 jour');
    // One period only -> no cycle-length average is invented.
    expect(texts).toContain('Pas encore assez de cycles enregistrés');
    expect(texts).not.toContain('Évolution par mois');
  });

  it('enough real data: the month-by-month rows follow the selected period', async () => {
    await saveJournalSection('2026-09-20', 'flow', {intensity: 'moderate'});
    await saveJournalSection('2026-09-20', 'symptoms', {names: ['Crampes']});
    await saveJournalSection('2026-07-28', 'flow', {intensity: 'heavy'});
    await saveJournalSection('2026-07-28', 'symptoms', {names: ['Fatigue']});
    await saveJournalSection('2026-03-10', 'flow', {intensity: 'light'});
    act(() => {
      updatePremiumState({isPremium: true, initialized: true});
    });

    const renderer = await renderScreen();

    // 1 mois: only the September entry is in the window.
    let texts = allTexts(renderer);
    expect(texts).toContain('Moyen');
    expect(texts).not.toContain('Abondant');
    expect(texts).toContain('Crampes');
    expect(texts).not.toContain('Fatigue');

    // 3 mois: July + September, month by month (chip text is "<label> · <n> j").
    await selectPeriod(renderer, '3 mois');
    texts = allTexts(renderer);
    expect(texts).toContain('Répartition mois par mois sur 3 mois');
    expect(texts).toContain('Juillet 2026');
    expect(texts).toContain('Septembre 2026');
    expect(texts).not.toContain('Mars 2026');
    expect(texts.some(text => text.startsWith('Abondant'))).toBe(true);
    expect(texts).toContain('Évolution par mois');

    // 12 mois: the March entry now appears too.
    await selectPeriod(renderer, '12 mois');
    texts = allTexts(renderer);
    expect(texts).toContain('Mars 2026');
    expect(texts.some(text => text.startsWith('Léger'))).toBe(true);
  });

  it('a wider period with no symptom data no longer claims "ce mois-ci"', async () => {
    await saveJournalSection('2026-09-20', 'flow', {intensity: 'moderate'});
    act(() => {
      updatePremiumState({isPremium: true, initialized: true});
    });
    const renderer = await renderScreen();
    await selectPeriod(renderer, '6 mois');
    const texts = allTexts(renderer);
    expect(texts).toContain('Aucun symptôme enregistré sur cette période');
    expect(texts).not.toContain('Aucun symptôme enregistré ce mois-ci');
  });
});
