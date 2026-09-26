import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setIrregularPreferences} from '../../state/irregularPreferences';
import {saveIrregularJournalEntry} from '../../state/irregularJournalStore';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {setSelectedObjective} from '../../state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {addDays} from '../../utils/cycleMath';

// SOPK Profile tiles ("Dernières règles" / "Durée des règles") used to read
// ONLY confirmedPeriodHistory (needs an explicit confirmed END), so they stayed
// "Non renseignée(s)" for a user who records periods in the SOPK journal.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderProfile() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'}} />}
              </Stack.Screen>
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

const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

/** Profile stat card: the value Text sits right before its label Text. */
const tile = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const texts = allTexts(renderer);
  const index = texts.indexOf(label);
  return index > 0 ? texts[index - 1] : undefined;
};

const keyFor = (offsetDays: number) => addDays(new Date(), offsetDays).toLocaleDateString('en-CA');
const shortDate = (offsetDays: number) =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long'}).format(addDays(new Date(), offsetDays));

async function recordPeriodDay(offsetDays: number) {
  const date = keyFor(offsetDays);
  await saveJournalSection(date, 'flow', {intensity: 'moderate'});
  await saveIrregularJournalEntry(date, 'period', 'Oui · Modérée', {status: 'yes', flowIntensity: 'Modérée'});
}

beforeEach(async () => {
  resetPremiumStateForTests();
  updatePrivacySecuritySettings({anonymousMode: false});
  await setSelectedObjective('irregular');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await setSelectedObjective('cycle');
});

// Stores are module singletons: the scenarios build on each other
// (insufficient → finished period → ongoing period).
describe('ProfileScreen — SOPK period tiles use real recorded data', () => {
  it('H. nothing recorded → "Non renseignées" / "Non renseignée", nothing invented', async () => {
    await setIrregularPreferences({lastPeriodDate: null});
    const renderer = await renderProfile();
    expect(tile(renderer, 'Dernières règles')).toBe('Non renseignées');
    expect(tile(renderer, 'Durée des règles')).toBe('Non renseignée');
  });

  it('H. a finished recorded period (3 days, ended before today) → real start date and duration', async () => {
    await recordPeriodDay(-10);
    await recordPeriodDay(-9);
    await recordPeriodDay(-8);
    const renderer = await renderProfile();
    expect(tile(renderer, 'Dernières règles')).toBe(shortDate(-10));
    expect(tile(renderer, 'Durée des règles')).toBe('3 jours');
  });

  it('H. a further day recorded today keeps the SAME period (no phantom new start); duration is not invented while ongoing', async () => {
    await setIrregularPreferences({lastPeriodDate: keyFor(-40)});
    await recordPeriodDay(0);
    const renderer = await renderProfile();
    // -10 → today is 10 days: still the same period (< 15 days), so the start stays -10
    // and the period is still ongoing → no duration yet.
    expect(tile(renderer, 'Dernières règles')).toBe(shortDate(-10));
    expect(tile(renderer, 'Durée des règles')).toBe('Non renseignée');
  });
});
