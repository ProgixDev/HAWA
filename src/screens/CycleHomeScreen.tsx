import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import type {CyclePhase} from '../components/home/CycleStatusCard';
import HomeHeader from '../components/home/HomeHeader';
import HeroCycleCard from '../components/home/HeroCycleCard';
import CycleOverviewCard, {type OverviewItem} from '../components/home/CycleOverviewCard';
import QuickActionsGrid, {type QuickActionItem} from '../components/home/QuickActionsGrid';
import SpiritualGuidanceCard from '../components/home/SpiritualGuidanceCard';
import DailyJournalCard from '../components/home/DailyJournalCard';
import MotivationCard from '../components/home/MotivationCard';
import PeriodStartBottomSheet from '../components/calendar/PeriodStartBottomSheet';
import {useJournalSheet} from '../navigation/JournalSheetContext';
import {usePrayerPurityStatus} from '../hooks/usePrayerPurityStatus';
import {useQadaaStatus} from '../hooks/useQadaaStatus';
import {
  getCyclePreferences,
  getCycleObservationStartedAt,
  getPeriodHistory,
  hydrateCyclePreferences,
  isDateWithinConfirmedPeriod,
  subscribeCyclePreferences,
  getFirstName,
  getSpiritualMarkersEnabled,
} from '../state/onboardingPreferences';
import {getJournalEntry} from '../state/dailyJournalStore';
import type {DailyJournalEntry} from '../types/journal';
import {TOP_SPACING_EXTRA} from '../theme/spacing';
import {loadPersonalInformation} from '../state/personalInformationStore';
import {
  computeCyclePredictionStatus,
  cycleDayFor,
  diffDays,
  formatDateRange,
  formatHijriDate,
  formatShortDate,
  IRREGULAR_WINDOW_MAX_DAYS,
  IRREGULAR_WINDOW_MIN_DAYS,
  ovulationDayFor,
  phaseFor,
  startOfDay,
  upcomingDateForCycleDay,
} from '../utils/cycleMath';

const PURPLE = '#6949BE';
const PERIOD = '#DC7B82';
const PERIOD_LIGHT = '#F7D7D6';
const OVULATION = '#4E319A';

const BACKGROUND = require('../assets/images/auth-mosque-background.png');

type Props = MainTabScreenProps<'CycleHome'>;

function CycleHomeScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [initial, setCyclePreferencesState] = useState(getCyclePreferences);
  const {open: openJournal} = useJournalSheet();

  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | undefined>(undefined);
  const [, setProfileRevision] = useState(0);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaEntrance = useRef(new Animated.Value(0)).current;

  const [periodStartSheetVisible, setPeriodStartSheetVisible] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Single source of truth for menstruation/purity/prayer-due, shared with
  // PrayerTimesScreen — see src/hooks/usePrayerPurityStatus.ts. Disabled
  // (no network fetch) while spiritual markers are turned off.
  const prayer = usePrayerPurityStatus(spiritualMarkersEnabled);

  // Canonical qadaa counter — same hook/state FastingQadaaScreen and the
  // Hijri Calendar shortcut read from, see src/hooks/useQadaaStatus.ts.
  const qadaa = useQadaaStatus();

  useEffect(() => {
    Animated.timing(entrance, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    Animated.timing(ctaEntrance, {
      duration: 300,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [ctaEntrance]);

  useEffect(() => {
    let mounted = true;
    hydrateCyclePreferences().then(value => {if (mounted) {setCyclePreferencesState(value);}});
    const unsubscribe = subscribeCyclePreferences(() => {if (mounted) {setCyclePreferencesState(getCyclePreferences());}});
    return () => {mounted = false; unsubscribe();};
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(() => {
        if (mounted) {setProfileRevision(current => current + 1);}
      });
      getJournalEntry(new Date().toLocaleDateString('en-CA')).then(entry => {
        if (mounted) {setJournalEntry(entry);}
      });
      return () => {mounted = false;};
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  const ovulationDay = ovulationDayFor(initial.cycleDuration);

  // "Mes règles ont commencé" only makes sense when today ISN'T already
  // covered by a real confirmed period — phaseFor() alone can't tell that
  // apart from a merely predicted menstrual day, so this checks the actual
  // confirmed period history instead.
  const hasActiveConfirmedPeriod = isDateWithinConfirmedPeriod(today);

  // Regularity-aware next-period prediction — 'yes' behaves exactly as
  // before, 'no'/observed-variable produce a 26–32 day window instead of a
  // single certain date, and 'unknown' stays in observation mode until
  // enough real periods have been recorded. See computeCyclePredictionStatus
  // in cycleMath.ts — the one place this logic lives.
  const periodStartDates = getPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  const predictionStatus = computeCyclePredictionStatus(initial, initial.regularity, periodStartDates, getCycleObservationStartedAt(), today);

  // cycleDayFor()/phaseFor() wrap the elapsed day count modulo cycleDuration,
  // which only means something once a single cycle length can be trusted —
  // i.e. predictionStatus.mode === 'exact' (declared-regular, or an observed
  // regular-looking pattern; using the OBSERVED average keeps this in sync
  // with the same prediction). Outside 'exact' (irregular window / still
  // observing), there is no reliable length to wrap by: elapsed days since
  // the latest confirmed start can legitimately exceed cycleDuration (a late
  // irregular period), and wrapping would silently — and wrongly — restart
  // the count as if a new period had begun on schedule. In that case "Jour
  // du cycle" is simply the raw elapsed count, and "menstruation" is only
  // ever shown when that raw count actually falls within the real bleeding
  // window, never because the wrap happened to land there by coincidence.
  const rawCycleDay = diffDays(today, initial.lastPeriodStart) + 1;
  const isReliablyMenstruating = rawCycleDay <= initial.periodDuration;
  const currentCycleDay = predictionStatus.mode === 'exact'
    ? cycleDayFor(today, {...initial, cycleDuration: predictionStatus.averageCycleLength})
    : rawCycleDay;
  const currentPhase: CyclePhase = (() => {
    if (predictionStatus.mode === 'exact') {
      return phaseFor(today, {...initial, cycleDuration: predictionStatus.averageCycleLength});
    }
    if (isReliablyMenstruating) {return 'menstruation';}
    const wrappedPhase = phaseFor(today, initial);
    return wrappedPhase === 'menstruation' ? 'follicular' : wrappedPhase;
  })();
  const nextPeriodTile = (() => {
    if (predictionStatus.mode === 'exact') {
      const daysUntil = Math.max(0, diffDays(predictionStatus.date, today));
      return {value: formatShortDate(predictionStatus.date), subtitle: `Dans ${daysUntil} jours`};
    }
    if (predictionStatus.mode === 'window') {
      if (predictionStatus.isLate) {
        return {value: 'Règles en retard', subtitle: `Fenêtre : ${formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd)}`};
      }
      const daysUntilStart = diffDays(predictionStatus.windowStart, today);
      return {
        value: formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd),
        subtitle: daysUntilStart > 0 ? `Dans ${daysUntilStart} jours` : 'Fenêtre estimée en cours',
      };
    }
    return predictionStatus.complete
      ? {value: 'Observation en cours', subtitle: 'Données à compléter'}
      : {value: `Mois ${predictionStatus.monthsElapsed} sur ${predictionStatus.totalMonths}`, subtitle: 'Observation du cycle'};
  })();

  // The 4th overview tile must match whatever computeCyclePredictionStatus
  // actually derived instead of always presenting a single configured
  // number: a learned observed average ('exact'), an honest 26–32 day
  // window when the pattern is irregular/variable ('window' — same wording
  // for a declared-irregular cycle and an observed-variable one, since both
  // already share the identical window), or the still-provisional
  // configured estimate while observation is incomplete ('observing').
  const averageTile = (() => {
    if (predictionStatus.mode === 'exact') {
      return {
        label: 'Durée moyenne',
        value: `${predictionStatus.averageCycleLength} jours`,
        subtitle: predictionStatus.observedPattern === 'regular-looking' ? 'Basée sur tes cycles enregistrés' : 'Basée sur ton cycle',
      };
    }
    if (predictionStatus.mode === 'window') {
      return {
        label: 'Cycle variable',
        value: `${IRREGULAR_WINDOW_MIN_DAYS}–${IRREGULAR_WINDOW_MAX_DAYS} jours`,
        subtitle: 'Fenêtre estimée',
      };
    }
    return {
      label: 'Durée moyenne',
      value: `${initial.cycleDuration} jours`,
      subtitle: 'Estimation provisoire',
    };
  })();

  const fertileStartDate = upcomingDateForCycleDay(initial, ovulationDay - 5, today);
  const fertileEndDate = upcomingDateForCycleDay(initial, ovulationDay + 1, today);
  const ovulationDate = upcomingDateForCycleDay(initial, ovulationDay, today);

  const overviewItems: OverviewItem[] = [
    {
      key: 'next-period',
      icon: 'water',
      iconColor: PERIOD,
      iconBg: PERIOD_LIGHT,
      label: 'Prochaines règles',
      value: nextPeriodTile.value,
      subtitle: nextPeriodTile.subtitle,
    },
    {
      key: 'fertile-window',
      icon: 'leaf',
      iconColor: '#3E8E56',
      iconBg: '#E4F3E7',
      label: 'Fenêtre fertile',
      value: formatDateRange(fertileStartDate, fertileEndDate),
      subtitle: `Dans ${Math.max(0, diffDays(fertileStartDate, today))} jours`,
    },
    {
      key: 'ovulation',
      icon: 'egg-outline',
      iconColor: OVULATION,
      iconBg: '#EFE6FA',
      label: 'Ovulation prévue',
      value: formatShortDate(ovulationDate),
      subtitle: `Dans ${Math.max(0, diffDays(ovulationDate, today))} jours`,
    },
    {
      key: 'average-length',
      icon: 'calendar-month-outline',
      iconColor: PURPLE,
      iconBg: '#EEE3FA',
      label: averageTile.label,
      value: averageTile.value,
      subtitle: averageTile.subtitle,
    },
  ];

  const quickActionItems: QuickActionItem[] = [
    {key: 'prayer-times', icon: 'mosque', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Horaires\nde prière', onPress: () => navigation.navigate('PrayerTimes')},
    {key: 'library', icon: 'book-open-page-variant-outline', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Bibliothèque', onPress: () => navigation.navigate('Library')},
    {key: 'daily-journal', icon: 'notebook-edit-outline', iconColor: '#B23F63', iconBg: '#F9DCE8', label: 'Journal quotidien', onPress: openJournal},
    {key: 'hijri-calendar', icon: 'moon-waning-crescent', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Calendrier Hijri', onPress: () => navigation.navigate('HijriCalendar')},
    {key: 'qadaa', icon: 'silverware-fork-knife', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Jeûnes à rattraper', onPress: () => navigation.navigate('FastingQadaa')},
    {key: 'statistics', icon: 'chart-donut', iconColor: '#2C8E93', iconBg: '#DDF0F1', label: 'Statistiques'},
  ];

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  return (
    <ImageBackground
      source={BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 12) + 22}]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={animatedStyle}>
            <HomeHeader
              firstName={getFirstName()}
              onPressProfile={() => navigation.navigate('Profile')}
              subtitle="Ton corps, ton rythme, ta foi ✨"
            />
          </Animated.View>

          <View style={styles.heroSpacer}>
            <HeroCycleCard
              currentDay={currentCycleDay}
              cycleLength={initial.cycleDuration}
              moodEntry={journalEntry?.mood}
              phase={currentPhase}
            />
          </View>

          <CycleOverviewCard items={overviewItems} />

          {!hasActiveConfirmedPeriod ? (
            <Animated.View
              style={[
                styles.periodStartCtaWrap,
                {
                  opacity: ctaEntrance,
                  transform: [
                    {
                      translateY: ctaEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <Pressable
                accessibilityLabel="Mes règles ont commencé"
                accessibilityRole="button"
                onPress={() => setPeriodStartSheetVisible(true)}
                style={({pressed}) => [styles.periodStartCta, pressed && styles.periodStartCtaPressed]}>
                <MaterialDesignIcons color={PERIOD} name="water-plus-outline" size={16} />
                <Text style={styles.periodStartCtaText}>Mes règles ont commencé</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          <QuickActionsGrid items={quickActionItems} />

          {spiritualMarkersEnabled ? (
            <SpiritualGuidanceCard
              hijriDate={prayer.schedule?.hijriDate ?? formatHijriDate(today)}
              isMenstruating={prayer.isMenstruating}
              locationConfigured={Boolean(prayer.selectedLocation)}
              locationName={prayer.selectedLocation ? `${prayer.selectedLocation.city}, ${prayer.selectedLocation.country}` : undefined}
              nextWindow={prayer.nextWindow}
              onManage={() => navigation.navigate('SpiritualPreferences')}
              onPressPuritySummary={() => navigation.navigate('PrayerTimes')}
              periodEndDateTime={prayer.periodEndDateTime}
              prayerError={prayer.error}
              prayerLoading={prayer.loading}
              purityResult={prayer.purityResult}
              qadaaDays={qadaa.remainingQadaaDays ?? 0}
              timezone={prayer.schedule?.timezone}
            />
          ) : null}

          <DailyJournalCard entry={journalEntry} onNavigate={route => navigation.navigate(route)} />

          <MotivationCard />
        </ScrollView>
      </SafeAreaView>

      <PeriodStartBottomSheet
        initialDate={today}
        onClose={() => setPeriodStartSheetVisible(false)}
        onConfirmed={() => {}}
        visible={periodStartSheetVisible}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F8EFFF',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 22,
  },

  heroSpacer: {
    marginTop: 16,
  },

  periodStartCtaWrap: {
    marginTop: 10,
    alignItems: 'center',
  },

  periodStartCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 40,
    borderWidth: 1.2,
    borderColor: 'rgba(220,123,130,0.35)',
    borderRadius: 20,
    backgroundColor: '#FCEEEF',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },

  periodStartCtaPressed: {
    opacity: 0.78,
  },

  periodStartCtaText: {
    color: PERIOD,
    fontSize: 12.5,
    fontWeight: '700',
  },
});

export default CycleHomeScreen;
