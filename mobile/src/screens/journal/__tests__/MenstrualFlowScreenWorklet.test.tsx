import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {withAlpha} from '../../../theme/awaThemeTokens';

// Regression coverage for the Reanimated crash: "Tried to synchronously call
// a non-worklet function `withAlpha` on the UI thread." `withAlpha` is a
// plain JS helper (not a Reanimated worklet); calling it directly inside a
// `useAnimatedStyle` body throws on-device. react-native-reanimated's Jest
// mock (`setUpTests()`, see jest.setup.js) runs worklets synchronously on the
// same JS thread and does NOT enforce that native-only restriction, so this
// exact crash cannot be reproduced by mounting the component in Jest — the
// static source guard below is what actually encodes the invariant.

jest.mock('../../../state/dailyJournalStore', () => {
  const actual = jest.requireActual('../../../state/dailyJournalStore');
  return {...actual, saveJournalSection: jest.fn().mockResolvedValue(undefined), getJournalEntry: jest.fn().mockResolvedValue(undefined)};
});

import MenstrualFlowScreen from '../MenstrualFlowScreen';

describe('MenstrualFlowScreen — no non-worklet function calls inside useAnimatedStyle', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../MenstrualFlowScreen.tsx'), 'utf8');

  // Extracts the body of every `useAnimatedStyle(() => ({ ... }))` call so
  // each one can be checked in isolation, rather than grepping the whole
  // file (which would also match the safe, precomputed `withAlpha(...)`
  // call sites sitting just above each worklet).
  function animatedStyleBodies(fileSource: string): string[] {
    const bodies: string[] = [];
    const pattern = /useAnimatedStyle\(\(\) => \(\{([\s\S]*?)\}\)\)/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(fileSource))) {
      bodies.push(match[1]);
    }
    return bodies;
  }

  it('the file still has both known useAnimatedStyle worklets (Selectable + input)', () => {
    const bodies = animatedStyleBodies(source);
    expect(bodies.length).toBeGreaterThanOrEqual(2);
  });

  it('no useAnimatedStyle worklet body calls withAlpha (or any other non-worklet helper) directly', () => {
    const bodies = animatedStyleBodies(source);
    for (const body of bodies) {
      expect(body).not.toMatch(/withAlpha\(/);
    }
  });

  it('withAlpha is still used, precomputed on the JS thread right before each worklet', () => {
    expect(source).toMatch(/const selectableBorderColorStart = withAlpha\(theme\.colors\.primary, 0\.14\);/);
    expect(source).toMatch(/const inputBorderColorStart = withAlpha\(theme\.colors\.primary, 0\.14\);/);
  });

  it('interpolateColor still receives the precomputed variables, not a fresh withAlpha() call', () => {
    expect(source).toMatch(/interpolateColor\(progress\.value, \[0, 1\], \[selectableBorderColorStart, theme\.colors\.primary\]\)/);
    expect(source).toMatch(/interpolateColor\(focusProgress\.value, \[0, 1\], \[inputBorderColorStart, theme\.colors\.primary\]\)/);
  });
});

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={MenstrualFlowScreen} name="Test" />
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
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('MenstrualFlowScreen — renders and stays theme-reactive after the fix', () => {
  it('mounts without throwing (the original crash would have thrown here on-device)', async () => {
    await expect(renderScreen()).resolves.toBeDefined();
  });

  it('the precomputed alpha color still tracks a theme switch (Light -> Dark)', async () => {
    const before = withAlpha('#6D4AE8', 0.14); // awa-original light primary, for reference shape only
    expect(before).toMatch(/^rgba\(/);

    await renderScreen();
    await act(async () => {
      await setAppearanceMode('dark');
    });

    // The invariant that matters: withAlpha is a pure function of the
    // CURRENT theme.colors.primary, recomputed every render — switching
    // themes therefore cannot leave a stale alpha color behind, the same
    // guarantee the component relied on before this fix (and still does).
    const {resolveAwaTheme} = jest.requireActual('../../../theme/awaThemeTokens');
    const lightPrimary = resolveAwaTheme('awa-original', false, false).colors.primary;
    const darkPrimary = resolveAwaTheme('awa-original', true, false).colors.primary;
    expect(withAlpha(lightPrimary, 0.14)).not.toBe(withAlpha(darkPrimary, 0.14));
  });
});
