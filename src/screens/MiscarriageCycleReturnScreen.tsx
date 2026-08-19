import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Alert,
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
import InlineCalendarPickerModal from '../components/onboarding/InlineCalendarPickerModal';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageCycleReturnStatus,
  type MiscarriageCycleReturnStatus,
} from '../state/miscarriagePreferences';
import {diffDays, startOfDay} from '../utils/cycleMath';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageCycleReturn'>;

const OPTIONS: Array<{
  id: MiscarriageCycleReturnStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {id: 'yes', title: 'Oui', subtitle: 'Mes règles sont revenues', icon: 'check-decagram-outline', tint: '#E7F0E8'},
  {id: 'no', title: 'Non', subtitle: 'Mes règles ne sont pas encore revenues', icon: 'calendar-clock-outline', tint: '#FBE9EB'},
  {id: 'unknown', title: 'Je ne sais pas encore', subtitle: 'Je ne suis pas sûre', icon: 'help-circle-outline', tint: '#F1E8F5'},
];

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

function MiscarriageCycleReturnScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const initial = useRef(getMiscarriagePreferences()).current;

  const [selected, setSelected] = useState<MiscarriageCycleReturnStatus | null>(initial.cycleReturnStatus);
  const [returnedDate, setReturnedDate] = useState<Date | null>(
    initial.firstReturnedPeriodDate ? startOfDay(new Date(`${initial.firstReturnedPeriodDate}T12:00:00`)) : null,
  );
  const [miscarriageDate, setMiscarriageDateValue] = useState<Date | null>(
    initial.miscarriageDate ? startOfDay(new Date(`${initial.miscarriageDate}T12:00:00`)) : null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {
      if (!active) {return;}
      setSelected(current => current ?? value.cycleReturnStatus);
      setReturnedDate(current =>
        current ?? (value.firstReturnedPeriodDate ? startOfDay(new Date(`${value.firstReturnedPeriodDate}T12:00:00`)) : null),
      );
      setMiscarriageDateValue(current =>
        current ?? (value.miscarriageDate ? startOfDay(new Date(`${value.miscarriageDate}T12:00:00`)) : null),
      );
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

  const chooseReturnedDate = (date: Date) => {
    const candidate = startOfDay(date);
    // A return-of-period date can never precede the miscarriage date
    // (spec section 13).
    if (miscarriageDate && diffDays(candidate, miscarriageDate) < 0) {
      Alert.alert(
        'Date invalide',
        'La date de tes premières règles revenues ne peut pas précéder la date de ta fausse couche.',
      );
      return;
    }
    setReturnedDate(candidate);
  };

  const handleNext = async () => {
    if (saving || !selected) {return;}
    setSaving(true);
    try {
      await setMiscarriageCycleReturnStatus(selected, selected === 'yes' ? returnedDate : null);
      navigation.navigate('MiscarriageTryingAgain');
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
            <View style={styles.header}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="Calendrier avec un cœur"
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-calendar.png')}
                style={styles.headerImage}
              />
              <Text style={styles.title}>Tes règles sont-elles{'\n'}revenues depuis ?</Text>
              <Text style={styles.subtitle}>Cela nous aide à suivre le retour de ton cycle en douceur.</Text>
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
                    title={option.title}>
                    {option.id === 'yes' ? (
                      <Pressable
                        accessibilityLabel="Date du premier jour de tes règles revenues"
                        accessibilityRole="button"
                        onPress={() => setPickerVisible(true)}
                        style={({pressed}) => [styles.dateField, pressed && styles.pressed]}>
                        <View style={styles.dateFieldIcon}>
                          <MaterialDesignIcons color={PURPLE} name="calendar-month-outline" size={18} />
                        </View>
                        <View style={styles.dateFieldCopy}>
                          <Text style={styles.dateFieldLabel}>
                            Date du premier jour de tes règles revenues{' '}
                            <Text style={styles.dateFieldOptional}>(Optionnel)</Text>
                          </Text>
                          <Text style={[styles.dateFieldValue, !returnedDate && styles.dateFieldPlaceholder]}>
                            {returnedDate ? formatFullDate(returnedDate) : 'JJ / MM / AAAA'}
                          </Text>
                        </View>
                        <MaterialDesignIcons color="#9C91B3" name="chevron-right" size={18} />
                      </Pressable>
                    ) : null}
                  </PremiumChoiceCard>
                ))}
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

      <InlineCalendarPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={chooseReturnedDate}
        subtitle="Indique le premier jour de tes règles revenues depuis ta fausse couche."
        title="Retour de tes règles"
        value={returnedDate ?? miscarriageDate ?? new Date()}
        visible={pickerVisible}
      />
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
  header: {alignItems: 'center', paddingTop: 5, marginBottom: spacing.md},
  headerImage: {width: 210, height: 135, marginBottom: 2},
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
  dateField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.18)',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  dateFieldIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#F1EAFB',
  },
  dateFieldCopy: {flex: 1, minWidth: 0, marginHorizontal: 9},
  dateFieldLabel: {color: TEXT_SECONDARY, fontSize: 9.5, lineHeight: 13},
  dateFieldOptional: {fontStyle: 'italic'},
  dateFieldValue: {marginTop: 2, color: PURPLE_DARK, fontSize: 12.5, fontWeight: '700'},
  dateFieldPlaceholder: {color: '#A79CBE', fontWeight: '500'},
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

export default MiscarriageCycleReturnScreen;
