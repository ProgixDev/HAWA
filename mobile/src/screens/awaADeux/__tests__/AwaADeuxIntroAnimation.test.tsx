import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import * as Reanimated from 'react-native-reanimated';

import '../../../i18n'; // side effect: initializes i18next (AwaADeuxIntroScreen renders via useTranslation())
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import AwaADeuxIntroScreen, {INTRO_ENTRANCE} from '../AwaADeuxIntroScreen';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// The entrance sequence and the CTA press feedback of the AWA à deux introduction.
// Animations are opacity / transform only, on Reanimated (already used by AWA), and
// the OS "reduce motion" setting (useReducedMotion) skips them without changing the
// final UI.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => false)};
});

const reducedMotion = Reanimated.useReducedMotion as unknown as jest.Mock;
const animatedStyle = (Reanimated as unknown as {getAnimatedStyle: (node: unknown) => unknown}).getAnimatedStyle;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, any> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));

async function renderScreen() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={AwaADeuxIntroScreen as never} name="AwaADeuxIntro" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const step = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

// The animated wrappers, in on-screen order.
const cards = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === 18 && flat(node.props?.style).minHeight !== undefined);
const heroBox = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).flexShrink === 1 && typeof flat(node.props?.style).flexBasis === 'number')[0];
const titleBlock = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props?.accessibilityRole === 'header')[0].parent!;
const ctaButton = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.find(node => node.props?.accessibilityLabel === 'Découvrir AWA à deux' && node.props?.accessibilityRole === 'button');
const ancestorWith = (node: ReactTestRenderer.ReactTestInstance, predicate: (style: Record<string, any>) => boolean) => {
  for (let current = node.parent; current; current = current.parent) {
    let style: Record<string, any> = {};
    try {
      style = flat(animatedStyle(current));
    } catch {
      style = {};
    }
    if (predicate(style)) {return current;}
  }
  throw new Error('no animated ancestor');
};
/** Outer wrapper of the CTA: the entrance (opacity + translateY + scale). */
const ctaWrapper = (renderer: ReactTestRenderer.ReactTestRenderer) => ancestorWith(ctaButton(renderer), style => style.opacity !== undefined);
/** Inner wrapper of the CTA: the press feedback (scale only). */
const ctaPressWrapper = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  ancestorWith(ctaButton(renderer), style => style.opacity === undefined && Array.isArray(style.transform));
const opacityOf = (node: ReactTestRenderer.ReactTestInstance) => flat(animatedStyle(node)).opacity as number;
const translateOf = (node: ReactTestRenderer.ReactTestInstance) => flat(animatedStyle(node)).transform?.find((t: any) => 'translateY' in t)?.translateY as number;
const scaleOf = (node: ReactTestRenderer.ReactTestInstance) => flat(animatedStyle(node)).transform?.find((t: any) => 'scale' in t)?.scale as number;

beforeEach(async () => {
  reducedMotion.mockReturnValue(false);
  jest.useFakeTimers();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's accessibility-label assertions ("Retour", "Découvrir AWA à deux")
  // were written against the French default. Pinning French explicitly
  // here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('Entrance sequence', () => {
  it('starts hidden and slightly offset: illustration (opacity 0, below, scale ≈ 0.96), title, four cards, CTA', async () => {
    const renderer = await renderScreen();
    expect(opacityOf(heroBox(renderer))).toBe(0);
    expect(translateOf(heroBox(renderer))).toBeGreaterThan(0);
    expect(scaleOf(heroBox(renderer))).toBeCloseTo(0.96, 2);
    expect(opacityOf(titleBlock(renderer))).toBe(0);
    cards(renderer).forEach(card => expect(opacityOf(card)).toBe(0));
    expect(opacityOf(ctaWrapper(renderer))).toBe(0);
    expect(scaleOf(ctaWrapper(renderer))).toBeLessThan(1);
  });

  it('is scheduled in order: illustration → title → four cards one after another → CTA, all within ~1.3 s', () => {
    const e = INTRO_ENTRANCE;
    expect(e.hero.delay).toBeLessThan(e.title.delay);
    expect(e.title.delay).toBeLessThan(e.cardsStart);
    const cardDelays = [0, 1, 2, 3].map(index => e.cardsStart + index * e.cardStagger);
    cardDelays.forEach((delay, index) => {
      if (index > 0) {expect(delay).toBeGreaterThan(cardDelays[index - 1]);}
    });
    expect(e.cardStagger).toBeLessThanOrEqual(120); // short stagger: the user does not wait
    expect(e.cta.delay).toBeGreaterThan(cardDelays[0]);
    const end = Math.max(e.hero.delay + e.hero.duration, e.title.delay + e.title.duration, cardDelays[3] + e.card.duration, e.cta.delay + e.cta.duration);
    expect(end).toBeLessThanOrEqual(1300);
  });

  it('is over in about a second: everything is fully visible and in place afterwards', async () => {
    const renderer = await renderScreen();
    await step(1500);
    [heroBox(renderer), titleBlock(renderer), ...cards(renderer), ctaWrapper(renderer)].forEach(node => {
      expect(opacityOf(node)).toBe(1);
      expect(translateOf(node)).toBe(0);
    });
    expect(scaleOf(ctaWrapper(renderer))).toBe(1);
  });

  it('afterwards the illustration only "breathes" between 1 and 1.01 — never a visible bounce', async () => {
    const renderer = await renderScreen();
    await step(1500);
    const breathing = heroBox(renderer).findAll(node => typeof node.type === 'string' && flat(node.props?.style).flex === 1)[0];
    const scales: number[] = [];
    for (let index = 0; index < 12; index += 1) {
      await step(600);
      scales.push(scaleOf(breathing));
    }
    scales.forEach(scale => {
      expect(scale).toBeGreaterThanOrEqual(1);
      expect(scale).toBeLessThanOrEqual(1.0101);
    });
    expect(Math.max(...scales)).toBeGreaterThan(1); // it does move, very slightly
  });

  it('the UI stays fully interactive while animating (Retour is pressable from the first frame)', async () => {
    const renderer = await renderScreen();
    const back = renderer.root.find(node => node.props.accessibilityLabel === 'Retour' && typeof node.props.onPress === 'function');
    expect(back).toBeDefined();
    const pointerBlocked = renderer.root.findAll(node => node.props?.pointerEvents === 'none');
    expect(pointerBlocked).toHaveLength(0);
  });
});

describe('Reduced motion', () => {
  it('with reduce motion the final state is there immediately: no waiting, no offset, no scale', async () => {
    reducedMotion.mockReturnValue(true);
    const renderer = await renderScreen();
    [heroBox(renderer), titleBlock(renderer), ...cards(renderer), ctaWrapper(renderer)].forEach(node => {
      expect(opacityOf(node)).toBe(1);
      expect(translateOf(node)).toBe(0);
    });
    expect(scaleOf(heroBox(renderer))).toBe(1);
  });

  it('the final layout is identical with and without animation', async () => {
    reducedMotion.mockReturnValue(true);
    const still = await renderScreen();
    const stillLayout = JSON.stringify(cards(still).map(card => [flat(card.props.style).minHeight, flat(card.props.style).paddingVertical]));
    act(() => still.unmount());
    activeRenderers.length = 0;

    reducedMotion.mockReturnValue(false);
    const animated = await renderScreen();
    await step(2000);
    const animatedLayout = JSON.stringify(cards(animated).map(card => [flat(card.props.style).minHeight, flat(card.props.style).paddingVertical]));
    expect(animatedLayout).toBe(stillLayout);
    cards(animated).forEach(card => expect(opacityOf(card)).toBe(1));
  });
});

describe('Motion is opacity / transform only, on Reanimated', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxIntroScreen.tsx'), 'utf8');

  it('reuses react-native-reanimated and no other animation library', () => {
    expect(source).toContain("from 'react-native-reanimated'");
    expect(source).not.toMatch(/from 'react-native'[^;]*\bAnimated\b/);
    expect(source).not.toMatch(/lottie|[^a-z]moti[^a-z]|framer/i);
    expect(source).toContain('useReducedMotion');
  });

  it('no timers in the component and no animation of width / height / margins', () => {
    expect(source).not.toMatch(/setTimeout|setInterval|requestAnimationFrame/);
    const styleWorklets = source.match(/useAnimatedStyle\(\(\) => \(\{[\s\S]*?\}\)\);/g) ?? [];
    expect(styleWorklets.length).toBeGreaterThan(0);
    styleWorklets.forEach(block => {
      expect(block).not.toMatch(/\b(width|height|margin\w*|padding\w*|top|left)\s*:/);
    });
  });

  it('every animated style only touches opacity / transform', async () => {
    const renderer = await renderScreen();
    await step(700);
    [heroBox(renderer), titleBlock(renderer), ...cards(renderer), ctaWrapper(renderer)].forEach(node => {
      const keys = Object.keys(flat(animatedStyle(node)));
      expect(keys.every(key => ['opacity', 'transform'].includes(key) || !['width', 'height'].includes(key))).toBe(true);
    });
  });
});

describe('CTA press feedback', () => {
  it('scales down a little on press and returns to 1 on release; navigation is not delayed (no onPress handler)', async () => {
    const renderer = await renderScreen();
    await step(1500);
    const cta = renderer.root.find(node => node.props.accessibilityLabel === 'Découvrir AWA à deux' && node.props.accessibilityRole === 'button');
    const wrapper = ctaPressWrapper(renderer);
    expect(scaleOf(wrapper)).toBe(1);

    await act(async () => {
      cta.props.onPressIn();
    });
    await step(200);
    expect(scaleOf(wrapper)).toBeLessThan(1);
    expect(scaleOf(wrapper)).toBeGreaterThanOrEqual(0.95);

    await act(async () => {
      cta.props.onPressOut();
    });
    await step(300);
    expect(scaleOf(wrapper)).toBeCloseTo(1, 3);
  });
});

describe('Theme is untouched by the animation', () => {
  it('after the entrance the cards still resolve the theme colors (Light → Dark)', async () => {
    const renderer = await renderScreen();
    await step(1500);
    const before = flat(cards(renderer)[0].props.style).backgroundColor;
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const after = flat(cards(renderer)[0].props.style).backgroundColor;
    expect(after).not.toBe(before);
  });
});
