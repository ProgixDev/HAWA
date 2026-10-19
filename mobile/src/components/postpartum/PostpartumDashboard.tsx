import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type { MainTabScreenProps } from '../../navigation/MainTabNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {
  type QuickActionItem,
} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../home/ObjectiveArticlesSection';
import { getFloatingTabBarClearance } from '../../theme/spacing';

import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import {
  getFirstName,
  getSelectedLocation,
  getSpiritualMarkersEnabled,
  hydrateSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  subscribeSelectedLocation,
  subscribeSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';
import {
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
  type PostpartumFeedingType,
} from '../../state/postpartumPreferences';
import {
  getPostpartumJournalEntry,
  hydratePostpartumJournal,
  subscribePostpartumJournal,
} from '../../state/postpartumJournalStore';
import { POSTPARTUM_JOURNAL_ITEMS } from '../../config/postpartumJournalConfig';
import {DAILY_LABEL_OVERFLOW, isSingleWordLabel, planDailyRow} from '../../utils/dailyLabelRow';
import {
  getAllPostpartumLochiaEntries,
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
  subscribePostpartumLochia,
  type PostpartumLochiaEntry,
} from '../../state/postpartumLochiaStore';
import {
  computePostpartumLochiaSummary,
  computePostpartumStatus,
  getNifasReminderStatus,
  getPostpartumNifasStatus,
} from '../../utils/postpartumTrackingUtils';
import {
  hydratePostpartumNifasReminderState,
  isPostpartumNifasCompletionAcknowledged,
  setPostpartumNifasCompletionAcknowledged,
} from '../../state/postpartumNifasReminderStore';
import { usePostpartumSpiritualStatus } from '../../hooks/usePrayerPurityStatus';
import { useToday } from '../../hooks/useToday';
import { formatFullDate, formatHijriDate } from '../../utils/cycleMath';
import { journalOptionLabel } from '../../utils/journalOptionLabels';
import {
  NIFAS_EDUCATIONAL_ARTICLE_ID,
  nifasReferenceReachedHeadline,
} from '../../config/nifasReminderConfig';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';

const POSTPARTUM_MOTHER_BABY = require('../../assets/images/postpartum/postpartum-mother-baby.png');

// No dedicated mother-and-baby illustration exists yet in
// src/assets/images/postpartum/ (only delivery-type/feeding icons) — a
// neutral icon circle is used instead of the Pregnancy hero image, per the
// task's explicit "never reuse the pregnant-woman illustration" rule. See
// the final report for the suggested asset path to add later.

// PHASE D6 — PURPLE used to be a fixed literal here; it is now derived from
// useAwaTheme() inside PostpartumDashboard() (and re-derived identically
// inside createStyles(theme)). No health/postpartum-semantic color exists in
// this file except the "Lochies aujourd'hui" card's rose icon (see its own
// comment below) — every other color is generic decorative purple-brand
// chrome, never varying by day/lochia/cycle-return state.

type Props = MainTabScreenProps<'CycleHome'>;

// Shared with the "Journal quotidien" sheet + PostpartumJournalEntryScreen —
// see src/config/postpartumJournalConfig.ts, the single source of truth for
// these 5 fixed categories (Fatigue/Sommeil/Humeur/Douleurs/Récupération
// physique) — deliberately different from Pregnancy's own 5 categories.
const DAILY_ITEMS = POSTPARTUM_JOURNAL_ITEMS;

function PostpartumDashboard({ navigation }: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Moved from a module-level const to inside the component so the short
  // feeding-type labels can be sourced from i18n — the persisted value is
  // still the stable PostpartumFeedingType enum (postpartumPreferences.ts),
  // never this display text.
  const FEEDING_SHORT_LABELS: Record<PostpartumFeedingType, string> = {
    exclusive_breastfeeding: t('postpartumDashboard.feeding.exclusiveBreastfeeding'),
    mixed: t('postpartumDashboard.feeding.mixed'),
    exclusive_bottle: t('postpartumDashboard.feeding.exclusiveBottle'),
    unknown: t('postpartumDashboard.feeding.unknown'),
  };

  // Canonical postpartum onboarding data (src/state/postpartumPreferences.ts)
  // — the same source SummaryScreen/ProfileScreen read. Postpartum day/week
  // are derived from deliveryDate via computePostpartumStatus, the one
  // centralized helper — never recomputed inline.
  const [postpartum, setPostpartum] = useState(getPostpartumPreferences);

  useEffect(() => {
    let active = true;
    hydratePostpartumPreferences().then(value => {
      if (active) {
        setPostpartum(value);
      }
    });
    const unsubscribe = subscribePostpartumPreferences(() => {
      if (active) {
        setPostpartum(getPostpartumPreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const deliveryDate = useMemo(
    () =>
      postpartum.deliveryDate
        ? new Date(`${postpartum.deliveryDate}T12:00:00`)
        : null,
    [postpartum.deliveryDate],
  );
  // Re-evaluated when the day changes / the app returns to the foreground —
  // see src/hooks/useToday.ts.
  const { today, todayKey } = useToday();
  const status = useMemo(
    () => computePostpartumStatus(deliveryDate, today),
    [deliveryDate, today],
  );

  // Postpartum's OWN daily tracking (src/state/postpartumJournalStore.ts) —
  // never the shared Cycle dailyJournalStore, which also carries
  // Cycle-specific fields (flow/temperature/intimacy) that must never leak
  // into Postpartum.
  const [todayEntry, setTodayEntry] = useState(() =>
    getPostpartumJournalEntry(todayKey),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePostpartumJournal().then(() => {
        if (active) {
          setTodayEntry(getPostpartumJournalEntry(todayKey));
        }
      });
      const unsubscribe = subscribePostpartumJournal(() => {
        if (active) {
          setTodayEntry(getPostpartumJournalEntry(todayKey));
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, [todayKey]),
  );

  const completedTodayCount = useMemo(
    () => DAILY_ITEMS.filter(item => Boolean(todayEntry?.[item.key])).length,
    [todayEntry],
  );

  // "Suivi du jour" labels: every label stays on ONE line under its icon ("Récupération" used to break into "Récupéra" /
  // "tion"). The row measures each single-word label at the base style (hidden measurers below) and plans the layout
  // from the real widths — see utils/dailyLabelRow.ts: the base size when it fits, a slightly smaller one when it
  // does not, a 3 + 2 grid of wider cells when even that does not. Widths are remembered per label text and font scale,
  // so a language or system-font change simply measures the new text.
  const {fontScale} = useWindowDimensions();
  const [dailyRowWidth, setDailyRowWidth] = useState(0);
  const [dailyLabelWidths, setDailyLabelWidths] = useState<Record<string, number>>({});
  const dailyWidthKey = (label: string): string => `${fontScale}|${label}`;
  const dailyPlan = planDailyRow(
    dailyRowWidth,
    DAILY_ITEMS.map(item => ({
      width: isSingleWordLabel(item.dashboardLabel) ? dailyLabelWidths[dailyWidthKey(item.dashboardLabel)] : 'wraps',
      chars: Array.from(item.dashboardLabel).length,
    })),
  );
  const rememberDailyLabelWidth = (label: string, width: number): void => {
    setDailyLabelWidths(previous => {
      const key = dailyWidthKey(label);
      return Math.abs((previous[key] ?? -1) - width) < 0.5 ? previous : {...previous, [key]: width};
    });
  };

  // Same shared location/spiritual-preference sources Cycle/Pregnancy read
  // — no Postpartum-specific duplicate.
  const [location, setLocation] = useState(getSelectedLocation());
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
  const [lochiaEntries, setLochiaEntries] = useState<
    Record<string, PostpartumLochiaEntry>
  >({});
  const [lochiaTracking, setLochiaTracking] = useState(
    getPostpartumLochiaTracking,
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePostpartumLochia().then(() => {
        if (active) {
          setLochiaEntries(getAllPostpartumLochiaEntries());
          setLochiaTracking(getPostpartumLochiaTracking());
          setLochiaHydrated(true);
        }
      });
      const unsubscribe = subscribePostpartumLochia(() => {
        if (active) {
          setLochiaEntries(getAllPostpartumLochiaEntries());
          setLochiaTracking(getPostpartumLochiaTracking());
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydrateSpiritualMarkersEnabled().then(value => {
        if (active) {
          setSpiritualMarkersEnabled(value);
        }
      });
      const unsubscribe = subscribeSpiritualMarkersEnabled(() => {
        if (active) {
          setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  // Prayer-schedule/hijri only — deliberately never menstrual purity status
  // (no isMenstruating/purityResult here, unlike Cycle's hook). Nifas is
  // its own distinct state; this dashboard only ever shows a neutral day
  // count for it, never a purity verdict.
  const spiritual = usePostpartumSpiritualStatus(spiritualMarkersEnabled);

  // The Nifas reference banner (SpiritualGuidanceCard) and the completion
  // popup below are two presentations of ONE state: getNifasReminderStatus()
  // (utils/postpartumTrackingUtils.ts) — the same helper the Nifas
  // notifications' eligibility mirrors (no reminder once the lochia are
  // marked ended). The popup opens only while that state is
  // 'reference_reached' and has not been acknowledged for this deliveryDate,
  // so the two can never contradict each other (previously the popup only
  // looked at the day count and could describe "persisting" bleeding for a
  // profile whose lochia are recorded as ended, while the banner was
  // hidden). It re-evaluates on every focus and whenever the lochia change,
  // so returning on a later day (J38 → J43) still catches it exactly once.
  // `nifasCompletionAcknowledged` also silences the banner once true.
  const [nifasCompletionAcknowledged, setNifasCompletionAcknowledged] =
    useState(false);
  const [nifasStateHydrated, setNifasStateHydrated] = useState(false);
  const [lochiaHydrated, setLochiaHydrated] = useState(false);
  const [nifasCompletionModalVisible, setNifasCompletionModalVisible] =
    useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [preferences] = await Promise.all([
          hydratePostpartumPreferences(),
          hydratePostpartumNifasReminderState(),
        ]);
        if (!active) {
          return;
        }
        const acknowledged = preferences.deliveryDate
          ? isPostpartumNifasCompletionAcknowledged(preferences.deliveryDate)
          : false;
        setNifasCompletionAcknowledged(acknowledged);
        setNifasStateHydrated(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const acknowledgeNifasCompletion = useCallback(async () => {
    if (postpartum.deliveryDate) {
      try {
        await setPostpartumNifasCompletionAcknowledged(postpartum.deliveryDate);
      } catch (saveError) {
        // Not persisted: the acknowledgement is not claimed and the modal stays so it can be retried.
        presentSaveFailure(saveError);
        return;
      }
    }
    setNifasCompletionAcknowledged(true);
    setNifasCompletionModalVisible(false);
  }, [postpartum.deliveryDate]);

  const handleNifasCompletionContinue = useCallback(() => {
    acknowledgeNifasCompletion();
  }, [acknowledgeNifasCompletion]);

  const handleNifasCompletionChooseAnother = useCallback(() => {
    acknowledgeNifasCompletion();
    navigation.navigate('Profile');
  }, [acknowledgeNifasCompletion, navigation]);

  // Same shared bottom-sheet context Cycle/Pregnancy use — JournalSheetHost
  // (see MainTabNavigator.tsx) renders the shared DailyJournalSheet with
  // Postpartum's own 5-category action list while activeObjective ===
  // 'postpartum', so opening it here needs no Postpartum-specific wiring.
  const { open: openPostpartumJournal } = useJournalSheet();

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {
        return;
      }
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      active = false;
    };
  }, [entrance]);

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
    // Category E (fixed action-identity accent, same as every prior
    // dashboard — never theme-driven).
    {
      key: 'daily-journal',
      icon: 'notebook-edit-outline',
      iconColor: '#B23F63',
      iconBg: '#F9DCE8',
      label: t('cycleHome.quickActions.dailyJournal'),
      onPress: openPostpartumJournal,
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
      // Reuses the same shared key every other dashboard (Cycle/Contraception/
      // Irregular/Conceive/Menopause/Pregnancy) already uses — this aligns
      // Postpartum's previously-inconsistent singular "Jeûne à rattraper"
      // with the app-wide plural wording ("Jeûnes à rattraper").
      label: t('cycleHome.quickActions.qadaa'),
      onPress: () => navigation.navigate('FastingQadaa'),
    },
    {
      key: 'statistics',
      icon: 'chart-donut',
      iconColor: '#2C8E93',
      iconBg: '#DDF0F1',
      label: t('cycleHome.quickActions.statistics'),
      onPress: () => navigation.navigate('Statistics'),
    },
  ];

  const entranceStyle = {
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

  const feedingLabel = postpartum.feedingType
    ? FEEDING_SHORT_LABELS[postpartum.feedingType]
    : null;
  const lochiaSummary = useMemo(
    () =>
      computePostpartumLochiaSummary(
        postpartum.deliveryDate,
        lochiaEntries,
        lochiaTracking,
      ),
    [lochiaEntries, lochiaTracking, postpartum.deliveryDate],
  );
  const nifasStatus = useMemo(
    () =>
      getPostpartumNifasStatus(postpartum.deliveryDate, today, lochiaSummary),
    [lochiaSummary, postpartum.deliveryDate, today],
  );

  // Real cycle-return state — see PostpartumCycleReturnScreen.tsx, the only
  // place that ever writes firstPostpartumPeriodDate. Never inferred from
  // lochia entries; only an explicit user-confirmed period counts.
  const firstPeriodDate = useMemo(
    () =>
      postpartum.firstPostpartumPeriodDate
        ? new Date(`${postpartum.firstPostpartumPeriodDate}T12:00:00`)
        : null,
    [postpartum.firstPostpartumPeriodDate],
  );
  const cycleReturnValue = firstPeriodDate
    ? t('postpartumDashboard.cycleReturn.resumed')
    : t('postpartumDashboard.cycleReturn.notResumed');
  const cycleReturnSubvalue = firstPeriodDate
    ? t('postpartumDashboard.cycleReturn.since', {date: formatFullDate(firstPeriodDate)})
    : null;
  const todayLochia = lochiaEntries[todayKey];
  // DATA-BEARING: todayLochia.flow/.color stay the raw French strings
  // persisted as-is by postpartumLochiaStore (LochiaFlow/LochiaColor are
  // string enums with French label text, no separate stable id); only the
  // DISPLAYED label is translated, via journalOptionLabel (Phase 7H.2).
  const lochiaDashboardValue = todayLochia
    ? `${journalOptionLabel('postpartumLochiaFlow', todayLochia.flow, t)} · ${journalOptionLabel('postpartumLochiaColor', todayLochia.color, t)}`
    : lochiaSummary.status === 'ended'
    ? t('postpartumDashboard.lochia.endedSummary', {days: lochiaSummary.durationDays ?? '—'})
    : t('postpartumDashboard.lochia.noneRecordedToday');
  const nifasValue =
    nifasStatus.status === 'losses_ended'
      ? t('postpartumDashboard.nifas.lossesEnded')
      : nifasStatus.status === 'losses_ongoing'
      ? t('postpartumDashboard.nifas.lossesOngoing', {day: nifasStatus.postpartumDay})
      : nifasStatus.postpartumDay > 0
      ? t('postpartumDashboard.nifas.notTracked', {day: nifasStatus.postpartumDay})
      : undefined;
  const nifasReminderStatus = useMemo(
    () =>
      nifasCompletionAcknowledged
        ? 'none'
        : getNifasReminderStatus({
            postpartumDay: nifasStatus.postpartumDay,
            lochiaEnded: nifasStatus.lochiaEnded,
          }),
    [
      nifasCompletionAcknowledged,
      nifasStatus.lochiaEnded,
      nifasStatus.postpartumDay,
    ],
  );

  // Open the completion popup from the SAME status as the banner — only once
  // the lochia state and the acknowledgement have both been loaded, so a
  // profile whose lochia are recorded as ended never sees it flash.
  useEffect(() => {
    if (
      nifasReminderStatus === 'reference_reached' &&
      spiritualMarkersEnabled &&
      nifasStateHydrated &&
      lochiaHydrated
    ) {
      setNifasCompletionModalVisible(true);
    }
  }, [nifasReminderStatus, spiritualMarkersEnabled, nifasStateHydrated, lochiaHydrated]);

  // …and it can never stay open once that state is no longer 'reference_reached'.
  const showNifasCompletionModal =
    nifasCompletionModalVisible && nifasReminderStatus === 'reference_reached';

  return (
    <>
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}
    >

      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: getFloatingTabBarClearance(insets.bottom, 28),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader
            firstName={getFirstName()}
            onPressProfile={() => navigation.navigate('Profile')}
            subtitle={t('postpartumDashboard.headerSubtitle')}
          />

          <Animated.View style={entranceStyle}>
            {status.configured ? (
              <View style={styles.heroCard}>

                <View style={styles.heroCopy}>
                  <View style={styles.heroBadge}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="heart-circle-outline"
                      size={15}
                    />
                    <Text style={styles.heroBadgeText}>{t('postpartumDashboard.hero.badge')}</Text>
                  </View>

                  <AwaText variant="titleSmall" style={styles.heroTitle}>{t('postpartumDashboard.hero.title')}</AwaText>

                  <View style={styles.heroDayRow}>
                    {/* The "Jour " prefix is stored WITH its trailing space
                        (postpartumDashboard.hero.dayPrefix) so this stays two
                        Text children — ["Jour ", <number>] — exactly like the
                        original JSX text+expression split, which
                        PostpartumDashboard.test.tsx asserts on directly. */}
                    <Text style={styles.heroDay}>
                      {t('postpartumDashboard.hero.dayPrefix')}{status.postpartumDay}
                    </Text>
                    <View style={styles.heroDayDot} />
                  </View>

                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.heroSubLabel}>
                    {t('postpartumDashboard.hero.subLabel')}
                  </AwaText>

                  <View style={styles.heroDateBlock}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="calendar-heart"
                      size={16}
                    />
                    <View style={styles.heroDateCopy}>
                      <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                        {t('postpartumDashboard.hero.deliveryLabel')}
                      </AwaText>
                      <AwaText variant="labelSmall" colorRole="primary" style={styles.heroDelivery}>
                        {formatFullDate(deliveryDate as Date)}
                      </AwaText>
                    </View>
                  </View>
                </View>

                <View style={styles.heroIllustration}>
                  <View style={styles.heroHalo} />
                  <Image
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={t('postpartumDashboard.hero.illustrationAccessibility')}
                    resizeMode="contain"
                    source={POSTPARTUM_MOTHER_BABY}
                    style={styles.heroImage}
                  />
                </View>
              </View>
            ) : (
              <AwaCard padding="none" variant="filled" style={styles.unconfiguredCard}>
                <View style={styles.unconfiguredTop}>
                  <View style={styles.unconfiguredIcon}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="calendar-heart"
                      size={28}
                    />
                  </View>
                  <View style={styles.unconfiguredCopy}>
                    <AwaText variant="titleMedium">
                      {t('postpartumDashboard.unconfigured.title')}
                    </AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.unconfiguredText}>
                      {t('postpartumDashboard.unconfigured.text')}
                    </AwaText>
                  </View>
                </View>

                <AwaButton
                  accessibilityLabel={t('postpartumDashboard.unconfigured.title')}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('PostpartumDeliveryDate', {mode: 'edit'})}
                  label={t('postpartumDashboard.unconfigured.button')}
                  style={styles.unconfiguredButton}
                />
              </AwaCard>
            )}

            <View style={styles.sectionHeadingRow}>
              <View>
                <AwaText variant="titleMedium">{t('postpartumDashboard.today.sectionTitle')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionHeadingSub}>
                  {t('postpartumDashboard.today.sectionSubtitle')}
                </AwaText>
              </View>

              <View style={styles.todayBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="calendar-today-outline"
                  size={15}
                />
                <Text style={styles.todayBadgeText}>{t('postpartumDashboard.today.badge')}</Text>
              </View>
            </View>

            {/* PHASE D6 — this card's rose icon (theme.colors.secondary, was
                fixed '#D76578') is a domain-flavor decorative accent, NOT a
                protected medical-severity color: it never changes based on
                the actual recorded flow/color/status (lochiaDashboardValue
                below), unlike a real semantic marker would. Migrated
                consistent with Conceive D4's identical "phase-invariant
                pink badge" finding. */}
            <AwaCard
              padding="none"
              variant="filled"
              accessibilityLabel={t('postpartumDashboard.lochia.title')}
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostpartumLochia')}
              style={styles.featureCard}
            >
              <View style={[styles.featureIcon, styles.featureIconLochia]}>
                <MaterialDesignIcons
                  color={theme.colors.secondary}
                  name="water-outline"
                  size={24}
                />
              </View>

              <View style={styles.featureCopy}>
                <AwaText variant="labelSmall" colorRole="primary">{t('postpartumDashboard.lochia.eyebrow')}</AwaText>
                <AwaText variant="titleSmall" style={styles.featureTitle}>{t('postpartumDashboard.lochia.title')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.featureValue}>{lochiaDashboardValue}</AwaText>
              </View>

              <View style={styles.featureArrow}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-right"
                  size={22}
                />
              </View>
            </AwaCard>

            <AwaCard
              padding="none"
              variant="filled"
              accessibilityLabel={t('postpartumDashboard.cycleReturn.title')}
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostpartumCycleReturn')}
              style={styles.featureCard}
            >
              <View style={[styles.featureIcon, styles.featureIconCycle]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="sync"
                  size={24}
                />
              </View>

              <View style={styles.featureCopy}>
                <AwaText variant="labelSmall" colorRole="primary">{t('postpartumDashboard.cycleReturn.eyebrow')}</AwaText>
                <AwaText variant="titleSmall" style={styles.featureTitle}>{t('postpartumDashboard.cycleReturn.title')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.featureValue}>{cycleReturnValue}</AwaText>
                {cycleReturnSubvalue ? (
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.featureValue}>{cycleReturnSubvalue}</AwaText>
                ) : null}

                {feedingLabel ? (
                  <View style={styles.miniTag}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="baby-bottle-outline"
                      size={13}
                    />
                    <AwaText variant="labelSmall" colorRole="primary">
                      {t('postpartumDashboard.cycleReturn.feedingLabel', {feeding: feedingLabel})}
                    </AwaText>
                  </View>
                ) : null}
              </View>

              <View style={styles.featureArrow}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-right"
                  size={22}
                />
              </View>
            </AwaCard>

            <AwaCard padding="none" variant="filled" style={styles.dailyCard}>
              <View style={styles.dailyHeader}>
                <View style={styles.dailyHeaderCopy}>
                  <AwaText variant="titleMedium">{t('postpartumDashboard.dailyCard.title')}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.dailySubtitle}>
                    {t('postpartumDashboard.dailyCard.subtitle')}
                  </AwaText>
                </View>

                <View style={styles.progressBadge}>
                  <AwaText variant="labelSmall" colorRole="primary">
                    {completedTodayCount}/{DAILY_ITEMS.length}
                  </AwaText>
                  <Text style={styles.progressBadgeText}>{t('postpartumDashboard.dailyCard.completed')}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(
                        (completedTodayCount / DAILY_ITEMS.length) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>

              <View
                onLayout={(event: LayoutChangeEvent) => setDailyRowWidth(Math.round(event.nativeEvent.layout.width))}
                style={[styles.dailyGrid, dailyPlan.layout === 'grid' && styles.dailyGridWrapped]}>
                {/* Hidden measurers: each single-word label at the base style, on one line, to learn its real width. */}
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  pointerEvents="none"
                  style={styles.dailyMeasure}>
                  {DAILY_ITEMS.map(item =>
                    isSingleWordLabel(item.dashboardLabel) ? (
                      <View
                        key={item.key}
                        onLayout={(event: LayoutChangeEvent) => rememberDailyLabelWidth(item.dashboardLabel, event.nativeEvent.layout.width)}>
                        <AwaText numberOfLines={1} variant="bodySmall">{item.dashboardLabel}</AwaText>
                      </View>
                    ) : null,
                  )}
                </View>
                {DAILY_ITEMS.map(item => {
                  const done = Boolean(todayEntry?.[item.key]);
                  const singleWord = isSingleWordLabel(item.dashboardLabel);

                  return (
                    <Pressable
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                      key={item.key}
                      onPress={() =>
                        navigation.navigate('PostpartumJournalEntry', {
                          category: item.key,
                        })
                      }
                      style={({ pressed }) => [
                        styles.dailyItem,
                        dailyPlan.layout === 'grid' && styles.dailyItemWrapped,
                        pressed && styles.dailyItemPressed,
                      ]}
                    >
                      <View style={styles.dailyIconWrap}>
                        <View
                          style={[styles.dailyIcon, done && styles.dailyIconDone]}
                        >
                          <MaterialDesignIcons
                            color={done ? onPrimaryTextColor(theme) : theme.colors.primary}
                            name={item.icon}
                            size={22}
                          />
                        </View>

                        {done ? (
                          <View style={styles.doneBadge}>
                            <MaterialDesignIcons
                              color={pickReadableTextColor(theme.colors.success)}
                              name="check"
                              size={9}
                            />
                          </View>
                        ) : null}
                      </View>

                      {/* The label never takes part in touch handling and may be wider than its cell (centred under the
                          icon, into the neighbours' spare room) so a single long word stays on one line. */}
                      <View
                        pointerEvents="none"
                        style={[
                          styles.dailyLabelBox,
                          singleWord && dailyPlan.layout === 'row' && dailyRowWidth > 0
                            ? {width: dailyRowWidth / DAILY_ITEMS.length + 2 * DAILY_LABEL_OVERFLOW}
                            : null,
                        ]}>
                        <AwaText
                          adjustsFontSizeToFit={singleWord && dailyPlan.layout === 'grid'}
                          minimumFontScale={0.8}
                          numberOfLines={singleWord ? 1 : 2}
                          variant="bodySmall"
                          style={[styles.dailyLabel, {fontSize: dailyPlan.step.size, letterSpacing: dailyPlan.step.spacing}]}>
                          {item.dashboardLabel}
                        </AwaText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </AwaCard>

            <QuickActionsGrid items={quickActionItems} />

            {spiritualMarkersEnabled ? (
              <View style={styles.spiritualWrap}>
                <View style={styles.sectionHeadingRow}>
                  <View>
                    <AwaText variant="titleMedium">
                      {t('postpartumDashboard.spiritual.sectionTitle')}
                    </AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionHeadingSub}>
                      {t('postpartumDashboard.spiritual.sectionSubtitle')}
                    </AwaText>
                  </View>

                  <View style={styles.spiritualBadge}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="moon-waning-crescent"
                      size={15}
                    />
                  </View>
                </View>

                <SpiritualGuidanceCard
                  hijriDate={formatHijriDate(today)}
                  locationConfigured={Boolean(location)}
                  locationName={
                    location
                      ? `${location.city}, ${location.country}`
                      : undefined
                  }
                  nextWindow={spiritual.nextWindow}
                  nifasReminderStatus={nifasReminderStatus}
                  nifasValue={nifasValue}
                  objective="postpartum"
                  onPressNifas={() =>
                    navigation.navigate('ArticleReader', {
                      articleId: NIFAS_EDUCATIONAL_ARTICLE_ID,
                    })
                  }
                  prayerError={spiritual.error}
                  prayerLoading={spiritual.loading}
                  timezone={spiritual.schedule?.timezone}
                />
              </View>
            ) : null}

            <ObjectiveArticlesSection
              objective="postpartum"
              onOpenArticle={articleId => navigation.navigate('ArticleReader', {articleId})}
              onSeeAll={() => navigation.navigate('Library')}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>

    <Modal
      animationType="fade"
      onRequestClose={() => setNifasCompletionModalVisible(false)}
      transparent
      visible={showNifasCompletionModal}
    >
      <View style={styles.nifasModalOverlay}>
        <AwaCard padding="none" variant="elevated" style={styles.nifasModalCard}>
          <View style={styles.nifasModalIconWrap}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="weather-night"
              size={26}
            />
          </View>

          <AwaText variant="titleMedium" style={styles.nifasModalTitle}>
            {nifasReferenceReachedHeadline()}
          </AwaText>

          <AwaText variant="bodySmall" style={styles.nifasModalBody}>
            {t('postpartumDashboard.nifasModal.body')}
          </AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.nifasModalNote}>
            {t('postpartumDashboard.nifasModal.note')}
          </AwaText>

          <AwaButton
            accessibilityLabel={t('postpartumDashboard.nifasModal.continue')}
            accessibilityRole="button"
            onPress={handleNifasCompletionContinue}
            label={t('postpartumDashboard.nifasModal.continue')}
            style={styles.nifasModalPrimary}
          />

          <AwaButton
            accessibilityLabel={t('postpartumDashboard.nifasModal.chooseAnother')}
            accessibilityRole="button"
            onPress={handleNifasCompletionChooseAnother}
            label={t('postpartumDashboard.nifasModal.chooseAnother')}
            variant="text"
            style={styles.nifasModalSecondary}
          />
        </AwaCard>
      </View>
    </Modal>
    </>
  );
}

// PHASE D6 — converted to a createStyles(theme) factory, same pattern as
// every prior dashboard (D1-D5). No health/postpartum-semantic color exists
// in this file — see the module-level comment above. The 2 Category E
// quick-action accents (daily-journal rose, statistics teal) stay fixed,
// same as every prior dashboard.
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },





  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  heroCard: {
    ...theme.shadow,
    position: 'relative',
    minHeight: 226,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
  },



  heroCopy: {
    zIndex: 2,
    width: '56%',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingVertical: 20,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  heroBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  heroTitle: {marginTop: 12},

  heroDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  heroDay: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
  },

  heroDayDot: {
    width: 8,
    height: 8,
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },

  heroSubLabel: {marginTop: 2, maxWidth: 180},

  heroDateBlock: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.90),
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  heroDateCopy: {
    flexShrink: 1,
  },


  heroDelivery: {marginTop: 1},

  heroIllustration: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    width: '52%',
    height: '102%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },

  heroHalo: {
    position: 'absolute',
    right: -18,
    bottom: -35,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.90),
  },

  heroImage: {
    width: '108%',
    height: '100%',
  },

  unconfiguredCard: {marginTop: 16, padding: 18},

  unconfiguredTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  unconfiguredIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  unconfiguredCopy: {
    flex: 1,
    marginLeft: 12,
  },


  unconfiguredText: {marginTop: 5},

  unconfiguredButton: {marginTop: 14},


  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
  },


  sectionHeadingSub: {marginTop: 2},

  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  todayBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  featureCard: {minHeight: 92, flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 13, paddingVertical: 12},

  featureIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  // Fixed rose family (theme.colors.secondary-derived) — see the JSX call
  // site's own comment for why this stays phase/state-invariant decorative,
  // not a protected medical-severity color.
  featureIconLochia: {
    backgroundColor: withAlpha(theme.colors.secondary, 0.15),
  },

  featureIconCycle: {
    backgroundColor: theme.colors.primarySoft,
  },

  featureCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },


  featureTitle: {marginTop: 3},

  featureValue: {marginTop: 4},

  featureArrow: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  miniTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },



  dailyCard: {marginTop: 4, padding: 15},

  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  dailyHeaderCopy: {
    flex: 1,
  },

  dailySubtitle: {marginTop: 3},

  progressBadge: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },


  progressBadgeText: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  progressTrack: {
    height: 6,
    overflow: 'hidden',
    marginTop: 13,
    borderRadius: 3,
    backgroundColor: theme.colors.primarySoft,
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },

  // The row bleeds 8 dp into the card's 15 dp padding on each side, which is what lets "Récupération" sit on one line.
  dailyGrid: {
    flexDirection: 'row',
    marginTop: 15,
    marginHorizontal: -8,
  },

  // Fallback when the labels do not fit one row at a readable size: 3 + 2, the second row centred.
  dailyGridWrapped: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 12,
  },

  dailyMeasure: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    alignItems: 'flex-start',
  },

  dailyItem: {
    position: 'relative',
    width: '20%',
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 1,
  },

  dailyItemWrapped: {
    width: '33.333%',
  },

  dailyItemPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },

  dailyIconWrap: {
    width: 45,
    height: 45,
  },

  dailyIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    // Separator ring against the icon's own theme-derived fill (surface token).
    borderColor: theme.colors.surface,
    borderRadius: 23,
    backgroundColor: theme.colors.primarySoft,
  },

  dailyIconDone: {
    backgroundColor: theme.colors.primary,
  },

  dailyLabelBox: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 6,
    minHeight: 24,
  },

  dailyLabel: {textAlign: 'center'},

  // Generic "logged today" completion badge — success token, not a
  // symptom-severity claim (same DailyJournalCard/Irregular D3 precedent).
  doneBadge: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
  },

  spiritualWrap: {
    marginTop: 2,
  },

  spiritualBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },


  // Fixed — a modal dim/scrim, not a surface. Matches Phase C's
  // InAppNotificationCenter precedent: overlay dims stay dark regardless of
  // the resolved theme so the sheet above it always pops.
  nifasModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(47, 34, 88, 0.32)',
  },
  nifasModalCard: {width: '100%', maxWidth: 340, alignItems: 'center', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18},
  nifasModalIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  nifasModalTitle: {marginTop: 14, textAlign: 'center'},
  nifasModalBody: {marginTop: 8, textAlign: 'center'},
  nifasModalNote: {marginTop: 8, textAlign: 'center'},
  nifasModalPrimary: {marginTop: 18, width: '100%'},
  nifasModalSecondary: {marginTop: 10, width: '100%'},
  });
}

export default PostpartumDashboard;
