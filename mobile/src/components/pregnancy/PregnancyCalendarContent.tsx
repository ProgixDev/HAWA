import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {useFocusEffect, useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

import {
  loadPersonalInformation,
  type CalendarPreference,
} from '../../state/personalInformationStore';

import {
  capitalize,
  formatFullDate,
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  startOfDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';

import {
  getPregnancyJournalState,
  type PregnancyJournalState,
} from '../../state/pregnancyJournalStore';

import {getJournalEntriesForMonth, getJournalEntry} from '../../state/dailyJournalStore';

import {
  getPregnancyDating,
  hydratePregnancyDating,
  subscribePregnancyDating,
} from '../../state/pregnancyPreferences';

import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {usePremium} from '../../hooks/usePremium';
import {HawaPremiumBottomSheet} from '../premium/HawaPremiumBottomSheet';
import {isMonthWithinHistoryAccess} from '../../utils/historyAccess';

import {
  getPregnancyMedicalEvents,
  getUpcomingEvents,
  type PregnancyMedicalEvent,
} from '../../state/pregnancyMedicalEventsStore';

import type {
  DailyJournalEntry,
  MoodLevel,
} from '../../types/journal';

import {TOP_SPACING_EXTRA, getFloatingTabBarClearance} from '../../theme/spacing';

/* ============================================================
   CALENDAR MODES
============================================================ */

const MODES: Array<{
  key: CalendarPreference;
  label: string;
}> = [
  {
    key: 'gregorian',
    label: 'Grégorien',
  },
  {
    key: 'hijri',
    label: 'Hijri',
  },
  {
    key: 'double',
    label: 'Double',
  },
];

/* ============================================================
   EVENT TYPES
============================================================ */

type EventType =
  | 'appointment'
  | 'exam'
  | 'reminder'
  | 'note';

const EVENT_META: Record<
  EventType,
  {
    label: string;
    empty: string;
    color: string;
    icon: React.ComponentProps<
      typeof MaterialDesignIcons
    >['name'];
  }
> = {
  appointment: {
    label: 'Rendez-vous',
    empty: 'Aucun rendez-vous',
    color: '#6D4AE8',
    icon: 'calendar-heart',
  },

  exam: {
    label: 'Examen',
    empty: 'Aucun examen',
    color: '#A68BE8',
    icon: 'clipboard-pulse-outline',
  },

  reminder: {
    label: 'Rappel',
    empty: 'Aucun rappel',
    color: '#F0AD17',
    icon: 'bell-outline',
  },

  note: {
    label: 'Note',
    empty: 'Aucune note',
    color: '#2AA7A1',
    icon: 'note-text-outline',
  },
};

const EVENT_TYPES =
  Object.keys(EVENT_META) as EventType[];

// Same canonical spiritual-marker colors already approved in the seven
// other objective calendars. The Hijri classification itself is provided by
// the shared hijriCalendar utility below; no Pregnancy-specific conversion.
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

/* ============================================================
   FILTER TYPES
============================================================ */

// Exactly the 5 canonical Pregnancy Daily Journal categories (see
// pregnancyJournalStore.ts / PregnancyDashboard.tsx "Suivi du jour" /
// PREGNANCY_JOURNAL_ITEMS in MainTabNavigator.tsx) plus the pre-existing
// "Rendez-vous / Examens" medical-EVENT filter, which is a separate concern
// (pregnancyMedicalEventsStore.ts) intentionally preserved alongside them.
// Hydratation/Activité physique/Note personnelle were removed — they are
// not, and have never been, Pregnancy Daily Journal categories.
type FilterKey =
  | 'symptoms'
  | 'weight'
  | 'mood'
  | 'sleep'
  | 'medical'
  | 'appointments';

const FILTER_META: Record<
  FilterKey,
  {
    label: string;
    description: string;
    empty: string;
    icon: React.ComponentProps<
      typeof MaterialDesignIcons
    >['name'];
  }
> = {
  symptoms: {
    label: 'Symptômes',
    description:
      'Signes et symptômes enregistrés dans ton journal.',
    empty: 'Aucun',
    icon: 'clipboard-pulse-outline',
  },

  weight: {
    label: 'Poids',
    description:
      'Évolution de ton poids pendant la grossesse.',
    empty: 'Non enregistré',
    icon: 'scale-bathroom',
  },

  mood: {
    label: 'Humeur',
    description:
      'Humeurs et émotions notées au quotidien.',
    empty: 'Non enregistrée',
    icon: 'heart-outline',
  },

  sleep: {
    label: 'Sommeil',
    description:
      'Durée et qualité de ton sommeil.',
    empty: 'Non renseigné',
    icon: 'weather-night',
  },

  medical: {
    label: 'Infos médicales',
    description:
      'Informations médicales importantes.',
    empty: 'Aucune information',
    icon: 'shield-lock-outline',
  },

  appointments: {
    label: 'Rendez-vous / Examens',
    description:
      'Rendez-vous médicaux et examens prévus.',
    empty: 'Aucun rendez-vous ou examen',
    icon: 'calendar-clock-outline',
  },
};

const FILTER_KEYS =
  Object.keys(FILTER_META) as FilterKey[];

/* ============================================================
   MOOD LABELS
============================================================ */

const MOOD_LABELS: Record<
  MoodLevel,
  string
> = {
  veryGood: 'Très bien',
  good: 'Bien',
  neutral: 'Neutre',
  stressed: 'Stressée',
  irritable: 'Irritable',
  anxious: 'Anxieuse',
  sad: 'Triste',
  tired: 'Fatiguée',
  motivated: 'Motivée',
};

/* ============================================================
   HELPERS
============================================================ */

const dateFromKey = (
  key: string,
): Date => {
  const [year, month, day] = key
    .split('-')
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
};

const dateKey = (
  date: Date,
): string =>
  `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const backgroundColorStyle = (
  backgroundColor: string,
) => ({
  backgroundColor,
});

/* ============================================================
   DAILY INFO
============================================================ */

type DailyInfoItem = {
  key: FilterKey;
  label: string;
  value: string;
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];
  wide?: boolean;
};

function buildDailyItems(
  date: string,
  daily:
    | DailyJournalEntry
    | undefined,
  pregnancy: PregnancyJournalState,
  events: ReadonlyArray<PregnancyMedicalEvent>,
): DailyInfoItem[] {
  const symptomEntry =
    pregnancy.symptoms.find(
      item =>
        item.date === date,
    );

  const weightEntry =
    pregnancy.weights.find(
      item =>
        item.date === date,
    );

  const medicalEntry =
    pregnancy
      .medicalInformationHistory.find(
        item => item.date === date,
      );

  const appointments =
    events.filter(
      event =>
        event.type ===
          'appointment' ||
        event.type ===
          'exam',
    );

  const appointmentValue =
    appointments.length
      ? appointments
          .map(
            event =>
              `${event.title}${
                'time' in
                  event &&
                event.time
                  ? ` · ${event.time}`
                  : ''
              }`,
          )
          .join(' • ')
      : FILTER_META
          .appointments.empty;

  return [
    {
      key: 'symptoms',
      label:
        FILTER_META.symptoms
          .label,
      value:
        symptomEntry
          ?.symptoms.length
          ? symptomEntry.symptoms.join(
              ', ',
            )
          : FILTER_META
              .symptoms.empty,
      icon:
        FILTER_META.symptoms
          .icon,
    },

    {
      key: 'weight',
      label:
        FILTER_META.weight
          .label,
      value: weightEntry
        ? `${String(
            weightEntry.valueKg,
          ).replace(
            '.',
            ',',
          )} kg`
        : FILTER_META.weight
            .empty,
      icon:
        FILTER_META.weight
          .icon,
    },

    {
      key: 'mood',
      label:
        FILTER_META.mood
          .label,
      value: daily?.mood
        ? MOOD_LABELS[
            daily.mood.level
          ]
        : FILTER_META.mood
            .empty,
      icon:
        FILTER_META.mood
          .icon,
    },

    {
      key: 'sleep',
      label:
        FILTER_META.sleep
          .label,
      value:
        daily?.sleep
          ?.duration ??
        daily?.sleep
          ?.quality ??
        FILTER_META.sleep
          .empty,
      icon:
        FILTER_META.sleep
          .icon,
    },

    {
      // Medical-information content is private (see
      // PregnancyMedicalInformationScreen.tsx, behind requirePrivateAccess).
      // The Calendar may only ever reveal WHETHER an entry exists for this
      // date, never `medicalEntry.note` itself — do not read `.note` here.
      key: 'medical',
      label:
        FILTER_META.medical
          .label,
      value: medicalEntry
        ? 'Enregistré'
        : 'Non enregistré',
      icon:
        FILTER_META.medical
          .icon,
    },

    {
      key: 'appointments',
      label:
        FILTER_META.appointments
          .label,
      value:
        appointmentValue,
      icon:
        FILTER_META.appointments
          .icon,
      wide: true,
    },
  ];
}

function isEventVisible(
  type: EventType,
  filters: Set<FilterKey>,
): boolean {
  if (
    type === 'appointment' ||
    type === 'exam'
  ) {
    return filters.has(
      'appointments',
    );
  }

  // 'reminder'/'note' event types are declared in EventType/EVENT_META for
  // the Legend sheet, but PregnancyMedicalEventType (the real persisted
  // shape, see pregnancyMedicalEventsStore.ts) only ever produces
  // 'appointment'/'exam' — this default keeps both harmlessly always-visible
  // rather than gating them on the removed Daily Journal 'note' filter.
  return true;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function PregnancyCalendarContent(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const insets =
    useSafeAreaInsets();

  const today = useMemo(
    () =>
      startOfDay(
        new Date(),
      ),
    [],
  );

  const initialDate = today;

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    () =>
      new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1,
      ),
  );

  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  // "Historique illimité" — backward navigation only; see historyAccess.ts.
  // A pregnancy's own natural anchor already bounds how much real history
  // can exist — this only ever restricts a FREE user further, to the most
  // recent 30 days, never fabricating extra history beyond what's real.
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

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    initialDate,
  );

  const [
    displayMode,
    setDisplayMode,
  ] =
    useState<CalendarPreference>(
      'double',
    );

  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled,
  );

  const [
    sheet,
    setSheet,
  ] = useState<
    | 'filters'
    | 'legend'
    | null
  >(null);

  const [
    visibleFilters,
    setVisibleFilters,
  ] = useState<
    Set<FilterKey>
  >(
    () =>
      new Set(
        FILTER_KEYS,
      ),
  );

  const [
    pregnancyJournal,
    setPregnancyJournal,
  ] =
    useState<PregnancyJournalState>(
      {
        symptoms: [],
        weights: [],
        medicalInformationHistory: [],
      },
    );

  const [
    dailyEntry,
    setDailyEntry,
  ] =
    useState<DailyJournalEntry>();

  // Mood/Sleep for the WHOLE visible month (unlike `dailyEntry` above, which
  // is only the single `selectedDate`) — needed so the month-grid dots below
  // can reflect a mood/sleep save on any day, not just the currently
  // selected one. Same `getJournalEntriesForMonth` API Cycle's own
  // CalendarScreen.tsx already uses for its own month-grid dots.
  const [monthDailyEntries, setMonthDailyEntries] = useState<Record<string, DailyJournalEntry>>({});

  const [dating, setDating] = useState(getPregnancyDating);
  const [medicalEvents, setMedicalEvents] = useState<PregnancyMedicalEvent[]>([]);

  /* ============================================================
     PREGNANCY DATING
  ============================================================ */

  useEffect(() => {
    let active = true;
    hydratePregnancyDating().then(value => {if (active) {setDating(value);}});
    const unsubscribe = subscribePregnancyDating(() => {if (active) {setDating(getPregnancyDating());}});
    return () => {active = false; unsubscribe();};
  }, []);

  /* ============================================================
     MEDICAL EVENTS
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getPregnancyMedicalEvents().then(value => {if (mounted) {setMedicalEvents(value);}});
      return () => {mounted = false;};
    }, []),
  );

  const pregnancyStatus = useMemo(
    () => computePregnancyStatus(dating.method, dating.date ? new Date(dating.date) : null, selectedDate),
    [dating, selectedDate],
  );

  /* ============================================================
     CALENDAR PREFERENCE
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      loadPersonalInformation().then(
        info => {
          if (mounted) {
            setDisplayMode(
              info.calendar,
            );
          }
        },
      );

      // Profile owns this shared preference. Refreshing on focus mirrors the
      // already-approved Conceive/Postpartum/Miscarriage calendars and makes
      // a Settings change visible without introducing another store.
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());

      return () => {
        mounted = false;
      };
    }, []),
  );

  /* ============================================================
     DAYS
  ============================================================ */

  const days = useMemo(
    () => {
      const year =
        visibleMonth.getFullYear();

      const month =
        visibleMonth.getMonth();

      const offset =
        (new Date(
          year,
          month,
          1,
        ).getDay() +
          6) %
        7;

      const count =
        new Date(
          year,
          month + 1,
          0,
        ).getDate();

      return [
        ...Array.from(
          {
            length:
              offset,
          },
          () => null,
        ),

        ...Array.from(
          {
            length:
              count,
          },
          (
            _,
            index,
          ) =>
            new Date(
              year,
              month,
              index + 1,
            ),
        ),
      ];
    },
    [visibleMonth],
  );

  /* ============================================================
     LABELS
  ============================================================ */

  const monthTitle =
    capitalize(
      new Intl.DateTimeFormat(
        'fr-FR',
        {
          month: 'long',
          year: 'numeric',
        },
      ).format(
        visibleMonth,
      ),
    );

  const showHijri =
    displayMode !==
    'gregorian';

  const selectedTitle =
    capitalize(
      new Intl.DateTimeFormat(
        'fr-FR',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        },
      ).format(
        selectedDate,
      ),
    );

  const selectedKey =
    dateKey(
      selectedDate,
    );

  /* ============================================================
     JOURNAL DATA
  ============================================================ */

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      Promise.all([
        getPregnancyJournalState(),
        getJournalEntry(
          selectedKey,
        ),
      ]).then(
        ([
          pregnancy,
          daily,
        ]) => {
          if (mounted) {
            setPregnancyJournal(
              pregnancy,
            );

            setDailyEntry(
              daily,
            );
          }
        },
      );

      return () => {
        mounted = false;
      };
    }, [selectedKey]),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      getJournalEntriesForMonth(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
      ).then(entries => {
        if (!mounted) {
          return;
        }

        const map: Record<string, DailyJournalEntry> = {};
        entries.forEach(entry => {
          map[entry.date] = entry;
        });
        setMonthDailyEntries(map);
      });

      return () => {
        mounted = false;
      };
    }, [visibleMonth]),
  );

  /* ============================================================
     EVENTS
  ============================================================ */

  const selectedEvents =
    medicalEvents.filter(
      event =>
        event.date ===
        selectedKey,
    );

  const upcomingEvents =
    visibleFilters.has(
      'appointments',
    )
      ? getUpcomingEvents(
          medicalEvents,
          today,
        )
      : [];

  const toggleFilter = (
    key: FilterKey,
  ) => {
    setVisibleFilters(
      current => {
        const next =
          new Set(current);

        if (
          next.has(key)
        ) {
          next.delete(key);
        } else {
          next.add(key);
        }

        return next;
      },
    );
  };

  const dailyItems =
    buildDailyItems(
      selectedKey,
      dailyEntry,
      pregnancyJournal,
      selectedEvents,
    );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={
        styles.background
      }>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>
      <SafeAreaView
        style={
          styles.safeArea
        }>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: getFloatingTabBarClearance(insets.bottom, 30),
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* ====================================================
              HEADER
          ===================================================== */}

          <View
            style={
              styles.header
            }>


            <View
              style={
                styles.headerCopy
              }>
              <Text
                style={
                  styles.title
                }>
                Calendrier
              </Text>

              <Text
                style={
                  styles.subtitle
                }>
                Organise ton suivi
                de grossesse
              </Text>
            </View>

            <HeaderAction
              icon="tune-variant"
              label="Filtres"
              onPress={() =>
                setSheet(
                  'filters',
                )
              }
            />

            <HeaderAction
              icon="format-list-bulleted"
              label="Légende"
              onPress={() =>
                setSheet(
                  'legend',
                )
              }
            />
          </View>

          {/* ====================================================
              CALENDAR CARD
          ===================================================== */}

          <View
            style={
              styles.calendarCard
            }>
            {/* MODE */}

            <View
              style={
                styles.modeRow
              }>
              {MODES.map(
                mode => (
                  <Pressable
                    key={
                      mode.key
                    }
                    onPress={() =>
                      setDisplayMode(
                        mode.key,
                      )
                    }
                    style={[
                      styles.modeButton,

                      displayMode ===
                        mode.key &&
                        styles.modeButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.modeText,

                        displayMode ===
                          mode.key &&
                          styles.modeTextActive,
                      ]}>
                      {
                        mode.label
                      }
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            {/* MONTH */}

            <View
              style={
                styles.monthHeader
              }>
              <Pressable
                accessibilityLabel="Mois précédent"
                accessibilityRole="button"
                onPress={goToPreviousMonth}
                style={
                  styles.arrowButton
                }>
                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="chevron-left"
                  size={23}
                />
              </Pressable>

              <View
                style={
                  styles.monthCopy
                }>
                <Text
                  style={
                    styles.monthTitle
                  }>
                  {monthTitle}
                </Text>

                {showHijri ? (
                  <Text
                    style={
                      styles.hijriMonth
                    }>
                    {formatHijriMonthYear(
                      visibleMonth,
                    )}
                  </Text>
                ) : null}
              </View>

              <Pressable
                accessibilityLabel="Mois suivant"
                accessibilityRole="button"
                onPress={goToNextMonth}
                style={
                  styles.arrowButton
                }>
                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="chevron-right"
                  size={23}
                />
              </Pressable>
            </View>

            {/* WEEK DAYS */}

            <View
              style={
                styles.weekRow
              }>
              {WEEK_DAYS.map(
                day => (
                  <Text
                    key={day}
                    style={
                      styles.weekDay
                    }>
                    {day}
                  </Text>
                ),
              )}
            </View>

            {/* DAYS */}

            <View
              style={
                styles.daysGrid
              }>
              {days.map(
                (
                  date,
                  index,
                ) => {
                  if (!date) {
                    return (
                      <View
                        key={`empty-${index}`}
                        style={
                          styles.dayCell
                        }
                      />
                    );
                  }

                  const selected =
                    sameDay(
                      date,
                      selectedDate,
                    );

                  const isToday =
                    sameDay(
                      date,
                      today,
                    );

                  // The top-right crescent is deliberately independent from
                  // the capped event/journal dot row below and from the
                  // Today/Selected/Normal background-priority system.
                  const spiritualMonth = !spiritualMarkersEnabled
                    ? null
                    : isRamadan(date)
                      ? 'ramadan'
                      : isDhoulHijja(date)
                        ? 'dhoulHijja'
                        : null;
                  const lightText = selected && !isToday;
                  const spiritualMarkerColor = lightText
                    ? onPrimaryTextColor(theme)
                    : spiritualMonth === 'ramadan'
                      ? RAMADAN_MARKER_COLOR
                      : DHOUL_HIJJA_MARKER_COLOR;
                  const spiritualMarkerLabel =
                    spiritualMonth === 'ramadan'
                      ? ', Ramadan'
                      : spiritualMonth === 'dhoulHijja'
                        ? ', Dhou al-Hijja'
                        : '';

                  const markers =
                    medicalEvents.filter(
                        event =>
                          event.date ===
                            dateKey(
                              date,
                            ) &&
                          isEventVisible(
                            event.type,
                            visibleFilters,
                          ),
                      );

                  // Daily-tracking activity for this day — symptoms/weight/
                  // medical info come straight from `pregnancyJournal`
                  // (already loaded in full, no extra fetch needed); mood/
                  // sleep come from `monthDailyEntries` (the shared
                  // dailyJournalStore, fetched for the whole visible month).
                  // Reuses the existing "Note" teal (EVENT_META.note.color)
                  // rather than inventing a new color, matching how Cycle's
                  // own calendar groups its non-phase categories into one
                  // shared dot color.
                  const cellKey = dateKey(date);
                  const hasDailyTracking =
                    (visibleFilters.has('symptoms') && pregnancyJournal.symptoms.some(entry => entry.date === cellKey)) ||
                    (visibleFilters.has('weight') && pregnancyJournal.weights.some(entry => entry.date === cellKey)) ||
                    (visibleFilters.has('medical') && pregnancyJournal.medicalInformationHistory.some(entry => entry.date === cellKey)) ||
                    (visibleFilters.has('mood') && Boolean(monthDailyEntries[cellKey]?.mood)) ||
                    (visibleFilters.has('sleep') && Boolean(monthDailyEntries[cellKey]?.sleep));

                  const dotColors = markers
                    .slice(0, 3)
                    .map(event => EVENT_META[event.type].color);
                  if (hasDailyTracking && !dotColors.includes(EVENT_META.note.color)) {
                    dotColors.push(EVENT_META.note.color);
                  }
                  const visibleDots = Array.from(new Set(dotColors)).slice(0, 3);

                  return (
                    <View
                      key={date.toISOString()}
                      style={
                        styles.dayCell
                      }>
                      <Pressable
                        accessibilityLabel={`${date.getDate()} ${monthTitle}${spiritualMarkerLabel}`}
                        accessibilityRole="button"
                        onPress={() =>
                          setSelectedDate(
                            date,
                          )
                        }
                        style={[
                          styles.dayButton,

                          selected &&
                            !isToday &&
                            styles.selectedDay,

                          isToday &&
                            styles.todayDay,
                        ]}>
                        {spiritualMonth ? (
                          <View
                            pointerEvents="none"
                            style={styles.spiritualMarkerBadge}>
                            <MaterialDesignIcons
                              color={spiritualMarkerColor}
                              name="moon-waning-crescent"
                              size={9}
                            />
                          </View>
                        ) : null}

                        <Text
                          style={[
                            styles.dayText,

                            selected &&
                              !isToday &&
                              styles.selectedDayText,
                          ]}>
                          {date.getDate()}
                        </Text>

                        {showHijri ? (
                          <Text
                            style={[
                              styles.hijriDay,

                              selected &&
                                !isToday &&
                                styles.selectedDayText,
                            ]}>
                            {formatHijriDay(
                              date,
                            )}
                          </Text>
                        ) : null}

                        {visibleDots.length >
                        0 ? (
                          <View
                            style={
                              styles.markerRow
                            }>
                            {visibleDots
                              .map(
                                (color, dotIndex) => (
                                  <View
                                    key={
                                      dotIndex
                                    }
                                    style={[
                                      styles.marker,

                                      backgroundColorStyle(
                                        selected && !isToday
                                          ? onPrimaryTextColor(theme)
                                          : color,
                                      ),
                                    ]}
                                  />
                                ),
                              )}
                          </View>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                },
              )}
            </View>

            {/* INLINE LEGEND */}

            <View
              style={
                styles.inlineLegend
              }>
              {EVENT_TYPES.map(
                type => (
                  <View
                    key={type}
                    style={
                      styles.inlineLegendItem
                    }>
                    <View
                      style={[
                        styles.inlineLegendDot,

                        backgroundColorStyle(
                          EVENT_META[
                            type
                          ].color,
                        ),
                      ]}
                    />

                    <Text
                      style={
                        styles.inlineLegendText
                      }>
                      {
                        EVENT_META[
                          type
                        ].label
                      }
                    </Text>
                  </View>
                ),
              )}

              {/* AUJOURD’HUI */}
              <View style={styles.inlineLegendItem}>
                <View style={styles.inlineTodayIndicator} />

                <Text style={styles.inlineLegendText}>
                  Aujourd’hui
                </Text>
              </View>

              {spiritualMarkersEnabled ? (
                <>
                  <View style={styles.inlineLegendItem}>
                    <MaterialDesignIcons
                      color={RAMADAN_MARKER_COLOR}
                      name="moon-waning-crescent"
                      size={11}
                    />
                    <Text
                      style={[
                        styles.inlineLegendText,
                        styles.inlineLegendTextWithIcon,
                      ]}>
                      Ramadan
                    </Text>
                  </View>

                  <View style={styles.inlineLegendItem}>
                    <MaterialDesignIcons
                      color={DHOUL_HIJJA_MARKER_COLOR}
                      name="moon-waning-crescent"
                      size={11}
                    />
                    <Text
                      style={[
                        styles.inlineLegendText,
                        styles.inlineLegendTextWithIcon,
                      ]}>
                      Dhou al-Hijja
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* ====================================================
              SELECTED CARD
          ===================================================== */}

          <View
            style={
              styles.selectedCard
            }>
            <View
              style={
                styles.selectedHeader
              }>
              <View
                style={
                  styles.selectedIcon
                }>
                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="calendar-check-outline"
                  size={21}
                />
              </View>

              <View
                style={
                  styles.flexCopy
                }>
                <Text
                  style={
                    styles.selectedTitle
                  }>
                  {
                    selectedTitle
                  }
                </Text>

                <Text
                  style={
                    styles.selectedDate
                  }>
                  {formatFullDate(
                    selectedDate,
                  )}

                  {showHijri
                    ? ` · ${
                        formatHijriDate(
                          selectedDate,
                        ) ?? ''
                      }`
                    : ''}
                </Text>
              </View>
            </View>

            {/* PREGNANCY INFO */}

            <View
              style={
                styles.pregnancyGrid
              }>
              <PregnancyInfo
                label="Semaine de grossesse"
                value={pregnancyStatus.configured ? `Semaine ${pregnancyStatus.week}` : 'Non configurée'}
              />

              <PregnancyInfo
                label="Gestation"
                value={
                  pregnancyStatus.configured
                    ? `${pregnancyStatus.gestationalWeeks} SA + ${pregnancyStatus.gestationalDays} jours`
                    : 'Non configurée'
                }
              />

              <PregnancyInfo
                label="Trimestre"
                value={pregnancyStatus.configured ? `${pregnancyStatus.trimester}e trimestre` : 'Non configurée'}
                wide
              />
            </View>

            {/* DAILY INFO */}

            <View
              style={
                styles.dailyInfoGrid
              }>
              {dailyItems
                .filter(
                  item =>
                    visibleFilters.has(
                      item.key,
                    ),
                )
                .map(
                  item => (
                    <View
                      key={
                        item.key
                      }
                      style={[
                        styles.dailyInfoItem,

                        item.wide &&
                          styles.dailyInfoItemWide,
                      ]}>
                      <View
                        style={
                          styles.dailyInfoIcon
                        }>
                        <MaterialDesignIcons
                          color={
                            theme.colors.primary
                          }
                          name={
                            item.icon
                          }
                          size={
                            19
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.flexCopy
                        }>
                        <Text
                          style={
                            styles.dailyInfoLabel
                          }>
                          {
                            item.label
                          }
                        </Text>

                        <Text
                          numberOfLines={
                            item.wide
                              ? 3
                              : 2
                          }
                          style={
                            styles.dailyInfoValue
                          }>
                          {
                            item.value
                          }
                        </Text>
                      </View>
                    </View>
                  ),
                )}
            </View>
          </View>

          {/* ====================================================
              UPCOMING
          ===================================================== */}

          <View
            style={
              styles.upcomingCard
            }>
            <Text
              style={
                styles.sectionTitle
              }>
              À venir
            </Text>

            {upcomingEvents.length === 0 ? (
              <Text style={styles.upcomingEmpty}>
                Aucun rendez-vous ou examen à venir.
              </Text>
            ) : null}

            {upcomingEvents.map(
              (
                event,
                index,
              ) => {
                const meta =
                  EVENT_META[
                    event.type
                  ];

                const date =
                  dateFromKey(
                    event.date,
                  );

                return (
                  <Pressable
                    accessibilityLabel={`Modifier ${event.title}`}
                    accessibilityRole="button"
                    key={
                      event.id
                    }
                    onPress={() =>
                      navigation.navigate(
                        'PregnancyAppointments',
                        {eventId: event.id},
                      )
                    }
                    style={({pressed}) => [
                      styles.upcomingRow,

                      index ===
                        upcomingEvents.length -
                          1 &&
                        styles.lastRow,

                      pressed &&
                        styles.pressed,
                    ]}>
                    <View
                      style={[
                        styles.upcomingDate,

                        {
                          backgroundColor: `${meta.color}14`,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.upcomingDay,

                          {
                            color:
                              meta.color,
                          },
                        ]}>
                        {date.getDate()}
                      </Text>

                      <Text
                        style={
                          styles.upcomingMonth
                        }>
                        {new Intl.DateTimeFormat(
                          'fr-FR',
                          {
                            month:
                              'short',
                          },
                        ).format(
                          date,
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.flexCopy
                      }>
                      <Text
                        style={
                          styles.upcomingTitle
                        }>
                        {
                          event.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.upcomingMeta
                        }>
                        {
                          meta.label
                        }

                        {'time' in
                          event &&
                        event.time
                          ? ` · ${event.time}`
                          : ''}
                      </Text>
                    </View>

                    <MaterialDesignIcons
                      color={
                        theme.colors.primary
                      }
                      name="chevron-right"
                      size={20}
                    />
                  </Pressable>
                );
              },
            )}
          </View>
        </ScrollView>

        {/* ======================================================
            SHEET
        ======================================================= */}

        <PregnancyCalendarSheet
          mode={sheet}
          onClose={() =>
            setSheet(null)
          }
          onToggle={
            toggleFilter
          }
          visibleFilters={
            visibleFilters
          }
          today={today}
          showHijri={showHijri}
          showSpiritualMarkers={spiritualMarkersEnabled}
        />

        <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
   PREGNANCY INFO
============================================================ */

function PregnancyInfo({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.pregnancyInfo,

        wide &&
          styles.pregnancyInfoWide,
      ]}>
      <Text
        style={
          styles.pregnancyInfoLabel
        }>
        {label}
      </Text>

      <Text
        style={
          styles.pregnancyInfoValue
        }>
        {value}
      </Text>
    </View>
  );
}

/* ============================================================
   HEADER ACTION
============================================================ */

function HeaderAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];

  label: string;

  onPress: () => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityLabel={
        label
      }
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.headerAction,

        pressed &&
          styles.pressed,
      ]}>
      <MaterialDesignIcons
        color={
          theme.colors.primary
        }
        name={icon}
        size={18}
      />

      <Text
        style={
          styles.headerActionLabel
        }>
        {label}
      </Text>
    </Pressable>
  );
}

/* ============================================================
   CALENDAR SHEET
============================================================ */

function PregnancyCalendarSheet({
  mode,
  onClose,
  onToggle,
  visibleFilters,
  today,
  showHijri,
  showSpiritualMarkers,
}: {
  mode:
    | 'filters'
    | 'legend'
    | null;

  onClose: () => void;

  onToggle: (
    type: FilterKey,
  ) => void;

  visibleFilters: Set<FilterKey>;

  today: Date;

  showHijri: boolean;

  showSpiritualMarkers: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets =
    useSafeAreaInsets();

  const descriptions: Record<
    EventType,
    string
  > = {
    appointment:
      'Consultations, visites ou rendez-vous médicaux programmés.',

    exam:
      'Examens médicaux ou échographies prévus.',

    reminder:
      'Prises de médicaments, vitamines ou autres rappels importants.',

    note:
      'Suivi quotidien enregistré ce jour-là (symptômes, poids, humeur, sommeil ou informations médicales).',
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={
        onClose
      }
      statusBarTranslucent
      transparent
      visible={
        mode !== null
      }>
      <View
        style={
          styles.modalRoot
        }>
        {/* BACKDROP */}

        <Pressable
          accessibilityLabel="Fermer"
          onPress={
            onClose
          }
          style={
            styles.backdrop
          }
        />

        {/* =====================================================
            LÉGENDE
        ====================================================== */}

        {mode ===
        'legend' ? (
          <View
            style={[
              styles.sheet,
              styles.legendSheet,

              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    10,
                  ),
              },
            ]}>
            {/* HANDLE */}

            <View
              style={
                styles.handle
              }
            />

            {/* =================================================
                ZONE SCROLLABLE
            ================================================== */}

            <ScrollView
              style={
                styles.legendScroll
              }
              contentContainerStyle={
                styles.legendScrollContent
              }
              showsVerticalScrollIndicator={
                false
              }
              bounces={
                false
              }>
              {/* HEADER */}

              <View
                style={
                  styles.legendSheetHeader
                }>
                <Text
                  style={
                    styles.legendSheetTitle
                  }>
                  Légende du
                  calendrier
                </Text>

                <Text
                  style={
                    styles.legendSheetSubtitle
                  }>
                  Comprendre les
                  couleurs et repères
                  utilisés.
                </Text>
              </View>

              {/* LEGEND ITEMS */}

              <View
                style={
                  styles.legendRows
                }>
                {EVENT_TYPES.map(
                  (
                    type,
                    index,
                  ) => {
                    const meta =
                      EVENT_META[
                        type
                      ];

                    return (
                      <View
                        key={
                          type
                        }
                        style={[
                          styles.legendRow,

                          index ===
                            EVENT_TYPES.length -
                              1 &&
                            !showSpiritualMarkers &&
                            styles.legendRowLast,
                        ]}>
                        <View
                          style={
                            styles.legendLargeIcon
                          }>
                          <MaterialDesignIcons
                            color={
                              theme.colors.primary
                            }
                            name={
                              meta.icon
                            }
                            size={
                              27
                            }
                          />
                        </View>

                        <View
                          style={[
                            styles.legendDotLarge,

                            backgroundColorStyle(
                              meta.color,
                            ),
                          ]}
                        />

                        <View
                          style={
                            styles.legendRowCopy
                          }>
                          <Text
                            style={
                              styles.legendRowTitle
                            }>
                            {
                              meta.label
                            }
                          </Text>

                          <Text
                            style={
                              styles.legendRowText
                            }>
                            {
                              descriptions[
                                type
                              ]
                            }
                          </Text>
                        </View>
                      </View>
                    );
                  },
                )}

                {showSpiritualMarkers ? (
                  <>
                    <View style={styles.legendRow}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons
                          color={RAMADAN_MARKER_COLOR}
                          name="moon-waning-crescent"
                          size={27}
                        />
                      </View>

                      <View
                        style={[
                          styles.legendDotLarge,
                          backgroundColorStyle(RAMADAN_MARKER_COLOR),
                        ]}
                      />

                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>Ramadan</Text>
                        <Text style={styles.legendRowText}>
                          Ce jour se situe dans le mois du Ramadan (jeûne).
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.legendRow, styles.legendRowLast]}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons
                          color={DHOUL_HIJJA_MARKER_COLOR}
                          name="moon-waning-crescent"
                          size={27}
                        />
                      </View>

                      <View
                        style={[
                          styles.legendDotLarge,
                          backgroundColorStyle(DHOUL_HIJJA_MARKER_COLOR),
                        ]}
                      />

                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>Dhou al-Hijja</Text>
                        <Text style={styles.legendRowText}>
                          Ce jour se situe dans le mois de Dhou al-Hijja.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              {/* TODAY */}

              <View
                style={
                  styles.todayLegend
                }>
                <View
                  style={
                    styles.todayLegendPreview
                  }>
                  <Text
                    style={
                      styles.todayLegendDay
                    }>
                    {today.getDate()}
                  </Text>

                  {showHijri ? (
                    <Text
                      style={
                        styles.todayLegendHijri
                      }>
                      {formatHijriDay(today)}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={
                    styles.todayCopy
                  }>
                  <Text
                    style={
                      styles.todayTitle
                    }>
                    Aujourd’hui
                  </Text>

                  <Text
                    style={
                      styles.todayText
                    }>
                    Le contour noir en
                    pointillés indique la
                    date d’aujourd’hui.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* =================================================
                FOOTER FIXE
            ================================================== */}

            <View
              style={
                styles.legendFooter
              }>
              <Pressable
                accessibilityLabel="Fermer la légende"
                accessibilityRole="button"
                onPress={
                  onClose
                }
                style={({
                  pressed,
                }) => [
                  styles.closeLegendButton,

                  pressed &&
                    styles.pressed,
                ]}>
                <Text
                  style={
                    styles.closeLegendText
                  }>
                  Fermer
                </Text>
              </Pressable>
            </View>
          </View>
        ) : mode ===
          'filters' ? (
          /* ===================================================
              FILTERS
          ==================================================== */

          <View
            style={[
              styles.sheet,
              styles.filterSheet,

              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    10,
                  ),
              },
            ]}>
            {/* HANDLE */}

            <View
              style={
                styles.handle
              }
            />

            {/* HEADER */}

            <View
              style={
                styles.filterSheetHeader
              }>
              <Text
                style={
                  styles.filterSheetTitle
                }>
                Filtres du
                calendrier
              </Text>

              <Text
                style={
                  styles.filterSheetSubtitle
                }>
                Choisis les
                informations à
                afficher sur ton
                calendrier.
              </Text>
            </View>

            {/* FILTER LIST */}

            <ScrollView
              style={
                styles.filterScroll
              }
              contentContainerStyle={
                styles.filterRows
              }
              showsVerticalScrollIndicator={
                false
              }
              bounces={
                false
              }>
              {FILTER_KEYS.map(
                (
                  key,
                  index,
                ) => {
                  const meta =
                    FILTER_META[
                      key
                    ];

                  const active =
                    visibleFilters.has(
                      key,
                    );

                  return (
                    <Pressable
                      accessibilityRole="switch"
                      accessibilityState={{
                        checked:
                          active,
                      }}
                      key={
                        key
                      }
                      onPress={() =>
                        onToggle(
                          key,
                        )
                      }
                      style={[
                        styles.filterRow,

                        index ===
                          FILTER_KEYS.length -
                            1 &&
                          styles.filterRowLast,
                      ]}>
                      <View
                        style={
                          styles.filterIcon
                        }>
                        <MaterialDesignIcons
                          color={
                            theme.colors.primary
                          }
                          name={
                            meta.icon
                          }
                          size={
                            24
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.filterCopy
                        }>
                        <Text
                          style={
                            styles.filterTitle
                          }>
                          {
                            meta.label
                          }
                        </Text>

                        <Text
                          style={
                            styles.filterDescription
                          }>
                          {
                            meta.description
                          }
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.switchTrack,

                          active &&
                            styles.switchTrackActive,
                        ]}>
                        <View
                          style={[
                            styles.switchThumb,

                            active &&
                              styles.switchThumbActive,
                          ]}
                        />
                      </View>
                    </Pressable>
                  );
                },
              )}
            </ScrollView>

            {/* FILTER FOOTER */}

            <View
              style={
                styles.filterFooter
              }>
              <Pressable
                accessibilityRole="button"
                onPress={
                  onClose
                }
                style={({
                  pressed,
                }) => [
                  styles.doneButton,

                  pressed &&
                    styles.pressed,
                ]}>
                <Text
                  style={
                    styles.doneText
                  }>
                  Terminé
                </Text>
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

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ==========================================================
       GLOBAL
    ========================================================== */

    background: {
      flex: 1,

      backgroundColor:
        theme.colors.background,
    },

    pageBackgroundDecor: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    pageGlowTop: {
      position: 'absolute',
      top: -150,
      right: -110,
      width: 330,
      height: 330,
      borderRadius: 165,
      backgroundColor: withAlpha(theme.colors.primary, 0.07),
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor: withAlpha(theme.colors.primary, 0.05),
    },

    safeArea: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 16,

      paddingTop:
        TOP_SPACING_EXTRA,
    },

    flexCopy: {
      flex: 1,

      minWidth: 0,
    },

    pressed: {
      opacity: 0.75,

      transform: [
        {
          scale: 0.97,
        },
      ],
    },

    /* ==========================================================
       HEADER
    ========================================================== */

    header: {
      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 12,
    },

    headerCopy: {
      flex: 1,

      minWidth: 0,
    },

    title: {
      color:
        theme.colors.accent,

      fontFamily: 'serif',

      fontSize: 24,

      fontWeight: '800',
    },

    subtitle: {
      marginTop: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 10.5,
    },

    headerAction: {
      ...theme.shadow,

      width: 52,
      height: 52,

      alignItems: 'center',

      justifyContent:
        'center',

      marginLeft: 6,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 17,

      backgroundColor:
        theme.colors.surface,
    },

    headerActionLabel: {
      marginTop: 2,

      color:
        theme.colors.primary,

      fontSize: 8,

      fontWeight: '800',
    },

    /* ==========================================================
       CALENDAR
    ========================================================== */

    calendarCard: {
      ...theme.shadow,

      padding: 12,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 23,

      backgroundColor:
        theme.colors.surface,
    },

    modeRow: {
      flexDirection: 'row',

      padding: 3,

      borderRadius: 12,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    modeButton: {
      flex: 1,

      alignItems: 'center',

      paddingVertical: 7,

      borderRadius: 9,
    },

    modeButtonActive: {
      backgroundColor:
        theme.colors.primary,
    },

    modeText: {
      color:
        theme.colors.textSecondary,

      fontSize: 10.5,

      fontWeight: '700',
    },

    modeTextActive: {
      color: onPrimaryTextColor(theme),
    },

    monthHeader: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginVertical: 11,
    },

    arrowButton: {
      width: 35,
      height: 35,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    monthCopy: {
      flex: 1,

      alignItems: 'center',

      paddingHorizontal: 5,
    },

    monthTitle: {
      color:
        theme.colors.accent,

      fontFamily: 'serif',

      fontSize: 17,

      fontWeight: '800',
    },

    hijriMonth: {
      marginTop: 1,

      color:
        theme.colors.textSecondary,

      fontSize: 9,
    },

    weekRow: {
      flexDirection: 'row',
    },

    weekDay: {
      width: '14.2857%',

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      fontWeight: '700',

      textAlign: 'center',
    },

    daysGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      marginTop: 5,
    },

    dayCell: {
      width: '14.2857%',

      aspectRatio: 0.9,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    dayButton: {
      width: '88%',

      height: '91%',

      minHeight: 36,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,
    },

    selectedDay: {
      backgroundColor:
        theme.colors.primary,
    },

    todayDay: {
      borderWidth: 1.7,

      borderColor:
        theme.colors.text,

      borderStyle:
        'dashed',

      borderRadius: 13,

      // Neutral fill — matches the same "Aujourd'hui" treatment used by
      // every other objective's calendar (Cycle/Conceive/Miscarriage/
      // Postpartum), instead of a fully transparent cell.
      backgroundColor:
        theme.colors.primarySoft,
    },

    dayText: {
      color:
        theme.colors.accent,

      fontSize: 12,

      fontWeight: '700',
    },

    hijriDay: {
      marginTop: 1,

      color:
        theme.colors.textSecondary,

      fontSize: 7,
    },

    selectedDayText: {
      color: onPrimaryTextColor(theme),
    },

    markerRow: {
      position: 'absolute',

      bottom: 3,

      flexDirection: 'row',

      gap: 2,
    },

    marker: {
      width: 3.5,

      height: 3.5,

      borderRadius: 2,
    },

    spiritualMarkerBadge: {
      position: 'absolute',

      top: 2,

      right: 2,
    },

    /* ==========================================================
       INLINE LEGEND
    ========================================================== */

    inlineLegend: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      justifyContent:
        'center',

      gap: 9,

      marginTop: 9,

      paddingTop: 9,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        withAlpha(theme.colors.primary, 0.10),
    },

    inlineLegendItem: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    inlineLegendDot: {
      width: 7,

      height: 7,

      marginRight: 4,

      borderRadius: 4,
    },

    inlineTodayIndicator: {
      width: 15,

      height: 15,

      marginRight: 5,

      borderWidth: 1.5,

      borderColor:
        theme.colors.text,

      borderStyle:
        'dashed',

      borderRadius: 5,

      backgroundColor:
        'transparent',
    },

    inlineLegendText: {
      color:
        theme.colors.textSecondary,

      fontSize: 8.5,

      fontWeight: '600',
    },

    inlineLegendTextWithIcon: {
      marginLeft: 4,
    },

    /* ==========================================================
       SELECTED CARD
    ========================================================== */

    selectedCard: {
      ...theme.shadow,

      marginTop: 12,

      padding: 15,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 22,

      backgroundColor:
        theme.colors.surface,
    },

    selectedHeader: {
      flexDirection: 'row',

      alignItems: 'center',

      paddingBottom: 11,

      borderBottomWidth: 1,

      borderBottomColor:
        withAlpha(theme.colors.primary, 0.10),
    },

    selectedIcon: {
      width: 39,

      height: 39,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 10,

      borderRadius: 13,

      backgroundColor:
        theme.colors.primarySoft,
    },

    selectedTitle: {
      color:
        theme.colors.accent,

      fontFamily: 'serif',

      fontSize: 16,

      fontWeight: '800',
    },

    selectedDate: {
      marginTop: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 10,
    },

    pregnancyGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 8,

      marginTop: 12,
    },

    pregnancyInfo: {
      width: '48.5%',

      minWidth: 0,

      padding: 11,

      borderRadius: 15,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    pregnancyInfoWide: {
      width: '100%',
    },

    pregnancyInfoLabel: {
      color:
        theme.colors.textSecondary,

      fontSize: 9.5,
    },

    pregnancyInfoValue: {
      marginTop: 4,

      color:
        theme.colors.primary,

      fontSize: 12.5,

      fontWeight: '800',
    },

    /* ==========================================================
       DAILY INFO
    ========================================================== */

    dailyInfoGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 8,

      marginTop: 10,
    },

    dailyInfoItem: {
      width: '48.5%',

      minHeight: 66,

      flexDirection: 'row',

      alignItems: 'center',

      padding: 9,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 15,

      backgroundColor:
        theme.colors.surface,
    },

    dailyInfoItemWide: {
      width: '100%',
    },

    dailyInfoIcon: {
      width: 34,

      height: 34,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 8,

      borderRadius: 11,

      backgroundColor:
        theme.colors.primarySoft,
    },

    dailyInfoLabel: {
      color:
        theme.colors.accent,

      fontSize: 10.5,

      fontWeight: '800',
    },

    dailyInfoValue: {
      marginTop: 3,

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      lineHeight: 13,
    },

    /* ==========================================================
       UPCOMING
    ========================================================== */

    upcomingCard: {
      ...theme.shadow,

      marginTop: 12,

      padding: 15,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 21,

      backgroundColor:
        theme.colors.surface,
    },

    sectionTitle: {
      color:
        theme.colors.accent,

      fontFamily: 'serif',

      fontSize: 15.5,

      fontWeight: '800',
    },

    upcomingEmpty: {
      marginTop: 10,

      color:
        theme.colors.textSecondary,

      fontSize: 12,

      lineHeight: 17,
    },

    upcomingRow: {
      minHeight: 61,

      flexDirection: 'row',

      alignItems: 'center',

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        withAlpha(theme.colors.primary, 0.10),
    },

    lastRow: {
      borderBottomWidth: 0,
    },

    upcomingDate: {
      width: 43,

      height: 43,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 10,

      borderRadius: 13,
    },

    upcomingDay: {
      fontSize: 15,

      fontWeight: '800',
    },

    upcomingMonth: {
      color:
        theme.colors.textSecondary,

      fontSize: 8,

      textTransform:
        'uppercase',
    },

    upcomingTitle: {
      color:
        theme.colors.accent,

      fontSize: 12,

      fontWeight: '800',
    },

    upcomingMeta: {
      marginTop: 3,

      color:
        theme.colors.textSecondary,

      fontSize: 10,
    },

    /* ==========================================================
       MODAL
    ========================================================== */

    modalRoot: {
      flex: 1,

      justifyContent:
        'flex-end',
    },

    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(35,22,65,0.34)',
    },

    sheet: {
      maxHeight: '90%',

      paddingTop: 9,

      borderTopLeftRadius: 28,

      borderTopRightRadius: 28,

      backgroundColor:
        theme.colors.surface,

      overflow: 'hidden',
    },

    handle: {
      width: 44,

      height: 5,

      alignSelf: 'center',

      flexShrink: 0,

      borderRadius: 3,

      backgroundColor:
        withAlpha(theme.colors.primary, 0.30),
    },

    /* ==========================================================
       FILTER SHEET
    ========================================================== */

    filterSheet: {
      height: '88%',
    },

    filterScroll: {
      flex: 1,

      minHeight: 0,
    },

    filterSheetHeader: {
      flexShrink: 0,

      marginTop: 18,

      marginBottom: 10,

      paddingHorizontal: 22,
    },

    filterSheetTitle: {
      color:
        theme.colors.accent,

      fontFamily: 'serif',

      fontSize: 24,

      fontWeight: '800',
    },

    filterSheetSubtitle: {
      marginTop: 8,

      color:
        theme.colors.textSecondary,

      fontSize: 13,

      lineHeight: 18,
    },

    filterRows: {
      paddingHorizontal: 22,

      paddingBottom: 10,
    },

    filterRow: {
      minHeight: 66,

      flexDirection: 'row',

      alignItems: 'center',

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        withAlpha(theme.colors.primary, 0.10),
    },

    filterRowLast: {
      borderBottomWidth: 0,
    },

    filterIcon: {
      width: 44,

      height: 44,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 15,

      backgroundColor:
        theme.colors.primarySoft,
    },

    filterCopy: {
      flex: 1,

      minWidth: 0,

      marginHorizontal: 12,
    },

    filterTitle: {
      color:
        theme.colors.accent,

      fontSize: 13,

      fontWeight: '800',
    },

    filterDescription: {
      marginTop: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 10.5,

      lineHeight: 14,
    },

    switchTrack: {
      width: 42,

      height: 24,

      flexShrink: 0,

      justifyContent:
        'center',

      paddingHorizontal: 2,

      borderRadius: 13,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    switchTrackActive: {
      backgroundColor:
        theme.colors.primary,
    },

    switchThumb: {
      ...theme.shadow,

      width: 20,

      height: 20,

      borderRadius: 10,

      backgroundColor:
        theme.colors.surface,
    },

    switchThumbActive: {
      alignSelf:
        'flex-end',
    },

    filterFooter: {
      flexShrink: 0,

      paddingHorizontal: 22,

      paddingTop: 10,

      paddingBottom: 4,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        withAlpha(theme.colors.primary, 0.10),

      backgroundColor:
        theme.colors.surface,
    },

    doneButton: {
      height: 50,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 18,

      backgroundColor:
        theme.colors.primary,
    },

    doneText: {
      color: onPrimaryTextColor(theme),

      fontSize: 14,

      fontWeight: '800',
    },

    /* ==========================================================
       LEGEND — IMPORTANT FIX
    ========================================================== */

    legendSheet: {
      /*
       * Une vraie hauteur est réservée.
       * Ne pas utiliser seulement maxHeight.
       */
      height: '88%',

      paddingHorizontal: 0,
    },

    /*
     * Seulement cette partie peut défiler.
     * Le footer reste toujours visible.
     */
    legendScroll: {
      flex: 1,

      minHeight: 0,
    },

    legendScrollContent: {
      paddingHorizontal: 22,

      paddingTop: 4,

      paddingBottom: 16,
    },

    legendSheetHeader: {
      marginTop: 18,
    },

    legendSheetTitle: {
      color:
        theme.colors.accent,

      fontFamily: 'serif',

      fontSize: 24,

      fontWeight: '800',
    },

    legendSheetSubtitle: {
      marginTop: 7,

      color:
        theme.colors.textSecondary,

      fontSize: 13,
    },

    legendRows: {
      marginTop: 16,
    },

    legendRow: {
      minHeight: 88,

      flexDirection: 'row',

      alignItems: 'center',

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        withAlpha(theme.colors.primary, 0.10),
    },

    legendRowLast: {
      borderBottomWidth: 0,
    },

    legendLargeIcon: {
      width: 54,

      height: 54,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 18,

      backgroundColor:
        theme.colors.primarySoft,
    },

    legendDotLarge: {
      width: 11,

      height: 11,

      flexShrink: 0,

      marginLeft: 16,

      borderRadius: 6,
    },

    legendRowCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 14,
    },

    legendRowTitle: {
      color:
        theme.colors.accent,

      fontSize: 15,

      fontWeight: '800',
    },

    legendRowText: {
      marginTop: 4,

      color:
        theme.colors.textSecondary,

      fontSize: 11,

      lineHeight: 16,
    },

    /* ==========================================================
       TODAY LEGEND
    ========================================================== */

    todayLegend: {
      minHeight: 90,

      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 14,

      padding: 13,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 20,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    todayLegendPreview: {
      width: 52,

      height: 58,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 14,

      borderWidth: 1.8,

      borderColor:
        theme.colors.text,

      borderStyle:
        'dashed',

      borderRadius: 15,

      backgroundColor:
        theme.colors.surface,
    },

    todayLegendDay: {
      color:
        theme.colors.accent,

      fontSize: 17,

      fontWeight: '800',
    },

    todayLegendHijri: {
      marginTop: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 9,

      fontWeight: '600',
    },

    todayCopy: {
      flex: 1,

      minWidth: 0,
    },

    todayTitle: {
      color:
        theme.colors.accent,

      fontSize: 14,

      fontWeight: '800',
    },

    todayText: {
      marginTop: 4,

      color:
        theme.colors.textSecondary,

      fontSize: 11,

      lineHeight: 16,
    },

    /* ==========================================================
       LEGEND FOOTER — TOUJOURS VISIBLE
    ========================================================== */

    legendFooter: {
      flexShrink: 0,

      paddingHorizontal: 22,

      paddingTop: 10,

      paddingBottom: 4,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        withAlpha(theme.colors.primary, 0.10),

      backgroundColor:
        theme.colors.surface,
    },

    closeLegendButton: {
      width: '100%',

      height: 52,

      flexShrink: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 18,

      backgroundColor:
        theme.colors.primary,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.18,

      shadowRadius: 7,

      elevation: 5,
    },

    closeLegendText: {
      color: onPrimaryTextColor(theme),

      fontSize: 16,

      fontWeight: '800',
    },
  });
}

export default PregnancyCalendarContent;
