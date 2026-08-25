import React, {useMemo, useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {spacing, getTopPadding} from '../theme/spacing';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getCyclePreferences,
  getPeriodEndDateTime,
  getSelectedObjective,
  setCyclePreferences,
  setPeriodEndDateTime,
} from '../state/onboardingPreferences';
import {
  recordConfirmedPeriodEnd,
  removeConfirmedPeriodOccurrence,
} from '../state/confirmedPeriodHistoryStore';
import {startOfDay} from '../utils/cycleMath';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const CALENDAR_ICON = require('../assets/images/cycle-calendar-icon.png');
const CHEVRON_ICON = require('../assets/images/cycle-chevron-icon.png');
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const PERIOD_DURATIONS = Array.from({length: 9}, (_, index) => index + 2);
const CYCLE_DURATIONS = Array.from({length: 21}, (_, index) => index + 20);

type Regularity = 'yes' | 'no' | 'unknown';
type Terminated = 'yes' | 'no';
type DurationPicker = 'period' | 'cycle' | null;
type DatePickerTarget = 'start' | 'end' | null;
type Props = NativeStackScreenProps<RootStackParamList, 'CycleInformation'>;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function CycleInformationScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // Prefill from the real, previously-saved values so revisiting this screen
  // (Back from a later onboarding step, or the TTC "Configure ton cycle"
  // CTA) never silently resets her real answers back to today/5/28/yes.
  const initialCyclePreferences = useMemo(() => getCyclePreferences(), []);
  const initialPeriodEndDateTime = useMemo(() => getPeriodEndDateTime(), []);
  // A periodEndDateTime only describes the CURRENT actual period if it's not
  // older than its start — the same relevance check useQadaaStatus.ts's own
  // legacy-migration bootstrap already uses. An older/unrelated value must
  // never be shown as if it confirmed this period as terminated.
  const initialHasValidEnd =
    initialPeriodEndDateTime !== null &&
    initialPeriodEndDateTime.getTime() >= initialCyclePreferences.lastPeriodStart.getTime();

  const [actualPeriodStart, setActualPeriodStart] = useState(
    () => initialCyclePreferences.lastPeriodStart,
  );
  const [periodTerminated, setPeriodTerminated] = useState<Terminated>(
    () => (initialHasValidEnd ? 'yes' : 'no'),
  );
  const [actualPeriodEnd, setActualPeriodEnd] = useState<Date | null>(
    () => (initialHasValidEnd ? initialPeriodEndDateTime : null),
  );
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialCyclePreferences.lastPeriodStart.getFullYear(), initialCyclePreferences.lastPeriodStart.getMonth(), 1),
  );
  const [datePicker, setDatePicker] = useState<DatePickerTarget>(null);
  const [durationPicker, setDurationPicker] = useState<DurationPicker>(null);
  const [periodDuration, setPeriodDuration] = useState(() => initialCyclePreferences.periodDuration);
  const [cycleDuration, setCycleDuration] = useState(() => initialCyclePreferences.cycleDuration);
  const [regularity, setRegularity] = useState<Regularity>(() => initialCyclePreferences.regularity);
  const [errors, setErrors] = useState<{start?: string; end?: string}>({});
  const [submitting, setSubmitting] = useState(false);

  const activeCalendarDate = datePicker === 'end' ? (actualPeriodEnd ?? new Date()) : actualPeriodStart;

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
    const picked = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    if (datePicker === 'start') {
      setActualPeriodStart(picked);
      setErrors(current => ({...current, start: undefined}));
    } else if (datePicker === 'end') {
      setActualPeriodEnd(picked);
      setErrors(current => ({...current, end: undefined}));
    }
    setDatePicker(null);
  };

  const changeMonth = (offset: number) => {
    setVisibleMonth(
      current => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  const openDatePicker = (target: 'start' | 'end') => {
    const base = target === 'start' ? actualPeriodStart : actualPeriodEnd ?? new Date();
    setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setDatePicker(target);
  };

  const selectDuration = (duration: number) => {
    if (durationPicker === 'period') {
      setPeriodDuration(duration);
    } else {
      setCycleDuration(duration);
    }
    setDurationPicker(null);
  };

  const handleTerminatedChange = (value: Terminated) => {
    setPeriodTerminated(value);
    if (value === 'no') {
      setErrors(current => ({...current, end: undefined}));
    }
  };

  const handleNext = async () => {
    if (submitting) {return;}

    const today = startOfDay(new Date());
    const nextErrors: {start?: string; end?: string} = {};
    if (startOfDay(actualPeriodStart).getTime() > today.getTime()) {
      nextErrors.start = 'Cette date ne peut pas être dans le futur.';
    }
    if (periodTerminated === 'yes') {
      if (!actualPeriodEnd) {
        nextErrors.end = 'Indique la date de fin de tes dernières règles.';
      } else if (startOfDay(actualPeriodEnd).getTime() > today.getTime()) {
        nextErrors.end = 'Cette date ne peut pas être dans le futur.';
      } else if (startOfDay(actualPeriodEnd).getTime() < startOfDay(actualPeriodStart).getTime()) {
        nextErrors.end = 'La date de fin doit être après la date de début.';
      }
    }
    if (nextErrors.start || nextErrors.end) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      // previousActualStart is captured BEFORE this save so a start-date
      // edit can clean up the now-orphaned old confirmed occurrence below —
      // same rename-safe pattern already used by CalendarScreen's period
      // editor. periodDuration/cycleDuration/regularity stay exactly what
      // they've always been: habitual/predictive, unrelated to Qadaa.
      const previousActualStart = getCyclePreferences().lastPeriodStart;
      setCyclePreferences({lastPeriodStart: actualPeriodStart, periodDuration, cycleDuration, regularity});

      if (periodTerminated === 'yes' && actualPeriodEnd) {
        // An explicit "Oui" + a validated end date is the same trust signal
        // PeriodEndBottomSheet's own "Confirmer la fin des règles" already
        // relies on — reuse its exact two-call sequence so Qadaa/confirmed
        // history and the Purity/prayer feature both immediately agree this
        // period is over, with no separate/duplicate Ramadan or Qadaa logic.
        await setPeriodEndDateTime(actualPeriodEnd);
        await recordConfirmedPeriodEnd(actualPeriodStart, actualPeriodEnd);
        if (localDateKey(previousActualStart) !== localDateKey(actualPeriodStart)) {
          await removeConfirmedPeriodOccurrence(previousActualStart);
        }
      } else {
        // "Non": the CURRENT period's end-state must never be described by
        // a periodEndDateTime left over from an earlier answer (e.g. she
        // switches this same period from "Oui" back to "Non" to correct
        // herself) — always clear it so Purity/prayer features see it as
        // still ongoing, exactly matching what "Non" asserts.
        await setPeriodEndDateTime(null);

        // A confirmed occurrence for the SAME start date directly
        // contradicts this "Non" — this is her own just-prior "Oui" claim
        // for this exact period, not unrelated history, so it must be
        // retracted too (no-op if none exists). A DIFFERENT (unchanged)
        // start date's confirmed occurrence is deliberately left alone: that
        // represents a genuinely separate, already-completed historical
        // period and must never be deleted just because this later answer
        // for a different period is "Non".
        if (localDateKey(previousActualStart) === localDateKey(actualPeriodStart)) {
          await removeConfirmedPeriodOccurrence(actualPeriodStart);
        }
      }

      // Reached from an in-app "Configure ton cycle" prompt (TTC
      // Dashboard/Calendar/Statistics) rather than onboarding — return to
      // wherever she came from instead of continuing into an onboarding step.
      if (route.params?.fromDashboardCTA) {
        navigation.goBack();
        return;
      }

      // TTC's onboarding branches through this same screen (see
      // LocationScreen/SpiritualPreferencesScreen) before its own
      // Conception* steps — every other objective that reaches this screen
      // (Cycle/contraception/irregular) keeps going to SecuritySetup exactly
      // as before. Menopause no longer reaches this screen at all — it has
      // its own dedicated onboarding branch (see LocationScreen.tsx).
      if (getSelectedObjective() === 'conceive') {
        navigation.navigate('ConceptionTryingDuration');
        return;
      }
      // Cycle's own optional reminder onboarding step (Profile → Santé
      // générale → Notifications & rappels shows the exact same canonical
      // cycleReminderPreferences.ts values this screen configures — see
      // CycleRemindersScreen.tsx). Scoped to 'cycle' only, matching
      // ProfileScreen.tsx's own "Notifications & rappels" entry, which is
      // likewise shown only for objective === 'cycle' — 'irregular'/
      // 'contraception' (on the rare path that still reaches this screen)
      // keep going straight to SecuritySetup exactly as before.
      if (getSelectedObjective() === 'cycle') {
        navigation.navigate('CycleReminders');
        return;
      }
      navigation.navigate('SecuritySetup');
    } finally {
      setSubmitting(false);
    }
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
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{'Informations\nde ton cycle'}</Text>
            <Text style={styles.subtitle}>
              {'Ces informations nous aident à mieux\nte comprendre et t’accompagner.'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Date de début de tes dernières règles</Text>
            <Pressable
              accessibilityLabel="Choisir la date de début de tes dernières règles"
              accessibilityRole="button"
              onPress={() => openDatePicker('start')}
              style={({pressed}) => [
                styles.field,
                errors.start && styles.fieldError,
                pressed && styles.pressed,
              ]}>
              <Image
                accessibilityIgnoresInvertColors
                source={CALENDAR_ICON}
                style={styles.calendarFieldIcon}
              />
              <Text style={styles.fieldText}>{formatDate(actualPeriodStart)}</Text>
              <Image
                accessibilityIgnoresInvertColors
                source={CALENDAR_ICON}
                style={styles.calendarFieldIcon}
              />
            </Pressable>
            {errors.start ? <Text style={styles.fieldErrorText}>{errors.start}</Text> : null}

            <Text style={styles.label}>Tes dernières règles sont-elles terminées ?</Text>
            <View accessibilityRole="radiogroup" style={styles.regularityRow}>
              {[
                {id: 'yes' as const, label: 'Oui'},
                {id: 'no' as const, label: 'Non'},
              ].map(option => {
                const selected = periodTerminated === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    onPress={() => handleTerminatedChange(option.id)}
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

            {periodTerminated === 'yes' ? (
              <>
                <Text style={styles.label}>Date de fin de tes dernières règles</Text>
                <Pressable
                  accessibilityLabel="Choisir la date de fin de tes dernières règles"
                  accessibilityRole="button"
                  onPress={() => openDatePicker('end')}
                  style={({pressed}) => [
                    styles.field,
                    errors.end && styles.fieldError,
                    pressed && styles.pressed,
                  ]}>
                  <Image
                    accessibilityIgnoresInvertColors
                    source={CALENDAR_ICON}
                    style={styles.calendarFieldIcon}
                  />
                  <Text style={actualPeriodEnd ? styles.fieldText : styles.fieldPlaceholder}>
                    {actualPeriodEnd ? formatDate(actualPeriodEnd) : 'Sélectionner une date'}
                  </Text>
                  <Image
                    accessibilityIgnoresInvertColors
                    source={CALENDAR_ICON}
                    style={styles.calendarFieldIcon}
                  />
                </Pressable>
                {errors.end ? <Text style={styles.fieldErrorText}>{errors.end}</Text> : null}
              </>
            ) : null}

            <Text style={styles.label}>Durée habituelle de tes règles</Text>
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
            <Text style={styles.helperText}>Utilisée pour estimer tes prochaines règles.</Text>

            <Text style={styles.label}>Durée habituelle de ton cycle</Text>
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

            <Text style={styles.label}>Ton cycle est-il généralement régulier ?</Text>
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
            disabled={submitting}
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, (pressed || submitting) && styles.pressed]}>
            <Text style={styles.nextText}>{submitting ? 'Enregistrement…' : 'Suivant'}</Text>
          </Pressable>
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setDatePicker(null)}
        transparent
        visible={datePicker !== null}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDatePicker(null)}>
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
                  day === activeCalendarDate.getDate() &&
                  visibleMonth.getMonth() === activeCalendarDate.getMonth() &&
                  visibleMonth.getFullYear() === activeCalendarDate.getFullYear();
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
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {marginTop: 8, color: '#655A8D', fontSize: 13, lineHeight: 19, textAlign: 'center'},
  form: {gap: 7},
  label: {marginTop: 5, color: '#55447F', fontSize: 13, fontWeight: '600'},
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.25,
    borderColor: 'rgba(104, 72, 188, 0.24)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 254, 255, 0.94)',
    paddingHorizontal: 13,
    shadowColor: '#6848BC',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 1,
  },
  fieldText: {flex: 1, marginHorizontal: 10, color: '#2A2050', fontSize: 14},
  fieldPlaceholder: {flex: 1, marginHorizontal: 10, color: '#948BB0', fontSize: 14},
  fieldError: {borderColor: '#C95565'},
  fieldErrorText: {marginTop: 4, marginBottom: 2, marginLeft: 4, color: '#B4485A', fontSize: 10.5},
  helperText: {marginTop: 4, marginLeft: 4, color: '#8B81A6', fontSize: 11},
  calendarFieldIcon: {width: 22, height: 22, resizeMode: 'contain'},
  chevronIcon: {width: 20, height: 20, resizeMode: 'contain'},
  regularityRow: {flexDirection: 'row', gap: 8},
  regularityOption: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.25,
    borderColor: 'rgba(104, 72, 188, 0.22)',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 254, 255, 0.92)',
    paddingHorizontal: 5,
    shadowColor: '#6848BC',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },
  regularitySelected: {
    borderWidth: 1.5,
    borderColor: '#7656C4',
    backgroundColor: '#F0E9FA',
    shadowColor: '#6848BC',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.10,
    shadowRadius: 7,
    elevation: 2,
  },
  regularityText: {
    color: '#2A2050',
    fontSize: 13,
    textAlign: 'center',
  },
  spacer: {flex: 1},
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#6949BE',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.8},
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 18, 65, 0.40)',
    padding: spacing.lg,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    backgroundColor: '#FFFCFF',
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
    backgroundColor: '#F0E8FC',
  },
  calendarArrowText: {
    color: '#6848BC',
    fontSize: 27,
    fontWeight: '600',
    lineHeight: 30,
  },
  calendarTitle: {color: '#382174', fontFamily: 'serif', fontSize: 19, fontWeight: '600'},
  weekRow: {flexDirection: 'row', marginTop: spacing.md},
  weekDay: {width: '14.2857%', color: '#85739F', fontSize: 12, textAlign: 'center'},
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm},
  dayCell: {width: '14.2857%', height: 39, alignItems: 'center', justifyContent: 'center'},
  dayButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17},
  daySelected: {backgroundColor: '#6848BC'},
  dayText: {color: '#2A2050', fontSize: 14},
  dayTextSelected: {color: '#FFFFFF', fontWeight: '700'},
  durationCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: '#FFFCFF',
    padding: spacing.md,
    elevation: 12,
  },
  durationTitle: {marginBottom: spacing.md, color: '#382174', fontFamily: 'serif', fontSize: 20, fontWeight: '600', textAlign: 'center'},
  durationGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'},
  durationOption: {minWidth: 82, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCCEF1', borderRadius: 12, backgroundColor: '#FAF6FF'},
  durationOptionText: {color: '#2A2050', fontSize: 13},
});

export default CycleInformationScreen;