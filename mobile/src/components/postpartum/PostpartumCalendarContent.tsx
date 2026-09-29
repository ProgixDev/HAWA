import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import { TOP_SPACING_EXTRA, getFloatingTabBarClearance } from '../../theme/spacing';
import {
  loadPersonalInformation,
  type CalendarPreference,
} from '../../state/personalInformationStore';
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
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
} from '../../state/postpartumPreferences';
import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import { usePremium } from '../../hooks/usePremium';
import {useToday} from '../../hooks/useToday';
import {rollSelectedDate, rollVisibleMonth} from '../../utils/dayRollover';
import { HawaPremiumBottomSheet } from '../premium/HawaPremiumBottomSheet';
import { isMonthWithinHistoryAccess } from '../../utils/historyAccess';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import { computePostpartumStatus } from '../../utils/postpartumTrackingUtils';
import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
  subscribePostpartumJournal,
  type PostpartumJournalCategory,
  type PostpartumJournalEntry,
} from '../../state/postpartumJournalStore';
import { POSTPARTUM_JOURNAL_ITEMS } from '../../config/postpartumJournalConfig';
import {
  getAllPostpartumLochiaEntries,
  hydratePostpartumLochia,
  subscribePostpartumLochia,
  type PostpartumLochiaEntry,
} from '../../state/postpartumLochiaStore';
import {getAppLanguage} from '../../state/themePreferences';
import '../../i18n';

const dateFormatLocale = (): string => (getAppLanguage() === 'en' ? 'en-US' : 'fr-FR');

// Postpartum Calendar — a dedicated content branch for the ONE global
// Calendar tab (see ObjectiveAwareCalendarScreen.tsx). Same premium HAWA
// calendar design system as Cycle/Pregnancy/Miscarriage (month nav,
// Grégorien/Hijri/Double mode, header Filtres/Légende actions, filterable
// day markers, bottom-sheet Filtres/Légende, selected-day card) — but every
// category/label/marker is entirely Postpartum-specific, sourced only from
// data already in the project (postpartumJournalStore's 5 canonical
// categories + postpartumLochiaStore). Deliberately does NOT import or call
// cycleDayFor/phaseFor/fertileWindow/ovulation/predictedPeriod from
// cycleMath.ts, and does NOT reuse MonthCalendarCard.tsx (which is wired to
// Cycle's period/fertile/ovulation day-kind system) — Postpartum day is
// derived only from deliveryDate + the selected date.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Deliberately distinct from Cycle's period (pink)/fertile (green)/
// ovulation (purple) day-marker colors — see MonthCalendarCard.tsx, not
// reused here. Matches the rose accent PostpartumDashboard's own "Lochies
// aujourd'hui" icon already uses, for visual consistency within Postpartum.
const DELIVERY_COLOR = '#DC7B82';
// Same value every sibling calendar content (MenopauseCalendarContent.tsx,
// ContraceptionCalendarContent.tsx, ...) already uses for these two markers —
// never invented locally.
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

// Built inside each component via useMemo (needs the t() hook) instead of a
// static module-level array — see buildModes()/buildCategoryMeta() below.
function buildModes(t: (key: string) => string): Array<{ key: CalendarPreference; label: string }> {
  return [
    { key: 'gregorian', label: t('postpartumCalendar.modes.gregorian') },
    { key: 'hijri', label: t('postpartumCalendar.modes.hijri') },
    { key: 'double', label: t('postpartumCalendar.modes.double') },
  ];
}

/* ============================================================
   CATEGORY META — Lochies (postpartumLochiaStore) + the 5 real
   Postpartum Journal categories (postpartumJournalConfig.ts), the ONLY
   categories this calendar ever displays/filters. Labels/icons mirror the
   existing config exactly; nothing here is invented.
============================================================ */

type PostpartumCalendarCategory = PostpartumJournalCategory | 'lochia';

// Stable regardless of language — the insertion order CATEGORY_META used to
// derive via Object.keys() before its labels became translated.
const CATEGORY_KEYS: PostpartumCalendarCategory[] = [
  'lochia',
  'fatigue',
  'sleep',
  'mood',
  'pain',
  'physicalRecovery',
];

// Built inside each component via useMemo (needs the t() hook) instead of a
// static module-level record — same reasoning as buildModes() above.
function buildCategoryMeta(
  t: (key: string) => string,
): Record<
  PostpartumCalendarCategory,
  { label: string; description: string; icon: IconName; color: string }
> {
  return {
    lochia: {
      label: t('postpartumCalendar.categories.lochia.label'),
      description: t('postpartumCalendar.categories.lochia.description'),
      icon: 'water-outline',
      color: DELIVERY_COLOR,
    },
    fatigue: {
      label: t('postpartumCalendar.categories.fatigue.label'),
      description: t('postpartumCalendar.categories.fatigue.description'),
      icon: 'lightning-bolt-outline',
      color: '#8C6FD6',
    },
    sleep: {
      label: t('postpartumCalendar.categories.sleep.label'),
      description: t('postpartumCalendar.categories.sleep.description'),
      icon: 'weather-night',
      color: '#6F8FD1',
    },
    mood: {
      label: t('postpartumCalendar.categories.mood.label'),
      description: t('postpartumCalendar.categories.mood.description'),
      icon: 'heart-outline',
      color: '#D889AE',
    },
    pain: {
      label: t('postpartumCalendar.categories.pain.label'),
      description: t('postpartumCalendar.categories.pain.description'),
      icon: 'heat-wave',
      color: '#D79A55',
    },
    physicalRecovery: {
      label: t('postpartumCalendar.categories.physicalRecovery.label'),
      description: t('postpartumCalendar.categories.physicalRecovery.description'),
      icon: 'heart-pulse',
      // Category identity color, fixed like every other entry above — same
      // value as RAMADAN_MARKER_COLOR/theme.colors.primary's current
      // default, but never theme-driven.
      color: '#6D4AE8',
    },
  };
}

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');
const backgroundColorStyle = (backgroundColor: string) => ({ backgroundColor });

/* ============================================================
   DAY MARKERS — only categories with real saved data ever appear;
   never a fabricated value.
============================================================ */

function categoriesPresent(
  entry: PostpartumJournalEntry | undefined,
  lochiaEntry: PostpartumLochiaEntry | undefined,
): PostpartumCalendarCategory[] {
  const present: PostpartumCalendarCategory[] = [];
  if (lochiaEntry) {
    present.push('lochia');
  }
  for (const item of POSTPARTUM_JOURNAL_ITEMS) {
    if (entry?.[item.key]) {
      present.push(item.key);
    }
  }
  return present;
}

function PostpartumCalendarContent(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const modes = useMemo(() => buildModes(t), [t]);
  const categoryMeta = useMemo(() => buildCategoryMeta(t), [t]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { open: openPostpartumJournal } = useJournalSheet();
  // Re-evaluated when the day changes / the app returns to the foreground —
  // see src/hooks/useToday.ts.
  const {today} = useToday();

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const { isPremium } = usePremium();
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
  const [displayMode, setDisplayMode] = useState<CalendarPreference>('double');
  const [sheet, setSheet] = useState<'filters' | 'legend' | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<
    Set<PostpartumCalendarCategory>
  >(() => new Set(CATEGORY_KEYS));
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(getSpiritualMarkersEnabled);

  // Canonical delivery date — src/state/postpartumPreferences.ts, the same
  // source PostpartumDashboard reads. Never hardcoded.
  const [postpartum, setPostpartum] = useState(getPostpartumPreferences);
  useEffect(() => {
    let active = true;
    hydratePostpartumPreferences().then(value => {
      if (active) {
        setPostpartum(value);
      }
    });
    const unsubscribe = subscribePostpartumPreferences(() => {
      if (active) {
        setPostpartum(getPostpartumPreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const deliveryDate = useMemo(
    () =>
      postpartum.deliveryDate
        ? startOfDay(new Date(`${postpartum.deliveryDate}T12:00:00`))
        : null,
    [postpartum.deliveryDate],
  );

  // Same shared Grégorien/Hijri/Double preference Cycle/Pregnancy/Miscarriage
  // calendars already read — reusing the existing architecture, not
  // reimplementing it.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(info => {
        if (mounted) {
          setDisplayMode(info.calendar);
        }
      });
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
      return () => {
        mounted = false;
      };
    }, []),
  );

  // Postpartum's OWN daily tracking (src/state/postpartumJournalStore.ts) —
  // never Cycle's dailyJournalStore or Pregnancy's/Miscarriage's own
  // journals.
  const [entries, setEntries] = useState(getAllPostpartumJournalEntries);
  const [lochiaEntries, setLochiaEntries] = useState<
    Record<string, PostpartumLochiaEntry>
  >({});
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePostpartumJournal().then(() => {
        if (active) {
          setEntries(getAllPostpartumJournalEntries());
        }
      });
      const unsubscribe = subscribePostpartumJournal(() => {
        if (active) {
          setEntries(getAllPostpartumJournalEntries());
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePostpartumLochia().then(() => {
        if (active) {
          setLochiaEntries(getAllPostpartumLochiaEntries());
        }
      });
      const unsubscribe = subscribePostpartumLochia(() => {
        if (active) {
          setLochiaEntries(getAllPostpartumLochiaEntries());
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from(
        { length: count },
        (_, index) => new Date(year, month, index + 1),
      ),
    ];
  }, [visibleMonth]);

  const monthTitle = capitalize(
    new Intl.DateTimeFormat(dateFormatLocale(), { month: 'long', year: 'numeric' }).format(
      visibleMonth,
    ),
  );
  // Hijri day labels / Hijri month range / Hijri selected-day text are part of
  // the "Calendrier hijri" feature the spiritual-markers toggle controls
  // (SpiritualPreferencesScreen: "Calendrier hijri, prières, jeûne, état de
  // pureté…"; Profile shows "Date hijri: Désactivé" when off). They therefore
  // require BOTH the toggle AND the separate Grégorien/Hijri/Double display
  // preference (which is only hidden — never reset — while the toggle is off).
  const showHijri = spiritualMarkersEnabled && displayMode !== 'gregorian';
  const hijriMonthLabel = showHijri
    ? formatHijriMonthYear(visibleMonth)
    : undefined;

  const selectedTitle = capitalize(
    new Intl.DateTimeFormat(dateFormatLocale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(selectedDate),
  );
  const selectedKey = dateKey(selectedDate);
  const selectedEntry = entries[selectedKey];
  const selectedLochia = lochiaEntries[selectedKey];
  const isFirstPeriodSelected =
    postpartum.firstPostpartumPeriodDate === selectedKey;
  const isTodaySelected = sameDay(selectedDate, today);

  // Postpartum day is derived ONLY from deliveryDate + the selected date —
  // never cycleDayFor/phaseFor/fertileWindow/ovulation/predictedPeriod.
  // computePostpartumStatus clamps negative differences to day 1, so
  // "before delivery" is detected independently here rather than trusted
  // from its output.
  const rawDiffFromDelivery = deliveryDate
    ? diffDays(startOfDay(selectedDate), deliveryDate)
    : null;
  const isBeforeDelivery =
    rawDiffFromDelivery !== null && rawDiffFromDelivery < 0;
  const selectedStatus = useMemo(
    () => computePostpartumStatus(deliveryDate, selectedDate),
    [deliveryDate, selectedDate],
  );
  const showPostpartumDay = selectedStatus.configured && !isBeforeDelivery;
  const isDeliveryDaySelected =
    Boolean(deliveryDate) && sameDay(selectedDate, deliveryDate as Date);

  const toggleFilter = (key: PostpartumCalendarCategory) => {
    setVisibleFilters(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Only the Postpartum Journal's 5 real canonical categories (Fatigue /
  // Sommeil / Humeur / Douleurs / Récupération physique) — Pregnancy's
  // Symptômes/Poids/Informations médicales never appear here, see
  // postpartumJournalConfig.ts. Rows are only built when real data exists;
  // never a fabricated value. All 5 fields are plain strings, so no
  // per-category formatting is needed (unlike the old Symptômes/Poids shape).
  const selectedJournalRows = useMemo(() => {
    const rows: Array<{
      key: PostpartumJournalCategory;
      icon: IconName;
      label: string;
      value: string;
    }> = [];
    for (const item of POSTPARTUM_JOURNAL_ITEMS) {
      const raw = selectedEntry?.[item.key];
      if (raw === undefined) {
        continue;
      }
      rows.push({
        key: item.key,
        icon: item.icon,
        label: item.label,
        // DATA-BEARING: `raw` is the persisted PostpartumJournalEntry field
        // value — one of POSTPARTUM_MOOD/SLEEP/FATIGUE/PAIN/RECOVERY_OPTIONS'
        // raw French strings (postpartumJournalConfig.ts), stored as-is with
        // no separate stable id. Left untranslated here — same accepted
        // trade-off as IrregularCalendarContent.tsx's own DATA-BEARING rows.
        value: String(raw),
      });
    }
    return rows;
  }, [selectedEntry]);

  // Filters only hide/show rows that already have real data — never affect
  // whether the data itself exists.
  const visibleJournalRows = useMemo(
    () => selectedJournalRows.filter(row => visibleFilters.has(row.key)),
    [selectedJournalRows, visibleFilters],
  );
  const showLochiaRow = visibleFilters.has('lochia');
  const hasAnyVisibleData =
    visibleJournalRows.length > 0 || (showLochiaRow && Boolean(selectedLochia));

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: getFloatingTabBarClearance(insets.bottom, 30) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t('postpartumCalendar.header.title')}</Text>
              <Text style={styles.subtitle}>{t('postpartumCalendar.header.subtitle')}</Text>
            </View>

            <HeaderAction
              icon="tune-variant"
              label={t('calendar.filters')}
              onPress={() => setSheet('filters')}
            />
            <HeaderAction
              icon="format-list-bulleted"
              label={t('calendar.legend')}
              onPress={() => setSheet('legend')}
            />
          </View>

          {/* CALENDAR CARD */}
          <View style={styles.calendarCard}>
            {spiritualMarkersEnabled ? (
            <View style={styles.modeRow}>
              {modes.map(mode => (
                <Pressable
                  accessibilityRole="button"
                  key={mode.key}
                  onPress={() => setDisplayMode(mode.key)}
                  style={[
                    styles.modeButton,
                    displayMode === mode.key && styles.modeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      displayMode === mode.key && styles.modeTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            ) : null}

            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel={t('calendar.previousMonth')}
                accessibilityRole="button"
                onPress={goToPreviousMonth}
                style={styles.arrowButton}
              >
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-left"
                  size={23}
                />
              </Pressable>

              <View style={styles.monthCopy}>
                <Text style={styles.monthTitle}>{monthTitle}</Text>
                {hijriMonthLabel ? (
                  <Text style={styles.hijriMonth}>{hijriMonthLabel}</Text>
                ) : null}
              </View>

              <Pressable
                accessibilityLabel={t('calendar.nextMonth')}
                accessibilityRole="button"
                onPress={goToNextMonth}
                style={styles.arrowButton}
              >
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-right"
                  size={23}
                />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const selected = sameDay(date, selectedDate);
                const isToday = sameDay(date, today);
                const isDelivery =
                  Boolean(deliveryDate) && sameDay(date, deliveryDate as Date);
                const isPostpartumDay =
                  Boolean(deliveryDate) &&
                  diffDays(date, deliveryDate as Date) >= 0;
                const markers = categoriesPresent(
                  entries[dateKey(date)],
                  lochiaEntries[dateKey(date)],
                ).filter(key => visibleFilters.has(key));
                // Never white-out text/markers on Today — it keeps a
                // neutral fill (styles.todayDayBorder) with no strong-colored
                // background left to contrast against.
                const lightText = (selected || isDelivery) && !isToday;

                // Visible regardless of displayMode — reuses the exact
                // canonical per-date Hijri helpers (see MonthCalendarCard.tsx,
                // no new conversion logic). Independent corner channel from
                // the marker dots below.
                const spiritualMonth = !spiritualMarkersEnabled
                  ? null
                  : isRamadan(date)
                    ? 'ramadan'
                    : isDhoulHijja(date)
                      ? 'dhoulHijja'
                      : null;
                const spiritualMarkerColor = lightText
                  ? onPrimaryTextColor(theme)
                  : spiritualMonth === 'ramadan'
                    ? RAMADAN_MARKER_COLOR
                    : DHOUL_HIJJA_MARKER_COLOR;
                const spiritualMarkerLabel =
                  spiritualMonth === 'ramadan'
                    ? t('postpartumCalendar.dayAccessibility.ramadan')
                    : spiritualMonth === 'dhoulHijja'
                      ? t('postpartumCalendar.dayAccessibility.dhoulHijja')
                      : '';

                return (
                  <View key={date.toISOString()} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()} ${monthTitle}${
                        isDelivery ? t('postpartumCalendar.dayAccessibility.delivery') : ''
                      }${spiritualMarkerLabel}`}
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date)}
                      style={[
                        styles.dayButton,
                        isPostpartumDay &&
                          !isDelivery &&
                          !selected &&
                          !isToday &&
                          styles.trackingDay,
                        // TODAY always wins over delivery/selected backgrounds
                        // so the dashed outline and journal markers stay legible.
                        isDelivery && !selected && !isToday && styles.deliveryDay,
                        selected && !isToday && styles.selectedDay,
                        isToday && styles.todayDayBorder,
                      ]}
                    >
                      {spiritualMonth ? (
                        <View pointerEvents="none" style={styles.spiritualMarkerBadge}>
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
                          lightText && styles.dayTextLight,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {showHijri ? (
                        <Text
                          style={[
                            styles.hijriDay,
                            lightText && styles.dayTextLight,
                          ]}
                        >
                          {formatHijriDay(date)}
                        </Text>
                      ) : null}
                      {markers.length > 0 ? (
                        <View style={styles.markerRow}>
                          {markers.slice(0, 4).map(key => (
                            <View
                              key={key}
                              style={[
                                styles.marker,
                                backgroundColorStyle(
                                  lightText
                                    ? onPrimaryTextColor(theme)
                                    : categoryMeta[key].color,
                                ),
                              ]}
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
                  <View
                    style={[
                      styles.inlineLegendDot,
                      backgroundColorStyle(categoryMeta[key].color),
                    ]}
                  />
                  <Text style={styles.inlineLegendText}>
                    {categoryMeta[key].label}
                  </Text>
                </View>
              ))}
              <View style={styles.inlineLegendItem}>
                <View style={styles.inlineTodayIndicator} />
                <Text style={styles.inlineLegendText}>{t('cycleHome.todayLabel')}</Text>
              </View>
              {spiritualMarkersEnabled ? (
                <>
                  <View style={styles.inlineLegendItem}>
                    <MaterialDesignIcons color={RAMADAN_MARKER_COLOR} name="moon-waning-crescent" size={11} />
                    <Text style={[styles.inlineLegendText, styles.inlineLegendTextWithIcon]}>{t('postpartumCalendar.ramadan')}</Text>
                  </View>
                  <View style={styles.inlineLegendItem}>
                    <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={11} />
                    <Text style={[styles.inlineLegendText, styles.inlineLegendTextWithIcon]}>{t('postpartumCalendar.dhoulHijja')}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* SELECTED DAY CARD */}
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="calendar-heart"
                  size={21}
                />
              </View>
              <View style={styles.flexCopy}>
                <Text style={styles.selectedTitle}>{selectedTitle}</Text>
                <Text style={styles.selectedDate}>
                  {formatFullDate(selectedDate)}
                  {showHijri ? ` · ${formatHijriDate(selectedDate) ?? ''}` : ''}
                </Text>
              </View>
            </View>

            {!showPostpartumDay ? (
              <View style={styles.neutralBox}>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="information-outline"
                  size={19}
                />
                <Text style={styles.neutralText}>
                  {selectedStatus.configured
                    ? t('postpartumCalendar.selected.beforeTracking')
                    : t('postpartumCalendar.selected.notConfigured')}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.dayBadgeRow}>
                  <View style={styles.dayBadge}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="flower-outline"
                      size={14}
                    />
                    <Text style={styles.dayBadgeText}>
                      {t('postpartumCalendar.selected.dayBadge', {day: selectedStatus.postpartumDay})}
                    </Text>
                  </View>
                  {isDeliveryDaySelected ? (
                    <View style={styles.deliveryBadge}>
                      <MaterialDesignIcons
                        color={DELIVERY_COLOR}
                        name="flower"
                        size={14}
                      />
                      <Text style={styles.deliveryBadgeText}>{t('postpartumCalendar.selected.delivery')}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.dataRows}>
                  {showLochiaRow ? (
                    <Pressable
                      accessibilityLabel={t('postpartumCalendar.categories.lochia.label')}
                      accessibilityRole="button"
                      onPress={() => navigation.navigate('PostpartumLochia')}
                      style={({ pressed }) => [
                        styles.dataRow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={[styles.dataRowIcon, styles.lochiesIcon]}>
                        <MaterialDesignIcons
                          color={DELIVERY_COLOR}
                          name="water-outline"
                          size={18}
                        />
                      </View>
                      <View style={styles.flexCopy}>
                        <Text style={styles.dataRowLabel}>{t('postpartumCalendar.categories.lochia.label')}</Text>
                        <Text style={styles.dataRowValue}>
                          {selectedLochia
                            // DATA-BEARING: selectedLochia.flow/.color are raw
                            // French strings persisted as-is by
                            // postpartumLochiaStore — never translated here,
                            // same as PostpartumDashboard.tsx's identical value.
                            ? `${selectedLochia.flow} · ${selectedLochia.color}`
                            : t('postpartumCalendar.selected.lochiaEmpty')}
                        </Text>
                      </View>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name="chevron-right"
                        size={18}
                      />
                    </Pressable>
                  ) : null}

                  {isFirstPeriodSelected ? (
                    <View style={styles.dataRow}>
                      <View style={[styles.dataRowIcon, styles.lochiesIcon]}>
                        <MaterialDesignIcons
                          color={DELIVERY_COLOR}
                          name="calendar-heart"
                          size={18}
                        />
                      </View>
                      <View style={styles.flexCopy}>
                        <Text style={styles.dataRowLabel}>{t('postpartumCalendar.selected.cycleReturnTitle')}</Text>
                        <Text style={styles.dataRowValue}>
                          {t('postpartumCalendar.selected.cycleReturnValue')}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {visibleJournalRows.length > 0
                    ? visibleJournalRows.map(row => (
                        <View key={row.key} style={styles.dataRow}>
                          <View style={styles.dataRowIcon}>
                            <MaterialDesignIcons
                              color={theme.colors.primary}
                              name={row.icon}
                              size={18}
                            />
                          </View>
                          <View style={styles.flexCopy}>
                            <Text style={styles.dataRowLabel}>{row.label}</Text>
                            <Text numberOfLines={2} style={styles.dataRowValue}>
                              {row.value}
                            </Text>
                          </View>
                        </View>
                      ))
                    : !hasAnyVisibleData && !isFirstPeriodSelected ? (
                        <View style={styles.emptyBox}>
                          <MaterialDesignIcons
                            color={theme.colors.textSecondary}
                            name="information-outline"
                            size={19}
                          />
                          <Text style={styles.emptyText}>
                            {t('postpartumCalendar.selected.emptyText')}
                          </Text>
                          {isTodaySelected ? (
                            <Pressable
                              accessibilityLabel={t('postpartumCalendar.selected.addToJournal')}
                              accessibilityRole="button"
                              onPress={openPostpartumJournal}
                              style={({ pressed }) => [
                                styles.addButton,
                                pressed && styles.pressed,
                              ]}
                            >
                              <MaterialDesignIcons
                                color={onPrimaryTextColor(theme)}
                                name="plus"
                                size={16}
                              />
                              <Text style={styles.addButtonText}>
                                {t('postpartumCalendar.selected.addToJournal')}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      ) : null}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* SHEET */}
        <PostpartumCalendarSheet
          mode={sheet}
          onClose={() => setSheet(null)}
          onToggle={toggleFilter}
          showHijri={showHijri}
          showSpiritualMarkers={spiritualMarkersEnabled}
          today={today}
          visibleFilters={visibleFilters}
        />

        <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
      </SafeAreaView>
    </LinearGradient>
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
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
    >
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      <Text style={styles.headerActionLabel}>{label}</Text>
    </Pressable>
  );
}

/* ============================================================
   CALENDAR SHEET — Filtres / Légende, same premium bottom-sheet
   pattern as the other objectives' calendars. The Légende sheet's
   footer ("Fermer") stays flexShrink:0 below a scrollable list, so
   it can never be hidden behind the Android nav bar/tab bar.
============================================================ */

function PostpartumCalendarSheet({
  mode,
  onClose,
  onToggle,
  visibleFilters,
  today,
  showHijri,
  showSpiritualMarkers,
}: {
  mode: 'filters' | 'legend' | null;
  onClose: () => void;
  onToggle: (key: PostpartumCalendarCategory) => void;
  visibleFilters: Set<PostpartumCalendarCategory>;
  today: Date;
  showHijri: boolean;
  showSpiritualMarkers: boolean;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const categoryMeta = useMemo(() => buildCategoryMeta(t), [t]);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={mode !== null}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={styles.backdrop}
        />

        {mode === 'legend' ? (
          <View
            style={[
              styles.sheet,
              styles.legendSheet,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <View style={styles.handle} />

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.legendScrollContent}
              showsVerticalScrollIndicator={false}
              style={styles.legendScroll}
            >
              <View style={styles.legendSheetHeader}>
                <Text style={styles.legendSheetTitle}>
                  {t('postpartumCalendar.legend.title')}
                </Text>
                <Text style={styles.legendSheetSubtitle}>
                  {t('postpartumCalendar.legend.subtitle')}
                </Text>
              </View>

              <View style={styles.legendRows}>
                {CATEGORY_KEYS.map((key, index) => {
                  const meta = categoryMeta[key];
                  return (
                    <View
                      key={key}
                      style={[
                        styles.legendRow,
                        index === CATEGORY_KEYS.length - 1 &&
                          !showSpiritualMarkers &&
                          styles.legendRowLast,
                      ]}
                    >
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
                          name={meta.icon}
                          size={27}
                        />
                      </View>
                      <View
                        style={[
                          styles.legendDotLarge,
                          backgroundColorStyle(meta.color),
                        ]}
                      />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>{meta.label}</Text>
                        <Text style={styles.legendRowText}>
                          {meta.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {showSpiritualMarkers ? (
                  <>
                    <View style={styles.legendRow}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons color={RAMADAN_MARKER_COLOR} name="moon-waning-crescent" size={27} />
                      </View>
                      <View style={[styles.legendDotLarge, backgroundColorStyle(RAMADAN_MARKER_COLOR)]} />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>{t('postpartumCalendar.ramadan')}</Text>
                        <Text style={styles.legendRowText}>{t('postpartumCalendar.legend.ramadanDescription')}</Text>
                      </View>
                    </View>
                    <View style={[styles.legendRow, styles.legendRowLast]}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={27} />
                      </View>
                      <View style={[styles.legendDotLarge, backgroundColorStyle(DHOUL_HIJJA_MARKER_COLOR)]} />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>{t('postpartumCalendar.dhoulHijja')}</Text>
                        <Text style={styles.legendRowText}>{t('postpartumCalendar.legend.dhoulHijjaDescription')}</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.todayLegend}>
                <View style={styles.todayLegendPreview}>
                  <Text style={styles.todayLegendDay}>{today.getDate()}</Text>
                  {showHijri ? (
                    <Text style={styles.todayLegendHijri}>
                      {formatHijriDay(today)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.todayCopy}>
                  <Text style={styles.todayTitle}>{t('cycleHome.todayLabel')}</Text>
                  <Text style={styles.todayText}>
                    {t('postpartumCalendar.legend.todayDescription')}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.legendFooter}>
              <Pressable
                accessibilityLabel={t('calendar.closeLegend')}
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeLegendButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeLegendText}>{t('common.close')}</Text>
              </Pressable>
            </View>
          </View>
        ) : mode === 'filters' ? (
          <View
            style={[
              styles.sheet,
              styles.filterSheet,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>{t('postpartumCalendar.filters.title')}</Text>
              <Text style={styles.filterSheetSubtitle}>
                {t('postpartumCalendar.filters.subtitle')}
              </Text>
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.filterRows}
              showsVerticalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {CATEGORY_KEYS.map((key, index) => {
                const meta = categoryMeta[key];
                const active = visibleFilters.has(key);
                return (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: active }}
                    key={key}
                    onPress={() => onToggle(key)}
                    style={[
                      styles.filterRow,
                      index === CATEGORY_KEYS.length - 1 &&
                        styles.filterRowLast,
                    ]}
                  >
                    <View style={styles.filterIcon}>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name={meta.icon}
                        size={24}
                      />
                    </View>
                    <View style={styles.filterCopy}>
                      <Text style={styles.filterTitle}>{meta.label}</Text>
                      <Text style={styles.filterDescription}>
                        {meta.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.switchTrack,
                        active && styles.switchTrackActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.switchThumb,
                          active && styles.switchThumbActive,
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.filterFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.doneButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doneText}>{t('cycleHome.quickActions.done')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: { flex: 1, backgroundColor: theme.colors.background },

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

  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA },
  flexCopy: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.78 },

  /* HEADER */
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 10.5 },
  headerAction: {
    ...theme.shadow,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
  },
  headerActionLabel: {
    marginTop: 2,
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '800',
  },

  /* CALENDAR */
  calendarCard: {
    ...theme.shadow,
    padding: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 23,
    backgroundColor: theme.colors.surface,
  },
  modeRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  modeButtonActive: { backgroundColor: theme.colors.primary },
  modeText: {
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  modeTextActive: { color: onPrimaryTextColor(theme) },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 11,
  },
  arrowButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  monthCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  monthTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },
  hijriMonth: { marginTop: 1, color: theme.colors.textSecondary, fontSize: 9 },

  weekRow: { flexDirection: 'row' },
  weekDay: {
    width: '14.2857%',
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: '88%',
    height: '91%',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayText: { color: theme.colors.accent, fontSize: 12, fontWeight: '700' },
  dayTextLight: { color: onPrimaryTextColor(theme) },
  hijriDay: { marginTop: 1, color: theme.colors.textSecondary, fontSize: 7 },

  trackingDay: { backgroundColor: theme.colors.primarySoft },
  deliveryDay: { backgroundColor: DELIVERY_COLOR },
  selectedDay: { backgroundColor: theme.colors.primary },
  todayDayBorder: {
    // Neutral fill — always wins over delivery/selected backgrounds so the
    // dashed outline and journal markers stay legible.
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1.7,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: 13,
  },

  markerRow: { position: 'absolute', bottom: 3, flexDirection: 'row', gap: 2 },
  marker: { width: 3.5, height: 3.5, borderRadius: 2 },
  spiritualMarkerBadge: { position: 'absolute', top: 2, right: 2 },

  /* INLINE LEGEND */
  inlineLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.10),
  },
  inlineLegendItem: { flexDirection: 'row', alignItems: 'center' },
  inlineLegendDot: { width: 7, height: 7, marginRight: 4, borderRadius: 4 },
  inlineTodayIndicator: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: 5,
  },
  inlineLegendText: {
    color: theme.colors.textSecondary,
    fontSize: 8.5,
    fontWeight: '600',
  },
  inlineLegendTextWithIcon: { marginLeft: 4 },

  /* SELECTED CARD */
  selectedCard: {
    ...theme.shadow,
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  selectedIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
  },
  selectedTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },
  selectedDate: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 10 },

  neutralBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 13,
    padding: 13,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  neutralText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  dayBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayBadgeText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 13,
    backgroundColor: '#F8E3E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deliveryBadgeText: { color: DELIVERY_COLOR, fontSize: 12, fontWeight: '800' },

  dataRows: { marginTop: 12, gap: 8 },
  dataRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
  },
  dataRowIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
  },
  lochiesIcon: { backgroundColor: '#FCEEEF' },
  dataRowLabel: {
    color: theme.colors.accent,
    fontSize: 12.5,
    fontWeight: '800',
  },
  dataRowValue: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  emptyBox: {
    alignItems: 'center',
    marginTop: 4,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  emptyText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
  },
  addButtonText: { color: onPrimaryTextColor(theme), fontSize: 12.5, fontWeight: '800' },

  /* MODAL */
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  // Fixed modal scrim — never themed, same precedent as every migrated screen.
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35,22,65,0.34)',
  },
  sheet: {
    maxHeight: '90%',
    paddingTop: 9,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  handle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    flexShrink: 0,
    borderRadius: 3,
    backgroundColor: withAlpha(theme.colors.primary, 0.30),
  },

  /* FILTER SHEET */
  filterSheet: { height: '88%' },
  filterScroll: { flex: 1, minHeight: 0 },
  filterSheetHeader: {
    flexShrink: 0,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 22,
  },
  filterSheetTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  filterSheetSubtitle: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  filterRows: { paddingHorizontal: 22, paddingBottom: 10 },
  filterRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  filterRowLast: { borderBottomWidth: 0 },
  filterIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
  },
  filterCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  filterTitle: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  filterDescription: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },
  switchTrack: {
    width: 42,
    height: 24,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  switchTrackActive: { backgroundColor: theme.colors.primary },
  switchThumb: {
    ...theme.shadow,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  switchThumbActive: { alignSelf: 'flex-end' },
  filterFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.10),
    backgroundColor: theme.colors.surface,
  },
  doneButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
  },
  doneText: { color: onPrimaryTextColor(theme), fontSize: 14, fontWeight: '800' },

  /* LEGEND SHEET */
  legendSheet: { height: '88%', paddingHorizontal: 0 },
  legendScroll: { flex: 1, minHeight: 0 },
  legendScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 16,
  },
  legendSheetHeader: { marginTop: 18 },
  legendSheetTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  legendSheetSubtitle: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  legendRows: { marginTop: 16 },
  legendRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  legendRowLast: { borderBottomWidth: 0 },
  legendLargeIcon: {
    width: 54,
    height: 54,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
  },
  legendDotLarge: {
    width: 11,
    height: 11,
    flexShrink: 0,
    marginLeft: 16,
    borderRadius: 6,
  },
  legendRowCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  legendRowTitle: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  legendRowText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  todayLegend: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  todayLegendPreview: {
    width: 52,
    height: 58,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.8,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },
  todayLegendDay: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  todayLegendHijri: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  todayCopy: { flex: 1, minWidth: 0 },
  todayTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  todayText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  legendFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.10),
    backgroundColor: theme.colors.surface,
  },
  closeLegendButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
  },
  closeLegendText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  });
}

export default PostpartumCalendarContent;
