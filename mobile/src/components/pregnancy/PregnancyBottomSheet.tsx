import React, {useMemo} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Shared chrome of the two small sheets opened from the "+" button of the pregnancy objective ("Que veux-tu faire ?" and "Journal du jour"):
// a dimmed backdrop that closes it, a rounded sheet with a handle, and the rows (icon in a small rounded square, title, subtitle, chevron).

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
};

export function PregnancyBottomSheet({visible, onClose, accessibilityLabel, children}: SheetProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" navigationBarTranslucent onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 12) + 4}]}>
          <View style={styles.handle} />
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type RowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
};

/** A row of a sheet card: the rows of one card are separated by a thin line. */
export function PregnancySheetRow({icon, title, subtitle, onPress, last}: RowProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}>
      <View style={styles.iconTile}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.copy}>
        <AwaText style={styles.title} variant="titleSmall">{title}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{subtitle}</AwaText>
      </View>
      <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
    </Pressable>
  );
}

export function PregnancySheetCard({children}: {children: React.ReactNode}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.card}>{children}</View>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, justifyContent: 'flex-end'},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.colors.background, 0.7)},
    sheet: {
      maxHeight: '85%',
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: withAlpha(theme.colors.primary, 0.14),
      backgroundColor: theme.colors.surface,
    },
    handle: {alignSelf: 'center', width: 36, height: 4, marginBottom: 12, borderRadius: 2, backgroundColor: theme.colors.border},
    card: {
      overflow: 'hidden',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      backgroundColor: theme.colors.surfaceSecondary,
    },
    row: {minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10},
    rowDivider: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
    rowPressed: {backgroundColor: withAlpha(theme.colors.primary, 0.08)},
    iconTile: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: withAlpha(theme.colors.primary, 0.14),
    },
    copy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    title: {fontSize: 13, lineHeight: 18},
    subtitle: {marginTop: 2, fontSize: 11, lineHeight: 15},
  });
}
