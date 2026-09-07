import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';

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
  secondaryLabel = 'Annuler',
  onPrimary,
  onSecondary,
  onRequestClose,
}: Props): React.JSX.Element {
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
          accessibilityLabel="Fermer l’avertissement"
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityRole="alert" style={styles.card}>
          <View style={styles.icon}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="alert-circle-outline"
              size={36}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.info}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="information-outline"
              size={19}
            />
            <Text style={styles.infoText}>{infoText}</Text>
          </View>
          <Pressable
            accessibilityLabel={primaryLabel}
            accessibilityRole="button"
            onPress={onPrimary}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>{primaryLabel}</Text>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="arrow-right" size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel={secondaryLabel}
            accessibilityRole="button"
            onPress={onSecondary}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </Pressable>
        </View>
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
    card: {
      width: '100%',
      maxWidth: 390,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 23,
      shadowColor: theme.shadow.shadowColor,
      shadowOpacity: 0.25,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    icon: {
      width: 70,
      height: 70,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 35,
      backgroundColor: theme.colors.primarySoft,
    },
    title: {
      marginTop: 15,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 25,
      fontWeight: '800',
      textAlign: 'center',
    },
    message: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
    info: {
      marginTop: 18,
      flexDirection: 'row',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      padding: 13,
    },
    infoText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
    primary: {
      height: 51,
      marginTop: 20,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOpacity: 0.2,
      shadowRadius: 9,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    primaryText: { color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '800' },
    secondary: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 7,
      borderRadius: 15,
      backgroundColor: theme.colors.primarySoft,
    },
    secondaryText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    pressed: { opacity: 0.85 },
  });
}
