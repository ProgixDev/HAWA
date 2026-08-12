import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {type QuickActionItem} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import {homeColors, homeShadow} from '../home/homeTheme';
import {getFirstName, getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {
  getPregnancyDating,
  getPregnancyTrackingPreferences,
  hydratePregnancyDating,
  hydratePregnancyTrackingPreferences,
  subscribePregnancyDating,
  subscribePregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../../state/pregnancyPreferences';
import {computePregnancyStatus, isPregnancyTrackingCategoryCompleted} from '../../utils/pregnancyTrackingUtils';
import {usePregnancySpiritualStatus} from '../../hooks/usePrayerPurityStatus';
import {formatHijriDate} from '../../utils/cycleMath';
import {getJournalEntry} from '../../state/dailyJournalStore';
import {getPregnancyJournalState, type PregnancyJournalState} from '../../state/pregnancyJournalStore';
import {
  getNextUpcomingEvent,
  getPregnancyMedicalEvents,
  type PregnancyMedicalEvent,
} from '../../state/pregnancyMedicalEventsStore';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import type {DailyJournalEntry} from '../../types/journal';
import BabyDevelopmentImage from './BabyDevelopmentImage';

const BACKGROUND = require('../../assets/images/homebackground.png');
const WOMAN = require('../../assets/images/pregnancy/pregnancy-woman-week18.png');
// No week-specific, medically-validated fetal illustration exists yet (see
// src/data/pregnancyWeekData.ts) — the "Ton bébé" card falls back to a
// neutral icon (below) instead of showing one fixed developed-fetus image
// for every week, which would be misleading this early in the pregnancy.

// Same palette CycleHomeScreen's quickActionItems already use — keeps the
// two dashboards' Actions rapides visually identical (spiritual actions in
// purple, journal in rose, statistics in teal).
const PURPLE = '#6949BE';

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
  preferenceKey: PregnancyTrackingPreference;
}> = [
  {
    label: 'Hydratation',
    icon: 'water-outline',
    route: 'HydrationScreen',
    preferenceKey: 'hydration',
  },
  {
    label: 'Humeur',
    icon: 'heart-outline',
    route: 'MoodEntry',
    preferenceKey: 'mood',
  },
  {
    label: 'Sommeil',
    icon: 'weather-night',
    route: 'SleepEntry',
    preferenceKey: 'sleep',
  },
  {
    label: 'Activité',
    icon: 'run',
    route: 'ActivityEntry',
    preferenceKey: 'activity',
  },
  {
    label: 'Poids',
    icon: 'scale-bathroom',
    route: 'PregnancyWeight',
    preferenceKey: 'weight',
  },
  {
    label: 'Symptômes',
    icon: 'clipboard-pulse-outline',
    route: 'PregnancySymptoms',
    preferenceKey: 'symptoms',
  },
  {
    label: 'Notes',
    icon: 'notebook-edit-outline',
    route: 'NoteEntry',
    preferenceKey: 'notes',
  },
  {
    label: 'Infos médicales',
    icon: 'shield-lock-outline',
    route: 'PregnancyMedicalInformation',
    preferenceKey: 'medicalInfo',
  },
  {
    label: 'RDV / Examens',
    icon: 'calendar-clock-outline',
    route: 'PregnancyAppointments',
    preferenceKey: 'appointments',
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

  // Canonical pregnancy onboarding data (src/state/pregnancyPreferences.ts)
  // — the same source SummaryScreen reads. Core values (week, gestational
  // age, trimester, DPA, progress) are derived from this via
  // computePregnancyStatus; appointments/exams come from
  // pregnancyMedicalEventsStore and baby info from pregnancyWeekData, both
  // real, below.
  const [dating, setDating] = useState(getPregnancyDating);
  const [trackingPreferences, setTrackingPreferences] = useState(getPregnancyTrackingPreferences);

  useEffect(() => {
    let active = true;
    hydratePregnancyDating().then(value => {if (active) {setDating(value);}});
    const unsubscribeDating = subscribePregnancyDating(() => {if (active) {setDating(getPregnancyDating());}});
    hydratePregnancyTrackingPreferences().then(value => {if (active) {setTrackingPreferences(value);}});
    const unsubscribeTracking = subscribePregnancyTrackingPreferences(() => {
      if (active) {setTrackingPreferences(getPregnancyTrackingPreferences());}
    });
    return () => {
      active = false;
      unsubscribeDating();
      unsubscribeTracking();
    };
  }, []);

  const status = useMemo(
    () => computePregnancyStatus(dating.method, dating.date ? new Date(dating.date) : null, new Date()),
    [dating],
  );

  const visibleDailyItems = useMemo(
    () => DAILY_ITEMS.filter(item => trackingPreferences.has(item.preferenceKey)),
    [trackingPreferences],
  );

  // Real, date-specific journal/medical data — refreshed on every focus so
  // returning from a journal screen or the Appointments screen immediately
  // reflects what was just saved.
  const [todayEntry, setTodayEntry] = useState<DailyJournalEntry | undefined>(undefined);
  const [pregnancyJournal, setPregnancyJournal] = useState<PregnancyJournalState>({symptoms: [], weights: []});
  const [medicalEvents, setMedicalEvents] = useState<PregnancyMedicalEvent[]>([]);
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getJournalEntry(todayKey), getPregnancyJournalState(), getPregnancyMedicalEvents()]).then(
        ([daily, pregnancy, events]) => {
          if (active) {
            setTodayEntry(daily);
            setPregnancyJournal(pregnancy);
            setMedicalEvents(events);
          }
        },
      );
      return () => {active = false;};
    }, [todayKey]),
  );

  const completedTodayCount = useMemo(
    () =>
      visibleDailyItems.filter(item =>
        isPregnancyTrackingCategoryCompleted(item.preferenceKey, todayKey, todayEntry, pregnancyJournal, medicalEvents),
      ).length,
    [visibleDailyItems, todayKey, todayEntry, pregnancyJournal, medicalEvents],
  );

  const nextAppointment = useMemo(() => getNextUpcomingEvent(medicalEvents, 'appointment', new Date()), [medicalEvents]);
  const nextExam = useMemo(() => getNextUpcomingEvent(medicalEvents, 'exam', new Date()), [medicalEvents]);

  // Week-specific baby reference content — see src/data/pregnancyWeekData.ts.
  // No fabricated fallback: when nothing is available for this week, the
  // "Ton bébé" card shows an honest message instead of a fixed number.
  const weekData = status.configured ? getPregnancyWeekData(status.week) : undefined;

  // Same shared bottom-sheet context Cycle uses — JournalSheetHost (see
  // MainTabNavigator.tsx) already renders PregnancyJournalSheet instead of
  // DailyJournalSheet while activeObjective === 'pregnancy', so opening it
  // here needs no Pregnancy-specific wiring.
  const {open: openPregnancyJournal} = useJournalSheet();

  // Same 6-slot architecture/keys/colors as CycleHomeScreen's
  // quickActionItems, routed to the identical shared screens — only the
  // "Journal quotidien" action and its icon tint differ per objective, and
  // even that difference is handled by the shared JournalSheetHost, not by
  // a Pregnancy-specific route.
  const pregnancyQuickActionItems: QuickActionItem[] = [
    {key: 'prayer-times', icon: 'mosque', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Horaires\nde prière', onPress: () => navigation.navigate('PrayerTimes')},
    {key: 'library', icon: 'book-open-page-variant-outline', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Bibliothèque', onPress: () => navigation.navigate('Library')},
    {key: 'daily-journal', icon: 'notebook-edit-outline', iconColor: '#B23F63', iconBg: '#F9DCE8', label: 'Journal quotidien', onPress: openPregnancyJournal},
    {key: 'hijri-calendar', icon: 'moon-waning-crescent', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Calendrier Hijri', onPress: () => navigation.navigate('HijriCalendar')},
    {key: 'qadaa', icon: 'silverware-fork-knife', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Jeûne à rattraper', onPress: () => navigation.navigate('FastingQadaa')},
    {key: 'statistics', icon: 'chart-donut', iconColor: '#2C8E93', iconBg: '#DDF0F1', label: 'Statistiques', onPress: () => navigation.navigate('Statistics')},
  ];

  // Same global "Repères spirituels" preference Cycle reads (no dedicated
  // hydrate/subscribe — it's a session-only in-memory flag, so it's kept in
  // sync on focus exactly like CycleHomeScreen does).
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(getSpiritualMarkersEnabled());
  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  // Pregnancy-safe prayer/location fetch — same underlying schedule service
  // as Cycle, but never derives menstruation/purity status.
  const spiritual = usePregnancySpiritualStatus(spiritualMarkersEnabled);

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

          {status.configured ? (
            <>
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
                      {status.week}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.age,
                      compact && styles.ageCompact,
                    ]}>
                    {status.gestationalWeeks} SA +{' '}
                    {status.gestationalDays} jours
                  </Text>

                  <View style={styles.weekDivider} />

                  <View style={styles.trimester}>
                    <MaterialDesignIcons
                      color={homeColors.primary}
                      name="creation-outline"
                      size={13}
                    />

                    <Text style={styles.trimesterText}>
                      {status.trimester}e trimestre
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
                    {status.estimatedDueDate
                      ? new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(status.estimatedDueDate)
                      : '—'}
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

                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.remainingValue}>
                    {status.remainingWeeks} semaines
                    {status.remainingDaysRemainder > 0 ? ` + ${status.remainingDaysRemainder} jours` : ''}
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
                    {weekData?.babyDescription ??
                      'Les informations détaillées de cette semaine seront bientôt disponibles.'}
                  </Text>

                  {weekData?.weight ? (
                    <Text style={styles.babyLine}>
                      Pèse environ{' '}
                      <Text style={styles.strong}>
                        {weekData.weight}
                      </Text>
                    </Text>
                  ) : null}

                  {weekData?.length ? (
                    <Text style={styles.babyLine}>
                      Mesure environ{' '}
                      <Text style={styles.strong}>
                        {weekData.length}
                      </Text>
                    </Text>
                  ) : null}

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

                {weekData?.babyImage != null ? (
                  <BabyDevelopmentImage
                    accessibilityLabel={`Illustration du bébé à la semaine ${status.week}`}
                    source={weekData.babyImage}
                    style={[styles.baby, compact && styles.babyCompact]}
                  />
                ) : (
                  <View
                    accessibilityLabel="Illustration non disponible pour cette semaine"
                    style={[styles.baby, compact && styles.babyCompact, styles.babyPlaceholder]}>
                    <MaterialDesignIcons color={homeColors.primary} name="baby-face-outline" size={compact ? 38 : 46} />
                  </View>
                )}
              </Pressable>
            </>
          ) : (
            <UnconfiguredPregnancyCard
              onConfigure={() => navigation.navigate('PregnancyDatingSetup')}
            />
          )}

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
              lines={
                nextAppointment
                  ? [
                      new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(
                        new Date(`${nextAppointment.date}T12:00:00`),
                      ),
                      nextAppointment.time ?? '',
                      nextAppointment.title,
                      nextAppointment.practitioner ?? '',
                    ].filter(Boolean)
                  : ['Aucun rendez-vous prévu']
              }
              onPress={() =>
                navigation.navigate('PregnancyAppointments', {
                  initialType: 'appointment',
                  eventId: nextAppointment?.id,
                })
              }
            />

            <AppointmentCard
              icon="medical-bag"
              label="Prochain examen"
              lines={
                nextExam
                  ? [
                      new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(
                        new Date(`${nextExam.date}T12:00:00`),
                      ),
                      nextExam.time ?? '',
                      nextExam.title,
                    ].filter(Boolean)
                  : ['Aucun examen prévu']
              }
              onPress={() =>
                navigation.navigate('PregnancyAppointments', {
                  initialType: 'exam',
                  eventId: nextExam?.id,
                })
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
                  {completedTodayCount} / {visibleDailyItems.length}
                </Text>{' '}
                complété
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${visibleDailyItems.length > 0 ? Math.round((completedTodayCount / visibleDailyItems.length) * 100) : 0}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.dailyGrid}>
              {visibleDailyItems.map(item => (
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

          {/* =======================================================
              ACTIONS RAPIDES
              Same shared QuickActionsGrid component/card architecture as
              Cycle — only the items array (routes/labels) differs.
          ======================================================== */}

          <QuickActionsGrid items={pregnancyQuickActionItems} />

          {/* =======================================================
              REPÈRES SPIRITUELS
              Same shared card/preference as Cycle (SpiritualGuidanceCard,
              getSpiritualMarkersEnabled) — objective="pregnancy" hides the
              menstrual purity badge, purity-restored summary, and
              period-derived qadaa block. No pregnancy-specific spiritual
              logic is introduced here.
          ======================================================== */}

          {spiritualMarkersEnabled ? (
            <SpiritualGuidanceCard
              hijriDate={spiritual.schedule?.hijriDate ?? formatHijriDate(new Date())}
              locationConfigured={Boolean(spiritual.selectedLocation)}
              locationName={
                spiritual.selectedLocation
                  ? `${spiritual.selectedLocation.city}, ${spiritual.selectedLocation.country}`
                  : undefined
              }
              nextWindow={spiritual.nextWindow}
              objective="pregnancy"
              onManage={() => navigation.navigate('SpiritualPreferences')}
              prayerError={spiritual.error}
              prayerLoading={spiritual.loading}
              timezone={spiritual.schedule?.timezone}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ============================================================
   UNCONFIGURED PREGNANCY STATE
   Shown instead of the week/DPA/baby hero while no real dating
   information has been provided yet (method === 'later' or no date
   chosen) — never a fabricated week/DPA.
============================================================ */

function UnconfiguredPregnancyCard({onConfigure}: {onConfigure: () => void}): React.JSX.Element {
  return (
    <View style={styles.unconfiguredCard}>
      <View style={styles.unconfiguredIcon}>
        <MaterialDesignIcons color={homeColors.primary} name="human-pregnant" size={30} />
      </View>
      <Text style={styles.unconfiguredTitle}>Configurer ma grossesse</Text>
      <Text style={styles.unconfiguredText}>
        Indique le début de ta grossesse pour voir ta semaine, ta date prévue d’accouchement et ta progression.
      </Text>
      <Pressable
        accessibilityLabel="Configurer ma grossesse"
        accessibilityRole="button"
        onPress={onConfigure}
        style={({pressed}) => [styles.unconfiguredButton, pressed && styles.pressed]}>
        <Text style={styles.unconfiguredButtonText}>Configurer ma grossesse</Text>
      </Pressable>
    </View>
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

  babyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 24,

    backgroundColor: '#F0E9FB',
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

  /* ==========================================================
     UNCONFIGURED PREGNANCY STATE
  ========================================================== */

  unconfiguredCard: {
    ...homeShadow,

    alignItems: 'center',

    marginTop: 12,
    padding: 22,

    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.10)',

    backgroundColor: '#FFFFFF',
  },

  unconfiguredIcon: {
    width: 60,
    height: 60,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 30,

    backgroundColor: '#F0E9FB',
  },

  unconfiguredTitle: {
    marginTop: 14,

    color: homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',

    textAlign: 'center',
  },

  unconfiguredText: {
    marginTop: 8,

    maxWidth: 300,

    color: homeColors.textSecondary,

    fontSize: 12.5,
    lineHeight: 18,

    textAlign: 'center',
  },

  unconfiguredButton: {
    minHeight: 48,

    marginTop: 16,
    paddingHorizontal: 22,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 16,

    backgroundColor: homeColors.primary,
  },

  unconfiguredButtonText: {
    color: '#FFFFFF',

    fontSize: 14,
    fontWeight: '700',
  },
});

export default PregnancyDashboard;
