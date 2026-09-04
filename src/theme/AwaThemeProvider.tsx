import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';

import {usePremium} from '../hooks/usePremium';
import {resolveEffectiveThemeId, type AwaThemeId} from '../config/awaThemes';
import {
  getAppearanceMode,
  getSelectedThemeId,
  getTrueBlackEnabled,
  hydrateAppearancePreferences,
  hydrateThemePreferences,
  subscribeThemePreferences,
  type AwaAppearanceMode,
} from '../state/themePreferences';
import {resolveAwaTheme, type ResolvedAwaTheme} from './awaThemeTokens';

// ============================================================================
// PHASE A — GLOBAL THEME FOUNDATION
// ============================================================================
//
// This is the ONLY runtime theme-resolution layer in the app. It reuses the
// EXISTING src/state/themePreferences.ts store for persistence (no new
// AsyncStorage keys, no second preference store) and the EXISTING
// src/config/awaThemes.ts registry/resolver functions for Premium-fallback
// logic — this file only adds the missing "make it reactive and available
// app-wide" piece.
//
// No screen/component is migrated to consume this in Phase A. Mounting the
// Provider makes `useAwaTheme()` available; nothing yet calls it outside its
// own tests.

export type AwaThemeContextValue = {
  /** The fully resolved runtime design tokens — the only thing future
   * consumers should render from (`theme.colors.background`,
   * `theme.gradients.pageBackground`, etc.). */
  theme: ResolvedAwaTheme;
  /** What the user picked in AppearanceScreen, verbatim (may be a Premium
   * theme the user no longer has access to — never mutated by this
   * provider's own read path). */
  selectedThemeId: AwaThemeId;
  /** What she is CURRENTLY allowed to use — `resolveEffectiveThemeId`'s
   * output; this is what `theme` is actually resolved from. */
  effectiveThemeId: AwaThemeId;
  appearanceMode: AwaAppearanceMode;
  /** 'system' resolved against the real device scheme; 'light'/'dark' force
   * their own variant regardless of the device. */
  resolvedAppearanceMode: 'light' | 'dark';
  isDark: boolean;
  trueBlackEnabled: boolean;
};

// `undefined` (not a fake default theme) is the established convention in
// this codebase for "context read outside its provider" — see
// src/navigation/JournalSheetContext.tsx. useAwaTheme() throws below rather
// than silently returning AWA Original, which would hide a real integration
// bug (a screen rendered outside the app root).
const AwaThemeContext = createContext<AwaThemeContextValue | undefined>(undefined);

export function AwaThemeProvider({children}: {children: React.ReactNode}): React.JSX.Element {
  const {isPremium, initialized: premiumInitialized} = usePremium();
  const deviceColorScheme = useColorScheme();

  const [selectedThemeId, setSelectedThemeIdState] = useState<AwaThemeId>(getSelectedThemeId);
  const [appearanceMode, setAppearanceModeState] = useState<AwaAppearanceMode>(getAppearanceMode);
  const [trueBlackEnabled, setTrueBlackEnabledState] = useState<boolean>(getTrueBlackEnabled);

  // Hydration: reuses themePreferences.ts's own memoized hydrate*() promises
  // (calling them again elsewhere, e.g. from AppearanceScreen, is a no-op
  // per that file's own hydrated-flag guard) — no duplicated persistence
  // logic, no duplicated AsyncStorage reads. A single subscription then
  // keeps all three local mirrors in sync with every future change from
  // anywhere in the app (including AppearanceScreen itself).
  useEffect(() => {
    let active = true;

    hydrateThemePreferences().then(id => {
      if (active) {setSelectedThemeIdState(id);}
    });

    hydrateAppearancePreferences().then(() => {
      if (active) {
        setAppearanceModeState(getAppearanceMode());
        setTrueBlackEnabledState(getTrueBlackEnabled());
      }
    });

    const unsubscribe = subscribeThemePreferences(() => {
      if (!active) {return;}
      setSelectedThemeIdState(getSelectedThemeId());
      setAppearanceModeState(getAppearanceMode());
      setTrueBlackEnabledState(getTrueBlackEnabled());
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Mirrors AppearanceScreen.tsx's own effective-theme resolution exactly
  // (see its "EFFECTIVE THEME" section): while Premium status hasn't
  // resolved yet, show the saved id as-is rather than guessing a fallback
  // that might immediately flip once purchaseService.ts reports the real
  // entitlement — avoids the "initial flash of the wrong palette" Phase A
  // is required to avoid, using the exact same rule this app already ships.
  const effectiveThemeId = premiumInitialized
    ? resolveEffectiveThemeId(selectedThemeId, isPremium)
    : selectedThemeId;

  // Deliberately NEVER writes `effectiveThemeId` back to storage here. Doing
  // so (AppearanceScreen.tsx has its own such effect, but that one only runs
  // while that specific screen is mounted) would, once this Provider is
  // always mounted app-wide, overwrite the user's persisted Premium
  // selection with 'awa-original' on every single cold launch without an
  // active subscription — permanently losing the choice and breaking
  // restoration. Instead `effectiveThemeId` is re-derived fresh from
  // `selectedThemeId` + `isPremium` on every render, so restoring Premium
  // immediately makes the original selected palette effective again with no
  // write of any kind — the persisted value is never touched by this file.

  const isDark = appearanceMode === 'dark' || (appearanceMode === 'system' && deviceColorScheme === 'dark');
  const resolvedAppearanceMode: 'light' | 'dark' = isDark ? 'dark' : 'light';

  const theme = useMemo(
    () => resolveAwaTheme(effectiveThemeId, isDark, trueBlackEnabled),
    [effectiveThemeId, isDark, trueBlackEnabled],
  );

  const value = useMemo<AwaThemeContextValue>(
    () => ({
      theme,
      selectedThemeId,
      effectiveThemeId,
      appearanceMode,
      resolvedAppearanceMode,
      isDark,
      trueBlackEnabled,
    }),
    [theme, selectedThemeId, effectiveThemeId, appearanceMode, resolvedAppearanceMode, isDark, trueBlackEnabled],
  );

  return <AwaThemeContext.Provider value={value}>{children}</AwaThemeContext.Provider>;
}

/** THE single way any future screen/component reads the resolved app theme.
 * Throws when called outside `AwaThemeProvider` instead of silently handing
 * back a default theme — an accidental miss would otherwise render
 * incorrectly with no error, exactly the kind of bug this is meant to catch
 * early (see the context-safety note above). */
export function useAwaTheme(): AwaThemeContextValue {
  const value = useContext(AwaThemeContext);
  if (!value) {
    throw new Error('useAwaTheme() must be called within an AwaThemeProvider.');
  }
  return value;
}
