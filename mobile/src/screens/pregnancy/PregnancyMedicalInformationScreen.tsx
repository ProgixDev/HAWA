import { useToday } from '../../hooks/useToday';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  getTopPadding,
  spacing,
} from '../../theme/spacing';
import {
  getPregnancyJournalState,
  savePregnancyMedicalInformation,
} from '../../state/pregnancyJournalStore';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import {getAppLanguage} from '../../state/themePreferences';
import {dateFormatLocale} from '../../utils/cycleMath';
import {displayTitleCase} from '../../utils/textCase';
import i18n from '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

/* ============================================================
   CONSTANTS
============================================================ */

const HERO = require(
  '../../assets/images/pregnancy/pregnancy-medical-information-hero.png',
);

// Single-letter weekday abbreviations aren't sentence content, so — like
// CycleInformationScreen.tsx's WEEK_DAYS_FR/WEEK_DAYS_EN — they live as local
// consts picked via getAppLanguage() rather than as i18n keys.
const WEEK_DAYS_FR = [
  'L',
  'M',
  'M',
  'J',
  'V',
  'S',
  'D',
] as const;

const WEEK_DAYS_EN = [
  'M',
  'T',
  'W',
  'T',
  'F',
  'S',
  'S',
] as const;

const WEEK_DAYS_ES = [
  'L',
  'M',
  'M',
  'J',
  'V',
  'S',
  'D',
] as const;

const WEEK_DAYS_IT = [
  'L',
  'M',
  'M',
  'G',
  'V',
  'S',
  'D',
] as const;

const WEEK_DAYS_TR = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'] as const;
const WEEK_DAYS_RU = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'] as const;
const WEEK_DAYS_DE = ['M', 'D', 'M', 'D', 'F', 'S', 'S'] as const;
const WEEK_DAYS_ZH = ['一', '二', '三', '四', '五', '六', '日'] as const;
const WEEK_DAYS_ID = ['S', 'S', 'R', 'K', 'J', 'S', 'M'] as const;
const WEEK_DAYS_HI = ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'] as const;
const WEEK_DAYS_SQ = ['H', 'M', 'M', 'E', 'P', 'Sh', 'D'] as const;
const WEEK_DAYS_JA = ['月', '火', '水', '木', '金', '土', '日'] as const;
const WEEK_DAYS_KO = ['월', '화', '수', '목', '금', '토', '일'] as const;
const WEEK_DAYS_PT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;
const WEEK_DAYS_BN = ['সো', 'ম', 'বু', 'বৃ', 'শু', 'শ', 'র'] as const;
const WEEK_DAYS_DA = ['M', 'T', 'O', 'T', 'F', 'L', 'S'] as const;
const WEEK_DAYS_SV = ['M', 'T', 'O', 'T', 'F', 'L', 'S'] as const;
const WEEK_DAYS_NB = ['M', 'T', 'O', 'T', 'F', 'L', 'S'] as const;
const WEEK_DAYS_PL = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'] as const;
const WEEK_DAYS_UK = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'] as const;
const WEEK_DAYS_CS = ['P', 'Ú', 'S', 'Č', 'P', 'S', 'N'] as const;
const WEEK_DAYS_SK = ['P', 'U', 'S', 'Š', 'P', 'S', 'N'] as const;
const WEEK_DAYS_HU = ['H', 'K', 'S', 'C', 'P', 'S', 'V'] as const;
const WEEK_DAYS_RO = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;
const WEEK_DAYS_BG = ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'] as const;
const WEEK_DAYS_SR = ['П', 'У', 'С', 'Ч', 'П', 'С', 'Н'] as const;
const WEEK_DAYS_HR = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'] as const;
const WEEK_DAYS_BS = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'] as const;
const WEEK_DAYS_SL = ['P', 'T', 'S', 'Č', 'P', 'S', 'N'] as const;
const WEEK_DAYS_NE = ['सो', 'मं', 'बु', 'बि', 'शु', 'श', 'आ'] as const;
const WEEK_DAYS_SI = ['ස', 'අ', 'බ', 'බ්‍ර', 'සි', 'සෙ', 'ඉ'] as const;
const WEEK_DAYS_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'] as const;
const WEEK_DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
const WEEK_DAYS_UZ = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] as const;
const WEEK_DAYS_AZ = ['Be', 'Ça', 'Çə', 'Ca', 'Cü', 'Şə', 'Ba'] as const;
const WEEK_DAYS_KA = ['ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა', 'კვ'] as const;
const WEEK_DAYS_HY = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր'] as const;
const WEEK_DAYS_TG = ['Душ', 'Сеш', 'Чор', 'Пан', 'Ҷум', 'Шан', 'Яқш'] as const;
const WEEK_DAYS_KY = ['Дүй', 'Шей', 'Шар', 'Бей', 'Жум', 'Ишм', 'Жек'] as const;
const WEEK_DAYS_TK = ['Duş', 'Siş', 'Çar', 'Pen', 'Ann', 'Şen', 'Ýek'] as const;

function localizedSingleLetterWeekDays(): readonly string[] {
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
}

/* ============================================================
   DATE HELPERS
============================================================ */

function toDateKey(
  date: Date,
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseStoredDate(
  value: string,
): Date | null {
  if (!value) {
    return null;
  }

  /*
   * Current preferred format:
   * YYYY-MM-DD
   */
  const iso =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (iso) {
    const year =
      Number(iso[1]);

    const month =
      Number(iso[2]) - 1;

    const day =
      Number(iso[3]);

    const date =
      new Date(
        year,
        month,
        day,
      );

    return Number.isNaN(
      date.getTime(),
    )
      ? null
      : date;
  }

  /*
   * Compatibility with old manually-entered
   * DD/MM/YYYY values.
   */
  const french =
    /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
      value,
    );

  if (french) {
    const day =
      Number(french[1]);

    const month =
      Number(french[2]) - 1;

    const year =
      Number(french[3]);

    const date =
      new Date(
        year,
        month,
        day,
      );

    return Number.isNaN(
      date.getTime(),
    )
      ? null
      : date;
  }

  return null;
}

function formatDisplayDate(
  value: string,
): string {
  const date =
    parseStoredDate(value);

  if (!date) {
    return i18n.t(
      'pregnancyMedicalInformation.calendar.chooseDate',
    );
  }

  return new Intl.DateTimeFormat(
    dateFormatLocale(),
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date);
}

function sameDay(
  first: Date,
  second: Date,
): boolean {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function buildMonthDays(
  visibleMonth: Date,
): Array<Date | null> {
  const year =
    visibleMonth.getFullYear();

  const month =
    visibleMonth.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1,
    );

  /*
   * Monday = 0
   * Sunday = 6
   */
  const offset =
    (firstDay.getDay() +
      6) %
    7;

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0,
    ).getDate();

  const cells:
    Array<Date | null> =
    [];

  for (
    let index = 0;
    index < offset;
    index += 1
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    cells.push(
      new Date(
        year,
        month,
        day,
      ),
    );
  }

  return cells;
}

/* ============================================================
   PREMIUM CALENDAR MODAL
============================================================ */

function PremiumDatePickerModal({
  visible,
  value,
  onClose,
  onClear,
  onConfirm,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onClear: () => void;
  onConfirm: (
    date: Date,
  ) => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const {t} = useTranslation();

  const insets =
    useSafeAreaInsets();

  const initialDate =
    parseStoredDate(value) ??
    new Date();

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<Date>(
    initialDate,
  );

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    new Date(
      initialDate.getFullYear(),
      initialDate.getMonth(),
      1,
    ),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const next =
      parseStoredDate(value) ??
      new Date();

    setSelectedDate(next);

    setVisibleMonth(
      new Date(
        next.getFullYear(),
        next.getMonth(),
        1,
      ),
    );
  }, [value, visible]);

  const days =
    useMemo(
      () =>
        buildMonthDays(
          visibleMonth,
        ),
      [visibleMonth],
    );

  const dateLocale = dateFormatLocale();

  const monthTitle =
    new Intl.DateTimeFormat(
      dateLocale,
      {
        month: 'long',
        year: 'numeric',
      },
    ).format(
      visibleMonth,
    );

  const selectedLabel =
    new Intl.DateTimeFormat(
      dateLocale,
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(
      selectedDate,
    );

  const weekDays = localizedSingleLetterWeekDays();

  const today =
    new Date();

  return (
    <Modal
      animationType="fade"
      onRequestClose={
        onClose
      }
      statusBarTranslucent
      transparent
      visible={
        visible
      }>
      <View
        style={
          styles.modalRoot
        }>
        <Pressable
          accessibilityLabel={t(
            'pregnancyMedicalInformation.calendar.closeCalendarAccessibilityLabel',
          )}
          onPress={
            onClose
          }
          style={
            styles.modalBackdrop
          }
        />

        <View
          style={[
            styles.calendarModal,
            {
              marginBottom:
                Math.max(
                  insets.bottom,
                  14,
                ),
            },
          ]}>
          {/* HEADER */}

          <View
            style={
              styles.calendarModalHeader
            }>
            <View
              style={
                styles.calendarHeaderIcon
              }>
              <MaterialDesignIcons
                color={
                  theme.colors.primary
                }
                name="calendar-heart"
                size={20}
              />
            </View>

            <View
              style={
                styles.calendarHeaderCopy
              }>
              <Text
                style={
                  styles.calendarModalTitle
                }>
                {t(
                  'pregnancyMedicalInformation.calendar.chooseDate',
                )}
              </Text>

              <Text
                style={
                  styles.calendarSelectedText
                }>
                {
                  selectedLabel
                }
              </Text>
            </View>

            <AwaIconButton
              accessibilityLabel={t(
                'common.close',
              )}
              icon="close"
              onPress={
                onClose
              }
              size="small"
              style={
                styles.calendarClose
              }
              variant="tonal"
            />
          </View>

          {/* MONTH */}

          <View
            style={
              styles.monthNavigation
            }>
            <AwaIconButton
              accessibilityLabel={t(
                'pregnancyMedicalInformation.calendar.previousMonth',
              )}
              icon="chevron-left"
              onPress={() =>
                setVisibleMonth(
                  current =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() -
                        1,
                      1,
                    ),
                )
              }
              variant="tonal"
            />

            <Text
              style={
                styles.monthTitle
              }>
              {displayTitleCase(monthTitle)}
            </Text>

            <AwaIconButton
              accessibilityLabel={t(
                'pregnancyMedicalInformation.calendar.nextMonth',
              )}
              icon="chevron-right"
              onPress={() =>
                setVisibleMonth(
                  current =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() +
                        1,
                      1,
                    ),
                )
              }
              variant="tonal"
            />
          </View>

          {/* WEEK */}

          <View
            style={
              styles.weekRow
            }>
            {weekDays.map(
              (
                day,
                index,
              ) => (
                <Text
                  key={`${day}-${index}`}
                  style={
                    styles.weekDay
                  }>
                  {day}
                </Text>
              ),
            )}
          </View>

          {/* DAYS */}

          <View
            style={
              styles.calendarGrid
            }>
            {days.map(
              (
                day,
                index,
              ) => {
                if (!day) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={
                        styles.calendarDayCell
                      }
                    />
                  );
                }

                const selected =
                  sameDay(
                    day,
                    selectedDate,
                  );

                const isToday =
                  sameDay(
                    day,
                    today,
                  );

                return (
                  <View
                    key={toDateKey(
                      day,
                    )}
                    style={
                      styles.calendarDayCell
                    }>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setSelectedDate(
                          day,
                        )
                      }
                      style={[
                        styles.calendarDay,

                        isToday &&
                          !selected &&
                          styles.calendarToday,

                        selected &&
                          styles.calendarDaySelected,
                      ]}>
                      <Text
                        style={[
                          styles.calendarDayText,

                          selected &&
                            styles.calendarDayTextSelected,
                        ]}>
                        {day.getDate()}
                      </Text>

                      {isToday &&
                      !selected ? (
                        <View
                          style={
                            styles.todayDot
                          }
                        />
                      ) : null}
                    </Pressable>
                  </View>
                );
              },
            )}
          </View>

          {/* QUICK TODAY */}

          <AwaButton
            icon="calendar-today"
            label={t('pregnancyMedicalInformation.calendar.today')}
            onPress={() => {
              const now =
                new Date();

              setSelectedDate(
                now,
              );

              setVisibleMonth(
                new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1,
                ),
              );
            }}
            size="compact"
            style={styles.todayButton}
            variant="text"
          />

          {/* FOOTER */}

          <View
            style={
              styles.calendarFooter
            }>
            <AwaButton
              label={t('pregnancyMedicalInformation.calendar.clear')}
              onPress={() => {
                onClear();
                onClose();
              }}
              size="compact"
              style={styles.clearButton}
              variant="text"
            />

            <View
              style={
                styles.calendarFooterRight
              }>
              <AwaButton
                label={t('common.cancel')}
                onPress={
                  onClose
                }
                size="compact"
                style={styles.cancelButton}
                variant="tonal"
              />

              <AwaButton
                icon="check"
                label={t('pregnancyMedicalInformation.calendar.choose')}
                onPress={() => {
                  onConfirm(
                    selectedDate,
                  );
                }}
                size="compact"
                style={styles.confirmDateButton}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

export default function PregnancyMedicalInformationScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const {t} = useTranslation();

  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const insets =
    useSafeAreaInsets();

  const entrance =
    useRef(
      new Animated.Value(
        0,
      ),
    ).current;

  const [
    note,
    setNote,
  ] =
    useState('');

  const [
    date,
    setDate,
  ] =
    useState('');

  const [
    calendarVisible,
    setCalendarVisible,
  ] =
    useState(false);

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const { todayKey } = useToday();

  // Latest `date` for the day-rollover check below (read inside an effect
  // that must not re-run whenever the user edits the date).
  const dateRef = useRef(date);
  dateRef.current = date;

  // The day the form was last loaded for (null = first load).
  const loadedForDayRef = useRef<string | null>(null);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    successVisible,
    setSuccessVisible,
  ] =
    useState(false);

  const successToastAnimation =
    useRef(
      new Animated.Value(
        0,
      ),
    ).current;

  const successToastTimeout =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  useEffect(() => {
    return () => {
      if (
        successToastTimeout.current
      ) {
        clearTimeout(
          successToastTimeout.current,
        );
      }
    };
  }, []);

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    // Multiple dated entries can now coexist (see pregnancyJournalStore.ts),
    // so opening this screen resumes TODAY's entry specifically — matching
    // how the sibling Daily Journal categories (symptoms/mood/sleep) always
    // reopen to today — rather than whichever note happens to be the most
    // recently saved one overall.
    const previousDayKey =
      loadedForDayRef.current;

    loadedForDayRef.current =
      todayKey;

    getPregnancyJournalState().then(
      state => {
        // Day rollover while this screen is open: only a form that was
        // FOLLOWING today moves to the new day. A reference date the user
        // picked (a historical entry she is working on) is never replaced.
        if (
          previousDayKey !== null &&
          dateRef.current !==
            previousDayKey
        ) {
          return;
        }

        const todaysEntry =
          state.medicalInformationHistory.find(
            entry =>
              entry.date ===
              todayKey,
          );

        setNote(
          todaysEntry?.note ?? '',
        );

        setDate(
          todaysEntry?.date ??
            todayKey,
        );
      },
    );
  }, [todayKey]);

  /* ==========================================================
     ENTRANCE
  ========================================================== */

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(
      reduce => {
        Animated.timing(
          entrance,
          {
            toValue: 1,
            duration:
              reduce
                ? 0
                : 480,
            easing:
              Easing.out(
                Easing.cubic,
              ),
            useNativeDriver:
              true,
          },
        ).start();
      },
    );
  }, [entrance]);

  /* ==========================================================
     SUCCESS TOAST — same component/design/animation/timing as
     the Pregnancy Mood screen's toast (JournalMoodScreen.tsx,
     opened from the Dashboard's "Humeur" tile).
  ========================================================== */

  const showSuccessToast =
    () => {
      if (
        successToastTimeout.current
      ) {
        clearTimeout(
          successToastTimeout.current,
        );
      }

      setSuccessVisible(
        true,
      );

      successToastAnimation.stopAnimation();
      successToastAnimation.setValue(
        0,
      );

      Animated.spring(
        successToastAnimation,
        {
          toValue: 1,
          damping: 17,
          stiffness: 180,
          mass: 0.85,
          useNativeDriver:
            true,
        },
      ).start();

      successToastTimeout.current =
        setTimeout(
          () => {
            Animated.timing(
              successToastAnimation,
              {
                toValue: 0,
                duration: 220,
                easing:
                  Easing.in(
                    Easing.quad,
                  ),
                useNativeDriver:
                  true,
              },
            ).start(
              ({
                finished,
              }) => {
                if (
                  finished
                ) {
                  setSuccessVisible(
                    false,
                  );

                  navigation.goBack();
                }
              },
            );
          },
          2500,
        );
    };

  const hideSuccessToast =
    () => {
      if (
        successToastTimeout.current
      ) {
        clearTimeout(
          successToastTimeout.current,
        );

        successToastTimeout.current =
          null;
      }

      Animated.timing(
        successToastAnimation,
        {
          toValue: 0,
          duration: 180,
          easing:
            Easing.in(
              Easing.quad,
            ),
          useNativeDriver:
            true,
        },
      ).start(
        ({finished}) => {
          if (finished) {
            setSuccessVisible(
              false,
            );
          }
        },
      );
    };

  /* ==========================================================
     SAVE
  ========================================================== */

  const save =
    async () => {
      if (
        !note.trim()
      ) {
        setError(
          t(
            'pregnancyMedicalInformation.errors.emptyNote',
          ),
        );

        return;
      }

      setSaving(
        true,
      );

      setError('');

      try {
        await savePregnancyMedicalInformation(
          {
            note:
              note.trim(),

            date:
              date ||
              undefined,

            updatedAt:
              new Date().toISOString(),
          },
        );

        showSuccessToast();
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(
          false,
        );
      }
    };

  const entranceStyle = {
    opacity:
      entrance,

    transform: [
      {
        translateY:
          entrance.interpolate(
            {
              inputRange: [
                0,
                1,
              ],

              outputRange: [
                10,
                0,
              ],
            },
          ),
      },
    ],
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <View
      style={
        styles.safe
      }>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={
          insets.top
        }
        style={
          styles.flex
        }>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) +
                spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }>
          {/* HEADER */}

          <View
            style={[
              styles.header,
              {
                paddingTop:
                  getTopPadding(
                    insets.top,
                    true,
                  ),
              },
            ]}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              icon="arrow-left"
              onPress={
                navigation.goBack
              }
            />

            <View
              style={
                styles.headerCopy
              }>
              <AwaText variant="headlineSmall">
                {t(
                  'pregnancyMedicalInformation.header.title',
                )}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.subtitle}>
                {t(
                  'pregnancyMedicalInformation.header.subtitle',
                )}
              </AwaText>
            </View>
          </View>

          <Animated.View
            style={
              entranceStyle
            }>
            {/* HERO */}

            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={t(
                'pregnancyMedicalInformation.hero.accessibilityLabel',
              )}
              resizeMode="cover"
              source={
                HERO
              }
              style={
                styles.hero
              }
            />

            {/* PRIVACY */}

            <View
              style={
                styles.privacyCard
              }>
              <View
                style={
                  styles.privacyIcon
                }>
                <MaterialDesignIcons
                  color={onPrimaryTextColor(theme)}
                  name="shield-lock"
                  size={22}
                />
              </View>

              <View
                style={
                  styles.privacyCopy
                }>
                <Text
                  style={
                    styles.privacyTitle
                  }>
                  {t(
                    'pregnancyMedicalInformation.privacy.title',
                  )}
                </Text>

                <Text
                  style={
                    styles.privacyText
                  }>
                  {t(
                    'pregnancyMedicalInformation.privacy.text',
                  )}
                </Text>
              </View>
            </View>

            {/* DATE */}

            <Text
              style={
                styles.fieldLabel
              }>
              {t(
                'pregnancyMedicalInformation.date.fieldLabel',
              )}
            </Text>

            <Pressable
              accessibilityLabel={t(
                'pregnancyMedicalInformation.date.pickerAccessibilityLabel',
              )}
              accessibilityRole="button"
              onPress={() =>
                setCalendarVisible(
                  true,
                )
              }
              style={({
                pressed,
              }) => [
                styles.dateField,

                Boolean(
                  date,
                ) &&
                  styles.dateFieldSelected,

                pressed &&
                  styles.pressed,
              ]}>
              <View
                style={
                  styles.fieldIcon
                }>
                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="calendar-month-outline"
                  size={20}
                />
              </View>

              <View
                style={
                  styles.dateCopy
                }>
                <Text
                  style={
                    styles.dateSmallLabel
                  }>
                  {t(
                    'pregnancyMedicalInformation.date.smallLabel',
                  )}
                </Text>

                <Text
                  numberOfLines={
                    1
                  }
                  style={[
                    styles.dateValue,

                    !date &&
                      styles.datePlaceholder,
                  ]}>
                  {
                    formatDisplayDate(
                      date,
                    )
                  }
                </Text>
              </View>

              {date ? (
                <Pressable
                  accessibilityLabel={t(
                    'pregnancyMedicalInformation.date.clearAccessibilityLabel',
                  )}
                  hitSlop={8}
                  onPress={
                    event => {
                      event.stopPropagation();
                      setDate(
                        '',
                      );
                    }
                  }
                  style={
                    styles.clearDateIcon
                  }>
                  <MaterialDesignIcons
                    color={theme.colors.textSecondary}
                    name="close"
                    size={17}
                  />
                </Pressable>
              ) : (
                <View
                  style={
                    styles.dateChevron
                  }>
                  <MaterialDesignIcons
                    color={
                      theme.colors.primary
                    }
                    name="chevron-right"
                    size={19}
                  />
                </View>
              )}
            </Pressable>

            <Text
              style={
                styles.helper
              }>
              {t(
                'pregnancyMedicalInformation.date.helper',
              )}
            </Text>

            {/* NOTE */}

            <Text
              style={
                styles.fieldLabel
              }>
              {t(
                'pregnancyMedicalInformation.note.fieldLabel',
              )}
            </Text>

            <View
              style={
                styles.noteField
              }>
              <View
                style={
                  styles.noteTopRow
                }>
                <View
                  style={
                    styles.fieldIcon
                  }>
                  <MaterialDesignIcons
                    color={
                      theme.colors.primary
                    }
                    name="note-edit-outline"
                    size={20}
                  />
                </View>

                <TextInput
                  accessibilityLabel={t(
                    'pregnancyMedicalInformation.note.fieldLabel',
                  )}
                  maxLength={
                    500
                  }
                  multiline
                  onChangeText={
                    text => {
                      setNote(
                        text,
                      );

                      setError(
                        '',
                      );
                    }
                  }
                  placeholder={t(
                    'pregnancyMedicalInformation.note.placeholder',
                  )}
                  placeholderTextColor={theme.colors.textMuted}
                  style={
                    styles.noteInput
                  }
                  textAlignVertical="top"
                  value={
                    note
                  }
                />
              </View>

              <View
                style={
                  styles.counterRow
                }>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="lock-outline"
                  size={13}
                />

                <Text
                  style={
                    styles.counter
                  }>
                  {t(
                    'pregnancyMedicalInformation.note.counter',
                    {
                      count:
                        note.length,
                      max: 500,
                    },
                  )}
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.helper
              }>
              {t(
                'pregnancyMedicalInformation.note.helper',
              )}
            </Text>

            {error ? (
              <Text
                accessibilityRole="alert"
                style={
                  styles.error
                }>
                {error}
              </Text>
            ) : null}

            {/* SAVE */}

            <AwaButton
              accessibilityLabel={t('common.save')}
              fullWidth
              icon={saving ? 'loading' : 'content-save-outline'}
              label={saving ? t('pregnancyMedicalInformation.save.saving') : t('common.save')}
              loading={saving}
              onPress={save}
              size="large"
              style={styles.saveButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ======================================================
          CALENDAR
      ======================================================= */}

      <PremiumDatePickerModal
        onClear={() =>
          setDate('')
        }
        onClose={() =>
          setCalendarVisible(
            false,
          )
        }
        onConfirm={
          selected => {
            setDate(
              toDateKey(
                selected,
              ),
            );

            setCalendarVisible(
              false,
            );
          }
        }
        value={
          date
        }
        visible={
          calendarVisible
        }
      />

      {/* ======================================================
          SUCCESS TOAST
      ======================================================= */}

      {successVisible ? (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom:
                Math.max(
                  insets.bottom,
                  18,
                ) + 12,
              opacity:
                successToastAnimation,
              transform: [
                {
                  translateY:
                    successToastAnimation.interpolate(
                      {
                        inputRange: [
                          0,
                          1,
                        ],
                        outputRange: [
                          18,
                          0,
                        ],
                      },
                    ),
                },
                {
                  scale:
                    successToastAnimation.interpolate(
                      {
                        inputRange: [
                          0,
                          1,
                        ],
                        outputRange: [
                          0.97,
                          1,
                        ],
                      },
                    ),
                },
              ],
            },
          ]}>
          <View
            style={
              styles.toastIcon
            }>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="check"
              size={14}
            />
          </View>

          <Text
            style={
              styles.toastText
            }>
            {t(
              'pregnancyMedicalInformation.toast.success',
            )}
          </Text>

          <AwaIconButton
            accessibilityLabel={t(
              'common.close',
            )}
            icon="close"
            onPress={
              hideSuccessToast
            }
            size="small"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* GLOBAL */

    safe: {
      flex: 1,

      backgroundColor:
        theme.colors.background,
    },

    flex: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 17,
    },

    /* HEADER */

    header: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      paddingBottom: 12,
    },

    headerCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 13,

      paddingTop: 1,
    },

    subtitle: {maxWidth: 305, marginTop: 5},

    /* HERO */

    hero: {
      width: '100%',

      height: 205,

      marginTop: 2,

      borderRadius: 4,
    },

    /* PRIVACY */

    privacyCard: {
      flexDirection: 'row',

      alignItems: 'center',

      marginTop: -23,

      marginHorizontal: 3,

      paddingHorizontal: 13,
      paddingVertical: 11,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 12,

      backgroundColor:
        theme.colors.surface,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.09,

      shadowRadius: 10,

      elevation: 4,
    },

    privacyIcon: {
      width: 41,
      height: 41,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.primary,
    },

    privacyCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,
    },

    privacyTitle: {
      color:
        theme.colors.accent,

      fontSize: 13,
      fontWeight: '800',
    },

    privacyText: {
      marginTop: 3,

      color:
        theme.colors.textSecondary,

      fontSize: 11,
      lineHeight: 16,
    },

    /* FIELD */

    fieldLabel: {
      marginTop: 20,

      marginLeft: 2,

      color:
        theme.colors.accent,

      fontSize: 13,
      fontWeight: '800',
    },

    fieldIcon: {
      width: 38,
      height: 38,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.primarySoft,
    },

    /* DATE */

    dateField: {
      minHeight: 57,

      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 8,

      paddingHorizontal: 12,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 16,

      backgroundColor:
        theme.colors.surface,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.045,

      shadowRadius: 7,

      elevation: 1,
    },

    dateFieldSelected: {
      borderColor:
        withAlpha(theme.colors.primary, 0.4),

      backgroundColor:
        theme.colors.surface,
    },

    dateCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    dateSmallLabel: {
      color:
        theme.colors.textSecondary,

      fontSize: 11,
      fontWeight: '600',
    },

    dateValue: {
      marginTop: 2,

      color:
        theme.colors.text,

      fontSize: 12.5,
      fontWeight: '700',
    },

    datePlaceholder: {
      color: theme.colors.textMuted,

      fontWeight: '500',
    },

    dateChevron: {
      width: 30,
      height: 30,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.primarySoft,
    },

    clearDateIcon: {
      width: 30,
      height: 30,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    helper: {
      marginTop: 7,

      marginHorizontal: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 11,
      lineHeight: 16,
    },

    /* NOTE */

    noteField: {
      minHeight: 185,

      marginTop: 8,

      padding: 12,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 16,

      backgroundColor:
        theme.colors.surface,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.045,

      shadowRadius: 7,

      elevation: 1,
    },

    noteTopRow: {
      flex: 1,

      flexDirection: 'row',

      alignItems:
        'flex-start',
    },

    noteInput: {
      flex: 1,

      minWidth: 0,
      minHeight: 135,

      marginLeft: 9,

      color:
        theme.colors.text,

      fontSize: 12,
      lineHeight: 18,

      paddingTop: 7,
      paddingBottom: 7,
    },

    counterRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'flex-end',

      gap: 4,
    },

    counter: {
      color:
        theme.colors.textSecondary,

      fontSize: 11,
    },

    error: {
      marginTop: 10,

      color: theme.colors.danger,

      fontSize: 11,

      textAlign: 'center',
    },

    /* SAVE */

    saveButton: {marginTop: 21},

    pressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    /* ========================================================
       CALENDAR MODAL
    ======================================================== */

    modalRoot: {
      flex: 1,

      justifyContent:
        'center',

      paddingHorizontal: 18,
    },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(31,18,61,0.42)',
    },

    calendarModal: {
      width: '100%',

      maxWidth: 390,

      alignSelf: 'center',

      padding: 15,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.1),

      borderRadius: 12,

      backgroundColor:
        theme.colors.surface,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 12,
      },

      shadowOpacity: 0.20,

      shadowRadius: 22,

      elevation: 15,
    },

    calendarModalHeader: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    calendarHeaderIcon: {
      width: 39,
      height: 39,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.primarySoft,
    },

    calendarHeaderCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    calendarModalTitle: {
      color:
        theme.colors.accent,

      fontSize: 16,
      fontWeight: '800',
    },

    calendarSelectedText: {
      marginTop: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 11,
    },

    calendarClose: {
      flexShrink: 0,
    },

    /* MONTH */

    monthNavigation: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginTop: 15,
      marginBottom: 11,
    },

    monthTitle: {
      color:
        theme.colors.accent,

      fontSize: 14,

      fontWeight: '800',

      textTransform:
        'capitalize',
    },

    /* WEEK */

    weekRow: {
      flexDirection: 'row',

      paddingHorizontal: 2,
    },

    weekDay: {
      width: '14.2857%',

      color: theme.colors.textSecondary,

      fontSize: 11,

      fontWeight: '800',

      textAlign: 'center',
    },

    /* DAYS */

    calendarGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      marginTop: 5,
    },

    calendarDayCell: {
      width: '14.2857%',

      aspectRatio: 1,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    calendarDay: {
      width: 35,
      height: 35,

      position: 'relative',

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,
    },

    calendarToday: {
      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.45),

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    calendarDaySelected: {
      backgroundColor:
        theme.colors.primary,
    },

    calendarDayText: {
      color:
        theme.colors.text,

      fontSize: 11.5,

      fontWeight: '700',
    },

    calendarDayTextSelected: {
      color: onPrimaryTextColor(theme),

      fontWeight: '800',
    },

    todayDot: {
      position: 'absolute',

      bottom: 3,

      width: 3,
      height: 3,

      borderRadius: 2,

      backgroundColor:
        theme.colors.primary,
    },

    /* TODAY */

    todayButton: {alignSelf: 'center', marginTop: 8},

    /* FOOTER */

    calendarFooter: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginTop: 14,

      paddingTop: 12,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderTopColor:
        withAlpha(theme.colors.primary, 0.14),
    },

    calendarFooterRight: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,
    },

    clearButton: {paddingHorizontal: 12},

    cancelButton: {paddingHorizontal: 12},

    confirmDateButton: {paddingHorizontal: 12},

    /* ========================================================
       SUCCESS TOAST — matches JournalMoodScreen.tsx exactly.
    ======================================================== */

    toast: {
      position: 'absolute',

      left: '7%',
      right: '7%',

      zIndex: 100,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 9,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 12,

      backgroundColor:
        theme.colors.surface,

      paddingHorizontal: 14,
      paddingVertical: 12,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.15,

      shadowRadius: 12,

      elevation: 6,
    },

    toastIcon: {
      width: 24,
      height: 24,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.primary,
    },

    toastText: {
      flex: 1,

      minWidth: 0,

      color:
        theme.colors.accent,

      fontSize: 12.5,
      lineHeight: 17,

      fontWeight: '700',
    },
  });
}