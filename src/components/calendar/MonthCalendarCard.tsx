import React, {memo, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import {
  type CycleBasics,
  formatHijriDay,
  formatHijriMonthYear,
  kindFor,
  sameDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import type {CalendarFilters} from '../../state/calendarFilters';

export type CalendarDisplayMode = 'gregorian' | 'hijri' | 'double';

export type DayJournalFlags = {mood: boolean; notes: boolean; symptoms: boolean};

type Props = {
  visibleMonth: Date;
  onChangeMonth: (offset: number) => void;
  displayMode: CalendarDisplayMode;
  onChangeDisplayMode: (mode: CalendarDisplayMode) => void;
  basics: CycleBasics;
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  journalFlagsByDate: Record<string, DayJournalFlags>;
  filters: CalendarFilters;
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const backgroundColorStyle = (backgroundColor: string) => ({backgroundColor});

const OVULATION_COLOR = '#8B5CF6';
const NOTES_COLOR = '#2C8E93';

const MODES: {key: CalendarDisplayMode; label: string}[] = [
  {key: 'gregorian', label: 'Grégorien'},
  {key: 'hijri', label: 'Hijri'},
  {key: 'double', label: 'Double'},
];

function DayCell({
  date,
  basics,
  today,
  selectedDate,
  onSelectDate,
  showHijri,
  flags,
  filters,
}: {
  date: Date | null;
  basics: CycleBasics;
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  showHijri: boolean;
  flags?: DayJournalFlags;
  filters: CalendarFilters;
}) {
  if (!date) {
    return <View style={styles.dayCell} />;
  }

  const kind = kindFor(date, basics);
  const isSelected = sameDay(date, selectedDate);
  const isToday = sameDay(date, today);
  const hijriDay = showHijri ? formatHijriDay(date) : undefined;

  const dots: string[] = [];
  if (kind === 'period' && filters.rules) {dots.push(homeColors.pink);}
  if (kind === 'ovulation') {dots.push(OVULATION_COLOR);}
  if (kind === 'fertile') {dots.push('#3E8E56');}
  if (flags?.mood && filters.mood) {dots.push('#E0A93E');}
  if ((flags?.notes || flags?.symptoms) && (filters.notes || filters.symptoms)) {dots.push(NOTES_COLOR);}

  return (
    <View style={styles.dayCell}>
      <Pressable
        accessibilityLabel={`${date.getDate()}, ${kind}`}
        accessibilityRole="button"
        onPress={() => onSelectDate(date)}
        style={({pressed}) => [
          styles.day,
          kind === 'period' && filters.rules && styles.periodDay,
          kind === 'fertile' && styles.fertileDay,
          kind === 'ovulation' && styles.ovulationDay,
          isSelected && styles.selectedDay,
          isToday && styles.todayDayBorder,
          pressed && styles.pressed,
        ]}>
        <Text
  style={[
    styles.dayText,

    // Les jours sélectionnés / ovulation sont normalement blancs
    (isSelected || kind === 'ovulation') && styles.dayTextLight,

    // Aujourd'hui doit toujours rester noir et bien visible
    isToday && styles.todayDayText,
  ]}>
  {date.getDate()}
</Text>
        {hijriDay ? (
          <Text
            numberOfLines={1}
            style={[styles.hijriDayText, (isSelected || kind === 'ovulation') && styles.dayTextLight]}>
            {hijriDay}
          </Text>
        ) : null}
        {dots.length > 0 ? (
          <View style={styles.dotRow}>
            {dots.slice(0, 3).map((color, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  backgroundColorStyle(isSelected ? '#FFFFFF' : color),
                ]}
              />
            ))}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function MonthCalendarCard({
  visibleMonth,
  onChangeMonth,
  displayMode,
  onChangeDisplayMode,
  basics,
  today,
  selectedDate,
  onSelectDate,
  journalFlagsByDate,
  filters,
}: Props): React.JSX.Element {
  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({length: offset + count}, (_, index) =>
      index < offset ? null : new Date(year, month, index - offset + 1),
    );
  }, [visibleMonth]);

  const showHijri = displayMode !== 'gregorian';

  const hijriRangeLabel = useMemo(() => {
    if (!showHijri) {return undefined;}
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const last = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const firstLabel = formatHijriMonthYear(first);
    const lastLabel = formatHijriMonthYear(last);
    if (!firstLabel) {return undefined;}
    if (!lastLabel || lastLabel === firstLabel) {return firstLabel;}
    return `${firstLabel} – ${lastLabel}`;
  }, [showHijri, visibleMonth]);

  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <Pressable accessibilityLabel="Mois précédent" hitSlop={12} onPress={() => onChangeMonth(-1)}>
          <MaterialDesignIcons color={homeColors.primary} name="chevron-left" size={24} />
        </Pressable>

        <View style={styles.monthTitleBlock}>
          <Text numberOfLines={1} style={styles.monthTitle}>
            {new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(visibleMonth)}
          </Text>
          {hijriRangeLabel ? (
            <Text numberOfLines={2} style={styles.hijriRange}>{hijriRangeLabel}</Text>
          ) : null}
        </View>

        <Pressable accessibilityLabel="Mois suivant" hitSlop={12} onPress={() => onChangeMonth(1)}>
          <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={24} />
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {MODES.map(mode => {
          const active = mode.key === displayMode;
          return (
            <Pressable
              accessibilityRole="button"
              key={mode.key}
              onPress={() => onChangeDisplayMode(mode.key)}
              style={({pressed}) => [styles.modeButton, active && styles.modeButtonActive, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={[styles.modeText, active && styles.modeTextActive]}>{mode.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map(day => (
          <Text key={day} numberOfLines={1} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((date, index) => (
          <DayCell
            basics={basics}
            date={date}
            filters={filters}
            flags={date ? journalFlagsByDate[dateKey(date)] : undefined}
            key={date ? date.toISOString() : `empty-${index}`}
            onSelectDate={onSelectDate}
            selectedDate={selectedDate}
            showHijri={showHijri}
            today={today}
          />
        ))}
      </View>

      <View style={styles.legendRow}>
        <LegendDot color={homeColors.pink} label="Règles" />
        <LegendDot color="#3E8E56" label="Fertile" />
        <LegendDot color={OVULATION_COLOR} label="Ovulation" />
        <LegendDot color="#E0A93E" label="Humeur" />
        <LegendDot color={NOTES_COLOR} label="Notes" />
        <LegendDot color={homeColors.primaryDark} label="Aujourd’hui" outline />
      </View>
    </View>
  );
}

function LegendDot({color, label, outline = false}: {color: string; label: string; outline?: boolean}) {
  return (
    <View style={styles.legendItem}>
      {outline ? (
        <View
          style={[
            styles.legendTodayRing,
            {borderColor: color},
          ]}
        />
      ) : (
        <View style={[styles.legendDot, {backgroundColor: color}]} />
      )}
      <Text numberOfLines={1} style={styles.legendText}>{label}</Text>
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
  monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  monthTitleBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 6},
  monthTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 19, fontWeight: '700', textTransform: 'capitalize'},
  hijriRange: {marginTop: 2, color: homeColors.primary, fontSize: 10, fontWeight: '600', textAlign: 'center'},
  modeRow: {flexDirection: 'row', marginTop: 12, gap: 8, backgroundColor: homeColors.lightLavender, borderRadius: homeRadii.button, padding: 4},
  modeButton: {flex: 1, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderRadius: homeRadii.button - 2},
  modeButtonActive: {backgroundColor: homeColors.primary},
  modeText: {color: homeColors.textSecondary, fontSize: 11.5, fontWeight: '700'},
  modeTextActive: {color: '#FFFFFF'},
  weekRow: {flexDirection: 'row', marginTop: 14},
  weekDay: {width: '14.2857%', color: homeColors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6},
  dayCell: {width: '14.2857%', minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
  day: {width: '86%', minHeight: 40, maxWidth: 42, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 14},
  dayText: {color: homeColors.textPrimary, fontSize: 13, fontWeight: '600'},
  hijriDayText: {color: homeColors.textSecondary, fontSize: 8.5, marginTop: 1},
  dayTextLight: {color: '#FFFFFF'},
  periodDay: {backgroundColor: '#F7D7D6'},
  fertileDay: {backgroundColor: '#DCEFE0'},
  ovulationDay: {backgroundColor: OVULATION_COLOR},
  selectedDay: {backgroundColor: homeColors.primary},
  todayDayBorder: {
    borderWidth: 1.8,
    borderStyle: 'dashed',
    borderColor: '#211A35',
    borderRadius: 14,
  },
  todayDayText: {
  color: '#211A35',
  fontSize: 14,
  fontWeight: '800',
  zIndex: 4,
},
  dotRow: {flexDirection: 'row', gap: 2, marginTop: 1},
  dot: {width: 3.5, height: 3.5, borderRadius: 2},
  legendRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 9, height: 9, borderRadius: 5},
  legendTodayRing: {
    width: 12,
    height: 12,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderRadius: 6,
    backgroundColor: 'rgba(105,73,190,0.03)',
  },
  legendText: {color: homeColors.textSecondary, fontSize: 10.5},
  pressed: {opacity: 0.8},
});

export default memo(MonthCalendarCard);
