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

// Mood screen: the emoji sits directly on its rounded card (no circular badge behind it), every mood stays selectable and
// saves its own value, and the "Niveaux du jour" heading is the title alone (no icon before it).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const MOODS: Array<{value: MoodLevel; emoji: string; labelKey: string}> = [
  {value: 'veryGood', emoji: '😊', labelKey: 'cycleHome.mood.veryGood'},
  {value: 'good', emoji: '🙂', labelKey: 'cycleHome.mood.good'},
  {value: 'neutral', emoji: '😐', labelKey: 'cycleHome.mood.neutral'},
  {value: 'stressed', emoji: '😟', labelKey: 'cycleHome.mood.stressed'},
  {value: 'irritable', emoji: '😠', labelKey: 'cycleHome.mood.irritable'},
  {value: 'anxious', emoji: '😰', labelKey: 'cycleHome.mood.anxious'},
  {value: 'sad', emoji: '😢', labelKey: 'cycleHome.mood.sad'},
  {value: 'tired', emoji: '😴', labelKey: 'cycleHome.mood.tired'},
  {value: 'motivated', emoji: '🤩', labelKey: 'cycleHome.mood.motivated'},
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
  it('shows all nine moods, each emoji directly on its card with no circular badge', async () => {
    const renderer = await renderMood();
    const cards = radios(renderer);
    expect(cards).toHaveLength(MOODS.length);
    cards.forEach((card, index) => {
      const texts = card.findAllByType(Text).map(textOf);
      expect(texts).toContain(MOODS[index].emoji);
      // No child View carrying a radius (the old 39 x 39 circle): the emoji and the label are the card's only content.
      const host = card.findAll(node => String(node.type) === 'View')[0];
      const rounded = host.findAll(node => {
        if (node === host || String(node.type) !== 'View') {return false;}
        const style = StyleSheet.flatten(node.props.style) as {borderRadius?: number} | undefined;
        return Boolean(style?.borderRadius);
      });
      expect(rounded.length).toBe(0);
    });
    // The emoji is bigger than before (was 25) and has its own line height so it is never clipped.
    const emojiNode = cards[0].findAllByType(Text).find(node => textOf(node) === MOODS[0].emoji)!;
    const style = StyleSheet.flatten(emojiNode.props.style) as {fontSize: number; lineHeight: number};
    expect(style.fontSize).toBeGreaterThanOrEqual(30);
    expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
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
