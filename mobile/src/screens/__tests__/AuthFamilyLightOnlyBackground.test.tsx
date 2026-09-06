import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ImageBackground} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../theme/awaThemeTokens';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import AuthScreen from '../AuthScreen';
import RegistrationScreen from '../RegistrationScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

// The Auth family (Login/Register/Forgot Password) is intentionally
// LIGHT-ONLY: it must show the exact AWA Original Light page background
// (same gradient the Cycle Dashboard uses) regardless of the user's actual
// global appearance mode, palette, or True Black setting. Dark-mode Auth is
// a dedicated future phase — these screens deliberately do NOT consume
// useAwaTheme()/the reactive theme at all; they read a frozen snapshot from
// src/theme/authLightTheme.ts instead.

jest.mock('../../state/personalInformationStore', () => ({
  updatePersonalInformation: jest.fn().mockResolvedValue(undefined),
}));

const AWA_ORIGINAL_LIGHT_GRADIENT = resolveAwaTheme('awa-original', false, false).gradients.pageBackground;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const ALL_ROUTES: Array<[string, React.ComponentType<any>]> = [
  ['Auth', AuthScreen],
  ['Registration', RegistrationScreen],
  ['ForgotPassword', ForgotPasswordScreen],
];

async function renderScreen(Screen: React.ComponentType<any>, name: string) {
  const otherRoutes = ALL_ROUTES.filter(([routeName]) => routeName !== name);
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName={name} screenOptions={{headerShown: false}}>
              <Stack.Screen name={name}>{props => <Screen {...props} />}</Stack.Screen>
              {otherRoutes.map(([routeName, Component]) => (
                <Stack.Screen key={routeName} name={routeName}>
                  {props => <Component {...(props as any)} />}
                </Stack.Screen>
              ))}
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

function gradientColors(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  return renderer.root.findByType(LinearGradient).props.colors;
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

const SCREENS: Array<[string, React.ComponentType<any>, string]> = [
  ['AuthScreen (Login)', AuthScreen, 'Auth'],
  ['RegistrationScreen', RegistrationScreen, 'Registration'],
  ['ForgotPasswordScreen', ForgotPasswordScreen, 'ForgotPassword'],
];

describe('Auth family — static guard (source-level)', () => {
  const files: Array<[string, string]> = [
    ['AuthScreen.tsx', '../AuthScreen.tsx'],
    ['RegistrationScreen.tsx', '../RegistrationScreen.tsx'],
    ['ForgotPasswordScreen.tsx', '../ForgotPasswordScreen.tsx'],
  ];

  it.each(files)('%s no longer references auth-mosque-background.png / ImageBackground', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).not.toMatch(/require\(['"].*auth-mosque-background\.png['"]\)/);
    expect(source).not.toMatch(/<ImageBackground/);
  });

  it.each(files)('%s introduces no local appearance/theme resolution', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).not.toMatch(/useColorScheme/);
    expect(source).not.toMatch(/useAwaTheme/);
    expect(source).not.toMatch(/\bisDark\b/);
    expect(source).not.toMatch(/appearanceMode\s*===/);
    expect(source).not.toMatch(/resolvedAppearanceMode/);
    expect(source).not.toMatch(/trueBlackEnabled/);
    expect(source).not.toMatch(/theme\.id\s*===/);
    expect(source).not.toMatch(/getAwaTheme\(/);
    expect(source).not.toMatch(/resolveEffectiveThemeId/);
    expect(source).not.toMatch(/isDark\s*\?/);
  });

  it('RegistrationScreen and ForgotPasswordScreen consume the frozen AUTH_LIGHT_THEME (AuthScreen inlines the same gradient without needing other tokens)', () => {
    const registration = fs.readFileSync(path.resolve(__dirname, '../RegistrationScreen.tsx'), 'utf8');
    const forgotPassword = fs.readFileSync(path.resolve(__dirname, '../ForgotPasswordScreen.tsx'), 'utf8');
    const auth = fs.readFileSync(path.resolve(__dirname, '../AuthScreen.tsx'), 'utf8');
    for (const source of [registration, forgotPassword, auth]) {
      expect(source).toMatch(/AUTH_LIGHT_THEME/);
      expect(source).toMatch(/from '\.\.\/theme\/authLightTheme'/);
    }
  });

  it('authLightTheme.ts derives from resolveAwaTheme("awa-original", false, false) — a frozen snapshot, not a hook', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../theme/authLightTheme.ts'), 'utf8');
    expect(source).toMatch(/export const AUTH_LIGHT_THEME = resolveAwaTheme\('awa-original', false, false\)/);
    expect(source).not.toMatch(/import.*AwaThemeProvider/);
  });
});

describe.each(SCREENS)('%s — frozen AWA Original Light background', (_label, Screen, routeName) => {
  it('renders the exact AWA Original Light gradient, no ImageBackground', async () => {
    const renderer = await renderScreen(Screen, routeName);
    expect(renderer.root.findAllByType(ImageBackground).length).toBe(0);
    expect(gradientColors(renderer)).toEqual([...AWA_ORIGINAL_LIGHT_GRADIENT]);
  });

  it('switching the global app to Dark does NOT change this screen\'s background', async () => {
    const renderer = await renderScreen(Screen, routeName);
    const before = gradientColors(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(gradientColors(renderer)).toEqual(before);
    expect(gradientColors(renderer)).toEqual([...AWA_ORIGINAL_LIGHT_GRADIENT]);
  });

  it('enabling True Black does NOT change this screen\'s background', async () => {
    const renderer = await renderScreen(Screen, routeName);

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });

    expect(gradientColors(renderer)).toEqual([...AWA_ORIGINAL_LIGHT_GRADIENT]);
  });

  it('switching Premium palette does NOT change this screen\'s background', async () => {
    const renderer = await renderScreen(Screen, routeName);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors(renderer)).toEqual([...AWA_ORIGINAL_LIGHT_GRADIENT]);
  });
});

describe('Auth family — form/behavior untouched', () => {
  it('Login: form renders, "Mot de passe oublié ?" still navigates to ForgotPassword', async () => {
    const renderer = await renderScreen(AuthScreen, 'Auth');
    expect(renderer.root.findAllByProps({children: 'Connexion'}).length).toBeGreaterThan(0);
    const link = renderer.root.findAllByProps({children: 'Mot de passe oublié ?'})[0];
    let pressable = link.parent;
    while (pressable && typeof pressable.props.onPress !== 'function') {
      pressable = pressable.parent;
    }
    expect(pressable).toBeTruthy();
    act(() => {
      pressable!.props.onPress();
    });
    expect((navRef.current?.getCurrentRoute() as {name?: string} | undefined)?.name).toBe('ForgotPassword');
  });

  it('Register: form renders, "Connexion" tab still navigates to Auth', async () => {
    const renderer = await renderScreen(RegistrationScreen, 'Registration');
    expect(renderer.root.findAllByProps({children: 'Créer mon compte'}).length).toBeGreaterThan(0);
    const loginTab = renderer.root.findAllByProps({children: 'Connexion'})[0];
    let pressable = loginTab.parent;
    while (pressable && typeof pressable.props.onPress !== 'function') {
      pressable = pressable.parent;
    }
    expect(pressable).toBeTruthy();
    act(() => {
      pressable!.props.onPress();
    });
    expect((navRef.current?.getCurrentRoute() as {name?: string} | undefined)?.name).toBe('Auth');
  });

  it('Forgot Password: form renders, back button still calls navigation.goBack', async () => {
    const renderer = await renderScreen(ForgotPasswordScreen, 'ForgotPassword');
    expect(renderer.root.findAllByProps({children: 'Envoyer le lien de réinitialisation'}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Retour'}).length).toBeGreaterThan(0);
  });
});
