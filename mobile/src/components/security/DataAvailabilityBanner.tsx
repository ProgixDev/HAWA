import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../../i18n';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useStructuredDataAvailability} from '../../hooks/useStructuredDataAvailability';

// Shown above every main screen while protected records cannot be read. It says only what is true — the records were
// not deleted or changed — and points to the recovery options. Invisible (renders nothing) the rest of the time.

export default function DataAvailabilityBanner(): React.JSX.Element | null {
  const {anyUnavailable} = useStructuredDataAvailability();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<{navigate: (route: 'DataRecovery') => void}>();
  if (!anyUnavailable) {return null;}
  return (
    <View pointerEvents="box-none" style={[styles.wrap, {top: insets.top + 6}]}>
      <AwaCard onPress={() => navigation.navigate('DataRecovery')} padding="compact" style={styles.banner} variant="elevated">
        <MaterialDesignIcons color={theme.colors.warning} name="lock-alert-outline" size={22} />
        <View style={styles.copy}>
          <AwaText variant="titleSmall">{t('dataSafety.banner.title')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('dataSafety.banner.body')}</AwaText>
        </View>
        <AwaText colorRole="primary" emphasized variant="labelLarge">{t('dataSafety.banner.action')}</AwaText>
      </AwaCard>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    wrap: {position: 'absolute', left: 12, right: 12, zIndex: 50},
    banner: {flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: withAlpha(theme.colors.warning, 0.45)},
    copy: {flex: 1, minWidth: 0},
  });
}
