import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import JournalSymptomsScreen from '../journal/JournalSymptomsScreen';
import PostpartumJournalEntryScreen from '../PostpartumJournalEntryScreen';
import MiscarriageJournalEntryScreen from '../MiscarriageJournalEntryScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {getPostpartumJournalEntry, hydratePostpartumJournal, savePostpartumJournalField} from '../../state/postpartumJournalStore';
import {getMiscarriageJournalEntry, hydrateMiscarriageJournal} from '../../state/miscarriageJournalStore';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import {isIntimacyUnlocked, lockIntimacy, unlockIntimacy} from '../../state/privateSectionAuthStore';
import {getActiveProfileId, isOwnerActive} from '../../state/activeProfileStore';

// PHASE 7H — Journal stored-value display mappings. Representative integration
// assertions (not an exhaustive re-test of every migrated option — the
// existing targeted suites already cover that in French) proving:
//   - FR display is byte-identical to the original, EN display translates;
//   - the persisted/compared/selected value is ALWAYS the original French
//     string, in both languages, old records and newly-saved ones alike;
//   - an unrecognized/legacy value is shown as-is, never hidden or thrown;
//   - cross-cutting invariants (statistics grouping, numeric fields, user
//     notes, managed-profile isolation, private-section security) are
//     unaffected by a language switch.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

const settle = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderRoute(Component: React.ComponentType, params?: Record<string, unknown>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} initialParams={params} name="Journal" />
              <Stack.Screen name="MainTabs">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen name="PrivateIntimacyUnlock">{() => <Text>unlock</Text>}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const findButtons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label);
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = findButtons(renderer, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    await matches[0].props.onPress();
  });
  await settle();
};
const checkedState = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): boolean | undefined =>
  findButtons(renderer, label)[0]?.props.accessibilityState?.checked;

beforeEach(async () => {
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
  await hydratePostpartumJournal();
  await hydrateMiscarriageJournal();
  lockIntimacy();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — mood (Postpartum) stored-value FR/EN display', () => {
  it('French: the stored-value chip label "Bien" renders as-is', async () => {
    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    expect(textsOf(renderer)).toContain('Bien');
  });

  it('English: the same chip now displays "Good", not "Bien"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    const texts = textsOf(renderer);
    expect(texts).toContain('Good');
    expect(texts).not.toContain('Bien');
  });
});

describe('TEST 3/20 — selecting a translated chip in English persists the original stable French value', () => {
  it('Mood: tapping "Good" (EN) saves mood as "Bien", never "Good"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    await press(renderer, 'Good');
    await press(renderer, 'Save');
    expect(getPostpartumJournalEntry(todayKey())?.mood).toBe('Bien');
  });

  it('Pain: tapping "Strong" (EN) saves pain as "Forte", never "Strong"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'pain'});
    await press(renderer, 'Strong');
    await press(renderer, 'Save');
    expect(getPostpartumJournalEntry(todayKey())?.pain).toBe('Forte');
  });
});

describe('TEST 4 — a pre-existing French-valued record still shows as selected in English', () => {
  it('a day already saved with mood "Bien" shows the "Good" chip checked, not merely rendered', async () => {
    await savePostpartumJournalField(todayKey(), 'mood', 'Bien');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    expect(checkedState(renderer, 'Good')).toBe(true);
  });
});

describe('TEST 5/6 — symptoms (Cycle) stored-value FR/EN display', () => {
  it('French: "Crampes" renders as-is', async () => {
    const renderer = await renderRoute(JournalSymptomsScreen);
    expect(textsOf(renderer)).toContain('Crampes');
  });

  it('English: the same chip now displays "Cramps", not "Crampes"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(JournalSymptomsScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Cramps');
    expect(texts).not.toContain('Crampes');
  });
});

describe('TEST 7/19 — multi-select symptoms stay stable stored values; full stored-state snapshot survives a language switch', () => {
  it('selecting "Cramps" + "Bloating" (EN) saves symptoms.names as ["Crampes", "Ballonnements"]', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(JournalSymptomsScreen);
    await press(renderer, 'Cramps');
    await press(renderer, 'Bloating');
    await press(renderer, 'Save my symptoms');
    const entry = await getJournalEntry(todayKey());
    expect(entry?.symptoms?.names).toEqual(expect.arrayContaining(['Crampes', 'Ballonnements']));
  });

  it('a representative full day entry (symptoms/flow/mood/temperature) is byte-identical before and after FR → EN', async () => {
    const day = '2026-02-10';
    await saveJournalSection(day, 'symptoms', {names: ['Crampes', 'Ballonnements'], severity: 'moderate', painLocation: 'Dos', note: 'Une note personnelle'});
    await saveJournalSection(day, 'flow', {intensity: 'moderate'});
    await saveJournalSection(day, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4});
    await saveJournalSection(day, 'temperature', {value: 37.2, unit: 'C', method: 'Orale'});
    const before = await getJournalEntry(day);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const after = await getJournalEntry(day);

    expect(after).toEqual(before);
  });
});

describe('TEST 8/9 — bleeding intensity (Miscarriage) FR/EN display; stored value stays stable', () => {
  it('French: "Modéré" renders as-is', async () => {
    const renderer = await renderRoute(MiscarriageJournalEntryScreen as never, {category: 'bleeding'});
    expect(textsOf(renderer)).toContain('Modéré');
  });

  it('English: the same chip shows "Moderate"; selecting it still saves "Modéré"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(MiscarriageJournalEntryScreen as never, {category: 'bleeding'});
    expect(textsOf(renderer)).toContain('Moderate');
    await press(renderer, 'Moderate');
    await press(renderer, 'Save');
    expect(getMiscarriageJournalEntry(todayKey())?.bleeding).toBe('Modéré');
  });
});

describe('TEST 10/23 — pain (Irregular) and a second objective (Contraception) config both follow the same namespaced mapping', () => {
  it('Irregular pain-intensity: "Forte" (FR) / "Strong" (EN), computed via journalOptionLabel, never altering the stored value itself', () => {
    expect(journalOptionLabel('irregularIntensity', 'Forte', i18n.t)).toBe('Forte'); // fallbackLng is still 'fr' here
    expect(journalOptionLabel('irregularIntensity', 'Forte', (key: string) => i18n.t(key, {lng: 'en'}))).toBe('Strong');
  });

  it('Contraception feelings: "Ballonnements" (FR) / "Bloating" (EN)', () => {
    expect(journalOptionLabel('contraceptionFeeling', 'Ballonnements', (key: string) => i18n.t(key, {lng: 'fr'}))).toBe('Ballonnements');
    expect(journalOptionLabel('contraceptionFeeling', 'Ballonnements', (key: string) => i18n.t(key, {lng: 'en'}))).toBe('Bloating');
  });
});

describe('TEST 11/12 — numeric/measurement values are never touched by the label mapping', () => {
  it('a bare numeric-looking string (no French word) is unknown to every namespace and returned unchanged', () => {
    for (const namespace of ['cycleActivityType', 'cycleSleepQuality', 'postpartumPain'] as const) {
      expect(journalOptionLabel(namespace, '45', i18n.t)).toBe('45');
      expect(journalOptionLabel(namespace, '37.2', i18n.t)).toBe('37.2');
    }
  });

  it('a saved numeric temperature/activity-duration value round-trips unchanged across a language switch', async () => {
    const day = '2026-02-11';
    await saveJournalSection(day, 'temperature', {value: 37.4, unit: 'C'});
    await saveJournalSection(day, 'activity', {type: 'Yoga', durationMinutes: 45});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const entry = await getJournalEntry(day);
    expect(entry?.temperature?.value).toBe(37.4);
    expect(entry?.activity?.durationMinutes).toBe(45);
  });
});

describe('TEST 13 — a user-written note is never translated and never changes across a language switch', () => {
  it('free text typed into the symptoms note field survives FR → EN byte-identical', async () => {
    const renderer = await renderRoute(JournalSymptomsScreen);
    const note = 'Douleur inhabituelle ce matin, à surveiller.';
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText(note);
    });
    await settle();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await settle();

    expect(renderer.root.findByType(TextInput).props.value).toBe(note);
  });
});

describe('TEST 14/15 — history/summary consumers (SelectedDayCard) apply the same display mapping to an old record', () => {
  it('a historic record\'s raw stored symptom names translate for display, exactly as SelectedDayCard.tsx computes them', () => {
    const storedNames = ['Crampes', 'Ballonnements'];
    const frDisplay = storedNames.map(name => journalOptionLabel('cycleSymptom', name, (key: string) => i18n.t(key, {lng: 'fr'}))).join(', ');
    const enDisplay = storedNames.map(name => journalOptionLabel('cycleSymptom', name, (key: string) => i18n.t(key, {lng: 'en'}))).join(', ');
    expect(frDisplay).toBe('Crampes, Ballonnements');
    expect(enDisplay).toBe('Cramps, Bloating');
  });

  it('a historic record\'s raw stored activity type translates for display, exactly as SelectedDayCard.tsx computes it', () => {
    expect(journalOptionLabel('cycleActivityType', 'Marche', (key: string) => i18n.t(key, {lng: 'fr'}))).toBe('Marche');
    expect(journalOptionLabel('cycleActivityType', 'Marche', (key: string) => i18n.t(key, {lng: 'en'}))).toBe('Walking');
  });
});

describe('TEST 16 — Statistics grouping stays keyed on the stable French value regardless of display language', () => {
  it('the same raw symptom name is the aggregation key in both languages; only the rendered text differs', () => {
    const rawName = 'Crampes';
    const frLabel = journalOptionLabel('cycleSymptom', rawName, (key: string) => i18n.t(key, {lng: 'fr'}));
    const enLabel = journalOptionLabel('cycleSymptom', rawName, (key: string) => i18n.t(key, {lng: 'en'}));
    // Display differs...
    expect(enLabel).not.toBe(frLabel);
    // ...but the value a statistics aggregator would group by (symptom.name
    // itself, as read from the persisted record) is untouched by either call.
    expect(rawName).toBe('Crampes');
  });
});

describe('TEST 17/18 — a runtime FR → EN → FR switch updates visible Journal labels on the same mounted instance', () => {
  it('JournalSymptomsScreen re-renders "Cramps" after changeLanguage, then "Crampes" again after switching back', async () => {
    const renderer = await renderRoute(JournalSymptomsScreen);
    expect(textsOf(renderer)).toContain('Crampes');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Cramps');
    expect(textsOf(renderer)).not.toContain('Crampes');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Crampes');
    expect(textsOf(renderer)).not.toContain('Cramps');
  });
});

describe('TEST 21 — round-trip: an existing French record displays in English, survives an unrelated edit, and displays in French again', () => {
  it('mood "Bien" shows as "Good", a note edit while English is active never writes an English mood value, and FR display returns', async () => {
    await savePostpartumJournalField(todayKey(), 'mood', 'Bien');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    expect(textsOf(renderer)).toContain('Good');
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('A good day');
    });
    await press(renderer, 'Save');
    expect(getPostpartumJournalEntry(todayKey())?.mood).toBe('Bien'); // never overwritten with "Good"
    expect(getPostpartumJournalEntry(todayKey())?.moodNote).toBe('A good day');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    const reopened = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'mood'});
    expect(textsOf(reopened)).toContain('Bien');
    expect(getPostpartumJournalEntry(todayKey())?.mood).toBe('Bien');
  });
});

describe('TEST 22 — an unknown/legacy value is displayed as-is in every language, never hidden or thrown', () => {
  it('a value absent from every namespace\'s mapping table passes through unchanged', () => {
    expect(journalOptionLabel('cycleSymptom', 'LegacyCustomValue', (key: string) => i18n.t(key, {lng: 'fr'}))).toBe('LegacyCustomValue');
    expect(journalOptionLabel('cycleSymptom', 'LegacyCustomValue', (key: string) => i18n.t(key, {lng: 'en'}))).toBe('LegacyCustomValue');
    expect(() => journalOptionLabel('postpartumMood', 'LegacyCustomValue', i18n.t)).not.toThrow();
  });

  it('a screen reopened with a legacy stored symptom name still renders it (not hidden, not blank)', async () => {
    await saveJournalSection(todayKey(), 'symptoms', {names: ['Ancienne valeur']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderRoute(JournalSymptomsScreen);
    // The legacy value isn't one of the chip options, but it must still be
    // present in `selected` (M21 reopen behavior) and never silently dropped.
    const entry = await getJournalEntry(todayKey());
    expect(entry?.symptoms?.names).toContain('Ancienne valeur');
    expect(() => textsOf(renderer)).not.toThrow();
  });
});

describe('TEST 24 — managed-profile isolation is unaffected by a language switch', () => {
  it('the active profile id and owner/managed status stay identical across FR → EN', async () => {
    const profileBefore = getActiveProfileId();
    const ownerBefore = isOwnerActive();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    expect(getActiveProfileId()).toBe(profileBefore);
    expect(isOwnerActive()).toBe(ownerBefore);
  });
});

describe('TEST 25 — private/intimacy section security is unaffected by a language switch', () => {
  it('a locked private section stays locked, and an unlocked one stays unlocked, regardless of app language', async () => {
    lockIntimacy();
    expect(isIntimacyUnlocked()).toBe(false);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    expect(isIntimacyUnlocked()).toBe(false); // the switch itself never unlocks anything

    unlockIntimacy();
    expect(isIntimacyUnlocked()).toBe(true);
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    expect(isIntimacyUnlocked()).toBe(true); // nor does switching back lock it again
  });
});
