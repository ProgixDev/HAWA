import AsyncStorage from '@react-native-async-storage/async-storage';

// Italian integration — persistence of the app-language preference. Same
// jest.isolateModules technique as themePreferences.test.ts: the store is a
// module singleton, so each case needs its own module registry to simulate
// "a fresh app launch" with a specific persisted (or empty) AsyncStorage.
const LANGUAGE_KEY = '@awa/appearance/language-v1';

type Store = typeof import('../themePreferences');
const freshStore = () => require('../themePreferences') as Store;

async function languageAfterLaunch(): Promise<string> {
  let language = '';
  await jest.isolateModulesAsync(async () => {
    const store = freshStore();
    await store.hydrateAppearancePreferences();
    language = store.getAppLanguage();
  });
  return language;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('app language — fresh installation and saved values', () => {
  it('fresh installation (nothing saved) is English, before and after hydration', async () => {
    let before = '';
    await jest.isolateModulesAsync(async () => {
      before = freshStore().getAppLanguage();
    });
    expect(before).toBe('en');
    expect(await languageAfterLaunch()).toBe('en');
  });

  it.each([
    ['fr', 'fr'],
    ['en', 'en'],
    ['es', 'es'],
    ['it', 'it'],
  ])('saved "%s" restores %s', async (saved, expected) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, saved);
    expect(await languageAfterLaunch()).toBe(expected);
  });

  it.each(['de', 'IT', 'it-IT', 'ita', '', 'pseudo', 'null', '  it  '])(
    'invalid saved value %j falls back to English',
    async invalid => {
      await AsyncStorage.setItem(LANGUAGE_KEY, invalid);
      expect(await languageAfterLaunch()).toBe('en');
    },
  );
});

describe('app language — choosing Italian', () => {
  it('setAppLanguage("it") updates memory immediately and persists "it"', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setAppLanguage('it');
      expect(store.getAppLanguage()).toBe('it');
    });
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('it');
  });

  it('Italian survives a simulated app restart', async () => {
    await jest.isolateModulesAsync(async () => {
      await freshStore().setAppLanguage('it');
    });
    expect(await languageAfterLaunch()).toBe('it');
  });

  it('notifies subscribers (so i18next follows) when Italian is chosen', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      const listener = jest.fn();
      const unsubscribe = store.subscribeThemePreferences(listener);
      await store.setAppLanguage('it');
      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });

  it('switching Italian -> French -> Spanish -> English persists only the latest choice', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setAppLanguage('it');
      await store.setAppLanguage('fr');
      expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('fr');
      await store.setAppLanguage('es');
      expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('es');
      await store.setAppLanguage('en');
      expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe('en');
    });
  });

  it('an existing French/English/Spanish preference is never reset or rewritten by hydration', async () => {
    for (const saved of ['fr', 'en', 'es'] as const) {
      await AsyncStorage.setItem(LANGUAGE_KEY, saved);
      expect(await languageAfterLaunch()).toBe(saved);
      expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBe(saved);
    }
  });

  it('resetAppLanguageForTests returns to English and clears the persisted value', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setAppLanguage('it');
      await store.resetAppLanguageForTests();
      expect(store.getAppLanguage()).toBe('en');
    });
    expect(await AsyncStorage.getItem(LANGUAGE_KEY)).toBeNull();
  });
});
