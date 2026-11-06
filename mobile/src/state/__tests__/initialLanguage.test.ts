import AsyncStorage from '@react-native-async-storage/async-storage';

// The app language has two modes. AUTOMATIC (the default): AWA follows the phone — its preferred languages are read at every launch (and whenever
// the app returns to the foreground), the first supported one is used, English when none is. MANUAL: the language picked in Appearance is kept and
// the phone is never consulted. An install from before the modes (a stored language, no stored mode) is classified once: equal to what the phone
// resolves to -> automatic, different -> manual. The device's language list is mocked; storage is the shared in-memory mock, so a fresh module
// registry (jest.resetModules) models an app restart on the same stored data.

const mockDevice: {tags: unknown; fail: boolean; delayMs: number; reads: number} = {tags: ['en-US'], fail: false, delayMs: 0, reads: 0};

jest.mock('../../utils/deviceLanguage', () => ({
  readDeviceLocaleTags: jest.fn(async () => {
    mockDevice.reads += 1;
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
const MODE_KEY = '@awa/appearance/mode-v1';
const LANGUAGE_MODE_KEY = '@awa/appearance/language-mode-v1';
const TRUE_BLACK_KEY = '@awa/appearance/true-black-v1';
const THEME_KEY = '@awa/appearance/theme-v1';
const ALL_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR', 'bn', 'da'] as const;

/** A new app process: fresh module state, same stored data. */
function startApp(): Prefs {
  jest.resetModules();
  mockDevice.reads = 0;
  return require('../themePreferences') as Prefs;
}

beforeEach(async () => {
  mockDevice.tags = ['en-US'];
  mockDevice.fail = false;
  mockDevice.delayMs = 0;
  mockDevice.reads = 0;
  await AsyncStorage.clear();
});

describe('one device locale tag -> a supported language', () => {
  const {languageFromLocaleTag} = startApp();

  it.each([
    ['fr', 'fr'], ['fr-FR', 'fr'], ['fr-DZ', 'fr'], ['fr_DZ', 'fr'], ['FR-dz', 'fr'],
    ['en', 'en'], ['en-US', 'en-US'], ['en-GB', 'en'], ['en_US', 'en-US'], ['en-AU', 'en'], ['en-US-u-ca-gregory', 'en-US'],
    ['es', 'es'], ['es-ES', 'es'], ['es-419', 'es'],
    ['it-IT', 'it'], ['it', 'it'],
    ['tr-TR', 'tr'], ['tr', 'tr'],
    ['ru-RU', 'ru'], ['ru', 'ru'],
    ['de-DE', 'de'], ['de-AT', 'de'], ['de', 'de'],
    ['zh', 'zh'], ['zh-CN', 'zh'], ['zh-Hans', 'zh'], ['zh-Hans-CN', 'zh'], ['zh_CN', 'zh'], ['zh-SG', 'zh'], ['zh-TW', 'zh-Hant'], ['zh-Hant-HK', 'zh-Hant'], ['zh-HK', 'zh-Hant'], ['zh-MO', 'zh-Hant'], ['zh-Hant', 'zh-Hant'], ['zh_TW', 'zh-Hant'], ['zh-Hant-CN', 'zh-Hant'], ['zh-Hans-TW', 'zh'],
    ['id', 'id'], ['id-ID', 'id'], ['id_ID', 'id'], ['in', 'id'], ['in-ID', 'id'],
    ['sq', 'sq'], ['sq-AL', 'sq'], ['sq_AL', 'sq'], ['SQ-al', 'sq'], ['sq-XK', 'sq'], ['sq-MK', 'sq'], ['sq-Latn-AL', 'sq'], ['sq-AL.UTF-8', 'sq'],
    ['ja', 'ja'], ['ja-JP', 'ja'], ['ja_JP', 'ja'], ['JA-jp', 'ja'], ['ja-JP-u-ca-japanese', 'ja'], ['ja-Jpan-JP', 'ja'], ['ja-JP.UTF-8', 'ja'],
    ['ko', 'ko'], ['ko-KR', 'ko'], ['ko_KR', 'ko'], ['KO-kr', 'ko'], ['ko-KR.UTF-8', 'ko'], ['ko-Kore-KR', 'ko'], ['ko-KP', 'ko'], ['ko-KR-u-ca-dangi', 'ko'],
    ['ms', 'ms'], ['ms-MY', 'ms'], ['ms_MY', 'ms'], ['so-SO', 'so'], ['sw-KE', 'sw'], ['kk-KZ', 'kk'], ['wo-SN', 'wo'], ['ha-NG', 'ha'], ['am-ET', 'am'],  // the seven languages added for the 48-language release
    ['pt', 'pt-PT'], ['pt-PT', 'pt-PT'], ['pt_PT', 'pt-PT'], ['PT-pt', 'pt-PT'], ['pt-AO', 'pt-PT'], ['pt-MZ', 'pt-PT'], ['pt-CV', 'pt-PT'], ['pt-Latn-PT', 'pt-PT'], ['pt-PT.UTF-8', 'pt-PT'],
    ['pt-BR', 'pt-BR'], ['pt_BR', 'pt-BR'], ['PT-br', 'pt-BR'], ['pt-Latn-BR', 'pt-BR'], ['pt-BR.UTF-8', 'pt-BR'], ['pt-BR-u-nu-latn', 'pt-BR'],
    ['hi', 'hi'], ['hi-IN', 'hi'], ['hi_IN', 'hi'], ['HI-in', 'hi'], ['hi-Deva', 'hi'], ['hi-Deva-IN', 'hi'], ['hi-IN.UTF-8', 'hi'], ['  hi-IN  ', 'hi'],
    ['bn', 'bn'], ['bn-BD', 'bn'], ['bn-IN', 'bn'], ['bn_BD', 'bn'], ['bn_IN', 'bn'], ['BN-bd', 'bn'], ['bn-Beng', 'bn'], ['bn-Beng-BD', 'bn'], ['bn-Beng-IN', 'bn'], ['bn-BD.UTF-8', 'bn'], ['bn-IN-u-nu-beng', 'bn'], ['  bn-BD  ', 'bn'],
    ['fr-FR.UTF-8', 'fr'], ['de_DE@euro', 'de'], ['  fr-DZ  ', 'fr'],
  ])('%s -> %s', (tag, expected) => {
    expect(languageFromLocaleTag(tag)).toBe(expected);
  });

  it.each(['fa', 'fa-IR', 'af', 'af-ZA', 'xx', '', '   ', 'und', 'hi-Latn', 'hi-Latn-IN', 'hi_Latn', 'bn-Latn', 'bn_Latn_BD', 'as', 'as-IN'])('%j is not supported', tag => {
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
    [['fa-IR', 'fr-DZ'], 'fr'], // Persian first, French second -> French
    [['fa', 'af', 'de-AT', 'fr'], 'de'], // the first SUPPORTED one, in the phone's order
    [['pt-BR', 'fa', 'de-AT', 'fr'], 'pt-BR'], // Portuguese is supported, and Brazil is not mapped to Portugal
    [['pt-PT', 'pt-BR'], 'pt-PT'],
    [['fa', 'pt'], 'pt-PT'], // a bare 'pt' is Portugal (the base text), never silently Brazil
    [['bn-BD', 'af', 'es-MX'], 'bn'],
    [['af', 'es-MX', 'bn-IN'], 'es'],
    [['as-IN', 'bn_IN', 'hi-IN'], 'bn'], // Assamese is not Bengali: skipped, the next supported one wins
    [['ko', 'af', 'es-MX'], 'ko'],
    [['af', 'es-MX', 'ko-KR'], 'es'],
    [['ko', 'ja-JP', 'es-MX'], 'ko'], // Korean is supported: the first SUPPORTED one wins
    [['af', 'ja-JP', 'ko-KR'], 'ja'],
    [['fa-IR'], 'en'],
    [['af', 'fa', 'xx'], 'en'],
    [['th-TH', 'fr'], 'th'], // Thai and Vietnamese are supported languages
    [['vi-VN'], 'vi'],
    [[], 'en'],
    [[null, 42, '', 'zh-Hans'], 'zh'],
    [['xx', 'yy'], 'en'],
  ])('%j -> %s', (tags, expected) => {
    expect(pickSupportedLanguage(tags)).toBe(expected);
  });
});

describe('first launch (nothing stored): the phone language is resolved once and stored as the app language', () => {
  it.each([
    ['fr-DZ', 'fr'], ['fr-FR', 'fr'], ['en-US', 'en-US'], ['en-GB', 'en'], ['zh-TW', 'zh-Hant'], ['es-ES', 'es'], ['it-IT', 'it'],
    ['tr-TR', 'tr'], ['ru-RU', 'ru'], ['de-DE', 'de'], ['zh-CN', 'zh'], ['zh-Hans', 'zh'], ['id-ID', 'id'], ['in-ID', 'id'],
  ])('device %s -> AWA %s, stored', async (tag, expected) => {
    mockDevice.tags = [tag];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe(expected);
    expect(await AsyncStorage.getItem(KEY)).toBe(expected); // the resolved language IS the stored language now
    expect(mockDevice.reads).toBe(1);
  });

  it.each([
    [['fa-IR'], 'Persian'],
    [['af-ZA'], 'Afrikaans'],
    [['af-ZA', 'xx-XX'], 'Afrikaans then an unknown language'],
    [[], 'an empty list'],
  ])('an unsupported device language (%j: %s) -> English, stored', async tags => {
    mockDevice.tags = tags;
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('en');
    expect(await AsyncStorage.getItem(KEY)).toBe('en');
  });

  it.each([[['hi-IN'], 'hi'], [['hi'], 'hi'], [['hi-IN', 'en-US'], 'hi'], [['en-IN', 'hi-IN'], 'en'], [['fa', 'hi-IN'], 'hi'], [['hi-Latn-IN', 'hi-IN'], 'hi'], [['hi-Latn-IN'], 'en']])(
    'a Hindi phone (%j) starts AWA in %s on its first launch, stores it and reads the phone once',
    async (tags, expected) => {
      mockDevice.tags = tags;
      const app = startApp();
      await app.hydrateAppearancePreferences();
      expect(app.getAppLanguage()).toBe(expected);
      expect(await AsyncStorage.getItem(KEY)).toBe(expected);
      expect(mockDevice.reads).toBe(1);
    },
  );

  it.each([[['ja-JP'], 'ja'], [['ja'], 'ja'], [['ja-JP', 'en-US'], 'ja'], [['en-JP', 'ja-JP'], 'en'], [['ko-KR', 'ja-JP'], 'ko'], [['ja-JP-u-ca-japanese'], 'ja'], [['ja_JP'], 'ja'], [['ja-Jpan-JP'], 'ja']])(
    'a Japanese phone (%j) starts AWA in %s on its first launch, stores it and reads the phone once',
    async (tags, expected) => {
      mockDevice.tags = tags;
      const app = startApp();
      await app.hydrateAppearancePreferences();
      expect(app.getAppLanguage()).toBe(expected);
      expect(await AsyncStorage.getItem(KEY)).toBe(expected);
      expect(mockDevice.reads).toBe(1);
    },
  );

  it('an automatic Japanese language follows a later phone-language change at the next launch', async () => {
    mockDevice.tags = ['ja-JP'];
    let app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('ja');
    expect(app.getAppLanguageMode()).toBe('auto');
    mockDevice.tags = ['fr-FR'];
    app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('fr');
    expect(mockDevice.reads).toBe(1); // read again at the launch
  });

  it('an explicit (manual) language is never replaced by a Japanese phone', async () => {
    await AsyncStorage.setItem(KEY, 'de');
    await AsyncStorage.setItem(LANGUAGE_MODE_KEY, 'manual');
    mockDevice.tags = ['ja-JP'];
    const app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('de');
    expect(mockDevice.reads).toBe(0);
  });

  it.each([[['bn-BD'], 'bn'], [['bn'], 'bn'], [['bn-IN'], 'bn'], [['bn_BD'], 'bn'], [['bn_IN'], 'bn'], [['bn-BD', 'en-US'], 'bn'], [['en-BD', 'bn-BD'], 'en'], [['as-IN', 'bn-IN'], 'bn'], [['bn-Latn'], 'en'], [['bn-Beng-BD'], 'bn']])(
    'a Bengali phone (%j) starts AWA in %s on its first launch, stores it and reads the phone once',
    async (tags, expected) => {
      mockDevice.tags = tags;
      const app = startApp();
      await app.hydrateAppearancePreferences();
      expect(app.getAppLanguage()).toBe(expected);
      expect(await AsyncStorage.getItem(KEY)).toBe(expected);
      expect(mockDevice.reads).toBe(1);
    },
  );

  it('a Bengali automatic language follows the phone; a manual choice is then kept', async () => {
    mockDevice.tags = ['bn-BD'];
    let app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('bn');
    mockDevice.tags = ['fr-FR'];
    app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('fr');
    await app.setAppLanguage('bn');
    mockDevice.tags = ['es-ES'];
    app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('bn'); // manual: the phone no longer matters
    expect(mockDevice.reads).toBe(0);
  });

  it('an explicit language is never replaced by a Bengali phone, and a stored bn is read back as bn', async () => {
    await AsyncStorage.setItem(KEY, 'de');
    await AsyncStorage.setItem(LANGUAGE_MODE_KEY, 'manual');
    mockDevice.tags = ['bn-BD'];
    let app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('de');
    expect(mockDevice.reads).toBe(0);
    await AsyncStorage.setItem(KEY, 'bn');
    mockDevice.tags = ['fr-FR'];
    app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('bn');
    for (const stored of ['bn-BD', 'bn_IN', 'bn-IN']) {
      expect([stored, app.normalizeAppLanguage(stored)]).toEqual([stored, 'bn']);
    }
  });

  it('an automatic Hindi language follows a later phone-language change', async () => {
    mockDevice.tags = ['hi-IN'];
    let app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('hi');
    mockDevice.tags = ['fr-FR'];
    app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('fr');
  });

  it('an explicit (manual) language is never replaced by a Hindi phone', async () => {
    await AsyncStorage.setItem(KEY, 'de');
    await AsyncStorage.setItem(LANGUAGE_MODE_KEY, 'manual');
    mockDevice.tags = ['hi-IN'];
    const app = startApp();
    await app.hydrateAppearancePreferences();
    expect(app.getAppLanguage()).toBe('de');
    expect(mockDevice.reads).toBe(0);
  });

  it('uses a later preferred language when the first is unsupported (ar-DZ, then fr-DZ -> French)', async () => {
    mockDevice.tags = ['fa-IR', 'fr-DZ'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');
    expect(await AsyncStorage.getItem(KEY)).toBe('fr');
  });

  it('the phone language is resolved BEFORE the hydration settles (the start-up gate awaits it)', async () => {
    mockDevice.tags = ['de-DE'];
    mockDevice.delayMs = 30;
    const prefs = startApp();
    expect(prefs.getAppLanguage()).toBe('en'); // the module default until hydrated
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('de'); // already right when the promise settles
  });

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
    expect(mockDevice.reads).toBe(1); // both callers share ONE read
  });
});

describe('a phone language that cannot be read is not frozen as the app language', () => {
  it('a failing read means English for this session, nothing stored — and the next launch detects again', async () => {
    mockDevice.fail = true;
    let prefs = startApp();
    await expect(prefs.hydrateAppearancePreferences()).resolves.toBeUndefined();
    expect(prefs.getAppLanguage()).toBe('en'); // never French, never a crash
    expect(await AsyncStorage.getItem(KEY)).toBeNull();

    mockDevice.fail = false;
    mockDevice.tags = ['fr-FR'];
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');
    expect(await AsyncStorage.getItem(KEY)).toBe('fr');
  });

  it('a hung read cannot hold the app on its boot placeholder: English, nothing stored', async () => {
    jest.useFakeTimers();
    try {
      mockDevice.tags = ['fr-FR'];
      mockDevice.delayMs = 60 * 60 * 1000; // effectively never
      const prefs = startApp();
      const hydration = prefs.hydrateAppearancePreferences();
      await jest.advanceTimersByTimeAsync(10_000);
      await hydration;
      expect(prefs.getAppLanguage()).toBe('en');
      expect(await AsyncStorage.getItem(KEY)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('the automatic mode follows the phone', () => {
  it('the phone is read again at every launch', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(mockDevice.reads).toBe(1);

    prefs = startApp(); // restart
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');
    expect(mockDevice.reads).toBe(1);
  });

  it('changing the phone language (to another supported one, then to an unsupported one) is followed at the next launch', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');

    for (const [tags, expected] of [[['en-US'], 'en-US'], [['es-ES'], 'es'], [['ar-DZ'], 'ar'], [['fa-IR'], 'en'], [['zh-CN'], 'zh'], [['pt-BR'], 'pt-BR']] as const) {
      mockDevice.tags = [...tags];
      prefs = startApp(); // every launch after the phone was switched
      await prefs.hydrateAppearancePreferences();
      expect(prefs.getAppLanguage()).toBe(expected);
      expect(await AsyncStorage.getItem(KEY)).toBe(expected); // the cache follows
    }
  });

  it('while the app stays open, refreshAppLanguageFromDevice applies a phone-language change once, and tells the listeners once', async () => {
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    const listener = jest.fn();
    prefs.subscribeThemePreferences(listener);

    expect(await prefs.refreshAppLanguageFromDevice()).toBe(false); // nothing changed: no notification
    expect(listener).not.toHaveBeenCalled();

    mockDevice.tags = ['en-GB'];
    expect(await prefs.refreshAppLanguageFromDevice()).toBe(true);
    expect(prefs.getAppLanguage()).toBe('en');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(await prefs.refreshAppLanguageFromDevice()).toBe(false);
  });

  it('a phone that cannot be read leaves the language as it is', async () => {
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    mockDevice.fail = true;
    expect(await prefs.refreshAppLanguageFromDevice()).toBe(false);
    expect(prefs.getAppLanguage()).toBe('fr');
  });

  it('an unsupported regional variant resolves to the supported base language, and an unsupported language to English', async () => {
    mockDevice.tags = ['fr-CH'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');
    mockDevice.tags = ['af-ZA'];
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('en');
  });

  it('exports the mode API', () => {
    const prefs = startApp() as Record<string, unknown>;
    for (const name of ['getAppLanguageMode', 'setAppLanguageAuto', 'refreshAppLanguageFromDevice']) {
      expect(typeof prefs[name]).toBe('function');
    }
  });
});

describe('a manual choice', () => {
  it('is stored, survives restarts, and is not affected by the phone language (also when it changes)', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('de');
    expect(prefs.getAppLanguage()).toBe('de');
    expect(await AsyncStorage.getItem(KEY)).toBe('de');

    // restart on a phone that is still French
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('de');

    // the phone language changes (to Spanish, then to an unsupported one): AWA stays German
    for (const tags of [['es-ES'], ['fa']]) {
      mockDevice.tags = tags;
      prefs = startApp();
      await prefs.hydrateAppearancePreferences();
      expect(prefs.getAppLanguage()).toBe('de');
      expect(await AsyncStorage.getItem(KEY)).toBe('de');
    }
  });

  it.each(ALL_LANGUAGES)('choosing %s replaces the language resolved at the first launch', async language => {
    mockDevice.tags = ['af-ZA']; // first launch: English
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(await AsyncStorage.getItem(KEY)).toBe('en');

    await prefs.setAppLanguage(language);
    expect(prefs.getAppLanguage()).toBe(language);
    expect(await AsyncStorage.getItem(KEY)).toBe(language);
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe(language);
  });

  it('tells the listeners, once per change', async () => {
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    const listener = jest.fn();
    prefs.subscribeThemePreferences(listener);
    await prefs.setAppLanguage('ru');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('chosen while the first-launch detection is still being read, it is not overwritten by the detection', async () => {
    mockDevice.tags = ['de-DE'];
    mockDevice.delayMs = 40;
    const prefs = startApp();
    const hydration = prefs.hydrateAppearancePreferences();
    await new Promise(resolve => setTimeout(resolve, 15)); // the phone read is pending
    await prefs.setAppLanguage('ru');
    await hydration;
    expect(prefs.getAppLanguage()).toBe('ru');
    expect(await AsyncStorage.getItem(KEY)).toBe('ru'); // not 'de'
  });
});

describe('manual and automatic modes together', () => {
  it('a manual Spanish stays Spanish when the phone changes to French (also relaunched, also refreshed while open)', async () => {
    mockDevice.tags = ['en-GB'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('es');
    expect(prefs.getAppLanguageMode()).toBe('manual');
    mockDevice.tags = ['fr-FR'];
    expect(await prefs.refreshAppLanguageFromDevice()).toBe(false);
    expect(prefs.getAppLanguage()).toBe('es');
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('es');
    expect(prefs.getAppLanguageMode()).toBe('manual');
    expect(mockDevice.reads).toBe(0);
  });

  it('going back to Automatique follows the current phone language, and keeps following it', async () => {
    mockDevice.tags = ['en-GB'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    await prefs.setAppLanguage('es');
    mockDevice.tags = ['fr-FR'];
    await prefs.setAppLanguageAuto();
    expect(prefs.getAppLanguageMode()).toBe('auto');
    expect(prefs.getAppLanguage()).toBe('fr');
    expect(await AsyncStorage.getItem(LANGUAGE_MODE_KEY)).toBe('auto');

    mockDevice.tags = ['it-IT'];
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('it');
    expect(prefs.getAppLanguageMode()).toBe('auto');
  });

  it('a detected language is not mistaken for a manual choice: an automatic install never becomes manual by itself', async () => {
    mockDevice.tags = ['fr-FR'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(await AsyncStorage.getItem(LANGUAGE_MODE_KEY)).toBe('auto');
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguageMode()).toBe('auto');
  });
});

describe('existing installs: what was stored before', () => {
  it.each(ALL_LANGUAGES)('a stored %s (no mode yet) stays as it is at the update: kept as a choice, or automatic when it is the phone language', async stored => {
    await AsyncStorage.setItem(KEY, stored);
    mockDevice.tags = ['ja-JP'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe(stored);
    expect(mockDevice.reads).toBe(1);
    expect(await AsyncStorage.getItem(KEY)).toBe(stored);
    expect(prefs.getAppLanguageMode()).toBe(stored === 'ja' ? 'auto' : 'manual');
  });

  it('a stored Simplified Chinese alias is kept as her language and rewritten under the canonical code', async () => {
    await AsyncStorage.setItem(KEY, 'zh-Hans');
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('zh');
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
    expect(await AsyncStorage.getItem(KEY)).toBe('zh');
    expect(prefs.getAppLanguageMode()).toBe('manual'); // different from the French phone: a choice
  });

  it('an install left on the removed "System default" option has no stored value: it follows the phone, now and later', async () => {
    mockDevice.tags = ['es-ES'];
    let prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('es');
    expect(await AsyncStorage.getItem(KEY)).toBe('es');

    mockDevice.tags = ['it-IT']; // the phone is switched later: automatic mode follows it
    prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('it');
  });

  it.each(['system', 'System', 'klingon', '', ' '])('a stored %j is not a language: it is replaced by the language the phone resolves to', async legacy => {
    await AsyncStorage.setItem(KEY, legacy);
    mockDevice.tags = ['it-IT'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('it');
    expect(await AsyncStorage.getItem(KEY)).toBe('it');
  });

  it('a legacy "system" marker on an unsupported phone language migrates to English', async () => {
    await AsyncStorage.setItem(KEY, 'system');
    mockDevice.tags = ['fa-IR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('en');
    expect(await AsyncStorage.getItem(KEY)).toBe('en');
  });

  it('the migration touches nothing else: theme, appearance mode and true black stay as they were', async () => {
    await AsyncStorage.setItem(THEME_KEY, 'rose-quartz');
    await AsyncStorage.setItem(MODE_KEY, 'dark');
    await AsyncStorage.setItem(TRUE_BLACK_KEY, 'true');
    await AsyncStorage.setItem(KEY, 'system');
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    expect(prefs.getAppLanguage()).toBe('fr');
    expect(prefs.getAppearanceMode()).toBe('dark');
    expect(prefs.getTrueBlackEnabled()).toBe(true);
    expect(await AsyncStorage.getItem(THEME_KEY)).toBe('rose-quartz');
    expect(await AsyncStorage.getItem(MODE_KEY)).toBe('dark');
    expect(await AsyncStorage.getItem(TRUE_BLACK_KEY)).toBe('true');
  });

  it('the first launch writes only the language and its mode', async () => {
    mockDevice.tags = ['fr-FR'];
    const prefs = startApp();
    await prefs.hydrateAppearancePreferences();
    const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith('@awa/appearance/')).sort();
    expect(keys).toEqual([KEY, LANGUAGE_MODE_KEY].sort());
  });
});
