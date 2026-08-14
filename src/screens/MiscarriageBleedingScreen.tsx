import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageBackground,
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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageBleedingStatus,
  type MiscarriageBleedingStatus,
} from '../state/miscarriagePreferences';

const BACKGROUND = require('../assets/images/school-selection-background.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageBleeding'>;

const OPTIONS: Array<{
  id: MiscarriageBleedingStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {id: 'yes', title: 'Oui', subtitle: 'J’ai encore des saignements', icon: 'water', tint: '#FBE8E8'},
  {id: 'no', title: 'Non', subtitle: 'Je n’ai plus de saignements', icon: 'leaf', tint: '#E7F0E8'},
  {id: 'variable', title: 'Je ne sais pas / cela varie', subtitle: 'C’est irrégulier', icon: 'help-circle-outline', tint: '#F1E8F5'},
];

function MiscarriageBleedingScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  // Restores a previously saved answer so going back and forward keeps the
  // selection visible (spec section 34).
  const [selected, setSelected] = useState<MiscarriageBleedingStatus | null>(
    () => getMiscarriagePreferences().bleedingStatus,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {
      if (active) {setSelected(current => current ?? value.bleedingStatus);}
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

  const handleNext = async () => {
    if (saving || !selected) {return;}
    setSaving(true);
    try {
      await setMiscarriageBleedingStatus(selected);
      navigation.navigate('MiscarriageCycleReturn');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm},
          ]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainContent, entranceStyle]}>
            <View style={styles.header}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="Goutte symbolisant les saignements"
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-bleeding.png')}
                style={styles.headerImage}
              />
              <Text style={styles.title}>As-tu encore{'\n'}des saignements ?</Text>
              <Text style={styles.subtitle}>Cela nous aide à mieux t’accompagner dans cette période.</Text>
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

              <View style={styles.infoRow}>
                <MaterialDesignIcons color={PURPLE} name="notebook-outline" size={17} />
                <Text style={styles.infoText}>
                  Tu pourras noter les détails (intensité, couleur, durée…) dans ton journal quotidien.
                </Text>
              </View>
            </View>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={saving || !selected}
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              !selected && styles.nextButtonDisabled,
              (pressed || saving) && selected && styles.pressed,
            ]}>
            <Text style={styles.nextText}>{saving ? 'Enregistrement…' : 'Suivant'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  mainContent: {flex: 1},
  header: {alignItems: 'center', paddingTop: 8, marginBottom: spacing.md},
  headerImage: {width: 142, height: 126, marginBottom: 4},
  title: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 310,
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  optionsCenterContainer: {flex: 1, justifyContent: 'center', paddingVertical: spacing.md},
  optionsList: {gap: 12},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: spacing.lg,
    paddingHorizontal: 4,
  },
  infoText: {flex: 1, color: TEXT_SECONDARY, fontSize: 12, lineHeight: 17},
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

export default MiscarriageBleedingScreen;
