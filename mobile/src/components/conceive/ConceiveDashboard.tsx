import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Defs, LinearGradient as SvgGradient, Stop} from 'react-native-svg';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import type {CyclePhase} from '../home/CycleStatusCard';
import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {type QuickActionItem} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import DailyJournalCard, {type Shortcut} from '../home/DailyJournalCard';
import {homeColors, homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {interpolateHex, onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import {usePrayerPurityStatus} from '../../hooks/usePrayerPurityStatus';
import {useQadaaStatus} from '../../hooks/useQadaaStatus';
import {
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleData,
  getPeriodHistory,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
  getFirstName,
  getSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';
import {getJournalEntry} from '../../state/dailyJournalStore';
import {withResolvedIntimacyForDisplay} from '../../services/privateJournalEncryption';
import type {DailyJournalEntry} from '../../types/journal';
import {loadPersonalInformation} from '../../state/personalInformationStore';
import {CONCEPTION_JOURNAL_ITEMS} from '../../config/conceptionJournalConfig';
import {syncConceptionReminders} from '../../utils/conceptionReminderScheduling';
import {getLibraryConfigForObjective} from '../../data/libraryObjectiveConfig';
import {LIBRARY_ARTICLES, type LibraryArticle} from '../../data/libraryContent';
import {getFloatingTabBarClearance, TOP_SPACING_EXTRA} from '../../theme/spacing';
import {
  computeCyclePredictionStatus,
  cycleDayFor,
  diffDays,
  formatDateRange,
  formatHijriDate,
  formatShortDate,
  ovulationDayFor,
  phaseFor,
  startOfDay,
} from '../../utils/cycleMath';

// "Essayer de concevoir" Dashboard, redesigned to match an approved visual
// mockup (fertility ring hero + phase timeline + 2x2 cycle summary grid).
// TTC is still a cycle-based objective sharing onboardingPreferences' cycle
// store and cycleMath.ts with CycleHomeScreen.tsx — every date/phase/
// prediction computation below mirrors that screen exactly, just rendered
// in this mockup's layout. QuickActionsGrid/SpiritualGuidanceCard are the
// existing shared components, reused unmodified (their menu-dot/personalize
// and purity/prayer behavior stays intact even though this mockup's quick
// actions row is drawn without that chrome, since dropping that real,
// already-shipped feature to match one screenshot pixel-for-pixel wasn't
// worth the regression).
//
// Real tracking added for this task: cervical mucus and LH tests now have
// their own DailyJournalEntry fields + entry screens (JournalCervicalMucusScreen
// / JournalLHTestScreen, registered as CervicalMucusEntry / LHTestEntry) —
// previously neither existed anywhere in the project.

// PHASE D4 — SEMANTIC fertility-phase identity colors, never theme-driven
// (PERIOD/OVULATION match Cycle D1's own protected constants exactly;
// FERTILE_COLOR matches HeroCycleCard's fertile ringColor; LUTEAL_COLOR is
// this file's own pre-existing value, a known cross-objective inconsistency
// with Cycle's luteal tint, documented — not fixed — same as D1's own
// dual-ovulation-purple finding). PURPLE/TRACK_COLOR used to be fixed
// literals here; they are now derived from useAwaTheme() inside
// ConceiveDashboard() (and re-derived identically inside createStyles(theme)
// and passed into FertilityRing as props, since it's a sibling top-level
// component that can no longer close over module-scope values).
const PERIOD = '#DC7B82';
const OVULATION = '#4E319A';
const FERTILE_COLOR = '#8B6FD1';
const LUTEAL_COLOR = '#D8CDEE';

type Props = MainTabScreenProps<'CycleHome'>;

const HERO_STATUS: Record<CyclePhase, {badge: string; title: string; description: string}> = {
  menstruation: {badge: 'RÈGLES', title: 'Cycle en cours', description: 'Un temps pour te reposer avant la suite de ton cycle.'},
  follicular: {badge: 'PHASE FOLLICULAIRE', title: 'Fertilité en hausse', description: 'Ton corps se prépare, continue ton suivi quotidien.'},
  fertile: {badge: 'FENÊTRE FERTILE', title: 'Fertilité élevée', description: 'Aujourd’hui tu es dans ta période la plus fertile.'},
  ovulation: {badge: 'OVULATION', title: 'Ovulation aujourd’hui', description: 'Ton ovulation est estimée aujourd’hui.'},
  luteal: {badge: 'APRÈS OVULATION', title: 'Phase lutéale', description: 'Ta fenêtre fertile est passée pour ce cycle.'},
  pregnancy: {badge: '', title: '', description: ''},
  postpartum: {badge: '', title: '', description: ''},
};

const ADVICE_BY_PHASE: Record<CyclePhase, string> = {
  menstruation: 'Profite de ce moment pour prendre soin de toi avant la suite de ton cycle.',
  follicular: 'Continue ton suivi quotidien, ta fenêtre fertile approche.',
  fertile: 'C’est le bon moment pour maximiser tes chances, prends soin de toi et reste à l’écoute de ton corps.',
  ovulation: 'Un test LH aujourd’hui peut t’aider à confirmer ce pic.',
  luteal: 'En attendant tes prochaines règles, prends soin de toi.',
  pregnancy: '',
  postpartum: '',
};

// "Suivi du jour" — same DailyJournalCard component/design CycleHomeScreen
// uses (progress bar, completed/total counter, checkmark-when-done icon
// grid), fed from CONCEPTION_JOURNAL_ITEMS — the SAME config the TTC
// "Journal quotidien" sheet uses (see MainTabNavigator's JournalSheetHost),
// so the two entry points can never drift onto different category sets.
const CONCEIVE_SHORTCUTS: Shortcut[] = CONCEPTION_JOURNAL_ITEMS.map(item => ({
  section: item.section,
  route: item.route,
  icon: item.icon,
  label: item.label,
  subtitle: item.subtitle,
}));

const RING_SIZE = 128;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function FertilityRing({
  day,
  cycleLength,
  progress,
  theme,
  styles,
}: {
  day: number;
  cycleLength: number;
  progress: number;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const centerAnim = useRef(new Animated.Value(0)).current;

  const clamped = Math.min(Math.max(progress, 0), 1);
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // Decorative pink-to-purple ring gradient — approximates the original
  // fixed spectrum (#E06B9F -> PURPLE) using this theme's own secondary
  // (its "pink" role for awa-original, homeColors.pink) -> primary pair, the
  // same interpolateHex(...) technique AnimatedProgressRing's own D2
  // migration already established for an equivalent multi-stop SVG arc.
  const gradientStops = useMemo(
    () => [
      interpolateHex(theme.colors.secondary, theme.colors.primary, 0),
      interpolateHex(theme.colors.secondary, theme.colors.primary, 0.34),
      interpolateHex(theme.colors.secondary, theme.colors.primary, 0.68),
      theme.colors.primary,
    ],
    [theme],
  );

  useEffect(() => {
    progressAnim.setValue(0);
    centerAnim.setValue(0);

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: clamped,
        duration: 1250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(centerAnim, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    breathe.start();
    rotate.start();

    return () => {
      breathe.stop();
      rotate.stop();
    };
  }, [breatheAnim, centerAnim, clamped, progressAnim, rotateAnim]);

  const animatedDashOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.10, 0.24],
  });

  const outerRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const centerScale = centerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const centerOpacity = centerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.ringWrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ringOuterHalo,
          {
            opacity: breatheOpacity,
            transform: [
              {scale: breatheScale},
              {rotate: outerRotate},
            ],
          },
        ]}>
        <View style={styles.ringHaloDot} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ringGlow,
          {
            opacity: breatheOpacity,
            transform: [{scale: breatheScale}],
          },
        ]}
      />

      <Svg height={RING_SIZE} width={RING_SIZE}>
        <Defs>
          <SvgGradient id="fertilityRingGradient" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={gradientStops[0]} />
            <Stop offset="0.34" stopColor={gradientStops[1]} />
            <Stop offset="0.68" stopColor={gradientStops[2]} />
            <Stop offset="1" stopColor={gradientStops[3]} />
          </SvgGradient>
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
          stroke="url(#fertilityRingGradient)"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={animatedDashOffset}
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ringCenter,
          {
            opacity: centerOpacity,
            transform: [{scale: centerScale}],
          },
        ]}>
        <Text style={styles.ringEyebrow}>Jour</Text>
        <Text style={styles.ringDay}>{day}</Text>
        <View style={styles.ringCyclePill}>
          <Text style={styles.ringSubtitle}>Cycle {cycleLength} jours</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const ARTICLE_IMAGES: Record<string, ReturnType<typeof require>> = {
  fertility: require('../../assets/images/library/category-fertility.png'),
  ovulation: require('../../assets/images/library/category-fertility.png'),
  basalTemperature: require('../../assets/images/library/category-hormonal.png'),
  cervicalMucus: require('../../assets/images/library/flow-texture-mucus.png'),
  lhTests: require('../../assets/images/library/category-hormonal.png'),
};

function ConceiveDashboard({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [initial, setCyclePreferencesState] = useState(getCyclePreferences);
  const [hasConfirmedCycleData, setHasConfirmedCycleData] = useState(getHasConfirmedCycleData);
  const {open: openJournal} = useJournalSheet();

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // PHASE D4 — decorative-brand-purple identifiers, now theme-derived (see
  // the module-level comment above where these used to be fixed literals).
  // PERIOD/OVULATION/FERTILE_COLOR/LUTEAL_COLOR (fertility-phase semantics)
  // stay fixed module consts, untouched.
  const PURPLE = theme.colors.primary;
  const TRACK_COLOR = theme.colors.primarySoft;

  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | undefined>(undefined);
  const [, setProfileRevision] = useState(0);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  const entrance = useRef(new Animated.Value(0)).current;

  const today = useMemo(() => startOfDay(new Date()), []);

  const prayer = usePrayerPurityStatus(spiritualMarkersEnabled);
  const qadaa = useQadaaStatus();

  useEffect(() => {
    Animated.timing(entrance, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    let mounted = true;
    hydrateCyclePreferences().then(value => {
      if (mounted) {
        setCyclePreferencesState(value);
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    const unsubscribe = subscribeCyclePreferences(() => {
      if (mounted) {
        setCyclePreferencesState(getCyclePreferences());
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    return () => {mounted = false; unsubscribe();};
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(() => {
        if (mounted) {setProfileRevision(current => current + 1);}
      });
      getJournalEntry(new Date().toLocaleDateString('en-CA'))
        .then(withResolvedIntimacyForDisplay)
        .then(entry => {
          if (mounted) {setJournalEntry(entry);}
        });
      // Keeps the cycle-relative TTC reminders (fertile window/ovulation/LH)
      // pointed at the correct upcoming date as cycles roll over — this is
      // the most-visited TTC screen, so refreshing here on every focus keeps
      // them from lagging behind between the rarer boot/preference-change
      // syncs already wired in App.tsx.
      syncConceptionReminders();
      return () => {mounted = false;};
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  const ovulationDay = ovulationDayFor(initial.cycleDuration);

  const periodStartDates = getPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  const predictionStatus = computeCyclePredictionStatus(initial, initial.regularity, periodStartDates, getCycleObservationStartedAt(), today);

  const rawCycleDay = diffDays(today, initial.lastPeriodStart) + 1;
  const isReliablyMenstruating = rawCycleDay <= initial.periodDuration;
  const currentCycleDay = predictionStatus.mode === 'exact'
    ? cycleDayFor(today, {...initial, cycleDuration: predictionStatus.averageCycleLength})
    : rawCycleDay;
  const currentPhase: CyclePhase = (() => {
    if (predictionStatus.mode === 'exact') {
      return phaseFor(today, {...initial, cycleDuration: predictionStatus.averageCycleLength});
    }
    if (isReliablyMenstruating) {return 'menstruation';}
    const wrappedPhase = phaseFor(today, initial);
    return wrappedPhase === 'menstruation' ? 'follicular' : wrappedPhase;
  })();

  const nextPeriodTile = (() => {
    if (predictionStatus.mode === 'exact') {
      const daysUntil = Math.max(0, diffDays(predictionStatus.date, today));
      return {value: formatShortDate(predictionStatus.date), subtitle: `Dans ${daysUntil} jours`};
    }
    if (predictionStatus.mode === 'window') {
      if (predictionStatus.isLate) {
        return {value: 'Règles en retard', subtitle: `Fenêtre : ${formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd)}`};
      }
      const daysUntilStart = diffDays(predictionStatus.windowStart, today);
      return {
        value: formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd),
        subtitle: daysUntilStart > 0 ? `Dans ${daysUntilStart} jours` : 'Fenêtre estimée en cours',
      };
    }
    return predictionStatus.complete
      ? {value: 'Observation en cours', subtitle: 'Données à compléter'}
      : {value: `Mois ${predictionStatus.monthsElapsed} sur ${predictionStatus.totalMonths}`, subtitle: 'Observation du cycle'};
  })();

  const fertileStartDay = Math.max(1, ovulationDay - 5);
  const fertileEndDay = ovulationDay + 1;
  // Proportional timeline segments (real day counts, not stylized equal
  // widths) — menstruation / an unlabeled follicular gap / fertile
  // (ovulation day falls inside it) / luteal.
  const cycleLength = Math.max(initial.cycleDuration, fertileEndDay + 1);
  const follicularGapDays = Math.max(0, fertileStartDay - initial.periodDuration - 1);
  const lutealDays = Math.max(1, cycleLength - fertileEndDay);
  const ringProgress = currentCycleDay / Math.max(cycleLength, 1);
  const puckLeft: `${number}%` = `${Math.min(96, Math.max(2, ringProgress * 100))}%`;

  // Actions rapides — same shared QuickActionsGrid component CycleHomeScreen/
  // PregnancyDashboard/PostpartumDashboard already use (identical design,
  // 2-column grid, "Personnaliser" reorder system, long-press, persistence
  // via quickActionsPreferences.ts — nothing TTC-specific invented here).
  // Real routes only, exact icon/color copied from CycleHomeScreen's own
  // array so the same action looks identical across every objective.
  //
  // Deliberately NOT included here: Température basale/Glaire cervicale/
  // Test LH/Rapports. Those four keep working exactly as before — they live
  // in "Suivi du jour" (CONCEIVE_SHORTCUTS below) and are reachable via
  // "Journal quotidien" here, same as every other objective's full tracking
  // set is reached through its own journal entry point rather than
  // duplicated as separate quick-action cards. "Évolution du cycle" is
  // calculated/read-only, not a daily-tracking item, so it isn't part of
  // either list — it has its own dedicated card (see below, just above
  // "Suivi du jour").
  const quickActionItems: QuickActionItem[] = [
    {key: 'prayer-times', icon: 'mosque', iconColor: PURPLE, iconBg: theme.colors.primarySoft, label: 'Horaires\nde prière', onPress: () => navigation.navigate('PrayerTimes')},
    {key: 'library', icon: 'book-open-page-variant-outline', iconColor: PURPLE, iconBg: theme.colors.primarySoft, label: 'Bibliothèque', onPress: () => navigation.navigate('Library')},
    // Category E (fixed action-identity accent, same as Cycle D1,
    // Contraception D2, Irregular D3 — never theme-driven).
    {key: 'daily-journal', icon: 'notebook-edit-outline', iconColor: '#B23F63', iconBg: '#F9DCE8', label: 'Journal\nquotidien', onPress: openJournal},
    {key: 'hijri-calendar', icon: 'moon-waning-crescent', iconColor: PURPLE, iconBg: theme.colors.primarySoft, label: 'Calendrier Hijri', onPress: () => navigation.navigate('HijriCalendar')},
    {key: 'qadaa', icon: 'silverware-fork-knife', iconColor: PURPLE, iconBg: theme.colors.primarySoft, label: 'Jeûnes à rattraper', onPress: () => navigation.navigate('FastingQadaa')},
    // Category E (fixed action-identity accent, same as Cycle D1,
    // Contraception D2, Irregular D3 — never theme-driven).
    {key: 'statistics', icon: 'chart-donut', iconColor: '#2C8E93', iconBg: '#DDF0F1', label: 'Statistiques', onPress: () => navigation.navigate('Statistics')},
  ];

  // Real, existing library articles for the 'conceive' objective — same
  // data/route ArticleReader already uses elsewhere.
  const articles = useMemo(() => {
    const recommendedIds = getLibraryConfigForObjective('conceive').recommendedArticleIds;
    const byId = new Map(LIBRARY_ARTICLES.map(article => [article.id, article]));
    return recommendedIds
      .map(id => byId.get(id))
      .filter((article): article is LibraryArticle => Boolean(article));
  }, []);

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  const heroStatus = HERO_STATUS[currentPhase];
  const advice = ADVICE_BY_PHASE[currentPhase];

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
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
          contentContainerStyle={[styles.scrollContent, {paddingBottom: getFloatingTabBarClearance(insets.bottom, 22)}]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={animatedStyle}>
            <HomeHeader
              firstName={getFirstName()}
              onPressProfile={() => navigation.navigate('Profile')}
              subtitle="En chemin vers ton rêve ✨"
            />
          </Animated.View>

          <View style={styles.heroCard}>
            {hasConfirmedCycleData ? (
              <>
                <View style={styles.heroTopRow}>
                  <FertilityRing cycleLength={cycleLength} day={currentCycleDay} progress={ringProgress} styles={styles} theme={theme} />

                  <View style={styles.heroCopy}>
                    <View style={styles.heroBadgeRow}>
                      {heroStatus.badge ? (
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>{heroStatus.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.heroTitle}>{heroStatus.title}</Text>
                    <Text style={styles.heroDescription}>{heroStatus.description}</Text>
                  </View>
                </View>

                <View style={styles.timelineWrap}>
                  <View style={styles.timelineTrack}>
                    <View style={[styles.timelineSegment, {flex: initial.periodDuration, backgroundColor: PERIOD}]} />
                    {follicularGapDays > 0 ? (
                      <View style={[styles.timelineSegment, {flex: follicularGapDays, backgroundColor: TRACK_COLOR}]} />
                    ) : null}
                    <View style={[styles.timelineSegment, {flex: fertileEndDay - fertileStartDay + 1, backgroundColor: FERTILE_COLOR}]} />
                    <View style={[styles.timelineSegment, {flex: lutealDays, backgroundColor: LUTEAL_COLOR}]} />
                    <View style={[styles.timelinePuck, {left: puckLeft}]} />
                  </View>

                  <View style={styles.timelineLegend}>
                    <View style={styles.timelineLegendItem}>
                      <View style={[styles.timelineDot, {backgroundColor: PERIOD}]} />
                      <Text style={styles.timelineLegendLabel}>Règles</Text>
                      <Text style={styles.timelineLegendValue}>J1-{initial.periodDuration}</Text>
                    </View>
                    <View style={styles.timelineLegendItem}>
                      <View style={[styles.timelineDot, {backgroundColor: FERTILE_COLOR}]} />
                      <Text style={styles.timelineLegendLabel}>Fertile</Text>
                      <Text style={styles.timelineLegendValue}>J{fertileStartDay}-{fertileEndDay}</Text>
                    </View>
                    <View style={styles.timelineLegendItem}>
                      <View style={[styles.timelineDot, {backgroundColor: OVULATION}]} />
                      <Text style={styles.timelineLegendLabel}>Ovulation</Text>
                      <Text style={styles.timelineLegendValue}>J{ovulationDay}</Text>
                    </View>
                    <View style={styles.timelineLegendItem}>
                      <View style={[styles.timelineDot, {backgroundColor: LUTEAL_COLOR}]} />
                      <Text style={styles.timelineLegendLabel}>Lutéale</Text>
                      <Text style={styles.timelineLegendValue}>J{fertileEndDay + 1}-{cycleLength}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroFooterRow}>
                  <View style={styles.heroFooterCopy}>
                    <Text style={styles.heroFooterLabel}>Prochaines règles prévues</Text>
                    <Text style={styles.heroFooterValue}>{nextPeriodTile.value}</Text>
                    <Text style={styles.heroFooterSubtitle}>{nextPeriodTile.subtitle}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Voir le calendrier"
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('Calendar')}
                    style={({pressed}) => [styles.calendarCta, pressed && styles.calendarCtaPressed]}>
                    <MaterialDesignIcons color={PURPLE} name="calendar-month-outline" size={16} />
                    <Text style={styles.calendarCtaText}>Voir le calendrier</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              // Honest insufficient-data state — AWA must never present the
              // internal cyclePreferences fallback (28-day cycle, "5 days
              // ago" last period) as a personalized fertile
              // window/ovulation/phase. Shown until CycleInformationScreen
              // is completed, reusing this same card's background/shadow.
              <View style={styles.insufficientDataWrap}>
                <View style={styles.insufficientDataIcon}>
                  <MaterialDesignIcons color={PURPLE} name="calendar-alert-outline" size={24} />
                </View>
                <Text style={styles.insufficientDataTitle}>Configure ton cycle</Text>
                <Text style={styles.insufficientDataText}>
                  Quelques informations sont nécessaires pour estimer ta fenêtre fertile.
                </Text>
                <Pressable
                  accessibilityLabel="Configurer mon cycle"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('CycleInformation', {fromDashboardCTA: true})}
                  style={({pressed}) => [styles.insufficientDataCta, pressed && styles.calendarCtaPressed]}>
                  <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="calendar-edit" size={16} />
                  <Text style={styles.insufficientDataCtaText}>Configurer mon cycle</Text>
                </Pressable>
              </View>
            )}
          </View>

          <QuickActionsGrid items={quickActionItems} />

          {/* "Évolution du cycle" is calculated/read-only (cycle day, phase,
              fertile window, ovulation, next period — all from cycleMath.ts,
              the same computations feeding the hero card above), never a
              manual journal entry, so it gets its own dashboard entry point
              here instead of living inside "Suivi du jour" alongside the
              4 real daily-tracking items. */}
          <Pressable
            accessibilityLabel="Voir l’évolution du cycle"
            accessibilityRole="button"
            onPress={() => navigation.navigate('CycleEvolutionEntry')}
            style={({pressed}) => [styles.evolutionCard, pressed && styles.pressed]}>
            <View style={styles.evolutionIcon}>
              <MaterialDesignIcons color={PURPLE} name="chart-donut" size={22} />
            </View>
            <View style={styles.evolutionCopy}>
              <Text style={styles.evolutionTitle}>Évolution du cycle</Text>
              <Text style={styles.evolutionSubtitle}>
                {hasConfirmedCycleData ? `Jour ${currentCycleDay} · ${heroStatus.title}` : 'Configure ton cycle pour la voir'}
              </Text>
            </View>
            <MaterialDesignIcons color={PURPLE} name="chevron-right" size={20} />
          </Pressable>

          <DailyJournalCard
            entry={journalEntry}
            onNavigate={route => navigation.navigate(route)}
            shortcuts={CONCEIVE_SHORTCUTS}
            title="Suivi du jour"
          />

          {advice && hasConfirmedCycleData ? (
            <View style={styles.adviceCard}>
              <View style={styles.adviceIcon}>
                <Text style={styles.adviceEmoji}>🌸</Text>
              </View>
              <View style={styles.adviceCopy}>
                <Text style={styles.adviceTitle}>Conseils pour aujourd’hui</Text>
                <Text style={styles.adviceSubtitle}>{heroStatus.title}</Text>
                <Text style={styles.adviceText}>{advice}</Text>
              </View>
              <MaterialDesignIcons color={PURPLE} name="chevron-right" size={20} />
            </View>
          ) : null}

          {spiritualMarkersEnabled ? (
            <SpiritualGuidanceCard
              hijriDate={formatHijriDate(today)}
              isMenstruating={prayer.isMenstruating}
              locationConfigured={Boolean(prayer.selectedLocation)}
              locationName={prayer.selectedLocation ? `${prayer.selectedLocation.city}, ${prayer.selectedLocation.country}` : undefined}
              nextWindow={prayer.nextWindow}
              onManage={() => navigation.navigate('SpiritualPreferences')}
              onPressPuritySummary={() => navigation.navigate('PrayerTimes')}
              periodEndDateTime={prayer.periodEndDateTime}
              prayerError={prayer.error}
              prayerLoading={prayer.loading}
              purityResult={prayer.purityResult}
              qadaaDays={qadaa.remainingQadaaDays ?? 0}
              timezone={prayer.schedule?.timezone}
            />
          ) : null}

          <View style={styles.articlesCard}>
            <View style={styles.articlesHeader}>
              <Text style={styles.articlesTitle}>Pour t’accompagner</Text>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => navigation.navigate('Library')}>
                <Text style={styles.articlesSeeAll}>Voir tout</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.articlesRow}>
              {articles.map(article => (
                <Pressable
                  accessibilityLabel={article.title}
                  accessibilityRole="button"
                  key={article.id}
                  onPress={() => navigation.navigate('ArticleReader', {articleId: article.id})}
                  style={({pressed}) => [styles.articleTile, pressed && styles.pressed]}>
                  <Image resizeMode="cover" source={ARTICLE_IMAGES[article.categoryId] ?? ARTICLE_IMAGES.fertility} style={styles.articleImage} />
                  <Text numberOfLines={2} style={styles.articleTileTitle}>{article.title}</Text>
                  <View style={styles.articleTileMetaRow}>
                    <MaterialDesignIcons color={theme.colors.textSecondary} name="book-outline" size={12} />
                    <Text style={styles.articleTileMeta}>{article.durationMinutes} min de lecture</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// PHASE D4 — converted to a createStyles(theme) factory, same pattern as
// CycleHomeScreen.tsx (D1), ContraceptionDashboard.tsx (D2) and
// IrregularDashboard.tsx (D3). PURPLE/TRACK_COLOR are re-derived here
// exactly as in the component body above, so every style below keeps
// working unchanged by name. adviceCard/adviceIcon/adviceTitle/
// adviceSubtitle/adviceText are the one deliberate exception — see their
// own comment below.
function createStyles(theme: ResolvedAwaTheme) {
  const PURPLE = theme.colors.primary;

  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},

  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {position: 'absolute', top: -150, right: -110, width: 330, height: 330, borderRadius: 165, backgroundColor: withAlpha(theme.colors.primary, 0.07)},
  pageGlowMiddle: {position: 'absolute', top: '38%', left: -130, width: 260, height: 260, borderRadius: 130, backgroundColor: withAlpha(theme.colors.primary, 0.045)},
  pageGlowBottom: {position: 'absolute', bottom: -150, right: -100, width: 310, height: 310, borderRadius: 155, backgroundColor: withAlpha(theme.colors.primary, 0.05)},

  safeArea: {flex: 1, backgroundColor: 'transparent'},

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 22,
  },

  heroCard: {
    marginTop: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.09),
    borderRadius: 30,
    backgroundColor: withAlpha(theme.colors.surface, 0.985),
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 17,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 9},
    shadowOpacity: 0.13,
    shadowRadius: 22,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 136,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuterHalo: {
    position: 'absolute',
    width: RING_SIZE + 12,
    height: RING_SIZE + 12,
    borderRadius: (RING_SIZE + 12) / 2,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.18),
  },
  ringHaloDot: {
    position: 'absolute',
    top: 1,
    left: '50%',
    width: 7,
    height: 7,
    marginLeft: -3.5,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE - 8,
    height: RING_SIZE - 8,
    borderRadius: (RING_SIZE - 8) / 2,
    backgroundColor: theme.colors.primary,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ringDay: {
    marginTop: 1,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 41,
  },
  ringCyclePill: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ringSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '600',
  },

  heroCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  // Decorative status pill — phase-invariant (same style for every
  // heroStatus.badge value, "RÈGLES" through "APRÈS OVULATION"), so it
  // never actually encodes fertility meaning through color despite sitting
  // next to phase copy. Uses the theme's own secondary ("pink") role rather
  // than primary, preserving the original pink accent's spirit.
  heroBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.secondary, 0.08),
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.secondary, 0.12),
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: theme.colors.secondary,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.45,
  },
  heroTitle: {
    marginTop: 9,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
  },
  heroDescription: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  timelineWrap: {
    marginTop: 20,
    paddingTop: 2,
  },
  timelineTrack: {
    position: 'relative',
    flexDirection: 'row',
    height: 7,
    borderRadius: 999,
    overflow: 'visible',
  },
  timelineSegment: {
    height: 7,
    borderRadius: 999,
    marginHorizontal: 1,
  },
  timelinePuck: {
    position: 'absolute',
    top: -5,
    width: 17,
    height: 17,
    marginLeft: -8.5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 9,
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 3,
  },
  timelineLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 17,
    columnGap: 10,
    rowGap: 12,
  },
  timelineLegendItem: {
    flexBasis: '22%',
    flexGrow: 1,
    minWidth: 62,
  },
  timelineDot: {width: 8, height: 8, borderRadius: 4},
  timelineLegendLabel: {
    marginTop: 5,
    color: theme.colors.text,
    fontSize: 10.5,
    fontWeight: '700',
  },
  timelineLegendValue: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
  },

  heroDivider: {
    marginTop: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },

  heroFooterRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroFooterCopy: {flex: 1, minWidth: 0, marginRight: 10},
  heroFooterLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10.5,
  },
  heroFooterValue: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 15.5,
    fontWeight: '800',
  },
  heroFooterSubtitle: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 10.5},

  calendarCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 14,
  },
  calendarCtaPressed: {opacity: 0.8},
  calendarCtaText: {color: PURPLE, fontSize: 12, fontWeight: '700'},

  insufficientDataWrap: {alignItems: 'center', paddingVertical: 8},
  insufficientDataIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
  },
  insufficientDataTitle: {
    marginTop: 12,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },
  insufficientDataText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  insufficientDataCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    paddingHorizontal: 20,
  },
  insufficientDataCtaText: {color: onPrimaryTextColor(theme), fontSize: 13, fontWeight: '700'},

  evolutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: theme.colors.surface,
    padding: 16,
    ...theme.shadow,
  },
  evolutionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },
  evolutionCopy: {flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8},
  evolutionTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
  evolutionSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '600'},

  // Fixed — a self-contained "romantic/nurturing" rose card, deliberately
  // NOT following the resolved palette (same treatment as Cycle/
  // Contraception/Irregular's fixed daily-journal rose accent, '#B23F63',
  // reused verbatim here). Its background never adapts to Dark/True Black,
  // so every text/icon color drawn on top of it must also stay fixed —
  // exactly like MotivationCard's "text calibrated against a fixed surface"
  // precedent (Phase D1) — rather than partially theming a card whose own
  // surface stays static.
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FBEFF6',
    padding: 16,
  },
  adviceIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  adviceEmoji: {fontSize: 17},
  adviceCopy: {flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8},
  adviceTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 13.5, fontWeight: '700'},
  adviceSubtitle: {marginTop: 3, color: '#B23F63', fontSize: 13, fontWeight: '700'},
  adviceText: {marginTop: 3, color: homeColors.textSecondary, fontSize: 11.5, lineHeight: 16},

  articlesCard: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingLeft: 16,
    ...theme.shadow,
  },
  articlesHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16},
  articlesTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  articlesSeeAll: {color: PURPLE, fontSize: 12.5, fontWeight: '700'},
  articlesRow: {marginTop: 12, gap: 10, paddingRight: 16},
  articleTile: {
    width: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: homeRadii.quickAction,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  articleImage: {width: '100%', height: 76},
  articleTileTitle: {marginTop: 8, marginHorizontal: 9, color: theme.colors.text, fontSize: 11.5, fontWeight: '700', lineHeight: 15},
  articleTileMetaRow: {marginTop: 6, marginHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4},
  articleTileMeta: {color: theme.colors.textSecondary, fontSize: 9.5},
  pressed: {opacity: 0.82, transform: [{scale: 0.98}]},

  });
}

export default ConceiveDashboard;