import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import IrregularStatisticsScreen from '../IrregularStatisticsScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setIrregularPreferences} from '../../../state/irregularPreferences';
import {saveIrregularJournalEntry} from '../../../state/irregularJournalStore';
import {saveJournalSection} from '../../../state/dailyJournalStore';
import {addDays} from '../../../utils/cycleMath';

// SOPK Statistics used to read ONLY confirmedPeriodHistory (a period
// with a confirmed END — an explicit "Mes règles sont terminées" step the SOPK
// journal never asks for), so it stayed empty for a user who records her
// periods through the SOPK journal. It now reads the real recorded periods
// too — and still never invent a value when there is not enough data.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => element}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const keyFor = (offsetDays: number) => addDays(new Date(), offsetDays).toLocaleDateString('en-CA');

/** A recorded period day, written exactly like IrregularJournalEntryScreen. */
async function recordPeriodDay(offsetDays: number) {
  const date = keyFor(offsetDays);
  await saveJournalSection(date, 'flow', {intensity: 'moderate'});
  await saveIrregularJournalEntry(date, 'period', 'Oui · Modérée', {status: 'yes', flowIntensity: 'Modérée'});
}

beforeEach(() => {
  resetPremiumStateForTests();
  // Pinned to mid-afternoon: statistics window entries at noon of their day, so a
  // real-clock run before 12:00 would not yet see today's entries.
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 15, 0, 0)});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

// Module-level stores persist across the tests of a file, so the scenarios
// below deliberately build on each other (insufficient → sufficient).
describe('SOPK Statistics — observed cycle duration', () => {
  it('F. no period known → empty state, no invented average', async () => {
    await setIrregularPreferences({lastPeriodDate: null});
    const renderer = await renderScreen(<IrregularStatisticsScreen />);
    expect(allTexts(renderer)).toContain('Pas encore assez de cycles enregistrés');
    expect(allTexts(renderer)).not.toContain('DURÉE OBSERVÉE DE TES CYCLES');
  });

  it('F. the onboarding answer alone (ONE start) → still the empty state, never the 28-day default', async () => {
    await setIrregularPreferences({lastPeriodDate: keyFor(-24)});
    const renderer = await renderScreen(<IrregularStatisticsScreen />);
    expect(allTexts(renderer)).toContain('Pas encore assez de cycles enregistrés');
    expect(allTexts(renderer)).not.toContain('28');
  });

  it('G. onboarding start + a newly recorded period start (24 days later) → a real observed 24-day cycle', async () => {
    await recordPeriodDay(0);
    const renderer = await renderScreen(<IrregularStatisticsScreen />);

    expect(allTexts(renderer)).toContain('DURÉE OBSERVÉE DE TES CYCLES');
    expect(allTexts(renderer)).not.toContain('Pas encore assez de cycles enregistrés');
    expect(allTexts(renderer)).toContain('24');
    expect(allTexts(renderer).some(text => text.includes('Basé sur 1 cycle enregistré'))).toBe(true);
  });

  it('G. more days of the SAME period do not add a phantom cycle', async () => {
    await recordPeriodDay(-1);
    const renderer = await renderScreen(<IrregularStatisticsScreen />);
    expect(allTexts(renderer).some(text => text.includes('Basé sur 1 cycle enregistré'))).toBe(true);
  });
});
