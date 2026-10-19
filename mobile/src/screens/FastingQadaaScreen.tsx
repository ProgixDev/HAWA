import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';

import {useQadaaStatus} from '../hooks/useQadaaStatus';
import {useConfirmedPeriodHistory} from '../hooks/useConfirmedPeriodHistory';

import QadaaLedgerSections from '../components/qadaa/QadaaLedgerSections';
import QadaaDeleteConfirmModal from '../components/qadaa/QadaaDeleteConfirmModal';
import QadaaManualEntryModal from '../components/qadaa/QadaaManualEntryModal';
import {JournalSaveToast, useJournalSaveToast} from '../components/journal/JournalSaveToast';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

import {
  removeManualQadaaEntry,
  undoQadaaCompletion,
  type QadaaCompletionEntry,
  type QadaaManualEntry,
} from '../state/qadaaLedgerStore';
import {
  formatQadaaCompletionTitle,
} from '../utils/qadaaManualEntryForm';

import {
  summarizeQadaaHistoryEntry,
  type QadaaHistoryEntry,
} from '../utils/qadaaHistoryPresentation';

import {
  getBottomPadding,
  getTopPadding,
} from '../theme/spacing';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {presentSaveFailure} from '../services/saveFailure';

const MOSQUE_IMAGE = require('../assets/images/qadaa-mosque.png');

/* -------------------------------------------------------------------------- */
/*                                   SCREEN                                   */
/* -------------------------------------------------------------------------- */

function FastingQadaaScreen(): React.JSX.Element {
  const {t} = useTranslation();

  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    remainingQadaaDays,
    hijriYear,
    loading,
    showReminder,
    balance,
    manualEntries,
    completions,
    markOneQadaaDayCompleted,
  } = useQadaaStatus();

  const confirmedHistory =
    useConfirmedPeriodHistory();

  const [helpVisible, setHelpVisible] =
    useState(false);

  const [
    markingCompleted,
    setMarkingCompleted,
  ] = useState(false);

  // null entry = "add"; an entry = "edit" (MANUAL entries only).
  const [manualModal, setManualModal] = useState<{entry: QadaaManualEntry | null} | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QadaaManualEntry | null>(null);
  const toast = useJournalSaveToast();

  /* ------------------------------------------------------------------------ */
  /*                                  HISTORY                                 */
  /* ------------------------------------------------------------------------ */

  const historyEntries = useMemo(() => {
    const sorted = [
      ...confirmedHistory,
    ].sort((a, b) =>
      b.periodStart.localeCompare(
        a.periodStart,
      ),
    );

    return sorted
      .map(summarizeQadaaHistoryEntry)
      .filter(
        (
          entry,
        ): entry is QadaaHistoryEntry =>
          Boolean(entry),
      );
  }, [confirmedHistory]);

  /* ------------------------------------------------------------------------ */
  /*                            SCREEN ANIMATION                              */
  /* ------------------------------------------------------------------------ */

  const screenOpacity =
    useSharedValue(0);

  const screenTranslateY =
    useSharedValue(8);

  useEffect(() => {
    screenOpacity.value = withTiming(1, {
      duration: 300,
    });

    screenTranslateY.value = withTiming(
      0,
      {
        duration: 300,
      },
    );
  }, [
    screenOpacity,
    screenTranslateY,
  ]);

  const screenAnimatedStyle =
    useAnimatedStyle(() => ({
      opacity: screenOpacity.value,

      transform: [
        {
          translateY:
            screenTranslateY.value,
        },
      ],
    }));

  /* ------------------------------------------------------------------------ */
  /*                              HERO ANIMATION                              */
  /* ------------------------------------------------------------------------ */

  const cardOpacity =
    useSharedValue(0);

  const cardScale =
    useSharedValue(0.98);

  useEffect(() => {
    if (loading) {
      return;
    }

    cardOpacity.value = withTiming(1, {
      duration: 280,
    });

    cardScale.value = withTiming(1, {
      duration: 280,
    });
  }, [
    loading,
    cardOpacity,
    cardScale,
  ]);

  const cardAnimatedStyle =
    useAnimatedStyle(() => ({
      opacity: cardOpacity.value,
      transform: [
        {
          scale: cardScale.value,
        },
      ],
    }));

  /* ------------------------------------------------------------------------ */
  /*                            COUNTER ANIMATION                             */
  /* ------------------------------------------------------------------------ */

  const counterOpacity =
    useSharedValue(1);

  useEffect(() => {
    counterOpacity.value = 0;

    counterOpacity.value = withTiming(
      1,
      {
        duration: 240,
      },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingQadaaDays]);

  const counterAnimatedStyle =
    useAnimatedStyle(() => ({
      opacity: counterOpacity.value,
    }));

  /* ------------------------------------------------------------------------ */
  /*                            REMINDER ANIMATION                            */
  /* ------------------------------------------------------------------------ */

  const reminderOpacity =
    useSharedValue(0);

  const reminderTranslateY =
    useSharedValue(5);

  useEffect(() => {
    if (loading) {
      return;
    }

    reminderOpacity.value =
      withTiming(1, {
        duration: 300,
      });

    reminderTranslateY.value =
      withTiming(0, {
        duration: 300,
      });
  }, [
    loading,
    reminderOpacity,
    reminderTranslateY,
  ]);

  const reminderAnimatedStyle =
    useAnimatedStyle(() => ({
      opacity: reminderOpacity.value,

      transform: [
        {
          translateY:
            reminderTranslateY.value,
        },
      ],
    }));

  /* ------------------------------------------------------------------------ */
  /*                              COMPUTED STATE                              */
  /* ------------------------------------------------------------------------ */

  const isZero =
    !loading &&
    remainingQadaaDays === 0;

  const hasDaysDue =
    !loading &&
    (remainingQadaaDays ?? 0) > 0;

  const dayLabel =
    t('qadaa.daysToMakeUpLabel', {count: remainingQadaaDays ?? 0});

  /* ------------------------------------------------------------------------ */
  /*                    MARK ONE FAST AS COMPLETED                            */
  /* ------------------------------------------------------------------------ */

  const handleMarkOneCompleted =
    async () => {
      if (
        markingCompleted ||
        loading ||
        !remainingQadaaDays ||
        remainingQadaaDays <= 0
      ) {
        return;
      }

      try {
        setMarkingCompleted(true);

        await markOneQadaaDayCompleted();
      } catch (error) {
        console.warn(
          '[FastingQadaaScreen] Unable to mark qadaa day as completed:',
          error,
        );
        // Not recorded: the balance did not move (the ledger rolled back) and the person is told.
        presentSaveFailure(error);
      } finally {
        setMarkingCompleted(false);
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                     MANUAL ENTRIES / COMPLETION UNDO                     */
  /* ------------------------------------------------------------------------ */

  // Deleting a MANUAL entry: the dialog (QadaaDeleteConfirmModal) asks first; only
  // its "Supprimer" reaches removeManualQadaaEntry, the one existing deletion.
  const requestDeleteManual = (entry: QadaaManualEntry) => setDeleteTarget(entry);

  const deleteManualEntry = async (entry: QadaaManualEntry) => {
    try {
      await removeManualQadaaEntry(entry.id);
    } catch (error) {
      console.warn('[FastingQadaaScreen] Unable to remove manual qadaa entry:', error);
      // The dialog (QadaaDeleteConfirmModal) catches this to allow another attempt and tells the person.
      throw error;
    }
    setDeleteTarget(null);
    toast.show(t('qadaa.entryDeletedToastTitle'), t('qadaa.balanceUpdatedToastMessage'));
  };

  const confirmUndoCompletion = (entry: QadaaCompletionEntry) => {
    Alert.alert(
      t('qadaa.undoCompletionTitle'),
      t('qadaa.undoCompletionMessage', {title: formatQadaaCompletionTitle(entry), count: entry.quantity}),
      [
        {text: t('qadaa.keepButton'), style: 'cancel'},
        {
          text: t('qadaa.undoButton'),
          style: 'destructive',
          onPress: () => {
            undoQadaaCompletion(entry.id)
              .then(() => toast.show(t('qadaa.undoneToastTitle'), t('qadaa.balanceUpdatedToastMessage')))
              .catch(error => {
                console.warn('[FastingQadaaScreen] Unable to undo qadaa completion:', error);
                presentSaveFailure(error);
              });
          },
        },
      ],
    );
  };

  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              getTopPadding(insets.top),

            paddingBottom:
              getBottomPadding(
                insets.bottom,
              ) + 18,
          },
        ]}>

        <Animated.View
          style={screenAnimatedStyle}>

          {/* HEADER */}

          <View style={styles.header}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              icon="chevron-left"
              iconSize={26}
              onPress={navigation.goBack}
            />

            <View style={styles.headerCenter}>
              <AwaText
                variant="headlineSmall"
                style={styles.headerTitle}>
                {t('qadaa.title')}
              </AwaText>
            </View>

            <AwaIconButton
              accessibilityLabel={t('qadaa.aboutAccessibility')}
              icon="help-circle-outline"
              onPress={() =>
                setHelpVisible(true)
              }
            />
          </View>

          {/* HERO */}

          <Animated.View
            accessibilityLabel={
              loading
                ? t('qadaa.heroAccessibilityLoading')
                : isZero
                  ? t('qadaa.heroAccessibilityZero')
                  : t('qadaa.heroAccessibilityCount', {count: remainingQadaaDays ?? 0})
            }
            style={[
              styles.hero,
              cardAnimatedStyle,
            ]}>

            <Image
              source={MOSQUE_IMAGE}
              resizeMode="cover"
              style={styles.heroBackground}
            />

            <View style={styles.heroOverlay} />

            {loading ? (
              <View style={styles.heroContent}>
                <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.heroEyebrow}>
                  {t('qadaa.eyebrow')}
                </AwaText>

                <AwaText colorRole="onSurfaceVariant" variant="displaySmall" style={styles.loadingDash}>
                  —
                </AwaText>

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.loadingText}>
                  {t('qadaa.loading')}
                </AwaText>
              </View>
            ) : (
              <View style={styles.heroContent}>
                <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.heroEyebrow}>
                  {t('qadaa.eyebrow')}
                </AwaText>

                <Animated.Text
                  style={[
                    styles.heroNumber,
                    counterAnimatedStyle,
                  ]}>
                  {remainingQadaaDays}
                </Animated.Text>

                <AwaText emphasized variant="titleSmall">
                  {dayLabel}
                </AwaText>

                {isZero ? (
                  <View style={styles.greenPill}>
                    <MaterialDesignIcons
                      name="check-circle"
                      size={12}
                      color={theme.colors.success}
                    />

                    <AwaText colorRole="success" emphasized variant="labelSmall">
                      {t('spiritualGuidance.upToDate')}
                    </AwaText>
                  </View>
                ) : hijriYear ? (
                  <View style={styles.yearPill}>
                    <AwaText colorRole="warning" emphasized variant="labelSmall">
                      {t('qadaa.ramadanYearHijri', {year: hijriYear})}
                    </AwaText>
                  </View>
                ) : null}

                {isZero ? (
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.zeroSubtitle}>
                    {t('qadaa.allHamdulillahSubtitle')}
                  </AwaText>
                ) : null}
              </View>
            )}
          </Animated.View>

          {/* REMINDER */}

          {!loading ? (
            <Animated.View style={[styles.reminderWrap, reminderAnimatedStyle]}>
              <AwaCard style={styles.reminderCard} variant="outlined">
                <MaterialDesignIcons
                  name="bell-outline"
                  size={22}
                  color={theme.colors.primary}
                />

                <View
                  style={
                    styles.reminderContent
                  }>

                  <AwaText variant="titleMedium">
                    {showReminder
                      ? t('qadaa.reminderTitleActive')
                      : t('qadaa.reminderTitleIdle')}
                  </AwaText>

                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.reminderText}>
                    {showReminder
                      ? t('qadaa.reminderTextActive')
                      : t('qadaa.reminderTextIdle')}
                  </AwaText>
                </View>
              </AwaCard>
            </Animated.View>
          ) : null}

          {/* BALANCE + HISTORY */}

          {!loading && balance ? (
            <QadaaLedgerSections
              automaticEntries={historyEntries}
              balance={balance}
              completions={completions}
              manualEntries={manualEntries}
              onAdd={() => setManualModal({entry: null})}
              onDeleteManual={requestDeleteManual}
              onEditManual={entry => setManualModal({entry})}
              onUndoCompletion={confirmUndoCompletion}
            />
          ) : null}

          {/* ABOUT */}

          <AwaCard style={styles.aboutCard} variant="filled">
            <View style={styles.aboutHeading}>
              <MaterialDesignIcons
                name="information-outline"
                size={20}
                color={theme.colors.primary}
              />

              <AwaText variant="titleMedium" style={styles.aboutTitle}>
                {t('qadaa.aboutTitle')}
              </AwaText>
            </View>

            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.aboutText}>
              {t('qadaa.aboutText')}
            </AwaText>
          </AwaCard>

          {/* ================================================================ */}
          {/* FUNCTIONAL QADAA COMPLETION                                      */}
          {/* ================================================================ */}

          {hasDaysDue ? (
            <AwaCard style={styles.completionCard} variant="outlined">

              <AwaText variant="titleMedium">
                {t('qadaa.completionTitle')}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.completionSubtitle}>
                {t('qadaa.completionSubtitle')}
              </AwaText>

              <AwaButton
                accessibilityLabel={t('qadaa.markCompletedAccessibility')}
                fullWidth
                icon={markingCompleted ? 'clock-outline' : 'check'}
                label={markingCompleted
                  ? t('qadaa.saving')
                  : t('qadaa.markCompleted')}
                disabled={markingCompleted}
                onPress={handleMarkOneCompleted}
                style={styles.completionButton}
              />

              <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.remainingHintText}>
                {t('qadaa.remainingDays', {count: remainingQadaaDays ?? 0})}
              </AwaText>
            </AwaCard>
          ) : !loading ? (
            <AwaCard style={styles.completedCard}>
              <View style={styles.completedIcon}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={pickReadableTextColor(theme.colors.success)}
                />
              </View>

              <View style={styles.completedCopy}>
                <AwaText colorRole="success" variant="titleMedium">
                  {t('qadaa.allCompletedTitle')}
                </AwaText>

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.completedText}>
                  {t('qadaa.allCompletedText')}
                </AwaText>
              </View>
            </AwaCard>
          ) : null}

          {/* MOTIVATION */}

          <AwaCard style={styles.motivationCard} variant="filled">
            <MaterialDesignIcons
              name="hands-pray"
              size={22}
              color={theme.colors.primary}
            />

            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.motivationText}>
              {t('qadaa.motivationText')}
            </AwaText>
          </AwaCard>
        </Animated.View>
      </ScrollView>

      <QadaaManualEntryModal
        entry={manualModal?.entry ?? null}
        onClose={() => setManualModal(null)}
        onSaved={mode =>
          toast.show(
            mode === 'added' ? t('qadaa.addedToastTitle') : t('qadaa.editedToastTitle'),
            t('qadaa.balanceUpdatedToastMessage'),
          )
        }
        visible={manualModal !== null}
      />

      <QadaaDeleteConfirmModal
        entry={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteManualEntry}
      />

      <JournalSaveToast
        animation={toast.animation}
        bottom={getBottomPadding(insets.bottom) + 12}
        message={toast.message}
        onDismiss={toast.hide}
        title={toast.title}
        visible={toast.visible}
      />

      {/* HELP MODAL */}

      <Modal
        transparent
        animationType="fade"
        visible={helpVisible}
        onRequestClose={() =>
          setHelpVisible(false)
        }>

        <Pressable
          accessibilityLabel={t('common.close')}
          onPress={() =>
            setHelpVisible(false)
          }
          style={styles.modalBackdrop}>

          <Pressable
            onPress={() => {}}
            style={styles.modalCard}>

            <AwaText variant="titleLarge" style={styles.modalTitle}>
              {t('qadaa.title')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.modalText}>
              {t('qadaa.helpParagraph1')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.modalText}>
              {t('qadaa.helpParagraph2')}
            </AwaText>

            <AwaButton
              accessibilityLabel={t('qadaa.closeHelpAccessibility')}
              fullWidth
              label={t('common.close')}
              onPress={() =>
                setHelpVisible(false)
              }
              style={styles.modalButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {flex: 1, backgroundColor: theme.colors.background},
    content: {paddingHorizontal: 16},
    header: {minHeight: 56, flexDirection: 'row', alignItems: 'center', marginBottom: 12},
    headerCenter: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5},
    headerTitle: {color: theme.colors.text, textAlign: 'center'},

    // The mosque photo with its theme scrim is the hero's brand imagery; the text sits on the scrim.
    hero: {
      minHeight: 235,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    heroBackground: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%'},
    // Theme-driven, not a fixed literal: heroEyebrow/heroNumber/dayLabel render directly on this scrim (no opaque
    // card behind them), so it must carry real theme-background opacity in every mode (Light and Dark).
    heroOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.colors.background, 0.72)},
    heroContent: {width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 22},
    heroEyebrow: {letterSpacing: 0.5, textAlign: 'center'},
    heroNumber: {
      marginTop: 7,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 58,
      lineHeight: 63,
      fontWeight: '700',
    },
    yearPill: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: withAlpha(theme.colors.warning, 0.15),
    },
    greenPill: {
      marginTop: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: withAlpha(theme.colors.success, 0.14),
    },
    zeroSubtitle: {maxWidth: 260, marginTop: 10, textAlign: 'center'},
    loadingDash: {marginTop: 8},
    loadingText: {marginTop: 5},

    reminderWrap: {marginTop: 12},
    reminderCard: {minHeight: 76, flexDirection: 'row', alignItems: 'center'},
    reminderContent: {flex: 1, marginLeft: 12},
    reminderText: {marginTop: 3},

    aboutCard: {marginTop: 12},
    aboutHeading: {flexDirection: 'row', alignItems: 'center'},
    aboutTitle: {flex: 1, marginLeft: 8},
    aboutText: {marginTop: 10},

    completionCard: {marginTop: 12},
    completionSubtitle: {marginTop: 3},
    completionButton: {marginTop: 12},
    remainingHintText: {marginTop: 9, textAlign: 'center'},

    completedCard: {
      minHeight: 72,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.success, 0.28),
      backgroundColor: withAlpha(theme.colors.success, 0.14),
    },
    completedIcon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.success,
    },
    completedCopy: {flex: 1, marginLeft: 10},
    completedText: {marginTop: 2},

    motivationCard: {marginTop: 12, flexDirection: 'row', alignItems: 'center'},
    motivationText: {flex: 1, marginLeft: 12},

    modalBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 22,
      backgroundColor: withAlpha(theme.shadow.shadowColor, 0.42),
    },
    modalCard: {
      width: '100%',
      maxWidth: 370,
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      elevation: 12,
    },
    modalTitle: {textAlign: 'center'},
    modalText: {marginTop: 9, textAlign: 'center'},
    modalButton: {marginTop: 16},
  });
}

export default FastingQadaaScreen;
