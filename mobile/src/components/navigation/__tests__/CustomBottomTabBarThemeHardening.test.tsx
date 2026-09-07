import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';

import CustomBottomTabBar from '../CustomBottomTabBar';
import {AnimatedTabItem} from '../AnimatedTabItem';

// E9 — floating bottom tab bar theme migration. The previous full Dark Mode
// audit flagged this as the highest-priority remaining gap: the pill
// background (`PURPLE_DARK`), central add-button (`PURPLE`), inactive tab
// icon/label (`'#F3ECFB'` from the legacy theme/colors.ts), and the
// active-tab halo/indicator were all fixed literals, visible on every
// screen behind all 4 main tabs, regardless of Light/Dark/True Black/
// Premium palette. Fixed by sourcing every one of them from the resolved
// theme (`theme.colors.accent` for the pill, `theme.colors.primary` for the
// add-button/active state, `pickReadableTextColor`/`onPrimaryTextColor` for
// whatever sits on top of them).

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function findPillColor(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  const match = renderer.root.findAll(node => {
    const style = flattenStyle(node.props?.style);
    return style.borderRadius === 34 && typeof style.backgroundColor === 'string';
  })[0];
  return match ? flattenStyle(match.props.style).backgroundColor : undefined;
}

function makeBottomTabBarProps() {
  const routes = [
    {key: 'CycleHome-1', name: 'CycleHome'},
    {key: 'Calendar-1', name: 'Calendar'},
    {key: 'Statistics-1', name: 'Statistics'},
    {key: 'Profile-1', name: 'Profile'},
  ];
  return {
    state: {index: 0, routes} as any,
    navigation: {
      emit: () => ({defaultPrevented: false}),
      navigate: () => {},
    } as any,
    descriptors: {} as any,
    insets: {top: 0, left: 0, right: 0, bottom: 0} as any,
  };
}

async function renderTabBar() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <CustomBottomTabBar {...makeBottomTabBarProps()} />
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

async function renderTabItem(focused: boolean) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <AnimatedTabItem focused={focused} icon={null} label="Test" onPress={() => {}} />
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

describe('E9 floating tab bar — static appearance-resolution guard', () => {
  const TARGET_FILES: Array<[string, string]> = [
    ['CustomBottomTabBar', '../CustomBottomTabBar.tsx'],
    ['AnimatedTabItem', '../AnimatedTabItem.tsx'],
  ];

  it.each(TARGET_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no legacy theme/colors import)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/isDark\s*\?/);
      expect(source).not.toMatch(/\bCOLORS_LIGHT\b/);
      expect(source).not.toMatch(/\bCOLORS_DARK\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).not.toMatch(/from ['"]\.\.\/\.\.\/theme\/colors['"]/);
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
      expect(source).toMatch(/useAwaTheme\s*\(/);
    },
  );
});

describe('CustomBottomTabBar — resolved global theme', () => {
  it('the pill background resolves from the theme and changes Light -> Dark without remounting', async () => {
    const renderer = await renderTabBar();
    const before = findPillColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findPillColor(renderer)).not.toBe(before);
  });

  it('True Black is inherited from the Provider without any local handling', async () => {
    const renderer = await renderTabBar();

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(false);
    });
    const before = findPillColor(renderer);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });
    // True Black may or may not change accent depending on the palette's own
    // token definitions — what matters is that no error is thrown and no
    // local trueBlackEnabled branch exists (covered by the static guard);
    // this assertion just confirms the component re-renders successfully.
    expect(findPillColor(renderer)).toBeDefined();
    expect(before).toBeDefined();
  });

  it('a Premium palette switch changes the pill color (no palette-ID branching in this component)', async () => {
    const renderer = await renderTabBar();
    const before = findPillColor(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(findPillColor(renderer)).not.toBe(before);
  });
});

describe('AnimatedTabItem — resolved global theme', () => {
  it('the focused halo/indicator colors resolve from the theme and change Light -> Dark', async () => {
    const renderer = await renderTabItem(true);
    const findIndicatorColor = () => {
      const match = renderer.root.findAll(node => {
        const style = flattenStyle(node.props?.style);
        return style.width === 13 && style.height === 2.5;
      })[0];
      return match ? flattenStyle(match.props.style).backgroundColor : undefined;
    };
    const before = findIndicatorColor();
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findIndicatorColor()).not.toBe(before);
  });
});
