import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Image, ImageBackground, Text} from 'react-native';
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
import HydrationScreen from '../HydrationScreen';
import MenstrualFlowScreen from '../MenstrualFlowScreen';
import DailyJournalSheet from '../../../components/journal/DailyJournalSheet';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../../state/activeProfileStore';
import i18n from '../../../i18n';
import {setAppLanguage} from '../../../state/themePreferences';

// Managed DAUGHTER profile journal: simplified presentation (no illustrated hero, her first name, parent wording).
// The mother's journal must stay exactly as it was, and both share the same screens, so each case renders the SAME
// screen for the owner and for the daughter and compares.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

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
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
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

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);
const hasHero = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(ImageBackground).length > 0;

const NAME = 'Lina';

beforeEach(async () => {
  testIndex += 1;
  now = new Date(2026, 8 + Math.floor(testIndex / 28), 1 + (testIndex % 28), 15, 0, 0);
  jest.useFakeTimers({advanceTimers: true, now});
  await setActiveObjective('cycle');
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  // Changing the active profile or objective re-locks the private section (privateSectionAuthStore), so unlock last.
  unlockIntimacy();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

const activateDaughter = async () => {
  const lina = await addManagedProfile({type: 'daughter', firstName: NAME, birthDate: '2012-03-15', hasHadFirstPeriod: false});
  await setActiveProfileId(lina.id);
  unlockIntimacy(); // switching profile re-locks the private section; the daughter's notes open only after unlocking again
  return lina;
};

type Case = {
  name: string;
  render: () => React.JSX.Element;
  /** French text only the mother's presentation shows (illustrated hero / encouragement copy). */
  ownerOnlyText: string;
  /** Title the daughter's screen shows, with her first name. */
  daughterTitle: string;
  /** True when the mother's version draws an ImageBackground hero. */
  imageHero: boolean;
};

const CASES: Case[] = [
  {name: 'Symptômes', render: () => <JournalSymptomsScreen />, ownerOnlyText: 'Écoute ton corps', daughterTitle: 'Symptômes de Lina', imageHero: true},
  {name: 'Humeur', render: () => <JournalMoodScreen />, ownerOnlyText: 'Écoute-toi avec bienveillance.', daughterTitle: 'Humeur de Lina', imageHero: true},
  {name: 'Activité physique', render: () => <JournalActivityScreen />, ownerOnlyText: 'Bouge pour ton bien-être ✦', daughterTitle: 'Activité physique de Lina', imageHero: true},
  {name: 'Sommeil', render: () => <JournalSleepScreen />, ownerOnlyText: 'Prends soin de ton repos, ton corps te remercie. ♡', daughterTitle: 'Sommeil de Lina', imageHero: true},
  {name: 'Notes', render: () => <JournalNoteScreen />, ownerOnlyText: 'Ton espace rien qu’à toi ♡', daughterTitle: 'Observations de Lina', imageHero: true},
  {name: 'Hydratation', render: () => <HydrationScreen />, ownerOnlyText: 'Bouteille et verre d’eau', daughterTitle: 'Hydratation de Lina', imageHero: false},
  {name: 'Flux menstruel', render: () => <MenstrualFlowScreen />, ownerOnlyText: 'Comment est ton flux aujourd’hui ?', daughterTitle: 'Flux menstruel de Lina', imageHero: false},
];

const ownerOnlyPresent = (renderer: ReactTestRenderer.ReactTestRenderer, text: string) =>
  allTexts(renderer).includes(text) ||
  renderer.root.findAllByType(Image).some(node => node.props.accessibilityLabel === text);

describe.each(CASES)('$name', ({render, ownerOnlyText, daughterTitle, imageHero}) => {
  it("the mother's screen is unchanged: illustrated presentation, no daughter wording", async () => {
    const renderer = await renderScreen(render());
    expect(ownerOnlyPresent(renderer, ownerOnlyText)).toBe(true);
    if (imageHero) {
      expect(hasHero(renderer)).toBe(true);
    }
    expect(allTexts(renderer).some(text => text.includes(NAME))).toBe(false);
  });

  it("the daughter's screen drops the illustration and names her", async () => {
    await activateDaughter();
    const renderer = await renderScreen(render());
    expect(ownerOnlyPresent(renderer, ownerOnlyText)).toBe(false);
    expect(hasHero(renderer)).toBe(false);
    expect(allTexts(renderer)).toContain(daughterTitle);
  });
});

describe('profile switching', () => {
  it('a mounted journal follows the active profile (daughter -> mother brings the mother presentation back)', async () => {
    await activateDaughter();
    const renderer = await renderScreen(<JournalMoodScreen />);
    expect(hasHero(renderer)).toBe(false);
    expect(allTexts(renderer)).toContain('Humeur de Lina');

    await act(async () => {
      await setActiveProfileId(OWNER_PROFILE_ID);
    });
    await settle();
    expect(hasHero(renderer)).toBe(true);
    expect(allTexts(renderer).some(text => text.includes(NAME))).toBe(false);
  });

  it('saves under the active profile only: the daughter\'s mood never lands in the mother\'s journal', async () => {
    const lina = await activateDaughter();
    await saveJournalSection(todayKey(), 'mood', {level: 'sad', energy: 2, stress: 4, irritability: 3, motivation: 1, note: ''});
    expect((await getJournalEntry(todayKey()))?.mood?.level).toBe('sad');

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect((await getJournalEntry(todayKey()))?.mood).toBeUndefined();

    await setActiveProfileId(lina.id);
    expect((await getJournalEntry(todayKey()))?.mood?.level).toBe('sad');
  });
});

describe('journal sheet', () => {
  const actions = [{key: 'MoodEntry', icon: 'emoticon-happy-outline', title: 'Humeur', subtitle: 'Humeur du jour', tint: '#F9DDE8', onPress: jest.fn()}];

  it('keeps the illustrated header by default and drops it in compact (daughter) mode', async () => {
    const full = await renderScreen(<DailyJournalSheet actions={actions} onClose={jest.fn()} visible />);
    const compact = await renderScreen(<DailyJournalSheet actions={actions} compact onClose={jest.fn()} visible />);
    expect(full.root.findAllByType(Image).length).toBeGreaterThan(compact.root.findAllByType(Image).length);
  });
});
