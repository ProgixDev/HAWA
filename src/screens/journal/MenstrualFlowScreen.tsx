import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';
import type {FlowIntensity} from '../../types/journal';
import {cycleDayFor} from '../../utils/cycleMath';

const PURPLE = '#6D4AE8';
const PURPLE_DARK = '#2F2258';
const TEXT_MUTED = '#746D92';
const BACKGROUND = '#FCFAFF';
const LAVENDER = '#F7F3FF';

type IntensityOption = {
  label: string;
  value: FlowIntensity;
  color: string;
  icon: 'water-outline' | 'water';
};

type ChoiceOption = {label: string; value: string; icon?: string};

const INTENSITIES: IntensityOption[] = [
  {label: 'Spotting', value: 'none', color: '#C9B5F5', icon: 'water-outline'},
  {label: 'Léger', value: 'light', color: '#A987EB', icon: 'water-outline'},
  {label: 'Moyen', value: 'moderate', color: PURPLE, icon: 'water'},
  {label: 'Abondant', value: 'heavy', color: '#C44758', icon: 'water'},
  {label: 'Très\nabondant', value: 'veryHeavy', color: '#A92135', icon: 'water'},
];

const FLOW_COLORS = ['#FF9CBC', '#F26679', '#D92D42', '#9E4B5E', '#71322F', '#4C2428'];

const CLOTS: ChoiceOption[] = [
  {label: 'Aucun', value: 'none', icon: 'water'},
  {label: 'Petits', value: 'small', icon: 'circle-multiple-outline'},
  {label: 'Moyens', value: 'medium', icon: 'dots-circle'},
  {label: 'Gros', value: 'large', icon: 'circle-outline'},
];

const PROTECTIONS: ChoiceOption[] = [
  {label: 'Serviette', value: 'pad', icon: 'paper-roll-outline'},
  {label: 'Tampon', value: 'tampon', icon: 'microphone-outline'},
  {label: 'Cup', value: 'cup', icon: 'cup-outline'},
  {label: 'Culotte', value: 'underwear', icon: 'lingerie'},
];

type SelectableProps = {
  children: React.ReactNode;
  onPress: () => void;
  selected: boolean;
  style?: object;
  accessibilityLabel: string;
};

function Selectable({
  accessibilityLabel,
  children,
  onPress,
  selected,
  style,
}: SelectableProps): React.JSX.Element {
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, {damping: 16, stiffness: 190});
    if (selected) {
      scale.value = withSequence(
        withSpring(1.055, {damping: 10, stiffness: 240}),
        withSpring(1, {damping: 15, stiffness: 190}),
      );
    }
  }, [progress, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#FFFFFF', '#F0E9FF']),
    borderColor: interpolateColor(progress.value, [0, 1], ['#E9E2F3', PURPLE]),
    shadowOpacity: progress.value * 0.15,
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View style={[styles.selectable, style, animatedStyle]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="radio"
        accessibilityState={{checked: selected}}
        onPress={onPress}
        onPressIn={() => {scale.value = withTiming(0.97, {duration: 70});}}
        onPressOut={() => {scale.value = withSpring(1, {damping: 15});}}
        style={styles.selectablePressable}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function MenstrualFlowScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const selectedDate = useMemo(() => new Date(), []);
  const cycleDay = useMemo(
    () => cycleDayFor(selectedDate, getCyclePreferences()),
    [selectedDate],
  );

  const [selectedIntensity, setSelectedIntensity] = useState<FlowIntensity>('moderate');
  const [selectedColor, setSelectedColor] = useState(FLOW_COLORS[2]);
  const [selectedClotSize, setSelectedClotSize] = useState('none');
  const [selectedProtections, setSelectedProtections] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveScale = useSharedValue(1);
  const focusProgress = useSharedValue(0);
  const heroDropScale = useSharedValue(0.82);

  useEffect(() => {
    heroDropScale.value = withDelay(220, withSpring(1, {damping: 13, stiffness: 130}));
  }, [heroDropScale]);

  useEffect(() => {
    focusProgress.value = withTiming(inputFocused ? 1 : 0, {duration: 180});
  }, [focusProgress, inputFocused]);

  useEffect(() => {
    let mounted = true;
    getJournalEntry(selectedDate.toLocaleDateString('en-CA')).then(entry => {
      if (!mounted || !entry?.flow) {return;}
      setSelectedIntensity(entry.flow.intensity);
      if (entry.flow.color) {setSelectedColor(entry.flow.color);}
      if (entry.flow.clots) {setSelectedClotSize(entry.flow.clots);}
      if (entry.flow.protections) {setSelectedProtections(entry.flow.protections);}
      if (entry.flow.note) {setComment(entry.flow.note);}
    });
    return () => {mounted = false;};
  }, [selectedDate]);

  const toggleProtection = (value: string) => {
    setSelectedProtections(current =>
      current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value],
    );
  };

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showSuccessToastThenGoBack = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    setSuccessVisible(true);

    successTimeoutRef.current = setTimeout(() => {
      setSuccessVisible(false);

      // MenstrualFlowScreen est ouvert depuis CycleHome.
      // goBack() évite l'erreur de typage entre RootStackParamList et MainTabNavigator.
      navigation.goBack();
    }, 2500);
  };

  const save = async () => {
    if (saving) {
      return;
    }

    saveScale.value = withSequence(
      withTiming(0.97, {duration: 80}),
      withSpring(1, {damping: 14, stiffness: 220}),
    );

    try {
      setSaving(true);

      await saveJournalSection(
        selectedDate.toLocaleDateString('en-CA'),
        'flow',
        {
          intensity: selectedIntensity,
          color: selectedColor,
          clots: selectedClotSize,
          protections: selectedProtections,
          note: comment.trim(),
        },
      );

      showSuccessToastThenGoBack();
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer ton flux pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAnimatedStyle = useAnimatedStyle(() => ({transform: [{scale: saveScale.value}]}));
  const heroDropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroDropScale.value,
    transform: [{scale: heroDropScale.value}],
  }));
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], ['#E7DFF1', PURPLE]),
    shadowOpacity: focusProgress.value * 0.11,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : styles.contentRegular,
          {
            paddingTop: Math.max(insets.top, 16) + 7,
            paddingBottom: Math.max(insets.bottom, 18) + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(320)} style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={PURPLE} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.86} style={styles.title}>
              Flux menstruel
            </Text>
            <Text style={styles.subtitle}>Aujourd’hui • Jour {cycleDay} du cycle</Text>
          </View>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(430)}>
          <LinearGradient
            colors={['#F1E2FF', '#E7D2FB', '#F8F0FF']}
            end={{x: 1, y: 1}}
            start={{x: 0, y: 0}}
            style={styles.heroCard}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Comment est ton flux aujourd’hui ?</Text>
              <View style={styles.heroSparkles}>
                <MaterialDesignIcons color="#A17CE9" name="star-four-points" size={13} />
                <MaterialDesignIcons color="#C49DEB" name="star-four-points" size={8} />
              </View>
            </View>
            <Animated.View style={[styles.heroArt, heroDropAnimatedStyle]}>
              <MaterialDesignIcons color="#BE9BEF" name="leaf" size={47} style={styles.leftLeaf} />
              <View style={styles.heroDropCircle}>
                <MaterialDesignIcons color="#D85A85" name="water" size={69} />
                <MaterialDesignIcons color="#F6B5CB" name="water-outline" size={25} style={styles.dropShine} />
              </View>
              <MaterialDesignIcons color="#A981E2" name="leaf" size={42} style={styles.rightLeaf} />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(170).duration(430)} style={styles.card}>
          <Text style={styles.sectionTitle}>Intensité du flux</Text>
          <View style={styles.fiveColumnRow}>
            {INTENSITIES.map(option => {
              const selected = selectedIntensity === option.value;
              return (
                <Selectable
                  accessibilityLabel={`Intensité ${option.label.replace('\n', ' ')}`}
                  key={option.value}
                  onPress={() => setSelectedIntensity(option.value)}
                  selected={selected}
                  style={styles.intensityOption}>
                  <MaterialDesignIcons color={option.color} name={option.icon} size={24} />
                  <Text numberOfLines={2} style={[styles.smallChoiceLabel, selected && styles.selectedLabel]}>
                    {option.label}
                  </Text>
                </Selectable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).duration(430)} style={styles.card}>
          <Text style={styles.sectionTitle}>Couleur du flux</Text>
          <View style={styles.colorRow}>
            {FLOW_COLORS.map(flowColor => {
              const selected = selectedColor === flowColor;
              return (
                <Pressable
                  accessibilityLabel={`Couleur du flux ${flowColor}`}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  key={flowColor}
                  onPress={() => setSelectedColor(flowColor)}
                  style={({pressed}) => [
                    styles.colorRing,
                    selected && styles.colorRingSelected,
                    pressed && styles.colorPressed,
                  ]}>
                  <View style={[styles.colorChip, {backgroundColor: flowColor}]} />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(320).duration(430)} style={styles.card}>
          <Text style={styles.sectionTitle}>Caillots</Text>
          <View style={styles.fourColumnRow}>
            {CLOTS.map(option => {
              const selected = selectedClotSize === option.value;
              return (
                <Selectable
                  accessibilityLabel={`Caillots ${option.label}`}
                  key={option.value}
                  onPress={() => setSelectedClotSize(option.value)}
                  selected={selected}
                  style={styles.fourColumnOption}>
                  <MaterialDesignIcons
                    color={selected ? PURPLE : '#A58BCF'}
                    name={option.icon as never}
                    size={23}
                  />
                  <Text style={[styles.choiceLabel, selected && styles.selectedLabel]}>{option.label}</Text>
                </Selectable>
              );
            })}
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Protection utilisée</Text>
          <View style={styles.fourColumnRow}>
            {PROTECTIONS.map(option => {
              const selected = selectedProtections.includes(option.value);
              return (
                <Selectable
                  accessibilityLabel={`Protection ${option.label}`}
                  key={option.value}
                  onPress={() => toggleProtection(option.value)}
                  selected={selected}
                  style={styles.fourColumnOption}>
                  <View>
                    <MaterialDesignIcons
                      color={selected ? PURPLE : '#A58BCF'}
                      name={option.icon as never}
                      size={24}
                    />
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <MaterialDesignIcons color="#FFFFFF" name="check" size={9} />
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={2} style={[styles.choiceLabel, selected && styles.selectedLabel]}>
                    {option.label}
                  </Text>
                </Selectable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(390).duration(430)} style={styles.card}>
          <Text style={styles.sectionTitle}>
            Commentaire <Text style={styles.optional}>(optionnel)</Text>
          </Text>
          <Animated.View style={[styles.inputWrap, inputAnimatedStyle]}>
            <TextInput
              accessibilityLabel="Commentaire optionnel"
              maxLength={200}
              multiline
              onBlur={() => setInputFocused(false)}
              onChangeText={setComment}
              onFocus={() => setInputFocused(true)}
              placeholder="Écris ici ce que tu souhaites noter..."
              placeholderTextColor="#A49BB9"
              style={styles.input}
              textAlignVertical="top"
              value={comment}
            />
            <Text style={styles.counter}>{comment.length} / 200</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(530).duration(400)} style={saveAnimatedStyle}>
          <Pressable
            accessibilityLabel="Enregistrer le flux menstruel"
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            onPressIn={() => {
              if (!saving) {
                saveScale.value = withTiming(0.97, {duration: 75});
              }
            }}
            onPressOut={() => {
              saveScale.value = withSpring(1);
            }}
            style={[
              styles.savePressable,
              saving && styles.savePressableDisabled,
            ]}>
            <LinearGradient
              colors={['#7657EB', '#6539D5']}
              end={{x: 1, y: 1}}
              start={{x: 0, y: 0}}
              style={styles.saveGradient}>
              <Text style={styles.saveText}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {successVisible ? (
        <Animated.View
          entering={FadeInUp.springify().damping(17)}
          style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <View style={styles.toastIcon}>
            <MaterialDesignIcons color="#FFFFFF" name="check" size={14} />
          </View>
          <Text style={styles.toastText}>Flux enregistré avec succès ✨</Text>
          <Pressable accessibilityLabel="Fermer" hitSlop={10} onPress={() => setSuccessVisible(false)}>
            <MaterialDesignIcons color="#8E83A4" name="close" size={17} />
          </Pressable>
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: BACKGROUND},
  content: {flexGrow: 1, gap: 13},
  contentCompact: {paddingHorizontal: 11},
  contentRegular: {paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'center', paddingBottom: 3},
  backButton: {
    alignItems: 'center', justifyContent: 'center', borderRadius: 999,
    backgroundColor: '#FFFFFF', padding: 9, elevation: 2,
    shadowColor: '#4E319A', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.09, shadowRadius: 8,
  },
  headerCopy: {flex: 1, alignItems: 'center', paddingHorizontal: 6},
  headerSpacer: {padding: 23},
  title: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 23, fontWeight: '700', textAlign: 'center'},
  subtitle: {marginTop: 3, color: TEXT_MUTED, fontSize: 11.5, textAlign: 'center'},
  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  heroCard: {
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderRadius: 26,
    paddingHorizontal: 18, paddingVertical: 18, aspectRatio: 2.65,
    shadowColor: '#7045C4', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.11, shadowRadius: 13, elevation: 3,
  },
  heroCopy: {flex: 1, alignSelf: 'stretch', justifyContent: 'center'},
  heroTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 18, fontWeight: '700', lineHeight: 24},
  heroSparkles: {flexDirection: 'row', gap: 7, marginTop: 9},
  heroArt: {flex: 0.8, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch'},
  heroDropCircle: {alignItems: 'center', justifyContent: 'center', zIndex: 2},
  dropShine: {position: 'absolute', transform: [{translateX: 7}, {translateY: 4}]},
  leftLeaf: {position: 'absolute', left: 0, bottom: 0, transform: [{rotate: '-30deg'}]},
  rightLeaf: {position: 'absolute', right: 0, bottom: 2, transform: [{rotate: '22deg'}]},
  card: {
    borderWidth: 1, borderColor: 'rgba(109,74,232,0.09)', borderRadius: 26,
    backgroundColor: '#FFFFFF', padding: 13,
    shadowColor: '#6D4AE8', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  sectionTitle: {color: PURPLE_DARK, fontSize: 14, fontWeight: '700'},
  fiveColumnRow: {flexDirection: 'row', gap: 5, marginTop: 11},
  fourColumnRow: {flexDirection: 'row', gap: 7, marginTop: 11},
  selectable: {
    overflow: 'visible', borderWidth: 1, borderRadius: 17, backgroundColor: '#FFFFFF',
    shadowColor: PURPLE, shadowOffset: {width: 0, height: 3}, shadowRadius: 8,
  },
  selectablePressable: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 10},
  intensityOption: {flex: 1, aspectRatio: 0.72},
  fourColumnOption: {flex: 1, aspectRatio: 0.92},
  smallChoiceLabel: {marginTop: 5, color: TEXT_MUTED, fontSize: 8.5, lineHeight: 11, textAlign: 'center'},
  choiceLabel: {marginTop: 5, color: TEXT_MUTED, fontSize: 9.5, lineHeight: 12, textAlign: 'center'},
  selectedLabel: {color: PURPLE, fontWeight: '700'},
  colorRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 2},
  colorRing: {alignItems: 'center', justifyContent: 'center', flexBasis: '14%', aspectRatio: 1, borderWidth: 2, borderColor: 'transparent', borderRadius: 999, padding: 4},
  colorRingSelected: {borderColor: PURPLE, backgroundColor: '#F2EAFF', shadowColor: PURPLE, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2, transform: [{scale: 1.08}]},
  colorChip: {width: '100%', aspectRatio: 1, borderRadius: 999},
  colorPressed: {transform: [{scale: 0.92}]},
  sectionDivider: {height: StyleSheet.hairlineWidth, backgroundColor: '#ECE5F5', marginVertical: 14},
  checkBadge: {position: 'absolute', right: -7, top: -6, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: PURPLE, padding: 2},
  optional: {color: '#9B91AC', fontSize: 11, fontWeight: '500'},
  inputWrap: {
    marginTop: 10, borderWidth: 1, borderRadius: 20, backgroundColor: LAVENDER,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8,
    shadowColor: PURPLE, shadowOffset: {width: 0, height: 3}, shadowRadius: 8,
  },
  input: {color: PURPLE_DARK, fontSize: 12.5, lineHeight: 18, padding: 0, paddingBottom: 24},
  counter: {position: 'absolute', right: 11, bottom: 8, color: '#9D94B0', fontSize: 10},
  savePressable: {overflow: 'hidden', borderRadius: 18, shadowColor: '#5831BE', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.24, shadowRadius: 10, elevation: 4},
  saveGradient: {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 15},
  saveText: {color: '#FFFFFF', fontSize: 15.5, fontWeight: '700'},
  savePressableDisabled: {opacity: 0.55},
  toast: {
    position: 'absolute', left: '7%', right: '7%', flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: '#E3D8F2', borderRadius: 20, backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#4F2A9C', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.17, shadowRadius: 13, elevation: 7,
  },
  toastIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: PURPLE, padding: 4},
  toastText: {flex: 1, color: PURPLE_DARK, fontSize: 12.5, fontWeight: '700'},
});