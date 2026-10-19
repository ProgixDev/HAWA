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
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';
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
import {useToday} from '../../hooks/useToday';
import {formatHijriDate} from '../../utils/cycleMath';

import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaText} from '../ui/AwaText';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';

const RING_SIZE = 126;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// i18n (Phase 3): STAGE_LABELS/STAGE_OPTIONS were module-level constants but
// need the live `t` from useTranslation(), so they're now small factory
// functions called from inside the component (same
// `xxxFor(t)`/`xxxLabels(t)` pattern as IrregularCalendarContent.tsx's own
// categoryLabelFor()/flowLabelsFor()). MenopauseStage's values
// (perimenopause/menopause/unsure) are the persisted enum — display text only.
function stageLabels(t: TFunction): Record<MenopauseStage, string> {
  return {
    perimenopause: t('menopauseDashboard.stageLabels.perimenopause'),
    menopause: t('menopauseDashboard.stageLabels.menopause'),
    unsure: t('menopauseDashboard.stageLabels.unsure'),
  };
}

function stageOptions(t: TFunction): Array<{
  id: MenopauseStage;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> {
  return [
    {
      id: 'perimenopause',
      title: t('menopauseDashboard.stageOptions.perimenopause.title'),
      subtitle: t('menopauseDashboard.stageOptions.perimenopause.subtitle'),
      icon: 'weather-sunset',
      tint: '#FDF0E4',
    },
    {
      id: 'menopause',
      title: t('menopauseDashboard.stageOptions.menopause.title'),
      subtitle: t('menopauseDashboard.stageOptions.menopause.subtitle'),
      icon: 'flower-outline',
      tint: '#E7F0E8',
    },
    {
      id: 'unsure',
      title: t('menopauseDashboard.stageOptions.unsure.title'),
      subtitle: t('menopauseDashboard.stageOptions.unsure.subtitle'),
      icon: 'help-circle-outline',
      tint: '#EFE7F4',
    },
  ];
}

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
  const {t} = useTranslation();
  const ringAnimation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    ringAnimation.stopAnimation();

    Animated.timing(ringAnimation, {
      toValue: progress,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, ringAnimation]);

  const dashOffset = ringAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const safeTotal = Math.max(totalCount, 1);

  return (
    <View style={styles.ringArea}>
      <View>
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
              {progress >= 1 ? t('menopauseDashboard.ring.complete') : t('menopauseDashboard.ring.today')}
            </Text>
          </View>
        </View>
      </View>
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
        <AwaText variant="labelMedium" style={styles.dailyStatLabel}>
          {label}
        </AwaText>

        <AwaText variant="bodyMedium" colorRole="onSurfaceVariant"
          style={[
            styles.dailyStatValue,
            !completed && styles.dailyValueMuted,
          ]}>
          {value}
        </AwaText>
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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;

  const {open: openJournal} = useJournalSheet();
  const insets = useSafeAreaInsets();
  const toast = useJournalSaveToast();

  // Local 'YYYY-MM-DD' of the current day, re-evaluated when the day changes /
  // the app returns to the foreground — see src/hooks/useToday.ts.
  const {todayKey: today} = useToday();

  const entranceAnimation = useRef(new Animated.Value(0)).current;

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
  }, [entranceAnimation]);

  const entranceOpacity = entranceAnimation;

  const entranceTranslateY = entranceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
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
      ? t('menopauseDashboard.hero.status.empty')
      : completedCount === dailySections.length
        ? t('menopauseDashboard.hero.status.complete')
        : t('menopauseDashboard.hero.status.partial');

  const heroSupportingText =
    completedCount === 0
      ? t('menopauseDashboard.hero.supporting.empty')
      : completedCount === dailySections.length
        ? t('menopauseDashboard.hero.supporting.complete')
        : t('menopauseDashboard.hero.supporting.partial', {count: completedCount});

  const stageLabel = preferences.stage
    ? stageLabels(t)[preferences.stage]
    : t('menopauseDashboard.stageDefaultBadge');

  /* ================================================================
   * JOURNAL VALUES
   * ================================================================ */

  const symptomsCount = entry?.symptoms?.length ?? 0;

  const toFillLabel = t('menopauseDashboard.daily.toFill');

  const symptomsValue =
    symptomsCount > 0
      ? t('menopauseDashboard.daily.symptomsRecorded', {count: symptomsCount})
      : toFillLabel;

  const moodValue = entry?.mood
    ? MENOPAUSE_MOOD_LABELS[entry.mood]
    : toFillLabel;

  const sleepValue =
    entry?.sleepDurationHours !== undefined
      ? `${entry.sleepDurationHours} h${
          entry.sleepQuality
            ? ` · ${MENOPAUSE_SLEEP_QUALITY_LABELS[entry.sleepQuality]}`
            : ''
        }`
      : entry?.sleepQuality
        ? MENOPAUSE_SLEEP_QUALITY_LABELS[entry.sleepQuality]
        : toFillLabel;

  const energyValue = entry?.energyLevel
    ? MENOPAUSE_ENERGY_LABELS[entry.energyLevel]
    : toFillLabel;

  const treatmentValue = entry?.treatmentStatus
    ? MENOPAUSE_TREATMENT_STATUS_LABELS[entry.treatmentStatus]
    : toFillLabel;

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
      label: t('cycleHome.quickActions.prayerTimes'),
      onPress: () => navigation.navigate('PrayerTimes'),
    },
    {
      key: 'library',
      icon: 'book-open-page-variant-outline',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: t('cycleHome.quickActions.library'),
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
      label: t('cycleHome.quickActions.dailyJournal'),
      onPress: openJournal,
    },
    {
      key: 'hijri-calendar',
      icon: 'moon-waning-crescent',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: t('cycleHome.quickActions.hijriCalendar'),
      onPress: () => navigation.navigate('HijriCalendar'),
    },
    {
      key: 'qadaa',
      icon: 'silverware-fork-knife',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: t('cycleHome.quickActions.qadaa'),
      onPress: () => navigation.navigate('FastingQadaa'),
    },
    {
      // Fixed cross-dashboard action-identity accent (Category E) — kept
      // literal like every other objective's "Statistiques" tile.
      key: 'statistics',
      icon: 'chart-donut',
      iconColor: '#328C92',
      iconBg: '#E3F2F3',
      label: t('cycleHome.quickActions.statistics'),
      onPress: () => navigation.navigate('Statistics'),
    },
  ];

  // Spiritual quick actions (prayer-times / hijri-calendar / qadaa) are hidden
  // by QuickActionsGrid itself from the canonical spiritual-markers preference
  // (state/quickActionsPreferences.ts) — no per-dashboard filter.

  /* ================================================================
   * STAGE SWITCH
   * ================================================================ */

  const resolvedStageOptions = stageOptions(t);

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
        t('menopauseDashboard.stageToast.title'),
        resolvedStageOptions.find(option => option.id === pendingStage)
          ?.title ?? '',
      );
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSavingStage(false);
    }
  };

  const currentStage =
    resolvedStageOptions.find(
      option => option.id === preferences.stage,
    ) ?? null;

  const currentStageLabel =
    currentStage?.title ?? t('menopauseDashboard.stageCard.unknownValue');

  const currentStageSubtitle =
    currentStage?.subtitle ??
    t('menopauseDashboard.stageCard.defaultHint');

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
            subtitle={t('menopauseDashboard.headerSubtitle')}
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
            <AwaCard padding="none" style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="weather-sunset"
                    size={14}
                  />

                  <AwaText variant="labelSmall" colorRole="primary"
                    numberOfLines={1}
                    style={styles.heroEyebrow}>
                    {stageLabel}
                  </AwaText>
                </View>

                <View style={styles.heroTodayBadge}>
                  <View style={styles.heroTodayDot} />
                  <Text style={styles.heroTodayText}>
                    {t('menopauseDashboard.hero.todayBadge')}
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

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.heroSubtitle}>
                    {heroSupportingText}
                  </AwaText>

                  <View style={styles.heroMiniStatusRow}>
                    <View style={styles.heroMiniStatusIcon}>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name="heart-outline"
                        size={15}
                      />
                    </View>

                    <AwaText variant="labelSmall" colorRole="primary">
                      {t('menopauseDashboard.hero.miniStatus')}
                    </AwaText>
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
            </AwaCard>
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
            <AwaCard padding="none" style={styles.stageCard} variant="filled">
              <View style={styles.stageHeader}>
                <View>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                    {t('menopauseDashboard.stageCard.eyebrow')}
                  </AwaText>

                  <AwaText variant="titleMedium" style={styles.stageSectionTitle}>
                    {t('menopauseDashboard.stageCard.title')}
                  </AwaText>
                </View>

                <AwaButton
                  accessibilityLabel={t('menopauseDashboard.stageCard.editAccessibility')}
                  icon="pencil-outline"
                  label={t('menopauseDashboard.stageCard.editLabel')}
                  onPress={openStageModal}
                  size="compact"
                  style={styles.stageEditButton}
                  variant="tonal"
                />
              </View>

              <View style={styles.stageDivider} />

              <Pressable
                accessibilityLabel={t('menopauseDashboard.stageCard.currentAccessibility', {stage: currentStageLabel})}
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
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                    {t('menopauseDashboard.stageCard.currentLabel')}
                  </AwaText>

                  <AwaText variant="titleMedium" style={styles.stageValue}>
                    {currentStageLabel}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.stageHint}>
                    {currentStageSubtitle}
                  </AwaText>
                </View>

                <View style={styles.stageChevron}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="chevron-right"
                    size={21}
                  />
                </View>
              </Pressable>
            </AwaCard>
          </Animated.View>

          {/* =====================================================
              SUIVI DU JOUR
              DESIGN CONSERVÉ
          ====================================================== */}

          <AwaCard style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <View style={styles.dailyTitleIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="clipboard-pulse-outline"
                  size={19}
                />
              </View>

              <View style={styles.flexOne}>
                <AwaText variant="titleMedium" style={styles.dailyTitle}>
                  {t('menopauseDashboard.daily.title')}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.dailySubtitle}>
                  {t('menopauseDashboard.daily.subtitle')}
                </AwaText>
              </View>
            </View>

            <View style={styles.dailyStatsList}>
              <DailyRow
                completed={symptomsCount > 0}
                icon="clipboard-pulse-outline"
                label={t('menopauseDashboard.daily.labels.symptoms')}
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
                label={t('menopauseDashboard.daily.labels.mood')}
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
                label={t('menopauseDashboard.daily.labels.sleep')}
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
                label={t('menopauseDashboard.daily.labels.energy')}
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
                  label={t('menopauseDashboard.daily.labels.treatment')}
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
                  label={t('menopauseDashboard.daily.labels.labResults')}
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
                      ? t('menopauseDashboard.daily.labRecorded')
                      : toFillLabel
                  }
                />
              ) : null}

              <DailyRow
                completed={hasNotesToday}
                icon="notebook-edit-outline"
                label={t('menopauseDashboard.daily.labels.notes')}
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
                    ? t('menopauseDashboard.daily.noteAdded')
                    : t('menopauseDashboard.daily.addNote')
                }
              />
            </View>
          </AwaCard>

          {/* =====================================================
              ACTIONS RAPIDES
              DESIGN NON MODIFIÉ
          ====================================================== */}

          <QuickActionsGrid items={quickActionItems} />

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
          accessibilityLabel={t('menopauseDashboard.stageModal.closeAccessibility')}
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

            <AwaText variant="headlineSmall" style={styles.modalTitle}>
              {t('menopauseDashboard.stageModal.title')}
            </AwaText>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.modalSubtitle}>
              {t('menopauseDashboard.stageModal.subtitle')}
            </AwaText>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalOptionsList}>
                {resolvedStageOptions.map(option => {
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

            <AwaButton
              disabled={
                savingStage || !pendingStage
              }
              fullWidth
              label={savingStage
                ? t('menopauseDashboard.stageModal.saving')
                : t('menopauseDashboard.stageModal.confirm')}
              onPress={confirmStage}
              size="large"
              style={styles.modalConfirmButton}
            />
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
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 20,
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

  heroEyebrow: {flexShrink: 1, marginLeft: 5},

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

    fontSize: 11,
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

  heroSubtitle: {maxWidth: 220, marginTop: 8},

  heroMiniStatusRow: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 12,

    paddingHorizontal: 12,
    paddingVertical: 8,

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


  /* ================================================================
   * PREMIUM RING
   * ================================================================ */

  ringArea: {
    width: 138,
    height: 138,

    alignItems: 'center',
    justifyContent: 'center',
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

    borderRadius: 12,

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

    fontSize: 11,
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

    padding: 16,
  },

  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  stageSectionTitle: {marginTop: 2, color: theme.colors.accent},

  stageEditButton: {
    flexShrink: 1,
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

    borderRadius: 12,
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

    borderRadius: 12,
  },

  stageIconBox: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 16,

    backgroundColor: withAlpha(theme.colors.surface, 0.72),
  },


  stageValue: {marginTop: 1, color: theme.colors.accent},

  stageHint: {marginTop: 3},

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

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,

    marginRight: 10,
  },

  dailyTitle: {color: theme.colors.accent},

  dailySubtitle: {marginTop: 2},

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

    borderRadius: 12,

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

  dailyStatLabel: {color: theme.colors.accent},

  dailyStatValue: {
    marginTop: 2,

    // Generic "today's tracking is filled in" completion indicator, not a
    // symptom-severity claim — unified to theme.colors.success like every
    // other dashboard's equivalent "done" state (see PHASE D8 report).
    color: theme.colors.success,

    fontSize: 11.5,
    fontWeight: '600',
  },

  dailyValueMuted: {},

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

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

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

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,

    marginBottom: 10,
  },

  modalTitle: {color: theme.colors.accent, textAlign: 'center'},

  modalSubtitle: {marginTop: 6, textAlign: 'center'},

  modalScrollContent: {
    paddingBottom: 4,
  },

  modalOptionsList: {
    marginTop: 18,
    gap: 11,
  },

  modalConfirmButton: {
    marginTop: 18,
  },

  });
}

export default MenopauseDashboard;