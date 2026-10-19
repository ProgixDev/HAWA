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
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import '../i18n';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';
import {getSelectedObjective} from '../state/onboardingPreferences';
import {buildObjectiveConfirmationContent} from '../data/objectiveConfirmationContent';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CycleObjectiveConfirmation'
>;

function CycleObjectiveConfirmationScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();

  const [objective] = useState(getSelectedObjective);

  const content = useMemo(
    () => buildObjectiveConfirmationContent(t)[objective],
    [t, objective],
  );

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

  /* =========================================================
   * ENTRANCE ANIMATION
   * ========================================================= */

  useEffect(() => {
    let cancelled = false;

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
           * Success badge (central circle).
           */
          Animated.parallel([
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

      });

    return () => {
      cancelled = true;

    };
  }, [
    buttonAnim,
    checkAnim,
    descriptionAnim,
    detailAnim,
    gentle,
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
          buttonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              0.975,
              1,
            ],
          }),
      },
    ],
  };

  /* =========================================================
   * RENDER
   * ========================================================= */

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
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
        style={
          styles.safeArea
        }>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
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
                {/* Success circle */}

                <Animated.View
                  style={[
                    styles.successArea,
                    successStyle,
                  ]}>
                  <View
                    style={
                      styles.successMiddle
                    }>
                    <View
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
                                ? theme.colors.primary
                                : theme.colors.success
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
                    </View>
                  </View>

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
                <AwaCard padding="default" variant="filled">
                  <AwaText
                    colorRole="onSurfaceVariant"
                    variant="bodyMedium">
                    {content.nextStep}
                  </AwaText>
                </AwaCard>
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
              <AwaButton
                accessibilityLabel={
                  content.buttonLabel
                }
                fullWidth
                label={content.buttonLabel}
                onPress={() =>
                  navigation.navigate(
                    'NameOnboarding',
                  )
                }
                size="large"
              />
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

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ========================================================
       BACKGROUND — UNCHANGED
    ======================================================== */

    background: {
      flex: 1,

      backgroundColor:
        theme.colors.background,
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

      justifyContent: 'space-between',

      paddingHorizontal: 22,
    },

    content: {
      flexGrow: 1,

      alignItems: 'center',

      justifyContent: 'center',

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

      justifyContent: 'center',
    },

    successArea: {
      position: 'relative',

      width: 126,
      height: 126,

      alignItems: 'center',

      justifyContent: 'center',
    },

    successMiddle: {
      width: 100,
      height: 100,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 50,

      backgroundColor:
        withAlpha(theme.colors.primary, 0.11),
    },

    successInner: {
      width: 76,
      height: 76,

      alignItems: 'center',

      justifyContent: 'center',

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.11),

      borderRadius: 38,

      shadowColor:
        theme.shadow.shadowColor,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.12,

      shadowRadius: 12,

      elevation: 4,
      backgroundColor: theme.colors.surface,
    },


    /* ========================================================
       TITLE
    ======================================================== */

    title: {
      maxWidth: 350,

      marginTop: 16,

      color:
        theme.colors.text,

      // DESIGN.md: serif screen title, capped at 28 (was 30) and SemiBold (was a 800 literal).
      fontFamily: 'serif',

      fontSize: 28,

      lineHeight: 36,

      fontWeight: '600',

      textAlign: 'center',
    },

    /* ========================================================
       DESCRIPTION
    ======================================================== */

    lead: {
      maxWidth: 340,

      marginTop: 10,

      color: theme.colors.text,

      fontSize: 14,

      lineHeight: 21,

      textAlign: 'center',
    },

    /* ========================================================
       NEXT STEP
    ======================================================== */

    detailCard: {
      width: '100%',

      marginTop: 27,
    },



    /* ========================================================
       CTA
    ======================================================== */

    buttonWrapper: {
      width: '100%',
    },




  });
}

export default CycleObjectiveConfirmationScreen;
