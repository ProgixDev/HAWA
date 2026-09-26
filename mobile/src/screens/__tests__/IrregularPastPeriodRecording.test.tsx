import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import IrregularJournalEntryScreen from '../IrregularJournalEntryScreen';
import IrregularCalendarContent from '../../components/irregular/IrregularCalendarContent';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {getIrregularJournalEntry, getAllIrregularJournalEntries, hydrateIrregularJournal} from '../../state/irregularJournalStore';
import {getAllJournalEntries, getJournalEntry} from '../../state/dailyJournalStore';
import {
  classifyIrregularPeriodDay,
  collectActualPeriodDayKeys,
  deriveIrregularPeriodEpisodes,
  resolveLatestIrregularPeriodStart,
} from '../../utils/irregularJournalSelectors';
import {diffDays} from '../../utils/cycleMath';

// H11 — SOPK can record / correct a PAST period from the Calendar selected
// day. Today is pinned to 2026-09-26.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const TODAY = '2026-09-26';

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function renderPeriodEntry(date?: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category: 'period', date}} name="IrregularJournalEntry">
                {() => <IrregularJournalEntryScreen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('IrregularJournalEntry');
  });
  await settle();
  return renderer;
}

const optionByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityRole === 'string' &&
      node.findAllByType(Text).some(text => textOf(text) === label),
  );
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    optionByLabel(renderer, label).props.onPress();
  });
};
const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  await act(async () => {
    await optionByLabel(renderer, 'Enregistrer mes règles').props.onPress();
  });
  await settle();
};
const unmountAll = () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
};
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);

const record = async (date: string, status: 'Oui' | 'Non' | 'Spotting', flow?: string) => {
  const renderer = await renderPeriodEntry(date);
  await press(renderer, status);
  if (flow) {
    await press(renderer, flow);
  }
  await pressSave(renderer);
  unmountAll();
};

const periodSources = async () => {
  await hydrateIrregularJournal();
  const journal = await getAllJournalEntries();
  return {
    periodDayKeys: collectActualPeriodDayKeys(journal, getAllIrregularJournalEntries()),
    confirmedHistory: [],
    declaredLastPeriodDate: null,
  };
};

beforeEach(() => {
  resetPremiumStateForTests();
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
});
afterEach(() => {
  unmountAll();
  jest.useRealTimers();
});

describe('SOPK - record a past period day', () => {
  it('writes the flow to the SELECTED day (Sept 23), not to today, and it becomes the latest start (cycle day 4)', async () => {
    await record('2026-09-23', 'Oui', 'Modérée');

    const shared = await getJournalEntry('2026-09-23');
    expect(shared?.flow?.intensity).toBe('moderate');
    expect(getIrregularJournalEntry('2026-09-23')?.details?.period?.status).toBe('yes');
    // Today untouched.
    expect(await getJournalEntry(TODAY)).toBeUndefined();
    expect(getIrregularJournalEntry(TODAY)).toBeUndefined();

    const sources = await periodSources();
    const latest = resolveLatestIrregularPeriodStart(sources, TODAY);
    expect(latest).toBe('2026-09-23');
    expect(diffDays(new Date(2026, 8, 26), new Date(`${latest}T12:00:00`)) + 1).toBe(4);
  });

  it('Spotting on Sept 22 and Non on Sept 21 are recorded distinctly and are NOT period starts', async () => {
    await record('2026-09-22', 'Spotting', 'Légère');
    await record('2026-09-21', 'Non');

    const spotting = getIrregularJournalEntry('2026-09-22');
    expect(classifyIrregularPeriodDay((await getJournalEntry('2026-09-22'))?.flow, spotting)).toBe('spotting');
    const no = getIrregularJournalEntry('2026-09-21');
    expect(classifyIrregularPeriodDay((await getJournalEntry('2026-09-21'))?.flow, no)).toBe('no-bleeding');

    // (The period store is a module singleton shared by this file's tests, so
    // assert on THESE days rather than on the whole list.)
    const sources = await periodSources();
    expect(sources.periodDayKeys).not.toContain('2026-09-22');
    expect(sources.periodDayKeys).not.toContain('2026-09-21');
    expect(resolveLatestIrregularPeriodStart(sources, '2026-09-22')).toBeNull();
  });

  it('consecutive recorded days stay ONE period (start Sept 23) and other days are not rewritten', async () => {
    await record('2026-09-23', 'Oui', 'Forte');
    await record('2026-09-24', 'Oui', 'Modérée');
    // Correct the first day only.
    await record('2026-09-23', 'Oui', 'Légère');

    expect((await getJournalEntry('2026-09-23'))?.flow?.intensity).toBe('light');
    expect((await getJournalEntry('2026-09-24'))?.flow?.intensity).toBe('moderate');
    const sources = await periodSources();
    expect(sources.periodDayKeys).toEqual(expect.arrayContaining(['2026-09-23', '2026-09-24']));
    expect(deriveIrregularPeriodEpisodes(sources.periodDayKeys).map(e => e.start)).toContain('2026-09-23');
    expect(deriveIrregularPeriodEpisodes(sources.periodDayKeys).map(e => e.start)).not.toContain('2026-09-24');
  });

  it('the day-of entry (no date param) still works and is unaffected by a past recording', async () => {
    await record('2026-09-20', 'Oui', 'Légère');
    const renderer = await renderPeriodEntry(undefined);
    await press(renderer, 'Oui');
    await press(renderer, 'Forte');
    await pressSave(renderer);
    expect((await getJournalEntry(TODAY))?.flow?.intensity).toBe('heavy');
    expect((await getJournalEntry('2026-09-20'))?.flow?.intensity).toBe('light');
  });

  it('a FUTURE date is rejected and nothing is written', async () => {
    const renderer = await renderPeriodEntry('2026-09-27');
    await press(renderer, 'Oui');
    await press(renderer, 'Forte');
    await pressSave(renderer);
    expect(allTexts(renderer)).toContain('Tu ne peux pas enregistrer un suivi pour une date à venir.');
    expect(getIrregularJournalEntry('2026-09-27')).toBeUndefined();
    expect(await getJournalEntry('2026-09-27')).toBeUndefined();
  });

  it('the screen names the day being recorded (past day wording)', async () => {
    const renderer = await renderPeriodEntry('2026-09-23');
    const texts = allTexts(renderer);
    expect(texts).toContain('As-tu eu tes règles ce jour-là ?');
    expect(texts.some(text => /23 septembre 2026/i.test(text))).toBe(true);
  });
});

describe('SOPK Calendar - entry point for a past selected day', () => {
  const calendarLabels = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root
      .findAll(node => typeof node.props.accessibilityLabel === 'string' && typeof node.props.onPress === 'function')
      .map(node => node.props.accessibilityLabel as string);

  const renderCalendar = async () => {
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
    await settle();
    return renderer;
  };

  it('is NOT offered for today or a future day; IS offered for a past day', async () => {
    const renderer = await renderCalendar();
    expect(calendarLabels(renderer).filter(label => /les règles de ce jour/.test(label))).toEqual([]);

    const cell = (day: number) =>
      renderer.root.findAll(
        node =>
          typeof node.props.onPress === 'function' &&
          typeof node.props.accessibilityLabel === 'string' &&
          new RegExp(`^${day}(,|$)`).test(node.props.accessibilityLabel),
      )[0];
    await act(async () => {
      cell(27).props.onPress();
    });
    expect(calendarLabels(renderer).filter(label => /les règles de ce jour/.test(label))).toEqual([]);
    await act(async () => {
      cell(23).props.onPress();
    });
    // "Modifier…" when that day already has a period answer (recorded by the
    // earlier tests of this file), "Renseigner…" otherwise.
    expect(calendarLabels(renderer).filter(label => /les règles de ce jour/.test(label)).length).toBeGreaterThan(0);
  });
});
