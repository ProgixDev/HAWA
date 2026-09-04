import React, {useEffect, useRef, useState} from 'react';
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
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  setMenopauseHormonalTreatmentStatus,
  type MenopauseHormonalTreatmentStatus,
} from '../state/menopausePreferences';

const PURPLE = '#7052C8';
const PURPLE_DARK = '#2C176D';
const TEXT_SECONDARY = '#73688F';
const WHITE = '#FFFFFF';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MenopauseHormonalTreatment'
>;

const OPTIONS: Array<{
  id: MenopauseHormonalTreatmentStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {
    id: 'track',
    title: 'Oui, je souhaite le suivre dans AWA',
    subtitle: 'Tu pourras configurer les détails plus tard',
    icon: 'checkbox-marked-circle-outline',
    tint: '#E7F0E8',
  },
  {
    id: 'no',
    title: 'Non',
    subtitle: 'Je ne suis pas de traitement hormonal',
    icon: 'close-circle-outline',
    tint: '#EFE7F4',
  },
  {
    id: 'not_now',
    title: 'Pas pour le moment',
    subtitle: 'Je préfère en décider plus tard',
    icon: 'clock-outline',
    tint: '#F4EEE3',
  },
];

function MenopauseHormonalTreatmentScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const [selected, setSelected] =
    useState<MenopauseHormonalTreatmentStatus | null>(
      () => getMenopausePreferences().hormonalTreatmentStatus,
    );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateMenopausePreferences().then(value => {
      if (active) {
        setSelected(
          current => current ?? value.hormonalTreatmentStatus,
        );
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
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [floatAnimation]);

  const handleNext = async () => {
    if (saving || !selected) {
      return;
    }

    setSaving(true);

    try {
      await setMenopauseHormonalTreatmentStatus(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MenopauseLabTracking');
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
          outputRange: ['0deg', '3deg'],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={[
        '#FCFAFE',
        '#F7F2FC',
        '#F1EAF9',
        '#ECE4F6',
      ]}
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
          barStyle="dark-content"
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
                    '#FFFFFF',
                    '#F2EBFC',
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.heroIconInner}>

                  <MaterialDesignIcons
                    color={PURPLE}
                    name="pill"
                    size={30}
                  />

                </LinearGradient>

                <View style={styles.heroIconGlow} />
              </Animated.View>

              <Text style={styles.eyebrow}>
                TON SUIVI PERSONNALISÉ
              </Text>

              <Text style={styles.title}>
                Suis-tu un
                {'\n'}
                traitement hormonal ?
              </Text>

              <Text style={styles.subtitle}>
                Si tu le souhaites, AWA pourra intégrer ce suivi
                dans ton expérience et l’adapter à tes besoins.
              </Text>

            </View>

            <View style={styles.optionsWrapper}>

              <View style={styles.optionsIntroRow}>
                <Text style={styles.optionsTitle}>
                  Mon choix
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

            <Text style={styles.helperText}>
              Tu pourras modifier ce choix plus tard.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: saving || !selected,
              }}
              disabled={saving || !selected}
              onPress={handleNext}
              style={({pressed}) => [
                styles.buttonPressable,
                pressed && selected && styles.buttonPressed,
              ]}>

              <LinearGradient
                colors={
                  selected
                    ? ['#8264DA', '#6746BD']
                    : ['#C5B9D8', '#B5A6CA']
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
                    : 'Continuer'}
                </Text>

                {!saving && (
                  <View style={styles.arrowCircle}>
                    <MaterialDesignIcons
                      color={WHITE}
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F4EEF9',
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
    backgroundColor: 'rgba(119, 83, 189, 0.09)',
  },

  pageGlowLeft: {
    position: 'absolute',
    top: '35%',
    left: -155,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(189, 160, 225, 0.10)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -190,
    right: -110,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(100, 70, 160, 0.075)',
  },

  smallDecorCircleOne: {
    position: 'absolute',
    top: 108,
    left: 28,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(112,82,200,0.18)',
  },

  smallDecorCircleTwo: {
    position: 'absolute',
    top: 180,
    right: 40,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(112,82,200,0.17)',
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
    borderColor: 'rgba(112,82,200,0.10)',

    shadowColor: '#6A48B8',
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
    backgroundColor: 'rgba(111,79,185,0.10)',
    transform: [{scaleX: 1.3}],
    zIndex: -1,
  },

  eyebrow: {
    color: PURPLE,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 9,
  },

  title: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 35,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 12,
    maxWidth: 335,
    color: TEXT_SECONDARY,
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
    color: PURPLE_DARK,
    fontSize: 13,
    fontWeight: '700',
  },

  optionsLine: {
    flex: 1,
    height: 1,
    marginLeft: 12,
    backgroundColor: 'rgba(92,65,145,0.10)',
  },

  optionsList: {
    gap: 12,
  },

  bottomSection: {
    marginTop: 26,
  },

  helperText: {
    marginBottom: 10,
    color: '#8A809F',
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
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

    shadowColor: '#4C2C99',
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
    color: WHITE,
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

    backgroundColor: 'rgba(255,255,255,0.16)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});

export default MenopauseHormonalTreatmentScreen;