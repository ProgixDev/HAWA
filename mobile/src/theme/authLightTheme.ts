import {resolveAwaTheme} from './awaThemeTokens';

// The Auth family (Login/Register/Forgot Password) is intentionally
// LIGHT-ONLY for now — these screens must NOT react to the user's actual
// appearance mode, palette, or True Black selection (Dark-mode Auth is a
// dedicated future phase). This reuses the exact same resolver every other
// screen's reactive useAwaTheme() call relies on, just with fixed inputs, so
// it can never drift from the real AWA Original Light values and requires no
// new theme architecture, provider, or local Light/Dark resolution.
//
// Do NOT read this via useAwaTheme() or subscribe it to AwaThemeProvider —
// it is a frozen snapshot by design.
export const AUTH_LIGHT_THEME = resolveAwaTheme('awa-original', false, false);
