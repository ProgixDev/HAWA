import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import IrregularDashboard from '../IrregularDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setIrregularPreferences} from '../../../state/irregularPreferences';
import {saveIrregularJournalEntry} from '../../../state/irregularJournalStore';
import {saveJournalSection} from '../../../state/dailyJournalStore';
import {addDays} from '../../../utils/cycleMath';
import type {FlowIntensity} from '../../../types/journal';

// "Jour N du cycle" on the SOPK dashboard must count from the MOST RECENT real
// period start — the onboarding answer until a new period is recorded, then
// that new period. "Non" / "Spotting" never restart it.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

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
                  {() => <IrregularDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
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

const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const cycleDayLabel = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined =>
  renderer.root
    .findAll(
      node =>
        typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.includes('de ton cycle'),
    )
    .map(node => node.props.accessibilityLabel as string)[0];

const keyFor = (offsetDays: number) => addDays(new Date(), offsetDays).toLocaleDateString('en-CA');

const FLOW: Record<string, FlowIntensity> = {Légère: 'light', Modérée: 'moderate'};

/** Writes a "Règles" answer exactly like IrregularJournalEntryScreen does: the
 * shared flow record ('none' for Non / Spotting) + the SOPK entry with its
 * status. */
async function answerPeriod(offsetDays: number, status: 'yes' | 'no' | 'spotting', level = 'Modérée') {
  const date = keyFor(offsetDays);
  await saveJournalSection(date, 'flow', {intensity: status === 'yes' ? FLOW[level] : 'none'});
  await saveIrregularJournalEntry(
    date,
    'period',
    status === 'no' ? 'Non' : `${status === 'spotting' ? 'Spotting' : 'Oui'}${status === 'yes' ? ` · ${level}` : ''}`,
    {status, flowIntensity: status === 'yes' ? level : undefined},
  );
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setIrregularPreferences({lastPeriodDate: keyFor(-24)}); // onboarding: last period 24 days ago → day 25
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('IrregularDashboard — "Jour N du cycle" after a new period', () => {
  it('BASELINE: counts from the onboarding answer', async () => {
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBe('Jour 25 de ton cycle, suivi en cours');
  });

  it('SPOTTING and "Non" do not reset the count', async () => {
    await answerPeriod(-1, 'no');
    await answerPeriod(0, 'spotting');
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBe('Jour 25 de ton cycle, suivi en cours');
  });

  it('LIVE: recording a real period while the dashboard is open restarts the count at day 1', async () => {
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBe('Jour 25 de ton cycle, suivi en cours');

    await act(async () => {
      await answerPeriod(0, 'yes');
    });
    await flush();

    expect(cycleDayLabel(renderer)).toBe('Jour 1 de ton cycle, suivi en cours');
  });

  it('a period that started YESTERDAY → today is day 2 (not day 26, not day 1)', async () => {
    await answerPeriod(0, 'no');
    await answerPeriod(-1, 'yes');
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBe('Jour 2 de ton cycle, suivi en cours');
  });

  it('a period recorded on consecutive days keeps counting from its FIRST day', async () => {
    await answerPeriod(-1, 'yes');
    await answerPeriod(0, 'yes');
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBe('Jour 2 de ton cycle, suivi en cours');
  });

  it('undoing the period ("Non" instead of "Oui") falls back to the previous real reference', async () => {
    await answerPeriod(-1, 'no');
    await answerPeriod(0, 'no');
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBe('Jour 25 de ton cycle, suivi en cours');
  });

  it('nothing known at all → "Cycle à renseigner" state, never a fabricated day 1', async () => {
    await answerPeriod(-1, 'no');
    await answerPeriod(0, 'no');
    await setIrregularPreferences({lastPeriodDate: null});
    const renderer = await renderDashboard();
    await flush();
    expect(cycleDayLabel(renderer)).toBeUndefined();
  });
});
