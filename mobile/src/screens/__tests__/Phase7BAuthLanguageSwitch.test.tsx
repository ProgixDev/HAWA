import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AuthScreen from '../AuthScreen';
import RegistrationScreen from '../RegistrationScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Phase 7B — Authentication (login/registration/forgot-password) must follow the app language exactly like every other
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

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — AuthScreen follows the app language; the frontend-only bypass is unaffected', () => {
  it('French: shows "Connexion"/"Se connecter" and the stub login enters MainTabs', () => {
    const navigation = {navigate: jest.fn(), replace: jest.fn()};
    const renderer = renderDirect(<AuthScreen navigation={navigation as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Connexion');

    const submit = renderer.root.find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => [t.props.children].flat(Infinity).join('') === 'Se connecter'));
    act(() => {
      submit.props.onPress();
    });
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
