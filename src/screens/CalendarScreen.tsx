import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ImageBackground, SafeAreaView, ScrollView, StatusBar, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthCalendarCard, {type CalendarDisplayMode, type DayJournalFlags} from '../components/calendar/MonthCalendarCard';
import SelectedDayCard from '../components/calendar/SelectedDayCard';
import PredictionsCard from '../components/calendar/PredictionsCard';
import CycleTimelineCard, {type TimelineStep} from '../components/calendar/CycleTimelineCard';
import MonthHistoryStrip from '../components/calendar/MonthHistoryStrip';
import FiltersSheet from '../components/calendar/FiltersSheet';
import LegendSheet from '../components/calendar/LegendSheet';
import {homeColors} from '../components/home/homeTheme';
import {getCyclePreferences} from '../state/onboardingPreferences';
import {getJournalEntriesForMonth, getJournalEntry} from '../state/dailyJournalStore';
import {
  DEFAULT_CALENDAR_FILTERS,
  loadCalendarFilters,
  saveCalendarFilters,
  type CalendarFilterKey,
  type CalendarFilters,
} from '../state/calendarFilters';
import type {DailyJournalEntry} from '../types/journal';
import {
  addDays,
  computeNextPeriod,
  cycleDayFor,
  diffDays,
  formatDateRange,
  formatShortDate,
  ovulationDayFor,
  periodStartForCycleContaining,
  phaseFor,
  startOfDay,
  upcomingDateForCycleDay,
} from '../utils/cycleMath';
import {TOP_SPACING_EXTRA} from '../theme/spacing';
import {loadPersonalInformation} from '../state/personalInformationStore';

const BACKGROUND = require('../assets/images/auth-mosque-background.png');

type Props = MainTabScreenProps<'Calendar'>;

function CalendarScreen(_: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const basics = getCyclePreferences();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  // The calendar opens with `selectedDate` defaulted to today purely so the
  // day-details card below has something to show — that default must not be
  // treated as an explicit user selection (which would paint today's cell
  // purple). Only a real tap on a day flips this to true.
  const [hasUserSelectedDate, setHasUserSelectedDate] = useState(false);
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('double');
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const [journalFlagsByDate, setJournalFlagsByDate] = useState<Record<string, DayJournalFlags>>({});
  const [selectedEntry, setSelectedEntry] = useState<DailyJournalEntry | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    loadCalendarFilters().then(loaded => {
      if (mounted) {setFilters(loaded);}
    });
    return () => {mounted = false;};
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(information => {
        if (mounted) {setDisplayMode(information.calendar);}
      });
      getJournalEntriesForMonth(visibleMonth.getFullYear(), visibleMonth.getMonth()).then(entries => {
        if (!mounted) {return;}
        const map: Record<string, DayJournalFlags> = {};
        entries.forEach(entry => {
          map[entry.date] = {
            mood: Boolean(entry.mood),
            notes: Boolean(entry.note),
            symptoms: Boolean(entry.symptoms),
          };
        });
        setJournalFlagsByDate(map);
      });
      return () => {mounted = false;};
    }, [visibleMonth]),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getJournalEntry(selectedDate.toLocaleDateString('en-CA')).then(entry => {
        if (mounted) {setSelectedEntry(entry);}
      });
      return () => {mounted = false;};
    }, [selectedDate]),
  );

  const toggleFilter = (key: CalendarFilterKey) => {
    setFilters(current => {
      const next = {...current, [key]: !current[key]};
      saveCalendarFilters(next);
      return next;
    });
  };

  const changeMonth = (offset: number) => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setHasUserSelectedDate(true);
  };

  const selectedCycleDay = cycleDayFor(selectedDate, basics);
  const selectedPhase = phaseFor(selectedDate, basics);
  const selectedPeriodStart = periodStartForCycleContaining(selectedDate, basics);
  const selectedPeriodEnd = addDays(selectedPeriodStart, basics.periodDuration - 1);

  const nextPeriod = computeNextPeriod(basics, today);
  const daysUntilNext = Math.max(0, diffDays(nextPeriod, today));
  const ovulationDay = ovulationDayFor(basics.cycleDuration);
  const fertileStart = upcomingDateForCycleDay(basics, ovulationDay - 5, today);
  const fertileEnd = upcomingDateForCycleDay(basics, ovulationDay + 1, today);
  const ovulationDate = upcomingDateForCycleDay(basics, ovulationDay, today);

  const predictionItems = [
    {
      key: 'average',
      icon: 'calendar-month-outline' as const,
      label: 'Durée moyenne',
      value: `${basics.cycleDuration} jours`,
      subtitle: 'Basée sur ton cycle',
    },
    {
      key: 'next-period',
      icon: 'water' as const,
      label: 'Prochaines règles (est.)',
      value: formatShortDate(nextPeriod),
      subtitle: `Dans ${daysUntilNext} jours`,
    },
    {
      key: 'fertile',
      icon: 'leaf' as const,
      label: 'Fenêtre fertile (est.)',
      value: formatDateRange(fertileStart, fertileEnd),
      subtitle: `Dans ${Math.max(0, diffDays(fertileStart, today))} jours`,
    },
    {
      key: 'ovulation',
      icon: 'egg-outline' as const,
      label: 'Ovulation (est.)',
      value: formatShortDate(ovulationDate),
      subtitle: `Dans ${Math.max(0, diffDays(ovulationDate, today))} jours`,
    },
  ];

  const todayPeriodStart = periodStartForCycleContaining(today, basics);
  const todayPeriodEnd = addDays(todayPeriodStart, basics.periodDuration - 1);

  const timelineSteps: TimelineStep[] = [
    {key: 'start', icon: 'water', label: 'Début des règles', date: formatShortDate(todayPeriodStart), color: homeColors.pink},
    {key: 'end', icon: 'water-off-outline', label: 'Fin des règles', date: formatShortDate(todayPeriodEnd), color: homeColors.pink},
    {key: 'fertile', icon: 'leaf', label: 'Fenêtre fertile', date: formatShortDate(fertileStart), color: '#3E8E56'},
    {key: 'ovulation', icon: 'egg-outline', label: 'Ovulation', date: formatShortDate(ovulationDate), color: '#8B5CF6'},
    {key: 'next', icon: 'calendar-month-outline', label: 'Prochaines règles', date: formatShortDate(nextPeriod), color: homeColors.primary},
  ];

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 16) + 24}]}
          showsVerticalScrollIndicator={false}>
          <CalendarHeader
            onPressFilters={() => setFiltersVisible(true)}
            onPressLegend={() => setLegendVisible(true)}
          />

          <MonthCalendarCard
            basics={basics}
            displayMode={displayMode}
            filters={filters}
            journalFlagsByDate={journalFlagsByDate}
            onChangeDisplayMode={setDisplayMode}
            onChangeMonth={changeMonth}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
            showSelection={hasUserSelectedDate}
            today={today}
            visibleMonth={visibleMonth}
          />

          <SelectedDayCard
            cycleDay={selectedCycleDay}
            date={selectedDate}
            entry={selectedEntry}
            filters={filters}
            periodDuration={basics.periodDuration}
            periodEndDate={selectedPeriodEnd}
            periodStartDate={selectedPeriodStart}
            phase={selectedPhase}
          />

          <PredictionsCard items={predictionItems} regularity={basics.regularity} />

          <CycleTimelineCard steps={timelineSteps} />

          <MonthHistoryStrip onSelectMonth={setVisibleMonth} visibleMonth={visibleMonth} />
        </ScrollView>

        <FiltersSheet
          filters={filters}
          onClose={() => setFiltersVisible(false)}
          onToggle={toggleFilter}
          visible={filtersVisible}
        />

        <LegendSheet onClose={() => setLegendVisible(false)} visible={legendVisible} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1, backgroundColor: 'transparent'},
  scrollContent: {paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},
});

export default CalendarScreen;
