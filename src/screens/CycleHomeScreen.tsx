import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import type {CyclePhase} from '../components/home/CycleStatusCard';
import HomeHeader from '../components/home/HomeHeader';
import HeroCycleCard from '../components/home/HeroCycleCard';
import CycleOverviewCard, {type OverviewItem} from '../components/home/CycleOverviewCard';
import QuickActionsGrid, {type QuickActionItem} from '../components/home/QuickActionsGrid';
import SpiritualGuidanceCard from '../components/home/SpiritualGuidanceCard';
import DailyJournalCard from '../components/home/DailyJournalCard';
import MotivationCard from '../components/home/MotivationCard';
import {useJournalSheet} from '../navigation/JournalSheetContext';
import {usePrayerPurityStatus} from '../hooks/usePrayerPurityStatus';
import {useQadaaStatus} from '../hooks/useQadaaStatus';
import {
  getCyclePreferences,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
  getFirstName,
  getSpiritualMarkersEnabled,
} from '../state/onboardingPreferences';
import {getJournalEntry} from '../state/dailyJournalStore';
import type {DailyJournalEntry} from '../types/journal';
import {TOP_SPACING_EXTRA} from '../theme/spacing';
import {loadPersonalInformation} from '../state/personalInformationStore';
import {
  computeNextPeriod,
  cycleDayFor,
  diffDays,
  formatDateRange,
  formatHijriDate,
  formatShortDate,
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

  const currentCycleDay = cycleDayFor(today, initial);
  const currentPhase: CyclePhase = phaseFor(today, initial);

  const nextPeriod = computeNextPeriod(initial, today);
  const daysUntilNext = Math.max(0, diffDays(nextPeriod, today));

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
      value: formatShortDate(nextPeriod),
      subtitle: `Dans ${daysUntilNext} jours`,
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
      label: 'Durée moyenne',
      value: `${initial.cycleDuration} jours`,
      subtitle: 'Basée sur ton cycle',
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
});

export default CycleHomeScreen;
