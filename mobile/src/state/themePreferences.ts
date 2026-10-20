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
export type AwaAppLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr' | 'ru' | 'de' | 'zh' | 'id' | 'hi' | 'sq' | 'ja';

const LANGUAGE_STORAGE_KEY = '@awa/appearance/language-v1';
// FIRST LAUNCH: with no stored language AWA detects the phone's preferred language ONCE (see hydrateAppearancePreferences),
// uses it when it is one of the twelve supported languages, English otherwise, and stores the result as the user's language.
// From then on the stored value is the only source of truth: the phone's language is never read again, so changing it later
// never overrides the language AWA already has. English is the fallback of that one detection, not a second mode.
// The paragraph below is the earlier (PHASE 7M) rule and still describes what a stored value does.
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
  value === 'fr' || value === 'en' || value === 'es' || value === 'it' || value === 'tr' || value === 'ru' || value === 'de' || value === 'zh' || value === 'id' || value === 'hi' || value === 'sq' || value === 'ja';

/** Simplified Chinese compatibility aliases (any case, '-' or '_'): zh-CN, zh-Hans, zh-Hans-CN. Only Chinese has
 * aliases; every other language still needs its exact code. */
const ZH_ALIASES = new Set(['zh', 'zh-cn', 'zh-hans', 'zh-hans-cn', 'zh-sg', 'zh-hans-sg']);

/** Indonesian ('id', Bahasa Indonesia) aliases: id-ID, and the legacy Java/Android code 'in' (in, in-ID, in_ID). */
const ID_ALIASES = new Set(['id-id', 'in', 'in-id']);

/** Hindi ('hi', हिन्दी, Devanagari script, Intl locale hi-IN): hi-IN and the other Devanagari variants. 'hi-Latn' (Hindi typed in
 * Roman letters, "Hinglish") is deliberately NOT an alias: AWA's Hindi is in Devanagari, so that phone falls back to English. */
const HI_ALIASES = new Set(['hi-in', 'hi-deva', 'hi-deva-in']);

/** Albanian ('sq', Shqip, Latin script, Intl locale sq-AL): Albania, Kosovo, North Macedonia, Montenegro and the script variant. Every
 * 'sq-*' tag also reaches the same language through the bare-language retry of languageFromLocaleTag; these make a STORED value
 * written in a regional spelling resolve too. */
const SQ_ALIASES = new Set(['sq-al', 'sq-xk', 'sq-mk', 'sq-me', 'sq-latn', 'sq-latn-al']);

/** Japanese ('ja', 日本語, Japanese script, Intl locale ja-JP): ja-JP and the script variants. Every 'ja-*' tag also reaches the same
 * language through the bare-language retry of languageFromLocaleTag (Android tags such as ja-JP-u-ca-japanese included); these make a
 * STORED value written in a regional or script spelling resolve too. */
const JA_ALIASES = new Set(['ja-jp', 'ja-jpan', 'ja-jpan-jp']);

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
  if (typeof value === 'string' && HI_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'hi';
  }
  if (typeof value === 'string' && SQ_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'sq';
  }
  if (typeof value === 'string' && JA_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'ja';
  }
  return null;
}

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
  if (/^hi-latn(-|$)/.test(cleaned)) {
    return null; // Hindi in Roman letters: not AWA's Devanagari Hindi
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

// The app language is ONE value, persisted under LANGUAGE_STORAGE_KEY: the language the user picked in the Appearance
// language sheet, or — until she picks one — the language resolved from the phone at the first launch and stored then.
// There is no "follow the system" mode: the phone's language is consulted only when nothing usable is stored.
let appLanguage: AwaAppLanguage = DEFAULT_APP_LANGUAGE;
// True once setAppLanguage() ran in this session: a manual choice that lands while the first-launch detection is still
// being read must not be overwritten by the detection's result.
let appLanguageChosen = false;

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

export function getAppLanguage(): AwaAppLanguage {
  return appLanguage;
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
        // A stored language is the user's language: it is used as it is and the phone is never asked. Nothing usable stored
        // — a first launch, an install that left the (removed) "System default" option on, which was never a stored value but
        // the absence of one, or a value that is not a supported language (a legacy 'system' marker, junk) — is resolved
        // now, ONCE: the phone's first supported preferred language, English when none is supported, and stored as the
        // user's language. Her other settings are not touched, and nothing here triggers onboarding.
        const normalized = normalizeAppLanguage(storedLanguage);
        if (normalized) {
          if (!appLanguageChosen) {
            appLanguage = normalized;
          }
          if (normalized !== storedLanguage) {
            // an alias (zh-CN / zh-Hans): keep the preference, rewrite it under the canonical code
            AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalized).catch(() => {});
          }
        } else {
          // Resolved BEFORE this promise settles, so whoever awaits the hydration (the app's start-up gate) renders its
          // first screen already in the right language.
          const detected = await detectSystemLanguage();
          if (!appLanguageChosen) {
            appLanguage = detected ?? DEFAULT_APP_LANGUAGE;
            // Only a phone language that WAS read is stored. A read that failed or timed out says nothing about the phone:
            // English is used for this session but not frozen as her language, so the next launch detects again.
            if (detected !== null) {
              await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, detected).catch(() => {});
            }
          }
        }
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

/** The user's choice: persisted, and the language AWA keeps from now on, whatever the phone's language does. */
export async function setAppLanguage(language: AwaAppLanguage): Promise<void> {
  appLanguageChosen = true;
  appLanguage = language;
  notify();
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => {});
}

/** Test-only reset — mirrors the reset helpers other AsyncStorage-backed
 * stores in this codebase expose for test isolation. */
export async function resetAppLanguageForTests(): Promise<void> {
  appLanguageChosen = false;
  appLanguage = DEFAULT_APP_LANGUAGE;
  notify();
  await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY).catch(() => {});
}
