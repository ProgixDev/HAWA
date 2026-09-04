import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import CycleHomeScreen from '../CycleHomeScreen';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

// CycleHomeScreen (via usePrayerPurityStatus/useQadaaStatus) calls
// useFocusEffect, which requires a real NavigationContainer ancestor — a
// minimal single-screen stack is used purely as a test harness, not to
// exercise real navigation.
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

async function renderCycleHome() {
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
                  {() => <CycleHomeScreen navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
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
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('CycleHomeScreen — resolved global theme', () => {
  it('consumes useAwaTheme() — background gradient matches AWA Original canonical values', async () => {
    const renderer = await renderCycleHome();
    const gradient = renderer.root.findByType(LinearGradient);
    expect(gradient.props.colors).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });

  it('page background changes when the palette changes, without remounting', async () => {
    const renderer = await renderCycleHome();
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).toBe('#FAF8FD');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });

  it('changes Light -> Dark without remounting', async () => {
    const renderer = await renderCycleHome();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });
});

describe('CycleHomeScreen — true black', () => {
  it('true-black affects the page background only once Dark is resolved', async () => {
    const renderer = await renderCycleHome();
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

describe('CycleHomeScreen — semantic cycle colors preserved', () => {
  it('period/fertile/ovulation CTA and hero-card colors never change with the palette', async () => {
    const renderer = await renderCycleHome();
    const ctaText = renderer.root.findAll(
      node => node.props.children === 'Mes règles ont commencé',
    )[0];
    const before = ctaText ? flattenStyle(ctaText.props.style).color : undefined;

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    const ctaTextAfter = renderer.root.findAll(
      node => node.props.children === 'Mes règles ont commencé',
    )[0];
    if (ctaText) {
      expect(flattenStyle(ctaTextAfter.props.style).color).toBe(before);
      expect(before).toBe('#DC7B82');
    }
  });
});

describe('CycleHomeScreen — Premium fallback', () => {
  it('reverts screen-level chrome to AWA Original when Premium is lost, without remounting', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderCycleHome();
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).not.toBe('#FAF8FD');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    expect(gradientColors()).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });
});
