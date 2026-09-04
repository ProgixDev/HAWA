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
  setMenopauseTrackedSymptoms,
  type MenopauseSymptom,
} from '../state/menopausePreferences';

const PURPLE = '#7052C8';
const PURPLE_DARK = '#2A185F';
const PURPLE_SOFT = '#F3EEF9';
const TEXT_SECONDARY = '#746B88';
const TEXT_MUTED = '#948CA4';
const WHITE = '#FFFFFF';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MenopauseSymptoms'
>;

const OPTIONS: Array<{
  id: MenopauseSymptom;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {
    id: 'hot_flashes',
    title: 'Bouffées de chaleur',
    subtitle: 'Sensations de chaleur soudaines',
    icon: 'fire',
    tint: '#FBE9E7',
  },
  {
    id: 'night_sweats',
    title: 'Sueurs nocturnes',
    subtitle: 'Transpiration pendant le sommeil',
    icon: 'water-outline',
    tint: '#E8F1F6',
  },
  {
    id: 'sleep_disturbances',
    title: 'Troubles du sommeil',
    subtitle: 'Difficultés à s’endormir ou à rester endormie',
    icon: 'weather-night',
    tint: '#EEE8F6',
  },
  {
    id: 'fatigue',
    title: 'Fatigue',
    subtitle: 'Une énergie plus difficile à retrouver',
    icon: 'sleep',
    tint: '#F4EEE3',
  },
  {
    id: 'mood_changes',
    title: 'Variations d’humeur',
    subtitle: 'Des émotions plus changeantes',
    icon: 'heart-outline',
    tint: '#F4EAF7',
  },
  {
    id: 'brain_fog',
    title: 'Brouillard mental',
    subtitle: 'Concentration ou mémoire moins nettes',
    icon: 'weather-fog',
    tint: '#E9EEF5',
  },
];

function MenopauseSymptomsScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  const reduceMotion = useRef(false);
  const hasHydratedRef = useRef(false);

  const [selected, setSelected] = useState<MenopauseSymptom[]>(
    () => getMenopausePreferences().trackedSymptoms,
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    hydrateMenopausePreferences().then(value => {
      if (active && !hasHydratedRef.current) {
        hasHydratedRef.current = true;

        setSelected(current =>
          current.length > 0
            ? current
            : value.trackedSymptoms,
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
      duration: reduceMotion.current ? 0 : 520,
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

  const toggle = (id: MenopauseSymptom) => {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  };

  const handleNext = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await setMenopauseTrackedSymptoms(selected);
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MenopauseHormonalTreatment');
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
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const floatingIconStyle = {
    transform: [
      {
        translateY: floatAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={['#FCFAFE', '#F7F3FB', '#F1EBF7', '#ECE5F4']}
      locations={[0, 0.34, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View
        pointerEvents="none"
        style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowLeft} />
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
              paddingTop: getTopPadding(insets.top),
              paddingBottom:
                Math.max(insets.bottom, 16) + spacing.sm,
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
                  colors={['#FFFFFF', '#F1EBFA']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.heroIconInner}>

                  <MaterialDesignIcons
                    color={PURPLE}
                    name="heart-pulse"
                    size={22}
                  />

                </LinearGradient>
              </Animated.View>

              <Text style={styles.eyebrow}>
                SUIVI PERSONNEL
              </Text>

              <Text style={styles.title}>
                Quels symptômes veux-tu suivre ?
              </Text>

              <Text style={styles.subtitle}>
                Choisis ceux qui te concernent aujourd’hui.
                Tu peux en sélectionner plusieurs.
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>

                <View style={styles.summaryIcon}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="check-circle-outline"
                    size={14}
                  />
                </View>

                <View style={styles.summaryTextWrapper}>
                  <Text style={styles.summaryTitle}>
                    Symptômes sélectionnés
                  </Text>

                  <Text style={styles.summarySubtitle}>
                    {selected.length === 0
                      ? 'Aucun pour le moment'
                      : `${selected.length} sélectionné${
                          selected.length > 1 ? 's' : ''
                        }`}
                  </Text>
                </View>

              </View>

              <View
                style={[
                  styles.counterBadge,
                  selected.length === 0 &&
                    styles.counterBadgeEmpty,
                ]}>

                <Text
                  style={[
                    styles.counterText,
                    selected.length === 0 &&
                      styles.counterTextEmpty,
                  ]}>
                  {selected.length}
                </Text>

              </View>
            </View>

            <View style={styles.optionsWrapper}>

              <View style={styles.optionsHeader}>
                <Text style={styles.optionsTitle}>
                  Mes symptômes
                </Text>

                {selected.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelected([])}
                    style={({pressed}) => [
                      styles.clearButton,
                      pressed && styles.clearButtonPressed,
                    ]}>
                    <Text style={styles.clearText}>
                      Effacer
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <PremiumChoiceCard
                    icon={option.icon}
                    iconTint={option.tint}
                    key={option.id}
                    onPress={() => toggle(option.id)}
                    selected={selected.includes(option.id)}
                    selectionStyle="checkbox"
                    subtitle={option.subtitle}
                    title={option.title}
                  />
                ))}
              </View>

            </View>

          </Animated.View>

          <View style={styles.bottomSection}>

            <View style={styles.helperBox}>
              <MaterialDesignIcons
                color={PURPLE}
                name="information-outline"
                size={14}
              />

              <Text style={styles.helperText}>
                Tu pourras modifier tes choix plus tard.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: saving,
              }}
              disabled={saving}
              onPress={handleNext}
              style={({pressed}) => [
                styles.buttonPressable,
                pressed && styles.buttonPressed,
              ]}>

              <LinearGradient
                colors={
                  saving
                    ? ['#BFB3D3', '#A99BC0']
                    : ['#8061D7', '#6847B8']
                }
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.nextButton}>

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
                      size={16}
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
    top: -190,
    right: -125,
    width: 370,
    height: 370,
    borderRadius: 185,
    backgroundColor: 'rgba(112,82,200,0.065)',
  },

  pageGlowLeft: {
    position: 'absolute',
    top: '38%',
    left: -165,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(180,151,220,0.05)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -200,
    right: -120,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(102,74,164,0.045)',
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
    paddingTop: 2,
    paddingHorizontal: 8,
  },

  heroIconOuter: {
    marginBottom: 10,
  },

  heroIconInner: {
    width: 50,
    height: 50,
    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(112,82,200,0.09)',

    shadowColor: '#6A48B8',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.10,
    shadowRadius: 9,
    elevation: 3,
  },

  eyebrow: {
    marginBottom: 5,
    color: PURPLE,
    fontSize: 7.8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  title: {
    maxWidth: 310,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.15,
    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 300,
    marginTop: 7,
    color: TEXT_SECONDARY,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },

  summaryCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(112,82,200,0.07)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  summaryLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: PURPLE_SOFT,
  },

  summaryTextWrapper: {
    flex: 1,
    minWidth: 0,
  },

  summaryTitle: {
    color: PURPLE_DARK,
    fontSize: 9.8,
    fontWeight: '700',
  },

  summarySubtitle: {
    marginTop: 2,
    color: TEXT_MUTED,
    fontSize: 7.8,
  },

  counterBadge: {
    minWidth: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: PURPLE,
  },

  counterBadgeEmpty: {
    backgroundColor: '#EFEAF3',
  },

  counterText: {
    color: WHITE,
    fontSize: 9.5,
    fontWeight: '800',
  },

  counterTextEmpty: {
    color: '#8D849A',
  },

  optionsWrapper: {
    marginTop: 16,
  },

  optionsHeader: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  optionsTitle: {
    flex: 1,
    minWidth: 0,
    color: PURPLE_DARK,
    fontSize: 10,
    fontWeight: '700',
  },

  clearButton: {
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#F1EBF7',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },

  clearButtonPressed: {
    opacity: 0.7,
  },

  clearText: {
    color: PURPLE,
    fontSize: 7.8,
    fontWeight: '700',
  },

  optionsList: {
    gap: 8,
    paddingBottom: spacing.xs,
  },

  bottomSection: {
    marginTop: 16,
  },

  helperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(112,82,200,0.045)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  helperText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 5,
    color: '#81768E',
    fontSize: 8.8,
    lineHeight: 12,
  },

  buttonPressable: {
    borderRadius: 17,
  },

  buttonPressed: {
    opacity: 0.92,
    transform: [{scale: 0.985}],
  },

  nextButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 17,
    paddingHorizontal: 14,

    shadowColor: '#4C2C99',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },

  nextText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },

  arrowCircle: {
    position: 'absolute',
    right: 8,

    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

export default MenopauseSymptomsScreen;