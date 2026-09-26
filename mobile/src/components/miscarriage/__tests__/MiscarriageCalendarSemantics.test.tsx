import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import MiscarriageCalendarContent from '../MiscarriageCalendarContent';
import {getMiscarriagePreferences, setMiscarriagePreferences} from '../../../state/miscarriagePreferences';
import {saveMiscarriageJournalField} from '../../../state/miscarriageJournalStore';

// M35 — the Loss Calendar never attaches the GLOBAL, UNDATED
// miscarriagePreferences.tryingAgainStatus to arbitrary days; only a real
// DATED value (the day's own journal entry) is shown. M21 — past-day launch
// buttons. M36 — a legacy invalid cycle-return date is not a calendar event.
// Clock pinned to 2026-09-26; the journal store persists inside this file, so
// each test writes its own distinct days.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

async function renderCalendar() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={MiscarriageCalendarContent as unknown as React.ComponentType} name="Home" />
                <Stack.Screen name="MiscarriageJournalEntry">{() => <Text>stub-entry</Text>}</Stack.Screen>
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
}

const selectDay = async (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith(`${day} Septembre 2026`),
  );
  if (matches.length === 0) {throw new Error(`No day ${day}`);}
  await act(async () => {
    matches[0].props.onPress();
  });
  await settle();
};

const pastButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label,
  );

const seed = (overrides: Partial<ReturnType<typeof getMiscarriagePreferences>> = {}) =>
  setMiscarriagePreferences({
    miscarriageDate: '2026-09-10',
    bleedingStatus: 'yes',
    cycleReturnStatus: 'no',
    firstReturnedPeriodDate: null,
    tryingAgainStatus: null,
    dailyTrackingReminderEnabled: false,
    dailyTrackingReminderTime: null,
    ...overrides,
  });

beforeAll(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(async () => {
  resetPremiumStateForTests();
  await seed();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

// Values that only the day card (never the legend / filters) can render.
const TRYING_VALUES = ['Prête à reprendre', 'Pas pour le moment'];
const hasTryingValue = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  textsOf(renderer).some(text => TRYING_VALUES.includes(text));

describe('M35 — "Reprise des essais" is a dated value on the Loss Calendar, never a global row on every day', () => {
  it('no trying-again value at all: no row on any day', async () => {
    const renderer = await renderCalendar();
    expect(hasTryingValue(renderer)).toBe(false);
    await selectDay(renderer, 15);
    expect(hasTryingValue(renderer)).toBe(false);
    expect(textsOf(renderer)).toContain('Aucune information enregistrée pour cette journée.');
  });

  it('a GLOBAL undated status ("ready") is not attached to today nor to any arbitrary day', async () => {
    await seed({tryingAgainStatus: 'ready'});
    const renderer = await renderCalendar();
    expect(hasTryingValue(renderer)).toBe(false); // today (selected by default)
    await selectDay(renderer, 12);
    expect(hasTryingValue(renderer)).toBe(false);
    await selectDay(renderer, 20);
    expect(hasTryingValue(renderer)).toBe(false);
    expect(textsOf(renderer)).toContain('Aucune information enregistrée pour cette journée.');
  });

  it('a REAL dated value (that day journal entry) is shown on that day only', async () => {
    await seed({tryingAgainStatus: 'not_now'});
    await saveMiscarriageJournalField('2026-09-14', 'tryingAgain', 'ready');
    const renderer = await renderCalendar();

    await selectDay(renderer, 14);
    expect(textsOf(renderer)).toContain('Prête à reprendre');

    await selectDay(renderer, 15);
    expect(hasTryingValue(renderer)).toBe(false);
  });

  it('the filter/legend wording describes the dated journal answer, not a global status', async () => {
    const renderer = await renderCalendar();
    await act(async () => {
      renderer.root
        .findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === 'Filtres')[0]
        .props.onPress();
    });
    await settle();
    expect(textsOf(renderer).some(text => text.includes('enregistrée dans ton journal ce jour-là'))).toBe(true);
  });
});

describe('M36 — the Calendar does not treat a legacy invalid cycle-return date as an event', () => {
  it('valid date: badge on that day and the plain status', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    const renderer = await renderCalendar();
    await selectDay(renderer, 15);
    expect(textsOf(renderer)).toContain('Retour des règles');
    expect(textsOf(renderer)).toContain('Règles revenues');
  });

  it('future legacy date: flagged "date à vérifier", no event badge, value left untouched', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-28'});
    const renderer = await renderCalendar();
    await selectDay(renderer, 28);
    expect(textsOf(renderer)).not.toContain('Retour des règles');
    expect(textsOf(renderer)).toContain('Règles revenues · date à vérifier');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-28');
  });
});

describe('M21 — past-day entry buttons (Saignements / Symptômes physiques only)', () => {
  it('shown for a past day on/after the loss date; pressing opens the entry screen with that date', async () => {
    const renderer = await renderCalendar();
    await selectDay(renderer, 18);
    const add = pastButton(renderer, 'Ajouter : Saignements de cette journée');
    expect(add.length).toBeGreaterThan(0);
    expect(pastButton(renderer, 'Ajouter : Symptômes physiques de cette journée').length).toBeGreaterThan(0);
    // Notes personnelles / Reprise des essais stay today-only: no button for them.
    expect(pastButton(renderer, 'Ajouter : Notes personnelles de cette journée')).toHaveLength(0);
    expect(pastButton(renderer, 'Ajouter : Reprise des essais de cette journée')).toHaveLength(0);

    await act(async () => {
      add[0].props.onPress();
    });
    await settle();
    const route = navRef.getCurrentRoute() as unknown as {name: string; params?: unknown};
    expect(route.name).toBe('MiscarriageJournalEntry');
    expect(route.params).toEqual({category: 'bleeding', date: '2026-09-18'});
  });

  it('a filled past day offers "Modifier"', async () => {
    await saveMiscarriageJournalField('2026-09-19', 'bleeding', 'Léger');
    const renderer = await renderCalendar();
    await selectDay(renderer, 19);
    expect(pastButton(renderer, 'Modifier : Saignements de cette journée').length).toBeGreaterThan(0);
    expect(pastButton(renderer, 'Ajouter : Symptômes physiques de cette journée').length).toBeGreaterThan(0);
  });

  it('never for today, a future day, or a day before the loss date', async () => {
    const renderer = await renderCalendar();
    await selectDay(renderer, 26); // today
    expect(pastButton(renderer, 'Ajouter : Saignements de cette journée')).toHaveLength(0);
    await selectDay(renderer, 28); // future
    expect(pastButton(renderer, 'Ajouter : Saignements de cette journée')).toHaveLength(0);
    await selectDay(renderer, 5); // before the loss (Sept 10)
    expect(pastButton(renderer, 'Ajouter : Saignements de cette journée')).toHaveLength(0);
  });
});
