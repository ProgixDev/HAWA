import React, {useState} from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, TOP_SPACING_EXTRA} from '../theme/spacing';
import {setSpiritualMarkersEnabled} from '../state/onboardingPreferences';

const SPIRITUAL_BACKGROUND = require('../assets/images/school-selection-background.png');

const features = [
  {icon: '🗓️', label: 'Calendrier hijri'},
  {icon: '🤲', label: 'Prières & statut de pureté'},
  {icon: '🌙', label: 'Jeûne (Ramadan, rattrapages)'},
  {icon: '🔔', label: 'Rappels de la prière'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'SpiritualPreferences'>;

function SpiritualPreferencesScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(true);

  const handleNext = () => {
    setSpiritualMarkersEnabled(enabled);
    if (enabled) {
      navigation.navigate('SchoolSelection');
      return;
    }

    navigation.navigate('CycleInformation');
  };

  return (
    <ImageBackground
      source={SPIRITUAL_BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />
        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16)}]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {'Souhaites-tu activer\nles repères spirituels ?'}
            </Text>
            <Text style={styles.subtitle}>
              {'Calendrier hijri, prières, jeûne, état de pureté…\nTu pourras modifier ce choix à tout moment.'}
            </Text>
          </View>

          <View style={styles.choices} accessibilityRole="radiogroup">
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{checked: enabled}}
              onPress={() => setEnabled(true)}
              style={({pressed}) => [
                styles.choice,
                enabled && styles.choiceActive,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.radio, enabled && styles.radioActive]}>
                {enabled && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.choiceText, enabled && styles.choiceTextActive]}>
                Oui, activer
              </Text>
              {enabled && (
                <View style={styles.checkCircle}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{checked: !enabled}}
              onPress={() => setEnabled(false)}
              style={({pressed}) => [
                styles.choice,
                !enabled && styles.choiceActive,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.radio, !enabled && styles.radioActive]}>
                {!enabled && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.choiceText, !enabled && styles.choiceTextActive]}>
                Non, pas maintenant
              </Text>
              {!enabled && (
                <View style={styles.checkCircle}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.features}>
            {features.map(feature => (
              <View
                key={feature.label}
                accessibilityState={{disabled: !enabled}}
                style={[
                  styles.featureCard,
                  !enabled && styles.featureCardDisabled,
                ]}>
                <View
                  style={[
                    styles.iconBox,
                    !enabled && styles.iconBoxDisabled,
                  ]}>
                  <Text style={[styles.icon, !enabled && styles.iconDisabled]}>
                    {feature.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.featureText,
                    !enabled && styles.featureTextDisabled,
                  ]}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextText}>Suivant</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
  },
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    color: '#655A8D',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  choices: {gap: 8},
  choice: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111, 83, 190, 0.16)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 252, 255, 0.86)',
    paddingHorizontal: spacing.md,
  },
  choiceActive: {
    borderColor: '#6848BC',
    backgroundColor: '#6848BC',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 3,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#AE9BCF',
    borderRadius: 11,
  },
  radioActive: {borderColor: '#E7DAFF'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF'},
  choiceText: {flex: 1, marginLeft: spacing.md, color: '#2A2050', fontSize: 17},
  choiceTextActive: {color: '#FFFFFF', fontWeight: '600'},
  checkCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F4ECFF',
  },
  check: {color: '#6848BC', fontSize: 18, fontWeight: '700'},
  pressed: {opacity: 0.82},
  features: {gap: 7, marginTop: spacing.md},
  featureCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111, 83, 190, 0.14)',
    borderRadius: 17,
    backgroundColor: 'rgba(255, 252, 255, 0.84)',
    paddingHorizontal: 12,
  },
  featureCardDisabled: {
    borderColor: 'rgba(155, 142, 179, 0.20)',
    backgroundColor: 'rgba(236, 231, 243, 0.80)',
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(238, 227, 255, 0.82)',
  },
  iconBoxDisabled: {backgroundColor: '#DDD6E8'},
  icon: {fontSize: 21},
  iconDisabled: {opacity: 0.32},
  featureText: {flex: 1, color: '#2A2050', fontSize: 15, lineHeight: 19},
  featureTextDisabled: {color: '#9990A8'},
  nextButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderRadius: 19,
    backgroundColor: '#6949BE',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
});

export default SpiritualPreferencesScreen;
