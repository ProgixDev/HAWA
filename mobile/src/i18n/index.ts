import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {getAppLanguage, subscribeThemePreferences} from '../state/themePreferences';
import {en} from './locales/en';
import {fr} from './locales/fr';

// Centralized localization (i18next + react-i18next) — imported once, as a
// side effect, at app startup (App.tsx), the same "hydrate/initialize before
// any screen mounts" convention every other global store in this app already
// uses. Not a native module: pure JS, no linking, no device-locale
// detection — the active language is entirely driven by AWA's own "Langue de
// l'application" preference (themePreferences.ts's getAppLanguage/
// setAppLanguage), which already defaults to 'fr' and is already hydrated
// before this module's `init()` call runs (see App.tsx's import order).
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
  },
  lng: getAppLanguage(),
  fallbackLng: 'fr',
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
