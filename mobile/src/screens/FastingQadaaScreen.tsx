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
  Text,
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

import type {RootStackParamList} from '../navigation/AppNavigator';

import {useQadaaStatus} from '../hooks/useQadaaStatus';
import {useConfirmedPeriodHistory} from '../hooks/useConfirmedPeriodHistory';

import QadaaLedgerSections from '../components/qadaa/QadaaLedgerSections';
import QadaaManualEntryModal from '../components/qadaa/QadaaManualEntryModal';
import {JournalSaveToast, useJournalSaveToast} from '../components/journal/JournalSaveToast';

import {
  removeManualQadaaEntry,
  undoQadaaCompletion,
  type QadaaCompletionEntry,
  type QadaaManualEntry,
} from '../state/qadaaLedgerStore';
import {
  formatQadaaCompletionTitle,
  formatQadaaDayCount,
  formatQadaaManualTitle,
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
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

const MOSQUE_IMAGE = require('../assets/images/qadaa-mosque.png');
const LANTERN_IMAGE = require('../assets/images/qadaa-lantern.png');

/* -------------------------------------------------------------------------- */
/*                                   SCREEN                                   */
/* -------------------------------------------------------------------------- */

function FastingQadaaScreen(): React.JSX.Element {
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
    (remainingQadaaDays ?? 0) > 1
      ? 'jours à rattraper'
      : 'jour à rattraper';

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
      } finally {
        setMarkingCompleted(false);
      }
    };

  /* ------------------------------------------------------------------------ */
  /*                     MANUAL ENTRIES / COMPLETION UNDO                     */
  /* ------------------------------------------------------------------------ */

  const confirmDeleteManual = (entry: QadaaManualEntry) => {
    Alert.alert(
      entry.quantity === 1
        ? 'Supprimer ce jour ajouté manuellement ?'
        : `Supprimer ces ${entry.quantity} jours ajoutés manuellement ?`,
      `${formatQadaaManualTitle(entry)} : seuls ces jours ajoutés par toi seront retirés. Les jours détectés automatiquement ne sont pas touchés.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            removeManualQadaaEntry(entry.id)
              .then(() => toast.show('Jours supprimés', 'Ton solde a été mis à jour.'))
              .catch(error => console.warn('[FastingQadaaScreen] Unable to remove manual qadaa entry:', error));
          },
        },
      ],
    );
  };

  const confirmUndoCompletion = (entry: QadaaCompletionEntry) => {
    Alert.alert(
      'Annuler ce rattrapage ?',
      `${formatQadaaCompletionTitle(entry)} : ${formatQadaaDayCount(entry.quantity)} rattrapé${entry.quantity === 1 ? '' : 's'} ${entry.quantity === 1 ? 'sera remis' : 'seront remis'} dans ton solde.`,
      [
        {text: 'Garder', style: 'cancel'},
        {
          text: 'Annuler le rattrapage',
          style: 'destructive',
          onPress: () => {
            undoQadaaCompletion(entry.id)
              .then(() => toast.show('Rattrapage annulé', 'Ton solde a été mis à jour.'))
              .catch(error => console.warn('[FastingQadaaScreen] Unable to undo qadaa completion:', error));
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
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              style={({pressed}) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}>

              <MaterialDesignIcons
                name="chevron-left"
                size={22}
                color={theme.colors.primary}
              />
            </Pressable>

            <View style={styles.headerCenter}>
              <MaterialDesignIcons
                name="moon-waning-crescent"
                size={15}
                color={theme.colors.primary}
              />

              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                numberOfLines={1}
                style={styles.headerTitle}>
                Jeûnes à rattraper
              </Text>
            </View>

            <Pressable
              accessibilityLabel="À propos des jeûnes à rattraper"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() =>
                setHelpVisible(true)
              }
              style={({pressed}) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}>

              <MaterialDesignIcons
                name="help-circle-outline"
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
          </View>

          {/* HERO */}

          <Animated.View
            accessibilityLabel={
              loading
                ? 'Chargement de ton suivi de jeûnes à rattraper'
                : isZero
                  ? 'À jour, aucun jour de jeûne à rattraper actuellement'
                  : `${remainingQadaaDays} ${dayLabel}`
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

            <MaterialDesignIcons
              name="star-four-points"
              size={9}
              color={theme.colors.primary}
              style={styles.starOne}
            />

            <MaterialDesignIcons
              name="star-four-points"
              size={7}
              color={theme.colors.primary}
              style={styles.starTwo}
            />

            {loading ? (
              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>
                  JEÛNES À RATTRAPER
                </Text>

                <Text style={styles.loadingDash}>
                  —
                </Text>

                <Text style={styles.loadingText}>
                  Chargement du suivi…
                </Text>
              </View>
            ) : (
              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>
                  JEÛNES À RATTRAPER
                </Text>

                <Animated.Text
                  style={[
                    styles.heroNumber,
                    counterAnimatedStyle,
                  ]}>
                  {remainingQadaaDays}
                </Animated.Text>

                <Text style={styles.heroLabel}>
                  {dayLabel}
                </Text>

                {isZero ? (
                  <View style={styles.greenPill}>
                    <MaterialDesignIcons
                      name="check-circle"
                      size={12}
                      color={theme.colors.success}
                    />

                    <Text
                      style={
                        styles.greenPillText
                      }>
                      À jour
                    </Text>
                  </View>
                ) : hijriYear ? (
                  <View style={styles.yearPill}>
                    <Text
                      style={
                        styles.yearPillText
                      }>
                      Ramadan {hijriYear} AH
                    </Text>
                  </View>
                ) : null}

                {isZero ? (
                  <Text
                    style={
                      styles.zeroSubtitle
                    }>
                    Al-hamdulillah, tu es à
                    jour dans tes jeûnes à
                    rattraper.
                  </Text>
                ) : null}
              </View>
            )}
          </Animated.View>

          {/* REMINDER */}

          {!loading ? (
            <Animated.View
              style={[
                styles.reminderCard,
                reminderAnimatedStyle,
              ]}>

              <View
                style={
                  styles.reminderIcon
                }>
                <MaterialDesignIcons
                  name="bell-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <View
                style={
                  styles.reminderContent
                }>

                <Text
                  style={
                    styles.reminderTitle
                  }>
                  {showReminder
                    ? 'Rappel de rattrapage'
                    : 'Rappel'}
                </Text>

                <Text
                  style={
                    styles.reminderText
                  }>
                  {showReminder
                    ? 'Il te reste des jours de jeûne à rattraper. Organise ton suivi à ton rythme.'
                    : 'Si de nouveaux jours deviennent dus, nous t’en informerons après Ramadan.'}
                </Text>
              </View>
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
              onDeleteManual={confirmDeleteManual}
              onEditManual={entry => setManualModal({entry})}
              onUndoCompletion={confirmUndoCompletion}
            />
          ) : null}

          {/* ABOUT */}

          <View style={styles.aboutCard}>
            <View style={styles.aboutContent}>
              <View
                style={
                  styles.aboutHeading
                }>

                <View
                  style={
                    styles.aboutIcon
                  }>
                  <MaterialDesignIcons
                    name="information-outline"
                    size={17}
                    color={theme.colors.primary}
                  />
                </View>

                <Text
                  style={
                    styles.aboutTitle
                  }>
                  À propos des jeûnes à
                  rattraper
                </Text>
              </View>

              <Text style={styles.aboutText}>
                Les jours de jeûne manqués à
                cause des règles pendant
                Ramadan doivent être
                rattrapés plus tard. Allâh
                sait mieux.
              </Text>
            </View>

            <View
              style={
                styles.lanternContainer
              }>
              <Image
                source={LANTERN_IMAGE}
                resizeMode="contain"
                style={styles.lantern}
              />
            </View>
          </View>

          {/* ================================================================ */}
          {/* FUNCTIONAL QADAA COMPLETION                                      */}
          {/* ================================================================ */}

          {hasDaysDue ? (
            <View
              style={
                styles.completionCard
              }>

              <View
                style={
                  styles.completionHeader
                }>

                <View
                  style={
                    styles.completionIcon
                  }>
                  <MaterialDesignIcons
                    name="check-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <View
                  style={
                    styles.completionHeaderCopy
                  }>

                  <Text
                    style={
                      styles.completionTitle
                    }>
                    Tu as rattrapé un jeûne ?
                  </Text>

                  <Text
                    style={
                      styles.completionSubtitle
                    }>
                    Enregistre un jour accompli
                    pour actualiser ton suivi.
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Marquer un jour de jeûne comme rattrapé"
                accessibilityState={{
                  disabled:
                    markingCompleted,
                }}
                disabled={markingCompleted}
                onPress={
                  handleMarkOneCompleted
                }
                style={({pressed}) => [
                  styles.completionButton,

                  pressed &&
                    !markingCompleted &&
                    styles.completionButtonPressed,

                  markingCompleted &&
                    styles.completionButtonLoading,
                ]}>

                <MaterialDesignIcons
                  name={
                    markingCompleted
                      ? 'clock-outline'
                      : 'check'
                  }
                  size={17}
                  color={onPrimaryTextColor(theme)}
                />

                <Text
                  style={
                    styles.completionButtonText
                  }>
                  {markingCompleted
                    ? 'Enregistrement…'
                    : 'Marquer comme rattrapé'}
                </Text>
              </Pressable>

              <View style={styles.remainingHint}>
                <MaterialDesignIcons
                  name="information-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />

                <Text
                  style={
                    styles.remainingHintText
                  }>
                  {remainingQadaaDays}{' '}
                  {remainingQadaaDays === 1
                    ? 'jour restant'
                    : 'jours restants'}
                </Text>
              </View>
            </View>
          ) : !loading ? (
            <View style={styles.completedCard}>
              <View style={styles.completedIcon}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={pickReadableTextColor(theme.colors.success)}
                />
              </View>

              <View style={styles.completedCopy}>
                <Text
                  style={
                    styles.completedTitle
                  }>
                  Tous les jeûnes sont rattrapés
                </Text>

                <Text
                  style={
                    styles.completedText
                  }>
                  Ton suivi est maintenant à
                  jour.
                </Text>
              </View>
            </View>
          ) : null}

          {/* MOTIVATION */}

          <View style={styles.motivationCard}>
            <View
              style={
                styles.motivationIcon
              }>
              <MaterialDesignIcons
                name="hands-pray"
                size={20}
                color={theme.colors.primary}
              />
            </View>

            <Text
              style={
                styles.motivationText
              }>
              Prends soin de toi, tu es
              précieuse
            </Text>

            <MaterialDesignIcons
              name="heart"
              size={18}
              color={theme.colors.primary}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <QadaaManualEntryModal
        entry={manualModal?.entry ?? null}
        onClose={() => setManualModal(null)}
        onSaved={mode =>
          toast.show(
            mode === 'added' ? 'Jours ajoutés' : 'Jours modifiés',
            'Ton solde a été mis à jour.',
          )
        }
        visible={manualModal !== null}
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
          accessibilityLabel="Fermer"
          onPress={() =>
            setHelpVisible(false)
          }
          style={styles.modalBackdrop}>

          <Pressable
            onPress={() => {}}
            style={styles.modalCard}>

            <View style={styles.modalIcon}>
              <MaterialDesignIcons
                name="moon-waning-crescent"
                size={21}
                color={theme.colors.primary}
              />
            </View>

            <Text style={styles.modalTitle}>
              Jeûnes à rattraper
            </Text>

            <Text style={styles.modalText}>
              Cette section t’aide à suivre
              les jours de jeûne manqués à
              cause des règles pendant
              Ramadan.
            </Text>

            <Text style={styles.modalText}>
              Les jours détectés automatiquement viennent de
              ton suivi des règles pendant Ramadan. Tu peux
              aussi ajouter toi-même des jours, même anciens.
              Lorsque tu rattrapes un jour, marque-le comme
              accompli afin que ton nombre de jours restants
              reste à jour.
            </Text>

            <Pressable
              accessibilityLabel="Fermer cette fenêtre d’aide"
              accessibilityRole="button"
              onPress={() =>
                setHelpVisible(false)
              }
              style={({pressed}) => [
                styles.modalButton,
                pressed && styles.pressed,
              ]}>

              <Text
                style={
                  styles.modalButtonText
                }>
                Fermer
              </Text>
            </Pressable>
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
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    paddingHorizontal: 16,
  },

  pressed: {
    opacity: 0.72,
  },

  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  headerButton: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 20,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    elevation: 1,

    shadowColor: theme.shadow.shadowColor,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  headerCenter: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,

    paddingHorizontal: 5,
  },

  headerTitle: {
    color: theme.colors.text,

    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  hero: {
    minHeight: 235,

    overflow: 'hidden',

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 20,

    borderWidth: 1,
    borderColor: theme.colors.border,

    backgroundColor:
      theme.colors.primarySoft,
  },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,

    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,

    // Theme-driven, not a fixed literal: heroEyebrow/heroNumber/heroLabel
    // above render directly on this scrim (no opaque card behind them), so
    // it must carry real theme-background opacity in every mode. A fixed
    // 10% white wash left the MOSQUE_IMAGE photo essentially undimmed in
    // Dark Mode, so the resolved light-on-dark text colors had almost no
    // contrast against the still-bright photo behind them.
    backgroundColor:
      withAlpha(theme.colors.background, 0.72),
  },

  heroContent: {
    width: '100%',

    alignItems: 'center',

    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  starOne: {
    position: 'absolute',

    left: 20,
    top: 22,

    opacity: 0.3,
  },

  starTwo: {
    position: 'absolute',

    right: 25,
    top: 38,

    opacity: 0.25,
  },

  heroEyebrow: {
    color: theme.colors.textSecondary,

    fontSize: 10.5,
    letterSpacing: 1.5,

    fontWeight: '800',
  },

  heroNumber: {
    marginTop: 7,

    color: theme.colors.accent,

    fontFamily: 'serif',

    fontSize: 58,
    lineHeight: 63,

    fontWeight: '700',
  },

  heroLabel: {
    color: theme.colors.text,

    fontSize: 14,

    fontWeight: '700',
  },

  yearPill: {
    marginTop: 12,

    paddingHorizontal: 12,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: withAlpha(theme.colors.warning, 0.15),
  },

  yearPillText: {
    color: theme.colors.warning,

    fontSize: 10.5,

    fontWeight: '800',
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

  greenPillText: {
    color: theme.colors.success,

    fontSize: 10.5,

    fontWeight: '800',
  },

  zeroSubtitle: {
    maxWidth: 260,

    marginTop: 10,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 17,

    textAlign: 'center',
  },

  loadingDash: {
    marginTop: 8,

    color: theme.colors.textSecondary,

    fontSize: 38,
  },

  loadingText: {
    marginTop: 5,

    color: theme.colors.textSecondary,

    fontSize: 11,
  },

  reminderCard: {
    minHeight: 92,

    marginTop: 12,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
    paddingVertical: 14,

    borderRadius: 17,

    borderWidth: 1,
    borderColor: theme.colors.border,

    backgroundColor: theme.colors.surface,

    ...theme.shadow,
  },

  reminderIcon: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: theme.colors.primarySoft,
  },

  reminderContent: {
    flex: 1,

    marginLeft: 12,
  },

  reminderTitle: {
    color: theme.colors.text,

    fontFamily: 'serif',

    fontSize: 16,
    lineHeight: 20,

    fontWeight: '700',
  },

  reminderText: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 17,
  },

  aboutCard: {
    minHeight: 150,

    marginTop: 12,

    overflow: 'hidden',

    flexDirection: 'row',
    alignItems: 'stretch',

    borderRadius: 17,

    borderWidth: 1,
    borderColor: theme.colors.border,

    backgroundColor: theme.colors.primarySoft,
  },

  aboutContent: {
    flex: 1,

    zIndex: 2,

    paddingLeft: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },

  aboutHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  aboutIcon: {
    width: 30,
    height: 30,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: theme.colors.primarySoft,
  },

  aboutTitle: {
    flex: 1,

    marginLeft: 8,

    color: theme.colors.text,

    fontFamily: 'serif',

    fontSize: 15.5,
    lineHeight: 19,

    fontWeight: '700',
  },

  aboutText: {
    maxWidth: 215,

    marginTop: 10,

    color: theme.colors.textSecondary,

    fontSize: 11.2,
    lineHeight: 17,
  },

  lanternContainer: {
    width: 120,

    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },

  lantern: {
    width: 125,
    height: 145,
  },

  /* FUNCTIONAL COMPLETION */

  completionCard: {
    marginTop: 12,

    padding: 14,

    borderRadius: 17,

    borderWidth: 1,
    borderColor: theme.colors.border,

    backgroundColor: theme.colors.surface,

    ...theme.shadow,
  },

  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  completionIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  completionHeaderCopy: {
    flex: 1,

    marginLeft: 10,
  },

  completionTitle: {
    color: theme.colors.text,

    fontSize: 12.8,

    fontWeight: '800',
  },

  completionSubtitle: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 10.5,
    lineHeight: 15,
  },

  completionButton: {
    minHeight: 46,

    marginTop: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    borderRadius: 12,

    backgroundColor: theme.colors.primary,
  },

  completionButtonPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  completionButtonLoading: {
    opacity: 0.65,
  },

  completionButtonText: {
    color: onPrimaryTextColor(theme),

    fontSize: 12,

    fontWeight: '800',
  },

  remainingHint: {
    marginTop: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,
  },

  remainingHintText: {
    color: theme.colors.textSecondary,

    fontSize: 9.7,

    fontWeight: '600',
  },

  completedCard: {
    minHeight: 72,

    marginTop: 12,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,

    borderRadius: 17,

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

  completedCopy: {
    flex: 1,

    marginLeft: 10,
  },

  completedTitle: {
    color: theme.colors.success,

    fontSize: 12.5,

    fontWeight: '800',
  },

  completedText: {
    marginTop: 2,

    color: theme.colors.textSecondary,

    fontSize: 10.5,
  },

  motivationCard: {
    minHeight: 68,

    marginTop: 12,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,

    borderRadius: 17,

    borderWidth: 1,
    borderColor: theme.colors.border,

    backgroundColor: theme.colors.surface,

    ...theme.shadow,
  },

  motivationIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  motivationText: {
    flex: 1,

    marginHorizontal: 11,

    color: theme.colors.textSecondary,

    fontSize: 12.5,
    lineHeight: 17,

    fontWeight: '600',
  },

  modalBackdrop: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 22,

    backgroundColor:
      withAlpha(theme.shadow.shadowColor, 0.42),
  },

  modalCard: {
    width: '100%',
    maxWidth: 370,

    alignItems: 'center',

    padding: 20,

    borderRadius: 20,

    backgroundColor: theme.colors.surface,

    elevation: 12,
  },

  modalIcon: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: theme.colors.primarySoft,
  },

  modalTitle: {
    marginTop: 11,

    color: theme.colors.text,

    fontFamily: 'serif',

    fontSize: 17,

    fontWeight: '700',
  },

  modalText: {
    marginTop: 9,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 17,

    textAlign: 'center',
  },

  modalButton: {
    width: '100%',
    minHeight: 44,

    marginTop: 16,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primary,
  },

  modalButtonText: {
    color: onPrimaryTextColor(theme),

    fontSize: 12.5,

    fontWeight: '800',
  },
  });
}

export default FastingQadaaScreen;