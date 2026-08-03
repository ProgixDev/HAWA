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
import {setSelectedSchool, type SchoolId} from '../state/onboardingPreferences';

const OBJECTIVE_BACKGROUND = require('../assets/images/objective-background.png');

const schools = [
  {id: 'hanafi', icon: '📖', label: 'Hanafi'},
  {id: 'maliki', icon: '⚖️', label: 'Maliki'},
  {id: 'chafii', icon: '🪶', label: 'Chafi’i'},
  {id: 'hanbali', icon: '📖', label: 'Hanbali'},
  {id: 'unknown', icon: '❔', label: 'Je ne sais pas encore'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolSelection'>;

function SchoolSelectionScreen({navigation}: Props): React.JSX.Element {
  const [selectedId, setSelectedId] = useState('hanafi');

  const handleNext = () => {
    setSelectedSchool(selectedId as SchoolId);
    navigation.navigate('Location');
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
            <Text style={styles.title}>{'Choisis ton\nécole juridique'}</Text>
            <Text style={styles.subtitle}>
              {'Nous utiliserons cette information\npour les calculs religieux.'}
            </Text>
          </View>

          <View accessibilityRole="radiogroup" style={styles.list}>
            {schools.map(school => {
              const selected = selectedId === school.id;

              return (
                <Pressable
                  key={school.id}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  onPress={() => setSelectedId(school.id)}
                  style={({pressed}) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.iconBox}>
                    <Text style={styles.icon}>{school.icon}</Text>
                  </View>
                  <Text style={styles.optionText}>{school.label}</Text>
                </Pressable>
              );
            })}
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
    paddingTop: 38,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {alignItems: 'center', marginBottom: spacing.xl},
  title: {
    color: '#083F31',
    fontFamily: 'serif',
    fontSize: 31,
    fontWeight: '600',
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#253031',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  list: {gap: 10},
  option: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DCC8',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 253, 248, 0.9)',
    paddingHorizontal: spacing.md,
  },
  optionSelected: {borderColor: '#176548', borderWidth: 1.5},
  pressed: {opacity: 0.8},
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C5AD80',
    borderRadius: 11,
  },
  radioSelected: {borderColor: '#D3A648'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#176548'},
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(246, 239, 227, 0.94)',
  },
  icon: {fontSize: 22},
  optionText: {flex: 1, color: '#172021', fontSize: 16, fontWeight: '500'},
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    borderRadius: 18,
    backgroundColor: '#176548',
    elevation: 3,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
});

export default SchoolSelectionScreen;
