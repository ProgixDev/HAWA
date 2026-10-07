import * as Keychain from 'react-native-keychain';

import {authenticateWithBiometry} from '../privateSectionAuth';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// TEST 13 — the biometric OS prompt (title/subtitle/cancel) passed to
// react-native-keychain must come from the existing i18next architecture
// (privateSectionAuth.ts's own i18n singleton import), not hardcoded French,
// and must switch with the app language exactly like every other translated
// string. Biometric AUTHENTICATION BEHAVIOR itself is untouched — this only
// checks the copy handed to Keychain.

const mockGetGenericPassword = Keychain.getGenericPassword as jest.Mock;

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French (default)" test was written against the old French
  // default and never set a language explicitly (the English-expecting
  // tests already do). Pinning French here preserves the test's original
  // intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
  mockGetGenericPassword.mockClear();
});

describe('privateSectionAuth.ts — biometric prompt localization', () => {
  it('French (default): existing wording is preserved', async () => {
    await authenticateWithBiometry();

    const [[options]] = mockGetGenericPassword.mock.calls;
    expect(options.authenticationPrompt).toEqual({
      title: 'Espace privé AWA',
      subtitle: 'Confirme ton identité pour continuer',
      cancel: 'Annuler',
    });
  });

  it('English: the OS prompt is translated', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en'); // settle the async subscriber-driven switch before asserting

    await authenticateWithBiometry();

    const [[options]] = mockGetGenericPassword.mock.calls;
    expect(options.authenticationPrompt).toEqual({
      title: 'AWA Private Space',
      subtitle: 'Confirm your identity to continue',
      cancel: 'Cancel',
    });
  });

  it('the same translated prompt is used consistently across all three Keychain calls of a fresh biometric setup', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    await authenticateWithBiometry();

    const prompts = mockGetGenericPassword.mock.calls.map(([options]) => options.authenticationPrompt);
    for (const prompt of prompts) {
      expect(prompt).toEqual({
        title: 'AWA Private Space',
        subtitle: 'Confirm your identity to continue',
        cancel: 'Cancel',
      });
    }
  });
});
