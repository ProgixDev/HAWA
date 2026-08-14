import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useJournalSheet} from '../../navigation/JournalSheetContext';
import {homeColors, homeShadow} from '../home/homeTheme';
import {loadPersonalInformation, type CalendarPreference} from '../../state/personalInformationStore';
import {
  capitalize,
  diffDays,
  formatFullDate,
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  startOfDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  subscribeMiscarriagePreferences,
  type MiscarriageCycleReturnStatus,
} from '../../state/miscarriagePreferences';
import {
  getAllMiscarriageJournalEntries,
  hydrateMiscarriageJournal,
  subscribeMiscarriageJournal,
  type MiscarriageJournalCategory,
  type MiscarriageJournalEntry,
} from '../../state/miscarriageJournalStore';
import {MISCARRIAGE_TRYING_AGAIN_OPTIONS} from '../../config/miscarriageJournalConfig';
import {TOP_SPACING_EXTRA} from '../../theme/spacing';

// Miscarriage Calendar — a dedicated content branch for the ONE global
// Calendar tab (see ObjectiveAwareCalendarScreen.tsx), structurally modeled
// after PregnancyCalendarContent.tsx (same premium HAWA card language, month
// nav, Grégorien/Hijri/Double mode, Filtres/Légende sheets, selected-day
// card) but with entirely Miscarriage-specific meaning/markers/data. Reads
// exclusively from miscarriageJournalStore/miscarriagePreferences — never
// Cycle's dailyJournalStore/cyclePreferences, and deliberately never derives
// cycleDayFor/phaseFor/fertileWindow/ovulation/predicted-period from
// cycleMath.ts (this objective must stay separate from classic cycle
// tracking, even once periods have returned).

const BACKGROUND = require('../../assets/images/auth-mosque-background.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const MODES: Array<{key: CalendarPreference; label: string}> = [
  {key: 'gregorian', label: 'Grégorien'},
  {key: 'hijri', label: 'Hijri'},
  {key: 'double', label: 'Double'},
];

/* ============================================================
   CATEGORY META — exactly the 4 Miscarriage Daily Journal
   categories (see miscarriageJournalConfig.ts), the ONLY ones this
   calendar ever displays.
============================================================ */

const CATEGORY_META: Record<
  MiscarriageJournalCategory,
  {label: string; description: string; empty: string; icon: IconName; color: string}
> = {
  bleeding: {
    label: 'Saignements',
    description: 'Intensité des saignements enregistrée dans ton journal.',
    empty: 'Non renseigné',
    icon: 'water-outline',
    color: '#D8697A',
  },
  physicalSymptoms: {
    label: 'Symptômes physiques',
    description: 'Symptômes physiques ressentis, notés au quotidien.',
    empty: 'Aucun',
    icon: 'clipboard-pulse-outline',
    color: homeColors.primary,
  },
  personalNotes: {
    label: 'Notes personnelles',
    description: 'Présence d’une note personnelle ce jour-là.',
    empty: 'Aucune note',
    icon: 'notebook-edit-outline',
    color: '#A68BE8',
  },
  tryingAgain: {
    label: 'Reprise des essais',
    description: 'Ton ressenti sur la reprise des essais de conception.',
    empty: 'Non renseigné',
    icon: 'heart-outline',
    color: '#E08CB0',
  },
};

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as MiscarriageJournalCategory[];

const TRYING_AGAIN_LABELS: Record<string, string> = Object.fromEntries(
  MISCARRIAGE_TRYING_AGAIN_OPTIONS.map(option => [option.id, option.label]),
);

const CYCLE_RETURN_LABELS: Record<MiscarriageCycleReturnStatus, string> = {
  no: 'Pas encore de règles',
  yes: 'Règles revenues',
  unknown: 'Je ne sais pas encore',
};

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');
const backgroundColorStyle = (backgroundColor: string) => ({backgroundColor});

/* ============================================================
   DAILY INFO — only categories with real saved data ever appear;
   never a fabricated value (spec section 8).
============================================================ */

type DailyInfoItem = {
  key: MiscarriageJournalCategory;
  label: string;
  value: string;
  icon: IconName;
};

function buildDailyItems(entry: MiscarriageJournalEntry | undefined): DailyInfoItem[] {
  const items: DailyInfoItem[] = [];

  if (entry?.bleeding) {
    items.push({
      key: 'bleeding',
      label: CATEGORY_META.bleeding.label,
      value: entry.bleedingNote ? `${entry.bleeding} · ${entry.bleedingNote}` : entry.bleeding,
      icon: CATEGORY_META.bleeding.icon,
    });
  }

  if (entry?.physicalSymptoms?.length) {
    items.push({
      key: 'physicalSymptoms',
      label: CATEGORY_META.physicalSymptoms.label,
      value: entry.physicalSymptoms.join(' · '),
      icon: CATEGORY_META.physicalSymptoms.icon,
    });
  }

  // Never expose the note's actual private text here — presence only
  // (spec section 11).
  if (entry?.personalNotes?.trim()) {
    items.push({
      key: 'personalNotes',
      label: CATEGORY_META.personalNotes.label,
      value: '1 note enregistrée',
      icon: CATEGORY_META.personalNotes.icon,
    });
  }

  if (entry?.tryingAgain) {
    items.push({
      key: 'tryingAgain',
      label: CATEGORY_META.tryingAgain.label,
      value: TRYING_AGAIN_LABELS[entry.tryingAgain] ?? entry.tryingAgain,
      icon: CATEGORY_META.tryingAgain.icon,
    });
  }

  return items;
}

function categoriesPresent(entry: MiscarriageJournalEntry | undefined): MiscarriageJournalCategory[] {
  if (!entry) {return [];}
  return CATEGORY_KEYS.filter(key => {
    if (key === 'physicalSymptoms') {return Boolean(entry.physicalSymptoms?.length);}
    if (key === 'personalNotes') {return Boolean(entry.personalNotes?.trim());}
    return Boolean(entry[key]);
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function MiscarriageCalendarContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {open: openMiscarriageJournal} = useJournalSheet();

  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayMode, setDisplayMode] = useState<CalendarPreference>('double');
  const [sheet, setSheet] = useState<'filters' | 'legend' | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<Set<MiscarriageJournalCategory>>(
    () => new Set(CATEGORY_KEYS),
  );

  // Canonical miscarriage onboarding data — same source the Dashboard/
  // Profile/Summary read. Never Cycle's cyclePreferences.
  const [miscarriage, setMiscarriage] = useState(getMiscarriagePreferences);
  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {if (active) {setMiscarriage(value);}});
    const unsubscribe = subscribeMiscarriagePreferences(() => {if (active) {setMiscarriage(getMiscarriagePreferences());}});
    return () => {active = false; unsubscribe();};
  }, []);

  // Miscarriage's OWN daily tracking (src/state/miscarriageJournalStore.ts)
  // — never Cycle's dailyJournalStore or any other objective's journal.
  const [entries, setEntries] = useState(getAllMiscarriageJournalEntries);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydrateMiscarriageJournal().then(() => {if (active) {setEntries(getAllMiscarriageJournalEntries());}});
      const unsubscribe = subscribeMiscarriageJournal(() => {if (active) {setEntries(getAllMiscarriageJournalEntries());}});
      return () => {active = false; unsubscribe();};
    }, []),
  );

  // Same shared Grégorien/Hijri/Double preference every other objective's
  // calendar already reads.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(info => {if (mounted) {setDisplayMode(info.calendar);}});
      return () => {mounted = false;};
    }, []),
  );

  const miscarriageDate = useMemo(
    () => (miscarriage.miscarriageDate ? startOfDay(new Date(`${miscarriage.miscarriageDate}T12:00:00`)) : null),
    [miscarriage.miscarriageDate],
  );
  const firstReturnedPeriodDate = useMemo(
    () => (miscarriage.firstReturnedPeriodDate ? startOfDay(new Date(`${miscarriage.firstReturnedPeriodDate}T12:00:00`)) : null),
    [miscarriage.firstReturnedPeriodDate],
  );

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({length: offset}, () => null),
      ...Array.from({length: count}, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [visibleMonth]);

  const monthTitle = capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(visibleMonth));
  const showHijri = displayMode !== 'gregorian';
  const selectedTitle = capitalize(
    new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).format(selectedDate),
  );
  const selectedKey = dateKey(selectedDate);
  const selectedEntry = entries[selectedKey];
  const isTodaySelected = sameDay(selectedDate, today);

  const daysSinceEvent = miscarriageDate ? Math.max(0, diffDays(selectedDate, miscarriageDate)) : null;
  const isMiscarriageDaySelected = Boolean(miscarriageDate) && sameDay(selectedDate, miscarriageDate as Date);
  const isReturnedPeriodDaySelected = Boolean(firstReturnedPeriodDate) && sameDay(selectedDate, firstReturnedPeriodDate as Date);

  const toggleFilter = (key: MiscarriageJournalCategory) => {
    setVisibleFilters(current => {
      const next = new Set(current);
      if (next.has(key)) {next.delete(key);} else {next.add(key);}
      return next;
    });
  };

  // Unfiltered — used only to decide whether the day genuinely has no data
  // at all (vs. having data that the current filters simply hide), so the
  // "Aucune information enregistrée" message is never shown incorrectly
  // while filters are narrowed.
  const allDailyItems = useMemo(() => buildDailyItems(selectedEntry), [selectedEntry]);
  const dailyItems = useMemo(
    () => allDailyItems.filter(item => visibleFilters.has(item.key)),
    [allDailyItems, visibleFilters],
  );

  const hasAnyDataSelectedDay = allDailyItems.length > 0 || isMiscarriageDaySelected || isReturnedPeriodDaySelected;

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 30}]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Calendrier</Text>
              <Text style={styles.subtitle}>Suis ton évolution, à ton rythme</Text>
            </View>

            <HeaderAction icon="tune-variant" label="Filtres" onPress={() => setSheet('filters')} />
            <HeaderAction icon="format-list-bulleted" label="Légende" onPress={() => setSheet('legend')} />
          </View>

          {/* CALENDAR CARD */}
          <View style={styles.calendarCard}>
            <View style={styles.modeRow}>
              {MODES.map(mode => (
                <Pressable
                  accessibilityRole="button"
                  key={mode.key}
                  onPress={() => setDisplayMode(mode.key)}
                  style={[styles.modeButton, displayMode === mode.key && styles.modeButtonActive]}>
                  <Text style={[styles.modeText, displayMode === mode.key && styles.modeTextActive]}>{mode.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                onPress={() => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                style={styles.arrowButton}>
                <MaterialDesignIcons color={homeColors.primary} name="chevron-left" size={23} />
              </Pressable>

              <View style={styles.monthCopy}>
                <Text style={styles.monthTitle}>{monthTitle}</Text>
                {showHijri ? <Text style={styles.hijriMonth}>{formatHijriMonthYear(visibleMonth)}</Text> : null}
              </View>

              <Pressable
                accessibilityLabel="Mois suivant"
                onPress={() => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                style={styles.arrowButton}>
                <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={23} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const selected = sameDay(date, selectedDate);
                const isToday = sameDay(date, today);
                const isMiscarriageDay = Boolean(miscarriageDate) && sameDay(date, miscarriageDate as Date);
                const isReturnedPeriodDay = Boolean(firstReturnedPeriodDate) && sameDay(date, firstReturnedPeriodDate as Date);
                const dayEntry = entries[dateKey(date)];
                const markers = categoriesPresent(dayEntry).filter(key => visibleFilters.has(key));
                const lightText = (selected && !isToday) || isMiscarriageDay || isReturnedPeriodDay;

                return (
                  <View key={date.toISOString()} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()} ${monthTitle}${isMiscarriageDay ? ', événement de départ' : ''}${isReturnedPeriodDay ? ', retour des règles' : ''}`}
                      onPress={() => setSelectedDate(date)}
                      style={[
                        styles.dayButton,
                        isReturnedPeriodDay && !selected && styles.returnedPeriodDay,
                        isMiscarriageDay && !selected && styles.miscarriageDay,
                        selected && !isToday && styles.selectedDay,
                        isToday && styles.todayDay,
                      ]}>
                      <Text style={[styles.dayText, lightText && styles.lightText]}>{date.getDate()}</Text>

                      {showHijri ? (
                        <Text style={[styles.hijriDay, lightText && styles.lightText]}>{formatHijriDay(date)}</Text>
                      ) : null}

                      {markers.length > 0 ? (
                        <View style={styles.markerRow}>
                          {markers.slice(0, 4).map(key => (
                            <View
                              key={key}
                              style={[styles.marker, backgroundColorStyle(lightText ? '#FFFFFF' : CATEGORY_META[key].color)]}
                            />
                          ))}
                        </View>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* INLINE LEGEND */}
            <View style={styles.inlineLegend}>
              {CATEGORY_KEYS.map(key => (
                <View key={key} style={styles.inlineLegendItem}>
                  <View style={[styles.inlineLegendDot, backgroundColorStyle(CATEGORY_META[key].color)]} />
                  <Text style={styles.inlineLegendText}>{CATEGORY_META[key].label}</Text>
                </View>
              ))}
              <View style={styles.inlineLegendItem}>
                <View style={styles.inlineTodayIndicator} />
                <Text style={styles.inlineLegendText}>Aujourd’hui</Text>
              </View>
            </View>
          </View>

          {/* SELECTED CARD */}
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedIcon}>
                <MaterialDesignIcons color={homeColors.primary} name="calendar-check-outline" size={21} />
              </View>
              <View style={styles.flexCopy}>
                <Text style={styles.selectedTitle}>{selectedTitle}</Text>
                <Text style={styles.selectedDate}>
                  {formatFullDate(selectedDate)}
                  {showHijri ? ` · ${formatHijriDate(selectedDate) ?? ''}` : ''}
                </Text>
              </View>
            </View>

            {/* CONTEXTUAL STATUS — persistent, never the classic Cycle
                card (jour du cycle/phase/fenêtre fertile/ovulation). */}
            <View style={styles.statusGrid}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusInfoLabel}>Jours depuis l’événement</Text>
                <Text style={styles.statusInfoValue}>
                  {daysSinceEvent === null ? 'Non renseignée' : daysSinceEvent === 0 ? 'Le jour même' : `${daysSinceEvent} jour${daysSinceEvent > 1 ? 's' : ''}`}
                </Text>
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusInfoLabel}>Retour du cycle</Text>
                <Text style={styles.statusInfoValue}>
                  {miscarriage.cycleReturnStatus ? CYCLE_RETURN_LABELS[miscarriage.cycleReturnStatus] : 'Non renseigné'}
                </Text>
              </View>
            </View>

            {/* CONTEXTUAL DAY BADGES — calm, respectful, never alarming. */}
            {isMiscarriageDaySelected || isReturnedPeriodDaySelected ? (
              <View style={styles.dayBadgeRow}>
                {isMiscarriageDaySelected ? (
                  <View style={styles.eventBadge}>
                    <MaterialDesignIcons color={CATEGORY_META.bleeding.color} name="flower-outline" size={14} />
                    <Text style={styles.eventBadgeText}>Événement de départ</Text>
                  </View>
                ) : null}
                {isReturnedPeriodDaySelected ? (
                  <View style={styles.returnBadge}>
                    <MaterialDesignIcons color={homeColors.primary} name="sync-circle" size={14} />
                    <Text style={styles.returnBadgeText}>Retour des règles</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* DAILY INFO — only real saved categories, filtered. */}
            {dailyItems.length > 0 ? (
              <View style={styles.dailyInfoGrid}>
                {dailyItems.map(item => (
                  <View key={item.key} style={styles.dailyInfoItem}>
                    <View style={styles.dailyInfoIcon}>
                      <MaterialDesignIcons color={homeColors.primary} name={item.icon} size={19} />
                    </View>
                    <View style={styles.flexCopy}>
                      <Text style={styles.dailyInfoLabel}>{item.label}</Text>
                      <Text numberOfLines={2} style={styles.dailyInfoValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : !hasAnyDataSelectedDay ? (
              <View style={styles.emptyBox}>
                <MaterialDesignIcons color={homeColors.textSecondary} name="information-outline" size={19} />
                <Text style={styles.emptyText}>Aucune information enregistrée pour cette journée.</Text>
                {isTodaySelected ? (
                  <Pressable
                    accessibilityLabel="Ajouter au journal"
                    accessibilityRole="button"
                    onPress={openMiscarriageJournal}
                    style={({pressed}) => [styles.addButton, pressed && styles.pressed]}>
                    <MaterialDesignIcons color="#FFFFFF" name="plus" size={16} />
                    <Text style={styles.addButtonText}>Ajouter au journal</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* SHEET */}
        <MiscarriageCalendarSheet
          mode={sheet}
          onClose={() => setSheet(null)}
          onToggle={toggleFilter}
          showHijri={showHijri}
          today={today}
          visibleFilters={visibleFilters}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ============================================================
   HEADER ACTION
============================================================ */

function HeaderAction({icon, label, onPress}: {icon: IconName; label: string; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.headerAction, pressed && styles.pressed]}>
      <MaterialDesignIcons color={homeColors.primary} name={icon} size={18} />
      <Text style={styles.headerActionLabel}>{label}</Text>
    </Pressable>
  );
}

/* ============================================================
   CALENDAR SHEET — Filtres / Légende, same premium bottom-sheet
   pattern as the other objectives' calendars. The Légende sheet's
   footer ("Fermer") stays flexShrink:0 below a scrollable list, so
   it can never be hidden behind the Android nav bar/tab bar (spec
   section 7).
============================================================ */

function MiscarriageCalendarSheet({
  mode,
  onClose,
  onToggle,
  visibleFilters,
  today,
  showHijri,
}: {
  mode: 'filters' | 'legend' | null;
  onClose: () => void;
  onToggle: (key: MiscarriageJournalCategory) => void;
  visibleFilters: Set<MiscarriageJournalCategory>;
  today: Date;
  showHijri: boolean;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={mode !== null}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={styles.backdrop} />

        {mode === 'legend' ? (
          <View style={[styles.sheet, styles.legendSheet, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <View style={styles.handle} />

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.legendScrollContent}
              showsVerticalScrollIndicator={false}
              style={styles.legendScroll}>
              <View style={styles.legendSheetHeader}>
                <Text style={styles.legendSheetTitle}>Légende du calendrier</Text>
                <Text style={styles.legendSheetSubtitle}>Comprendre les couleurs et repères utilisés.</Text>
              </View>

              <View style={styles.legendRows}>
                {CATEGORY_KEYS.map((key, index) => {
                  const meta = CATEGORY_META[key];
                  return (
                    <View key={key} style={[styles.legendRow, index === CATEGORY_KEYS.length - 1 && styles.legendRowLast]}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons color={homeColors.primary} name={meta.icon} size={27} />
                      </View>
                      <View style={[styles.legendDotLarge, backgroundColorStyle(meta.color)]} />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>{meta.label}</Text>
                        <Text style={styles.legendRowText}>{meta.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.todayLegend}>
                <View style={styles.todayLegendPreview}>
                  <Text style={styles.todayLegendDay}>{today.getDate()}</Text>
                  {showHijri ? <Text style={styles.todayLegendHijri}>{formatHijriDay(today)}</Text> : null}
                </View>
                <View style={styles.todayCopy}>
                  <Text style={styles.todayTitle}>Aujourd’hui</Text>
                  <Text style={styles.todayText}>Le contour noir en pointillés indique la date d’aujourd’hui.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.legendFooter}>
              <Pressable
                accessibilityLabel="Fermer la légende"
                accessibilityRole="button"
                onPress={onClose}
                style={({pressed}) => [styles.closeLegendButton, pressed && styles.pressed]}>
                <Text style={styles.closeLegendText}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        ) : mode === 'filters' ? (
          <View style={[styles.sheet, styles.filterSheet, {paddingBottom: Math.max(insets.bottom, 10)}]}>
            <View style={styles.handle} />

            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filtres du calendrier</Text>
              <Text style={styles.filterSheetSubtitle}>Choisis les informations à afficher sur ton calendrier.</Text>
            </View>

            <ScrollView bounces={false} contentContainerStyle={styles.filterRows} showsVerticalScrollIndicator={false} style={styles.filterScroll}>
              {CATEGORY_KEYS.map((key, index) => {
                const meta = CATEGORY_META[key];
                const active = visibleFilters.has(key);
                return (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{checked: active}}
                    key={key}
                    onPress={() => onToggle(key)}
                    style={[styles.filterRow, index === CATEGORY_KEYS.length - 1 && styles.filterRowLast]}>
                    <View style={styles.filterIcon}>
                      <MaterialDesignIcons color={homeColors.primary} name={meta.icon} size={24} />
                    </View>
                    <View style={styles.filterCopy}>
                      <Text style={styles.filterTitle}>{meta.label}</Text>
                      <Text style={styles.filterDescription}>{meta.description}</Text>
                    </View>
                    <View style={[styles.switchTrack, active && styles.switchTrackActive]}>
                      <View style={[styles.switchThumb, active && styles.switchThumbActive]} />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.filterFooter}>
              <Pressable accessibilityRole="button" onPress={onClose} style={({pressed}) => [styles.doneButton, pressed && styles.pressed]}>
                <Text style={styles.doneText}>Terminé</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8F4FC'},
  safeArea: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},
  flexCopy: {flex: 1, minWidth: 0},
  pressed: {opacity: 0.75, transform: [{scale: 0.97}]},

  /* HEADER */
  header: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  headerCopy: {flex: 1, minWidth: 0},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  subtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 10.5},
  headerAction: {
    ...homeShadow,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  headerActionLabel: {marginTop: 2, color: homeColors.primary, fontSize: 8, fontWeight: '800'},

  /* CALENDAR */
  calendarCard: {
    ...homeShadow,
    padding: 12,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
  },
  modeRow: {flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F4F0F8'},
  modeButton: {flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9},
  modeButtonActive: {backgroundColor: homeColors.primary},
  modeText: {color: homeColors.textSecondary, fontSize: 10.5, fontWeight: '700'},
  modeTextActive: {color: '#FFFFFF'},

  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 11},
  arrowButton: {width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F7F3FB'},
  monthCopy: {flex: 1, alignItems: 'center', paddingHorizontal: 5},
  monthTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '800'},
  hijriMonth: {marginTop: 1, color: homeColors.textSecondary, fontSize: 9},

  weekRow: {flexDirection: 'row'},
  weekDay: {width: '14.2857%', color: homeColors.textSecondary, fontSize: 9.5, fontWeight: '700', textAlign: 'center'},

  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 5},
  dayCell: {width: '14.2857%', aspectRatio: 0.9, alignItems: 'center', justifyContent: 'center'},
  dayButton: {width: '88%', height: '91%', minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
  selectedDay: {backgroundColor: homeColors.primary},
  todayDay: {borderWidth: 1.7, borderColor: '#2F2938', borderStyle: 'dashed', borderRadius: 13},
  miscarriageDay: {backgroundColor: '#F3D9DF'},
  returnedPeriodDay: {backgroundColor: homeColors.lightLavender},
  dayText: {color: homeColors.textPrimary, fontSize: 12, fontWeight: '700'},
  lightText: {color: '#FFFFFF'},
  hijriDay: {marginTop: 1, color: homeColors.textSecondary, fontSize: 7},

  markerRow: {position: 'absolute', bottom: 3, flexDirection: 'row', gap: 2},
  marker: {width: 3.5, height: 3.5, borderRadius: 2},

  /* INLINE LEGEND */
  inlineLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9E2F0',
  },
  inlineLegendItem: {flexDirection: 'row', alignItems: 'center'},
  inlineLegendDot: {width: 7, height: 7, marginRight: 4, borderRadius: 4},
  inlineTodayIndicator: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderWidth: 1.5,
    borderColor: '#2F2938',
    borderStyle: 'dashed',
    borderRadius: 5,
  },
  inlineLegendText: {color: homeColors.textSecondary, fontSize: 8.5, fontWeight: '600'},

  /* SELECTED CARD */
  selectedCard: {
    ...homeShadow,
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  selectedHeader: {flexDirection: 'row', alignItems: 'center', paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: '#EEE8F3'},
  selectedIcon: {width: 39, height: 39, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 13, backgroundColor: '#F0EAFB'},
  selectedTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '800'},
  selectedDate: {marginTop: 2, color: homeColors.textSecondary, fontSize: 10},

  statusGrid: {flexDirection: 'row', gap: 8, marginTop: 12},
  statusInfo: {flex: 1, minWidth: 0, padding: 11, borderRadius: 15, backgroundColor: '#F7F3FC'},
  statusInfoLabel: {color: homeColors.textSecondary, fontSize: 9.5},
  statusInfoValue: {marginTop: 4, color: homeColors.primary, fontSize: 12.5, fontWeight: '800'},

  dayBadgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
  eventBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, backgroundColor: '#F8E9EC', paddingHorizontal: 12, paddingVertical: 8},
  eventBadgeText: {color: '#B4586A', fontSize: 11, fontWeight: '800'},
  returnBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, backgroundColor: homeColors.lightLavender, paddingHorizontal: 12, paddingVertical: 8},
  returnBadgeText: {color: homeColors.primary, fontSize: 11, fontWeight: '800'},

  /* DAILY INFO */
  dailyInfoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  dailyInfoItem: {
    width: '100%',
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEE7F4',
    borderRadius: 15,
    backgroundColor: '#FCFAFE',
  },
  dailyInfoIcon: {width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', marginRight: 9, borderRadius: 11, backgroundColor: '#EEE7FB'},
  dailyInfoLabel: {color: homeColors.textPrimary, fontSize: 10.5, fontWeight: '800'},
  dailyInfoValue: {marginTop: 3, color: homeColors.textSecondary, fontSize: 9.5, lineHeight: 13},

  emptyBox: {alignItems: 'center', marginTop: 14, padding: 15, borderRadius: 16, backgroundColor: '#F7F3FC'},
  emptyText: {marginTop: 7, color: homeColors.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center'},
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: homeColors.primary,
  },
  addButtonText: {color: '#FFFFFF', fontSize: 12.5, fontWeight: '800'},

  /* MODAL */
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,22,65,0.34)'},
  sheet: {maxHeight: '90%', paddingTop: 9, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FCFAFF', overflow: 'hidden'},
  handle: {width: 44, height: 5, alignSelf: 'center', flexShrink: 0, borderRadius: 3, backgroundColor: '#CBB9F7'},

  /* FILTER SHEET */
  filterSheet: {height: '88%'},
  filterScroll: {flex: 1, minHeight: 0},
  filterSheetHeader: {flexShrink: 0, marginTop: 18, marginBottom: 10, paddingHorizontal: 22},
  filterSheetTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  filterSheetSubtitle: {marginTop: 8, color: homeColors.textSecondary, fontSize: 13, lineHeight: 18},
  filterRows: {paddingHorizontal: 22, paddingBottom: 10},
  filterRow: {minHeight: 66, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5DDEF'},
  filterRowLast: {borderBottomWidth: 0},
  filterIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F0E9FC'},
  filterCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  filterTitle: {color: homeColors.textPrimary, fontSize: 13, fontWeight: '800'},
  filterDescription: {marginTop: 2, color: homeColors.textSecondary, fontSize: 10.5, lineHeight: 14},
  switchTrack: {width: 42, height: 24, flexShrink: 0, justifyContent: 'center', paddingHorizontal: 2, borderRadius: 13, backgroundColor: '#D7D0DF'},
  switchTrackActive: {backgroundColor: homeColors.primary},
  switchThumb: {...homeShadow, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF'},
  switchThumbActive: {alignSelf: 'flex-end'},
  filterFooter: {flexShrink: 0, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E7DFEF', backgroundColor: '#FCFAFF'},
  doneButton: {height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: homeColors.primary},
  doneText: {color: '#FFFFFF', fontSize: 14, fontWeight: '800'},

  /* LEGEND SHEET */
  legendSheet: {height: '88%', paddingHorizontal: 0},
  legendScroll: {flex: 1, minHeight: 0},
  legendScrollContent: {paddingHorizontal: 22, paddingTop: 4, paddingBottom: 16},
  legendSheetHeader: {marginTop: 18},
  legendSheetTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  legendSheetSubtitle: {marginTop: 7, color: homeColors.textSecondary, fontSize: 13},
  legendRows: {marginTop: 16},
  legendRow: {minHeight: 88, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E7E0EE'},
  legendRowLast: {borderBottomWidth: 0},
  legendLargeIcon: {width: 54, height: 54, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#EFE8FC'},
  legendDotLarge: {width: 11, height: 11, flexShrink: 0, marginLeft: 16, borderRadius: 6},
  legendRowCopy: {flex: 1, minWidth: 0, marginLeft: 14},
  legendRowTitle: {color: homeColors.textPrimary, fontSize: 15, fontWeight: '800'},
  legendRowText: {marginTop: 4, color: homeColors.textSecondary, fontSize: 11, lineHeight: 16},

  todayLegend: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E5DDF0',
    borderRadius: 20,
    backgroundColor: '#FAF7FE',
  },
  todayLegendPreview: {
    width: 52,
    height: 58,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.8,
    borderColor: '#2F2938',
    borderStyle: 'dashed',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  todayLegendDay: {color: homeColors.textPrimary, fontSize: 17, fontWeight: '800'},
  todayLegendHijri: {marginTop: 2, color: homeColors.textSecondary, fontSize: 9, fontWeight: '600'},
  todayCopy: {flex: 1, minWidth: 0},
  todayTitle: {color: homeColors.textPrimary, fontSize: 14, fontWeight: '800'},
  todayText: {marginTop: 4, color: homeColors.textSecondary, fontSize: 11, lineHeight: 16},

  legendFooter: {flexShrink: 0, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E7DFEF', backgroundColor: '#FCFAFF'},
  closeLegendButton: {
    width: '100%',
    height: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: homeColors.primary,
    shadowColor: '#55379F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5,
  },
  closeLegendText: {color: '#FFFFFF', fontSize: 16, fontWeight: '800'},
});

export default MiscarriageCalendarContent;
