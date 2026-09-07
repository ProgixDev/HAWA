import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import {useJournalSheet} from '../../navigation/JournalSheetContext';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {
  interpolateHex,
  onPrimaryTextColor,
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';

import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {type QuickActionItem} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../home/ObjectiveArticlesSection';
import {getFloatingTabBarClearance} from '../../theme/spacing';
import PremiumChoiceCard from '../onboarding/PremiumChoiceCard';
import {JournalSaveToast, useJournalSaveToast} from '../journal/JournalSaveToast';

import {
  getFirstName,
  getSelectedLocation,
  getSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  subscribeSelectedLocation,
} from '../../state/onboardingPreferences';

import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  setMenopauseStage,
  subscribeMenopausePreferences,
  type MenopausePreferences,
  type MenopauseStage,
} from '../../state/menopausePreferences';

import {
  getLatestMenopauseLabResult,
  getMenopauseJournalEntry,
  hydrateMenopauseJournal,
  isMenopauseCategoryCompleted,
  subscribeMenopauseJournal,
  type MenopauseJournalEntry,
} from '../../state/menopauseJournalStore';

import {
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_SLEEP_QUALITY_LABELS,
  MENOPAUSE_TREATMENT_STATUS_LABELS,
} from '../../config/menopauseJournalConfig';

import {useMenopauseSpiritualStatus} from '../../hooks/usePrayerPurityStatus';
import {formatHijriDate} from '../../utils/cycleMath';

const RING_SIZE = 126;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const todayKey = (): string => new Date().toLocaleDateString('en-CA');

const STAGE_LABELS = {
  perimenopause: 'Périménopause',
  menopause: 'Ménopause',
  unsure: 'En observation',
} as const;

const STAGE_OPTIONS: Array<{
  id: MenopauseStage;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> = [
  {
    id: 'perimenopause',
    title: 'Périménopause',
    subtitle: 'Je remarque des changements depuis quelque temps',
    icon: 'weather-sunset',
    tint: '#FDF0E4',
  },
  {
    id: 'menopause',
    title: 'Ménopause',
    subtitle: 'Mes règles se sont arrêtées',
    icon: 'flower-outline',
    tint: '#E7F0E8',
  },
  {
    id: 'unsure',
    title: 'Je ne sais pas encore',
    subtitle: 'Et c’est tout à fait normal',
    icon: 'help-circle-outline',
    tint: '#EFE7F4',
  },
];

// The pastel `tint` values above are tuned for a light card and read as
// washed-out, low-definition chips once the surrounding "Mon étape" sheet is
// dark — the same fixed-pastel-on-dark problem already fixed for the
// calendar/LH-test cards. In dark mode, blend each option's own tint hue
// into the theme's real dark elevated surface (never a generic gray) so the
// three stage icons keep their distinct identity while integrating into the
// sheet, and derive the icon glyph color from that same resulting
// background's actual luminance — never a flat theme.colors.primary, which
// is a light color designed for dark surfaces and disappears against an
// equally light pastel chip.
function resolveStageOptionVisual(
  tint: string,
  theme: ResolvedAwaTheme,
): {tint: string; iconColor?: string} {
  // Whether the sheet's own elevated surface is dark enough that the fixed
  // pale pastel `tint` above would read as a washed-out chip pasted onto a
  // dark card — decided from the REAL resolved surfaceSecondary token's own
  // contrast requirement via pickReadableTextColor, never from
  // theme.isDark. A theme whose surfaceSecondary is itself light (every
  // current Light variant) never needs the tint touched at all, so the
  // untouched branch stays byte-identical to the pre-existing behavior;
  // only a genuinely dark surfaceSecondary blends the tint toward it and
  // derives a readable icon color from that real resulting color.
  const surfaceNeedsLightForeground = pickReadableTextColor(theme.colors.surfaceSecondary) === '#FFFFFF';
  if (!surfaceNeedsLightForeground) {
    return {tint};
  }
  const darkTint = interpolateHex(theme.colors.surfaceSecondary, tint, 0.4);
  return {tint: darkTint, iconColor: pickReadableTextColor(darkTint)};
}

type Props = MainTabScreenProps<'CycleHome'>;

/* ================================================================
 * PREMIUM ANIMATED PROGRESS RING
 * ================================================================ */

function PremiumProgressRing({
  progress,
  completedCount,
  totalCount,
  theme,
  styles,
}: {
  progress: number;
  completedCount: number;
  totalCount: number;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const ringAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    ringAnimation.stopAnimation();

    Animated.timing(ringAnimation, {
      toValue: progress,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, ringAnimation]);

  React.useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    glowLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
      rotateLoop.stop();
    };
  }, [glowAnimation, pulseAnimation, rotateAnimation]);

  const dashOffset = ringAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.24, 0.58],
  });

  const glowScale = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  const rotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const safeTotal = Math.max(totalCount, 1);

  return (
    <View style={styles.ringArea}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ringGlow,
          {
            opacity: glowOpacity,
            transform: [{scale: glowScale}],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ringOrbit,
          {
            transform: [{rotate: rotation}],
          },
        ]}>
        <View style={styles.ringOrbitDotLarge} />
        <View style={styles.ringOrbitDotSmall} />
      </Animated.View>

      <Animated.View style={{transform: [{scale: pulseScale}]}}>
        <View style={styles.ringShell}>
          <Svg height={RING_SIZE} width={RING_SIZE}>
            <Defs>
              {/* Generic "today's completion" progress fill — not a symptom/
                  severity indicator, so themed like any other decorative
                  brand-gradient chrome (see PHASE D8 report). */}
              <SvgLinearGradient id="menopauseRingGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <Stop offset="0%" stopColor={interpolateHex(theme.colors.primary, theme.colors.surface, 0.3)} />
                <Stop offset="48%" stopColor={theme.colors.primary} />
                <Stop offset="100%" stopColor={theme.colors.accent} />
              </SvgLinearGradient>
            </Defs>

            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              fill="none"
              r={RING_RADIUS}
              stroke={theme.colors.primarySoft}
              strokeWidth={RING_STROKE}
            />

            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              fill="none"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              r={RING_RADIUS}
              rotation="-90"
              stroke="url(#menopauseRingGradient)"
              strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeWidth={RING_STROKE}
            />
          </Svg>

          <View pointerEvents="none" style={styles.ringInner}>
            <View style={styles.ringIconBubble}>
              <MaterialDesignIcons
                color={progress >= 1 ? theme.colors.success : theme.colors.primary}
                name={progress >= 1 ? 'check' : 'flower-outline'}
                size={17}
              />
            </View>

            <Text style={styles.ringCount}>
              {completedCount}
              <Text style={styles.ringCountTotal}>/{safeTotal}</Text>
            </Text>

            <Text style={styles.ringCaption}>
              {progress >= 1 ? 'Complet' : 'Aujourd’hui'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ================================================================
 * DAILY ROW
 * DESIGN KEPT AS BEFORE
 * ================================================================ */

function DailyRow({
  icon,
  label,
  value,
  completed,
  theme,
  styles,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
  value: string;
  completed: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.dailyStatRow,
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.dailyStatIcon,
          completed
            ? styles.dailyStatusPurple
            : styles.dailyStatusMuted,
        ]}>
        <MaterialDesignIcons
          color={completed ? theme.colors.primary : theme.colors.textSecondary}
          name={icon}
          size={18}
        />
      </View>

      <View style={styles.dailyStatTextGroup}>
        <Text numberOfLines={1} style={styles.dailyStatLabel}>
          {label}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.dailyStatValue,
            !completed && styles.dailyValueMuted,
          ]}>
          {value}
        </Text>
      </View>

      <MaterialDesignIcons
        color={theme.colors.textMuted}
        name="chevron-right"
        size={18}
      />
    </Pressable>
  );
}

/* ================================================================
 * DASHBOARD
 * ================================================================ */

function MenopauseDashboard({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;

  const {open: openJournal} = useJournalSheet();
  const insets = useSafeAreaInsets();
  const toast = useJournalSaveToast();

  const today = useMemo(() => todayKey(), []);

  const entranceAnimation = useRef(new Animated.Value(0)).current;
  const decorativeAnimation = useRef(new Animated.Value(0)).current;

  const [preferences, setPreferences] =
    useState<MenopausePreferences>(getMenopausePreferences);

  const [entry, setEntry] = useState<MenopauseJournalEntry | undefined>(
    () => getMenopauseJournalEntry(today),
  );

  const [location, setLocation] = useState(getSelectedLocation());

  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] =
    useState(getSpiritualMarkersEnabled());

  const [stageModalVisible, setStageModalVisible] = useState(false);

  const [pendingStage, setPendingStage] =
    useState<MenopauseStage | null>(null);

  const [savingStage, setSavingStage] = useState(false);

  /* ================================================================
   * PREMIUM ENTRANCE
   * ================================================================ */

  React.useEffect(() => {
    Animated.timing(entranceAnimation, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(decorativeAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(decorativeAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [decorativeAnimation, entranceAnimation]);

  const entranceOpacity = entranceAnimation;

  const entranceTranslateY = entranceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const decorativeTranslateY = decorativeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const decorativeScale = decorativeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  /* ================================================================
   * HYDRATION / SUBSCRIPTIONS
   * ================================================================ */

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateMenopausePreferences().then(value => {
        if (active) {
          setPreferences(value);
        }
      });

      const unsubscribe = subscribeMenopausePreferences(() => {
        if (active) {
          setPreferences(getMenopausePreferences());
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateMenopauseJournal().then(() => {
        if (active) {
          setEntry(getMenopauseJournalEntry(today));
        }
      });

      const unsubscribe = subscribeMenopauseJournal(() => {
        if (active) {
          setEntry(getMenopauseJournalEntry(today));
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, [today]),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateSelectedLocation().then(value => {
        if (active) {
          setLocation(value);
        }
      });

      const unsubscribe = subscribeSelectedLocation(() => {
        if (active) {
          setLocation(getSelectedLocation());
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  const spiritual =
    useMenopauseSpiritualStatus(spiritualMarkersEnabled);

  /* ================================================================
   * PREFERENCES
   * ================================================================ */

  const showTreatment =
    preferences.hormonalTreatmentStatus === 'track';

  const showLab =
    preferences.labTracking !== null &&
    preferences.labTracking !== 'none';

  const dailySections: Array<{
    key: string;
    completed: boolean;
  }> = [
    {
      key: 'symptoms',
      completed: isMenopauseCategoryCompleted(entry, 'symptoms'),
    },
    {
      key: 'mood',
      completed: isMenopauseCategoryCompleted(entry, 'mood'),
    },
    {
      key: 'sleep',
      completed: isMenopauseCategoryCompleted(entry, 'sleep'),
    },
    {
      key: 'energy',
      completed: isMenopauseCategoryCompleted(entry, 'energy'),
    },
    ...(showTreatment
      ? [
          {
            key: 'treatment',
            completed: isMenopauseCategoryCompleted(entry, 'treatment'),
          },
        ]
      : []),
  ];

  const completedCount =
    dailySections.filter(section => section.completed).length;

  const progress =
    dailySections.length > 0
      ? completedCount / dailySections.length
      : 0;

  const heroStatusText =
    completedCount === 0
      ? 'Prends soin de toi aujourd’hui'
      : completedCount === dailySections.length
        ? 'Ton suivi du jour est complet'
        : 'Ton suivi avance à ton rythme';

  const heroSupportingText =
    completedCount === 0
      ? 'Quelques instants suffisent pour écouter ce que ton corps te raconte.'
      : completedCount === dailySections.length
        ? 'Tout est renseigné pour aujourd’hui. Tu peux revenir quand tu le souhaites.'
        : `${completedCount} suivi${completedCount > 1 ? 's' : ''} renseigné${completedCount > 1 ? 's' : ''} aujourd’hui.`;

  const stageLabel = preferences.stage
    ? STAGE_LABELS[preferences.stage]
    : 'Périménopause / Ménopause';

  /* ================================================================
   * JOURNAL VALUES
   * ================================================================ */

  const symptomsCount = entry?.symptoms?.length ?? 0;

  const symptomsValue =
    symptomsCount > 0
      ? `${symptomsCount} symptôme${symptomsCount > 1 ? 's' : ''} enregistré${symptomsCount > 1 ? 's' : ''}`
      : 'À renseigner';

  const moodValue = entry?.mood
    ? MENOPAUSE_MOOD_LABELS[entry.mood]
    : 'À renseigner';

  const sleepValue =
    entry?.sleepDurationHours !== undefined
      ? `${entry.sleepDurationHours} h${
          entry.sleepQuality
            ? ` · ${MENOPAUSE_SLEEP_QUALITY_LABELS[entry.sleepQuality]}`
            : ''
        }`
      : entry?.sleepQuality
        ? MENOPAUSE_SLEEP_QUALITY_LABELS[entry.sleepQuality]
        : 'À renseigner';

  const energyValue = entry?.energyLevel
    ? MENOPAUSE_ENERGY_LABELS[entry.energyLevel]
    : 'À renseigner';

  const treatmentValue = entry?.treatmentStatus
    ? MENOPAUSE_TREATMENT_STATUS_LABELS[entry.treatmentStatus]
    : 'À renseigner';

  const hasNotesToday = Boolean(entry?.notes?.trim());

  const latestFsh = getLatestMenopauseLabResult('fsh');
  const latestEstradiol =
    getLatestMenopauseLabResult('estradiol');

  /* ================================================================
   * QUICK ACTIONS
   * DESIGN / FUNCTIONALITY KEPT
   * ================================================================ */

  const quickActionItems: QuickActionItem[] = [
    {
      key: 'prayer-times',
      icon: 'mosque',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: 'Horaires\nde prière',
      onPress: () => navigation.navigate('PrayerTimes'),
    },
    {
      key: 'library',
      icon: 'book-open-page-variant-outline',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: 'Bibliothèque',
      onPress: () => navigation.navigate('Library'),
    },
    {
      // Fixed cross-dashboard action-identity accent (Category E) — kept
      // literal like every other objective's "Journal quotidien" tile,
      // never theme-driven. See PHASE D8 report.
      key: 'daily-journal',
      icon: 'notebook-edit-outline',
      iconColor: '#B23F63',
      iconBg: '#F9DCE8',
      label: 'Journal quotidien',
      onPress: openJournal,
    },
    {
      key: 'hijri-calendar',
      icon: 'moon-waning-crescent',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: 'Calendrier Hijri',
      onPress: () => navigation.navigate('HijriCalendar'),
    },
    {
      key: 'qadaa',
      icon: 'silverware-fork-knife',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: 'Jeûne à rattraper',
      onPress: () => navigation.navigate('FastingQadaa'),
    },
    {
      // Fixed cross-dashboard action-identity accent (Category E) — kept
      // literal like every other objective's "Statistiques" tile.
      key: 'statistics',
      icon: 'chart-donut',
      iconColor: '#328C92',
      iconBg: '#E3F2F3',
      label: 'Statistiques',
      onPress: () => navigation.navigate('Statistics'),
    },
  ];

  const visibleQuickActions =
    quickActionItems.filter(
      item =>
        spiritualMarkersEnabled ||
        (item.key !== 'prayer-times' &&
          item.key !== 'hijri-calendar' &&
          item.key !== 'qadaa'),
    );

  /* ================================================================
   * STAGE SWITCH
   * ================================================================ */

  const openStageModal = () => {
    setPendingStage(preferences.stage);
    setStageModalVisible(true);
  };

  const closeStageModal = () => {
    if (savingStage) {
      return;
    }

    setStageModalVisible(false);
  };

  const confirmStage = async () => {
    if (!pendingStage || savingStage) {
      return;
    }

    setSavingStage(true);

    try {
      await setMenopauseStage(pendingStage);

      setStageModalVisible(false);

      toast.show(
        'Étape mise à jour',
        STAGE_OPTIONS.find(option => option.id === pendingStage)
          ?.title ?? '',
      );
    } finally {
      setSavingStage(false);
    }
  };

  const currentStage =
    STAGE_OPTIONS.find(
      option => option.id === preferences.stage,
    ) ?? null;

  const currentStageLabel =
    currentStage?.title ?? 'Non renseignée';

  const currentStageSubtitle =
    currentStage?.subtitle ??
    'Adapte ton suivi à ton étape actuelle.';

  const currentStageIcon =
    currentStage?.icon ?? 'flower-outline';

  const currentStageTint =
    currentStage?.tint ?? '#EEE5FB';

  /* ================================================================
   * RENDER
   * ================================================================ */

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: getFloatingTabBarClearance(insets.bottom, 22)},
          ]}
          showsVerticalScrollIndicator={false}>
          <HomeHeader
            firstName={getFirstName()}
            onPressProfile={() => navigation.navigate('Profile')}
            subtitle="Ton suivi, en toute discrétion."
          />

          {/* =====================================================
              PREMIUM HERO
          ====================================================== */}

          <Animated.View
            style={[
              styles.heroAnimationContainer,
              {
                opacity: entranceOpacity,
                transform: [{translateY: entranceTranslateY}],
              },
            ]}>
            <LinearGradient
              colors={[
                theme.colors.surface,
                interpolateHex(theme.colors.surface, theme.colors.primarySoft, 0.5),
                theme.colors.primarySoft,
              ]}
              end={{x: 1, y: 1}}
              start={{x: 0, y: 0}}
              style={styles.heroCard}>
              <View style={styles.heroDecorCircleTop} />
              <View style={styles.heroDecorCircleBottom} />

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heroFloatingFlower,
                  {
                    transform: [
                      {translateY: decorativeTranslateY},
                      {scale: decorativeScale},
                    ],
                  },
                ]}>
                <MaterialDesignIcons
                  color={withAlpha(theme.colors.primary, 0.16)}
                  name="flower-outline"
                  size={82}
                />
              </Animated.View>

              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="weather-sunset"
                    size={14}
                  />

                  <Text
                    numberOfLines={1}
                    style={styles.heroEyebrow}>
                    {stageLabel}
                  </Text>
                </View>

                <View style={styles.heroTodayBadge}>
                  <View style={styles.heroTodayDot} />
                  <Text style={styles.heroTodayText}>
                    Aujourd’hui
                  </Text>
                </View>
              </View>

              <View style={styles.heroBody}>
                <View style={styles.heroCopy}>
                  <Text
                    style={[
                      styles.heroTitle,
                      compact && styles.heroTitleCompact,
                    ]}>
                    {heroStatusText}
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    {heroSupportingText}
                  </Text>

                  <View style={styles.heroMiniStatusRow}>
                    <View style={styles.heroMiniStatusIcon}>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name="heart-outline"
                        size={15}
                      />
                    </View>

                    <Text style={styles.heroMiniStatusText}>
                      Un suivi doux et personnel
                    </Text>
                  </View>
                </View>

                <PremiumProgressRing
                  completedCount={completedCount}
                  progress={progress}
                  styles={styles}
                  theme={theme}
                  totalCount={dailySections.length}
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* =====================================================
              MON ÉTAPE — PREMIUM CARD
          ====================================================== */}

          <Animated.View
            style={[
              styles.stageCardAnimation,
              {
                opacity: entranceOpacity,
                transform: [{translateY: entranceTranslateY}],
              },
            ]}>
            <LinearGradient
              colors={[
                theme.colors.surface,
                interpolateHex(theme.colors.surface, theme.colors.primarySoft, 0.3),
              ]}
              end={{x: 1, y: 1}}
              start={{x: 0, y: 0}}
              style={styles.stageCard}>
              <View style={styles.stageHeader}>
                <View>
                  <Text style={styles.stageEyebrow}>
                    MON ÉTAPE
                  </Text>

                  <Text style={styles.stageSectionTitle}>
                    Mon parcours
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Modifier mon étape"
                  accessibilityRole="button"
                  onPress={openStageModal}
                  style={({pressed}) => [
                    styles.stageEditButton,
                    pressed && styles.pressed,
                  ]}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="pencil-outline"
                    size={15}
                  />

                  <Text style={styles.stageEditText}>
                    Modifier
                  </Text>
                </Pressable>
              </View>

              <View style={styles.stageDivider} />

              <Pressable
                accessibilityLabel={`Étape actuelle : ${currentStageLabel}`}
                accessibilityRole="button"
                onPress={openStageModal}
                style={({pressed}) => [
                  styles.stageBody,
                  pressed && styles.stageBodyPressed,
                ]}>
                <View
                  style={[
                    styles.stageIconHalo,
                    // currentStageTint stays a fixed literal (see PHASE D8
                    // report — STAGE_OPTIONS.tint classification).
                    {backgroundColor: currentStageTint},
                  ]}>
                  <View style={styles.stageIconBox}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name={currentStageIcon}
                      size={25}
                    />
                  </View>
                </View>

                <View style={styles.flexOne}>
                  <Text style={styles.stageCurrentLabel}>
                    Étape actuelle
                  </Text>

                  <Text style={styles.stageValue}>
                    {currentStageLabel}
                  </Text>

                  <Text style={styles.stageHint}>
                    {currentStageSubtitle}
                  </Text>
                </View>

                <View style={styles.stageChevron}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="chevron-right"
                    size={21}
                  />
                </View>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* =====================================================
              SUIVI DU JOUR
              DESIGN CONSERVÉ
          ====================================================== */}

          <View style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <View style={styles.dailyTitleIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="clipboard-pulse-outline"
                  size={19}
                />
              </View>

              <View style={styles.flexOne}>
                <Text style={styles.dailyTitle}>
                  Suivi du jour
                </Text>

                <Text style={styles.dailySubtitle}>
                  Ton suivi périménopause / ménopause aujourd’hui
                </Text>
              </View>
            </View>

            <View style={styles.dailyStatsList}>
              <DailyRow
                completed={symptomsCount > 0}
                icon="clipboard-pulse-outline"
                label="Symptômes"
                onPress={() =>
                  navigation.navigate(
                    'MenopauseJournalEntry',
                    {category: 'symptoms'},
                  )
                }
                styles={styles}
                theme={theme}
                value={symptomsValue}
              />

              <DailyRow
                completed={Boolean(entry?.mood)}
                icon="heart-outline"
                label="Humeur"
                onPress={() =>
                  navigation.navigate(
                    'MenopauseJournalEntry',
                    {category: 'mood'},
                  )
                }
                styles={styles}
                theme={theme}
                value={moodValue}
              />

              <DailyRow
                completed={isMenopauseCategoryCompleted(
                  entry,
                  'sleep',
                )}
                icon="weather-night"
                label="Sommeil"
                onPress={() =>
                  navigation.navigate(
                    'MenopauseJournalEntry',
                    {category: 'sleep'},
                  )
                }
                styles={styles}
                theme={theme}
                value={sleepValue}
              />

              <DailyRow
                completed={Boolean(entry?.energyLevel)}
                icon="lightning-bolt-outline"
                label="Énergie / Fatigue"
                onPress={() =>
                  navigation.navigate(
                    'MenopauseJournalEntry',
                    {category: 'energy'},
                  )
                }
                styles={styles}
                theme={theme}
                value={energyValue}
              />

              {showTreatment ? (
                <DailyRow
                  completed={Boolean(
                    entry?.treatmentStatus,
                  )}
                  icon="pill"
                  label="Traitement hormonal"
                  onPress={() =>
                    navigation.navigate(
                      'MenopauseJournalEntry',
                      {category: 'treatment'},
                    )
                  }
                  styles={styles}
                  theme={theme}
                  value={treatmentValue}
                />
              ) : null}

              {showLab ? (
                <DailyRow
                  completed={Boolean(
                    latestFsh || latestEstradiol,
                  )}
                  icon="flask-outline"
                  label="Analyses"
                  onPress={() =>
                    navigation.navigate(
                      'MenopauseJournalEntry',
                      {category: 'labResults'},
                    )
                  }
                  styles={styles}
                  theme={theme}
                  value={
                    latestFsh || latestEstradiol
                      ? 'Résultats enregistrés'
                      : 'À renseigner'
                  }
                />
              ) : null}

              <DailyRow
                completed={hasNotesToday}
                icon="notebook-edit-outline"
                label="Notes du jour"
                onPress={() =>
                  navigation.navigate(
                    'MenopauseJournalEntry',
                    {category: 'notes'},
                  )
                }
                styles={styles}
                theme={theme}
                value={
                  hasNotesToday
                    ? 'Note ajoutée'
                    : 'Ajouter une note'
                }
              />
            </View>
          </View>

          {/* =====================================================
              ACTIONS RAPIDES
              DESIGN NON MODIFIÉ
          ====================================================== */}

          <QuickActionsGrid items={visibleQuickActions} />

          {/* =====================================================
              REPÈRE SPIRITUEL
              DESIGN NON MODIFIÉ
          ====================================================== */}

          {spiritualMarkersEnabled ? (
            <SpiritualGuidanceCard
              hijriDate={formatHijriDate(new Date())}
              locationConfigured={Boolean(location)}
              locationName={
                location
                  ? `${location.city}, ${location.country}`
                  : undefined
              }
              nextWindow={spiritual.nextWindow}
              objective="menopause"
              onManage={() =>
                navigation.navigate('SpiritualPreferences')
              }
              prayerError={spiritual.error}
              prayerLoading={spiritual.loading}
              timezone={spiritual.schedule?.timezone}
            />
          ) : null}

          {/* =====================================================
              POUR T'ACCOMPAGNER — contextual Library articles, same
              shared section/component as every other objective Dashboard.
          ====================================================== */}

          <ObjectiveArticlesSection
            objective="menopause"
            onOpenArticle={articleId => navigation.navigate('ArticleReader', {articleId})}
            onSeeAll={() => navigation.navigate('Library')}
          />
        </ScrollView>
      </SafeAreaView>

      {/* ===========================================================
          STAGE MODAL
      ============================================================ */}

      <Modal
        animationType="slide"
        onRequestClose={closeStageModal}
        transparent
        visible={stageModalVisible}>
        <Pressable
          accessibilityLabel="Fermer"
          onPress={closeStageModal}
          style={styles.modalBackdrop}>
          <Pressable
            onPress={event => event.stopPropagation()}
            style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeroIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="flower-outline"
                size={28}
              />
            </View>

            <Text style={styles.modalTitle}>
              Mon étape
            </Text>

            <Text style={styles.modalSubtitle}>
              Choisis la situation qui te correspond le plus aujourd’hui.
            </Text>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalOptionsList}>
                {STAGE_OPTIONS.map(option => {
                  const visual = resolveStageOptionVisual(option.tint, theme);
                  return (
                    <PremiumChoiceCard
                      icon={option.icon}
                      iconColor={visual.iconColor}
                      iconTint={visual.tint}
                      key={option.id}
                      onPress={() =>
                        setPendingStage(option.id)
                      }
                      selected={
                        pendingStage === option.id
                      }
                      subtitle={option.subtitle}
                      title={option.title}
                    />
                  );
                })}
              </View>
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  savingStage || !pendingStage,
              }}
              disabled={
                savingStage || !pendingStage
              }
              onPress={confirmStage}
              style={({pressed}) => [
                styles.modalConfirmButton,
                (!pendingStage || savingStage) &&
                  styles.modalConfirmButtonDisabled,
                pressed &&
                  pendingStage &&
                  styles.pressed,
              ]}>
              <Text style={styles.modalConfirmText}>
                {savingStage
                  ? 'Enregistrement…'
                  : 'Confirmer'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <JournalSaveToast
        animation={toast.animation}
        bottom={
          Math.max(insets.bottom, 16) + 16
        }
        message={toast.message}
        onDismiss={toast.hide}
        title={toast.title}
        visible={toast.visible}
      />
    </LinearGradient>
  );
}

/* ================================================================
 * STYLES
 * ================================================================ */

// PHASE D8 — converted to a createStyles(theme) factory, same pattern as
// every dashboard's main createStyles(theme) since D1. Structural/geometry
// values (dimensions, radii, offsets) are untouched; every decorative color
// below is now derived from the resolved theme. See PHASE D8 report for the
// full A/B/C/D/E color classification.
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Exact same canonical AWA page background decor as ProfileScreen —
  // reused verbatim (colors/locations already set on the LinearGradient
  // above; this is the 3-glow overlay), never a per-screen approximation.
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
    backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },
  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: withAlpha(theme.colors.primary, 0.045),
  },
  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: withAlpha(theme.colors.primary, 0.05),
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },

  flexOne: {
    flex: 1,
  },

  pressed: {
    opacity: 0.82,
  },

  /* ================================================================
   * HERO
   * ================================================================ */

  heroAnimationContainer: {
    marginTop: 16,
  },

  heroCard: {
    overflow: 'hidden',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 20,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),

    ...theme.shadow,
  },

  heroDecorCircleTop: {
    position: 'absolute',
    right: -34,
    top: -50,

    width: 154,
    height: 154,

    borderRadius: 77,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  heroDecorCircleBottom: {
    position: 'absolute',
    left: -58,
    bottom: -92,

    width: 170,
    height: 170,

    borderRadius: 85,

    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  heroFloatingFlower: {
    position: 'absolute',
    right: 68,
    bottom: -22,
  },

  heroTopRow: {
    zIndex: 2,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 13,
  },

  heroBadge: {
    maxWidth: '64%',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 10,
    minHeight: 31,

    borderRadius: 999,

    backgroundColor: withAlpha(theme.colors.primary, 0.09),
  },

  heroEyebrow: {
    flexShrink: 1,

    marginLeft: 5,

    color: theme.colors.primary,

    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.25,
  },

  heroTodayBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 9,
    minHeight: 29,

    borderRadius: 999,

    backgroundColor: withAlpha(theme.colors.surface, 0.78),
  },

  heroTodayDot: {
    width: 6,
    height: 6,

    marginRight: 5,

    borderRadius: 3,

    backgroundColor: theme.colors.success,
  },

  heroTodayText: {
    color: theme.colors.textSecondary,

    fontSize: 9.5,
    fontWeight: '700',
  },

  heroBody: {
    zIndex: 2,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroCopy: {
    flex: 1,

    marginRight: 8,
  },

  heroTitle: {
    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 28,
  },

  heroTitleCompact: {
    fontSize: 20,
    lineHeight: 25,
  },

  heroSubtitle: {
    maxWidth: 220,

    marginTop: 8,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 17,
  },

  heroMiniStatusRow: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 12,

    paddingHorizontal: 8,
    paddingVertical: 6,

    borderRadius: 12,

    backgroundColor: withAlpha(theme.colors.surface, 0.7),
  },

  heroMiniStatusIcon: {
    width: 22,
    height: 22,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 5,

    borderRadius: 8,

    backgroundColor: theme.colors.primarySoft,
  },

  heroMiniStatusText: {
    color: theme.colors.primary,

    fontSize: 9.5,
    fontWeight: '700',
  },

  /* ================================================================
   * PREMIUM RING
   * ================================================================ */

  ringArea: {
    width: 138,
    height: 138,

    alignItems: 'center',
    justifyContent: 'center',
  },

  ringGlow: {
    position: 'absolute',

    width: 115,
    height: 115,

    borderRadius: 58,

    backgroundColor: withAlpha(theme.colors.primary, 0.17),
  },

  ringOrbit: {
    position: 'absolute',

    width: 138,
    height: 138,
  },

  ringOrbitDotLarge: {
    position: 'absolute',

    top: 8,
    left: 61,

    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: theme.colors.surface,

    borderWidth: 2,
    borderColor: withAlpha(theme.colors.primary, 0.45),

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.22,
    shadowRadius: 4,

    elevation: 3,
  },

  ringOrbitDotSmall: {
    position: 'absolute',

    right: 10,
    bottom: 35,

    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: withAlpha(theme.colors.primary, 0.35),
  },

  ringShell: {
    width: RING_SIZE,
    height: RING_SIZE,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: RING_SIZE / 2,

    backgroundColor: withAlpha(theme.colors.surface, 0.66),

    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.13,
    shadowRadius: 12,

    elevation: 4,
  },

  ringInner: {
    position: 'absolute',

    alignItems: 'center',
    justifyContent: 'center',
  },

  ringIconBubble: {
    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 2,

    borderRadius: 10,

    backgroundColor: theme.colors.primarySoft,
  },

  ringCount: {
    color: theme.colors.accent,

    fontSize: 22,
    fontWeight: '800',
  },

  ringCountTotal: {
    color: theme.colors.primary,

    fontSize: 13,
    fontWeight: '700',
  },

  ringCaption: {
    marginTop: -1,

    color: theme.colors.textSecondary,

    fontSize: 8.5,
    fontWeight: '700',
  },

  /* ================================================================
   * MON ÉTAPE
   * ================================================================ */

  stageCardAnimation: {
    marginTop: 16,
  },

  stageCard: {
    overflow: 'hidden',

    borderRadius: 25,

    padding: 16,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),

    ...theme.shadow,
  },

  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stageEyebrow: {
    color: theme.colors.textSecondary,

    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  stageSectionTitle: {
    marginTop: 2,

    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },

  stageEditButton: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 36,

    paddingHorizontal: 11,

    borderRadius: 14,

    backgroundColor: theme.colors.primarySoft,
  },

  stageEditText: {
    marginLeft: 4,

    color: theme.colors.primary,

    fontSize: 10.5,
    fontWeight: '700',
  },

  stageDivider: {
    height: 1,

    marginTop: 13,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  stageBody: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 3,

    borderRadius: 18,
  },

  stageBodyPressed: {
    backgroundColor: theme.colors.surfaceSecondary,
  },

  stageIconHalo: {
    width: 55,
    height: 55,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,

    borderRadius: 20,
  },

  stageIconBox: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor: withAlpha(theme.colors.surface, 0.72),
  },

  stageCurrentLabel: {
    color: theme.colors.textSecondary,

    fontSize: 9.5,
    fontWeight: '600',
  },

  stageValue: {
    marginTop: 1,

    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },

  stageHint: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 10.5,
    lineHeight: 15,
  },

  stageChevron: {
    width: 32,
    height: 32,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 8,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  /* ================================================================
   * SUIVI DU JOUR
   * ORIGINAL DESIGN PRESERVED
   * ================================================================ */

  dailyCard: {
    marginTop: 16,

    borderRadius: 22,

    backgroundColor: theme.colors.surface,

    padding: 16,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.1),

    ...theme.shadow,
  },

  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dailyTitleIcon: {
    width: 34,
    height: 34,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: theme.colors.primarySoft,

    marginRight: 10,
  },

  dailyTitle: {
    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },

  dailySubtitle: {
    marginTop: 2,

    color: theme.colors.textSecondary,

    fontSize: 11,
  },

  dailyStatsList: {
    marginTop: 12,
    gap: 8,
  },

  dailyStatRow: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 54,

    paddingVertical: 6,
  },

  dailyStatIcon: {
    width: 36,
    height: 36,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    marginRight: 11,
  },

  dailyStatusPurple: {
    backgroundColor: theme.colors.primarySoft,
  },

  dailyStatusMuted: {
    backgroundColor: theme.colors.surfaceSecondary,
  },

  dailyStatTextGroup: {
    flex: 1,
    minWidth: 0,
  },

  dailyStatLabel: {
    color: theme.colors.accent,

    fontSize: 13,
    fontWeight: '600',
  },

  dailyStatValue: {
    marginTop: 2,

    // Generic "today's tracking is filled in" completion indicator, not a
    // symptom-severity claim — unified to theme.colors.success like every
    // other dashboard's equivalent "done" state (see PHASE D8 report).
    color: theme.colors.success,

    fontSize: 11.5,
    fontWeight: '600',
  },

  dailyValueMuted: {
    color: theme.colors.textSecondary,
  },

  /* ================================================================
   * MODAL
   * ================================================================ */

  modalBackdrop: {
    flex: 1,

    justifyContent: 'flex-end',

    // Fixed modal scrim — never themed, same precedent as every other
    // dashboard's modal backdrop (see PHASE D8 report).
    backgroundColor: 'rgba(40,22,111,0.38)',
  },

  modalSheet: {
    maxHeight: '84%',

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    backgroundColor: theme.colors.surface,

    paddingHorizontal: 20,
    paddingTop: 12,

    paddingBottom: 28,
  },

  modalHandle: {
    alignSelf: 'center',

    width: 42,
    height: 4,

    borderRadius: 2,

    backgroundColor: withAlpha(theme.colors.primary, 0.28),

    marginBottom: 14,
  },

  modalHeroIcon: {
    alignSelf: 'center',

    width: 52,
    height: 52,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor: theme.colors.primarySoft,

    marginBottom: 10,
  },

  modalTitle: {
    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',

    textAlign: 'center',
  },

  modalSubtitle: {
    marginTop: 6,

    color: theme.colors.textSecondary,

    fontSize: 12.5,
    lineHeight: 18,

    textAlign: 'center',
  },

  modalScrollContent: {
    paddingBottom: 4,
  },

  modalOptionsList: {
    marginTop: 18,
    gap: 11,
  },

  modalConfirmButton: {
    minHeight: 54,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 18,

    borderRadius: 18,

    backgroundColor: theme.colors.primary,

    ...theme.shadow,
  },

  modalConfirmButtonDisabled: {
    backgroundColor: withAlpha(theme.colors.primary, 0.35),

    shadowOpacity: 0,

    elevation: 0,
  },

  modalConfirmText: {
    color: onPrimaryTextColor(theme),

    fontSize: 16,
    fontWeight: '700',
  },
  });
}

export default MenopauseDashboard;