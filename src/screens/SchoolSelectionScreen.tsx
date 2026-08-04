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
import {spacing} from '../theme/spacing';
import {setSelectedSchool, type SchoolId} from '../state/onboardingPreferences';

const SCHOOL_BACKGROUND = require('../assets/images/school-selection-background.png');

const schools = [
  {id: 'hanafi', icon: '📖', label: 'Hanafi'},
  {id: 'maliki', icon: '⚖️', label: 'Maliki'},
  {id: 'chafii', icon: '🪶', label: 'Chafi’i'},
  {id: 'hanbali', icon: '📖', label: 'Hanbali'},
  {id: 'unknown', icon: '❔', label: 'Je ne sais pas encore'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolSelection'>;

function SchoolSelectionScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState('hanafi');

  const handleNext = () => {
    setSelectedSchool(selectedId as SchoolId);
    navigation.navigate('Location');
  };

  return (
    <ImageBackground
      source={SCHOOL_BACKGROUND}
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
    paddingTop: 38,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {alignItems: 'center', marginBottom: spacing.xl},
  title: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#655A8D',
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
    borderColor: 'rgba(111, 83, 190, 0.16)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 252, 255, 0.84)',
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: '#6B4BC3',
    borderWidth: 1.5,
    backgroundColor: 'rgba(249, 244, 255, 0.96)',
    shadowColor: '#6B4BC3',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {opacity: 0.8},
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#AE9BCF',
    borderRadius: 11,
  },
  radioSelected: {borderColor: '#7654CE'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#7654CE'},
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(238, 227, 255, 0.78)',
  },
  icon: {fontSize: 22},
  optionText: {flex: 1, color: '#2A2050', fontSize: 16, fontWeight: '500'},
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    borderRadius: 18,
    backgroundColor: '#6949BE',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
});

export default SchoolSelectionScreen;
