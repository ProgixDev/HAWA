import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import JournalTemperatureScreen from '../../screens/journal/JournalTemperatureScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {computeContraceptionWeeklyBreakdown, computeContraceptionMonthlyBreakdown} from '../../utils/contraceptionMath';

// PHASE 7J — TEST 15/16: useJournalEntryDate's hardcoded French
// FUTURE_ENTRY_MESSAGE and 'fr-FR' date-label formatter, confirmed reachable
// from 3 journal screens. Exercised here via JournalTemperatureScreen opened
// on a non-today, future date (triggers both the date label and the error).
// TEST 17: contraceptionMath's two chart-label formatters.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderOnDate(dateKey: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={JournalTemperatureScreen as never} initialParams={{date: dateKey}} name="Test" />
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

const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const button = renderer.root.findAll(
    node => node.type === Pressable && node.props.accessibilityLabel === label,
  )[0];
  await act(async () => {
    await button.props.onPress();
  });
  await settle();
};

beforeEach(async () => {
  await resetAppLanguageForTests();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 15 — useJournalEntryDate future-entry error message FR -> EN', () => {
  it('opening a future date shows the French message, then the English one', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const futureKey = future.toLocaleDateString('en-CA');

    const frRenderer = await renderOnDate(futureKey);
    await pressSave(frRenderer, 'Enregistrer');
    expect(textsOf(frRenderer).some(text => text.includes('Tu ne peux pas enregistrer un suivi pour une date à venir'))).toBe(true);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderOnDate(futureKey);
    await pressSave(enRenderer, 'Save');
    const enTexts = textsOf(enRenderer);
    expect(enTexts.some(text => text.includes('You can’t save a tracking entry for a future date'))).toBe(true);
    expect(enTexts.some(text => text.includes('Tu ne peux pas'))).toBe(false);
  });
});

describe('TEST 16 — useJournalEntryDate past-date header label FR -> EN', () => {
  it('a past day header renders a French weekday/month, then an English one', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const pastKey = past.toLocaleDateString('en-CA');
    const expectedFr = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).format(new Date(`${pastKey}T12:00:00`));
    const expectedEn = new Intl.DateTimeFormat('en-US', {weekday: 'long', day: 'numeric', month: 'long'}).format(new Date(`${pastKey}T12:00:00`));

    const frRenderer = await renderOnDate(pastKey);
    expect(textsOf(frRenderer)).toContain(expectedFr);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderOnDate(pastKey);
    expect(textsOf(enRenderer)).toContain(expectedEn);
  });
});

describe('TEST 17 — Contraception chart month labels FR/EN', () => {
  it('computeContraceptionWeeklyBreakdown and computeContraceptionMonthlyBreakdown render French then English month abbreviations', async () => {
    const records = {};
    const start = '2026-01-01';
    const end = '2026-01-20';

    const frWeekly = computeContraceptionWeeklyBreakdown(records, start, end);
    const frMonthly = computeContraceptionMonthlyBreakdown(records, start, end);
    expect(frWeekly.some(bucket => /janv\.?/i.test(bucket.label))).toBe(true);
    expect(frMonthly.some(bucket => /janv\.?/i.test(bucket.label))).toBe(true);

    await setAppLanguage('en');
    const enWeekly = computeContraceptionWeeklyBreakdown(records, start, end);
    const enMonthly = computeContraceptionMonthlyBreakdown(records, start, end);
    expect(enWeekly.some(bucket => /jan\.?/i.test(bucket.label))).toBe(true);
    expect(enMonthly.some(bucket => /jan\.?/i.test(bucket.label))).toBe(true);
    expect(enMonthly.some(bucket => /janv/i.test(bucket.label))).toBe(false);
  });
});
