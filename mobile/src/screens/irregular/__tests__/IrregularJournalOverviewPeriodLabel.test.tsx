import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import IrregularJournalOverviewScreen from '../IrregularJournalOverviewScreen';
import {saveIrregularJournalEntry} from '../../../state/irregularJournalStore';
import {deleteJournalSection, saveJournalSection} from '../../../state/dailyJournalStore';

// M24 — the SOPK Overview "Règles" row must tell "Pas de règles" (a real
// "Non"), "Spotting" and a real menstrual flow apart. "Non" and "Spotting" are
// BOTH stored with flow.intensity 'none', so the row now goes through the
// canonical classifyIrregularPeriodDay(). Module-singleton store: the tests
// run in this order (unanswered first).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

async function renderOverview() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <IrregularJournalOverviewScreen />}</Stack.Screen>
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
const isGlyph = (text: string) => /^[-\u{F0000}-\u{FFFFF}]+$/u.test(text);

/** The value line of the "Règles" row. */
const rulesRowValue = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined => {
  for (const label of renderer.root.findAllByType(Text).filter(node => textOf(node) === 'Règles')) {
    const value = label.parent
      ? label.parent.findAllByType(Text).map(textOf).filter(text => !isGlyph(text)).find(text => text !== 'Règles')
      : undefined;
    if (value) {return value;}
  }
  return undefined;
};

const rulesRowDone = (renderer: ReactTestRenderer.ReactTestRenderer): boolean =>
  renderer.root.findAll(node => node.props.accessibilityLabel === 'Règles, enregistré').length > 0;

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await deleteJournalSection(todayKey(), 'flow');
});

describe('IrregularJournalOverviewScreen — "Règles" row wording', () => {
  it('unanswered: invites to fill it in, not marked done', async () => {
    const renderer = await renderOverview();
    expect(rulesRowValue(renderer)).toBe('Renseigne le début de tes règles');
    expect(rulesRowDone(renderer)).toBe(false);
  });

  it('"Non": "Pas de règles", done', async () => {
    await saveJournalSection(todayKey(), 'flow', {intensity: 'none'});
    await saveIrregularJournalEntry(todayKey(), 'period', 'Non', {status: 'no'});
    const renderer = await renderOverview();
    expect(rulesRowValue(renderer)).toBe('Pas de règles');
    expect(rulesRowDone(renderer)).toBe(true);
  });

  it('"Spotting": shown as Spotting — never "Pas de règles"', async () => {
    await saveJournalSection(todayKey(), 'flow', {intensity: 'none'});
    await saveIrregularJournalEntry(todayKey(), 'period', 'Spotting', {status: 'spotting'});
    const renderer = await renderOverview();
    expect(rulesRowValue(renderer)).toBe('Spotting');
    expect(rulesRowDone(renderer)).toBe(true);
  });

  it('actual menstrual flow: shows the flow intensity', async () => {
    await saveJournalSection(todayKey(), 'flow', {intensity: 'heavy'});
    await saveIrregularJournalEntry(todayKey(), 'period', 'Oui · Abondant', {status: 'yes', flowIntensity: 'Abondant'});
    const renderer = await renderOverview();
    expect(rulesRowValue(renderer)).toBe('Abondant');
    expect(rulesRowDone(renderer)).toBe(true);
  });
});
