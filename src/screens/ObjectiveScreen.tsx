import React, {useState} from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {setSelectedObjective, type ObjectiveId} from '../state/onboardingPreferences';

const OBJECTIVE_BACKGROUND = require('../assets/images/school-selection-background.png');

type Objective = {
  id: ObjectiveId;
  icon: string;
  label: string;
  tint: string;
};

const objectives: Objective[] = [
  {id: 'cycle', icon: '🗓️', label: 'Suivre mon cycle', tint: '#E7F0E8'},
  {id: 'conceive', icon: '💗', label: 'Essayer de concevoir', tint: '#FBE8E8'},
  {id: 'contraception', icon: '💊', label: 'Contraception', tint: '#F1E8F5'},
  {id: 'irregular', icon: '🪷', label: 'Cycles irréguliers (SOPK)', tint: '#FBE9E7'},
  {id: 'menopause', icon: '👤', label: 'Post-ménopause / Ménopause', tint: '#EFE7F4'},
  {id: 'pregnancy', icon: '🤰', label: 'Suivi de grossesse', tint: '#FBE9EB'},
  {id: 'postpartum', icon: '🍼', label: 'Post-partum', tint: '#E8F1E9'},
  {id: 'loss', icon: '☁️', label: 'Après une fausse couche', tint: '#EDF2E9'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'Objective'>;

function ObjectiveScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState('cycle');

  const handleNext = () => {
    setSelectedObjective(selectedId as ObjectiveId);
    if (selectedId === 'cycle') {
      navigation.navigate('CycleObjectiveConfirmation');
      return;
    }
    navigation.navigate('SpiritualPreferences');
  };

  return (
    <ImageBackground
      source={OBJECTIVE_BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />
        <ScrollView contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{'Quel est ton\nobjectif principal ?'}</Text>

          <View style={styles.list}>
            {objectives.map(objective => {
              const selected = objective.id === selectedId;

              return (
                <Pressable
                  key={objective.id}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  onPress={() => setSelectedId(objective.id)}
                  style={({pressed}) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={[styles.iconBox, {backgroundColor: objective.tint}]}>
                    <Text style={styles.icon}>{objective.icon}</Text>
                  </View>
                  <Text style={styles.optionLabel}>{objective.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}>
            <Text style={styles.nextButtonText}>Suivant</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.lg,
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  list: {gap: 7},
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.18)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.88)',
    paddingHorizontal: 12,
  },
  optionSelected: {borderColor: '#6848BC', backgroundColor: 'rgba(249,244,255,0.96)'},
  optionPressed: {opacity: 0.78},
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#AE9BCF',
    borderRadius: 10,
  },
  radioSelected: {borderColor: '#7654CE'},
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7654CE',
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderRadius: 12,
  },
  icon: {fontSize: 21},
  optionLabel: {
    flex: 1,
    color: '#2A2050',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 19,
  },
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
  nextButtonPressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ObjectiveScreen;
