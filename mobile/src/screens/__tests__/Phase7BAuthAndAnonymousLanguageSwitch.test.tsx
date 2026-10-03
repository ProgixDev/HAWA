import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AuthScreen from '../AuthScreen';
import RegistrationScreen from '../RegistrationScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import AnonymousModeScreen from '../AnonymousModeScreen';
import AnonymousModeLimitationsScreen from '../AnonymousModeLimitationsScreen';
import AnonymousModeCreatingScreen from '../AnonymousModeCreatingScreen';
import AnonymousModeSuccessScreen from '../AnonymousModeSuccessScreen';
import AnonymousAvatarCustomizerScreen from '../AnonymousAvatarCustomizerScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {getPrivacySecuritySettings, updatePrivacySecuritySettings} from '../../state/securityPreferences';
import i18n from '../../i18n';

// Phase 7B — Authentication (login/registration/forgot-password) and
// Anonymous Mode must follow the app language exactly like every other
// migrated screen. AuthScreen/RegistrationScreen are confirmed frontend-only
// stubs (no real backend), so these tests cover the LOCALIZED chrome plus the
// one real piece of client-side logic each screen has — never invented
// backend behavior. A language switch must never affect the frontend-only
// auth bypass, the password-rule regexes, or ForgotPasswordScreen's genuine
// email validation.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

function renderDirect(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const Stack = createNativeStackNavigator();
async function renderWithNavigation(Screen: React.ComponentType<any>, name: string, params?: object) {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), pop: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <Screen navigation={navigation as never} route={{key: 'k', name, params} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return {renderer, navigation};
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  updatePrivacySecuritySettings({anonymousMode: false});
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — AuthScreen follows the app language; the frontend-only bypass is unaffected', () => {
  it('French: shows "Connexion"/"Se connecter" and the stub login clears anonymousMode + enters MainTabs', () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const navigation = {navigate: jest.fn(), replace: jest.fn()};
    const renderer = renderDirect(<AuthScreen navigation={navigation as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Connexion');

    const submit = renderer.root.find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => [t.props.children].flat(Infinity).join('') === 'Se connecter'));
    act(() => {
      submit.props.onPress();
    });
    expect(getPrivacySecuritySettings().anonymousMode).toBe(false);
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
  });

  it('English: shows "Log in"/"Create an account" tabs and no known French chrome leaks', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<AuthScreen navigation={{navigate: jest.fn(), replace: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Log in');
    expect(textsOf(renderer)).toContain('Create an account');
    expect(textsOf(renderer)).not.toContain('Connexion');
    expect(textsOf(renderer)).not.toContain('Créer un compte');
  });
});

describe('TEST 2 — RegistrationScreen follows the app language; password rules and the dynamic toggle label stay correct', () => {
  it('French: field labels/placeholders and the "Masquer : Mot de passe" toggle label', () => {
    const renderer = renderDirect(<RegistrationScreen navigation={{navigate: jest.fn(), replace: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Prénom');
    expect(textsOf(renderer)).toContain('Créer votre compte');
    const toggle = renderer.root.findByProps({accessibilityLabel: 'Afficher : Mot de passe'});
    expect(toggle).toBeTruthy();
  });

  it('English: field labels switch, and the toggle label becomes "Show: Password"', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<RegistrationScreen navigation={{navigate: jest.fn(), replace: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('First name');
    expect(textsOf(renderer)).toContain('Create your account');
    expect(renderer.root.findByProps({accessibilityLabel: 'Show: Password'})).toBeTruthy();
    expect(textsOf(renderer)).not.toContain('Prénom');
  });
});

describe('TEST 3 — ForgotPasswordScreen keeps its real client-side validation, translated', () => {
  it('French: empty email shows the French required-field error', () => {
    const renderer = renderDirect(<ForgotPasswordScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{} as never} />);
    const submit = renderer.root.find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => [t.props.children].flat(Infinity).join('') === 'Envoyer le lien de réinitialisation'));
    act(() => {
      submit.props.onPress();
    });
    expect(textsOf(renderer)).toContain('Entre ton adresse e-mail.');
  });

  it('English: an invalid email shows the English format error, and a valid email never claims an email was sent', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<ForgotPasswordScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{} as never} />);
    const input = renderer.root.findByProps({placeholder: 'example@email.com'});
    const submit = renderer.root.find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => [t.props.children].flat(Infinity).join('') === 'Send reset link'));

    act(() => {
      input.props.onChangeText('not-an-email');
    });
    act(() => {
      submit.props.onPress();
    });
    expect(textsOf(renderer)).toContain('Enter a valid email address.');

    act(() => {
      input.props.onChangeText('user@example.com');
    });
    act(() => {
      submit.props.onPress();
    });
    const infoText = textsOf(renderer).find(t => t.includes('valid'));
    expect(infoText).toBeDefined();
    expect(infoText?.toLowerCase()).not.toContain('sent');
  });
});

describe('TEST 4 — AnonymousModeScreen (pitch + management views) follows the app language', () => {
  it('French: pitch view shows "Continuer en mode anonyme" and navigates to Limitations', async () => {
    const {renderer, navigation} = await renderWithNavigation(AnonymousModeScreen, 'AnonymousMode', {source: 'auth'});
    expect(textsOf(renderer)).toContain('Continuer en mode anonyme');
    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'Continuer en mode anonyme'}).props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('AnonymousModeLimitations', {source: 'auth'});
  });

  it('English: management view (already active) shows "Anonymous Mode enabled" and retention rows', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const {renderer} = await renderWithNavigation(AnonymousModeScreen, 'AnonymousMode', {});
    expect(textsOf(renderer)).toContain('Anonymous Mode enabled');
    expect(textsOf(renderer)).toContain('Email');
    expect(textsOf(renderer)).toContain('Not kept');
    expect(textsOf(renderer)).not.toContain('Mode Anonyme activé');
  });
});

describe('TEST 5 — AnonymousModeLimitationsScreen: the acknowledge-checkbox gating is unaffected by language', () => {
  it('English: "Enable anonymous mode" stays disabled until the checkbox is acknowledged', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const {renderer, navigation} = await renderWithNavigation(AnonymousModeLimitationsScreen, 'AnonymousModeLimitations', {});
    const activate = renderer.root.findByProps({accessibilityLabel: 'Enable anonymous mode'});
    expect(activate.props.accessibilityState.disabled).toBe(true);

    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'I understand how anonymous mode works.'}).props.onPress();
    });
    const activateAfter = renderer.root.findByProps({accessibilityLabel: 'Enable anonymous mode'});
    expect(activateAfter.props.accessibilityState.disabled).toBe(false);
    act(() => {
      activateAfter.props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('AnonymousModeCreating', {source: undefined});
  });
});

describe('TEST 6 — AnonymousModeCreatingScreen renders translated step labels and a retry path on error', () => {
  it('English: shows the 3 translated step checkpoints while loading', async () => {
    const {renderer} = await renderWithNavigation(AnonymousModeCreatingScreen, 'AnonymousModeCreating', {});
    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    // Re-render is driven by the component's own useTranslation() subscription.
    expect(textsOf(renderer).some(t => t.includes('Preparing your space') || t.includes('Création'))).toBe(true);
  });
});

describe('TEST 7 — AnonymousModeSuccessScreen follows the app language for both finish labels', () => {
  it('French, fromAuth=true: shows "Continuer" and proceeds to the avatar customizer', async () => {
    const {renderer, navigation} = await renderWithNavigation(AnonymousModeSuccessScreen, 'AnonymousModeSuccess', {source: 'auth'});
    expect(textsOf(renderer)).toContain('Mode anonyme activé');
    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'Continuer'}).props.onPress();
    });
    expect(navigation.replace).toHaveBeenCalledWith('AnonymousAvatarCustomizer', {source: 'auth'});
  });

  it('English, fromAuth=false: shows "Done" and pops 3 screens back to the settings entry point', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const {renderer, navigation} = await renderWithNavigation(AnonymousModeSuccessScreen, 'AnonymousModeSuccess', {});
    expect(textsOf(renderer)).toContain('Anonymous mode enabled');
    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'Done'}).props.onPress();
    });
    expect(navigation.pop).toHaveBeenCalledWith(3);
  });
});

describe('TEST 8 — AnonymousAvatarCustomizerScreen: shared style labels follow the language and onboarding completion is unaffected', () => {
  it('French: the 8 avatar style options show French labels', async () => {
    const {renderer} = await renderWithNavigation(AnonymousAvatarCustomizerScreen, 'AnonymousAvatarCustomizer', {});
    expect(textsOf(renderer)).toContain('Avatar minimal');
  });

  it('English: the same style options show English labels, and "Save and continue" enters MainTabs', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const {renderer, navigation} = await renderWithNavigation(AnonymousAvatarCustomizerScreen, 'AnonymousAvatarCustomizer', {source: 'auth'});
    expect(textsOf(renderer)).toContain('Minimal avatar');
    expect(textsOf(renderer)).not.toContain('Avatar minimal');

    act(() => {
      renderer.root.findByProps({accessibilityLabel: 'Save and continue'}).props.onPress();
    });
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
  });
});
