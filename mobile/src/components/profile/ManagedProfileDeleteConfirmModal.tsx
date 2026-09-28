import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
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

  const destructiveText = pickReadableTextColor(theme.colors.danger);

  return (
    <Modal animationType="fade" onRequestClose={cancel} statusBarTranslucent transparent visible={profile !== null}>
      <View
        style={[
          styles.root,
          {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)},
        ]}>
        <Pressable
          accessibilityLabel="Fermer sans supprimer"
          accessibilityRole="button"
          onPress={cancel}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.content}>
            <View importantForAccessibility="no-hide-descendants" style={styles.iconCircle}>
              <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={26} />
            </View>

            <Text accessibilityRole="header" style={styles.title}>Supprimer ce profil ?</Text>

            {shown ? (
              <>
                <Text style={styles.body}>Voulez-vous vraiment supprimer le profil de {shown.firstName} ?</Text>
                <Text style={styles.reassurance}>
                  Les informations enregistrées pour ce profil seront supprimées.
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Annuler"
              accessibilityRole="button"
              accessibilityState={{disabled: deleting}}
              disabled={deleting}
              onPress={cancel}
              style={({pressed}) => [styles.button, styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={shown ? `Confirmer la suppression du profil de ${shown.firstName}` : 'Confirmer la suppression'}
              accessibilityRole="button"
              accessibilityState={{disabled: deleting, busy: deleting}}
              disabled={deleting}
              onPress={confirm}
              style={({pressed}) => [styles.button, styles.deleteButton, (pressed || deleting) && styles.pressed]}>
              <Text style={[styles.deleteText, {color: destructiveText}]}>
                {deleting ? 'Suppression…' : 'Supprimer le profil'}
              </Text>
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
      borderColor: withAlpha(theme.colors.danger, 0.3),
      backgroundColor: withAlpha(theme.colors.danger, 0.12),
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
    reassurance: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
    actions: {flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20},
    button: {
      flex: 1,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    cancelButton: {borderWidth: 1.4, borderColor: theme.colors.primary, backgroundColor: theme.colors.surface},
    cancelText: {color: theme.colors.primary, fontSize: 15, fontWeight: '700', textAlign: 'center'},
    deleteButton: {backgroundColor: theme.colors.danger},
    deleteText: {fontSize: 15, fontWeight: '700', textAlign: 'center'},
    pressed: {opacity: 0.85},
  });
}

export default memo(ManagedProfileDeleteConfirmModal);
