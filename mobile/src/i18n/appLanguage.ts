import i18n from './index';
import {applyLayoutDirectionForLanguage} from './layoutDirection';
import {getAppLanguage, hydrateAppearancePreferences, refreshAppLanguageFromDevice} from '../state/themePreferences';

// Start-up language handling, kept out of App.tsx so it can be tested on its own.
//
// themePreferences.ts decides WHICH language is in force: the language stored for the user (her own choice in Appearance, or
// the one resolved from the phone at the first launch and stored then — see hydrateAppearancePreferences); i18n/index.ts
// subscribes to it and switches i18next. initializeAppLanguage() makes sure that happens before the first translated
// screen: App.tsx keeps its boot placeholder up until it settles, so onboarding never starts in the wrong language and
// nothing flashes English/French then switches.
//
// Two modes (themePreferences.ts): in the AUTOMATIC mode the phone's language is read at every launch (initializeAppLanguage) and again
// whenever the app returns to the foreground (refreshLanguageFromDevice, called by App.tsx), so changing the phone's language is followed;
// in the MANUAL mode the language the user picked is kept and the phone's language is never consulted.

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
  // Writes the native layout direction of the language in force (right-to-left for Arabic, left-to-right for every other language; it also clears the
  // direction a previous build stored natively). It applies at the next cold start; layoutDirection.ts raises the restart prompt when it differs from the
  // direction running now.
  applyLayoutDirectionForLanguage(getAppLanguage());
}

/**
 * Called when the app becomes active again: in the automatic mode, re-reads the phone's language and applies it when it changed (i18next,
 * the layout direction and the reminders follow the language change through their own subscriptions). A no-op in the manual mode and when
 * the language is unchanged. Never rejects.
 */
export async function refreshLanguageFromDevice(): Promise<void> {
  try {
    await refreshAppLanguageFromDevice();
  } catch {
    // keep the language in force
  }
}
