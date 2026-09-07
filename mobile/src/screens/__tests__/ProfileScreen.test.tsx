import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';

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

async function renderScreen() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'}} />}
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
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // Every test starts from the normal (non-anonymous) identity — the
  // anonymousMode flag lives in a module-level singleton
  // (state/securityPreferences.ts) that otherwise leaks between tests.
  updatePrivacySecuritySettings({anonymousMode: false});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('ProfileScreen — static architecture guard', () => {
  it('never calls useColorScheme or resolves appearance mode locally', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../ProfileScreen.tsx'), 'utf8');
    expect(source).not.toMatch(new RegExp('=\\s*useColorScheme\\(\\)'));
    expect(source).not.toMatch(/LIGHT_CHROME|DARK_CHROME/);
    expect(source).not.toMatch(/getAwaTheme\(|resolveEffectiveThemeId\(/);
    expect(source).not.toMatch(/midnight/i);
  });
});

describe('ProfileScreen — resolved global theme', () => {
  it('consumes useAwaTheme() — background gradient matches AWA Original canonical values', async () => {
    const renderer = await renderScreen();
    const gradient = renderer.root.findAllByType(LinearGradient)[0];
    expect(gradient.props.colors).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });

  it('page background changes when the palette changes, without remounting', async () => {
    const renderer = await renderScreen();
    const gradientColors = () => renderer.root.findAllByType(LinearGradient)[0].props.colors;
    expect(gradientColors()[0]).toBe('#FAF8FD');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });

  it('changes Light -> Dark without remounting', async () => {
    const renderer = await renderScreen();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('System mode follows the Provider-resolved device scheme', async () => {
    await setAppearanceMode('system');
    const renderer = await renderScreen();
    // Default mocked device scheme is 'light' in this test environment —
    // confirms the screen reads it via the Provider, not a local formula.
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content');
  });
});

describe('ProfileScreen — True Black', () => {
  it('true-black affects chrome only once Dark is resolved', async () => {
    const renderer = await renderScreen();
    const gradient = () => renderer.root.findAllByType(LinearGradient)[0];
    const lightBg = flattenStyle(gradient().props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(flattenStyle(gradient().props.style).backgroundColor).toBe(lightBg);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flattenStyle(gradient().props.style).backgroundColor).toBe('#030304');
  });
});

describe('ProfileScreen — Premium fallback', () => {
  it('reverts to AWA Original when Premium is lost, and restores automatically', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderScreen();
    const gradientColors = () => renderer.root.findAllByType(LinearGradient)[0].props.colors;
    expect(gradientColors()[0]).not.toBe('#FAF8FD');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });
    expect(gradientColors()).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);

    await act(async () => {
      updatePremiumState({isPremium: true});
    });
    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });
});

describe('ProfileScreen — content preserved', () => {
  it('renders the Profil header title and core menu rows unchanged', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Profil').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Apparence').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Confidentialité & Sécurité').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter').length).toBeGreaterThan(0);
  });
});

/* ============================================================
   IDENTITY MODE — normal vs anonymous. ProfileScreen already branches its
   entire identity presentation on securityPreferences.ts's single
   `anonymousMode` flag (the same one AnonymousModeScreen/
   AnonymousModeCreatingScreen/PrivacySecurityScreen already read/write) —
   these tests verify that existing branch, plus that AuthScreen/
   RegistrationScreen's normal-entry bypass now clears it so a previous
   Anonymous Mode session doesn't leak into a later normal profile.
============================================================ */

describe('ProfileScreen — identity mode reacts to securityPreferences.anonymousMode', () => {
  it('normal mode: does not show "Mode Anonyme" or the anonymous eyebrow/avatar', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'MODE PRIVÉ').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'MON PROFIL').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Informations personnelles').length).toBeGreaterThan(0);
  });

  it('anonymous mode: shows "Mode Anonyme" clearly and hides the normal personal-information entry point', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'MODE PRIVÉ').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Ton identité réelle reste masquée').length).toBeGreaterThan(0);
    // The normal "Informations personnelles" entry point (real name/email
    // editor) must not be reachable from the anonymous identity block —
    // only its anonymous counterpart, "Informations du compte".
    expect(renderer.root.findAll(node => node.props.children === 'Informations personnelles').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'Informations du compte').length).toBeGreaterThan(0);
  });

  it('switching anonymousMode while ProfileScreen is mounted flips the presentation live (no remount needed)', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBe(0);

    await act(async () => {
      updatePrivacySecuritySettings({anonymousMode: true});
    });
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBeGreaterThan(0);

    await act(async () => {
      updatePrivacySecuritySettings({anonymousMode: false});
    });
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'MON PROFIL').length).toBeGreaterThan(0);
  });
});
