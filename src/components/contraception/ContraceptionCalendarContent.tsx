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
import {TOP_SPACING_EXTRA} from '../../theme/spacing';

import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  subscribeContraceptionPreferences,
} from '../../state/contraceptionPreferences';

import {
  getAllContraceptionIntakeRecords,
  hydrateContraceptionIntakeHistory,
  subscribeContraceptionIntakeHistory,
  type ContraceptionIntakeRecord,
} from '../../state/contraceptionIntakeHistoryStore';

import {
  getAllContraceptionEvents,
  hydrateContraceptionEvents,
  subscribeContraceptionEvents,
  type ContraceptionEvent,
  type ContraceptionEventType,
} from '../../state/contraceptionEventStore';

import {
  CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL,
  CONTRACEPTION_EVENT_ICONS,
  CONTRACEPTION_EVENT_LABELS,
  CONTRACEPTION_INTAKE_ACTION_LABEL,
  CONTRACEPTION_METHOD_EVENT_TYPES,
  CONTRACEPTION_METHOD_ICONS,
  CONTRACEPTION_METHOD_LABELS,
} from '../../config/contraceptionLabels';

import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {homeColors, homeShadow} from '../home/homeTheme';

import {
  formatFullDate,
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  startOfDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import {
  computeContraceptionEventCounts,
  computeContraceptionMonthlySummary,
  getPillPackDay,
} from '../../utils/contraceptionMath';

const PURPLE = homeColors.primary;
const PURPLE_DARK = homeColors.textPrimary;
const PURPLE_SOFT = homeColors.lightLavender;
const MUTED = homeColors.textSecondary;
const SUCCESS = homeColors.green;
const SUCCESS_SOFT = homeColors.greenLight;
// homeColors has no danger/warning token — same local addition pattern
// already used by AppLockScreen.tsx/FaceIdSetupScreen.tsx for the same gap.
const DANGER = '#D96176';
const DANGER_SOFT = '#FFF0F3';
// Same hex as ContraceptionJournalEntryScreen.tsx's/ContraceptionDashboard.tsx's
// local warning color — the 'late' status's color everywhere it's shown.
const WARNING = '#C77B2E';
const WARNING_SOFT = '#FFF0E3';
const BORDER = homeColors.cardBorder;

// Same value MonthCalendarCard.tsx/every sibling calendar content already
// uses for these two markers — never invented locally.
const RAMADAN_MARKER_COLOR = homeColors.primary;
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;


// Display-only marker filters — never affect recordsByDate, monthlySummary,
// or the selected-day card, all of which keep reading real unfiltered data.
// Today's dashed outline and the selected-day fill are intentionally NOT
// part of this type: they must always render regardless of filter state.
type ContraceptionCalendarFilters = {
  taken: boolean;
  late: boolean;
  missed: boolean;
  // Ring/patch event-type markers — irrelevant keys for the current method
  // are simply unused, same as taken/late/missed already are for 'other'.
  ring_insertion: boolean;
  ring_removal: boolean;
  ring_replacement: boolean;
  patch_application: boolean;
  patch_removal: boolean;
  patch_replacement: boolean;
  ramadan: boolean;
  dhulHijja: boolean;
};

const DEFAULT_CALENDAR_FILTERS: ContraceptionCalendarFilters = {
  taken: true,
  late: true,
  missed: true,
  ring_insertion: true,
  ring_removal: true,
  ring_replacement: true,
  patch_application: true,
  patch_removal: true,
  patch_replacement: true,
  ramadan: true,
  dhulHijja: true,
};

type CalendarSheetMode = 'filters' | 'legend' | null;

function ContraceptionCalendarContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {open: openJournal} = useJournalSheet();

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => localDateKey(today), [today]);

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const [filters, setFilters] = useState<ContraceptionCalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [sheet, setSheet] = useState<CalendarSheetMode>(null);

  const toggleFilter = useCallback((key: keyof ContraceptionCalendarFilters) => {
    setFilters(current => ({...current, [key]: !current[key]}));
  }, []);

  const [contraception, setContraception] = useState(getContraceptionPreferences);
  const [recordsByDate, setRecordsByDate] = useState<Record<string, ContraceptionIntakeRecord>>(
    getAllContraceptionIntakeRecords,
  );
  const [eventsByDate, setEventsByDate] = useState<Record<string, ContraceptionEvent[]>>(
    getAllContraceptionEvents,
  );
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateContraceptionPreferences().then(value => {
        if (active) {setContraception(value);}
      });
      const unsubscribePreferences = subscribeContraceptionPreferences(() => {
        if (active) {setContraception(getContraceptionPreferences());}
      });

      hydrateContraceptionIntakeHistory().then(() => {
        if (active) {setRecordsByDate(getAllContraceptionIntakeRecords());}
      });
      const unsubscribeIntake = subscribeContraceptionIntakeHistory(() => {
        if (active) {setRecordsByDate(getAllContraceptionIntakeRecords());}
      });

      hydrateContraceptionEvents().then(() => {
        if (active) {setEventsByDate(getAllContraceptionEvents());}
      });
      const unsubscribeEvents = subscribeContraceptionEvents(() => {
        if (active) {setEventsByDate(getAllContraceptionEvents());}
      });

      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());

      return () => {
        active = false;
        unsubscribePreferences();
        unsubscribeIntake();
        unsubscribeEvents();
      };
    }, []),
  );

  const {method, methodStartDate, pillScheduleType, activeDays, breakDays, remindersEnabled} = contraception;
  const isPill = method === 'pill';

  // Real total pack length from the user's own PillScheduleScreen answer —
  // never a hardcoded 28. null for continuous/unknown/not-yet-configured.
  const pillScheduleTotalDays =
    pillScheduleType === 'cyclic' && activeDays !== null && breakDays !== null
      ? activeDays + breakDays
      : null;
  // Ring/patch are tracked as discrete insertion/removal/replacement events
  // (contraceptionEventStore.ts), never as a single daily taken/late/missed
  // status — so every taken/late/missed marker, filter and summary tile
  // below is pill/other-only, and these methods get their own event-based
  // equivalents instead.
  const isEventMethod = method === 'ring' || method === 'patch';
  const methodEventTypes = method ? CONTRACEPTION_METHOD_EVENT_TYPES[method] ?? [] : [];
  const methodLabel = method ? CONTRACEPTION_METHOD_LABELS[method] : 'Non renseignée';
  const methodIcon = method ? CONTRACEPTION_METHOD_ICONS[method] : 'pill';
  const intakeActionLabel = method
    ? CONTRACEPTION_INTAKE_ACTION_LABEL[method]
    : CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL;

  const selectedDateKey = useMemo(() => localDateKey(selectedDate), [selectedDate]);
  const isSelectedToday = selectedDateKey === todayKey;
  const selectedRecord = recordsByDate[selectedDateKey];
  const selectedDateEvents = eventsByDate[selectedDateKey] ?? [];

  const selectedPillPackDay = useMemo(
    () =>
      isPill && pillScheduleTotalDays !== null
        ? getPillPackDay(methodStartDate, selectedDateKey, pillScheduleTotalDays)
        : null,
    [isPill, methodStartDate, selectedDateKey, pillScheduleTotalDays],
  );

  const selectedHijriDate = useMemo(() => formatHijriDate(selectedDate), [selectedDate]);

  const monthlySummary = useMemo(
    () => computeContraceptionMonthlySummary(recordsByDate, visibleMonth, todayKey, methodStartDate),
    [recordsByDate, visibleMonth, todayKey, methodStartDate],
  );

  const monthStartKey = useMemo(
    () => localDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)),
    [visibleMonth],
  );
  const monthEndKeyRaw = useMemo(
    () => localDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)),
    [visibleMonth],
  );
  const monthEndKey = monthEndKeyRaw < todayKey ? monthEndKeyRaw : todayKey;

  const monthlyEventCounts = useMemo(
    () =>
      isEventMethod && monthStartKey <= monthEndKey
        ? computeContraceptionEventCounts(eventsByDate, monthStartKey, monthEndKey)
        : {},
    [isEventMethod, eventsByDate, monthStartKey, monthEndKey],
  );

  const hijriRangeLabel = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const last = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const firstLabel = formatHijriMonthYear(first);
    const lastLabel = formatHijriMonthYear(last);
    if (!firstLabel) {return undefined;}
    if (!lastLabel || lastLabel === firstLabel) {return firstLabel;}
    return `${firstLabel} – ${lastLabel}`;
  }, [visibleMonth]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({length: offset + count}, (_, index) =>
      index < offset ? null : new Date(year, month, index - offset + 1),
    );
  }, [visibleMonth]);

  const formatRecordTime = (recordedAt: string): string | null => {
    const parsed = new Date(recordedAt);
    if (Number.isNaN(parsed.getTime())) {return null;}
    return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(parsed);
  };

  const intakeStatusLine = (() => {
    if (selectedRecord?.status === 'taken') {
      const time = formatRecordTime(selectedRecord.recordedAt);
      return time ? `Effectuée à ${time}` : 'Effectuée';
    }
    if (selectedRecord?.status === 'late') {
      return 'En retard';
    }
    if (selectedRecord?.status === 'missed') {
      return 'Oubliée';
    }
    return 'Non enregistrée';
  })();

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
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
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 24}]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Calendrier</Text>
              <Text style={styles.subtitle}>Suis ta contraception, jour après jour</Text>
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
                onPress={() =>
                  setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }>
                <MaterialDesignIcons color={PURPLE} name="chevron-left" size={24} />
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
                onPress={() =>
                  setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }>
                <MaterialDesignIcons color={PURPLE} name="chevron-right" size={24} />
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

                const dateKey = localDateKey(date);
                const record = recordsByDate[dateKey];
                const dayEvents = isEventMethod
                  ? (eventsByDate[dateKey] ?? []).filter(event => filters[event.type])
                  : [];
                const isToday = sameDay(date, today);
                const isSelected = sameDay(date, selectedDate);
                const hijriDay = formatHijriDay(date);

                const isExpectedTracked =
                  Boolean(methodStartDate) && dateKey >= (methodStartDate as string) && dateKey <= todayKey;

                // Classification is computed exactly as before, unconditionally —
                // filters only affect whether the resulting marker is DISPLAYED
                // below, never the underlying isRamadan/isDhoulHijja result.
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

                // Display-only gates — `record` itself (real store data) is
                // never touched, so the selected-day card and monthly summary
                // below always reflect the true, unfiltered status.
                const showTakenMarker = filters.taken && record?.status === 'taken';
                const showLateMarker = filters.late && record?.status === 'late';
                const showMissedMarker = filters.missed && record?.status === 'missed';
                const showEventMarker = dayEvents.length > 0;

                const lightText = isSelected && !isToday;

                const eventAccessibilityLabel = dayEvents.length > 0
                  ? `, ${dayEvents.map(event => CONTRACEPTION_EVENT_LABELS[event.type]).join(', ')}`
                  : '';

                return (
                  <View key={dateKey} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()} ${showTakenMarker ? ', effectuée' : showLateMarker ? ', en retard' : showMissedMarker ? ', oubliée' : ''}${eventAccessibilityLabel}${spiritualMonth === 'ramadan' ? ', Ramadan' : spiritualMonth === 'dhoulHijja' ? ', Dhou al-Hijja' : ''}`}
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date)}
                      style={({pressed}) => [
                        styles.day,
                        !isToday && showTakenMarker && styles.dayTaken,
                        !isToday && showLateMarker && styles.dayLate,
                        !isToday && showMissedMarker && styles.dayMissed,
                        !isToday && showEventMarker && styles.dayHasEvent,
                        !isToday && !isEventMethod && !record && isExpectedTracked && styles.dayNotRecorded,
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
                      {!isToday && showTakenMarker ? (
                        <MaterialDesignIcons
                          color={lightText ? '#FFFFFF' : SUCCESS}
                          name="check-circle"
                          size={9}
                          style={styles.statusIcon}
                        />
                      ) : null}
                      {!isToday && showLateMarker ? (
                        <MaterialDesignIcons
                          color={lightText ? '#FFFFFF' : WARNING}
                          name="clock-alert"
                          size={9}
                          style={styles.statusIcon}
                        />
                      ) : null}
                      {!isToday && showMissedMarker ? (
                        <MaterialDesignIcons
                          color={lightText ? '#FFFFFF' : DANGER}
                          name="alert-circle"
                          size={9}
                          style={styles.statusIcon}
                        />
                      ) : null}
                      {!isToday && showEventMarker ? (
                        <MaterialDesignIcons
                          color={lightText ? '#FFFFFF' : PURPLE}
                          name={CONTRACEPTION_EVENT_ICONS[dayEvents[0].type]}
                          size={9}
                          style={styles.statusIcon}
                        />
                      ) : null}
                      {spiritualMonth ? (
                        <View pointerEvents="none" style={styles.spiritualMarker}>
                          <MaterialDesignIcons
                            color={isToday || lightText ? PURPLE_DARK : spiritualMonth === 'ramadan' ? RAMADAN_MARKER_COLOR : DHOUL_HIJJA_MARKER_COLOR}
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

            {/* LEGEND */}
            <View style={styles.legendRow}>
              {isEventMethod ? (
                <LegendItem color={PURPLE} label="Événement enregistré" />
              ) : (
                <>
                  <LegendItem color={SUCCESS} label="Effectuée" />
                  <LegendItem color={WARNING} label="En retard" />
                  <LegendItem color={DANGER} label="Oubliée" />
                  <LegendItem label="Non enregistrée" outline />
                </>
              )}
              <LegendItem color={PURPLE_DARK} label="Aujourd’hui" dashedOutline />
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
              <Text style={styles.selectedDateText}>{formatFullDate(selectedDate)}</Text>
              {selectedHijriDate ? (
                <Text style={styles.selectedHijriText}>{selectedHijriDate}</Text>
              ) : null}
            </View>

            <View style={styles.selectedRow}>
              <View style={[styles.selectedRowIcon, styles.selectedRowIconPurple]}>
                <MaterialDesignIcons color={PURPLE} name={methodIcon} size={17} />
              </View>
              <View style={styles.selectedRowTextGroup}>
                <Text style={styles.selectedRowLabel}>Méthode</Text>
                <Text numberOfLines={1} style={styles.selectedRowValue}>{methodLabel}</Text>
              </View>
              {selectedPillPackDay !== null ? (
                <View style={styles.packBadge}>
                  <Text style={styles.packBadgeText}>Jour {selectedPillPackDay}/{pillScheduleTotalDays}</Text>
                </View>
              ) : null}
            </View>

            {isEventMethod ? (
              selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => {
                  const time = formatRecordTime(event.recordedAt);
                  return (
                    <View key={event.id} style={styles.selectedRow}>
                      <View style={[styles.selectedRowIcon, styles.selectedRowIconPurple]}>
                        <MaterialDesignIcons
                          color={PURPLE}
                          name={CONTRACEPTION_EVENT_ICONS[event.type]}
                          size={17}
                        />
                      </View>
                      <View style={styles.selectedRowTextGroup}>
                        <Text numberOfLines={1} style={styles.selectedRowLabel}>
                          {CONTRACEPTION_EVENT_LABELS[event.type]}
                        </Text>
                        <Text numberOfLines={1} style={styles.selectedRowValue}>
                          {time ? `Enregistré à ${time}` : 'Enregistré'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.selectedRow}>
                  <View style={[styles.selectedRowIcon, styles.selectedRowIconMuted]}>
                    <MaterialDesignIcons color={MUTED} name="clock-outline" size={17} />
                  </View>
                  <View style={styles.selectedRowTextGroup}>
                    <Text numberOfLines={1} style={styles.selectedRowLabel}>{intakeActionLabel}</Text>
                    <Text numberOfLines={1} style={styles.selectedRowValue}>Aucun événement enregistré</Text>
                  </View>
                </View>
              )
            ) : (
              <View style={styles.selectedRow}>
                <View
                  style={[
                    styles.selectedRowIcon,
                    selectedRecord?.status === 'taken'
                      ? styles.selectedRowIconGreen
                      : selectedRecord?.status === 'late'
                        ? styles.selectedRowIconAmber
                        : selectedRecord?.status === 'missed'
                          ? styles.selectedRowIconRed
                          : styles.selectedRowIconMuted,
                  ]}>
                  <MaterialDesignIcons
                    color={
                      selectedRecord?.status === 'taken'
                        ? SUCCESS
                        : selectedRecord?.status === 'late'
                          ? WARNING
                          : selectedRecord?.status === 'missed'
                            ? DANGER
                            : MUTED
                    }
                    name={
                      selectedRecord?.status === 'taken'
                        ? 'check-circle-outline'
                        : selectedRecord?.status === 'late'
                          ? 'clock-alert-outline'
                          : selectedRecord?.status === 'missed'
                            ? 'alert-outline'
                            : 'clock-outline'
                    }
                    size={17}
                  />
                </View>
                <View style={styles.selectedRowTextGroup}>
                  <Text numberOfLines={1} style={styles.selectedRowLabel}>{intakeActionLabel}</Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectedRowValue,
                      selectedRecord?.status === 'taken' && styles.valueSuccess,
                      selectedRecord?.status === 'late' && styles.valueWarning,
                      selectedRecord?.status === 'missed' && styles.valueDanger,
                    ]}>
                    {intakeStatusLine}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.selectedRow}>
              <View style={[styles.selectedRowIcon, remindersEnabled ? styles.selectedRowIconGreen : styles.selectedRowIconMuted]}>
                <MaterialDesignIcons
                  color={remindersEnabled ? SUCCESS : MUTED}
                  name={remindersEnabled ? 'bell-check-outline' : 'bell-off-outline'}
                  size={17}
                />
              </View>
              <View style={styles.selectedRowTextGroup}>
                <Text style={styles.selectedRowLabel}>Rappels</Text>
                <Text style={styles.selectedRowValue}>
                  {remindersEnabled ? 'Activés' : 'Désactivés'}
                </Text>
              </View>
            </View>

            {isSelectedToday ? (
              <Pressable
                accessibilityLabel="Modifier le suivi d’aujourd’hui"
                accessibilityRole="button"
                onPress={openJournal}
                style={({pressed}) => [styles.editRow, pressed && styles.pressed]}>
                <Text style={styles.editRowText}>Modifier</Text>
                <MaterialDesignIcons color={PURPLE} name="chevron-right" size={18} />
              </Pressable>
            ) : null}
          </View>

          {/* MONTHLY SUMMARY */}
          <View style={styles.card}>
            <Text style={styles.summaryTitle}>Résumé de ce mois</Text>

            {isEventMethod ? (
              methodEventTypes.every(type => !monthlyEventCounts[type]) ? (
                <Text style={styles.emptySummaryText}>Aucun événement enregistré ce mois-ci.</Text>
              ) : (
                <View style={styles.summaryGrid}>
                  {methodEventTypes.map(type =>
                    monthlyEventCounts[type] ? (
                      <View key={type} style={[styles.summaryTile, styles.summaryTilePurple]}>
                        <MaterialDesignIcons color={PURPLE} name={CONTRACEPTION_EVENT_ICONS[type]} size={18} />
                        <Text style={styles.summaryValue}>{monthlyEventCounts[type]}</Text>
                        <Text style={styles.summaryLabel}>{CONTRACEPTION_EVENT_LABELS[type]}</Text>
                      </View>
                    ) : null,
                  )}
                </View>
              )
            ) : (
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryTile, styles.summaryTileGreen]}>
                  <MaterialDesignIcons color={SUCCESS} name="check-circle-outline" size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.taken}</Text>
                  <Text style={styles.summaryLabel}>Effectuées</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileAmber]}>
                  <MaterialDesignIcons color={WARNING} name="clock-alert-outline" size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.late}</Text>
                  <Text style={styles.summaryLabel}>En retard</Text>
                </View>

                <View style={[styles.summaryTile, styles.summaryTileRed]}>
                  <MaterialDesignIcons color={DANGER} name="alert-circle-outline" size={18} />
                  <Text style={styles.summaryValue}>{monthlySummary.missed}</Text>
                  <Text style={styles.summaryLabel}>Oublis</Text>
                </View>

                {monthlySummary.notRecorded !== null ? (
                  <View style={[styles.summaryTile, styles.summaryTileMuted]}>
                    <MaterialDesignIcons color={MUTED} name="clock-outline" size={18} />
                    <Text style={styles.summaryValue}>{monthlySummary.notRecorded}</Text>
                    <Text style={styles.summaryLabel}>Non enregistrées</Text>
                  </View>
                ) : null}

                {monthlySummary.regularityPercent !== null ? (
                  <View style={[styles.summaryTile, styles.summaryTilePurple]}>
                    <MaterialDesignIcons color={PURPLE} name="chart-line" size={18} />
                    <Text style={styles.summaryValue}>{monthlySummary.regularityPercent}%</Text>
                    <Text style={styles.summaryLabel}>Régularité</Text>
                  </View>
                ) : null}
              </View>
            )}

            {!isEventMethod && monthlySummary.regularityPercent !== null ? (
              <Text style={styles.regularityDisclaimer}>
                Basé sur tes propres enregistrements.
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <ContraceptionCalendarSheet
          filters={filters}
          isEventMethod={isEventMethod}
          methodEventTypes={methodEventTypes}
          mode={sheet}
          onClose={() => setSheet(null)}
          onToggle={toggleFilter}
          spiritualMarkersEnabled={spiritualMarkersEnabled}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function HeaderAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.headerAction, pressed && styles.pressed]}>
      <MaterialDesignIcons color={PURPLE} name={icon} size={18} />
      <Text style={styles.headerActionLabel}>{label}</Text>
    </Pressable>
  );
}

function LegendItem({
  color,
  label,
  outline = false,
  dashedOutline = false,
  icon,
}: {
  color?: string;
  label: string;
  outline?: boolean;
  dashedOutline?: boolean;
  icon?: React.ComponentProps<typeof MaterialDesignIcons>['name'];
}): React.JSX.Element {
  return (
    <View style={styles.legendItem}>
      {icon ? (
        <MaterialDesignIcons color={color} name={icon} size={11} />
      ) : dashedOutline ? (
        <View style={[styles.legendDashedRing, color ? {borderColor: color} : null]} />
      ) : outline ? (
        <View style={styles.legendOutlineRing} />
      ) : (
        <View style={[styles.legendDot, color ? {backgroundColor: color} : null]} />
      )}
      <Text numberOfLines={1} style={styles.legendText}>{label}</Text>
    </View>
  );
}

/* ============================================================
   FILTRES / LÉGENDE — same premium bottom-sheet pattern already used by
   MiscarriageCalendarContent.tsx/PregnancyCalendarContent.tsx/etc. Purely
   display-only: toggling a filter here never touches recordsByDate,
   monthlySummary, the selected-day card, or Hijri/Ramadan/Dhoul-Hijja
   classification — only whether a marker already computed above is drawn.
============================================================ */

function ContraceptionCalendarSheet({
  mode,
  onClose,
  onToggle,
  filters,
  spiritualMarkersEnabled,
  isEventMethod,
  methodEventTypes,
}: {
  mode: CalendarSheetMode;
  onClose: () => void;
  onToggle: (key: keyof ContraceptionCalendarFilters) => void;
  filters: ContraceptionCalendarFilters;
  spiritualMarkersEnabled: boolean;
  isEventMethod: boolean;
  methodEventTypes: ContraceptionEventType[];
}): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const trackingFilterRows: Array<{
    key: keyof ContraceptionCalendarFilters;
    icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
    color: string;
    title: string;
    description: string;
  }> = isEventMethod
    ? methodEventTypes.map(type => ({
        key: type,
        icon: CONTRACEPTION_EVENT_ICONS[type],
        color: PURPLE,
        title: CONTRACEPTION_EVENT_LABELS[type],
        description: `Afficher les jours où « ${CONTRACEPTION_EVENT_LABELS[type].toLowerCase()} » a été enregistré`,
      }))
    : [
        {
          key: 'taken',
          icon: 'check-circle-outline',
          color: SUCCESS,
          title: 'Prises effectuées',
          description: 'Afficher les jours où ta prise a été enregistrée',
        },
        {
          key: 'late',
          icon: 'clock-alert-outline',
          color: WARNING,
          title: 'Retards',
          description: 'Afficher les jours où un retard a été signalé',
        },
        {
          key: 'missed',
          icon: 'alert-outline',
          color: DANGER,
          title: 'Oublis',
          description: 'Afficher les jours où un oubli a été signalé',
        },
      ];

  const spiritualFilterRows: Array<{
    key: keyof ContraceptionCalendarFilters;
    icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
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

  const legendRows = isEventMethod
    ? methodEventTypes.map(type => ({
        icon: CONTRACEPTION_EVENT_ICONS[type],
        color: PURPLE,
        title: CONTRACEPTION_EVENT_LABELS[type],
        description: `« ${CONTRACEPTION_EVENT_LABELS[type]} » a été enregistré ce jour-là.`,
      }))
    : [
        {icon: 'check-circle' as const, color: SUCCESS, title: 'Prise effectuée', description: 'Une prise a été enregistrée ce jour-là.'},
        {icon: 'clock-alert' as const, color: WARNING, title: 'En retard', description: 'Un retard a été signalé ce jour-là.'},
        {icon: 'alert-circle' as const, color: DANGER, title: 'Oubli', description: 'Un oubli a été signalé ce jour-là.'},
      ];

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
              <Text style={sheetStyles.groupTitle}>Suivi contraception</Text>
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
                        <Text style={sheetStyles.legendRowText}>Ce jour se situe dans le mois du Ramadan.</Text>
                      </View>
                    </View>
                    <View style={[sheetStyles.legendRow, sheetStyles.legendRowLast]}>
                      <View style={sheetStyles.legendLargeIcon}>
                        <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={22} />
                      </View>
                      <View style={sheetStyles.legendRowCopy}>
                        <Text style={sheetStyles.legendRowTitle}>Dhou al-Hijja</Text>
                        <Text style={sheetStyles.legendRowText}>Ce jour se situe dans le mois de Dhou al-Hijja.</Text>
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
  row: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; color: string; title: string; description: string};
  active: boolean;
  onPress: () => void;
  last: boolean;
}): React.JSX.Element {
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

const sheetStyles = StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,22,65,0.34)'},
  sheet: {
    maxHeight: '90%', paddingTop: 9, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: '#FCFAFF', overflow: 'hidden',
  },
  handle: {width: 44, height: 5, alignSelf: 'center', flexShrink: 0, borderRadius: 3, backgroundColor: '#CBB9F7'},

  sheetHeader: {flexShrink: 0, marginTop: 18, marginBottom: 10, paddingHorizontal: 22},
  sheetTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  sheetSubtitle: {marginTop: 8, color: MUTED, fontSize: 13, lineHeight: 18},

  filterSheet: {height: '80%'},
  filterScroll: {flex: 1, minHeight: 0},
  filterRows: {paddingHorizontal: 22, paddingBottom: 10},
  groupTitle: {marginTop: 14, marginBottom: 4, color: MUTED, fontSize: 11, fontWeight: '800', textTransform: 'uppercase'},
  filterRow: {
    minHeight: 66, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5DDEF',
  },
  filterRowLast: {borderBottomWidth: 0},
  filterIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F0E9FC'},
  filterCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  filterTitle: {color: PURPLE_DARK, fontSize: 13, fontWeight: '800'},
  filterDescription: {marginTop: 2, color: MUTED, fontSize: 10.5, lineHeight: 14},
  switchTrack: {width: 42, height: 24, flexShrink: 0, justifyContent: 'center', paddingHorizontal: 2, borderRadius: 13, backgroundColor: '#DED2F2'},
  switchTrackActive: {backgroundColor: PURPLE},
  switchThumb: {...homeShadow, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF'},
  switchThumbActive: {alignSelf: 'flex-end'},

  legendSheet: {height: '80%', paddingHorizontal: 0},
  legendScroll: {flex: 1, minHeight: 0},
  legendScrollContent: {paddingHorizontal: 22, paddingTop: 4, paddingBottom: 16},
  legendRowsGroup: {marginTop: 6},
  legendRow: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5DDEF',
  },
  legendRowLast: {borderBottomWidth: 0},
  legendLargeIcon: {width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F0E9FC'},
  legendTodayPreview: {
    width: 22, height: 22, borderWidth: 1.8, borderStyle: 'dashed', borderColor: PURPLE_DARK, borderRadius: 8,
    backgroundColor: PURPLE_SOFT,
  },
  legendRowCopy: {flex: 1, minWidth: 0, marginLeft: 14},
  legendRowTitle: {color: PURPLE_DARK, fontSize: 14, fontWeight: '800'},
  legendRowText: {marginTop: 3, color: MUTED, fontSize: 11, lineHeight: 15},

  footer: {
    flexShrink: 0, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E7DFEF', backgroundColor: '#FCFAFF',
  },
  doneButton: {height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: PURPLE},
  doneText: {color: '#FFFFFF', fontSize: 14, fontWeight: '800'},
});

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},
  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA},

  header: {flexDirection: 'row', alignItems: 'center'},
  headerCopy: {flex: 1, minWidth: 0},
  title: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 23, fontWeight: '800'},
  subtitle: {marginTop: 4, color: MUTED, fontSize: 12.5},
  headerAction: {
    ...homeShadow,
    width: 52, height: 52, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    marginLeft: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 17, backgroundColor: '#FFFFFF',
  },
  headerActionLabel: {marginTop: 2, color: PURPLE, fontSize: 8, fontWeight: '800'},

  card: {
    marginTop: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.98)',
    ...homeShadow,
  },

  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  monthTitleBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 6, minWidth: 0},
  monthTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 18, fontWeight: '800', textTransform: 'capitalize'},
  hijriRange: {marginTop: 2, color: PURPLE, fontSize: 10, fontWeight: '600', textAlign: 'center'},

  weekRow: {flexDirection: 'row', marginTop: 14},
  weekDay: {width: '14.2857%', color: MUTED, fontSize: 10.5, fontWeight: '700', textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 4},
  dayCell: {width: '14.2857%', minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
  day: {
    position: 'relative', width: '86%', minHeight: 40, maxWidth: 42, paddingVertical: 4,
    alignItems: 'center', justifyContent: 'center', borderRadius: 14,
  },
  dayTaken: {backgroundColor: SUCCESS_SOFT},
  dayLate: {backgroundColor: WARNING_SOFT},
  dayMissed: {backgroundColor: DANGER_SOFT},
  dayHasEvent: {backgroundColor: PURPLE_SOFT},
  dayNotRecorded: {borderWidth: 1, borderColor: 'rgba(119,108,146,0.28)'},
  daySelected: {backgroundColor: PURPLE},
  dayToday: {
    backgroundColor: PURPLE_SOFT, borderWidth: 1.8, borderStyle: 'dashed', borderColor: PURPLE_DARK, borderRadius: 14,
  },
  dayText: {color: PURPLE_DARK, fontSize: 13, fontWeight: '600'},
  dayTextLight: {color: '#FFFFFF'},
  dayTextToday: {color: PURPLE_DARK, fontWeight: '800'},
  hijriDayText: {color: MUTED, fontSize: 8.5, marginTop: 1},
  statusIcon: {marginTop: 1},
  spiritualMarker: {position: 'absolute', top: 3, right: 3},

  legendRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: MUTED},
  legendOutlineRing: {width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(119,108,146,0.5)'},
  legendDashedRing: {width: 11, height: 11, borderRadius: 6, borderWidth: 1.3, borderStyle: 'dashed', borderColor: PURPLE_DARK},
  legendText: {color: MUTED, fontSize: 10.5},

  selectedHeader: {marginBottom: 12},
  selectedDateText: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16.5, fontWeight: '800', textTransform: 'capitalize'},
  selectedHijriText: {marginTop: 2, color: PURPLE, fontSize: 11, fontWeight: '600'},

  selectedRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10},
  selectedRowIcon: {width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
  selectedRowIconPurple: {backgroundColor: PURPLE_SOFT},
  selectedRowIconGreen: {backgroundColor: SUCCESS_SOFT},
  selectedRowIconAmber: {backgroundColor: WARNING_SOFT},
  selectedRowIconRed: {backgroundColor: DANGER_SOFT},
  selectedRowIconMuted: {backgroundColor: '#F0EDF4'},
  selectedRowTextGroup: {flex: 1, minWidth: 0},
  selectedRowLabel: {color: MUTED, fontSize: 10.5, fontWeight: '700'},
  selectedRowValue: {marginTop: 2, color: PURPLE_DARK, fontSize: 12.5, fontWeight: '800'},
  valueSuccess: {color: SUCCESS},
  valueWarning: {color: WARNING},
  valueDanger: {color: DANGER},

  packBadge: {flexShrink: 0, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: PURPLE_SOFT},
  packBadgeText: {color: PURPLE, fontSize: 10.5, fontWeight: '800'},

  editRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: BORDER, borderRadius: 15,
    backgroundColor: '#F8F3FD',
  },
  editRowText: {color: PURPLE, fontSize: 12.5, fontWeight: '800'},

  summaryTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '800', marginBottom: 12},
  summaryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  summaryTile: {
    flexGrow: 1, flexBasis: '46%', minWidth: 130, alignItems: 'center', paddingVertical: 14,
    borderRadius: 18, borderWidth: 1, borderColor: BORDER,
  },
  summaryTileGreen: {backgroundColor: SUCCESS_SOFT},
  summaryTileAmber: {backgroundColor: WARNING_SOFT},
  summaryTileRed: {backgroundColor: DANGER_SOFT},
  summaryTileMuted: {backgroundColor: '#F3F1F6'},
  summaryTilePurple: {backgroundColor: PURPLE_SOFT},
  summaryValue: {marginTop: 6, color: PURPLE_DARK, fontSize: 20, fontWeight: '900'},
  summaryLabel: {marginTop: 2, color: MUTED, fontSize: 10.5, fontWeight: '700', textAlign: 'center'},
  emptySummaryText: {color: MUTED, fontSize: 12, lineHeight: 17},
  regularityDisclaimer: {marginTop: 10, color: MUTED, fontSize: 9.5, lineHeight: 13, fontStyle: 'italic'},

  pressed: {opacity: 0.82},
});

export default ContraceptionCalendarContent;
