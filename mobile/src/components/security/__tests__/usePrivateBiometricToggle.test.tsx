import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {usePrivateBiometricToggle} from '../usePrivateBiometricToggle';
import {disablePrivateBiometry, enablePrivateBiometry, getBiometryType} from '../../../services/privateSectionAuth';
import {isBiometricEnabled, isPrivateBiometricEnabled, loadSecurityPreferences, setBiometricEnabled, setPrivateBiometricEnabled} from '../../../state/securityPreferences';
import i18n from '../../../i18n';

// PHASE 3 follow-up — the switch of the PRIVATE sections' biometric unlock: its own setting, never touching the app lock's one. Only what the OS
// decides (support, prompt result) is scripted.

jest.mock('../../../services/privateSectionAuth', () => ({
  enablePrivateBiometry: jest.fn(),
  disablePrivateBiometry: jest.fn(),
  getBiometryType: jest.fn(),
}));

type Hook = ReturnType<typeof usePrivateBiometricToggle>;
const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

async function mountHook(onChanged = jest.fn()) {
  const holder: {current: Hook | null} = {current: null};
  const Probe = () => {
    holder.current = usePrivateBiometricToggle(onChanged);
    return null;
  };
  await act(async () => {
    mounted.push(ReactTestRenderer.create(<Probe />));
  });
  return {holder, onChanged};
}

beforeEach(async () => {
  (enablePrivateBiometry as jest.Mock).mockReset();
  (disablePrivateBiometry as jest.Mock).mockReset();
  (getBiometryType as jest.Mock).mockReset();
  (getBiometryType as jest.Mock).mockResolvedValue('Fingerprint');
  await i18n.changeLanguage('fr');
  await setPrivateBiometricEnabled(false);
  await setBiometricEnabled(false);
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('private biometric setting', () => {
  it('is off by default, persisted when set, and independent from the app-lock biometric setting', async () => {
    expect(isPrivateBiometricEnabled()).toBe(false);
    await setPrivateBiometricEnabled(true);
    expect(isPrivateBiometricEnabled()).toBe(true);
    expect(isBiometricEnabled()).toBe(false);
    await loadSecurityPreferences();
    expect(isPrivateBiometricEnabled()).toBe(true);
    await setBiometricEnabled(true);
    await setPrivateBiometricEnabled(false);
    expect(isBiometricEnabled()).toBe(true);
  });
});

describe('usePrivateBiometricToggle', () => {
  it('turning it on creates the credential, then records the setting and notifies', async () => {
    (enablePrivateBiometry as jest.Mock).mockResolvedValue(true);
    const {holder, onChanged} = await mountHook();
    await act(async () => holder.current!.toggle(true));
    expect(isPrivateBiometricEnabled()).toBe(true);
    expect(holder.current!.error).toBeNull();
    expect(onChanged).toHaveBeenCalled();
    expect(isBiometricEnabled()).toBe(false);
  });

  it('a declined prompt leaves the setting off and says so', async () => {
    (enablePrivateBiometry as jest.Mock).mockResolvedValue(false);
    const {holder} = await mountHook();
    await act(async () => holder.current!.toggle(true));
    expect(isPrivateBiometricEnabled()).toBe(false);
    expect(holder.current!.error).toBe(i18n.t('faceIdSetup.authFailedOrCancelled'));
  });

  it('a biometric error leaves the setting unchanged, with a generic message and no detail', async () => {
    (enablePrivateBiometry as jest.Mock).mockRejectedValue(new Error('sensor failure'));
    const {holder} = await mountHook();
    await act(async () => holder.current!.toggle(true));
    expect(isPrivateBiometricEnabled()).toBe(false);
    expect(holder.current!.error).toBe(i18n.t('security.authCancelledOrUnavailable'));
    expect(holder.current!.error).not.toContain('sensor');
  });

  it('a phone without biometrics cannot turn it on, and the credential is not even attempted', async () => {
    (getBiometryType as jest.Mock).mockResolvedValue(null);
    const {holder} = await mountHook();
    await act(async () => holder.current!.toggle(true));
    expect(enablePrivateBiometry).not.toHaveBeenCalled();
    expect(holder.current!.error).toBe(i18n.t('faceIdSetup.noCapability'));
    expect(isPrivateBiometricEnabled()).toBe(false);
  });

  it('turning it off removes the credential and records the setting; a declined prompt keeps it on', async () => {
    await setPrivateBiometricEnabled(true);
    (disablePrivateBiometry as jest.Mock).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const {holder} = await mountHook();
    await act(async () => holder.current!.toggle(false));
    expect(isPrivateBiometricEnabled()).toBe(true);
    await act(async () => holder.current!.toggle(false));
    expect(isPrivateBiometricEnabled()).toBe(false);
  });
});
