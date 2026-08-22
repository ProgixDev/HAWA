import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import { homeColors, homeShadow } from '../home/homeTheme';
import { TOP_SPACING_EXTRA } from '../../theme/spacing';
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

const MODES: Array<{ key: CalendarPreference; label: string }> = [
  { key: 'gregorian', label: 'Grégorien' },
  { key: 'hijri', label: 'Hijri' },
  { key: 'double', label: 'Double' },
];

/* ============================================================
   CATEGORY META — Lochies (postpartumLochiaStore) + the 5 real
   Postpartum Journal categories (postpartumJournalConfig.ts), the ONLY
   categories this calendar ever displays/filters. Labels/icons mirror the
   existing config exactly; nothing here is invented.
============================================================ */

type PostpartumCalendarCategory = PostpartumJournalCategory | 'lochia';

const CATEGORY_META: Record<
  PostpartumCalendarCategory,
  { label: string; description: string; icon: IconName; color: string }
> = {
  lochia: {
    label: 'Lochies',
    description: 'Flux et couleur des lochies enregistrés dans ton suivi.',
    icon: 'water-outline',
    color: DELIVERY_COLOR,
  },
  fatigue: {
    label: 'Fatigue',
    description: 'Évalue ton niveau de fatigue aujourd’hui',
    icon: 'lightning-bolt-outline',
    color: '#8C6FD6',
  },
  sleep: {
    label: 'Sommeil',
    description: 'Durée et qualité de ton sommeil',
    icon: 'weather-night',
    color: '#6F8FD1',
  },
  mood: {
    label: 'Humeur',
    description: 'Comment te sens-tu aujourd’hui ?',
    icon: 'heart-outline',
    color: '#D889AE',
  },
  pain: {
    label: 'Douleurs',
    description: 'Note les douleurs que tu ressens aujourd’hui',
    icon: 'heat-wave',
    color: '#D79A55',
  },
  physicalRecovery: {
    label: 'Récupération physique',
    description: 'Comment progresse ta récupération ?',
    icon: 'heart-pulse',
    color: homeColors.primary,
  },
};

const CATEGORY_KEYS = Object.keys(
  CATEGORY_META,
) as PostpartumCalendarCategory[];

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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { open: openPostpartumJournal } = useJournalSheet();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayMode, setDisplayMode] = useState<CalendarPreference>('double');
  const [sheet, setSheet] = useState<'filters' | 'legend' | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<
    Set<PostpartumCalendarCategory>
  >(() => new Set(CATEGORY_KEYS));

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
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
      visibleMonth,
    ),
  );
  const showHijri = displayMode !== 'gregorian';
  const hijriMonthLabel = showHijri
    ? formatHijriMonthYear(visibleMonth)
    : undefined;

  const selectedTitle = capitalize(
    new Intl.DateTimeFormat('fr-FR', {
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
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
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
          barStyle="dark-content"
          translucent
        />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Calendrier</Text>
              <Text style={styles.subtitle}>Suis ton parcours post-partum</Text>
            </View>

            <HeaderAction
              icon="tune-variant"
              label="Filtres"
              onPress={() => setSheet('filters')}
            />
            <HeaderAction
              icon="format-list-bulleted"
              label="Légende"
              onPress={() => setSheet('legend')}
            />
          </View>

          {/* CALENDAR CARD */}
          <View style={styles.calendarCard}>
            <View style={styles.modeRow}>
              {MODES.map(mode => (
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

            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                onPress={() =>
                  setVisibleMonth(
                    current =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1,
                      ),
                  )
                }
                style={styles.arrowButton}
              >
                <MaterialDesignIcons
                  color={homeColors.primary}
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
                accessibilityLabel="Mois suivant"
                onPress={() =>
                  setVisibleMonth(
                    current =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1,
                      ),
                  )
                }
                style={styles.arrowButton}
              >
                <MaterialDesignIcons
                  color={homeColors.primary}
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

                return (
                  <View key={date.toISOString()} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()} ${monthTitle}${
                        isDelivery ? ', accouchement' : ''
                      }`}
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
                                    ? '#FFFFFF'
                                    : CATEGORY_META[key].color,
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
                      backgroundColorStyle(CATEGORY_META[key].color),
                    ]}
                  />
                  <Text style={styles.inlineLegendText}>
                    {CATEGORY_META[key].label}
                  </Text>
                </View>
              ))}
              <View style={styles.inlineLegendItem}>
                <View style={styles.inlineTodayIndicator} />
                <Text style={styles.inlineLegendText}>Aujourd’hui</Text>
              </View>
            </View>
          </View>

          {/* SELECTED DAY CARD */}
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedIcon}>
                <MaterialDesignIcons
                  color={homeColors.primary}
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
                  color={homeColors.textSecondary}
                  name="information-outline"
                  size={19}
                />
                <Text style={styles.neutralText}>
                  {selectedStatus.configured
                    ? 'Cette date précède le début de ton suivi post-partum.'
                    : 'Renseigne ta date d’accouchement pour activer ton suivi post-partum.'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.dayBadgeRow}>
                  <View style={styles.dayBadge}>
                    <MaterialDesignIcons
                      color={homeColors.primary}
                      name="flower-outline"
                      size={14}
                    />
                    <Text style={styles.dayBadgeText}>
                      Jour {selectedStatus.postpartumDay} post-partum
                    </Text>
                  </View>
                  {isDeliveryDaySelected ? (
                    <View style={styles.deliveryBadge}>
                      <MaterialDesignIcons
                        color={DELIVERY_COLOR}
                        name="flower"
                        size={14}
                      />
                      <Text style={styles.deliveryBadgeText}>Accouchement</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.dataRows}>
                  {showLochiaRow ? (
                    <Pressable
                      accessibilityLabel="Lochies"
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
                        <Text style={styles.dataRowLabel}>Lochies</Text>
                        <Text style={styles.dataRowValue}>
                          {selectedLochia
                            ? `${selectedLochia.flow} · ${selectedLochia.color}`
                            : 'Non renseigné'}
                        </Text>
                      </View>
                      <MaterialDesignIcons
                        color={homeColors.primary}
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
                        <Text style={styles.dataRowLabel}>Retour du cycle</Text>
                        <Text style={styles.dataRowValue}>
                          Premières règles post-partum enregistrées
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {visibleJournalRows.length > 0
                    ? visibleJournalRows.map(row => (
                        <View key={row.key} style={styles.dataRow}>
                          <View style={styles.dataRowIcon}>
                            <MaterialDesignIcons
                              color={homeColors.primary}
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
                            color={homeColors.textSecondary}
                            name="information-outline"
                            size={19}
                          />
                          <Text style={styles.emptyText}>
                            Aucune donnée enregistrée pour cette journée.
                          </Text>
                          {isTodaySelected ? (
                            <Pressable
                              accessibilityLabel="Ajouter au journal"
                              accessibilityRole="button"
                              onPress={openPostpartumJournal}
                              style={({ pressed }) => [
                                styles.addButton,
                                pressed && styles.pressed,
                              ]}
                            >
                              <MaterialDesignIcons
                                color="#FFFFFF"
                                name="plus"
                                size={16}
                              />
                              <Text style={styles.addButtonText}>
                                Ajouter au journal
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
          today={today}
          visibleFilters={visibleFilters}
        />
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
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
    >
      <MaterialDesignIcons color={homeColors.primary} name={icon} size={18} />
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
}: {
  mode: 'filters' | 'legend' | null;
  onClose: () => void;
  onToggle: (key: PostpartumCalendarCategory) => void;
  visibleFilters: Set<PostpartumCalendarCategory>;
  today: Date;
  showHijri: boolean;
}): React.JSX.Element {
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
          accessibilityLabel="Fermer"
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
                  Légende du calendrier
                </Text>
                <Text style={styles.legendSheetSubtitle}>
                  Comprendre les couleurs et repères utilisés.
                </Text>
              </View>

              <View style={styles.legendRows}>
                {CATEGORY_KEYS.map((key, index) => {
                  const meta = CATEGORY_META[key];
                  return (
                    <View
                      key={key}
                      style={[
                        styles.legendRow,
                        index === CATEGORY_KEYS.length - 1 &&
                          styles.legendRowLast,
                      ]}
                    >
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons
                          color={homeColors.primary}
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
                  <Text style={styles.todayTitle}>Aujourd’hui</Text>
                  <Text style={styles.todayText}>
                    Le contour noir en pointillés indique la date d’aujourd’hui.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.legendFooter}>
              <Pressable
                accessibilityLabel="Fermer la légende"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeLegendButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeLegendText}>Fermer</Text>
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
              <Text style={styles.filterSheetTitle}>Filtres du calendrier</Text>
              <Text style={styles.filterSheetSubtitle}>
                Choisis les informations à afficher sur ton calendrier.
              </Text>
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.filterRows}
              showsVerticalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {CATEGORY_KEYS.map((key, index) => {
                const meta = CATEGORY_META[key];
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
                        color={homeColors.primary}
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
                <Text style={styles.doneText}>Terminé</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F2ECF8' },

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
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA },
  flexCopy: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.78 },

  /* HEADER */
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: { marginTop: 2, color: homeColors.textSecondary, fontSize: 10.5 },
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
  headerActionLabel: {
    marginTop: 2,
    color: homeColors.primary,
    fontSize: 8,
    fontWeight: '800',
  },

  /* CALENDAR */
  calendarCard: {
    ...homeShadow,
    padding: 12,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
  },
  modeRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#F4F0F8',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  modeButtonActive: { backgroundColor: homeColors.primary },
  modeText: {
    color: homeColors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  modeTextActive: { color: '#FFFFFF' },

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
    backgroundColor: '#F7F3FB',
  },
  monthCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  monthTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },
  hijriMonth: { marginTop: 1, color: homeColors.textSecondary, fontSize: 9 },

  weekRow: { flexDirection: 'row' },
  weekDay: {
    width: '14.2857%',
    color: homeColors.textSecondary,
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
  dayText: { color: homeColors.textPrimary, fontSize: 12, fontWeight: '700' },
  dayTextLight: { color: '#FFFFFF' },
  hijriDay: { marginTop: 1, color: homeColors.textSecondary, fontSize: 7 },

  trackingDay: { backgroundColor: homeColors.lightLavender },
  deliveryDay: { backgroundColor: DELIVERY_COLOR },
  selectedDay: { backgroundColor: homeColors.primary },
  todayDayBorder: {
    // Neutral fill — always wins over delivery/selected backgrounds so the
    // dashed outline and journal markers stay legible.
    backgroundColor: homeColors.lightLavender,
    borderWidth: 1.7,
    borderColor: '#2F2938',
    borderStyle: 'dashed',
    borderRadius: 13,
  },

  markerRow: { position: 'absolute', bottom: 3, flexDirection: 'row', gap: 2 },
  marker: { width: 3.5, height: 3.5, borderRadius: 2 },

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
  inlineLegendItem: { flexDirection: 'row', alignItems: 'center' },
  inlineLegendDot: { width: 7, height: 7, marginRight: 4, borderRadius: 4 },
  inlineTodayIndicator: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderWidth: 1.5,
    borderColor: '#2F2938',
    borderStyle: 'dashed',
    borderRadius: 5,
  },
  inlineLegendText: {
    color: homeColors.textSecondary,
    fontSize: 8.5,
    fontWeight: '600',
  },

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
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8F3',
  },
  selectedIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: '#F0EAFB',
  },
  selectedTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },
  selectedDate: { marginTop: 2, color: homeColors.textSecondary, fontSize: 10 },

  neutralBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 13,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#F7F3FC',
  },
  neutralText: {
    flex: 1,
    color: homeColors.textSecondary,
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
    backgroundColor: homeColors.lightLavender,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayBadgeText: { color: homeColors.primary, fontSize: 12, fontWeight: '800' },
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
    borderColor: '#EEE7F4',
    borderRadius: 17,
    backgroundColor: '#FCFAFE',
  },
  dataRowIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: '#EEE7FB',
  },
  lochiesIcon: { backgroundColor: '#FCEEEF' },
  dataRowLabel: {
    color: homeColors.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
  },
  dataRowValue: {
    marginTop: 3,
    color: homeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  emptyBox: {
    alignItems: 'center',
    marginTop: 4,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#F7F3FC',
  },
  emptyText: {
    marginTop: 4,
    color: homeColors.textSecondary,
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
    backgroundColor: homeColors.primary,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  /* MODAL */
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35,22,65,0.34)',
  },
  sheet: {
    maxHeight: '90%',
    paddingTop: 9,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FCFAFF',
    overflow: 'hidden',
  },
  handle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    flexShrink: 0,
    borderRadius: 3,
    backgroundColor: '#CBB9F7',
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
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  filterSheetSubtitle: {
    marginTop: 8,
    color: homeColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  filterRows: { paddingHorizontal: 22, paddingBottom: 10 },
  filterRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5DDEF',
  },
  filterRowLast: { borderBottomWidth: 0 },
  filterIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F0E9FC',
  },
  filterCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  filterTitle: {
    color: homeColors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  filterDescription: {
    marginTop: 2,
    color: homeColors.textSecondary,
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
    backgroundColor: '#D7D0DF',
  },
  switchTrackActive: { backgroundColor: homeColors.primary },
  switchThumb: {
    ...homeShadow,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: { alignSelf: 'flex-end' },
  filterFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7DFEF',
    backgroundColor: '#FCFAFF',
  },
  doneButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: homeColors.primary,
  },
  doneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

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
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  legendSheetSubtitle: {
    marginTop: 7,
    color: homeColors.textSecondary,
    fontSize: 13,
  },
  legendRows: { marginTop: 16 },
  legendRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7E0EE',
  },
  legendRowLast: { borderBottomWidth: 0 },
  legendLargeIcon: {
    width: 54,
    height: 54,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#EFE8FC',
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
    color: homeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  legendRowText: {
    marginTop: 4,
    color: homeColors.textSecondary,
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
  todayLegendDay: {
    color: homeColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  todayLegendHijri: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  todayCopy: { flex: 1, minWidth: 0 },
  todayTitle: {
    color: homeColors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  todayText: {
    marginTop: 4,
    color: homeColors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  legendFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7DFEF',
    backgroundColor: '#FCFAFF',
  },
  closeLegendButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: homeColors.lightLavender,
  },
  closeLegendText: {
    color: homeColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PostpartumCalendarContent;
