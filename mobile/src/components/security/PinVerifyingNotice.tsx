import React from 'react';
import {ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaText} from '../ui/AwaText';

// Shown in the status line of the private-PIN screens while the code is being checked or saved: the PBKDF2 derivation takes about half a second
// (up to ~1.1 s on the first call of a session, measured on a physical Android), and without it the screen looks frozen. It replaces the error line
// (same slot, same height); the keypad is already locked by the screens' own busy guard.
export function PinVerifyingNotice({style}: {style?: StyleProp<ViewStyle>}) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityState={{busy: true}}
      style={[styles.row, style]}>
      <ActivityIndicator color={theme.colors.accent} size="small" />
      <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
        {t('appLock.verifying')}
      </AwaText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {alignItems: 'center', columnGap: 8, flexDirection: 'row', justifyContent: 'center', minHeight: 28, marginTop: 8},
});
