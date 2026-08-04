import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
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
  type ImageSourcePropType,
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

const GREEN = '#145B45';
const PERIOD = '#DC7B82';
const PERIOD_LIGHT = '#F7D7D6';
const FERTILE = '#C8DDAA';
const OVULATION = '#176448';

const HOME_MENU_ICON = require('../assets/images/home-menu-icon.png');
const CALENDAR_MENU_ICON = require('../assets/images/calendar-menu-icon.png');
const STATISTICS_MENU_ICON = require('../assets/images/statistics-menu-icon.png');
const PROFILE_MENU_ICON = require('../assets/images/profile-menu-icon.png');
const ADD_MENU_ICON = require('../assets/images/add-menu-icon.png');
const NOTIFICATION_ICON = require('../assets/images/notification-icon.png');

const NEXT_PERIOD_CARD_BACKGROUND = require('../assets/images/next-period-card-background.png');

const SYMPTOMS_QUICK_ICON = require('../assets/images/symptoms-quick-icon.png');
const PRAYER_TIMES_QUICK_ICON = require('../assets/images/prayer-times-quick-icon.png');
const LIBRARY_QUICK_ICON = require('../assets/images/library-quick-icon.png');

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor="#FBF7EF"
        barStyle="dark-content"
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
              <Image
                accessibilityIgnoresInvertColors
                source={NOTIFICATION_ICON}
                style={styles.notificationImage}
              />

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
                  color={GREEN}
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
                  color={GREEN}
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
              <Image
                accessibilityIgnoresInvertColors
                source={CALENDAR_MENU_ICON}
                style={styles.nextPeriodImage}
              />
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
              color={GREEN}
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
              image={CALENDAR_MENU_ICON}
              label="Calendrier"
            />

            <QuickAction
              icon="heart-pulse"
              image={SYMPTOMS_QUICK_ICON}
              label="Symptômes"
            />

            <QuickAction
              icon="mosque"
              image={PRAYER_TIMES_QUICK_ICON}
              label={'Horaires\nde prière'}
            />

            <QuickAction
              icon="book-open-page-variant-outline"
              image={LIBRARY_QUICK_ICON}
              label="Bibliothèque"
            />
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, {marginBottom: Math.max(insets.bottom, 8)}]}>
          <AnimatedTabItem
            focused={activeTab === 'home'}
            icon={
              <Image
                accessibilityIgnoresInvertColors
                source={HOME_MENU_ICON}
                style={styles.menuImage}
              />
            }
            label="Accueil"
            onPress={() => setActiveTab('home')}
          />

          <AnimatedTabItem
            focused={activeTab === 'calendar'}
            icon={
              <Image
                accessibilityIgnoresInvertColors
                source={CALENDAR_MENU_ICON}
                style={styles.menuImage}
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
              <Image
                accessibilityIgnoresInvertColors
                source={ADD_MENU_ICON}
                style={styles.addMenuImage}
              />
            </Animated.View>
          </Pressable>

          <AnimatedTabItem
            focused={activeTab === 'statistics'}
            icon={
              <Image
                accessibilityIgnoresInvertColors
                source={STATISTICS_MENU_ICON}
                style={styles.menuImage}
              />
            }
            label="Statistiques"
            onPress={() => setActiveTab('statistics')}
          />

          <AnimatedTabItem
            focused={activeTab === 'profile'}
            icon={
              <Image
                accessibilityIgnoresInvertColors
                source={PROFILE_MENU_ICON}
                style={styles.menuImage}
              />
            }
            label="Profil"
            onPress={() => setActiveTab('profile')}
          />
        </View>
        <DailyJournalSheet
          onClose={closeJournal}
          onNavigate={navigateFromJournal}
          visible={journalVisible}
        />
      </View>
    </SafeAreaView>
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
  image,
  label,
}: {
  icon: string;
  image?: ImageSourcePropType;
  label: string;
}) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}>
      <View style={styles.quickIcon}>
        {image ? (
          <Image
            accessibilityIgnoresInvertColors
            source={image}
            style={styles.quickActionImage}
          />
        ) : (
          <MaterialDesignIcons
            color={GREEN}
            name={icon as never}
            size={29}
          />
        )}
      </View>

      <Text style={styles.quickLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF7EF',
  },

  page: {
    flex: 1,
    backgroundColor: '#FBF7EF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
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
    color: '#174F40',
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 26,
  },

  name: {
    color: '#174F40',
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

  notificationImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
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
    borderColor: '#EFE6DA',
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 15,
    shadowColor: '#8C765D',
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
    color: '#17201E',
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  hijri: {
    flex: 1,
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  calendarHint: {
    marginTop: 5,
    marginBottom: 13,
    color: '#8B8A83',
    fontSize: 11,
    textAlign: 'center',
  },

  weekRow: {
    flexDirection: 'row',
  },

  weekDay: {
    width: '14.2857%',
    color: '#38403D',
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
    color: '#1E2523',
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
    borderColor: GREEN,
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
    borderColor: GREEN,
  },

  legendText: {
    color: '#27443B',
    fontSize: 10,
  },

  nextCard: {
    minHeight: 103,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#C7D0B9',
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
    backgroundColor: '#EFF2E5',
  },

  nextPeriodImage: {
    width: 46,
    height: 46,
    resizeMode: 'contain',
  },

  nextCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  nextTitle: {
    color: GREEN,
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
    color: '#22322D',
    fontSize: 13,
  },

  nextDateInline: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  nextDelay: {
    marginTop: 5,
    color: GREEN,
    fontSize: 12,
  },

  quickTitle: {
    marginTop: 20,
    marginLeft: 3,
    color: '#15201D',
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
    backgroundColor: '#F8F0E5',
  },

  quickActionImage: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },

  quickLabel: {
    marginTop: 7,
    color: '#18211F',
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
    backgroundColor: GREEN,
    paddingHorizontal: 7,
    elevation: 8,
  },

  menuImage: {
    width: 43,
    height: 43,
    resizeMode: 'contain',
  },

  addButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },

  addMenuImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },

  pressed: {
    opacity: 0.7,
    transform: [{scale: 0.97}],
  },
});

export default CycleHomeScreen;
