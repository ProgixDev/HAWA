import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
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
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageTryingAgainStatus,
  type MiscarriageTryingAgainStatus,
} from '../state/miscarriagePreferences';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageTryingAgain'>;

const OPTIONS: Array<{
  id: MiscarriageTryingAgainStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {id: 'not_now', title: 'Pas maintenant', subtitle: 'Je préfère prendre du temps pour moi', icon: 'clock-outline', tint: '#EFE7F4'},
  {id: 'soon', title: 'Bientôt', subtitle: 'Je commence à y penser sérieusement', icon: 'sprout-outline', tint: '#E7F0E8'},
  {id: 'ready', title: 'Oui, je me sens prête', subtitle: 'Je souhaite reprendre les essais', icon: 'heart-outline', tint: '#FBE8E8'},
];

function MiscarriageTryingAgainScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const [selected, setSelected] = useState<MiscarriageTryingAgainStatus | null>(
    () => getMiscarriagePreferences().tryingAgainStatus,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {
      if (active) {setSelected(current => current ?? value.tryingAgainStatus);}
    });
    return () => {active = false;};
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const handleFinish = async () => {
    if (saving || !selected) {return;}
    setSaving(true);
    try {
      // Personalizes the miscarriage support experience only — activeObjective
      // stays 'loss' (never auto-switched to 'conceive'), per spec section 19.
      await setMiscarriageTryingAgainStatus(selected);
      navigation.navigate('SecuritySetup');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
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
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm},
          ]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainContent, entranceStyle]}>
            <View style={styles.illustration}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="Femme dans une posture sereine"
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-trying-again-woman.png')}
                style={styles.illustrationImage}
              />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Souhaites-tu reprendre{'\n'}les essais de conception ?</Text>
              <Text style={styles.subtitle}>
                Ce choix nous aide à personnaliser ton accompagnement. Tu restes libre d’avancer à ton rythme.
              </Text>
            </View>

            <View style={styles.optionsCenterContainer}>
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

              <View style={styles.reassuranceCard}>
                <MaterialDesignIcons color={PURPLE} name="flower-outline" size={17} />
                <Text style={styles.reassuranceText}>
                  Tu n’es pas seule 💜 Nous sommes là pour t’accompagner à chaque étape.
                </Text>
              </View>
            </View>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={saving || !selected}
            onPress={handleFinish}
            style={({pressed}) => [
              styles.nextButton,
              !selected && styles.nextButtonDisabled,
              (pressed || saving) && selected && styles.pressed,
            ]}>
            <Text style={styles.nextText}>{saving ? 'Enregistrement…' : 'Terminer'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},

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

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  mainContent: {flex: 1},
  illustration: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  illustrationImage: {width: 190, height: 150},
  illustrationGlow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(105,73,190,0.08)',
  },
  illustrationCircle: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: '#F1EAFB',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
  },
  header: {alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md},
  title: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 320,
    color: TEXT_SECONDARY,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  optionsCenterContainer: {flex: 1, justifyContent: 'center', paddingVertical: spacing.sm},
  optionsList: {gap: 11},
  reassuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(241,234,251,0.75)',
  },
  reassuranceText: {flex: 1, color: TEXT_SECONDARY, fontSize: 11.5, lineHeight: 16},
  nextButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderRadius: 18,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextButtonDisabled: {backgroundColor: '#B7A9CF', shadowOpacity: 0, elevation: 0},
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default MiscarriageTryingAgainScreen;
