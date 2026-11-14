import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, StyleSheet, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../JournalMoodScreen';
import {getJournalEntry} from '../../../state/dailyJournalStore';
import {setActiveObjective} from '../../../state/onboardingPreferences';
import {resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../../state/activeProfileStore';
import i18n from '../../../i18n';
import {setAppLanguage} from '../../../state/themePreferences';
import type {MoodLevel} from '../../../types/journal';

// Mood screen: the mood's vector icon (the cards used emoji before) sits directly on its rounded card (no circular badge behind it), every mood stays selectable and
// saves its own value, and the "Niveaux du jour" heading is the title alone (no icon before it).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

// `icon` = the MaterialDesignIcons name JournalMoodScreen draws for the mood (the screen replaced the emoji by vector icons).
const MOODS: Array<{value: MoodLevel; icon: string; labelKey: string}> = [
  {value: 'veryGood', icon: 'emoticon-happy-outline', labelKey: 'cycleHome.mood.veryGood'},
  {value: 'good', icon: 'emoticon-outline', labelKey: 'cycleHome.mood.good'},
  {value: 'neutral', icon: 'emoticon-neutral-outline', labelKey: 'cycleHome.mood.neutral'},
  {value: 'stressed', icon: 'emoticon-confused-outline', labelKey: 'cycleHome.mood.stressed'},
  {value: 'irritable', icon: 'emoticon-angry-outline', labelKey: 'cycleHome.mood.irritable'},
  {value: 'anxious', icon: 'emoticon-frown-outline', labelKey: 'cycleHome.mood.anxious'},
  {value: 'sad', icon: 'emoticon-cry-outline', labelKey: 'cycleHome.mood.sad'},
  {value: 'tired', icon: 'sleep', labelKey: 'cycleHome.mood.tired'},
  {value: 'motivated', icon: 'emoticon-excited-outline', labelKey: 'cycleHome.mood.motivated'},
];
const LANGUAGES = ['fr', 'en', 'es', 'it', 'de', 'ru', 'tr', 'zh'] as const;

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

async function renderMood() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => <JournalMoodScreen />}</Stack.Screen>
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
const radios = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Pressable).filter(node => node.props.accessibilityRole === 'radio');

beforeEach(async () => {
  testIndex += 1;
  now = new Date(2026, 8 + Math.floor(testIndex / 28), 1 + (testIndex % 28), 15, 0, 0);
  jest.useFakeTimers({advanceTimers: true, now});
  await setActiveObjective('cycle');
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('Mood emoji cards', () => {
  it('shows all nine moods, each vector icon and its label directly on its card with no circular badge', async () => {
    const renderer = await renderMood();
    const cards = radios(renderer);
    expect(cards).toHaveLength(MOODS.length);
    cards.forEach((card, index) => {
      const texts = card.findAllByType(Text).map(textOf);
      // the card's content is exactly its icon (a glyph, drawn from the expected icon set entry) and its current-language label
      expect(card.findAll(node => node.props.name === MOODS[index].icon).length).toBeGreaterThan(0);
      expect(texts).toContain(i18n.t(MOODS[index].labelKey));
      expect(texts).toHaveLength(2);
      // No child View carrying a radius (the old 39 x 39 circle): the icon and the label are the card's only content.
      const host = card.findAll(node => String(node.type) === 'View')[0];
      const rounded = host.findAll(node => {
        if (node === host || String(node.type) !== 'View') {return false;}
        const style = StyleSheet.flatten(node.props.style) as {borderRadius?: number} | undefined;
        return Boolean(style?.borderRadius);
      });
      expect(rounded.length).toBe(0);
    });
    // The icon keeps the large size the emoji had (30) so the cards stay easy to read and to hit.
    const iconNode = cards[0].findAll(node => node.props.name === MOODS[0].icon)[0];
    expect(iconNode.props.size).toBeGreaterThanOrEqual(30);
  });

  it('every mood stays selectable (one checked at a time) and saves its own value', async () => {
    for (const mood of MOODS) {
      const renderer = await renderMood();
      const index = MOODS.indexOf(mood);
      await act(async () => {
        radios(renderer)[index].props.onPress();
      });
      const checked = radios(renderer).filter(node => node.props.accessibilityState?.checked === true);
      expect(checked).toHaveLength(1);
      expect(radios(renderer)[index].props.accessibilityState.checked).toBe(true);
      const save = renderer.root
        .findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === i18n.t('journalMood.saveMood'))
        .slice(-1)[0];
      await act(async () => {
        await save.props.onPress();
      });
      await settle();
      expect((await getJournalEntry(todayKey()))?.mood?.level).toBe(mood.value);
      act(() => {
        renderer.unmount();
      });
      activeRenderers.splice(activeRenderers.indexOf(renderer), 1);
      jest.setSystemTime(new Date(now.getTime() + 86400000 * (index + 1)));
      now = new Date(now.getTime() + 86400000 * (index + 1));
    }
  });

  it('"Niveaux du jour" is the title alone: no icon in front of it', async () => {
    const renderer = await renderMood();
    const title = renderer.root.findAllByType(Text).find(node => textOf(node) === i18n.t('journalMood.levelsSectionTitle'))!;
    expect(title).toBeDefined();
    const heading = title.parent!;
    expect(heading.findAll(node => node.props?.name === 'chart-bar')).toHaveLength(0);
    // The heading holds just the title: nothing precedes it.
    expect(heading.children.filter(child => typeof child !== 'string')).toHaveLength(1);
    // The sliders are still there.
    expect(renderer.root.findAll(node => typeof node.type === 'string' && node.props.accessibilityRole === 'adjustable')).toHaveLength(4);
  });

  it.each(LANGUAGES)('%s: every mood label is rendered on its card', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const renderer = await renderMood();
    radios(renderer).forEach((card, index) => {
      const texts = card.findAllByType(Text).map(textOf);
      expect(texts).toContain(i18n.t(MOODS[index].labelKey));
      // two lines allowed, so a long label wraps instead of being cut
      const label = card.findAllByType(Text).find(node => textOf(node) === i18n.t(MOODS[index].labelKey))!;
      expect(label.props.numberOfLines).toBe(2);
    });
  });
});
