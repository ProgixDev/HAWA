import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
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
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type {RootStackParamList} from '../navigation/AppNavigator';

import {homeShadow} from '../components/home/homeTheme';

import {useQadaaStatus} from '../hooks/useQadaaStatus';
import {useConfirmedPeriodHistory} from '../hooks/useConfirmedPeriodHistory';

import {
  formatQadaaHistoryGregorianRange,
  formatQadaaHistoryHijriRange,
  summarizeQadaaHistoryEntry,
  type QadaaHistoryEntry,
} from '../utils/qadaaHistoryPresentation';

import {
  getBottomPadding,
  getTopPadding,
} from '../theme/spacing';

const MOSQUE_IMAGE = require('../assets/images/qadaa-mosque.png');
const LANTERN_IMAGE = require('../assets/images/qadaa-lantern.png');

const C = {
  background: '#F8F4FC',

  white: '#FFFFFF',

  ink: '#302440',
  inkSoft: '#4D4358',

  muted: '#7D7484',
  mutedLight: '#A098A5',

  purple: '#7458A5',
  purpleDark: '#4E317A',

  lavender: '#F2ECFA',
  lavenderLight: '#F7F3FB',
  lavenderBorder: '#E7DFF0',

  green: '#368E6B',
  greenDark: '#276F53',
  greenSoft: '#EAF7F1',
  greenBorder: '#D6EBE1',

  gold: '#A97928',
  goldSoft: '#FBF2DE',

  border: '#ECE6EF',
};

/* -------------------------------------------------------------------------- */
/*                              HISTORY ENTRY                                 */
/* -------------------------------------------------------------------------- */

function HistoryEntryCard({
  entry,
  index,
}: {
  entry: QadaaHistoryEntry;
  index: number;
}): React.JSX.Element {
  const dayLabel =
    entry.ramadanDays > 1 ? 'jours' : 'jour';

  return (
    <Animated.View
      entering={FadeInUp.delay(
        60 * index,
      ).duration(300)}
      style={styles.historyItem}>

      <View style={styles.historyCheck}>
        <MaterialDesignIcons
          name="check"
          size={18}
          color={C.green}
        />
      </View>

      <View style={styles.historyContent}>
        <View style={styles.historyTop}>
          <View style={styles.historyTitleBlock}>
            <Text
              numberOfLines={1}
              style={styles.historyTitle}>
              Ramadan {entry.hijriYear} AH
            </Text>

            <Text style={styles.historyDays}>
              {entry.ramadanDays} {dayLabel}
            </Text>
          </View>

          <View style={styles.historyStatus}>
            <Text style={styles.historyStatusText}>
              À jour
            </Text>
          </View>

          <MaterialDesignIcons
            name="chevron-right"
            size={20}
            color="#91879C"
          />
        </View>

        <View style={styles.historyPeriod}>
          <Text style={styles.historyPeriodLabel}>
            Période des règles
          </Text>

          <Text style={styles.historyHijri}>
            {formatQadaaHistoryHijriRange(entry)}
          </Text>

          <Text style={styles.historyGregorian}>
            (
            {formatQadaaHistoryGregorianRange(
              entry,
            )}
            )
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   SCREEN                                   */
/* -------------------------------------------------------------------------- */

function FastingQadaaScreen(): React.JSX.Element {
  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const {
    remainingQadaaDays,
    hijriYear,
    loading,
    showReminder,
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

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
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
                color={C.purple}
              />
            </Pressable>

            <View style={styles.headerCenter}>
              <MaterialDesignIcons
                name="moon-waning-crescent"
                size={15}
                color={C.purple}
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
                color={C.purple}
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
              color={C.purple}
              style={styles.starOne}
            />

            <MaterialDesignIcons
              name="star-four-points"
              size={7}
              color={C.purple}
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
                      color={C.green}
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
                  color={C.purple}
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

          {/* HISTORY */}

          {historyEntries.length > 0 ? (
            <View
              style={
                styles.historySection
              }>

              <View
                style={
                  styles.sectionHeader
                }>

                <View
                  style={
                    styles.sectionIcon
                  }>
                  <MaterialDesignIcons
                    name="calendar-star"
                    size={16}
                    color={C.purple}
                  />
                </View>

                <Text
                  style={
                    styles.sectionTitle
                  }>
                  Historique
                </Text>
              </View>

              <View
                style={
                  styles.sectionDivider
                }
              />

              {historyEntries.map(
                (entry, index) => (
                  <HistoryEntryCard
                    key={entry.id}
                    entry={entry}
                    index={index}
                  />
                ),
              )}
            </View>
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
                    color={C.purple}
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
                    color={C.purple}
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
                  color="#FFFFFF"
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
                  color={C.muted}
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
                  color="#FFFFFF"
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
                color={C.purple}
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
              color="#9560C7"
            />
          </View>
        </Animated.View>
      </ScrollView>

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
                color={C.purple}
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
              Lorsque tu rattrapes un jour,
              marque-le comme accompli afin
              que ton nombre de jours restants
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
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

    backgroundColor: C.white,

    borderWidth: 1,
    borderColor: C.border,

    elevation: 1,

    shadowColor: '#39294B',

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
    color: C.ink,

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
    borderColor: C.lavenderBorder,

    backgroundColor:
      C.lavenderLight,
  },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,

    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      'rgba(255,255,255,0.10)',
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
    color: '#756B80',

    fontSize: 10.5,
    letterSpacing: 1.5,

    fontWeight: '800',
  },

  heroNumber: {
    marginTop: 7,

    color: C.purpleDark,

    fontFamily: 'serif',

    fontSize: 58,
    lineHeight: 63,

    fontWeight: '700',
  },

  heroLabel: {
    color: C.ink,

    fontSize: 14,

    fontWeight: '700',
  },

  yearPill: {
    marginTop: 12,

    paddingHorizontal: 12,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: C.goldSoft,
  },

  yearPillText: {
    color: C.gold,

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

    backgroundColor: C.greenSoft,
  },

  greenPillText: {
    color: C.green,

    fontSize: 10.5,

    fontWeight: '800',
  },

  zeroSubtitle: {
    maxWidth: 260,

    marginTop: 10,

    color: C.inkSoft,

    fontSize: 11.5,
    lineHeight: 17,

    textAlign: 'center',
  },

  loadingDash: {
    marginTop: 8,

    color: C.muted,

    fontSize: 38,
  },

  loadingText: {
    marginTop: 5,

    color: C.muted,

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
    borderColor: C.border,

    backgroundColor: C.white,

    ...homeShadow,
  },

  reminderIcon: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: C.lavender,
  },

  reminderContent: {
    flex: 1,

    marginLeft: 12,
  },

  reminderTitle: {
    color: C.ink,

    fontFamily: 'serif',

    fontSize: 16,
    lineHeight: 20,

    fontWeight: '700',
  },

  reminderText: {
    marginTop: 3,

    color: C.muted,

    fontSize: 11.5,
    lineHeight: 17,
  },

  historySection: {
    marginTop: 12,

    overflow: 'hidden',

    borderRadius: 17,

    borderWidth: 1,
    borderColor: C.border,

    backgroundColor: C.white,

    ...homeShadow,
  },

  sectionHeader: {
    minHeight: 57,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
  },

  sectionIcon: {
    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: C.lavender,
  },

  sectionTitle: {
    marginLeft: 9,

    color: C.ink,

    fontFamily: 'serif',

    fontSize: 17,

    fontWeight: '700',
  },

  sectionDivider: {
    height: StyleSheet.hairlineWidth,

    backgroundColor: C.border,
  },

  historyItem: {
    minHeight: 118,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  historyCheck: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: C.greenSoft,
  },

  historyContent: {
    flex: 1,

    minWidth: 0,

    marginLeft: 11,
  },

  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,
  },

  historyTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  historyTitle: {
    color: C.ink,

    fontSize: 12.5,

    fontWeight: '800',
  },

  historyDays: {
    marginTop: 2,

    color: C.ink,

    fontSize: 11.5,

    fontWeight: '700',
  },

  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: C.greenSoft,
  },

  historyStatusText: {
    color: C.green,

    fontSize: 9.5,

    fontWeight: '800',
  },

  historyPeriod: {
    marginTop: 7,
  },

  historyPeriodLabel: {
    color: C.muted,

    fontSize: 9.5,

    fontWeight: '600',
  },

  historyHijri: {
    marginTop: 2,

    color: C.inkSoft,

    fontSize: 10.8,
    lineHeight: 15,
  },

  historyGregorian: {
    marginTop: 1,

    color: C.muted,

    fontSize: 10,
    lineHeight: 14,
  },

  aboutCard: {
    minHeight: 150,

    marginTop: 12,

    overflow: 'hidden',

    flexDirection: 'row',
    alignItems: 'stretch',

    borderRadius: 17,

    borderWidth: 1,
    borderColor: C.lavenderBorder,

    backgroundColor: '#F5EFFB',
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

    backgroundColor: '#E9DFF5',
  },

  aboutTitle: {
    flex: 1,

    marginLeft: 8,

    color: C.ink,

    fontFamily: 'serif',

    fontSize: 15.5,
    lineHeight: 19,

    fontWeight: '700',
  },

  aboutText: {
    maxWidth: 215,

    marginTop: 10,

    color: C.inkSoft,

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
    borderColor: C.border,

    backgroundColor: C.white,

    ...homeShadow,
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

    backgroundColor: C.lavender,
  },

  completionHeaderCopy: {
    flex: 1,

    marginLeft: 10,
  },

  completionTitle: {
    color: C.ink,

    fontSize: 12.8,

    fontWeight: '800',
  },

  completionSubtitle: {
    marginTop: 3,

    color: C.muted,

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

    backgroundColor: C.purple,
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
    color: C.white,

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
    color: C.muted,

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
    borderColor: C.greenBorder,

    backgroundColor: C.greenSoft,
  },

  completedIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: C.green,
  },

  completedCopy: {
    flex: 1,

    marginLeft: 10,
  },

  completedTitle: {
    color: C.greenDark,

    fontSize: 12.5,

    fontWeight: '800',
  },

  completedText: {
    marginTop: 2,

    color: '#61796D',

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
    borderColor: C.border,

    backgroundColor: C.white,

    ...homeShadow,
  },

  motivationIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: C.lavender,
  },

  motivationText: {
    flex: 1,

    marginHorizontal: 11,

    color: C.inkSoft,

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
      'rgba(28,20,39,0.42)',
  },

  modalCard: {
    width: '100%',
    maxWidth: 370,

    alignItems: 'center',

    padding: 20,

    borderRadius: 20,

    backgroundColor: '#FFFDFF',

    elevation: 12,
  },

  modalIcon: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: C.lavender,
  },

  modalTitle: {
    marginTop: 11,

    color: C.ink,

    fontFamily: 'serif',

    fontSize: 17,

    fontWeight: '700',
  },

  modalText: {
    marginTop: 9,

    color: C.muted,

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

    backgroundColor: C.purple,
  },

  modalButtonText: {
    color: C.white,

    fontSize: 12.5,

    fontWeight: '800',
  },
});

export default FastingQadaaScreen;