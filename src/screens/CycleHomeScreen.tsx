import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
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
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {AnimatedTabItem} from '../components/navigation/AnimatedTabItem';
import DailyJournalSheet, {type JournalRoute} from '../components/journal/DailyJournalSheet';
import {
  CycleStatusCard,
  type CyclePhase,
} from '../components/home/CycleStatusCard';
import SpiritualGuidanceCard from '../components/home/SpiritualGuidanceCard';
import {
  getCyclePreferences,
  getFirstName,
  getSelectedLocation,
  getSelectedSchool,
  getSpiritualMarkersEnabled,
  setCyclePreferences,
} from '../state/onboardingPreferences';
import {
  fetchNextPrayer,
  formatRemainingPrayerTime,
  type NextPrayer,
} from '../services/prayerTimes';
import {TOP_SPACING_EXTRA} from '../theme/spacing';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_MUTED = '#655A8D';
const PERIOD = '#DC7B82';
const PERIOD_LIGHT = '#F7D7D6';
const FERTILE = '#B9A3DC';
const OVULATION = '#4E319A';

const BACKGROUND = require('../assets/images/school-selection-background.png');
const NEXT_PERIOD_CARD_BACKGROUND = require('../assets/images/next-period-card-background.png');

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_MS = 86_400_000;

type Props = NativeStackScreenProps<RootStackParamList, 'CycleHome'>;

type DayKind = 'period' | 'fertile' | 'ovulation' | 'normal';

type TabId = 'home' | 'calendar' | 'statistics' | 'profile';

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const diffDays = (later: Date, earlier: Date) =>
  Math.round(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY_MS,
  );

const positiveModulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(date);

const formatHijriDate = (date: Date): string | undefined => {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return undefined;
  }
};

function CycleHomeScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const initial = getCyclePreferences();

  const [periodStart, setPeriodStart] = useState(initial.lastPeriodStart);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(
      initial.lastPeriodStart.getFullYear(),
      initial.lastPeriodStart.getMonth(),
      1,
    ),
  );

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [journalVisible, setJournalVisible] = useState(false);
  const spiritualMarkersEnabled = getSpiritualMarkersEnabled();
  const selectedLocation = useMemo(() => getSelectedLocation(), []);
  const selectedSchool = useMemo(() => getSelectedSchool(), []);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer>();
  const [remainingPrayerTime, setRemainingPrayerTime] = useState<string>();
  const nextPrayerRef = useRef<NextPrayer | undefined>(undefined);

  const entrance = useRef(new Animated.Value(0)).current;
  const calendarMotion = useRef(new Animated.Value(1)).current;
  const plusMotion = useRef(new Animated.Value(0)).current;
  const plusScale = useRef(new Animated.Value(1)).current;

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    Animated.timing(entrance, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    if (!spiritualMarkersEnabled || !selectedLocation) {
      setNextPrayer(undefined);
      setRemainingPrayerTime(undefined);
      return;
    }

    let cancelled = false;
    const loadPrayer = async () => {
      try {
        const prayer = await fetchNextPrayer(selectedLocation, selectedSchool);
        if (!cancelled) {
          nextPrayerRef.current = prayer;
          setNextPrayer(prayer);
          setRemainingPrayerTime(prayer ? formatRemainingPrayerTime(prayer.at) : undefined);
        }
      } catch {
        if (!cancelled) {
          nextPrayerRef.current = undefined;
          setNextPrayer(undefined);
          setRemainingPrayerTime(undefined);
        }
      }
    };

    loadPrayer();
    const timer = setInterval(() => {
      const prayer = nextPrayerRef.current;
      if (prayer && prayer.at.getTime() > Date.now()) {
        setRemainingPrayerTime(formatRemainingPrayerTime(prayer.at));
      } else {
        loadPrayer();
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedLocation, selectedSchool, spiritualMarkersEnabled]);

  const animateCalendar = () => {
    calendarMotion.setValue(0);

    Animated.timing(calendarMotion, {
      duration: 260,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const openJournal = () => {
    setJournalVisible(true);
    Animated.parallel([
      Animated.spring(plusMotion, {toValue: 1, damping: 18, stiffness: 210, useNativeDriver: true}),
      Animated.sequence([
        Animated.timing(plusScale, {toValue: 0.9, duration: 90, useNativeDriver: true}),
        Animated.spring(plusScale, {toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true}),
      ]),
    ]).start();
  };

  const closeJournal = () => {
    setJournalVisible(false);
    Animated.spring(plusMotion, {toValue: 0, damping: 18, stiffness: 210, useNativeDriver: true}).start();
  };

  const navigateFromJournal = (route: JournalRoute) => {
    setJournalVisible(false);
    plusMotion.setValue(0);
    navigation.navigate(route);
  };

  const cycleDayFor = (date: Date) =>
    positiveModulo(
      diffDays(date, periodStart),
      initial.cycleDuration,
    ) + 1;

  const ovulationDay = initial.cycleDuration - 13;

  const kindFor = (date: Date): DayKind => {
    const cycleDay = cycleDayFor(date);

    if (cycleDay <= initial.periodDuration) {
      return 'period';
    }

    if (cycleDay === ovulationDay) {
      return 'ovulation';
    }

    if (
      cycleDay >= ovulationDay - 5 &&
      cycleDay <= ovulationDay + 1
    ) {
      return 'fertile';
    }

    return 'normal';
  };

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();

    return Array.from({length: offset + count}, (_, index) =>
      index < offset
        ? null
        : new Date(year, month, index - offset + 1),
    );
  }, [visibleMonth]);

  const currentCycleDay = cycleDayFor(today);
  const currentKind = kindFor(today);

  const currentPhase: CyclePhase =
    currentKind === 'period'
      ? 'menstruation'
      : currentKind === 'ovulation'
        ? 'ovulation'
        : currentKind === 'fertile'
          ? 'fertile'
          : currentCycleDay < ovulationDay
            ? 'follicular'
            : 'luteal';

  const elapsed = diffDays(today, periodStart);

  const cyclesElapsed = Math.max(
    0,
    Math.floor(elapsed / initial.cycleDuration),
  );

  let nextPeriod = addDays(
    periodStart,
    (cyclesElapsed + 1) * initial.cycleDuration,
  );

  if (nextPeriod < today) {
    nextPeriod = addDays(nextPeriod, initial.cycleDuration);
  }

  const daysUntilNext = Math.max(
    0,
    diffDays(nextPeriod, today),
  );

  const selectPeriodStart = (date: Date) => {
    setPeriodStart(date);

    setCyclePreferences({
      ...initial,
      lastPeriodStart: date,
    });

    animateCalendar();
  };

  const changeMonth = (offset: number) => {
    setVisibleMonth(current =>
      new Date(
        current.getFullYear(),
        current.getMonth() + offset,
        1,
      ),
    );

    animateCalendar();
  };

  const hijriYear = (() => {
    try {
      return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
        year: 'numeric',
      })
        .format(visibleMonth)
        .replace(/[^0-9]/g, '');
    } catch {
      return '';
    }
  })();

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
    <ImageBackground
      source={BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <View style={styles.page}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 12) + 22}]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, animatedStyle]}>
            <View style={styles.greetingCopy}>
              <Text style={styles.greeting}>
                As-salamu ‘alaykum,
              </Text>

              <Text style={styles.name}>
                {getFirstName()} 🌸
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Notifications"
              style={styles.notification}>
              <MaterialDesignIcons color={PURPLE} name="bell-outline" size={26} />

              <View style={styles.notificationDot} />
            </Pressable>
          </Animated.View>

          <CycleStatusCard
            currentDay={currentCycleDay}
            cycleLength={initial.cycleDuration}
            phase={currentPhase}
          />

          <Animated.View
            style={[
              styles.calendarCard,
              {
                opacity: calendarMotion,
                transform: [
                  {
                    scale: calendarMotion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.99, 1],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                hitSlop={12}
                onPress={() => changeMonth(-1)}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="chevron-left"
                  size={26}
                />
              </Pressable>

              <Text style={styles.monthTitle}>
                {new Intl.DateTimeFormat('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                }).format(visibleMonth)}
              </Text>

              <Pressable
                accessibilityLabel="Mois suivant"
                hitSlop={12}
                onPress={() => changeMonth(1)}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="chevron-right"
                  size={26}
                />
              </Pressable>

              {!!hijriYear && (
                <Text style={styles.hijri}>
                  {hijriYear} Hijri ☾
                </Text>
              )}
            </View>

            <Text style={styles.calendarHint}>
              Touchez le premier jour de vos règles
            </Text>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
                <Text
                  key={day}
                  style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={styles.dayCell}
                    />
                  );
                }

                const kind = kindFor(date);
                const selected = sameDay(date, periodStart);
                const isToday = sameDay(date, today);

                return (
                  <View
                    key={date.toISOString()}
                    style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()}, ${kind}`}
                      onPress={() => selectPeriodStart(date)}
                      style={({pressed}) => [
                        styles.day,
                        kind === 'period' && styles.periodDay,
                        kind === 'fertile' && styles.fertileDay,
                        kind === 'ovulation' && styles.ovulationDay,
                        selected && styles.selectedPeriodDay,
                        isToday && styles.todayDay,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          (kind === 'ovulation' || selected) &&
                            styles.dayTextLight,
                        ]}>
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              <Legend
                color={PERIOD}
                label="Règles"
              />

              <Legend
                color={FERTILE}
                label="Fertile"
              />

              <Legend
                color={OVULATION}
                label="Ovulation"
              />

              <Legend
                outline
                label="Aujourd’hui"
              />
            </View>
          </Animated.View>

          <ImageBackground
            imageStyle={styles.nextCardBackgroundImage}
            resizeMode="cover"
            source={NEXT_PERIOD_CARD_BACKGROUND}
            style={styles.nextCard}>
            <View style={styles.nextIcon}>
              <MaterialDesignIcons color={PURPLE} name="calendar-month-outline" size={28} />
            </View>

            <View style={styles.nextCopy}>
              <Text style={styles.nextTitle}>
                Prochaines périodes
              </Text>

              <View style={styles.nextLabelRow}>
                <Text style={styles.nextLabel}>
                  Prochaines règles
                </Text>

                <Text style={styles.nextDateInline}>
                  {formatShortDate(nextPeriod)}
                </Text>
              </View>

              <Text style={styles.nextDelay}>
                Dans {daysUntilNext} jours
              </Text>
            </View>

            <MaterialDesignIcons
              color={PURPLE}
              name="chevron-right"
              size={24}
            />
          </ImageBackground>

          {spiritualMarkersEnabled ? (
            <SpiritualGuidanceCard
              hijriDate={nextPrayer?.hijriDate ?? formatHijriDate(today)}
              locationConfigured={Boolean(selectedLocation)}
              nextPrayerName={nextPrayer?.name}
              nextPrayerTime={nextPrayer?.time}
              remainingTime={remainingPrayerTime}
              status={currentPhase === 'menstruation' ? 'menstruation' : 'purity'}
            />
          ) : null}

          <Text style={styles.quickTitle}>
            Accès rapides
          </Text>

          <View style={styles.quickRow}>
            <QuickAction
              icon="calendar-check-outline"
              label="Calendrier"
            />

            <QuickAction
              icon="heart-pulse"
              label="Symptômes"
            />

            <QuickAction
              icon="mosque"
              label={'Horaires\nde prière'}
            />

            <QuickAction
              icon="book-open-page-variant-outline"
              label="Bibliothèque"
            />
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, {marginBottom: Math.max(insets.bottom, 8)}]}>
          <AnimatedTabItem
            focused={activeTab === 'home'}
            icon={
              <MaterialDesignIcons
                color={activeTab === 'home' ? PURPLE_DARK : '#F3ECFB'}
                name="home-variant"
                size={26}
              />
            }
            label="Accueil"
            onPress={() => setActiveTab('home')}
          />

          <AnimatedTabItem
            focused={activeTab === 'calendar'}
            icon={
              <MaterialDesignIcons
                color={activeTab === 'calendar' ? PURPLE_DARK : '#F3ECFB'}
                name="calendar-month-outline"
                size={26}
              />
            }
            label="Calendrier"
            onPress={() => setActiveTab('calendar')}
          />

          <Pressable
            accessibilityLabel="Ajouter"
            accessibilityRole="button"
            onPress={openJournal}
            style={({pressed}) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}>
            <Animated.View
              style={{
                transform: [
                  {scale: plusScale},
                  {rotate: plusMotion.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']})},
                ],
              }}>
              <MaterialDesignIcons color="#FFFFFF" name="plus" size={30} />
            </Animated.View>
          </Pressable>

          <AnimatedTabItem
            focused={activeTab === 'statistics'}
            icon={
              <MaterialDesignIcons
                color={activeTab === 'statistics' ? PURPLE_DARK : '#F3ECFB'}
                name="chart-donut"
                size={26}
              />
            }
            label="Statistiques"
            onPress={() => setActiveTab('statistics')}
          />

          <AnimatedTabItem
            focused={activeTab === 'profile'}
            icon={
              <MaterialDesignIcons
                color={activeTab === 'profile' ? PURPLE_DARK : '#F3ECFB'}
                name="account-outline"
                size={26}
              />
            }
            label="Profil"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
          <DailyJournalSheet
            onClose={closeJournal}
            onNavigate={navigateFromJournal}
            visible={journalVisible}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function Legend({
  color,
  label,
  outline,
}: {
  color?: string;
  label: string;
  outline?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color ?? 'transparent',
          },
          outline && styles.legendOutline,
        ]}
      />

      <Text style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}>
      <View style={styles.quickIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon as never}
          size={29}
        />
      </View>

      <Text style={styles.quickLabel}>
        {label}
      </Text>
    </Pressable>
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

  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 22,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 18,
  },

  greetingCopy: {
    paddingTop: 15,
  },

  greeting: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 26,
  },

  name: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 25,
    fontWeight: '600',
    lineHeight: 32,
  },

  notification: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E57C80',
  },

  calendarCard: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#EDE3F8',
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 15,
    shadowColor: '#5D4394',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 13,
    elevation: 3,
  },

  monthHeader: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },

  monthTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  hijri: {
    flex: 1,
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  calendarHint: {
    marginTop: 5,
    marginBottom: 13,
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
  },

  weekRow: {
    flexDirection: 'row',
  },

  weekDay: {
    width: '14.2857%',
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
  },

  dayCell: {
    width: '14.2857%',
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },

  day: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },

  dayText: {
    color: PURPLE_DARK,
    fontSize: 14,
  },

  periodDay: {
    backgroundColor: PERIOD_LIGHT,
  },

  fertileDay: {
    backgroundColor: FERTILE,
  },

  ovulationDay: {
    backgroundColor: OVULATION,
  },

  selectedPeriodDay: {
    backgroundColor: PERIOD,
  },

  todayDay: {
    borderWidth: 2,
    borderColor: PURPLE,
  },

  dayTextLight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 3,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  legendDot: {
    width: 13,
    height: 13,
    marginRight: 5,
    borderRadius: 7,
  },

  legendOutline: {
    borderWidth: 1.5,
    borderColor: PURPLE,
  },

  legendText: {
    color: TEXT_MUTED,
    fontSize: 10,
  },

  nextCard: {
    minHeight: 103,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E2D8F0',
    borderRadius: 24,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 16,
    overflow: 'hidden',
    elevation: 2,
  },

  nextCardBackgroundImage: {
    borderRadius: 24,
  },

  nextIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#EEE3FA',
  },

  nextCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  nextTitle: {
    color: PURPLE_DARK,
    fontSize: 15,
    fontWeight: '700',
  },

  nextLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  nextLabel: {
    color: TEXT_MUTED,
    fontSize: 13,
  },

  nextDateInline: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  nextDelay: {
    marginTop: 5,
    color: PURPLE,
    fontSize: 12,
  },

  quickTitle: {
    marginTop: 20,
    marginLeft: 3,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '700',
  },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  quickAction: {
    width: '23%',
    alignItems: 'center',
  },

  quickIcon: {
    width: 62,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#F3ECFB',
  },

  quickLabel: {
    marginTop: 7,
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },

  bottomBar: {
    height: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 34,
    backgroundColor: PURPLE_DARK,
    paddingHorizontal: 7,
    elevation: 8,
  },

  addButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: PURPLE,
    elevation: 4,
  },

  pressed: {
    opacity: 0.7,
    transform: [{scale: 0.97}],
  },
});

export default CycleHomeScreen;