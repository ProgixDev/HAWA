import AsyncStorage from '@react-native-async-storage/async-storage';

// themePreferences.ts is a module-singleton store (hydrated/hydration flags
// live at module scope, exactly like profileAvatarPreferences.ts), so a
// test that wants to exercise hydration from a specific persisted (or
// empty) AsyncStorage state needs its own isolated module instance — reusing
// the same instance across tests would let the first hydrate() call's
// result leak into every later test. jest.isolateModules gives each test a
// fresh module registry; requiring the store inside it is the reliable way
// to simulate "a fresh app launch" per test.
const STORAGE_KEY = '@awa/appearance/theme-v1';

function freshStore() {
  return require('../themePreferences') as typeof import('../themePreferences');
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('getSelectedThemeId — default', () => {
  it('is "awa-original" before hydration and for a user with no saved preference', async () => {
    let result: string | undefined;
    jest.isolateModules(() => {
      const store = freshStore();
      result = store.getSelectedThemeId();
    });
    expect(result).toBe('awa-original');
  });
});

describe('hydrateThemePreferences', () => {
  it('restores a previously-persisted theme id', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'sage-serenity');

    let hydrated: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      hydrated = await store.hydrateThemePreferences();
    });

    expect(hydrated).toBe('sage-serenity');
  });

  it('ignores a corrupted/unknown persisted id and falls back to the default', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not-a-real-theme');

    let hydrated: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      hydrated = await store.hydrateThemePreferences();
    });

    expect(hydrated).toBe('awa-original');
  });

  it('is idempotent — a second call resolves without re-reading storage', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'ocean-calm');

    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      const first = await store.hydrateThemePreferences();
      const second = await store.hydrateThemePreferences();
      expect(first).toBe('ocean-calm');
      expect(second).toBe('ocean-calm');
    });
  });
});

describe('setSelectedThemeId', () => {
  it('updates the in-memory value immediately and persists it', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setSelectedThemeId('rose-quartz');
      expect(store.getSelectedThemeId()).toBe('rose-quartz');
    });

    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('rose-quartz');
  });

  it('selecting a new theme replaces the previous one — only one id can ever be current', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setSelectedThemeId('warm-sand');
      expect(store.getSelectedThemeId()).toBe('warm-sand');

      await store.setSelectedThemeId('midnight');
      expect(store.getSelectedThemeId()).toBe('midnight');
      expect(store.getSelectedThemeId()).not.toBe('warm-sand');
    });
  });

  it('notifies subscribers synchronously on change', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      const listener = jest.fn();
      const unsubscribe = store.subscribeThemePreferences(listener);

      await store.setSelectedThemeId('lavender-night');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      await store.setSelectedThemeId('awa-original');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});

describe('persistence survives a simulated app restart', () => {
  it('a selection made in one "session" is restored by hydration in a fresh one', async () => {
    await jest.isolateModulesAsync(async () => {
      const firstSession = freshStore();
      await firstSession.setSelectedThemeId('midnight');
    });

    let restored: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const secondSession = freshStore();
      restored = await secondSession.hydrateThemePreferences();
    });

    expect(restored).toBe('midnight');
  });
});

// Appearance MODE (Système/Clair/Sombre) and TRUE BLACK — deliberately
// separate settings from the palette above (AppearanceScreen.tsx's own
// architecture rule: "Rose Quartz + Système/Clair/Sombre" must all be valid
// independent combinations).
const MODE_STORAGE_KEY = '@awa/appearance/mode-v1';
const TRUE_BLACK_STORAGE_KEY = '@awa/appearance/true-black-v1';

describe('getAppearanceMode — default', () => {
  it('is "system" before hydration and for a user with no saved preference', () => {
    let result: string | undefined;
    jest.isolateModules(() => {
      result = freshStore().getAppearanceMode();
    });
    expect(result).toBe('system');
  });
});

describe('getTrueBlackEnabled — default', () => {
  it('is false before hydration and for a user with no saved preference', () => {
    let result: boolean | undefined;
    jest.isolateModules(() => {
      result = freshStore().getTrueBlackEnabled();
    });
    expect(result).toBe(false);
  });
});

describe('hydrateAppearancePreferences', () => {
  it('restores a previously-persisted mode and true-black flag together', async () => {
    await AsyncStorage.setItem(MODE_STORAGE_KEY, 'dark');
    await AsyncStorage.setItem(TRUE_BLACK_STORAGE_KEY, 'true');

    let mode: string | undefined;
    let trueBlack: boolean | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.hydrateAppearancePreferences();
      mode = store.getAppearanceMode();
      trueBlack = store.getTrueBlackEnabled();
    });

    expect(mode).toBe('dark');
    expect(trueBlack).toBe(true);
  });

  it('ignores a corrupted/unknown persisted mode and falls back to "system"', async () => {
    await AsyncStorage.setItem(MODE_STORAGE_KEY, 'not-a-real-mode');

    let mode: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.hydrateAppearancePreferences();
      mode = store.getAppearanceMode();
    });

    expect(mode).toBe('system');
  });

  it('selecting a Premium palette theme together with each mode remains a valid, independent combination', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setSelectedThemeId('rose-quartz');
      await store.setAppearanceMode('dark');
      expect(store.getSelectedThemeId()).toBe('rose-quartz');
      expect(store.getAppearanceMode()).toBe('dark');

      await store.setAppearanceMode('light');
      expect(store.getSelectedThemeId()).toBe('rose-quartz');
      expect(store.getAppearanceMode()).toBe('light');
    });
  });
});

describe('setAppearanceMode / setTrueBlackEnabled', () => {
  it('updates in-memory state immediately and persists it', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.setAppearanceMode('dark');
      expect(store.getAppearanceMode()).toBe('dark');

      await store.setTrueBlackEnabled(true);
      expect(store.getTrueBlackEnabled()).toBe(true);
    });

    expect(await AsyncStorage.getItem(MODE_STORAGE_KEY)).toBe('dark');
    expect(await AsyncStorage.getItem(TRUE_BLACK_STORAGE_KEY)).toBe('true');
  });

  it('notifies subscribers synchronously on mode change', async () => {
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      const listener = jest.fn();
      const unsubscribe = store.subscribeThemePreferences(listener);

      await store.setAppearanceMode('light');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      await store.setAppearanceMode('dark');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  it('persists mode/true-black independently of the selected palette — a restart restores all three', async () => {
    await jest.isolateModulesAsync(async () => {
      const firstSession = freshStore();
      await firstSession.setSelectedThemeId('ocean-calm');
      await firstSession.setAppearanceMode('dark');
      await firstSession.setTrueBlackEnabled(true);
    });

    let restoredTheme: string | undefined;
    let restoredMode: string | undefined;
    let restoredTrueBlack: boolean | undefined;
    await jest.isolateModulesAsync(async () => {
      const secondSession = freshStore();
      restoredTheme = await secondSession.hydrateThemePreferences();
      await secondSession.hydrateAppearancePreferences();
      restoredMode = secondSession.getAppearanceMode();
      restoredTrueBlack = secondSession.getTrueBlackEnabled();
    });

    expect(restoredTheme).toBe('ocean-calm');
    expect(restoredMode).toBe('dark');
    expect(restoredTrueBlack).toBe(true);
  });
});
