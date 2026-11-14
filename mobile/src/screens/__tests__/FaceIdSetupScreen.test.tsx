import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ActivityIndicator, Pressable, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';

import FaceIdSetupScreen from '../FaceIdSetupScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {hasBiometricCredential} from '../../services/appSecurityService';
import {isBiometricEnabled, setBiometricEnabled} from '../../state/securityPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// PHASE 3 — enabling and removing the biometric unlock (FaceIdSetupScreen): capability detection, loading state, success, declined prompt, errors.
// Real appSecurityService and securityPreferences over the in-memory Keychain of jest.setup.js; the OS answers (support, prompt result) are scripted.

const BIOMETRIC_SERVICE = 'com.hawa.app-lock.biometric';
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 760}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flush = async () => {
  for (let index = 0; index < 14; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount(params?: {action?: 'enable' | 'manage' | 'disable'}) {
  const goBack = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <FaceIdSetupScreen navigation={{goBack} as never} route={{key: 'k', name: 'FaceIdSetup', params} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return {renderer, goBack};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join('').replace(/[\u{F0000}-\u{FFFFF}]/gu, ''));

const alertText = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined => {
  const alert = renderer.root.findAll(node => node.props.accessibilityRole === 'alert')[0];
  // (the icon glyph is a private-use character: not part of what is read)
  return alert ? alert.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join('').replace(/[󰀀-󿿿]/gu, '')).join('') : undefined;
};

const pressButton = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const button = renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label)[0];
  expect(button).toBeDefined();
  await act(async () => {
    button.props.onPress();
  });
  await flush();
};

const supportFingerprint = () => (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue('Fingerprint');

beforeEach(async () => {
  // the app's default language is English: pin French explicitly, as the other suites do, so the screen and the expectations agree
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
  (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);
  await setBiometricEnabled(false);
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
});

describe('opening the screen', () => {
  it('shows a loading state while the phone is asked what it supports, then the enable action', async () => {
    supportFingerprint();
    let resolveSupport!: (value: string) => void;
    (Keychain.getSupportedBiometryType as jest.Mock).mockImplementationOnce(() => new Promise<string>(resolve => {resolveSupport = resolve;}));
    const {renderer} = await mount();
    expect(renderer.root.findAllByType(ActivityIndicator).length).toBe(1);
    expect(textsOf(renderer)).toContain(i18n.t('faceIdSetup.verifyingBiometrics'));
    expect(renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === i18n.t('faceIdSetup.enableTitle', {label: i18n.t('biometrics.fingerprintLabel')})).length).toBe(0);

    await act(async () => {
      resolveSupport('Fingerprint');
    });
    await flush();
    expect(renderer.root.findAllByType(ActivityIndicator).length).toBe(0);
    expect(textsOf(renderer)).toContain(i18n.t('faceIdSetup.subtitleAvailable'));
  });

  it('names the sensor the phone really has', async () => {
    (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue('FaceID');
    const {renderer} = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('faceIdSetup.enableTitle', {label: i18n.t('biometrics.faceId')}));
  });

  it('opens on "manage" when the biometric unlock is already on, and on "enable" otherwise; a route parameter wins', async () => {
    supportFingerprint();
    const label = i18n.t('biometrics.fingerprintLabel');
    const enable = i18n.t('faceIdSetup.enableTitle', {label});
    const manage = i18n.t('faceIdSetup.manageTitle', {label});
    expect(textsOf((await mount()).renderer)).toContain(enable);
    await setBiometricEnabled(true);
    expect(textsOf((await mount()).renderer)).toContain(manage);
    expect(textsOf((await mount({action: 'enable'})).renderer)).toContain(enable);
  });

  it('a phone without biometrics says so, and pressing the action explains that it cannot work', async () => {
    const {renderer, goBack} = await mount();
    expect(textsOf(renderer)).toContain(i18n.t('faceIdSetup.subtitleUnavailable'));
    await pressButton(renderer, i18n.t('faceIdSetup.enableTitle', {label: i18n.t('biometrics.genericLabel')}));
    expect(alertText(renderer)).toBe(i18n.t('faceIdSetup.noCapability'));
    expect(await hasBiometricCredential().catch(() => false)).toBe(false);
    expect(isBiometricEnabled()).toBe(false);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('when the capability check itself fails, the screen says it is unavailable instead of crashing', async () => {
    (Keychain.getSupportedBiometryType as jest.Mock).mockRejectedValue(new Error('keystore failure'));
    const {renderer} = await mount();
    expect(alertText(renderer)).toBe(i18n.t('faceIdSetup.unavailable'));
    expect(renderer.root.findAllByType(ActivityIndicator).length).toBe(0);
    expect(JSON.stringify(renderer.toJSON())).not.toContain('keystore failure');
  });
});

describe('enabling', () => {
  const enableLabel = () => i18n.t('faceIdSetup.enableTitle', {label: i18n.t('biometrics.fingerprintLabel')});
  beforeEach(() => {
    supportFingerprint();
  });

  it('creates the credential, turns the biometric unlock on, confirms, and leaves the screen shortly after', async () => {
    const {renderer, goBack} = await mount();
    await pressButton(renderer, enableLabel());
    expect(isBiometricEnabled()).toBe(true);
    expect((await Keychain.getGenericPassword({service: BIOMETRIC_SERVICE})) !== false).toBe(true);
    expect(alertText(renderer)).toBe(i18n.t('faceIdSetup.enabledSuccess', {label: i18n.t('biometrics.fingerprintLabel')}));
    expect(goBack).not.toHaveBeenCalled();
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 600)); // the screen leaves after 500 ms
    });
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('a declined prompt shows the failure, does not turn anything on, and keeps the screen open', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const {renderer, goBack} = await mount();
    await pressButton(renderer, enableLabel());
    expect(alertText(renderer)).toBe(i18n.t('faceIdSetup.authFailedOrCancelled'));
    expect(isBiometricEnabled()).toBe(false);
    expect(goBack).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(ActivityIndicator).length).toBe(0); // not stuck loading
  });

  it('a Keychain error shows the "cancelled or unavailable" message and no detail of the error', async () => {
    (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('sensor failure'));
    const {renderer, goBack} = await mount();
    await pressButton(renderer, enableLabel());
    expect(alertText(renderer)).toBe(i18n.t('security.authCancelledOrUnavailable'));
    expect(JSON.stringify(renderer.toJSON())).not.toContain('sensor failure');
    expect(isBiometricEnabled()).toBe(false);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('can be retried after a failure', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const {renderer} = await mount();
    await pressButton(renderer, enableLabel());
    expect(isBiometricEnabled()).toBe(false);
    await pressButton(renderer, enableLabel());
    expect(isBiometricEnabled()).toBe(true);
  });
});

describe('removing', () => {
  const disableLabel = () => i18n.t('faceIdSetup.disableAction', {label: i18n.t('biometrics.fingerprintLabel')});
  beforeEach(async () => {
    supportFingerprint();
    await Keychain.setGenericPassword('awa-biometric', 'enabled', {service: BIOMETRIC_SERVICE});
    await setBiometricEnabled(true);
  });

  it('after a successful prompt removes the credential, turns the unlock off, confirms and leaves', async () => {
    const {renderer, goBack} = await mount();
    await pressButton(renderer, disableLabel());
    expect(isBiometricEnabled()).toBe(false);
    expect(await Keychain.getGenericPassword({service: BIOMETRIC_SERVICE})).toBe(false);
    expect(alertText(renderer)).toBe(i18n.t('faceIdSetup.disabledSuccess', {label: i18n.t('biometrics.fingerprintLabel')}));
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 600)); // the screen leaves after 500 ms
    });
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('a declined prompt keeps the biometric unlock on and the credential in place', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const {renderer, goBack} = await mount();
    await pressButton(renderer, disableLabel());
    expect(alertText(renderer)).toBe(i18n.t('faceIdSetup.authFailedOrCancelled'));
    expect(isBiometricEnabled()).toBe(true);
    expect((await Keychain.getGenericPassword({service: BIOMETRIC_SERVICE})) !== false).toBe(true);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('a Keychain error during removal keeps everything in place', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('sensor failure'));
    const {renderer} = await mount();
    await pressButton(renderer, disableLabel());
    expect(alertText(renderer)).toBe(i18n.t('security.authCancelledOrUnavailable'));
    expect(isBiometricEnabled()).toBe(true);
  });
});
