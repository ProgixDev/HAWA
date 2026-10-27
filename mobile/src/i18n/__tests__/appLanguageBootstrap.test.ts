import AsyncStorage from '@react-native-async-storage/async-storage';

// The language the first screen is rendered in, and that it does not change when the phone's language does. Uses the real
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

  it('an unsupported phone language (Arabic, Amharic) starts in English, never in French', async () => {
    for (const tags of [['ar-DZ'], ['am-ET'], ['ar', 'am']]) {
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


describe('the language of the first launch is kept: a later phone-language change does not move AWA', () => {
  it('first launch on a French phone stores French; after the phone is switched to English or Arabic AWA still starts in French', async () => {
    mockDevice.tags = ['fr-FR'];
    let app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('fr');
    expect(await AsyncStorage.getItem(KEY)).toBe('fr');

    for (const tags of [['en-US'], ['ar-DZ'], ['es-ES']]) {
      mockDevice.tags = tags;
      app = startApp(); // a new launch after the phone's language changed
      await app.boot.initializeAppLanguage();
      expect(app.i18n.language).toBe('fr');
      expect(app.i18n.t('common.save')).toBe('Enregistrer');
    }
  });

  it('there is no foreground refresh any more', () => {
    const {boot} = startApp();
    expect((boot as Record<string, unknown>).refreshAppLanguageOnForeground).toBeUndefined();
  });

  it('a manual choice made in Appearance is what the next launch starts in, whatever the phone says', async () => {
    mockDevice.tags = ['fr-FR'];
    let app = startApp();
    await app.boot.initializeAppLanguage();
    await app.prefs.setAppLanguage('id');
    expect(app.i18n.language).toBe('id');

    mockDevice.tags = ['de-DE'];
    app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('id');
    expect(app.i18n.t('common.save')).not.toBe('common.save');
  });

  it('an install whose language was left on the removed "System default" is resolved once at its next launch and keeps it', async () => {
    // no stored value: exactly what "System default" used to leave behind
    mockDevice.tags = ['tr-TR'];
    let app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('tr');

    mockDevice.tags = ['ru-RU'];
    app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('tr');
  });
});
