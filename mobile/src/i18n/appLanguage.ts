import i18n from './index';
import {restoreDefaultLayoutDirection} from './layoutDirection';
import {getAppLanguage, hydrateAppearancePreferences} from '../state/themePreferences';

// Start-up language handling, kept out of App.tsx so it can be tested on its own.
//
// themePreferences.ts decides WHICH language is in force: the language stored for the user (her own choice in Appearance, or
// the one resolved from the phone at the first launch and stored then — see hydrateAppearancePreferences); i18n/index.ts
// subscribes to it and switches i18next. initializeAppLanguage() makes sure that happens before the first translated
// screen: App.tsx keeps its boot placeholder up until it settles, so onboarding never starts in the wrong language and
// nothing flashes English/French then switches.
//
// There is deliberately no "foreground" refresh: the phone's language is read only when nothing is stored, so changing it
// later (or while AWA is in the background) never overrides the language AWA already has.

/** Resolves the language in force (stored language, else the phone's once, else English) and applies it to i18next. Never rejects. */
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
  // Clears the layout direction a previous build stored natively (see layoutDirection.ts).
  restoreDefaultLayoutDirection();
}
