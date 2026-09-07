import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

import CustomBottomTabBar from '../CustomBottomTabBar';

// Floating-overlay structural hardening. Supersedes the earlier
// "theme-following background" test for this component: the outer
// `bottomBarArea` wrapper no longer paints any background of its own (it
// used to follow `theme.colors.background`) — it is now a fully
// transparent, absolutely-positioned overlay so the REAL active screen's
// own background/gradient shows through behind the pill in every theme.
// The pill, center "+" button, tab icons/labels, and navigation behavior
// are all deliberately frozen and out of scope for this change.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 24},
};

const FAKE_STATE: BottomTabBarProps['state'] = {
  key: 'tab-test',
  index: 0,
  routeNames: ['CycleHome', 'Calendar', 'Statistics', 'Profile'],
  routes: [
    {key: 'CycleHome-1', name: 'CycleHome'},
    {key: 'Calendar-1', name: 'Calendar'},
    {key: 'Statistics-1', name: 'Statistics'},
    {key: 'Profile-1', name: 'Profile'},
  ],
  type: 'tab',
  stale: false,
} as unknown as BottomTabBarProps['state'];

function fakeNavigation() {
  return {
    emit: jest.fn().mockReturnValue({defaultPrevented: false}),
    navigate: jest.fn(),
  } as unknown as BottomTabBarProps['navigation'];
}

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

/** Uniquely identifies the outer `bottomBarArea` wrapper: it's the only
 * node in the tree carrying a `paddingBottom` together with a `position`
 * (the inner pill has neither — it has `paddingHorizontal` instead). */
function findOuterWrapper(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(node => {
    if (!node.props?.style) {return false;}
    const flat = flattenStyle(node.props.style);
    return typeof flat.position !== 'undefined' && typeof flat.paddingBottom !== 'undefined';
  })[0];
}

async function renderTabBar() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <CustomBottomTabBar
              descriptors={{} as BottomTabBarProps['descriptors']}
              insets={TEST_METRICS.insets}
              navigation={fakeNavigation()}
              state={FAKE_STATE}
            />
          </JournalSheetProvider>
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

/* ============================================================
   STATIC GUARD
============================================================ */

describe('CustomBottomTabBar — static guard', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../CustomBottomTabBar.tsx'),
    'utf8',
  );

  it('the outer wrapper is absolutely positioned, pinned to the bottom edge', () => {
    expect(source).toMatch(/position:\s*['"]absolute['"]/);
    expect(source).toMatch(/left:\s*0/);
    expect(source).toMatch(/right:\s*0/);
    expect(source).toMatch(/bottom:\s*0/);
  });

  it('the outer wrapper paints no visible background of its own', () => {
    expect(source).toMatch(/backgroundColor:\s*['"]transparent['"]/);
    expect(source).not.toContain('#F7F3FF');
  });

  it('the outer wrapper itself paints no local, theme-independent background (it stays a transparent pass-through)', () => {
    expect(source).not.toMatch(/bottomBarArea:\s*\{[^}]*useColorScheme/);
    expect(source).not.toMatch(/\bisDark\s*\?/);
  });

  it('the pill and center button now resolve their color from the AWA theme (E9 migration — no fixed purple literals)', () => {
    expect(source).not.toContain('PURPLE_DARK');
    expect(source).not.toContain("PURPLE = '#6949BE'");
    expect(source).toMatch(/useAwaTheme\s*\(/);
    expect(source).toMatch(/backgroundColor:\s*theme\.colors\.accent/);
    expect(source).toMatch(/backgroundColor:\s*theme\.colors\.primary/);
    expect(source).toMatch(/height:\s*58/);
    expect(source).toMatch(/borderRadius:\s*34/);
    expect(source).toMatch(/marginHorizontal:\s*10/);
    expect(source).toContain("label: 'Accueil'");
    expect(source).toContain("label: 'Calendrier'");
    expect(source).toContain("label: 'Statistiques'");
    expect(source).toContain("label: 'Profil'");
  });
});

/* ============================================================
   NO DEDICATED RECTANGLE — Light / Dark / True Black / palettes
============================================================ */

describe('CustomBottomTabBar — no separate background rectangle in any theme', () => {
  it('AWA Original Light: wrapper stays transparent', async () => {
    const renderer = await renderTabBar();
    expect(flattenStyle(findOuterWrapper(renderer).props.style).backgroundColor).toBe('transparent');
  });

  it('Light -> Dark: wrapper stays transparent (no strip appears) without remounting', async () => {
    const renderer = await renderTabBar();
    expect(flattenStyle(findOuterWrapper(renderer).props.style).backgroundColor).toBe('transparent');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(flattenStyle(findOuterWrapper(renderer).props.style).backgroundColor).toBe('transparent');
  });

  it('Dark + True Black: wrapper stays transparent', async () => {
    const renderer = await renderTabBar();

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });

    expect(flattenStyle(findOuterWrapper(renderer).props.style).backgroundColor).toBe('transparent');
  });

  it('palette switch (Ocean Calm): wrapper stays transparent', async () => {
    const renderer = await renderTabBar();

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(flattenStyle(findOuterWrapper(renderer).props.style).backgroundColor).toBe('transparent');
  });
});

/* ============================================================
   STRUCTURE — absolute positioning, SafeArea, pointer events
============================================================ */

describe('CustomBottomTabBar — floating overlay structure', () => {
  it('the wrapper is absolutely positioned and pinned edge-to-edge at the bottom', async () => {
    const renderer = await renderTabBar();
    const flat = flattenStyle(findOuterWrapper(renderer).props.style);
    expect(flat.position).toBe('absolute');
    expect(flat.left).toBe(0);
    expect(flat.right).toBe(0);
    expect(flat.bottom).toBe(0);
  });

  it('SafeArea bottom padding is still applied to the outer wrapper', async () => {
    const renderer = await renderTabBar();
    const flat = flattenStyle(findOuterWrapper(renderer).props.style);
    expect(flat.paddingBottom).toBe(Math.max(TEST_METRICS.insets.bottom, 8));
  });

  it('the wrapper uses box-none pointer events so touches outside the pill pass through', async () => {
    const renderer = await renderTabBar();
    expect(findOuterWrapper(renderer).props.pointerEvents).toBe('box-none');
  });
});

/* ============================================================
   FROZEN — pill, center button, tab navigation
============================================================ */

describe('CustomBottomTabBar — pill, center button, and navigation stay frozen', () => {
  it('the pill still renders with a single resolved background sourced from the theme (E9: no longer a fixed literal)', async () => {
    const renderer = await renderTabBar();

    const pill = renderer.root.findAll(node => {
      if (!node.props?.style) {return false;}
      const flat = flattenStyle(node.props.style);
      return flat.borderRadius === 34 && typeof flat.backgroundColor === 'string';
    });
    expect(pill.length).toBeGreaterThan(0);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const pillAfterDark = renderer.root.findAll(node => {
      if (!node.props?.style) {return false;}
      const flat = flattenStyle(node.props.style);
      return flat.borderRadius === 34 && typeof flat.backgroundColor === 'string';
    });
    expect(pillAfterDark.length).toBeGreaterThan(0);
  });

  it('the center "+" button is still rendered', async () => {
    const renderer = await renderTabBar();
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Ajouter'}).length).toBeGreaterThan(0);
  });

  it('tab press still emits a navigation event', async () => {
    const navigation = fakeNavigation();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <JournalSheetProvider>
              <CustomBottomTabBar
                descriptors={{} as BottomTabBarProps['descriptors']}
                insets={TEST_METRICS.insets}
                navigation={navigation}
                state={{...FAKE_STATE, index: 0}}
              />
            </JournalSheetProvider>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer!);

    const calendarTab = renderer!.root.findAllByProps({accessibilityRole: 'button'})[1];
    act(() => {
      calendarTab.props.onPress();
    });
    expect((navigation.emit as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({type: 'tabPress'}),
    );
  });

  it('active tab state is still reflected via accessibilityState', async () => {
    const renderer = await renderTabBar();
    const selected = renderer.root.findAll(
      node => node.props?.accessibilityState?.selected === true,
    );
    expect(selected.length).toBeGreaterThan(0);
  });
});
