import React, {useEffect, useMemo, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

// Same visual pattern as the existing onboarding calendar (see
// CycleInformationScreen.tsx) — kept as its own component here since that
// screen must not be modified, but the look should stay consistent.
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
};

function InlineCalendarPickerModal({visible, value, onClose, onSelect}: Props): React.JSX.Element {
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

  const chooseDay = (day: number) => {
    onSelect(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => {}} style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityLabel="Mois précédent"
              hitSlop={8}
              onPress={() => changeMonth(-1)}
              style={styles.calendarArrowButton}>
              <Text style={styles.calendarArrowText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>
              {new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(visibleMonth)}
            </Text>
            <Pressable
              accessibilityLabel="Mois suivant"
              hitSlop={8}
              onPress={() => changeMonth(1)}
              style={styles.calendarArrowButton}>
              <Text style={styles.calendarArrowText}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const selected =
                day === value.getDate() &&
                visibleMonth.getMonth() === value.getMonth() &&
                visibleMonth.getFullYear() === value.getFullYear();
              return (
                <View key={`${day ?? 'empty'}-${index}`} style={styles.dayCell}>
                  {day ? (
                    <Pressable
                      accessibilityLabel={`${day} ${new Intl.DateTimeFormat('fr-FR', {month: 'long'}).format(visibleMonth)}`}
                      onPress={() => chooseDay(day)}
                      style={[styles.dayButton, selected && styles.daySelected]}>
                      <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
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

const styles = StyleSheet.create({
  modalBackdrop: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,18,65,0.40)', paddingHorizontal: 24},
  calendarCard: {width: '100%', maxWidth: 380, borderRadius: 22, backgroundColor: '#FFFCFF', padding: 16, elevation: 12},
  calendarHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  calendarArrowButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#F0E8FC'},
  calendarArrowText: {color: '#6848BC', fontSize: 27, fontWeight: '600', lineHeight: 30},
  calendarTitle: {color: '#382174', fontFamily: 'serif', fontSize: 19, fontWeight: '600', textTransform: 'capitalize'},
  weekRow: {flexDirection: 'row', marginTop: 16},
  weekDay: {width: '14.2857%', color: '#85739F', fontSize: 12, textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8},
  dayCell: {width: '14.2857%', height: 39, alignItems: 'center', justifyContent: 'center'},
  dayButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17},
  daySelected: {backgroundColor: '#6848BC'},
  dayText: {color: '#2A2050', fontSize: 14},
  dayTextSelected: {color: '#FFFFFF', fontWeight: '700'},
});

export default InlineCalendarPickerModal;
