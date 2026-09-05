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
import PeriodEndBottomSheet from '../../components/prayer/PeriodEndBottomSheet';
import {getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences, getPeriodEndDateTime, hydratePeriodEndDateTime} from '../../state/onboardingPreferences';
import type {FlowIntensity} from '../../types/journal';
import {cycleDayFor, formatFullDate, isMenstruatingNow} from '../../utils/cycleMath';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {interpolateHex, onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// SEMANTIC — cycle-tracking "period in progress" identity color, same exact
// values as CycleHomeScreen's own PERIOD/PERIOD_LIGHT constants — never
// theme-driven (Phase E4 is visual-only; see CLAUDE.md §2/§6).
const PERIOD_PINK = '#DC7B82';
const PERIOD_PINK_LIGHT = '#F7D7D6';

// Category B — flow-intensity color for the "Moyen" swatch. This numerically
// matches theme.colors.primary for AWA Original today, but it is a
// medical/tracking value (see FlowIntensity 'moderate'), not decorative
// chrome, so it stays a fixed literal rather than becoming theme-driven.
const FLOW_MODERATE_COLOR = '#6D4AE8';

// Category E — fixed visual island: this hero card's gradient + hand-tuned
// icon palette (leaves, water drop, sparkles) is a single calibrated
// illustration; its overlay title text is calibrated to sit on that
// composition and stays fixed alongside it rather than becoming theme-driven.
const FLOW_HERO_TITLE_COLOR = '#2F2258';

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
  {label: 'Moyen', value: 'moderate', color: FLOW_MODERATE_COLOR, icon: 'water'},
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.colors.surface, theme.colors.primarySoft]),
    borderColor: interpolateColor(progress.value, [0, 1], [withAlpha(theme.colors.primary, 0.14), theme.colors.primary]),
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const selectedDate = useMemo(() => new Date(), []);
  const cycleDay = useMemo(
    () => cycleDayFor(selectedDate, getCyclePreferences()),
    [selectedDate],
  );

  const [periodEndRevision, setPeriodEndRevision] = useState(0);
  const [periodEndSheetVisible, setPeriodEndSheetVisible] = useState(false);
  const [periodEndToastVisible, setPeriodEndToastVisible] = useState(false);
  const periodEndToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cyclePreferences = useMemo(() => getCyclePreferences(), []);
  const periodEndDateTime = useMemo(
    () => getPeriodEndDateTime(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodEndRevision],
  );
  const isMenstruating = useMemo(
    () => isMenstruatingNow(new Date(), cyclePreferences, periodEndDateTime),
    [cyclePreferences, periodEndDateTime],
  );
  const periodStartLabel = useMemo(() => {
    const start = cyclePreferences.lastPeriodStart;
    const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;
    const timeLabel = new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(start);
    return hasTime ? `${formatFullDate(start)} à ${timeLabel}` : formatFullDate(start);
  }, [cyclePreferences]);

  useEffect(() => {
    let mounted = true;
    hydratePeriodEndDateTime().then(() => {
      if (mounted) {setPeriodEndRevision(current => current + 1);}
    });
    return () => {mounted = false;};
  }, []);

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
      if (periodEndToastTimeoutRef.current) {
        clearTimeout(periodEndToastTimeoutRef.current);
      }
    };
  }, []);

  const handlePeriodEndConfirmed = () => {
    setPeriodEndRevision(current => current + 1);
    setPeriodEndSheetVisible(false);

    if (periodEndToastTimeoutRef.current) {
      clearTimeout(periodEndToastTimeoutRef.current);
    }
    setPeriodEndToastVisible(true);
    periodEndToastTimeoutRef.current = setTimeout(() => {
      setPeriodEndToastVisible(false);
    }, 2500);
  };

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
    borderColor: interpolateColor(focusProgress.value, [0, 1], [withAlpha(theme.colors.primary, 0.14), theme.colors.primary]),
    shadowOpacity: focusProgress.value * 0.11,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
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
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.86} style={styles.title}>
              Flux menstruel
            </Text>
            <Text style={styles.subtitle}>Aujourd’hui • Jour {cycleDay} du cycle</Text>
          </View>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {isMenstruating ? (
          <Animated.View entering={FadeInUp.delay(40).duration(400)} style={styles.periodStatusCard}>
            <View style={styles.periodStatusHeading}>
              <View style={styles.periodStatusDot} />
              <Text style={styles.periodStatusTitle}>Règles en cours</Text>
            </View>
            <Text style={styles.periodStatusSubtitle}>Depuis le {periodStartLabel}</Text>
            <Pressable
              accessibilityLabel="Mes règles sont terminées"
              accessibilityRole="button"
              onPress={() => setPeriodEndSheetVisible(true)}
              style={({pressed}) => [styles.periodEndButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={PERIOD_PINK} name="check-circle-outline" size={17} />
              <Text style={styles.periodEndButtonText}>Mes règles sont terminées</Text>
            </Pressable>
          </Animated.View>
        ) : null}

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
                    color={selected ? theme.colors.primary : theme.colors.textSecondary}
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
                      color={selected ? theme.colors.primary : theme.colors.textSecondary}
                      name={option.icon as never}
                      size={24}
                    />
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={9} />
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
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              textAlignVertical="top"
              value={comment}
            />
            <Text style={styles.counter}>{comment.length} / 200</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(530).duration(400)}>
          <Animated.View style={saveAnimatedStyle}>
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
                colors={[
                  interpolateHex(theme.colors.primary, '#FFFFFF', 0.08),
                  interpolateHex(theme.colors.primary, '#000000', 0.08),
                ]}
                end={{x: 1, y: 1}}
                start={{x: 0, y: 0}}
                style={styles.saveGradient}>
                <Text style={styles.saveText}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {successVisible ? (
        <Animated.View
          entering={FadeInUp.springify().damping(17)}
          style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <View style={styles.toastIcon}>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
          </View>
          <Text style={styles.toastText}>Flux enregistré avec succès ✨</Text>
          <Pressable accessibilityLabel="Fermer" hitSlop={10} onPress={() => setSuccessVisible(false)}>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="close" size={17} />
          </Pressable>
        </Animated.View>
      ) : null}

      {periodEndToastVisible ? (
        <Animated.View
          entering={FadeInUp.springify().damping(17)}
          style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <View style={styles.toastIcon}>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
          </View>
          <Text style={styles.toastText}>Fin des règles enregistrée ✨</Text>
          <Pressable accessibilityLabel="Fermer" hitSlop={10} onPress={() => setPeriodEndToastVisible(false)}>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="close" size={17} />
          </Pressable>
        </Animated.View>
      ) : null}

      <PeriodEndBottomSheet
        initialDateTime={periodEndDateTime ?? new Date()}
        minDateTime={cyclePreferences.lastPeriodStart}
        onClose={() => setPeriodEndSheetVisible(false)}
        onConfirmed={handlePeriodEndConfirmed}
        visible={periodEndSheetVisible}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  content: {flexGrow: 1, gap: 13},
  contentCompact: {paddingHorizontal: 11},
  contentRegular: {paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'center', paddingBottom: 3},
  periodStatusCard: {
    borderWidth: 1, borderColor: 'rgba(220,123,130,0.22)', borderRadius: 22,
    backgroundColor: PERIOD_PINK_LIGHT, padding: 14,
  },
  periodStatusHeading: {flexDirection: 'row', alignItems: 'center', gap: 8},
  periodStatusDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: PERIOD_PINK},
  periodStatusTitle: {color: '#8E3E48', fontSize: 14.5, fontWeight: '700'},
  periodStatusSubtitle: {marginTop: 4, color: '#9A5C63', fontSize: 12},
  periodEndButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 12, minHeight: 46, borderRadius: 18, borderWidth: 1.4, borderColor: PERIOD_PINK,
    backgroundColor: theme.colors.surface,
  },
  periodEndButtonText: {color: PERIOD_PINK, fontSize: 13.5, fontWeight: '700'},
  backButton: {
    alignItems: 'center', justifyContent: 'center', borderRadius: 999,
    backgroundColor: theme.colors.surface, padding: 9, elevation: 2,
    shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.09, shadowRadius: 8,
  },
  headerCopy: {flex: 1, alignItems: 'center', paddingHorizontal: 6},
  headerSpacer: {padding: 23},
  title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 23, fontWeight: '700', textAlign: 'center'},
  subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, textAlign: 'center'},
  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  // Category E — fixed visual island (see FLOW_HERO_TITLE_COLOR note above):
  // this hand-tuned gradient + icon composition stays untouched by theming.
  heroCard: {
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderRadius: 26,
    paddingHorizontal: 18, paddingVertical: 18, aspectRatio: 2.65,
    shadowColor: '#7045C4', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.11, shadowRadius: 13, elevation: 3,
  },
  heroCopy: {flex: 1, alignSelf: 'stretch', justifyContent: 'center'},
  heroTitle: {color: FLOW_HERO_TITLE_COLOR, fontFamily: 'serif', fontSize: 18, fontWeight: '700', lineHeight: 24},
  heroSparkles: {flexDirection: 'row', gap: 7, marginTop: 9},
  heroArt: {flex: 0.8, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch'},
  heroDropCircle: {alignItems: 'center', justifyContent: 'center', zIndex: 2},
  dropShine: {position: 'absolute', transform: [{translateX: 7}, {translateY: 4}]},
  leftLeaf: {position: 'absolute', left: 0, bottom: 0, transform: [{rotate: '-30deg'}]},
  rightLeaf: {position: 'absolute', right: 0, bottom: 2, transform: [{rotate: '22deg'}]},
  card: {
    borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.09), borderRadius: 26,
    backgroundColor: theme.colors.surface, padding: 13,
    shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  sectionTitle: {color: theme.colors.accent, fontSize: 14, fontWeight: '700'},
  fiveColumnRow: {flexDirection: 'row', gap: 5, marginTop: 11},
  fourColumnRow: {flexDirection: 'row', gap: 7, marginTop: 11},
  selectable: {
    overflow: 'visible', borderWidth: 1, borderRadius: 17, backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 3}, shadowRadius: 8,
  },
  selectablePressable: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 10},
  intensityOption: {flex: 1, aspectRatio: 0.72},
  fourColumnOption: {flex: 1, aspectRatio: 0.92},
  smallChoiceLabel: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 8.5, lineHeight: 11, textAlign: 'center'},
  choiceLabel: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 9.5, lineHeight: 12, textAlign: 'center'},
  selectedLabel: {color: theme.colors.primary, fontWeight: '700'},
  colorRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 2},
  colorRing: {alignItems: 'center', justifyContent: 'center', flexBasis: '14%', aspectRatio: 1, borderWidth: 2, borderColor: 'transparent', borderRadius: 999, padding: 4},
  colorRingSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft, shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2, transform: [{scale: 1.08}]},
  colorChip: {width: '100%', aspectRatio: 1, borderRadius: 999},
  colorPressed: {transform: [{scale: 0.92}]},
  sectionDivider: {height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 14},
  checkBadge: {position: 'absolute', right: -7, top: -6, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.primary, padding: 2},
  optional: {color: theme.colors.textMuted, fontSize: 11, fontWeight: '500'},
  inputWrap: {
    marginTop: 10, borderWidth: 1, borderRadius: 20, backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8,
    shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 3}, shadowRadius: 8,
  },
  input: {color: theme.colors.text, fontSize: 12.5, lineHeight: 18, padding: 0, paddingBottom: 24},
  counter: {position: 'absolute', right: 11, bottom: 8, color: theme.colors.textMuted, fontSize: 10},
  savePressable: {overflow: 'hidden', borderRadius: 18, shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.24, shadowRadius: 10, elevation: 4},
  saveGradient: {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 15},
  saveText: {color: onPrimaryTextColor(theme), fontSize: 15.5, fontWeight: '700'},
  savePressableDisabled: {opacity: 0.55},
  toast: {
    position: 'absolute', left: '7%', right: '7%', flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 20, backgroundColor: theme.colors.surface,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.17, shadowRadius: 13, elevation: 7,
  },
  toastIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.primary, padding: 4},
  toastText: {flex: 1, color: theme.colors.accent, fontSize: 12.5, fontWeight: '700'},
  });
}