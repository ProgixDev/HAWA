import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PregnancyDashboard from '../PregnancyDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {
  setPregnancyDating,
  setPregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../../../state/pregnancyPreferences';
import {saveJournalSection} from '../../../state/dailyJournalStore';
import {
  deletePregnancyWeight,
  savePregnancyMedicalInformation,
  savePregnancySymptoms,
  savePregnancyWeight,
} from '../../../state/pregnancyJournalStore';
import {addDays} from '../../../utils/cycleMath';

// "Suivi du jour" on the Pregnancy Dashboard: each of the 5 categories shows the
// shared AWA completed state (solid icon + success check badge) ONLY when its own
// persisted data exists for today. The X / N counter and progress bar are checked
// to stay unchanged.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const navigate = jest.fn();

async function renderDashboard() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <PregnancyDashboard navigation={{navigate} as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const unmountAll = () =>
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });

const LABELS = ['Symptômes', 'Poids', 'Humeur', 'Sommeil', 'Infos médicales'] as const;
type Label = (typeof LABELS)[number];
const ALL_TRACKED: PregnancyTrackingPreference[] = ['symptoms', 'weight', 'mood', 'sleep', 'medicalInfo'];

const THEME = resolveAwaTheme('awa-original', false, false);

const flat = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

/** The visual state of one "Suivi du jour" item, read from the rendered tree. */
function visualState(renderer: ReactTestRenderer.ReactTestRenderer, label: Label) {
  const item = renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];
  expect(item).toBeDefined();
  const views = item.findAllByType(View).map(node => flat(node.props.style));
  const iconBox = views.find(style => style.width === 46 && style.height === 46);
  const badge = views.find(style => style.width === 16 && style.height === 16 && style.backgroundColor === THEME.colors.success);
  return {
    iconBackground: iconBox?.backgroundColor,
    hasBadge: Boolean(badge),
    spoken: item.props.accessibilityValue,
    completed: iconBox?.backgroundColor === THEME.colors.primary && Boolean(badge),
    normal: iconBox?.backgroundColor === THEME.colors.primarySoft && !badge,
  };
}

const completedLabels = (renderer: ReactTestRenderer.ReactTestRenderer) => LABELS.filter(label => visualState(renderer, label).completed);
const normalLabels = (renderer: ReactTestRenderer.ReactTestRenderer) => LABELS.filter(label => visualState(renderer, label).normal);

const dayKey = (offset = 0) => addDays(new Date(), offset).toLocaleDateString('en-CA');
const save = {
  symptoms: (date = dayKey()) => savePregnancySymptoms({date, symptoms: ['Nausées'], updatedAt: new Date().toISOString()}),
  weight: (date = dayKey()) => savePregnancyWeight({date, valueKg: 64.5, updatedAt: new Date().toISOString()}),
  mood: (date = dayKey()) => saveJournalSection(date, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3}),
  sleep: (date = dayKey()) => saveJournalSection(date, 'sleep', {duration: '7h30', quality: 'Bon'}),
  medicalInfo: (updatedAt = new Date().toISOString(), date?: string) =>
    savePregnancyMedicalInformation({note: 'Contrôle habituel', updatedAt, ...(date ? {date} : {})}),
};

beforeEach(async () => {
  await AsyncStorage.clear();
  resetPremiumStateForTests();
  navigate.mockClear();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await setPregnancyDating({method: 'lastPeriod', date: addDays(new Date(), -70).toISOString()});
  await setPregnancyTrackingPreferences(new Set(ALL_TRACKED));
});

afterEach(() => {
  unmountAll();
});

describe('Pregnancy "Suivi du jour" — per-category completed state', () => {
  it('1. no data (0 / 5): nothing is green, every item keeps its normal look', async () => {
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual([]);
    expect(normalLabels(renderer)).toEqual([...LABELS]);
    expect(textsOf(renderer)).toContain('0 / 5');
  });

  it('the normal look is the previous one: soft icon container, primary icon colour, no badge, no spoken value', async () => {
    const renderer = await renderDashboard();
    LABELS.forEach(label => {
      const state = visualState(renderer, label);
      expect(state.iconBackground).toBe(THEME.colors.primarySoft);
      expect(state.hasBadge).toBe(false);
      expect(state.spoken).toBeUndefined();
    });
  });

  it('2. Symptoms only: only Symptoms is completed', async () => {
    await save.symptoms();
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual(['Symptômes']);
    expect(normalLabels(renderer)).toEqual(['Poids', 'Humeur', 'Sommeil', 'Infos médicales']);
    expect(textsOf(renderer)).toContain('1 / 5');
  });

  it('3. Weight only: only Weight is completed', async () => {
    await save.weight();
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual(['Poids']);
    expect(normalLabels(renderer)).toEqual(['Symptômes', 'Humeur', 'Sommeil', 'Infos médicales']);
  });

  it.each([
    ['Mood only', ['mood'], ['Humeur']],
    ['Sleep only', ['sleep'], ['Sommeil']],
    ['Medical information only', ['medicalInfo'], ['Infos médicales']],
  ] as const)('%s: only that category is completed', async (_name, sections, expected) => {
    for (const section of sections) {
      await (section === 'medicalInfo' ? save.medicalInfo() : save[section]());
    }
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual([...expected]);
    expect(normalLabels(renderer)).toEqual(LABELS.filter(label => !(expected as readonly string[]).includes(label)));
  });

  it('4. several categories (Symptoms + Mood): only those two are green, the others stay normal', async () => {
    await save.symptoms();
    await save.mood();
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual(['Symptômes', 'Humeur']);
    expect(normalLabels(renderer)).toEqual(['Poids', 'Sommeil', 'Infos médicales']);
    expect(textsOf(renderer)).toContain('2 / 5');
  });

  it('5. all five recorded: all five are green and the counter / progress bar stay 5 / 5', async () => {
    await save.symptoms();
    await save.weight();
    await save.mood();
    await save.sleep();
    await save.medicalInfo();
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual([...LABELS]);
    expect(textsOf(renderer)).toContain('5 / 5');
    const fill = renderer.root
      .findAllByType(View)
      .map(node => flat(node.props.style))
      .find(style => typeof style.width === 'string' && String(style.width).endsWith('%') && style.backgroundColor === THEME.colors.primary);
    expect(fill?.width).toBe('100%');
  });

  it('the completed state is exposed to screen readers, and the items stay pressable with the same labels and routes', async () => {
    await save.weight();
    const renderer = await renderDashboard();
    expect(visualState(renderer, 'Poids').spoken).toEqual({text: 'complété'});
    expect(visualState(renderer, 'Symptômes').spoken).toBeUndefined();

    const press = async (label: Label) => {
      const item = renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];
      await act(async () => {
        item.props.onPress();
      });
    };
    await press('Symptômes');
    await press('Poids');
    await press('Humeur');
    await press('Sommeil');
    expect(navigate.mock.calls.map(call => call[0])).toEqual(['PregnancySymptoms', 'PregnancyWeight', 'MoodEntry', 'SleepEntry']);
  });

  it('6. persisted data: a brand-new render (app reopened) rebuilds the same states from storage', async () => {
    await save.symptoms();
    await save.mood();
    await save.medicalInfo();
    const first = await renderDashboard();
    const before = completedLabels(first);
    unmountAll();

    const reopened = await renderDashboard();
    expect(completedLabels(reopened)).toEqual(before);
    expect(completedLabels(reopened)).toEqual(['Symptômes', 'Humeur', 'Infos médicales']);
    expect(textsOf(reopened)).toContain('3 / 5');
  });

  it('a category whose record is later removed returns to the normal state (state is not remembered locally)', async () => {
    await save.weight();
    const first = await renderDashboard();
    expect(completedLabels(first)).toEqual(['Poids']);
    unmountAll();

    await deletePregnancyWeight(dayKey());
    const reopened = await renderDashboard();
    expect(completedLabels(reopened)).toEqual([]);
    expect(normalLabels(reopened)).toEqual([...LABELS]);
  });

  it('7. data belonging to ANOTHER date never marks today: yesterday / tomorrow entries stay normal', async () => {
    await save.symptoms(dayKey(-1));
    await save.weight(dayKey(1));
    await save.mood(dayKey(-1));
    await save.sleep(dayKey(-7));
    await save.medicalInfo(addDays(new Date(), -1).toISOString());
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual([]);
    expect(normalLabels(renderer)).toEqual([...LABELS]);
    expect(textsOf(renderer)).toContain('0 / 5');
  });

  it('7. …and today’s data is still recognised next to other days’ data', async () => {
    await save.symptoms(dayKey(-1));
    await save.symptoms(dayKey());
    await save.weight(dayKey(-3));
    const renderer = await renderDashboard();
    expect(completedLabels(renderer)).toEqual(['Symptômes']);
    expect(normalLabels(renderer)).toEqual(['Poids', 'Humeur', 'Sommeil', 'Infos médicales']);
  });

  it('8. a category with no valid entry stays normal: an empty note or an entry for another day does not count', async () => {
    await saveJournalSection(dayKey(), 'note', {text: '   ', updatedAt: new Date().toISOString()} as never);
    await save.weight(dayKey(-2));
    const renderer = await renderDashboard();
    expect(normalLabels(renderer)).toEqual([...LABELS]);
  });

  it('each item is independent of the counter: green follows the category, not X / 5', async () => {
    await save.sleep();
    await save.medicalInfo();
    const renderer = await renderDashboard();
    // 2 of 5 are done: exactly those two are green — not "the first two" nor "all".
    expect(completedLabels(renderer)).toEqual(['Sommeil', 'Infos médicales']);
    expect(textsOf(renderer)).toContain('2 / 5');
  });

  it('uses the existing success token and the theme (no hard-coded green): also in Dark', async () => {
    await save.symptoms();
    const source = fs.readFileSync(path.resolve(__dirname, '../PregnancyDashboard.tsx'), 'utf8');
    const doneBadgeBlock = source.slice(source.indexOf('doneBadge: {'));
    expect(doneBadgeBlock.slice(0, 400)).toContain('theme.colors.success');
    expect(doneBadgeBlock.slice(0, 400)).not.toMatch(/#[0-9A-Fa-f]{6}/);

    const renderer = await renderDashboard();
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    const item = renderer.root.findAll(node => node.props.accessibilityLabel === 'Symptômes' && typeof node.props.onPress === 'function')[0];
    const badge = item.findAllByType(View).map(node => flat(node.props.style)).find(style => style.width === 16);
    expect(badge?.backgroundColor).toBe(dark.colors.success);
  });
});
