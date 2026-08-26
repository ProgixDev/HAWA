import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import {homeColors, homeShadow} from '../home/homeTheme';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';
import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {type QuickActionItem} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../home/ObjectiveArticlesSection';
import {AnimatedProgressRing} from '../home/AnimatedProgressRing';
import {usePrayerPurityStatus} from '../../hooks/usePrayerPurityStatus';
import {useQadaaStatus} from '../../hooks/useQadaaStatus';
import {
  getFirstName,
  getSpiritualMarkersEnabled,
  hydrateSpiritualMarkersEnabled,
  subscribeSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';
import {loadPersonalInformation} from '../../state/personalInformationStore';
import {getJournalEntry} from '../../state/dailyJournalStore';
import {
  getIrregularPreferences,
  hydrateIrregularPreferences,
  subscribeIrregularPreferences,
} from '../../state/irregularPreferences';
import {
  getIrregularJournalEntry,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
} from '../../state/irregularJournalStore';
import {IRREGULAR_JOURNAL_ITEMS} from '../../config/irregularJournalConfig';
import {
  computeIrregularCycleDay,
  computeIrregularDailyProgress,
  prioritizeIrregularCategories,
} from '../../utils/irregularDailyTrackingMath';
import {formatHijriDate} from '../../utils/cycleMath';
import {useJournalSheet} from '../../navigation/JournalSheetContext';

// SOPK ("Cycles irréguliers") Dashboard — a COMPOSITION of the exact same
// shared components every other objective Dashboard already uses
// (HomeHeader, QuickActionsGrid, SpiritualGuidanceCard,
// ObjectiveArticlesSection — see CycleHomeScreen.tsx/MenopauseDashboard.tsx/
// ContraceptionDashboard.tsx for the identical reuse pattern), plus a small
// amount of genuinely SOPK-specific composition (the main cycle card and
// "Ma situation SOPK" card) rather than a rebuilt shared component.
//
// CRITICAL PRODUCT RULE: this file must never classify a long cycle as a
// delay. It deliberately does NOT call cycleMath.ts's
// computeCyclePredictionStatus() (whose 'window' mode carries the `isLate`
// flag behind Cycle's own "Règles en retard" wording) — see
// irregularDailyTrackingMath.ts's computeIrregularCycleDay(), which only
// ever returns a plain elapsed-day count with no "late" concept at all.

type Props = MainTabScreenProps<'CycleHome'>;

function IrregularDashboard({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;

  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const [spiritualMarkersEnabled, setSpiritualMarkersEnabledState] = useState(getSpiritualMarkersEnabled);
  const [irregularPrefs, setIrregularPrefs] = useState(getIrregularPreferences);
  const [todayEntry, setTodayEntry] = useState(() => getIrregularJournalEntry(todayKey));
  const [periodDoneToday, setPeriodDoneToday] = useState(false);

  const prayer = usePrayerPurityStatus(spiritualMarkersEnabled);
  const qadaa = useQadaaStatus();
  const {open: openJournal} = useJournalSheet();

  const dailyEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dailyEntrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dailyEntrance]);

  const dailyEntranceStyle = {
    opacity: dailyEntrance,
    transform: [
      {
        translateY: dailyEntrance.interpolate({inputRange: [0, 1], outputRange: [14, 0]}),
      },
    ],
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadPersonalInformation();

      hydrateSpiritualMarkersEnabled().then(() => {
        if (active) {setSpiritualMarkersEnabledState(getSpiritualMarkersEnabled());}
      });

      hydrateIrregularPreferences().then(value => {
        if (active) {setIrregularPrefs(value);}
      });

      hydrateIrregularJournal().then(() => {
        if (active) {setTodayEntry(getIrregularJournalEntry(todayKey));}
      });

      getJournalEntry(todayKey).then(entry => {
        if (active) {setPeriodDoneToday(Boolean(entry?.flow));}
      });

      const unsubscribeSpiritual = subscribeSpiritualMarkersEnabled(() => {
        setSpiritualMarkersEnabledState(getSpiritualMarkersEnabled());
      });
      const unsubscribeIrregularPrefs = subscribeIrregularPreferences(() => {
        setIrregularPrefs(getIrregularPreferences());
      });
      const unsubscribeIrregularJournal = subscribeIrregularJournal(() => {
        setTodayEntry(getIrregularJournalEntry(todayKey));
      });

      return () => {
        active = false;
        unsubscribeSpiritual();
        unsubscribeIrregularPrefs();
        unsubscribeIrregularJournal();
      };
    }, [todayKey]),
  );

  // Real elapsed-day count from SOPK's OWN onboarding answer
  // (irregularPreferences.lastPeriodDate — "Quand ont commencé tes
  // dernières règles ?") — deliberately NOT the shared
  // onboardingPreferences.cyclePreferences/hasConfirmedCycleData the
  // standard Cycle objective uses, since that store is only ever populated
  // by CycleInformationScreen.tsx/PeriodStartBottomSheet.tsx, neither of
  // which a pure-SOPK user ever visits — reading it here left this ring
  // permanently stuck on "Cycle à renseigner" even after the user answered
  // the onboarding question and kept recording her periods. Never a
  // fabricated day 1, and never a "late" classification for a long real gap
  // (see this file's own header comment and irregularDailyTrackingMath.ts).
  const irregularLastPeriodStart = irregularPrefs.lastPeriodDate
    ? new Date(`${irregularPrefs.lastPeriodDate}T12:00:00`)
    : null;
  const cycleDay = computeIrregularCycleDay(irregularLastPeriodStart, new Date());

  const dailyCategoryKeys = useMemo(
    () => prioritizeIrregularCategories(IRREGULAR_JOURNAL_ITEMS.map(item => item.key), irregularPrefs.trackedItems),
    [irregularPrefs.trackedItems],
  );
  const orderedDailyItems = useMemo(
    () =>
      dailyCategoryKeys
        .map(key => IRREGULAR_JOURNAL_ITEMS.find(item => item.key === key))
        .filter((item): item is (typeof IRREGULAR_JOURNAL_ITEMS)[number] => Boolean(item)),
    [dailyCategoryKeys],
  );
  const progress = useMemo(
    () => computeIrregularDailyProgress(periodDoneToday, todayEntry, dailyCategoryKeys),
    [periodDoneToday, todayEntry, dailyCategoryKeys],
  );
  const progressRatio = progress.total > 0 ? progress.completed / progress.total : 0;



  const quickActionItems: QuickActionItem[] = [
    {
      key: 'prayer-times',
      icon: 'mosque',
      iconColor: homeColors.primary,
      iconBg: '#EEE3FA',
      label: 'Horaires\nde prière',
      onPress: () => navigation.navigate('PrayerTimes'),
    },
    {
      key: 'library',
      icon: 'book-open-page-variant-outline',
      iconColor: homeColors.primary,
      iconBg: '#EEE3FA',
      label: 'Bibliothèque',
      onPress: () => navigation.navigate('Library'),
    },
    {
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
      iconColor: homeColors.primary,
      iconBg: '#EEE3FA',
      label: 'Calendrier Hijri',
      onPress: () => navigation.navigate('HijriCalendar'),
    },
    {
      key: 'qadaa',
      icon: 'silverware-fork-knife',
      iconColor: homeColors.primary,
      iconBg: '#EEE3FA',
      label: 'Jeûnes à rattraper',
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

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: compact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA,
              paddingBottom: Math.max(insets.bottom, 12) + 22,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <HomeHeader
            firstName={getFirstName()}
            onPressProfile={() => navigation.navigate('Profile')}
            subtitle="Ton suivi, en toute discrétion."
          />

          {/* ==================================================
              MAIN SOPK CARD
          =================================================== */}

          <View style={[styles.mainCard, compact && styles.mainCardCompact]}>
            <View style={styles.mainCardTopRow}>
              <View style={styles.mainCopy}>
                <View style={styles.badge}>
                  <MaterialDesignIcons color={homeColors.primary} name="flower-outline" size={13} />
                  <Text style={styles.badgeText}>MODE SOPK</Text>
                </View>

                <Text style={styles.mainTitle}>Cycles irréguliers</Text>

                <View style={styles.profileLine}>
                  <View style={styles.profileInfoIcon}>
                    <MaterialDesignIcons color={homeColors.primary} name="information-outline" size={15} />
                  </View>
                  <Text style={styles.mainSubtitle}>Suivi adapté à ton profil</Text>
                </View>

                <Text style={styles.mainDescription}>
                  AWA t’accompagne pour suivre tes symptômes et mieux comprendre ton corps.
                </Text>
              </View>

              <View style={styles.ringWrap}>
                <AnimatedProgressRing
                  accessibilityLabel={
                    cycleDay !== null
                      ? `Jour ${cycleDay} de ton cycle, suivi en cours`
                      : 'Cycle à renseigner, suivi en cours'
                  }
                  centerCaption="Jour"
                  centerDetail="de ton cycle"
                  centerValue={cycleDay ?? undefined}
                  footnote={cycleDay !== null ? 'Suivi en cours' : 'Suivi en cours'}
                  isConfigured={cycleDay !== null}
                  // No valid fixed-length denominator exists for an irregular
                  // SOPK cycle (never currentDay / 28) — the arc is a purely
                  // decorative "actively tracked" indicator here, never a
                  // claimed fraction of a predicted cycle length. See this
                  // file's own header comment and the final report for the
                  // full rationale.
                  progress={cycleDay !== null ? 1 : 0}
                  statusColor={homeColors.primary}
                  statusIcon="calendar-clock-outline"
                  statusText="Cycle à renseigner"
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('IrregularCyclePattern')}
              style={({pressed}) => [styles.calloutCard, pressed && styles.calloutPressed]}>
              <View style={styles.calloutIcon}>
                <MaterialDesignIcons color="#FFFFFF" name="information-outline" size={16} />
              </View>
              <Text style={styles.calloutText}>
                Dans le mode SOPK, un cycle long n’est pas considéré automatiquement comme un retard.
              </Text>
              <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={20} />
            </Pressable>
          </View>

          {/* ==================================================
              ACTIONS RAPIDES
          =================================================== */}

          <QuickActionsGrid items={quickActionItems} />

          {/* ==================================================
              REPÈRES SPIRITUELS
          =================================================== */}

          {spiritualMarkersEnabled ? (
            <SpiritualGuidanceCard
              hijriDate={formatHijriDate(new Date())}
              isMenstruating={prayer.isMenstruating}
              locationConfigured={Boolean(prayer.selectedLocation)}
              locationName={
                prayer.selectedLocation
                  ? `${prayer.selectedLocation.city}, ${prayer.selectedLocation.country}`
                  : undefined
              }
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

          {/* ==================================================
              SUIVI DU JOUR
          =================================================== */}

          <Animated.View style={[styles.dailyCard, compact && styles.dailyCardCompact, dailyEntranceStyle]}>
            <Pressable
              accessibilityLabel="Ouvrir le journal du jour"
              accessibilityRole="button"
              onPress={() => navigation.navigate('IrregularJournalOverview')}
              style={({pressed}) => [styles.dailyHeader, pressed && styles.pressed]}>
              <View style={styles.dailyHeaderLeft}>
                <View style={styles.dailyHeaderIcon}>
                  <MaterialDesignIcons color={homeColors.primary} name="notebook-check-outline" size={20} />
                </View>
                <View style={styles.dailyHeaderCopy}>
                  <Text style={styles.dailyTitle}>Suivi du jour</Text>
                  <Text style={styles.dailySubtitle}>Note ce qui compte aujourd’hui, à ton rythme.</Text>
                </View>
              </View>

              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeValue}>{progress.completed}/{progress.total}</Text>
                <Text style={styles.progressBadgeLabel}>complété</Text>
              </View>
            </Pressable>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${Math.round(progressRatio * 100)}%`}]} />
            </View>

            <Text style={styles.dailySectionLabel}>MES SUIVIS</Text>

            <View style={styles.dailyGrid}>
              <Pressable
                accessibilityLabel="Règles"
                onPress={() => navigation.navigate('IrregularJournalEntry', {category: 'period'})}
                style={({pressed}) => [
                  styles.dailyItem,
                  periodDoneToday && styles.dailyItemDone,
                  pressed && styles.dailyItemPressed,
                ]}>
                <View style={[styles.dailyIcon, periodDoneToday && styles.dailyIconDone]}>
                  <MaterialDesignIcons color={periodDoneToday ? '#FFFFFF' : homeColors.primary} name="water-outline" size={20} />
                </View>
                <View style={styles.dailyItemCopy}>
                  <Text style={styles.dailyLabel}>Règles</Text>
                  <Text style={styles.dailyItemSubtitle}>Renseigne le début de tes règles</Text>
                </View>
                <View style={[styles.dailyStateIndicator, periodDoneToday && styles.dailyStateIndicatorDone]}>
                  {periodDoneToday ? (
                    <MaterialDesignIcons color="#FFFFFF" name="check" size={10} />
                  ) : (
                    <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={15} />
                  )}
                </View>
              </Pressable>

              {orderedDailyItems.map(item => {
                const done = Boolean(todayEntry?.[item.key]);
                return (
                  <Pressable
                    accessibilityLabel={item.label}
                    key={item.key}
                    onPress={() => navigation.navigate('IrregularJournalEntry', {category: item.key})}
                    style={({pressed}) => [styles.dailyItem, done && styles.dailyItemDone, pressed && styles.dailyItemPressed]}>
                    <View style={[styles.dailyIcon, done && styles.dailyIconDone]}>
                      <MaterialDesignIcons color={done ? '#FFFFFF' : homeColors.primary} name={item.icon} size={20} />
                    </View>
                    <View style={styles.dailyItemCopy}>
                      <Text style={styles.dailyLabel}>{item.dashboardLabel}</Text>
                      <Text style={styles.dailyItemSubtitle}>{item.dashboardSubtitle}</Text>
                    </View>
                    <View style={[styles.dailyStateIndicator, done && styles.dailyStateIndicatorDone]}>
                      {done ? (
                        <MaterialDesignIcons color="#FFFFFF" name="check" size={10} />
                      ) : (
                        <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={15} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('IrregularJournalOverview')}
              style={({pressed}) => [styles.completeJournalButton, pressed && styles.completeJournalButtonPressed]}>
              <MaterialDesignIcons color={homeColors.primary} name="plus-circle-outline" size={17} />
              <Text style={styles.completeJournalText}>Compléter mon journal</Text>
              <MaterialDesignIcons color={homeColors.primary} name="arrow-right" size={16} />
            </Pressable>
          </Animated.View>

          {/* ==================================================
              POUR T'ACCOMPAGNER
          =================================================== */}

          <ObjectiveArticlesSection
            objective="irregular"
            onOpenArticle={articleId => navigation.navigate('ArticleReader', {articleId})}
            onSeeAll={() => navigation.navigate('Library')}
          />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},
  safeArea: {flex: 1},
  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  scrollContent: {paddingHorizontal: 16},

  pressed: {opacity: 0.82},

  mainCard: {
    ...homeShadow,
    marginTop: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(111,78,190,0.10)',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 16,
  },
  mainCardCompact: {padding: 14, borderRadius: 24},
  mainCardTopRow: {minHeight: 190, flexDirection: 'row', alignItems: 'center'},
  mainCopy: {flex: 1, minWidth: 0, zIndex: 2, paddingRight: 8},
  badge: {alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, backgroundColor: '#F0E8FB', paddingHorizontal: 10, paddingVertical: 5},
  badgeText: {color: homeColors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.7},
  mainTitle: {marginTop: 13, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 22, lineHeight: 27, fontWeight: '800', flexShrink: 1},
  profileLine: {flexDirection: 'row', alignItems: 'center', marginTop: 7},
  profileInfoIcon: {width: 22, height: 22, alignItems: 'center', justifyContent: 'center', marginRight: 6, borderRadius: 11, backgroundColor: '#F0E8FB'},
  mainSubtitle: {flex: 1, minWidth: 0, color: homeColors.primary, fontSize: 11.5, lineHeight: 15, fontWeight: '700'},
  mainDescription: {maxWidth: 190, marginTop: 10, color: homeColors.textSecondary, fontSize: 10.5, lineHeight: 15.5, flexShrink: 1},

  // The ring itself (size, layers, animation) now lives entirely in the
  // shared src/components/home/AnimatedProgressRing.tsx — same component,
  // same visual design, same animation as ContraceptionDashboard.tsx. Only
  // a small margin wrapper remains here.
  ringWrap: {flexShrink: 0, marginLeft: 6},

  calloutCard: {minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12, borderWidth: 1, borderColor: 'rgba(111,78,190,0.08)', borderRadius: 18, backgroundColor: '#F4EDFB', paddingHorizontal: 11, paddingVertical: 10},
  calloutPressed: {opacity: 0.84, transform: [{scale: 0.992}]},
  calloutIcon: {width: 31, height: 31, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: homeColors.primary},
  calloutText: {flex: 1, minWidth: 0, color: '#655A7D', fontSize: 10.2, lineHeight: 14.5},

  dailyCard: {...homeShadow, marginTop: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(111,78,190,0.10)', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.97)'},
  dailyCardCompact: {padding: 13, borderRadius: 21},
  dailyHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  dailyHeaderLeft: {flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center'},
  dailyHeaderIcon: {width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', marginRight: 9, borderRadius: 14, backgroundColor: '#F0E8FB'},
  dailyHeaderCopy: {flex: 1, minWidth: 0},
  dailyTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, lineHeight: 21, fontWeight: '800'},
  dailySubtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 9.5, lineHeight: 13, flexShrink: 1},
  progressBadge: {minWidth: 62, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#F2EBFA', paddingHorizontal: 8, paddingVertical: 6},
  progressBadgeValue: {color: homeColors.primary, fontSize: 11.5, fontWeight: '800'},
  progressBadgeLabel: {marginTop: 1, color: homeColors.textSecondary, fontSize: 7.5, fontWeight: '700'},
  progressTrack: {height: 7, marginTop: 13, overflow: 'hidden', borderRadius: 4, backgroundColor: '#EEE8F4'},
  progressFill: {height: '100%', borderRadius: 4, backgroundColor: homeColors.primary},
  dailySectionLabel: {marginTop: 14, marginBottom: 8, color: homeColors.primary, fontSize: 8, fontWeight: '800', letterSpacing: 0.8},
  dailyGrid: {gap: 8},
  dailyItem: {position: 'relative', minHeight: 68, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(111,78,190,0.08)', borderRadius: 16, backgroundColor: '#FBF9FD', paddingHorizontal: 10, paddingVertical: 9},
  dailyItemDone: {borderColor: 'rgba(63,163,114,0.18)', backgroundColor: '#FAFEFC'},
  dailyItemPressed: {opacity: 0.82, transform: [{scale: 0.993}]},
  dailyIcon: {width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#F0E8FB'},
  dailyIconDone: {backgroundColor: homeColors.primary},
  dailyItemCopy: {flex: 1, minWidth: 0, marginLeft: 10},
  dailyLabel: {color: homeColors.textPrimary, fontSize: 11.5, lineHeight: 14.5, fontWeight: '800', flexShrink: 1},
  dailyItemSubtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 9, lineHeight: 12.5, flexShrink: 1},
  dailyStateIndicator: {width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', marginLeft: 8, borderRadius: 10, backgroundColor: '#F0E8FB'},
  dailyStateIndicatorDone: {backgroundColor: '#3FA372'},
  completeJournalButton: {minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, borderWidth: 1, borderColor: 'rgba(111,78,190,0.11)', borderRadius: 14, backgroundColor: '#F6F1FB', paddingHorizontal: 12},
  completeJournalButtonPressed: {opacity: 0.82},
  completeJournalText: {flex: 1, minWidth: 0, color: homeColors.primary, fontSize: 10.5, fontWeight: '800', textAlign: 'center'},

});

export default IrregularDashboard;
