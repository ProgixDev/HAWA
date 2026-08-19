import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageDate,
} from '../state/miscarriagePreferences';
import {diffDays, startOfDay} from '../utils/cycleMath';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageDate'>;

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

const formatMonthYear = (date: Date): string => {
  const label = new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function MiscarriageDateScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Preselect an already-saved miscarriage date if one exists (going back
  // and forward must never lose a prior selection — see section 34 of the
  // spec), otherwise default to today.
  const [initialized, setInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(() => {
      if (!active) {return;}
      const existing = getMiscarriagePreferences().miscarriageDate;
      const restored = existing ? startOfDay(new Date(`${existing}T12:00:00`)) : today;
      setSelectedDate(restored);
      setVisibleMonth(new Date(restored.getFullYear(), restored.getMonth(), 1));
      setInitialized(true);
    });
    return () => {active = false;};
  }, [today]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    const duration = reduceMotion.current ? 0 : 480;
    Animated.parallel([
      Animated.timing(entrance, {toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      Animated.timing(cardEntrance, {
        toValue: 1,
        duration: reduceMotion.current ? 0 : 420,
        delay: reduceMotion.current ? 0 : 130,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [entrance, cardEntrance]);

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

  // The miscarriage date can never be in the future (spec section 6).
  const isCurrentOrFutureMonth =
    visibleMonth.getFullYear() > today.getFullYear() ||
    (visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() >= today.getMonth());

  const changeMonth = (offset: number) => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const chooseDay = (day: number) => {
    const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    if (diffDays(candidate, today) > 0) {return;}
    setSelectedDate(candidate);
  };

  const scrollToCalendar = () => {
    scrollRef.current?.scrollTo({y: 0, animated: true});
  };

  const handleNext = async () => {
    if (saving) {return;}
    setSaving(true);
    try {
      // Timezone-safe 'YYYY-MM-DD' persistence — see setMiscarriageDate().
      await setMiscarriageDate(selectedDate);
      navigation.navigate('MiscarriageBleeding');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };
  const cardStyle = {
    opacity: cardEntrance,
    transform: [
      {translateY: cardEntrance.interpolate({inputRange: [0, 1], outputRange: [14, 0]})},
      {scale: cardEntrance.interpolate({inputRange: [0, 1], outputRange: [0.97, 1]})},
    ],
  };

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm},
          ]}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={entranceStyle}>
            <View style={styles.illustration}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="Calendrier avec un cœur"
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-calendar.png')}
                style={styles.illustrationImage}
              />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Quand a eu lieu{'\n'}ta fausse couche ?</Text>
              <Text style={styles.subtitle}>Cette date nous aide à suivre ton évolution depuis cet événement.</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.calendarCard, cardStyle]}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                hitSlop={8}
                onPress={() => changeMonth(-1)}
                style={({pressed}) => [styles.calendarArrowButton, pressed && styles.pressed]}>
                <Text style={styles.calendarArrowText}>{'<'}</Text>
              </Pressable>

              <Text style={styles.calendarTitle}>{formatMonthYear(visibleMonth)}</Text>

              <Pressable
                accessibilityLabel="Mois suivant"
                disabled={isCurrentOrFutureMonth}
                hitSlop={8}
                onPress={() => changeMonth(1)}
                style={({pressed}) => [
                  styles.calendarArrowButton,
                  isCurrentOrFutureMonth && styles.calendarArrowButtonDisabled,
                  pressed && !isCurrentOrFutureMonth && styles.pressed,
                ]}>
                <Text style={[styles.calendarArrowText, isCurrentOrFutureMonth && styles.calendarArrowTextDisabled]}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                const future = diffDays(candidate, today) > 0;
                const selected =
                  initialized &&
                  !future &&
                  day === selectedDate.getDate() &&
                  visibleMonth.getMonth() === selectedDate.getMonth() &&
                  visibleMonth.getFullYear() === selectedDate.getFullYear();
                return (
                  <View key={`${day}-${index}`} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${day} ${formatMonthYear(visibleMonth)}`}
                      accessibilityState={{disabled: future, selected}}
                      disabled={future}
                      onPress={() => chooseDay(day)}
                      style={[styles.dayButton, selected && styles.daySelected]}>
                      <Text style={[styles.dayText, future && styles.dayTextDisabled, selected && styles.dayTextSelected]}>
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View style={[styles.selectedCard, cardStyle]}>
            <View style={styles.selectedIcon}>
              <MaterialDesignIcons color={PURPLE} name="calendar-heart" size={20} />
            </View>
            <View style={styles.selectedCopy}>
              <Text style={styles.selectedLabel}>Date sélectionnée</Text>
              <Text style={styles.selectedValue}>{formatFullDate(selectedDate)}</Text>
            </View>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={scrollToCalendar}>
              <Text style={styles.modifyText}>Modifier</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.infoCard, cardStyle]}>
            <MaterialDesignIcons color={PURPLE} name="information-outline" size={17} />
            <Text style={styles.infoText}>Tu pourras toujours modifier cette date plus tard.</Text>
          </Animated.View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.nextText}>{saving ? 'Enregistrement…' : 'Suivant'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},

  pageBackgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {flex: 1},
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  illustration: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  illustrationImage: {width: 230, height: 150},
  illustrationGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(105,73,190,0.08)',
  },
  illustrationGlowTwo: {
    position: 'absolute',
    top: 8,
    right: '24%',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(186,161,225,0.22)',
  },
  illustrationCircle: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 52,
    backgroundColor: '#F1EAFB',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
  },
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 300,
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  calendarCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    backgroundColor: 'rgba(255,252,255,0.94)',
    padding: spacing.md,
    elevation: 6,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  calendarHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  calendarArrowButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F0E8FC',
  },
  calendarArrowButtonDisabled: {opacity: 0.4},
  calendarArrowText: {color: PURPLE, fontSize: 22, fontWeight: '600', lineHeight: 26},
  calendarArrowTextDisabled: {color: TEXT_SECONDARY},
  calendarTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekRow: {flexDirection: 'row', marginTop: spacing.md},
  weekDay: {width: '14.2857%', color: '#85739F', fontSize: 11.5, textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm},
  dayCell: {width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center'},
  dayButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17},
  daySelected: {backgroundColor: PURPLE},
  dayText: {color: '#2A2050', fontSize: 14},
  dayTextDisabled: {color: '#C4B9DA'},
  dayTextSelected: {color: '#FFFFFF', fontWeight: '700'},
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    marginTop: spacing.md,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.16)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
  },
  selectedIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F1EAFB',
  },
  selectedCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  selectedLabel: {color: TEXT_SECONDARY, fontSize: 11.5},
  selectedValue: {marginTop: 2, color: '#2A2050', fontSize: 15, fontWeight: '700'},
  modifyText: {color: PURPLE, fontSize: 13, fontWeight: '700'},
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: spacing.sm,
    padding: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(241,234,251,0.75)',
  },
  infoText: {flex: 1, color: TEXT_SECONDARY, fontSize: 12, lineHeight: 17},
  spacer: {flex: 1, minHeight: spacing.lg},
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default MiscarriageDateScreen;
