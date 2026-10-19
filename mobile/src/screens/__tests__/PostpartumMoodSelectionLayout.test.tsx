import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PostpartumJournalEntryScreen from '../PostpartumJournalEntryScreen';
import {hydratePostpartumJournal} from '../../state/postpartumJournalStore';
import {setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Postpartum → Humeur: the "Humeur principale" section.
//  - the small icon tiles above the choices are gone (the hero heart tile and the card heading heart tile);
//  - the 5 mood cards (Très difficile … Très bien) share ONE row at one equal width and height whenever the grid is wide
//    enough, and fall back to 3 + 2 cards of one equal width when it is not;
//  - every card has the same structure: emoji circle first, label (up to 2 lines) centred under it, so the emojis line
//    up whatever the label length. Sommeil keeps its own icon tiles.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const MOODS = ['Très difficile', 'Difficile', 'Neutre', 'Bien', 'Très bien'];
const active: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderRoute(category: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={PostpartumJournalEntryScreen as never} initialParams={{category}} name="Journal" />
              <Stack.Screen name="MainTabs">{() => <Text>home</Text>}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  active.push(renderer);
  await settle();
  return renderer;
}

type Style = Record<string, unknown>;
const flat = (style: unknown): Style => {
  const resolved = typeof style === 'function' ? (style as (state: {pressed: boolean}) => unknown)({pressed: false}) : style;
  return Object.assign({}, ...(Array.isArray(resolved) ? resolved.flat(Infinity) : [resolved]).filter(Boolean));
};
const moodCards = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Pressable).filter(node => node.props.accessibilityRole === 'radio' && MOODS.includes(String(node.props.accessibilityLabel)));
const moodGrid = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.props.onLayout === 'function' && flat(node.props.style).gap === 6)[0];
const layoutGrid = async (renderer: ReactTestRenderer.ReactTestRenderer, width: number) => {
  await act(async () => {
    moodGrid(renderer).props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width, height: 90}}});
  });
};
const iconNames = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.props.name === 'string' && node.props.size !== undefined).map(node => node.props.name as string);

beforeEach(async () => {
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await hydratePostpartumJournal();
});

afterEach(() => {
  act(() => {
    active.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Postpartum Humeur — mood selection section', () => {
  it('shows no small icon tile above the mood choices (no hero tile, no card-heading tile)', async () => {
    const renderer = await renderRoute('mood');
    expect(iconNames(renderer)).not.toContain('heart-outline');
    // the rest of the screen keeps its own icons (note card, info panel)
    expect(iconNames(renderer)).toEqual(expect.arrayContaining(['pencil-outline', 'heart']));
  });

  it('Sommeil: the moon-and-stars tile of the illustrated header is gone; its other moon icons are untouched', async () => {
    const renderer = await renderRoute('sleep');
    const moons = renderer.root.findAllByType(MaterialDesignIcons).filter(icon => icon.props.name === 'weather-night');
    // card heading tile, duration stepper and info panel remain; the 46 dp rounded-square hero tile (4th) is removed
    expect(moons).toHaveLength(3);
    // nothing in the hero is a rounded square tile any more
    expect(
      renderer.root.findAll(node => {
        const style = flat(node.props.style);
        return style.width === 46 && style.height === 46 && style.borderRadius === 16;
      }),
    ).toHaveLength(0);
  });

  it('puts the 5 cards on one row at one equal width and height, on a 360 dp phone', async () => {
    const renderer = await renderRoute('mood');
    await layoutGrid(renderer, 308);
    const cards = moodCards(renderer);
    expect(cards.map(card => card.props.accessibilityLabel)).toEqual(MOODS);
    const grid = flat(moodGrid(renderer).props.style);
    expect(grid.flexDirection).toBe('row');
    expect(grid.flexWrap).toBeUndefined();
    const styles = cards.map(card => flat(card.props.style));
    styles.forEach(style => {
      expect(style).toMatchObject({flex: 1, minHeight: 88, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10});
      expect(style.width).toBeUndefined();
    });
  });

  it('keeps one row down to a 320 dp phone and falls back to 3 + 2 equal cards only on a narrower grid', async () => {
    const renderer = await renderRoute('mood');
    await layoutGrid(renderer, 268); // 320 dp phone: (268 - 4 * 6) / 5 = 48.8 dp per card
    expect(flat(moodGrid(renderer).props.style).flexWrap).toBeUndefined();
    await layoutGrid(renderer, 200); // too narrow for 5 readable cards
    expect(flat(moodGrid(renderer).props.style).flexWrap).toBe('wrap');
    const widths = moodCards(renderer).map(card => flat(card.props.style).width);
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).toBe(Math.floor((200 - 12) / 3));
  });

  it('gives every card the same structure: emoji circle, then a centred label of up to 2 lines that may shrink', async () => {
    const renderer = await renderRoute('mood');
    for (const card of moodCards(renderer)) {
      const label = card.findAllByType(Text).filter(node => node.props.numberOfLines === 2 && node.props.adjustsFontSizeToFit === true);
      expect(label).toHaveLength(1);
      expect(flat(label[0].props.style)).toMatchObject({textAlign: 'center', minHeight: 28, marginTop: 6});
      expect(String(label[0].props.children)).toBe(card.props.accessibilityLabel);
    }
  });
});
