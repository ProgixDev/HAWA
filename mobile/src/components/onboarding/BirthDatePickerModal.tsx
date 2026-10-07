import React, {useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {capitalize, dateFormatLocale} from '../../utils/cycleMath';

// Year → Month → Day birth-date picker — a faster alternative to the monthly
// calendar (InlineCalendarPickerModal.tsx) for a date that can be many years back,
// where repeated "previous month" taps are impractical. Same card/backdrop shell as
// InlineCalendarPickerModal (maxWidth 380, radius 22, padding 16) for visual
// consistency, but the content is three cascading selection stages instead of a
// calendar grid. A breadcrumb lets the mother jump back to an earlier stage at any
// time (CLAUDE.md-style "easy correction", not a strict wizard).
//
// Future dates are structurally impossible to reach, not just rejected afterwards:
// the year list never offers a year after `maximumDate`'s, the month grid disables
// months after the current one when the selected year is the current year, and the
// day grid disables days after today when the selected year+month is the current
// month.

const YEAR_ROW_HEIGHT = 50;
const DEFAULT_YEAR_SPAN = 100;

// Locale FORMAT only (never the date calculation itself) — uses the shared,
// 3-way-correct dateFormatLocale() from cycleMath.ts (previously a local
// en/fr-only duplicate here, which silently fell through to French for
// Spanish). Month names are derived from Intl rather than a second
// hardcoded EN table, so there is exactly one place (the OS/ICU locale data)
// that owns month-name wording.
const monthNames = (): string[] =>
  Array.from({length: 12}, (_, index) =>
    capitalize(new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long'}).format(new Date(2000, index, 1))),
  );

type Stage = 'year' | 'month' | 'day';

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  title?: string;
  /** Upper bound — defaults to today; years/months/days after it are never offered. */
  maximumDate?: Date;
  /** Lower bound — defaults to 100 years before `maximumDate`. */
  minimumDate?: Date;
};

function BirthDatePickerModal({visible, value, onClose, onSelect, title, maximumDate, minimumDate}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const MONTHS = monthNames();
  const today = maximumDate ?? new Date();
  const minYear = minimumDate ? minimumDate.getFullYear() : today.getFullYear() - DEFAULT_YEAR_SPAN;
  const maxYear = today.getFullYear();

  const [stage, setStage] = useState<Stage>('year');
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const yearListRef = useRef<FlatList<number>>(null);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) {list.push(y);}
    return list;
  }, [maxYear, minYear]);
  const selectedYearIndex = Math.max(0, years.indexOf(year));

  // Reopens at the YEAR stage every time (the flow this task's spec shows), but
  // positioned on the already-selected year/month rather than starting over. The
  // list itself always renders every year (no `initialScrollIndex` — combined with
  // `getItemLayout` that only renders forward from that index, never the years
  // before it); scrollToIndex, after mount, positions it without that gap.
  useEffect(() => {
    if (visible) {
      setStage('year');
      setYear(value.getFullYear());
      setMonth(value.getMonth());
      requestAnimationFrame(() => {
        yearListRef.current?.scrollToIndex({index: selectedYearIndex, animated: false, viewPosition: 0.3});
      });
    }
    // selectedYearIndex is derived from `value`, already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  const isCurrentYear = year === today.getFullYear();
  const isCurrentYearMonth = isCurrentYear && month === today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = useMemo(() => Array.from({length: daysInMonth}, (_, index) => index + 1), [daysInMonth]);

  const chooseYear = (nextYear: number) => {
    setYear(nextYear);
    setStage('month');
  };
  const chooseMonth = (nextMonth: number) => {
    if (isCurrentYear && nextMonth > today.getMonth()) {return;} // never selectable — no future month
    setMonth(nextMonth);
    setStage('day');
  };
  const chooseDay = (day: number) => {
    if (isCurrentYearMonth && day > today.getDate()) {return;} // never selectable — no future day
    onSelect(new Date(year, month, day));
    onClose();
  };

  const stageTitle = stage === 'year' ? t('birthDatePicker.chooseYear') : stage === 'month' ? t('birthDatePicker.chooseMonth') : `${MONTHS[month]} ${year}`;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => {}} style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}

          {stage !== 'year' ? (
            <View style={styles.breadcrumb}>
              <Pressable
                accessibilityLabel={t('birthDatePicker.backToYearA11y', {year})}
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => setStage('year')}
                style={({pressed}) => [styles.breadcrumbChip, pressed && styles.pressed]}>
                <Text style={styles.breadcrumbText}>{year}</Text>
              </Pressable>
              {stage === 'day' ? (
                <>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={16} />
                  <Pressable
                    accessibilityLabel={t('birthDatePicker.backToMonthA11y', {month: MONTHS[month]})}
                    accessibilityRole="button"
                    hitSlop={6}
                    onPress={() => setStage('month')}
                    style={({pressed}) => [styles.breadcrumbChip, pressed && styles.pressed]}>
                    <Text style={styles.breadcrumbText}>{MONTHS[month]}</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.stageTitle}>{stageTitle}</Text>

          {stage === 'year' ? (
            <FlatList
              data={years}
              getItemLayout={(_, index) => ({length: YEAR_ROW_HEIGHT, offset: YEAR_ROW_HEIGHT * index, index})}
              // A modest ~100-row list of plain text rows — rendering it all up front
              // avoids pop-in while scrolling and keeps every year reachable the instant
              // the list opens, not just the window immediately around the selected one.
              initialNumToRender={years.length}
              keyExtractor={item => String(item)}
              ref={yearListRef}
              renderItem={({item}) => {
                const selected = item === year;
                return (
                  <Pressable
                    accessibilityLabel={String(item)}
                    accessibilityRole="button"
                    accessibilityState={{selected}}
                    onPress={() => chooseYear(item)}
                    style={({pressed}) => [styles.yearRow, selected && styles.yearRowSelected, pressed && styles.pressed]}>
                    <Text style={[styles.yearRowText, selected && styles.yearRowTextSelected]}>{item}</Text>
                    {selected ? <MaterialDesignIcons color={theme.colors.primary} name="check" size={18} /> : null}
                  </Pressable>
                );
              }}
              style={styles.yearList}
            />
          ) : null}

          {stage === 'month' ? (
            <View style={styles.monthGrid}>
              {MONTHS.map((label, index) => {
                const selected = index === month;
                const disabled = isCurrentYear && index > today.getMonth();
                return (
                  <Pressable
                    accessibilityLabel={label}
                    accessibilityRole="button"
                    accessibilityState={{selected, disabled}}
                    disabled={disabled}
                    key={label}
                    onPress={() => chooseMonth(index)}
                    style={({pressed}) => [
                      styles.monthCell,
                      selected && styles.monthCellSelected,
                      disabled && styles.monthCellDisabled,
                      pressed && !disabled && styles.pressed,
                    ]}>
                    <Text style={[styles.monthCellText, selected && styles.monthCellTextSelected, disabled && styles.monthCellTextDisabled]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {stage === 'day' ? (
            <View style={styles.dayGrid}>
              {days.map(day => {
                const selected = day === value.getDate() && month === value.getMonth() && year === value.getFullYear();
                const disabled = isCurrentYearMonth && day > today.getDate();
                return (
                  <Pressable
                    accessibilityLabel={`${day} ${MONTHS[month]}`}
                    accessibilityRole="button"
                    accessibilityState={{selected, disabled}}
                    disabled={disabled}
                    key={day}
                    onPress={() => chooseDay(day)}
                    style={({pressed}) => [
                      styles.dayCell,
                      selected && styles.dayCellSelected,
                      disabled && styles.dayCellDisabled,
                      pressed && !disabled && styles.pressed,
                    ]}>
                    <Text style={[styles.dayCellText, selected && styles.dayCellTextSelected, disabled && styles.dayCellTextDisabled]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    modalBackdrop: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(theme.shadow.shadowColor, 0.40), paddingHorizontal: 24},
    card: {width: '100%', maxWidth: 380, maxHeight: '80%', borderRadius: 22, backgroundColor: theme.colors.surface, padding: 16, elevation: 12},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 18, fontWeight: '700', textAlign: 'center'},
    breadcrumb: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12},
    breadcrumbChip: {borderRadius: 999, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6},
    breadcrumbText: {color: theme.colors.primary, fontSize: 13, fontWeight: '700'},
    stageTitle: {marginTop: 14, marginBottom: 10, color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.4},
    yearList: {maxHeight: 280},
    yearRow: {
      height: YEAR_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    yearRowSelected: {backgroundColor: theme.colors.primarySoft},
    yearRowText: {color: theme.colors.text, fontSize: 16, fontWeight: '600'},
    yearRowTextSelected: {color: theme.colors.primary, fontWeight: '800'},
    monthGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between'},
    monthCell: {
      width: '31%',
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 4,
    },
    monthCellSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    monthCellDisabled: {opacity: 0.35},
    monthCellText: {color: theme.colors.text, fontSize: 12.5, fontWeight: '600', textAlign: 'center'},
    monthCellTextSelected: {color: theme.colors.primary, fontWeight: '800'},
    monthCellTextDisabled: {color: theme.colors.textMuted},
    dayGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start'},
    dayCell: {
      width: '12.5%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
    },
    dayCellSelected: {backgroundColor: theme.colors.primary},
    dayCellDisabled: {opacity: 0.3},
    dayCellText: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    dayCellTextSelected: {color: onPrimaryTextColor(theme), fontWeight: '800'},
    dayCellTextDisabled: {color: theme.colors.textMuted},
    pressed: {opacity: 0.85},
  });
}

export default BirthDatePickerModal;
