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
export type AwaAppLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr' | 'ru' | 'de' | 'zh' | 'id' | 'hi' | 'sq' | 'ja' | 'ko' | 'pt-PT' | 'pt-BR' | 'bn' | 'da' | 'sv' | 'nb' | 'pl' | 'uk' | 'cs' | 'sk' | 'hu' | 'ro' | 'bg' | 'sr' | 'hr' | 'bs' | 'sl' | 'ne' | 'si' | 'th' | 'vi' | 'uz' | 'az' | 'ka' | 'hy' | 'tg' | 'ky' | 'tk';

const LANGUAGE_STORAGE_KEY = '@awa/appearance/language-v1';
// FIRST LAUNCH: with no stored language AWA detects the phone's preferred language ONCE (see hydrateAppearancePreferences),
// uses it when it is one of the thirteen supported languages, English otherwise, and stores the result as the user's language.
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
  value === 'fr' || value === 'en' || value === 'es' || value === 'it' || value === 'tr' || value === 'ru' || value === 'de' || value === 'zh' || value === 'id' || value === 'hi' || value === 'sq' || value === 'ja' || value === 'ko' || value === 'pt-PT' || value === 'pt-BR' || value === 'bn' || value === 'da' || value === 'sv' || value === 'nb' || value === 'pl' || value === 'uk' || value === 'cs' || value === 'sk' || value === 'hu' || value === 'ro' || value === 'bg' || value === 'sr' || value === 'hr' || value === 'bs' || value === 'sl' || value === 'ne' || value === 'si' || value === 'th' || value === 'vi' || value === 'uz' || value === 'az' || value === 'ka' || value === 'hy' || value === 'tg' || value === 'ky' || value === 'tk';

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

/** Korean ('ko', 한국어, Hangul, Intl locale ko-KR): South Korea (ko-KR), the North Korean tag (ko-KP) and the script variants. Every 'ko-*' tag also
 * reaches the same language through the bare-language retry of languageFromLocaleTag; these make a STORED value written in a regional or
 * script spelling resolve too. */
const KO_ALIASES = new Set(['ko-kr', 'ko-kp', 'ko-kore', 'ko-kore-kr', 'ko-hang', 'ko-hang-kr']);

/** Portuguese has TWO app languages that share one translation base: 'pt-PT' (Português, Portugal — the complete dictionary) and 'pt-BR'
 * (Português, Brasil — only the words and spellings that differ, laid over the Portugal text). Brazil is 'pt-BR'; Portugal, the bare
 * 'pt' and every other Portuguese-speaking country (Angola, Mozambique, Cabo Verde, Guinea-Bissau, São Tomé, Timor-Leste, Macau …,
 * which follow the European norm) are 'pt-PT'. A BARE 'pt' is ambiguous: it resolves to Portugal, the base text, never silently to Brazil. */
const PT_PT_ALIASES = new Set(['pt', 'pt-pt', 'pt-ao', 'pt-mz', 'pt-cv', 'pt-gw', 'pt-st', 'pt-tl', 'pt-mo', 'pt-gq', 'pt-ch', 'pt-lu', 'pt-fr', 'pt-latn', 'pt-latn-pt']);
const PT_BR_ALIASES = new Set(['pt-br', 'pt-latn-br']);

/** Bengali ('bn', বাংলা, Bengali script, Intl locale bn-BD): Bangladesh (bn-BD), India (bn-IN) and the script variants. ONE app language serves both countries:
 * every 'bn-*' tag also reaches it through the bare-language retry of languageFromLocaleTag; these make a STORED value written in a regional or script
 * spelling resolve too. */
const BN_ALIASES = new Set(['bn-bd', 'bn-in', 'bn-beng', 'bn-beng-bd', 'bn-beng-in']);

/** Danish ('da', Dansk, Latin script, Intl locale da-DK): Denmark (da-DK) and the Faroe Islands / Greenland variants that also use Danish. Every 'da-*' tag also
 * reaches the same language through the bare-language retry of languageFromLocaleTag; these make a STORED value written in a regional spelling resolve too. */
const DA_ALIASES = new Set(['da-dk', 'da-fo', 'da-gl']);

/** Swedish ('sv', Svenska, Latin script, Intl locale sv-SE). */
const SV_ALIASES = new Set(['sv-se', 'sv-fi', 'sv-ax']);

/** Norwegian Bokmål ('nb', Norsk bokmål, Latin script, Intl locale nb-NO). Android may report Bokmål as 'nb', 'nb-NO' or the macrolanguage 'no' / 'no-NO'
 * (which in practice is Bokmål). Nynorsk ('nn', 'nn-NO') is deliberately NOT mapped: it is a different written standard, so it falls through to English. */
const NB_ALIASES = new Set(['nb-no', 'nb-sj', 'no', 'no-no']);

/** Ukrainian ('uk', Українська, Cyrillic script, Intl locale uk-UA). */
const UK_ALIASES = new Set(['uk-ua']);
/** Czech ('cs', Čeština, Latin script, Intl locale cs-CZ). */
const CS_ALIASES = new Set(['cs-cz']);
/** Slovak ('sk', Slovenčina, Latin script, Intl locale sk-SK). */
const SK_ALIASES = new Set(['sk-sk', 'slk', 'slo']);
/** Hungarian ('hu', Magyar, Latin script, Intl locale hu-HU). */
const HU_ALIASES = new Set(['hu-hu', 'hun']);
/** Romanian ('ro', Română, Latin script, Intl locale ro-RO). */
const RO_ALIASES = new Set(['ro-ro', 'ron', 'rum', 'mo']);
/** Bulgarian ('bg', Български, Cyrillic script, Intl locale bg-BG). */
const BG_ALIASES = new Set(['bg-bg', 'bul']);
/** Serbian ('sr', Српски, Cyrillic script, Intl locale sr-RS). */
const SR_ALIASES = new Set(['sr-rs', 'srp', 'scc', 'sr-cyrl', 'sr-cyrl-rs', 'sr-latn', 'sr-latn-rs', 'sr-me', 'sr-ba']);
/** Croatian ('hr', Hrvatski, Latin script, Intl locale hr-HR). */
const HR_ALIASES = new Set(['hr-hr', 'hrv', 'hr-ba']);
/** Bosnian ('bs', Bosanski, Latin script, Intl locale bs-BA). */
const BS_ALIASES = new Set(['bs-ba', 'bos', 'bs-latn', 'bs-latn-ba', 'bs-cyrl', 'bs-cyrl-ba']);
/** Slovenian ('sl', Slovenščina, Latin script, Intl locale sl-SI). */
const SL_ALIASES = new Set(['sl-si', 'slv']);
/** Nepali ('ne', नेपाली, Devanagari script, Intl locale ne-NP-u-nu-latn). */
const NE_ALIASES = new Set(['ne-np', 'nep', 'ne-in']);
/** Sinhala ('si', සිංහල, Sinhala script, Intl locale si-LK). */
const SI_ALIASES = new Set(['si-lk', 'sin']);
/** Thai ('th', ไทย, Thai script, Intl locale th-TH-u-ca-gregory). */
const TH_ALIASES = new Set(['th-th', 'tha']);
/** Vietnamese ('vi', Tiếng Việt, Latin script, Intl locale vi-VN). */
const VI_ALIASES = new Set(['vi-vn', 'vie']);
/** Uzbek ('uz', Oʻzbekcha, Latin script, Intl locale uz-UZ). */
const UZ_ALIASES = new Set(['uz-uz', 'uzb', 'uz-latn', 'uz-latn-uz']);
/** Azerbaijani ('az', Azərbaycanca, Latin script, Intl locale az-AZ). */
const AZ_ALIASES = new Set(['az-az', 'aze', 'az-latn', 'az-latn-az']);
/** Georgian ('ka', ქართული, Georgian (Mkhedruli) script, Intl locale ka-GE). */
const KA_ALIASES = new Set(['ka-ge', 'kat', 'geo', 'ka-geor', 'ka-geor-ge']);
/** Armenian ('hy', Հայերեն, Armenian script, Intl locale hy-AM). */
const HY_ALIASES = new Set(['hy-am', 'hye', 'arm', 'hy-arm', 'hy-arm-am']);
/** Tajik ('tg', Тоҷикӣ, Cyrillic script, Intl locale tg-TJ). */
const TG_ALIASES = new Set(['tg-tj', 'tgk', 'tajik', 'tg-cyrl', 'tg-cyrl-tj']);
/** Kyrgyz ('ky', Кыргызча, Cyrillic script, Intl locale ky-KG). */
const KY_ALIASES = new Set(['ky-kg', 'kir', 'kyrgyz', 'kirghiz', 'ky-cyrl', 'ky-cyrl-kg']);
/** Turkmen ('tk', Türkmençe, Latin script, Intl locale tk-TM). */
const TK_ALIASES = new Set(['tk-tm', 'tuk', 'turkmen', 'turkmence', 'tk-latn', 'tk-latn-tm']);
/** Polish ('pl', Polski, Latin script, Intl locale pl-PL). */
const PL_ALIASES = new Set(['pl-pl']);

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
  if (typeof value === 'string' && KO_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'ko';
  }
  if (typeof value === 'string' && PT_PT_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'pt-PT';
  }
  if (typeof value === 'string' && PT_BR_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'pt-BR';
  }
  if (typeof value === 'string' && BN_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'bn';
  }
  if (typeof value === 'string' && DA_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'da';
  }
  if (typeof value === 'string' && SV_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'sv';
  }
  if (typeof value === 'string' && NB_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'nb';
  }
  if (typeof value === 'string' && PL_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'pl';
  }
  if (typeof value === 'string' && UK_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'uk';
  }
  if (typeof value === 'string' && CS_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'cs';
  }
  if (typeof value === 'string' && SK_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'sk';
  }
  if (typeof value === 'string' && HU_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'hu';
  }
  if (typeof value === 'string' && RO_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'ro';
  }
  if (typeof value === 'string' && BG_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'bg';
  }
  if (typeof value === 'string' && SR_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'sr';
  }
  if (typeof value === 'string' && HR_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'hr';
  }
  if (typeof value === 'string' && BS_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'bs';
  }
  if (typeof value === 'string' && SL_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'sl';
  }
  if (typeof value === 'string' && NE_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'ne';
  }
  if (typeof value === 'string' && SI_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'si';
  }
  if (typeof value === 'string' && TH_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'th';
  }
  if (typeof value === 'string' && VI_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'vi';
  }
  if (typeof value === 'string' && UZ_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'uz';
  }
  if (typeof value === 'string' && AZ_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'az';
  }
  if (typeof value === 'string' && KA_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'ka';
  }
  if (typeof value === 'string' && HY_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'hy';
  }
  if (typeof value === 'string' && TG_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'tg';
  }
  if (typeof value === 'string' && KY_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'ky';
  }
  if (typeof value === 'string' && TK_ALIASES.has(value.trim().toLowerCase().replace(/_/g, '-'))) {
    return 'tk';
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
  if (/^(hi|bn)-latn(-|$)/.test(cleaned)) {
    return null; // Hindi / Bengali in Roman letters: not AWA's Devanagari Hindi or Bengali-script Bengali
  }
  if (cleaned === 'pt' || cleaned.startsWith('pt-')) {
    // Portuguese: the region decides (pt-BR, pt-Latn-BR, pt-BR-u-… → Brazil); anything else, bare 'pt' included, is Portugal.
    const region = cleaned.split(/-[ux]-/)[0].split('-').slice(1).find(part => /^[a-z]{2}$/.test(part));
    return region === 'br' ? 'pt-BR' : 'pt-PT';
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
