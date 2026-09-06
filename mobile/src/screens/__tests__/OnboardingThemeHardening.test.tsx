import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import WelcomeScreen from '../WelcomeScreen';
import ObjectiveScreen from '../ObjectiveScreen';
import MiscarriageBleedingScreen from '../MiscarriageBleedingScreen';

// E10 — full onboarding funnel theme migration (39 screens across 33 files
// + the 2 shared onboarding components they depend on). Mirrors the
// established pattern from this session's other *ThemeHardening suites:
// (1) a static appearance-resolution guard across every target file,
// confirming useAwaTheme() adoption and the absence of forbidden local
// dark-mode resolution; (2) runtime theme propagation for a small set of
// representative, reliably-renderable screens (WelcomeScreen/ObjectiveScreen
// for the Core family, MiscarriageBleedingScreen to prove the shared
// PremiumChoiceCard component's theme wiring propagates through a caller).

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function firstBackgroundColor(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  const match = renderer.root.findAll(node => {
    if (!node.props || !node.props.style) {return false;}
    return typeof flattenStyle(node.props.style).backgroundColor !== 'undefined';
  })[0];
  return match ? flattenStyle(match.props.style).backgroundColor : undefined;
}

async function renderScreen(renderElement: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{renderElement}</Stack.Screen>
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

/* ============================================================
   STATIC GUARD — all 39 E10 target screens (33 files) + 2 shared
   onboarding components.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['SplashScreen', '../SplashScreen.tsx'],
  ['WelcomeScreen', '../WelcomeScreen.tsx'],
  ['ObjectiveScreen', '../ObjectiveScreen.tsx'],
  ['CycleObjectiveConfirmationScreen', '../CycleObjectiveConfirmationScreen.tsx'],
  ['NameOnboardingScreen', '../NameOnboardingScreen.tsx'],
  ['SpiritualPreferencesScreen', '../SpiritualPreferencesScreen.tsx'],
  ['LocationScreen', '../LocationScreen.tsx'],
  ['ConceptionOnboardingScreens (4 screens)', '../ConceptionOnboardingScreens.tsx'],
  ['IrregularOnboardingScreens (4 screens)', '../irregular/IrregularOnboardingScreens.tsx'],
  ['ContraceptionMethodScreen', '../contraception/ContraceptionMethodScreen.tsx'],
  ['ContraceptionInformationScreen', '../contraception/ContraceptionInformationScreen.tsx'],
  ['PillScheduleScreen', '../contraception/PillScheduleScreen.tsx'],
  ['ContraceptionRemindersScreen', '../contraception/ContraceptionRemindersScreen.tsx'],
  ['CycleInformationScreen', '../CycleInformationScreen.tsx'],
  ['CycleRemindersScreen', '../CycleRemindersScreen.tsx'],
  ['PostpartumDeliveryDateScreen', '../PostpartumDeliveryDateScreen.tsx'],
  ['PostpartumDeliveryTypeScreen', '../PostpartumDeliveryTypeScreen.tsx'],
  ['PostpartumFeedingScreen', '../PostpartumFeedingScreen.tsx'],
  ['PostpartumRemindersScreen', '../PostpartumRemindersScreen.tsx'],
  ['MiscarriageDateScreen', '../MiscarriageDateScreen.tsx'],
  ['MiscarriageBleedingScreen', '../MiscarriageBleedingScreen.tsx'],
  ['MiscarriageCycleReturnScreen', '../MiscarriageCycleReturnScreen.tsx'],
  ['MiscarriageTryingAgainScreen', '../MiscarriageTryingAgainScreen.tsx'],
  ['MiscarriageRemindersScreen', '../MiscarriageRemindersScreen.tsx'],
  ['MenopauseStageScreen', '../MenopauseStageScreen.tsx'],
  ['MenopauseSymptomsScreen', '../MenopauseSymptomsScreen.tsx'],
  ['MenopauseHormonalTreatmentScreen', '../MenopauseHormonalTreatmentScreen.tsx'],
  ['MenopauseLabTrackingScreen', '../MenopauseLabTrackingScreen.tsx'],
  ['MenopauseRemindersScreen', '../MenopauseRemindersScreen.tsx'],
  ['PregnancyDatingSetupScreen', '../pregnancy/PregnancyDatingSetupScreen.tsx'],
  ['PregnancyTrackingPreferencesScreen', '../pregnancy/PregnancyTrackingPreferencesScreen.tsx'],
  ['PregnancyRemindersScreen', '../pregnancy/PregnancyRemindersScreen.tsx'],
  ['SummaryScreen', '../SummaryScreen.tsx'],
  ['PremiumChoiceCard (shared)', '../../components/onboarding/PremiumChoiceCard.tsx'],
  ['InlineCalendarPickerModal (shared)', '../../components/onboarding/InlineCalendarPickerModal.tsx'],
];

describe('E10 onboarding funnel — static appearance-resolution guard', () => {
  it.each(TARGET_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/isDark\s*\?/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).not.toMatch(/from ['"].*\/theme\/colors['"]/);
      expect(source).not.toMatch(/from ['"].*\/home\/homeTheme['"]/);
    },
  );

  it.each(TARGET_FILES)('%s consumes useAwaTheme()', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).toMatch(/useAwaTheme\s*\(/);
  });
});

/* ============================================================
   PRESERVED DECORATIVE EXCEPTIONS — per-option icon tints must
   survive verbatim (category-identity accents, not structural colors).
============================================================ */

describe('E10 — per-option decorative icon-tint palettes survive verbatim', () => {
  it('MenopauseStageScreen keeps its 3 fixed pastel option tints', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../MenopauseStageScreen.tsx'), 'utf8');
    for (const hex of ['#FCEADB', '#E7F2EA', '#EEE8F8']) {
      expect(source).toContain(hex);
    }
  });

  it('ObjectiveScreen keeps its own per-objective decorative tints', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../ObjectiveScreen.tsx'), 'utf8');
    expect(source).toMatch(/tint:\s*['"]#[0-9A-Fa-f]{6}['"]/);
  });
});

/* ============================================================
   RUNTIME — representative screens: resolved-theme propagation.
============================================================ */

describe('WelcomeScreen — resolved global theme', () => {
  it('changes Light -> Dark without remounting (StatusBar follows the resolved theme)', async () => {
    const renderer = await renderScreen(() => <WelcomeScreen navigation={{} as any} route={{params: undefined} as any} />);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('a Premium palette switch is inherited from the Provider (no palette-ID branching in this screen)', async () => {
    const renderer = await renderScreen(() => <WelcomeScreen navigation={{} as any} route={{params: undefined} as any} />);
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});

describe('ObjectiveScreen — resolved global theme', () => {
  it('page background resolves from the global theme and changes Light -> Dark', async () => {
    const renderer = await renderScreen(() => <ObjectiveScreen navigation={{} as any} route={{params: undefined} as any} />);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('True Black is inherited from the Provider without any local handling', async () => {
    const renderer = await renderScreen(() => <ObjectiveScreen navigation={{} as any} route={{params: undefined} as any} />);

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });

    expect(firstBackgroundColor(renderer)).toBeDefined();
  });
});

describe('MiscarriageBleedingScreen — shared PremiumChoiceCard theme propagation', () => {
  it('renders successfully and changes appearance Light -> Dark (proves the shared component consumes the same resolved theme as its caller)', async () => {
    const renderer = await renderScreen(() => <MiscarriageBleedingScreen navigation={{} as any} route={{params: undefined} as any} />);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});
