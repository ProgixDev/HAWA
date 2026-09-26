import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PostpartumLochiaScreen from '../PostpartumLochiaScreen';
import PostpartumCycleReturnScreen from '../PostpartumCycleReturnScreen';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {
  clearFirstPostpartumPeriod,
  confirmDelivery,
  getPostpartumPreferences,
  recordFirstPostpartumPeriod,
} from '../../state/postpartumPreferences';
import {
  getPostpartumLochiaTracking,
  markPostpartumLochiaEnded,
  reopenPostpartumLochiaTracking,
} from '../../state/postpartumLochiaStore';

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
const hasText = (renderer: ReactTestRenderer.ReactTestRenderer, fragment: string) =>
  textsOf(renderer).some(text => text.includes(fragment));

const button = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  return matches[0];
};
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await button(renderer, label).props.onPress();
  });
  await settle();
};
const hasButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  ).length > 0;

const dayCell = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === `${day} septembre`,
  );
  if (matches.length === 0) {throw new Error(`No day ${day}`);}
  return matches[0];
};
const pickDay = async (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  await act(async () => {
    dayCell(renderer, day).props.onPress();
  });
  await settle();
};
/** Bypasses the disabled days of the picker to prove the save-time validation on its own. */
const forceSelect = async (renderer: ReactTestRenderer.ReactTestRenderer, date: Date) => {
  await act(async () => {
    const picker = renderer.root.findByType(InlineCalendarPickerModal);
    picker.props.onSelect(date);
    picker.props.onClose();
  });
  await settle();
};

const mount = async (element: React.ReactElement) => {
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
  await settle();
  return renderer;
};

const renderLochia = () => {
  const navigate = jest.fn();
  return mount(
    <PostpartumLochiaScreen
      navigation={{navigate, goBack: jest.fn()} as never}
      route={{key: 'l', name: 'PostpartumLochia'} as never}
    />,
  ).then(renderer => ({renderer, navigate}));
};
const renderCycleReturn = () =>
  mount(
    <PostpartumCycleReturnScreen
      navigation={{navigate: jest.fn(), goBack: jest.fn()} as never}
      route={{key: 'c', name: 'PostpartumCycleReturn'} as never}
    />,
  );

beforeAll(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(async () => {
  await confirmDelivery(new Date(2026, 8, 1)); // September 1
  await clearFirstPostpartumPeriod();
  await reopenPostpartumLochiaTracking();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('H13 — choosing the end date when marking the lochia as ended', () => {
  it('defaults to today and the confirmation names that day', async () => {
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    expect(hasText(renderer, '26 septembre 2026')).toBe(true);
    await press(renderer, 'Confirmer');
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-26');
  });

  it('an earlier day picked in the calendar is what gets stored (not today)', async () => {
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    await press(renderer, 'Modifier la date');
    await pickDay(renderer, 10);

    // back on the confirmation, now naming the chosen day
    expect(hasText(renderer, '10 septembre 2026')).toBe(true);
    await press(renderer, 'Confirmer');

    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
    expect(hasText(renderer, 'Terminées le')).toBe(true);
    expect(textsOf(renderer)).toContain('10 jours'); // Sept 1 -> Sept 10
  });

  it('cancelling the calendar keeps the default day; cancelling the confirmation stores nothing', async () => {
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    await press(renderer, 'Annuler');
    expect(getPostpartumLochiaTracking().endedDate).toBeNull();
  });

  it('the picker greys days after today and before the delivery date', async () => {
    await confirmDelivery(new Date(2026, 8, 5));
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    await press(renderer, 'Modifier la date');
    expect(dayCell(renderer, 27).props.disabled).toBe(true);
    expect(dayCell(renderer, 26).props.disabled).toBe(false);
    expect(dayCell(renderer, 4).props.disabled).toBe(true);
    expect(dayCell(renderer, 5).props.disabled).toBe(false);
  });

  it('an end date BEFORE the delivery date is rejected with a message; nothing stored', async () => {
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    await press(renderer, 'Modifier la date');
    await forceSelect(renderer, new Date(2026, 7, 30));
    await press(renderer, 'Confirmer');

    expect(hasText(renderer, 'ne peut pas précéder ta date d’accouchement')).toBe(true);
    expect(getPostpartumLochiaTracking().endedDate).toBeNull();
  });

  it('an end date AFTER today is rejected with a message; nothing stored', async () => {
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    await press(renderer, 'Modifier la date');
    await forceSelect(renderer, new Date(2026, 8, 28));
    await press(renderer, 'Confirmer');

    expect(hasText(renderer, 'ne peut pas être dans le futur')).toBe(true);
    expect(getPostpartumLochiaTracking().endedDate).toBeNull();
  });

  it('an end date AFTER an existing first period is rejected; the first-period date is untouched', async () => {
    await recordFirstPostpartumPeriod(new Date(2026, 8, 12));
    const {renderer} = await renderLochia();
    await press(renderer, 'Mes lochies sont terminées');
    await press(renderer, 'Modifier la date');
    await pickDay(renderer, 20);
    await press(renderer, 'Confirmer');

    expect(hasText(renderer, 'postérieure à la date de reprise des règles')).toBe(true);
    expect(getPostpartumLochiaTracking().endedDate).toBeNull();
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBe('2026-09-12');

    // the same day as the first period is fine
    await press(renderer, 'Modifier la date'); // "Date à vérifier" -> retry: back to the confirmation
    await press(renderer, 'Modifier la date');
    await pickDay(renderer, 12);
    await press(renderer, 'Confirmer');
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-12');
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBe('2026-09-12');
  });
});

describe('H13 — correcting an existing end date', () => {
  it('"Modifier la date de fin" is offered only once ended and reuses the same picker', async () => {
    const {renderer} = await renderLochia();
    expect(hasButton(renderer, 'Modifier la date de fin')).toBe(false);

    await act(async () => {
      await markPostpartumLochiaEnded('2026-09-26');
    });
    await settle();
    expect(hasButton(renderer, 'Modifier la date de fin')).toBe(true);
    expect(hasButton(renderer, 'Reprendre le suivi')).toBe(true);
  });

  it('ended today -> corrected to Sept 10: stored, duration recomputed, still ended', async () => {
    await markPostpartumLochiaEnded('2026-09-26');
    const {renderer} = await renderLochia();
    await press(renderer, 'Modifier la date de fin');
    await pickDay(renderer, 10);

    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
    expect(textsOf(renderer)).toContain('10 jours');
    expect(hasButton(renderer, 'Modifier la date de fin')).toBe(true);
  });

  it('a correction after an existing first period is refused; both dates keep their values', async () => {
    await recordFirstPostpartumPeriod(new Date(2026, 8, 12));
    await markPostpartumLochiaEnded('2026-09-10');
    const {renderer} = await renderLochia();
    await press(renderer, 'Modifier la date de fin');
    await pickDay(renderer, 15);

    expect(hasText(renderer, 'postérieure à la date de reprise des règles')).toBe(true);
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBe('2026-09-12');
  });

  it('a correction before the delivery date is refused; the end date is unchanged', async () => {
    await markPostpartumLochiaEnded('2026-09-10');
    const {renderer} = await renderLochia();
    await press(renderer, 'Modifier la date de fin');
    await forceSelect(renderer, new Date(2026, 7, 30));

    expect(hasText(renderer, 'ne peut pas précéder ta date d’accouchement')).toBe(true);
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
  });
});

describe('H13 — correcting the end date unblocks an earlier first period', () => {
  it('period Sept 15 is refused while the lochia end is today (Sept 26), then accepted once the end is corrected to Sept 10', async () => {
    await markPostpartumLochiaEnded('2026-09-26');

    // 1. previously: refused ("Date à vérifier"), nothing recorded
    let cycle = await renderCycleReturn();
    await act(async () => {
      cycle.root.findByType(InlineCalendarPickerModal).props.onSelect(new Date(2026, 8, 15, 12));
    });
    await settle();
    expect(hasText(cycle, 'antérieure à la date de fin enregistrée des lochies')).toBe(true);
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBeNull();
    act(() => {
      activeRenderers.splice(0).forEach(renderer => renderer.unmount());
    });

    // 2. the user corrects the lochia end date
    const {renderer: lochia} = await renderLochia();
    await press(lochia, 'Modifier la date de fin');
    await pickDay(lochia, 10);
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
    act(() => {
      activeRenderers.splice(0).forEach(renderer => renderer.unmount());
    });

    // 3. the same first period is now accepted
    cycle = await renderCycleReturn();
    await act(async () => {
      cycle.root.findByType(InlineCalendarPickerModal).props.onSelect(new Date(2026, 8, 15, 12));
    });
    await settle();
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBe('2026-09-15');
  });
});

describe('H13 — reopening keeps its semantics', () => {
  it('without a first period: confirmation modal, then the end date is removed', async () => {
    await markPostpartumLochiaEnded('2026-09-10');
    const {renderer} = await renderLochia();
    await press(renderer, 'Reprendre le suivi');
    expect(hasText(renderer, 'La date de fin des lochies sera retirée')).toBe(true);
    await press(renderer, 'Reprendre');
    expect(getPostpartumLochiaTracking().endedDate).toBeNull();
  });

  it('with a first period: blocked by the consistency modal, end date untouched', async () => {
    await recordFirstPostpartumPeriod(new Date(2026, 8, 12));
    await markPostpartumLochiaEnded('2026-09-10');
    const {renderer, navigate} = await renderLochia();
    await press(renderer, 'Reprendre le suivi');

    expect(hasText(renderer, 'Une reprise du cycle est déjà enregistrée')).toBe(true);
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
    await press(renderer, 'Voir le retour du cycle');
    expect(navigate).toHaveBeenCalledWith('PostpartumCycleReturn');
    expect(getPostpartumLochiaTracking().endedDate).toBe('2026-09-10');
    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBe('2026-09-12');
  });
});
