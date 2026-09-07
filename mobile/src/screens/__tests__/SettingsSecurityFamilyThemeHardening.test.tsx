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

import PinManagementScreen from '../PinManagementScreen';
import DiscreetLauncherScreen from '../DiscreetLauncherScreen';
import AnonymousModeScreen from '../AnonymousModeScreen';
import AboutScreen from '../AboutScreen';
import {TermsOfUseScreen} from '../LegalDocumentScreen';
import {FAQScreen} from '../SupportResourcesScreens';

// Settings/Security/PIN/FaceID/Anonymous/Privacy family theme migration.
// Mirrors the established pattern from
// src/components/journal/__tests__/JournalFamilyThemeHardening.test.tsx and
// src/components/calendar/__tests__/CalendarFamilyThemeHardening.test.tsx:
// (1) a static appearance-resolution guard across every migrated file in
// this batch (no local useColorScheme/isDark/theme.id branching/new
// palettes), and (2) runtime theme propagation for a representative,
// reliably-renderable screen per family that needs no privacy-gating or
// awkward route params.

jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  isPinEnabled: jest.fn().mockReturnValue(false),
  isBiometricEnabled: jest.fn().mockReturnValue(false),
  getPrivacySecuritySettings: jest.fn().mockReturnValue({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
    intimacyProtection: false,
  }),
  subscribeSecurityPreferences: jest.fn().mockReturnValue(() => {}),
  subscribePrivacySecuritySettings: jest.fn().mockReturnValue(() => {}),
}));

jest.mock('../../services/discreetLauncher', () => ({
  isDiscreetLauncherSupported: jest.fn().mockReturnValue(true),
  isLauncherSwitchBlockedByDevice: jest.fn().mockReturnValue(false),
  getLauncherIdentity: jest.fn().mockResolvedValue('awa'),
  setLauncherIdentity: jest.fn().mockResolvedValue(undefined),
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
   STATIC ARCHITECTURE GUARD — every one of the 19 files migrated in this
   batch (24 screens total: some files export more than one screen) must
   never resolve appearance locally.
============================================================ */

const SETTINGS_SECURITY_SOURCE_FILES: Array<[string, string]> = [
  ['PinKeypad (shared)', '../../components/security/PinKeypad.tsx'],
  ['PinSetupScreen', '../PinSetupScreen.tsx'],
  ['PinConfirmScreen', '../PinConfirmScreen.tsx'],
  ['PinManagementScreen', '../PinManagementScreen.tsx'],
  ['AppLockScreen', '../AppLockScreen.tsx'],
  ['SecuritySetupScreen', '../SecuritySetupScreen.tsx'],
  ['FaceIdSetupScreen', '../FaceIdSetupScreen.tsx'],
  ['DiscreetLauncherScreen', '../DiscreetLauncherScreen.tsx'],
  ['PrivacyScreen', '../PrivacyScreen.tsx'],
  ['AnonymousModeScreen', '../AnonymousModeScreen.tsx'],
  ['AnonymousModeLimitationsScreen', '../AnonymousModeLimitationsScreen.tsx'],
  ['AnonymousModeCreatingScreen', '../AnonymousModeCreatingScreen.tsx'],
  ['AnonymousModeSuccessScreen', '../AnonymousModeSuccessScreen.tsx'],
  ['AnonymousAvatarCustomizerScreen', '../AnonymousAvatarCustomizerScreen.tsx'],
  ['GeneralHealthScreen', '../GeneralHealthScreen.tsx'],
  ['AboutScreen', '../AboutScreen.tsx'],
  ['LegalDocumentScreen (TermsOfUse/PrivacyPolicy)', '../LegalDocumentScreen.tsx'],
  ['SupportResourcesScreens (FAQ/FAQDetail/Guides/WhatsNew)', '../SupportResourcesScreens.tsx'],
  ['BackupUtilityScreens (RestoreBackup/DataExport/DeleteTrackedData)', '../BackupUtilityScreens.tsx'],
];

describe('Settings/Security family — static appearance-resolution guard', () => {
  it.each(SETTINGS_SECURITY_SOURCE_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no new palette consts)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/isDark\s*\?/);
      expect(source).not.toMatch(/\bCOLORS_LIGHT\b/);
      expect(source).not.toMatch(/\bCOLORS_DARK\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).not.toMatch(/resolveEffectiveThemeId\s*\(/);
      expect(source).not.toMatch(/getAwaTheme\s*\(/);
    },
  );

  it.each(SETTINGS_SECURITY_SOURCE_FILES)('%s consumes useAwaTheme()', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).toMatch(/useAwaTheme\s*\(/);
  });
});

/* ============================================================
   RUNTIME THEME PROPAGATION — a representative, reliably-renderable
   screen per family (no route params, no privacy-gating): PIN (C),
   Anonymous Mode (E), Discreet launcher (F), and the paramless
   Secondary-Settings/info screens (A) including one export from each of
   the two multi-export shared files.
============================================================ */

type SettingsCase = {name: string; render: () => React.ReactElement};

const SCREENS: SettingsCase[] = [
  {name: 'PIN — PinManagementScreen', render: () => <PinManagementScreen navigation={{} as any} route={{} as any} />},
  {name: 'Anonymous Mode — AnonymousModeScreen', render: () => <AnonymousModeScreen navigation={{} as any} route={{params: undefined} as any} />},
  {name: 'Discreet launcher — DiscreetLauncherScreen', render: () => <DiscreetLauncherScreen navigation={{} as any} route={{} as any} />},
  {name: 'Secondary Settings — AboutScreen', render: () => <AboutScreen navigation={{} as any} route={{} as any} />},
  {name: 'Secondary Settings (shared file) — TermsOfUseScreen', render: () => <TermsOfUseScreen navigation={{} as any} route={{} as any} />},
  {name: 'Secondary Settings (shared file) — FAQScreen', render: () => <FAQScreen navigation={{} as any} route={{} as any} />},
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
});
