import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ScrollView, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import AwaADeuxBenefitsScreen from '../AwaADeuxBenefitsScreen';
import AwaADeuxPartnerViewScreen from '../AwaADeuxPartnerViewScreen';
import AwaADeuxSharingScreen from '../AwaADeuxSharingScreen';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import {BENEFITS_COUNT, getBenefitsLayout} from '../awaADeuxBenefitsLayout';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

// "Les avantages pour vous deux": ONE viewport, no scrolling, no decorative element.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, any> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderStep(initial: 'AwaADeuxBenefits' | 'AwaADeuxPartnerView' | 'AwaADeuxSharing' | 'AwaADeuxPairing' = 'AwaADeuxBenefits') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName={initial} screenOptions={{headerShown: false}}>
              <Stack.Screen component={AwaADeuxPartnerViewScreen as never} name="AwaADeuxPartnerView" />
              <Stack.Screen component={AwaADeuxBenefitsScreen as never} name="AwaADeuxBenefits" />
              <Stack.Screen component={AwaADeuxSharingScreen as never} name="AwaADeuxSharing" />
              <Stack.Screen component={AwaADeuxPairingScreen as never} name="AwaADeuxPairing" />
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

const button = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0];
const cards = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === 22 && flat(node.props?.style).minHeight !== undefined);

beforeEach(async () => {
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('"Les avantages pour vous deux" — one screen, no scrolling', () => {
  it('has no ScrollView at all, while the other AWA à deux steps keep theirs', async () => {
    const benefits = await renderStep('AwaADeuxBenefits');
    expect(benefits.root.findAll(node => node.type === ScrollView)).toHaveLength(0);
    act(() => benefits.unmount());
    activeRenderers.length = 0;
    for (const step of ['AwaADeuxPartnerView', 'AwaADeuxSharing', 'AwaADeuxPairing'] as const) {
      const other = await renderStep(step);
      expect(other.root.findAll(node => node.type === ScrollView).length).toBeGreaterThan(0);
      act(() => other.unmount());
      activeRenderers.length = 0;
    }
  });

  it('shows the back button, the title, all five benefits and "Continuer" together', async () => {
    const renderer = await renderStep();
    const texts = textsOf(renderer);
    expect(texts).toContain('Les avantages\npour vous deux');
    for (const text of ['Un partenaire plus informé et plus attentif', 'Des conseils adaptés à chaque étape', 'Une meilleure communication', 'Un soutien au quotidien', 'Un parcours plus serein ensemble', 'Continuer']) {
      expect(texts).toContain(text);
    }
    expect(button(renderer, 'Retour')).toBeDefined();
    expect(button(renderer, 'Continuer')).toBeDefined();
    expect(cards(renderer)).toHaveLength(BENEFITS_COUNT);
  });

  it('the bottom decorative composition is gone (no leaf, sparkle, halo or extra hand-heart)', async () => {
    const renderer = await renderStep();
    const icons = renderer.root.findAll(node => typeof node.props.name === 'string').map(node => node.props.name as string);
    expect(icons).not.toContain('leaf');
    expect(icons).not.toContain('star-four-points');
    // Only the back chevron and the five benefits' own icons remain.
    expect([...new Set(icons)].filter(name => name.includes('-')).sort()).toEqual(['account-heart-outline', 'chat-outline', 'chevron-left', 'hand-heart-outline', 'heart-outline', 'lightbulb-on-outline']);
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxBenefitsScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/decor|heartHalo|leaf|sparkle|withAlpha/);
  });

  it('all five cards share the same structure and sizes', async () => {
    const renderer = await renderStep();
    const styles = cards(renderer).map(node => ({...flat(node.props.style), opacity: undefined, transform: undefined}));
    expect(styles).toHaveLength(5);
    styles.forEach(style => expect(style).toEqual(styles[0]));
  });

  it('"Continuer" still goes to "Choisissez ce que vous souhaitez partager"', async () => {
    const renderer = await renderStep();
    await act(async () => {
      button(renderer, 'Continuer').props.onPress();
    });
    await settle();
    expect(currentRoute()).toBe('AwaADeuxSharing');
    expect(textsOf(renderer)).toContain('Choisissez ce que\nvous souhaitez partager');
  });

  it('Retour still goes back', async () => {
    const renderer = await renderStep('AwaADeuxPartnerView');
    await act(async () => {
      button(renderer, 'Continuer').props.onPress();
    });
    await settle();
    expect(currentRoute()).toBe('AwaADeuxBenefits');
    await act(async () => {
      button(renderer, 'Retour').props.onPress();
    });
    await settle();
    expect(currentRoute()).toBe('AwaADeuxPartnerView');
  });
});

describe('getBenefitsLayout — the estimated layout fits every window height', () => {
  const insets: Array<[number, number]> = [[0, 0], [24, 16], [40, 34], [48, 0]];

  it.each([600, 640, 680, 720, 760, 800, 860, 900, 1000, 1100])('height %p dp: title + five cards + CTA fit without scrolling', height => {
    insets.forEach(([top, bottom]) => {
      expect(getBenefitsLayout(height, top, bottom).totalHeight).toBeLessThanOrEqual(height);
    });
  });

  it('uses the room it has: taller screens get roomier cards, never smaller ones', () => {
    let previous = getBenefitsLayout(600, 24, 16);
    for (let height = 620; height <= 1000; height += 20) {
      const next = getBenefitsLayout(height, 24, 16);
      expect(next.cardPaddingVertical).toBeGreaterThanOrEqual(previous.cardPaddingVertical);
      expect(next.textFontSize).toBeGreaterThanOrEqual(previous.textFontSize);
      expect(next.cardGap).toBeGreaterThanOrEqual(previous.cardGap);
      previous = next;
    }
  });

  it('text stays readable on the shortest screen', () => {
    const shortest = getBenefitsLayout(600, 24, 16);
    expect(shortest.textFontSize).toBeGreaterThanOrEqual(14);
    expect(shortest.titleFontSize).toBeGreaterThanOrEqual(23);
    expect(shortest.iconBox).toBeGreaterThanOrEqual(38);
  });

  it('the screen applies the sizes for the current window height and insets', async () => {
    const renderer = await renderStep();
    const {Dimensions} = require('react-native');
    const layout = getBenefitsLayout(Dimensions.get('window').height, 24, 16);
    const card = flat(cards(renderer)[0].props.style);
    expect(card.minHeight).toBe(layout.cardMinHeight);
    expect(card.paddingVertical).toBe(layout.cardPaddingVertical);
  });
});

describe('Theme is unchanged', () => {
  it('cards follow the resolved theme in Light and Dark, and there is no color literal in the screen', async () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxBenefitsScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(source).not.toMatch(/rgba?\(/);

    const renderer = await renderStep();
    const card = () => flat(cards(renderer)[0].props.style);
    const light = resolveAwaTheme('awa-original', false, false);
    expect(card().backgroundColor).toBe(light.colors.surface);
    expect(card().borderColor).toBe(light.colors.border);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(card().backgroundColor).toBe(dark.colors.surface);
    expect(card().borderColor).toBe(dark.colors.border);
    await act(async () => {
      await setAppearanceMode('light');
      await setSelectedThemeId('ocean-calm');
    });
    expect(card().backgroundColor).toBe(resolveAwaTheme('ocean-calm', false, false).colors.surface);
  });
});
