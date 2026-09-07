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

import PrivateAccessScreen from '../PrivateAccessScreen';

// PrivateAccessScreen.tsx (Pregnancy "Info médicale" / Miscarriage "Notes
// personnelles" private access — System B, distinct from the shared
// PrivateIntimacy* gate flow) was the last remaining fixed-light-only
// private-access screen (`#F3EEFC`, no useAwaTheme()). Migrated to the
// EXISTING theme system: same single-screen Unlock+PIN+biometric-keypad
// architecture and design, colors sourced from the resolved theme instead.

jest.mock('../../services/privateSectionAuth', () => ({
  hasPrivatePin: jest.fn().mockResolvedValue(true),
  verifyPrivatePin: jest.fn().mockResolvedValue(false),
  savePrivatePin: jest.fn().mockResolvedValue(undefined),
  getBiometryType: jest.fn().mockResolvedValue(null),
  getBiometryIcon: jest.fn().mockReturnValue('face-recognition'),
  getBiometryLabel: jest.fn().mockReturnValue('Utiliser la biométrie'),
  authenticateWithBiometry: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  isBiometricEnabled: jest.fn().mockReturnValue(false),
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

async function renderScreen(purpose: 'pregnancyMedicalInformation' | 'miscarriagePersonalNotes') {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen initialParams={{purpose}} name="Test">
                {props => <PrivateAccessScreen {...(props as any)} />}
              </Stack.Screen>
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

describe('PrivateAccessScreen — static appearance-resolution guard', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../PrivateAccessScreen.tsx'), 'utf8');

  it('never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no new palette consts)', () => {
    expect(source).not.toMatch(/useColorScheme\s*\(/);
    expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
    expect(source).not.toMatch(/isDark\s*\?/);
    expect(source).not.toMatch(/\bCOLORS_LIGHT\b/);
    expect(source).not.toMatch(/\bCOLORS_DARK\b/);
    expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
    expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
    expect(source).not.toMatch(/trueBlackEnabled/);
  });

  it('consumes useAwaTheme() and no longer hardcodes the old #F3EEFC fixed background', () => {
    expect(source).toMatch(/useAwaTheme\s*\(/);
    expect(source).not.toContain('#F3EEFC');
  });
});

describe.each(['pregnancyMedicalInformation', 'miscarriagePersonalNotes'] as const)(
  'PrivateAccessScreen (purpose=%s) — resolved global theme',
  purpose => {
    it('page background resolves from the global theme (changes with True Black once Dark is resolved)', async () => {
      const renderer = await renderScreen(purpose);
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
      const renderer = await renderScreen(purpose);
      const statusBar = () => renderer.root.findByType(StatusBar);
      expect(statusBar().props.barStyle).toBe('dark-content');

      await act(async () => {
        await setAppearanceMode('dark');
      });

      expect(statusBar().props.barStyle).toBe('light-content');
    });

    it('a Premium palette switch is inherited from the Provider (no palette-ID branching in this screen)', async () => {
      const renderer = await renderScreen(purpose);
      const before = firstBackgroundColor(renderer);

      await act(async () => {
        await setSelectedThemeId('sage-serenity');
      });

      expect(firstBackgroundColor(renderer)).not.toBe(before);
    });

    it('the purpose-specific privacy line still renders', async () => {
      const renderer = await renderScreen(purpose);
      const expectedLine = purpose === 'pregnancyMedicalInformation'
        ? 'Tes informations médicales personnelles sont protégées.'
        : 'Tes notes personnelles sont protégées.';
      const matches = renderer.root.findAll(node => node.props?.children === expectedLine);
      expect(matches.length).toBeGreaterThan(0);
    });
  },
);
