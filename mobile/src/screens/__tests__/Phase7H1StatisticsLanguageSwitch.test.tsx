import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import StatisticsScreen from '../StatisticsScreen';
import PostpartumStatisticsScreen from '../postpartum/PostpartumStatisticsScreen';
import MiscarriageStatisticsScreen from '../miscarriage/MiscarriageStatisticsScreen';
import ContraceptionStatisticsScreen from '../contraception/ContraceptionStatisticsScreen';
import IrregularStatisticsScreen from '../irregular/IrregularStatisticsScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {
  getPostpartumJournalEntry,
  hydratePostpartumJournal,
  savePostpartumJournalField,
} from '../../state/postpartumJournalStore';
import {hydrateMiscarriageJournal, saveMiscarriageJournalField} from '../../state/miscarriageJournalStore';
import {hydrateContraceptionJournal, saveContraceptionJournalField} from '../../state/contraceptionJournalStore';
import {
  hydrateIrregularJournal,
  saveIrregularFatigueEntry,
  saveIrregularJournalField,
} from '../../state/irregularJournalStore';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import PregnancyStatisticsScreenSource from '../pregnancy/PregnancyStatisticsScreen';

// PHASE 7H.1 — Remaining Journal Statistics display mappings. Representative
// (not exhaustive) proof that:
//   - Postpartum/Miscarriage Statistics' mostFrequent* KPIs and distribution
//     rows now translate their DISPLAY label via the existing
//     journalOptionLabel() architecture, never a second mapping system;
//   - the underlying aggregation/grouping keys and counts/percentages are
//     unaffected by the display fix — only the label changes;
//   - Contraception Statistics has no reachable leak (feelings are never
//     rendered as raw text);
//   - the Cycle Statistics default free-tier view (a second, previously
//     unfixed leak site discovered THIS phase) no longer regresses;
//   - two leaks NOT in the original flagged list, discovered by this
//     phase's own audit (Pregnancy Statistics' symptom KPI/monthly chip,
//     and Irregular Statistics' per-category distribution + "Associated
//     symptoms" chips), are confirmed fixed.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

const settle = async (ticks = 10) => {
  for (let index = 0; index < ticks; index += 1) {
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
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} name="Test" />
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

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

/** Tab pills in these Statistics screens expose no accessibilityLabel, only
 * visible text — walk up from the matching Text node to its nearest
 * Pressable ancestor, mirroring how a real tap resolves. Some screens gate
 * the state update behind a real (non-microtask) Animated.timing callback,
 * so a short wall-clock wait is included before re-reading the render. */
async function pressTab(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const textNode = renderer.root.findAllByType(Text).find(node => [node.props.children].flat(Infinity).join('') === label);
  if (!textNode) {throw new Error(`no tab labelled "${label}"`);}
  let node: ReactTestRenderer.ReactTestInstance | null = textNode.parent;
  while (node) {
    if (node.type === Pressable && typeof node.props.onPress === 'function') {
      await act(async () => {
        node!.props.onPress();
      });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
      });
      await settle();
      return;
    }
    node = node.parent;
  }
  throw new Error(`no pressable ancestor for tab "${label}"`);
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
  await hydratePostpartumJournal();
  await hydrateMiscarriageJournal();
  await hydrateContraceptionJournal();
  await hydrateIrregularJournal();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — Postpartum Statistics Fatigue tab: mostFrequent + distribution FR/EN', () => {
  it('French: "Forte" renders as-is, both as the KPI value and the distribution row', async () => {
    await savePostpartumJournalField(todayKey(), 'fatigue', 'Forte');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Fatigue');
    const texts = textsOf(renderer);
    expect(texts).toContain('Forte');
  });

  it('English: the same data now shows "Strong", never "Forte"', async () => {
    await savePostpartumJournalField(todayKey(), 'fatigue', 'Forte');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Fatigue');
    const texts = textsOf(renderer);
    expect(texts).toContain('Strong');
    expect(texts).not.toContain('Forte');
  });
});

describe('TEST 3 — Postpartum Statistics Pain tab distribution row FR/EN', () => {
  it('"Modérée" (FR) displays as "Moderate" (EN), never the French original', async () => {
    await savePostpartumJournalField(todayKey(), 'pain', 'Modérée');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Pain');
    const texts = textsOf(renderer);
    expect(texts).toContain('Moderate');
    expect(texts).not.toContain('Modérée');
  });
});

describe('TEST 4 — Miscarriage Statistics Bleeding tab mostFrequent FR/EN', () => {
  it('"Léger" (FR) displays as "Light" (EN)', async () => {
    await saveMiscarriageJournalField(todayKey(), 'bleeding', 'Léger');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(MiscarriageStatisticsScreen);
    await pressTab(renderer, 'Bleeding');
    const texts = textsOf(renderer);
    expect(texts).toContain('Light');
    expect(texts).not.toContain('Léger');
  });
});

describe('TEST 5 — Miscarriage Statistics Symptoms tab distribution row FR/EN', () => {
  it('"Crampes" (FR) displays as "Cramps" (EN)', async () => {
    await saveMiscarriageJournalField(todayKey(), 'physicalSymptoms', ['Crampes']);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(MiscarriageStatisticsScreen);
    await pressTab(renderer, 'Symptoms');
    const texts = textsOf(renderer);
    expect(texts).toContain('Cramps');
    expect(texts).not.toContain('Crampes');
  });
});

describe('TEST 6 — Contraception Statistics has no reachable raw-French leak', () => {
  it('saved "Nausées" feelings never surface as raw text in English (no method configured to unlock detailed tracking)', async () => {
    await saveContraceptionJournalField(todayKey(), 'feelings', ['Nausées']);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(ContraceptionStatisticsScreen);
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Nausées');
  });
});

describe('TEST 7 — raw aggregation/persisted keys are unaffected by the display fix', () => {
  it('the stored fatigue value stays "Forte" after rendering Statistics in English', async () => {
    await savePostpartumJournalField(todayKey(), 'fatigue', 'Forte');
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Fatigue');
    expect(textsOf(renderer)).toContain('Strong');
    expect(getPostpartumJournalEntry(todayKey())?.fatigue).toBe('Forte');
  });
});

describe('TEST 8 — counts/percentages are stable across a language switch', () => {
  it('"Days logged" / distribution day-count stays "1" in both French and English', async () => {
    await savePostpartumJournalField(todayKey(), 'fatigue', 'Forte');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Fatigue');
    const frenchTexts = textsOf(renderer);
    expect(frenchTexts).toContain('1');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    const englishTexts = textsOf(renderer);
    expect(englishTexts).toContain('1');
    expect(englishTexts).toContain('Strong');
  });
});

describe('TEST 9 — unknown/legacy stored value falls back to itself, never crashes or hides', () => {
  it('journalOptionLabel returns an unmapped legacy value unchanged, in both languages', () => {
    // Statistics screens aggregate mostFrequent/distribution against each
    // objective's fixed known-options list (e.g. countByOption(...,
    // POSTPARTUM_FATIGUE_OPTIONS)) — pre-existing, unrelated to Phase 7H.1 —
    // so an unrecognized legacy value never reaches that particular KPI.
    // The fallback guarantee itself belongs to journalOptionLabel(), proven
    // directly here exactly as Phase 7H's own test suite already does.
    expect(journalOptionLabel('postpartumFatigue', 'ValeurHéritée', key => i18n.t(key, {lng: 'fr'}))).toBe('ValeurHéritée');
    expect(journalOptionLabel('postpartumFatigue', 'ValeurHéritée', key => i18n.t(key, {lng: 'en'}))).toBe('ValeurHéritée');
    expect(journalOptionLabel('miscarriageBleeding', 'LegacyUnknown', key => i18n.t(key, {lng: 'en'}))).toBe('LegacyUnknown');
  });
});

describe('TEST 10 — runtime FR → EN → FR on one mounted Statistics screen instance', () => {
  it('the Fatigue KPI label flips both ways while the persisted value never changes', async () => {
    await savePostpartumJournalField(todayKey(), 'fatigue', 'Forte');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Fatigue');
    expect(textsOf(renderer)).toContain('Forte');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Strong');
    expect(textsOf(renderer)).not.toContain('Forte');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Forte');
    expect(textsOf(renderer)).not.toContain('Strong');
    expect(getPostpartumJournalEntry(todayKey())?.fatigue).toBe('Forte');
  });
});

describe('TEST 11 — Cycle Statistics default view regression (the second leak site fixed this phase)', () => {
  it('the free-tier "most frequent symptoms" section translates, no "Crampes" leak remains', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await saveJournalSection('2026-09-20', 'symptoms', {names: ['Crampes'], severity: 'mild'});
    const renderer = await renderScreen(StatisticsScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Cramps');
    expect(texts).not.toContain('Crampes');
  });
});

describe('TEST 12 — leaks discovered by this phase\'s own audit (not on the original flagged list) are fixed', () => {
  it('Pregnancy Statistics wires journalOptionLabel at its symptom KPI render site (static source proof)', () => {
    const source: string = require('fs').readFileSync(
      require.resolve('../pregnancy/PregnancyStatisticsScreen.tsx'),
      'utf8',
    );
    expect(source).toMatch(/journalOptionLabel\('pregnancySymptom',\s*mostFrequentSymptom\.name,\s*t\)/);
    expect(PregnancyStatisticsScreenSource).toBeDefined();
    expect(journalOptionLabel('pregnancySymptom', 'Nausées', key => i18n.t(key, {lng: 'en'}))).toBe('Nausea');
    expect(journalOptionLabel('pregnancySymptom', 'Nausées', key => i18n.t(key, {lng: 'fr'}))).toBe('Nausées');
  });

  it('Irregular Statistics\' per-category distribution and "Associated symptoms" chips translate, FR values stay unchanged', async () => {
    await saveIrregularJournalField(todayKey(), 'pain', 'Modérée');
    await saveIrregularFatigueEntry(todayKey(), 'Forte', ['Crampes']);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(IrregularStatisticsScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Moderate');
    expect(texts).toContain('Strong');
    expect(texts.some(text => text.includes('Cramps'))).toBe(true);
    expect(texts).not.toContain('Modérée');
    expect(texts.some(text => text.includes('Forte'))).toBe(false);
    expect(texts.some(text => text.includes('Crampes'))).toBe(false);
  });
});
