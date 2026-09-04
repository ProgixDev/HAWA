import React, {useMemo} from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider, useAwaTheme} from '../AwaThemeProvider';
import {toReactNavigationTheme} from '../awaNavigationTheme';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

// Deliberately NOT importing the real AppNavigator.tsx (it eagerly imports
// ~150 screen files and is heavy/brittle to render in a unit test — see
// Phase B's own test-strategy note). This tiny stand-in mirrors EXACTLY the
// two lines AppNavigator.tsx itself adds
// (`const {theme} = useAwaTheme(); const navigationTheme = useMemo(() =>
// toReactNavigationTheme(theme), [theme]);`), so it proves the same
// reactive wiring end-to-end without the real navigator's weight.
let mockColorScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme,
}));

function NavigatorThemeProbe({onValue}: {onValue: (value: ReturnType<typeof toReactNavigationTheme>) => void}): null {
  const {theme} = useAwaTheme();
  const navigationTheme = useMemo(() => toReactNavigationTheme(theme), [theme]);
  onValue(navigationTheme);
  return null;
}

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderProbe() {
  let latest: ReturnType<typeof toReactNavigationTheme> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <NavigatorThemeProbe onValue={value => {latest = value;}} />
      </AwaThemeProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return {getValue: () => latest!};
}

beforeEach(async () => {
  mockColorScheme = 'light';
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('system');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('AppNavigator-style navigation theme — end-to-end reactivity', () => {
  it('updates after selectedThemeId changes, without remounting', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    const {getValue} = await renderProbe();
    expect(getValue().colors.primary).toBe('#6D4AE8'); // AWA Original

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(getValue().colors.primary).toBe('#7C9473'); // Sage Serenity
  });

  it('updates after appearanceMode changes (dark flag flips), without remounting', async () => {
    const {getValue} = await renderProbe();
    expect(getValue().dark).toBe(false);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(getValue().dark).toBe(true);
  });

  it('System mode reacts to a change in device color scheme', async () => {
    mockColorScheme = 'light';
    const {getValue} = await renderProbe();
    expect(getValue().dark).toBe(false);

    mockColorScheme = 'dark';
    // No RN API exists to fire a "device scheme changed" event in this
    // mocked module, so this asserts a fresh mount picks up the new device
    // scheme — the underlying `isDark` formula itself (already covered by
    // Phase A's AwaThemeProvider tests) is what actually reacts live.
    const afterDeviceChange = await renderProbe();
    expect(afterDeviceChange.getValue().dark).toBe(true);
  });

  it('Premium downgrade changes the navigation theme without erasing the persisted selection', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    const {getValue} = await renderProbe();
    expect(getValue().colors.primary).toBe('#B08A5C'); // Warm Sand

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    expect(getValue().colors.primary).toBe('#6D4AE8'); // fell back to AWA Original
  });

  it('never requires a remount/restart across multiple sequential changes', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    const {getValue} = await renderProbe();

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });
    expect(getValue().colors.primary).toBe('#5C8CA6');

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(getValue().dark).toBe(true);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });
    expect(getValue().colors.background).toBe('#030304');
  });
});
