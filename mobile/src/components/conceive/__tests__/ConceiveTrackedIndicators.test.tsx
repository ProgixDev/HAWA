import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ConceiveDashboard from '../ConceiveDashboard';
import {getConceptionJournalItems, CONCEPTION_JOURNAL_ITEMS} from '../../../config/conceptionJournalConfig';
import {setConceptionPreferences, type FertilityIndicator} from '../../../state/conceptionPreferences';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {resetPremiumStateForTests} from '../../../state/premiumStore';

// M17 - "Indicateurs suivis" (conceptionPreferences.indicators) filters the
// Conceive daily-tracking ENTRY POINTS (Suivi du jour card + journal sheet
// items, one shared helper) and never deletes recorded data.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const sections = (indicators: FertilityIndicator[]) => getConceptionJournalItems(indicators).map(item => item.section);

async function renderDashboard() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <ConceiveDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
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
const cardLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAllByType(Pressable)
    .map(node => node.props.accessibilityLabel as string | undefined)
    .filter((label): label is string => typeof label === 'string' && /Température|Glaire|Test LH|Rapports/.test(label));
const progress = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(textOf).find(text => /complété$/.test(text));

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  setCyclePreferences({
    ...getCyclePreferences(),
    lastPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    periodDuration: 5,
    cycleDuration: 28,
    regularity: 'yes',
  });
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('getConceptionJournalItems - shared indicator filter', () => {
  it('keeps only the entry points of the followed indicators, in the original order', () => {
    expect(sections(['temperature', 'lh_tests'])).toEqual(['temperature', 'lhTest']);
    expect(sections(['intercourse'])).toEqual(['intimacy']);
    expect(sections(['cervical_mucus', 'temperature'])).toEqual(['temperature', 'cervicalMucus']);
  });

  it('an empty selection (legacy / never chose) shows every entry point instead of hiding all', () => {
    expect(getConceptionJournalItems([])).toBe(CONCEPTION_JOURNAL_ITEMS);
    expect(sections([])).toEqual(['temperature', 'cervicalMucus', 'lhTest', 'intimacy']);
  });

  it('all four indicators selected shows all four entry points', () => {
    expect(sections(['temperature', 'cervical_mucus', 'lh_tests', 'intercourse'])).toHaveLength(4);
  });

  it('the Journal quotidien sheet uses the SAME shared filter (static guard on MainTabNavigator)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../navigation/MainTabNavigator.tsx'), 'utf8');
    expect(source).toContain('getConceptionJournalItems(getConceptionPreferences().indicators)');
    expect(source).not.toContain('CONCEPTION_JOURNAL_ITEMS.map');
  });
});

describe('ConceiveDashboard - Suivi du jour follows the tracked indicators', () => {
  it('legacy user with no indicators sees all four categories', async () => {
    const renderer = await renderDashboard();
    expect(cardLabels(renderer)).toHaveLength(4);
    expect(progress(renderer)).toBe('0 / 4 complété');
  });

  it('only the selected indicators are offered, and the counter follows', async () => {
    await act(async () => {
      await setConceptionPreferences({indicators: ['temperature', 'lh_tests']});
    });
    const renderer = await renderDashboard();
    const labels = cardLabels(renderer);
    expect(labels).toHaveLength(2);
    expect(labels.join('|')).toMatch(/Température/);
    expect(labels.join('|')).toMatch(/Test LH/);
    expect(labels.join('|')).not.toMatch(/Glaire|Rapports/);
    expect(progress(renderer)).toBe('0 / 2 complété');
  });

  it('changing the preference updates the mounted card live', async () => {
    await act(async () => {
      await setConceptionPreferences({indicators: ['temperature']});
    });
    const renderer = await renderDashboard();
    expect(cardLabels(renderer)).toHaveLength(1);
    await act(async () => {
      await setConceptionPreferences({indicators: ['temperature', 'cervical_mucus', 'intercourse']});
    });
    expect(cardLabels(renderer)).toHaveLength(3);
    expect(cardLabels(renderer).join('|')).not.toMatch(/Test LH/);
  });
});

describe('disabling an indicator never deletes recorded data', () => {
  it('a previously saved mucus observation stays stored and readable once the indicator is unfollowed', async () => {
    const day = '2026-05-10';
    await saveJournalSection(day, 'cervicalMucus', {type: 'eggWhite'} as never);
    await setConceptionPreferences({indicators: ['temperature']});
    expect(sections(['temperature'])).not.toContain('cervicalMucus');
    const entry = await getJournalEntry(day);
    expect(entry?.cervicalMucus).toBeDefined();
  });
});
