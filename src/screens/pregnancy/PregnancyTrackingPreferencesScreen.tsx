import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {
  getPregnancyTrackingPreferences,
  setPregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../../state/pregnancyPreferences';

const BACKGROUND = require('../../assets/images/school-selection-background.png');
const PURPLE = '#6949BE';

type Props = NativeStackScreenProps<RootStackParamList, 'PregnancyTrackingPreferences'>;

type OptionConfig = {
  id: PregnancyTrackingPreference;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
};

// Same categories/icons as the existing Pregnancy Journal
// (src/components/pregnancy/PregnancyJournalSheet.tsx) for visual and
// conceptual consistency.
const OPTIONS: OptionConfig[] = [
  {id: 'symptoms', icon: 'heart-pulse', label: 'Symptômes'},
  {id: 'mood', icon: 'emoticon-happy-outline', label: 'Humeur'},
  {id: 'weight', icon: 'scale-bathroom', label: 'Poids'},
  {id: 'sleep', icon: 'weather-night', label: 'Sommeil'},
  {id: 'hydration', icon: 'cup-water', label: 'Hydratation'},
  {id: 'activity', icon: 'walk', label: 'Activité physique'},
  {id: 'notes', icon: 'notebook-edit-outline', label: 'Notes personnelles'},
  {id: 'medicalInfo', icon: 'shield-lock-outline', label: 'Informations médicales personnelles'},
  {id: 'appointments', icon: 'calendar-clock-outline', label: 'Rendez-vous et examens'},
];

function TrackingRow({
  option,
  selected,
  delay,
  onToggle,
}: {
  option: OptionConfig;
  selected: boolean;
  delay: number;
  onToggle: () => void;
}): React.JSX.Element {
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    Animated.timing(entranceAnim, {toValue: 1, duration: 340, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start();
    // Only run the entrance animation once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(checkScale, {toValue: 0.88, duration: 80, useNativeDriver: true}),
      Animated.timing(checkScale, {toValue: 1, duration: 130, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
    ]).start();
  }, [selected, checkScale]);

  const entranceStyle = {
    opacity: entranceAnim,
    transform: [{translateY: entranceAnim.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        accessibilityLabel={option.label}
        accessibilityRole="checkbox"
        accessibilityState={{checked: selected}}
        onPress={onToggle}
        style={({pressed}) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
        <Animated.View style={[styles.checkbox, selected && styles.checkboxSelected, {transform: [{scale: checkScale}]}]}>
          {selected ? <MaterialDesignIcons color="#FFFFFF" name="check" size={14} /> : null}
        </Animated.View>
        <View style={styles.iconBox}>
          <MaterialDesignIcons color={PURPLE} name={option.icon} size={19} />
        </View>
        <Text style={styles.rowLabel}>{option.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function PregnancyTrackingPreferencesScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<PregnancyTrackingPreference>>(() => getPregnancyTrackingPreferences());

  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(headerAnim, {toValue: 1, duration: 420, easing, useNativeDriver: true}),
      Animated.timing(buttonAnim, {toValue: 1, duration: 400, delay: 420, easing, useNativeDriver: true}),
    ]).start();
  }, [headerAnim, buttonAnim]);

  const toggleOption = (id: PregnancyTrackingPreference) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canContinue = selected.size > 0;

  const handleNext = async () => {
    if (!canContinue) {return;}
    await setPregnancyTrackingPreferences(selected);
    navigation.navigate('PregnancyReminders');
  };

  const headerStyle = {
    opacity: headerAnim,
    transform: [{translateY: headerAnim.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };
  const buttonStyle = {
    opacity: buttonAnim,
    transform: [{translateY: buttonAnim.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
  };

  return (
    <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
        <ScrollView
          contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]}
          showsVerticalScrollIndicator={false}>
          <Pressable accessibilityLabel="Retour" hitSlop={12} onPress={navigation.goBack} style={styles.backButton}>
            <MaterialDesignIcons color={PURPLE} name="arrow-left" size={25} />
          </Pressable>

          <Animated.View style={headerStyle}>
            <View style={styles.header}>
              <Text style={styles.title}>{'Que souhaitez-vous\nsuivre pendant votre\ngrossesse ?'}</Text>
              <Text style={styles.subtitle}>{'Sélectionnez les éléments que vous\nsouhaitez suivre au quotidien.'}</Text>
            </View>
          </Animated.View>

          <View style={styles.list}>
            {OPTIONS.map((option, index) => (
              <TrackingRow
                delay={40 * index}
                key={option.id}
                onToggle={() => toggleOption(option.id)}
                option={option}
                selected={selected.has(option.id)}
              />
            ))}
          </View>

          <Animated.View style={buttonStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled: !canContinue}}
              disabled={!canContinue}
              onPress={handleNext}
              style={({pressed}) => [styles.nextButton, !canContinue && styles.nextButtonDisabled, pressed && styles.pressed]}>
              <Text style={styles.nextText}>Suivant</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
  backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.88)', elevation: 3, marginBottom: 6},
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 25, fontWeight: '700', lineHeight: 31, textAlign: 'center'},
  subtitle: {maxWidth: 300, marginTop: 8, color: '#655A8D', fontSize: 13.5, lineHeight: 19, textAlign: 'center'},
  list: {gap: 9},
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,252,255,0.90)',
    paddingHorizontal: 12,
  },
  rowSelected: {borderColor: '#6848BC', backgroundColor: 'rgba(249,244,255,0.97)'},
  pressed: {opacity: 0.82},
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C6B8E0',
    borderRadius: 7,
    backgroundColor: 'transparent',
  },
  checkboxSelected: {borderColor: PURPLE, backgroundColor: PURPLE},
  iconBox: {
    width: 34,
    height: 34,
    marginHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F0E8FC',
  },
  rowLabel: {flex: 1, minWidth: 0, color: '#2A2050', fontSize: 14, fontWeight: '600', lineHeight: 18},
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderRadius: 18,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextButtonDisabled: {backgroundColor: '#B7A9CF', elevation: 0, shadowOpacity: 0},
  nextText: {color: '#FFFFFF', fontSize: 17, fontWeight: '600'},
});

export default PregnancyTrackingPreferencesScreen;
