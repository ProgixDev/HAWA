import * as Keychain from 'react-native-keychain';
import {authenticateBiometric, confirmAndSavePin, beginPinSetup, verifyPin, hasStoredPin} from '../appSecurityService';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Phase 7C — appSecurityService.ts's biometric prompt (App Lock's own
// Face ID/Touch ID/PIN-fallback system, confirmed separate from
// privateSectionAuth.ts's "Vie intime" prompt) must be built fresh on every
// call, never cached at module scope, so a runtime FR→EN language switch is
// reflected on the very next biometric request without an app restart or
// re-import — the exact bug this phase fixed (previously a module-level
// `const prompt = {...}` object, frozen at whichever language was active
// when the module first loaded).

const getGenericPasswordMock = Keychain.getGenericPassword as jest.Mock;

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French"-expecting tests were written against the old French
  // default and never set a language explicitly (every English-expecting
  // test already does). Pinning French here preserves every test's
  // original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  getGenericPasswordMock.mockClear();
});

afterEach(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST 11 — appSecurityService biometric prompt uses French while the app language is French', () => {
  it('passes the French prompt title/subtitle/cancel to Keychain', async () => {
    await authenticateBiometric();
    const lastCall = getGenericPasswordMock.mock.calls[getGenericPasswordMock.mock.calls.length - 1][0];
    expect(lastCall.authenticationPrompt).toEqual({
      title: 'Déverrouiller AWA',
      subtitle: 'Authentifie-toi pour accéder à ton espace.',
      cancel: 'Annuler',
    });
  });
});

describe('TEST 12 — appSecurityService biometric prompt uses English once the app language is English', () => {
  it('passes the English prompt title/subtitle/cancel to Keychain', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await authenticateBiometric();
    const lastCall = getGenericPasswordMock.mock.calls[getGenericPasswordMock.mock.calls.length - 1][0];
    expect(lastCall.authenticationPrompt).toEqual({
      title: 'Unlock AWA',
      subtitle: 'Authenticate to access your space.',
      cancel: 'Cancel',
    });
  });
});

describe('TEST 13 — a runtime FR→EN switch is reflected on the very next biometric request, no restart/re-import needed', () => {
  it('the first call uses French, the second (after switching) uses English', async () => {
    await authenticateBiometric();
    const firstCall = getGenericPasswordMock.mock.calls[getGenericPasswordMock.mock.calls.length - 1][0];
    expect(firstCall.authenticationPrompt.title).toBe('Déverrouiller AWA');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    await authenticateBiometric();
    const secondCall = getGenericPasswordMock.mock.calls[getGenericPasswordMock.mock.calls.length - 1][0];
    expect(secondCall.authenticationPrompt.title).toBe('Unlock AWA');
  });
});

describe('TEST 18 — PIN digits remain unchanged across a language switch', () => {
  it('a PIN set up in French still verifies correctly after switching to English', async () => {
    expect(beginPinSetup('4821')).toBe(true);
    expect(await confirmAndSavePin('4821')).toBe('success');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    expect(await verifyPin('4821')).toBe(true);
    expect(await verifyPin('0000')).toBe(false);
  });
});

describe('TEST 19 — the PIN storage/Keychain service identifier is unaffected by language', () => {
  it('hasStoredPin() reads the same App-Lock Keychain service regardless of app language', async () => {
    expect(beginPinSetup('1357')).toBe(true);
    await confirmAndSavePin('1357');
    expect(await hasStoredPin()).toBe(true);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    expect(await hasStoredPin()).toBe(true);

    const setGenericPasswordMock = Keychain.setGenericPassword as jest.Mock;
    const pinCall = setGenericPasswordMock.mock.calls.find(call => call[2]?.service === 'com.hawa.app-lock.pin');
    expect(pinCall).toBeDefined();
  });
});

describe('TEST 20 — technical mismatch/missing result codes stay stable across languages (never translated)', () => {
  it('confirmAndSavePin returns the literal "mismatch"/"missing" state codes, not translated text', async () => {
    expect(beginPinSetup('2468')).toBe(true);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    expect(await confirmAndSavePin('9999')).toBe('mismatch');

    const noPending = await confirmAndSavePin('2468');
    expect(noPending).toBe('missing');
  });
});
