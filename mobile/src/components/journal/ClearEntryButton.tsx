import React, {useMemo, useState} from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import '../../i18n';

// M25 - shared "Effacer cette saisie" action for journal entry screens whose
// saved value could not be removed once written. It only asks for a
// confirmation; the caller persists the canonical empty state (the section is
// removed from that day's entry via deleteJournalSection - every
// DailyJournalEntry section is optional, so "absent" already is the empty
// state) and refreshes its own screen. Rendered only when a saved value
// exists for the day.
//
// The confirmation is an in-app dialog (same template as QadaaDeleteConfirmModal /
// ManagedProfileDeleteConfirmModal) instead of a native Alert, so it follows the
// AWA theme in every palette and in Light / Dark / True Black. Backdrop tap, Android
// Back and "Annuler" close it without clearing anything.

type Props = {
  /** Called only after the user confirms. */
  onConfirm: () => void | Promise<void>;
  /** What is being cleared, for the confirmation copy (e.g. "cette température"). */
  subject: string;
};

export function ClearEntryButton({onConfirm, subject}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const confirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      <AwaButton
        accessibilityLabel={t('clearEntryButton.clearThisEntry')}
        fullWidth
        icon="trash-can-outline"
        label={t('clearEntryButton.clearThisEntry')}
        onPress={() => setOpen(true)}
        style={styles.button}
        variant="destructive"
      />
      <Modal animationType="fade" onRequestClose={close} statusBarTranslucent transparent visible={open}>
        <View style={[styles.root, {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)}]}>
          <Pressable accessibilityLabel={t('common.cancel')} accessibilityRole="button" onPress={close} style={styles.backdrop} />
          <AwaCard accessibilityViewIsModal padding="none" shape="large" style={styles.card}>
            <View style={styles.content}>
              <View importantForAccessibility="no-hide-descendants" style={styles.iconCircle}>
                <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={26} />
              </View>
              <AwaText accessibilityRole="header" style={styles.title} variant="titleLarge">{t('clearEntryButton.confirmTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.message} variant="bodyMedium">{t('clearEntryButton.confirmMessage', {subject})}</AwaText>
            </View>
            <View style={styles.actions}>
              <AwaButton accessibilityLabel={t('common.cancel')} label={t('common.cancel')} onPress={close} style={styles.action} variant="outlined" />
              <AwaButton accessibilityLabel={t('clearEntryButton.clear')} label={t('clearEntryButton.clear')} onPress={confirm} style={styles.action} variant="destructive" />
            </View>
          </AwaCard>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    button: {marginTop: 4},
    root: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.5)},
    card: {width: '100%', maxWidth: 400, overflow: 'hidden', elevation: 12},
    content: {alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8},
    iconCircle: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.3),
      backgroundColor: withAlpha(theme.colors.danger, 0.12),
    },
    title: {marginTop: 16, textAlign: 'center'},
    message: {marginTop: 12, textAlign: 'center'},
    actions: {flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24},
    action: {flex: 1, paddingHorizontal: 12},
  });
}
