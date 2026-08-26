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
  useWindowDimensions,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type { MainTabScreenProps } from '../../navigation/MainTabNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import { requirePrivateAccess } from '../../navigation/privateAccess';

import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {
  type QuickActionItem,
} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../home/ObjectiveArticlesSection';

import { homeShadow } from '../home/homeTheme';

import {
  getFirstName,
  getSelectedLocation,
  getSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  setSelectedObjective,
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

/* ============================================================
 * CONCEIVE TRANSITION — PREMIUM CONFIRMATION MODAL
 *
 * Purely a UI/UX confirmation surface: it owns no objective-switching logic
 * itself — onConfirm/onCancel are handled entirely by MiscarriageDashboard,
 * which is the only place setSelectedObjective('conceive') is ever called.
 * Modeled on the same premium centered-card pattern already used for
 * confirmations elsewhere in AWA (PostpartumConsistencyModal's radii/
 * shadows/typography), kept local here since this exact copy/icon/tone is
 * specific to this one transition and not yet needed by another screen.
 * ============================================================ */

type ConceiveTransitionModalProps = {
  visible: boolean;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConceiveTransitionModal({
  visible,
  confirming,
  onCancel,
  onConfirm,
}: ConceiveTransitionModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      return;
    }

    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {
        return;
      }

      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      active = false;
    };
  }, [visible, entrance]);

  const cardStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        style={[transitionModalStyles.overlay, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            transitionModalStyles.backdrop,
            { opacity: entrance },
          ]}
        >
          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            onPress={onCancel}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          accessibilityRole="alert"
          style={[transitionModalStyles.card, cardStyle]}
        >
          <View style={transitionModalStyles.icon}>
            <MaterialDesignIcons color={PURPLE} name="heart-outline" size={32} />
          </View>

          <Text style={transitionModalStyles.title}>Passer au suivi conception ?</Text>

          <Text style={transitionModalStyles.message}>
            Tu peux commencer ton suivi pour essayer de concevoir. Tes données
            liées à ton parcours après fausse couche resteront enregistrées et
            tu pourras les retrouver à tout moment.
          </Text>

          <View style={transitionModalStyles.reassurance}>
            <MaterialDesignIcons color={PURPLE} name="check-circle-outline" size={16} />
            <Text style={transitionModalStyles.reassuranceText}>
              Tes données sont conservées
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Continuer et passer au suivi conception"
            accessibilityRole="button"
            accessibilityState={{ disabled: confirming }}
            disabled={confirming}
            onPress={onConfirm}
            style={({ pressed }) => [
              transitionModalStyles.primary,
              pressed && transitionModalStyles.primaryPressed,
              confirming && transitionModalStyles.primaryDisabled,
            ]}
          >
            <Text style={transitionModalStyles.primaryText}>Continuer</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Annuler"
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [
              transitionModalStyles.secondary,
              pressed && transitionModalStyles.secondaryPressed,
            ]}
          >
            <Text style={transitionModalStyles.secondaryText}>Annuler</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const transitionModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  backdrop: {
    backgroundColor: 'rgba(34,20,69,0.40)',
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E4D9F5',
    backgroundColor: '#FFFDFF',
    padding: 24,
    shadowColor: '#24134A',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  icon: {
    width: 66,
    height: 66,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 33,
    backgroundColor: '#F0E8FC',
  },
  title: {
    marginTop: 16,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
    textAlign: 'center',
    flexShrink: 1,
  },
  message: {
    marginTop: 10,
    color: MUTED,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    flexShrink: 1,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F2ECFC',
  },
  reassuranceText: {
    flex: 1,
    minWidth: 0,
    color: '#61557B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  primary: {
    minHeight: 52,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: PURPLE,
    shadowColor: '#4E2A9B',
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  primaryPressed: {
    opacity: 0.9,
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
  },
  secondary: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#F7F3FC',
  },
  secondaryPressed: {
    opacity: 0.85,
  },
  secondaryText: {
    color: PURPLE,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
  },
});

function MiscarriageDashboard({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 370;

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

  // Explicit, user-confirmed transition to the Conceive objective — only
  // ever reachable when the user has already told us she feels ready
  // (tryingAgainStatus === 'ready'), and only ever fires on an explicit tap
  // + confirmation, never automatically from that stored preference. Reuses
  // the exact same canonical setSelectedObjective('conceive') Profile's
  // "Mon objectif" switcher already uses — no second objective-switch
  // mechanism, no store reset: Miscarriage's own data is never touched here.
  const [conceiveTransitionVisible, setConceiveTransitionVisible] = useState(false);
  const [confirmingConceiveTransition, setConfirmingConceiveTransition] = useState(false);

  const openConceiveTransitionModal = () => {
    setConfirmingConceiveTransition(false);
    setConceiveTransitionVisible(true);
  };

  // Covers Annuler, backdrop tap AND the Android hardware back button —
  // Modal's onRequestClose fires for all three, so one handler is enough
  // and every dismissal path is guaranteed to behave identically (no
  // objective switch).
  const closeConceiveTransitionModal = () => {
    setConceiveTransitionVisible(false);
  };

  const confirmConceiveTransition = () => {
    // Guards against a double-tap firing setSelectedObjective twice while
    // the modal's close animation/transition is still settling.
    if (confirmingConceiveTransition) {
      return;
    }
    setConfirmingConceiveTransition(true);
    setSelectedObjective('conceive');
    setConceiveTransitionVisible(false);
  };

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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
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

                      <Text style={styles.heroStatValueSmall}>
                        {cycleReturnLabel}
                      </Text>

                      {cycleReturnSubvalue ? (
                        <Text style={styles.heroStatSubvalue}>
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

            {miscarriage.tryingAgainStatus === 'ready' ? (
              <View style={styles.conceiveTransitionCard}>
                <View style={styles.conceiveTransitionIcon}>
                  <MaterialDesignIcons color={PURPLE} name="heart-outline" size={20} />
                </View>

                <View style={styles.conceiveTransitionCopy}>
                  <Text style={styles.conceiveTransitionTitle}>
                    Reprendre ton projet de conception
                  </Text>

                  <Text style={styles.conceiveTransitionText}>
                    Si tu le souhaites, tu peux passer au suivi Essayer de concevoir.
                  </Text>

                  <Pressable
                    accessibilityLabel="Passer au suivi conception"
                    accessibilityRole="button"
                    onPress={openConceiveTransitionModal}
                    style={({ pressed }) => [
                      styles.conceiveTransitionButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.conceiveTransitionButtonText}>
                      Passer au suivi conception
                    </Text>

                    <MaterialDesignIcons color={PURPLE} name="arrow-right" size={15} />
                  </Pressable>
                </View>
              </View>
            ) : null}

        

            <View style={styles.quickActionsWrapper}>
              <QuickActionsGrid
                items={quickActionItems.filter(
                  item =>
                    spiritualMarkersEnabled ||
                    (item.key !== 'prayer-times' &&
                      item.key !== 'hijri-calendar' &&
                      item.key !== 'qadaa'),
                )}
              />
            </View>

            {spiritualMarkersEnabled ? (
              <View style={styles.spiritualSection}>
          

                <SpiritualGuidanceCard
                  hijriDate={formatHijriDate(today)}
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

                  <View style={styles.dailyTitleCopy}>
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
                          requirePrivateAccess(
                            navigation,
                            'miscarriagePersonalNotes',
                          );
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

                      <Text style={styles.dailyLabel}>
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

            <ObjectiveArticlesSection
              objective="loss"
              onOpenArticle={articleId => navigation.navigate('ArticleReader', {articleId})}
              onSeeAll={() => navigation.navigate('Library')}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <ConceiveTransitionModal
        confirming={confirmingConceiveTransition}
        onCancel={closeConceiveTransitionModal}
        onConfirm={confirmConceiveTransition}
        visible={conceiveTransitionVisible}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F2ECF8',
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
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
  },

  scrollContentCompact: {
    paddingHorizontal: 12,
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
    minWidth: 0,
  },

  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  heroTitleDot: {
    width: 10,
    height: 10,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: '#8B55DC',
  },

  heroTitle: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 1,
  },

  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
    minWidth: 0,
  },

  heroStatsRow: {
    zIndex: 2,
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 8,
    paddingRight: 112,
  },

  heroStatCard: {
    width: '100%',
    minWidth: 0,
    minHeight: 108,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    borderRadius: 18,
    backgroundColor: 'rgba(250,247,253,0.93)',
  },

  heroWoman: {
    position: 'absolute',
    right: -10,
    bottom: -3,
    width: 120,
    height: 178,
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
    marginTop: 9,
    color: '#714AC2',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    flexShrink: 1,
  },

  heroStatValue: {
    marginTop: 4,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    flexShrink: 1,
  },

  heroStatValueSmall: {
    marginTop: 4,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 18,
    flexShrink: 1,
  },

  heroStatSubvalue: {
    marginTop: 4,
    color: '#8A7D9E',
    fontSize: 9.5,
    lineHeight: 13,
    flexShrink: 1,
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
    width: '100%',
    maxWidth: 300,
    marginTop: 7,
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
    textAlign: 'center',
    flexShrink: 1,
  },

  unconfiguredText: {
    width: '100%',
    maxWidth: 300,
    marginTop: 8,
    color: MUTED,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
    flexShrink: 1,
  },

  unconfiguredButton: {
    minHeight: 50,
    width: '100%',
    maxWidth: 300,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  unconfiguredButtonText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Secondary, supportive-tone card — deliberately lighter than heroCard
  // (tinted background, thin border, no shadow) so it reads as a gentle
  // follow-up suggestion, never as the Dashboard's main focus.
  conceiveTransitionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
    borderRadius: 22,
    backgroundColor: 'rgba(240,233,251,0.55)',
  },

  conceiveTransitionIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  conceiveTransitionCopy: {
    flex: 1,
    minWidth: 0,
  },

  conceiveTransitionTitle: {
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '800',
    flexShrink: 1,
  },

  conceiveTransitionText: {
    marginTop: 4,
    color: MUTED,
    fontSize: 11.5,
    lineHeight: 16,
    flexShrink: 1,
  },

  conceiveTransitionButton: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.3,
    borderColor: PURPLE,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  conceiveTransitionButtonText: {
    flex: 1,
    minWidth: 0,
    color: PURPLE,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 22,
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: DEEP_PURPLE,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    flexShrink: 1,
  },

  sectionSubtitle: {
    marginTop: 3,
    color: MUTED,
    fontSize: 10.5,
    lineHeight: 14,
    flexShrink: 1,
  },

  sectionSparkle: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F1E9FC',
  },

  sectionMoon: {
    width: 34,
    height: 34,
    flexShrink: 0,
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

  dailyTitleCopy: {
    flex: 1,
    minWidth: 0,
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
    lineHeight: 23,
    fontWeight: '800',
    flexShrink: 1,
  },

  dailySubtitle: {
    marginTop: 3,
    color: MUTED,
    fontSize: 10.5,
    lineHeight: 14,
    flexShrink: 1,
  },

  progressBadge: {
    minWidth: 62,
    flexShrink: 0,
    alignItems: 'center',
    paddingHorizontal: 9,
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
    minWidth: 0,
    minHeight: 132,
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
    marginTop: 10,
    color: DEEP_PURPLE,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
    flexShrink: 1,
  },

  dailyStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    minWidth: 0,
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
    flex: 1,
    minWidth: 0,
    color: '#978AA6',
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '600',
    flexShrink: 1,
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
    lineHeight: 15,
    fontWeight: '700',
    flexShrink: 1,
  },

  completeJournalSubtitle: {
    marginTop: 2,
    color: MUTED,
    fontSize: 9.5,
    lineHeight: 13,
    flexShrink: 1,
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
