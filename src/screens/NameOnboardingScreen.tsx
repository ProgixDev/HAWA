import React, {
  useRef,
  useState,
} from 'react';

import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';

import {
  MaterialDesignIcons,
} from '@react-native-vector-icons/material-design-icons';

import type {
  RootStackParamList,
} from '../navigation/AppNavigator';

import {
  spacing,
  getTopPadding,
} from '../theme/spacing';

import {
  getCachedPersonalInformation,
  updatePersonalInformation,
} from '../state/personalInformationStore';

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_NAME_LENGTH = 40;

const COLORS = {
  background: '#F7F3FB',
  backgroundDeep: '#EEE7F7',

  white: '#FFFFFF',

  deepPurple: '#2F1B55',
  purple: '#6847B8',
  purpleStrong: '#5C39A8',
  purpleSoft: '#8E73C7',

  lavender: '#EEE6F8',
  lavenderSoft: '#F7F2FB',

  text: '#332A3E',
  secondary: '#71667D',
  muted: '#A099AA',

  border: 'rgba(103,72,181,0.14)',

  success: '#5E8A72',
  successSoft: '#EAF4EE',
};

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'NameOnboarding'
  >;

/* ============================================================
   SCREEN
============================================================ */

function NameOnboardingScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets =
    useSafeAreaInsets();

  const [
    name,
    setName,
  ] =
    useState(
      () =>
        getCachedPersonalInformation()
          .preferredName,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const focusAnim =
    useRef(
      new Animated.Value(0),
    ).current;

  const hasName =
    name.trim().length > 0;

  const handleFocus =
    () => {
      Animated.timing(
        focusAnim,
        {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        },
      ).start();
    };

  const handleBlur =
    () => {
      Animated.timing(
        focusAnim,
        {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        },
      ).start();
    };

  const handleNext =
    async () => {
      if (saving) {
        return;
      }

      try {
        setSaving(
          true,
        );

        await updatePersonalInformation(
          {
            preferredName:
              name.trim(),
          },
        );

        navigation.navigate(
          'SpiritualPreferences',
        );
      } finally {
        setSaving(
          false,
        );
      }
    };

  const animatedBorder =
    focusAnim.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange: [
          'rgba(103,72,181,0.14)',
          'rgba(103,72,181,0.55)',
        ],
      },
    );

  const animatedShadow =
    focusAnim.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          [0, 0.16],
      },
    );

  return (
    <LinearGradient
      colors={[
        '#FBF9FD',
        '#F5F0FA',
        '#EEE7F7',
        '#EAE1F3',
      ]}
      locations={[
        0,
        0.32,
        0.72,
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
      style={
        styles.background
      }>

      {/* =====================================================
          BACKGROUND DECOR
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

        <View
          style={
            styles.ringTop
          }
        />

        <View
          style={
            styles.ringBottom
          }
        />
      </View>

      <SafeAreaView
        style={
          styles.safeArea
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
          style={
            styles.flex
          }>

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
                  ) +
                  spacing.sm,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }>

            {/* =================================================
                BRAND MARK
            ================================================= */}

            <View
              style={
                styles.brandBlock
              }>

              <View
                style={
                  styles.brandIconOuter
                }>

                <LinearGradient
                  colors={[
                    '#ECE2F7',
                    '#F7F3FB',
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
                    styles.brandIcon
                  }>

                  <MaterialDesignIcons
                    color={
                      COLORS.purple
                    }
                    name="account-heart-outline"
                    size={29}
                  />
                </LinearGradient>

                <View
                  style={
                    styles.brandAccent
                  }>

                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="star-four-points"
                    size={10}
                  />
                </View>
              </View>

              <Text
                style={
                  styles.brandEyebrow
                }>
                TON ESPACE PERSONNEL
              </Text>
            </View>

            {/* =================================================
                HEADER
            ================================================= */}

            <View
              style={
                styles.header
              }>

              <Text
                style={
                  styles.title
                }>
                Comment souhaites-tu{'\n'}
                qu’AWA t’appelle ?
              </Text>

              <Text
                style={
                  styles.subtitle
                }>
                Tu peux utiliser ton prénom ou un pseudo.{'\n'}
                Tu pourras modifier ce choix à tout moment.
              </Text>
            </View>

            {/* =================================================
                NAME CARD
            ================================================= */}

            <View
              style={
                styles.formCard
              }>

              <View
                style={
                  styles.formCardHeader
                }>

                <View
                  style={
                    styles.formCardIcon
                  }>

                  <MaterialDesignIcons
                    color={
                      COLORS.purple
                    }
                    name="account-outline"
                    size={20}
                  />
                </View>

                <View
                  style={
                    styles.formCardHeaderCopy
                  }>

                  <Text
                    style={
                      styles.formCardTitle
                    }>
                    Ton prénom ou pseudo
                  </Text>

                  <Text
                    style={
                      styles.formCardSubtitle
                    }>
                    C’est ce nom qu’AWA utilisera pour s’adresser à toi.
                  </Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.inputCard,

                  {
                    borderColor:
                      animatedBorder,

                    shadowOpacity:
                      animatedShadow,
                  },
                ]}>

                <MaterialDesignIcons
                  color={
                    hasName
                      ? COLORS.purple
                      : COLORS.muted
                  }
                  name="account-edit-outline"
                  size={21}
                />

                <TextInput
                  accessibilityLabel="Prénom ou pseudo"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={
                    MAX_NAME_LENGTH
                  }
                  onBlur={
                    handleBlur
                  }
                  onChangeText={
                    setName
                  }
                  onFocus={
                    handleFocus
                  }
                  onSubmitEditing={
                    handleNext
                  }
                  placeholder="Ton prénom ou pseudo"
                  placeholderTextColor="#A79CC4"
                  returnKeyType="done"
                  selectionColor={
                    COLORS.purple
                  }
                  style={
                    styles.input
                  }
                  value={
                    name
                  }
                />

                {hasName ? (
                  <View
                    style={
                      styles.validIcon
                    }>

                    <MaterialDesignIcons
                      color={
                        COLORS.success
                      }
                      name="check"
                      size={14}
                    />
                  </View>
                ) : null}
              </Animated.View>

              <View
                style={
                  styles.inputMetaRow
                }>

                <View
                  style={
                    styles.privacyMeta
                  }>

                  <MaterialDesignIcons
                    color={
                      COLORS.purpleSoft
                    }
                    name="shield-lock-outline"
                    size={13}
                  />

                  <Text
                    style={
                      styles.privacyMetaText
                    }>
                    Tu peux utiliser un pseudo
                  </Text>
                </View>

                <Text
                  style={
                    styles.counter
                  }>
                  {name.length}/{MAX_NAME_LENGTH}
                </Text>
              </View>
            </View>

            {/* =================================================
                EXAMPLE
            ================================================= */}

            <View
              style={
                styles.previewCard
              }>

              <View
                style={
                  styles.previewIcon
                }>

                <MaterialDesignIcons
                  color={
                    COLORS.purple
                  }
                  name="message-text-outline"
                  size={17}
                />
              </View>

              <View
                style={
                  styles.previewCopy
                }>

                <Text
                  style={
                    styles.previewLabel
                  }>
                  Aperçu
                </Text>

                <Text
                  style={
                    styles.previewText
                  }>
                  {hasName
                    ? `As-salamu ‘alaykum, ${name.trim()} ✨`
                    : 'As-salamu ‘alaykum ✨'}
                </Text>
              </View>
            </View>

            {/* =================================================
                NEXT
            ================================================= */}

            <Pressable
              accessibilityRole="button"
              disabled={
                saving
              }
              onPress={
                handleNext
              }
              style={({pressed}) => [
                styles.nextButtonWrapper,

                pressed &&
                  styles.pressed,

                saving &&
                  styles.disabled,
              ]}>

              <LinearGradient
                colors={[
                  '#6D4CC2',
                  '#5A35A7',
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 0,
                }}
                style={
                  styles.nextButton
                }>

                <Text
                  style={
                    styles.nextText
                  }>
                  {saving
                    ? 'Enregistrement…'
                    : 'Suivant'}
                </Text>

                <View
                  style={
                    styles.nextArrow
                  }>

                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="arrow-right"
                    size={19}
                  />
                </View>
              </LinearGradient>
            </Pressable>

            <Text
              style={
                styles.footerText
              }>
              Tu pourras modifier ce nom plus tard depuis ton profil.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    background: {
      flex: 1,

      backgroundColor:
        '#F2ECF8',
    },

    flex: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
    },

    /* ========================================================
       BACKGROUND
    ======================================================== */

    pageBackgroundDecor: {
      ...StyleSheet.absoluteFillObject,

      overflow:
        'hidden',
    },

    pageGlowTop: {
      position:
        'absolute',

      top: -160,
      right: -110,

      width: 340,
      height: 340,

      borderRadius: 170,

      backgroundColor:
        'rgba(99, 67, 160, 0.09)',
    },

    pageGlowMiddle: {
      position:
        'absolute',

      top: '38%',
      left: -145,

      width: 285,
      height: 285,

      borderRadius: 143,

      backgroundColor:
        'rgba(125, 96, 177, 0.055)',
    },

    pageGlowBottom: {
      position:
        'absolute',

      bottom: -165,
      right: -95,

      width: 320,
      height: 320,

      borderRadius: 160,

      backgroundColor:
        'rgba(83, 57, 129, 0.065)',
    },

    ringTop: {
      position:
        'absolute',

      top: 105,
      right: -65,

      width: 145,
      height: 145,

      borderWidth: 1,

      borderColor:
        'rgba(82, 55, 126, 0.05)',

      borderRadius: 73,
    },

    ringBottom: {
      position:
        'absolute',

      bottom: 115,
      left: -55,

      width: 120,
      height: 120,

      borderWidth: 1,

      borderColor:
        'rgba(82, 55, 126, 0.04)',

      borderRadius: 60,
    },

    /* ========================================================
       CONTENT
    ======================================================== */

    content: {
      flexGrow: 1,

      justifyContent:
        'center',

      paddingHorizontal:
        spacing.lg,
    },

    /* ========================================================
       BRAND
    ======================================================== */

    brandBlock: {
      alignItems:
        'center',

      marginBottom: 16,
    },

    brandIconOuter: {
      position:
        'relative',

      width: 68,
      height: 68,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    brandIcon: {
      width: 62,
      height: 62,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.10)',

      borderRadius: 21,

      shadowColor:
        '#44237D',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity:
        0.07,

      shadowRadius:
        8,

      elevation: 2,
    },

    brandAccent: {
      position:
        'absolute',

      right: 0,
      bottom: 0,

      width: 24,
      height: 24,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 3,

      borderColor:
        '#F7F3FB',

      borderRadius: 12,

      backgroundColor:
        COLORS.purple,
    },

    brandEyebrow: {
      marginTop: 7,

      color:
        COLORS.purpleSoft,

      fontSize: 8,

      fontWeight:
        '900',

      letterSpacing: 1.25,
    },

    /* ========================================================
       HEADER
    ======================================================== */

    header: {
      alignItems:
        'center',

      marginBottom:
        spacing.lg,
    },

    title: {
      color:
        COLORS.deepPurple,

      fontFamily:
        'serif',

      fontSize: 29,

      fontWeight:
        '700',

      lineHeight: 36,

      textAlign:
        'center',

      letterSpacing:
        -0.2,
    },

    subtitle: {
      maxWidth: 340,

      marginTop: 11,

      color:
        COLORS.secondary,

      fontSize: 13.5,

      lineHeight: 20,

      textAlign:
        'center',
    },

    /* ========================================================
       FORM CARD
    ======================================================== */

    formCard: {
      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.10)',

      borderRadius: 24,

      backgroundColor:
        'rgba(255,255,255,0.78)',

      padding: 14,

      shadowColor:
        '#452879',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.07,

      shadowRadius:
        14,

      elevation: 3,
    },

    formCardHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 12,
    },

    formCardIcon: {
      width: 38,
      height: 38,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        COLORS.lavender,
    },

    formCardHeaderCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 9,
    },

    formCardTitle: {
      color:
        COLORS.text,

      fontSize: 12.5,

      fontWeight:
        '800',
    },

    formCardSubtitle: {
      marginTop: 2,

      color:
        COLORS.secondary,

      fontSize: 9.5,

      lineHeight: 13,
    },

    /* ========================================================
       INPUT
    ======================================================== */

    inputCard: {
      minHeight: 60,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1.3,

      borderRadius: 18,

      backgroundColor:
        '#FFFDFF',

      paddingHorizontal: 13,

      shadowColor:
        '#5C37A9',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowRadius: 9,

      elevation: 1,
    },

    input: {
      flex: 1,

      minWidth: 0,

      marginLeft: 9,

      color:
        COLORS.deepPurple,

      fontSize: 16,

      fontWeight:
        '600',

      paddingVertical: 0,
    },

    validIcon: {
      width: 28,
      height: 28,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 9,

      backgroundColor:
        COLORS.successSoft,
    },

    inputMetaRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop: 9,
    },

    privacyMeta: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    privacyMetaText: {
      color:
        COLORS.secondary,

      fontSize: 9.5,
    },

    counter: {
      color:
        COLORS.muted,

      fontSize: 9,
    },

    /* ========================================================
       PREVIEW
    ======================================================== */

    previewCard: {
      minHeight: 60,

      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop: 12,

      borderWidth: 1,

      borderColor:
        'rgba(105,73,190,0.09)',

      borderRadius: 18,

      backgroundColor:
        'rgba(245,239,250,0.76)',

      paddingHorizontal: 12,

      paddingVertical: 9,
    },

    previewIcon: {
      width: 37,
      height: 37,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        '#FFFFFF',
    },

    previewCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 9,
    },

    previewLabel: {
      color:
        COLORS.purpleSoft,

      fontSize: 8,

      fontWeight:
        '800',

      letterSpacing:
        0.7,
    },

    previewText: {
      marginTop: 2,

      color:
        COLORS.deepPurple,

      fontSize: 12.5,

      fontWeight:
        '700',
    },

    /* ========================================================
       BUTTON
    ======================================================== */

    nextButtonWrapper: {
      marginTop:
        spacing.md,

      borderRadius: 20,

      shadowColor:
        '#4E319A',

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity:
        0.23,

      shadowRadius:
        10,

      elevation: 5,
    },

    nextButton: {
      minHeight: 54,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      overflow:
        'hidden',

      borderRadius: 20,
    },

    nextText: {
      color:
        '#FFFFFF',

      fontSize: 17,

      fontWeight:
        '800',

      letterSpacing:
        0.1,
    },

    nextArrow: {
      position:
        'absolute',

      right: 9,

      width: 38,
      height: 38,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.28)',

      borderRadius: 19,

      backgroundColor:
        'rgba(255,255,255,0.10)',
    },

    footerText: {
      marginTop: 11,

      color:
        COLORS.muted,

      fontSize: 9.5,

      textAlign:
        'center',
    },

    /* ========================================================
       STATES
    ======================================================== */

    pressed: {
      opacity: 0.86,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    disabled: {
      opacity: 0.55,
    },
  });

export default NameOnboardingScreen;

