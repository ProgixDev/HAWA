import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
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
import {cycleDayFor} from '../../utils/cycleMath';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

const HYDRATION_ILLUSTRATION = require('../../assets/images/hydration-bottle.png');

const DEFAULT_GOAL = 8;
const DEFAULT_INTAKE = 5;
const GLASS_ML = 250;
const GOAL_OPTIONS = [6, 7, 8, 9, 10] as const;
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

type WeeklyHydrationDatum = {
  day: (typeof DAY_LABELS)[number];
  glasses: number;
};

type HydrationState = {
  dailyGoal: number;
  currentIntake: number;
  weeklyHistory: WeeklyHydrationDatum[];
  selectedDate: Date;
  cycleDay: number;
};

type WaterDropProps = {
  active: boolean;
  index: number;
};

function WaterDrop({active, index}: WaterDropProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(3);

  useEffect(() => {
    const delay = Math.min(index * 45, 360);
    opacity.value = withDelay(delay, withTiming(1, {duration: 220}));
    translateY.value = withDelay(delay, withSpring(0, {damping: 14, stiffness: 170}));
    scale.value = withDelay(
      delay,
      active
        ? withSequence(
            withSpring(1.08, {damping: 10, stiffness: 210}),
            withSpring(1, {damping: 14, stiffness: 180}),
          )
        : withSpring(1, {damping: 16, stiffness: 160}),
    );
  }, [active, index, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}, {translateY: translateY.value}],
  }));

  return (
    <Animated.View style={[styles.dropWrap, active && styles.dropGlow, animatedStyle]}>
      <MaterialDesignIcons
        color={active ? theme.colors.primary : theme.colors.border}
        name={active ? 'water' : 'water-outline'}
        size={25}
      />
    </Animated.View>
  );
}

type HistoryBarProps = {
  datum: WeeklyHydrationDatum;
  current: boolean;
  index: number;
  max: number;
};

function HistoryBar({datum, current, index, max}: HistoryBarProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      420 + index * 65,
      withSpring(1, {damping: 17, stiffness: 115}),
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.55,
    transform: [{scaleY: progress.value}],
  }));

  return (
    <View style={styles.barColumn}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.bar,
            current && styles.barCurrent,
            {height: `${Math.max(14, (datum.glasses / max) * 100)}%`},
            animatedStyle,
          ]}
        />
      </View>
      <Text style={[styles.dayLabel, current && styles.dayLabelCurrent]}>{datum.day}</Text>
    </View>
  );
}

export default function HydrationScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const selectedDate = useMemo(() => new Date(), []);
  const todayIndex = (selectedDate.getDay() + 6) % 7;
  const cycleDay = useMemo(
    () => cycleDayFor(selectedDate, getCyclePreferences()),
    [selectedDate],
  );

  const [dailyGoal, setDailyGoal] = useState(DEFAULT_GOAL);
  const [currentIntake, setCurrentIntake] = useState(DEFAULT_INTAKE);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHydrationDatum[]>(() =>
    DAY_LABELS.map((day, index) => ({
      day,
      glasses: [7, 6, 8, 7, 5, 7, 6][index],
    })),
  );
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);
  const [pendingGoal, setPendingGoal] = useState(DEFAULT_GOAL);
  const [customGoal, setCustomGoal] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  const buttonScale = useSharedValue(1);
  const feedbackOpacity = useSharedValue(0);
  const illustrationScale = useSharedValue(0.94);

  const hydrationState: HydrationState = useMemo(
    () => ({dailyGoal, currentIntake, weeklyHistory, selectedDate, cycleDay}),
    [cycleDay, currentIntake, dailyGoal, selectedDate, weeklyHistory],
  );

  useEffect(() => {
    illustrationScale.value = withDelay(
      220,
      withSpring(1, {damping: 16, stiffness: 120}),
    );
  }, [illustrationScale]);

  useEffect(() => {
    let mounted = true;
    getJournalEntry(selectedDate.toLocaleDateString('en-CA')).then(entry => {
      if (!mounted || !entry?.hydration) {return;}
      const storedGoal = entry.hydration.goalGlasses ??
        (entry.hydration.dailyGoal
          ? entry.hydration.dailyGoal <= 20
            ? entry.hydration.dailyGoal
            : Math.round(entry.hydration.dailyGoal / GLASS_ML)
          : DEFAULT_GOAL);
      const storedIntake = entry.hydration.glasses ??
        Math.round(entry.hydration.milliliters / GLASS_ML);
      setDailyGoal(Math.max(1, storedGoal));
      setPendingGoal(Math.max(1, storedGoal));
      setCurrentIntake(Math.max(0, storedIntake));
    });
    return () => {mounted = false;};
  }, [selectedDate]);

  useEffect(() => {
    setWeeklyHistory(history => history.map((item, index) =>
      index === todayIndex ? {...item, glasses: currentIntake} : item,
    ));
  }, [currentIntake, todayIndex]);

  const persistHydration = useCallback(async (intake: number, goal: number) => {
    await saveJournalSection(
      selectedDate.toLocaleDateString('en-CA'),
      'hydration',
      {
        milliliters: intake * GLASS_ML,
        dailyGoal: goal * GLASS_ML,
        glasses: intake,
        goalGlasses: goal,
      },
    );
  }, [selectedDate]);

  const addGlass = () => {
    if (currentIntake >= dailyGoal) {
      setSuccessVisible(true);
      return;
    }

    const next = currentIntake + 1;
    setCurrentIntake(next);
    feedbackOpacity.value = withSequence(
      withTiming(0.16, {duration: 80}),
      withTiming(0, {duration: 260}),
    );
    buttonScale.value = withSequence(
      withTiming(0.975, {duration: 70}),
      withSpring(1, {damping: 15, stiffness: 230}),
    );
    if (next >= dailyGoal) {setSuccessVisible(true);}
    persistHydration(next, dailyGoal).catch(() => {});
  };

  const saveGoal = () => {
    const parsedCustom = Number(customGoal);
    const requestedGoal = customGoal.trim() ? parsedCustom : pendingGoal;
    const nextGoal = Math.max(1, Math.min(20, Number.isFinite(requestedGoal) ? requestedGoal : DEFAULT_GOAL));
    const nextIntake = Math.min(currentIntake, nextGoal);
    setDailyGoal(nextGoal);
    setPendingGoal(nextGoal);
    setCurrentIntake(nextIntake);
    setGoalSheetVisible(false);
    setCustomGoal('');
    setSuccessVisible(nextIntake >= nextGoal);
    persistHydration(nextIntake, nextGoal).catch(() => {});
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: buttonScale.value}],
  }));
  const feedbackAnimatedStyle = useAnimatedStyle(() => ({opacity: feedbackOpacity.value}));
  const illustrationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: illustrationScale.value,
    transform: [{scale: illustrationScale.value}],
  }));

  const chartMax = Math.max(10, ...hydrationState.weeklyHistory.map(item => item.glasses));

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 18) + 8,
            paddingBottom: Math.max(insets.bottom, 18) + 24,
          },
          compact ? styles.contentCompact : styles.contentRegular,
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(320)} style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.86} style={styles.title}>Hydratation</Text>
            <Text style={styles.subtitle}>Aujourd’hui • Jour {hydrationState.cycleDay} du cycle</Text>
          </View>

          <Pressable
            accessibilityLabel="Personnaliser l’objectif"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setGoalSheetVisible(true)}
            style={({pressed}) => [styles.settingsButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="cog-outline" size={23} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(90).duration(430)} style={styles.goalCard}>
          <View style={styles.cardHeader}>
            <View style={styles.flexCopy}>
              <Text style={styles.cardTitle}>Objectif quotidien</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.82} style={styles.goalValue}>
                {hydrationState.dailyGoal} verres
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Personnaliser l’objectif quotidien"
              accessibilityRole="button"
              onPress={() => setGoalSheetVisible(true)}
              style={({pressed}) => [styles.personalizeButton, pressed && styles.pressed]}>
              <Text style={styles.personalizeText}>Personnaliser</Text>
            </Pressable>
          </View>

          <Animated.View style={[styles.illustrationWrap, illustrationAnimatedStyle]}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="Bouteille et verre d’eau"
              resizeMode="contain"
              source={HYDRATION_ILLUSTRATION}
              style={styles.illustration}
            />
          </Animated.View>

          <View accessibilityLabel={`${currentIntake} verres sur ${dailyGoal}`} style={styles.dropsRow}>
            {Array.from({length: hydrationState.dailyGoal}, (_, index) => (
              <WaterDrop active={index < hydrationState.currentIntake} index={index} key={index} />
            ))}
          </View>

          <Animated.Text
            entering={FadeIn.duration(180)}
            key={`${currentIntake}-${dailyGoal}`}
            style={styles.counter}>
            {hydrationState.currentIntake} / {hydrationState.dailyGoal} verres
          </Animated.Text>

          {successVisible && currentIntake >= dailyGoal ? (
            <Animated.Text entering={FadeInUp.duration(260)} style={styles.success}>
              Objectif atteint ✨
            </Animated.Text>
          ) : null}

          <Animated.View style={[styles.addButtonWrap, buttonAnimatedStyle]}>
            <Pressable
              accessibilityLabel="Ajouter un verre"
              accessibilityRole="button"
              onPress={addGlass}
              onPressIn={() => {buttonScale.value = withTiming(0.985, {duration: 70});}}
              onPressOut={() => {buttonScale.value = withSpring(1);}}
              style={styles.addPressable}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary]}
                end={{x: 1, y: 1}}
                start={{x: 0, y: 0}}
                style={styles.addGradient}>
                <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="plus" size={22} />
                <Text style={styles.addText}>Ajouter 1 verre</Text>
              </LinearGradient>
              <Animated.View pointerEvents="none" style={[styles.feedbackFlash, feedbackAnimatedStyle]} />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).duration(430)} style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Historique</Text>
            <Pressable accessibilityRole="button" hitSlop={8} style={({pressed}) => pressed && styles.pressed}>
              <Text style={styles.moreText}>Voir plus</Text>
            </Pressable>
          </View>
          <View style={styles.chartArea}>
            <View style={styles.axisLabels}>
              {[10, 8, 6, 4, 2, 0].map(value => <Text key={value} style={styles.axisText}>{value}</Text>)}
            </View>
            <View style={styles.barsRow}>
              {hydrationState.weeklyHistory.map((datum, index) => (
                <HistoryBar
                  current={index === todayIndex}
                  datum={datum}
                  index={index}
                  key={datum.day}
                  max={chartMax}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(520).duration(400)} style={styles.adviceCard}>
          <View style={styles.adviceCopy}>
            <Text style={styles.adviceTitle}>Conseils du jour</Text>
            <Text style={styles.adviceText}>
              Boire suffisamment d’eau aide à réduire les ballonnements et à améliorer ton énergie.
            </Text>
          </View>
          <View style={styles.adviceIcon}>
            <MaterialDesignIcons color="#68AEEA" name="water" size={31} />
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setGoalSheetVisible(false)}
        statusBarTranslucent
        transparent
        visible={goalSheetVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setGoalSheetVisible(false)} />
          <Animated.View entering={FadeInUp.springify().damping(18)} style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Objectif quotidien</Text>
            <Text style={styles.sheetSubtitle}>Choisis le nombre de verres à boire chaque jour.</Text>

            <View style={styles.goalOptions}>
              {GOAL_OPTIONS.map(goal => {
                const selected = !customGoal && pendingGoal === goal;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    key={goal}
                    onPress={() => {setPendingGoal(goal); setCustomGoal('');}}
                    style={({pressed}) => [styles.goalOption, selected && styles.goalOptionSelected, pressed && styles.pressed]}>
                    <Text style={[styles.goalOptionText, selected && styles.goalOptionTextSelected]}>{goal} verres</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.customLabel}>Valeur personnalisée</Text>
            <TextInput
              accessibilityLabel="Nombre de verres personnalisé"
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={setCustomGoal}
              placeholder="Ex. 12"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.customInput}
              value={customGoal}
            />

            <Pressable accessibilityRole="button" onPress={saveGoal} style={({pressed}) => [styles.sheetSave, pressed && styles.pressed]}>
              <Text style={styles.sheetSaveText}>Enregistrer l’objectif</Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  content: {flexGrow: 1, gap: 14},
  contentCompact: {paddingHorizontal: 12},
  contentRegular: {paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'center', paddingBottom: 4},
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    padding: 10,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsButton: {padding: 10},
  headerCopy: {flex: 1, alignItems: 'center', paddingHorizontal: 8},
  title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '700', textAlign: 'center'},
  subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, textAlign: 'center'},
  goalCard: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    padding: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  flexCopy: {flex: 1},
  cardTitle: {color: theme.colors.accent, fontSize: 15, fontWeight: '700'},
  goalValue: {marginTop: 5, color: theme.colors.accent, fontFamily: 'serif', fontSize: 27, fontWeight: '700'},
  personalizeButton: {borderRadius: 18, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8},
  personalizeText: {color: theme.colors.primary, fontSize: 11, fontWeight: '700'},
  illustrationWrap: {alignSelf: 'center', width: '76%', aspectRatio: 1.9, marginTop: 4},
  illustration: {width: '100%', height: '100%'},
  dropsRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 3},
  dropWrap: {alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 2},
  dropGlow: {backgroundColor: withAlpha(theme.colors.primary, 0.07)},
  counter: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center'},
  success: {marginTop: 6, color: theme.colors.success, fontSize: 12, fontWeight: '700', textAlign: 'center'},
  addButtonWrap: {marginTop: 14, borderRadius: 16, shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.22, shadowRadius: 9, elevation: 4},
  addPressable: {overflow: 'hidden', borderRadius: 16},
  addGradient: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14},
  addText: {color: onPrimaryTextColor(theme), fontSize: 15.5, fontWeight: '700'},
  feedbackFlash: {...StyleSheet.absoluteFillObject, backgroundColor: onPrimaryTextColor(theme)},
  historyCard: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.09),
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    padding: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  moreText: {color: theme.colors.primary, fontSize: 11, fontWeight: '700'},
  chartArea: {flexDirection: 'row', width: '100%', aspectRatio: 2.35, marginTop: 14},
  axisLabels: {justifyContent: 'space-between', paddingBottom: 18, paddingRight: 7},
  axisText: {color: theme.colors.textMuted, fontSize: 8.5},
  barsRow: {flex: 1, flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  barColumn: {flex: 1, alignItems: 'center'},
  barTrack: {flex: 1, width: '48%', justifyContent: 'flex-end'},
  bar: {width: '100%', borderRadius: 9, backgroundColor: withAlpha(theme.colors.primary, 0.55)},
  barCurrent: {backgroundColor: theme.colors.primary},
  dayLabel: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 9, textAlign: 'center'},
  dayLabelCurrent: {color: theme.colors.primary, fontWeight: '700'},
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  adviceCopy: {flex: 1, paddingRight: 12},
  adviceTitle: {color: theme.colors.accent, fontSize: 14, fontWeight: '700'},
  adviceText: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},
  // SEMANTIC (D) — this "conseils" advice icon intentionally uses a fixed
  // water-blue (not the purple UI chrome) to represent hydration/water
  // itself; kept exact, not theme-driven.
  adviceIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#E5F3FF', padding: 10},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  // Modal backdrop scrim — established fixed exception, never themed.
  backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,0.34)'},
  sheet: {borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.colors.surface, paddingHorizontal: 20, paddingTop: 10},
  sheetHandle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
  sheetTitle: {marginTop: 18, color: theme.colors.accent, fontFamily: 'serif', fontSize: 22, fontWeight: '700', textAlign: 'center'},
  sheetSubtitle: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
  goalOptions: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18},
  goalOption: {flexBasis: '29%', flexGrow: 1, alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 18, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 12},
  goalOptionSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  goalOptionText: {color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600'},
  goalOptionTextSelected: {color: theme.colors.primary, fontWeight: '700'},
  customLabel: {marginTop: 18, color: theme.colors.accent, fontSize: 13, fontWeight: '700'},
  customInput: {marginTop: 8, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 16, backgroundColor: theme.colors.background, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.accent, fontSize: 15},
  sheetSave: {alignItems: 'center', marginTop: 16, borderRadius: 17, backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 15},
  sheetSaveText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  });
}
