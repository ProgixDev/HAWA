import {continueAfterObjectiveSetup} from '../state/objectiveSetupFlow';
import React, {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
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
  correctPeriodOccurrence,
  getCyclePreferences,
  getHasConfirmedCycleData,
  getPeriodEndDateTime,
  getSelectedObjective,
  setCyclePreferences,
  setPeriodEndDateTime,
} from '../state/onboardingPreferences';
import {
  recordConfirmedPeriodEnd,
  removeConfirmedPeriodOccurrence,
} from '../state/confirmedPeriodHistoryStore';
import {startOfDay, dateFormatLocale} from '../utils/cycleMath';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {getAppLanguage} from '../state/themePreferences';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaText} from '../components/ui/AwaText';

const CALENDAR_ICON = require('../assets/images/cycle-calendar-icon.png');
const CHEVRON_ICON = require('../assets/images/cycle-chevron-icon.png');
// Single-letter weekday abbreviations — kept local to this screen (a
// different, more compact format than cycleMath.ts's own 3-letter
// localizedWeekDays(), so not reused directly). Lunes/Martes/Miércoles
// share the Spanish M-M collision the same way French's Mardi/Mercredi do.
const WEEK_DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEK_DAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_DAYS_ES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEK_DAYS_IT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const WEEK_DAYS_TR = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
const WEEK_DAYS_RU = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
const WEEK_DAYS_DE = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];
const WEEK_DAYS_ZH = ['一', '二', '三', '四', '五', '六', '日'];
const WEEK_DAYS_ID = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];
const WEEK_DAYS_HI = ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'];
const WEEK_DAYS_SQ = ['H', 'M', 'M', 'E', 'P', 'Sh', 'D'];
const WEEK_DAYS_JA = ['月', '火', '水', '木', '金', '土', '日'];
const WEEK_DAYS_KO = ['월', '화', '수', '목', '금', '토', '일'];
const WEEK_DAYS_PT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const WEEK_DAYS_BN = ['সো', 'ম', 'বু', 'বৃ', 'শু', 'শ', 'র'];
const WEEK_DAYS_DA = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const WEEK_DAYS_SV = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const WEEK_DAYS_NB = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const WEEK_DAYS_PL = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'];
const WEEK_DAYS_UK = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'];
const WEEK_DAYS_CS = ['P', 'Ú', 'S', 'Č', 'P', 'S', 'N'];
const WEEK_DAYS_SK = ['P', 'U', 'S', 'Š', 'P', 'S', 'N'];
const WEEK_DAYS_HU = ['H', 'K', 'S', 'C', 'P', 'S', 'V'];
const WEEK_DAYS_RO = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEK_DAYS_BG = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'];
const WEEK_DAYS_SR = ['П', 'У', 'С', 'Ч', 'П', 'С', 'Н'];
const WEEK_DAYS_HR = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];
const WEEK_DAYS_BS = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];
const WEEK_DAYS_SL = ['P', 'T', 'S', 'Č', 'P', 'S', 'N'];
const WEEK_DAYS_NE = ['सो', 'मं', 'बु', 'बि', 'शु', 'श', 'आ'];
const WEEK_DAYS_SI = ['ස', 'අ', 'බ', 'බ්‍ර', 'සි', 'සෙ', 'ඉ'];
const WEEK_DAYS_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const WEEK_DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEK_DAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const WEEK_DAYS_AZ = ['Be', 'Ça', 'Çə', 'Ca', 'Cü', 'Şə', 'Ba'];
const WEEK_DAYS_KA = ['ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა', 'კვ'];
const WEEK_DAYS_HY = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր'];
const WEEK_DAYS_TG = ['Душ', 'Сеш', 'Чор', 'Пан', 'Ҷум', 'Шан', 'Яқш'];
const WEEK_DAYS_KY = ['Дүй', 'Шей', 'Шар', 'Бей', 'Жум', 'Ишм', 'Жек'];
const WEEK_DAYS_TK = ['Duş', 'Siş', 'Çar', 'Pen', 'Ann', 'Şen', 'Ýek'];
const localizedSingleLetterWeekDays = (): string[] => {
  const language = getAppLanguage();
  if (language === 'en') {return WEEK_DAYS_EN;}
  if (language === 'es') {return WEEK_DAYS_ES;}
  if (language === 'it') {return WEEK_DAYS_IT;}
  if (language === 'tr') {return WEEK_DAYS_TR;}
  if (language === 'ru') {return WEEK_DAYS_RU;}
  if (language === 'de') {return WEEK_DAYS_DE;}
  if (language === 'zh') {return WEEK_DAYS_ZH;}
  if (language === 'id') {return WEEK_DAYS_ID;}
  if (language === 'hi') {return WEEK_DAYS_HI;}
  if (language === 'sq') {return WEEK_DAYS_SQ;}
  if (language === 'ja') {return WEEK_DAYS_JA;}
  if (language === 'ko') {return WEEK_DAYS_KO;}
  if (language === 'pt-PT' || language === 'pt-BR') {return WEEK_DAYS_PT;}
  if (language === 'bn') {return WEEK_DAYS_BN;}
  if (language === 'da') {return WEEK_DAYS_DA;}
  if (language === 'sv') {return WEEK_DAYS_SV;}
  if (language === 'nb') {return WEEK_DAYS_NB;}
  if (language === 'pl') {return WEEK_DAYS_PL;}
  if (language === 'uk') {return WEEK_DAYS_UK;}
  if (language === 'cs') {return WEEK_DAYS_CS;}
  if (language === 'sk') {return WEEK_DAYS_SK;}
  if (language === 'hu') {return WEEK_DAYS_HU;}
  if (language === 'ro') {return WEEK_DAYS_RO;}
  if (language === 'bg') {return WEEK_DAYS_BG;}
  if (language === 'sr') {return WEEK_DAYS_SR;}
  if (language === 'hr') {return WEEK_DAYS_HR;}
  if (language === 'bs') {return WEEK_DAYS_BS;}
  if (language === 'sl') {return WEEK_DAYS_SL;}
  if (language === 'ne') {return WEEK_DAYS_NE;}
  if (language === 'si') {return WEEK_DAYS_SI;}
  if (language === 'th') {return WEEK_DAYS_TH;}
  if (language === 'vi') {return WEEK_DAYS_VI;}
  if (language === 'uz') {return WEEK_DAYS_UZ;}
  if (language === 'az') {return WEEK_DAYS_AZ;}
  if (language === 'ka') {return WEEK_DAYS_KA;}
  if (language === 'hy') {return WEEK_DAYS_HY;}
  if (language === 'tg') {return WEEK_DAYS_TG;}
  if (language === 'ky') {return WEEK_DAYS_KY;}
  if (language === 'tk') {return WEEK_DAYS_TK;}
  return WEEK_DAYS_FR;
};
const PERIOD_DURATIONS = Array.from({length: 9}, (_, index) => index + 2);
const CYCLE_DURATIONS = Array.from({length: 21}, (_, index) => index + 20);

type Regularity = 'yes' | 'no' | 'unknown';
type Terminated = 'yes' | 'no';
type DurationPicker = 'period' | 'cycle' | null;
type DatePickerTarget = 'start' | 'end' | null;
type Props = NativeStackScreenProps<RootStackParamList, 'CycleInformation'>;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(dateFormatLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function CycleInformationScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isEdit = route.params?.mode === 'edit';
  // Profile -> "Durée du cycle" / "Durée des règles" / "Régularité": edits
  // ONLY the habitual cycle length, period length and regularity. The last
  // period start/end (and the confirmed period history / Qadaa data hanging
  // off them) are neither shown nor rewritten in this mode.
  const habitsOnly = isEdit && route.params?.section === 'habits';

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

    if (habitsOnly) {
      // Same setter as the full save below, fed the CURRENT lastPeriodStart
      // (read at save time, exactly like confirmPeriodStart does) so the
      // period start, period history and journal data stay untouched;
      // everything derived (predictions, statistics) recomputes from the
      // existing store subscriptions.
      try {
        await setCyclePreferences({...getCyclePreferences(), periodDuration, cycleDuration, regularity});
      } catch (saveError) {
        // Not persisted (services/saveFailure.ts): stay here with the values intact, no navigation.
        presentSaveFailure(saveError);
        return;
      }
      navigation.goBack();
      return;
    }

    const today = startOfDay(new Date());
    const nextErrors: {start?: string; end?: string} = {};
    if (startOfDay(actualPeriodStart).getTime() > today.getTime()) {
      nextErrors.start = t('cycleInformation.futureDateError');
    }
    if (periodTerminated === 'yes') {
      if (!actualPeriodEnd) {
        nextErrors.end = t('cycleInformation.missingEndDateError');
      } else if (startOfDay(actualPeriodEnd).getTime() > today.getTime()) {
        nextErrors.end = t('cycleInformation.futureDateError');
      } else if (startOfDay(actualPeriodEnd).getTime() < startOfDay(actualPeriodStart).getTime()) {
        nextErrors.end = t('cycleInformation.endBeforeStartError');
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
      // Editing an existing, confirmed latest period from Profile/Summary is a
      // CORRECTION of that occurrence (the old start must not linger in
      // periodHistory), never a new period: habitual settings are saved with
      // the unchanged start, then the occurrence is moved explicitly. Anything
      // else (onboarding, first-time setup, a new period) keeps the original
      // single setCyclePreferences write.
      const isStartCorrection =
        route.params?.mode === 'edit' &&
        getHasConfirmedCycleData() &&
        localDateKey(previousActualStart) !== localDateKey(actualPeriodStart);
      let corrected = false;
      if (isStartCorrection) {
        await setCyclePreferences({lastPeriodStart: previousActualStart, periodDuration, cycleDuration, regularity});
        try {
          await correctPeriodOccurrence(previousActualStart, actualPeriodStart);
          corrected = true;
        } catch (error) {
          // Overlaps another recorded period: fall back to the plain save. A refused/failed WRITE is not an overlap:
          // it propagates to the handler below (nothing is announced as saved, the form stays).
          if (!(error instanceof Error && (error.message === 'OVERLAPPING_RANGE' || error.message === 'INVALID_RANGE'))) {throw error;}
        }
      }
      if (!corrected) {
        await setCyclePreferences({lastPeriodStart: actualPeriodStart, periodDuration, cycleDuration, regularity});
      }

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
      if (route.params?.fromDashboardCTA || route.params?.mode === 'edit') {
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
      continueAfterObjectiveSetup(navigation);
    } catch (saveError) {
      // A refused/failed write: no navigation, the form keeps what was entered (see services/saveFailure.ts).
      presentSaveFailure(saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
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
            <AwaText accessibilityRole="header" style={styles.title} variant="headlineMedium">{habitsOnly ? t('cycleInformation.habitsTitle') : t('cycleInformation.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {habitsOnly
                ? t('cycleInformation.habitsSubtitle')
                : t('cycleInformation.subtitle')}
            </AwaText>
          </View>

          <View style={styles.form}>
            {habitsOnly ? null : (
            <>
            <AwaText colorRole="onSurfaceVariant" emphasized style={styles.label} variant="labelLarge">{t('cycleInformation.periodStartDateLabel')}</AwaText>
            <Pressable
              accessibilityLabel={t('cycleInformation.choosePeriodStartDate')}
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
            {errors.start ? <AwaText colorRole="error" style={styles.fieldErrorText} variant="bodySmall">{errors.start}</AwaText> : null}

            <AwaText colorRole="onSurfaceVariant" emphasized style={styles.label} variant="labelLarge">{t('cycleInformation.periodEndedQuestion')}</AwaText>
            <View accessibilityRole="radiogroup" style={styles.regularityRow}>
              {[
                {id: 'yes' as const, label: t('journalIntimacy.yes')},
                {id: 'no' as const, label: t('journalIntimacy.no')},
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
                    <Text style={[styles.regularityText, selected && styles.regularityTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {periodTerminated === 'yes' ? (
              <>
                <AwaText colorRole="onSurfaceVariant" emphasized style={styles.label} variant="labelLarge">{t('cycleInformation.periodEndDateLabel')}</AwaText>
                <Pressable
                  accessibilityLabel={t('cycleInformation.choosePeriodEndDate')}
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
                    {actualPeriodEnd ? formatDate(actualPeriodEnd) : t('managedProfile.cycleSetup.lastPeriodPlaceholder')}
                  </Text>
                  <Image
                    accessibilityIgnoresInvertColors
                    source={CALENDAR_ICON}
                    style={styles.calendarFieldIcon}
                  />
                </Pressable>
                {errors.end ? <AwaText colorRole="error" style={styles.fieldErrorText} variant="bodySmall">{errors.end}</AwaText> : null}
              </>
            ) : null}
            </>
            )}

            <AwaText colorRole="onSurfaceVariant" emphasized style={styles.label} variant="labelLarge">{t('cycleInformation.usualPeriodDurationLabel')}</AwaText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDurationPicker('period')}
              style={({pressed}) => [styles.field, pressed && styles.pressed]}>
              <Text style={styles.fieldText}>{t('averageCycle.days', {count: periodDuration})}</Text>
              <Image
                accessibilityIgnoresInvertColors
                source={CHEVRON_ICON}
                style={styles.chevronIcon}
              />
            </Pressable>
            <AwaText colorRole="onSurfaceVariant" style={styles.helperText} variant="bodySmall">{t('cycleInformation.usedToEstimateNextPeriod')}</AwaText>

            <AwaText colorRole="onSurfaceVariant" emphasized style={styles.label} variant="labelLarge">{t('cycleInformation.usualCycleDurationLabel')}</AwaText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDurationPicker('cycle')}
              style={({pressed}) => [styles.field, pressed && styles.pressed]}>
              <Text style={styles.fieldText}>{t('averageCycle.days', {count: cycleDuration})}</Text>
              <Image
                accessibilityIgnoresInvertColors
                source={CHEVRON_ICON}
                style={styles.chevronIcon}
              />
            </Pressable>

            <AwaText colorRole="onSurfaceVariant" emphasized style={styles.label} variant="labelLarge">{t('cycleInformation.cycleRegularQuestion')}</AwaText>
            <View accessibilityRole="radiogroup" style={styles.regularityRow}>
              {[
                {id: 'yes' as const, label: t('journalIntimacy.yes')},
                {id: 'no' as const, label: t('journalIntimacy.no')},
                {id: 'unknown' as const, label: t('managedProfile.cycleSetup.unknown')},
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
                    <Text style={[styles.regularityText, selected && styles.regularityTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.spacer} />
          <AwaButton
            disabled={submitting}
            fullWidth
            label={submitting ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('cycleInformation.next')}
            onPress={handleNext}
            size="large"
          />
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
                accessibilityLabel={t('calendar.previousMonth')}
                hitSlop={8}
                onPress={() => changeMonth(-1)}
                style={styles.calendarArrowButton}>
                <Text style={styles.calendarArrowText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.calendarTitle}>
                {new Intl.DateTimeFormat(dateFormatLocale(), {
                  month: 'long',
                  year: 'numeric',
                }).format(visibleMonth)}
              </Text>
              <Pressable
                accessibilityLabel={t('calendar.nextMonth')}
                hitSlop={8}
                onPress={() => changeMonth(1)}
                style={styles.calendarArrowButton}>
                <Text style={styles.calendarArrowText}>{'>'}</Text>
              </Pressable>
            </View>
            <View style={styles.weekRow}>
              {localizedSingleLetterWeekDays().map((day, index) => (
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
                        hitSlop={4}
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
            <AwaText style={styles.durationTitle} variant="titleLarge">
              {durationPicker === 'period'
                ? t('profile.periodLengthLabel')
                : t('profile.cycleLengthLabel')}
            </AwaText>
            <View style={styles.durationGrid}>
              {durationOptions.map(duration => (
                <Pressable
                  key={duration}
                  onPress={() => selectDuration(duration)}
                  style={({pressed}) => [
                    styles.durationOption,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.durationOptionText}>{t('averageCycle.days', {count: duration})}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    header: {alignItems: 'center', marginBottom: spacing.lg},
    title: {textAlign: 'center'},
    subtitle: {marginTop: 8, textAlign: 'center'},
    form: {gap: 7},
    label: {marginTop: 5},
    field: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.25,
      borderColor: withAlpha(theme.colors.primary, 0.24),
      borderRadius: 16,
      backgroundColor: withAlpha(theme.colors.surface, 0.94),
      paddingHorizontal: 16,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.045,
      shadowRadius: 6,
      elevation: 1,
    },
    fieldText: {flex: 1, marginHorizontal: 10, color: theme.colors.text, fontSize: 14},
    fieldPlaceholder: {flex: 1, marginHorizontal: 10, color: theme.colors.textMuted, fontSize: 14},
    fieldError: {borderColor: theme.colors.danger},
    fieldErrorText: {marginTop: 4, marginBottom: 2, marginLeft: 4},
    helperText: {marginTop: 4, marginLeft: 4},
    calendarFieldIcon: {width: 22, height: 22, resizeMode: 'contain'},
    chevronIcon: {width: 20, height: 20, resizeMode: 'contain'},
    regularityRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    regularityOption: {
      minHeight: 48,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.25,
      borderColor: withAlpha(theme.colors.primary, 0.22),
      borderRadius: 16,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.035,
      shadowRadius: 5,
      elevation: 1,
    },
    regularitySelected: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.10,
      shadowRadius: 7,
      elevation: 2,
    },
    // DESIGN.md: labels wrap instead of shrinking/truncating (DE/TR/RU are longer); selected = bold (theme text equals onPrimaryContainer on primarySoft).
    regularityText: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
    },
    regularityTextSelected: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    spacer: {flex: 1},
    pressed: {opacity: 0.8},
    modalBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(theme.shadow.shadowColor, 0.40),
      padding: spacing.lg,
    },
    calendarCard: {
      width: '100%',
      maxWidth: 380,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
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
      backgroundColor: theme.colors.primarySoft,
    },
    calendarArrowText: {
      color: theme.colors.primary,
      fontSize: 27,
      fontWeight: '600',
      lineHeight: 30,
    },
    calendarTitle: {color: theme.colors.text, fontSize: 19, fontWeight: '600'},
    weekRow: {flexDirection: 'row', marginTop: spacing.md},
    weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center'},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm},
    dayCell: {width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center'},
    dayButton: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20},
    daySelected: {backgroundColor: theme.colors.primary},
    dayText: {color: theme.colors.text, fontSize: 14},
    dayTextSelected: {color: onPrimaryTextColor(theme), fontWeight: '700'},
    durationCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      elevation: 12,
    },
    durationTitle: {marginBottom: spacing.md, textAlign: 'center'},
    durationGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'},
    durationOption: {minWidth: 82, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.primarySoft},
    durationOptionText: {color: theme.colors.text, fontSize: 13},
  });
}

export default CycleInformationScreen;
