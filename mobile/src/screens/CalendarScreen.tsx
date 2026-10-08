import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import '../i18n';
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
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {getCycleObservationStartedAt, getCyclePreferences, getHasConfirmedCycleDuration, getHasRecordedFirstPeriod, getIsCycleStateReady, getRecordedPeriodHistory, getSpiritualMarkersEnabled, correctPeriodOccurrence, hydrateCyclePreferences, isDateWithinConfirmedPeriod, setPeriodEndDateTime, subscribeCyclePreferences} from '../state/onboardingPreferences';
import {recordConfirmedPeriodEnd} from '../state/confirmedPeriodHistoryStore';
import {getJournalEntriesForMonth, getJournalEntry} from '../state/dailyJournalStore';
import {getActiveProfileIdentity, subscribeActiveProfileId} from '../state/activeProfileStore';
import {recordManagedProfileFirstPeriod} from '../state/managedProfileCycleSeed';
import {withResolvedIntimacyForDisplay, withResolvedIntimacyForDisplayMany} from '../services/privateJournalEncryption';
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
  calendarDayKindFor,
  computeCyclePredictionStatus,
  cycleDayFor,
  describeAverageCycle,
  diffDays,
  effectiveRegularityFor,
  estimateFertilityDates,
  formatDateRange,
  formatShortDate,
  isBeforeCurrentProjectedCycle,
  isWithinRecordedPeriod,
  periodStartForCycleContaining,
  phaseFor,
  predictionEligibilityFor,
  recordedPeriodFor,
  recordedPeriodInCycleOf,
  startOfDay,
} from '../utils/cycleMath';
import {TOP_SPACING_EXTRA, getFloatingTabBarClearance} from '../theme/spacing';
import {loadPersonalInformation} from '../state/personalInformationStore';
import {usePremium} from '../hooks/usePremium';
import {useToday} from '../hooks/useToday';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';
import {isMonthWithinHistoryAccess} from '../utils/historyAccess';

type Props = MainTabScreenProps<'Calendar'>;

function CalendarScreen(_: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [basics, setBasics] = useState(getCyclePreferences);
  // Re-evaluated when the day changes / the app returns to the foreground —
  // see src/hooks/useToday.ts.
  const {today} = useToday();

  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

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
  // Start of the recorded period the range editor is correcting — fixed when
  // editing begins (the selected day keeps changing while days are toggled).
  const [editingOccurrenceStart, setEditingOccurrenceStart] = useState<Date | null>(null);
  const [periodStartSheetVisible, setPeriodStartSheetVisible] = useState(false);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(getSpiritualMarkersEnabled);
  // Identity only — the actual cycle/period/journal DATA above already
  // resolves from whichever profile is active (see each store's own header
  // comment); this only drives which UI rows (e.g. "Vie intime") are shown —
  // same pattern as CycleHomeScreen.tsx's own activeIdentity.
  const [activeIdentity, setActiveIdentity] = useState(getActiveProfileIdentity);
  useEffect(() => {
    const unsubscribe = subscribeActiveProfileId(() => {
      setActiveIdentity(getActiveProfileIdentity());
      // onboardingPreferences.ts has already dropped the previous profile's
      // cycle data by the time this runs (its own listener is registered at
      // module load, ahead of any screen's): re-read it so `basics` can't keep
      // describing the profile just left, and clear every piece of view state
      // that belonged to her (journal dots, selected entry, period editing).
      setBasics(getCyclePreferences());
      setJournalFlagsByDate({});
      setSelectedEntry(undefined);
      setEditingPeriod(false);
      setDraftPeriodDays(new Set());
      setEditingOccurrenceStart(null);
      setPeriodStartSheetVisible(false);
    });
    return unsubscribe;
  }, []);

  // The default "selected day" is only a stand-in for today (see
  // hasUserSelectedDate above) — keep it on the current day when the day
  // rolls over. A date the user deliberately tapped is never moved.
  useEffect(() => {
    if (hasUserSelectedDate) {return;}
    setSelectedDate(current => (current.getTime() === today.getTime() ? current : today));
    setVisibleMonth(current =>
      current.getFullYear() === today.getFullYear() && current.getMonth() === today.getMonth()
        ? current
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );
  }, [today, hasUserSelectedDate]);

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
      // Reloaded when the active profile changes, and a read that finishes after
      // a switch is dropped: another profile's journal dots must never be painted.
      const requestedProfileId = activeIdentity.id;
      loadPersonalInformation().then(information => {
        if (mounted) {setDisplayMode(information.calendar);}
      });
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
      getJournalEntriesForMonth(visibleMonth.getFullYear(), visibleMonth.getMonth())
        .then(withResolvedIntimacyForDisplayMany)
        .then(entries => {
          if (!mounted || getActiveProfileIdentity().id !== requestedProfileId) {return;}
          const map: Record<string, DayJournalFlags> = {};
          entries.forEach(entry => {
            map[entry.date] = {
              mood: Boolean(entry.mood),
              notes: Boolean(entry.note) || Boolean(entry.encryptedNote),
              symptoms: Boolean(entry.symptoms),
              activity: Boolean(entry.activity),
              sleep: Boolean(entry.sleep),
              hydration: Boolean(entry.hydration),
              flow: Boolean(entry.flow),
              intimacy: Boolean(entry.intimacy),
            };
          });
          setJournalFlagsByDate(map);
        });
      return () => {mounted = false;};
    }, [visibleMonth, activeIdentity.id]),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const requestedProfileId = activeIdentity.id;
      getJournalEntry(selectedDate.toLocaleDateString('en-CA'))
        .then(withResolvedIntimacyForDisplay)
        .then(entry => {
          if (mounted && getActiveProfileIdentity().id === requestedProfileId) {setSelectedEntry(entry);}
        });
      return () => {mounted = false;};
    }, [selectedDate, activeIdentity.id]),
  );

  const toggleFilter = (key: CalendarFilterKey) => {
    setFilters(current => {
      const next = {...current, [key]: !current[key]};
      saveCalendarFilters(next);
      return next;
    });
  };

  // "Historique illimité" — going backward (offset < 0) is the only
  // direction that can leave the FREE history window; forward navigation
  // (toward today) is never restricted. Tapping a locked previous month
  // opens the existing Premium sheet instead of silently doing nothing or
  // disabling the button — see historyAccess.ts for the shared rule.
  const changeMonth = (offset: number) => {
    setVisibleMonth(current => {
      const target = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      if (offset < 0 && !isMonthWithinHistoryAccess(target, isPremium)) {
        setPremiumVisible(true);
        return current;
      }
      return target;
    });
  };

  const handleSelectHistoryMonth = (month: Date): void => {
    if (!isMonthWithinHistoryAccess(month, isPremium)) {
      setPremiumVisible(true);
      return;
    }
    setVisibleMonth(month);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setHasUserSelectedDate(true);
    if (editingPeriod) {
      const key = localDateKey(date);
      setDraftPeriodDays(current => {const next = new Set(current); if (next.has(key)) {next.delete(key);} else {next.add(key);} return next;});
    }
  };

  // "Modifier" corrects ONE recorded occurrence: the period containing the
  // selected day when there is one, else the latest recorded period. Its range
  // is what was really recorded (edited / confirmed end) — the habitual
  // periodDuration is only the fallback when nothing is recorded yet.
  const startPeriodEditing = () => {
    const recorded = getRecordedPeriodHistory();
    const target = recorded.find(record => isWithinRecordedPeriod(selectedDate, [record]))
      ?? recorded.find(record => record.startDate === localDateKey(basics.lastPeriodStart));
    const targetStart = target ? dateFromKey(target.startDate) : basics.lastPeriodStart;
    const length = target ? diffDays(dateFromKey(target.endDate), targetStart) + 1 : basics.periodDuration;
    const days = new Set<string>();
    for (let index = 0; index < length; index += 1) {days.add(localDateKey(addDays(targetStart, index)));}
    setEditingOccurrenceStart(targetStart);
    setDraftPeriodDays(days);
    setVisibleMonth(new Date(targetStart.getFullYear(), targetStart.getMonth(), 1));
    setEditingPeriod(true);
  };

  const cancelPeriodEditing = () => {setDraftPeriodDays(new Set()); setEditingOccurrenceStart(null); setEditingPeriod(false);};

  const savePeriodEditing = async () => {
    const dates = [...draftPeriodDays].sort().map(dateFromKey);
    if (dates.length === 0) {Alert.alert(t('calendar.periodAlertTitle'), t('calendar.periodAlertSelectDay')); return;}
    const continuous = dates.every((date, index) => index === 0 || diffDays(date, dates[index - 1]) === 1);
    if (!continuous) {Alert.alert(t('calendar.nonContinuousTitle'), t('calendar.nonContinuousMessage')); return;}
    try {
      const rangeStart = dates[0];
      const rangeEnd = dates[dates.length - 1];
      // Correction semantics: the edited occurrence is REPLACED (no second
      // start left behind), other periods are kept, and the habitual
      // periodDuration/cycleDuration are not redefined by this edit. A stale
      // confirmed (Qadaa) occurrence for the old range is dropped by the store.
      await correctPeriodOccurrence(editingOccurrenceStart ?? basics.lastPeriodStart, rangeStart, rangeEnd);

      // A range the user explicitly marks as fully in the past is a real
      // completed historical period — make it available to Qadaa's
      // confirmed history too (see confirmedPeriodHistoryStore.ts), the same
      // way the Purity "Quand tes règles se sont-elles terminées ?" flow
      // already does. A range that includes today or any future day is
      // ongoing/predictive and must never be auto-confirmed this way — that
      // would turn predicted menstruation into religiously-relevant
      // confirmed data; the existing Purity/period-end flow stays the only
      // path for an ongoing period.
      if (rangeEnd.getTime() < startOfDay(new Date()).getTime()) {
        await recordConfirmedPeriodEnd(rangeStart, rangeEnd);
        // The scalar end used by purity/prayer follows the confirmed end of the
        // CURRENT (latest) period - the same two-call sequence as
        // PeriodEndBottomSheet - so it never disagrees with the corrected range.
        if (localDateKey(getCyclePreferences().lastPeriodStart) === localDateKey(rangeStart)) {
          await setPeriodEndDateTime(rangeEnd);
        }
      }

      setSelectedDate(dates[0]);
      setEditingPeriod(false);
      setEditingOccurrenceStart(null);
      setDraftPeriodDays(new Set());
    } catch (error) {
      Alert.alert(t('calendar.editErrorTitle'), error instanceof Error && error.message === 'OVERLAPPING_RANGE' ? t('calendar.editErrorOverlap') : t('calendar.editErrorGeneric'));
    }
  };

  const sortedDraftDates = [...draftPeriodDays].sort().map(dateFromKey);

  // Regularity-aware next-period prediction — see computeCyclePredictionStatus
  // in cycleMath.ts, the one place this logic lives (shared with
  // CycleHomeScreen so Dashboard and Calendar can never disagree). Only the
  // periods the user actually recorded feed it — never the placeholder record
  // seeded from the unconfirmed fallback defaults.
  const recordedPeriods = getRecordedPeriodHistory();
  const periodStartDates = recordedPeriods.map(record => new Date(`${record.startDate}T12:00:00`));

  // A managed daughter who has never recorded a first period: `basics` is still
  // the neutral, unconfirmed placeholder for her (see onboardingPreferences.ts)
  // — never a real cycle to project from. Derived from HER recorded period
  // history, not from `basics` being non-null (it always is). The mother's own
  // empty-history state is unaffected (requires isManagedProfile too), same
  // gate as CycleHomeScreen.tsx's own isPreFirstPeriodDaughter.
  const hasRecordedFirstPeriod = getHasRecordedFirstPeriod();
  const isPreFirstPeriodDaughter = activeIdentity.isManagedProfile && !hasRecordedFirstPeriod;
  const daughterProfileId = activeIdentity.managedProfile?.id;
  // Nothing recorded — for ANY profile (the owner's cycle starts from the same
  // placeholder) — or her data still being read: no projection, no cycle cards.
  const noRecordedPeriod = !hasRecordedFirstPeriod;
  const dataReady = getIsCycleStateReady();

  // A managed profile's cycle LENGTH is only real once someone provided it or it
  // was measured from her recorded periods. A declared-regular cycle with no
  // provided length would otherwise be projected from the placeholder 28 days
  // (see effectiveRegularityFor). The owner's own prediction is untouched.
  const hasConfirmedDuration = getHasConfirmedCycleDuration();
  const predictionRegularity = effectiveRegularityFor(basics.regularity, hasConfirmedDuration);
  const predictionStatus = computeCyclePredictionStatus(basics, predictionRegularity, periodStartDates, getCycleObservationStartedAt(), today);
  // May a period / fertile window / ovulation be PROJECTED onto the month grid?
  // For a managed profile that needs a real cycle length behind the prediction
  // (see canProjectCycle): with none — no first period yet, or a period recorded
  // without any provided or observed cycle length — the grid shows only what was
  // really recorded.
  const eligibility = predictionEligibilityFor({dataReady, recordedPeriodCount: recordedPeriods.length, hasConfirmedCycleDuration: hasConfirmedDuration, status: predictionStatus});
  const projectionAllowed = eligibility === 'ready' || (eligibility === 'irregular' && !activeIdentity.isManagedProfile);

  // 'window' (declared irregular / observed variable): the Dashboard says
  // "26–32 days", so the Calendar must not paint one projected cycle as if it
  // were certain — it shows only the periods that were really recorded. A
  // pre-first-period daughter has no recorded periods at all yet, so the same
  // "recorded only" mode (with an empty list) keeps the month grid a plain
  // Gregorian calendar instead of painting a fake projected cycle. The same
  // goes for any managed profile whose projection is not allowed (above).
  const recordedOnly = noRecordedPeriod || predictionStatus.mode === 'window' || !projectionAllowed;
  // Why the grid carries no projection — only once the data has loaded, so it
  // never flashes while it is still being read.
  const predictionsPending = eligibility === 'no-period' || eligibility === 'insufficient';
  // 'exact' wraps by the SAME cycle length the prediction uses (the observed
  // average for a regular-looking 'unknown' pattern); identical to `basics`
  // for a declared-regular cycle.
  const projectionBasics = predictionStatus.mode === 'exact' ? {...basics, cycleDuration: predictionStatus.averageCycleLength} : basics;
  // `today` switches on the prediction-overlay rule: projections paint the
  // current/future cycle only, old months show what was really recorded.
  const resolveKind = (date: Date) => calendarDayKindFor(date, basics, predictionStatus, recordedPeriods, today, projectionAllowed);

  const displayedBasics = editingPeriod && sortedDraftDates.length ? {...projectionBasics, lastPeriodStart: sortedDraftDates[0], periodDuration: sortedDraftDates.length} : projectionBasics;
  const useRecordedPeriods = recordedOnly && !editingPeriod;
  const selectedRecordedPeriod = recordedPeriodFor(selectedDate, recordedPeriods);
  const selectedWithinRecordedPeriod = isWithinRecordedPeriod(selectedDate, recordedPeriods);

  // Recorded-only mode has no single cycle length to count against: the day
  // is the raw count since the latest recorded start, and only a recorded
  // period day has a phase (menstruation) — nothing else is invented.
  // A day before the projected cycle containing today is history: it shows a
  // phase only if a period was recorded there (same rule as the painted cells).
  const selectedIsRetroactive = !useRecordedPeriods && !editingPeriod && isBeforeCurrentProjectedCycle(selectedDate, projectionBasics, today);
  const selectedIsPeriodCell = !editingPeriod && resolveKind(selectedDate) === 'period';
  // While editing, the draft IS the period being described. With no real cycle
  // length behind it (projection not allowed) it cannot be wrapped by the
  // placeholder one: a day is only counted from the draft's start, and has a
  // phase only when it is inside the draft — same rule as recorded-only mode.
  const editingWithoutCycleLength = editingPeriod && !projectionAllowed;
  const draftStart = sortedDraftDates[0];
  const selectedCycleDay = editingWithoutCycleLength
    ? (draftStart && diffDays(selectedDate, draftStart) >= 0 ? diffDays(selectedDate, draftStart) + 1 : undefined)
    : useRecordedPeriods
      ? (selectedRecordedPeriod ? diffDays(selectedDate, dateFromKey(selectedRecordedPeriod.startDate)) + 1 : undefined)
      : selectedIsRetroactive
        ? (selectedRecordedPeriod && selectedWithinRecordedPeriod ? diffDays(selectedDate, dateFromKey(selectedRecordedPeriod.startDate)) + 1 : undefined)
        : cycleDayFor(selectedDate, displayedBasics);
  // The phase must agree with the painted cell: a recorded period day (even
  // one longer than the habitual duration) is menstruation, and a projected
  // period day that the recorded (shorter) period no longer covers is not.
  const projectedSelectedPhase = phaseFor(selectedDate, displayedBasics);
  const selectedPhase = editingWithoutCycleLength
    ? (draftPeriodDays.has(localDateKey(selectedDate)) ? ('menstruation' as const) : undefined)
    : useRecordedPeriods || selectedIsRetroactive
      ? (selectedWithinRecordedPeriod ? ('menstruation' as const) : undefined)
      : editingPeriod
        ? projectedSelectedPhase
        : selectedIsPeriodCell
          ? ('menstruation' as const)
          : projectedSelectedPhase === 'menstruation' ? ('follicular' as const) : projectedSelectedPhase;
  // The recorded period this day belongs to — its real range, not a range
  // re-derived from the habitual periodDuration.
  const selectedPeriodRecord = editingPeriod
    ? null
    : useRecordedPeriods
      ? selectedRecordedPeriod
      : recordedPeriodInCycleOf(selectedDate, recordedPeriods, projectionBasics.cycleDuration);
  const selectedPeriodStart = editingPeriod && sortedDraftDates.length
    ? sortedDraftDates[0]
    : selectedPeriodRecord
      ? dateFromKey(selectedPeriodRecord.startDate)
      : periodStartForCycleContaining(selectedDate, projectionBasics);
  const selectedPeriodEnd = editingPeriod && sortedDraftDates.length
    ? sortedDraftDates[sortedDraftDates.length - 1]
    : selectedPeriodRecord
      ? dateFromKey(selectedPeriodRecord.endDate)
      : addDays(selectedPeriodStart, basics.periodDuration - 1);
  // A past cycle with no recorded period: its Début / Fin / Durée would be a
  // projection presented as history — the card shows "nothing recorded" instead.
  // Same when projection is not allowed at all (a managed profile still observing,
  // before her first recorded period…): there is no cycle length to project a
  // range from, so a day with no recorded period around it has none to show.
  const selectedPeriodUnrecorded = !editingPeriod && !selectedPeriodRecord && (selectedIsRetroactive || !projectionAllowed);
  const displayedPeriodDuration = editingPeriod
    ? sortedDraftDates.length
    : selectedPeriodRecord
      ? diffDays(selectedPeriodEnd, selectedPeriodStart) + 1
      : basics.periodDuration;

  // The CTA acts on the SELECTED day: never on a future day (a period start is
  // a real event, not a prediction) and never inside a period already recorded.
  const canDeclarePeriodStart = startOfDay(selectedDate).getTime() <= startOfDay(today).getTime() && !isDateWithinConfirmedPeriod(selectedDate);

  const nextPeriodLabel = predictionStatus.mode === 'window' && predictionStatus.isLate ? t('calendar.periodLate') : t('calendar.nextPeriodEstimated');
  const nextPeriodValue = (() => {
    if (predictionStatus.mode === 'exact') {return formatShortDate(predictionStatus.date);}
    if (predictionStatus.mode === 'window') {
      return predictionStatus.isLate
        ? t('calendar.windowPassedSince', {date: formatShortDate(predictionStatus.windowEnd)})
        : formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd);
    }
    return t('cycleHome.monthOfTotal', {month: predictionStatus.monthsElapsed, total: predictionStatus.totalMonths});
  })();
  const nextPeriodSubtitle = (() => {
    if (predictionStatus.mode === 'exact') {return t('cycleHome.nextPeriod.inDays', {count: Math.max(0, diffDays(predictionStatus.date, today))});}
    if (predictionStatus.mode === 'window') {
      if (predictionStatus.isLate) {return t('calendar.noNewPeriodRecorded');}
      const daysUntilStart = diffDays(predictionStatus.windowStart, today);
      return daysUntilStart > 0 ? t('cycleHome.nextPeriod.inDays', {count: daysUntilStart}) : t('cycleHome.nextPeriod.windowInProgress');
    }
    return predictionStatus.complete ? t('cycleHome.dataToComplete') : t('calendar.observingCycles');
  })();

  // Same rule as CycleHomeScreen (shared helpers in cycleMath.ts): fertile
  // window / ovulation are only estimable when a single cycle length can be
  // trusted; an irregular/variable cycle shows no precise date.
  const fertility = estimateFertilityDates(basics, predictionStatus, today, getHasConfirmedCycleDuration());
  const averageTile = describeAverageCycle(predictionStatus, basics, getHasConfirmedCycleDuration());
  // "Cycle variable" only describes an irregular cycle; elsewhere the dates are
  // simply not estimable yet.
  const NOT_ESTIMABLE = {
    value: t('cycleHome.notEstimable'),
    subtitle: predictionStatus.mode === 'window' ? t('cycleHome.variableCycle') : t('cycleHome.insufficientData'),
  };
  const fertileTile = fertility
    ? {value: formatDateRange(fertility.fertileStart, fertility.fertileEnd), subtitle: t('cycleHome.nextPeriod.inDays', {count: Math.max(0, diffDays(fertility.fertileStart, today))})}
    : NOT_ESTIMABLE;
  const ovulationTile = fertility
    ? {value: formatShortDate(fertility.ovulation), subtitle: t('cycleHome.nextPeriod.inDays', {count: Math.max(0, diffDays(fertility.ovulation, today))})}
    : NOT_ESTIMABLE;

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
      label: t('calendar.fertileWindowEstimated'),
      value: fertileTile.value,
      subtitle: fertileTile.subtitle,
    },
    {
      key: 'ovulation',
      icon: 'egg-outline' as const,
      label: t('calendar.ovulationEstimated'),
      value: ovulationTile.value,
      subtitle: ovulationTile.subtitle,
    },
  ];

  const todayRecordedPeriod = recordedOnly
    ? recordedPeriodFor(today, recordedPeriods)
    : recordedPeriodInCycleOf(today, recordedPeriods, projectionBasics.cycleDuration);
  const todayPeriodStart = todayRecordedPeriod ? dateFromKey(todayRecordedPeriod.startDate) : periodStartForCycleContaining(today, projectionBasics);
  const todayPeriodEnd = todayRecordedPeriod ? dateFromKey(todayRecordedPeriod.endDate) : addDays(todayPeriodStart, basics.periodDuration - 1);

  const timelineSteps: TimelineStep[] = [
    {key: 'start', icon: 'water', label: t('calendar.periodStart'), date: formatShortDate(todayPeriodStart), color: homeColors.pink},
    {key: 'end', icon: 'water-off-outline', label: t('calendar.periodEnd'), date: formatShortDate(todayPeriodEnd), color: homeColors.pink},
    {key: 'fertile', icon: 'leaf', label: t('cycleHome.fertileWindowLabel'), date: fertility ? formatShortDate(fertility.fertileStart) : NOT_ESTIMABLE.value, color: '#3E8E56'},
    {key: 'ovulation', icon: 'egg-outline', label: t('cyclePhase.ovulation'), date: fertility ? formatShortDate(fertility.ovulation) : NOT_ESTIMABLE.value, color: '#8B5CF6'},
    {key: 'next', icon: 'calendar-month-outline', label: nextPeriodLabel, date: nextPeriodValue, color: theme.colors.primary},
  ];

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, {paddingBottom: getFloatingTabBarClearance(insets.bottom, editingPeriod ? 132 : 24)}]}
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
            resolveKind={resolveKind}
            selectedDate={selectedDate}
            showSelection={hasUserSelectedDate}
            today={today}
            visibleMonth={visibleMonth}
          />

          {predictionsPending ? (
            <Text style={styles.predictionsNote}>
              {t(
                hasRecordedFirstPeriod
                  ? 'calendar.predictionsPendingMoreData'
                  : activeIdentity.isManagedProfile
                    ? 'calendar.predictionsPendingFirstPeriod'
                    : 'calendar.predictionsPendingFirstPeriodOwner',
              )}
            </Text>
          ) : null}

          <SelectedDayCard
            cycleDay={noRecordedPeriod ? undefined : selectedCycleDay}
            date={selectedDate}
            entry={selectedEntry}
            filters={filters}
            hideIntimacy={activeIdentity.isManagedProfile}
            periodDuration={noRecordedPeriod ? 0 : displayedPeriodDuration}
            periodEndDate={noRecordedPeriod ? selectedDate : selectedPeriodEnd}
            periodStartDate={noRecordedPeriod ? selectedDate : selectedPeriodStart}
            periodUnrecorded={noRecordedPeriod ? true : selectedPeriodUnrecorded}
            phase={noRecordedPeriod ? undefined : selectedPhase}
            editingPeriod={editingPeriod}
            hideEditPeriod={noRecordedPeriod}
            phaseUnavailableSubtitle={
              noRecordedPeriod
                ? (dataReady ? t('cycleHome.preFirstPeriod.title') : undefined)
                : selectedIsRetroactive
                  ? t('calendar.noPeriodThisDay')
                  : predictionsPending ? t('cycleHome.cycleObservation') : undefined
            }
            showHijriDate={spiritualMarkersEnabled}
            onDeclarePeriodStart={canDeclarePeriodStart ? () => setPeriodStartSheetVisible(true) : undefined}
            onEditPeriod={editingPeriod ? cancelPeriodEditing : startPeriodEditing}
          />

          {/* Hidden entirely for a pre-first-period daughter — both cards are
              100% derived from cycle predictions, and there is no real cycle
              data yet to predict from (CLAUDE.md §5: never fabricate one). */}
          {!noRecordedPeriod ? (
            <>
              <PredictionsCard items={predictionItems} regularity={predictionRegularity} />

              <CycleTimelineCard steps={timelineSteps} />
            </>
          ) : null}

          <MonthHistoryStrip onSelectMonth={handleSelectHistoryMonth} periodHistory={recordedPeriods} visibleMonth={visibleMonth} />
        </ScrollView>

        <FiltersSheet
          filters={filters}
          hideIntimacy={activeIdentity.isManagedProfile}
          onClose={() => setFiltersVisible(false)}
          onToggle={toggleFilter}
          visible={filtersVisible}
        />

        <LegendSheet onClose={() => setLegendVisible(false)} showSpiritualMarkers={spiritualMarkersEnabled} visible={legendVisible} />
        {editingPeriod ? <View style={[styles.editBar, {bottom: Math.max(insets.bottom, 8)}]}><View style={styles.editBarCopy}><Text style={styles.editBarTitle}>{t('calendar.editPeriodTitle')}</Text><Text style={styles.editBarSubtitle}>{t('calendar.daysSelected', {count: draftPeriodDays.size})}</Text></View><View style={styles.editActions}><Pressable onPress={cancelPeriodEditing} style={styles.cancelButton}><Text style={styles.cancelText}>{t('common.cancel')}</Text></Pressable><Pressable onPress={savePeriodEditing} style={styles.saveButton}><Text style={styles.saveText}>{t('common.save')}</Text></Pressable></View></View> : null}

        <PeriodStartBottomSheet
          description={isPreFirstPeriodDaughter ? t('cycleHome.preFirstPeriod.question') : undefined}
          initialDate={selectedDate}
          onClose={() => setPeriodStartSheetVisible(false)}
          onConfirm={
            isPreFirstPeriodDaughter && daughterProfileId
              ? date => {recordManagedProfileFirstPeriod(daughterProfileId, date).catch(() => {});}
              : undefined
          }
          onConfirmed={() => {}}
          title={isPreFirstPeriodDaughter ? t('cycleHome.herPeriodStartedCta') : undefined}
          visible={periodStartSheetVisible}
        />

        <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},
  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {position: 'absolute', top: -150, right: -110, width: 330, height: 330, borderRadius: 165, backgroundColor: withAlpha(theme.colors.primary, 0.07)},
  pageGlowMiddle: {position: 'absolute', top: '38%', left: -130, width: 260, height: 260, borderRadius: 130, backgroundColor: withAlpha(theme.colors.primary, 0.045)},
  pageGlowBottom: {position: 'absolute', bottom: -150, right: -100, width: 310, height: 310, borderRadius: 155, backgroundColor: withAlpha(theme.colors.primary, 0.05)},
  safeArea: {flex: 1, backgroundColor: 'transparent'},
  scrollContent: {paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},
  predictionsNote: {marginTop: 12, paddingHorizontal: 12, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center'},
  editBar: {position: 'absolute', left: 12, right: 12, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), borderRadius: 18, backgroundColor: theme.colors.surface, padding: 13, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8},
  editBarCopy: {marginBottom: 10},
  editBarTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
  editBarSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5},
  editActions: {flexDirection: 'row', gap: 10},
  cancelButton: {flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 12, backgroundColor: theme.colors.surface},
  cancelText: {color: theme.colors.primary, fontSize: 13, fontWeight: '700'},
  saveButton: {flex: 1.3, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.primary},
  saveText: {color: onPrimaryTextColor(theme), fontSize: 13, fontWeight: '800'},
  });
}

export default CalendarScreen;
