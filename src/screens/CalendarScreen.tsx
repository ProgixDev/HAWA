import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, ImageBackground, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
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
import PeriodStartBottomSheet from '../components/calendar/PeriodStartBottomSheet';
import {homeColors} from '../components/home/homeTheme';
import {getCycleObservationStartedAt, getCyclePreferences, getPeriodHistory, hydrateCyclePreferences, isDateWithinConfirmedPeriod, subscribeCyclePreferences, updateCurrentPeriodRange} from '../state/onboardingPreferences';
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
  computeCyclePredictionStatus,
  cycleDayFor,
  diffDays,
  formatDateRange,
  formatShortDate,
  IRREGULAR_WINDOW_MAX_DAYS,
  IRREGULAR_WINDOW_MIN_DAYS,
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
  const [basics, setBasics] = useState(getCyclePreferences);
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
  const [editingPeriod, setEditingPeriod] = useState(false);
  const [draftPeriodDays, setDraftPeriodDays] = useState<Set<string>>(new Set());
  const [periodStartSheetVisible, setPeriodStartSheetVisible] = useState(false);

  const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dateFromKey = (key: string) => {const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day);};

  useEffect(() => {
    let mounted = true;
    hydrateCyclePreferences().then(value => {if (mounted) {setBasics(value);}});
    const unsubscribe = subscribeCyclePreferences(() => {if (mounted) {setBasics(getCyclePreferences());}});
    return () => {mounted = false; unsubscribe();};
  }, []);

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
    if (editingPeriod) {
      const key = localDateKey(date);
      setDraftPeriodDays(current => {const next = new Set(current); if (next.has(key)) {next.delete(key);} else {next.add(key);} return next;});
    }
  };

  const startPeriodEditing = () => {
    const days = new Set<string>();
    for (let index = 0; index < basics.periodDuration; index += 1) {days.add(localDateKey(addDays(basics.lastPeriodStart, index)));}
    setDraftPeriodDays(days);
    setVisibleMonth(new Date(basics.lastPeriodStart.getFullYear(), basics.lastPeriodStart.getMonth(), 1));
    setEditingPeriod(true);
  };

  const cancelPeriodEditing = () => {setDraftPeriodDays(new Set()); setEditingPeriod(false);};

  const savePeriodEditing = async () => {
    const dates = [...draftPeriodDays].sort().map(dateFromKey);
    if (dates.length === 0) {Alert.alert('Période menstruelle', 'Sélectionne au moins un jour de règles.'); return;}
    const continuous = dates.every((date, index) => index === 0 || diffDays(date, dates[index - 1]) === 1);
    if (!continuous) {Alert.alert('Sélection non continue', 'Les jours de règles doivent former une période continue.'); return;}
    try {
      await updateCurrentPeriodRange(dates[0], dates[dates.length - 1]);
      setSelectedDate(dates[0]);
      setEditingPeriod(false);
      setDraftPeriodDays(new Set());
    } catch (error) {
      Alert.alert('Modification impossible', error instanceof Error && error.message === 'OVERLAPPING_RANGE' ? 'Cette période chevauche une période déjà enregistrée.' : 'Vérifie les dates sélectionnées.');
    }
  };

  const sortedDraftDates = [...draftPeriodDays].sort().map(dateFromKey);
  const displayedBasics = editingPeriod && sortedDraftDates.length ? {...basics, lastPeriodStart: sortedDraftDates[0], periodDuration: sortedDraftDates.length} : basics;
  const selectedCycleDay = cycleDayFor(selectedDate, displayedBasics);
  const selectedPhase = phaseFor(selectedDate, displayedBasics);
  const selectedPeriodStart = editingPeriod && sortedDraftDates.length ? sortedDraftDates[0] : periodStartForCycleContaining(selectedDate, basics);
  const selectedPeriodEnd = editingPeriod && sortedDraftDates.length ? sortedDraftDates[sortedDraftDates.length - 1] : addDays(selectedPeriodStart, basics.periodDuration - 1);
  const displayedPeriodDuration = editingPeriod ? sortedDraftDates.length : basics.periodDuration;

  // Regularity-aware next-period prediction — see computeCyclePredictionStatus
  // in cycleMath.ts, the one place this logic lives (shared with
  // CycleHomeScreen so Dashboard and Calendar can never disagree).
  const periodStartDates = getPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  const predictionStatus = computeCyclePredictionStatus(basics, basics.regularity, periodStartDates, getCycleObservationStartedAt(), today);

  const nextPeriodLabel = predictionStatus.mode === 'window' && predictionStatus.isLate ? 'Règles en retard' : 'Prochaines règles (est.)';
  const nextPeriodValue = (() => {
    if (predictionStatus.mode === 'exact') {return formatShortDate(predictionStatus.date);}
    if (predictionStatus.mode === 'window') {
      return predictionStatus.isLate
        ? `Fenêtre dépassée depuis le ${formatShortDate(predictionStatus.windowEnd)}`
        : formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd);
    }
    return `Mois ${predictionStatus.monthsElapsed} sur ${predictionStatus.totalMonths}`;
  })();
  const nextPeriodSubtitle = (() => {
    if (predictionStatus.mode === 'exact') {return `Dans ${Math.max(0, diffDays(predictionStatus.date, today))} jours`;}
    if (predictionStatus.mode === 'window') {
      if (predictionStatus.isLate) {return 'Aucune nouvelle période enregistrée';}
      const daysUntilStart = diffDays(predictionStatus.windowStart, today);
      return daysUntilStart > 0 ? `Dans ${daysUntilStart} jours` : 'Fenêtre estimée en cours';
    }
    return predictionStatus.complete ? 'Données à compléter' : 'HAWA observe tes cycles';
  })();

  const ovulationDay = ovulationDayFor(basics.cycleDuration);
  const fertileStart = upcomingDateForCycleDay(basics, ovulationDay - 5, today);
  const fertileEnd = upcomingDateForCycleDay(basics, ovulationDay + 1, today);
  const ovulationDate = upcomingDateForCycleDay(basics, ovulationDay, today);

  // Same rule as CycleHomeScreen: match whatever computeCyclePredictionStatus
  // actually derived instead of always presenting a single configured number
  // — a learned observed average ('exact'), an honest 26–32 day window when
  // the pattern is irregular/variable ('window'), or the still-provisional
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
    return {label: 'Durée moyenne', value: `${basics.cycleDuration} jours`, subtitle: 'Estimation provisoire'};
  })();

  const predictionItems = [
    {
      key: 'average',
      icon: 'calendar-month-outline' as const,
      label: averageTile.label,
      value: averageTile.value,
      subtitle: averageTile.subtitle,
    },
    {
      key: 'next-period',
      icon: 'water' as const,
      label: nextPeriodLabel,
      value: nextPeriodValue,
      subtitle: nextPeriodSubtitle,
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
    {key: 'next', icon: 'calendar-month-outline', label: nextPeriodLabel, date: nextPeriodValue, color: homeColors.primary},
  ];

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 16) + (editingPeriod ? 132 : 24)}]}
          showsVerticalScrollIndicator={false}>
          <CalendarHeader
            onPressFilters={() => setFiltersVisible(true)}
            onPressLegend={() => setLegendVisible(true)}
          />

          <MonthCalendarCard
            basics={basics}
            displayMode={displayMode}
            filters={filters}
            editingPeriod={editingPeriod}
            draftPeriodDays={draftPeriodDays}
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
            periodDuration={displayedPeriodDuration}
            periodEndDate={selectedPeriodEnd}
            periodStartDate={selectedPeriodStart}
            phase={selectedPhase}
            editingPeriod={editingPeriod}
            onDeclarePeriodStart={isDateWithinConfirmedPeriod(selectedDate) ? undefined : () => setPeriodStartSheetVisible(true)}
            onEditPeriod={editingPeriod ? cancelPeriodEditing : startPeriodEditing}
          />

          <PredictionsCard items={predictionItems} regularity={basics.regularity} />

          <CycleTimelineCard steps={timelineSteps} />

          <MonthHistoryStrip onSelectMonth={setVisibleMonth} periodHistory={getPeriodHistory()} visibleMonth={visibleMonth} />
        </ScrollView>

        <FiltersSheet
          filters={filters}
          onClose={() => setFiltersVisible(false)}
          onToggle={toggleFilter}
          visible={filtersVisible}
        />

        <LegendSheet onClose={() => setLegendVisible(false)} visible={legendVisible} />
        {editingPeriod ? <View style={[styles.editBar, {bottom: Math.max(insets.bottom, 8)}]}><View style={styles.editBarCopy}><Text style={styles.editBarTitle}>Modifier mes règles</Text><Text style={styles.editBarSubtitle}>{draftPeriodDays.size} {draftPeriodDays.size > 1 ? 'jours sélectionnés' : 'jour sélectionné'}</Text></View><View style={styles.editActions}><Pressable onPress={cancelPeriodEditing} style={styles.cancelButton}><Text style={styles.cancelText}>Annuler</Text></Pressable><Pressable onPress={savePeriodEditing} style={styles.saveButton}><Text style={styles.saveText}>Enregistrer</Text></Pressable></View></View> : null}

        <PeriodStartBottomSheet
          initialDate={selectedDate}
          onClose={() => setPeriodStartSheetVisible(false)}
          onConfirmed={() => {}}
          visible={periodStartSheetVisible}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1, backgroundColor: 'transparent'},
  scrollContent: {paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},
  editBar: {position: 'absolute', left: 12, right: 12, borderWidth: 1, borderColor: '#E6DDF2', borderRadius: 18, backgroundColor: '#FFFFFF', padding: 13, shadowColor: '#3E286E', shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8},
  editBarCopy: {marginBottom: 10},
  editBarTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
  editBarSubtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 11.5},
  editActions: {flexDirection: 'row', gap: 10},
  cancelButton: {flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: homeColors.primary, borderRadius: 12, backgroundColor: '#FFFFFF'},
  cancelText: {color: homeColors.primary, fontSize: 13, fontWeight: '700'},
  saveButton: {flex: 1.3, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: homeColors.primary},
  saveText: {color: '#FFFFFF', fontSize: 13, fontWeight: '800'},
});

export default CalendarScreen;
