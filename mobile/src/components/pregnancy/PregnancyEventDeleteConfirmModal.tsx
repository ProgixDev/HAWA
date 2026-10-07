import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {PregnancyMedicalEventType} from '../../state/pregnancyMedicalEventsStore';

/** The minimal identity PregnancyEventForm.tsx needs to ask for a delete —
 * never the full PregnancyMedicalEvent, since the modal never reads/edits
 * the event itself, only confirms removing it by id. */
export type PendingPregnancyEventDelete = {
  id: string;
  type: PregnancyMedicalEventType;
};

type Props = {
  /** The exam/appointment the user asked to delete; null = dialog closed. */
  event: PendingPregnancyEventDelete | null;
  /** Backdrop tap, Android Back or "Annuler": nothing is deleted. */
  onCancel: () => void;
  /** Only "Supprimer" calls this. The caller deletes and closes the dialog. */
  onConfirm: (event: PendingPregnancyEventDelete) => Promise<void> | void;
};

/**
 * Confirmation before removing one pregnancy exam/appointment — replaces the
 * native Alert.alert previously used in PregnancyEventForm.tsx. Same visual
 * template as ManagedProfileDeleteConfirmModal.tsx/QadaaDeleteConfirmModal.tsx
 * (icon circle, serif title, danger-filled confirm button). It performs no
 * deletion itself: the caller passes deletePregnancyMedicalEvent + the
 * reminder cleanup through `onConfirm`, invoked at most once per opening even
 * on rapid double taps.
 */
function PregnancyEventDeleteConfirmModal({event, onCancel, onConfirm}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  // Keeps the content while the fade-out animation plays after `event` became null.
  const lastEvent = useRef<PendingPregnancyEventDelete | null>(event);
  if (event) {lastEvent.current = event;}
  const shown = event ?? lastEvent.current;

  useEffect(() => {
    if (event) {
      deletingRef.current = false;
      setDeleting(false);
    }
  }, [event]);

  const cancel = () => {
    if (deletingRef.current) {return;}
    onCancel();
  };

  const confirm = async () => {
    if (!event || deletingRef.current) {return;}
    deletingRef.current = true;
    setDeleting(true);
    try {
      await onConfirm(event);
    } catch {
      // The caller keeps the dialog open on a failure: allow another attempt.
      deletingRef.current = false;
      setDeleting(false);
    }
  };

  const destructiveText = pickReadableTextColor(theme.colors.danger);
  const isExam = shown?.type === 'exam';
  const title = isExam ? t('pregnancyEvent.form.deleteExamTitle') : t('pregnancyEvent.form.deleteAppointmentTitle');
  const confirmAccessibility = isExam
    ? t('pregnancyEvent.form.deleteExamAccessibility')
    : t('pregnancyEvent.form.deleteAppointmentAccessibility');

  return (
    <Modal animationType="fade" onRequestClose={cancel} statusBarTranslucent transparent visible={event !== null}>
      <View
        style={[
          styles.root,
          {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)},
        ]}>
        <Pressable
          accessibilityLabel={t('pregnancyEvent.form.deleteModalCloseAccessibility')}
          accessibilityRole="button"
          onPress={cancel}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.content}>
            <View importantForAccessibility="no-hide-descendants" style={styles.iconCircle}>
              <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={26} />
            </View>

            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            {shown ? <Text style={styles.body}>{t('pregnancyEvent.form.deleteMessage')}</Text> : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t('common.cancel')}
              accessibilityRole="button"
              accessibilityState={{disabled: deleting}}
              disabled={deleting}
              onPress={cancel}
              style={({pressed}) => [styles.button, styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={confirmAccessibility}
              accessibilityRole="button"
              accessibilityState={{disabled: deleting, busy: deleting}}
              disabled={deleting}
              onPress={confirm}
              style={({pressed}) => [styles.button, styles.deleteButton, (pressed || deleting) && styles.pressed]}>
              <Text style={[styles.deleteText, {color: destructiveText}]}>
                {deleting ? t('pregnancyEvent.form.deleting') : t('pregnancyEvent.form.delete')}
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

export default memo(PregnancyEventDeleteConfirmModal);
