import {useMemo} from 'react';

import {useAwaTheme} from './AwaThemeProvider';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from './componentDimensions';
import {awaIconSizes} from './iconSizes';
import {deriveAwaRoles, type AwaRoles} from './semanticRoles';
import {awaShapes} from './shapes';
import {awaSpace} from './spaceScale';
import {AWA_TYPESCALE} from './typescale';
import type {ResolvedAwaTheme} from './awaThemeTokens';

// Read-only access to the Phase 1 token layer next to the existing theme. It ADDS a hook; `useAwaTheme()` and
// `AwaThemeProvider` are not modified (284 files consume them). Same contract: it throws outside the provider.

export type AwaTokens = {
  /** The existing resolved theme, exactly as `useAwaTheme().theme` returns it. */
  theme: ResolvedAwaTheme;
  /** Semantic roles derived from `theme` (memoized per theme). */
  roles: AwaRoles;
  typescale: typeof AWA_TYPESCALE;
  shapes: typeof awaShapes;
  iconSizes: typeof awaIconSizes;
  space: typeof awaSpace;
  /** PROPOSALS only (not verified against the official kit). */
  dimensionProposals: typeof AWA_COMPONENT_DIMENSION_PROPOSALS;
};

export function useAwaTokens(): AwaTokens {
  const {theme} = useAwaTheme();
  return useMemo<AwaTokens>(
    () => ({
      theme,
      roles: deriveAwaRoles(theme),
      typescale: AWA_TYPESCALE,
      shapes: awaShapes,
      iconSizes: awaIconSizes,
      space: awaSpace,
      dimensionProposals: AWA_COMPONENT_DIMENSION_PROPOSALS,
    }),
    [theme],
  );
}
