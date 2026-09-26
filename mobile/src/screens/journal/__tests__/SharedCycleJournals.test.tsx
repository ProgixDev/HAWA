import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
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
import MenstrualFlowScreen from '../MenstrualFlowScreen';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {setActiveObjective, setCyclePreferences, type ObjectiveId} from '../../../state/onboardingPreferences';
import {unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {encryptIntimacySection, resolveIntimacySection} from '../../../services/privateJournalEncryption';
import {resolveNoteSection} from '../../../services/privateNotesEncryption';
import {addDays} from '../../../utils/cycleMath';

// Shared Cycle journal entry screens (also reused by Pregnancy for Humeur /
// Sommeil):
//  M5  - "Jour N du cycle" is the canonical, bounded Dashboard value for
//        Cycle/Conceive and absent everywhere else.
//  M13 - reopening a screen shows today's saved values, and pressing Save
//        without touching anything rewrites exactly the same stored values.
// Real screens, real stores (AsyncStorage/Keychain are the jest.setup
// in-memory mocks, so the at-rest encryption really runs).
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

const leave = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  act(() => {
    renderer.unmount();
  });
  const index = activeRenderers.indexOf(renderer);
  if (index >= 0) {
    activeRenderers.splice(index, 1);
  }
};

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const pressables = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function');

/** A pressable identified by its accessibilityLabel. */
const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = pressables(renderer).filter(node => node.props.accessibilityLabel === label)[0];
  if (!match) {
    throw new Error(`No pressable labelled "${label}"`);
  }
  return match;
};

/** A pressable with the given accessibilityRole that contains a Text child. */
const byRoleText = (renderer: ReactTestRenderer.ReactTestRenderer, role: string, text: string) => {
  const match = pressables(renderer).filter(
    node => node.props.accessibilityRole === role && node.findAllByType(Text).some(child => textOf(child) === text),
  )[0];
  if (!match) {
    throw new Error(`No ${role} containing "${text}"`);
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

const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  await act(async () => {
    renderer.root.findByType(TextInput).props.onChangeText(value);
  });
};

const inputValue = (renderer: ReactTestRenderer.ReactTestRenderer): string =>
  renderer.root.findByType(TextInput).props.value;

/** Host-level "adjustable" scales of the Mood screen, in screen order. */
const scaleValues = (renderer: ReactTestRenderer.ReactTestRenderer): number[] =>
  renderer.root
    .findAll(node => typeof node.type === 'string' && node.props.accessibilityRole === 'adjustable')
    .map(node => node.props.accessibilityValue.now as number);

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
  jest.useRealTimers();
});

/* ============================================================
   M5 - "Jour N du cycle"
============================================================ */

type HeaderScreen = {name: string; render: () => React.JSX.Element};

const HEADER_SCREENS: HeaderScreen[] = [
  {name: 'Humeur', render: () => <JournalMoodScreen />},
  {name: 'Sommeil', render: () => <JournalSleepScreen />},
  {name: 'Activité', render: () => <JournalActivityScreen />},
  {name: 'Notes personnelles', render: () => <JournalNoteScreen />},
  {name: 'Vie intime', render: () => <JournalIntimacyScreen />},
  {name: 'Flux menstruel', render: () => <MenstrualFlowScreen />},
];

// Every text that mentions a cycle day ("… · Jour 10 du cycle", a bare "Jour 10"
// info value, or the "Jour du cycle" label that goes with it).
const cycleDayTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  allTexts(renderer).filter(text => /Jour \d+|du cycle/.test(text));
const cycleDayNumbers = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  cycleDayTexts(renderer).filter(text => /\d/.test(text));

const confirmCycle = (elapsedDays: number, regularity: 'yes' | 'no' | 'unknown' = 'yes') => {
  setCyclePreferences({
    lastPeriodStart: addDays(now, -elapsedDays),
    periodDuration: 5,
    cycleDuration: 28,
    regularity,
  });
};

describe('M5 - "Jour N du cycle" on the shared journal screens', () => {
  describe.each(HEADER_SCREENS)('$name', ({render}) => {
    it('Cycle objective with confirmed data shows the canonical day (Dashboard value)', async () => {
      confirmCycle(9);
      const renderer = await renderScreen(render());
      const texts = cycleDayNumbers(renderer);
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.every(text => /Jour 10( du cycle)?$/.test(text))).toBe(true);
    });

    it('Conceive objective with confirmed data shows the same canonical day', async () => {
      confirmCycle(9);
      await setActiveObjective('conceive');
      const renderer = await renderScreen(render());
      expect(cycleDayTexts(renderer).some(text => /Jour 10/.test(text))).toBe(true);
    });

    it.each<ObjectiveId>(['pregnancy', 'postpartum', 'loss', 'menopause', 'contraception', 'irregular'])(
      '%s objective never shows a cycle day, even with confirmed cycle data',
      async objective => {
        confirmCycle(9);
        await setActiveObjective(objective);
        const renderer = await renderScreen(render());
        expect(cycleDayTexts(renderer)).toEqual([]);
      },
    );

    it('a wildly out-of-range elapsed count is wrapped by the cycle length, never shown raw', async () => {
      confirmCycle(143); // 143 % 28 = 3 -> day 4 (never "Jour 144")
      const renderer = await renderScreen(render());
      const texts = cycleDayNumbers(renderer);
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.every(text => /Jour 4( du cycle)?$/.test(text))).toBe(true);
      expect(allTexts(renderer).some(text => /Jour 14\d/.test(text))).toBe(false);
    });

    it('irregular cycle far past its window: no unbounded number at all', async () => {
      confirmCycle(143, 'no');
      const renderer = await renderScreen(render());
      expect(cycleDayTexts(renderer)).toEqual([]);
      expect(allTexts(renderer).some(text => /Jour 14\d/.test(text))).toBe(false);
    });
  });

  it('switching objective while the screen is open updates the header live', async () => {
    confirmCycle(9);
    const renderer = await renderScreen(<JournalMoodScreen />);
    expect(cycleDayTexts(renderer).some(text => /Jour 10 du cycle/.test(text))).toBe(true);
    await act(async () => {
      await setActiveObjective('pregnancy');
    });
    expect(cycleDayTexts(renderer)).toEqual([]);
  });
});

/* ============================================================
   M13 - prefill + idempotent Save
============================================================ */

describe('M13 - Humeur reopens with today\'s saved values', () => {
  it('save non-default values, leave, reopen: values shown; Save unchanged keeps the stored values identical', async () => {
    const first = await renderScreen(<JournalMoodScreen />);
    await press(byRoleText(first, 'radio', 'Triste'));
    await press(byLabel(first, 'Énergie 2 sur 5'));
    await press(byLabel(first, 'Stress 5 sur 5'));
    await press(byLabel(first, 'Irritabilité 1 sur 5'));
    await press(byLabel(first, 'Motivation 1 sur 5'));
    await typeInto(first, 'Journée difficile');
    await press(byLabel(first, "Enregistrer l'humeur"));

    const saved = (await getJournalEntry(todayKey()))?.mood;
    expect(saved).toEqual({
      level: 'sad',
      energy: 2,
      stress: 5,
      irritability: 1,
      motivation: 1,
      note: 'Journée difficile',
    });
    leave(first);

    const reopened = await renderScreen(<JournalMoodScreen />);
    expect(isOn(byRoleText(reopened, 'radio', 'Triste'))).toBe(true);
    expect(isOn(byRoleText(reopened, 'radio', 'Très bien'))).toBe(false);
    expect(scaleValues(reopened)).toEqual([2, 5, 1, 1]);
    expect(inputValue(reopened)).toBe('Journée difficile');

    await press(byLabel(reopened, "Enregistrer l'humeur"));
    expect((await getJournalEntry(todayKey()))?.mood).toEqual(saved);
  });

  it('an untouched day still opens on the defaults', async () => {
    const renderer = await renderScreen(<JournalMoodScreen />);
    expect(isOn(byRoleText(renderer, 'radio', 'Très bien'))).toBe(true);
    expect(scaleValues(renderer)).toEqual([4, 3, 2, 4]);
    expect(inputValue(renderer)).toBe('');
  });

  it('Pregnancy reuses the same screen and gets the same prefill (shared dailyJournalStore entry)', async () => {
    await setActiveObjective('pregnancy');
    await saveJournalSection(todayKey(), 'mood', {
      level: 'anxious',
      energy: 1,
      stress: 4,
      irritability: 3,
      motivation: 2,
      note: 'Rendez-vous demain',
    });
    const renderer = await renderScreen(<JournalMoodScreen />);
    expect(isOn(byRoleText(renderer, 'radio', 'Anxieuse'))).toBe(true);
    expect(scaleValues(renderer)).toEqual([1, 4, 3, 2]);
    expect(inputValue(renderer)).toBe('Rendez-vous demain');
  });
});

describe('M13 - Symptômes reopens with today\'s saved values', () => {
  it('save non-default values, leave, reopen: values shown; Save unchanged keeps the stored values identical', async () => {
    const first = await renderScreen(<JournalSymptomsScreen />);
    await press(byLabel(first, 'Migraines'));
    await press(byLabel(first, 'Fatigue')); // default -> off
    await press(byLabel(first, 'Intensité Modérée. Gênante dans certaines activités'));
    await press(byLabel(first, 'Dos'));
    await typeInto(first, 'Pire le soir');
    await press(byLabel(first, 'Enregistrer mes symptômes'));

    const saved = (await getJournalEntry(todayKey()))?.symptoms;
    expect(saved).toEqual({
      names: ['Douleurs menstruelles', 'Migraines'],
      severity: 'moderate',
      painLocation: 'Dos',
      note: 'Pire le soir',
    });
    leave(first);

    const reopened = await renderScreen(<JournalSymptomsScreen />);
    expect(isOn(byLabel(reopened, 'Migraines'))).toBe(true);
    expect(isOn(byLabel(reopened, 'Douleurs menstruelles'))).toBe(true);
    expect(isOn(byLabel(reopened, 'Fatigue'))).toBe(false);
    expect(isOn(byLabel(reopened, 'Intensité Modérée. Gênante dans certaines activités'))).toBe(true);
    expect(isOn(byLabel(reopened, 'Dos'))).toBe(true);
    expect(inputValue(reopened)).toBe('Pire le soir');

    await press(byLabel(reopened, 'Enregistrer mes symptômes'));
    expect((await getJournalEntry(todayKey()))?.symptoms).toEqual(saved);
  });

  it('does not erase what the user did not edit: unknown names and a saved "severe" survive an unchanged Save', async () => {
    const seeded = {
      names: ['Crampes', 'Symptôme saisi ailleurs'],
      severity: 'severe' as const,
      painLocation: 'Tête',
      note: 'garde-moi',
    };
    await saveJournalSection(todayKey(), 'symptoms', seeded);

    const renderer = await renderScreen(<JournalSymptomsScreen />);
    expect(isOn(byLabel(renderer, 'Crampes'))).toBe(true);
    expect(isOn(byLabel(renderer, 'Tête'))).toBe(true);
    await press(byLabel(renderer, 'Enregistrer mes symptômes'));

    expect((await getJournalEntry(todayKey()))?.symptoms).toEqual(seeded);
  });
});

describe('M13 - Sommeil reopens with today\'s saved values', () => {
  it('save non-default values, leave, reopen: values shown; Save unchanged keeps the stored values identical', async () => {
    const first = await renderScreen(<JournalSleepScreen />);
    await press(byLabel(first, 'Heure du coucher, 22:45'));
    await press(byRoleText(first, 'radio', '23:30'));
    await press(byLabel(first, 'Heure du réveil, 07:15'));
    await press(byRoleText(first, 'radio', '06:45'));
    await press(byLabel(first, 'Qualité du sommeil : Mauvaise'));
    await press(byLabel(first, 'Sensation au réveil : Fatiguée'));
    await press(byLabel(first, 'Augmenter le nombre de réveils'));
    await press(byLabel(first, 'Augmenter le nombre de réveils'));
    await typeInto(first, 'Nuit agitée');
    await press(byLabel(first, 'Enregistrer'));

    const saved = (await getJournalEntry(todayKey()))?.sleep;
    expect(saved).toEqual({
      bedtime: '23:30',
      wakeTime: '06:45',
      duration: '7 h 15 min',
      quality: 'Mauvaise',
      awakenings: 3,
      wakeFeeling: 'Fatiguée',
      note: 'Nuit agitée',
    });
    leave(first);

    const reopened = await renderScreen(<JournalSleepScreen />);
    expect(byLabel(reopened, 'Heure du coucher, 23:30')).toBeDefined();
    expect(byLabel(reopened, 'Heure du réveil, 06:45')).toBeDefined();
    expect(allTexts(reopened)).toContain('7 h 15 min');
    expect(isOn(byLabel(reopened, 'Qualité du sommeil : Mauvaise'))).toBe(true);
    expect(isOn(byLabel(reopened, 'Qualité du sommeil : Bonne'))).toBe(false);
    expect(isOn(byLabel(reopened, 'Sensation au réveil : Fatiguée'))).toBe(true);
    expect(allTexts(reopened)).toContain('3');
    expect(inputValue(reopened)).toBe('Nuit agitée');

    await press(byLabel(reopened, 'Enregistrer'));
    expect((await getJournalEntry(todayKey()))?.sleep).toEqual(saved);
  });
});

describe('M13 - Activité reopens with today\'s saved values', () => {
  it('save non-default values, leave, reopen: values shown; Save unchanged keeps the stored values identical', async () => {
    const first = await renderScreen(<JournalActivityScreen />);
    await press(byLabel(first, 'Yoga'));
    await press(byLabel(first, 'Augmenter la durée'));
    await press(byLabel(first, 'Augmenter la durée'));
    await press(byRoleText(first, 'button', 'Légère'));
    await press(byLabel(first, "Ressenti après l'activité : Fatiguée"));
    await typeInto(first, 'Séance douce');
    await press(byLabel(first, "Enregistrer l'activité"));

    const saved = (await getJournalEntry(todayKey()))?.activity;
    expect(saved).toEqual({
      none: false,
      type: 'Yoga',
      durationMinutes: 50,
      intensity: 'Légère',
      feeling: 'Fatiguée',
      note: 'Séance douce',
    });
    leave(first);

    const reopened = await renderScreen(<JournalActivityScreen />);
    expect(isOn(byLabel(reopened, 'Yoga'))).toBe(true);
    expect(isOn(byLabel(reopened, 'Marche'))).toBe(false);
    expect(allTexts(reopened)).toContain('50');
    expect(isOn(byRoleText(reopened, 'button', 'Légère'))).toBe(true);
    expect(isOn(byRoleText(reopened, 'button', 'Élevée'))).toBe(false);
    expect(isOn(byLabel(reopened, "Ressenti après l'activité : Fatiguée"))).toBe(true);
    expect(inputValue(reopened)).toBe('Séance douce');

    await press(byLabel(reopened, "Enregistrer l'activité"));
    expect((await getJournalEntry(todayKey()))?.activity).toEqual(saved);
  });
});

describe('M13 - Notes personnelles reopens with today\'s saved (encrypted) note', () => {
  it('save, leave, reopen: the decrypted note is shown; Save unchanged keeps text and timestamp identical', async () => {
    const first = await renderScreen(<JournalNoteScreen />);
    await typeInto(first, 'Ma note privée');
    await press(byLabel(first, 'Enregistrer ma note'));

    const entry = await getJournalEntry(todayKey());
    expect(entry?.encryptedNote).toBeDefined();
    expect(entry?.note).toBeUndefined();
    const saved = (await resolveNoteSection(entry)).data;
    expect(saved?.text).toBe('Ma note privée');
    leave(first);

    const reopened = await renderScreen(<JournalNoteScreen />);
    expect(inputValue(reopened)).toBe('Ma note privée');

    await press(byLabel(reopened, 'Enregistrer ma note'));
    const after = await getJournalEntry(todayKey());
    expect(after?.encryptedNote).toBeDefined();
    expect((await resolveNoteSection(after)).data).toEqual(saved);
  });

  it('a legacy plaintext note is shown too, and an unchanged Save migrates it to the encrypted field', async () => {
    await saveJournalSection(todayKey(), 'note', {text: 'Ancienne note', private: true, updatedAt: '2026-01-01T10:00:00.000Z'});

    const renderer = await renderScreen(<JournalNoteScreen />);
    expect(inputValue(renderer)).toBe('Ancienne note');
    await press(byLabel(renderer, 'Enregistrer ma note'));

    const after = await getJournalEntry(todayKey());
    expect(after?.note).toBeUndefined();
    expect((await resolveNoteSection(after)).data).toEqual({text: 'Ancienne note', updatedAt: '2026-01-01T10:00:00.000Z'});
  });

  it('an empty day opens on an empty note and still refuses an empty Save', async () => {
    const renderer = await renderScreen(<JournalNoteScreen />);
    expect(inputValue(renderer)).toBe('');
  });
});

describe('M13 - Vie intime reopens with today\'s saved (encrypted) values', () => {
  it('save non-default values, leave, reopen: values shown; Save unchanged keeps the decrypted values identical', async () => {
    const first = await renderScreen(<JournalIntimacyScreen />);
    await press(byLabel(first, 'Heure, 21:30'));
    await press(byRoleText(first, 'radio', '22:15'));
    await press(byRoleText(first, 'radio', 'Faible'));
    await press(byRoleText(first, 'checkbox', 'Fatigue'));
    await press(byRoleText(first, 'checkbox', 'Irritation'));
    await typeInto(first, 'Tout va bien');
    await press(byLabel(first, 'Enregistrer les informations de vie intime'));

    const entry = await getJournalEntry(todayKey());
    expect(entry?.encryptedIntimacy).toBeDefined();
    const saved = (await resolveIntimacySection(entry)).data;
    expect(saved).toEqual({
      answer: 'yes',
      time: '22:15',
      libido: 'Faible',
      discomfort: 'Fatigue, Irritation',
      note: 'Tout va bien',
    });
    leave(first);

    const reopened = await renderScreen(<JournalIntimacyScreen />);
    expect(isOn(byRoleText(reopened, 'radio', 'Oui'))).toBe(true);
    expect(byLabel(reopened, 'Heure, 22:15')).toBeDefined();
    expect(isOn(byRoleText(reopened, 'radio', 'Faible'))).toBe(true);
    expect(isOn(byRoleText(reopened, 'radio', 'Très élevée'))).toBe(false);
    expect(isOn(byRoleText(reopened, 'checkbox', 'Fatigue'))).toBe(true);
    expect(isOn(byRoleText(reopened, 'checkbox', 'Irritation'))).toBe(true);
    expect(isOn(byRoleText(reopened, 'checkbox', 'Autre'))).toBe(false);
    expect(inputValue(reopened)).toBe('Tout va bien');

    await press(byLabel(reopened, 'Enregistrer les informations de vie intime'));
    expect((await resolveIntimacySection(await getJournalEntry(todayKey()))).data).toEqual(saved);
  });

  it('a saved "Non" reopens on "Non" and keeps its note', async () => {
    await saveJournalSection(todayKey(), 'encryptedIntimacy', await encryptIntimacySection({answer: 'no', note: 'Pas aujourd’hui'}));

    const renderer = await renderScreen(<JournalIntimacyScreen />);
    expect(isOn(byRoleText(renderer, 'radio', 'Non'))).toBe(true);
    expect(inputValue(renderer)).toBe('Pas aujourd’hui');
    await press(byLabel(renderer, 'Enregistrer les informations de vie intime'));

    expect((await resolveIntimacySection(await getJournalEntry(todayKey()))).data).toEqual({
      answer: 'no',
      note: 'Pas aujourd’hui',
    });
  });

  it('does not erase what this screen has no control for: time and protection saved by the Conceive screen survive', async () => {
    const seeded = {
      answer: 'yes' as const,
      time: '20:00',
      protection: 'yes' as const,
      libido: 'Élevée',
      discomfort: 'Fatigue',
      note: 'n',
    };
    await saveJournalSection(todayKey(), 'encryptedIntimacy', await encryptIntimacySection(seeded));

    const renderer = await renderScreen(<JournalIntimacyScreen />);
    expect(byLabel(renderer, 'Heure, 20:00')).toBeDefined();
    await press(byLabel(renderer, 'Enregistrer les informations de vie intime'));

    expect((await resolveIntimacySection(await getJournalEntry(todayKey()))).data).toEqual(seeded);
  });

  it('a legacy plaintext entry is prefilled and migrated by an unchanged Save', async () => {
    await saveJournalSection(todayKey(), 'intimacy', {answer: 'yes', libido: 'Modérée', discomfort: 'Aucun', note: 'ancien'});

    const renderer = await renderScreen(<JournalIntimacyScreen />);
    expect(isOn(byRoleText(renderer, 'radio', 'Modérée'))).toBe(true);
    expect(isOn(byRoleText(renderer, 'checkbox', 'Aucun'))).toBe(true);
    await press(byLabel(renderer, 'Enregistrer les informations de vie intime'));

    const after = await getJournalEntry(todayKey());
    expect(after?.intimacy).toBeUndefined();
    expect((await resolveIntimacySection(after)).data).toEqual({
      answer: 'yes',
      libido: 'Modérée',
      discomfort: 'Aucun',
      note: 'ancien',
    });
  });
});
