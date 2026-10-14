import React, {useCallback, useState} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputFocusEventData,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import {withAlpha} from '../../theme/awaThemeTokens';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../theme/componentDimensions';
import {awaShapes} from '../../theme/shapes';
import {AWA_TYPESCALE} from '../../theme/typescale';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaIcon, type AwaIconName} from './AwaIcon';
import {AwaIconButton} from './AwaIconButton';
import {AwaText} from './AwaText';

// AwaTextField — a labelled field around the NATIVE RN `TextInput` (decision D5: the label sits ABOVE the field, as in
// today's LabeledInput; no floating label yet).
//
// Preserved on purpose:
//   * every TextInput prop reaches the TextInput unchanged (keyboardType, secureTextEntry, maxLength, multiline,
//     autoCapitalize, autoCorrect, autoComplete, textContentType, returnKeyType, onSubmitEditing, editable, …);
//   * the ref is forwarded to the TextInput (focus chaining);
//   * `onFocus` / `onBlur` / `onChangeText` are COMPOSED with the component's own bookkeeping, never replaced;
//   * `accessibilityLabel` defaults to the visible `label` (what LabeledInput does);
//   * nothing about secure entry, autofill hints or keyboard behaviour is defaulted or altered.
// Helper and error text are exposed through a polite live region; an error is never conveyed by colour alone.
//
// Dimensions (min height 56, radius `medium`) are PROPOSALS from componentDimensions.ts.

const styles = StyleSheet.create({
  label: {marginBottom: 6},
  box: {flexDirection: 'row', paddingHorizontal: 14},
  input: {flex: 1, minWidth: 0, fontSize: AWA_TYPESCALE.bodyLarge.fontSize},
  iconStart: {marginRight: 10},
  iconEnd: {marginLeft: 10},
  supportRow: {flexDirection: 'row', marginTop: 4, paddingHorizontal: 4},
  supportLive: {flex: 1, flexDirection: 'row', alignItems: 'flex-start'},
  supportText: {flex: 1},
  errorIcon: {marginRight: 4, marginTop: 2},
  counter: {marginLeft: 12},
});

export type AwaTextFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
  errorText?: string;
  variant?: 'outlined' | 'filled';
  leadingIcon?: AwaIconName;
  trailingIcon?: AwaIconName;
  onTrailingIconPress?: () => void;
  /** Required when `onTrailingIconPress` is given (an icon-only button needs a name). */
  trailingIconAccessibilityLabel?: string;
  /** Shows "length/maxLength" under the field (only when `maxLength` is set). */
  showCounter?: boolean;
  /** Style of the field box (border, background). `style` still applies to the TextInput, as in LabeledInput. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style of the outermost wrapper. */
  wrapperStyle?: StyleProp<ViewStyle>;
};

export const AwaTextField = React.forwardRef<TextInput, AwaTextFieldProps>(function AwaTextField(
  {
    label,
    helperText,
    errorText,
    variant = 'outlined',
    leadingIcon,
    trailingIcon,
    onTrailingIconPress,
    trailingIconAccessibilityLabel,
    showCounter = false,
    containerStyle,
    wrapperStyle,
    style,
    editable,
    multiline,
    maxLength,
    value,
    defaultValue,
    onFocus,
    onBlur,
    onChangeText,
    accessibilityLabel,
    accessibilityState,
    placeholderTextColor,
    ...rest
  },
  ref,
) {
  const {roles} = useAwaTokens();
  const [focused, setFocused] = useState(false);
  const [typedLength, setTypedLength] = useState((value ?? defaultValue ?? '').length);

  const handleFocus = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );
  const handleBlur = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );
  const handleChangeText = useCallback(
    (text: string) => {
      setTypedLength(text.length);
      onChangeText?.(text);
    },
    [onChangeText],
  );

  const disabled = editable === false;
  const hasError = Boolean(errorText);
  const length = value !== undefined ? value.length : typedLength;

  const borderColor = hasError
    ? roles.error
    : focused
      ? roles.primary
      : disabled
        ? withAlpha(roles.onSurface, 0.12)
        : roles.outline;
  const background = variant === 'filled' ? roles.surfaceContainerHigh : undefined;
  const textColor = disabled ? withAlpha(roles.onSurface, 0.38) : roles.onSurface;
  const supporting = hasError ? errorText : helperText;
  const counterVisible = showCounter && typeof maxLength === 'number';
  const minHeight = AWA_COMPONENT_DIMENSION_PROPOSALS.textFieldHeight.value;
  const alignItems = multiline ? 'flex-start' : 'center';
  const borderWidth = variant === 'filled' && !focused && !hasError ? 0 : 1;
  const paddingVertical = multiline ? 12 : 8;
  const textAlignVertical = multiline ? 'top' : 'center';

  return (
    <View style={wrapperStyle}>
      <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium" style={styles.label}>
        {label}
      </AwaText>
      <View
        style={[
          styles.box,
          {
            minHeight: multiline ? Math.max(minHeight, 96) : minHeight,
            alignItems,
            borderRadius: awaShapes.medium,
            borderWidth,
            borderColor,
            backgroundColor: background,
          },
          containerStyle,
        ]}>
        {leadingIcon ? <AwaIcon decorative name={leadingIcon} size="sm" style={styles.iconStart} /> : null}
        <TextInput
          {...rest}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{...accessibilityState, disabled}}
          defaultValue={defaultValue}
          editable={editable}
          maxLength={maxLength}
          multiline={multiline}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholderTextColor={placeholderTextColor ?? roles.accessible.onSurfaceVariant}
          ref={ref}
          style={[
            styles.input,
            {
              color: textColor,
              paddingVertical,
              textAlignVertical,
            },
            style,
          ]}
          value={value}
        />
        {trailingIcon && onTrailingIconPress ? (
          <AwaIconButton
            accessibilityLabel={trailingIconAccessibilityLabel ?? trailingIcon}
            icon={trailingIcon}
            iconSize={20}
            onPress={onTrailingIconPress}
            size="small"
          />
        ) : trailingIcon ? (
          <AwaIcon decorative name={trailingIcon} size="sm" style={styles.iconEnd} />
        ) : null}
      </View>
      {supporting || counterVisible ? (
        <View style={styles.supportRow}>
          {supporting ? (
            <View accessibilityLiveRegion="polite" style={styles.supportLive}>
              {hasError ? (
                <AwaIcon colorRole="error" decorative name="alert-circle-outline" size="xs" style={styles.errorIcon} />
              ) : null}
              <AwaText colorRole={hasError ? 'error' : 'onSurfaceVariant'} variant="bodySmall" style={styles.supportText}>
                {supporting}
              </AwaText>
            </View>
          ) : (
            <View style={styles.supportText} />
          )}
          {counterVisible ? (
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.counter}>
              {`${length}/${maxLength}`}
            </AwaText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});
