import fs from 'fs';
import path from 'path';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Image} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import {confirmDelivery, recordFirstPostpartumPeriod} from '../../state/postpartumPreferences';

import PostpartumCycleReturnScreen from '../PostpartumCycleReturnScreen';

// Task C — the "Retour du cycle" hero readability fix. The hero's fixed
// illustration (postpartum-cycle-returned-card.png) is always pale
// lavender/pink, independent of the active AWA theme — before this fix,
// "STATUT ACTUEL"/"Cycle repris"/the body sentence used theme.colors.*
// tokens directly, which become LIGHT colors in Dark mode (correct for a
// dark surface) and therefore illegible against the always-light
// illustration. The fix derives their color from the illustration's own
// known tone via pickReadableTextColor, applied only while hasReturned
// (i.e. only while the illustration is actually shown) — a business-state
// check, never a theme.isDark check — so these tests assert the hero text
// color stays IDENTICAL across Light/Dark/True Black once hasReturned is
// true, which is the real signal that it no longer tracks the theme.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderScreen() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <PostpartumCycleReturnScreen navigation={{} as never} route={{params: undefined} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await confirmDelivery(new Date('2026-08-01T12:00:00'));
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

function findTextColor(renderer: ReactTestRenderer.ReactTestRenderer, text: string): unknown {
  const node = renderer.root.findAll(n => n.props.children === text || (Array.isArray(n.props.children) && n.props.children[0] === text))[0];
  return flattenStyle(node.props.style).color;
}

describe('PostpartumCycleReturnScreen hero — cycle NOT yet returned (no illustration, theme-following as before)', () => {
  it('renders the decorative glows, not the illustration, and hero text still tracks the theme normally', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAllByType(Image).length).toBe(0);

    const lightColor = findTextColor(renderer, 'Cycle non repris');
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const darkColor = findTextColor(renderer, 'Cycle non repris');
    // Unaffected by this fix — still theme.colors.text, so it legitimately
    // changes between Light and Dark.
    expect(darkColor).not.toBe(lightColor);
  });
});

describe('PostpartumCycleReturnScreen hero — cycle returned (illustration shown, readability fix applies)', () => {
  beforeEach(async () => {
    await recordFirstPostpartumPeriod(new Date('2026-09-01T12:00:00'));
  });

  it('renders the fixed illustration', async () => {
    const renderer = await renderScreen();
    const images = renderer.root.findAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    expect(images.some(img => img.props.accessibilityLabel === 'Illustration du retour du cycle')).toBe(true);
  });

  it('"STATUT ACTUEL", "Cycle repris" and the body sentence keep the EXACT SAME color across Light, Dark and True Black (no longer theme-reactive once drawn over the illustration)', async () => {
    const renderer = await renderScreen();

    const lightEyebrow = findTextColor(renderer, 'STATUT ACTUEL');
    const lightTitle = findTextColor(renderer, 'Cycle repris');
    const bodyTextStartsWith = (children: unknown): boolean => {
      const first = Array.isArray(children) ? children[0] : children;
      return typeof first === 'string' && first.startsWith('Tes premières règles');
    };
    const lightBody = renderer.root.findAll(n => bodyTextStartsWith(n.props.children))[0];
    const lightBodyColor = flattenStyle(lightBody.props.style).color;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findTextColor(renderer, 'STATUT ACTUEL')).toBe(lightEyebrow);
    expect(findTextColor(renderer, 'Cycle repris')).toBe(lightTitle);
    const darkBody = renderer.root.findAll(n => bodyTextStartsWith(n.props.children))[0];
    expect(flattenStyle(darkBody.props.style).color).toBe(lightBodyColor);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });

    expect(findTextColor(renderer, 'STATUT ACTUEL')).toBe(lightEyebrow);
    expect(findTextColor(renderer, 'Cycle repris')).toBe(lightTitle);
  });

  it('the main title color is genuinely derived from the illustration, not accidentally identical to theme.colors.text', async () => {
    const renderer = await renderScreen();
    // AWA Original light theme.colors.text is '#2F2258' — the illustration
    // fix must not merely coincide with it; it should be the dedicated
    // readable-on-illustration color instead.
    const titleColor = findTextColor(renderer, 'Cycle repris');
    expect(titleColor).not.toBe('#2F2258');
  });

  it('the title reads with excellent contrast against the illustration\'s own known light tone', async () => {
    const renderer = await renderScreen();
    const titleColor = findTextColor(renderer, 'Cycle repris') as string;
    // The illustration is a pale lavender/pink graphic — any correctly
    // "readable-on-light" color must be a dark one.
    expect(titleColor).toMatch(/^#/);
    const [r, g, b] = [titleColor.slice(1, 3), titleColor.slice(3, 5), titleColor.slice(5, 7)].map(h => parseInt(h, 16));
    const luminance = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
    expect(luminance).toBeLessThan(0.45);
  });

  it('the "Retour enregistré" status chip and calendar icon stay on their own opaque theme-reactive chip (unaffected by the illustration, legitimately changes with theme)', async () => {
    const renderer = await renderScreen();
    const chipLabel = renderer.root.findAll(n => n.props.children === 'Retour enregistré')[0];
    const lightChipTextColor = flattenStyle(chipLabel.props.style).color;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkChipLabel = renderer.root.findAll(n => n.props.children === 'Retour enregistré')[0];
    const darkChipTextColor = flattenStyle(darkChipLabel.props.style).color;
    // The chip sits on its own opaque primarySoft background, so its own
    // text legitimately follows theme.colors.primary and DOES change.
    expect(darkChipTextColor).not.toBe(lightChipTextColor);
  });
});

describe('PostpartumCycleReturnScreen hero — architecture guard', () => {
  it('never introduces theme.isDark / local isDark branching for the hero readability fix (surface-driven color logic only)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumCycleReturnScreen.tsx'), 'utf8');
    const code = source
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.replace(/\/\/.*$/, ''))
      .join('\n');
    expect(code).not.toMatch(/theme\.isDark/);
    expect(code).not.toMatch(/\bisDark\s*\?/);
    expect(code).not.toMatch(/if\s*\(\s*!?\s*isDark\s*\)/);
    expect(code).not.toMatch(/useColorScheme\s*\(/);
    expect(code).not.toMatch(/Appearance\.getColorScheme\s*\(/);
    expect(code).not.toMatch(/theme\.id\s*===/);
  });
});
