import AsyncStorage from '@react-native-async-storage/async-storage';

import {DEFAULT_AWA_THEME_ID, isValidAwaThemeId, type AwaThemeId} from '../config/awaThemes';
import {readDeviceLocaleTags} from '../utils/deviceLanguage';

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

// App-wide UI language ("Langue de l'application", Appearance → Affichage).
// Deliberately NOT profile-scoped (see onboardingPreferences.ts's profile-
// scoped cyclePreferences for contrast) — one global preference for the whole
// app/device, unaffected by owner/managed-daughter profile switching. Only
// selects a language for now; the actual string translation is a separate,
// later i18n migration (this store/UI does not translate anything yet).
export type AwaAppLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr' | 'ru' | 'de' | 'zh' | 'id';

const LANGUAGE_STORAGE_KEY = '@awa/appearance/language-v1';
// SYSTEM LANGUAGE: English is the FALLBACK of the automatic detection (an unsupported or unreadable phone language), not
// the default of a fresh install any more — see manualLanguage / systemLanguage below: with no stored choice AWA follows the
// phone's language. The paragraph below is the earlier (PHASE 7M) rule and still describes what a stored value does.
// PHASE 7M: English is now AWA's default/fallback language — a brand-new
// install, or any install with no (or an invalid) persisted value, must land
// on English, never French. French remains fully supported: an explicitly
// persisted 'fr' value (set via the Appearance language sheet) always wins —
// see isValidAppLanguage()'s hydration check below, which only ever
// overwrites this default with a persisted 'fr', 'en', 'es', 'it', 'tr', 'ru', 'de' or 'zh' (Simplified Chinese,
// zh-CN; the code is the bare language 'zh', the Intl locale is 'zh-CN'), never
// anything else. Spanish ('es'), Italian ('it'), Turkish ('tr'), Russian ('ru') and German ('de') were added later,
// following this exact same pattern.
const DEFAULT_APP_LANGUAGE: AwaAppLanguage = 'en';

const isValidAppLanguage = (value: unknown): value is AwaAppLanguage =>
  value === 'fr' || value === 'en' || value === 'es' || value === 'it' || value === 'tr' || value === 'ru' || value === 'de' || value === 'zh' || value === 'id';

/** Simplified Chinese compatibility aliases (any case, '-' or '_'): zh-CN, zh-Hans, zh-Hans-CN. Only Chinese has
 * aliases; every other language still needs its exact code. */
const ZH_ALIASES = new Set(['zh', 'zh-cn', 'zh-hans', 'zh-hans-cn', 'zh-sg', 'zh-hans-sg']);

/** Indonesian ('id', Bahasa Indonesia) aliases: id-ID, and the legacy Java/Android code 'in' (in, in-ID, in_ID). */
const ID_ALIASES = new Set(['id-id', 'in', 'in-id']);

/** The canonical stored language for a persisted/typed value, or null when it is not a supported language. */
export function normalizeAppLanguage(value: unknown): AwaAppLanguage | null {
  if (isValidAppLanguage(value)) {
    return value;
  }
  if (typeof value === 'string' && ZH_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'zh';
  }
  if (typeof value === 'string' && ID_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'id';
  }
  return null;
}

/** The language preference: one of the supported languages (a manual choice) or 'system' (follow the phone). */
export type AwaLanguagePreference = AwaAppLanguage | 'system';

/**
 * The supported language for ONE device locale tag ("fr-DZ", "fr_DZ", "FR", "zh-Hans-CN", "zh_TW" ...), or null.
 * Reuses normalizeAppLanguage (exact codes + the Simplified Chinese aliases), then retries with the bare language so every
 * regional variant maps to its language. Every Chinese locale maps to 'zh' (AWA has one Chinese translation, Simplified).
 */
export function languageFromLocaleTag(tag: unknown): AwaAppLanguage | null {
  if (typeof tag !== 'string') {
    return null;
  }
  const cleaned = tag.trim().split(/[.@]/)[0].replace(/_/g, '-').toLowerCase();
  if (!cleaned) {
    return null;
  }
  return normalizeAppLanguage(cleaned) ?? normalizeAppLanguage(cleaned.split('-')[0]);
}

/** The first supported language among the device's preferred locales (most preferred first); English when none is supported. */
export function pickSupportedLanguage(tags: readonly unknown[]): AwaAppLanguage {
  for (const tag of tags) {
    const language = languageFromLocaleTag(tag);
    if (language) {
      return language;
    }
  }
  return DEFAULT_APP_LANGUAGE;
}

// The language in force is `manualLanguage ?? systemLanguage`:
//  - manualLanguage: the language the user picked in the Appearance language sheet. It is the ONLY thing persisted under
//    LANGUAGE_STORAGE_KEY, and only that sheet ever writes it, so a stored value always means "chosen by the user" (that is
//    how installs from before the "System default" option are migrated: a stored value stays a manual choice, no stored
//    value follows the phone). 'System default' removes the key.
//  - systemLanguage: what the phone's language list resolves to right now (re-read at start-up and whenever the app comes
//    back to the foreground). English when no preferred language is supported or the list cannot be read.
let manualLanguage: AwaAppLanguage | null = null;
let systemLanguage: AwaAppLanguage = DEFAULT_APP_LANGUAGE;
let appLanguage: AwaAppLanguage = DEFAULT_APP_LANGUAGE;

// The phone's language is read through a native call. It answers in a few milliseconds, but the start-up gate waits for it,
// so a call that never settled would keep the app on its boot placeholder forever: it is abandoned after this long.
const DEVICE_LANGUAGE_TIMEOUT_MS = 2000;

/** The supported language the phone's list resolves to, or null when the list could not be read in time (unknown, not 'unsupported'). */
async function detectSystemLanguage(): Promise<AwaAppLanguage | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const tags = await Promise.race([
      readDeviceLocaleTags(),
      new Promise<null>(resolve => {
        timer = setTimeout(() => resolve(null), DEVICE_LANGUAGE_TIMEOUT_MS);
      }),
    ]);
    return tags === null ? null : pickSupportedLanguage(tags);
  } catch {
    return null;
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/** Recomputes the language in force; true when it changed. */
function recomputeAppLanguage(): boolean {
  const next = manualLanguage ?? systemLanguage;
  const changed = next !== appLanguage;
  appLanguage = next;
  return changed;
}

export function getAppLanguage(): AwaAppLanguage {
  return appLanguage;
}

/** 'system' while AWA follows the phone, otherwise the language the user chose. */
export function getAppLanguagePreference(): AwaLanguagePreference {
  return manualLanguage ?? 'system';
}

/** The language the phone's own settings resolve to (what 'system' would use right now). */
export function getSystemLanguage(): AwaAppLanguage {
  return systemLanguage;
}

/**
 * Reads the phone's language list again and, while following the system, switches AWA to it. Notifies only when the
 * language in force really changes (no needless re-render or flicker). Never throws: an unreadable list means English.
 * Returns whether the language in force changed.
 */
export async function refreshSystemLanguage(): Promise<boolean> {
  const detected = await detectSystemLanguage();
  if (detected === null) {
    return false; // could not be read this time: keep the language in force instead of guessing
  }
  systemLanguage = detected;
  const changed = recomputeAppLanguage();
  if (changed) {
    notify();
  }
  return changed;
}

export function hydrateAppearancePreferences(): Promise<void> {
  if (appearanceHydrated) {
    return Promise.resolve();
  }
  if (!appearanceHydration) {
    appearanceHydration = Promise.all([
      AsyncStorage.getItem(MODE_STORAGE_KEY),
      AsyncStorage.getItem(TRUE_BLACK_STORAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
    ])
      .then(async ([storedMode, storedTrueBlack, storedLanguage]) => {
        if (isValidAppearanceMode(storedMode)) {
          appearanceMode = storedMode;
        }
        trueBlackEnabled = storedTrueBlack === 'true';
        // A stored value is the user's own choice (see the comment above manualLanguage): it wins over the phone. No
        // stored value (a brand-new install, or an install that never opened the language sheet) follows the phone's
        // language, English when it is not supported. Never triggers onboarding or any migration prompt.
        const normalized = normalizeAppLanguage(storedLanguage);
        if (normalized) {
          manualLanguage = normalized;
          if (normalized !== storedLanguage) {
            // an alias (zh-CN / zh-Hans): keep the preference, rewrite it under the canonical code
            AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalized).catch(() => {});
          }
        }
        // The phone's language is resolved BEFORE this promise settles, so whoever awaits the hydration (the app's start-up
        // gate) renders its first screen already in the right language.
        systemLanguage = (await detectSystemLanguage()) ?? DEFAULT_APP_LANGUAGE;
        recomputeAppLanguage();
        // Marked hydrated only NOW: a caller that arrives while the phone language is still being read must get the
        // memoised promise below (and so wait for it), not an already-resolved one.
        appearanceHydrated = true;
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

/** Manual choice: persisted, and wins over the phone's language from now on. */
export async function setAppLanguage(language: AwaAppLanguage): Promise<void> {
  manualLanguage = language;
  appLanguage = language;
  notify();
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => {});
}

/** A language ('manual choice') or 'system' (forget the choice and follow the phone, English when unsupported). */
export async function setAppLanguagePreference(preference: AwaLanguagePreference): Promise<void> {
  if (preference !== 'system') {
    await setAppLanguage(preference);
    return;
  }
  manualLanguage = null;
  await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY).catch(() => {});
  await refreshSystemLanguage();
  // Always tell the listeners: the preference changed (the sheet shows "System default") even if the language did not.
  notify();
}

/** Test-only reset — mirrors the reset helpers other AsyncStorage-backed
 * stores in this codebase expose for test isolation. */
export async function resetAppLanguageForTests(): Promise<void> {
  manualLanguage = null;
  systemLanguage = DEFAULT_APP_LANGUAGE;
  appLanguage = DEFAULT_APP_LANGUAGE;
  notify();
  await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY).catch(() => {});
}
