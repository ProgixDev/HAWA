import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type TextStyle} from 'react-native';

import {withAlpha} from '../../theme/awaThemeTokens';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../theme/componentDimensions';
import {awaShapes, type AwaShapeToken} from '../../theme/shapes';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaIcon, type AwaIconName} from './AwaIcon';
import {AwaText} from './AwaText';
import {pressedStyle, resolvePressableStyle} from './pressFeedback';
import type {AwaLegacyWeight} from './types';

// AwaButton — a NATIVE Pressable. Press feedback is a state layer folded into the pressable's own background (decision
// D2: no ripple, no overlay view, no nested Pressable). `disabled` and `loading` make the control inert (onPress is
// not called) and are exposed through accessibilityState.
//
// Heights come from componentDimensions PROPOSALS: `compact` (40) mirrors the published Material 3 container height
// (unverified); `default` (48) and `large` (56) are AWA decisions. `minHeight` overrides them for a screen that has to
// keep its current CTA height while it is migrated (decision D7).

const styles = StyleSheet.create({
  iconStart: {marginRight: 8},
  iconEnd: {marginLeft: 8},
  label: {flexShrink: 1, textAlign: 'center'},
});

export type AwaButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'destructive';
export type AwaButtonSize = 'compact' | 'default' | 'large';

export type AwaButtonProps = Omit<PressableProps, 'children' | 'disabled' | 'accessibilityLabel'> & {
  label: string;
  variant?: AwaButtonVariant;
  size?: AwaButtonSize;
  icon?: AwaIconName;
  trailingIcon?: AwaIconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretches to the parent's width. */
  fullWidth?: boolean;
  /** Legacy minimum height (documented override). */
  minHeight?: number;
  /** A shape token or a legacy radius. Default `full` (pill). */
  shape?: AwaShapeToken | number;
  /** Legacy label weight override. */
  weight?: AwaLegacyWeight;
  /**
   * Opt-in label text style, applied after the `labelLarge` role (e.g. an AWA-specific larger CTA label). Unset =
   * the standard Material 3 label, so no existing call site changes.
   */
  labelStyle?: StyleProp<TextStyle>;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
};

export function AwaButton({
  label,
  variant = 'filled',
  size = 'default',
  icon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  minHeight,
  shape = 'full',
  weight,
  labelStyle,
  accessibilityLabel,
  accessibilityState,
  style,
  ...rest
}: AwaButtonProps): React.JSX.Element {
  const {roles} = useAwaTokens();
  const inert = disabled || loading;
  const heights = AWA_COMPONENT_DIMENSION_PROPOSALS.button;

  let background: string | undefined;
  let content: string;
  let borderColor: string | undefined;
  switch (variant) {
    case 'filled':
      background = roles.primary;
      content = roles.onPrimary;
      break;
    case 'tonal':
      background = roles.primaryContainer;
      content = roles.onPrimaryContainer;
      break;
    case 'outlined':
      content = roles.accessible.primaryAsText;
      borderColor = roles.outline;
      break;
    case 'destructive':
      content = roles.accessible.dangerText;
      borderColor = withAlpha(roles.error, 0.35);
      break;
    default:
      content = roles.accessible.primaryAsText;
  }
  if (disabled) {
    content = withAlpha(roles.onSurface, 0.38);
    background = background ? withAlpha(roles.onSurface, 0.12) : undefined;
    borderColor = borderColor ? withAlpha(roles.onSurface, 0.12) : undefined;
  }

  const radius = typeof shape === 'number' ? shape : awaShapes[shape];

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{...accessibilityState, disabled: inert, busy: loading || undefined}}
      disabled={inert}
      style={state => [
        {
          minHeight: minHeight ?? heights[size],
          borderRadius: radius,
          paddingHorizontal: size === 'compact' ? 16 : 24,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : undefined,
          backgroundColor: background,
          borderWidth: borderColor ? 1 : 0,
          borderColor,
        },
        state.pressed && !inert ? pressedStyle(background, content) : null,
        resolvePressableStyle(style, state),
      ]}>
      {loading ? (
        <ActivityIndicator color={content} size="small" style={styles.iconStart} />
      ) : icon ? (
        <AwaIcon color={content} decorative name={icon} size="sm" style={styles.iconStart} />
      ) : null}
      <AwaText color={content} variant="labelLarge" style={[styles.label, labelStyle]} weight={weight}>
        {label}
      </AwaText>
      {trailingIcon && !loading ? (
        <AwaIcon color={content} decorative name={trailingIcon} size="sm" style={styles.iconEnd} />
      ) : null}
    </Pressable>
  );
}
