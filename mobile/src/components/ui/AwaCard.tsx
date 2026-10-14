import React from 'react';
import {Pressable, View, type PressableProps, type ViewProps} from 'react-native';

import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../theme/componentDimensions';
import {awaShapes, type AwaShapeToken} from '../../theme/shapes';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {pressedStyle, resolvePressableStyle} from './pressFeedback';

// AwaCard — a container. Without `onPress` it is a plain native View (no role, no handlers, no extra node); with
// `onPress` it is a single native Pressable with accessibilityRole="button".
//
// DISCOURAGED (documented, not enforced — decision D10): a card inside a card, a card that also carries its own glow /
// gradient / shadow wrapper, and an interactive card that contains other pressables. Use ONE surface per group of
// related information and separate rows with dividers instead.
//
// Variants map onto AWA's existing surfaces: `elevated` = `surface` + the theme shadow (today's white cards),
// `filled` = `surfaceContainer`, `outlined` = `surface` + `outlineVariant` border. The corner is the `medium` token
// (12) by default; `shape` accepts a legacy radius such as homeRadii.card (26) while a screen is migrated.

export type AwaCardVariant = 'elevated' | 'filled' | 'outlined';
export type AwaCardPadding = 'none' | 'compact' | 'default';

export type AwaCardProps = ViewProps & {
  variant?: AwaCardVariant;
  padding?: AwaCardPadding;
  shape?: AwaShapeToken | number;
  /** Makes the card a single Pressable button. */
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
  children?: React.ReactNode;
};

const PADDING: Record<AwaCardPadding, number> = {none: 0, compact: 12, default: 16};

export function AwaCard({
  variant = 'elevated',
  padding = 'default',
  shape,
  onPress,
  disabled,
  style,
  children,
  accessibilityState,
  ...rest
}: AwaCardProps): React.JSX.Element {
  const {roles, theme} = useAwaTokens();
  const radius =
    typeof shape === 'number'
      ? shape
      : shape !== undefined
        ? awaShapes[shape]
        : AWA_COMPONENT_DIMENSION_PROPOSALS.cardShape.radius;

  let background: string = roles.surface;
  let borderColor: string | undefined;
  if (variant === 'filled') {
    background = roles.surfaceContainer;
  } else if (variant === 'outlined') {
    borderColor = roles.outlineVariant;
  }

  const base = [
    {
      backgroundColor: background,
      borderRadius: radius,
      padding: PADDING[padding],
      borderWidth: borderColor ? 1 : 0,
      borderColor,
    },
    variant === 'elevated' ? theme.shadow : null,
  ] as const;

  if (!onPress) {
    return (
      <View {...rest} accessibilityState={accessibilityState} style={[...base, style]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      {...(rest as PressableProps)}
      accessibilityState={{...accessibilityState, disabled: Boolean(disabled)}}
      disabled={disabled}
      onPress={onPress}
      style={state => [
        ...base,
        state.pressed && !disabled ? pressedStyle(background, roles.onSurface) : null,
        resolvePressableStyle(style as PressableProps['style'], state),
      ]}>
      {children}
    </Pressable>
  );
}
