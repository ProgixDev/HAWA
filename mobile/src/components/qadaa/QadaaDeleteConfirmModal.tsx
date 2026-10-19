import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {awaShapes} from '../../theme/shapes';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {QadaaManualEntry} from '../../state/qadaaLedgerStore';
import {describeQadaaManualEntryForDelete} from '../../utils/qadaaManualEntryForm';
import {presentSaveFailure} from '../../services/saveFailure';

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
    } catch (error) {
      // The caller keeps the dialog open on a failure: allow another attempt.
      deletingRef.current = false;
      setDeleting(false);
      presentSaveFailure(error);
    }
  };

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

            <AwaText accessibilityRole="header" variant="titleLarge" style={styles.title}>{t('qadaa.deleteModal.title')}</AwaText>

            {summary ? (
              <>
                <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.body}>
                  {t('qadaa.deleteModal.body', {count: shown?.quantity ?? 0, quantityLabel: summary.quantityLabel})}
                </AwaText>

                <View style={styles.summaryCard}>
                  <AwaText variant="titleMedium">{summary.quantityLabel}</AwaText>
                  <AwaText colorRole="primary" variant="labelLarge" style={styles.summaryYear}>{summary.yearLabel}</AwaText>
                  {summary.yearHint ? <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.summaryHint}>{summary.yearHint}</AwaText> : null}
                  {summary.note ? (
                    <View style={styles.noteBlock}>
                      <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium">{t('qadaa.deleteModal.noteLabel')}</AwaText>
                      <AwaText numberOfLines={4} variant="bodyMedium" style={styles.noteText}>« {summary.note} »</AwaText>
                    </View>
                  ) : null}
                </View>

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.reassurance}>
                  {t('qadaa.deleteModal.reassurance')}
                </AwaText>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <AwaButton
              accessibilityLabel={t('qadaa.deleteModal.cancelAccessibility')}
              disabled={deleting}
              label={t('qadaa.deleteModal.cancelText')}
              onPress={cancel}
              style={styles.button}
              variant="outlined"
            />
            <AwaButton
              accessibilityLabel={t('qadaa.deleteModal.confirmAccessibility')}
              label={deleting ? t('qadaa.deleteModal.deleting') : t('qadaa.deleteModal.confirmText')}
              loading={deleting}
              onPress={confirm}
              style={styles.button}
              variant="destructive"
            />
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
      borderRadius: awaShapes.extraLarge,
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
    title: {marginTop: 14, textAlign: 'center'},
    body: {marginTop: 10, textAlign: 'center'},
    // A plain tonal block (no border): the dialog card itself is the only bordered surface.
    summaryCard: {
      alignSelf: 'stretch',
      marginTop: 16,
      borderRadius: awaShapes.medium,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    summaryYear: {marginTop: 3},
    summaryHint: {marginTop: 2},
    noteBlock: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    noteText: {marginTop: 2},
    reassurance: {marginTop: 14, textAlign: 'center'},
    actions: {flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20},
    button: {flex: 1},
  });
}

export default memo(QadaaDeleteConfirmModal);
