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

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  getTopPadding,
  spacing,
} from '../../theme/spacing';
import {
  getPregnancyJournalState,
  savePregnancyMedicalInformation,
} from '../../state/pregnancyJournalStore';

/* ============================================================
   CONSTANTS
============================================================ */

const HERO = require(
  '../../assets/images/pregnancy/pregnancy-medical-information-hero.png',
);

const PURPLE = '#5631C5';
const PURPLE_DARK = '#21105E';
const PURPLE_LIGHT = '#F1E9FC';
const TEXT_SECONDARY = '#6C638C';

const WEEK_DAYS = [
  'L',
  'M',
  'M',
  'J',
  'V',
  'S',
  'D',
] as const;

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
    return 'Choisir une date';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
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

  const monthTitle =
    new Intl.DateTimeFormat(
      'fr-FR',
      {
        month: 'long',
        year: 'numeric',
      },
    ).format(
      visibleMonth,
    );

  const selectedLabel =
    new Intl.DateTimeFormat(
      'fr-FR',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(
      selectedDate,
    );

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
          accessibilityLabel="Fermer le calendrier"
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
                  PURPLE
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
                Choisir une date
              </Text>

              <Text
                numberOfLines={
                  1
                }
                style={
                  styles.calendarSelectedText
                }>
                {
                  selectedLabel
                }
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Fermer"
              onPress={
                onClose
              }
              style={
                styles.calendarClose
              }>
              <MaterialDesignIcons
                color="#776B98"
                name="close"
                size={19}
              />
            </Pressable>
          </View>

          {/* MONTH */}

          <View
            style={
              styles.monthNavigation
            }>
            <Pressable
              accessibilityLabel="Mois précédent"
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
              style={
                styles.monthArrow
              }>
              <MaterialDesignIcons
                color={
                  PURPLE
                }
                name="chevron-left"
                size={20}
              />
            </Pressable>

            <Text
              style={
                styles.monthTitle
              }>
              {monthTitle}
            </Text>

            <Pressable
              accessibilityLabel="Mois suivant"
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
              style={
                styles.monthArrow
              }>
              <MaterialDesignIcons
                color={
                  PURPLE
                }
                name="chevron-right"
                size={20}
              />
            </Pressable>
          </View>

          {/* WEEK */}

          <View
            style={
              styles.weekRow
            }>
            {WEEK_DAYS.map(
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

          <Pressable
            accessibilityRole="button"
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
            style={
              styles.todayButton
            }>
            <MaterialDesignIcons
              color={
                PURPLE
              }
              name="calendar-today"
              size={15}
            />

            <Text
              style={
                styles.todayButtonText
              }>
              Aujourd’hui
            </Text>
          </Pressable>

          {/* FOOTER */}

          <View
            style={
              styles.calendarFooter
            }>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClear();
                onClose();
              }}
              style={
                styles.clearButton
              }>
              <Text
                style={
                  styles.clearButtonText
                }>
                Effacer
              </Text>
            </Pressable>

            <View
              style={
                styles.calendarFooterRight
              }>
              <Pressable
                accessibilityRole="button"
                onPress={
                  onClose
                }
                style={
                  styles.cancelButton
                }>
                <Text
                  style={
                    styles.cancelButtonText
                  }>
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onConfirm(
                    selectedDate,
                  );
                }}
                style={
                  styles.confirmDateButton
                }>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="check"
                  size={17}
                />

                <Text
                  style={
                    styles.confirmDateText
                  }>
                  Choisir
                </Text>
              </Pressable>
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
    const todayKey = toDateKey(
      new Date(),
    );

    getPregnancyJournalState().then(
      state => {
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
  }, []);

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
          'Ajoute une information avant d’enregistrer.',
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
        barStyle="dark-content"
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
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={
                navigation.goBack
              }
              style={({
                pressed,
              }) => [
                styles.backButton,

                pressed &&
                  styles.pressed,
              ]}>
              <MaterialDesignIcons
                color={
                  PURPLE
                }
                name="arrow-left"
                size={23}
              />
            </Pressable>

            <View
              style={
                styles.headerCopy
              }>
              <Text
                style={
                  styles.title
                }>
                Informations médicales
              </Text>

              <Text
                style={
                  styles.subtitle
                }>
                Note ici les informations importantes que tu souhaites conserver.
              </Text>
            </View>
          </View>

          <Animated.View
            style={
              entranceStyle
            }>
            {/* HERO */}

            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="Carnet médical et stéthoscope"
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
                  color="#FFFFFF"
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
                  Espace personnel et privé
                </Text>

                <Text
                  style={
                    styles.privacyText
                  }>
                  Ces informations restent uniquement sur cet appareil.
                </Text>
              </View>
            </View>

            {/* DATE */}

            <Text
              style={
                styles.fieldLabel
              }>
              Date optionnelle
            </Text>

            <Pressable
              accessibilityLabel="Choisir la date de l’information"
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
                    PURPLE
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
                  Date de l’information
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
                  accessibilityLabel="Effacer la date"
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
                    color="#8A7FA7"
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
                      PURPLE
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
              Indique la date de l’information si tu souhaites la conserver.
            </Text>

            {/* NOTE */}

            <Text
              style={
                styles.fieldLabel
              }>
              Note médicale personnelle
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
                      PURPLE
                    }
                    name="note-edit-outline"
                    size={20}
                  />
                </View>

                <TextInput
                  accessibilityLabel="Note médicale personnelle"
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
                  placeholder="Écris uniquement les informations que tu souhaites conserver."
                  placeholderTextColor="#81779D"
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
                  color="#A79CBE"
                  name="lock-outline"
                  size={13}
                />

                <Text
                  style={
                    styles.counter
                  }>
                  {note.length}/500
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.helper
              }>
              Ajoute ici tes traitements, allergies, examens ou autres informations importantes.
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

            <Pressable
              accessibilityLabel="Enregistrer"
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  saving,
              }}
              disabled={
                saving
              }
              onPress={
                save
              }
              style={({
                pressed,
              }) => [
                styles.saveButton,

                (pressed ||
                  saving) &&
                  styles.pressed,
              ]}>
              <MaterialDesignIcons
                color="#FFFFFF"
                name={
                  saving
                    ? 'loading'
                    : 'content-save-outline'
                }
                size={20}
              />

              <Text
                style={
                  styles.saveText
                }>
                {saving
                  ? 'Enregistrement…'
                  : 'Enregistrer'}
              </Text>
            </Pressable>
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
              color="#FFFFFF"
              name="check"
              size={14}
            />
          </View>

          <Text
            style={
              styles.toastText
            }>
            Informations médicales enregistrées avec succès ✨
          </Text>

          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            hitSlop={10}
            onPress={
              hideSuccessToast
            }
            style={({
              pressed,
            }) => [
              styles.toastCloseButton,

              pressed &&
                styles.toastCloseButtonPressed,
            ]}>
            <MaterialDesignIcons
              color="#8E83A4"
              name="close"
              size={17}
            />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    /* GLOBAL */

    safe: {
      flex: 1,

      backgroundColor:
        '#FCFAFF',
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

    backButton: {
      width: 42,
      height: 42,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderWidth: 1,
      borderColor:
        'rgba(86,49,197,0.07)',

      borderRadius: 15,

      backgroundColor:
        '#F0E8FC',

      shadowColor:
        '#5A36B5',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.07,
      shadowRadius: 7,

      elevation: 2,
    },

    headerCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 13,

      paddingTop: 1,
    },

    title: {
      color:
        PURPLE_DARK,

      fontFamily: 'serif',

      fontSize: 22,
      lineHeight: 27,

      fontWeight: '800',
    },

    subtitle: {
      maxWidth: 305,

      marginTop: 5,

      color:
        TEXT_SECONDARY,

      fontSize: 11.5,
      lineHeight: 17,
    },

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
        '#E4D7F7',

      borderRadius: 18,

      backgroundColor:
        'rgba(250,246,255,0.98)',

      shadowColor:
        '#5A36B5',

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

      borderRadius: 14,

      backgroundColor:
        PURPLE,
    },

    privacyCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,
    },

    privacyTitle: {
      color:
        PURPLE_DARK,

      fontSize: 13,
      fontWeight: '800',
    },

    privacyText: {
      marginTop: 3,

      color:
        TEXT_SECONDARY,

      fontSize: 10.5,
      lineHeight: 15,
    },

    /* FIELD */

    fieldLabel: {
      marginTop: 20,

      marginLeft: 2,

      color:
        PURPLE_DARK,

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
        PURPLE_LIGHT,
    },

    /* DATE */

    dateField: {
      minHeight: 57,

      flexDirection: 'row',

      alignItems: 'center',

      marginTop: 8,

      paddingHorizontal: 11,

      borderWidth: 1,

      borderColor:
        '#DCCFF1',

      borderRadius: 16,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#5A36B5',

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
        '#BBA8E9',

      backgroundColor:
        '#FFFDFF',
    },

    dateCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    dateSmallLabel: {
      color:
        TEXT_SECONDARY,

      fontSize: 8.5,
      fontWeight: '600',
    },

    dateValue: {
      marginTop: 2,

      color:
        PURPLE_DARK,

      fontSize: 12.5,
      fontWeight: '700',
    },

    datePlaceholder: {
      color: '#85799F',

      fontWeight: '500',
    },

    dateChevron: {
      width: 30,
      height: 30,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        '#F5F0FC',
    },

    clearDateIcon: {
      width: 30,
      height: 30,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        '#F5F1F8',
    },

    helper: {
      marginTop: 7,

      marginHorizontal: 2,

      color:
        TEXT_SECONDARY,

      fontSize: 10.5,
      lineHeight: 15,
    },

    /* NOTE */

    noteField: {
      minHeight: 185,

      marginTop: 8,

      padding: 11,

      borderWidth: 1,

      borderColor:
        '#DCCFF1',

      borderRadius: 16,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#5A36B5',

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
        PURPLE_DARK,

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
        TEXT_SECONDARY,

      fontSize: 10,
    },

    error: {
      marginTop: 10,

      color: '#A8505A',

      fontSize: 10.5,

      textAlign: 'center',
    },

    /* SAVE */

    saveButton: {
      minHeight: 51,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 8,

      marginTop: 21,

      borderRadius: 18,

      backgroundColor:
        PURPLE,

      shadowColor:
        '#3F219D',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.23,

      shadowRadius: 9,

      elevation: 5,
    },

    saveText: {
      color: '#FFFFFF',

      fontSize: 14.5,

      fontWeight: '800',
    },

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
        'rgba(86,49,197,0.10)',

      borderRadius: 24,

      backgroundColor:
        '#FFFDFF',

      shadowColor:
        '#2E176E',

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

      borderRadius: 13,

      backgroundColor:
        '#F0E8FC',
    },

    calendarHeaderCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    calendarModalTitle: {
      color:
        PURPLE_DARK,

      fontFamily: 'serif',

      fontSize: 16,
      fontWeight: '800',
    },

    calendarSelectedText: {
      marginTop: 2,

      color:
        TEXT_SECONDARY,

      fontSize: 9.5,
    },

    calendarClose: {
      width: 32,
      height: 32,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        '#F5F1F8',
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

    monthArrow: {
      width: 34,
      height: 34,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        '#F3EDFB',
    },

    monthTitle: {
      color:
        PURPLE_DARK,

      fontFamily: 'serif',

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

      color: '#8A7FA4',

      fontSize: 9,

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
        '#B7A4E5',

      backgroundColor:
        '#FAF7FE',
    },

    calendarDaySelected: {
      backgroundColor:
        PURPLE,

      shadowColor:
        '#4D2DB1',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.22,

      shadowRadius: 5,

      elevation: 3,
    },

    calendarDayText: {
      color:
        PURPLE_DARK,

      fontSize: 11.5,

      fontWeight: '700',
    },

    calendarDayTextSelected: {
      color: '#FFFFFF',

      fontWeight: '800',
    },

    todayDot: {
      position: 'absolute',

      bottom: 3,

      width: 3,
      height: 3,

      borderRadius: 2,

      backgroundColor:
        PURPLE,
    },

    /* TODAY */

    todayButton: {
      minHeight: 34,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      alignSelf: 'center',

      gap: 5,

      marginTop: 8,

      paddingHorizontal: 11,

      borderRadius: 12,

      backgroundColor:
        '#F2ECFA',
    },

    todayButtonText: {
      color:
        PURPLE,

      fontSize: 9.5,

      fontWeight: '800',
    },

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
        '#E8E0F0',
    },

    calendarFooterRight: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,
    },

    clearButton: {
      minHeight: 37,

      justifyContent:
        'center',

      paddingHorizontal: 10,
    },

    clearButtonText: {
      color: '#8B739C',

      fontSize: 10.5,

      fontWeight: '700',
    },

    cancelButton: {
      minHeight: 37,

      alignItems: 'center',
      justifyContent:
        'center',

      paddingHorizontal: 11,

      borderRadius: 12,

      backgroundColor:
        '#F4F0F7',
    },

    cancelButtonText: {
      color:
        TEXT_SECONDARY,

      fontSize: 10.5,

      fontWeight: '700',
    },

    confirmDateButton: {
      minHeight: 38,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 5,

      paddingHorizontal: 13,

      borderRadius: 12,

      backgroundColor:
        PURPLE,

      shadowColor:
        '#45269C',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.18,

      shadowRadius: 6,

      elevation: 3,
    },

    confirmDateText: {
      color: '#FFFFFF',

      fontSize: 10.5,

      fontWeight: '800',
    },

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
        '#E3D8F2',

      borderRadius: 20,

      backgroundColor:
        '#FFFFFF',

      paddingHorizontal: 14,
      paddingVertical: 12,

      shadowColor:
        '#4F2A9C',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.17,

      shadowRadius: 13,

      elevation: 7,
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
        PURPLE,
    },

    toastText: {
      flex: 1,

      minWidth: 0,

      color:
        PURPLE_DARK,

      fontSize: 12.5,
      lineHeight: 17,

      fontWeight: '700',
    },

    toastCloseButton: {
      width: 32,
      height: 32,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 16,
    },

    toastCloseButtonPressed: {
      backgroundColor:
        '#F3EEF8',

      opacity: 0.8,
    },
  });