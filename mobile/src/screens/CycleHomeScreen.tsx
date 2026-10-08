import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import {useTranslation} from 'react-i18next';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import '../i18n';
import type {CyclePhase} from '../components/home/CycleStatusCard';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import HomeHeader from '../components/home/HomeHeader';
import HeroCycleCard from '../components/home/HeroCycleCard';
import CycleOverviewCard, {type OverviewItem} from '../components/home/CycleOverviewCard';
import QuickActionsGrid, {type QuickActionItem} from '../components/home/QuickActionsGrid';
import SpiritualGuidanceCard from '../components/home/SpiritualGuidanceCard';
import DailyJournalCard from '../components/home/DailyJournalCard';
import MotivationCard from '../components/home/MotivationCard';
import ObjectiveArticlesSection from '../components/home/ObjectiveArticlesSection';
import PeriodStartBottomSheet from '../components/calendar/PeriodStartBottomSheet';
import {useJournalSheet} from '../navigation/JournalSheetContext';
import {usePrayerPurityStatus} from '../hooks/usePrayerPurityStatus';
import {useQadaaStatus} from '../hooks/useQadaaStatus';
import {useToday} from '../hooks/useToday';
import {
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleDuration,
  getHasRecordedFirstPeriod,
  getIsCycleStateReady,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  isDateWithinConfirmedPeriod,
  subscribeCyclePreferences,
  getFirstName,
  getSpiritualMarkersEnabled,
} from '../state/onboardingPreferences';
import {getJournalEntry} from '../state/dailyJournalStore';
import {getActiveProfileIdentity, subscribeActiveProfileId} from '../state/activeProfileStore';
import {recordManagedProfileFirstPeriod} from '../state/managedProfileCycleSeed';
import {withResolvedIntimacyForDisplay} from '../services/privateJournalEncryption';
import {withResolvedNoteForDisplay} from '../services/privateNotesEncryption';
import type {DailyJournalEntry} from '../types/journal';
import {getFloatingTabBarClearance, TOP_SPACING_EXTRA} from '../theme/spacing';
import {loadPersonalInformation} from '../state/personalInformationStore';
import {
  computeCyclePredictionStatus,
  currentPeriodLength,
  cycleDayFor,
  describeAverageCycle,
  diffDays,
  effectiveRegularityFor,
  estimateFertilityDates,
  formatDateRange,
  formatHijriDate,
  formatShortDate,
  phaseFor,
} from '../utils/cycleMath';

// SEMANTIC — real cycle-tracking meaning, never theme-driven (see the
// "PHASE D1" note on the overview/quick-action item arrays below for which
// other colors in this file share that same protection).
const PERIOD = '#DC7B82';
const PERIOD_LIGHT = '#F7D7D6';
const FERTILE = '#3E8E56';
const FERTILE_LIGHT = '#E4F3E7';
const OVULATION = '#4E319A';
const OVULATION_LIGHT = '#EFE6FA';
// Category E (Phase D1) — a deliberate visual-variety accent for two
// specific, frequently-used quick actions, chosen by this screen's own
// author to stand out from the generic purple-icon actions below; not tied
// to any tracked health/symptom meaning, so left fixed rather than either
// "semantic" or "generic decorative brand purple".
const DAILY_JOURNAL_ACCENT = '#B23F63';
const DAILY_JOURNAL_ACCENT_LIGHT = '#F9DCE8';
const STATISTICS_ACCENT = '#2C8E93';
const STATISTICS_ACCENT_LIGHT = '#DDF0F1';

type Props = MainTabScreenProps<'CycleHome'>;

function CycleHomeScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [initial, setCyclePreferencesState] = useState(getCyclePreferences);
  const {open: openJournal} = useJournalSheet();

  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | undefined>(undefined);
  const [, setProfileRevision] = useState(0);

  // Identity only — the actual cycle/period/journal DATA above already resolves
  // from whichever profile is active (see each store's own header comment); this
  // is just what the header greeting shows (CLAUDE.md-style "same design, only
  // dynamic identity/data changes" — see activeProfileStore.ts).
  const [activeIdentity, setActiveIdentity] = useState(getActiveProfileIdentity);
  useEffect(() => {
    const unsubscribe = subscribeActiveProfileId(() => {
      setActiveIdentity(getActiveProfileIdentity());
      // onboardingPreferences.ts has already dropped the previous profile's cycle
      // data by now (its own listener runs first): re-read it so `initial` can't
      // keep describing the profile just left.
      setCyclePreferencesState(getCyclePreferences());
    });
    return unsubscribe;
  }, []);
  const headerFirstName = activeIdentity.isManagedProfile ? activeIdentity.managedProfile?.firstName ?? '' : getFirstName();
  const headerSubtitle = activeIdentity.isManagedProfile ? t('cycleHome.subtitleDaughter') : t('cycleHome.subtitleOwner');
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  const entrance = useRef(new Animated.Value(0)).current;
  const ctaEntrance = useRef(new Animated.Value(0)).current;

  const [periodStartSheetVisible, setPeriodStartSheetVisible] = useState(false);

  // Re-evaluated when the day changes / the app returns to the foreground —
  // see src/hooks/useToday.ts.
  const {today, todayKey} = useToday();

  // Single source of truth for menstruation/purity/prayer-due, shared with
  // PrayerTimesScreen — see src/hooks/usePrayerPurityStatus.ts. Disabled
  // (no network fetch) while spiritual markers are turned off.
  const prayer = usePrayerPurityStatus(spiritualMarkersEnabled);

  // Canonical qadaa counter — same hook/state FastingQadaaScreen and the
  // Hijri Calendar shortcut read from, see src/hooks/useQadaaStatus.ts.
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
    Animated.timing(ctaEntrance, {
      duration: 300,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [ctaEntrance]);

  useEffect(() => {
    let mounted = true;
    hydrateCyclePreferences().then(value => {if (mounted) {setCyclePreferencesState(value);}});
    const unsubscribe = subscribeCyclePreferences(() => {if (mounted) {setCyclePreferencesState(getCyclePreferences());}});
    return () => {mounted = false; unsubscribe();};
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(() => {
        if (mounted) {setProfileRevision(current => current + 1);}
      });
      getJournalEntry(todayKey)
        .then(withResolvedIntimacyForDisplay)
        .then(withResolvedNoteForDisplay)
        .then(entry => {
          if (mounted) {setJournalEntry(entry);}
        });
      return () => {mounted = false;};
    }, [todayKey]),
  );

  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  // "Mes règles ont commencé" only makes sense when today ISN'T already
  // covered by a real confirmed period — phaseFor() alone can't tell that
  // apart from a merely predicted menstrual day, so this checks the actual
  // confirmed period history instead.
  const hasActiveConfirmedPeriod = isDateWithinConfirmedPeriod(today);

  // A managed daughter who has never had (or never recorded) her first period:
  // NONE of the cycle-derived content below (ring/day/phase, next period,
  // fertile window, ovulation) may be shown — cyclePreferences is still at its
  // neutral, unconfirmed placeholder for her (see onboardingPreferences.ts),
  // and her own RECORDED period history is the ONLY honest signal for that
  // (never a comparison against the 28/5-day fallback constants, never
  // cyclePreferences being non-null). The mother's own empty-history state is
  // completely unaffected — this branch requires activeIdentity.isManagedProfile
  // too, so isOwnerActive() always short-circuits it to false, exactly like
  // cycleReminderScheduling.ts's own dateBasedActive guard already does for
  // reminders. Same gate as CalendarScreen.tsx.
  const isPreFirstPeriodDaughter = activeIdentity.isManagedProfile && !getHasRecordedFirstPeriod();
  const daughterProfileId = activeIdentity.managedProfile?.id;

  // Regularity-aware next-period prediction — 'yes' behaves exactly as
  // before, 'no'/observed-variable produce a 26–32 day window instead of a
  // single certain date, and 'unknown' stays in observation mode until
  // enough real periods have been recorded. See computeCyclePredictionStatus
  // in cycleMath.ts — the one place this logic lives.
  // Recorded periods only — never the placeholder record seeded from the
  // unconfirmed fallback defaults (see getRecordedPeriodHistory()).
  const periodStartDates = getRecordedPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`));
  // A managed profile's declared-regular cycle whose lengths nobody provided is
  // observed, not projected from the placeholder 28 days — same rule as
  // CalendarScreen.tsx (see effectiveRegularityFor). The owner is untouched.
  const predictionRegularity = effectiveRegularityFor(initial.regularity, getHasConfirmedCycleDuration());
  // Data still being read (memory holds the placeholder) / nothing ever recorded:
  // the hero below is neutral — no ring, no phase, no date — whoever she is.
  const cycleDataReady = getIsCycleStateReady();
  const noRecordedPeriod = !getHasRecordedFirstPeriod();
  const predictionStatus = computeCyclePredictionStatus(initial, predictionRegularity, periodStartDates, getCycleObservationStartedAt(), today);

  // cycleDayFor()/phaseFor() wrap the elapsed day count modulo cycleDuration,
  // which only means something once a single cycle length can be trusted —
  // i.e. predictionStatus.mode === 'exact' (declared-regular, or an observed
  // regular-looking pattern; using the OBSERVED average keeps this in sync
  // with the same prediction). Outside 'exact' (irregular window / still
  // observing), there is no reliable length to wrap by: elapsed days since
  // the latest confirmed start can legitimately exceed cycleDuration (a late
  // irregular period), and wrapping would silently — and wrongly — restart
  // the count as if a new period had begun on schedule. In that case "Jour
  // du cycle" is simply the raw elapsed count, and "menstruation" is only
  // ever shown when that raw count actually falls within the real bleeding
  // window, never because the wrap happened to land there by coincidence.
  const rawCycleDay = diffDays(today, initial.lastPeriodStart) + 1;
  // The CURRENT period's real length (edited range / confirmed end), not the
  // habitual periodDuration setting — editing one actual period no longer
  // redefines that habit, so the phase must read the recorded range.
  const phaseBasics = {...initial, periodDuration: currentPeriodLength(initial, getRecordedPeriodHistory())};
  const isReliablyMenstruating = rawCycleDay <= phaseBasics.periodDuration;
  const currentCycleDay = predictionStatus.mode === 'exact'
    ? cycleDayFor(today, {...initial, cycleDuration: predictionStatus.averageCycleLength})
    : rawCycleDay;
  // Without a real cycle length behind it — a managed profile whose lengths nobody
  // provided, still being observed — the placeholder 28 days must decide nothing:
  // no progress ring, no phase, no fertile / ovulation claim ("L’ovulation est
  // prévue aujourd’hui…" for a girl whose only known fact is one period start).
  // The hero is then the neutral card below (HeroCycleCard is not rendered).
  const cycleLengthIsPlaceholder = !getHasConfirmedCycleDuration() && predictionStatus.mode !== 'exact';
  const currentPhase: CyclePhase = (() => {
    if (predictionStatus.mode === 'exact') {
      return phaseFor(today, {...phaseBasics, cycleDuration: predictionStatus.averageCycleLength});
    }
    if (isReliablyMenstruating) {return 'menstruation';}
    const wrappedPhase = phaseFor(today, phaseBasics);
    return wrappedPhase === 'menstruation' ? 'follicular' : wrappedPhase;
  })();
  const nextPeriodTile = (() => {
    if (predictionStatus.mode === 'exact') {
      const daysUntil = Math.max(0, diffDays(predictionStatus.date, today));
      return {value: formatShortDate(predictionStatus.date), subtitle: t('cycleHome.nextPeriod.inDays', {count: daysUntil})};
    }
    if (predictionStatus.mode === 'window') {
      if (predictionStatus.isLate) {
        return {
          value: t('cycleHome.nextPeriod.late'),
          subtitle: t('cycleHome.nextPeriod.window', {range: formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd)}),
        };
      }
      const daysUntilStart = diffDays(predictionStatus.windowStart, today);
      return {
        value: formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd),
        subtitle: daysUntilStart > 0 ? t('cycleHome.nextPeriod.inDays', {count: daysUntilStart}) : t('cycleHome.nextPeriod.windowInProgress'),
      };
    }
    return predictionStatus.complete
      ? {value: t('cycleHome.observationInProgress'), subtitle: t('cycleHome.dataToComplete')}
      : {
          value: t('cycleHome.monthOfTotal', {month: predictionStatus.monthsElapsed, total: predictionStatus.totalMonths}),
          subtitle: t('cycleHome.cycleObservation'),
        };
  })();

  // The 4th overview tile must match whatever computeCyclePredictionStatus
  // actually derived: a measured average is only ever called an average when
  // it comes from the user's own recorded cycles; a declared/configured
  // length is worded as such (see describeAverageCycle in cycleMath.ts,
  // shared with Calendar and Profile).
  const averageTile = describeAverageCycle(predictionStatus, initial, getHasConfirmedCycleDuration());

  // Fertile window / ovulation: only estimable when a single cycle length can
  // be trusted. For an irregular/variable cycle the next period is already a
  // 26–32 day window above, so no single ovulation date may be shown either.
  const fertility = estimateFertilityDates(initial, predictionStatus, today, getHasConfirmedCycleDuration());
  // "Cycle variable" only describes an irregular cycle; elsewhere the dates are
  // simply not estimable yet.
  const notEstimableSubtitle = predictionStatus.mode === 'window' ? t('cycleHome.variableCycle') : t('cycleHome.insufficientData');
  const fertileTile = fertility
    ? {value: formatDateRange(fertility.fertileStart, fertility.fertileEnd), subtitle: t('cycleHome.nextPeriod.inDays', {count: Math.max(0, diffDays(fertility.fertileStart, today))})}
    : {value: t('cycleHome.notEstimable'), subtitle: notEstimableSubtitle};
  const ovulationTile = fertility
    ? {value: formatShortDate(fertility.ovulation), subtitle: t('cycleHome.nextPeriod.inDays', {count: Math.max(0, diffDays(fertility.ovulation, today))})}
    : {value: t('cycleHome.notEstimable'), subtitle: notEstimableSubtitle};

  const overviewItems: OverviewItem[] = [
    {
      key: 'next-period',
      icon: 'water',
      iconColor: PERIOD,
      iconBg: PERIOD_LIGHT,
      label: t('cycleHome.nextPeriodLabel'),
      value: nextPeriodTile.value,
      subtitle: nextPeriodTile.subtitle,
    },
    {
      key: 'fertile-window',
      icon: 'leaf',
      iconColor: FERTILE,
      iconBg: FERTILE_LIGHT,
      label: t('cycleHome.fertileWindowLabel'),
      value: fertileTile.value,
      subtitle: fertileTile.subtitle,
    },
    {
      key: 'ovulation',
      icon: 'egg-outline',
      iconColor: OVULATION,
      iconBg: OVULATION_LIGHT,
      label: t('cycleHome.ovulationLabel'),
      value: ovulationTile.value,
      subtitle: ovulationTile.subtitle,
    },
    {
      key: 'average-length',
      icon: 'calendar-month-outline',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primarySoft,
      label: averageTile.label,
      value: averageTile.value,
      subtitle: averageTile.subtitle,
    },
  ];

  // The whole "Actions rapides" section (title/subtitle/"Personnaliser"/cards
  // — all owned by QuickActionsGrid itself) is not rendered at all for a
  // managed daughter profile (see the section's conditional render below),
  // so this list only needs to stay the mother's normal, full list; the
  // spiritual entries within it are already filtered by QuickActionsGrid's
  // own existing spiritualMarkersEnabled-aware logic, unrelated to profiles.
  const quickActionItems: QuickActionItem[] = [
    {key: 'prayer-times', icon: 'mosque', iconColor: theme.colors.primary, iconBg: theme.colors.primarySoft, label: t('cycleHome.quickActions.prayerTimes'), onPress: () => navigation.navigate('PrayerTimes')},
    {key: 'library', icon: 'book-open-page-variant-outline', iconColor: theme.colors.primary, iconBg: theme.colors.primarySoft, label: t('cycleHome.quickActions.library'), onPress: () => navigation.navigate('Library')},
    {key: 'daily-journal', icon: 'notebook-edit-outline', iconColor: DAILY_JOURNAL_ACCENT, iconBg: DAILY_JOURNAL_ACCENT_LIGHT, label: t('cycleHome.quickActions.dailyJournal'), onPress: openJournal},
    {key: 'hijri-calendar', icon: 'moon-waning-crescent', iconColor: theme.colors.primary, iconBg: theme.colors.primarySoft, label: t('cycleHome.quickActions.hijriCalendar'), onPress: () => navigation.navigate('HijriCalendar')},
    {key: 'qadaa', icon: 'silverware-fork-knife', iconColor: theme.colors.primary, iconBg: theme.colors.primarySoft, label: t('cycleHome.quickActions.qadaa'), onPress: () => navigation.navigate('FastingQadaa')},
    {key: 'statistics', icon: 'chart-donut', iconColor: STATISTICS_ACCENT, iconBg: STATISTICS_ACCENT_LIGHT, label: t('cycleHome.quickActions.statistics'), onPress: () => navigation.navigate('Statistics')},
  ];

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
              firstName={headerFirstName}
              onPressProfile={() => navigation.navigate('Profile')}
              subtitle={headerSubtitle}
            />
          </Animated.View>

          <View style={styles.heroSpacer}>
            {isPreFirstPeriodDaughter ? (
              <View style={styles.preFirstPeriodCard}>
                <View style={styles.preFirstPeriodIconBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="flower-tulip-outline" size={26} />
                </View>
                <Text style={styles.preFirstPeriodTitle}>{t('cycleHome.preFirstPeriod.title')}</Text>
                <Text style={styles.preFirstPeriodSubtitle}>{t('cycleHome.preFirstPeriod.subtitle')}</Text>
              </View>
            ) : !cycleDataReady ? (
              <View accessibilityRole="progressbar" style={styles.preFirstPeriodCard}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : noRecordedPeriod ? (
              <View style={styles.preFirstPeriodCard}>
                <View style={styles.preFirstPeriodIconBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="flower-tulip-outline" size={26} />
                </View>
                <Text style={styles.preFirstPeriodTitle}>{t('cycleHome.preFirstPeriod.title')}</Text>
                <Text style={styles.preFirstPeriodSubtitle}>{t('cycleHome.preFirstPeriod.subtitleOwner')}</Text>
              </View>
            ) : cycleLengthIsPlaceholder ? (
              <View style={styles.preFirstPeriodCard}>
                <View style={styles.preFirstPeriodIconBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="flower-tulip-outline" size={26} />
                </View>
                <Text style={styles.preFirstPeriodTitle}>{t('calendar.dayCard.cycleDayBadge', {day: rawCycleDay})}</Text>
                <Text style={styles.preFirstPeriodSubtitle}>{t('calendar.predictionsPendingMoreData')}</Text>
              </View>
            ) : (
              <HeroCycleCard
                currentDay={currentCycleDay}
                cycleLength={predictionStatus.mode === 'exact' ? predictionStatus.averageCycleLength : initial.cycleDuration}
                moodEntry={journalEntry?.mood}
                phase={currentPhase}
              />
            )}
          </View>

          {/* "Voir plus" opens the Calendar tab, which already hosts the
              detailed predictions (PredictionsCard) and cycle timeline this
              overview summarises — no new screen. Hidden entirely for a
              pre-first-period daughter: every tile here (next period, fertile
              window, ovulation, average length) is cycle-derived, and there is
              no real cycle data yet to summarise. */}
          {!isPreFirstPeriodDaughter && cycleDataReady && !noRecordedPeriod ? (
            <CycleOverviewCard items={overviewItems} onPressMore={() => navigation.navigate('Calendar')} />
          ) : null}

          {isPreFirstPeriodDaughter ? (
            <Animated.View
              style={[
                styles.periodStartCtaWrap,
                {
                  opacity: ctaEntrance,
                  transform: [
                    {
                      translateY: ctaEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <Pressable
                accessibilityLabel={t('cycleHome.herPeriodStartedCta')}
                accessibilityRole="button"
                onPress={() => setPeriodStartSheetVisible(true)}
                style={({pressed}) => [styles.periodStartCta, pressed && styles.periodStartCtaPressed]}>
                <MaterialDesignIcons color={PERIOD} name="water-plus-outline" size={16} />
                <Text style={styles.periodStartCtaText}>{t('cycleHome.herPeriodStartedCta')}</Text>
              </Pressable>
            </Animated.View>
          ) : !hasActiveConfirmedPeriod ? (
            <Animated.View
              style={[
                styles.periodStartCtaWrap,
                {
                  opacity: ctaEntrance,
                  transform: [
                    {
                      translateY: ctaEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <Pressable
                accessibilityLabel={t('cycleHome.myPeriodStartedCta')}
                accessibilityRole="button"
                onPress={() => setPeriodStartSheetVisible(true)}
                style={({pressed}) => [styles.periodStartCta, pressed && styles.periodStartCtaPressed]}>
                <MaterialDesignIcons color={PERIOD} name="water-plus-outline" size={16} />
                <Text style={styles.periodStartCtaText}>{t('cycleHome.myPeriodStartedCta')}</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* Entire "Actions rapides" section (title/subtitle/"Personnaliser"/cards —
              all internal to QuickActionsGrid) is not part of a managed daughter
              profile's simplified cycle-tracking dashboard. Conditionally rendering
              the component itself (not just clearing its items) avoids any empty
              wrapper/spacing — see CLAUDE.md §4 objective isolation. Unaffected for
              the owner. */}
          {!activeIdentity.isManagedProfile ? <QuickActionsGrid items={quickActionItems} /> : null}

          {spiritualMarkersEnabled && !activeIdentity.isManagedProfile ? (
            <SpiritualGuidanceCard
              hijriDate={formatHijriDate(today)}
              isMenstruating={prayer.isMenstruating}
              locationConfigured={Boolean(prayer.selectedLocation)}
              locationName={prayer.selectedLocation ? `${prayer.selectedLocation.city}, ${prayer.selectedLocation.country}` : undefined}
              nextWindow={prayer.nextWindow}
              onPressPuritySummary={() => navigation.navigate('PrayerTimes')}
              periodEndDateTime={prayer.periodEndDateTime}
              prayerError={prayer.error}
              prayerLoading={prayer.loading}
              purityResult={prayer.purityResult}
              qadaaDays={qadaa.remainingQadaaDays ?? 0}
              timezone={prayer.schedule?.timezone}
            />
          ) : null}

          <DailyJournalCard
            entry={journalEntry}
            hideIntimacy={activeIdentity.isManagedProfile}
            onNavigate={route => navigation.navigate(route)}
          />

          {/* Informational only, daughter-appropriate — not a recommended-
              articles section (that one, ObjectiveArticlesSection/"Pour
              t'accompagner", stays hidden for a managed profile below). */}
          {isPreFirstPeriodDaughter ? (
            <View style={styles.educationCard}>
              <View style={styles.educationIconBadge}>
                <MaterialDesignIcons color={theme.colors.primary} name="school-outline" size={18} />
              </View>
              <View style={styles.educationCopy}>
                <Text style={styles.educationTitle}>{t('cycleHome.education.title')}</Text>
                <Text style={styles.educationBody}>
                  {t('cycleHome.education.body')}
                </Text>
              </View>
            </View>
          ) : null}

          <MotivationCard />

          {/* "Pour t'accompagner" (recommended articles) is not part of a
              managed daughter profile's simplified cycle-tracking dashboard
              (CLAUDE.md §4 objective isolation, same pattern as Actions
              rapides/Repères spirituels being hidden for her elsewhere).
              Not rendering the component at all (rather than feeding it an
              empty list) avoids any leftover title/card/spacing for its own
              section. The article data/component/navigation are completely
              untouched — the owner's dashboard is unaffected. */}
          {!activeIdentity.isManagedProfile ? (
            <ObjectiveArticlesSection
              objective="cycle"
              onOpenArticle={articleId => navigation.navigate('ArticleReader', {articleId})}
              onSeeAll={() => navigation.navigate('Library')}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <PeriodStartBottomSheet
        description={isPreFirstPeriodDaughter ? t('cycleHome.preFirstPeriod.question') : undefined}
        initialDate={today}
        onClose={() => setPeriodStartSheetVisible(false)}
        onConfirm={
          isPreFirstPeriodDaughter && daughterProfileId
            ? date => {recordManagedProfileFirstPeriod(daughterProfileId, date).catch(() => {});}
            : undefined
        }
        onConfirmed={() => {}}
        title={isPreFirstPeriodDaughter ? t('cycleHome.herPeriodStartedCta') : undefined}
        visible={periodStartSheetVisible}
      />
    </LinearGradient>
  );
}

// PHASE D1 — page-level background/decor is now theme-driven; the
// "Mes règles ont commencé" CTA (border/background/text) stays fixed in the
// period-pink family (SEMANTIC — see the constants above), unchanged here.
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

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
      backgroundColor: 'transparent',
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: TOP_SPACING_EXTRA,
      paddingBottom: 22,
    },

    heroSpacer: {
      marginTop: 16,
    },

    periodStartCtaWrap: {
      marginTop: 10,
      alignItems: 'center',
    },

    // SEMANTIC (period-pink family) — never theme-driven.
    periodStartCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 40,
      borderWidth: 1.2,
      borderColor: 'rgba(220,123,130,0.35)',
      borderRadius: 20,
      backgroundColor: '#FCEEEF',
      paddingHorizontal: 16,
      paddingVertical: 9,
    },

    periodStartCtaPressed: {
      opacity: 0.78,
    },

    periodStartCtaText: {
      color: PERIOD,
      fontSize: 12.5,
      fontWeight: '700',
    },

    // Pre-first-period daughter state — replaces HeroCycleCard when there is
    // no real cycle data to show yet (CLAUDE.md §5: never fabricate one).
    preFirstPeriodCard: {
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 26,
      backgroundColor: theme.colors.surface,
      paddingVertical: 28,
      paddingHorizontal: 20,
      ...theme.shadow,
    },
    preFirstPeriodIconBadge: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      backgroundColor: theme.colors.primarySoft,
    },
    preFirstPeriodTitle: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    preFirstPeriodSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      paddingHorizontal: 8,
    },

    // "Se préparer aux premières règles" — informational only, same row-card
    // shape as AwaADeuxInvitationScreen.tsx's own icon+text card.
    educationCard: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      ...theme.shadow,
    },
    educationIconBadge: {
      width: 36,
      height: 36,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
    },
    educationCopy: {flex: 1, minWidth: 0},
    educationTitle: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19},
    educationBody: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
  });
}

export default CycleHomeScreen;
