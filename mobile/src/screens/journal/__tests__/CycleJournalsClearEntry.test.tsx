import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../JournalMoodScreen';
import JournalSymptomsScreen from '../JournalSymptomsScreen';
import JournalSleepScreen from '../JournalSleepScreen';
import JournalActivityScreen from '../JournalActivityScreen';
import JournalNoteScreen from '../JournalNoteScreen';
import JournalIntimacyScreen from '../JournalIntimacyScreen';
import HydrationScreen from '../HydrationScreen';
import JournalConceptionReportsScreen from '../JournalConceptionReportsScreen';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {encryptIntimacySection} from '../../../services/privateJournalEncryption';
import {encryptNoteSection} from '../../../services/privateNotesEncryption';

// M25 - a saved Cycle / Conceive journal value can be cleared: the shared
// "Effacer cette saisie" action (components/journal/ClearEntryButton) removes
// that section from today's entry (section absent = the canonical empty
// state), leaves every other section of the day untouched, and reopening
// shows the cleared state. Real screens, real stores (in-memory AsyncStorage/
// Keychain mocks, so the at-rest encryption of Notes / Vie intime really runs).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

// Module-singleton stores persist between tests of one file, so every test
// runs on its own calendar day (the screens read "today" from useToday()).
let testIndex = 0;
let now = new Date();
const todayKey = () => now.toLocaleDateString('en-CA');

const settle = async () => {
  for (let index = 0; index < 30; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                {/* Some journal screens (Rapports) take react-navigation props. */}
                <Stack.Screen name="Test">{props => React.cloneElement(element, props as never)}</Stack.Screen>
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

const leave = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  act(() => {
    renderer.unmount();
  });
  const index = activeRenderers.indexOf(renderer);
  if (index >= 0) {
    activeRenderers.splice(index, 1);
  }
};

const clearButton = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Effacer cette saisie');

beforeEach(async () => {
  testIndex += 1;
  now = new Date(2026, 8 + Math.floor(testIndex / 28), 1 + (testIndex % 28), 15, 0, 0);
  jest.useFakeTimers({advanceTimers: true, now});
  await setActiveObjective('cycle');
  unlockIntimacy();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

type Case = {
  name: string;
  render: () => React.JSX.Element;
  section: 'mood' | 'symptoms' | 'sleep' | 'activity' | 'encryptedNote' | 'encryptedIntimacy' | 'hydration';
  seed: () => Promise<void>;
};

const CASES: Case[] = [
  {
    name: 'Humeur',
    render: () => <JournalMoodScreen />,
    section: 'mood',
    seed: () => saveJournalSection(todayKey(), 'mood', {level: 'sad', energy: 2, stress: 5, irritability: 1, motivation: 1, note: ''}),
  },
  {
    name: 'Symptômes',
    render: () => <JournalSymptomsScreen />,
    section: 'symptoms',
    seed: () => saveJournalSection(todayKey(), 'symptoms', {names: ['Migraines'], severity: 'moderate', painLocation: 'Dos', note: ''}),
  },
  {
    name: 'Sommeil',
    render: () => <JournalSleepScreen />,
    section: 'sleep',
    seed: () => saveJournalSection(todayKey(), 'sleep', {bedtime: '23:00', wakeTime: '07:00', quality: 'Bonne', awakenings: 1, wakeFeeling: 'Reposée', note: ''}),
  },
  {
    name: 'Activité',
    render: () => <JournalActivityScreen />,
    section: 'activity',
    seed: () => saveJournalSection(todayKey(), 'activity', {type: 'Marche', durationMinutes: 30, intensity: 'Élevée', feeling: 'Très bien', note: ''}),
  },
  {
    name: 'Notes personnelles',
    render: () => <JournalNoteScreen />,
    section: 'encryptedNote',
    seed: async () => {
      await saveJournalSection(todayKey(), 'encryptedNote', await encryptNoteSection({text: 'Une note', updatedAt: now.toISOString()}));
    },
  },
  {
    name: 'Vie intime (Cycle)',
    render: () => <JournalIntimacyScreen />,
    section: 'encryptedIntimacy',
    seed: async () => {
      await saveJournalSection(todayKey(), 'encryptedIntimacy', await encryptIntimacySection({answer: 'yes', note: ''}));
    },
  },
  {
    name: 'Rapports (Conceive)',
    render: () => <JournalConceptionReportsScreen {...({} as React.ComponentProps<typeof JournalConceptionReportsScreen>)} />,
    section: 'encryptedIntimacy',
    seed: async () => {
      await saveJournalSection(todayKey(), 'encryptedIntimacy', await encryptIntimacySection({answer: 'yes', time: '21:30', protection: 'unknown', note: ''}));
    },
  },
  {
    name: 'Hydratation',
    render: () => <HydrationScreen />,
    section: 'hydration',
    seed: () => saveJournalSection(todayKey(), 'hydration', {milliliters: 500, dailyGoal: 2000, glasses: 2, goalGlasses: 8}),
  },
];

describe.each(CASES)('$name - M25 clear', ({render, section, seed}) => {
  it('save -> reopen (clear offered) -> clear -> reopen (cleared); unrelated sections untouched', async () => {
    await seed();
    await saveJournalSection(todayKey(), 'weight', {value: 60, unit: 'kg'});
    // A day with nothing saved never offers the action (checked below on a
    // second day), and this one does.
    const first = await renderScreen(render());
    expect(clearButton(first)).toBeDefined();

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find(button => button.style === 'destructive')?.onPress?.();
    });
    await act(async () => {
      await clearButton(first)!.props.onPress();
    });
    await settle();
    expect(alertSpy).toHaveBeenCalledTimes(1);

    const entry = await getJournalEntry(todayKey());
    expect(entry?.[section]).toBeUndefined();
    expect(entry?.weight?.value).toBe(60);
    leave(first);

    const reopened = await renderScreen(render());
    expect(clearButton(reopened)).toBeUndefined();
  });

  it('a day with nothing saved does not offer the action', async () => {
    const renderer = await renderScreen(render());
    expect(clearButton(renderer)).toBeUndefined();
  });

  it('cancelling the confirmation keeps the saved value', async () => {
    await seed();
    const renderer = await renderScreen(render());
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await act(async () => {
      await clearButton(renderer)!.props.onPress();
    });
    await settle();
    expect((await getJournalEntry(todayKey()))?.[section]).toBeDefined();
  });
});
