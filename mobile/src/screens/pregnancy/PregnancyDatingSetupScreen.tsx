import React, {useEffect, useRef, useState} from 'react';
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
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {formatFullDate} from '../../utils/cycleMath';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {
  getPregnancyDating,
  setPregnancyDating,
  type PregnancyDatingMethod,
} from '../../state/pregnancyPreferences';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#F1EAFB';
const TEXT_SECONDARY = '#706587';

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
  route,
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

          <Animated.View style={headerStyle}>
            <View style={styles.header}>
              <View style={styles.pregnancyHeroIcon}>
                <View pointerEvents="none" style={styles.pregnancyHeroGlowOuter} />
                <View pointerEvents="none" style={styles.pregnancyHeroGlowInner} />

                <LinearGradient
                  colors={['#FFFFFF', '#F6F1FB']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.pregnancyHeroInner}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="human-pregnant"
                    size={34}
                  />
                </LinearGradient>

                <View style={styles.pregnancyAccent}>
                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="baby-face-outline"
                    size={14}
                  />
                </View>
              </View>

              <View style={styles.eyebrowPill}>
                <MaterialDesignIcons
                  color="#745DA3"
                  name="heart-pulse"
                  size={13}
                />
                <Text style={styles.eyebrow}>MA GROSSESSE</Text>
              </View>

              <Text style={styles.title}>Configurer ma grossesse</Text>

              <Text style={styles.subtitle}>
                Choisis la méthode qui te convient pour estimer le début de ta grossesse.
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
    </LinearGradient>
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
    backgroundColor: '#F2ECF8',
  },

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
    marginTop: -10,
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  pregnancyHeroIcon: {
    position: 'relative',
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  pregnancyHeroGlowOuter: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(105,73,190,0.055)',
  },

  pregnancyHeroGlowInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(105,73,190,0.07)',
  },

  pregnancyHeroInner: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.14)',
    borderRadius: 20,
    shadowColor: '#4E337C',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },

  pregnancyAccent: {
    position: 'absolute',
    right: 1,
    bottom: 6,
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F6F0FA',
    borderRadius: 14,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
  },

  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  eyebrow: {
    color: '#745DA3',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.25,
    textAlign: 'center',
  },

  title: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 330,
    marginTop: 0,
    color: TEXT_SECONDARY,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },



  /* ==========================================================
     OPTIONS
  ========================================================== */

  list: {
    gap: 10,
  },

  card: {
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.12)',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#4E337C',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 1,
  },

  cardSelected: {
    borderWidth: 1.5,
    borderColor: '#8D72C6',
    backgroundColor: 'rgba(248,245,253,0.98)',
    shadowColor: '#6949BE',
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
    width: 40,
    height: 40,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 13,
    backgroundColor: '#F2ECFA',
  },

  iconBoxSelected: {
    borderColor: 'rgba(105,73,190,0.14)',
    backgroundColor: '#EDE4FC',
  },

  cardCopy: {
    flex: 1,

    minWidth: 0,

    paddingTop: 1,
  },

  cardLabel: {
    color: '#291D4E',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },

  cardDescription: {
    marginTop: 3,
    color: '#7A6F91',
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