import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import AuthScreen from '../AuthScreen';
import RegistrationScreen from '../RegistrationScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

// The Auth family (Login/Register/Forgot Password) was previously
// intentionally LIGHT-ONLY (frozen AUTH_LIGHT_THEME snapshot, never reacting
// to the user's actual theme). That decision has been reversed: Auth now
// consumes the same reactive useAwaTheme() every other migrated screen uses,
// via the existing centralized AwaThemeProvider — no new palette, no local
// dark-mode resolution, no second theme system. authLightTheme.ts and the
// old AuthFamilyLightOnlyBackground.test.tsx (which asserted the opposite
// behavior) have been removed as part of this migration.

jest.mock('../../state/personalInformationStore', () => ({
  updatePersonalInformation: jest.fn().mockResolvedValue(undefined),
}));

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

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
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

const TARGET_FILES: Array<[string, string]> = [
  ['AuthScreen.tsx', '../AuthScreen.tsx'],
  ['RegistrationScreen.tsx', '../RegistrationScreen.tsx'],
  ['ForgotPasswordScreen.tsx', '../ForgotPasswordScreen.tsx'],
];

describe('Auth family — static appearance-resolution guard', () => {
  it.each(TARGET_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no new Auth palette)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/\bisDark\b/);
      expect(source).not.toMatch(/\bisLight\b/);
      expect(source).not.toMatch(/darkMode/i);
      expect(source).not.toMatch(/\bCOLORS_LIGHT\b|\bCOLORS_DARK\b|\bAUTH_LIGHT\b|\bAUTH_DARK\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/theme\.name\s*===/);
      expect(source).not.toMatch(/trueBlackEnabled/);
      expect(source).not.toMatch(/AUTH_LIGHT_THEME/);
      expect(source).not.toMatch(/from ['"]\.\.\/theme\/authLightTheme['"]/);
      expect(source).toMatch(/useAwaTheme\s*\(/);
    },
  );

  it('authLightTheme.ts (the old frozen-light snapshot) no longer exists', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../../theme/authLightTheme.ts'))).toBe(false);
  });

  it('StatusBar uses theme.statusBarStyle in every Auth screen', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).toMatch(/barStyle=\{theme\.statusBarStyle\}/);
      expect(source).not.toMatch(/barStyle="dark-content"/);
    }
  });

  it('placeholder text and CTA foreground are theme-derived, not hardcoded white/black', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).toMatch(/placeholderTextColor=\{theme\.colors\.textMuted\}/);
      expect(source).not.toMatch(/placeholderTextColor="#/);
    }
    // CTA foreground uses onPrimaryTextColor(theme), never a fixed '#FFFFFF' literal.
    const auth = fs.readFileSync(path.resolve(__dirname, '../AuthScreen.tsx'), 'utf8');
    const registration = fs.readFileSync(path.resolve(__dirname, '../RegistrationScreen.tsx'), 'utf8');
    const forgot = fs.readFileSync(path.resolve(__dirname, '../ForgotPasswordScreen.tsx'), 'utf8');
    for (const source of [auth, registration, forgot]) {
      expect(source).toMatch(/onPrimaryTextColor\(theme\)/);
    }
  });

  it('no bare hex/rgba structural literals remain in any Auth screen', () => {
    for (const [, relativePath] of TARGET_FILES) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toMatch(/rgba\(/);
    }
  });
});

describe.each(SCREENS)('%s — resolved global theme', (_label, Screen, routeName) => {
  it('page background resolves from the global theme and changes Light -> Dark without remounting', async () => {
    const renderer = await renderScreen(Screen, routeName);
    const before = gradientColors(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(gradientColors(renderer)).not.toEqual(before);
  });

  it('switching back to Light automatically restores the correct light appearance (no isDark ?: local branching)', async () => {
    const renderer = await renderScreen(Screen, routeName);
    const lightBefore = gradientColors(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(gradientColors(renderer)).not.toEqual(lightBefore);

    await act(async () => {
      await setAppearanceMode('light');
    });
    expect(gradientColors(renderer)).toEqual(lightBefore);
  });

  it('StatusBar barStyle follows the resolved theme', async () => {
    const renderer = await renderScreen(Screen, routeName);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('True Black is inherited from the Provider without any local handling', async () => {
    const renderer = await renderScreen(Screen, routeName);

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(false);
    });
    const before = gradientColors(renderer);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });

    expect(gradientColors(renderer)).not.toEqual(before);
  });

  it('a Premium palette switch changes the page background (no palette-ID branching in this screen)', async () => {
    const renderer = await renderScreen(Screen, routeName);
    const before = gradientColors(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors(renderer)).not.toEqual(before);
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

  it('Registration: password-visibility toggle and validation-rule hint still work', async () => {
    const renderer = await renderScreen(RegistrationScreen, 'Registration');
    expect(renderer.root.findAllByProps({children: '8 caractères min., une majuscule, un chiffre et un caractère spécial'}).length).toBeGreaterThan(0);
  });

  it('every card/input surface resolves from the theme (not a fixed literal) and differs Light -> Dark', async () => {
    const renderer = await renderScreen(AuthScreen, 'Auth');
    const findFieldBg = () => {
      const match = renderer.root.findAll(node => {
        const style = flattenStyle(node.props?.style);
        return typeof style.borderRadius === 'number' && style.borderRadius === 13 && typeof style.backgroundColor === 'string';
      })[0];
      return match ? flattenStyle(match.props.style).backgroundColor : undefined;
    };
    const before = findFieldBg();
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findFieldBg()).not.toBe(before);
  });
});
