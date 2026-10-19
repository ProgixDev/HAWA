import i18n from './index';
import {getAppLanguage, hydrateAppearancePreferences, refreshSystemLanguage} from '../state/themePreferences';

// Start-up and foreground language handling, kept out of App.tsx so it can be tested on its own.
//
// themePreferences.ts decides WHICH language is in force (the user's manual choice, else the phone's language, else
// English); i18n/index.ts subscribes to it and switches i18next. These two functions make sure that happens at the right
// moments:
//  - initializeAppLanguage(): once, before the first translated screen. App.tsx keeps its boot placeholder up until it
//    settles, so onboarding never starts in the wrong language and nothing flashes English/French then switches.
//  - refreshAppLanguageOnForeground(): every time the app becomes active again. If AWA follows the system language and the
//    phone's language changed meanwhile, AWA switches; with a manual choice nothing changes. A language that did not
//    change causes no update at all.

/** Resolves the language in force (stored choice, else the phone, else English) and applies it to i18next. Never rejects. */
export async function initializeAppLanguage(): Promise<void> {
  try {
    await hydrateAppearancePreferences();
  } catch {
    // an unreadable store leaves the English default
  }
  try {
    // Only when it differs: re-applying the language in force would still emit a "language changed" event.
    if (i18n.language !== getAppLanguage()) {
      await i18n.changeLanguage(getAppLanguage());
    }
  } catch {
    // keep the language i18next already has
  }
}

/** Re-reads the phone's language when AWA comes back to the foreground. Never rejects. */
export async function refreshAppLanguageOnForeground(): Promise<void> {
  try {
    await refreshSystemLanguage();
    if (i18n.language !== getAppLanguage()) {
      await i18n.changeLanguage(getAppLanguage());
    }
  } catch {
    // the language in force stays as it is
  }
}
