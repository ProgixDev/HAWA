import AsyncStorage from '@react-native-async-storage/async-storage';

// The language the first screen is rendered in, and how it follows the phone's language (automatic mode) or not (manual choice). Uses the
// real i18next instance and the real preference store; only the phone's language list is mocked.

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
const MODE_KEY = '@awa/appearance/language-mode-v1';

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
  await AsyncStorage.removeItem(MODE_KEY);
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

  it('an unsupported phone language (Persian, Afrikaans) starts in English, never in French', async () => {
    for (const tags of [['fa-IR'], ['af-ZA'], ['fa', 'xx']]) {
      mockDevice.tags = tags;
      const {i18n, boot} = startApp();
      await boot.initializeAppLanguage();
      expect(i18n.language).toBe('en');
      expect(i18n.t('common.save')).toBe('Save');
    }
  });

  it('Persian first and French second starts in French (the first supported preferred language)', async () => {
    mockDevice.tags = ['fa-IR', 'fr-DZ'];
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
    await AsyncStorage.setItem(MODE_KEY, 'manual');
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


describe('automatic mode: AWA follows the phone, at every launch and when the app comes back to the foreground', () => {
  it('first launch on a French phone is French; after the phone is switched to English, Arabic or Spanish the next launch follows it', async () => {
    mockDevice.tags = ['fr-FR'];
    let app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('fr');
    expect(await AsyncStorage.getItem(KEY)).toBe('fr');

    for (const [tags, expected] of [[['en-GB'], 'en'], [['ar-SA'], 'ar'], [['es-ES'], 'es'], [['fa-IR'], 'en']] as const) {
      mockDevice.tags = [...tags];
      app = startApp(); // a new launch after the phone's language changed
      await app.boot.initializeAppLanguage();
      expect(app.i18n.language).toBe(expected);
    }
  });

  it('while the app is open, coming back to the foreground applies a phone-language change to i18next', async () => {
    mockDevice.tags = ['fr-FR'];
    const app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('fr');

    mockDevice.tags = ['en-GB'];
    await app.boot.refreshLanguageFromDevice();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(app.i18n.language).toBe('en');
    expect(app.i18n.t('common.save')).toBe('Save');
  });

  it('a manual Spanish stays Spanish when the phone changes to French, also on a foreground refresh', async () => {
    mockDevice.tags = ['en-GB'];
    const app = startApp();
    await app.boot.initializeAppLanguage();
    await app.prefs.setAppLanguage('es');
    mockDevice.tags = ['fr-FR'];
    await app.boot.refreshLanguageFromDevice();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(app.i18n.language).toBe('es');
  });

  it('back to automatic: AWA follows the current phone language again', async () => {
    mockDevice.tags = ['en-GB'];
    const app = startApp();
    await app.boot.initializeAppLanguage();
    await app.prefs.setAppLanguage('es');
    mockDevice.tags = ['fr-FR'];
    await app.prefs.setAppLanguageAuto();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(app.i18n.language).toBe('fr');
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

  it('an install whose language was left on the removed "System default" (nothing stored) follows the phone at every launch', async () => {
    mockDevice.tags = ['tr-TR'];
    let app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('tr');

    mockDevice.tags = ['ru-RU'];
    app = startApp();
    await app.boot.initializeAppLanguage();
    expect(app.i18n.language).toBe('ru');
  });
});
