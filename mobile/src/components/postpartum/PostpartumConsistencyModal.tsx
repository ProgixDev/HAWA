import React, { useMemo } from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';

import { useAwaTheme } from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import '../../i18n';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';

// Shared warning/confirmation dialog for Postpartum's date-consistency
// checks — "Date à vérifier" (Retour du cycle) and "Vérifie ton suivi"
// (Lochies). Previously hardcoded to fixed light-mode hex colors regardless
// of theme, so it rendered as a bright light-mode card even in Dark mode —
// now derives every surface/text/icon color from the same resolved AWA
// theme its two callers already use for their own inline modals (mirrors
// PostpartumCycleReturnScreen.tsx's helpModalCard / PostpartumLochiaScreen's
// confirmModalCard exactly), so it always matches Light/Dark/True Black and
// every palette automatically.
type Props = {
  visible: boolean;
  title: string;
  message: string;
  infoText: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onRequestClose: () => void;
};

export function PostpartumConsistencyModal({
  visible,
  title,
  message,
  infoText,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onRequestClose,
}: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedSecondaryLabel = secondaryLabel ?? t('common.cancel');

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={t('postpartumConsistencyModal.closeBackdropLabel')}
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
        <AwaCard padding="none" variant="elevated" accessibilityRole="alert" style={styles.card}>
          <View style={styles.icon}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="alert-circle-outline"
              size={36}
            />
          </View>
          <AwaText variant="headlineSmall" style={styles.title}>{title}</AwaText>
          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.message}>{message}</AwaText>
          <View style={styles.info}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="information-outline"
              size={19}
            />
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{infoText}</AwaText>
          </View>
          <AwaButton
            accessibilityLabel={primaryLabel}
            accessibilityRole="button"
            onPress={onPrimary}
            label={primaryLabel}
            style={styles.primary}
          />
          <AwaButton
            accessibilityLabel={resolvedSecondaryLabel}
            accessibilityRole="button"
            onPress={onSecondary}
            label={resolvedSecondaryLabel}
            variant="tonal"
            style={styles.secondary}
          />
        </AwaCard>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    // Fixed — a modal dim/scrim, not a surface; overlay dims stay dark
    // regardless of the resolved theme so the sheet above it always pops,
    // matching every other Postpartum modal's own overlay in this app.
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 21,
      backgroundColor: 'rgba(34,20,69,0.40)',
    },
    card: {width: '100%', maxWidth: 390, padding: 23},
    icon: {
      width: 70,
      height: 70,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 35,
      backgroundColor: theme.colors.primarySoft,
    },
    title: {marginTop: 15, textAlign: 'center'},
    message: {marginTop: 10, textAlign: 'center'},
    info: {
      marginTop: 18,
      flexDirection: 'row',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      padding: 13,
    },
    infoText: {flex: 1},
    primary: {marginTop: 20},
    secondary: {marginTop: 7},
  });
}
