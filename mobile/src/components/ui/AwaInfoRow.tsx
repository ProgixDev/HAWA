import React from 'react';
import {Pressable, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';


import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../theme/componentDimensions';
import {awaShapes} from '../../theme/shapes';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaIcon, type AwaIconName} from './AwaIcon';
import {AwaText} from './AwaText';
import {pressedStyle, resolvePressableStyle} from './pressFeedback';

// AwaInfoRow — a list / settings row: optional icon tile, title, supporting text, status, trailing slot.
// Without `onPress` it is a plain native View (no role). With `onPress` it is ONE native Pressable with
// accessibilityRole="button" whose label is `accessibilityLabel ?? title`; the trailing slot is rendered as-is, so a
// caller that puts its own control there (a Switch) should leave `onPress` unset and let that control own the touch.
//
// The optional `accentColor` draws the thin leading accent bar some AWA lists use today (decision D9); it is a brand
// colour supplied by the caller, never derived here.

const styles = StyleSheet.create({
  accent: {position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2},
  tile: {width: 40, height: 40, marginRight: 12, alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1, minWidth: 0},
  chevron: {marginLeft: 8},
  trailing: {marginLeft: 12},
});

export type AwaInfoRowTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export type AwaInfoRowProps = {
  title: string;
  subtitle?: string;
  /** Short status text under the subtitle (e.g. "Enabled"). */
  status?: string;
  icon?: AwaIconName;
  iconTone?: AwaInfoRowTone;
  /** 'chevron' (default when `onPress` is set), 'none', or any node (a value, a Switch …). */
  trailing?: 'chevron' | 'none' | React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Hides the bottom divider (last row of a group). */
  last?: boolean;
  /** Draws a thin leading accent bar in this colour. */
  accentColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function AwaInfoRow({
  title,
  subtitle,
  status,
  icon,
  iconTone = 'default',
  trailing,
  onPress,
  disabled = false,
  last = false,
  accentColor,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: AwaInfoRowProps): React.JSX.Element {
  const {roles} = useAwaTokens();
  const minHeight = AWA_COMPONENT_DIMENSION_PROPOSALS.listItemOneLineMinHeight.value;

  const tones: Record<AwaInfoRowTone, {background: string; foreground: string}> = {
    default: {background: roles.surfaceContainerHigh, foreground: roles.accessible.onSurfaceVariant},
    primary: {background: roles.primaryContainer, foreground: roles.onPrimaryContainer},
    success: {background: roles.successContainer, foreground: roles.onSuccessContainer},
    warning: {background: roles.warningContainer, foreground: roles.onWarningContainer},
    danger: {background: roles.errorContainer, foreground: roles.onErrorContainer},
  };
  const tone = tones[iconTone];
  const showChevron = trailing === 'chevron' || (trailing === undefined && Boolean(onPress));

  const rowStyle: ViewStyle = {
    minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: roles.outlineVariant,
    opacity: disabled ? 0.6 : 1,
  };

  const content = (
    <>
      {accentColor ? (
        <View pointerEvents="none" style={[styles.accent, {backgroundColor: accentColor}]} />
      ) : null}
      {icon ? (
        <View style={[styles.tile, {borderRadius: awaShapes.medium, backgroundColor: tone.background}]}>
          <AwaIcon color={tone.foreground} decorative name={icon} size="md" />
        </View>
      ) : null}
      <View style={styles.copy}>
        <AwaText colorRole="onSurface" variant="bodyLarge">
          {title}
        </AwaText>
        {subtitle ? (
          <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">
            {subtitle}
          </AwaText>
        ) : null}
        {status ? (
          <AwaText colorRole="primary" emphasized variant="labelMedium">
            {status}
          </AwaText>
        ) : null}
      </View>
      {showChevron ? <AwaIcon decorative name="chevron-right" size="md" style={styles.chevron} /> : null}
      {trailing !== undefined && trailing !== 'chevron' && trailing !== 'none' ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View accessibilityHint={accessibilityHint} accessibilityLabel={accessibilityLabel} style={[rowStyle, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={state => [
        rowStyle,
        state.pressed && !disabled ? pressedStyle(undefined, roles.onSurface) : null,
        resolvePressableStyle(style, state),
      ]}
      testID={testID}>
      {content}
    </Pressable>
  );
}
