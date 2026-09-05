import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

import JournalMoodScreen from '../../../screens/journal/JournalMoodScreen';
import MenstrualFlowScreen from '../../../screens/journal/MenstrualFlowScreen';
import JournalLHTestScreen from '../../../screens/journal/JournalLHTestScreen';
import PregnancySymptomsScreen from '../../../screens/pregnancy/PregnancySymptomsScreen';
import PregnancyWeightScreen from '../../../screens/pregnancy/PregnancyWeightScreen';

import DailyJournalSheet, {CYCLE_JOURNAL_ITEMS} from '../DailyJournalSheet';
import {JournalScreenLayout, SectionCard, ChoiceChips} from '../JournalScreenLayout';

// Phase E4 — Journal family theme hardening. Compact, data-driven harness
// (mirrors src/components/calendar/__tests__/CalendarFamilyThemeHardening.test.tsx)
// covering: (1) a static appearance-resolution guard across every E4-migrated
// file, (2) runtime theme propagation for a representative screen per
// objective family that can be rendered without special route params/privacy
// gating, (3) the shared Journal primitives used by nearly every screen, and
// (4) save-payload preservation across a theme switch.

jest.mock('../../../state/dailyJournalStore', () => {
  const actual = jest.requireActual('../../../state/dailyJournalStore');
  return {...actual, saveJournalSection: jest.fn().mockResolvedValue(undefined)};
});
jest.mock('../../../state/pregnancyJournalStore', () => {
  const actual = jest.requireActual('../../../state/pregnancyJournalStore');
  return {
    ...actual,
    getPregnancyJournalState: jest.fn().mockResolvedValue({symptoms: [], weights: [], medicalInformationHistory: []}),
    savePregnancySymptoms: jest.fn().mockResolvedValue(undefined),
  };
});

import {saveJournalSection} from '../../../state/dailyJournalStore';
import {savePregnancySymptoms} from '../../../state/pregnancyJournalStore';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

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
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{renderElement}</Stack.Screen>
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
  jest.clearAllMocks();
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
   STATIC ARCHITECTURE GUARD — items 21/22/23: no local
   useColorScheme, no local Light/Dark/appearance-mode resolution,
   no user-facing Midnight dependency, anywhere in the E4-migrated
   Journal family (shared primitives + every active entry screen).
============================================================ */

const JOURNAL_SOURCE_FILES: Array<[string, string]> = [
  ['DailyJournalSheet (shared)', '../DailyJournalSheet.tsx'],
  ['JournalScreenLayout (shared)', '../JournalScreenLayout.tsx'],
  ['JournalInputs (shared)', '../JournalInputs.tsx'],
  ['JournalSaveToast (shared)', '../JournalSaveToast.tsx'],
  ['PostpartumJournalScreenLayout (shared)', '../../postpartum/PostpartumJournalScreenLayout.tsx'],
  ['PostpartumCycleStyleJournalLayout (shared)', '../../postpartum/PostpartumCycleStyleJournalLayout.tsx'],
  ['PostpartumWellnessRatingLayout (shared)', '../../postpartum/PostpartumWellnessRatingLayout.tsx'],
  ['JournalSymptomsScreen', '../../../screens/journal/JournalSymptomsScreen.tsx'],
  ['JournalMoodScreen', '../../../screens/journal/JournalMoodScreen.tsx'],
  ['JournalActivityScreen', '../../../screens/journal/JournalActivityScreen.tsx'],
  ['JournalSleepScreen', '../../../screens/journal/JournalSleepScreen.tsx'],
  ['HydrationScreen', '../../../screens/journal/HydrationScreen.tsx'],
  ['MenstrualFlowScreen', '../../../screens/journal/MenstrualFlowScreen.tsx'],
  ['JournalNoteScreen', '../../../screens/journal/JournalNoteScreen.tsx'],
  ['JournalPrivatePhotosScreen', '../../../screens/journal/JournalPrivatePhotosScreen.tsx'],
  ['PrivateIntimacyUnlockScreen', '../../../screens/journal/PrivateIntimacyUnlockScreen.tsx'],
  ['PrivateIntimacyPinScreen', '../../../screens/journal/PrivateIntimacyPinScreen.tsx'],
  ['PrivateIntimacyFaceIdScreen', '../../../screens/journal/PrivateIntimacyFaceIdScreen.tsx'],
  ['JournalIntimacyScreen', '../../../screens/journal/JournalIntimacyScreen.tsx'],
  ['JournalTemperatureScreen', '../../../screens/journal/JournalTemperatureScreen.tsx'],
  ['JournalCervicalMucusScreen', '../../../screens/journal/JournalCervicalMucusScreen.tsx'],
  ['JournalLHTestScreen', '../../../screens/journal/JournalLHTestScreen.tsx'],
  ['JournalConceptionReportsScreen', '../../../screens/journal/JournalConceptionReportsScreen.tsx'],
  ['PregnancySymptomsScreen', '../../../screens/pregnancy/PregnancySymptomsScreen.tsx'],
  ['PregnancyWeightScreen', '../../../screens/pregnancy/PregnancyWeightScreen.tsx'],
  ['PregnancyMedicalInformationScreen', '../../../screens/pregnancy/PregnancyMedicalInformationScreen.tsx'],
  ['PostpartumJournalEntryScreen', '../../../screens/PostpartumJournalEntryScreen.tsx'],
  ['MiscarriageJournalEntryScreen', '../../../screens/MiscarriageJournalEntryScreen.tsx'],
  ['IrregularJournalEntryScreen', '../../../screens/IrregularJournalEntryScreen.tsx'],
  ['IrregularJournalOverviewScreen', '../../../screens/irregular/IrregularJournalOverviewScreen.tsx'],
  ['ContraceptionJournalEntryScreen', '../../../screens/contraception/ContraceptionJournalEntryScreen.tsx'],
  ['MenopauseJournalEntryScreen', '../../../screens/menopause/MenopauseJournalEntryScreen.tsx'],
];

describe('E4 Journal family — static appearance-resolution guard', () => {
  it.each(JOURNAL_SOURCE_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no LIGHT_/DARK_ chrome, no midnight, no getAwaTheme/resolveEffectiveThemeId)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/appearanceMode\s*===/);
      expect(source).not.toMatch(/\bLIGHT_[A-Z]/);
      expect(source).not.toMatch(/\bDARK_[A-Z]/);
      expect(source).not.toMatch(/midnight/i);
      expect(source).not.toMatch(/resolveEffectiveThemeId\s*\(/);
      expect(source).not.toMatch(/getAwaTheme\s*\(/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
    },
  );
});

/* ============================================================
   STATIC SEMANTIC-COLOR-FREEZE SOURCE CHECKS — item 10, spot-checked
   across objectives whose entry screens have route-param/privacy-gating
   requirements that make a full render impractical for a compact test
   suite. Confirms the exact known medical/status hex a human reviewer
   verified is still present verbatim in the source after migration.
============================================================ */

const FROZEN_COLOR_CHECKS: Array<[string, string, string, string]> = [
  ['Postpartum entry screen — lochia/wellness tint', '../../../screens/PostpartumJournalEntryScreen.tsx', '#FFF2C9', 'fatigue rating tint'],
  ['Miscarriage entry screen — bleeding/symptom identity', '../../../screens/MiscarriageJournalEntryScreen.tsx', '#D35A79', 'Fatigue symptom color'],
  ['Miscarriage entry screen — bleeding-color swatch', '../../../screens/MiscarriageJournalEntryScreen.tsx', '#E84D76', 'bleeding-color swatch'],
  ['Irregular entry screen — category tone', '../../../screens/IrregularJournalEntryScreen.tsx', '#EA5A8B', 'ROSE tone (Acné/Pilosité/Humeur)'],
  ['Contraception entry screen — status colors', '../../../screens/contraception/ContraceptionJournalEntryScreen.tsx', '#42A66A', 'taken/success status'],
  ['Contraception entry screen — status colors', '../../../screens/contraception/ContraceptionJournalEntryScreen.tsx', '#D96176', 'missed/danger status'],
];

describe('E4 Journal family — frozen medical/status colors present verbatim after migration', () => {
  it.each(FROZEN_COLOR_CHECKS)('%s: %s (%s) is still present in source', (_name, relativePath, hex) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).toContain(hex);
  });

  it('Menopause entry screen still consumes the frozen menopauseJournalConfig category colors by reference (never re-derives them from theme)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/menopause/MenopauseJournalEntryScreen.tsx'),
      'utf8',
    );
    expect(source).toMatch(/from ['"]\.\.\/\.\.\/config\/menopauseJournalConfig['"]/);
    expect(source).not.toMatch(/iconColor:\s*theme\.colors/);
  });

  it('menopauseJournalConfig.ts (business config, out of E4 scope) was not modified to remove MENOPAUSE_COLORS', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../config/menopauseJournalConfig.ts'),
      'utf8',
    );
    expect(source).toContain('#6949BE');
    expect(source).toContain('MENOPAUSE_COLORS');
  });
});

/* ============================================================
   RUNTIME THEME PROPAGATION — items 1-9, 12-17: a representative,
   reliably-renderable screen per family (no route params, no
   privacy-gating) — the shared Cycle path (Mood, MenstrualFlow) and
   Conceive's shared LH screen and Pregnancy's two own screens.
============================================================ */

type JournalCase = {name: string; render: () => React.ReactElement};

const SCREENS: JournalCase[] = [
  {name: 'Cycle — JournalMoodScreen', render: () => <JournalMoodScreen />},
  {name: 'Cycle — MenstrualFlowScreen (period-color owner)', render: () => <MenstrualFlowScreen />},
  {name: 'Conceive — JournalLHTestScreen (shared dailyJournalStore)', render: () => <JournalLHTestScreen />},
  {name: 'Pregnancy — PregnancySymptomsScreen', render: () => <PregnancySymptomsScreen />},
  {name: 'Pregnancy — PregnancyWeightScreen', render: () => <PregnancyWeightScreen />},
];

describe.each(SCREENS)('$name — resolved global theme', ({render}) => {
  it('page background resolves from the global theme (changes with True Black once Dark is resolved)', async () => {
    const renderer = await renderScreen(render);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(firstBackgroundColor(renderer)).toBe(before);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('changes Light -> Dark without remounting (StatusBar follows the resolved theme)', async () => {
    const renderer = await renderScreen(render);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('palette switch updates the page background without remounting', async () => {
    const renderer = await renderScreen(render);
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('System mode follows the Provider-resolved device scheme', async () => {
    await setAppearanceMode('system');
    const renderer = await renderScreen(render);
    // Default mocked device scheme is 'light' in this test environment —
    // confirms the screen reads it via the Provider, not a local formula.
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content');
  });
});

/* ============================================================
   SHARED PRIMITIVES — DailyJournalSheet (menu/hub used by all 8
   objectives) and JournalScreenLayout/SectionCard/ChoiceChips (the
   chrome underneath ~15 entry screens).
============================================================ */

describe('DailyJournalSheet (shared, all 8 objectives) — resolved global theme', () => {
  const actions = CYCLE_JOURNAL_ITEMS.slice(0, 2).map(item => ({
    key: item.route,
    icon: item.icon,
    title: item.title,
    subtitle: item.subtitle,
    tint: item.tint,
    onPress: jest.fn(),
  }));

  async function renderSheet() {
    return renderScreen(() => <DailyJournalSheet actions={actions} onClose={jest.fn()} visible />);
  }

  it('sheet surface + handle resolve from the global theme and change with palette switch, without remounting', async () => {
    const renderer = await renderSheet();
    const findHandle = () =>
      renderer.root.findAll(node => {
        const style = flattenStyle(node.props.style);
        return typeof style.backgroundColor !== 'undefined' && typeof style.borderRadius === 'number' && style.width === 46;
      })[0];
    const before = flattenStyle(findHandle().props.style).backgroundColor;

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(flattenStyle(findHandle().props.style).backgroundColor).not.toBe(before);
  });

  it('the category tints passed in (CYCLE_JOURNAL_ITEMS) stay fixed across a palette switch — Category D identity, not theme-driven', async () => {
    const renderer = await renderSheet();
    const findTint = () =>
      renderer.root.findAll(node => flattenStyle(node.props.style).backgroundColor === actions[0].tint).length;
    const before = findTint();
    expect(before).toBeGreaterThan(0);

    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });

    expect(findTint()).toBe(before);
  });
});

describe('JournalScreenLayout / SectionCard / ChoiceChips (shared) — resolved global theme', () => {
  function Host() {
    const [value, setValue] = React.useState('A');
    return (
      <JournalScreenLayout icon="heart" onSave={jest.fn()} title="Test">
        <SectionCard title="Section">
          <ChoiceChips onChange={setValue} options={['A', 'B', 'C']} value={value} />
        </SectionCard>
      </JournalScreenLayout>
    );
  }

  it('page background + StatusBar follow the resolved theme, changing Light -> Dark without remounting', async () => {
    const renderer = await renderScreen(() => <Host />);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('selected vs. unselected generic chip chrome both resolve from the theme and stay distinguishable after a palette switch', async () => {
    const renderer = await renderScreen(() => <Host />);
    const chipStyle = (label: string) =>
      flattenStyle(renderer.root.findAll(node => node.props.children === label)[0].parent!.props.style);

    const selectedBefore = chipStyle('A').backgroundColor;
    const unselectedBefore = chipStyle('B').backgroundColor;
    expect(selectedBefore).not.toBe(unselectedBefore);

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    const selectedAfter = chipStyle('A').backgroundColor;
    const unselectedAfter = chipStyle('B').backgroundColor;
    expect(selectedAfter).not.toBe(selectedBefore);
    expect(selectedAfter).not.toBe(unselectedAfter);
  });
});

/* ============================================================
   SAVE-PAYLOAD PRESERVATION — items 19/20: a theme switch mid-form
   must never change what gets persisted. Representative flows: Cycle's
   shared dailyJournalStore (JournalMoodScreen) and Pregnancy's own
   pregnancyJournalStore (PregnancySymptomsScreen).
============================================================ */

describe('E4 Journal family — save payload is identical across a theme switch', () => {
  it('JournalMoodScreen calls saveJournalSection with the same payload regardless of the active palette/mode', async () => {
    const renderer = await renderScreen(() => <JournalMoodScreen />);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });

    const saveButton = renderer.root.findAll(node => node.props.accessibilityLabel === "Enregistrer l'humeur")[0];
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(saveJournalSection).toHaveBeenCalledTimes(1);
    const [dateKey, section, payload] = (saveJournalSection as jest.Mock).mock.calls[0];
    expect(dateKey).toBe(new Date().toLocaleDateString('en-CA'));
    expect(section).toBe('mood');
    expect(payload).toEqual({
      level: 'veryGood',
      energy: 4,
      stress: 3,
      irritability: 2,
      motivation: 4,
      note: '',
    });
  });

  it('PregnancySymptomsScreen calls savePregnancySymptoms with the same selected symptoms regardless of the active palette/mode', async () => {
    const renderer = await renderScreen(() => <PregnancySymptomsScreen />);

    const symptomRow = renderer.root.findAll(node => node.props.accessibilityLabel === 'Nausées')[0];
    await act(async () => {
      symptomRow.props.onPress();
    });

    await act(async () => {
      await setSelectedThemeId('lavender-night');
      await setAppearanceMode('dark');
    });

    const saveButton = renderer.root.findAll(node => node.props.accessibilityLabel === 'Enregistrer les symptômes')[0];
    await act(async () => {
      await saveButton.props.onPress();
    });

    expect(savePregnancySymptoms).toHaveBeenCalledTimes(1);
    const payload = (savePregnancySymptoms as jest.Mock).mock.calls[0][0];
    expect(payload.symptoms).toEqual(['Nausées']);
    expect(payload.note).toBeUndefined();
    expect(typeof payload.date).toBe('string');
    expect(typeof payload.updatedAt).toBe('string');
  });
});
