import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {formatFullDate} from '../../utils/cycleMath';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  getPregnancyDating,
  setPregnancyDating,
  type PregnancyDatingMethod,
} from '../../state/pregnancyPreferences';
import {
  getPregnancyDatingRange,
  validatePregnancyDatingDate,
} from '../../utils/pregnancyDatingValidation';
import {syncPregnancyNotificationsForActiveObjective} from '../../utils/pregnancyReminderScheduling';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PregnancyDatingSetup'
>;

type OptionConfig = {
  id: PregnancyDatingMethod;
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];
  label: string;
  description: string;
  dateFieldLabel?: string;
};

// Built from `t()` inside the component (see `useMemo(buildOptions, ...)`
// below) rather than as a module-level constant, since the labels/
// descriptions must react to the active app language.
function buildOptions(t: (key: string) => string): OptionConfig[] {
  return [
    {
      id: 'lastPeriod',
      icon: 'calendar-outline',
      label: t('pregnancyDatingSetup.options.lastPeriod.label'),
      description: t('pregnancyDatingSetup.options.lastPeriod.description'),
      dateFieldLabel: t('pregnancyDatingSetup.options.lastPeriod.dateFieldLabel'),
    },
    {
      id: 'dueDate',
      icon: 'calendar-check-outline',
      label: t('pregnancyDatingSetup.options.dueDate.label'),
      description: t('pregnancyDatingSetup.options.dueDate.description'),
      dateFieldLabel: t('pregnancyDatingSetup.options.dueDate.dateFieldLabel'),
    },
    {
      id: 'conceptionDate',
      icon: 'heart-outline',
      label: t('pregnancyDatingSetup.options.conceptionDate.label'),
      description: t('pregnancyDatingSetup.options.conceptionDate.description'),
      dateFieldLabel: t('pregnancyDatingSetup.options.conceptionDate.dateFieldLabel'),
    },
    {
      id: 'later',
      icon: 'clock-outline',
      label: t('pregnancyDatingSetup.options.later.label'),
      description: t('pregnancyDatingSetup.options.later.description'),
    },
  ];
}

/* ============================================================
   DATE FIELD
============================================================ */

function DateField({
  label,
  date,
  onPress,
  theme,
  styles,
}: {
  label: string;
  date: Date | null;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  const fieldAnim = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    fieldAnim.setValue(0);

    Animated.timing(fieldAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fieldAnim]);

  return (
    <Animated.View
      style={[
        styles.dateFieldWrap,
        {
          opacity: fieldAnim,
          transform: [
            {
              translateY:
                fieldAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
            },
          ],
        },
      ]}>
      <View style={styles.dateFieldDivider} />

      <Text style={styles.dateFieldLabel}>
        {label}
      </Text>

      <Pressable
        accessibilityLabel={t('pregnancyDatingSetup.dateFieldAccessibility', {
          label,
          value: date ? formatFullDate(date) : t('pregnancyDatingSetup.dateNotSet'),
        })}
        accessibilityRole="button"
        onPress={onPress}
        style={({pressed}) => [
          styles.dateFieldButton,
          pressed && styles.pressed,
        ]}>
        <View style={styles.dateIcon}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="calendar-month-outline"
            size={18}
          />
        </View>

        <Text style={styles.dateFieldValue}>
          {date
            ? formatFullDate(date)
            : t('pregnancyDatingSetup.chooseADate')}
        </Text>

        <View style={styles.dateChevron}>
          <MaterialDesignIcons
            color={theme.colors.textSecondary}
            name="chevron-right"
            size={20}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function PregnancyDatingSetupScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const OPTIONS = useMemo(() => buildOptions(t), [t]);

  const [method, setMethod] =
    useState<PregnancyDatingMethod>(
      () => getPregnancyDating().method,
    );

  const [date, setDate] =
    useState<Date | null>(() => {
      const stored =
        getPregnancyDating().date;

      return stored
        ? new Date(stored)
        : null;
    });

  const [
    pickerVisible,
    setPickerVisible,
  ] = useState(false);

  // Validation feedback for an incoherent date (see
  // utils/pregnancyDatingValidation.ts) — nothing is saved until it passes.
  const [dateError, setDateError] =
    useState('');

  const headerAnim = useRef(
    new Animated.Value(0),
  ).current;

  const cardAnims = useRef(
    OPTIONS.map(
      () => new Animated.Value(0),
    ),
  ).current;

  useEffect(() => {
    const easing =
      Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        easing,
        useNativeDriver: true,
      }),

      Animated.stagger(
        60,
        cardAnims.map(value =>
          Animated.timing(value, {
            toValue: 1,
            duration: 380,
            easing,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();

    // cardAnims is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerAnim]);

  const selectMethod = (
    id: PregnancyDatingMethod,
  ) => {
    if (id === method) {
      return;
    }

    setMethod(id);
    setDateError('');

    if (id === 'later') {
      setDate(null);
    }
  };

  // The picker bounds come from the same range the save-time validation uses.
  const datingRange = getPregnancyDatingRange(
    method,
    new Date(),
  );

  const canContinue =
    method === 'later' ||
    date !== null;

  const handleNext = async () => {
    if (!canContinue) {
      return;
    }

    // Validate on save too — correctness must not depend on the picker UI.
    const validation = validatePregnancyDatingDate(
      method,
      date,
      new Date(),
    );

    if (!validation.valid) {
      setDateError(validation.message);
      return;
    }

    setDateError('');

    try {
      await setPregnancyDating({
        method,
        date: date
          ? date.toISOString()
          : null,
      });
    } catch (saveError) {
      // Not persisted: stay here with the chosen date intact (see services/saveFailure.ts).
      presentSaveFailure(saveError);
      return;
    }

    // The weekly "Nouvelle semaine de grossesse" reminder is derived from the
    // dating: re-derive it from the NEW dating now (same id, so the obsolete
    // schedule is replaced), gated by the active objective like every other
    // Pregnancy notification. This screen is the only writer of the dating.
    syncPregnancyNotificationsForActiveObjective().catch(() => {});

    if (route.params?.mode === 'edit') {
      navigation.goBack();
      return;
    }

    navigation.navigate(
      'PregnancyTrackingPreferences',
    );
  };

  const headerStyle = {
    opacity: headerAnim,

    transform: [
      {
        translateY:
          headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
      },
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
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop:
                getTopPadding(
                  insets.top,
                ),

              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + spacing.md,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }>
          {/* ====================================================
              BACK BUTTON
          ===================================================== */}

          <AwaIconButton
            accessibilityLabel={t('common.back')}
            hitSlop={12}
            icon="arrow-left"
            onPress={
              navigation.goBack
            }
            style={styles.backButton}
          />

          {/* ====================================================
              PREMIUM HEADER
          ===================================================== */}

          <Animated.View style={headerStyle}>
            <View style={styles.header}>
              <View style={styles.eyebrowPill}>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="heart-pulse"
                  size={13}
                />
                <Text style={styles.eyebrow}>{t('pregnancyDatingSetup.eyebrow')}</Text>
              </View>

              <AwaText variant="headlineMedium" style={styles.title}>{t('pregnancyDatingSetup.title')}</AwaText>

              <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>
                {t('pregnancyDatingSetup.subtitle')}
              </AwaText>
            </View>
          </Animated.View>

          {/* ====================================================
              OPTIONS
          ===================================================== */}

          <View style={styles.list}>
            {OPTIONS.map(
              (
                option,
                index,
              ) => {
                const selected =
                  option.id ===
                  method;

                const cardAnim =
                  cardAnims[
                    index
                  ];

                const cardStyle = {
                  opacity:
                    cardAnim,

                  transform: [
                    {
                      translateY:
                        cardAnim.interpolate(
                          {
                            inputRange: [
                              0,
                              1,
                            ],

                            outputRange: [
                              14,
                              0,
                            ],
                          },
                        ),
                    },
                  ],
                };

                return (
                  <Animated.View
                    key={
                      option.id
                    }
                    style={
                      cardStyle
                    }>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked:
                          selected,
                      }}
                      onPress={() =>
                        selectMethod(
                          option.id,
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.card,

                        selected &&
                          styles.cardSelected,

                        pressed &&
                          styles.pressed,
                      ]}>
                      <View
                        style={
                          styles.cardTopRow
                        }>
                        {/* RADIO */}

                        <View
                          style={[
                            styles.radio,

                            selected &&
                              styles.radioSelected,
                          ]}>
                          {selected ? (
                            <View
                              style={
                                styles.radioDot
                              }
                            />
                          ) : null}
                        </View>

                        {/* ICON */}

                        <View
                          style={[
                            styles.iconBox,

                            selected &&
                              styles.iconBoxSelected,
                          ]}>
                          <MaterialDesignIcons
                            color={
                              selected
                                ? theme.colors.primary
                                : theme.colors.textSecondary
                            }
                            name={
                              option.icon
                            }
                            size={20}
                          />
                        </View>

                        {/* COPY */}

                        <View
                          style={
                            styles.cardCopy
                          }>
                          <Text
                            style={
                              styles.cardLabel
                            }>
                            {
                              option.label
                            }
                          </Text>

                          <Text
                            style={
                              styles.cardDescription
                            }>
                            {
                              option.description
                            }
                          </Text>
                        </View>

                        {/* CHECK SELECTED */}

                        {selected ? (
                          <View
                            style={
                              styles.selectedCheck
                            }>
                            <MaterialDesignIcons
                              color={onPrimaryTextColor(theme)}
                              name="check"
                              size={14}
                            />
                          </View>
                        ) : null}
                      </View>

                      {/* DATE FIELD */}

                      {selected &&
                      option.dateFieldLabel ? (
                        <DateField
                          date={
                            date
                          }
                          label={
                            option.dateFieldLabel
                          }
                          onPress={() =>
                            setPickerVisible(
                              true,
                            )
                          }
                          styles={styles}
                          theme={theme}
                        />
                      ) : null}
                    </Pressable>
                  </Animated.View>
                );
              },
            )}
          </View>

          {dateError ? (
            <Text
              accessibilityRole="alert"
              style={styles.dateError}>
              {dateError}
            </Text>
          ) : null}

          {/* ====================================================
              NEXT BUTTON
          ===================================================== */}

          <AwaButton
            disabled={!canContinue}
            fullWidth
            label={route.params?.mode === 'edit' ? t('common.save') : t('pregnancyDatingSetup.next')}
            onPress={handleNext}
            size="large"
            style={styles.nextButton}
          />
        </ScrollView>

        {/* ======================================================
            DATE PICKER
        ======================================================= */}

        <InlineCalendarPickerModal
          onClose={() =>
            setPickerVisible(
              false,
            )
          }
          maximumDate={
            datingRange?.max
          }
          minimumDate={
            datingRange?.min
          }
          onSelect={picked => {
            setDate(picked);
            setDateError('');
          }}
          value={
            date ??
            datingRange?.max ??
            new Date()
          }
          visible={
            pickerVisible
          }
        />
      </View>
    </LinearGradient>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,

    paddingHorizontal:
      spacing.lg,

    paddingBottom:
      spacing.md,
  },

  pressed: {
    opacity: 0.82,
  },

  /* ==========================================================
     BACK
  ========================================================== */

  backButton: {alignSelf: 'flex-start', marginBottom: 5},

  /* ==========================================================
     PREMIUM HEADER
  ========================================================== */

  header: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
    borderRadius: 999,
    backgroundColor: withAlpha(theme.colors.surface, 0.55),
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  eyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
    textAlign: 'center',
  },

  title: {textAlign: 'center'},

  subtitle: {maxWidth: 330, marginTop: 0, textAlign: 'center'},

  /* ==========================================================
     OPTIONS
  ========================================================== */

  list: {
    gap: 10,
  },

  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.88),
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 1,
  },

  cardSelected: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.98),
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ==========================================================
     RADIO
  ========================================================== */

  radio: {
    width: 21,
    height: 21,

    marginTop: 7,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1.8,
    borderColor:
      withAlpha(theme.colors.primary, 0.35),
    borderRadius: 11,

    backgroundColor:
      theme.colors.surface,
  },

  radioSelected: {
    borderColor:
      theme.colors.primary,

    backgroundColor:
      theme.colors.primarySoft,
  },

  radioDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor:
      theme.colors.primary,
  },

  /* ==========================================================
     CARD ICON
  ========================================================== */

  iconBox: {
    width: 40,
    height: 40,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  iconBoxSelected: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },

  cardCopy: {
    flex: 1,

    minWidth: 0,

    paddingTop: 1,
  },

  cardLabel: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },

  cardDescription: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  selectedCheck: {
    width: 24,
    height: 24,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 7,
    marginTop: 0,

    borderRadius: 12,

    backgroundColor:
      theme.colors.primary,
  },

  /* ==========================================================
     DATE FIELD
  ========================================================== */

  dateFieldWrap: {
    marginTop: 13,
  },

  dateFieldDivider: {
    height:
      StyleSheet.hairlineWidth,

    marginBottom: 12,

    backgroundColor:
      theme.colors.border,
  },

  dateFieldLabel: {
    color: theme.colors.textSecondary,

    fontSize: 11.5,
    fontWeight: '700',
  },

  dateFieldButton: {
    minHeight: 50,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 8,

    paddingHorizontal: 12,

    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 16,

    backgroundColor:
      theme.colors.surface,

    shadowColor:
      theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,

    elevation: 1,
  },

  dateIcon: {
    width: 34,
    height: 34,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    borderRadius: 12,

    backgroundColor:
      theme.colors.primarySoft,
  },

  dateFieldValue: {
    flex: 1,

    minWidth: 0,

    color: theme.colors.text,

    fontSize: 13.5,
    fontWeight: '700',
  },

  dateChevron: {
    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor:
      theme.colors.primarySoft,
  },

  /* ==========================================================
     NEXT
  ========================================================== */

  dateError: {
    marginTop: 12,
    marginHorizontal: 4,
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },

  nextButton: {marginTop: 20},

  });
}

export default PregnancyDatingSetupScreen;
