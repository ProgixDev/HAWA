import React, {useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import HomeHeader from '../home/HomeHeader';
import {homeColors, homeShadow} from '../home/homeTheme';
import {getFirstName} from '../../state/onboardingPreferences';
import {MOCK_PREGNANCY} from '../../data/mockPregnancy';

const BACKGROUND = require('../../assets/images/homebackground.png');
const WOMAN = require('../../assets/images/pregnancy/pregnancy-woman-week18.png');
const BABY = require('../../assets/images/pregnancy/baby.png');

type Props = MainTabScreenProps<'CycleHome'>;

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

type Route =
  | 'HydrationScreen'
  | 'MoodEntry'
  | 'SleepEntry'
  | 'ActivityEntry'
  | 'PregnancyWeight'
  | 'PregnancySymptoms'
  | 'NoteEntry'
  | 'PregnancyMedicalInformation'
  | 'PregnancyAppointments';

const DAILY_ITEMS: Array<{
  label: string;
  icon: IconName;
  route: Route;
}> = [
  {
    label: 'Hydratation',
    icon: 'water-outline',
    route: 'HydrationScreen',
  },
  {
    label: 'Humeur',
    icon: 'heart-outline',
    route: 'MoodEntry',
  },
  {
    label: 'Sommeil',
    icon: 'weather-night',
    route: 'SleepEntry',
  },
  {
    label: 'Activité',
    icon: 'run',
    route: 'ActivityEntry',
  },
  {
    label: 'Poids',
    icon: 'scale-bathroom',
    route: 'PregnancyWeight',
  },
  {
    label: 'Symptômes',
    icon: 'clipboard-pulse-outline',
    route: 'PregnancySymptoms',
  },
  {
    label: 'Notes',
    icon: 'notebook-edit-outline',
    route: 'NoteEntry',
  },
  {
    label: 'Infos médicales',
    icon: 'shield-lock-outline',
    route: 'PregnancyMedicalInformation',
  },
  {
    label: 'RDV / Examens',
    icon: 'calendar-clock-outline',
    route: 'PregnancyAppointments',
  },
];

function PregnancyDashboard({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();

  const compact = width < 370;
  const veryCompact = width < 345;

  const entrance = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  const data = MOCK_PREGNANCY;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {
        return;
      }

      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 520,
        useNativeDriver: true,
      }).start();

      if (!reduce) {
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(float, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(float, {
              toValue: 0,
              duration: 2200,
              useNativeDriver: true,
            }),
          ]),
        );

        loop.start();
      }
    });

    return () => {
      active = false;
      loop?.stop();
    };
  }, [entrance, float]);

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            compact && styles.contentCompact,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 128,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}

          <HomeHeader
            firstName={getFirstName()}
            notificationCount={1}
            onPressNotifications={() =>
              Alert.alert(
                'Notifications',
                'Aucune nouvelle notification pour le moment.',
              )
            }
            onPressProfile={() => navigation.navigate('Profile')}
            subtitle=""
          />

          {/* =======================================================
              HERO GROSSESSE
          ======================================================== */}

          <Animated.View
            style={[
              styles.heroSection,
              compact && styles.heroSectionCompact,
              veryCompact && styles.heroSectionVeryCompact,
              {
                opacity: entrance,
                transform: [
                  {
                    translateY: entrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}>
            {/* CARTE SEMAINE */}

            <View
              style={[
                styles.weekPanel,
                compact && styles.weekPanelCompact,
                veryCompact && styles.weekPanelVeryCompact,
              ]}>
              <View style={styles.weekTopRow}>
                <View style={styles.weekMiniIcon}>
                  <MaterialDesignIcons
                    color={homeColors.primary}
                    name="calendar-heart"
                    size={16}
                  />
                </View>

                <Text style={styles.weekLabel}>
                  Semaine actuelle
                </Text>
              </View>

              <View
                style={[
                  styles.weekNumberCircle,
                  compact && styles.weekNumberCircleCompact,
                  veryCompact && styles.weekNumberCircleVeryCompact,
                ]}>
                <Text
                  style={[
                    styles.weekNumber,
                    compact && styles.weekNumberCompact,
                    veryCompact && styles.weekNumberVeryCompact,
                  ]}>
                  {data.week}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.age,
                  compact && styles.ageCompact,
                ]}>
                {data.gestationalAgeWeeks} SA +{' '}
                {data.gestationalAgeDays} jours
              </Text>

              <View style={styles.weekDivider} />

              <View style={styles.trimester}>
                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="creation-outline"
                  size={13}
                />

                <Text style={styles.trimesterText}>
                  {data.trimester}e trimestre
                </Text>
              </View>
            </View>

            {/* FEMME */}

            <Image
              accessibilityLabel="Illustration d’une femme enceinte"
              resizeMode="contain"
              source={WOMAN}
              style={[
                styles.woman,
                compact && styles.womanCompact,
                veryCompact && styles.womanVeryCompact,
              ]}
            />
          </Animated.View>

          {/* =======================================================
              DPA
          ======================================================== */}

          <View style={styles.dueCard}>
            <View style={styles.dueColumn}>
              <View style={styles.dueLabelRow}>
                <View style={styles.smallIconCircle}>
                  <MaterialDesignIcons
                    color={homeColors.primary}
                    name="calendar-heart"
                    size={17}
                  />
                </View>

                <Text style={styles.muted}>
                  DPA
                </Text>
              </View>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.dueValue}>
                {data.dueDateLabel}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.remainingColumn}>
              <View style={styles.dueLabelRow}>
                <View style={styles.smallIconCircle}>
                  <MaterialDesignIcons
                    color={homeColors.primary}
                    name="timer-sand"
                    size={17}
                  />
                </View>

                <Text style={styles.muted}>
                  Temps restant
                </Text>
              </View>

              <Text style={styles.remainingValue}>
                {data.remainingWeeks} semaines
              </Text>

              <Text style={styles.remainingSub}>
                restantes
              </Text>
            </View>
          </View>

          {/* =======================================================
              CETTE SEMAINE / BÉBÉ
          ======================================================== */}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voir les informations de cette semaine"
            onPress={() =>
              navigation.navigate('PregnancyWeek')
            }
            style={({pressed}) => [
              styles.babyCard,
              compact && styles.babyCardCompact,
              pressed && styles.pressed,
            ]}>
            <View style={styles.babyCopy}>
              <Text style={styles.cardTitle}>
                Cette semaine
              </Text>

              <Text style={styles.babyEyebrow}>
                Ton bébé
              </Text>

              <Text style={styles.babyLine}>
                Pèse environ{' '}
                <Text style={styles.strong}>
                  {data.babyWeightLabel}
                </Text>
              </Text>

              <Text style={styles.babyLine}>
                Mesure environ{' '}
                <Text style={styles.strong}>
                  {data.babyLengthLabel}
                </Text>
              </Text>

              <View style={styles.weekLink}>
                <Text style={styles.weekLinkText}>
                  Découvrir la semaine
                </Text>

                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="chevron-right"
                  size={18}
                />
              </View>
            </View>

            <Animated.Image
              accessibilityLabel={`Illustration du bébé à la semaine ${data.week}`}
              resizeMode="contain"
              source={BABY}
              style={[
                styles.baby,
                compact && styles.babyCompact,
                {
                  transform: [
                    {
                      scale: float.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.025],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Pressable>

          {/* =======================================================
              RDV + EXAMEN
          ======================================================== */}

          <View
            style={[
              styles.appointmentRow,
              veryCompact && styles.appointmentRowVeryCompact,
            ]}>
            <AppointmentCard
              icon="calendar-month-outline"
              label="Prochain RDV"
              lines={[
                data.nextAppointment.dateLabel,
                data.nextAppointment.timeLabel,
                data.nextAppointment.type,
                data.nextAppointment.practitioner,
              ]}
              onPress={() =>
                navigation.navigate('PregnancyAppointments')
              }
            />

            <AppointmentCard
              icon="medical-bag"
              label="Prochain examen"
              lines={[
                data.nextExam.dateLabel,
                data.nextExam.type,
              ]}
              onPress={() =>
                navigation.navigate('PregnancyAppointments')
              }
            />
          </View>

          {/* =======================================================
              SUIVI DU JOUR
          ======================================================== */}

          <View style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Suivi du jour
                </Text>

                <Text style={styles.dailySubtitle}>
                  Prends un instant pour toi
                </Text>
              </View>

              <Text style={styles.dailyProgress}>
                <Text style={styles.dailyProgressStrong}>
                  0 / 9
                </Text>{' '}
                complété
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <View style={styles.dailyGrid}>
              {DAILY_ITEMS.map(item => (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                  key={item.label}
                  onPress={() =>
                    navigation.navigate(item.route)
                  }
                  style={({pressed}) => [
                    styles.dailyItem,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.dailyIcon}>
                    <MaterialDesignIcons
                      color={homeColors.primary}
                      name={item.icon}
                      size={22}
                    />
                  </View>

                  <Text
                    numberOfLines={2}
                    style={styles.dailyLabel}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ============================================================
   APPOINTMENT CARD
============================================================ */

function AppointmentCard({
  icon,
  label,
  lines,
  onPress,
}: {
  icon: IconName;
  label: string;
  lines: readonly string[];
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.appointmentCard,
        pressed && styles.pressed,
      ]}>
      <View style={styles.appointmentTop}>
        <View style={styles.appointmentIcon}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name={icon}
            size={24}
          />
        </View>

        <View style={styles.appointmentChevron}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name="chevron-right"
            size={18}
          />
        </View>
      </View>

      <View style={styles.appointmentCopy}>
        <Text style={styles.appointmentLabel}>
          {label}
        </Text>

        {lines.map((line, index) => (
          <Text
            key={`${line}-${index}`}
            numberOfLines={1}
            style={[
              styles.appointmentLine,
              index === 0 && styles.appointmentMain,
            ]}>
            {line}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F7F2FC',
  },

  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },

  contentCompact: {
    paddingHorizontal: 11,
  },

  /* ==========================================================
     HERO
  ========================================================== */

  heroSection: {
    position: 'relative',
    height: 300,
    marginTop: 12,
  },

  heroSectionCompact: {
    height: 285,
  },

  heroSectionVeryCompact: {
    height: 270,
  },

  /* ==========================================================
     CARTE SEMAINE PREMIUM
  ========================================================== */

  weekPanel: {
    ...homeShadow,

    position: 'absolute',
    left: 2,
    top: 25,
    zIndex: 4,

    width: '53%',
    minHeight: 238,

    alignItems: 'center',

    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 15,

    borderWidth: 1,
    borderColor: 'rgba(111, 78, 190, 0.12)',
    borderRadius: 28,

    backgroundColor: 'rgba(255,255,255,0.95)',

    shadowColor: '#6247A8',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.11,
    shadowRadius: 18,

    elevation: 5,
  },

  weekPanelCompact: {
    width: '54%',
    minHeight: 222,

    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 13,

    borderRadius: 25,
  },

  weekPanelVeryCompact: {
    width: '55%',
    minHeight: 208,

    top: 20,

    paddingHorizontal: 8,
  },

  weekTopRow: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 6,
  },

  weekMiniIcon: {
    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: '#F2EBFC',
  },

  weekLabel: {
    color: homeColors.textSecondary,

    fontSize: 11.5,
    fontWeight: '700',

    letterSpacing: 0.1,
  },

  weekNumberCircle: {
    width: 105,
    height: 105,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 12,

    borderRadius: 53,

    borderWidth: 1,
    borderColor: 'rgba(112, 78, 190, 0.10)',

    backgroundColor: '#F5F0FC',
  },

  weekNumberCircleCompact: {
    width: 94,
    height: 94,

    marginTop: 10,

    borderRadius: 47,
  },

  weekNumberCircleVeryCompact: {
    width: 84,
    height: 84,

    borderRadius: 42,
  },

  weekNumber: {
    color: '#321477',

    fontFamily: 'serif',
    fontSize: 60,
    lineHeight: 64,
    fontWeight: '800',

    textAlign: 'center',
  },

  weekNumberCompact: {
    fontSize: 53,
    lineHeight: 57,
  },

  weekNumberVeryCompact: {
    fontSize: 47,
    lineHeight: 51,
  },

  age: {
    marginTop: 10,

    color: homeColors.textPrimary,

    fontSize: 14,
    fontWeight: '800',

    textAlign: 'center',
  },

  ageCompact: {
    fontSize: 12.5,
  },

  weekDivider: {
    width: '58%',
    height: 1,

    marginTop: 11,
    marginBottom: 9,

    backgroundColor: '#ECE4F5',
  },

  trimester: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,

    paddingHorizontal: 11,
    paddingVertical: 6,

    borderRadius: 15,

    backgroundColor: '#EEE6FA',
  },

  trimesterText: {
    color: homeColors.primary,

    fontSize: 10.5,
    fontWeight: '800',
  },

  /* ==========================================================
     FEMME
  ========================================================== */

  woman: {
    position: 'absolute',

    right: -10,
    bottom: -2,

    width: '61%',
    height: '100%',

    zIndex: 2,
  },

  womanCompact: {
    right: -17,

    width: '59%',
    height: '97%',
  },

  womanVeryCompact: {
    right: -20,

    width: '58%',
    height: '94%',
  },

  /* ==========================================================
     DPA
  ========================================================== */

  dueCard: {
    ...homeShadow,

    minHeight: 102,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 2,
    paddingHorizontal: 17,
    paddingVertical: 14,

    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.07)',

    backgroundColor: '#FFFFFF',
  },

  dueColumn: {
    flex: 1.15,
    minWidth: 0,
  },

  remainingColumn: {
    flex: 0.85,
    minWidth: 0,
  },

  dueLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  smallIconCircle: {
    width: 29,
    height: 29,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor: '#F1EAFB',
  },

  muted: {
    color: homeColors.textSecondary,

    fontSize: 11.5,
    fontWeight: '600',
  },

  dueValue: {
    marginTop: 8,

    color: homeColors.textPrimary,

    fontSize: 17,
    fontWeight: '800',
  },

  verticalDivider: {
    width: 1,
    height: 60,

    marginHorizontal: 15,

    backgroundColor: '#E6DEF0',
  },

  remainingValue: {
    marginTop: 8,

    color: homeColors.textPrimary,

    fontSize: 15,
    fontWeight: '800',

    textAlign: 'left',
  },

  remainingSub: {
    marginTop: 2,

    color: homeColors.textSecondary,

    fontSize: 11.5,
  },

  /* ==========================================================
     BABY CARD
  ========================================================== */

  babyCard: {
    ...homeShadow,

    minHeight: 190,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 14,

    paddingLeft: 19,
    paddingRight: 10,
    paddingVertical: 17,

    overflow: 'hidden',

    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.07)',

    backgroundColor: '#FFFFFF',
  },

  babyCardCompact: {
    minHeight: 178,

    paddingLeft: 15,
  },

  babyCopy: {
    flex: 1,
    minWidth: 0,

    zIndex: 3,
  },

  cardTitle: {
    color: homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',
  },

  babyEyebrow: {
    marginTop: 15,

    color: homeColors.primary,

    fontSize: 15,
    fontWeight: '800',
  },

  babyLine: {
    marginTop: 8,

    color: homeColors.textSecondary,

    fontSize: 12.5,
    lineHeight: 18,
  },

  strong: {
    color: homeColors.textPrimary,
    fontWeight: '800',
  },

  weekLink: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

    marginTop: 13,
  },

  weekLinkText: {
    color: homeColors.primary,

    fontSize: 11.5,
    fontWeight: '700',
  },

  baby: {
    width: '46%',
    maxWidth: 170,

    aspectRatio: 1,

    marginRight: -2,
  },

  babyCompact: {
    width: '43%',
    maxWidth: 145,
  },

  /* ==========================================================
     APPOINTMENTS
  ========================================================== */

  appointmentRow: {
    flexDirection: 'row',

    gap: 10,

    marginTop: 14,
  },

  appointmentRowVeryCompact: {
    gap: 7,
  },

  appointmentCard: {
    ...homeShadow,

    flex: 1,

    minWidth: 0,
    minHeight: 160,

    padding: 13,

    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.07)',

    backgroundColor: '#FFFFFF',
  },

  appointmentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  appointmentIcon: {
    width: 44,
    height: 44,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 17,

    backgroundColor: '#F0E9FB',
  },

  appointmentChevron: {
    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor: '#F4EFFB',
  },

  appointmentCopy: {
    minWidth: 0,

    marginTop: 10,
  },

  appointmentLabel: {
    color: homeColors.textSecondary,

    fontSize: 11.5,
  },

  appointmentLine: {
    marginTop: 3,

    color: homeColors.textSecondary,

    fontSize: 10.5,
  },

  appointmentMain: {
    marginTop: 5,

    color: homeColors.textPrimary,

    fontSize: 13.5,
    fontWeight: '800',
  },

  /* ==========================================================
     DAILY
  ========================================================== */

  dailyCard: {
    ...homeShadow,

    marginTop: 14,

    padding: 16,

    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.07)',

    backgroundColor: '#FFFFFF',
  },

  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    gap: 12,
  },

  dailySubtitle: {
    marginTop: 4,

    color: homeColors.textSecondary,

    fontSize: 10.5,
  },

  dailyProgress: {
    color: homeColors.textSecondary,

    fontSize: 11,
  },

  dailyProgressStrong: {
    color: homeColors.primary,

    fontWeight: '800',
  },

  progressTrack: {
    height: 5,

    overflow: 'hidden',

    marginTop: 12,

    borderRadius: 3,

    backgroundColor: '#EEE8F7',
  },

  progressFill: {
    width: '0%',
    height: '100%',

    borderRadius: 3,

    backgroundColor: homeColors.primary,
  },

  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    marginTop: 15,

    rowGap: 15,
  },

  dailyItem: {
    width: '33.333%',
    minWidth: 0,

    alignItems: 'center',

    paddingHorizontal: 2,
  },

  dailyIcon: {
    width: 46,
    height: 46,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor: '#F0E9FB',
  },

  dailyLabel: {
    marginTop: 6,

    color: homeColors.textSecondary,

    fontSize: 9.5,
    lineHeight: 12,

    textAlign: 'center',
  },

  pressed: {
    opacity: 0.78,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});

export default PregnancyDashboard;