import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {getAppLanguage, subscribeThemePreferences} from '../state/themePreferences';
import {en} from './locales/en';
import {es} from './locales/es';
import {fr} from './locales/fr';
import {it} from './locales/it';
import {ru} from './locales/ru';
import {de} from './locales/de';
import {zh} from './locales/zh';
import {tr} from './locales/tr';
import {id} from './locales/id';
import {hi} from './locales/hi';
import {sq} from './locales/sq';
import {ja} from './locales/ja';
import {ko} from './locales/ko';
import {ptPT} from './locales/ptPT';
import {ptBR} from './locales/ptBR';
import {bn} from './locales/bn';
import {da} from './locales/da';
import {sv} from './locales/sv';
import './pluralRules';

// Centralized localization (i18next + react-i18next) — imported once, as a
// side effect, at app startup (App.tsx), the same "hydrate/initialize before
// any screen mounts" convention every other global store in this app already
// uses. Not a native module: pure JS, no linking, no device-locale
// detection — the active language is entirely driven by AWA's own "Langue de
// l'application" preference (themePreferences.ts's getAppLanguage/
// setAppLanguage).
//
// SYSTEM LANGUAGE (supersedes the paragraph below for first launch): the language in force is the user's manual choice,
// otherwise the phone's language, otherwise English (state/themePreferences.ts). The `lng` below is only i18next's value
// until App.tsx's start-up gate has called initializeAppLanguage() (i18n/appLanguage.ts), which resolves it before the
// first screen renders; `fallbackLng` stays English for any missing translation.
//
// PHASE 7M — English-first default: `lng`/`fallbackLng` are both 'en' now,
// matching themePreferences.ts's DEFAULT_APP_LANGUAGE. A brand-new install
// (or any install with no/invalid persisted value) therefore renders in
// English from this very first synchronous `init()` call — no hydration
// round-trip is needed to reach the correct language for that case, so
// there is no French flash on a fresh English-default launch. An existing
// install with an explicitly persisted 'fr' preference still correctly ends
// up in French once hydrateAppearancePreferences() (App.tsx) resolves and
// the subscribeThemePreferences listener below calls changeLanguage('fr') —
// exactly the same async hydration pattern every other preference in this
// app already uses (theme id, appearance mode, true black).
//
// Language is deliberately app-wide (never profile-scoped — see
// themePreferences.ts's own header comment): this module subscribes to the
// SAME notify() mechanism appearanceMode/trueBlackEnabled already use,
// rather than owning a second "current language" concept. Selecting a new
// language in AppearanceScreen's language sheet (setAppLanguage()) is the
// ONLY way this ever changes — nothing here is derived from the device.
//
// Coverage: only the screens that have been migrated to `useTranslation()`
// so far read from `resources` below — see fr.ts's own header comment for
// exactly what that is (Phase 1) and what still renders in French regardless
// of the selected language (Phase 2+, tracked separately).
i18n.use(initReactI18next).init({
  resources: {
    fr: {translation: fr},
    en: {translation: en},
    es: {translation: es},
    it: {translation: it},
    tr: {translation: tr},
    ru: {translation: ru},
    de: {translation: de},
    zh: {translation: zh},
    id: {translation: id},
    hi: {translation: hi},
    sq: {translation: sq},
    ja: {translation: ja},
    ko: {translation: ko},
    'pt-PT': {translation: ptPT},
    // Brazilian Portuguese is an OVERLAY: only the strings that differ from Portugal (see the fallback chain below).
    'pt-BR': {translation: ptBR},
    bn: {translation: bn},
    da: {translation: da},
    sv: {translation: sv},
  },
  lng: getAppLanguage(),
  // pt-BR reads key by key: Brazilian overlay → Portugal dictionary → English. Every other language falls back to English only.
  fallbackLng: {'pt-BR': ['pt-PT', 'en'], default: ['en']},
  interpolation: {escapeValue: false}, // React already escapes rendered text
  returnNull: false,
});

subscribeThemePreferences(() => {
  const language = getAppLanguage();
  if (i18n.language !== language) {
    i18n.changeLanguage(language).catch(() => {});
  }
});

export default i18n;
