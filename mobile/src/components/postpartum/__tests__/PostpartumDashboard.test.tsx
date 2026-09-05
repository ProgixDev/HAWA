import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PostpartumDashboard from '../PostpartumDashboard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {confirmDelivery} from '../../../state/postpartumPreferences';

// PostpartumDashboard (via usePrayerPurityStatus/useFocusEffect) needs a real
// NavigationContainer ancestor — same minimal single-screen stack harness as
// every prior dashboard test (D1-D5).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderDashboard() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <PostpartumDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // Confirmed real delivery date — renders the hero/lochia/cycle-return
  // branch instead of the "Indique ta date d'accouchement" unconfigured
  // state.
  await confirmDelivery(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000));
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('PostpartumDashboard — resolved global theme', () => {
  it('consumes useAwaTheme() — background gradient matches AWA Original canonical values', async () => {
    const renderer = await renderDashboard();
    const gradient = renderer.root.findByType(LinearGradient);
    expect(gradient.props.colors).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });

  it('page background changes when the palette changes, without remounting', async () => {
    const renderer = await renderDashboard();
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).toBe('#FAF8FD');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });

  it('changes Light -> Dark without remounting', async () => {
    const renderer = await renderDashboard();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });
});

describe('PostpartumDashboard — true black', () => {
  it('true-black affects the page background only once Dark is resolved', async () => {
    const renderer = await renderDashboard();
    const background = renderer.root.findByType(LinearGradient);
    const lightBg = flattenStyle(background.props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(flattenStyle(background.props.style).backgroundColor).toBe(lightBg);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flattenStyle(background.props.style).backgroundColor).toBe('#030304');
  });
});

describe('PostpartumDashboard — postpartum data unchanged by theme', () => {
  it('postpartum day text and cycle-return state stay identical across a palette switch', async () => {
    const renderer = await renderDashboard();
    // The hero's "Jour {status.postpartumDay}" Text renders as a
    // ["Jour ", <number>] children array — distinct from the
    // SpiritualGuidanceCard's own "Jour X · ..." interpolated string.
    const findHeroDay = () =>
      renderer.root.findAll(
        node => Array.isArray(node.props.children) && node.props.children[0] === 'Jour ',
      )[0]?.props.children[1];
    const findCycleReturn = () =>
      renderer.root.findAll(node => node.props.children === 'Cycle non repris')[0];

    const beforeDay = findHeroDay();
    expect(typeof beforeDay).toBe('number');
    expect(findCycleReturn()).toBeTruthy();

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(findHeroDay()).toBe(beforeDay);
    expect(findCycleReturn()).toBeTruthy();
  });
});

describe('PostpartumDashboard — Premium fallback', () => {
  it('reverts screen-level chrome to AWA Original when Premium is lost, without remounting', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderDashboard();
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).not.toBe('#FAF8FD');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    expect(gradientColors()).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });
});

describe('PostpartumDashboard — no palette-ID / Midnight dependency', () => {
  it('never references midnight anywhere in the module', () => {
    // Static guard: fails loudly if a future edit reintroduces a Midnight
    // reference into this file.
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumDashboard.tsx'), 'utf8');
    expect(source).not.toMatch(/midnight/i);
  });
});
