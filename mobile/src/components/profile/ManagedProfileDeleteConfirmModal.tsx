import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {ManagedProfile} from '../../state/managedProfilesStore';

type Props = {
  /** The managed (daughter) profile the mother asked to delete; null = dialog closed. */
  profile: ManagedProfile | null;
  /** Backdrop tap, Android Back or "Annuler": nothing is deleted. */
  onCancel: () => void;
  /** Only "Supprimer le profil" calls this. The caller deletes and closes the dialog. */
  onConfirm: (profile: ManagedProfile) => Promise<void> | void;
};

/**
 * Confirmation before removing ONE managed profile — same visual template as
 * QadaaDeleteConfirmModal.tsx (icon circle, serif title, danger-filled confirm
 * button), adapted for a ManagedProfile. It performs no deletion itself: the caller
 * passes managedProfilesStore's deleteManagedProfile through `onConfirm`, invoked at
 * most once per opening even on rapid double taps.
 */
function ManagedProfileDeleteConfirmModal({profile, onCancel, onConfirm}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  // Keeps the content while the fade-out animation plays after `profile` became null.
  const lastProfile = useRef<ManagedProfile | null>(profile);
  if (profile) {lastProfile.current = profile;}
  const shown = profile ?? lastProfile.current;

  useEffect(() => {
    if (profile) {
      deletingRef.current = false;
      setDeleting(false);
    }
  }, [profile]);

  const cancel = () => {
    if (deletingRef.current) {return;}
    onCancel();
  };

  const confirm = async () => {
    if (!profile || deletingRef.current) {return;}
    deletingRef.current = true;
    setDeleting(true);
    try {
      await onConfirm(profile);
    } catch {
      // The caller keeps the dialog open on a failure: allow another attempt.
      deletingRef.current = false;
      setDeleting(false);
    }
  };

  return (
    <Modal animationType="fade" onRequestClose={cancel} statusBarTranslucent transparent visible={profile !== null}>
      <View
        style={[
          styles.root,
          {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)},
        ]}>
        <Pressable
          accessibilityLabel={t('managedProfile.deleteModal.closeAccessibility')}
          accessibilityRole="button"
          onPress={cancel}
          style={styles.backdrop}
        />
        <AwaCard accessibilityViewIsModal padding="none" shape="large" style={styles.card}>
          <View style={styles.content}>
            <View importantForAccessibility="no-hide-descendants" style={styles.iconCircle}>
              <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={26} />
            </View>

            <AwaText accessibilityRole="header" style={styles.title} variant="titleLarge">{t('managedProfile.deleteModal.title')}</AwaText>

            {shown ? (
              <>
                <AwaText colorRole="onSurfaceVariant" style={styles.body} variant="bodyMedium">{t('managedProfile.deleteModal.body', {firstName: shown.firstName})}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.reassurance} variant="bodyMedium">
                  {t('managedProfile.deleteModal.reassurance')}
                </AwaText>
              </>
            ) : null}
          </View>

          <View style={styles.actions}>
            <AwaButton
              accessibilityLabel={t('managedProfile.deleteModal.cancelAccessibility')}
              disabled={deleting}
              label={t('managedProfile.deleteModal.cancelText')}
              onPress={cancel}
              style={styles.button}
              variant="outlined"
            />
            <AwaButton
              accessibilityLabel={shown ? t('managedProfile.deleteModal.confirmAccessibilityNamed', {firstName: shown.firstName}) : t('managedProfile.deleteModal.confirmAccessibility')}
              accessibilityState={{busy: deleting}}
              disabled={deleting}
              label={deleting ? t('managedProfile.deleteModal.deleting') : t('managedProfile.deleteModal.confirmText')}
              onPress={confirm}
              style={styles.button}
              variant="destructive"
            />
          </View>
        </AwaCard>
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
      borderColor: withAlpha(theme.colors.danger, 0.3),
      backgroundColor: withAlpha(theme.colors.danger, 0.12),
    },
    title: {marginTop: 16, textAlign: 'center'},
    body: {marginTop: 12, textAlign: 'center'},
    reassurance: {marginTop: 12, textAlign: 'center'},
    actions: {flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24},
    button: {flex: 1, paddingHorizontal: 12},
  });
}

export default memo(ManagedProfileDeleteConfirmModal);
