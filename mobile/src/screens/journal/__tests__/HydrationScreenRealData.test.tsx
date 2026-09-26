import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import HydrationScreen from '../HydrationScreen';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';

// M12 — the Hydration screen shows the user's REAL hydration: 0/8 when nothing
// is recorded (no seeded 5/8), and a weekly chart drawn only from the days the
// journal actually holds (no fabricated bars for days without data).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
// Friday 25 Sep 2026 -> the week is Mon 21 .. Sun 27.
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <HydrationScreen />}</Stack.Screen>
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

/** [day label accessibility text, number of drawn bars] per weekday column. */
function chartColumns(renderer: ReactTestRenderer.ReactTestRenderer) {
  const labelled = renderer.root.findAll(
    node => typeof node.props.accessibilityLabel === 'string' && /^(Lun|Mar|Mer|Jeu|Ven|Sam|Dim) :/.test(node.props.accessibilityLabel),
  );
  // findAll also returns composite wrappers: keep the host View of each label.
  const seen = new Map<string, ReactTestRenderer.ReactTestInstance>();
  labelled.forEach(node => {
    if (typeof node.type === 'string' || !seen.has(node.props.accessibilityLabel)) {
      seen.set(node.props.accessibilityLabel, node);
    }
  });
  return Array.from(seen.entries()).map(([label, node]) => {
    const bars = node.findAll(inner => {
      if (typeof inner.type !== 'string') {return false;}
      const style = Object.assign({}, ...[inner.props.style].flat(Infinity).filter(Boolean));
      return typeof style.height === 'string' && String(style.height).endsWith('%');
    });
    return {label, barCount: bars.length};
  });
}

const key = (offsetFromMonday: number) =>
  new Date(2026, 8, 21 + offsetFromMonday).toLocaleDateString('en-CA');

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('HydrationScreen — real data only', () => {
  it('nothing recorded => 0 / 8 verres, an empty chart and no cycle day from fallback defaults', async () => {
    const renderer = await renderScreen();
    const texts = allTexts(renderer);

    expect(texts).toContain('0 / 8 verres');
    expect(texts.some(text => text.includes('5 / 8'))).toBe(false);
    expect(texts).toContain('Aucun verre enregistré cette semaine pour l’instant.');
    expect(texts).toContain('Aujourd’hui');
    expect(texts.some(text => text.includes('du cycle'))).toBe(false);

    const columns = chartColumns(renderer);
    expect(columns).toHaveLength(7);
    columns.forEach(column => {
      expect(column.label).toMatch(/aucun relevé$/);
      expect(column.barCount).toBe(0);
    });
  });

  it('5 real saved glasses today => 5 / 8 verres and a bar for today only', async () => {
    await saveJournalSection(key(4), 'hydration', {milliliters: 1250, dailyGoal: 2000, glasses: 5, goalGlasses: 8});

    const renderer = await renderScreen();

    expect(allTexts(renderer)).toContain('5 / 8 verres');
    const columns = chartColumns(renderer);
    expect(columns.find(column => column.label === 'Ven : 5 verres')?.barCount).toBe(1);
    expect(columns.filter(column => column.barCount > 0)).toHaveLength(1);
  });

  it('the weekly chart reflects the actually stored days — and nothing for the others', async () => {
    await saveJournalSection(key(0), 'hydration', {milliliters: 1750, glasses: 7, goalGlasses: 8});
    await saveJournalSection(key(2), 'hydration', {milliliters: 1500, glasses: 6});
    // Legacy record: milliliters only (1000 ml = 4 glasses of 250 ml).
    await saveJournalSection(key(3), 'hydration', {milliliters: 1000});
    // A day OUTSIDE the displayed week must never leak into it.
    await saveJournalSection(new Date(2026, 8, 14).toLocaleDateString('en-CA'), 'hydration', {milliliters: 2500, glasses: 10});

    const renderer = await renderScreen();
    const byLabel = Object.fromEntries(chartColumns(renderer).map(column => [column.label.split(' :')[0], column]));

    expect(byLabel.Lun.label).toBe('Lun : 7 verres');
    expect(byLabel.Mar.label).toBe('Mar : aucun relevé');
    expect(byLabel.Mer.label).toBe('Mer : 6 verres');
    expect(byLabel.Jeu.label).toBe('Jeu : 4 verres');
    expect(byLabel.Ven.label).toBe('Ven : aucun relevé');
    expect(byLabel.Sam.label).toBe('Sam : aucun relevé');
    expect(byLabel.Dim.label).toBe('Dim : aucun relevé');
    ['Lun', 'Mer', 'Jeu'].forEach(day => expect(byLabel[day].barCount).toBe(1));
    ['Mar', 'Ven', 'Sam', 'Dim'].forEach(day => expect(byLabel[day].barCount).toBe(0));
    expect(allTexts(renderer)).toContain('0 / 8 verres');
    expect(allTexts(renderer)).not.toContain('Aucun verre enregistré cette semaine pour l’instant.');
  });

  it('adding a glass counts from 0, persists it and draws today’s bar', async () => {
    const renderer = await renderScreen();
    const add = renderer.root.find(
      node => node.props.accessibilityLabel === 'Ajouter un verre' && typeof node.props.onPress === 'function',
    );

    await act(async () => {
      add.props.onPress();
    });
    for (let index = 0; index < 4; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(allTexts(renderer)).toContain('1 / 8 verres');
    expect(chartColumns(renderer).find(column => column.label === 'Ven : 1 verre')?.barCount).toBe(1);
    const saved = await getJournalEntry(key(4));
    expect(saved?.hydration).toMatchObject({glasses: 1, goalGlasses: 8, milliliters: 250});
  });
});
