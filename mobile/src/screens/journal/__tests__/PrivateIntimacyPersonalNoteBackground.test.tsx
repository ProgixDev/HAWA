import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ImageBackground, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider, useAwaTheme} from '../../../theme/AwaThemeProvider';

import PrivateIntimacyUnlockScreen, {UNIFIED_PURPOSE_COPY} from '../PrivateIntimacyUnlockScreen';
import PrivateIntimacyPinScreen from '../PrivateIntimacyPinScreen';
import PrivateIntimacyFaceIdScreen from '../PrivateIntimacyFaceIdScreen';

// Unified, theme-aware lock design now covers EVERY IntimacyTarget value —
// Vie intime (`undefined`/`cycle`), Rapports (`conception`), Cycle "Note
// personnelle" (`cycleNotes`), Contraception "Notes du jour"
// (`contraceptionNotes`), Menopause "Notes du jour" (`menopauseNotes`),
// Photos privées (`photos`), and Miscarriage "Notes personnelles"
// (`miscarriageNotes`). All render a flat page using the GLOBAL theme's
// `colors.background` (Light/Dark/System/True Black/Premium all supported).
// The legacy padlock-artwork `private-lock-background.png` has been fully
// retired from all three shared gate screens — no target renders it anymore.

jest.mock('../../../services/privateSectionAuth', () => ({
  hasPrivatePin: jest.fn().mockResolvedValue(false),
  verifyPrivatePin: jest.fn().mockResolvedValue(false),
  savePrivatePin: jest.fn().mockResolvedValue(undefined),
  getBiometryType: jest.fn().mockResolvedValue(null),
  getBiometryLabel: jest.fn().mockReturnValue('Utiliser la biométrie'),
  getBiometryIcon: jest.fn().mockReturnValue('face-recognition'),
  authenticateWithBiometry: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  isBiometricEnabled: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../state/privateSectionAuthStore', () => ({
  isIntimacyUnlocked: jest.fn().mockReturnValue(false),
  unlockIntimacy: jest.fn(),
  lockIntimacy: jest.fn(),
  replaceWithIntimacyDestination: jest.fn(),
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

// Captures the SAME resolved theme the screen under test reads, so the
// assertions below never hardcode a specific palette's hex value — the
// point of this migration is that the background now tracks whatever
// Light/Dark/System/True Black/Premium theme is active, not a fixed color.
let capturedBackground: string | undefined;

function ThemeBackgroundCapture(): null {
  const {theme} = useAwaTheme();
  capturedBackground = theme.colors.background as string;
  return null;
}

function findBackgroundNode(renderer: ReactTestRenderer.ReactTestRenderer, color: string | undefined) {
  return renderer.root.findAll(node => {
    if (!node.props?.style) {return false;}
    return flattenStyle(node.props.style).backgroundColor === color;
  })[0];
}

async function renderScreen(Screen: React.ComponentType<any>, target: string | undefined) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <ThemeBackgroundCapture />
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen initialParams={{target}} name="Test">
                {props => <Screen {...props} />}
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

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  capturedBackground = undefined;
});

const ALL_TARGETS = [undefined, 'cycle', 'conception', 'cycleNotes', 'contraceptionNotes', 'menopauseNotes', 'photos', 'miscarriageNotes'];

const SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['PrivateIntimacyUnlockScreen', PrivateIntimacyUnlockScreen as React.ComponentType<any>],
  ['PrivateIntimacyPinScreen', PrivateIntimacyPinScreen as React.ComponentType<any>],
  ['PrivateIntimacyFaceIdScreen', PrivateIntimacyFaceIdScreen as React.ComponentType<any>],
];

describe.each(SCREENS)('%s — unified lock design background', (_name, Screen) => {
  it.each(ALL_TARGETS)('target=%s shows the flat, theme-driven AWA background, no PNG', async target => {
    const renderer = await renderScreen(Screen, target);
    expect(capturedBackground).toBeDefined();
    expect(findBackgroundNode(renderer, capturedBackground)).toBeDefined();
    expect(renderer.root.findAllByType(ImageBackground).length).toBe(0);
  });

  it('the back/return control still renders regardless of target', async () => {
    const cycleNotesRenderer = await renderScreen(Screen, 'cycleNotes');
    const photosRenderer = await renderScreen(Screen, 'photos');
    const backButtons = (renderer: ReactTestRenderer.ReactTestRenderer) =>
      renderer.root.findAll(node => typeof node.props?.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Retour'));
    expect(backButtons(cycleNotesRenderer).length).toBeGreaterThan(0);
    expect(backButtons(photosRenderer).length).toBeGreaterThan(0);
  });
});

describe('PrivateIntimacyUnlockScreen — unified lock badge and purpose copy', () => {
  it.each(ALL_TARGETS)('target=%s shows the purpose-specific privacy line', async target => {
    const renderer = await renderScreen(PrivateIntimacyUnlockScreen as React.ComponentType<any>, target);
    const expectedLine = UNIFIED_PURPOSE_COPY[target ?? 'cycle'] ?? UNIFIED_PURPOSE_COPY.cycle;
    const matches = renderer.root.findAll(node => node.type === Text && node.props.children === expectedLine);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('private-lock-background.png — fully retired from the shared gate flow', () => {
  it.each(SCREENS)('%s never renders ImageBackground for any target', async (_name, Screen) => {
    for (const target of ALL_TARGETS) {
      const renderer = await renderScreen(Screen as React.ComponentType<any>, target);
      expect(renderer.root.findAllByType(ImageBackground).length).toBe(0);
    }
  });
});
