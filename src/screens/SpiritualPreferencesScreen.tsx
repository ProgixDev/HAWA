import React, {useState} from 'react';
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {setSpiritualMarkersEnabled} from '../state/onboardingPreferences';

const OBJECTIVE_BACKGROUND = require('../assets/images/objective-background.png');

const features = [
  {icon: '🗓️', label: 'Calendrier hijri'},
  {icon: '🤲', label: 'Prières & statut de pureté'},
  {icon: '🌙', label: 'Jeûne (Ramadan, rattrapages)'},
  {icon: '🔔', label: 'Rappels de la prière'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'SpiritualPreferences'>;

function SpiritualPreferencesScreen({navigation}: Props): React.JSX.Element {
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
      source={OBJECTIVE_BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />
        <View style={styles.content}>
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
              <View key={feature.label} style={styles.featureCard}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureText}>{feature.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextText}>Suivant</Text>
          </Pressable>

        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: colors.cream},
  safeArea: {flex: 1},
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 36,
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
  },
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {
    color: '#07543D',
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    color: '#172224',
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
    borderColor: '#E8D8BE',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 253, 248, 0.9)',
    paddingHorizontal: spacing.md,
  },
  choiceActive: {borderColor: '#176548', backgroundColor: '#176548'},
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BDA477',
    borderRadius: 11,
  },
  radioActive: {borderColor: '#F0C668'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF'},
  choiceText: {flex: 1, marginLeft: spacing.md, color: '#172022', fontSize: 17},
  choiceTextActive: {color: '#FFFFFF', fontWeight: '600'},
  checkCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.cream,
  },
  check: {color: '#176548', fontSize: 18, fontWeight: '700'},
  pressed: {opacity: 0.82},
  features: {gap: 7, marginTop: spacing.md},
  featureCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9DCC7',
    borderRadius: 17,
    backgroundColor: 'rgba(255, 253, 248, 0.88)',
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 240, 228, 0.9)',
  },
  icon: {fontSize: 21},
  featureText: {flex: 1, color: '#151C1E', fontSize: 15, lineHeight: 19},
  nextButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderRadius: 19,
    backgroundColor: '#176548',
    elevation: 3,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
});

export default SpiritualPreferencesScreen;
