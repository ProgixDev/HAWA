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
import {pickReadableTextColor} from '../../../theme/awaThemeTokens';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import MenopauseDashboard from '../MenopauseDashboard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {setMenopauseStage} from '../../../state/menopausePreferences';
import {saveMenopauseJournalField} from '../../../state/menopauseJournalStore';

// MenopauseDashboard (via usePrayerPurityStatus/useFocusEffect) needs a real
// NavigationContainer ancestor — same minimal single-screen stack harness as
// every prior dashboard test (D1-D7).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const todayKey = (): string => new Date().toLocaleDateString('en-CA');

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
                  {() => <MenopauseDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
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
  // Confirmed real stage + a symptom entry — renders the hero/stage/daily
  // branches instead of the "Non renseignée" unconfigured state.
  await setMenopauseStage('perimenopause');
  await saveMenopauseJournalField(todayKey(), 'symptoms', ['hot_flashes']);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('MenopauseDashboard — resolved global theme', () => {
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

describe('MenopauseDashboard — true black', () => {
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

describe('MenopauseDashboard — "Mon étape" stage icons readable in dark mode', () => {
  // The 3 stage-option icons render at size=22 (PremiumChoiceCard's own
  // fixed icon size) — the dashboard also reuses these exact icon names
  // elsewhere at other sizes (the 82px decorative hero flower, the 14px
  // stage-badge glyph, the progress-ring center icon), so filtering on
  // size=22 is what uniquely picks out the "Mon étape" sheet's own icons.
  const STAGE_OPTION_ICON_NAMES = ['weather-sunset', 'flower-outline', 'help-circle-outline'];
  const LIGHT_TINTS = ['#FDF0E4', '#E7F0E8', '#EFE7F4'];

  async function openStageModal(renderer: ReactTestRenderer.ReactTestRenderer) {
    const editButton = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Modifier mon étape',
    )[0];
    await act(async () => {
      editButton.props.onPress();
    });
  }

  function findStageOptionIcon(renderer: ReactTestRenderer.ReactTestRenderer, iconName: string) {
    return renderer.root.findAll(node => node.props.name === iconName && node.props.size === 22)[0];
  }

  it('light mode keeps each option\'s own distinct pastel chip and the original uniform primary icon color (no regression)', async () => {
    const renderer = await renderDashboard();
    await openStageModal(renderer);

    const boxes = STAGE_OPTION_ICON_NAMES.map(name => {
      const icon = findStageOptionIcon(renderer, name);
      return {icon, box: flattenStyle(icon.parent!.props.style)};
    });

    boxes.forEach(({box}, i) => expect(box.backgroundColor).toBe(LIGHT_TINTS[i]));
    boxes.forEach(({icon}) => expect(icon.props.color).toBe('#6D4AE8'));
    expect(new Set(boxes.map(({box}) => box.backgroundColor)).size).toBe(3);
  });

  it('dark mode never reuses the light pastel chip, derives a readable icon color from the real resulting background, and keeps each option visually distinct', async () => {
    const renderer = await renderDashboard();
    await openStageModal(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const boxes = STAGE_OPTION_ICON_NAMES.map(name => {
      const icon = findStageOptionIcon(renderer, name);
      return {icon, box: flattenStyle(icon.parent!.props.style)};
    });

    boxes.forEach(({box}, i) => {
      expect(box.backgroundColor).not.toBe(LIGHT_TINTS[i]);
      expect(box.backgroundColor).not.toBe('#FFFFFF');
    });

    boxes.forEach(({icon, box}) => {
      expect(icon.props.color).toBe(pickReadableTextColor(box.backgroundColor as string));
    });

    expect(new Set(boxes.map(({box}) => box.backgroundColor)).size).toBe(3);
  });
});

describe('MenopauseDashboard — stage/symptom data unchanged by theme, no reclassification', () => {
  it('stage label and symptom count stay identical across a palette switch', async () => {
    const renderer = await renderDashboard();
    const findStageLabel = () => renderer.root.findAll(node => node.props.children === 'Périménopause')[0];
    const findSymptomsValue = () =>
      renderer.root.findAll(node => node.props.children === '1 symptôme enregistré')[0];

    expect(findStageLabel()).toBeTruthy();
    expect(findSymptomsValue()).toBeTruthy();

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(findStageLabel()).toBeTruthy();
    expect(findSymptomsValue()).toBeTruthy();
  });
});

describe('MenopauseDashboard — Premium fallback', () => {
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

describe('MenopauseDashboard — no palette-ID / Midnight dependency', () => {
  it('never references midnight anywhere in the module', () => {
    // Static guard: fails loudly if a future edit reintroduces a Midnight
    // reference into this file.
    const source = fs.readFileSync(path.resolve(__dirname, '../MenopauseDashboard.tsx'), 'utf8');
    expect(source).not.toMatch(/midnight/i);
  });
});
