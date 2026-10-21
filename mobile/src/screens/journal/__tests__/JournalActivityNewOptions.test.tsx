import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalActivityScreen from '../JournalActivityScreen';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {journalOptionLabel} from '../../../utils/journalOptionLabels';
import i18n from '../../../i18n';
import {en} from '../../../i18n/locales/en';
import {fr} from '../../../i18n/locales/fr';
import {es} from '../../../i18n/locales/es';
import {it as itDictionary} from '../../../i18n/locales/it';
import {tr} from '../../../i18n/locales/tr';
import {ru} from '../../../i18n/locales/ru';
import {de} from '../../../i18n/locales/de';
import {zh} from '../../../i18n/locales/zh';
import {id} from '../../../i18n/locales/id';
import {hi} from '../../../i18n/locales/hi';
import {sq} from '../../../i18n/locales/sq';
import {ja} from '../../../i18n/locales/ja';
import {ko} from '../../../i18n/locales/ko';
import {bn} from '../../../i18n/locales/bn';
import {ptPT, ptBRFull} from '../../../testUtils/portugueseDictionaries';
import {setAppLanguage} from '../../../state/themePreferences';

// Physical-activity screen: « Randonnée » (hiking) and « Cardio » were added to the type grid, before « Autre » (which stays
// last). The raw French label is the stored value (journalOptionLabel only translates it for display), so existing records and the
// existing ten activities are untouched; the new ones select, save, reopen, edit and show in history like the others.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
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

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => <JournalActivityScreen />}</Stack.Screen>
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

const pressables = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAll(node => typeof node.props.onPress === 'function');
const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = pressables(renderer).filter(node => node.props.accessibilityLabel === label)[0];
  if (!match) {
    throw new Error(`No pressable labelled "${label}"`);
  }
  return match;
};
const press = async (node: ReactTestRenderer.ReactTestInstance) => {
  await act(async () => {
    await node.props.onPress();
  });
  await settle();
};
const isOn = (node: ReactTestRenderer.ReactTestInstance): boolean =>
  node.props.accessibilityState?.checked === true || node.props.accessibilityState?.selected === true;

const GRID_FR = ['Marche', 'Course', 'Yoga', 'Musculation', 'Natation', 'Vélo', 'Étirements', 'Pilates', 'Danse', 'Randonnée', 'Cardio', 'Autre'];
/** The grid's cards, in screen order, by their French label (the language the tests pin). */
const gridLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => {
  const labels = pressables(renderer).map(node => node.props.accessibilityLabel as string).filter(label => GRID_FR.includes(label));
  return labels.filter((label, index) => labels.indexOf(label) === index);
};

beforeEach(async () => {
  testIndex += 1;
  now = new Date(2026, 8 + Math.floor(testIndex / 28), 1 + (testIndex % 28), 15, 0, 0);
  jest.useFakeTimers({advanceTimers: true, now});
  await setActiveObjective('cycle');
  unlockIntimacy();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('the type grid', () => {
  it('shows the ten existing activities in their order, then « Randonnée » and « Cardio », and « Autre » stays last', async () => {
    const renderer = await renderScreen();
    expect(gridLabels(renderer)).toEqual(GRID_FR);
    expect(gridLabels(renderer)[gridLabels(renderer).length - 1]).toBe('Autre');
  });

  it('the new cards use the hiking and heart-pulse icons of the same icon set as the others', async () => {
    const renderer = await renderScreen();
    const iconOf = (label: string) => byLabel(renderer, label).findAll(node => typeof node.props.name === 'string').map(node => node.props.name as string);
    expect(iconOf('Randonnée')).toContain('hiking');
    expect(iconOf('Cardio')).toContain('heart-pulse');
    expect(iconOf('Marche')).toContain('walk'); // the existing icons are unchanged
    expect(iconOf('Danse')).toContain('dance-ballroom');
    expect(iconOf('Autre')).toContain('dots-horizontal-circle-outline');
  });
});

describe.each([
  ['Randonnée', 'Cardio'],
  ['Cardio', 'Randonnée'],
])('« %s »: select, save, reopen, edit', (type, other) => {
  it('selects exclusively, saves the raw French label, reopens selected and can be edited to another activity', async () => {
    const first = await renderScreen();
    await press(byLabel(first, type));
    expect(isOn(byLabel(first, type))).toBe(true);
    for (const label of GRID_FR.filter(candidate => candidate !== type)) {
      expect([label, isOn(byLabel(first, label))]).toEqual([label, false]);
    }
    await press(byLabel(first, "Enregistrer l'activité"));
    expect((await getJournalEntry(todayKey()))?.activity?.type).toBe(type);
    act(() => {
      first.unmount();
    });
    activeRenderers.splice(activeRenderers.indexOf(first), 1);

    const reopened = await renderScreen();
    expect(isOn(byLabel(reopened, type))).toBe(true);
    expect(isOn(byLabel(reopened, other))).toBe(false);

    await press(byLabel(reopened, other)); // edit: choose the other new activity
    expect(isOn(byLabel(reopened, other))).toBe(true);
    expect(isOn(byLabel(reopened, type))).toBe(false);
    await press(byLabel(reopened, "Enregistrer l'activité"));
    expect((await getJournalEntry(todayKey()))?.activity?.type).toBe(other);
  });
});

describe('existing records and activities are untouched', () => {
  it.each(['Marche', 'Course', 'Yoga', 'Musculation', 'Natation', 'Vélo', 'Étirements', 'Pilates', 'Danse', 'Autre'])(
    'a stored « %s » reopens selected, and saving without a change keeps it',
    async type => {
      await saveJournalSection(todayKey(), 'activity', {none: false, type, durationMinutes: 30, intensity: 'Modérée', feeling: 'Bien', note: ''});
      const renderer = await renderScreen();
      expect(isOn(byLabel(renderer, type))).toBe(true);
      expect(GRID_FR.filter(label => isOn(byLabel(renderer, label)))).toEqual([type]);
      await press(byLabel(renderer, "Enregistrer l'activité"));
      expect((await getJournalEntry(todayKey()))?.activity?.type).toBe(type);
    },
  );

  it('an unknown / legacy stored value still shows in history as it was stored', () => {
    expect(journalOptionLabel('cycleActivityType', 'Escalade', i18n.t)).toBe('Escalade');
  });
});

describe('history and translations: all ten languages', () => {
  const DICTIONARIES = {fr, en, es, it: itDictionary, tr, ru, de, zh, id, hi, sq, ja, ko, 'pt-PT': ptPT, 'pt-BR': ptBRFull, bn} as const;
  const LANGUAGES = Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>;
  const EXISTING: Array<[string, string]> = [
    ['Marche', 'walking'], ['Course', 'running'], ['Yoga', 'yoga'], ['Musculation', 'strengthTraining'], ['Natation', 'swimming'],
    ['Vélo', 'cycling'], ['Étirements', 'stretching'], ['Pilates', 'pilates'], ['Danse', 'dance'], ['Autre', 'other'],
  ];
  const typeNames = (language: keyof typeof DICTIONARIES) =>
    (DICTIONARIES[language] as unknown as {journalOptions: {cycleActivityType: Record<string, string>}}).journalOptions.cycleActivityType;

  it.each(LANGUAGES)('%s: « Randonnée » and « Cardio » are translated for display, and the ten existing labels still map to their keys', language => {
    const names = typeNames(language);
    expect(names.hiking.trim().length).toBeGreaterThan(0);
    expect(names.cardio.trim().length).toBeGreaterThan(0);
    expect(names.hiking).not.toMatch(/\./); // not a raw key
    expect(journalOptionLabel('cycleActivityType', 'Randonnée', ((key: string) => i18n.t(key, {lng: language})) as never)).toBe(names.hiking);
    expect(journalOptionLabel('cycleActivityType', 'Cardio', ((key: string) => i18n.t(key, {lng: language})) as never)).toBe(names.cardio);
    for (const [french, key] of EXISTING) {
      expect(journalOptionLabel('cycleActivityType', french, ((k: string) => i18n.t(k, {lng: language})) as never)).toBe(names[key]);
    }
  });

  it('the new names are real translations, not copies of the French label (except where the word is shared: Cardio)', () => {
    expect(typeNames('en').hiking).toBe('Hiking');
    expect(typeNames('es').hiking).toBe('Senderismo');
    expect(typeNames('hi').hiking).toBe('ट्रेकिंग');
    expect(typeNames('hi').cardio).toBe('कार्डियो');
    expect(typeNames('zh').hiking).toBe('徒步');
    expect(typeNames('zh').cardio).toBe('有氧运动');
    expect(typeNames('bn').hiking).toBe('হাইকিং (পাহাড়ি হাঁটা)');
    expect(typeNames('bn').cardio).toBe('কার্ডিও');
    for (const language of LANGUAGES.filter(name => name !== 'fr')) {
      expect([language, typeNames(language).hiking === 'Randonnée']).toEqual([language, false]);
    }
  });

  it('every dictionary has the new keys in the same position, before « other »', () => {
    for (const language of LANGUAGES) {
      const keys = Object.keys(typeNames(language));
      expect([language, keys.slice(-3)]).toEqual([language, ['hiking', 'cardio', 'other']]);
    }
  });

  it('a saved « Randonnée » shows in the history of the screen language the user reads (switching the language re-labels, the stored value stays)', async () => {
    await saveJournalSection(todayKey(), 'activity', {none: false, type: 'Randonnée', durationMinutes: 45, intensity: 'Légère', feeling: 'Bien', note: ''});
    for (const language of ['es', 'hi', 'zh', 'fr'] as const) {
      await act(async () => {
        await setAppLanguage(language);
        await i18n.changeLanguage(language);
      });
      expect(journalOptionLabel('cycleActivityType', 'Randonnée', i18n.t)).toBe(typeNames(language).hiking);
      expect((await getJournalEntry(todayKey()))?.activity?.type).toBe('Randonnée');
    }
  });
});
