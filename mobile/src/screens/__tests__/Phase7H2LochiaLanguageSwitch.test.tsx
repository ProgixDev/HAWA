import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PostpartumLochiaScreen from '../PostpartumLochiaScreen';
import PostpartumStatisticsScreen from '../postpartum/PostpartumStatisticsScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {
  getPostpartumLochiaEntry,
  hydratePostpartumLochia,
  savePostpartumLochiaEntry,
} from '../../state/postpartumLochiaStore';
import {journalOptionLabel} from '../../utils/journalOptionLabels';

// PHASE 7H.2 — Postpartum Lochia stored-value display localization.
// Representative (not exhaustive) proof that:
//   - the entry screen's flow/color/consistency/symptom chips and the
//     Statistics Lochia tab's distribution rows + history timeline all
//     translate their DISPLAY label via the existing journalOptionLabel()
//     architecture, reused with 4 new namespaces (postpartumLochiaFlow/
//     Color/Consistency/Symptom) — never a second mapping system;
//   - the persisted record (flow/color/consistency/symptoms) is always the
//     original French string, whether selected via a French or an English
//     chip, for both pre-existing and newly-created records;
//   - Entry and Statistics render the identical English label for the same
//     stored value;
//   - aggregation/counts/percentages are unaffected;
//   - an unrecognized/legacy value falls back to itself.

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

const findChip = (renderer: ReactTestRenderer.ReactTestRenderer, accessibilityLabel: string) =>
  renderer.root.findAll(
    node => node.type === Pressable && node.props.accessibilityLabel === accessibilityLabel,
  )[0];

const pressChip = async (renderer: ReactTestRenderer.ReactTestRenderer, accessibilityLabel: string) => {
  const chip = findChip(renderer, accessibilityLabel);
  if (!chip) {throw new Error(`no chip labelled "${accessibilityLabel}"`);}
  await act(async () => {
    chip.props.onPress();
  });
  await settle();
};

const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const saveText = renderer.root.findAllByType(Text).find(node => [node.props.children].flat(Infinity).join('') === 'Enregistrer' || [node.props.children].flat(Infinity).join('') === 'Save');
  if (!saveText) {throw new Error('no Save button found');}
  let node: ReactTestRenderer.ReactTestInstance | null = saveText.parent;
  while (node) {
    if (node.type === Pressable && typeof node.props.onPress === 'function') {
      await act(async () => {
        node!.props.onPress();
      });
      await settle();
      return;
    }
    node = node.parent;
  }
  throw new Error('no pressable ancestor for Save');
};

/** Lochia Statistics tab pills expose no accessibilityLabel — walk up from
 * the matching Text node, same technique proven for the other Statistics
 * screens earlier in this phase. */
async function pressTab(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const textNode = renderer.root.findAllByType(Text).find(node => [node.props.children].flat(Infinity).join('') === label);
  if (!textNode) {throw new Error(`no tab labelled "${label}"`);}
  let node: ReactTestRenderer.ReactTestInstance | null = textNode.parent;
  while (node) {
    if (node.type === Pressable && typeof node.props.onPress === 'function') {
      await act(async () => {
        node!.props.onPress();
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
  await hydratePostpartumLochia();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — Lochia flow FR/EN display on the entry screen', () => {
  it('French: "Abondant" renders as-is and is selected', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes']});
    const renderer = await renderScreen(PostpartumLochiaScreen);
    expect(textsOf(renderer)).toContain('Abondant');
    expect(findChip(renderer, 'Abondant').props.accessibilityState.selected).toBe(true);
  });

  it('English: the same stored value now displays as "Heavy", never "Abondant"', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumLochiaScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Heavy');
    expect(texts).not.toContain('Abondant');
  });
});

describe('TEST 3/4 — Lochia symptom FR/EN display on the entry screen', () => {
  it('French: "Crampes" renders as-is and is checked', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Crampes']});
    const renderer = await renderScreen(PostpartumLochiaScreen);
    expect(textsOf(renderer)).toContain('Crampes');
    expect(findChip(renderer, 'Crampes').props.accessibilityState.checked).toBe(true);
  });

  it('English: the same stored value now displays as "Cramps", never "Crampes"', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Crampes']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumLochiaScreen);
    const texts = textsOf(renderer);
    expect(texts).toContain('Cramps');
    expect(texts).not.toContain('Crampes');
  });
});

describe('TEST 5 — a pre-existing French flow value remains selected under its English chip', () => {
  it('"Modéré" shows the "Moderate" chip selected, not merely rendered', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Modéré', color: 'Rouge', consistency: 'Épais', symptoms: ['Aucun']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumLochiaScreen);
    expect(findChip(renderer, 'Moderate').props.accessibilityState.selected).toBe(true);
  });
});

describe('TEST 6 — pre-existing French symptom values remain selected under their English chips', () => {
  it('["Crampes","Fatigue"] shows "Cramps" and "Fatigue" chips checked', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Crampes', 'Fatigue']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumLochiaScreen);
    expect(findChip(renderer, 'Cramps').props.accessibilityState.checked).toBe(true);
    expect(findChip(renderer, 'Fatigue').props.accessibilityState.checked).toBe(true);
  });
});

describe('TEST 7 — selecting an English flow chip stores the French stable value', () => {
  it('tapping "Heavy" (EN) saves flow as "Abondant", never "Heavy"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumLochiaScreen);
    await pressChip(renderer, 'Heavy');
    await pressSave(renderer);
    expect(getPostpartumLochiaEntry(todayKey())?.flow).toBe('Abondant');
  });
});

describe('TEST 8 — selecting English symptom chips stores the French stable values', () => {
  it('tapping "Cramps" + "Headache" (EN) saves symptoms as ["Crampes","Maux de tête"], never the English labels', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumLochiaScreen);
    // "None" first guarantees a known starting selection regardless of any
    // leftover in-memory record from an earlier test in this file sharing
    // today's date key (the module-level store singleton is not reset
    // between tests, same as this session's other Phase 7H/7H.1 suites).
    await pressChip(renderer, 'None');
    await pressChip(renderer, 'Cramps');
    await pressChip(renderer, 'Headache');
    await pressSave(renderer);
    const saved = getPostpartumLochiaEntry(todayKey())?.symptoms;
    expect(saved).toEqual(expect.arrayContaining(['Crampes', 'Maux de tête']));
    expect(saved).not.toEqual(expect.arrayContaining(['Cramps']));
  });
});

describe('TEST 9 — Statistics Lochia tab flow labels FR/EN', () => {
  it('the flow distribution row and the history timeline both translate, "Abondant" is gone in English', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Lochia');
    const texts = textsOf(renderer);
    expect(texts).toContain('Heavy');
    expect(texts).not.toContain('Abondant');
  });
});

describe('TEST 10 — Statistics Lochia tab symptom labels FR/EN', () => {
  it('the "Associated symptoms" distribution row translates, "Crampes" is gone in English', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Crampes']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Lochia');
    const texts = textsOf(renderer);
    expect(texts).toContain('Cramps');
    expect(texts).not.toContain('Crampes');
  });
});

describe('TEST 11 — counts/percentages are stable across a language switch', () => {
  it('the distribution day-count stays "1" in both languages', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes']});
    const frenchRenderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(frenchRenderer, 'Lochies');
    expect(textsOf(frenchRenderer)).toContain('1');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const englishRenderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(englishRenderer, 'Lochia');
    const texts = textsOf(englishRenderer);
    expect(texts).toContain('1');
    expect(texts).toContain('Heavy');
  });
});

describe('TEST 12 — aggregation/grouping keys are unaffected by the display fix', () => {
  it('the persisted flow value stays "Abondant" after rendering Statistics in English', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Lochia');
    expect(textsOf(renderer)).toContain('Heavy');
    expect(getPostpartumLochiaEntry(todayKey())?.flow).toBe('Abondant');
  });
});

describe('TEST 13 — runtime FR → EN → FR updates entry-screen labels without remounting', () => {
  it('the flow chip label flips both ways while the selected value and stored record never change', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Modéré', color: 'Rose', consistency: 'Liquide', symptoms: ['Fatigue']});
    const renderer = await renderScreen(PostpartumLochiaScreen);
    expect(textsOf(renderer)).toContain('Modéré');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Moderate');
    expect(textsOf(renderer)).not.toContain('Modéré');
    expect(findChip(renderer, 'Moderate').props.accessibilityState.selected).toBe(true);

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Modéré');
    expect(textsOf(renderer)).not.toContain('Moderate');
  });
});

describe('TEST 14 — a runtime language switch never mutates the stored record', () => {
  it('the saved entry stays byte-identical through FR → EN → FR', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes', 'Fatigue']});
    const before = getPostpartumLochiaEntry(todayKey());
    await renderScreen(PostpartumLochiaScreen);

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    await settle();
    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();

    expect(getPostpartumLochiaEntry(todayKey())).toEqual(before);
  });
});

describe('TEST 15 — Entry and Statistics render the identical English label for the same stored value', () => {
  it('"Abondant" shows as "Heavy" on both the entry screen and the Statistics Lochia tab', async () => {
    await savePostpartumLochiaEntry(todayKey(), {flow: 'Abondant', color: 'Rose', consistency: 'Épais', symptoms: ['Crampes']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    const entryRenderer = await renderScreen(PostpartumLochiaScreen);
    expect(textsOf(entryRenderer)).toContain('Heavy');

    const statsRenderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(statsRenderer, 'Lochia');
    expect(textsOf(statsRenderer)).toContain('Heavy');

    expect(journalOptionLabel('postpartumLochiaFlow', 'Abondant', key => i18n.t(key, {lng: 'en'}))).toBe('Heavy');
  });
});

describe('TEST 16 — unknown/legacy stored value falls back to itself, never crashes or hides', () => {
  it('journalOptionLabel returns an unmapped legacy Lochia value unchanged, in both languages', () => {
    expect(journalOptionLabel('postpartumLochiaFlow', 'LegacyLochiaValue', key => i18n.t(key, {lng: 'fr'}))).toBe('LegacyLochiaValue');
    expect(journalOptionLabel('postpartumLochiaFlow', 'LegacyLochiaValue', key => i18n.t(key, {lng: 'en'}))).toBe('LegacyLochiaValue');
    expect(journalOptionLabel('postpartumLochiaSymptom', 'LegacyLochiaValue', key => i18n.t(key, {lng: 'en'}))).toBe('LegacyLochiaValue');
  });

  it('an unmapped legacy flow value renders unchanged in the Statistics history timeline, no crash', async () => {
    // The entry screen's flow chips are a fixed known-options list (same
    // pre-existing, unrelated-to-Phase-7H.2 shape as Postpartum's other
    // "fatigue"/"pain" option sets), so an unrecognized value never gets its
    // own chip there. The history timeline renders every real entry's flow
    // unconditionally, which is where an unmapped legacy value is actually
    // reachable on screen.
    await savePostpartumLochiaEntry(todayKey(), {flow: 'LegacyLochiaValue' as never, color: 'Rose', consistency: 'Liquide', symptoms: ['Aucun']});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(PostpartumStatisticsScreen);
    await pressTab(renderer, 'Lochia');
    expect(textsOf(renderer)).toContain('LegacyLochiaValue');
  });
});
