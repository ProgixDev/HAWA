import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import PregnancyCalendarContent from '../PregnancyCalendarContent';
import MiscarriageCalendarContent from '../../miscarriage/MiscarriageCalendarContent';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {getPregnancyJournalState, savePregnancySymptoms, savePregnancyWeight} from '../../../state/pregnancyJournalStore';
import {hydratePregnancyDating} from '../../../state/pregnancyPreferences';
import {saveMiscarriageJournalField, hydrateMiscarriageJournal, getMiscarriageJournalEntry} from '../../../state/miscarriageJournalStore';
import {saveJournalSection} from '../../../state/dailyJournalStore';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';

// PHASE 7J — TEST 8-14: Pregnancy and Miscarriage Calendar "Suivi du jour"
// selected-day cards, confirmed by Phase 7I to render raw stored French
// (symptom/bleeding names, a French-only decimal weight separator) even in
// English UI — the exact "fixed in Statistics, missed in Calendar" pattern
// that has recurred several times in this project. Fixed by reusing the
// existing journalOptionLabel() namespaces; persisted values are proven
// unchanged.

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

async function renderScreen(Component: React.ComponentType<any>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <JournalSheetProvider>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={Component as never} name="Test" />
              </Stack.Navigator>
            </JournalSheetProvider>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

beforeEach(async () => {
  resetPremiumStateForTests();
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await AsyncStorage.clear();
  await hydratePregnancyDating();
  await hydrateMiscarriageJournal();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 8 — Pregnancy Calendar symptom display FR/EN', () => {
  it('stored ["Nausées","Ballonnements"] shows the French originals in FR and the translations in EN', async () => {
    await savePregnancySymptoms({date: todayKey(), symptoms: ['Nausées', 'Ballonnements'], updatedAt: new Date().toISOString()});
    const frRenderer = await renderScreen(PregnancyCalendarContent);
    expect(textsOf(frRenderer).some(text => text.includes('Nausées') && text.includes('Ballonnements'))).toBe(true);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(PregnancyCalendarContent);
    const enTexts = textsOf(enRenderer);
    expect(enTexts.some(text => text.includes('Nausea') && text.includes('Bloating'))).toBe(true);
    expect(enTexts.some(text => text.includes('Nausées'))).toBe(false);
  });
});

describe('TEST 9 — Pregnancy stored symptoms remain unchanged after an English render', () => {
  it('the persisted symptoms array stays byte-identical', async () => {
    const stored = ['Nausées', 'Ballonnements'];
    await savePregnancySymptoms({date: todayKey(), symptoms: stored, updatedAt: new Date().toISOString()});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PregnancyCalendarContent);
    expect(textsOf(renderer).some(text => text.includes('Nausea'))).toBe(true);
    // Re-read the raw stored record directly from the journal state module —
    // the display fix never touches what was written to storage.
    const state = await getPregnancyJournalState();
    const entry = state.symptoms.find((item: {date: string}) => item.date === todayKey());
    expect(entry?.symptoms).toEqual(stored);
  });
});

describe('TEST 10 — Pregnancy weight decimal FR/EN', () => {
  it('68.5 kg shows a comma in French and a period in English, from the same stored number', async () => {
    await savePregnancyWeight({date: todayKey(), valueKg: 68.5, updatedAt: new Date().toISOString()});
    const frRenderer = await renderScreen(PregnancyCalendarContent);
    expect(textsOf(frRenderer).some(text => text.includes('68,5 kg'))).toBe(true);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(PregnancyCalendarContent);
    const enTexts = textsOf(enRenderer);
    expect(enTexts.some(text => text.includes('68.5 kg'))).toBe(true);
    expect(enTexts.some(text => text.includes('68,5'))).toBe(false);
  });
});

describe('TEST 11 — Pregnancy sleep fallback localized when reachable', () => {
  it('a day with only a sleep quality (no duration) shows the translated quality in English', async () => {
    await saveJournalSection(todayKey(), 'sleep', {quality: 'Bonne'});
    const frRenderer = await renderScreen(PregnancyCalendarContent);
    expect(textsOf(frRenderer)).toContain('Bonne');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(PregnancyCalendarContent);
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toContain('Good');
    expect(enTexts).not.toContain('Bonne');
  });
});

describe('TEST 12 — Miscarriage Calendar bleeding display FR/EN', () => {
  it('stored "Léger" shows as-is in French and as "Light" in English', async () => {
    await saveMiscarriageJournalField(todayKey(), 'bleeding', 'Léger');
    const frRenderer = await renderScreen(MiscarriageCalendarContent);
    expect(textsOf(frRenderer)).toContain('Léger');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(MiscarriageCalendarContent);
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toContain('Light');
    expect(enTexts).not.toContain('Léger');
  });
});

describe('TEST 13 — Miscarriage Calendar symptoms display FR/EN', () => {
  it('stored ["Crampes","Fatigue"] shows the translations in English, joined the same way', async () => {
    await saveMiscarriageJournalField(todayKey(), 'physicalSymptoms', ['Crampes', 'Fatigue']);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(MiscarriageCalendarContent);
    expect(textsOf(renderer).some(text => text.includes('Cramps') && text.includes('Fatigue'))).toBe(true);
    expect(textsOf(renderer).some(text => text.includes('Crampes'))).toBe(false);
  });
});

describe('TEST 14 — Miscarriage stored bleeding/symptoms remain unchanged after an English render', () => {
  it('the persisted entry stays byte-identical', async () => {
    await saveMiscarriageJournalField(todayKey(), 'bleeding', 'Léger');
    await saveMiscarriageJournalField(todayKey(), 'physicalSymptoms', ['Crampes', 'Fatigue']);
    const before = getMiscarriageJournalEntry(todayKey());
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(MiscarriageCalendarContent);
    expect(textsOf(renderer).some(text => text.includes('Light'))).toBe(true);
    expect(getMiscarriageJournalEntry(todayKey())).toEqual(before);
  });
});
