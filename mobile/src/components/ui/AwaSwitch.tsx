import React from 'react';
import {Switch, type SwitchProps} from 'react-native';

import {useAwaTokens} from '../../theme/useAwaTokens';

// AwaSwitch — wraps the NATIVE RN `Switch` (one host node; every SwitchProps prop, ref and callback is forwarded).
//
// HONEST LIMITATION: the native Android Switch cannot be drawn as the 52 x 32 Material 3 switch (no outline, no icon
// in the thumb, fixed metrics). This component only controls colours, so it is "Material 3-inspired", not a full M3
// switch. A custom control would be a separate, explicit decision.
//
// Appearance (decision D6):
//   'accessible' (default) — off track = `outline` (>= 3:1 on surface, checked by the tests), on track = `primary`,
//                            thumb = `surface` when off and `onPrimary` when on, so the thumb always contrasts.
//   'legacy'               — the pairing most screens use today: track { false: primarySoft, true: primary },
//                            thumb = surface. Its off state is only ~1.1:1 against the surface, which is why it is not
//                            the default.
// Colours passed by the caller always win.

export type AwaSwitchProps = Omit<SwitchProps, 'accessibilityLabel'> & {
  /** REQUIRED: a switch without a name is unusable with a screen reader. */
  accessibilityLabel: string;
  appearance?: 'accessible' | 'legacy';
};

export const AwaSwitch = React.forwardRef<Switch, AwaSwitchProps>(function AwaSwitch(
  {appearance = 'accessible', accessibilityState, value, disabled, trackColor, thumbColor, ios_backgroundColor, ...rest},
  ref,
) {
  const {roles, theme} = useAwaTokens();
  const legacy = appearance === 'legacy';
  const defaultTrack = legacy
    ? {false: roles.primaryContainer, true: roles.primary}
    : {false: roles.outline, true: roles.primary};
  const defaultThumb = legacy ? roles.surface : value ? roles.onPrimary : roles.surface;
  return (
    <Switch
      accessibilityRole="switch"
      ref={ref}
      {...rest}
      accessibilityState={{...accessibilityState, checked: Boolean(value), disabled: Boolean(disabled)}}
      disabled={disabled}
      ios_backgroundColor={ios_backgroundColor ?? (legacy ? theme.colors.surfaceSecondary : roles.outline)}
      thumbColor={thumbColor ?? defaultThumb}
      trackColor={trackColor ?? defaultTrack}
      value={value}
    />
  );
});
