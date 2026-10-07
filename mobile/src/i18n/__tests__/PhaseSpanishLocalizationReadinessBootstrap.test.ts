import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../index';
import {getAppLanguage, resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Spanish localization readiness — PART 1: language bootstrap / hydration /
// persistence / runtime switching.
//
// themePreferences.ts is a module-singleton store (its `appLanguage`,
// `appearanceHydrated` and `appearanceHydration` flags live at module
// scope — see its own header comments), so a test that wants to exercise
// *cold hydration* from a specific (or empty/invalid) persisted AsyncStorage
// value needs its own isolated module instance, otherwise an earlier test's
// hydrate() call leaks into every later one. This mirrors the exact
// `jest.isolateModulesAsync` + `freshStore()` technique already established
// in src/state/__tests__/themePreferences.test.ts (which predates the
// Spanish ('es') language and only covers fr/en there) — extended here
// specifically for 'es' plus the invalid-value and restart-persistence cases
// named in this phase's test plan.
const LANGUAGE_STORAGE_KEY = '@awa/appearance/language-v1';

function freshStore() {
  return require('../../state/themePreferences') as typeof import('../../state/themePreferences');
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('TEST — Spanish-aware language bootstrap/hydration (cases 1-6)', () => {
  it('1. no saved preference -> hydrates to English (never French, never Spanish)', async () => {
    let result: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.hydrateAppearancePreferences();
      result = store.getAppLanguage();
    });
    expect(result).toBe('en');
  });

  it('2. a saved "fr" preference hydrates to French', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');

    let result: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.hydrateAppearancePreferences();
      result = store.getAppLanguage();
    });
    expect(result).toBe('fr');
  });

  it('3. a saved "en" preference hydrates to English', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    let result: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.hydrateAppearancePreferences();
      result = store.getAppLanguage();
    });
    expect(result).toBe('en');
  });

  it('4. a saved "es" preference hydrates to Spanish', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');

    let result: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await store.hydrateAppearancePreferences();
      result = store.getAppLanguage();
    });
    expect(result).toBe('es');
  });

  it('5. an invalid/corrupt stored value falls back to English, not French (and not Spanish)', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'xx-not-a-real-language');

    let result: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const store = freshStore();
      await expect(store.hydrateAppearancePreferences()).resolves.not.toThrow();
      result = store.getAppLanguage();
    });
    expect(result).toBe('en');
    expect(result).not.toBe('fr');
    expect(result).not.toBe('es');
  });

  it('6. an explicit Spanish selection persists and survives a simulated app restart (fresh module + fresh hydrate)', async () => {
    await jest.isolateModulesAsync(async () => {
      const firstSession = freshStore();
      await firstSession.setAppLanguage('es');
      expect(firstSession.getAppLanguage()).toBe('es');
    });

    // "Restart" = a brand-new module instance (appLanguage/appearanceHydrated
    // reset to their just-loaded defaults) reading from the SAME persisted
    // AsyncStorage the first session wrote to — exactly what a real app
    // relaunch looks like, nothing in AsyncStorage was cleared above.
    let restored: string | undefined;
    await jest.isolateModulesAsync(async () => {
      const secondSession = freshStore();
      await secondSession.hydrateAppearancePreferences();
      restored = secondSession.getAppLanguage();
    });
    expect(restored).toBe('es');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
  });
});

describe('TEST — runtime language switch chain EN -> ES -> FR -> EN (cases 7-9)', () => {
  // These use the real, shared i18n singleton (not an isolated module) —
  // the same i18next instance App.tsx initializes once for the whole app —
  // because the thing under test IS the live subscription wiring between
  // themePreferences.ts's setAppLanguage()/notify() and i18n/index.ts's
  // subscribeThemePreferences() listener. Both setAppLanguage() and
  // i18n.changeLanguage() are called explicitly at each step, matching the
  // existing convention in src/i18n/__tests__/notificationLocale.test.ts and
  // src/screens/__tests__/AppearanceScreen.test.tsx (the subscriber's own
  // i18n.changeLanguage() call is fire-and-forget/`.catch()`-wrapped, so
  // tests that assert on i18n.language drive it directly for determinism).
  beforeEach(async () => {
    await resetAppLanguageForTests();
    await i18n.changeLanguage('en');
  });

  afterAll(async () => {
    await resetAppLanguageForTests();
    await i18n.changeLanguage('en');
  });

  it('7. EN -> ES: both getAppLanguage() and i18n.language move to Spanish, no leftover English copy', async () => {
    expect(getAppLanguage()).toBe('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('appearance.headerTitle')).toBe('Appearance');

    await setAppLanguage('es');
    await i18n.changeLanguage('es');

    expect(getAppLanguage()).toBe('es');
    expect(i18n.language).toBe('es');
    expect(i18n.t('appearance.headerTitle')).toBe('Apariencia');
  });

  it('8. ES -> FR: both move to French, no leftover Spanish copy', async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    expect(getAppLanguage()).toBe('es');
    expect(i18n.t('appearance.headerTitle')).toBe('Apariencia');

    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');

    expect(getAppLanguage()).toBe('fr');
    expect(i18n.language).toBe('fr');
    expect(i18n.t('appearance.headerTitle')).toBe('Apparence');
  });

  it('9. FR -> EN: completes the chain back to English, no leftover French copy', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    expect(getAppLanguage()).toBe('fr');
    expect(i18n.t('appearance.headerTitle')).toBe('Apparence');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');

    expect(getAppLanguage()).toBe('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('appearance.headerTitle')).toBe('Appearance');
  });
});
