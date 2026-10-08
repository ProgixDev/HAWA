import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../../i18n';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
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
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('DataRecovery')} style={styles.banner}>
        <MaterialDesignIcons color={theme.colors.warning} name="lock-alert-outline" size={22} />
        <View style={styles.copy}>
          <Text style={styles.title}>{t('dataSafety.banner.title')}</Text>
          <Text style={styles.body}>{t('dataSafety.banner.body')}</Text>
        </View>
        <Text style={styles.action}>{t('dataSafety.banner.action')}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    wrap: {position: 'absolute', left: 12, right: 12, zIndex: 50},
    banner: {...theme.shadow, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: withAlpha(theme.colors.warning, 0.45), backgroundColor: theme.colors.surface, paddingVertical: 10, paddingHorizontal: 12},
    copy: {flex: 1, minWidth: 0},
    title: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
    body: {color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    action: {color: theme.colors.primary, fontSize: 12.5, fontWeight: '800'},
  });
}
