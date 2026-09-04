import React from 'react';
import {StatusBar} from 'react-native';

import {useAwaTheme} from './AwaThemeProvider';

// Phase B — replaces App.tsx's previous static
// `<StatusBar backgroundColor={colors.backgroundDark} barStyle="light-content" hidden />`
// (from the legacy src/theme/colors.ts palette) with one driven by the
// resolved AWA theme. `theme.statusBarStyle` (Phase A, derived from real
// background luminance) is used as-is — no independent StatusBar logic is
// invented here. `hidden` is preserved exactly as before; this component
// only changes what the bar would look like if it weren't hidden — most
// screens still mount their own `<StatusBar>` that wins once they render
// (see the Phase B report's "local StatusBars" audit), so this only
// controls the brief root-level baseline before/between those.
export function AwaRootStatusBar(): React.JSX.Element {
  const {theme} = useAwaTheme();

  return (
    <StatusBar
      backgroundColor={theme.colors.background}
      barStyle={theme.statusBarStyle}
      hidden
    />
  );
}
