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
  View,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type { MainTabScreenProps } from '../../navigation/MainTabNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {
  type QuickActionItem,
} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../home/ObjectiveArticlesSection';
import { getFloatingTabBarClearance } from '../../theme/spacing';
import { homeRadii } from '../home/homeTheme';
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
  hasReligiousNifasEnded,
} from '../../utils/postpartumTrackingUtils';
import {
  hydratePostpartumNifasReminderState,
  isPostpartumNifasCompletionAcknowledged,
  setPostpartumNifasCompletionAcknowledged,
} from '../../state/postpartumNifasReminderStore';
import { usePostpartumSpiritualStatus } from '../../hooks/usePrayerPurityStatus';
import { formatFullDate, formatHijriDate } from '../../utils/cycleMath';
import { NIFAS_EDUCATIONAL_ARTICLE_ID } from '../../config/nifasReminderConfig';

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

const FEEDING_SHORT_LABELS: Record<PostpartumFeedingType, string> = {
  exclusive_breastfeeding: 'Oui (exclusif)',
  mixed: 'Mixte (sein + biberon)',
  exclusive_bottle: 'Biberon',
  unknown: 'Non précisé',
};

// Shared with the "Journal quotidien" sheet + PostpartumJournalEntryScreen —
// see src/config/postpartumJournalConfig.ts, the single source of truth for
// these 5 fixed categories (Fatigue/Sommeil/Humeur/Douleurs/Récupération
// physique) — deliberately different from Pregnancy's own 5 categories.
const DAILY_ITEMS = POSTPARTUM_JOURNAL_ITEMS;

function PostpartumDashboard({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const today = useMemo(() => new Date(), []);
  const status = useMemo(
    () => computePostpartumStatus(deliveryDate, today),
    [deliveryDate, today],
  );

  // Postpartum's OWN daily tracking (src/state/postpartumJournalStore.ts) —
  // never the shared Cycle dailyJournalStore, which also carries
  // Cycle-specific fields (flow/temperature/intimacy) that must never leak
  // into Postpartum.
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
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

  // Religious Nifas has a hard NIFAS_REFERENCE_DAYS-day maximum (AWA product
  // decision, independent from the unbounded general Postpartum tracking
  // above). Once that reference day is reached and the user hasn't
  // acknowledged it yet for this deliveryDate, show the small completion
  // popup right on top of this same Dashboard (no navigation) — this
  // re-checks on every focus (not just app launch), so returning to the
  // Dashboard on any later day (e.g. closing the app on J38, reopening on
  // J43) still catches it exactly once. `nifasCompletionAcknowledged` also
  // silences the old "reference reached" banner below once true, so it
  // never persists forever after the user has already been told.
  const [nifasCompletionAcknowledged, setNifasCompletionAcknowledged] =
    useState(false);
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
        if (!preferences.deliveryDate || !getSpiritualMarkersEnabled() || acknowledged) {
          return;
        }
        const deliveryDateValue = new Date(`${preferences.deliveryDate}T12:00:00`);
        if (hasReligiousNifasEnded(deliveryDateValue, new Date())) {
          setNifasCompletionModalVisible(true);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const acknowledgeNifasCompletion = useCallback(async () => {
    if (postpartum.deliveryDate) {
      await setPostpartumNifasCompletionAcknowledged(postpartum.deliveryDate);
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
    // Category E (fixed action-identity accent, same as every prior
    // dashboard — never theme-driven).
    {
      key: 'daily-journal',
      icon: 'notebook-edit-outline',
      iconColor: '#B23F63',
      iconBg: '#F9DCE8',
      label: 'Journal quotidien',
      onPress: openPostpartumJournal,
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
      key: 'statistics',
      icon: 'chart-donut',
      iconColor: '#2C8E93',
      iconBg: '#DDF0F1',
      label: 'Statistiques',
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
    ? 'Cycle repris'
    : 'Cycle non repris';
  const cycleReturnSubvalue = firstPeriodDate
    ? `Depuis le ${formatFullDate(firstPeriodDate)}`
    : null;
  const todayLochia = lochiaEntries[todayKey];
  const lochiaDashboardValue = todayLochia
    ? `${todayLochia.flow} · ${todayLochia.color}`
    : lochiaSummary.status === 'ended'
    ? `Terminées · ${lochiaSummary.durationDays ?? '—'} jours`
    : 'Aucune information enregistrée aujourd’hui';
  const nifasValue =
    nifasStatus.status === 'losses_ended'
      ? 'Pertes terminées'
      : nifasStatus.status === 'losses_ongoing'
      ? `Jour ${nifasStatus.postpartumDay} · Pertes en cours`
      : nifasStatus.postpartumDay > 0
      ? `Jour ${nifasStatus.postpartumDay} · Suivi non renseigné`
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

  return (
    <>
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}
    >
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
            {
              paddingBottom: getFloatingTabBarClearance(insets.bottom, 28),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader
            firstName={getFirstName()}
            onPressProfile={() => navigation.navigate('Profile')}
            subtitle="Prends soin de toi, un jour à la fois 💜"
          />

          <Animated.View style={entranceStyle}>
            {status.configured ? (
              <View style={styles.heroCard}>
                <View style={styles.heroGlowTop} />
                <View style={styles.heroGlowBottom} />

                <View style={styles.heroCopy}>
                  <View style={styles.heroBadge}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="heart-circle-outline"
                      size={15}
                    />
                    <Text style={styles.heroBadgeText}>POST-PARTUM</Text>
                  </View>

                  <Text style={styles.heroTitle}>Ton post-partum</Text>

                  <View style={styles.heroDayRow}>
                    <Text style={styles.heroDay}>
                      Jour {status.postpartumDay}
                    </Text>
                    <View style={styles.heroDayDot} />
                  </View>

                  <Text style={styles.heroSubLabel}>
                    Une étape à la fois, avec douceur.
                  </Text>

                  <View style={styles.heroDateBlock}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="calendar-heart"
                      size={16}
                    />
                    <View style={styles.heroDateCopy}>
                      <Text style={styles.heroDeliveryLabel}>
                        Accouchement le
                      </Text>
                      <Text style={styles.heroDelivery}>
                        {formatFullDate(deliveryDate as Date)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.heroIllustration}>
                  <View style={styles.heroHalo} />
                  <Image
                    accessibilityIgnoresInvertColors
                    accessibilityLabel="Maman avec son nouveau-né"
                    resizeMode="contain"
                    source={POSTPARTUM_MOTHER_BABY}
                    style={styles.heroImage}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.unconfiguredCard}>
                <View style={styles.unconfiguredTop}>
                  <View style={styles.unconfiguredIcon}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="calendar-heart"
                      size={28}
                    />
                  </View>
                  <View style={styles.unconfiguredCopy}>
                    <Text style={styles.unconfiguredTitle}>
                      Indique ta date d’accouchement
                    </Text>
                    <Text style={styles.unconfiguredText}>
                      Nous personnaliserons ensuite ton suivi jour après jour.
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityLabel="Indique ta date d’accouchement"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('PostpartumDeliveryDate')}
                  style={({ pressed }) => [
                    styles.unconfiguredButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.unconfiguredButtonText}>
                    Renseigner la date
                  </Text>
                  <MaterialDesignIcons
                    color={onPrimaryTextColor(theme)}
                    name="arrow-right"
                    size={18}
                  />
                </Pressable>
              </View>
            )}

            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionHeading}>Aujourd’hui</Text>
                <Text style={styles.sectionHeadingSub}>
                  Ton suivi essentiel en un coup d’œil
                </Text>
              </View>

              <View style={styles.todayBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="calendar-today-outline"
                  size={15}
                />
                <Text style={styles.todayBadgeText}>Aujourd’hui</Text>
              </View>
            </View>

            {/* PHASE D6 — this card's rose icon (theme.colors.secondary, was
                fixed '#D76578') is a domain-flavor decorative accent, NOT a
                protected medical-severity color: it never changes based on
                the actual recorded flow/color/status (lochiaDashboardValue
                below), unlike a real semantic marker would. Migrated
                consistent with Conceive D4's identical "phase-invariant
                pink badge" finding. */}
            <Pressable
              accessibilityLabel="Lochies aujourd’hui"
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostpartumLochia')}
              style={({ pressed }) => [
                styles.featureCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.featureIcon, styles.featureIconLochia]}>
                <MaterialDesignIcons
                  color={theme.colors.secondary}
                  name="water-outline"
                  size={24}
                />
              </View>

              <View style={styles.featureCopy}>
                <Text style={styles.featureEyebrow}>SUIVI QUOTIDIEN</Text>
                <Text style={styles.featureTitle}>Lochies aujourd’hui</Text>
                <Text style={styles.featureValue}>{lochiaDashboardValue}</Text>
              </View>

              <View style={styles.featureArrow}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-right"
                  size={22}
                />
              </View>
            </Pressable>

            <Pressable
              accessibilityLabel="Retour du cycle"
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostpartumCycleReturn')}
              style={({ pressed }) => [
                styles.featureCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.featureIcon, styles.featureIconCycle]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="sync"
                  size={24}
                />
              </View>

              <View style={styles.featureCopy}>
                <Text style={styles.featureEyebrow}>ÉVOLUTION</Text>
                <Text style={styles.featureTitle}>Retour du cycle</Text>
                <Text style={styles.featureValue}>{cycleReturnValue}</Text>
                {cycleReturnSubvalue ? (
                  <Text style={styles.featureValue}>{cycleReturnSubvalue}</Text>
                ) : null}

                {feedingLabel ? (
                  <View style={styles.miniTag}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="baby-bottle-outline"
                      size={13}
                    />
                    <Text style={styles.miniTagText}>
                      Allaitement : {feedingLabel}
                    </Text>
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
            </Pressable>

            <View style={styles.dailyCard}>
              <View style={styles.dailyHeader}>
                <View style={styles.dailyHeaderCopy}>
                  <Text style={styles.cardTitle}>Suivi du jour</Text>
                  <Text style={styles.dailySubtitle}>
                    Prends un instant pour toi
                  </Text>
                </View>

                <View style={styles.progressBadge}>
                  <Text style={styles.dailyProgressStrong}>
                    {completedTodayCount}/{DAILY_ITEMS.length}
                  </Text>
                  <Text style={styles.progressBadgeText}>complété</Text>
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

              <View style={styles.dailyGrid}>
                {DAILY_ITEMS.map(item => {
                  const done = Boolean(todayEntry?.[item.key]);

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
                        pressed && styles.dailyItemPressed,
                      ]}
                    >
                      <View
                        style={[styles.dailyIcon, done && styles.dailyIconDone]}
                      >
                        <MaterialDesignIcons
                          color={done ? onPrimaryTextColor(theme) : theme.colors.primary}
                          name={item.icon}
                          size={22}
                        />
                      </View>

                      <Text numberOfLines={2} style={styles.dailyLabel}>
                        {item.dashboardLabel}
                      </Text>

                      {done ? (
                        <View style={styles.doneBadge}>
                          <MaterialDesignIcons
                            color={pickReadableTextColor(theme.colors.success)}
                            name="check"
                            size={9}
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <QuickActionsGrid items={quickActionItems} />

            {spiritualMarkersEnabled ? (
              <View style={styles.spiritualWrap}>
                <View style={styles.sectionHeadingRow}>
                  <View>
                    <Text style={styles.sectionHeading}>
                      Repères spirituels
                    </Text>
                    <Text style={styles.sectionHeadingSub}>
                      Tes repères du jour, avec sérénité
                    </Text>
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
      visible={nifasCompletionModalVisible}
    >
      <View style={styles.nifasModalOverlay}>
        <View style={styles.nifasModalCard}>
          <View style={styles.nifasModalIconWrap}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="weather-night"
              size={26}
            />
          </View>

          <Text style={styles.nifasModalTitle}>
            Le repère des 40 jours retenu par AWA est atteint
          </Text>

          <Text style={styles.nifasModalBody}>
            Selon ce repère, tu peux reprendre tes prières à partir
            d’aujourd’hui, même si les lochies ou les saignements
            persistent. Suis la référence religieuse que tu as choisie.
          </Text>

          <Text style={styles.nifasModalNote}>
            Tu peux continuer ton suivi post-partum dans AWA.
          </Text>

          <Pressable
            accessibilityLabel="Compris"
            accessibilityRole="button"
            onPress={handleNifasCompletionContinue}
            style={({pressed}) => [
              styles.nifasModalPrimary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.nifasModalPrimaryText}>Compris</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Choisir un autre suivi"
            accessibilityRole="button"
            onPress={handleNifasCompletionChooseAnother}
            style={({pressed}) => [
              styles.nifasModalSecondary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.nifasModalSecondaryText}>
              Choisir un autre suivi
            </Text>
          </Pressable>
        </View>
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
    borderRadius: 30,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
  },

  heroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -35,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: withAlpha(theme.colors.primary, 0.70),
  },

  heroGlowBottom: {
    position: 'absolute',
    left: 84,
    bottom: -90,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: withAlpha(theme.colors.secondary, 0.45),
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
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  heroBadgeText: {
    color: theme.colors.primary,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  heroTitle: {
    marginTop: 12,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

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

  heroSubLabel: {
    marginTop: 2,
    maxWidth: 180,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
  },

  heroDateBlock: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.90),
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  heroDateCopy: {
    flexShrink: 1,
  },

  heroDeliveryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8.5,
    fontWeight: '600',
  },

  heroDelivery: {
    marginTop: 1,
    color: theme.colors.primary,
    fontSize: 10.5,
    fontWeight: '800',
  },

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

  unconfiguredCard: {
    ...theme.shadow,
    marginTop: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),
    borderRadius: 26,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
    padding: 18,
  },

  unconfiguredTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  unconfiguredIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
  },

  unconfiguredCopy: {
    flex: 1,
    marginLeft: 12,
  },

  unconfiguredTitle: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },

  unconfiguredText: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  unconfiguredButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
  },

  unconfiguredButtonText: {
    color: onPrimaryTextColor(theme),
    fontSize: 13.5,
    fontWeight: '800',
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  sectionHeading: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionHeadingSub: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
  },

  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  todayBadgeText: {
    color: theme.colors.primary,
    fontSize: 8.5,
    fontWeight: '800',
  },

  featureCard: {
    ...theme.shadow,
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 22,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  featureIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
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

  featureEyebrow: {
    color: theme.colors.primary,
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  featureTitle: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 14.5,
    fontWeight: '800',
  },

  featureValue: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },

  featureArrow: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
  },

  miniTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  miniTagText: {
    color: theme.colors.primary,
    fontSize: 8.5,
    fontWeight: '700',
  },

  cardTitle: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },

  dailyCard: {
    ...theme.shadow,
    marginTop: 4,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.97),
  },

  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  dailyHeaderCopy: {
    flex: 1,
  },

  dailySubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
  },

  progressBadge: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  dailyProgressStrong: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  progressBadgeText: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 7.5,
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

  dailyGrid: {
    flexDirection: 'row',
    marginTop: 15,
  },

  dailyItem: {
    position: 'relative',
    width: '20%',
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 1,
  },

  dailyItemPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },

  dailyIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    // Fixed — a decorative separator ring against the icon's own
    // theme-derived fill, same treatment as AnimatedProgressRing's
    // glintDot/Conceive's timeline-puck border (D2/D4 precedent).
    borderColor: '#FFFFFF',
    borderRadius: 23,
    backgroundColor: theme.colors.primarySoft,
  },

  dailyIconDone: {
    backgroundColor: theme.colors.primary,
  },

  dailyLabel: {
    minHeight: 24,
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: 'center',
  },

  // Generic "logged today" completion badge — success token, not a
  // symptom-severity claim (same DailyJournalCard/Irregular D3 precedent).
  doneBadge: {
    position: 'absolute',
    top: 32,
    right: 7,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
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
  nifasModalCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    ...theme.shadow,
  },
  nifasModalIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  nifasModalTitle: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  nifasModalBody: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  nifasModalNote: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  nifasModalPrimary: {
    marginTop: 18,
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: homeRadii.button,
    backgroundColor: theme.colors.primary,
  },
  nifasModalPrimaryText: {
    color: onPrimaryTextColor(theme),
    fontSize: 15,
    fontWeight: '700',
  },
  nifasModalSecondary: {
    marginTop: 10,
    width: '100%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nifasModalSecondaryText: {
    color: theme.colors.primary,
    fontSize: 13.5,
    fontWeight: '600',
  },
  });
}

export default PostpartumDashboard;
