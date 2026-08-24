import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {WEEK_DAYS, formatHijriDate, formatHijriDay, sameDay} from '../../utils/cycleMath';
import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {getTopPadding, spacing} from '../../theme/spacing';

import {
  getAllMenopauseJournalEntries,
  getMenopauseJournalEntry,
  getMenopauseLabResults,
  type MenopauseJournalEntry,
} from '../../state/menopauseJournalStore';

import {
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_LAB_TYPE_LABELS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_SLEEP_QUALITY_LABELS,
  MENOPAUSE_TREATMENT_STATUS_LABELS,
} from '../../config/menopauseJournalConfig';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const MUTED = '#776C92';
const SYMPTOMS_COLOR = '#B23F63';
const TREATMENT_COLOR = '#3FA372';
const LAB_COLOR = '#3E7BC4';

type FilterKey = 'all' | 'symptoms' | 'treatment' | 'labResults';

const FILTERS: Array<{key: FilterKey; label: string}> = [
  {key: 'all', label: 'Tout'},
  {key: 'symptoms', label: 'Symptômes'},
  {key: 'treatment', label: 'Traitement'},
  {key: 'labResults', label: 'Analyses'},
];

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');

function MenopauseCalendarContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [showSelection, setShowSelection] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const spiritualMarkersEnabled = getSpiritualMarkersEnabled();

  // Re-read on every render — this screen re-renders on focus already
  // (navigation), which is frequent enough to reflect the latest journal
  // saves without a dedicated subscription for a read-only calendar.
  const entriesByDate = getAllMenopauseJournalEntries();
  const labResults = getMenopauseLabResults();

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({length: offset + count}, (_, index) =>
      index < offset ? null : new Date(year, month, index - offset + 1),
    );
  }, [visibleMonth]);

  const changeMonth = (delta: number) => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    setShowSelection(true);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setShowSelection(true);
  };

  const selectedEntry = getMenopauseJournalEntry(dateKey(selectedDate));
  const selectedDateKey = dateKey(selectedDate);
  const selectedLabResults = labResults.filter(result => result.date === selectedDateKey);
  const hasAnySelectedData = Boolean(
    selectedEntry?.symptoms?.length || selectedEntry?.mood || selectedEntry?.sleepDurationHours !== undefined ||
    selectedEntry?.sleepQuality || selectedEntry?.energyLevel || selectedEntry?.treatmentStatus ||
    selectedLabResults.length > 0 || selectedEntry?.notes?.trim(),
  );

  const monthSummary = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const entriesThisMonth: MenopauseJournalEntry[] = Object.values(entriesByDate).filter(entry => {
      const parsed = new Date(`${entry.date}T12:00:00`);
      return parsed.getFullYear() === year && parsed.getMonth() === month;
    });
    return {
      daysWithSymptoms: entriesThisMonth.filter(entry => entry.symptoms && entry.symptoms.length > 0).length,
      hotFlashDays: entriesThisMonth.filter(entry => entry.symptoms?.includes('hot_flashes')).length,
      nightSweatNights: entriesThisMonth.filter(entry => entry.symptoms?.includes('night_sweats')).length,
      fatigueDays: entriesThisMonth.filter(entry => entry.symptoms?.includes('fatigue')).length,
    };
  }, [visibleMonth, entriesByDate]);

  const hasAnyDataAtAll = Object.keys(entriesByDate).length > 0 || labResults.length > 0;

  return (
    <View style={styles.background}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Calendrier</Text>
          <Text style={styles.pageSubtitle}>Ton suivi périménopause / ménopause, jour après jour.</Text>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTERS.map(option => {
              const active = option.key === filter;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}
                  key={option.key}
                  onPress={() => setFilter(option.key)}
                  style={({pressed}) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <Pressable accessibilityLabel="Mois précédent" hitSlop={12} onPress={() => changeMonth(-1)}>
              <MaterialDesignIcons color={PURPLE} name="chevron-left" size={24} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={goToToday} style={styles.monthTitleBlock}>
              <Text numberOfLines={1} style={styles.monthTitle}>
                {new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(visibleMonth)}
              </Text>
              <Text style={styles.todayShortcut}>Aujourd’hui</Text>
            </Pressable>
            <Pressable accessibilityLabel="Mois suivant" hitSlop={12} onPress={() => changeMonth(1)}>
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
              if (!date) {return <View key={`empty-${index}`} style={styles.dayCell} />;}

              const key = dateKey(date);
              const entry = entriesByDate[key];
              const hasLabResult = labResults.some(result => result.date === key);
              const isToday = sameDay(date, today);
              const isSelected = showSelection && sameDay(date, selectedDate);

              const showSymptoms = (filter === 'all' || filter === 'symptoms') && Boolean(entry?.symptoms?.length);
              const showTreatment = (filter === 'all' || filter === 'treatment') && Boolean(entry?.treatmentStatus);
              const showLab = (filter === 'all' || filter === 'labResults') && hasLabResult;

              const dots: string[] = [];
              if (showSymptoms) {dots.push(SYMPTOMS_COLOR);}
              if (showTreatment) {dots.push(TREATMENT_COLOR);}
              if (showLab) {dots.push(LAB_COLOR);}

              return (
                <View key={key} style={styles.dayCell}>
                  <Pressable
                    accessibilityLabel={`${date.getDate()}`}
                    accessibilityRole="button"
                    onPress={() => selectDate(date)}
                    style={({pressed}) => [
                      styles.day,
                      isSelected && !isToday && styles.selectedDay,
                      isToday && styles.todayDay,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.dayText, isSelected && !isToday && styles.dayTextLight, isToday && styles.todayDayText]}>
                      {date.getDate()}
                    </Text>
                    {spiritualMarkersEnabled ? (
                      <Text numberOfLines={1} style={[styles.hijriDayText, isSelected && !isToday && styles.dayTextLight]}>
                        {formatHijriDay(date)}
                      </Text>
                    ) : null}
                    {dots.length > 0 ? (
                      <View style={styles.dotRow}>
                        {dots.slice(0, 3).map((color, dotIndex) => (
                          <View key={dotIndex} style={[styles.dot, isSelected && !isToday ? styles.dotOnSelected : {backgroundColor: color}]} />
                        ))}
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <LegendDot color={SYMPTOMS_COLOR} label="Symptômes" />
            <LegendDot color={TREATMENT_COLOR} label="Traitement" />
            <LegendDot color={LAB_COLOR} label="Analyses" />
            <LegendDot color={PURPLE_DARK} label="Aujourd’hui" outline />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.selectedDateTitle}>
            {new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(selectedDate)}
          </Text>
          {spiritualMarkersEnabled ? (
            <Text style={styles.selectedDateHijri}>{formatHijriDate(selectedDate)}</Text>
          ) : null}

          {hasAnySelectedData ? (
            <>
              {selectedEntry?.symptoms?.length ? (
                <DetailRow icon="clipboard-pulse-outline" label="Symptômes" value={`${selectedEntry.symptoms.length} enregistré${selectedEntry.symptoms.length > 1 ? 's' : ''}`} />
              ) : null}
              {selectedEntry?.mood ? (
                <DetailRow icon="heart-outline" label="Humeur" value={MENOPAUSE_MOOD_LABELS[selectedEntry.mood]} />
              ) : null}
              {(selectedEntry?.sleepDurationHours !== undefined || selectedEntry?.sleepQuality) ? (
                <DetailRow
                  icon="weather-night"
                  label="Sommeil"
                  value={
                    selectedEntry?.sleepDurationHours !== undefined
                      ? `${selectedEntry.sleepDurationHours} h${selectedEntry.sleepQuality ? ` · ${MENOPAUSE_SLEEP_QUALITY_LABELS[selectedEntry.sleepQuality]}` : ''}`
                      : selectedEntry?.sleepQuality ? MENOPAUSE_SLEEP_QUALITY_LABELS[selectedEntry.sleepQuality] : ''
                  }
                />
              ) : null}
              {selectedEntry?.energyLevel ? (
                <DetailRow icon="lightning-bolt-outline" label="Énergie" value={MENOPAUSE_ENERGY_LABELS[selectedEntry.energyLevel]} />
              ) : null}
              {selectedEntry?.treatmentStatus ? (
                <DetailRow icon="pill" label="Traitement hormonal" value={MENOPAUSE_TREATMENT_STATUS_LABELS[selectedEntry.treatmentStatus]} />
              ) : null}
              {selectedLabResults.length > 0 ? (
                <DetailRow
                  icon="flask-outline"
                  label="Analyses"
                  value={selectedLabResults.map(result => `${MENOPAUSE_LAB_TYPE_LABELS[result.type]} : ${result.value}${result.unit ? ` ${result.unit}` : ''}`).join(' · ')}
                />
              ) : null}
              {selectedEntry?.notes?.trim() ? (
                <DetailRow icon="notebook-edit-outline" label="Notes" value="Note enregistrée" />
              ) : null}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialDesignIcons color={PURPLE} name="calendar-blank-outline" size={22} />
              </View>
              <Text style={styles.emptyTitle}>Aucun suivi pour ce jour</Text>
              <Text style={styles.emptyText}>Rien n’a encore été enregistré pour cette date.</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Résumé du mois</Text>
          {hasAnyDataAtAll ? (
            <>
              <SummaryRow label="Jours avec symptômes" value={monthSummary.daysWithSymptoms} />
              <SummaryRow label="Bouffées de chaleur enregistrées" value={monthSummary.hotFlashDays} />
              <SummaryRow label="Nuits avec sueurs nocturnes" value={monthSummary.nightSweatNights} />
              <SummaryRow label="Jours de fatigue" value={monthSummary.fatigueDays} />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Pas encore assez de données</Text>
              <Text style={styles.emptyText}>Ajoute quelques suivis pour voir apparaître tes tendances.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({icon, label, value}: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; label: string; value: string}): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={16} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SummaryRow({label, value}: {label: string; value: number}): React.JSX.Element {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function LegendDot({color, label, outline = false}: {color: string; label: string; outline?: boolean}): React.JSX.Element {
  return (
    <View style={styles.legendItem}>
      {outline ? <View style={[styles.legendTodayRing, {borderColor: color}]} /> : <View style={[styles.legendDot, {backgroundColor: color}]} />}
      <Text numberOfLines={1} style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F4EFFA'},
  scrollContent: {paddingHorizontal: 16},

  pageHeader: {marginBottom: 14},
  pageTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  pageSubtitle: {marginTop: 4, color: MUTED, fontSize: 12.5},

  filterRow: {marginBottom: 14},
  filterChip: {minHeight: 34, justifyContent: 'center', marginRight: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(105,73,190,0.16)', backgroundColor: '#FFFFFF'},
  filterChipActive: {backgroundColor: PURPLE, borderColor: PURPLE},
  filterChipText: {color: MUTED, fontSize: 12.5, fontWeight: '700'},
  filterChipTextActive: {color: '#FFFFFF'},

  card: {
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  monthTitleBlock: {flex: 1, alignItems: 'center'},
  monthTitle: {textAlign: 'center', color: PURPLE_DARK, fontFamily: 'serif', fontSize: 18, fontWeight: '700', textTransform: 'capitalize'},
  todayShortcut: {marginTop: 2, color: PURPLE, fontSize: 10.5, fontWeight: '700'},

  weekRow: {flexDirection: 'row', marginTop: 14},
  weekDay: {width: '14.2857%', color: MUTED, fontSize: 11, fontWeight: '600', textAlign: 'center'},

  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6},
  dayCell: {width: '14.2857%', minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
  day: {width: '86%', minHeight: 40, maxWidth: 42, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 14},
  dayText: {color: PURPLE_DARK, fontSize: 13, fontWeight: '600'},
  dayTextLight: {color: '#FFFFFF'},
  hijriDayText: {color: MUTED, fontSize: 8.5, marginTop: 1},
  selectedDay: {backgroundColor: PURPLE},
  todayDay: {backgroundColor: '#F1EAFB', borderWidth: 1.8, borderStyle: 'dashed', borderColor: '#211A35', borderRadius: 14},
  todayDayText: {color: '#211A35', fontSize: 14, fontWeight: '800'},
  dotRow: {flexDirection: 'row', gap: 2, marginTop: 1},
  dot: {width: 3.5, height: 3.5, borderRadius: 2},
  dotOnSelected: {backgroundColor: '#FFFFFF'},

  legendRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 9, height: 9, borderRadius: 5},
  legendTodayRing: {width: 12, height: 12, borderWidth: 1.4, borderStyle: 'dashed', borderRadius: 6, backgroundColor: 'rgba(105,73,190,0.03)'},
  legendText: {color: MUTED, fontSize: 10.5},

  selectedDateTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  selectedDateHijri: {marginTop: 2, color: PURPLE, fontSize: 11.5, fontWeight: '600'},

  detailRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  detailIcon: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#EEE5FB', marginRight: 10},
  detailLabel: {flex: 1, color: PURPLE_DARK, fontSize: 13, fontWeight: '600'},
  detailValue: {maxWidth: '45%', color: MUTED, fontSize: 12, textAlign: 'right'},

  summaryTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '700', marginBottom: 8},
  summaryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(105,73,190,0.1)'},
  summaryLabel: {flex: 1, color: MUTED, fontSize: 12.5},
  summaryValue: {color: PURPLE_DARK, fontSize: 13.5, fontWeight: '700'},

  emptyState: {alignItems: 'center', paddingVertical: 14},
  emptyIcon: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#EEE5FB', marginBottom: 8},
  emptyTitle: {color: PURPLE_DARK, fontSize: 13, fontWeight: '700', textAlign: 'center'},
  emptyText: {marginTop: 4, color: MUTED, fontSize: 11.5, textAlign: 'center'},

  pressed: {opacity: 0.8},
});

export default MenopauseCalendarContent;
