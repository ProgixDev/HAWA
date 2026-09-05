import AsyncStorage from '@react-native-async-storage/async-storage';

import {DEFAULT_AWA_THEME_ID, isValidAwaThemeId, type AwaThemeId} from '../config/awaThemes';

// Persists ONLY the selected theme's stable id — never a whole theme object
// — so the registry in awaThemes.ts stays the single source of truth for
// every other token. Same module-singleton + AsyncStorage + hydrate/
// get/set/subscribe shape used throughout src/state/ (e.g.
// profileAvatarPreferences.ts).
//
// SCOPE: this store currently backs ONLY AppearanceScreen's own selection
// UI (see awaThemes.ts's header comment) — no other screen reads
// getSelectedThemeId() yet, so selecting a theme here has no visible effect
// anywhere else in the app today.
const STORAGE_KEY = '@awa/appearance/theme-v1';

let selectedThemeId: AwaThemeId = DEFAULT_AWA_THEME_ID;
let hydrated = false;
let hydration: Promise<AwaThemeId> | null = null;
const listeners = new Set<() => void>();
const notify = (): void => listeners.forEach(listener => listener());

export function getSelectedThemeId(): AwaThemeId {
  return selectedThemeId;
}

export function hydrateThemePreferences(): Promise<AwaThemeId> {
  if (hydrated) {
    return Promise.resolve(selectedThemeId);
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw && isValidAwaThemeId(raw)) {
          selectedThemeId = raw;
          notify();
        }
        return selectedThemeId;
      })
      .catch(() => {
        hydrated = true;
        return selectedThemeId;
      });
  }
  return hydration;
}

export function subscribeThemePreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function setSelectedThemeId(id: AwaThemeId): Promise<void> {
  selectedThemeId = id;
  notify();
  await AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
}

// Appearance MODE (Système/Clair/Sombre) and TRUE BLACK are deliberately
// separate settings from the palette above — see AppearanceScreen.tsx:
// "Rose Quartz + Système", "Rose Quartz + Sombre", etc. must all be valid
// combinations. Kept in this same file/module (not a second store) since
// they're the same "Appearance" concern, each with its own tiny persisted
// key — same raw-value convention as selectedThemeId above and as
// securityPreferences.ts's pinEnabled/biometricEnabled flags.
export type AwaAppearanceMode = 'system' | 'light' | 'dark';

const MODE_STORAGE_KEY = '@awa/appearance/mode-v1';
const TRUE_BLACK_STORAGE_KEY = '@awa/appearance/true-black-v1';

const isValidAppearanceMode = (value: unknown): value is AwaAppearanceMode =>
  value === 'system' || value === 'light' || value === 'dark';

let appearanceMode: AwaAppearanceMode = 'system';
let trueBlackEnabled = false;
let appearanceHydrated = false;
let appearanceHydration: Promise<void> | null = null;

export function getAppearanceMode(): AwaAppearanceMode {
  return appearanceMode;
}

export function getTrueBlackEnabled(): boolean {
  return trueBlackEnabled;
}

export function hydrateAppearancePreferences(): Promise<void> {
  if (appearanceHydrated) {
    return Promise.resolve();
  }
  if (!appearanceHydration) {
    appearanceHydration = Promise.all([
      AsyncStorage.getItem(MODE_STORAGE_KEY),
      AsyncStorage.getItem(TRUE_BLACK_STORAGE_KEY),
    ])
      .then(([storedMode, storedTrueBlack]) => {
        appearanceHydrated = true;
        if (isValidAppearanceMode(storedMode)) {
          appearanceMode = storedMode;
        }
        trueBlackEnabled = storedTrueBlack === 'true';
        notify();
      })
      .catch(() => {
        appearanceHydrated = true;
      });
  }
  return appearanceHydration;
}

export async function setAppearanceMode(mode: AwaAppearanceMode): Promise<void> {
  appearanceMode = mode;
  notify();
  await AsyncStorage.setItem(MODE_STORAGE_KEY, mode).catch(() => {});
}

export async function setTrueBlackEnabled(enabled: boolean): Promise<void> {
  trueBlackEnabled = enabled;
  notify();
  await AsyncStorage.setItem(TRUE_BLACK_STORAGE_KEY, enabled ? 'true' : 'false').catch(() => {});
}
