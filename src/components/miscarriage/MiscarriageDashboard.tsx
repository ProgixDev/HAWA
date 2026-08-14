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
  ImageBackground,
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

import type { MainTabScreenProps } from '../../navigation/MainTabNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import { requirePrivateAccess } from '../../navigation/privateAccess';

import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {
  type QuickActionItem,
} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';

import { homeShadow } from '../home/homeTheme';

import {
  getFirstName,
  getSelectedLocation,
  getSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  subscribeSelectedLocation,
} from '../../state/onboardingPreferences';

import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  subscribeMiscarriagePreferences,
  type MiscarriageCycleReturnStatus,
} from '../../state/miscarriagePreferences';

import {
  getMiscarriageJournalEntry,
  hydrateMiscarriageJournal,
  isMiscarriageCategoryCompleted,
  subscribeMiscarriageJournal,
} from '../../state/miscarriageJournalStore';

import { MISCARRIAGE_JOURNAL_ITEMS } from '../../config/miscarriageJournalConfig';

import { useMiscarriageSpiritualStatus } from '../../hooks/usePrayerPurityStatus';

import {
  diffDays,
  formatFullDate,
  formatHijriDate,
  startOfDay,
} from '../../utils/cycleMath';

const BACKGROUND = require('../../assets/images/homebackground.png');
const MISCARRIAGE_DASHBOARD_WOMAN = require('../../assets/images/miscarriage/miscarriage-dashboard-woman.png');

const PURPLE = '#6949BE';
const DEEP_PURPLE = '#261650';
const SOFT_PURPLE_2 = '#F9F6FD';
const BORDER = 'rgba(105,73,190,0.10)';
const MUTED = '#776C92';
const SUCCESS = '#69A87D';

type Props = MainTabScreenProps<'CycleHome'>;

const CYCLE_RETURN_LABELS: Record<MiscarriageCycleReturnStatus, string> = {
  no: 'Pas encore de règles',
  yes: 'Règles revenues',
  unknown: 'Je ne sais pas encore',
};

const DAILY_ITEMS = MISCARRIAGE_JOURNAL_ITEMS;

function MiscarriageDashboard({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;

  const [miscarriage, setMiscarriage] = useState(getMiscarriagePreferences);

  useEffect(() => {
    let active = true;

    hydrateMiscarriagePreferences().then(value => {
      if (active) {
        setMiscarriage(value);
      }
    });

    const unsubscribe = subscribeMiscarriagePreferences(() => {
      if (active) {
        setMiscarriage(getMiscarriagePreferences());
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const miscarriageDate = useMemo(
    () =>
      miscarriage.miscarriageDate
        ? startOfDay(new Date(`${miscarriage.miscarriageDate}T12:00:00`))
        : null,
    [miscarriage.miscarriageDate],
  );

  const today = useMemo(() => startOfDay(new Date()), []);

  const daysSince = miscarriageDate
    ? Math.max(0, diffDays(today, miscarriageDate))
    : null;

  const firstReturnedPeriodDate = useMemo(
    () =>
      miscarriage.firstReturnedPeriodDate
        ? new Date(`${miscarriage.firstReturnedPeriodDate}T12:00:00`)
        : null,
    [miscarriage.firstReturnedPeriodDate],
  );

  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const [todayEntry, setTodayEntry] = useState(() =>
    getMiscarriageJournalEntry(todayKey),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateMiscarriageJournal().then(() => {
        if (active) {
          setTodayEntry(getMiscarriageJournalEntry(todayKey));
        }
      });

      const unsubscribe = subscribeMiscarriageJournal(() => {
        if (active) {
          setTodayEntry(getMiscarriageJournalEntry(todayKey));
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, [todayKey]),
  );

  const completedTodayCount = useMemo(
    () =>
      DAILY_ITEMS.filter(item =>
        isMiscarriageCategoryCompleted(todayEntry, item.key),
      ).length,
    [todayEntry],
  );

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

  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
    }, []),
  );

  const spiritual = useMiscarriageSpiritualStatus(spiritualMarkersEnabled);

  const { open: openMiscarriageJournal } = useJournalSheet();

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {
        return;
      }

      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 560,
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
      iconColor: PURPLE,
      iconBg: '#EEE5FB',
      label: 'Horaires\nde prière',
      onPress: () => navigation.navigate('PrayerTimes'),
    },
    {
      key: 'library',
      icon: 'book-open-page-variant-outline',
      iconColor: PURPLE,
      iconBg: '#EFE8FB',
      label: 'Bibliothèque',
      onPress: () => navigation.navigate('Library'),
    },
    {
      key: 'daily-journal',
      icon: 'notebook-edit-outline',
      iconColor: '#B24C70',
      iconBg: '#FBE6EE',
      label: 'Journal quotidien',
      onPress: openMiscarriageJournal,
    },
    {
      key: 'hijri-calendar',
      icon: 'moon-waning-crescent',
      iconColor: PURPLE,
      iconBg: '#EEE5FB',
      label: 'Calendrier Hijri',
      onPress: () => navigation.navigate('HijriCalendar'),
    },
    {
      key: 'qadaa',
      icon: 'silverware-fork-knife',
      iconColor: PURPLE,
      iconBg: '#F1EAFB',
      label: 'Jeûne à rattraper',
      onPress: () => navigation.navigate('FastingQadaa'),
    },
    {
      key: 'statistics',
      icon: 'chart-donut',
      iconColor: '#328C92',
      iconBg: '#E3F2F3',
      label: 'Statistiques',
      onPress: () => navigation.navigate('Statistics'),
    },
  ];

  const cycleReturnLabel = miscarriage.cycleReturnStatus
    ? CYCLE_RETURN_LABELS[miscarriage.cycleReturnStatus]
    : 'Non renseigné';

  const cycleReturnSubvalue =
    miscarriage.cycleReturnStatus === 'yes' && firstReturnedPeriodDate
      ? `Depuis le ${formatFullDate(firstReturnedPeriodDate)}`
      : null;

  const daysSinceLabel =
    daysSince === null
      ? '—'
      : daysSince === 0
      ? 'Aujourd’hui'
      : `${daysSince} jour${daysSince > 1 ? 's' : ''}`;

  const progressPercentage =
    DAILY_ITEMS.length > 0
      ? Math.round((completedTodayCount / DAILY_ITEMS.length) * 100)
      : 0;

  const entranceStyle = {
    opacity: entrance,

    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={styles.background}
    >
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
              paddingBottom: Math.max(insets.bottom, 12) + 42,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader
            firstName={getFirstName()}
            onPressProfile={() => navigation.navigate('Profile')}
            subtitle="Prends soin de toi, à ton rythme."
          />

          <Animated.View style={entranceStyle}>
            {miscarriageDate ? (
              <View style={styles.heroCard}>
                <View style={styles.heroGlowTop} />

                <View style={styles.heroGlowBottom} />

                <View style={styles.heroHeader}>
                  <View style={styles.heroTitleRow}>
                    <View style={styles.heroTitleDot} />
                    <Text style={styles.heroTitle}>
                      Où en es-tu aujourd’hui ?
                    </Text>
                  </View>

                  <Text style={styles.heroSubtitle}>
                    Chaque jour compte, avance à ton rythme.
                  </Text>
                </View>

                <View style={styles.heroContentRow}>
                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatCard}>
                      <View style={styles.heroStatIcon}>
                        <MaterialDesignIcons
                          color={PURPLE}
                          name="calendar-heart"
                          size={22}
                        />
                      </View>

                      <Text style={styles.heroStatLabel}>
                        Depuis la fausse couche
                      </Text>

                      <Text style={styles.heroStatValue}>{daysSinceLabel}</Text>
                    </View>

                    <View style={styles.heroStatCard}>
                      <View style={styles.heroStatIconPink}>
                        <MaterialDesignIcons
                          color="#B65376"
                          name="sync"
                          size={22}
                        />
                      </View>

                      <Text style={styles.heroStatLabel}>Retour du cycle</Text>

                      <Text numberOfLines={2} style={styles.heroStatValueSmall}>
                        {cycleReturnLabel}
                      </Text>

                      {cycleReturnSubvalue ? (
                        <Text numberOfLines={1} style={styles.heroStatSubvalue}>
                          {cycleReturnSubvalue}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="contain"
                    source={MISCARRIAGE_DASHBOARD_WOMAN}
                    style={styles.heroWoman}
                  />
                </View>

                <View style={styles.supportStrip}>
                  <View style={styles.supportIcon}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name="heart-outline"
                      size={17}
                    />
                  </View>

                  <Text style={styles.supportText}>
                    Ton suivi s’adapte à ton évolution, jour après jour.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.unconfiguredCard}>
                <View style={styles.unconfiguredGlow} />

                <View style={styles.unconfiguredIcon}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="calendar-heart"
                    size={30}
                  />
                </View>

                <Text style={styles.unconfiguredEyebrow}>
                  PERSONNALISE TON SUIVI
                </Text>

                <Text style={styles.unconfiguredTitle}>
                  Indique la date de ta fausse couche
                </Text>

                <Text style={styles.unconfiguredText}>
                  Cette date nous permet d’adapter ton accompagnement jour après
                  jour.
                </Text>

                <Pressable
                  accessibilityLabel="Indiquer la date"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('MiscarriageDate')}
                  style={({ pressed }) => [
                    styles.unconfiguredButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="calendar-edit"
                    size={18}
                  />

                  <Text style={styles.unconfiguredButtonText}>
                    Renseigner la date
                  </Text>

                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="arrow-right"
                    size={17}
                  />
                </Pressable>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Actions rapides</Text>

                <Text style={styles.sectionSubtitle}>
                  Accède rapidement à tes essentiels
                </Text>
              </View>

              <View style={styles.sectionSparkle}>
                <MaterialDesignIcons color={PURPLE} name="creation" size={18} />
              </View>
            </View>

            <View style={styles.quickActionsWrapper}>
              <QuickActionsGrid items={quickActionItems} />
            </View>

            {spiritualMarkersEnabled ? (
              <View style={styles.spiritualSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Repères spirituels</Text>

                    <Text style={styles.sectionSubtitle}>
                      Tes repères du jour
                    </Text>
                  </View>

                  <View style={styles.sectionMoon}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name="moon-waning-crescent"
                      size={18}
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
                  objective="miscarriage"
                  onManage={() => navigation.navigate('SpiritualPreferences')}
                  prayerError={spiritual.error}
                  prayerLoading={spiritual.loading}
                  timezone={spiritual.schedule?.timezone}
                />
              </View>
            ) : null}

            <View style={styles.dailyCard}>
              <View style={styles.dailyHeader}>
                <View style={styles.dailyHeaderLeft}>
                  <View style={styles.dailyTitleIcon}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name="heart-plus-outline"
                      size={21}
                    />
                  </View>

                  <View>
                    <Text style={styles.dailyTitle}>Suivi du jour</Text>

                    <Text style={styles.dailySubtitle}>
                      Comment te sens-tu aujourd’hui ?
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBadge}>
                  <Text style={styles.progressBadgeValue}>
                    {completedTodayCount}/{DAILY_ITEMS.length}
                  </Text>

                  <Text style={styles.progressBadgeLabel}>complété</Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progressPercentage}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.progressPercent}>
                  {progressPercentage}%
                </Text>
              </View>

              <View style={styles.dailyGrid}>
                {DAILY_ITEMS.map(item => {
                  const done = isMiscarriageCategoryCompleted(
                    todayEntry,
                    item.key,
                  );

                  return (
                    <Pressable
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                      key={item.key}
                      onPress={() => {
                        if (item.key === 'personalNotes') {
                          requirePrivateAccess(navigation, 'miscarriagePersonalNotes');
                          return;
                        }
                        navigation.navigate('MiscarriageJournalEntry', {
                          category: item.key,
                        });
                      }}
                      style={({ pressed }) => [
                        styles.dailyItem,
                        done && styles.dailyItemDone,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.dailyItemTop}>
                        <View
                          style={[
                            styles.dailyIcon,
                            done && styles.dailyIconDone,
                          ]}
                        >
                          <MaterialDesignIcons
                            color={done ? '#FFFFFF' : PURPLE}
                            name={item.icon}
                            size={22}
                          />
                        </View>

                        {done ? (
                          <View style={styles.doneBadge}>
                            <MaterialDesignIcons
                              color="#FFFFFF"
                              name="check"
                              size={11}
                            />
                          </View>
                        ) : (
                          <MaterialDesignIcons
                            color="#B9ACC9"
                            name="chevron-right"
                            size={19}
                          />
                        )}
                      </View>

                      <Text numberOfLines={2} style={styles.dailyLabel}>
                        {item.dashboardLabel}
                      </Text>

                      <View style={styles.dailyStateRow}>
                        <View
                          style={[
                            styles.dailyStateDot,
                            done && styles.dailyStateDotDone,
                          ]}
                        />

                        <Text
                          style={[
                            styles.dailyStateText,
                            done && styles.dailyStateTextDone,
                          ]}
                        >
                          {done ? 'Renseigné' : 'Non renseigné'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={openMiscarriageJournal}
                style={({ pressed }) => [
                  styles.completeJournalButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.completeJournalIcon}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="notebook-edit-outline"
                    size={19}
                  />
                </View>

                <View style={styles.completeJournalCopy}>
                  <Text style={styles.completeJournalTitle}>
                    Ouvrir le journal quotidien
                  </Text>

                  <Text style={styles.completeJournalSubtitle}>
                    Complète ton suivi en quelques instants
                  </Text>
                </View>

                <MaterialDesignIcons
                  color={PURPLE}
                  name="arrow-right"
                  size={19}
                />
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F8F4FD',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
  },

  heroCard: {
    ...homeShadow,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.97)',
    shadowColor: '#4B348A',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.11,
    shadowRadius: 22,
    elevation: 6,
  },

  heroGlowTop: {
    position: 'absolute',
    top: -55,
    right: -35,
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: 'rgba(183,157,232,0.13)',
  },

  heroGlowBottom: {
    position: 'absolute',
    bottom: -65,
    left: -45,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: 'rgba(240,202,220,0.11)',
  },

  heroHeader: {
    zIndex: 2,
  },

  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroTitleDot: {
    width: 10,
    height: 10,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: '#8B55DC',
  },

  heroTitle: {
    flexShrink: 1,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 26,
  },

  heroSubtitle: {
    marginTop: 5,
    marginLeft: 20,
    color: '#8A79B6',
    fontSize: 11,
    lineHeight: 16,
  },

  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
  },

  heroStatsRow: {
    zIndex: 2,
    width: '64%',
    flexDirection: 'row',
    gap: 8,
  },

  heroStatCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 154,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    borderRadius: 18,
    backgroundColor: 'rgba(250,247,253,0.93)',
  },

  heroWoman: {
    width: '45%',
    height: 177,
    marginLeft: -13,
    marginTop: -18,
    marginBottom: -5,
  },

  heroStatIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EDE4FA',
  },

  heroStatIconPink: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F9E6ED',
  },

  heroStatLabel: {
    minHeight: 34,
    marginTop: 10,
    color: '#714AC2',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },

  heroStatValue: {
    marginTop: 4,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  heroStatValueSmall: {
    marginTop: 4,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 18,
  },

  heroStatSubvalue: {
    marginTop: 4,
    color: '#8A7D9E',
    fontSize: 9.5,
  },

  supportStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 17,
    backgroundColor: 'rgba(240,233,251,0.72)',
  },

  supportIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.74)',
  },

  supportText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
    color: '#7451C1',
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 15,
  },

  unconfiguredCard: {
    ...homeShadow,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.97)',
  },

  unconfiguredGlow: {
    position: 'absolute',
    top: -55,
    right: -45,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(105,73,190,0.06)',
  },

  unconfiguredIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#F0E8FB',
  },

  unconfiguredEyebrow: {
    marginTop: 15,
    color: '#9A82C4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  unconfiguredTitle: {
    maxWidth: 290,
    marginTop: 7,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
    textAlign: 'center',
  },

  unconfiguredText: {
    maxWidth: 290,
    marginTop: 8,
    color: MUTED,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },

  unconfiguredButton: {
    minHeight: 50,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 21,
    borderRadius: 17,
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  unconfiguredButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: MUTED,
    fontSize: 10.5,
  },

  sectionSparkle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F1E9FC',
  },

  sectionMoon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F0E8FB',
  },

  quickActionsWrapper: {
    marginTop: -2,
  },

  spiritualSection: {
    marginTop: 2,
  },

  dailyCard: {
    ...homeShadow,
    marginTop: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.97)',
    shadowColor: '#513A8D',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },

  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  dailyHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dailyTitleIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F0E8FB',
  },

  dailyTitle: {
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',
  },

  dailySubtitle: {
    marginTop: 3,
    color: MUTED,
    fontSize: 10.5,
  },

  progressBadge: {
    minWidth: 62,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: '#F2EBFB',
  },

  progressBadgeValue: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
  },

  progressBadgeLabel: {
    marginTop: 1,
    color: '#8C7DA2',
    fontSize: 8.5,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 15,
  },

  progressTrack: {
    flex: 1,
    height: 6,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#EEE8F7',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: PURPLE,
  },

  progressPercent: {
    width: 32,
    color: '#847696',
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'right',
  },

  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 16,
  },

  dailyItem: {
    width: '48.4%',
    minHeight: 126,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 20,
    backgroundColor: SOFT_PURPLE_2,
  },

  dailyItemDone: {
    borderColor: 'rgba(105,73,190,0.22)',
    backgroundColor: '#F5F0FC',
  },

  dailyItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dailyIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#ECE4F9',
  },

  dailyIconDone: {
    backgroundColor: PURPLE,
  },

  doneBadge: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: SUCCESS,
    shadowColor: SUCCESS,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },

  dailyLabel: {
    minHeight: 36,
    marginTop: 10,
    color: DEEP_PURPLE,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
  },

  dailyStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  dailyStateDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 3,
    backgroundColor: '#CFC4DC',
  },

  dailyStateDotDone: {
    backgroundColor: SUCCESS,
  },

  dailyStateText: {
    color: '#978AA6',
    fontSize: 9.5,
    fontWeight: '600',
  },

  dailyStateTextDone: {
    color: '#648F71',
  },

  completeJournalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
    borderRadius: 18,
    backgroundColor: '#F4EEFC',
  },

  completeJournalIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.80)',
  },

  completeJournalCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },

  completeJournalTitle: {
    color: DEEP_PURPLE,
    fontSize: 11.5,
    fontWeight: '700',
  },

  completeJournalSubtitle: {
    marginTop: 2,
    color: MUTED,
    fontSize: 9.5,
  },

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});

export default MiscarriageDashboard;
