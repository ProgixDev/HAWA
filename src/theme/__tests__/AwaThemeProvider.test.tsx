import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider, useAwaTheme} from '../AwaThemeProvider';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

// Only the specific internal module backing RN's useColorScheme() is
// mocked (not the whole 'react-native' package, whose own index.js has
// lazy native-module getters that throw outside a real app) — this is the
// standard, narrow way to drive this one hook per test.
let mockColorScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme,
}));

function Probe({onValue}: {onValue: (value: ReturnType<typeof useAwaTheme>) => void}): null {
  onValue(useAwaTheme());
  return null;
}

// Every renderer created via renderWithProvider() is tracked and unmounted
// in afterEach — react-test-renderer never does this automatically, and a
// still-mounted tree from a previous test keeps its subscriptions alive,
// producing spurious "not wrapped in act()" warnings once a later test
// changes premiumStore/themePreferences state again.
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderWithProvider() {
  let latest: ReturnType<typeof useAwaTheme> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <Probe onValue={value => {latest = value;}} />
      </AwaThemeProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return {
    renderer: renderer!,
    getValue: () => latest!,
  };
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

describe('AwaThemeProvider — context safety', () => {
  it('useAwaTheme() throws clearly when called outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      act(() => {
        ReactTestRenderer.create(<Probe onValue={() => {}} />);
      });
    }).toThrow('useAwaTheme() must be called within an AwaThemeProvider.');
    consoleError.mockRestore();
  });
});

describe('AwaThemeProvider — selectedThemeId resolution', () => {
  it('a Premium user selecting a Premium palette gets that palette as the effective theme', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    const {getValue} = await renderWithProvider();

    expect(getValue().selectedThemeId).toBe('sage-serenity');
    expect(getValue().effectiveThemeId).toBe('sage-serenity');
    expect(getValue().theme.id).toBe('sage-serenity');
  });

  it('a Free user who selected (or retained) a Premium palette safely resolves to AWA Original', async () => {
    updatePremiumState({isPremium: false, initialized: true});
    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    const {getValue} = await renderWithProvider();

    expect(getValue().selectedThemeId).toBe('rose-quartz');
    expect(getValue().effectiveThemeId).toBe('awa-original');
    expect(getValue().theme.id).toBe('awa-original');
  });
});

describe('AwaThemeProvider — Premium downgrade/restoration reactivity', () => {
  it('downgrading Premium while mounted flips the effective theme immediately, without unmounting', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().theme.id).toBe('ocean-calm');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    expect(getValue().effectiveThemeId).toBe('awa-original');
    expect(getValue().theme.id).toBe('awa-original');
  });

  it('restoring Premium afterwards makes the ORIGINALLY selected palette effective again — the persisted choice was never erased', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().theme.id).toBe('warm-sand');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });
    expect(getValue().theme.id).toBe('awa-original');
    // The user's actual selection must still be intact in storage/state —
    // downgrading must never delete it.
    expect(getValue().selectedThemeId).toBe('warm-sand');

    await act(async () => {
      updatePremiumState({isPremium: true});
    });
    expect(getValue().theme.id).toBe('warm-sand');
  });
});

describe('AwaThemeProvider — appearance mode', () => {
  it('"light" forces the light variant regardless of device scheme', async () => {
    mockColorScheme = 'dark';
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setAppearanceMode('light');
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().isDark).toBe(false);
    expect(getValue().resolvedAppearanceMode).toBe('light');
  });

  it('"dark" forces the dark variant regardless of device scheme', async () => {
    mockColorScheme = 'light';
    await act(async () => {
      await setAppearanceMode('dark');
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().isDark).toBe(true);
    expect(getValue().resolvedAppearanceMode).toBe('dark');
  });

  it('"system" follows the real device color scheme', async () => {
    await act(async () => {
      await setAppearanceMode('system');
    });

    mockColorScheme = 'dark';
    const dark = await renderWithProvider();
    expect(dark.getValue().isDark).toBe(true);

    mockColorScheme = 'light';
    const light = await renderWithProvider();
    expect(light.getValue().isDark).toBe(false);
  });

  it('palette selection stays independent of appearance mode — Rose Quartz + System + device Dark → Rose Quartz dark variant', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    mockColorScheme = 'dark';
    await act(async () => {
      await setSelectedThemeId('rose-quartz');
      await setAppearanceMode('system');
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().theme.id).toBe('rose-quartz');
    expect(getValue().isDark).toBe(true);
  });
});

describe('AwaThemeProvider — true black', () => {
  it('affects only Dark: no visual effect while in Light mode', async () => {
    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().trueBlackEnabled).toBe(true);
    expect(getValue().theme.colors.background).not.toBe('#030304');
  });

  it('applies the true-black background once Dark is active', async () => {
    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });

    const {getValue} = await renderWithProvider();
    expect(getValue().theme.colors.background).toBe('#030304');
  });
});

describe('AwaThemeProvider — runtime reactivity without restart', () => {
  it('changing the selected theme updates the resolved theme on the same mounted tree', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    const {getValue} = await renderWithProvider();
    expect(getValue().theme.id).toBe('awa-original');

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(getValue().theme.id).toBe('sage-serenity');
  });
});
