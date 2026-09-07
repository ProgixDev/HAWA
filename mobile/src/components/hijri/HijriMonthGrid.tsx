import React, {memo, useEffect, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

import {homeRadii} from '../home/homeTheme';
import {sameDay, WEEK_DAYS} from '../../utils/cycleMath';
import {getHijriMonthDays, hijriPartsFor, type HijriMonthDay} from '../../utils/hijriCalendar';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type Props = {
  monthStart: Date;
  monthLabel: string;
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  /** Which direction the visible month just moved in, driving the slide entrance. */
  direction: 1 | -1;
};

const cellDateLabel = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short'}).format(date);

type DayCellProps = {
  cell: HijriMonthDay;
  isSelected: boolean;
  isToday: boolean;
  onSelectDate: (date: Date) => void;
  styles: ReturnType<typeof createStyles>;
};

function HijriDayCell({cell, isSelected, isToday, onSelectDate, styles}: DayCellProps): React.JSX.Element {
  // A very small pop when this specific cell becomes the selection — not
  // when it stays selected across re-renders, and not on every cell.
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isSelected) {return;}
    scale.value = 0.94;
    opacity.value = 0.8;
    scale.value = withTiming(1, {duration: 220});
    opacity.value = withTiming(1, {duration: 220});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.dayCell}>
      <Pressable
        accessibilityLabel={`${cell.hijriDay}, ${cellDateLabel(cell.gregorian)}`}
        accessibilityRole="button"
        accessibilityState={{selected: isSelected}}
        onPress={() => onSelectDate(cell.gregorian)}
        style={({pressed}) => [styles.day, pressed && styles.pressed]}>
        <Animated.View style={[styles.dayFill, isToday && !isSelected && styles.dayToday, isSelected && styles.daySelected, animatedStyle]}>
          <Text style={[styles.dayText, isSelected && styles.dayTextLight]}>{cell.hijriDay}</Text>
          <Text numberOfLines={1} style={[styles.dayGregorian, isSelected && styles.dayTextLight]}>
            {cellDateLabel(cell.gregorian)}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function HijriMonthGrid({
  monthStart,
  monthLabel,
  today,
  selectedDate,
  onSelectDate,
  onPrevious,
  onNext,
  onToday,
  direction,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const days = useMemo(() => getHijriMonthDays(monthStart), [monthStart]);
  const offset = (monthStart.getDay() + 6) % 7;
  const cells = useMemo<Array<HijriMonthDay | null>>(
    () => [...Array.from({length: offset}, () => null), ...days],
    [offset, days],
  );

  const isViewingCurrentMonth = useMemo(() => {
    const viewed = hijriPartsFor(monthStart);
    const current = hijriPartsFor(today);
    return viewed.year === current.year && viewed.month === current.month;
  }, [monthStart, today]);

  // Whole-grid, single-container transition on month change — extremely
  // subtle (8px), not applied per cell.
  const gridTranslateX = useSharedValue(0);
  const gridOpacity = useSharedValue(1);
  useEffect(() => {
    gridTranslateX.value = direction === 1 ? 8 : -8;
    gridOpacity.value = 0.75;
    gridTranslateX.value = withTiming(0, {duration: 260});
    gridOpacity.value = withTiming(1, {duration: 260});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart]);
  const gridAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
    transform: [{translateX: gridTranslateX.value}],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityLabel="Mois hijri précédent"
          hitSlop={10}
          onPress={onPrevious}
          style={({pressed}) => [styles.navButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={22} />
        </Pressable>

        <Text numberOfLines={1} style={styles.monthTitle}>{monthLabel}</Text>

        <Pressable
          accessibilityLabel="Mois hijri suivant"
          hitSlop={10}
          onPress={onNext}
          style={({pressed}) => [styles.navButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={22} />
        </Pressable>
      </View>

      {!isViewingCurrentMonth ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToday}
          style={({pressed}) => [styles.todayButton, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="calendar-today" size={12} />
          <Text style={styles.todayButtonText}>Revenir à aujourd’hui</Text>
        </Pressable>
      ) : null}

      <View style={styles.weekRow}>
        {WEEK_DAYS.map(day => (
          <Text key={day} numberOfLines={1} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <Animated.View style={[styles.daysGrid, gridAnimatedStyle]}>
        {cells.map((cell, index) => {
          if (!cell) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          return (
            <HijriDayCell
              cell={cell}
              isSelected={sameDay(cell.gregorian, selectedDate)}
              isToday={sameDay(cell.gregorian, today)}
              key={cell.gregorian.toISOString()}
              onSelectDate={onSelectDate}
              styles={styles}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {borderRadius: homeRadii.card, backgroundColor: theme.colors.surface, padding: 16, ...theme.shadow},
    monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
    navButton: {
      width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
      borderRadius: 18, backgroundColor: theme.colors.primarySoft,
    },
    monthTitle: {flex: 1, textAlign: 'center', color: theme.colors.text, fontFamily: 'serif', fontSize: 18, fontWeight: '700'},
    todayButton: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
      marginTop: 10, borderRadius: 12, backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    todayButtonText: {color: theme.colors.primary, fontSize: 11, fontWeight: '700'},
    weekRow: {flexDirection: 'row', marginTop: 16},
    weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center'},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6},
    dayCell: {width: '14.2857%', minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
    day: {width: '88%', minHeight: 42, maxWidth: 44, borderRadius: 14, overflow: 'hidden'},
    dayFill: {flex: 1, width: '100%', paddingVertical: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 14},
    dayText: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    dayGregorian: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 8.5},
    dayTextLight: {color: onPrimaryTextColor(theme)},
    dayToday: {borderWidth: 1.6, borderStyle: 'dashed', borderColor: theme.shadow.shadowColor},
    daySelected: {backgroundColor: theme.colors.primary},
    pressed: {opacity: 0.85},
  });
}

export default memo(HijriMonthGrid);
