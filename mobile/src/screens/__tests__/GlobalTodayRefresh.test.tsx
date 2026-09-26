import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState, type AppStateStatus} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import MiscarriageStatisticsScreen from '../miscarriage/MiscarriageStatisticsScreen';
import PostpartumStatisticsScreen from '../postpartum/PostpartumStatisticsScreen';
import JournalMoodScreen from '../journal/JournalMoodScreen';
import PregnancySymptomsScreen from '../pregnancy/PregnancySymptomsScreen';
import PregnancyMedicalInformationScreen from '../pregnancy/PregnancyMedicalInformationScreen';
import MenopauseCalendarContent from '../../components/menopause/MenopauseCalendarContent';
import {setMiscarriageDate} from '../../state/miscarriagePreferences';
import {confirmDelivery} from '../../state/postpartumPreferences';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {savePregnancySymptoms} from '../../state/pregnancyJournalStore';

jest.mock('../../state/dailyJournalStore', () => ({
  ...jest.requireActual('../../state/dailyJournalStore'),
  saveJournalSection: jest.fn(async () => undefined),
}));

jest.mock('../../state/pregnancyJournalStore', () => ({
  ...jest.requireActual('../../state/pregnancyJournalStore'),
  savePregnancySymptoms: jest.fn(async () => undefined),
}));

const mockSaveJournalSection = saveJournalSection as jest.Mock;
const mockSavePregnancySymptoms = savePregnancySymptoms as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

let appStateListener: ((state: AppStateStatus) => void) | undefined;

async function renderScreen(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

/** The `value` prop of the KpiCard whose `label` is `label`. */
const kpiValue = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): unknown =>
  renderer.root.findAll(node => node.props.label === label && node.props.value !== undefined)[0]?.props.value;

beforeEach(() => {
  jest.useFakeTimers();
  mockSaveJournalSection.mockClear();
  mockSavePregnancySymptoms.mockClear();
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, listener: (state: AppStateStatus) => void) => {
    appStateListener = listener;
    return {remove: jest.fn()};
  }) as never);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Statistics screens — day-dependent values follow the new day', () => {
  it('MIDNIGHT (Miscarriage): "jours depuis l’événement" goes 5 → 6 at 00:00 without reopening the screen', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    await setMiscarriageDate(new Date(2026, 8, 20));
    const renderer = await renderScreen(<MiscarriageStatisticsScreen />);
    expect(kpiValue(renderer, 'Jours depuis l’événement')).toBe('5');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(kpiValue(renderer, 'Jours depuis l’événement')).toBe('6');
  });

  it('FOREGROUND (Postpartum): the postpartum day is recalculated when the app returns the next day', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 21, 0, 0));
    await confirmDelivery(new Date(2026, 8, 20));
    const renderer = await renderScreen(<PostpartumStatisticsScreen />);
    expect(kpiValue(renderer, 'Jours post-partum')).toBe('6');

    // Timers are frozen while backgrounded: the clock jumps, nothing fires.
    jest.setSystemTime(new Date(2026, 8, 26, 8, 0, 0));
    expect(kpiValue(renderer, 'Jours post-partum')).toBe('6');

    await act(async () => {
      appStateListener?.('active');
    });

    expect(kpiValue(renderer, 'Jours post-partum')).toBe('7');
  });

  it('SAME DAY: returning to the foreground changes nothing', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));
    await confirmDelivery(new Date(2026, 8, 20));
    const renderer = await renderScreen(<PostpartumStatisticsScreen />);
    const before = renderer.toJSON();

    await act(async () => {
      appStateListener?.('active');
    });

    expect(kpiValue(renderer, 'Jours post-partum')).toBe('6');
    expect(renderer.toJSON()).toEqual(before);
  });
});

describe('Journal screens — "save today\'s entry" always uses the CURRENT day', () => {
  it('a Mood journal opened before midnight saves under the NEW day, never yesterday', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 58, 0));
    const renderer = await renderScreen(<JournalMoodScreen />);

    await act(async () => {
      jest.setSystemTime(new Date(2026, 8, 26, 0, 2, 0));
      jest.advanceTimersByTime(5 * 60_000);
    });

    const save = renderer.root.findAll(
      node => node.props.accessibilityLabel === "Enregistrer l'humeur" && typeof node.props.onPress === 'function',
    )[0];
    await act(async () => {
      await save.props.onPress();
    });

    expect(mockSaveJournalSection).toHaveBeenCalledTimes(1);
    expect(mockSaveJournalSection.mock.calls[0][0]).toBe('2026-09-26');
    expect(mockSaveJournalSection.mock.calls[0][0]).not.toBe('2026-09-25');
  });

  it('a Pregnancy journal that froze its day at mount now saves under the NEW day too', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 58, 0));
    const renderer = await renderScreen(<PregnancySymptomsScreen />);

    const controls = ['Retour', 'Enregistrer les symptômes', 'Enregistrer mes symptômes', 'Notes supplémentaires'];
    const symptom = renderer.root.findAll(
      node =>
        typeof node.props.accessibilityLabel === 'string' &&
        !controls.includes(node.props.accessibilityLabel) &&
        typeof node.props.onPress === 'function',
    )[0];
    await act(async () => {
      symptom.props.onPress();
    });

    await act(async () => {
      jest.setSystemTime(new Date(2026, 8, 26, 0, 3, 0));
      jest.advanceTimersByTime(5 * 60_000);
    });

    const save = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Enregistrer mes symptômes' && typeof node.props.onPress === 'function',
    )[0];
    await act(async () => {
      await save.props.onPress();
    });

    expect(mockSavePregnancySymptoms).toHaveBeenCalledTimes(1);
    expect(mockSavePregnancySymptoms.mock.calls[0][0].date).toBe('2026-09-26');
  });

  it('the visible date label of the journal follows the new day', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderScreen(<JournalMoodScreen />);
    expect(textsOf(renderer).some(text => text.includes('25 sept'))).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(textsOf(renderer).some(text => text.includes('26 sept'))).toBe(true);
    expect(textsOf(renderer).some(text => text.includes('25 sept'))).toBe(false);
  });
});

describe('Calendar screens — selection across midnight', () => {
  const dayCell = (renderer: ReactTestRenderer.ReactTestRenderer, dayOfMonth: number) =>
    renderer.root.findAll(
      node =>
        typeof node.props.onPress === 'function' &&
        node.findAll(child => (child.type as unknown) === 'Text' && child.props.children === dayOfMonth).length > 0,
    );

  it('the default selected day follows today to the new day', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderScreen(<MenopauseCalendarContent />);
    expect(textsOf(renderer).join('|')).toContain('25 septembre');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    const texts = textsOf(renderer).join('|');
    expect(texts).toContain('26 septembre');
  });

  it('a date the user picked is NOT moved by midnight', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderScreen(<MenopauseCalendarContent />);

    const cell = dayCell(renderer, 10)[0];
    expect(cell).toBeTruthy();
    await act(async () => {
      cell.props.onPress();
    });
    expect(textsOf(renderer).join('|')).toContain('10 septembre');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    const texts = textsOf(renderer).join('|');
    expect(texts).toContain('10 septembre');
    expect(texts).not.toContain('26 septembre 2026');
  });
});

describe('Historical dates are never moved by midnight (Pregnancy medical information)', () => {
  const pressByText = async (renderer: ReactTestRenderer.ReactTestRenderer, text: string | number) => {
    const target = renderer.root.findAll(
      node =>
        typeof node.props.onPress === 'function' &&
        node.findAll(child => (child.type as unknown) === 'Text' && child.props.children === text).length > 0,
    )[0];
    expect(target).toBeTruthy();
    await act(async () => {
      target.props.onPress();
    });
  };

  it('a reference date that was FOLLOWING today moves to the new day', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderScreen(<PregnancyMedicalInformationScreen />);
    expect(textsOf(renderer).join('|')).toContain('25 septembre');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(textsOf(renderer).join('|')).toContain('26 septembre');
  });

  it('a historical date the user picked stays selected across midnight', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    const renderer = await renderScreen(<PregnancyMedicalInformationScreen />);

    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Choisir la date de l’information')[0].props.onPress();
    });
    await pressByText(renderer, 10);
    await pressByText(renderer, 'Choisir');
    expect(textsOf(renderer).join('|')).toContain('10 septembre');

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    const texts = textsOf(renderer).join('|');
    expect(texts).toContain('10 septembre');
    expect(texts).not.toContain('26 septembre');
  });
});
