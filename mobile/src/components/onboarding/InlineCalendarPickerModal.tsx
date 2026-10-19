import React, {useEffect, useMemo, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {dateFormatLocale, localizedWeekDays} from '../../utils/cycleMath';
import {displayTitleCase} from '../../utils/textCase';

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  /** Optional heading shown above the calendar grid — existing callers that
   * don't pass these keep the exact same bare-calendar look. */
  title?: string;
  subtitle?: string;
  /** Optional upper bound — days after this date render disabled (greyed,
   * unpressable) instead of being silently correctable after the fact.
   * Omitted by existing callers, so their behavior is unchanged. */
  maximumDate?: Date;
  /** Optional lower bound — days before this date render disabled too. */
  minimumDate?: Date;
};

function InlineCalendarPickerModal({visible, value, onClose, onSelect, title, subtitle, maximumDate, minimumDate}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const weekDays = localizedWeekDays();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  useEffect(() => {
    if (visible) {setVisibleMonth(new Date(value.getFullYear(), value.getMonth(), 1));}
  }, [visible, value]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({length: 42}, (_, index) => {
      const day = index - firstDay + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  }, [visibleMonth]);

  const changeMonth = (offset: number) => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const isDisabledDay = (day: number) => {
    if (!maximumDate && !minimumDate) {return false;}
    const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    return (
      (maximumDate !== undefined && candidate.getTime() > maximumDate.getTime()) ||
      (minimumDate !== undefined && candidate.getTime() < minimumDate.getTime())
    );
  };

  const chooseDay = (day: number) => {
    if (isDisabledDay(day)) {return;}
    onSelect(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => {}} style={styles.calendarCard}>
          {title ? (
            <View style={styles.titleBlock}>
              <AwaText accessibilityRole="header" style={styles.pickerTitle} variant="titleLarge">{title}</AwaText>
              {subtitle ? <AwaText colorRole="onSurfaceVariant" style={styles.pickerSubtitle} variant="bodySmall">{subtitle}</AwaText> : null}
            </View>
          ) : null}

          <View style={styles.calendarHeader}>
            <AwaIconButton
              accessibilityLabel={t('inlineCalendarPicker.previousMonthA11y')}
              icon="chevron-left"
              onPress={() => changeMonth(-1)}
              variant="tonal"
            />
            <AwaText style={styles.calendarTitle} variant="titleMedium">
              {displayTitleCase(new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long', year: 'numeric'}).format(visibleMonth))}
            </AwaText>
            <AwaIconButton
              accessibilityLabel={t('inlineCalendarPicker.nextMonthA11y')}
              icon="chevron-right"
              onPress={() => changeMonth(1)}
              variant="tonal"
            />
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <AwaText colorRole="onSurfaceVariant" key={`${day}-${index}`} style={styles.weekDay} variant="labelMedium">{day}</AwaText>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const selected =
                day === value.getDate() &&
                visibleMonth.getMonth() === value.getMonth() &&
                visibleMonth.getFullYear() === value.getFullYear();
              const disabled = day !== null && isDisabledDay(day);
              return (
                <View key={`${day ?? 'empty'}-${index}`} style={styles.dayCell}>
                  {day ? (
                    <Pressable
                      accessibilityLabel={t('inlineCalendarPicker.dayA11y', {day, month: new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long'}).format(visibleMonth)})}
                      accessibilityState={{disabled}}
                      disabled={disabled}
                      hitSlop={4}
                      onPress={() => chooseDay(day)}
                      style={[styles.dayButton, selected && styles.daySelected]}>
                      <Text style={[styles.dayText, selected && styles.dayTextSelected, disabled && styles.dayTextDisabled]}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    modalBackdrop: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(theme.shadow.shadowColor, 0.40), paddingHorizontal: 24},
    calendarCard: {width: '100%', maxWidth: 380, borderRadius: 12, backgroundColor: theme.colors.surface, padding: 16, elevation: 12},
    titleBlock: {marginBottom: 12},
    pickerTitle: {textAlign: 'center'},
    pickerSubtitle: {marginTop: 4, textAlign: 'center'},
    calendarHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    calendarTitle: {textTransform: 'capitalize'},
    weekRow: {flexDirection: 'row', marginTop: 16},
    weekDay: {width: '14.2857%', textAlign: 'center'},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8},
    dayCell: {width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center'},
    dayButton: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20},
    daySelected: {backgroundColor: theme.colors.primary},
    dayText: {color: theme.colors.text, fontSize: 14},
    dayTextSelected: {color: onPrimaryTextColor(theme), fontWeight: '700'},
    dayTextDisabled: {color: theme.colors.textMuted},
  });
}

export default InlineCalendarPickerModal;
