import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import IrregularCalendarContent from '../IrregularCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {saveIrregularJournalField} from '../../../state/irregularJournalStore';

// M21 - the SOPK Calendar offers the other tracking categories (acne, hair,
// weight, pain, mood, fatigue) for a PAST selected day only; each shortcut
// opens the entry screen with that day's `date`.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const navigateSpy = jest.fn();

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
                <Stack.Screen name="IrregularJournalEntry">
                  {({route}) => {
                    navigateSpy(route.params);
                    return null;
                  }}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
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

const labels = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAll(node => typeof node.props.accessibilityLabel === 'string' && typeof node.props.onPress === 'function')
    .map(node => node.props.accessibilityLabel as string);

const cell = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) =>
  renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      new RegExp(`^${day}(,|$)`).test(node.props.accessibilityLabel),
  )[0];

beforeEach(() => {
  resetPremiumStateForTests();
  navigateSpy.mockClear();
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 15, 0, 0)});
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('IrregularCalendarContent - past day category shortcuts (M21)', () => {
  it('not offered for today or a future day', async () => {
    const renderer = await renderCalendar();
    expect(labels(renderer).filter(label => /de ce jour$/.test(label) && !/règles/.test(label))).toEqual([]);
    await act(async () => {
      cell(renderer, 27).props.onPress();
    });
    expect(labels(renderer).filter(label => /de ce jour$/.test(label) && !/règles/.test(label))).toEqual([]);
  });

  it('past day: Renseigner / Modifier per category, opening the entry screen with the day', async () => {
    await saveIrregularJournalField('2026-09-23', 'acne', 'Légère');
    const renderer = await renderCalendar();
    await act(async () => {
      cell(renderer, 23).props.onPress();
    });

    const shortcuts = labels(renderer).filter(label => /de ce jour$/.test(label) && !/règles/.test(label));
    expect(shortcuts).toEqual(
      expect.arrayContaining([
        'Modifier Acné de ce jour',
        'Renseigner Pilosité de ce jour',
        'Renseigner Poids de ce jour',
        'Renseigner Douleurs de ce jour',
        'Renseigner Humeur de ce jour',
        'Renseigner Fatigue & symptômes de ce jour',
      ]),
    );

    const pain = renderer.root.find(node => node.props.accessibilityLabel === 'Renseigner Douleurs de ce jour');
    await act(async () => {
      pain.props.onPress();
    });
    expect(navigateSpy).toHaveBeenCalledWith(expect.objectContaining({category: 'pain', date: '2026-09-23'}));
  });
});
