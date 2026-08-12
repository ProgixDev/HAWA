import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
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

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {formatFullDate} from '../../utils/cycleMath';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {
  getPregnancyDating,
  setPregnancyDating,
  type PregnancyDatingMethod,
} from '../../state/pregnancyPreferences';

const BACKGROUND = require('../../assets/images/school-selection-background.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#F1EAFB';
const TEXT_SECONDARY = '#706587';
const PINK = '#D96FA5';

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

const OPTIONS: OptionConfig[] = [
  {
    id: 'lastPeriod',
    icon: 'calendar-outline',
    label: 'Premier jour de mes dernières règles',
    description:
      'Utilisé pour estimer la date d’accouchement.',
    dateFieldLabel:
      'Date de début des dernières règles',
  },
  {
    id: 'dueDate',
    icon: 'calendar-check-outline',
    label: 'Date prévue d’accouchement',
    description:
      'Utilisé pour estimer la semaine de grossesse.',
    dateFieldLabel:
      'Date prévue d’accouchement',
  },
  {
    id: 'conceptionDate',
    icon: 'heart-outline',
    label: 'Date estimée de conception',
    description:
      'Utilisé pour estimer la date d’accouchement.',
    dateFieldLabel:
      'Date estimée de conception',
  },
  {
    id: 'later',
    icon: 'clock-outline',
    label:
      'Je renseignerai ces informations plus tard',
    description:
      'Tu pourras compléter ces informations plus tard.',
  },
];

/* ============================================================
   DATE FIELD
============================================================ */

function DateField({
  label,
  date,
  onPress,
}: {
  label: string;
  date: Date | null;
  onPress: () => void;
}): React.JSX.Element {
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
        accessibilityLabel={`${label}, ${
          date
            ? formatFullDate(date)
            : 'non renseignée'
        }`}
        accessibilityRole="button"
        onPress={onPress}
        style={({pressed}) => [
          styles.dateFieldButton,
          pressed && styles.pressed,
        ]}>
        <View style={styles.dateIcon}>
          <MaterialDesignIcons
            color={PURPLE}
            name="calendar-month-outline"
            size={18}
          />
        </View>

        <Text style={styles.dateFieldValue}>
          {date
            ? formatFullDate(date)
            : 'Choisir une date'}
        </Text>

        <View style={styles.dateChevron}>
          <MaterialDesignIcons
            color="#8A7EA8"
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
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

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

    if (id === 'later') {
      setDate(null);
    }
  };

  const canContinue =
    method === 'later' ||
    date !== null;

  const handleNext = async () => {
    if (!canContinue) {
      return;
    }

    await setPregnancyDating({
      method,
      date: date
        ? date.toISOString()
        : null,
    });

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
    <ImageBackground
      source={BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
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

          <Pressable
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={
              navigation.goBack
            }
            style={({pressed}) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={PURPLE}
              name="arrow-left"
              size={24}
            />
          </Pressable>

          {/* ====================================================
              PREMIUM HEADER
          ===================================================== */}

          <Animated.View
            style={headerStyle}>
            <View style={styles.header}>
              {/* ICON FEMME ENCEINTE */}

              <View
                style={
                  styles.pregnancyHeroIcon
                }>
                <View
                  style={
                    styles.pregnancyHeroGlowOuter
                  }
                />

                <View
                  style={
                    styles.pregnancyHeroGlowInner
                  }
                />

                <View
                  style={
                    styles.pregnancyHeroInner
                  }>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="human-pregnant"
                    size={36}
                  />
                </View>

                <View
                  style={
                    styles.pregnancyAccent
                  }>
                  <MaterialDesignIcons
                    color={PINK}
                    name="heart"
                    size={12}
                  />
                </View>
              </View>

              <Text style={styles.eyebrow}>
                MA GROSSESSE
              </Text>

              <Text style={styles.title}>
                Configurer ma grossesse
              </Text>

              <Text
                style={
                  styles.subtitle
                }>
                Choisis la méthode qui te convient
                pour estimer le début de ta grossesse.
              </Text>
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
                                ? PURPLE
                                : '#806AAE'
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
                              color="#FFFFFF"
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
                        />
                      ) : null}
                    </Pressable>
                  </Animated.View>
                );
              },
            )}
          </View>

          {/* ====================================================
              NEXT BUTTON
          ===================================================== */}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled:
                !canContinue,
            }}
            disabled={
              !canContinue
            }
            onPress={
              handleNext
            }
            style={({
              pressed,
            }) => [
              styles.nextButton,

              !canContinue &&
                styles.nextButtonDisabled,

              pressed &&
                canContinue &&
                styles.nextButtonPressed,
            ]}>
            <Text
              style={
                styles.nextText
              }>
              Suivant
            </Text>

            <MaterialDesignIcons
              color="#FFFFFF"
              name="arrow-right"
              size={20}
            />
          </Pressable>
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
          onSelect={setDate}
          value={
            date ??
            new Date()
          }
          visible={
            pickerVisible
          }
        />
      </View>
    </ImageBackground>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

  background: {
    flex: 1,
    backgroundColor: '#F8EFFF',
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

  backButton: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 5,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.08)',
    borderRadius: 16,

    backgroundColor:
      'rgba(255,255,255,0.88)',

    shadowColor:
      '#493276',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 3,
  },

  /* ==========================================================
     PREMIUM HEADER
  ========================================================== */

  header: {
    alignItems: 'center',

    marginBottom: 24,

    paddingHorizontal: 4,
  },

  pregnancyHeroIcon: {
    position: 'relative',

    width: 88,
    height: 88,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 13,
  },

  pregnancyHeroGlowOuter: {
    position: 'absolute',

    width: 88,
    height: 88,

    borderRadius: 44,

    backgroundColor:
      'rgba(105,73,190,0.07)',
  },

  pregnancyHeroGlowInner: {
    position: 'absolute',

    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor:
      'rgba(105,73,190,0.08)',
  },

  pregnancyHeroInner: {
    width: 64,
    height: 64,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.12)',
    borderRadius: 32,

    backgroundColor:
      'rgba(255,255,255,0.96)',

    shadowColor:
      '#593EA2',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,

    elevation: 5,
  },

  pregnancyAccent: {
    position: 'absolute',

    right: 2,
    bottom: 8,

    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 3,
    borderColor:
      '#F8F0FC',
    borderRadius: 14,

    backgroundColor:
      '#FCEAF4',

    shadowColor:
      '#BB5B8E',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,

    elevation: 2,
  },

  eyebrow: {
    marginBottom: 6,

    color: '#9179C8',

    fontSize: 9.5,
    fontWeight: '800',

    letterSpacing: 1.7,

    textAlign: 'center',
  },

  title: {
    color: PURPLE_DARK,

    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',

    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 330,

    marginTop: 8,

    color: TEXT_SECONDARY,

    fontSize: 13.5,
    lineHeight: 20,

    textAlign: 'center',
  },

  /* ==========================================================
     OPTIONS
  ========================================================== */

  list: {
    gap: 11,
  },

  card: {
    padding: 14,

    borderWidth: 1,
    borderColor:
      'rgba(111,83,190,0.11)',
    borderRadius: 22,

    backgroundColor:
      'rgba(255,255,255,0.92)',

    shadowColor:
      '#4E337C',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.055,
    shadowRadius: 12,

    elevation: 2,
  },

  cardSelected: {
    borderWidth: 1.5,
    borderColor:
      '#9C80DA',

    backgroundColor:
      'rgba(248,244,254,0.98)',

    shadowColor:
      '#6949BE',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.13,
    shadowRadius: 14,

    elevation: 4,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
      '#B7A8CC',
    borderRadius: 11,

    backgroundColor:
      '#FFFFFF',
  },

  radioSelected: {
    borderColor:
      PURPLE,

    backgroundColor:
      '#F5F0FD',
  },

  radioDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor:
      PURPLE,
  },

  /* ==========================================================
     CARD ICON
  ========================================================== */

  iconBox: {
    width: 42,
    height: 42,

    marginHorizontal: 11,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor:
      '#F2ECFA',
  },

  iconBoxSelected: {
    backgroundColor:
      '#EDE4FC',
  },

  cardCopy: {
    flex: 1,

    minWidth: 0,

    paddingTop: 1,
  },

  cardLabel: {
    color: '#291D4E',

    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '800',
  },

  cardDescription: {
    marginTop: 4,

    color: '#7A6F91',

    fontSize: 11.5,
    lineHeight: 16,
  },

  selectedCheck: {
    width: 24,
    height: 24,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 7,
    marginTop: 4,

    borderRadius: 12,

    backgroundColor:
      PURPLE,
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
      'rgba(111,83,190,0.14)',
  },

  dateFieldLabel: {
    color: '#655A8D',

    fontSize: 11.5,
    fontWeight: '700',
  },

  dateFieldButton: {
    minHeight: 50,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 8,

    paddingHorizontal: 10,

    borderWidth: 1,
    borderColor:
      '#DDD1EF',
    borderRadius: 16,

    backgroundColor:
      '#FFFFFF',

    shadowColor:
      '#4C3476',
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

    borderRadius: 11,

    backgroundColor:
      PURPLE_SOFT,
  },

  dateFieldValue: {
    flex: 1,

    minWidth: 0,

    color: '#2A2050',

    fontSize: 13.5,
    fontWeight: '700',
  },

  dateChevron: {
    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor:
      '#F7F3FB',
  },

  /* ==========================================================
     NEXT
  ========================================================== */

  nextButton: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    marginTop: 20,

    borderRadius: 20,

    backgroundColor:
      PURPLE,

    shadowColor:
      '#4E319A',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 6,
  },

  nextButtonPressed: {
    opacity: 0.88,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  nextButtonDisabled: {
    backgroundColor:
      '#C5B9D8',

    elevation: 0,

    shadowOpacity: 0,
  },

  nextText: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '800',

    letterSpacing: 0.2,
  },
});

export default PregnancyDatingSetupScreen;