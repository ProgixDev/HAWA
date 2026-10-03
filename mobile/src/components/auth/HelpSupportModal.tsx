import React, {memo, useMemo} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * AWA's own styled "Need help?" dialog — replaces a native Alert.alert that
 * used to fire from ForgotPasswordScreen.tsx's "Besoin d'aide ?" row. Same
 * visual template as ManagedProfileDeleteConfirmModal.tsx/
 * QadaaDeleteConfirmModal.tsx (icon circle, serif title, rounded theme-aware
 * surface, backdrop + Android Back both dismiss), simplified to a single
 * informational CTA since there is nothing here to confirm or cancel.
 */
function HelpSupportModal({visible, onClose}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View
        style={[
          styles.root,
          {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)},
        ]}>
        <Pressable
          accessibilityLabel={t('auth.forgotPassword.helpModalCloseAccessibility')}
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.content}>
            <View importantForAccessibility="no-hide-descendants" style={styles.iconCircle}>
              <MaterialDesignIcons color={theme.colors.primary} name="headset" size={26} />
            </View>

            <Text accessibilityRole="header" style={styles.title}>{t('auth.forgotPassword.helpTitle')}</Text>
            <Text style={styles.body}>{t('auth.forgotPassword.helpAlertMessage')}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t('auth.forgotPassword.helpModalCta')}
              accessibilityRole="button"
              onPress={onClose}
              style={({pressed}) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>{t('auth.forgotPassword.helpModalCta')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.5)},
    card: {
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
      borderRadius: homeRadii.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      elevation: 12,
    },
    content: {alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8},
    iconCircle: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.3),
      backgroundColor: theme.colors.primarySoft,
    },
    title: {
      marginTop: 14,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 21,
      fontWeight: '700',
      lineHeight: 27,
      textAlign: 'center',
    },
    body: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center'},
    actions: {paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20},
    button: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    buttonText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700', textAlign: 'center'},
    pressed: {opacity: 0.85},
  });
}

export default memo(HelpSupportModal);
