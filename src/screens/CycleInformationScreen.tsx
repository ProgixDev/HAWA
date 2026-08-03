import React, {useMemo, useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {setCyclePreferences} from '../state/onboardingPreferences';

const OBJECTIVE_BACKGROUND = require('../assets/images/objective-background.png');
const CALENDAR_ICON = require('../assets/images/cycle-calendar-icon.png');
const CHEVRON_ICON = require('../assets/images/cycle-chevron-icon.png');
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const PERIOD_DURATIONS = Array.from({length: 9}, (_, index) => index + 2);
const CYCLE_DURATIONS = Array.from({length: 21}, (_, index) => index + 20);

type Regularity = 'yes' | 'no' | 'unknown';
type DurationPicker = 'period' | 'cycle' | null;
type Props = NativeStackScreenProps<RootStackParamList, 'CycleInformation'>;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

function CycleInformationScreen({navigation}: Props): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [durationPicker, setDurationPicker] = useState<DurationPicker>(null);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [cycleDuration, setCycleDuration] = useState(28);
  const [regularity, setRegularity] = useState<Regularity>('yes');

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

  const durationOptions =
    durationPicker === 'period' ? PERIOD_DURATIONS : CYCLE_DURATIONS;

  const chooseDay = (day: number) => {
    setSelectedDate(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
    );
    setCalendarVisible(false);
  };

  const changeMonth = (offset: number) => {
    setVisibleMonth(
      current => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  const selectDuration = (duration: number) => {
    if (durationPicker === 'period') {
      setPeriodDuration(duration);
    } else {
      setCycleDuration(duration);
    }
    setDurationPicker(null);
  };

  const handleNext = () => {
    setCyclePreferences({lastPeriodStart: selectedDate, periodDuration, cycleDuration, regularity});
    navigation.navigate('SecuritySetup');
  };

  return (
    <ImageBackground
      source={OBJECTIVE_BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{'Informations\nde ton cycle'}</Text>
            <Text style={styles.subtitle}>
              {'Ces informations nous aident à mieux\nte comprendre et t’accompagner.'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Date des dernières règles</Text>
            <Pressable
              accessibilityLabel="Choisir la date des dernières règles"
              accessibilityRole="button"
              onPress={() => setCalendarVisible(true)}
              style={({pressed}) => [styles.field, pressed && styles.pressed]}>
              <Image
                accessibilityIgnoresInvertColors
                source={CALENDAR_ICON}
                style={styles.calendarFieldIcon}
              />
              <Text style={styles.fieldText}>{formatDate(selectedDate)}</Text>
              <Image
                accessibilityIgnoresInvertColors
                source={CALENDAR_ICON}
                style={styles.calendarFieldIcon}
              />
            </Pressable>

            <Text style={styles.label}>Durée moyenne des règles</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDurationPicker('period')}
              style={({pressed}) => [styles.field, pressed && styles.pressed]}>
              <Text style={styles.fieldText}>{periodDuration} jours</Text>
              <Image
                accessibilityIgnoresInvertColors
                source={CHEVRON_ICON}
                style={styles.chevronIcon}
              />
            </Pressable>

            <Text style={styles.label}>Durée moyenne du cycle</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDurationPicker('cycle')}
              style={({pressed}) => [styles.field, pressed && styles.pressed]}>
              <Text style={styles.fieldText}>{cycleDuration} jours</Text>
              <Image
                accessibilityIgnoresInvertColors
                source={CHEVRON_ICON}
                style={styles.chevronIcon}
              />
            </Pressable>

            <Text style={styles.label}>Cycle régulier ?</Text>
            <View accessibilityRole="radiogroup" style={styles.regularityRow}>
              {[
                {id: 'yes' as const, label: 'Oui'},
                {id: 'no' as const, label: 'Non'},
                {id: 'unknown' as const, label: 'Je ne sais pas'},
              ].map(option => {
                const selected = regularity === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    onPress={() => setRegularity(option.id)}
                    style={({pressed}) => [
                      styles.regularityOption,
                      selected && styles.regularitySelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                      numberOfLines={1}
                      style={styles.regularityText}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.spacer} />
          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextText}>Suivant</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
        transparent
        visible={calendarVisible}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCalendarVisible(false)}>
          <Pressable style={styles.calendarCard} onPress={() => {}}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                hitSlop={8}
                onPress={() => changeMonth(-1)}
                style={styles.calendarArrowButton}>
                <Text style={styles.calendarArrowText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.calendarTitle}>
                {new Intl.DateTimeFormat('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                }).format(visibleMonth)}
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
                  day === selectedDate.getDate() &&
                  visibleMonth.getMonth() === selectedDate.getMonth() &&
                  visibleMonth.getFullYear() === selectedDate.getFullYear();
                return (
                  <View key={`${day ?? 'empty'}-${index}`} style={styles.dayCell}>
                    {day && (
                      <Pressable
                        onPress={() => chooseDay(day)}
                        style={[styles.dayButton, selected && styles.daySelected]}>
                        <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                          {day}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setDurationPicker(null)}
        transparent
        visible={durationPicker !== null}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDurationPicker(null)}>
          <Pressable style={styles.durationCard} onPress={() => {}}>
            <Text style={styles.durationTitle}>
              {durationPicker === 'period'
                ? 'Durée des règles'
                : 'Durée du cycle'}
            </Text>
            <View style={styles.durationGrid}>
              {durationOptions.map(duration => (
                <Pressable
                  key={duration}
                  onPress={() => selectDuration(duration)}
                  style={({pressed}) => [
                    styles.durationOption,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.durationOptionText}>{duration} jours</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: colors.cream},
  safeArea: {flex: 1},
  content: {
    flex: 1,
    paddingTop: 46,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {
    color: '#083F31',
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {marginTop: 8, color: '#37413F', fontSize: 13, lineHeight: 19, textAlign: 'center'},
  form: {gap: 7},
  label: {marginTop: 5, color: '#31534A', fontSize: 13, fontWeight: '500'},
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D9C7',
    borderRadius: 13,
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    paddingHorizontal: 13,
  },
  fieldText: {flex: 1, marginHorizontal: 10, color: '#25302E', fontSize: 14},
  calendarFieldIcon: {width: 22, height: 22, resizeMode: 'contain'},
  chevronIcon: {width: 20, height: 20, resizeMode: 'contain'},
  regularityRow: {flexDirection: 'row', gap: 8},
  regularityOption: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D9C7',
    borderRadius: 13,
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    paddingHorizontal: 5,
  },
  regularitySelected: {borderColor: '#176548', backgroundColor: '#F2F6EF'},
  regularityText: {
    color: '#26302E',
    fontSize: 13,
    textAlign: 'center',
  },
  spacer: {flex: 1},
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#176548',
    elevation: 3,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.8},
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3, 35, 27, 0.35)',
    padding: spacing.lg,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    backgroundColor: '#FFFEF9',
    padding: spacing.md,
    elevation: 12,
  },
  calendarHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  calendarArrowButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#F5F1E7',
  },
  calendarArrowText: {
    color: '#176548',
    fontSize: 27,
    fontWeight: '600',
    lineHeight: 30,
  },
  calendarTitle: {color: '#174F3D', fontFamily: 'serif', fontSize: 19, fontWeight: '600'},
  weekRow: {flexDirection: 'row', marginTop: spacing.md},
  weekDay: {width: '14.2857%', color: '#8A7960', fontSize: 12, textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm},
  dayCell: {width: '14.2857%', height: 39, alignItems: 'center', justifyContent: 'center'},
  dayButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17},
  daySelected: {backgroundColor: '#176548'},
  dayText: {color: '#26302E', fontSize: 14},
  dayTextSelected: {color: '#FFFFFF', fontWeight: '700'},
  durationCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: '#FFFEF9',
    padding: spacing.md,
    elevation: 12,
  },
  durationTitle: {marginBottom: spacing.md, color: '#174F3D', fontFamily: 'serif', fontSize: 20, fontWeight: '600', textAlign: 'center'},
  durationGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'},
  durationOption: {minWidth: 82, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E4D5BD', borderRadius: 12},
  durationOptionText: {color: '#26302E', fontSize: 13},
});

export default CycleInformationScreen;
