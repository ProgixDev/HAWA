import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text, TextInput} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import ForgotPasswordScreen from '../ForgotPasswordScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Real-device finding (post-Phase-7M audit): ForgotPasswordScreen.tsx's
// "Besoin d'aide ?" row opened a native Android Alert.alert(...) instead of
// AWA's own design — this file covers the fix (HelpSupportModal.tsx) plus a
// full localization pass of the screen (which, unlike the Privacy screen,
// turned out to already be fully wired to i18n — the only real bug was the
// native Alert).

jest.spyOn(Alert, 'alert');

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 375, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderForgotPassword() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <ForgotPasswordScreen navigation={navigation as never} route={{key: 'f', name: 'ForgotPassword', params: undefined} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

beforeEach(async () => {
  await resetAppLanguageForTests();
  (Alert.alert as jest.Mock).mockClear();
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

function findTextMatching(renderer: ReactTestRenderer.ReactTestRenderer, pattern: RegExp): ReactTestRenderer.ReactTestInstance {
  const [match] = renderer.root.findAllByType(Text).filter(node => {
    const text = [node.props.children].flat(Infinity).join('');
    return pattern.test(text);
  });
  if (!match) {throw new Error(`No Text found matching ${pattern}`);}
  return match;
}

function pressOwningPressable(node: ReactTestRenderer.ReactTestInstance) {
  let current: ReactTestRenderer.ReactTestInstance | null = node;
  while (current && typeof current.props.onPress !== 'function') {
    current = current.parent;
  }
  if (!current) {throw new Error('Could not find an owning Pressable');}
  act(() => {
    current!.props.onPress();
  });
}

function pressHelpRow(renderer: ReactTestRenderer.ReactTestRenderer) {
  pressOwningPressable(findTextMatching(renderer, /Need help\?|Besoin d.aide ?\?/));
}

describe('TEST 19 — the help interaction is NOT a native Alert.alert', () => {
  it('opening help never calls Alert.alert', async () => {
    const renderer = await renderForgotPassword();
    pressHelpRow(renderer);

    expect(Alert.alert).not.toHaveBeenCalled();
    // AWA's own modal renders its CTA instead.
    expect(textsOf(renderer)).toContain('Got it');
  });
});

describe('TEST 15/16 — Forgot Password screen + help modal follow the app language', () => {
  it('TEST 15 — English default', async () => {
    const renderer = await renderForgotPassword();
    expect(textsOf(renderer)).toContain('Forgot password?');
    expect(textsOf(renderer)).toContain('Need help?');

    pressHelpRow(renderer);
    const texts = textsOf(renderer);
    expect(texts).toContain('Need help?');
    expect(texts).toContain('Our support team will get back to you as soon as possible.');
    expect(texts).toContain('Got it');
  });

  it('TEST 16 — explicit French', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');

    const renderer = await renderForgotPassword();
    expect(textsOf(renderer)).toContain('Mot de passe oublié ?');

    pressHelpRow(renderer);
    const texts = textsOf(renderer);
    expect(texts).toContain('Besoin d’aide ?');
    expect(texts).toContain('Notre équipe support te répondra dès que possible.');
    expect(texts).toContain('Compris');
  });
});

describe('TEST 20 — opening/closing Help preserves the entered email', () => {
  it('the email field keeps its value after the help modal opens and closes', async () => {
    const renderer = await renderForgotPassword();
    const input = renderer.root.findByType(TextInput);
    act(() => {
      input.props.onChangeText('amina@example.com');
    });
    expect(renderer.root.findByType(TextInput).props.value).toBe('amina@example.com');

    pressHelpRow(renderer);
    pressOwningPressable(findTextMatching(renderer, /Got it/));

    expect(renderer.root.findByType(TextInput).props.value).toBe('amina@example.com');
  });
});

describe('TEST 21 — runtime EN → FR → EN on the mounted Forgot Password screen', () => {
  it('the help modal copy updates live across a language switch', async () => {
    const renderer = await renderForgotPassword();
    pressHelpRow(renderer);
    expect(textsOf(renderer)).toContain('Need help?');

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    expect(textsOf(renderer)).toContain('Besoin d’aide ?');
    expect(textsOf(renderer)).not.toContain('Need help?');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });
    expect(textsOf(renderer)).toContain('Need help?');
    expect(textsOf(renderer)).not.toContain('Besoin d’aide ?');
  });
});
