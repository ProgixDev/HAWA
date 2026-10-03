import React, {memo, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';
import i18n from '../../i18n';

import {homeRadii} from '../home/homeTheme';
import {formatFullDate, formatHijriDate, formatShortDate, type ComputedCyclePhase} from '../../utils/cycleMath';
import type {CalendarFilters} from '../../state/calendarFilters';
import type {DailyJournalEntry, MoodLevel} from '../../types/journal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {journalOptionLabel} from '../../utils/journalOptionLabels';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  date: Date;
  /** Undefined when no reliable cycle day can be derived (irregular /
   * variable cycle: no single cycle length to count against). */
  cycleDay?: number;
  /** Undefined when the phase cannot be estimated (same situation) — a
   * neutral "not estimated" row is shown instead of an invented phase. */
  phase?: ComputedCyclePhase;
  entry?: DailyJournalEntry;
  filters: CalendarFilters;
  periodStartDate: Date;
  periodEndDate: Date;
  periodDuration: number;
  /** True for a day of a PAST cycle in which no period was ever recorded: the
   * Début / Fin / Durée block would only be a projection presented as a
   * historical fact, so it is replaced by an honest "nothing recorded" line. */
  periodUnrecorded?: boolean;
  onEditPeriod: () => void;
  editingPeriod?: boolean;
  /** Opens the same period-start confirmation sheet the Dashboard uses,
   * pre-filled with `date`. Omit to hide the CTA entirely (e.g. while
   * editing). */
  onDeclarePeriodStart?: () => void;
  /** Overrides the "not estimated" row's subtitle (default: the
   * variable-cycle wording) — e.g. for a past day with no recorded period. */
  phaseUnavailableSubtitle?: string;
  /** Hijri date line under the Gregorian date. Defaults to shown; CalendarScreen
   * passes the spiritual-markers preference ("Calendrier hijri" is one of the
   * features that toggle controls). */
  showHijriDate?: boolean;
  /** True while a managed (daughter) profile is active — "Vie intime" is not
   * part of a managed profile's cycle-tracking experience (see CLAUDE.md §4
   * objective isolation). The feature itself is untouched for the mother;
   * only hidden from this row list for the affected profile. Defaults to
   * false so every existing caller is unaffected. */
  hideIntimacy?: boolean;
};

// SEMANTIC — cycle-phase tracking meaning, never theme-driven (same
// convention as MonthCalendarCard.tsx's own header note). `follicular`'s
// color happens to numerically equal the app's original brand purple, but
// is hardcoded here rather than reading theme.colors.primary — the phase's
// visual identity must not drift as the palette changes.
const PERIOD_COLOR = '#DC7B82';
const FOLLICULAR_COLOR = '#6D4AE8';
const FERTILE_COLOR = '#3E8E56';
const OVULATION_COLOR = '#8B5CF6';
const LUTEAL_COLOR = '#D8B05A';

// Text is resolved from the shared i18n singleton (module-level, like
// cycleMath.ts's own presentation helpers) rather than useTranslation(),
// since these maps/functions live outside the component.
function phaseMeta(): Record<ComputedCyclePhase, {label: string; subtitle: string; color: string; icon: IconName}> {
  return {
    menstruation: {label: i18n.t('calendar.dayCard.phase.menstruation.label'), subtitle: i18n.t('calendar.dayCard.phase.menstruation.subtitle'), color: PERIOD_COLOR, icon: 'flower-outline'},
    follicular: {label: i18n.t('calendar.dayCard.phase.follicular.label'), subtitle: i18n.t('calendar.dayCard.phase.follicular.subtitle'), color: FOLLICULAR_COLOR, icon: 'leaf'},
    fertile: {label: i18n.t('calendar.dayCard.phase.fertile.label'), subtitle: i18n.t('calendar.dayCard.phase.fertile.subtitle'), color: FERTILE_COLOR, icon: 'leaf'},
    ovulation: {label: i18n.t('calendar.dayCard.phase.ovulation.label'), subtitle: i18n.t('calendar.dayCard.phase.ovulation.subtitle'), color: OVULATION_COLOR, icon: 'egg-outline'},
    luteal: {label: i18n.t('calendar.dayCard.phase.luteal.label'), subtitle: i18n.t('calendar.dayCard.phase.luteal.subtitle'), color: LUTEAL_COLOR, icon: 'moon-waning-crescent'},
  };
}

function phaseUnavailableMeta() {
  return {
    label: i18n.t('calendar.dayCard.phaseUnavailable.label'),
    subtitle: i18n.t('calendar.dayCard.phaseUnavailable.subtitle'),
    icon: 'help-circle-outline' as IconName,
  };
}

function flowLabel(intensity: string): string {
  const known: Record<string, string> = {
    none: i18n.t('calendar.dayCard.flow.none'),
    light: i18n.t('calendar.dayCard.flow.light'),
    moderate: i18n.t('calendar.dayCard.flow.moderate'),
    heavy: i18n.t('calendar.dayCard.flow.heavy'),
    veryHeavy: i18n.t('calendar.dayCard.flow.veryHeavy'),
  };
  return known[intensity] ?? intensity;
}

function moodLabel(level: MoodLevel): string {
  return i18n.t(`cycleHome.mood.${level}`);
}

type HealthRow = {key: keyof CalendarFilters; icon: IconName; label: string; value: string};

function buildHealthRows(entry: DailyJournalEntry | undefined): HealthRow[] {
  const symptomNames = entry?.symptoms?.names ?? [];
  const notProvided = i18n.t('calendar.dayCard.notProvided');

  return [
    {
      key: 'rules',
      icon: 'water',
      label: i18n.t('calendar.dayCard.rows.flowLabel'),
      value: entry?.flow ? flowLabel(entry.flow.intensity) : notProvided,
    },
    {
      key: 'symptoms',
      icon: 'heart-outline',
      label: i18n.t('dailyJournal.symptoms'),
      value: symptomNames.length > 0 ? symptomNames.map(name => journalOptionLabel('cycleSymptom', name, i18n.t)).join(', ') : i18n.t('calendar.dayCard.rows.symptomsNone'),
    },
    {
      key: 'mood',
      icon: 'emoticon-happy-outline',
      label: i18n.t('dailyJournal.mood'),
      value: entry?.mood ? moodLabel(entry.mood.level) : notProvided,
    },
    {
      key: 'sleep',
      icon: 'weather-night',
      label: i18n.t('dailyJournal.sleep'),
      value: entry?.sleep?.duration ?? notProvided,
    },
    {
      key: 'activity',
      icon: 'run',
      label: i18n.t('dailyJournal.activity'),
      value: entry?.activity?.none
        ? i18n.t('calendar.dayCard.rows.activityNone')
        : entry?.activity?.type
          ? `${journalOptionLabel('cycleActivityType', entry.activity.type, i18n.t)}${entry.activity.durationMinutes ? ` · ${entry.activity.durationMinutes} min` : ''}`
          : notProvided,
    },
    {
      key: 'hydration',
      icon: 'cup-water',
      label: i18n.t('dailyJournal.hydration'),
      value: entry?.hydration ? `${(entry.hydration.milliliters / 1000).toFixed(1).replace('.', ',')} L` : notProvided,
    },
    {
      key: 'intimacy',
      icon: 'shield-lock-outline',
      label: i18n.t('dailyJournal.intimacy'),
      value: entry?.intimacy
        ? (entry.intimacy.answer === 'yes' ? i18n.t('calendar.dayCard.rows.intimacyYes') : entry.intimacy.answer === 'no' ? i18n.t('calendar.dayCard.rows.intimacyNo') : i18n.t('calendar.dayCard.rows.intimacyPreferNotToSay'))
        : notProvided,
    },
    {
      key: 'notes',
      icon: 'notebook-edit-outline',
      label: i18n.t('dailyJournal.notes'),
      value: entry?.note?.text || entry?.encryptedNote ? i18n.t('calendar.dayCard.rows.viewNote') : i18n.t('calendar.dayCard.rows.noNote'),
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
  periodUnrecorded = false,
  onEditPeriod,
  editingPeriod = false,
  onDeclarePeriodStart,
  phaseUnavailableSubtitle,
  showHijriDate = true,
  hideIntimacy = false,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const unavailableMeta = phaseUnavailableMeta();
  const meta = phase
    ? phaseMeta()[phase]
    : {
        ...unavailableMeta,
        subtitle: phaseUnavailableSubtitle ?? unavailableMeta.subtitle,
        color: theme.colors.textSecondary,
      };
  const hijriDate = showHijriDate ? formatHijriDate(date) : undefined;
  const rows = buildHealthRows(entry).filter(row => filters[row.key] && !(hideIntimacy && row.key === 'intimacy'));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dateBlock}>
          <Text numberOfLines={2} style={styles.gregorianDate}>{formatFullDate(date)}</Text>
          {hijriDate ? <Text numberOfLines={2} style={styles.hijriDate}>{hijriDate}</Text> : null}
        </View>
        {cycleDay !== undefined ? (
          <View style={styles.cycleDayBadge}>
            <Text numberOfLines={1} style={styles.cycleDayText}>{t('calendar.dayCard.cycleDayBadge', {day: cycleDay})}</Text>
          </View>
        ) : null}
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
            <MaterialDesignIcons color={theme.colors.primary} name={row.icon} size={16} />
            <View style={styles.healthCopy}>
              <Text numberOfLines={2} style={styles.healthLabel}>{row.label}</Text>
              <Text style={styles.healthValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.periodSectionHeader}><Text style={styles.periodSectionTitle}>{t('calendar.dayCard.periodSectionTitle')}</Text><Pressable accessibilityRole="button" onPress={onEditPeriod} style={({pressed}) => [styles.editPeriodButton, pressed && styles.pressed]}><MaterialDesignIcons color={theme.colors.primary} name={editingPeriod ? 'pencil-off-outline' : 'pencil-outline'} size={15} /><Text style={styles.editPeriodText}>{editingPeriod ? t('calendar.dayCard.editing') : t('calendar.dayCard.edit')}</Text></Pressable></View>
      {periodUnrecorded ? (
        <Text style={styles.periodUnrecordedText}>{t('calendar.dayCard.periodUnrecorded')}</Text>
      ) : (
      <View style={styles.periodRow}>
        <View style={styles.periodBox}>
          <Text numberOfLines={2} style={styles.periodLabel}>{t('calendar.periodStart')}</Text>
          <Text style={styles.periodValue}>{formatShortDate(periodStartDate)}</Text>
        </View>
        <View style={styles.periodBox}>
          <Text numberOfLines={2} style={styles.periodLabel}>{t('calendar.periodEnd')}</Text>
          <Text style={styles.periodValue}>{formatShortDate(periodEndDate)}</Text>
        </View>
        <View style={styles.periodBox}>
          <Text numberOfLines={2} style={styles.periodLabel}>{t('calendar.dayCard.periodDurationLabel')}</Text>
          <Text style={styles.periodValue}>{t('averageCycle.days', {count: periodDuration})}</Text>
        </View>
      </View>
      )}

      {onDeclarePeriodStart && !editingPeriod ? (
        <Pressable
          accessibilityLabel={t('calendar.dayCard.declareCta')}
          accessibilityRole="button"
          onPress={onDeclarePeriodStart}
          style={({pressed}) => [styles.declareButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={PERIOD_COLOR} name="water-plus-outline" size={15} />
          <Text style={styles.declareText}>{t('calendar.dayCard.declareCta')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    topRow: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8},
    dateBlock: {flexShrink: 1, minWidth: '55%'},
    gregorianDate: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    hijriDate: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5},
    cycleDayBadge: {borderRadius: 12, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6},
    cycleDayText: {color: theme.colors.primary, fontSize: 11, fontWeight: '700'},
    phaseRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
    phaseIcon: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24},
    phaseCopy: {flex: 1, marginLeft: 12},
    phaseTitle: {fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    phaseSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12},
    healthGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10},
    healthRow: {flexDirection: 'row', alignItems: 'flex-start', flexBasis: '47%', flexGrow: 1, gap: 8},
    healthCopy: {flex: 1, minWidth: 0},
    healthLabel: {color: theme.colors.textSecondary, fontSize: 10.5},
    healthValue: {marginTop: 1, color: theme.colors.text, fontSize: 12.5, fontWeight: '700'},
    periodRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10},
    periodUnrecordedText: {marginTop: 14, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    periodSectionHeader: {marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
    periodSectionTitle: {flex: 1, color: theme.colors.text, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
    editPeriodButton: {flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 11, backgroundColor: withAlpha(theme.colors.surface, 0.97), paddingHorizontal: 10, paddingVertical: 7},
    editPeriodText: {color: theme.colors.primary, fontSize: 11.5, fontWeight: '700'},
    pressed: {opacity: 0.72},
    periodBox: {
      flexBasis: '30%',
      flexGrow: 1,
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primarySoft,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    periodLabel: {color: theme.colors.textSecondary, fontSize: 10},
    periodValue: {marginTop: 3, color: theme.colors.text, fontSize: 12, fontWeight: '700'},
    // Period-semantic decorative tint — fixed, matches PERIOD_COLOR above.
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
    declareText: {color: PERIOD_COLOR, fontSize: 12, fontWeight: '700', textAlign: 'center'},
  });
}

export default memo(SelectedDayCard);
