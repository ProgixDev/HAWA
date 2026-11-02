import React from 'react';
import type {StyleProp, TextStyle} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {awaIconSizes, type AwaIconSize} from '../../theme/iconSizes';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {resolveColorRole, type AwaColorRole} from './types';

// AwaIcon — the existing icon library (MaterialDesignIcons) with a token size, a colour role and a correct
// accessibility default. No new library, no glyph renamed. Nothing in the app uses it yet (Phase 2 is additive).

export type AwaIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type AwaIconProps = {
  name: AwaIconName;
  /** A token (`xs` 16 / `sm` 20 / `md` 24 / `lg` 32) or a legacy number. Default `md`. */
  size?: AwaIconSize | number;
  /** Colour role; default `onSurfaceVariant` (AA-safe companion). */
  colorRole?: AwaColorRole;
  accessible?: boolean;
  /** Explicit colour (approved exception). Wins over `colorRole`. */
  color?: string;
  /** Decorative icons are hidden from screen readers. Default true unless `accessibilityLabel` is given. */
  decorative?: boolean;
  accessibilityLabel?: string;
  /**
   * Directional glyphs (chevrons / arrows) are mirrored automatically under a right-to-left layout by theme/installAwaRtl.ts (Arabic), by icon name, for
   * every icon in the app. This prop stays for call sites that state their intent; it changes nothing by itself.
   */
  mirrorInRTL?: boolean;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

export function AwaIcon({
  name,
  size = 'md',
  colorRole = 'onSurfaceVariant',
  accessible = true,
  color,
  decorative,
  accessibilityLabel,
  style,
  testID,
}: AwaIconProps): React.JSX.Element {
  const {roles} = useAwaTokens();
  const numericSize = typeof size === 'number' ? size : awaIconSizes[size];
  const resolvedColor = color ?? resolveColorRole(roles, colorRole, accessible);
  const hidden = decorative ?? accessibilityLabel === undefined;
  return (
    <MaterialDesignIcons
      accessibilityElementsHidden={hidden}
      accessibilityLabel={hidden ? undefined : accessibilityLabel}
      accessibilityRole={hidden ? undefined : 'image'}
      color={resolvedColor}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'yes'}
      name={name}
      size={numericSize}
      style={style}
      testID={testID}
    />
  );
}
