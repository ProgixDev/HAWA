import AsyncStorage from '@react-native-async-storage/async-storage';

// The language the first screen is rendered in, and what happens when AWA comes back to the foreground. Uses the real
// i18next instance and the real preference store; only the phone's language list is mocked.

const mockDevice: {tags: unknown; fail: boolean} = {tags: ['en-US'], fail: false};

jest.mock('../../utils/deviceLanguage', () => ({
  readDeviceLocaleTags: jest.fn(async () => {
    if (mockDevice.fail) {
      throw new Error('locale read failed');
    }
    return mockDevice.tags;
  }),
}));

type Boot = {
  i18n: typeof import('../index').default;
  boot: typeof import('../appLanguage');
  prefs: typeof import('../../state/themePreferences');
};
const KEY = '@awa/appearance/language-v1';

/** A new app process: fresh i18next + stores, same stored data. */
function startApp(): Boot {
  jest.resetModules();
  const i18n = (require('../index') as {default: Boot['i18n']}).default;
  const boot = require('../appLanguage') as Boot['boot'];
  const prefs = require('../../state/themePreferences') as Boot['prefs'];
  return {i18n, boot, prefs};
}

beforeEach(async () => {
  mockDevice.tags = ['en-US'];
  mockDevice.fail = false;
  await AsyncStorage.removeItem(KEY);
});

describe('initializeAppLanguage — the language is right before the first screen', () => {
  it('a French phone (fr-DZ) starts in French: i18next is French as soon as the start-up gate opens, not English first', async () => {
    mockDevice.tags = ['fr-DZ'];
    const {i18n, boot} = startApp();
    expect(i18n.language).toBe('en'); // i18next's own default at import time
    await boot.initializeAppLanguage();
    expect(i18n.language).toBe('fr');
    expect(i18n.t('common.save')).toBe('Enregistrer');
  });

  it.each([
    ['fr-FR', 'fr'], ['en-GB', 'en'], ['es-ES', 'es'], ['it-IT', 'it'], ['tr-TR', 'tr'], ['ru-RU', 'ru'], ['de-DE', 'de'], ['zh-Hans', 'zh'],
  ])('onboarding starts in the phone language (%s -> %s)', async (tag, expected) => {
    mockDevice.tags = [tag];
    const {i18n, boot} = startApp();
    await boot.initializeAppLanguage();
    expect(i18n.language).toBe(expected);
    expect(i18n.t('onboarding.welcome.start')).not.toBe('onboarding.welcome.start'); // a real translation, no raw key
  });

  it('an unsupported phone language (Arabic, Portuguese) starts in English, never in French', async () => {
    for (const tags of [['ar-DZ'], ['pt-BR'], ['ar', 'pt']]) {
      mockDevice.tags = tags;
      const {i18n, boot} = startApp();
      await boot.initializeAppLanguage();
      expect(i18n.language).toBe('en');
      expect(i18n.t('common.save')).toBe('Save');
    }
  });

  it('Arabic first and French second starts in French (the first supported preferred language)', async () => {
    mockDevice.tags = ['ar-DZ', 'fr-DZ'];
    const {i18n, boot} = startApp();
    await boot.initializeAppLanguage();
    expect(i18n.language).toBe('fr');
  });

  it('a failure to read the phone language starts in English and does not reject', async () => {
    mockDevice.fail = true;
    const {i18n, boot} = startApp();
    await expect(boot.initializeAppLanguage()).resolves.toBeUndefined();
    expect(i18n.language).toBe('en');
  });

  it('a stored manual choice wins over the phone at start-up (German on a French phone)', async () => {
    await AsyncStorage.setItem(KEY, 'de');
    mockDevice.tags = ['fr-FR'];
    const {i18n, boot} = startApp();
    await boot.initializeAppLanguage();
    expect(i18n.language).toBe('de');
  });

  it('is idempotent: calling it again changes nothing', async () => {
    mockDevice.tags = ['it-IT'];
    const {i18n, boot} = startApp();
    await boot.initializeAppLanguage();
    const changed = jest.fn();
    i18n.on('languageChanged', changed);
    await boot.initializeAppLanguage();
    expect(i18n.language).toBe('it');
    expect(changed).not.toHaveBeenCalled();
  });
});

describe('refreshAppLanguageOnForeground — returning to the app', () => {
  it('follows a language change made in the phone settings while AWA was in the background', async () => {
    mockDevice.tags = ['fr-FR'];
    const {i18n, boot} = startApp();
    await boot.initializeAppLanguage();
    expect(i18n.language).toBe('fr');

    mockDevice.tags = ['en-US']; // French -> English
    await boot.refreshAppLanguageOnForeground();
    expect(i18n.language).toBe('en');

    mockDevice.tags = ['es-ES']; // English -> Spanish
    await boot.refreshAppLanguageOnForeground();
    expect(i18n.language).toBe('es');

    mockDevice.tags = ['ar-DZ']; // Spanish -> Arabic (unsupported) -> English
    await boot.refreshAppLanguageOnForeground();
    expect(i18n.language).toBe('en');
  });

  it('does nothing when the language has not changed (no language event, no flicker)', async () => {
    mockDevice.tags = ['fr-FR'];
    const {i18n, boot} = startApp();
    await boot.initializeAppLanguage();
    const changed = jest.fn();
    i18n.on('languageChanged', changed);
    await boot.refreshAppLanguageOnForeground();
    await boot.refreshAppLanguageOnForeground();
    expect(changed).not.toHaveBeenCalled();
  });

  it('ignores a phone language change when the user chose a language (the choice is not overwritten, in memory or in storage)', async () => {
    mockDevice.tags = ['fr-FR'];
    const {i18n, boot, prefs} = startApp();
    await boot.initializeAppLanguage();
    await prefs.setAppLanguage('de');
    await boot.refreshAppLanguageOnForeground();
    expect(i18n.language).toBe('de');

    mockDevice.tags = ['es-ES'];
    await boot.refreshAppLanguageOnForeground();
    expect(i18n.language).toBe('de');
    expect(await AsyncStorage.getItem(KEY)).toBe('de');
  });

  it('after "System default" AWA follows the phone again, and the foreground refresh keeps following it', async () => {
    mockDevice.tags = ['fr-FR'];
    const {i18n, boot, prefs} = startApp();
    await boot.initializeAppLanguage();
    await prefs.setAppLanguage('de');
    expect(i18n.language).toBe('de');

    await prefs.setAppLanguagePreference('system');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(i18n.language).toBe('fr');

    mockDevice.tags = ['tr-TR'];
    await boot.refreshAppLanguageOnForeground();
    expect(i18n.language).toBe('tr');
  });

  it('never rejects, even when the phone language cannot be read', async () => {
    const {boot} = startApp();
    await boot.initializeAppLanguage();
    mockDevice.fail = true;
    await expect(boot.refreshAppLanguageOnForeground()).resolves.toBeUndefined();
  });
});
