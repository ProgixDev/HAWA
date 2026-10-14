import React from 'react';
import {Text, type TextProps} from 'react-native';

import {awaTextStyle, type AwaTextRole} from '../../theme/typescale';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {resolveColorRole, type AwaColorRole, type AwaLegacyWeight} from './types';

// AwaText — a Material 3 text role on top of the NATIVE RN `Text` (one host node, `children` untouched, every TextProps
// prop forwarded, ref forwarded). Size / lineHeight / tracking are the verified type scale; the weights are
// PROVISIONAL (see typescale.ts). Nothing in the app uses it yet (Phase 2 is additive).

export type AwaTextProps = TextProps & {
  /**
   * Material 3 text role. Default `bodyMedium`. Named `variant` (not `role`) because RN's own `Text` already has an
   * accessibility `role` prop that must stay forwardable.
   */
  variant?: AwaTextRole;
  /** Uses the role's emphasized weight (provisional). */
  emphasized?: boolean;
  /** Colour role; default `onSurface`. */
  colorRole?: AwaColorRole;
  /** AA-safe companion colours (decision D3). Default true; pass false to get the raw token. */
  accessible?: boolean;
  /** Explicit colour (escape hatch for an approved exception such as a brand colour). Wins over `colorRole`. */
  color?: string;
  /** Legacy weight override for a screen that must keep its current weight while it is migrated (decision D4). */
  weight?: AwaLegacyWeight;
};

export const AwaText = React.forwardRef<Text, AwaTextProps>(function AwaText(
  {variant = 'bodyMedium', emphasized = false, colorRole = 'onSurface', accessible = true, color, weight, style, ...rest},
  ref,
) {
  const {roles} = useAwaTokens();
  const resolvedColor = color ?? resolveColorRole(roles, colorRole, accessible);
  const base = awaTextStyle(variant, {emphasized, color: resolvedColor});
  return (
    <Text
      ref={ref}
      {...rest}
      style={weight ? [base, {fontWeight: weight}, style] : [base, style]}
    />
  );
});
