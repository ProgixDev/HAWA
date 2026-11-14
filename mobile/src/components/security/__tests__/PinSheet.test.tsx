import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';

import {PinSheet, type PinSheetMode} from '../PinSheet';
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {
  beginPinSetup,
  cancelPinSetup,
  confirmAndSavePin,
  hasStoredPin,
  verifyPin,
} from '../../../services/appSecurityService';
import {isPinEnabled, setPinEnabled} from '../../../state/securityPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// PHASE 3 — the PIN sheet (create / change / remove) on the REAL appSecurityService and securityPreferences, over the in-memory Keychain of
// jest.setup.js: what the person sees at each step, what is stored, and what is refused.

const PIN_SERVICE = 'com.hawa.app-lock.pin';
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 760}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flush = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function openSheet(mode: PinSheetMode) {
  const onDone = jest.fn();
  const onClose = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <PinSheet mode={mode} onClose={onClose} onDone={onDone} visible />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return {renderer, onDone, onClose};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const alertText = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'alert' && typeof node.props.children === 'string')[0]?.props.children;

async function typeDigits(renderer: ReactTestRenderer.ReactTestRenderer, digits: string) {
  for (const digit of digits) {
    const key = renderer.root.find(
      node => node.type === Pressable && node.props.accessibilityLabel === i18n.t('pinKeypad.digitLabel', {digit}),
    );
    await act(async () => {
      key.props.onPress();
    });
  }
  await flush();
}

const storePin = async (pin: string) => {
  expect(beginPinSetup(pin)).toBe(true);
  expect(await confirmAndSavePin(pin)).toBe('success');
};

beforeEach(async () => {
  // the app's default language is English: pin French explicitly, as the other suites do, so the screen and the expectations agree
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await Keychain.resetGenericPassword({service: PIN_SERVICE});
  await setPinEnabled(false);
  cancelPinSetup();
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
});

describe('create', () => {
  it('asks for a new code, then its confirmation, then stores it and enables the lock', async () => {
    const {renderer, onDone, onClose} = await openSheet('create');
    expect(textsOf(renderer)).toContain(i18n.t('pinSetup.createTitle'));

    await typeDigits(renderer, '4821');
    expect(textsOf(renderer)).toContain(i18n.t('pinConfirm.title'));
    expect(onDone).not.toHaveBeenCalled();
    expect(await hasStoredPin()).toBe(false); // nothing is stored before the confirmation

    await typeDigits(renderer, '4821');
    expect(await hasStoredPin()).toBe(true);
    expect(await verifyPin('4821')).toBe(true);
    expect(isPinEnabled()).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a mismatching confirmation shows the error, stores nothing, and starts again at the new-code step', async () => {
    const {renderer, onDone, onClose} = await openSheet('create');
    await typeDigits(renderer, '1111');
    await typeDigits(renderer, '2222');

    expect(alertText(renderer)).toBe(i18n.t('security.codesDontMatch'));
    expect(textsOf(renderer)).toContain(i18n.t('pinSetup.createTitle'));
    expect(await hasStoredPin()).toBe(false);
    expect(isPinEnabled()).toBe(false);
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    // she can simply try again
    await typeDigits(renderer, '3333');
    await typeDigits(renderer, '3333');
    expect(await verifyPin('3333')).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('closing the sheet half-way forgets the first entry: nothing is stored and a stale confirmation cannot save it', async () => {
    const {renderer, onDone, onClose} = await openSheet('create');
    await typeDigits(renderer, '5555');
    const scrim = renderer.root.find(
      node => node.type === Pressable && node.props.accessibilityLabel === i18n.t('common.close'),
    );
    await act(async () => {
      scrim.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    expect(await confirmAndSavePin('5555')).toBe('missing');
    expect(await hasStoredPin()).toBe(false);
  });

  it('an unusable store (Keychain failure) shows a generic error, never success, and enables nothing', async () => {
    const {renderer, onDone} = await openSheet('create');
    (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    await typeDigits(renderer, '7777');
    await typeDigits(renderer, '7777');
    expect(alertText(renderer)).toBe(i18n.t('security.genericError'));
    expect(onDone).not.toHaveBeenCalled();
    expect(isPinEnabled()).toBe(false);
    expect(await hasStoredPin()).toBe(false);
  });

  it('never shows the digits that were typed', async () => {
    const {renderer} = await openSheet('create');
    await typeDigits(renderer, '4821');
    expect(JSON.stringify(renderer.toJSON())).not.toContain('4821');
  });

  it('lets a typed digit be deleted', async () => {
    const {renderer} = await openSheet('create');
    const press = async (label: string) => {
      const key = renderer.root.find(node => node.type === Pressable && node.props.accessibilityLabel === label);
      await act(async () => {
        key.props.onPress();
      });
    };
    await press(i18n.t('pinKeypad.digitLabel', {digit: '1'}));
    await press(i18n.t('pinKeypad.digitLabel', {digit: '2'}));
    await press(i18n.t('pinKeypad.deleteLastDigit'));
    const hint = renderer.root.find(node => node.props.accessibilityLabel === i18n.t('pinKeypad.digitsEnteredHint', {count: 1, total: 4}));
    expect(hint).toBeTruthy();
  });
});

describe('change', () => {
  beforeEach(async () => {
    await storePin('1111');
    await setPinEnabled(true);
  });

  it('first checks the current code: a wrong one is refused and the sheet stays on that step', async () => {
    const {renderer, onDone} = await openSheet('change');
    expect(textsOf(renderer)).toContain(i18n.t('pinSetup.enterCurrentTitle'));
    await typeDigits(renderer, '0000');
    expect(alertText(renderer)).toBe(i18n.t('security.incorrectCode'));
    expect(textsOf(renderer)).toContain(i18n.t('pinSetup.enterCurrentTitle'));
    expect(onDone).not.toHaveBeenCalled();
    expect(await verifyPin('1111')).toBe(true); // the code is unchanged
  });

  it('with the right current code, a new code replaces it: the old one stops working', async () => {
    const {renderer, onDone, onClose} = await openSheet('change');
    await typeDigits(renderer, '1111');
    expect(textsOf(renderer)).toContain(i18n.t('pinSetup.createTitle'));
    await typeDigits(renderer, '2222');
    await typeDigits(renderer, '2222');
    expect(await verifyPin('1111')).toBe(false);
    expect(await verifyPin('2222')).toBe(true);
    expect(isPinEnabled()).toBe(true);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('abandoning after the identity check keeps the OLD code', async () => {
    const {renderer, onDone} = await openSheet('change');
    await typeDigits(renderer, '1111');
    await typeDigits(renderer, '2222');
    await typeDigits(renderer, '9999'); // mismatching confirmation
    expect(alertText(renderer)).toBe(i18n.t('security.codesDontMatch'));
    expect(onDone).not.toHaveBeenCalled();
    expect(await verifyPin('1111')).toBe(true);
    expect(await verifyPin('2222')).toBe(false);
  });
});

describe('remove', () => {
  beforeEach(async () => {
    await storePin('1111');
    await setPinEnabled(true);
  });

  it('a wrong code keeps the lock and says so', async () => {
    const {renderer, onDone, onClose} = await openSheet('disable');
    expect(textsOf(renderer)).toContain(i18n.t('pinSetup.confirmIdentityTitle'));
    await typeDigits(renderer, '0000');
    expect(alertText(renderer)).toBe(i18n.t('security.incorrectCode'));
    expect(await hasStoredPin()).toBe(true);
    expect(isPinEnabled()).toBe(true);
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('the right code removes the PIN and turns the lock off', async () => {
    const {renderer, onDone, onClose} = await openSheet('disable');
    await typeDigits(renderer, '1111');
    expect(await hasStoredPin()).toBe(false);
    expect(await verifyPin('1111')).toBe(false);
    expect(isPinEnabled()).toBe(false);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a Keychain failure while checking the code shows a generic error and keeps the lock', async () => {
    const {renderer, onDone} = await openSheet('disable');
    (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    await typeDigits(renderer, '1111');
    expect(alertText(renderer)).toBe(i18n.t('security.genericError'));
    expect(onDone).not.toHaveBeenCalled();
    expect(isPinEnabled()).toBe(true);
    expect(await hasStoredPin()).toBe(true);
  });
});
