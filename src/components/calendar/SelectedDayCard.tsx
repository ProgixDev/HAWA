import React, {memo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import {formatFullDate, formatHijriDate, formatShortDate, type ComputedCyclePhase} from '../../utils/cycleMath';
import type {CalendarFilters} from '../../state/calendarFilters';
import type {DailyJournalEntry, MoodLevel} from '../../types/journal';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  date: Date;
  cycleDay: number;
  phase: ComputedCyclePhase;
  entry?: DailyJournalEntry;
  filters: CalendarFilters;
  periodStartDate: Date;
  periodEndDate: Date;
  periodDuration: number;
  onEditPeriod: () => void;
  editingPeriod?: boolean;
  /** Opens the same period-start confirmation sheet the Dashboard uses,
   * pre-filled with `date`. Omit to hide the CTA entirely (e.g. while
   * editing). */
  onDeclarePeriodStart?: () => void;
};

const PHASE_META: Record<ComputedCyclePhase, {label: string; subtitle: string; color: string; icon: IconName}> = {
  menstruation: {label: 'Phase menstruelle', subtitle: 'Fertilité faible', color: homeColors.pink, icon: 'flower-outline'},
  follicular: {label: 'Phase folliculaire', subtitle: 'Fertilité en hausse', color: homeColors.primary, icon: 'leaf'},
  fertile: {label: 'Fenêtre fertile', subtitle: 'Fertilité élevée', color: '#3E8E56', icon: 'leaf'},
  ovulation: {label: 'Phase ovulatoire', subtitle: 'Fertilité élevée', color: '#8B5CF6', icon: 'egg-outline'},
  luteal: {label: 'Phase lutéale', subtitle: 'Fertilité faible', color: '#D8B05A', icon: 'moon-waning-crescent'},
};

const FLOW_LABELS: Record<string, string> = {
  none: 'Aucun',
  light: 'Léger',
  moderate: 'Modéré',
  heavy: 'Abondant',
  veryHeavy: 'Très abondant',
};

const MOOD_LABELS: Record<MoodLevel, string> = {
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

type HealthRow = {key: keyof CalendarFilters; icon: IconName; label: string; value: string};

function buildHealthRows(entry: DailyJournalEntry | undefined): HealthRow[] {
  const symptomNames = entry?.symptoms?.names ?? [];

  return [
    {
      key: 'rules',
      icon: 'water',
      label: 'Intensité du flux',
      value: entry?.flow ? (FLOW_LABELS[entry.flow.intensity] ?? entry.flow.intensity) : 'Non renseigné',
    },
    {
      key: 'symptoms',
      icon: 'heart-outline',
      label: 'Symptômes',
      value: symptomNames.length > 0 ? symptomNames.join(', ') : 'Aucun',
    },
    {
      key: 'mood',
      icon: 'emoticon-happy-outline',
      label: 'Humeur',
      value: entry?.mood ? (MOOD_LABELS[entry.mood.level] ?? entry.mood.level) : 'Non renseigné',
    },
    {
      key: 'sleep',
      icon: 'weather-night',
      label: 'Sommeil',
      value: entry?.sleep?.duration ?? 'Non renseigné',
    },
    {
      key: 'activity',
      icon: 'run',
      label: 'Activité',
      value: entry?.activity?.none
        ? 'Aucune'
        : entry?.activity?.type
          ? `${entry.activity.type}${entry.activity.durationMinutes ? ` · ${entry.activity.durationMinutes} min` : ''}`
          : 'Non renseigné',
    },
    {
      key: 'hydration',
      icon: 'cup-water',
      label: 'Hydratation',
      value: entry?.hydration ? `${(entry.hydration.milliliters / 1000).toFixed(1).replace('.', ',')} L` : 'Non renseignée',
    },
    {
      key: 'intimacy',
      icon: 'shield-lock-outline',
      label: 'Vie intime',
      value: entry?.intimacy ? (entry.intimacy.answer === 'yes' ? 'Oui' : entry.intimacy.answer === 'no' ? 'Non' : 'Préfère ne pas dire') : 'Non renseigné',
    },
    {
      key: 'notes',
      icon: 'notebook-edit-outline',
      label: 'Notes',
      value: entry?.note?.text || entry?.encryptedNote ? 'Voir la note' : 'Aucune note',
    },
  ];
}

function SelectedDayCard({
  date,
  cycleDay,
  phase,
  entry,
  filters,
  periodStartDate,
  periodEndDate,
  periodDuration,
  onEditPeriod,
  editingPeriod = false,
  onDeclarePeriodStart,
}: Props): React.JSX.Element {
  const meta = PHASE_META[phase];
  const hijriDate = formatHijriDate(date);
  const rows = buildHealthRows(entry).filter(row => filters[row.key]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dateBlock}>
          <Text numberOfLines={2} style={styles.gregorianDate}>{formatFullDate(date)}</Text>
          {hijriDate ? <Text numberOfLines={2} style={styles.hijriDate}>{hijriDate}</Text> : null}
        </View>
        <View style={styles.cycleDayBadge}>
          <Text numberOfLines={1} style={styles.cycleDayText}>Jour {cycleDay} du cycle</Text>
        </View>
      </View>

      <View style={styles.phaseRow}>
        <View style={[styles.phaseIcon, {backgroundColor: `${meta.color}22`}]}>
          <MaterialDesignIcons color={meta.color} name={meta.icon} size={26} />
        </View>
        <View style={styles.phaseCopy}>
          <Text numberOfLines={2} style={[styles.phaseTitle, {color: meta.color}]}>{meta.label}</Text>
          <Text numberOfLines={2} style={styles.phaseSubtitle}>{meta.subtitle}</Text>
        </View>
      </View>

      <View style={styles.healthGrid}>
        {rows.map(row => (
          <View key={row.key} style={styles.healthRow}>
            <MaterialDesignIcons color={homeColors.primary} name={row.icon} size={16} />
            <View style={styles.healthCopy}>
              <Text numberOfLines={2} style={styles.healthLabel}>{row.label}</Text>
              <Text style={styles.healthValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.periodSectionHeader}><Text style={styles.periodSectionTitle}>Période menstruelle</Text><Pressable accessibilityRole="button" onPress={onEditPeriod} style={({pressed}) => [styles.editPeriodButton, pressed && styles.pressed]}><MaterialDesignIcons color={homeColors.primary} name={editingPeriod ? 'pencil-off-outline' : 'pencil-outline'} size={15} /><Text style={styles.editPeriodText}>{editingPeriod ? 'Modification' : 'Modifier'}</Text></Pressable></View>
      <View style={styles.periodRow}>
        <View style={styles.periodBox}>
          <Text numberOfLines={2} style={styles.periodLabel}>Début des règles</Text>
          <Text style={styles.periodValue}>{formatShortDate(periodStartDate)}</Text>
        </View>
        <View style={styles.periodBox}>
          <Text numberOfLines={2} style={styles.periodLabel}>Fin des règles</Text>
          <Text style={styles.periodValue}>{formatShortDate(periodEndDate)}</Text>
        </View>
        <View style={styles.periodBox}>
          <Text numberOfLines={2} style={styles.periodLabel}>Durée des règles</Text>
          <Text style={styles.periodValue}>{periodDuration} jours</Text>
        </View>
      </View>

      {onDeclarePeriodStart && !editingPeriod ? (
        <Pressable
          accessibilityLabel="Mes règles ont commencé ce jour"
          accessibilityRole="button"
          onPress={onDeclarePeriodStart}
          style={({pressed}) => [styles.declareButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={homeColors.pink} name="water-plus-outline" size={15} />
          <Text style={styles.declareText}>Mes règles ont commencé ce jour</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },
  topRow: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8},
  dateBlock: {flexShrink: 1, minWidth: '55%'},
  gregorianDate: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  hijriDate: {marginTop: 2, color: homeColors.textSecondary, fontSize: 11.5},
  cycleDayBadge: {borderRadius: 12, backgroundColor: homeColors.lightLavender, paddingHorizontal: 10, paddingVertical: 6},
  cycleDayText: {color: homeColors.primary, fontSize: 11, fontWeight: '700'},
  phaseRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  phaseIcon: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24},
  phaseCopy: {flex: 1, marginLeft: 12},
  phaseTitle: {fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  phaseSubtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 12},
  healthGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10},
  healthRow: {flexDirection: 'row', alignItems: 'flex-start', flexBasis: '47%', flexGrow: 1, gap: 8},
  healthCopy: {flex: 1, minWidth: 0},
  healthLabel: {color: homeColors.textSecondary, fontSize: 10.5},
  healthValue: {marginTop: 1, color: homeColors.textPrimary, fontSize: 12.5, fontWeight: '700'},
  periodRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10},
  periodSectionHeader: {marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  periodSectionTitle: {flex: 1, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
  editPeriodButton: {flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: homeColors.cardBorder, borderRadius: 11, backgroundColor: '#FBF9FF', paddingHorizontal: 10, paddingVertical: 7},
  editPeriodText: {color: homeColors.primary, fontSize: 11.5, fontWeight: '700'},
  pressed: {opacity: 0.72},
  periodBox: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.lightLavender,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  periodLabel: {color: homeColors.textSecondary, fontSize: 10},
  periodValue: {marginTop: 3, color: homeColors.textPrimary, fontSize: 12, fontWeight: '700'},
  declareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
    minHeight: 40,
    borderWidth: 1.2,
    borderColor: 'rgba(220,123,130,0.35)',
    borderRadius: 14,
    backgroundColor: '#FCEEEF',
    paddingHorizontal: 12,
  },
  declareText: {color: homeColors.pink, fontSize: 12, fontWeight: '700', textAlign: 'center'},
});

export default memo(SelectedDayCard);
