import {useToday} from '../hooks/useToday';
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
import {useTranslation} from 'react-i18next';
import '../i18n';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageDate,
} from '../state/miscarriagePreferences';
import {getAllMiscarriageJournalEntries, hydrateMiscarriageJournal} from '../state/miscarriageJournalStore';
import {journalDatesWithContent} from '../utils/lossDateValidation';
import {dateFormatLocale, diffDays, localizedWeekDays, startOfDay} from '../utils/cycleMath';
import {validateLossDate} from '../utils/postpartumLossDateValidation';
import {capitalizeFor, displayTitleCase} from '../utils/textCase';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageDate'>;

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

const formatMonthYear = (date: Date): string => {
  const label = new Intl.DateTimeFormat(dateFormatLocale(), {month: 'long', year: 'numeric'}).format(date);
  return capitalizeFor(label);
};

function MiscarriageDateScreen({navigation, route}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const WEEK_DAYS = localizedWeekDays();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const {today} = useToday();
  // First-pass default only: never re-applied when the day changes, so a date
  // the user already picked is not moved.
  const initialToday = useRef(today).current;

  // Preselect an already-saved miscarriage date if one exists (going back
  // and forward must never lose a prior selection — see section 34 of the
  // spec), otherwise default to today.
  const [initialized, setInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialToday.getFullYear(), initialToday.getMonth(), 1),
  );
  const [saving, setSaving] = useState(false);
  // Save-time guard mirroring the disabled future days of the calendar.
  const [dateError, setDateError] = useState('');
  const isEdit = route.params?.mode === 'edit';

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(() => {
      if (!active) {return;}
      const existing = getMiscarriagePreferences().miscarriageDate;
      const restored = existing ? startOfDay(new Date(`${existing}T12:00:00`)) : initialToday;
      setSelectedDate(restored);
      setVisibleMonth(new Date(restored.getFullYear(), restored.getMonth(), 1));
      setInitialized(true);
    });
    return () => {active = false;};
  }, [initialToday]);

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
    setDateError('');
  };

  const scrollToCalendar = () => {
    scrollRef.current?.scrollTo({y: 0, animated: true});
  };

  const handleNext = async () => {
    if (saving) {return;}
    const validation = validateLossDate(selectedDate, new Date());
    if (!validation.valid) {
      setDateError(validation.message);
      return;
    }
    setDateError('');
    setSaving(true);
    try {
      // Dated data already recorded (journal days with real content) can make
      // a corrected loss date contradictory. The store setter validates the
      // new date against it AND the recorded cycle-return date; a conflict is
      // REJECTED (nothing written, nothing moved or deleted) and explained
      // here so the user can correct that other data separately.
      await hydrateMiscarriageJournal();
      const journalDates = journalDatesWithContent(getAllMiscarriageJournalEntries());
      // Timezone-safe 'YYYY-MM-DD' persistence — see setMiscarriageDate().
      const result = await setMiscarriageDate(selectedDate, {journalDates});
      if (!result.valid) {
        setDateError(result.message);
        return;
      }
      if (isEdit) {
        navigation.goBack();
        return;
      }
      navigation.navigate('MiscarriageBleeding');
    } catch (saveError) {
      presentSaveFailure(saveError);
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
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

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
                accessibilityLabel={t('miscarriageDate.illustrationAccessibility')}
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-calendar.png')}
                style={styles.illustrationImage}
              />
            </View>

            <View style={styles.header}>
              <AwaText variant="headlineMedium" style={styles.title}>{t('miscarriageDate.title')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>{t('miscarriageDate.subtitle')}</AwaText>
            </View>
          </Animated.View>

          <Animated.View style={[styles.calendarCard, cardStyle]}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityLabel={t('calendar.previousMonth')}
                hitSlop={8}
                onPress={() => changeMonth(-1)}
                style={({pressed}) => [styles.calendarArrowButton, pressed && styles.pressed]}>
                <Text style={styles.calendarArrowText}>{'<'}</Text>
              </Pressable>

              <AwaText variant="titleMedium" style={styles.calendarTitle}>{displayTitleCase(formatMonthYear(visibleMonth))}</AwaText>

              <Pressable
                accessibilityLabel={t('calendar.nextMonth')}
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
                      hitSlop={4}
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

          <Animated.View style={[styles.selectedWrap, cardStyle]}>
            <AwaCard padding="none" style={styles.selectedCard} variant="outlined">
              <View style={styles.selectedIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="calendar-heart" size={20} />
              </View>
              <View style={styles.selectedCopy}>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{t('miscarriageDate.selectedLabel')}</AwaText>
                <AwaText variant="titleSmall" style={styles.selectedValue}>{formatFullDate(selectedDate)}</AwaText>
              </View>
              <AwaButton label={t('miscarriageDate.modify')} onPress={scrollToCalendar} size="compact" variant="text" />
            </AwaCard>
          </Animated.View>

          <Animated.View style={[styles.infoCard, cardStyle]}>
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={17} />
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{t('miscarriageDate.infoText')}</AwaText>
          </Animated.View>

          <View style={styles.spacer} />

          {dateError ? (
            <AwaText variant="labelMedium" colorRole="error" accessibilityRole="alert" style={styles.dateError}>
              {dateError}
            </AwaText>
          ) : null}

          <AwaButton
            accessibilityRole="button"
            disabled={saving}
            onPress={handleNext}
            label={saving ? t('miscarriageDate.saving') : isEdit ? t('common.save') : t('miscarriageDate.next')}
            size="large"
          />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},





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
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {textAlign: 'center'},
  subtitle: {marginTop: 8, maxWidth: 300, textAlign: 'center'},
  calendarCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: spacing.md,
    elevation: 6,
    shadowColor: theme.shadow.shadowColor,
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
    backgroundColor: theme.colors.primarySoft,
  },
  calendarArrowButtonDisabled: {opacity: 0.4},
  calendarArrowText: {color: theme.colors.primary, fontSize: 22, fontWeight: '600', lineHeight: 26},
  calendarArrowTextDisabled: {color: theme.colors.textSecondary},
  calendarTitle: {textTransform: 'capitalize'},
  weekRow: {flexDirection: 'row', marginTop: spacing.md},
  weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm},
  dayCell: {width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  dayButton: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20},
  daySelected: {backgroundColor: theme.colors.primary},
  dayText: {color: theme.colors.text, fontSize: 14},
  dayTextDisabled: {color: theme.colors.textMuted},
  dayTextSelected: {color: onPrimaryTextColor(theme), fontWeight: '700'},
  selectedWrap: {marginTop: spacing.md},
  // AwaCard (outlined) supplies the surface, border and radius.
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  selectedCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  selectedValue: {marginTop: 2},
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: spacing.sm,
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },
  infoText: {flex: 1},
  spacer: {flex: 1, minHeight: spacing.lg},
  dateError: {marginBottom: 12, textAlign: 'center'},

  pressed: {opacity: 0.82},
  });
}

export default MiscarriageDateScreen;
