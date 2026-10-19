import React, {useCallback, useMemo, useState, useEffect, useRef} from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect, useNavigation, type NavigationProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {useJournalSheet} from '../../navigation/JournalSheetContext';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {TOP_SPACING_EXTRA, getFloatingTabBarClearance} from '../../theme/spacing';
import {usePremium} from '../../hooks/usePremium';
import {useToday} from '../../hooks/useToday';
import {rollSelectedDate, rollVisibleMonth} from '../../utils/dayRollover';
import {HawaPremiumBottomSheet} from '../premium/HawaPremiumBottomSheet';
import {isMonthWithinHistoryAccess} from '../../utils/historyAccess';

import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  subscribeMenopausePreferences,
  type MenopausePreferences,
} from '../../state/menopausePreferences';

import {
  getAllMenopauseJournalEntries,
  getMenopauseLabResults,
  hydrateMenopauseJournal,
  subscribeMenopauseJournal,
  type MenopauseJournalCategory,
  type MenopauseJournalEntry,
  type MenopauseLabResult,
} from '../../state/menopauseJournalStore';

import {
  MENOPAUSE_CATEGORY_VISUALS,
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_JOURNAL_ITEMS,
  MENOPAUSE_LAB_TYPE_LABELS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_SLEEP_QUALITY_LABELS,
  MENOPAUSE_TREATMENT_STATUS_LABELS,
} from '../../config/menopauseJournalConfig';

import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {dateFormatLocale} from '../../utils/cycleMath';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

import {
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  localizedWeekDays,
} from '../../utils/cycleMath';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import {computeMenopauseMonthlySummary} from '../../utils/menopauseCalendarMath';
import {displayTitleCase, displayUpperCase} from '../../utils/textCase';

import '../../i18n';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaSwitch} from '../ui/AwaSwitch';
import {AwaText} from '../ui/AwaText';
import {CalendarHeaderAction as HeaderAction} from '../calendar/CalendarHeaderAction';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// SEMANTIC — religious-month markers, never theme-driven (same fixed value
// MonthCalendarCard.tsx/every sibling calendar content already uses).
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

// The compact per-cell "Bien-être" marker is a synthesized grouping of
// mood/sleep/energy (see ALL_CALENDAR_CATEGORIES below) — a 42px day cell
// can't fit 7 distinct family icons legibly, so these three collapse into
// one indicator here only. The full Legend sheet, the compact legend row,
// and the Filtres sheet all stay ungrouped/granular (mood/sleep/energy each
// keep their own row) — only this single tiny in-cell icon is combined.
// Its color intentionally reuses mood's own MENOPAUSE_CATEGORY_VISUALS
// color (mood is the "primary" of the three) rather than inventing a new hex.
const WELLBEING_MARKER_ICON: IconName = 'heart-outline';

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');

// Single source of truth for the compact legend row, the full Legend sheet,
// and the Filtres sheet — all three render from this list so they can never
// drift apart. Deliberately the SAME 7 keys as MenopauseJournalCategory
// (symptoms/mood/sleep/energy/treatment/labResults/notes) rather than a
// second, parallel taxonomy.
const ALL_CALENDAR_CATEGORIES: MenopauseJournalCategory[] = [
  'symptoms',
  'mood',
  'sleep',
  'energy',
  'treatment',
  'labResults',
  'notes',
];

// i18n (Phase 3): this needs the live `t` from useTranslation(), so it's now
// a factory called from inside the component (same `xxxFor(t)` pattern as
// IrregularCalendarContent.tsx's own categoryLabelFor()).
function calendarCategoryCopyFor(
  t: TFunction,
): Record<MenopauseJournalCategory, {filterDescription: string; legendDescription: string}> {
  return {
    symptoms: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.symptoms'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.symptoms'),
    },
    mood: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.mood'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.mood'),
    },
    sleep: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.sleep'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.sleep'),
    },
    energy: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.energy'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.energy'),
    },
    treatment: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.treatment'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.treatment'),
    },
    labResults: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.labResults'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.labResults'),
    },
    notes: {
      filterDescription: t('menopauseCalendar.categories.filterDescription.notes'),
      legendDescription: t('menopauseCalendar.categories.legendDescription.notes'),
    },
  };
}

// Selected-day card row labels — kept as their own local strings (not reused
// from MENOPAUSE_JOURNAL_ITEMS's labels) because this file's own "Analyses"
// wording for labResults already differs from menopauseJournalConfig.ts's
// longer "Résultats d’analyses" (a pre-existing distinction between this
// short selected-day label and the fuller category name used in the
// legend/filters sheet below — preserved as-is, not something this i18n pass
// changes).
function selectedRowLabelsFor(t: TFunction): Record<MenopauseJournalCategory, string> {
  return {
    symptoms: t('menopauseCalendar.selected.labels.symptoms'),
    mood: t('menopauseCalendar.selected.labels.mood'),
    sleep: t('menopauseCalendar.selected.labels.sleep'),
    energy: t('menopauseCalendar.selected.labels.energy'),
    treatment: t('menopauseCalendar.selected.labels.treatment'),
    labResults: t('menopauseCalendar.selected.labels.labResults'),
    notes: t('menopauseCalendar.selected.labels.notes'),
  };
}

// Display-only marker filters — never affect entries/labResults/monthSummary
// or the selected-day card, all of which keep reading real unfiltered data.
// Today's dashed outline and the selected-day fill are intentionally NOT
// part of this type: they must always render regardless of filter state.
// Same shape/behavior contract as ContraceptionCalendarContent.tsx's own
// ContraceptionCalendarFilters.
type MenopauseCalendarFilters = Record<MenopauseJournalCategory, boolean> & {
  ramadan: boolean;
  dhulHijja: boolean;
};

const DEFAULT_CALENDAR_FILTERS: MenopauseCalendarFilters = {
  symptoms: true,
  mood: true,
  sleep: true,
  energy: true,
  treatment: true,
  labResults: true,
  notes: true,
  ramadan: true,
  dhulHijja: true,
};

type CalendarSheetMode = 'filters' | 'legend' | null;

// Categories that can be filled in for a PAST day from the selected-day card
// (MenopauseJournalEntry route param `date`). Plain self-reported tracking
// data; lab results already carry their own sample date, and the private note
// is behind the PIN/biometric gate, so neither is offered here.
const PAST_ENTRY_CATEGORIES: MenopauseJournalCategory[] = ['symptoms', 'mood', 'sleep', 'energy', 'treatment'];

function MenopauseCalendarContent(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {open: openJournal} = useJournalSheet();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const selectedRowLabels = useMemo(() => selectedRowLabelsFor(t), [t]);

  // The "Résumé de ce mois" rose/amber/blue tiles use MENOPAUSE_COLORS'
  // fixed *Soft tints (never theme-driven — same category-identity colors
  // used everywhere else in this file), while `summaryValue`/`summaryLabel`
  // default to theme.colors.accent/textSecondary. Those tokens flip to a
  // light tone in Dark/Premium themes and would then sit unreadably on the
  // always-light tint — derive the correct foreground from each tile's own
  // fixed background instead. summaryTileNeutral uses theme.colors.
  // surfaceSecondary (already theme-adaptive), so it keeps the default text.
  const symptomsTileText = pickReadableTextColor(MENOPAUSE_CATEGORY_VISUALS.symptoms.tint);
  const energyTileText = pickReadableTextColor(MENOPAUSE_CATEGORY_VISUALS.energy.tint);
  const sleepTileText = pickReadableTextColor(MENOPAUSE_CATEGORY_VISUALS.sleep.tint);

  // Re-evaluated when the day changes / the app returns to the foreground —
  // see src/hooks/useToday.ts.
  const {today, todayKey} = useToday();

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  // A new day began (see src/hooks/useToday.ts): a selection / visible month
  // that was FOLLOWING today moves to the new day; a date the user pointed at
  // is never moved. Rule lives in utils/dayRollover.ts.
  const previousTodayRef = useRef(today);
  useEffect(() => {
    const previousToday = previousTodayRef.current;
    if (previousToday.getTime() === today.getTime()) {return;}
    previousTodayRef.current = today;
    setSelectedDate(current => rollSelectedDate(current, previousToday, today));
    setVisibleMonth(current => rollVisibleMonth(current, previousToday, today));
  }, [today]);
  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  // "Historique illimité" — backward navigation only; see historyAccess.ts.
  const goToPreviousMonth = useCallback(() => {
    setVisibleMonth(current => {
      const target = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      if (!isMonthWithinHistoryAccess(target, isPremium)) {
        setPremiumVisible(true);
        return current;
      }
      return target;
    });
  }, [isPremium]);

  const goToNextMonth = useCallback(() => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }, []);

  const [filters, setFilters] = useState<MenopauseCalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [sheet, setSheet] = useState<CalendarSheetMode>(null);

  const toggleFilter = useCallback((key: keyof MenopauseCalendarFilters) => {
    setFilters(current => ({...current, [key]: !current[key]}));
  }, []);

  const [preferences, setPreferences] = useState<MenopausePreferences>(getMenopausePreferences);
  const [entriesByDate, setEntriesByDate] = useState<Record<string, MenopauseJournalEntry>>(
    getAllMenopauseJournalEntries,
  );
  const [labResults, setLabResults] = useState<MenopauseLabResult[]>(() => getMenopauseLabResults());
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateMenopausePreferences().then(value => {
        if (active) {setPreferences(value);}
      });
      const unsubscribePreferences = subscribeMenopausePreferences(() => {
        if (active) {setPreferences(getMenopausePreferences());}
      });

      hydrateMenopauseJournal().then(() => {
        if (active) {
          setEntriesByDate(getAllMenopauseJournalEntries());
          setLabResults(getMenopauseLabResults());
        }
      });
      const unsubscribeJournal = subscribeMenopauseJournal(() => {
        if (active) {
          setEntriesByDate(getAllMenopauseJournalEntries());
          setLabResults(getMenopauseLabResults());
        }
      });

      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());

      return () => {
        active = false;
        unsubscribePreferences();
        unsubscribeJournal();
      };
    }, []),
  );

  // Preferences say what is offered for NEW tracking; they never hide what was
  // genuinely recorded. Treatment / lab history therefore stays represented
  // (markers, legend, selected day) even after the user stops tracking them.
  const trackingTreatment = preferences.hormonalTreatmentStatus === 'track';
  const hasTreatmentHistory = useMemo(
    () => Object.values(entriesByDate).some(entry => Boolean(entry.treatmentStatus)),
    [entriesByDate],
  );
  const hasLabHistory = labResults.length > 0;
  const showTreatment = trackingTreatment || hasTreatmentHistory;
  const showLab = (preferences.labTracking !== null && preferences.labTracking !== 'none') || hasLabHistory;

  const visibleCategories = useMemo(
    () =>
      ALL_CALENDAR_CATEGORIES.filter(
        category => (category !== 'treatment' || showTreatment) && (category !== 'labResults' || showLab),
      ),
    [showTreatment, showLab],
  );

  const labDatesSet = useMemo(() => new Set(labResults.map(result => result.date)), [labResults]);

  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const isSelectedToday = selectedDateKey === todayKey;
  const isSelectedPast = selectedDateKey < todayKey;
  const selectedEntry = entriesByDate[selectedDateKey];
  const selectedLabResults = useMemo(
    () => labResults.filter(result => result.date === selectedDateKey),
    [labResults, selectedDateKey],
  );
  const selectedHijriDate = spiritualMarkersEnabled ? formatHijriDate(selectedDate) : undefined;

  const hasAnySelectedData = Boolean(
    selectedEntry?.symptoms?.length ||
      selectedEntry?.mood ||
      selectedEntry?.sleepDurationHours !== undefined ||
      selectedEntry?.sleepQuality ||
      selectedEntry?.energyLevel ||
      (showTreatment && selectedEntry?.treatmentStatus) ||
      (showLab && selectedLabResults.length > 0) ||
      selectedEntry?.notes?.trim(),
  );

  const monthlySummary = useMemo(
    () => computeMenopauseMonthlySummary(entriesByDate, visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth, entriesByDate],
  );

  const hasAnyDataAtAll = Object.keys(entriesByDate).length > 0 || labResults.length > 0;

  const hijriRangeLabel = useMemo(() => {
    if (!spiritualMarkersEnabled) {return undefined;}
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const last = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const firstLabel = formatHijriMonthYear(first);
    const lastLabel = formatHijriMonthYear(last);
    if (!firstLabel) {return undefined;}
    if (!lastLabel || lastLabel === firstLabel) {return firstLabel;}
    return `${firstLabel} – ${lastLabel}`;
  }, [visibleMonth, spiritualMarkersEnabled]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({length: offset + count}, (_, index) =>
      index < offset ? null : new Date(year, month, index - offset + 1),
    );
  }, [visibleMonth]);

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: getFloatingTabBarClearance(insets.bottom, 24)}]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AwaText variant="headlineSmall" style={styles.title}>{t('menopauseCalendar.title')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>{t('menopauseCalendar.subtitle')}</AwaText>
            </View>

            <HeaderAction icon="tune-variant" label={t('menopauseCalendar.filtersLabel')} onPress={() => setSheet('filters')} />
            <HeaderAction icon="format-list-bulleted" label={t('menopauseCalendar.legendLabel')} onPress={() => setSheet('legend')} />
          </View>

          {/* MONTH CARD */}
          <AwaCard padding="none" variant="filled" style={styles.card}>
            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel={t('menopauseCalendar.prevMonthAccessibility')}
                accessibilityRole="button"
                hitSlop={12}
                onPress={goToPreviousMonth}>
                <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={24} />
              </Pressable>

              <View style={styles.monthTitleBlock}>
                <AwaText variant="titleMedium" style={styles.monthTitle}>
                  {displayTitleCase(new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long', year: 'numeric'}).format(visibleMonth))}
                </AwaText>
                {hijriRangeLabel ? (
                  <AwaText variant="labelSmall" colorRole="primary" numberOfLines={2} style={styles.hijriRange}>{hijriRangeLabel}</AwaText>
                ) : null}
              </View>

              <Pressable
                accessibilityLabel={t('menopauseCalendar.nextMonthAccessibility')}
                accessibilityRole="button"
                hitSlop={12}
                onPress={goToNextMonth}>
                <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={24} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {localizedWeekDays().map(day => (
                <Text key={day} numberOfLines={1} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const key = dateKey(date);
                const entry = entriesByDate[key];
                const isToday = sameDay(date, today);
                const isSelected = sameDay(date, selectedDate);
                const lightText = isSelected && !isToday;
                const hijriDay = spiritualMarkersEnabled ? formatHijriDay(date) : undefined;

                // Classification is computed unconditionally — filters only
                // affect whether the resulting marker is DISPLAYED below,
                // never the underlying isRamadan/isDhoulHijja result. Same
                // reasoning as ContraceptionCalendarContent.tsx.
                const rawSpiritualMonth = !spiritualMarkersEnabled
                  ? null
                  : isRamadan(date)
                    ? 'ramadan'
                    : isDhoulHijja(date)
                      ? 'dhoulHijja'
                      : null;
                const spiritualMonth =
                  rawSpiritualMonth === 'ramadan'
                    ? (filters.ramadan ? 'ramadan' : null)
                    : rawSpiritualMonth === 'dhoulHijja'
                      ? (filters.dhulHijja ? 'dhoulHijja' : null)
                      : null;

                const hasSymptoms = filters.symptoms && Boolean(entry?.symptoms?.length);
                const hasMood = filters.mood && Boolean(entry?.mood);
                const hasSleep =
                  filters.sleep && (entry?.sleepDurationHours !== undefined || Boolean(entry?.sleepQuality));
                const hasEnergy = filters.energy && Boolean(entry?.energyLevel);
                const hasWellbeing = hasMood || hasSleep || hasEnergy;
                const hasTreatment = showTreatment && filters.treatment && Boolean(entry?.treatmentStatus);
                const hasLab = showLab && filters.labResults && labDatesSet.has(key);
                const hasNotes = filters.notes && Boolean(entry?.notes?.trim());

                const dayMarkers: Array<{icon: IconName; color: string}> = [];
                if (hasSymptoms) {
                  dayMarkers.push({
                    icon: MENOPAUSE_CATEGORY_VISUALS.symptoms.icon,
                    color: MENOPAUSE_CATEGORY_VISUALS.symptoms.iconColor,
                  });
                }
                if (hasWellbeing) {
                  dayMarkers.push({icon: WELLBEING_MARKER_ICON, color: MENOPAUSE_CATEGORY_VISUALS.mood.iconColor});
                }
                if (hasTreatment) {
                  dayMarkers.push({
                    icon: MENOPAUSE_CATEGORY_VISUALS.treatment.icon,
                    color: MENOPAUSE_CATEGORY_VISUALS.treatment.iconColor,
                  });
                }
                if (hasLab) {
                  dayMarkers.push({
                    icon: MENOPAUSE_CATEGORY_VISUALS.labResults.icon,
                    color: MENOPAUSE_CATEGORY_VISUALS.labResults.iconColor,
                  });
                }
                if (hasNotes) {
                  dayMarkers.push({
                    icon: MENOPAUSE_CATEGORY_VISUALS.notes.icon,
                    color: MENOPAUSE_CATEGORY_VISUALS.notes.iconColor,
                  });
                }

                const hasAnyMarker = dayMarkers.length > 0;

                return (
                  <View key={key} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()}${hasAnyMarker ? t('menopauseCalendar.dayAccessibility.trackingRecorded') : ''}${spiritualMonth === 'ramadan' ? t('menopauseCalendar.dayAccessibility.ramadan') : spiritualMonth === 'dhoulHijja' ? t('menopauseCalendar.dayAccessibility.dhoulHijja') : ''}`}
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date)}
                      style={({pressed}) => [
                        styles.day,
                        !isToday && hasAnyMarker && styles.dayHasMarker,
                        isSelected && !isToday && styles.daySelected,
                        isToday && styles.dayToday,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.dayText, lightText && styles.dayTextLight, isToday && styles.dayTextToday]}>
                        {date.getDate()}
                      </Text>
                      {hijriDay ? (
                        <Text numberOfLines={1} style={[styles.hijriDayText, lightText && styles.dayTextLight]}>
                          {hijriDay}
                        </Text>
                      ) : null}
                      {hasAnyMarker ? (
                        <View style={styles.dayMarkerRow}>
                          {dayMarkers.map((marker, markerIndex) => (
                            <MaterialDesignIcons
                              color={lightText ? onPrimaryTextColor(theme) : marker.color}
                              key={markerIndex}
                              name={marker.icon}
                              size={8}
                            />
                          ))}
                        </View>
                      ) : null}
                      {spiritualMonth ? (
                        <View pointerEvents="none" style={styles.spiritualMarker}>
                          <MaterialDesignIcons
                            color={isToday || lightText ? theme.colors.accent : spiritualMonth === 'ramadan' ? RAMADAN_MARKER_COLOR : DHOUL_HIJJA_MARKER_COLOR}
                            name="moon-waning-crescent"
                            size={9}
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* COMPACT LEGEND — ungrouped, one item per real marker family */}
            <View style={styles.legendRow}>
              {visibleCategories.map(category => (
                <LegendItem
                  color={MENOPAUSE_CATEGORY_VISUALS[category].iconColor}
                  key={category}
                  label={MENOPAUSE_JOURNAL_ITEMS.find(item => item.key === category)?.label ?? category}
                />
              ))}
              <LegendItem color={theme.colors.text} dashedOutline label={t('menopauseCalendar.todayLabel')} />
              {spiritualMarkersEnabled ? (
                <>
                  <LegendItem color={RAMADAN_MARKER_COLOR} icon="moon-waning-crescent" label={t('menopauseCalendar.ramadanLabel')} />
                  <LegendItem color={DHOUL_HIJJA_MARKER_COLOR} icon="moon-waning-crescent" label={t('menopauseCalendar.dhoulHijjaLabel')} />
                </>
              ) : null}
            </View>
          </AwaCard>

          {/* SELECTED DAY CARD */}
          <AwaCard padding="none" variant="filled" style={styles.card}>
            <View style={styles.selectedHeader}>
              <AwaText variant="titleMedium" style={styles.selectedDateText}>
                {displayTitleCase(new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(selectedDate))}
              </AwaText>
              {selectedHijriDate ? (
                <AwaText variant="labelSmall" colorRole="primary" style={styles.selectedHijriText}>{selectedHijriDate}</AwaText>
              ) : null}
            </View>

            {hasAnySelectedData ? (
              <>
                {selectedEntry?.symptoms?.length ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.symptoms.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.symptoms.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.symptoms.tint}
                    label={selectedRowLabels.symptoms}
                    value={t('menopauseCalendar.selected.symptomsRecorded', {count: selectedEntry.symptoms.length})}
                  />
                ) : null}
                {selectedEntry?.mood ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.mood.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.mood.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.mood.tint}
                    label={selectedRowLabels.mood}
                    value={MENOPAUSE_MOOD_LABELS[selectedEntry.mood]}
                  />
                ) : null}
                {selectedEntry?.sleepDurationHours !== undefined || selectedEntry?.sleepQuality ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.sleep.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.sleep.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.sleep.tint}
                    label={selectedRowLabels.sleep}
                    value={
                      selectedEntry?.sleepDurationHours !== undefined
                        ? `${selectedEntry.sleepDurationHours} h${selectedEntry.sleepQuality ? ` · ${MENOPAUSE_SLEEP_QUALITY_LABELS[selectedEntry.sleepQuality]}` : ''}`
                        : selectedEntry?.sleepQuality
                          ? MENOPAUSE_SLEEP_QUALITY_LABELS[selectedEntry.sleepQuality]
                          : ''
                    }
                  />
                ) : null}
                {selectedEntry?.energyLevel ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.energy.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.energy.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.energy.tint}
                    label={selectedRowLabels.energy}
                    value={MENOPAUSE_ENERGY_LABELS[selectedEntry.energyLevel]}
                  />
                ) : null}
                {showTreatment && selectedEntry?.treatmentStatus ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.treatment.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.treatment.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.treatment.tint}
                    label={selectedRowLabels.treatment}
                    value={MENOPAUSE_TREATMENT_STATUS_LABELS[selectedEntry.treatmentStatus]}
                  />
                ) : null}
                {showLab && selectedLabResults.length > 0 ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.labResults.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.labResults.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.labResults.tint}
                    label={selectedRowLabels.labResults}
                    value={selectedLabResults
                      .map(result => `${MENOPAUSE_LAB_TYPE_LABELS[result.type]} : ${result.value}${result.unit ? ` ${result.unit}` : ''}`)
                      .join(' · ')}
                  />
                ) : null}
                {selectedEntry?.notes?.trim() ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.notes.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.notes.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.notes.tint}
                    label={selectedRowLabels.notes}
                    value={t('menopauseCalendar.selected.notesRecorded')}
                  />
                ) : null}
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={22} />
                </View>
                <AwaText variant="labelMedium" style={styles.emptyTitle}>{t('menopauseCalendar.emptyState.title')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.emptyText}>{t('menopauseCalendar.emptyState.text')}</AwaText>
              </View>
            )}

            {isSelectedPast ? (
              <View style={styles.pastEntryBlock}>
                <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.pastEntryTitle}>{t('menopauseCalendar.pastEntry.title')}</AwaText>
                <View style={styles.pastEntryChips}>
                  {PAST_ENTRY_CATEGORIES.filter(category => category !== 'treatment' || trackingTreatment).map(category => {
                    const label = MENOPAUSE_JOURNAL_ITEMS.find(item => item.key === category)?.label ?? category;
                    return (
                      <Pressable
                        accessibilityLabel={t('menopauseCalendar.pastEntry.fillAccessibility', {label})}
                        accessibilityRole="button"
                        key={category}
                        onPress={() => navigation.navigate('MenopauseJournalEntry', {category, date: selectedDateKey})}
                        style={({pressed}) => [styles.pastEntryChip, pressed && styles.pressed]}>
                        <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS[category].iconColor} name={MENOPAUSE_CATEGORY_VISUALS[category].icon} size={14} />
                        <AwaText variant="labelMedium" style={styles.pastEntryChipText}>{label}</AwaText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {isSelectedToday ? (
              <AwaButton
                accessibilityLabel={t('menopauseCalendar.selected.editTodayAccessibility')}
                fullWidth
                label={t('menopauseCalendar.selected.editToday')}
                onPress={openJournal}
                style={styles.editRow}
                variant="tonal"
              />
            ) : null}
          </AwaCard>

          {/* MONTHLY SUMMARY */}
          <AwaCard padding="none" variant="filled" style={styles.card}>
            <AwaText variant="titleMedium" style={styles.summaryTitle}>{t('menopauseCalendar.summary.title')}</AwaText>

            {hasAnyDataAtAll ? (
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryTile, styles.summaryTileRose]}>
                  <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS.symptoms.iconColor} name="clipboard-pulse-outline" size={18} />
                  <AwaText variant="titleLarge" style={[styles.summaryValue, {color: symptomsTileText}]}>{monthlySummary.daysWithSymptoms}</AwaText>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={[styles.summaryLabel, {color: symptomsTileText}]}>{t('menopauseCalendar.summary.daysWithSymptoms')}</AwaText>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileAmber]}>
                  <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS.energy.iconColor} name="weather-sunny" size={18} />
                  <AwaText variant="titleLarge" style={[styles.summaryValue, {color: energyTileText}]}>{monthlySummary.hotFlashDays}</AwaText>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={[styles.summaryLabel, {color: energyTileText}]}>{t('menopauseCalendar.summary.hotFlashDays')}</AwaText>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileBlue]}>
                  <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS.sleep.iconColor} name="water-outline" size={18} />
                  <AwaText variant="titleLarge" style={[styles.summaryValue, {color: sleepTileText}]}>{monthlySummary.nightSweatNights}</AwaText>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={[styles.summaryLabel, {color: sleepTileText}]}>{t('menopauseCalendar.summary.nightSweatNights')}</AwaText>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileNeutral]}>
                  <MaterialDesignIcons color={theme.colors.textSecondary} name="battery-low" size={18} />
                  <AwaText variant="titleLarge" style={styles.summaryValue}>{monthlySummary.fatigueDays}</AwaText>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.summaryLabel}>{t('menopauseCalendar.summary.fatigueDays')}</AwaText>
                </View>
              </View>
            ) : (
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{t('menopauseCalendar.summary.empty')}</AwaText>
            )}
          </AwaCard>
        </ScrollView>

        <MenopauseCalendarSheet
          filters={filters}
          mode={sheet}
          onClose={() => setSheet(null)}
          onToggle={toggleFilter}
          spiritualMarkersEnabled={spiritualMarkersEnabled}
          visibleCategories={visibleCategories}
        />

        <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
      </SafeAreaView>
    </LinearGradient>
  );
}


function LegendItem({
  color,
  label,
  dashedOutline = false,
  icon,
}: {
  color?: string;
  label: string;
  dashedOutline?: boolean;
  icon?: IconName;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.legendItem}>
      {icon ? (
        <MaterialDesignIcons color={color} name={icon} size={11} />
      ) : dashedOutline ? (
        <View style={[styles.legendDashedRing, color ? {borderColor: color} : null]} />
      ) : (
        <View style={[styles.legendDot, color ? {backgroundColor: color} : null]} />
      )}
      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.legendLabel}>{label}</AwaText>
    </View>
  );
}

function SelectedRow({
  icon,
  iconColor,
  iconTint,
  label,
  value,
}: {
  icon: IconName;
  iconColor: string;
  iconTint: string;
  label: string;
  value: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.selectedRow}>
      <View style={[styles.selectedRowIcon, {backgroundColor: iconTint}]}>
        <MaterialDesignIcons color={iconColor} name={icon} size={17} />
      </View>
      <View style={styles.selectedRowTextGroup}>
        <AwaText variant="labelSmall" colorRole="onSurfaceVariant">{label}</AwaText>
        <AwaText variant="labelMedium" style={styles.selectedRowValue}>{value}</AwaText>
      </View>
    </View>
  );
}

/* ============================================================
   FILTRES / LÉGENDE — same premium bottom-sheet pattern as
   ContraceptionCalendarContent.tsx (backdrop/handle/title/scroll
   behavior/row spacing/icon containers/footer button/safe-area bottom
   padding all reused verbatim); content is Menopause-specific and derives
   from ALL_CALENDAR_CATEGORIES/calendarCategoryCopyFor()/MENOPAUSE_CATEGORY_VISUALS
   above so the compact legend, this sheet, and the Filtres sheet can never
   describe three different marker sets.
============================================================ */

function MenopauseCalendarSheet({
  mode,
  onClose,
  onToggle,
  filters,
  spiritualMarkersEnabled,
  visibleCategories,
}: {
  mode: CalendarSheetMode;
  onClose: () => void;
  onToggle: (key: keyof MenopauseCalendarFilters) => void;
  filters: MenopauseCalendarFilters;
  spiritualMarkersEnabled: boolean;
  visibleCategories: MenopauseJournalCategory[];
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const sheetStyles = useMemo(() => createSheetStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const categoryCopy = useMemo(() => calendarCategoryCopyFor(t), [t]);

  const trackingFilterRows = visibleCategories.map(category => ({
    key: category,
    icon: MENOPAUSE_CATEGORY_VISUALS[category].icon,
    color: MENOPAUSE_CATEGORY_VISUALS[category].iconColor,
    title: MENOPAUSE_JOURNAL_ITEMS.find(item => item.key === category)?.label ?? category,
    description: categoryCopy[category].filterDescription,
  }));

  const spiritualFilterRows: Array<{
    key: keyof MenopauseCalendarFilters;
    icon: IconName;
    color: string;
    title: string;
    description: string;
  }> = [
    {
      key: 'ramadan',
      icon: 'moon-waning-crescent',
      color: RAMADAN_MARKER_COLOR,
      title: t('menopauseCalendar.ramadanLabel'),
      description: t('menopauseCalendar.sheet.spiritualFilter.ramadanDescription'),
    },
    {
      key: 'dhulHijja',
      icon: 'moon-waning-crescent',
      color: DHOUL_HIJJA_MARKER_COLOR,
      title: t('menopauseCalendar.dhoulHijjaLabel'),
      description: t('menopauseCalendar.sheet.spiritualFilter.dhoulHijjaDescription'),
    },
  ];

  const legendRows = visibleCategories.map(category => ({
    icon: MENOPAUSE_CATEGORY_VISUALS[category].icon,
    color: MENOPAUSE_CATEGORY_VISUALS[category].iconColor,
    title: MENOPAUSE_JOURNAL_ITEMS.find(item => item.key === category)?.label ?? category,
    description: categoryCopy[category].legendDescription,
  }));

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={mode !== null}>
      <View style={sheetStyles.modalRoot}>
        <Pressable accessibilityLabel={t('menopauseCalendar.sheet.closeAccessibility')} onPress={onClose} style={sheetStyles.backdrop} />

        {mode === 'filters' ? (
          <View style={[sheetStyles.sheet, sheetStyles.filterSheet, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <View style={sheetStyles.handle} />

            <View style={sheetStyles.sheetHeader}>
              <AwaText variant="headlineSmall" style={sheetStyles.sheetTitle}>{t('menopauseCalendar.sheet.filters.title')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.sheetSubtitle}>{t('menopauseCalendar.sheet.filters.subtitle')}</AwaText>
            </View>

            <ScrollView bounces={false} contentContainerStyle={sheetStyles.filterRows} showsVerticalScrollIndicator={false} style={sheetStyles.filterScroll}>
              <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={sheetStyles.groupTitle}>{displayUpperCase(t('menopauseCalendar.sheet.filters.trackingGroupTitle'))}</AwaText>
              {trackingFilterRows.map((row, index) => (
                <FilterRow
                  active={filters[row.key]}
                  key={row.key}
                  last={index === trackingFilterRows.length - 1 && !spiritualMarkersEnabled}
                  onPress={() => onToggle(row.key)}
                  row={row}
                />
              ))}

              {spiritualMarkersEnabled ? (
                <>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={sheetStyles.groupTitle}>{displayUpperCase(t('menopauseCalendar.sheet.filters.spiritualGroupTitle'))}</AwaText>
                  {spiritualFilterRows.map((row, index) => (
                    <FilterRow
                      active={filters[row.key]}
                      key={row.key}
                      last={index === spiritualFilterRows.length - 1}
                      onPress={() => onToggle(row.key)}
                      row={row}
                    />
                  ))}
                </>
              ) : null}
            </ScrollView>

            <View style={sheetStyles.footer}>
              <AwaButton
                accessibilityRole="button"
                onPress={onClose}
                label={t('menopauseCalendar.sheet.filters.doneLabel')}
              />
            </View>
          </View>
        ) : mode === 'legend' ? (
          <View style={[sheetStyles.sheet, sheetStyles.legendSheet, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <View style={sheetStyles.handle} />

            <ScrollView bounces={false} contentContainerStyle={sheetStyles.legendScrollContent} showsVerticalScrollIndicator={false} style={sheetStyles.legendScroll}>
              <View style={sheetStyles.sheetHeader}>
                <AwaText variant="headlineSmall" style={sheetStyles.sheetTitle}>{t('menopauseCalendar.sheet.legend.title')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.sheetSubtitle}>{t('menopauseCalendar.sheet.legend.subtitle')}</AwaText>
              </View>

              <View style={sheetStyles.legendRowsGroup}>
                {legendRows.map(row => (
                  <View key={row.title} style={sheetStyles.legendRow}>
                    <View style={sheetStyles.legendLargeIcon}>
                      <MaterialDesignIcons color={row.color} name={row.icon} size={22} />
                    </View>
                    <View style={sheetStyles.legendRowCopy}>
                      <AwaText variant="titleSmall" style={sheetStyles.legendRowTitle}>{row.title}</AwaText>
                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.legendRowText}>{row.description}</AwaText>
                    </View>
                  </View>
                ))}

                <View style={sheetStyles.legendRow}>
                  <View style={sheetStyles.legendLargeIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name={WELLBEING_MARKER_ICON} size={22} />
                  </View>
                  <View style={sheetStyles.legendRowCopy}>
                    <AwaText variant="titleSmall" style={sheetStyles.legendRowTitle}>{t('menopauseCalendar.wellbeing.legendTitle')}</AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.legendRowText}>
                      {t('menopauseCalendar.wellbeing.legendDescription')}
                    </AwaText>
                  </View>
                </View>

                <View style={sheetStyles.legendRow}>
                  <View style={sheetStyles.legendLargeIcon}>
                    <View style={sheetStyles.legendTodayPreview} />
                  </View>
                  <View style={sheetStyles.legendRowCopy}>
                    <AwaText variant="titleSmall" style={sheetStyles.legendRowTitle}>{t('menopauseCalendar.todayLabel')}</AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.legendRowText}>{t('menopauseCalendar.sheet.legend.todayDescription')}</AwaText>
                  </View>
                </View>

                {spiritualMarkersEnabled ? (
                  <>
                    <View style={sheetStyles.legendRow}>
                      <View style={sheetStyles.legendLargeIcon}>
                        <MaterialDesignIcons color={RAMADAN_MARKER_COLOR} name="moon-waning-crescent" size={22} />
                      </View>
                      <View style={sheetStyles.legendRowCopy}>
                        <AwaText variant="titleSmall" style={sheetStyles.legendRowTitle}>{t('menopauseCalendar.ramadanLabel')}</AwaText>
                        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.legendRowText}>{t('menopauseCalendar.sheet.legend.ramadanDescription')}</AwaText>
                      </View>
                    </View>
                    <View style={[sheetStyles.legendRow, sheetStyles.legendRowLast]}>
                      <View style={sheetStyles.legendLargeIcon}>
                        <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={22} />
                      </View>
                      <View style={sheetStyles.legendRowCopy}>
                        <AwaText variant="titleSmall" style={sheetStyles.legendRowTitle}>{t('menopauseCalendar.dhoulHijjaLabel')}</AwaText>
                        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.legendRowText}>{t('menopauseCalendar.sheet.legend.dhoulHijjaDescription')}</AwaText>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            </ScrollView>

            <View style={sheetStyles.footer}>
              <AwaButton
                accessibilityLabel={t('menopauseCalendar.sheet.legend.closeAccessibility')}
                accessibilityRole="button"
                onPress={onClose}
                label={t('menopauseCalendar.sheet.legend.closeLabel')}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function FilterRow({
  row,
  active,
  onPress,
  last,
}: {
  row: {icon: IconName; color: string; title: string; description: string};
  active: boolean;
  onPress: () => void;
  last: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const sheetStyles = useMemo(() => createSheetStyles(theme), [theme]);
  return (
    <Pressable
      accessible={false}
      onPress={onPress}
      style={[sheetStyles.filterRow, last && sheetStyles.filterRowLast]}>
      <View style={sheetStyles.filterIcon}>
        <MaterialDesignIcons color={row.color} name={row.icon} size={20} />
      </View>
      <View style={sheetStyles.filterCopy}>
        <AwaText variant="labelMedium" style={sheetStyles.filterTitle}>{row.title}</AwaText>
        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={sheetStyles.filterDescription}>{row.description}</AwaText>
      </View>
      <AwaSwitch accessibilityLabel={row.title} onValueChange={onPress} value={active} />
    </Pressable>
  );
}

function createSheetStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  // Fixed modal scrim — never themed, same precedent as every migrated screen.
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,22,65,0.34)'},
  sheet: {
    maxHeight: '90%', paddingTop: 9, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: theme.colors.surface, overflow: 'hidden',
  },
  handle: {width: 44, height: 5, alignSelf: 'center', flexShrink: 0, borderRadius: 3, backgroundColor: withAlpha(theme.colors.primary, 0.30)},

  sheetHeader: {flexShrink: 0, marginTop: 18, marginBottom: 10, paddingHorizontal: 22},
  sheetTitle: {color: theme.colors.accent},
  sheetSubtitle: {marginTop: 8},

  filterSheet: {height: '80%'},
  filterScroll: {flex: 1, minHeight: 0},
  filterRows: {paddingHorizontal: 22, paddingBottom: 10},
  groupTitle: {marginTop: 14, marginBottom: 4, textTransform: 'uppercase'},
  filterRow: {
    minHeight: 66, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  filterRowLast: {borderBottomWidth: 0},
  filterIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft},
  filterCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  filterTitle: {color: theme.colors.accent},
  filterDescription: {marginTop: 2},

  legendSheet: {height: '80%', paddingHorizontal: 0},
  legendScroll: {flex: 1, minHeight: 0},
  legendScrollContent: {paddingHorizontal: 22, paddingTop: 4, paddingBottom: 16},
  legendRowsGroup: {marginTop: 6},
  legendRow: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  legendRowLast: {borderBottomWidth: 0},
  legendLargeIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft},
  legendTodayPreview: {
    width: 22, height: 22, borderWidth: 1.8, borderStyle: 'dashed', borderColor: theme.colors.text, borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
  },
  legendRowCopy: {flex: 1, minWidth: 0, marginLeft: 14},
  legendRowTitle: {color: theme.colors.accent},
  legendRowText: {marginTop: 3},

  footer: {
    flexShrink: 0, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(theme.colors.primary, 0.10), backgroundColor: theme.colors.surface,
  },
  });
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},

  header: {flexDirection: 'row', alignItems: 'center'},
  headerCopy: {flex: 1, minWidth: 0},
  title: {color: theme.colors.accent},
  subtitle: {marginTop: 4},

  card: {marginTop: 16, padding: 16},

  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  monthTitleBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 6, minWidth: 0},
  monthTitle: {color: theme.colors.accent, textTransform: 'capitalize'},
  hijriRange: {marginTop: 2, textAlign: 'center'},

  weekRow: {flexDirection: 'row', marginTop: 14},
  weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 4},
  dayCell: {width: '14.2857%', minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
  day: {
    position: 'relative', width: '86%', minHeight: 42, maxWidth: 42, paddingVertical: 4,
    alignItems: 'center', justifyContent: 'center', borderRadius: 12,
  },
  dayHasMarker: {backgroundColor: theme.colors.primarySoft},
  daySelected: {backgroundColor: theme.colors.primary},
  dayToday: {
    backgroundColor: theme.colors.primarySoft, borderWidth: 1.8, borderStyle: 'dashed', borderColor: theme.colors.text, borderRadius: 12,
  },
  dayText: {color: theme.colors.accent, fontSize: 13, fontWeight: '600'},
  dayTextLight: {color: onPrimaryTextColor(theme)},
  dayTextToday: {color: theme.colors.text, fontWeight: '800'},
  hijriDayText: {color: theme.colors.textSecondary, fontSize: 11, marginTop: 1},
  dayMarkerRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 34, marginTop: 1, gap: 1.5},
  spiritualMarker: {position: 'absolute', top: 3, right: 3},

  legendRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%'},
  legendLabel: {flexShrink: 1},
  legendDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.textSecondary},
  legendDashedRing: {width: 11, height: 11, borderRadius: 6, borderWidth: 1.3, borderStyle: 'dashed', borderColor: theme.colors.text},

  selectedHeader: {marginBottom: 4},
  selectedDateText: {color: theme.colors.accent, textTransform: 'capitalize'},
  selectedHijriText: {marginTop: 2},

  selectedRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10},
  selectedRowIcon: {width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
  selectedRowTextGroup: {flex: 1, minWidth: 0},
  selectedRowValue: {marginTop: 2, color: theme.colors.accent},

  editRow: {marginTop: 8},

  pastEntryBlock: {marginTop: 10},
  pastEntryTitle: {marginBottom: 6},
  pastEntryChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  pastEntryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12,
    borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  pastEntryChipText: {color: theme.colors.accent},

  summaryTitle: {color: theme.colors.accent, marginBottom: 12},
  summaryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  summaryTile: {
    flexGrow: 1, flexBasis: '46%', minWidth: 130, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14),
  },
  summaryTileRose: {backgroundColor: MENOPAUSE_CATEGORY_VISUALS.symptoms.tint},
  summaryTileAmber: {backgroundColor: MENOPAUSE_CATEGORY_VISUALS.energy.tint},
  summaryTileBlue: {backgroundColor: MENOPAUSE_CATEGORY_VISUALS.sleep.tint},
  summaryTileNeutral: {backgroundColor: theme.colors.surfaceSecondary},
  summaryValue: {marginTop: 6, color: theme.colors.accent},
  summaryLabel: {marginTop: 2, textAlign: 'center'},

  emptyState: {alignItems: 'center', paddingVertical: 14},
  emptyIcon: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft, marginBottom: 8},
  emptyTitle: {color: theme.colors.accent, textAlign: 'center'},
  emptyText: {marginTop: 4, textAlign: 'center'},

  pressed: {opacity: 0.82},
  });
}

export default MenopauseCalendarContent;
