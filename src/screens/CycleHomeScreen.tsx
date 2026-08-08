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
import {
  getCyclePreferences,
  getFirstName,
  getSelectedLocation,
  getSelectedSchool,
  getSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  subscribeSelectedLocation,
  type OnboardingLocation,
  type SchoolId,
} from '../state/onboardingPreferences';
import {
  fetchNextPrayer,
  type NextPrayer,
} from '../services/prayerTimes';
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
  const initial = getCyclePreferences();
  const {open: openJournal} = useJournalSheet();

  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | undefined>(undefined);
  const [, setProfileRevision] = useState(0);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );
  const [selectedLocation, setSelectedLocation] = useState<OnboardingLocation | null>(
    getSelectedLocation(),
  );
  const [selectedSchool, setSelectedSchool] = useState<SchoolId | null>(
    getSelectedSchool(),
  );
  const [nextPrayer, setNextPrayer] = useState<NextPrayer>();
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState(false);
  const nextPrayerRef = useRef<NextPrayer | undefined>(undefined);
  const prayerRequestRef = useRef(0);
  const lastPrayerFetchRef = useRef(0);

  const entrance = useRef(new Animated.Value(0)).current;

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    Animated.timing(entrance, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

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
      let active = true;
      const refreshPreferences = async () => {
        const location = await hydrateSelectedLocation();
        if (!active) {return;}
        setSelectedLocation(location);
        setSelectedSchool(getSelectedSchool());
        setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
      };
      refreshPreferences();
      const unsubscribe = subscribeSelectedLocation(() => {
        if (active) {setSelectedLocation(getSelectedLocation());}
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  useEffect(() => {
    const requestId = ++prayerRequestRef.current;
    nextPrayerRef.current = undefined;
    setNextPrayer(undefined);
    setPrayerError(false);
    if (!spiritualMarkersEnabled || !selectedLocation) {
      setPrayerLoading(false);
      return;
    }

    let cancelled = false;
    const loadPrayer = async () => {
      lastPrayerFetchRef.current = Date.now();
      setPrayerLoading(true);
      try {
        const prayer = await fetchNextPrayer(selectedLocation, selectedSchool);
        if (!cancelled && prayerRequestRef.current === requestId) {
          nextPrayerRef.current = prayer;
          setNextPrayer(prayer);
          setPrayerError(!prayer);
          setPrayerLoading(false);
        }
      } catch {
        if (!cancelled && prayerRequestRef.current === requestId) {
          nextPrayerRef.current = undefined;
          setNextPrayer(undefined);
          setPrayerError(true);
          setPrayerLoading(false);
        }
      }
    };

    loadPrayer();
    const timer = setInterval(() => {
      const prayer = nextPrayerRef.current;
      const retryDue = Date.now() - lastPrayerFetchRef.current >= 5 * 60_000;
      const prayerPassed = prayer ? prayer.at.getTime() <= Date.now() : false;
      if (prayerPassed || (!prayer && retryDue)) {
        loadPrayer();
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedLocation, selectedSchool, spiritualMarkersEnabled]);

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
    {key: 'prayer-times', icon: 'mosque', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Horaires\nde prière'},
    {key: 'library', icon: 'book-open-page-variant-outline', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Bibliothèque'},
    {key: 'daily-journal', icon: 'notebook-edit-outline', iconColor: '#B23F63', iconBg: '#F9DCE8', label: 'Journal quotidien', onPress: openJournal},
    {key: 'hijri-calendar', icon: 'moon-waning-crescent', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Calendrier Hijri'},
    {key: 'qadaa', icon: 'silverware-fork-knife', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Jeûnes à rattraper'},
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
              hijriDate={nextPrayer?.hijriDate ?? formatHijriDate(today)}
              locationConfigured={Boolean(selectedLocation)}
              locationName={selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : undefined}
              nextPrayerName={nextPrayer?.name}
              nextPrayerTime={nextPrayer?.time}
              prayerError={prayerError}
              prayerLoading={prayerLoading}
              onManage={() => navigation.navigate('SpiritualPreferences')}
              status={currentPhase === 'menstruation' ? 'menstruation' : 'purity'}
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
