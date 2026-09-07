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
import ConceiveDashboard from '../ConceiveDashboard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';

// ConceiveDashboard (via usePrayerPurityStatus/useFocusEffect) needs a real
// NavigationContainer ancestor — same minimal single-screen stack harness as
// CycleHomeScreen.test.tsx (D1), ContraceptionDashboard.test.tsx (D2) and
// IrregularDashboard.test.tsx (D3).
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
                  {() => <ConceiveDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
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
  // Confirmed real cycle data — renders the hero fertility ring + phase
  // timeline branch instead of the "Configure ton cycle" insufficient-data
  // state, so the semantic period/fertile/ovulation/luteal colors actually
  // mount for the tests below.
  setCyclePreferences({
    ...getCyclePreferences(),
    lastPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    periodDuration: 5,
    cycleDuration: 28,
    regularity: 'yes',
  });
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('ConceiveDashboard — resolved global theme', () => {
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

describe('ConceiveDashboard — true black', () => {
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

describe('ConceiveDashboard — fertility-phase semantic colors preserved', () => {
  it('period/fertile/ovulation/luteal timeline dots never change with the palette', async () => {
    const renderer = await renderDashboard();

    // The legend row is [dot, label, value] — find each dot by walking to
    // the sibling View rendered just before its label Text.
    const findDotColorNear = (label: string) => {
      const labelNode = renderer.root.findAll(node => node.props.children === label)[0];
      const item = labelNode.parent!;
      const dot = item.children[0] as ReactTestRenderer.ReactTestInstance;
      return flattenStyle(dot.props.style).backgroundColor;
    };

    const before = {
      period: findDotColorNear('Règles'),
      fertile: findDotColorNear('Fertile'),
      ovulation: findDotColorNear('Ovulation'),
      luteal: findDotColorNear('Lutéale'),
    };
    expect(before).toEqual({
      period: '#DC7B82',
      fertile: '#8B6FD1',
      ovulation: '#4E319A',
      luteal: '#D8CDEE',
    });

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect({
      period: findDotColorNear('Règles'),
      fertile: findDotColorNear('Fertile'),
      ovulation: findDotColorNear('Ovulation'),
      luteal: findDotColorNear('Lutéale'),
    }).toEqual(before);
  });
});

describe('ConceiveDashboard — AnimatedProgressRing not reused, no re-migration needed', () => {
  it('renders its own bespoke FertilityRing (not the shared AnimatedProgressRing) and reacts to theme', async () => {
    const renderer = await renderDashboard();
    // FertilityRing's gradient last stop is theme.colors.primary.
    const lastStop = () => renderer.root.findAllByProps({offset: '1'})[0].props.stopColor;
    expect(lastStop()).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(lastStop()).not.toBe('#6D4AE8');
  });
});

describe('ConceiveDashboard — Premium fallback', () => {
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

describe('ConceiveDashboard — "Conseils pour aujourd\'hui" advice card readable in dark mode', () => {
  // Walks the real rendered host-node tree (toJSON(), not the fiber list) so
  // composite/host duplication of the same text prop can never produce an
  // ambiguous match — there is exactly one Text host node per rendered
  // string in this tree shape.
  type JsonNode = {type: string; props: Record<string, unknown>; children: Array<JsonNode | string> | null};

  type RendererJson = ReactTestRenderer.ReactTestRendererJSON | ReactTestRenderer.ReactTestRendererJSON[] | null;

  function findAllTextAncestries(json: RendererJson, text: string): JsonNode[][] {
    const matches: JsonNode[][] = [];
    const walk = (node: JsonNode | string, trail: JsonNode[]) => {
      if (typeof node === 'string') {
        if (node === text) {matches.push(trail.slice().reverse());}
        return;
      }
      for (const child of node.children ?? []) {
        walk(child, [...trail, node]);
      }
    };
    const roots = Array.isArray(json) ? json : json ? [json] : [];
    roots.forEach(root => walk(root as unknown as JsonNode, []));
    return matches;
  }

  // "Conseils pour aujourd'hui" is unique in the tree, so its own ancestry
  // unambiguously identifies the real adviceCard node object. Some phase
  // titles (e.g. "Fertilité en hausse") are legitimately rendered twice —
  // once as the hero section's own title, once mirrored as the advice
  // card's subtitle — so callers use this same adviceCard reference to pick
  // out specifically the copy that lives inside the advice card, by object
  // identity rather than by guessing position/order.
  function findAdviceCardNode(json: RendererJson): JsonNode {
    const [[, , adviceCard]] = findAllTextAncestries(json, 'Conseils pour aujourd’hui');
    return adviceCard;
  }

  function findTextWithinAdviceCard(json: RendererJson, text: string): JsonNode {
    const adviceCard = findAdviceCardNode(json);
    const match = findAllTextAncestries(json, text).find(trail => trail.includes(adviceCard));
    if (!match) {throw new Error(`"${text}" not found within the advice card`);}
    return match[0];
  }

  it('the card never reuses the light pale-pink surface in dark mode, and the title stays theme-aware instead of the fixed light-only literal', async () => {
    const renderer = await renderDashboard();

    const adviceCard = findAdviceCardNode(renderer.toJSON());
    const titleNode = findTextWithinAdviceCard(renderer.toJSON(), 'Conseils pour aujourd’hui');

    const lightCardBg = flattenStyle(adviceCard.props.style).backgroundColor;
    const lightTitleColor = flattenStyle(titleNode.props.style).color;
    expect(lightCardBg).toBe('#FBEFF6');
    expect(lightTitleColor).toBe('#2F2258');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkAdviceCard = findAdviceCardNode(renderer.toJSON());
    const darkTitleNode = findTextWithinAdviceCard(renderer.toJSON(), 'Conseils pour aujourd’hui');
    const darkCardBg = flattenStyle(darkAdviceCard.props.style).backgroundColor;
    const darkTitleColor = flattenStyle(darkTitleNode.props.style).color;

    expect(darkCardBg).not.toBe('#FBEFF6');
    expect(darkCardBg).not.toBe('#FFFFFF');
    expect(darkTitleColor).not.toBe('#2F2258');
    expect(darkTitleColor).not.toBe(lightTitleColor);
  });

  it('"Fertilité en hausse" keeps its rose highlight identity, lightened (not identical) for dark-mode contrast', async () => {
    const renderer = await renderDashboard();

    const lightSubtitleNode = findTextWithinAdviceCard(renderer.toJSON(), 'Fertilité en hausse');
    const lightColor = flattenStyle(lightSubtitleNode.props.style).color;
    expect(lightColor).toBe('#B23F63');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkSubtitleNode = findTextWithinAdviceCard(renderer.toJSON(), 'Fertilité en hausse');
    const darkColor = flattenStyle(darkSubtitleNode.props.style).color;
    expect(darkColor).not.toBe(lightColor);
    expect(darkColor).not.toBe('#B23F63');
  });
});

describe('ConceiveDashboard — no palette-ID / Midnight dependency', () => {
  it('never references midnight anywhere in the module', () => {
    // Static guard: fails loudly if a future edit reintroduces a Midnight
    // reference into this file.
    const source = fs.readFileSync(path.resolve(__dirname, '../ConceiveDashboard.tsx'), 'utf8');
    expect(source).not.toMatch(/midnight/i);
  });
});
