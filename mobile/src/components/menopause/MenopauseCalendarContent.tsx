import React, {useCallback, useMemo, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {useJournalSheet} from '../../navigation/JournalSheetContext';
import {TOP_SPACING_EXTRA, getFloatingTabBarClearance} from '../../theme/spacing';
import {usePremium} from '../../hooks/usePremium';
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
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

import {
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import {computeMenopauseMonthlySummary} from '../../utils/menopauseCalendarMath';

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

const CALENDAR_CATEGORY_COPY: Record<
  MenopauseJournalCategory,
  {filterDescription: string; legendDescription: string}
> = {
  symptoms: {
    filterDescription: 'Afficher les jours où un ou plusieurs symptômes ont été notés',
    legendDescription: 'Un ou plusieurs symptômes ont été enregistrés.',
  },
  mood: {
    filterDescription: 'Afficher les jours où une humeur a été renseignée',
    legendDescription: 'Une humeur a été renseignée pour cette date.',
  },
  sleep: {
    filterDescription: 'Afficher les jours où le sommeil a été renseigné',
    legendDescription: 'Des informations de sommeil ont été enregistrées.',
  },
  energy: {
    filterDescription: 'Afficher les jours où le niveau d’énergie a été renseigné',
    legendDescription: 'Le niveau d’énergie a été renseigné.',
  },
  treatment: {
    filterDescription: 'Afficher les jours où le traitement a été suivi',
    legendDescription: 'Un suivi de traitement a été enregistré.',
  },
  labResults: {
    filterDescription: 'Afficher les jours avec un résultat d’analyse',
    legendDescription: 'Un résultat FSH ou Estradiol a été enregistré.',
  },
  notes: {
    filterDescription: 'Afficher les jours avec une note personnelle',
    legendDescription: 'Une note personnelle a été enregistrée ce jour-là.',
  },
};

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

function MenopauseCalendarContent(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {open: openJournal} = useJournalSheet();

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

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(today), [today]);

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
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

  const showTreatment = preferences.hormonalTreatmentStatus === 'track';
  const showLab = preferences.labTracking !== null && preferences.labTracking !== 'none';

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
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: getFloatingTabBarClearance(insets.bottom, 24)}]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Calendrier</Text>
              <Text style={styles.subtitle}>Ton suivi périménopause / ménopause au fil du temps</Text>
            </View>

            <HeaderAction icon="tune-variant" label="Filtres" onPress={() => setSheet('filters')} />
            <HeaderAction icon="format-list-bulleted" label="Légende" onPress={() => setSheet('legend')} />
          </View>

          {/* MONTH CARD */}
          <View style={styles.card}>
            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                accessibilityRole="button"
                hitSlop={12}
                onPress={goToPreviousMonth}>
                <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={24} />
              </Pressable>

              <View style={styles.monthTitleBlock}>
                <Text numberOfLines={1} style={styles.monthTitle}>
                  {new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(visibleMonth)}
                </Text>
                {hijriRangeLabel ? (
                  <Text numberOfLines={2} style={styles.hijriRange}>{hijriRangeLabel}</Text>
                ) : null}
              </View>

              <Pressable
                accessibilityLabel="Mois suivant"
                accessibilityRole="button"
                hitSlop={12}
                onPress={goToNextMonth}>
                <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={24} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
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
                      accessibilityLabel={`${date.getDate()}${hasAnyMarker ? ', suivi enregistré' : ''}${spiritualMonth === 'ramadan' ? ', Ramadan' : spiritualMonth === 'dhoulHijja' ? ', Dhou al-Hijja' : ''}`}
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
              <LegendItem color={theme.colors.text} dashedOutline label="Aujourd’hui" />
              {spiritualMarkersEnabled ? (
                <>
                  <LegendItem color={RAMADAN_MARKER_COLOR} icon="moon-waning-crescent" label="Ramadan" />
                  <LegendItem color={DHOUL_HIJJA_MARKER_COLOR} icon="moon-waning-crescent" label="Dhou al-Hijja" />
                </>
              ) : null}
            </View>
          </View>

          {/* SELECTED DAY CARD */}
          <View style={styles.card}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedDateText}>
                {new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(selectedDate)}
              </Text>
              {selectedHijriDate ? (
                <Text style={styles.selectedHijriText}>{selectedHijriDate}</Text>
              ) : null}
            </View>

            {hasAnySelectedData ? (
              <>
                {selectedEntry?.symptoms?.length ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.symptoms.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.symptoms.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.symptoms.tint}
                    label="Symptômes"
                    value={`${selectedEntry.symptoms.length} enregistré${selectedEntry.symptoms.length > 1 ? 's' : ''}`}
                  />
                ) : null}
                {selectedEntry?.mood ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.mood.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.mood.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.mood.tint}
                    label="Humeur"
                    value={MENOPAUSE_MOOD_LABELS[selectedEntry.mood]}
                  />
                ) : null}
                {selectedEntry?.sleepDurationHours !== undefined || selectedEntry?.sleepQuality ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.sleep.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.sleep.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.sleep.tint}
                    label="Sommeil"
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
                    label="Énergie / Fatigue"
                    value={MENOPAUSE_ENERGY_LABELS[selectedEntry.energyLevel]}
                  />
                ) : null}
                {showTreatment && selectedEntry?.treatmentStatus ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.treatment.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.treatment.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.treatment.tint}
                    label="Traitement hormonal"
                    value={MENOPAUSE_TREATMENT_STATUS_LABELS[selectedEntry.treatmentStatus]}
                  />
                ) : null}
                {showLab && selectedLabResults.length > 0 ? (
                  <SelectedRow
                    icon={MENOPAUSE_CATEGORY_VISUALS.labResults.icon}
                    iconColor={MENOPAUSE_CATEGORY_VISUALS.labResults.iconColor}
                    iconTint={MENOPAUSE_CATEGORY_VISUALS.labResults.tint}
                    label="Analyses"
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
                    label="Notes du jour"
                    value="Note enregistrée"
                  />
                ) : null}
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={22} />
                </View>
                <Text style={styles.emptyTitle}>Aucun suivi pour ce jour</Text>
                <Text style={styles.emptyText}>Rien n’a encore été enregistré pour cette date.</Text>
              </View>
            )}

            {isSelectedToday ? (
              <Pressable
                accessibilityLabel="Modifier le suivi d’aujourd’hui"
                accessibilityRole="button"
                onPress={openJournal}
                style={({pressed}) => [styles.editRow, pressed && styles.pressed]}>
                <Text style={styles.editRowText}>Modifier</Text>
                <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={18} />
              </Pressable>
            ) : null}
          </View>

          {/* MONTHLY SUMMARY */}
          <View style={styles.card}>
            <Text style={styles.summaryTitle}>Résumé de ce mois</Text>

            {hasAnyDataAtAll ? (
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryTile, styles.summaryTileRose]}>
                  <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS.symptoms.iconColor} name="clipboard-pulse-outline" size={18} />
                  <Text style={[styles.summaryValue, {color: symptomsTileText}]}>{monthlySummary.daysWithSymptoms}</Text>
                  <Text style={[styles.summaryLabel, {color: symptomsTileText}]}>Jours avec symptômes</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileAmber]}>
                  <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS.energy.iconColor} name="weather-sunny" size={18} />
                  <Text style={[styles.summaryValue, {color: energyTileText}]}>{monthlySummary.hotFlashDays}</Text>
                  <Text style={[styles.summaryLabel, {color: energyTileText}]}>Bouffées de chaleur</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileBlue]}>
                  <MaterialDesignIcons color={MENOPAUSE_CATEGORY_VISUALS.sleep.iconColor} name="water-outline" size={18} />
                  <Text style={[styles.summaryValue, {color: sleepTileText}]}>{monthlySummary.nightSweatNights}</Text>
                  <Text style={[styles.summaryLabel, {color: sleepTileText}]}>Sueurs nocturnes</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileNeutral]}>
                  <MaterialDesignIcons color={theme.colors.textSecondary} name="battery-low" size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.fatigueDays}</Text>
                  <Text style={styles.summaryLabel}>Jours de fatigue</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptySummaryText}>Pas encore assez de données pour ce mois-ci.</Text>
            )}
          </View>
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

function HeaderAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.headerAction, pressed && styles.pressed]}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      <Text style={styles.headerActionLabel}>{label}</Text>
    </Pressable>
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
      <Text numberOfLines={1} style={styles.legendText}>{label}</Text>
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
        <Text style={styles.selectedRowLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.selectedRowValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ============================================================
   FILTRES / LÉGENDE — same premium bottom-sheet pattern as
   ContraceptionCalendarContent.tsx (backdrop/handle/title/scroll
   behavior/row spacing/icon containers/footer button/safe-area bottom
   padding all reused verbatim); content is Menopause-specific and derives
   from ALL_CALENDAR_CATEGORIES/CALENDAR_CATEGORY_COPY/MENOPAUSE_CATEGORY_VISUALS
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sheetStyles = useMemo(() => createSheetStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const trackingFilterRows = visibleCategories.map(category => ({
    key: category,
    icon: MENOPAUSE_CATEGORY_VISUALS[category].icon,
    color: MENOPAUSE_CATEGORY_VISUALS[category].iconColor,
    title: MENOPAUSE_JOURNAL_ITEMS.find(item => item.key === category)?.label ?? category,
    description: CALENDAR_CATEGORY_COPY[category].filterDescription,
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
      title: 'Ramadan',
      description: 'Afficher le repère du mois de Ramadan',
    },
    {
      key: 'dhulHijja',
      icon: 'moon-waning-crescent',
      color: DHOUL_HIJJA_MARKER_COLOR,
      title: 'Dhou al-Hijja',
      description: 'Afficher le repère du mois de Dhou al-Hijja',
    },
  ];

  const legendRows = visibleCategories.map(category => ({
    icon: MENOPAUSE_CATEGORY_VISUALS[category].icon,
    color: MENOPAUSE_CATEGORY_VISUALS[category].iconColor,
    title: MENOPAUSE_JOURNAL_ITEMS.find(item => item.key === category)?.label ?? category,
    description: CALENDAR_CATEGORY_COPY[category].legendDescription,
  }));

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={mode !== null}>
      <View style={sheetStyles.modalRoot}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={sheetStyles.backdrop} />

        {mode === 'filters' ? (
          <View style={[sheetStyles.sheet, sheetStyles.filterSheet, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <View style={sheetStyles.handle} />

            <View style={sheetStyles.sheetHeader}>
              <Text style={sheetStyles.sheetTitle}>Filtres</Text>
              <Text style={sheetStyles.sheetSubtitle}>Choisis les repères à afficher sur ton calendrier.</Text>
            </View>

            <ScrollView bounces={false} contentContainerStyle={sheetStyles.filterRows} showsVerticalScrollIndicator={false} style={sheetStyles.filterScroll}>
              <Text style={sheetStyles.groupTitle}>Suivi périménopause / ménopause</Text>
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
                  <Text style={sheetStyles.groupTitle}>Repères spirituels</Text>
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
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({pressed}) => [sheetStyles.doneButton, pressed && styles.pressed]}>
                <Text style={sheetStyles.doneText}>Terminé</Text>
              </Pressable>
            </View>
          </View>
        ) : mode === 'legend' ? (
          <View style={[sheetStyles.sheet, sheetStyles.legendSheet, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <View style={sheetStyles.handle} />

            <ScrollView bounces={false} contentContainerStyle={sheetStyles.legendScrollContent} showsVerticalScrollIndicator={false} style={sheetStyles.legendScroll}>
              <View style={sheetStyles.sheetHeader}>
                <Text style={sheetStyles.sheetTitle}>Légende</Text>
                <Text style={sheetStyles.sheetSubtitle}>Comprendre les repères de ton calendrier.</Text>
              </View>

              <View style={sheetStyles.legendRowsGroup}>
                {legendRows.map(row => (
                  <View key={row.title} style={sheetStyles.legendRow}>
                    <View style={sheetStyles.legendLargeIcon}>
                      <MaterialDesignIcons color={row.color} name={row.icon} size={22} />
                    </View>
                    <View style={sheetStyles.legendRowCopy}>
                      <Text style={sheetStyles.legendRowTitle}>{row.title}</Text>
                      <Text style={sheetStyles.legendRowText}>{row.description}</Text>
                    </View>
                  </View>
                ))}

                <View style={sheetStyles.legendRow}>
                  <View style={sheetStyles.legendLargeIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name={WELLBEING_MARKER_ICON} size={22} />
                  </View>
                  <View style={sheetStyles.legendRowCopy}>
                    <Text style={sheetStyles.legendRowTitle}>Bien-être (sur le calendrier)</Text>
                    <Text style={sheetStyles.legendRowText}>
                      Ce repère regroupe l’humeur, le sommeil et l’énergie : au moins un de ces suivis a été renseigné ce jour-là.
                    </Text>
                  </View>
                </View>

                <View style={sheetStyles.legendRow}>
                  <View style={sheetStyles.legendLargeIcon}>
                    <View style={sheetStyles.legendTodayPreview} />
                  </View>
                  <View style={sheetStyles.legendRowCopy}>
                    <Text style={sheetStyles.legendRowTitle}>Aujourd’hui</Text>
                    <Text style={sheetStyles.legendRowText}>Le contour violet en pointillés indique la date d’aujourd’hui.</Text>
                  </View>
                </View>

                {spiritualMarkersEnabled ? (
                  <>
                    <View style={sheetStyles.legendRow}>
                      <View style={sheetStyles.legendLargeIcon}>
                        <MaterialDesignIcons color={RAMADAN_MARKER_COLOR} name="moon-waning-crescent" size={22} />
                      </View>
                      <View style={sheetStyles.legendRowCopy}>
                        <Text style={sheetStyles.legendRowTitle}>Ramadan</Text>
                        <Text style={sheetStyles.legendRowText}>Repère du mois de Ramadan.</Text>
                      </View>
                    </View>
                    <View style={[sheetStyles.legendRow, sheetStyles.legendRowLast]}>
                      <View style={sheetStyles.legendLargeIcon}>
                        <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={22} />
                      </View>
                      <View style={sheetStyles.legendRowCopy}>
                        <Text style={sheetStyles.legendRowTitle}>Dhou al-Hijja</Text>
                        <Text style={sheetStyles.legendRowText}>Repère des jours de Dhou al-Hijja.</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            </ScrollView>

            <View style={sheetStyles.footer}>
              <Pressable
                accessibilityLabel="Fermer la légende"
                accessibilityRole="button"
                onPress={onClose}
                style={({pressed}) => [sheetStyles.doneButton, pressed && styles.pressed]}>
                <Text style={sheetStyles.doneText}>Fermer</Text>
              </Pressable>
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
      accessibilityRole="switch"
      accessibilityState={{checked: active}}
      onPress={onPress}
      style={[sheetStyles.filterRow, last && sheetStyles.filterRowLast]}>
      <View style={sheetStyles.filterIcon}>
        <MaterialDesignIcons color={row.color} name={row.icon} size={20} />
      </View>
      <View style={sheetStyles.filterCopy}>
        <Text style={sheetStyles.filterTitle}>{row.title}</Text>
        <Text style={sheetStyles.filterDescription}>{row.description}</Text>
      </View>
      <View style={[sheetStyles.switchTrack, active && sheetStyles.switchTrackActive]}>
        <View style={[sheetStyles.switchThumb, active && sheetStyles.switchThumbActive]} />
      </View>
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
  sheetTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  sheetSubtitle: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18},

  filterSheet: {height: '80%'},
  filterScroll: {flex: 1, minHeight: 0},
  filterRows: {paddingHorizontal: 22, paddingBottom: 10},
  groupTitle: {marginTop: 14, marginBottom: 4, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase'},
  filterRow: {
    minHeight: 66, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  filterRowLast: {borderBottomWidth: 0},
  filterIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
  filterCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  filterTitle: {color: theme.colors.accent, fontSize: 13, fontWeight: '800'},
  filterDescription: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 14},
  switchTrack: {width: 42, height: 24, flexShrink: 0, justifyContent: 'center', paddingHorizontal: 2, borderRadius: 13, backgroundColor: theme.colors.surfaceSecondary},
  switchTrackActive: {backgroundColor: theme.colors.primary},
  switchThumb: {...theme.shadow, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.surface},
  switchThumbActive: {alignSelf: 'flex-end'},

  legendSheet: {height: '80%', paddingHorizontal: 0},
  legendScroll: {flex: 1, minHeight: 0},
  legendScrollContent: {paddingHorizontal: 22, paddingTop: 4, paddingBottom: 16},
  legendRowsGroup: {marginTop: 6},
  legendRow: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  legendRowLast: {borderBottomWidth: 0},
  legendLargeIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
  legendTodayPreview: {
    width: 22, height: 22, borderWidth: 1.8, borderStyle: 'dashed', borderColor: theme.colors.text, borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
  },
  legendRowCopy: {flex: 1, minWidth: 0, marginLeft: 14},
  legendRowTitle: {color: theme.colors.accent, fontSize: 14, fontWeight: '800'},
  legendRowText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},

  footer: {
    flexShrink: 0, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(theme.colors.primary, 0.10), backgroundColor: theme.colors.surface,
  },
  doneButton: {height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.colors.primary},
  doneText: {color: onPrimaryTextColor(theme), fontSize: 14, fontWeight: '800'},
  });
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},
  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: withAlpha(theme.colors.primary, 0.045),
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: withAlpha(theme.colors.primary, 0.05),
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},

  header: {flexDirection: 'row', alignItems: 'center'},
  headerCopy: {flex: 1, minWidth: 0},
  title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 23, fontWeight: '800'},
  subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 12.5},
  headerAction: {
    ...theme.shadow,
    width: 52, height: 52, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    marginLeft: 8, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 17, backgroundColor: theme.colors.surface,
  },
  headerActionLabel: {marginTop: 2, color: theme.colors.primary, fontSize: 8, fontWeight: '800'},

  card: {
    marginTop: 16, padding: 16, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.98),
    ...theme.shadow,
  },

  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  monthTitleBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 6, minWidth: 0},
  monthTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 18, fontWeight: '800', textTransform: 'capitalize'},
  hijriRange: {marginTop: 2, color: theme.colors.primary, fontSize: 10, fontWeight: '600', textAlign: 'center'},

  weekRow: {flexDirection: 'row', marginTop: 14},
  weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700', textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 4},
  dayCell: {width: '14.2857%', minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
  day: {
    position: 'relative', width: '86%', minHeight: 42, maxWidth: 42, paddingVertical: 4,
    alignItems: 'center', justifyContent: 'center', borderRadius: 14,
  },
  dayHasMarker: {backgroundColor: theme.colors.primarySoft},
  daySelected: {backgroundColor: theme.colors.primary},
  dayToday: {
    backgroundColor: theme.colors.primarySoft, borderWidth: 1.8, borderStyle: 'dashed', borderColor: theme.colors.text, borderRadius: 14,
  },
  dayText: {color: theme.colors.accent, fontSize: 13, fontWeight: '600'},
  dayTextLight: {color: onPrimaryTextColor(theme)},
  dayTextToday: {color: theme.colors.text, fontWeight: '800'},
  hijriDayText: {color: theme.colors.textSecondary, fontSize: 8.5, marginTop: 1},
  dayMarkerRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 34, marginTop: 1, gap: 1.5},
  spiritualMarker: {position: 'absolute', top: 3, right: 3},

  legendRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.textSecondary},
  legendDashedRing: {width: 11, height: 11, borderRadius: 6, borderWidth: 1.3, borderStyle: 'dashed', borderColor: theme.colors.text},
  legendText: {color: theme.colors.textSecondary, fontSize: 10.5},

  selectedHeader: {marginBottom: 4},
  selectedDateText: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 16.5, fontWeight: '800', textTransform: 'capitalize'},
  selectedHijriText: {marginTop: 2, color: theme.colors.primary, fontSize: 11, fontWeight: '600'},

  selectedRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10},
  selectedRowIcon: {width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
  selectedRowTextGroup: {flex: 1, minWidth: 0},
  selectedRowLabel: {color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700'},
  selectedRowValue: {marginTop: 2, color: theme.colors.accent, fontSize: 12.5, fontWeight: '800'},

  editRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  editRowText: {color: theme.colors.primary, fontSize: 12.5, fontWeight: '800'},

  summaryTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 16, fontWeight: '800', marginBottom: 12},
  summaryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  summaryTile: {
    flexGrow: 1, flexBasis: '46%', minWidth: 130, alignItems: 'center', paddingVertical: 14,
    borderRadius: 18, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14),
  },
  summaryTileRose: {backgroundColor: MENOPAUSE_CATEGORY_VISUALS.symptoms.tint},
  summaryTileAmber: {backgroundColor: MENOPAUSE_CATEGORY_VISUALS.energy.tint},
  summaryTileBlue: {backgroundColor: MENOPAUSE_CATEGORY_VISUALS.sleep.tint},
  summaryTileNeutral: {backgroundColor: theme.colors.surfaceSecondary},
  summaryValue: {marginTop: 6, color: theme.colors.accent, fontSize: 20, fontWeight: '900'},
  summaryLabel: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700', textAlign: 'center'},
  emptySummaryText: {color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},

  emptyState: {alignItems: 'center', paddingVertical: 14},
  emptyIcon: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft, marginBottom: 8},
  emptyTitle: {color: theme.colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'center'},
  emptyText: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11.5, textAlign: 'center'},

  pressed: {opacity: 0.82},
  });
}

export default MenopauseCalendarContent;
