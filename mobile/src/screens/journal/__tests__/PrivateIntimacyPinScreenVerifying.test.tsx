import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ActivityIndicator, Pressable, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Aes from 'react-native-aes-crypto';

import PrivateIntimacyPinScreen from '../PrivateIntimacyPinScreen';
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {__setPrivatePinKdfIterationsForTests, savePrivatePin} from '../../../services/privateSectionAuth';
import {resetPinAttemptsMemoryForTests} from '../../../services/pinAttemptLimiter';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// The "Vie intime" PIN screen: while the private PIN is derived (PBKDF2, ~0.5 s, ~1.1 s on the first call) it shows "Vérification…" with a loader
// BEFORE the derivation starts, ignores every key, and never lets two checks overlap.

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 760}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const realPbkdf2 = (Aes as unknown as {pbkdf2: (...args: unknown[]) => Promise<string>}).pbkdf2;

const wait = async (ms: number) => {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, ms));
  });
};
const flush = async () => {
  for (let index = 0; index < 14; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount() {
  const navigation = {replace: jest.fn(), popTo: jest.fn(), goBack: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <PrivateIntimacyPinScreen navigation={navigation as never} route={{key: 'k', name: 'PrivateIntimacyPin', params: {target: 'conception'}} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join('').trim());
const loaders = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAll(node => node.props.accessibilityState?.busy === true && node.findAllByType(ActivityIndicator).length > 0).length;
const key = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label)[0];
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const target = key(renderer, label);
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
};
const typePin = async (renderer: ReactTestRenderer.ReactTestRenderer, digits: string) => {
  for (const digit of digits) {
    await press(renderer, digit);
  }
};
const slowDerivation = (ms: number, onStart?: () => void) =>
  jest.spyOn(Aes as never, 'pbkdf2').mockImplementation((async (...args: unknown[]) => {
    onStart?.();
    await new Promise<void>(resolve => setTimeout(resolve, ms));
    return realPbkdf2(...args);
  }) as never);

beforeEach(async () => {
  await AsyncStorage.clear();
  resetPinAttemptsMemoryForTests();
  __setPrivatePinKdfIterationsForTests(1000);
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  jest.restoreAllMocks();
  __setPrivatePinKdfIterationsForTests(null);
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('PrivateIntimacyPinScreen — feedback while the code is checked', () => {
  beforeEach(async () => {
    await savePrivatePin('135790');
  });

  it('shows "Vérification…" with a loader before the derivation starts, keeps it during, then opens once', async () => {
    const {renderer, navigation} = await mount();
    let atStart: {texts: string[]; loaders: number} | null = null;
    slowDerivation(1100, () => {
      atStart = {texts: textsOf(renderer), loaders: loaders(renderer)};
    });
    await typePin(renderer, '135790');
    await wait(400);
    expect(textsOf(renderer)).toContain(i18n.t('appLock.verifying'));
    expect(loaders(renderer)).toBeGreaterThan(0);
    expect(navigation.replace).not.toHaveBeenCalled();
    await wait(1200);
    expect(atStart!.texts).toContain(i18n.t('appLock.verifying'));
    expect(atStart!.loaders).toBeGreaterThan(0);
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.verifying'));
    expect(navigation.replace).toHaveBeenCalledTimes(1);
  });

  it('ignores delete and digits while checking, so two checks can never overlap', async () => {
    const {renderer, navigation} = await mount();
    const spy = slowDerivation(800);
    await typePin(renderer, '135790');
    await press(renderer, i18n.t('privateIntimacyPin.deleteKey')); // inside the 120 ms delay
    await press(renderer, '1');
    await wait(300);
    await press(renderer, i18n.t('privateIntimacyPin.deleteKey')); // during the derivation
    await press(renderer, '2');
    await wait(1000);
    expect(spy.mock.calls.length).toBe(1);
    expect(navigation.replace).toHaveBeenCalledTimes(1);
  });

  it('a wrong code removes the notice and shows the error; typing works again', async () => {
    const {renderer, navigation} = await mount();
    slowDerivation(300);
    await typePin(renderer, '000000');
    await wait(150);
    expect(textsOf(renderer)).toContain(i18n.t('appLock.verifying'));
    await wait(700);
    expect(textsOf(renderer)).not.toContain(i18n.t('appLock.verifying'));
    expect(textsOf(renderer)).toContain(i18n.t('privateIntimacyPin.incorrectCode'));
    expect(navigation.replace).not.toHaveBeenCalled();
    await typePin(renderer, '1');
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === i18n.t('privateIntimacyPin.digitsEntered', {count: 1})).length).toBeGreaterThan(0);
  });
});
