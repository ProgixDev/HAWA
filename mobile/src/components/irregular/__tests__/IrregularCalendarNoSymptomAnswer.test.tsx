import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import IrregularCalendarContent from '../IrregularCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  saveIrregularFatigueEntry,
  saveIrregularJournalField,
} from '../../../state/irregularJournalStore';

// M23 — an explicit "Aucune" answer is an ANSWER (the selected-day card still
// shows it) but never a symptom occurrence: no Calendar marker, not counted in
// "Jours avec ...". Module-singleton store: tests run in this order, later
// tests overwrite fields written by earlier ones on the same (today) day.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

async function renderCalendar() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => <IrregularCalendarContent />}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 6; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const isGlyph = (text: string) => /^[-\u{F0000}-\u{FFFFF}]+$/u.test(text);
const visibleTextsIn = (node: ReactTestRenderer.ReactTestInstance): string[] =>
  node.findAllByType(Text).map(textOf).filter(text => !isGlyph(text));

const tile = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): string | undefined => {
  const node = renderer.root.findAllByType(Text).find(item => textOf(item) === label);
  return node?.parent ? visibleTextsIn(node.parent)[0] : undefined;
};

const todayCellLabel = (renderer: ReactTestRenderer.ReactTestRenderer): string => {
  const day = String(new Date().getDate());
  const cell = renderer.root.findAll(
    node =>
      typeof node.props.accessibilityLabel === 'string' &&
      (node.props.accessibilityLabel === day || node.props.accessibilityLabel.startsWith(`${day},`)),
  )[0];
  return cell?.props.accessibilityLabel as string;
};

const hasText = (renderer: ReactTestRenderer.ReactTestRenderer, value: string) =>
  renderer.root.findAllByType(Text).some(node => textOf(node) === value);

beforeEach(() => {
  resetPremiumStateForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('IrregularCalendarContent — "Aucune" is not a symptom day (M23)', () => {
  it('unanswered day: no marker', async () => {
    const renderer = await renderCalendar();
    expect(todayCellLabel(renderer)).not.toContain('suivi enregistré');
  });

  it('"Aucune" only (acné, douleurs): no marker, not counted as symptom days, answer still shown', async () => {
    await saveIrregularJournalField(todayKey(), 'acne', 'Aucune');
    await saveIrregularJournalField(todayKey(), 'pain', 'Aucune');
    const renderer = await renderCalendar();

    expect(todayCellLabel(renderer)).not.toContain('suivi enregistré');
    expect(tile(renderer, 'Jours avec acné')).toBe('0');
    expect(tile(renderer, 'Jours avec douleurs')).toBe('0');
    // The stored answers are not deleted nor hidden from the selected-day card.
    expect(hasText(renderer, 'Acné')).toBe(true);
    expect(hasText(renderer, 'Douleurs')).toBe(true);
    expect(hasText(renderer, 'Aucun suivi pour ce jour')).toBe(false);
  });

  it('a real symptom: marker + counted', async () => {
    await saveIrregularJournalField(todayKey(), 'acne', 'Légère');
    const renderer = await renderCalendar();

    expect(todayCellLabel(renderer)).toContain('suivi enregistré');
    expect(tile(renderer, 'Jours avec acné')).toBe('1');
    expect(tile(renderer, 'Jours avec douleurs')).toBe('0'); // pain is still "Aucune"
  });

  it('multiple symptoms: each real one counts, "Aucune" ones do not', async () => {
    await saveIrregularJournalField(todayKey(), 'acne', 'Modérée');
    await saveIrregularJournalField(todayKey(), 'pain', 'Forte');
    await saveIrregularJournalField(todayKey(), 'hairGrowth', 'Aucune');
    await saveIrregularFatigueEntry(todayKey(), 'Aucune', []);
    const renderer = await renderCalendar();

    expect(todayCellLabel(renderer)).toContain('suivi enregistré');
    expect(tile(renderer, 'Jours avec acné')).toBe('1');
    expect(tile(renderer, 'Jours avec douleurs')).toBe('1');
    expect(tile(renderer, 'Jours de fatigue')).toBe('0');
  });
});
