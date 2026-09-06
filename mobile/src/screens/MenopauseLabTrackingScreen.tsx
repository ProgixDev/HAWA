import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import {spacing, getTopPadding} from '../theme/spacing';
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  setMenopauseLabTracking,
  type MenopauseLabTracking,
} from '../state/menopausePreferences';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MenopauseLabTracking'
>;

const OPTIONS: Array<{
  id: MenopauseLabTracking;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {
    id: 'fsh',
    title: 'FSH',
    subtitle: 'Hormone folliculo-stimulante',
    icon: 'flask-outline',
    tint: '#E7F0F5',
  },
  {
    id: 'estradiol',
    title: 'Estradiol',
    subtitle: 'Suivre l’évolution de tes résultats',
    icon: 'test-tube',
    tint: '#F3E9F7',
  },
  {
    id: 'both',
    title: 'Les deux',
    subtitle: 'FSH et Estradiol',
    icon: 'clipboard-check-outline',
    tint: '#E7F0E8',
  },
  {
    id: 'none',
    title: 'Pas pour le moment',
    subtitle: 'Je préfère en décider plus tard',
    icon: 'clock-outline',
    tint: '#EFE7F4',
  },
];

function MenopauseLabTrackingScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const [selected, setSelected] =
    useState<MenopauseLabTracking | null>(
      () => getMenopausePreferences().labTracking,
    );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateMenopausePreferences().then(value => {
      if (active) {
        setSelected(current => current ?? value.labTracking);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    if (reduceMotion.current) {
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [floatAnimation]);

  const handleFinish = async () => {
    if (saving || !selected) {
      return;
    }

    setSaving(true);

    try {
      await setMenopauseLabTracking(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MenopauseReminders');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const floatingIconStyle = {
    transform: [
      {
        translateY: floatAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -7],
        }),
      },
      {
        rotate: floatAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-3deg'],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.35, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View
        pointerEvents="none"
        style={styles.pageBackgroundDecor}>

        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowLeft} />
        <View style={styles.pageGlowBottom} />

        <View style={styles.smallDecorCircleOne} />
        <View style={styles.smallDecorCircleTwo} />

      </View>

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
              paddingTop: getTopPadding(insets.top),
              paddingBottom:
                Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Animated.View
            style={[
              styles.mainContent,
              entranceStyle,
            ]}>

            <View style={styles.heroSection}>

              <Animated.View
                style={[
                  styles.heroIconOuter,
                  floatingIconStyle,
                ]}>

                <LinearGradient
                  colors={[
                    theme.colors.surface,
                    theme.colors.primarySoft,
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.heroIconInner}>

                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="test-tube"
                    size={30}
                  />

                </LinearGradient>

                <View style={styles.heroIconGlow} />
              </Animated.View>

              <Text style={styles.eyebrow}>
                TES DONNÉES, À TON RYTHME
              </Text>

              <Text style={styles.title}>
                Souhaites-tu suivre
                {'\n'}
                tes analyses ?
              </Text>

              <Text style={styles.subtitle}>
                AWA peut t’aider à conserver l’évolution des résultats
                que tu renseignes, sans les interpréter à ta place.
              </Text>

            </View>

            <View style={styles.optionsWrapper}>

              <View style={styles.optionsIntroRow}>
                <Text style={styles.optionsTitle}>
                  Ce que je souhaite suivre
                </Text>

                <View style={styles.optionsLine} />
              </View>

              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <PremiumChoiceCard
                    icon={option.icon}
                    iconTint={option.tint}
                    key={option.id}
                    onPress={() => setSelected(option.id)}
                    selected={selected === option.id}
                    subtitle={option.subtitle}
                    title={option.title}
                  />
                ))}
              </View>

            </View>

          </Animated.View>

          <View style={styles.bottomSection}>

            <View style={styles.finalInfoRow}>
              <View style={styles.finalInfoIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-check-outline"
                  size={16}
                />
              </View>

              <Text style={styles.helperText}>
                Tu pourras modifier ce choix plus tard dans tes préférences.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: saving || !selected,
              }}
              disabled={saving || !selected}
              onPress={handleFinish}
              style={({pressed}) => [
                styles.buttonPressable,
                pressed && selected && styles.buttonPressed,
              ]}>

              <LinearGradient
                colors={
                  selected
                    ? [theme.colors.primary, theme.colors.primary]
                    : [withAlpha(theme.colors.primary, 0.45), withAlpha(theme.colors.primary, 0.45)]
                }
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[
                  styles.nextButton,
                  !selected && styles.nextButtonDisabled,
                ]}>

                <Text style={styles.nextText}>
                  {saving
                    ? 'Enregistrement…'
                    : 'Commencer mon suivi'}
                </Text>

                {!saving && (
                  <View style={styles.arrowCircle}>
                    <MaterialDesignIcons
                      color={onPrimaryTextColor(theme)}
                      name="arrow-right"
                      size={19}
                    />
                  </View>
                )}

              </LinearGradient>

            </Pressable>

          </View>

        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    safeArea: {
      flex: 1,
    },

    pageBackgroundDecor: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    pageGlowTop: {
      position: 'absolute',
      top: -170,
      right: -105,
      width: 360,
      height: 360,
      borderRadius: 180,
      backgroundColor: withAlpha(theme.colors.primary, 0.09),
    },

    pageGlowLeft: {
      position: 'absolute',
      top: '36%',
      left: -155,
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -190,
      right: -110,
      width: 350,
      height: 350,
      borderRadius: 175,
      backgroundColor: withAlpha(theme.colors.primary, 0.075),
    },

    smallDecorCircleOne: {
      position: 'absolute',
      top: 110,
      left: 28,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: withAlpha(theme.colors.primary, 0.18),
    },

    smallDecorCircleTwo: {
      position: 'absolute',
      top: 182,
      right: 40,
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: withAlpha(theme.colors.primary, 0.17),
    },

    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },

    mainContent: {
      flexGrow: 1,
    },

    heroSection: {
      alignItems: 'center',
      paddingTop: 8,
      paddingHorizontal: 6,
    },

    heroIconOuter: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },

    heroIconInner: {
      width: 68,
      height: 68,
      borderRadius: 24,

      alignItems: 'center',
      justifyContent: 'center',

      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),

      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 9,
      },
      shadowOpacity: 0.17,
      shadowRadius: 16,
      elevation: 7,
    },

    heroIconGlow: {
      position: 'absolute',
      width: 70,
      height: 35,
      borderRadius: 40,
      bottom: -13,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
      transform: [{scaleX: 1.3}],
      zIndex: -1,
    },

    eyebrow: {
      color: theme.colors.primary,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 1.6,
      marginBottom: 9,
    },

    title: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 35,
      textAlign: 'center',
      letterSpacing: -0.3,
    },

    subtitle: {
      marginTop: 12,
      maxWidth: 340,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },

    optionsWrapper: {
      flexGrow: 1,
      justifyContent: 'center',
      marginTop: 28,
      paddingVertical: spacing.sm,
    },

    optionsIntroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingHorizontal: 2,
    },

    optionsTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },

    optionsLine: {
      flex: 1,
      height: 1,
      marginLeft: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
    },

    optionsList: {
      gap: 12,
    },

    bottomSection: {
      marginTop: 26,
    },

    finalInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 11,
      paddingHorizontal: 10,
    },

    finalInfoIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    helperText: {
      flexShrink: 1,
      color: theme.colors.textMuted,
      fontSize: 11.5,
      lineHeight: 16,
    },

    buttonPressable: {
      borderRadius: 20,
    },

    buttonPressed: {
      transform: [{scale: 0.985}],
      opacity: 0.92,
    },

    nextButton: {
      minHeight: 58,
      borderRadius: 20,

      paddingHorizontal: 18,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity: 0.25,
      shadowRadius: 13,
      elevation: 7,
    },

    nextButtonDisabled: {
      shadowOpacity: 0,
      elevation: 0,
    },

    nextText: {
      color: onPrimaryTextColor(theme),
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.1,
    },

    arrowCircle: {
      position: 'absolute',
      right: 12,

      width: 36,
      height: 36,
      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: withAlpha(onPrimaryTextColor(theme), 0.16),

      borderWidth: 1,
      borderColor: withAlpha(onPrimaryTextColor(theme), 0.12),
    },
  });
}

export default MenopauseLabTrackingScreen;
