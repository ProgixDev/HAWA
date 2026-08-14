import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ImageBackground, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
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
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
} from '../../state/postpartumPreferences';
import {computePostpartumStatus} from '../../utils/postpartumTrackingUtils';
import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
  subscribePostpartumJournal,
} from '../../state/postpartumJournalStore';
import {POSTPARTUM_JOURNAL_ITEMS} from '../../config/postpartumJournalConfig';

// Postpartum Calendar — a dedicated content branch for the ONE global
// Calendar tab (see ObjectiveAwareCalendarScreen.tsx), structurally modeled
// after PregnancyCalendarContent.tsx (same premium HAWA card language, month
// nav, Grégorien/Hijri/Double mode, inline legend, selected-day card) but
// with entirely Postpartum-specific meaning/markers/data. Deliberately does
// NOT import or call cycleDayFor/phaseFor/fertileWindow/ovulation/predicted
// -period from cycleMath.ts, and does NOT reuse MonthCalendarCard.tsx (which
// is wired to Cycle's period/fertile/ovulation day-kind system) — Postpartum
// day is derived only from deliveryDate + the selected date.

const BACKGROUND = require('../../assets/images/auth-mosque-background.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Deliberately distinct from Cycle's period (pink)/fertile (green)/
// ovulation (purple) day-marker colors — see MonthCalendarCard.tsx, not
// reused here. Matches the rose accent PostpartumDashboard's own "Lochies
// aujourd'hui" icon already uses, for visual consistency within Postpartum.
const DELIVERY_COLOR = '#DC7B82';

const MODES: Array<{key: CalendarPreference; label: string}> = [
  {key: 'gregorian', label: 'Grégorien'},
  {key: 'hijri', label: 'Hijri'},
  {key: 'double', label: 'Double'},
];

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');

function PostpartumCalendarContent(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayMode, setDisplayMode] = useState<CalendarPreference>('double');

  // Canonical delivery date — src/state/postpartumPreferences.ts, the same
  // source PostpartumDashboard reads. Never hardcoded.
  const [postpartum, setPostpartum] = useState(getPostpartumPreferences);
  useEffect(() => {
    let active = true;
    hydratePostpartumPreferences().then(value => {if (active) {setPostpartum(value);}});
    const unsubscribe = subscribePostpartumPreferences(() => {if (active) {setPostpartum(getPostpartumPreferences());}});
    return () => {active = false; unsubscribe();};
  }, []);

  const deliveryDate = useMemo(
    () => (postpartum.deliveryDate ? startOfDay(new Date(`${postpartum.deliveryDate}T12:00:00`)) : null),
    [postpartum.deliveryDate],
  );

  // Same shared Grégorien/Hijri/Double preference Cycle/Pregnancy calendars
  // already read — reusing the existing architecture, not reimplementing it.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(info => {if (mounted) {setDisplayMode(info.calendar);}});
      return () => {mounted = false;};
    }, []),
  );

  // Postpartum's OWN daily tracking (src/state/postpartumJournalStore.ts) —
  // never Cycle's dailyJournalStore or Pregnancy's pregnancyJournalStore.
  const [entries, setEntries] = useState(getAllPostpartumJournalEntries);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePostpartumJournal().then(() => {if (active) {setEntries(getAllPostpartumJournalEntries());}});
      const unsubscribe = subscribePostpartumJournal(() => {if (active) {setEntries(getAllPostpartumJournalEntries());}});
      return () => {active = false; unsubscribe();};
    }, []),
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
  const hijriMonthLabel = showHijri ? formatHijriMonthYear(visibleMonth) : undefined;

  const selectedTitle = capitalize(
    new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).format(selectedDate),
  );
  const selectedKey = dateKey(selectedDate);
  const selectedEntry = entries[selectedKey];

  // Postpartum day is derived ONLY from deliveryDate + the selected date —
  // never cycleDayFor/phaseFor/fertileWindow/ovulation/predictedPeriod.
  // computePostpartumStatus clamps negative differences to day 1, so
  // "before delivery" is detected independently here rather than trusted
  // from its output.
  const rawDiffFromDelivery = deliveryDate ? diffDays(startOfDay(selectedDate), deliveryDate) : null;
  const isBeforeDelivery = rawDiffFromDelivery !== null && rawDiffFromDelivery < 0;
  const selectedStatus = useMemo(() => computePostpartumStatus(deliveryDate, selectedDate), [deliveryDate, selectedDate]);
  const showPostpartumDay = selectedStatus.configured && !isBeforeDelivery;
  const isDeliveryDaySelected = Boolean(deliveryDate) && sameDay(selectedDate, deliveryDate as Date);

  // Only the Postpartum Journal's 5 real canonical categories (Fatigue /
  // Sommeil / Humeur / Douleurs / Récupération physique) — Pregnancy's
  // Symptômes/Poids/Informations médicales never appear here, see
  // postpartumJournalConfig.ts. Rows are only built when real data exists;
  // never a fabricated value. All 5 fields are plain strings, so no
  // per-category formatting is needed (unlike the old Symptômes/Poids shape).
  const selectedJournalRows = useMemo(() => {
    const rows: Array<{key: string; icon: IconName; label: string; value: string}> = [];
    for (const item of POSTPARTUM_JOURNAL_ITEMS) {
      const raw = selectedEntry?.[item.key];
      if (raw === undefined) {continue;}
      rows.push({key: item.key, icon: item.icon, label: item.label, value: String(raw)});
    }
    return rows;
  }, [selectedEntry]);

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 30}]}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Calendrier</Text>
            <Text style={styles.subtitle}>Suis ton parcours post-partum</Text>
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
                {hijriMonthLabel ? <Text style={styles.hijriMonth}>{hijriMonthLabel}</Text> : null}
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
                const isDelivery = Boolean(deliveryDate) && sameDay(date, deliveryDate as Date);
                const isPostpartumDay = Boolean(deliveryDate) && diffDays(date, deliveryDate as Date) >= 0;
                const hasData = Boolean(entries[dateKey(date)]);
                const lightText = selected || isDelivery;

                return (
                  <View key={date.toISOString()} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()} ${monthTitle}${isDelivery ? ', accouchement' : ''}`}
                      accessibilityRole="button"
                      onPress={() => setSelectedDate(date)}
                      style={[
                        styles.dayButton,
                        isPostpartumDay && !isDelivery && !selected && styles.trackingDay,
                        isDelivery && !selected && styles.deliveryDay,
                        selected && styles.selectedDay,
                        isToday && styles.todayDayBorder,
                      ]}>
                      <Text style={[styles.dayText, lightText && styles.dayTextLight]}>{date.getDate()}</Text>
                      {showHijri ? (
                        <Text style={[styles.hijriDay, lightText && styles.dayTextLight]}>{formatHijriDay(date)}</Text>
                      ) : null}
                      {hasData ? (
                        <View style={styles.markerRow}>
                          <View style={[styles.marker, lightText && styles.markerLight]} />
                        </View>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* INLINE LEGEND */}
            <View style={styles.inlineLegend}>
              <View style={styles.inlineLegendItem}>
                <View style={[styles.inlineLegendDot, styles.legendDeliveryDot]} />
                <Text style={styles.inlineLegendText}>Accouchement</Text>
              </View>
              <View style={styles.inlineLegendItem}>
                <View style={[styles.inlineLegendDot, styles.legendTrackingDot]} />
                <Text style={styles.inlineLegendText}>Suivi post-partum</Text>
              </View>
              <View style={styles.inlineLegendItem}>
                <View style={[styles.inlineLegendDot, styles.legendDataDot]} />
                <Text style={styles.inlineLegendText}>Données enregistrées</Text>
              </View>
              <View style={styles.inlineLegendItem}>
                <View style={styles.inlineSelectedIndicator} />
                <Text style={styles.inlineLegendText}>Jour sélectionné</Text>
              </View>
            </View>
          </View>

          {/* SELECTED DAY CARD */}
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedIcon}>
                <MaterialDesignIcons color={homeColors.primary} name="calendar-heart" size={21} />
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
                <MaterialDesignIcons color={homeColors.textSecondary} name="information-outline" size={19} />
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
                    <MaterialDesignIcons color={homeColors.primary} name="flower-outline" size={14} />
                    <Text style={styles.dayBadgeText}>Jour {selectedStatus.postpartumDay} post-partum</Text>
                  </View>
                  {isDeliveryDaySelected ? (
                    <View style={styles.deliveryBadge}>
                      <MaterialDesignIcons color={DELIVERY_COLOR} name="flower" size={14} />
                      <Text style={styles.deliveryBadgeText}>Accouchement</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.dataRows}>
                  {/* LOCHIES — kept separate from the 5-item Journal below;
                      no lochia store exists yet (only a placeholder screen),
                      so this row always shows the honest neutral state,
                      never a fabricated flow/color value. */}
                  <Pressable
                    accessibilityLabel="Lochies"
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('PostpartumLochia')}
                    style={({pressed}) => [styles.dataRow, pressed && styles.pressed]}>
                    <View style={[styles.dataRowIcon, styles.lochiesIcon]}>
                      <MaterialDesignIcons color={DELIVERY_COLOR} name="water-outline" size={18} />
                    </View>
                    <View style={styles.flexCopy}>
                      <Text style={styles.dataRowLabel}>Lochies</Text>
                      <Text style={styles.dataRowValue}>Non renseigné</Text>
                    </View>
                    <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={18} />
                  </Pressable>

                  {selectedJournalRows.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune donnée enregistrée pour cette journée.</Text>
                  ) : (
                    selectedJournalRows.map(row => (
                      <View key={row.key} style={styles.dataRow}>
                        <View style={styles.dataRowIcon}>
                          <MaterialDesignIcons color={homeColors.primary} name={row.icon} size={18} />
                        </View>
                        <View style={styles.flexCopy}>
                          <Text style={styles.dataRowLabel}>{row.label}</Text>
                          <Text numberOfLines={2} style={styles.dataRowValue}>{row.value}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8F4FC'},
  safeArea: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 16},
  flexCopy: {flex: 1, minWidth: 0},
  pressed: {opacity: 0.78},

  /* HEADER */
  header: {marginBottom: 12},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  subtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 10.5},

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
  dayText: {color: homeColors.textPrimary, fontSize: 12, fontWeight: '700'},
  dayTextLight: {color: '#FFFFFF'},
  hijriDay: {marginTop: 1, color: homeColors.textSecondary, fontSize: 7},

  trackingDay: {backgroundColor: homeColors.lightLavender},
  deliveryDay: {backgroundColor: DELIVERY_COLOR},
  selectedDay: {backgroundColor: homeColors.primary},
  todayDayBorder: {borderWidth: 1.7, borderColor: '#2F2938', borderStyle: 'dashed', borderRadius: 13},

  markerRow: {position: 'absolute', bottom: 3, flexDirection: 'row', gap: 2},
  marker: {width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: homeColors.primary},
  markerLight: {backgroundColor: '#FFFFFF'},

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
  inlineLegendDot: {width: 9, height: 9, marginRight: 4, borderRadius: 5},
  legendDeliveryDot: {backgroundColor: DELIVERY_COLOR},
  legendTrackingDot: {backgroundColor: homeColors.lightLavender, borderWidth: 1, borderColor: 'rgba(111,78,190,0.25)'},
  legendDataDot: {width: 7, height: 7, marginRight: 4, marginTop: 1, backgroundColor: homeColors.primary},
  inlineSelectedIndicator: {width: 12, height: 12, marginRight: 5, borderRadius: 6, backgroundColor: homeColors.primary},
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

  neutralBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 13,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#F7F3FC',
  },
  neutralText: {flex: 1, color: homeColors.textSecondary, fontSize: 12, lineHeight: 17},

  dayBadgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  dayBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, backgroundColor: homeColors.lightLavender, paddingHorizontal: 12, paddingVertical: 8},
  dayBadgeText: {color: homeColors.primary, fontSize: 12, fontWeight: '800'},
  deliveryBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, backgroundColor: '#F8E3E5', paddingHorizontal: 12, paddingVertical: 8},
  deliveryBadgeText: {color: DELIVERY_COLOR, fontSize: 12, fontWeight: '800'},

  dataRows: {marginTop: 12, gap: 8},
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
  dataRowIcon: {width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 13, backgroundColor: '#EEE7FB'},
  lochiesIcon: {backgroundColor: '#FCEEEF'},
  dataRowLabel: {color: homeColors.textPrimary, fontSize: 12.5, fontWeight: '800'},
  dataRowValue: {marginTop: 3, color: homeColors.textSecondary, fontSize: 11, lineHeight: 15},

  emptyText: {marginTop: 4, color: homeColors.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center'},
});

export default PostpartumCalendarContent;
