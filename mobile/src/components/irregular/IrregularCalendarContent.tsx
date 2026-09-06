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

import {getAllJournalEntries} from '../../state/dailyJournalStore';
import type {DailyJournalEntry, FlowIntensity} from '../../types/journal';

import {
  getAllIrregularJournalEntries,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
  type IrregularJournalCategory,
  type IrregularJournalEntry,
} from '../../state/irregularJournalStore';

import {IRREGULAR_JOURNAL_ITEMS} from '../../config/irregularJournalConfig';

import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

import {
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import {computeIrregularMonthlySummary, computeVisibleDayMarkers} from '../../utils/irregularCalendarMath';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// SEMANTIC — same fixed values every sibling calendar content
// (MenopauseCalendarContent.tsx, ContraceptionCalendarContent.tsx, ...)
// already uses for these markers — never theme-driven, so switching palettes
// can never change what these markers mean.
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

// Real recorded period days only — same color token ConceiveCalendarContent.tsx
// already uses for "Règles" (PERIOD = '#DC7B82'), reused verbatim rather than
// inventing a new hex for the same real-world concept.
const PERIOD_COLOR = '#DC7B82';

// Category marker identity (used to build the module-level CATEGORY_COLOR
// table below, before any theme is available) — fixed like the other marker
// colors above so a category's identity color never drifts with the palette.
const CATEGORY_MARKER_PURPLE = '#6D4AE8';

const FLOW_LABELS: Record<FlowIntensity, string> = {
  light: 'Léger',
  moderate: 'Moyen',
  heavy: 'Abondant',
  veryHeavy: 'Très abondant',
  none: 'Aucun',
};

// A suggested, non-mandatory color grouping — deliberately reusing the SAME
// tint pairing IRREGULAR_JOURNAL_ITEMS already uses for the Dashboard/Journal
// (acne & pain share '#FBEAF0'; hairGrowth & fatigue share '#EEE7FC') so this
// calendar never introduces a distinction the rest of the app doesn't make.
const TINT_ICON_COLOR: Record<string, string> = {
  '#FBEAF0': '#C2517A',
  '#EEE7FC': CATEGORY_MARKER_PURPLE,
  '#E7F0F8': '#3E7CA6',
  '#F1E8F5': '#8B5FA3',
};

function iconColorForCategory(category: IrregularJournalCategory): string {
  const item = IRREGULAR_JOURNAL_ITEMS.find(entry => entry.key === category);
  return (item && TINT_ICON_COLOR[item.tint]) || CATEGORY_MARKER_PURPLE;
}

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');

// Single source of truth for the compact legend row, the full Legend sheet,
// and the Filtres sheet — all three render from this list so they can never
// drift apart. "Règles" is deliberately NOT part of IRREGULAR_JOURNAL_ITEMS
// (see irregularJournalStore.ts) so it's handled as its own explicit marker
// throughout this file rather than forced into that array.
type CalendarCategory = IrregularJournalCategory | 'period';

const ALL_CALENDAR_CATEGORIES: CalendarCategory[] = [
  'period',
  'acne',
  'hairGrowth',
  'weight',
  'pain',
  'mood',
  'fatigue',
];

const CATEGORY_LABEL: Record<CalendarCategory, string> = {
  period: 'Règles',
  acne: 'Acné',
  hairGrowth: 'Pilosité',
  weight: 'Poids',
  pain: 'Douleurs',
  mood: 'Humeur',
  fatigue: 'Fatigue & symptômes',
};

const CATEGORY_ICON: Record<CalendarCategory, IconName> = {
  period: 'water',
  acne: 'face-woman-outline',
  hairGrowth: 'human',
  weight: 'scale-bathroom',
  pain: 'lightning-bolt-outline',
  mood: 'emoticon-outline',
  fatigue: 'battery-medium',
};

const CATEGORY_COLOR: Record<CalendarCategory, string> = {
  period: PERIOD_COLOR,
  acne: iconColorForCategory('acne'),
  hairGrowth: iconColorForCategory('hairGrowth'),
  weight: iconColorForCategory('weight'),
  pain: iconColorForCategory('pain'),
  mood: iconColorForCategory('mood'),
  fatigue: iconColorForCategory('fatigue'),
};

const CATEGORY_COPY: Record<CalendarCategory, {filterDescription: string; legendDescription: string}> = {
  period: {
    filterDescription: 'Afficher les jours de règles enregistrés',
    legendDescription: 'Un jour de règles a été enregistré (Journal des règles).',
  },
  acne: {
    filterDescription: 'Afficher les jours où l’acné a été notée',
    legendDescription: 'Un suivi de l’acné a été enregistré ce jour-là.',
  },
  hairGrowth: {
    filterDescription: 'Afficher les jours où la pilosité a été notée',
    legendDescription: 'Un suivi de la pilosité a été enregistré ce jour-là.',
  },
  weight: {
    filterDescription: 'Afficher les jours où le poids a été renseigné',
    legendDescription: 'Un poids a été enregistré ce jour-là.',
  },
  pain: {
    filterDescription: 'Afficher les jours où des douleurs ont été notées',
    legendDescription: 'Des douleurs ou inconforts ont été enregistrés ce jour-là.',
  },
  mood: {
    filterDescription: 'Afficher les jours où une humeur a été renseignée',
    legendDescription: 'Une humeur a été renseignée pour cette date.',
  },
  fatigue: {
    filterDescription: 'Afficher les jours où la fatigue a été notée',
    legendDescription: 'Un suivi de la fatigue a été enregistré ce jour-là.',
  },
};

// Display-only marker filters — never affect entries/monthly summary or the
// selected-day card, all of which keep reading real unfiltered data. Same
// shape/behavior contract as every sibling *CalendarContent.tsx.
type IrregularCalendarFilters = Record<CalendarCategory, boolean> & {
  ramadan: boolean;
  dhulHijja: boolean;
};

const DEFAULT_CALENDAR_FILTERS: IrregularCalendarFilters = {
  period: true,
  acne: true,
  hairGrowth: true,
  weight: true,
  pain: true,
  mood: true,
  fatigue: true,
  ramadan: true,
  dhulHijja: true,
};

// A single day cell can't legibly fit 7 distinct marker dots (Règles + 6 SOPK
// categories can all land on the same real day). Up to 4 active markers show
// as plain dots — matching Postpartum/Cycle's own compact-dot convention.
// From the 5th marker onward, only 3 dots render, making room for a compact
// "+N" badge — never silently dropping a category with no visual trace (the
// selected-day card below always lists every recorded category regardless
// of this on-cell cap). Order follows ALL_CALENDAR_CATEGORIES.
const MAX_DAY_MARKERS = 4;
const MAX_DAY_MARKERS_WITH_OVERFLOW = 3;

type CalendarSheetMode = 'filters' | 'legend' | null;

function IrregularCalendarContent(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {open: openJournal} = useJournalSheet();

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

  const [filters, setFilters] = useState<IrregularCalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [sheet, setSheet] = useState<CalendarSheetMode>(null);

  const toggleFilter = useCallback((key: keyof IrregularCalendarFilters) => {
    setFilters(current => ({...current, [key]: !current[key]}));
  }, []);

  const [entriesByDate, setEntriesByDate] = useState<Record<string, IrregularJournalEntry>>(
    getAllIrregularJournalEntries,
  );
  const [journalEntries, setJournalEntries] = useState<DailyJournalEntry[]>([]);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateIrregularJournal().then(() => {
        if (active) {setEntriesByDate(getAllIrregularJournalEntries());}
      });
      const unsubscribeIrregular = subscribeIrregularJournal(() => {
        if (active) {setEntriesByDate(getAllIrregularJournalEntries());}
      });

      getAllJournalEntries().then(entries => {
        if (active) {setJournalEntries(entries);}
      });

      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());

      return () => {
        active = false;
        unsubscribeIrregular();
      };
    }, []),
  );

  const journalEntriesByDate = useMemo(() => {
    const byDate: Record<string, DailyJournalEntry> = {};
    journalEntries.forEach(entry => {
      byDate[entry.date] = entry;
    });
    return byDate;
  }, [journalEntries]);

  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const isSelectedToday = selectedDateKey === todayKey;
  const selectedEntry = entriesByDate[selectedDateKey];
  const selectedFlowIntensity = journalEntriesByDate[selectedDateKey]?.flow?.intensity;
  const selectedHijriDate = spiritualMarkersEnabled ? formatHijriDate(selectedDate) : undefined;

  const hasAnySelectedData = Boolean(
    selectedFlowIntensity ||
      selectedEntry?.acne ||
      selectedEntry?.hairGrowth ||
      selectedEntry?.weight ||
      selectedEntry?.pain ||
      selectedEntry?.mood ||
      selectedEntry?.fatigue,
  );

  const monthlySummary = useMemo(
    () =>
      computeIrregularMonthlySummary(
        entriesByDate,
        journalEntries,
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
      ),
    [visibleMonth, entriesByDate, journalEntries],
  );

  const hasAnyDataAtAll = Object.keys(entriesByDate).length > 0 || journalEntries.some(entry => entry.flow?.intensity);

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
              <Text style={styles.subtitle}>Ton suivi SOPK au fil du temps</Text>
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
                const flowIntensity = journalEntriesByDate[key]?.flow?.intensity;
                const isToday = sameDay(date, today);
                const isSelected = sameDay(date, selectedDate);
                const lightText = isSelected && !isToday;
                const hijriDay = spiritualMarkersEnabled ? formatHijriDay(date) : undefined;

                // Classification is computed unconditionally — filters only
                // affect whether the resulting marker is DISPLAYED below,
                // never the underlying isRamadan/isDhoulHijja result.
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

                const activeCategories = ALL_CALENDAR_CATEGORIES.filter(category => {
                  if (!filters[category]) {return false;}
                  if (category === 'period') {return Boolean(flowIntensity);}
                  return Boolean(entry?.[category]);
                });

                const hasOverflow = activeCategories.length > MAX_DAY_MARKERS;
                const {visible: visibleCategories, overflowCount} = computeVisibleDayMarkers(
                  activeCategories,
                  hasOverflow ? MAX_DAY_MARKERS_WITH_OVERFLOW : MAX_DAY_MARKERS,
                );
                const dayMarkers = visibleCategories.map(category => ({
                  icon: CATEGORY_ICON[category],
                  color: CATEGORY_COLOR[category],
                }));

                const hasAnyMarker = dayMarkers.length > 0;

                return (
                  <View key={key} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()}${hasAnyMarker ? `, suivi enregistré${overflowCount > 0 ? ` (${activeCategories.length} catégories)` : ''}` : ''}${spiritualMonth === 'ramadan' ? ', Ramadan' : spiritualMonth === 'dhoulHijja' ? ', Dhou al-Hijja' : ''}`}
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
                          {overflowCount > 0 ? (
                            <Text style={[styles.dayMarkerOverflow, lightText && styles.dayTextLight]}>
                              +{overflowCount}
                            </Text>
                          ) : null}
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

            {/* COMPACT LEGEND — one item per real marker family */}
            <View style={styles.legendRow}>
              {ALL_CALENDAR_CATEGORIES.map(category => (
                <LegendItem color={CATEGORY_COLOR[category]} key={category} label={CATEGORY_LABEL[category]} />
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
                {selectedFlowIntensity ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.period}
                    iconColor={CATEGORY_COLOR.period}
                    iconTint="#FBEAF0"
                    label="Règles"
                    value={FLOW_LABELS[selectedFlowIntensity]}
                  />
                ) : null}
                {selectedEntry?.acne ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.acne}
                    iconColor={CATEGORY_COLOR.acne}
                    iconTint="#FBEAF0"
                    label="Acné"
                    value={selectedEntry.acne}
                  />
                ) : null}
                {selectedEntry?.hairGrowth ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.hairGrowth}
                    iconColor={CATEGORY_COLOR.hairGrowth}
                    iconTint="#EEE7FC"
                    label="Pilosité"
                    value={selectedEntry.hairGrowth}
                  />
                ) : null}
                {selectedEntry?.weight ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.weight}
                    iconColor={CATEGORY_COLOR.weight}
                    iconTint="#E7F0F8"
                    label="Poids"
                    value={selectedEntry.weight}
                  />
                ) : null}
                {selectedEntry?.pain ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.pain}
                    iconColor={CATEGORY_COLOR.pain}
                    iconTint="#FBEAF0"
                    label="Douleurs"
                    value={selectedEntry.pain}
                  />
                ) : null}
                {selectedEntry?.mood ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.mood}
                    iconColor={CATEGORY_COLOR.mood}
                    iconTint="#F1E8F5"
                    label="Humeur"
                    value={selectedEntry.mood}
                  />
                ) : null}
                {selectedEntry?.fatigue ? (
                  <SelectedRow
                    icon={CATEGORY_ICON.fatigue}
                    iconColor={CATEGORY_COLOR.fatigue}
                    iconTint="#EEE7FC"
                    label="Fatigue & symptômes"
                    value={
                      selectedEntry.symptoms?.length
                        ? `${selectedEntry.fatigue} · ${selectedEntry.symptoms.length} symptôme${selectedEntry.symptoms.length > 1 ? 's' : ''} associé${selectedEntry.symptoms.length > 1 ? 's' : ''}`
                        : selectedEntry.fatigue
                    }
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
                  <MaterialDesignIcons color={CATEGORY_COLOR.period} name={CATEGORY_ICON.period} size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.periodDays}</Text>
                  <Text style={styles.summaryLabel}>Jours de règles</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileRose]}>
                  <MaterialDesignIcons color={CATEGORY_COLOR.acne} name={CATEGORY_ICON.acne} size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.acneDays}</Text>
                  <Text style={styles.summaryLabel}>Jours avec acné</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileNeutral]}>
                  <MaterialDesignIcons color={CATEGORY_COLOR.pain} name={CATEGORY_ICON.pain} size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.painDays}</Text>
                  <Text style={styles.summaryLabel}>Jours avec douleurs</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileNeutral]}>
                  <MaterialDesignIcons color={CATEGORY_COLOR.fatigue} name={CATEGORY_ICON.fatigue} size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.fatigueDays}</Text>
                  <Text style={styles.summaryLabel}>Jours de fatigue</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptySummaryText}>Pas encore assez de données pour ce mois-ci.</Text>
            )}
          </View>
        </ScrollView>

        <IrregularCalendarSheet
          filters={filters}
          mode={sheet}
          onClose={() => setSheet(null)}
          onToggle={toggleFilter}
          spiritualMarkersEnabled={spiritualMarkersEnabled}
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
   MenopauseCalendarContent.tsx/ContraceptionCalendarContent.tsx (backdrop/
   handle/title/scroll behavior/row spacing/icon containers/footer button/
   safe-area bottom padding all reused verbatim); content is SOPK-specific
   and derives from ALL_CALENDAR_CATEGORIES/CATEGORY_COPY above so the
   compact legend, this sheet, and the Filtres sheet can never describe
   three different marker sets.
============================================================ */

function IrregularCalendarSheet({
  mode,
  onClose,
  onToggle,
  filters,
  spiritualMarkersEnabled,
}: {
  mode: CalendarSheetMode;
  onClose: () => void;
  onToggle: (key: keyof IrregularCalendarFilters) => void;
  filters: IrregularCalendarFilters;
  spiritualMarkersEnabled: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sheetStyles = useMemo(() => createSheetStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const trackingFilterRows = ALL_CALENDAR_CATEGORIES.map(category => ({
    key: category,
    icon: CATEGORY_ICON[category],
    color: CATEGORY_COLOR[category],
    title: CATEGORY_LABEL[category],
    description: CATEGORY_COPY[category].filterDescription,
  }));

  const spiritualFilterRows: Array<{
    key: keyof IrregularCalendarFilters;
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

  const legendRows = ALL_CALENDAR_CATEGORIES.map(category => ({
    icon: CATEGORY_ICON[category],
    color: CATEGORY_COLOR[category],
    title: CATEGORY_LABEL[category],
    description: CATEGORY_COPY[category].legendDescription,
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
              <Text style={sheetStyles.groupTitle}>Suivi SOPK</Text>
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
                {legendRows.map((row, index) => (
                  <View
                    key={row.title}
                    style={[
                      sheetStyles.legendRow,
                      index === legendRows.length - 1 && !spiritualMarkersEnabled && sheetStyles.legendRowLast,
                    ]}>
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
  dayMarkerRow: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', maxWidth: 38, marginTop: 1, gap: 1.5},
  dayMarkerOverflow: {color: theme.colors.textSecondary, fontSize: 7, fontWeight: '800', marginLeft: 1},
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
  summaryTileRose: {backgroundColor: '#FBEAF0'},
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

export default IrregularCalendarContent;
