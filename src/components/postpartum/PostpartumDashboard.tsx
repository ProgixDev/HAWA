import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {type QuickActionItem} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import {homeColors, homeShadow} from '../home/homeTheme';
import {
  getFirstName,
  getSelectedLocation,
  getSelectedSchool,
  getSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  subscribeSelectedLocation,
  type SchoolId,
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
import {POSTPARTUM_JOURNAL_ITEMS} from '../../config/postpartumJournalConfig';
import {computePostpartumStatus} from '../../utils/postpartumTrackingUtils';
import {usePostpartumSpiritualStatus} from '../../hooks/usePrayerPurityStatus';
import {formatFullDate, formatHijriDate} from '../../utils/cycleMath';

const BACKGROUND = require('../../assets/images/homebackground.png');
const POSTPARTUM_MOTHER_BABY = require('../../assets/images/postpartum/postpartum-mother-baby.png');

// No dedicated mother-and-baby illustration exists yet in
// src/assets/images/postpartum/ (only delivery-type/feeding icons) — a
// neutral icon circle is used instead of the Pregnancy hero image, per the
// task's explicit "never reuse the pregnant-woman illustration" rule. See
// the final report for the suggested asset path to add later.

const PURPLE = '#6949BE';

type Props = MainTabScreenProps<'CycleHome'>;

const FEEDING_SHORT_LABELS: Record<PostpartumFeedingType, string> = {
  exclusive_breastfeeding: 'Oui (exclusif)',
  mixed: 'Mixte (sein + biberon)',
  exclusive_bottle: 'Biberon',
  unknown: 'Non précisé',
};

const SCHOOL_LABELS: Record<Exclude<SchoolId, 'unknown'>, string> = {
  hanafi: 'Hanafi',
  maliki: 'Maliki',
  chafii: 'Chaféite',
  hanbali: 'Hanbali',
};

// Shared with the "Journal quotidien" sheet + PostpartumJournalEntryScreen —
// see src/config/postpartumJournalConfig.ts, the single source of truth for
// these 5 fixed categories (Fatigue/Sommeil/Humeur/Douleurs/Récupération
// physique) — deliberately different from Pregnancy's own 5 categories.
const DAILY_ITEMS = POSTPARTUM_JOURNAL_ITEMS;

function PostpartumDashboard({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  // Canonical postpartum onboarding data (src/state/postpartumPreferences.ts)
  // — the same source SummaryScreen/ProfileScreen read. Postpartum day/week
  // are derived from deliveryDate via computePostpartumStatus, the one
  // centralized helper — never recomputed inline.
  const [postpartum, setPostpartum] = useState(getPostpartumPreferences);

  useEffect(() => {
    let active = true;
    hydratePostpartumPreferences().then(value => {if (active) {setPostpartum(value);}});
    const unsubscribe = subscribePostpartumPreferences(() => {if (active) {setPostpartum(getPostpartumPreferences());}});
    return () => {active = false; unsubscribe();};
  }, []);

  const deliveryDate = useMemo(
    () => (postpartum.deliveryDate ? new Date(`${postpartum.deliveryDate}T12:00:00`) : null),
    [postpartum.deliveryDate],
  );
  const today = useMemo(() => new Date(), []);
  const status = useMemo(() => computePostpartumStatus(deliveryDate, today), [deliveryDate, today]);

  // Postpartum's OWN daily tracking (src/state/postpartumJournalStore.ts) —
  // never the shared Cycle dailyJournalStore, which also carries
  // Cycle-specific fields (flow/temperature/intimacy) that must never leak
  // into Postpartum.
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const [todayEntry, setTodayEntry] = useState(() => getPostpartumJournalEntry(todayKey));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydratePostpartumJournal().then(() => {if (active) {setTodayEntry(getPostpartumJournalEntry(todayKey));}});
      const unsubscribe = subscribePostpartumJournal(() => {if (active) {setTodayEntry(getPostpartumJournalEntry(todayKey));}});
      return () => {active = false; unsubscribe();};
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
      hydrateSelectedLocation().then(value => {if (active) {setLocation(value);}});
      const unsubscribe = subscribeSelectedLocation(() => {if (active) {setLocation(getSelectedLocation());}});
      return () => {active = false; unsubscribe();};
    }, []),
  );
  const school = useMemo(() => getSelectedSchool(), []);

  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(getSpiritualMarkersEnabled());
  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  // Prayer-schedule/hijri only — deliberately never menstrual purity status
  // (no isMenstruating/purityResult here, unlike Cycle's hook). Nifas is
  // its own distinct state; this dashboard only ever shows a neutral day
  // count for it, never a purity verdict.
  const spiritual = usePostpartumSpiritualStatus(spiritualMarkersEnabled);

  // Same shared bottom-sheet context Cycle/Pregnancy use — JournalSheetHost
  // (see MainTabNavigator.tsx) renders the shared DailyJournalSheet with
  // Postpartum's own 5-category action list while activeObjective ===
  // 'postpartum', so opening it here needs no Postpartum-specific wiring.
  const {open: openPostpartumJournal} = useJournalSheet();

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {return;}
      Animated.timing(entrance, {toValue: 1, duration: reduce ? 0 : 550, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start();
    });
    return () => {active = false;};
  }, [entrance]);

  const quickActionItems: QuickActionItem[] = [
    {key: 'prayer-times', icon: 'mosque', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Horaires\nde prière', onPress: () => navigation.navigate('PrayerTimes')},
    {key: 'library', icon: 'book-open-page-variant-outline', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Bibliothèque', onPress: () => navigation.navigate('Library')},
    {key: 'daily-journal', icon: 'notebook-edit-outline', iconColor: '#B23F63', iconBg: '#F9DCE8', label: 'Journal quotidien', onPress: openPostpartumJournal},
    {key: 'hijri-calendar', icon: 'moon-waning-crescent', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Calendrier Hijri', onPress: () => navigation.navigate('HijriCalendar')},
    {key: 'qadaa', icon: 'silverware-fork-knife', iconColor: PURPLE, iconBg: '#EEE3FA', label: 'Jeûne à rattraper', onPress: () => navigation.navigate('FastingQadaa')},
    {key: 'statistics', icon: 'chart-donut', iconColor: '#2C8E93', iconBg: '#DDF0F1', label: 'Statistiques', onPress: () => navigation.navigate('Statistics')},
  ];

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [14, 0]})}],
  };

  const feedingLabel = postpartum.feedingType ? FEEDING_SHORT_LABELS[postpartum.feedingType] : null;
  const schoolLabel = school && school !== 'unknown' ? SCHOOL_LABELS[school] : null;

  // Real cycle-return state — see PostpartumCycleReturnScreen.tsx, the only
  // place that ever writes firstPostpartumPeriodDate. Never inferred from
  // lochia entries; only an explicit user-confirmed period counts.
  const firstPeriodDate = useMemo(
    () => (postpartum.firstPostpartumPeriodDate ? new Date(`${postpartum.firstPostpartumPeriodDate}T12:00:00`) : null),
    [postpartum.firstPostpartumPeriodDate],
  );
  const cycleReturnValue = firstPeriodDate ? 'Cycle repris' : 'Cycle non repris';
  const cycleReturnSubvalue = firstPeriodDate ? `Depuis le ${formatFullDate(firstPeriodDate)}` : null;
  const nifasValue = status.configured
    ? `Jour ${status.postpartumDay}${schoolLabel ? ` · Selon l’avis ${schoolLabel}` : ''}`
    : undefined;

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 28,
            },
          ]}
          showsVerticalScrollIndicator={false}>
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
                      color={homeColors.primary}
                      name="heart-circle-outline"
                      size={15}
                    />
                    <Text style={styles.heroBadgeText}>POST-PARTUM</Text>
                  </View>

                  <Text style={styles.heroTitle}>Ton post-partum</Text>

                  <View style={styles.heroDayRow}>
                    <Text style={styles.heroDay}>Jour {status.postpartumDay}</Text>
                    <View style={styles.heroDayDot} />
                  </View>

                  <Text style={styles.heroSubLabel}>
                    Une étape à la fois, avec douceur.
                  </Text>

                  <View style={styles.heroDateBlock}>
                    <MaterialDesignIcons
                      color={homeColors.primary}
                      name="calendar-heart"
                      size={16}
                    />
                    <View style={styles.heroDateCopy}>
                      <Text style={styles.heroDeliveryLabel}>Accouchement le</Text>
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
                      color={homeColors.primary}
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
                  style={({pressed}) => [
                    styles.unconfiguredButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.unconfiguredButtonText}>
                    Renseigner la date
                  </Text>
                  <MaterialDesignIcons
                    color="#FFFFFF"
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
                  color={homeColors.primary}
                  name="calendar-today-outline"
                  size={15}
                />
                <Text style={styles.todayBadgeText}>Aujourd’hui</Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel="Lochies aujourd’hui"
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostpartumLochia')}
              style={({pressed}) => [
                styles.featureCard,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.featureIcon, styles.featureIconLochia]}>
                <MaterialDesignIcons
                  color="#D76578"
                  name="water-outline"
                  size={24}
                />
              </View>

              <View style={styles.featureCopy}>
                <Text style={styles.featureEyebrow}>SUIVI QUOTIDIEN</Text>
                <Text style={styles.featureTitle}>Lochies aujourd’hui</Text>
                <Text style={styles.featureValue}>
                  Aucune information enregistrée aujourd’hui
                </Text>
              </View>

              <View style={styles.featureArrow}>
                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="chevron-right"
                  size={22}
                />
              </View>
            </Pressable>

            <Pressable
              accessibilityLabel="Retour du cycle"
              accessibilityRole="button"
              onPress={() => navigation.navigate('PostpartumCycleReturn')}
              style={({pressed}) => [
                styles.featureCard,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.featureIcon, styles.featureIconCycle]}>
                <MaterialDesignIcons
                  color={homeColors.primary}
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
                      color={homeColors.primary}
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
                  color={homeColors.primary}
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
                      style={({pressed}) => [
                        styles.dailyItem,
                        pressed && styles.dailyItemPressed,
                      ]}>
                      <View
                        style={[
                          styles.dailyIcon,
                          done && styles.dailyIconDone,
                        ]}>
                        <MaterialDesignIcons
                          color={done ? '#FFFFFF' : homeColors.primary}
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
                            color="#FFFFFF"
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
                    <Text style={styles.sectionHeading}>Repères spirituels</Text>
                    <Text style={styles.sectionHeadingSub}>
                      Tes repères du jour, avec sérénité
                    </Text>
                  </View>

                  <View style={styles.spiritualBadge}>
                    <MaterialDesignIcons
                      color={homeColors.primary}
                      name="moon-waning-crescent"
                      size={15}
                    />
                  </View>
                </View>

                <SpiritualGuidanceCard
                  hijriDate={
                    spiritual.schedule?.hijriDate ?? formatHijriDate(today)
                  }
                  locationConfigured={Boolean(location)}
                  locationName={
                    location
                      ? `${location.city}, ${location.country}`
                      : undefined
                  }
                  nextWindow={spiritual.nextWindow}
                  nifasValue={nifasValue}
                  objective="postpartum"
                  onManage={() =>
                    navigation.navigate('SpiritualPreferences')
                  }
                  prayerError={spiritual.error}
                  prayerLoading={spiritual.loading}
                  timezone={spiritual.schedule?.timezone}
                />
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F8EFFF',
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
    ...homeShadow,
    position: 'relative',
    minHeight: 226,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.10)',
    borderRadius: 30,
    backgroundColor: 'rgba(255,252,255,0.96)',
  },

  heroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -35,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(225,209,248,0.70)',
  },

  heroGlowBottom: {
    position: 'absolute',
    left: 84,
    bottom: -90,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(248,220,234,0.45)',
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
    backgroundColor: '#F1EAFB',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  heroBadgeText: {
    color: homeColors.primary,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  heroTitle: {
    marginTop: 12,
    color: homeColors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  heroDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  heroDay: {
    color: homeColors.textPrimary,
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
    backgroundColor: '#D982A0',
  },

  heroSubLabel: {
    marginTop: 2,
    maxWidth: 180,
    color: homeColors.textSecondary,
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
    backgroundColor: 'rgba(246,239,255,0.90)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  heroDateCopy: {
    flexShrink: 1,
  },

  heroDeliveryLabel: {
    color: homeColors.textSecondary,
    fontSize: 8.5,
    fontWeight: '600',
  },

  heroDelivery: {
    marginTop: 1,
    color: homeColors.primary,
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
    backgroundColor: 'rgba(236,224,251,0.90)',
  },

  heroImage: {
    width: '108%',
    height: '100%',
  },

  unconfiguredCard: {
    ...homeShadow,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.10)',
    borderRadius: 26,
    backgroundColor: 'rgba(255,253,255,0.96)',
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
    backgroundColor: homeColors.lightLavender,
  },

  unconfiguredCopy: {
    flex: 1,
    marginLeft: 12,
  },

  unconfiguredTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },

  unconfiguredText: {
    marginTop: 5,
    color: homeColors.textSecondary,
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
    backgroundColor: homeColors.primary,
  },

  unconfiguredButtonText: {
    color: '#FFFFFF',
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
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionHeadingSub: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 9.5,
  },

  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 13,
    backgroundColor: '#F1EAFB',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  todayBadgeText: {
    color: homeColors.primary,
    fontSize: 8.5,
    fontWeight: '800',
  },

  featureCard: {
    ...homeShadow,
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.07)',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
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

  featureIconLochia: {
    backgroundColor: '#FCECEF',
  },

  featureIconCycle: {
    backgroundColor: '#EEE7FA',
  },

  featureCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  featureEyebrow: {
    color: homeColors.primary,
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  featureTitle: {
    marginTop: 3,
    color: homeColors.textPrimary,
    fontSize: 14.5,
    fontWeight: '800',
  },

  featureValue: {
    marginTop: 4,
    color: homeColors.textSecondary,
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
    backgroundColor: '#F3ECFB',
  },

  miniTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    borderRadius: 11,
    backgroundColor: '#F3ECFB',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  miniTagText: {
    color: homeColors.primary,
    fontSize: 8.5,
    fontWeight: '700',
  },

  cardTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },

  dailyCard: {
    ...homeShadow,
    marginTop: 4,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.07)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,255,0.97)',
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
    color: homeColors.textSecondary,
    fontSize: 9.5,
  },

  progressBadge: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F1EAFB',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  dailyProgressStrong: {
    color: homeColors.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  progressBadgeText: {
    marginTop: 1,
    color: homeColors.textSecondary,
    fontSize: 7.5,
  },

  progressTrack: {
    height: 6,
    overflow: 'hidden',
    marginTop: 13,
    borderRadius: 3,
    backgroundColor: '#EEE8F7',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: homeColors.primary,
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
    transform: [{scale: 0.97}],
  },

  dailyIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 23,
    backgroundColor: '#F0E9FB',
  },

  dailyIconDone: {
    backgroundColor: homeColors.primary,
  },

  dailyLabel: {
    minHeight: 24,
    marginTop: 6,
    color: homeColors.textPrimary,
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: 'center',
  },

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
    backgroundColor: '#62A77A',
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
    backgroundColor: '#F1EAFB',
  },

  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
});

export default PostpartumDashboard;