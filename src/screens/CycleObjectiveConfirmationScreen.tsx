import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';
import {getSelectedObjective} from '../state/onboardingPreferences';
import {OBJECTIVE_CONFIRMATION_CONTENT} from '../data/objectiveConfirmationContent';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#EEE5FC';

const TEXT = '#433467';
const TEXT_MUTED = '#655A8D';

const SUCCESS = '#58A678';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CycleObjectiveConfirmation'
>;

function CycleObjectiveConfirmationScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [objective] = useState(getSelectedObjective);

  const content =
    OBJECTIVE_CONFIRMATION_CONTENT[objective];

  /*
   * The "loss" objective uses a calmer animation:
   * no continuous pulse and a neutral heart icon.
   */
  const gentle = objective === 'loss';

  /* =========================================================
   * ANIMATION VALUES
   * ========================================================= */

  const pageAnim =
    useRef(new Animated.Value(0)).current;

  const haloAnim =
    useRef(new Animated.Value(0)).current;

  const successAnim =
    useRef(new Animated.Value(0)).current;

  const checkAnim =
    useRef(new Animated.Value(0)).current;

  const titleAnim =
    useRef(new Animated.Value(0)).current;

  const descriptionAnim =
    useRef(new Animated.Value(0)).current;

  const detailAnim =
    useRef(new Animated.Value(0)).current;

  const buttonAnim =
    useRef(new Animated.Value(0)).current;

  const buttonPulseAnim =
    useRef(new Animated.Value(1)).current;

  /* =========================================================
   * ENTRANCE ANIMATION
   * ========================================================= */

  useEffect(() => {
    let cancelled = false;

    let haloLoop:
      | Animated.CompositeAnimation
      | undefined;

    let buttonLoop:
      | Animated.CompositeAnimation
      | undefined;

    AccessibilityInfo
      .isReduceMotionEnabled()
      .then(reduceMotion => {
        if (cancelled) {
          return;
        }

        /*
         * Respect Android/iOS Reduce Motion.
         */
        if (reduceMotion) {
          pageAnim.setValue(1);
          haloAnim.setValue(1);
          successAnim.setValue(1);
          checkAnim.setValue(1);
          titleAnim.setValue(1);
          descriptionAnim.setValue(1);
          detailAnim.setValue(1);
          buttonAnim.setValue(1);

          return;
        }

        const easeOut =
          Easing.out(Easing.cubic);

        /*
         * Full screen appearance.
         */
        Animated.timing(
          pageAnim,
          {
            toValue: 1,
            duration: 320,
            easing: easeOut,
            useNativeDriver: true,
          },
        ).start();

        /*
         * Foreground choreography.
         */
        Animated.sequence([
          Animated.delay(70),

          /*
           * Success halo + central circle.
           */
          Animated.parallel([
            Animated.timing(
              haloAnim,
              {
                toValue: 1,
                duration: gentle
                  ? 420
                  : 500,
                easing:
                  Easing.out(
                    Easing.quad,
                  ),
                useNativeDriver: true,
              },
            ),

            Animated.spring(
              successAnim,
              {
                toValue: 1,
                friction: gentle
                  ? 9
                  : 5.5,
                tension: gentle
                  ? 55
                  : 90,
                useNativeDriver: true,
              },
            ),
          ]),

          /*
           * Check mark has its own small pop.
           */
          Animated.spring(
            checkAnim,
            {
              toValue: 1,
              friction: gentle
                ? 9
                : 4.5,
              tension: gentle
                ? 60
                : 115,
              useNativeDriver: true,
            },
          ),

          /*
           * Copy progressively appears.
           */
          Animated.stagger(75, [
            Animated.timing(
              titleAnim,
              {
                toValue: 1,
                duration: 370,
                easing: easeOut,
                useNativeDriver: true,
              },
            ),

            Animated.timing(
              descriptionAnim,
              {
                toValue: 1,
                duration: 370,
                easing: easeOut,
                useNativeDriver: true,
              },
            ),

            Animated.timing(
              detailAnim,
              {
                toValue: 1,
                duration: 370,
                easing: easeOut,
                useNativeDriver: true,
              },
            ),

            Animated.timing(
              buttonAnim,
              {
                toValue: 1,
                duration: 390,
                easing: easeOut,
                useNativeDriver: true,
              },
            ),
          ]),
        ]).start();

        /*
         * Very light ambient animation.
         * Disabled for "loss".
         */
        if (!gentle) {
          haloLoop =
            Animated.loop(
              Animated.sequence([
                Animated.delay(1100),

                Animated.timing(
                  haloAnim,
                  {
                    toValue: 0.68,
                    duration: 1450,
                    easing:
                      Easing.inOut(
                        Easing.ease,
                      ),
                    useNativeDriver: true,
                  },
                ),

                Animated.timing(
                  haloAnim,
                  {
                    toValue: 1,
                    duration: 1450,
                    easing:
                      Easing.inOut(
                        Easing.ease,
                      ),
                    useNativeDriver: true,
                  },
                ),
              ]),
            );

          haloLoop.start();

          /*
           * CTA softly calls attention occasionally,
           * without continuously bouncing.
           */
          buttonLoop =
            Animated.loop(
              Animated.sequence([
                Animated.delay(2100),

                Animated.timing(
                  buttonPulseAnim,
                  {
                    toValue: 1.018,
                    duration: 430,
                    easing:
                      Easing.inOut(
                        Easing.ease,
                      ),
                    useNativeDriver: true,
                  },
                ),

                Animated.timing(
                  buttonPulseAnim,
                  {
                    toValue: 1,
                    duration: 430,
                    easing:
                      Easing.inOut(
                        Easing.ease,
                      ),
                    useNativeDriver: true,
                  },
                ),

                Animated.delay(2300),
              ]),
            );

          buttonLoop.start();
        }
      });

    return () => {
      cancelled = true;

      haloLoop?.stop();
      buttonLoop?.stop();
    };
  }, [
    buttonAnim,
    buttonPulseAnim,
    checkAnim,
    descriptionAnim,
    detailAnim,
    gentle,
    haloAnim,
    pageAnim,
    successAnim,
    titleAnim,
  ]);

  /* =========================================================
   * ANIMATED STYLES
   * ========================================================= */

  const pageStyle = {
    opacity: pageAnim,

    transform: [
      {
        translateY:
          pageAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              gentle ? 4 : 9,
              0,
            ],
          }),
      },
    ],
  };

  const haloStyle = {
    opacity:
      haloAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          0.12,
          gentle ? 0.5 : 1,
        ],
      }),

    transform: [
      {
        scale:
          haloAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              0.72,
              1.08,
            ],
          }),
      },
    ],
  };

  const successStyle = {
    opacity: successAnim,

    transform: [
      {
        scale:
          successAnim.interpolate({
            inputRange: [
              0,
              0.7,
              1,
            ],

            outputRange: gentle
              ? [
                  0.94,
                  1.01,
                  1,
                ]
              : [
                  0.58,
                  1.075,
                  1,
                ],
          }),
      },

      {
        translateY:
          successAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              gentle ? 5 : 14,
              0,
            ],
          }),
      },
    ],
  };

  const checkStyle = {
    opacity: checkAnim,

    transform: [
      {
        scale:
          checkAnim.interpolate({
            inputRange: [
              0,
              0.72,
              1,
            ],

            outputRange: gentle
              ? [
                  0.8,
                  1.04,
                  1,
                ]
              : [
                  0.25,
                  1.24,
                  1,
                ],
          }),
      },

      {
        rotate:
          checkAnim.interpolate({
            inputRange: [0, 1],

            outputRange: gentle
              ? [
                  '-4deg',
                  '0deg',
                ]
              : [
                  '-14deg',
                  '0deg',
                ],
          }),
      },
    ],
  };

  const titleStyle = {
    opacity: titleAnim,

    transform: [
      {
        translateY:
          titleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
      },
    ],
  };

  const descriptionStyle = {
    opacity: descriptionAnim,

    transform: [
      {
        translateY:
          descriptionAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
      },
    ],
  };

  const detailStyle = {
    opacity: detailAnim,

    transform: [
      {
        translateY:
          detailAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [13, 0],
          }),
      },

      {
        scale:
          detailAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              0.985,
              1,
            ],
          }),
      },
    ],
  };

  const buttonStyle = {
    opacity: buttonAnim,

    transform: [
      {
        translateY:
          buttonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
      },

      {
        scale:
          Animated.multiply(
            buttonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [
                0.975,
                1,
              ],
            }),

            buttonPulseAnim,
          ),
      },
    ],
  };

  /* =========================================================
   * RENDER
   * ========================================================= */

  return (
    <LinearGradient
      colors={[
        '#FAF8FD',
        '#F4EFFA',
        '#EEE7F7',
        '#E9E1F3',
      ]}
      locations={[
        0,
        0.32,
        0.7,
        1,
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.background}>
      {/* =====================================================
          SAME BACKGROUND — UNCHANGED
      ===================================================== */}

      <View
        pointerEvents="none"
        style={
          styles.pageBackgroundDecor
        }>
        <View
          style={
            styles.pageGlowTop
          }
        />

        <View
          style={
            styles.pageGlowMiddle
          }
        />

        <View
          style={
            styles.pageGlowBottom
          }
        />
      </View>

      <View
        style={
          styles.safeArea
        }>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />

        <Animated.View
          style={[
            styles.animatedPage,
            pageStyle,
          ]}>
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.page,
              {
                paddingTop:
                  getTopPadding(
                    insets.top,
                  ),

                paddingBottom:
                  Math.max(
                    insets.bottom,
                    16,
                  ) + 10,
              },
            ]}
            showsVerticalScrollIndicator={
              false
            }>
            <View
              style={
                styles.content
              }>
              {/* =============================================
                  SUCCESS ICON
              ============================================= */}

              <View
                style={
                  styles.successStage
                }>
                {/* Animated halo */}

                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.successHalo,
                    haloStyle,
                  ]}
                />

                {/* Success circle */}

                <Animated.View
                  style={[
                    styles.successArea,
                    successStyle,
                  ]}>
                  <View
                    style={
                      styles.successOuter
                    }>
                    <View
                      style={
                        styles.successMiddle
                      }>
                      <LinearGradient
                        colors={[
                          '#FFFFFF',
                          '#F7F2FD',
                        ]}
                        start={{
                          x: 0,
                          y: 0,
                        }}
                        end={{
                          x: 1,
                          y: 1,
                        }}
                        style={
                          styles.successInner
                        }>
                        <Animated.View
                          style={
                            checkStyle
                          }>
                          <MaterialDesignIcons
                            color={
                              gentle
                                ? PURPLE
                                : SUCCESS
                            }
                            name={
                              gentle
                                ? 'heart-outline'
                                : 'check-bold'
                            }
                            size={
                              gentle
                                ? 36
                                : 43
                            }
                          />
                        </Animated.View>
                      </LinearGradient>
                    </View>
                  </View>

                  {!gentle ? (
                    <View
                      style={
                        styles.successBadge
                      }>
                      <MaterialDesignIcons
                        color="#FFFFFF"
                        name="star-four-points"
                        size={11}
                      />
                    </View>
                  ) : null}
                </Animated.View>
              </View>

              {/* =============================================
                  TITLE
              ============================================= */}

              <Animated.Text
                style={[
                  styles.title,
                  titleStyle,
                ]}>
                {content.title}
              </Animated.Text>

              {/* =============================================
                  DESCRIPTION
              ============================================= */}

              <Animated.Text
                style={[
                  styles.lead,
                  descriptionStyle,
                ]}>
                {content.description}
              </Animated.Text>

              {/* =============================================
                  NEXT STEP
                  BORDER KEPT — NO WHITE BACKGROUND
              ============================================= */}

              <Animated.View
                style={[
                  styles.detailCard,
                  detailStyle,
                ]}>
                <View
                  style={
                    styles.detailIcon
                  }>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="creation-outline"
                    size={21}
                  />
                </View>

                <Text
                  style={
                    styles.description
                  }>
                  {content.nextStep}
                </Text>
              </Animated.View>
            </View>

            {/* ===============================================
                CTA
            =============================================== */}

            <Animated.View
              style={[
                styles.buttonWrapper,
                buttonStyle,
              ]}>
              <Pressable
                accessibilityLabel={
                  content.buttonLabel
                }
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate(
                    'NameOnboarding',
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.button,

                  pressed &&
                    styles.buttonPressed,
                ]}>
                <Text
                  style={
                    styles.buttonText
                  }>
                  {
                    content.buttonLabel
                  }
                </Text>

                <View
                  style={
                    styles.buttonArrow
                  }>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="arrow-right"
                    size={18}
                  />
                </View>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

/* ===========================================================
 * STYLES
 * =========================================================== */

const styles =
  StyleSheet.create({
    /* ========================================================
       BACKGROUND — UNCHANGED
    ======================================================== */

    background: {
      flex: 1,

      backgroundColor:
        '#F2ECF8',
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

      backgroundColor:
        'rgba(111, 82, 170, 0.07)',
    },

    pageGlowMiddle: {
      position: 'absolute',

      top: '38%',
      left: -130,

      width: 260,
      height: 260,

      borderRadius: 130,

      backgroundColor:
        'rgba(139, 112, 188, 0.045)',
    },

    pageGlowBottom: {
      position: 'absolute',

      bottom: -150,
      right: -100,

      width: 310,
      height: 310,

      borderRadius: 155,

      backgroundColor:
        'rgba(92, 67, 139, 0.05)',
    },

    safeArea: {
      flex: 1,
    },

    animatedPage: {
      flex: 1,
    },

    /* ========================================================
       PAGE
    ======================================================== */

    page: {
      flexGrow: 1,

      justifyContent:
        'space-between',

      paddingHorizontal: 22,
    },

    content: {
      flexGrow: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingTop: 20,
      paddingBottom: 25,
    },

    /* ========================================================
       SUCCESS STAGE
    ======================================================== */

    successStage: {
      position: 'relative',

      width: 150,
      height: 150,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    successHalo: {
      position: 'absolute',

      width: 142,
      height: 142,

      borderRadius: 71,

      backgroundColor:
        'rgba(105,73,190,0.10)',
    },

    successArea: {
      position: 'relative',

      width: 126,
      height: 126,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    successOuter: {
      width: 126,
      height: 126,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 63,

      backgroundColor:
        'rgba(105,73,190,0.07)',
    },

    successMiddle: {
      width: 100,
      height: 100,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 50,

      backgroundColor:
        'rgba(105,73,190,0.11)',
    },

    successInner: {
      width: 76,
      height: 76,

      alignItems: 'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.11)',

      borderRadius: 38,

      shadowColor:
        PURPLE,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.12,

      shadowRadius: 12,

      elevation: 4,
    },

    successBadge: {
      position: 'absolute',

      right: 2,
      bottom: 5,

      width: 29,
      height: 29,

      alignItems: 'center',

      justifyContent:
        'center',

      borderWidth: 3,

      borderColor:
        '#F4EFFA',

      borderRadius: 15,

      backgroundColor:
        PURPLE,

      shadowColor:
        PURPLE,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.16,

      shadowRadius: 5,

      elevation: 3,
    },

    /* ========================================================
       TITLE
    ======================================================== */

    title: {
      maxWidth: 350,

      marginTop: 16,

      color:
        PURPLE_DARK,

      fontFamily: 'serif',

      fontSize: 30,

      lineHeight: 37,

      fontWeight: '800',

      textAlign: 'center',
    },

    /* ========================================================
       DESCRIPTION
    ======================================================== */

    lead: {
      maxWidth: 340,

      marginTop: 10,

      color: TEXT,

      fontSize: 14.5,

      lineHeight: 21,

      textAlign: 'center',
    },

    /* ========================================================
       NEXT STEP
    ======================================================== */

    detailCard: {
      width: '100%',

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 11,

      marginTop: 27,

      paddingHorizontal: 15,

      paddingVertical: 14,

      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.17)',

      borderRadius: 20,

      /*
       * IMPORTANT:
       * Border remains but white rectangle is removed.
       */
      backgroundColor:
        'transparent',

      elevation: 0,
    },

    detailIcon: {
      width: 38,
      height: 38,

      alignItems: 'center',

      justifyContent:
        'center',

      flexShrink: 0,

      borderRadius: 12,

      backgroundColor:
        PURPLE_SOFT,
    },

    description: {
      flex: 1,

      minWidth: 0,

      color:
        TEXT_MUTED,

      fontSize: 13,

      lineHeight: 19,

      fontWeight: '500',

      backgroundColor:
        'transparent',
    },

    /* ========================================================
       CTA
    ======================================================== */

    buttonWrapper: {
      width: '100%',
    },

    button: {
      position: 'relative',

      width: '100%',

      minHeight: 57,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 19,

      backgroundColor:
        PURPLE,

      shadowColor:
        '#4E319A',

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity: 0.22,

      shadowRadius: 10,

      elevation: 5,
    },

    buttonText: {
      paddingHorizontal: 52,

      color:
        '#FFFFFF',

      fontSize: 16,

      fontWeight: '800',

      textAlign: 'center',
    },

    buttonArrow: {
      position: 'absolute',

      right: 11,

      width: 34,
      height: 34,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        '#FFFFFF',
    },

    buttonPressed: {
      opacity: 0.88,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },
  });

export default CycleObjectiveConfirmationScreen;