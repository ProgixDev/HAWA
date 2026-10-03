import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../JournalMoodScreen';
import JournalSymptomsScreen from '../JournalSymptomsScreen';
import JournalActivityScreen from '../JournalActivityScreen';
import JournalSleepScreen from '../JournalSleepScreen';
import HydrationScreen from '../HydrationScreen';
import MenstrualFlowScreen from '../MenstrualFlowScreen';
import JournalNoteScreen from '../JournalNoteScreen';
import JournalIntimacyScreen from '../JournalIntimacyScreen';
import PrivateIntimacyUnlockScreen from '../PrivateIntimacyUnlockScreen';
import {unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';

// Phase 2 localization — the shared Cycle journal entry screens. Verifies
// both languages for the CHROME (headers, section titles, buttons, toasts).
// PHASE 7H closed the symptom/activity/sleep-quality/wake-feeling/libido
// display gap: these option values are still DATA (persisted verbatim into
// dailyJournalStore — see each screen's own header comment, and
// journalOptionLabels.ts), but their DISPLAYED text now follows the active
// app language via journalOptionLabel(); only the stored/selected/compared
// value stays French forever (see Phase7HJournalLanguageSwitch.test.tsx for
// the storage-identity proof).

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 20; index += 1) {
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
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

beforeEach(async () => {
  await resetAppLanguageForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('JournalMoodScreen — localization', () => {
  it('renders in French by default', async () => {
    const texts = allTexts(await renderScreen(<JournalMoodScreen />));
    expect(texts).toContain('Humeur');
    expect(texts).toContain('Humeur principale');
    expect(texts).toContain('Niveaux du jour');
    expect(texts).toContain('Enregistrer');
  });

  it('renders in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<JournalMoodScreen />));
    expect(texts).toContain('Mood');
    expect(texts).toContain('Main mood');
    expect(texts).toContain('Today’s levels');
    expect(texts).toContain('Save');
    expect(texts).not.toContain('Humeur');
    expect(texts).not.toContain('Enregistrer');
  });
});

describe('JournalSymptomsScreen — localization (chrome AND symptom/location display translate, PHASE 7H)', () => {
  it('renders chrome and the picklist display labels in English; the French originals are gone from the rendered text', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<JournalSymptomsScreen />));
    expect(texts).toContain('Listen to your body');
    expect(texts).toContain('Symptoms felt');
    expect(texts).toContain('Intensity');
    expect(texts.some(text => text.includes('Location'))).toBe(true);
    // PHASE 7H: display-only translation via journalOptionLabel(); the
    // underlying stored/selected value is still the French string (see
    // Phase7HJournalLanguageSwitch.test.tsx for that proof).
    expect(texts).toContain('Menstrual pain');
    expect(texts).toContain('Lower abdomen');
    expect(texts).not.toContain('Douleurs menstruelles');
    expect(texts).not.toContain('Bas ventre');
  });
});

describe('JournalActivityScreen — localization (chrome AND activity/intensity/feeling display translate, PHASE 7H)', () => {
  it('renders chrome and the picklist display labels in English; the French originals are gone from the rendered text', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<JournalActivityScreen />));
    expect(texts).toContain('Physical activity');
    expect(texts).toContain('Activity type');
    expect(texts).toContain('Duration');
    expect(texts).toContain('minutes');
    // PHASE 7H: display-only translation via journalOptionLabel(); the
    // underlying stored/selected value is still the French string.
    expect(texts).toContain('Walking');
    expect(texts).not.toContain('Marche');
  });
});

describe('JournalSleepScreen — localization (chrome AND quality/feeling display translate, PHASE 7H)', () => {
  it('renders in French by default', async () => {
    const texts = allTexts(await renderScreen(<JournalSleepScreen />));
    expect(texts).toContain('Sommeil');
    expect(texts).toContain('Heures de sommeil');
    expect(texts).toContain('Qualité du sommeil');
  });

  it('renders chrome and the quality/feeling display labels in English; the French originals are gone from the rendered text', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<JournalSleepScreen />));
    expect(texts).toContain('Sleep');
    expect(texts).toContain('Sleep hours');
    expect(texts).toContain('Sleep quality');
    expect(texts).toContain('Night awakenings');
    // PHASE 7H: display-only translation via journalOptionLabel(); the
    // underlying stored/selected value is still the French string.
    expect(texts).toContain('Good');
    expect(texts).not.toContain('Bonne');
  });
});

describe('HydrationScreen — localization', () => {
  it('renders in French by default', async () => {
    const texts = allTexts(await renderScreen(<HydrationScreen />));
    expect(texts).toContain('Hydratation');
    expect(texts).toContain('Objectif quotidien');
    expect(texts).toContain('Historique');
  });

  it('renders in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<HydrationScreen />));
    expect(texts).toContain('Hydration');
    expect(texts).toContain('Daily goal');
    expect(texts).toContain('History');
    expect(texts.some(text => /^\d+ glasses?$/.test(text))).toBe(true);
    expect(texts).not.toContain('Hydratation');
  });
});

describe('MenstrualFlowScreen — localization', () => {
  // Unlike JournalSymptomsScreen/JournalActivityScreen/JournalSleepScreen/
  // JournalIntimacyScreen, this screen's intensity/clots/protection choices
  // persist a separate semantic `value` field (not the display label) — see
  // FlowIntensity — so their labels are safe, pure display text and are
  // fully translated, not a known gap.
  it('renders fully in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<MenstrualFlowScreen />));
    expect(texts).toContain('Menstrual flow');
    expect(texts).toContain('Flow intensity');
    expect(texts).toContain('Flow color');
    expect(texts).toContain('Clots');
    expect(texts).toContain('Moderate');
    expect(texts).not.toContain('Moyen');
    expect(texts).not.toContain('Flux menstruel');
  });
});

describe('PrivateIntimacyUnlockScreen — localization', () => {
  it('renders in French by default', async () => {
    const texts = allTexts(await renderScreen(<PrivateIntimacyUnlockScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={{key: 'test', name: 'PrivateIntimacyUnlock', params: undefined}} />));
    expect(texts).toContain('Espace privé');
    expect(texts).toContain('Ta vie intime reste entièrement privée.');
  });

  it('renders in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<PrivateIntimacyUnlockScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={{key: 'test', name: 'PrivateIntimacyUnlock', params: undefined}} />));
    expect(texts).toContain('Private space');
    expect(texts).toContain('Your intimate life stays completely private.');
    expect(texts).not.toContain('Espace privé');
  });
});

describe('JournalNoteScreen / JournalIntimacyScreen — localization (unlocked private section)', () => {
  beforeEach(() => {
    unlockIntimacy();
  });

  it('JournalNoteScreen renders in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<JournalNoteScreen />));
    expect(texts).toContain('Personal notes');
    expect(texts).toContain('Today’s note');
    expect(texts).not.toContain('Notes personnelles');
  });

  it('JournalIntimacyScreen renders chrome and the libido/symptom display labels in English; the French originals are gone from the rendered text', async () => {
    await setAppLanguage('en');
    const texts = allTexts(await renderScreen(<JournalIntimacyScreen />));
    expect(texts).toContain('Intimate health');
    expect(texts).toContain('Intimacy today');
    expect(texts).toContain('Libido');
    expect(texts).toContain('Yes');
    expect(texts).toContain('No');
    // PHASE 7H: display-only translation via journalOptionLabel(); the
    // underlying stored/selected value is still the French string.
    expect(texts).toContain('Very high');
    expect(texts).not.toContain('Très élevée');
  });
});
