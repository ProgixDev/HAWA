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

import PregnancyAppointmentsScreen from '../pregnancy/PregnancyAppointmentsScreen';

// E11/E12 — Pregnancy/Postpartum remaining screens + PARTIAL cleanup.
// Mirrors the established pattern from this session's other *ThemeHardening
// suites: (1) a static appearance-resolution guard across all 9 target
// files, confirming useAwaTheme() adoption and the absence of forbidden
// local dark-mode resolution, plus verbatim preservation of every
// documented medical/semantic color exception; (2) runtime theme
// propagation for a representative, reliably-renderable screen
// (PregnancyAppointmentsScreen — the others need heavier store/hook mocking
// disproportionate to what a hardening suite needs to prove).

jest.mock('../../state/pregnancyMedicalEventsStore', () => ({
  getPregnancyMedicalEvents: jest.fn().mockResolvedValue([]),
  savePregnancyMedicalEvent: jest.fn().mockResolvedValue([]),
  deletePregnancyMedicalEvent: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../state/pregnancyNotificationSettingsStore', () => ({
  getPregnancyNotificationSettings: jest.fn().mockReturnValue({
    defaultAppointmentReminderOffset: '1day',
    defaultExamReminderOffset: '1day',
  }),
  hydratePregnancyNotificationSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/pregnancyEventReminders', () => ({
  REMINDER_OFFSETS: ['30min', '1hour', '2hours', '1day', 'custom'],
  REMINDER_OFFSET_LABELS: {
    '30min': '30 min avant',
    '1hour': '1 heure avant',
    '2hours': '2 heures avant',
    '1day': '1 jour avant',
    custom: 'Personnalisé',
  },
  syncEventReminder: jest.fn().mockResolvedValue(undefined),
  cancelEventReminder: jest.fn().mockResolvedValue(undefined),
}));

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
   STATIC GUARD — all 9 E11/E12 target files.
============================================================ */

const TARGET_FILES: Array<[string, string]> = [
  ['PregnancyAppointmentsScreen', '../pregnancy/PregnancyAppointmentsScreen.tsx'],
  ['PregnancyWeekScreen', '../pregnancy/PregnancyWeekScreen.tsx'],
  ['PregnancyNotificationsScreen', '../pregnancy/PregnancyNotificationsScreen.tsx'],
  ['PostpartumLochiaScreen', '../PostpartumLochiaScreen.tsx'],
  ['PostpartumCycleReturnScreen', '../PostpartumCycleReturnScreen.tsx'],
  ['PregnancyMedicalInformationScreen (PARTIAL fix)', '../pregnancy/PregnancyMedicalInformationScreen.tsx'],
  ['MiscarriageJournalEntryScreen (PARTIAL fix)', '../MiscarriageJournalEntryScreen.tsx'],
  ['ContraceptionJournalEntryScreen (PARTIAL fix)', '../contraception/ContraceptionJournalEntryScreen.tsx'],
  ['MenopauseJournalEntryScreen (PARTIAL fix)', '../menopause/MenopauseJournalEntryScreen.tsx'],
];

describe('E11/E12 Pregnancy/Postpartum — static appearance-resolution guard', () => {
  it.each(TARGET_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no stale homeColors)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/isDark\s*\?/);
      expect(source).not.toMatch(/\bCOLORS_LIGHT\b/);
      expect(source).not.toMatch(/\bCOLORS_DARK\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).not.toMatch(/homeColors\./);
    },
  );

  it.each(TARGET_FILES)('%s consumes useAwaTheme()', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).toMatch(/useAwaTheme\s*\(/);
  });
});

/* ============================================================
   FROZEN MEDICAL/SEMANTIC COLORS — must survive verbatim.
============================================================ */

describe('E11/E12 — frozen medical/semantic colors present verbatim after migration', () => {
  it('PostpartumLochiaScreen still offers the same 5 fixed lochia-color swatches', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumLochiaScreen.tsx'), 'utf8');
    for (const hex of ['#D8334A', '#E76578', '#F4A5C3', '#A87867', '#F2D6B3']) {
      expect(source).toContain(hex);
    }
  });

  it('MiscarriageJournalEntryScreen still offers the same fixed flow-color swatches', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../MiscarriageJournalEntryScreen.tsx'), 'utf8');
    for (const hex of ['#E84D76', '#991D36', '#9B5C38', '#F4B7C4', '#F7F3FB']) {
      expect(source).toContain(hex);
    }
  });

  it('ContraceptionJournalEntryScreen still uses fixed intake-status semantic colors', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../contraception/ContraceptionJournalEntryScreen.tsx'), 'utf8');
    expect(source).toContain("GREEN = '#42A66A'");
    expect(source).toContain("DANGER = '#D96176'");
  });

  it('MenopauseJournalEntryScreen still uses the fixed FSH/estradiol identity pair', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../menopause/MenopauseJournalEntryScreen.tsx'), 'utf8');
    expect(source).toMatch(/type === 'fsh' \? '#6D4AE8' : '#D45D7B'/);
  });
});

/* ============================================================
   RUNTIME — PregnancyAppointmentsScreen: resolved-theme propagation.
============================================================ */

describe('PregnancyAppointmentsScreen — resolved global theme', () => {
  it('page background resolves from the global theme (changes with True Black once Dark is resolved)', async () => {
    const renderer = await renderScreen(() => <PregnancyAppointmentsScreen navigation={{} as any} route={{params: undefined} as any} />);
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
    const renderer = await renderScreen(() => <PregnancyAppointmentsScreen navigation={{} as any} route={{params: undefined} as any} />);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('a Premium palette switch is inherited from the Provider (no palette-ID branching in this screen)', async () => {
    const renderer = await renderScreen(() => <PregnancyAppointmentsScreen navigation={{} as any} route={{params: undefined} as any} />);
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});
