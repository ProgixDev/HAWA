import React from 'react';
import {Pressable, type PressableProps} from 'react-native';

import {withAlpha} from '../../theme/awaThemeTokens';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../theme/componentDimensions';
import {touchTargetHitSlop} from '../../theme/iconSizes';
import {awaShapes} from '../../theme/shapes';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaIcon, type AwaIconName} from './AwaIcon';
import {pressedStyle, resolvePressableStyle} from './pressFeedback';

// AwaIconButton — a NATIVE Pressable (one host, no nested Pressable). The visual box is smaller than the touch target;
// `hitSlop` extends it to 48 dp unless the caller passes its own `hitSlop`. The accessibility label is REQUIRED by the
// type, because an icon-only control without one is unusable with a screen reader.
//
// Dimensions (visual 40 / small 32, touch target 48) are PROPOSALS, not verified Material 3 specifications.

export type AwaIconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

export type AwaIconButtonProps = Omit<PressableProps, 'children' | 'accessibilityLabel'> & {
  icon: AwaIconName;
  accessibilityLabel: string;
  variant?: AwaIconButtonVariant;
  size?: 'small' | 'medium';
  /** Toggle state; also exposed as `accessibilityState.selected`. */
  selected?: boolean;
  /** Glyph size override (number or token). Default `md` (24) for medium, 20 for small. */
  iconSize?: number;
};

export function AwaIconButton({
  icon,
  accessibilityLabel,
  variant = 'standard',
  size = 'medium',
  selected = false,
  iconSize,
  disabled,
  hitSlop,
  style,
  accessibilityState,
  ...rest
}: AwaIconButtonProps): React.JSX.Element {
  const {roles} = useAwaTokens();
  const visual = size === 'small' ? 32 : AWA_COMPONENT_DIMENSION_PROPOSALS.iconButtonVisual.value;
  const glyph = iconSize ?? (size === 'small' ? 20 : 24);

  let background: string | undefined;
  let foreground = roles.accessible.onSurfaceVariant;
  let borderColor: string | undefined;
  if (variant === 'filled') {
    background = roles.primary;
    foreground = roles.onPrimary;
  } else if (variant === 'tonal' || selected) {
    background = roles.primaryContainer;
    foreground = roles.onPrimaryContainer;
  } else if (variant === 'outlined') {
    borderColor = roles.outline;
  }
  if (disabled) {
    foreground = withAlpha(roles.onSurface, 0.38);
    background = background ? withAlpha(roles.onSurface, 0.12) : undefined;
    borderColor = borderColor ? withAlpha(roles.onSurface, 0.12) : undefined;
  }

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{...accessibilityState, disabled: Boolean(disabled), selected}}
      disabled={disabled}
      hitSlop={hitSlop ?? touchTargetHitSlop(visual)}
      style={state => [
        {
          width: visual,
          height: visual,
          borderRadius: awaShapes.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderWidth: borderColor ? 1 : 0,
          borderColor,
        },
        state.pressed && !disabled ? pressedStyle(background, foreground) : null,
        resolvePressableStyle(style, state),
      ]}>
      <AwaIcon color={foreground} decorative name={icon} size={glyph} />
    </Pressable>
  );
}
