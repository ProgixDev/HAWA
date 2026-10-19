import AsyncStorage from '@react-native-async-storage/async-storage';

// Automatic system-language detection with English as the fallback, a manual choice that always wins, and "System default"
// to go back. The device's language list is mocked; storage is the shared in-memory mock, so a fresh module registry
// (jest.resetModules) models an app restart on the same stored data.

const mockDevice: {tags: unknown; fail: boolean; delayMs: number} = {tags: ['en-US'], fail: false, delayMs: 0};

jest.mock('../../utils/deviceLanguage', () => ({
  readDeviceLocaleTags: jest.fn(async () => {
    if (mockDevice.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, mockDevice.delayMs));
    }
    if (mockDevice.fail) {
      throw new Error('locale read failed');
    }
    return mockDevice.tags;
  }),
}));

type Prefs = typeof import('../themePreferences');
const KEY = '@awa/appearance/language-v1';

/** A new app process: fresh module state, same stored data. */
function startApp(): Prefs {
  jest.resetModules();
  return require('../themePreferences') as Prefs;
}

beforeEach(async () => {
  mockDevice.tags = ['en-US'];
  mockDevice.fail = false;
  mockDevice.delayMs = 0;
  await AsyncStorage.removeItem(KEY);
});

describe('one device locale tag -> a supported language', () => {
  const {languageFromLocaleTag} = startApp();

  it.each([
    ['fr', 'fr'], ['fr-FR', 'fr'], ['fr-DZ', 'fr'], ['fr_DZ', 'fr'], ['FR-dz', 'fr'],
    ['en', 'en'], ['en-US', 'en'], ['en-GB', 'en'], ['en_US', 'en'],
    ['es', 'es'], ['es-ES', 'es'], ['es-419', 'es'],
    ['it-IT', 'it'], ['it', 'it'],
    ['tr-TR', 'tr'], ['tr', 'tr'],
    ['ru-RU', 'ru'], ['ru', 'ru'],
    ['de-DE', 'de'], ['de-AT', 'de'], ['de', 'de'],
    ['zh', 'zh'], ['zh-CN', 'zh'], ['zh-Hans', 'zh'], ['zh-Hans-CN', 'zh'], ['zh_CN', 'zh'], ['zh-SG', 'zh'], ['zh-TW', 'zh'], ['zh-Hant-HK', 'zh'],
    ['fr-FR.UTF-8', 'fr'], ['de_DE@euro', 'de'], ['  fr-DZ  ', 'fr'],
  ])('%s -> %s', (tag, expected) => {
    expect(languageFromLocaleTag(tag)).toBe(expected);
  });

  it.each(['ar', 'ar-DZ', 'pt', 'pt-BR', 'ja-JP', 'nl', 'xx', '', '   ', 'und'])('%j is not supported', tag => {
    expect(languageFromLocaleTag(tag)).toBeNull();
  });

  it.each([undefined, null, 42, {}, []])('a non-string (%p) is not supported', value => {
    expect(languageFromLocaleTag(value)).toBeNull();
  });
});

describe('the first supported language among several preferred languages (English when none)', () => {
  const {pickSupportedLanguage} = startApp();

  it.each([
    [['fr-FR'], 'fr'],
    [['ar-DZ', 'fr-DZ'], 'fr'], // Arabic first, French second -> French
    [['pt-BR', 'ar', 'de-AT', 'fr'], 'de'], // the first SUPPORTED one, in the phone's order
    [['ja', 'ko', 'es-MX'], 'es'],
    [['ar-DZ'], 'en'],
    [['pt-PT', 'ar', 'nl'], 'en'],
    [[], 'en'],
    [[null, 42, '', 'zh-Hans'], 'zh'],
    [['xx', 'yy'], 'en'],
  ])('%j -> %s', (tags, expected) => {
    expect(pickSupportedLanguage(tags)).toBe(expected);
  });
});

describe('first launch (nothing stored): AWA follows the phone', () => {
  it.each([
    ['fr-DZ', 'fr'], ['fr-FR', 'fr'], ['en-US', 'en'], ['en-GB', 'en'], ['es-ES', 'es'], ['it-IT', 'it'],
    ['tr-TR', 'tr'], ['ru-RU', 'ru'], ['de-DE', 'de'], ['zh-CN', 'zh'], ['zh-Hans', 'zh'],
  ])('device %s -> AWA %s, in system mode, nothing written to storage', async (tag, expected) => {
    mockDevice.tags = [tag];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe(expected);
    expect(prefs.getAppLanguagePreference()).toBe('system');
    expect(await AsyncStorage.getItem(KEY)).toBeNull(); // following the phone never stores a "choice"
  });

  it.each([
    [['ar-DZ'], 'Arabic'],
    [['pt-BR'], 'Portuguese'],
    [['ja-JP', 'ko-KR'], 'Japanese then Korean'],
    [[], 'an empty list'],
  ])('unsupported device language (%s: %s) -> English', async tags => {
    mockDevice.tags = tags;
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('en');
    expect(prefs.getAppLanguagePreference()).toBe('system');
  });

  it('uses a later preferred language when the first is unsupported (ar-DZ, then fr-DZ -> French)', async () => {
    mockDevice.tags = ['ar-DZ', 'fr-DZ'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');
  });

  it('a failure to read the device language means English, never French and never a crash', async () => {
    mockDevice.fail = true;
    const prefs = startApp();
    await expect(prefs.hydrateAppearancePreferences()).resolves.toBeUndefined();
    expect(prefs.getAppLanguage()).toBe('en');
    await expect(prefs.refreshSystemLanguage()).resolves.toBe(false);
    expect(prefs.getAppLanguage()).toBe('en');
  });

  it('the phone language is resolved BEFORE the hydration settles (the start-up gate awaits it)', async () => {
    mockDevice.tags = ['de-DE'];
    mockDevice.delayMs = 30;
    const prefs = startApp();
    expect(prefs.getAppLanguage()).toBe('en'); // the module default until hydrated
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('de'); // already right when the promise settles
  });
});

describe('start-up race: several callers of the hydration', () => {
  it('a caller that arrives while the phone language is still being read waits for it (no early, wrong-language start)', async () => {
    mockDevice.tags = ['de-DE'];
    mockDevice.delayMs = 60;
    const prefs = startApp();
    const first = prefs.hydrateAppearancePreferences(); // App.tsx's module-level call
    await new Promise(resolve => setTimeout(resolve, 25)); // storage has answered; the device read is still pending
    expect(prefs.getAppLanguage()).toBe('en');
    const second = prefs.hydrateAppearancePreferences(); // the start-up gate (initializeAppLanguage) arrives now
    let secondSettled = false;
    second.then(() => {
      secondSettled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(secondSettled).toBe(false); // it must NOT resolve before the language is known
    await second;
    expect(prefs.getAppLanguage()).toBe('de');
    await first;
  });

  it('a hung device-language read cannot hold the app on its boot placeholder', async () => {
    jest.useFakeTimers();
    try {
      mockDevice.tags = ['fr-FR'];
      mockDevice.delayMs = 60 * 60 * 1000; // effectively never
      const prefs = startApp();
      const hydration = prefs.hydrateAppearancePreferences();
      await jest.advanceTimersByTimeAsync(10_000);
      await hydration;
      expect(prefs.getAppLanguage()).toBe('en'); // gave up on the read: English, not a hang
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('following the phone while no language was chosen', () => {
  it('switches when the phone language changes, in both directions, and to English when it becomes unsupported', async () => {
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');

    mockDevice.tags = ['en-US'];
    await expect(prefs.refreshSystemLanguage()).resolves.toBe(true);
    expect(prefs.getAppLanguage()).toBe('en');

    mockDevice.tags = ['es-ES'];
    await prefs.refreshSystemLanguage();
    expect(prefs.getAppLanguage()).toBe('es');

    mockDevice.tags = ['ar-DZ'];
    await prefs.refreshSystemLanguage();
    expect(prefs.getAppLanguage()).toBe('en');
  });

  it('does not notify or change anything when the language is the same (no flicker)', async () => {
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    const listener = jest.fn();
    prefs.subscribeThemePreferences(listener);

    await expect(prefs.refreshSystemLanguage()).resolves.toBe(false);
    await expect(prefs.refreshSystemLanguage()).resolves.toBe(false);
    // a different regional variant of the same language is still the same language
    mockDevice.tags = ['fr-DZ'];
    await expect(prefs.refreshSystemLanguage()).resolves.toBe(false);
    expect(listener).not.toHaveBeenCalled();

    mockDevice.tags = ['it-IT'];
    await expect(prefs.refreshSystemLanguage()).resolves.toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('a manual choice always wins', () => {
  it('persists, survives a restart, and ignores the phone language (also when it changes)', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('de');
    expect(prefs.getAppLanguage()).toBe('de');
    expect(prefs.getAppLanguagePreference()).toBe('de');
    expect(await AsyncStorage.getItem(KEY)).toBe('de');

    // restart on a phone that is still French
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('de');
    expect(prefs.getAppLanguagePreference()).toBe('de');

    // the phone language changes (to Spanish, then to an unsupported one): AWA stays German
    mockDevice.tags = ['es-ES'];
    await prefs.refreshSystemLanguage();
    expect(prefs.getAppLanguage()).toBe('de');
    mockDevice.tags = ['ar'];
    await prefs.refreshSystemLanguage();
    expect(prefs.getAppLanguage()).toBe('de');

    // and after yet another restart
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('de');
  });

  it('a manually chosen English stays English on a French phone', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('en');
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('en');
    expect(prefs.getAppLanguagePreference()).toBe('en');
  });
});

describe('"System default": back to following the phone', () => {
  it('clears the manual choice, applies the phone language at once, keeps following it, and survives a restart', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('de');

    await prefs.setAppLanguagePreference('system');
    expect(prefs.getAppLanguagePreference()).toBe('system');
    expect(prefs.getAppLanguage()).toBe('fr'); // the phone's language, immediately
    expect(await AsyncStorage.getItem(KEY)).toBeNull();

    mockDevice.tags = ['tr-TR'];
    await prefs.refreshSystemLanguage();
    expect(prefs.getAppLanguage()).toBe('tr'); // follows again

    prefs = startApp(); // restart: still following the phone
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguagePreference()).toBe('system');
    expect(prefs.getAppLanguage()).toBe('tr');
  });

  it('uses English when the phone language is not supported', async () => {
    mockDevice.tags = ['pt-BR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('es');
    await prefs.setAppLanguagePreference('system');
    expect(prefs.getAppLanguage()).toBe('en');
  });

  it('tells the listeners even when the language itself does not change (the sheet shows "System default")', async () => {
    mockDevice.tags = ['en-US'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('en');
    const listener = jest.fn();
    prefs.subscribeThemePreferences(listener);
    await prefs.setAppLanguagePreference('system');
    expect(prefs.getAppLanguage()).toBe('en');
    expect(listener).toHaveBeenCalled();
    expect(prefs.getAppLanguagePreference()).toBe('system');
  });

  it('choosing a language through the preference setter is a manual choice like setAppLanguage', async () => {
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguagePreference('ru');
    expect(prefs.getAppLanguage()).toBe('ru');
    expect(await AsyncStorage.getItem(KEY)).toBe('ru');
  });
});

describe('existing installs: what was stored before this feature', () => {
  it.each(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh'])(
    'a stored %s was chosen in the language sheet (nothing else ever wrote it): it stays, whatever the phone says',
    async stored => {
      await AsyncStorage.setItem(KEY, stored);
      mockDevice.tags = ['ja-JP'];
      const prefs = startApp();
      await prefs.hydrateAppearancePreferences();
      expect(prefs.getAppLanguage()).toBe(stored);
      expect(prefs.getAppLanguagePreference()).toBe(stored);
      expect(await AsyncStorage.getItem(KEY)).toBe(stored); // untouched
    },
  );

  it('a stored Simplified Chinese alias is kept as the manual choice and rewritten under the canonical code', async () => {
    await AsyncStorage.setItem(KEY, 'zh-Hans');
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('zh');
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
    expect(await AsyncStorage.getItem(KEY)).toBe('zh');
  });

  it('an unreadable stored value is not a choice: AWA follows the phone', async () => {
    await AsyncStorage.setItem(KEY, 'klingon');
    mockDevice.tags = ['it-IT'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguagePreference()).toBe('system');
    expect(prefs.getAppLanguage()).toBe('it');
  });

  it('an install that never opened the language sheet (no stored value) now follows the phone', async () => {
    mockDevice.tags = ['es-ES'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('es');
    expect(prefs.getAppLanguagePreference()).toBe('system');
  });
});
