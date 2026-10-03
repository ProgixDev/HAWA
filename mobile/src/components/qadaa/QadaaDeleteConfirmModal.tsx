import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {QadaaManualEntry} from '../../state/qadaaLedgerStore';
import {describeQadaaManualEntryForDelete} from '../../utils/qadaaManualEntryForm';

type Props = {
  /** The MANUAL entry the user asked to delete; null = dialog closed. */
  entry: QadaaManualEntry | null;
  /** Backdrop tap, Android Back or "Annuler": nothing is deleted. */
  onCancel: () => void;
  /** Only "Supprimer" calls this. The caller deletes and closes the dialog. */
  onConfirm: (entry: QadaaManualEntry) => Promise<void> | void;
};

/**
 * Confirmation before removing ONE manually added Qadaa entry. It says exactly what
 * goes (quantity, Ramadan year or "ancien solde", note) and what does not (the
 * automatic days and the completed days). It performs no deletion itself: the
 * caller passes the existing removeManualQadaaEntry through `onConfirm`, which is
 * invoked at most once per opening even on rapid double taps.
 */
function QadaaDeleteConfirmModal({entry, onCancel, onConfirm}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  // Keeps the content while the fade-out animation plays after `entry` became null.
  const lastEntry = useRef<QadaaManualEntry | null>(entry);
  if (entry) {lastEntry.current = entry;}
  const shown = entry ?? lastEntry.current;

  useEffect(() => {
    if (entry) {
      deletingRef.current = false;
      setDeleting(false);
    }
  }, [entry]);

  const summary = useMemo(() => (shown ? describeQadaaManualEntryForDelete(shown) : null), [shown]);

  const cancel = () => {
    if (deletingRef.current) {return;}
    onCancel();
  };

  const confirm = async () => {
    if (!entry || deletingRef.current) {return;}
    deletingRef.current = true;
    setDeleting(true);
    try {
      await onConfirm(entry);
    } catch {
      // The caller keeps the dialog open on a failure: allow another attempt.
      deletingRef.current = false;
      setDeleting(false);
    }
  };

  const destructiveText = pickReadableTextColor(theme.colors.danger);

  return (
    <Modal animationType="fade" onRequestClose={cancel} statusBarTranslucent transparent visible={entry !== null}>
      <View
        style={[
          styles.root,
          {paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16)},
        ]}>
        <Pressable
          accessibilityLabel={t('qadaa.deleteModal.closeAccessibility')}
          accessibilityRole="button"
          onPress={cancel}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.card}>
          <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View importantForAccessibility="no-hide-descendants" style={styles.iconCircle}>
              <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={26} />
            </View>

            <Text accessibilityRole="header" style={styles.title}>{t('qadaa.deleteModal.title')}</Text>

            {summary ? (
              <>
                <Text style={styles.body}>
                  {t('qadaa.deleteModal.body', {count: shown?.quantity ?? 0, quantityLabel: summary.quantityLabel})}
                </Text>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryQuantity}>{summary.quantityLabel}</Text>
                  <Text style={styles.summaryYear}>{summary.yearLabel}</Text>
                  {summary.yearHint ? <Text style={styles.summaryHint}>{summary.yearHint}</Text> : null}
                  {summary.note ? (
                    <View style={styles.noteBlock}>
                      <Text style={styles.noteLabel}>{t('qadaa.deleteModal.noteLabel')}</Text>
                      <Text numberOfLines={4} style={styles.noteText}>« {summary.note} »</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.reassurance}>
                  {t('qadaa.deleteModal.reassurance')}
                </Text>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t('qadaa.deleteModal.cancelAccessibility')}
              accessibilityRole="button"
              accessibilityState={{disabled: deleting}}
              disabled={deleting}
              onPress={cancel}
              style={({pressed}) => [styles.button, styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>{t('qadaa.deleteModal.cancelText')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('qadaa.deleteModal.confirmAccessibility')}
              accessibilityRole="button"
              accessibilityState={{disabled: deleting, busy: deleting}}
              disabled={deleting}
              onPress={confirm}
              style={({pressed}) => [styles.button, styles.deleteButton, (pressed || deleting) && styles.pressed]}>
              <Text style={[styles.deleteText, {color: destructiveText}]}>{deleting ? t('qadaa.deleteModal.deleting') : t('qadaa.deleteModal.confirmText')}</Text>
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
      maxHeight: '100%',
      overflow: 'hidden',
      borderRadius: homeRadii.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      elevation: 12,
    },
    scroll: {flexGrow: 0, flexShrink: 1},
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
    summaryCard: {
      alignSelf: 'stretch',
      marginTop: 16,
      borderRadius: homeRadii.button,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    summaryQuantity: {color: theme.colors.text, fontSize: 18, fontWeight: '800'},
    summaryYear: {marginTop: 3, color: theme.colors.primary, fontSize: 14, fontWeight: '700'},
    summaryHint: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12.5},
    noteBlock: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    noteLabel: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '700'},
    noteText: {marginTop: 2, color: theme.colors.text, fontSize: 13, lineHeight: 18},
    reassurance: {marginTop: 14, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
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

export default memo(QadaaDeleteConfirmModal);
