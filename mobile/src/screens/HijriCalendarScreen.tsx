import React, {useEffect, useMemo, useState} from 'react';
import {Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {homeRadii} from '../components/home/homeTheme';
import HijriMonthGrid from '../components/hijri/HijriMonthGrid';
import {
  capitalize,
  formatFullDate,
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
  startOfDay,
} from '../utils/cycleMath';
import {
  hijriMonthStart,
  isDhoulHijja,
  isRamadan,
  nextHijriMonthStart,
  previousHijriMonthStart,
} from '../utils/hijriCalendar';
import {getBottomPadding, getTopPadding} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

const MOSQUE_BANNER = require('../assets/images/auth-mosque-background.png');
const MOSQUE_BANNER_RATIO = 848 / 1854;

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

function ShortcutRow({
  icon, label, onPress, last, theme, styles,
}: {
  icon: IconName; label: string; onPress: () => void; last?: boolean;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.shortcutRow, !last && styles.shortcutRowBorder, pressed && styles.pressed]}>
      <View style={styles.shortcutIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={17} />
      </View>
      <Text style={styles.shortcutLabel}>{label}</Text>
      <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={18} />
    </Pressable>
  );
}

function HijriCalendarScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [monthStart, setMonthStart] = useState(() => hijriMonthStart(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Subtle scale + fade whenever the selected day changes — reset via
  // shared values (not a remount) for a reliable, calm acknowledgement.
  const selectedOpacity = useSharedValue(1);
  const selectedScale = useSharedValue(1);
  useEffect(() => {
    selectedOpacity.value = 0;
    selectedScale.value = 0.96;
    selectedOpacity.value = withTiming(1, {duration: 260});
    selectedScale.value = withTiming(1, {duration: 260});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);
  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectedOpacity.value,
    transform: [{scale: selectedScale.value}],
  }));

  // Soft entrance for "Repères du mois" whenever the viewed month changes
  // (including into/out of Ramadan or Dhoul Hijja) — no continuous animation.
  const monthRefOpacity = useSharedValue(1);
  const monthRefTranslateY = useSharedValue(0);
  useEffect(() => {
    monthRefOpacity.value = 0;
    monthRefTranslateY.value = 6;
    monthRefOpacity.value = withTiming(1, {duration: 300});
    monthRefTranslateY.value = withTiming(0, {duration: 300});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStart]);
  const monthRefAnimatedStyle = useAnimatedStyle(() => ({
    opacity: monthRefOpacity.value,
    transform: [{translateY: monthRefTranslateY.value}],
  }));

  const monthLabel = formatHijriMonthYear(monthStart) ?? '—';
  const todayHijriDay = formatHijriDay(today) ?? '—';
  const todayHijriMonthYear = formatHijriMonthYear(today) ?? '—';
  const todayWeekdayDate = `${capitalize(new Intl.DateTimeFormat('fr-FR', {weekday: 'long'}).format(today))} ${formatFullDate(today)}`;

  const selectedHijriDate = formatHijriDate(selectedDate) ?? '—';
  const selectedWeekdayDate = `${capitalize(new Intl.DateTimeFormat('fr-FR', {weekday: 'long'}).format(selectedDate))} ${formatFullDate(selectedDate)}`;
  const selectedIsToday = sameDay(selectedDate, today);

  const goToPreviousMonth = () => {
    setDirection(-1);
    setMonthStart(current => previousHijriMonthStart(current));
  };
  const goToNextMonth = () => {
    setDirection(1);
    setMonthStart(current => nextHijriMonthStart(current));
  };
  const goToToday = () => {
    const target = hijriMonthStart(today);
    setDirection(target.getTime() >= monthStart.getTime() ? 1 : -1);
    setMonthStart(target);
  };

  const ramadan = isRamadan(monthStart);
  const dhoulHijja = isDhoulHijja(monthStart);

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      <View style={styles.banner} pointerEvents="none">
        <Image resizeMode="cover" source={MOSQUE_BANNER} style={[styles.bannerImage, {aspectRatio: MOSQUE_BANNER_RATIO}]} />
        {/* The header title/icon below render directly over this banner (no
            opaque card behind them), so the scrim must already carry real
            theme-background opacity at the very top (location 0) — a
            transparent-at-top fade left the mosque photo fully bright behind
            that text in every theme, which read fine in Light but made
            Dark-mode text (theme.colors.text, necessarily light-on-dark)
            unreadable against the still-bright, undimmed photo. Same fix as
            PrayerTimesScreen.tsx's identical banner. */}
        <LinearGradient
          colors={[withAlpha(theme.colors.background, 0.6), withAlpha(theme.colors.background, 0.85), theme.colors.background]}
          locations={[0, 0.6, 1]}
          style={styles.bannerFade}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingTop: getTopPadding(insets.top, true), paddingBottom: getBottomPadding(insets.bottom)},
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(380)} style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={26} />
          </Pressable>
          <View style={styles.headerTitleRow}>
            <MaterialDesignIcons color={theme.colors.primary} name="moon-waning-crescent" size={16} />
            <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={styles.headerTitle}>
              Calendrier Hijri
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Revenir à aujourd’hui"
            accessibilityRole="button"
            hitSlop={10}
            onPress={goToToday}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-today" size={20} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(450)} style={styles.heroCard}>
          <MaterialDesignIcons color={theme.colors.primary} name="mosque" size={128} style={styles.heroWatermark} />
          <Text style={styles.heroEyebrow}>Aujourd’hui</Text>
          <Text style={styles.heroDay}>{todayHijriDay}</Text>
          <Text style={styles.heroMonth}>{todayHijriMonthYear}</Text>
          <Text style={styles.heroGregorian}>{todayWeekdayDate}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(420)}>
          <HijriMonthGrid
            direction={direction}
            monthLabel={monthLabel}
            monthStart={monthStart}
            onNext={goToNextMonth}
            onPrevious={goToPreviousMonth}
            onSelectDate={setSelectedDate}
            onToday={goToToday}
            selectedDate={selectedDate}
            today={today}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(420)}>
          <Animated.View style={[styles.selectedCard, selectedAnimatedStyle]}>
            <Text style={styles.selectedLabel}>Date sélectionnée</Text>
            <View style={styles.selectedRow}>
              <View style={styles.selectedCopy}>
                <Text style={styles.selectedHijri}>{selectedHijriDate}</Text>
                <Text style={styles.selectedGregorian}>{selectedWeekdayDate}</Text>
              </View>
              {selectedIsToday ? (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>Aujourd’hui</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.monthRefCard,
            ramadan && styles.monthRefCardRamadan,
            monthRefAnimatedStyle,
          ]}>
          {ramadan ? (
            <MaterialDesignIcons color={theme.colors.primary} name="moon-waning-crescent" size={96} style={styles.monthRefWatermark} />
          ) : null}

          <View style={styles.monthRefHeadingRow}>
            <View style={styles.monthRefIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="calendar-star" size={16} />
            </View>
            <Text style={styles.monthRefEyebrow}>Repères du mois</Text>
          </View>

          {ramadan ? (
            <View style={styles.monthPill}>
              <Text style={styles.monthPillText}>Ramadan</Text>
            </View>
          ) : null}

          <Text style={styles.monthRefTitle}>{monthLabel}</Text>

          {ramadan ? (
            <>
              <Text style={styles.monthRefText}>
                C’est le mois du jeûne. Retrouve ici tes repères spirituels et ton suivi du jeûne.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('FastingQadaa')}
                style={({pressed}) => [styles.monthRefButton, pressed && styles.pressed]}>
                <Text style={styles.monthRefButtonText}>Consulter mes jeûnes à rattraper</Text>
              </Pressable>
            </>
          ) : dhoulHijja ? (
            <>
              <Text style={styles.monthRefText}>Mois important du calendrier hijri.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('SpiritualPreferences')}
                style={({pressed}) => [styles.monthRefButton, pressed && styles.pressed]}>
                <Text style={styles.monthRefButtonText}>Découvrir les repères spirituels</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.monthRefText}>Aucun repère particulier pour ce mois.</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(420)} style={styles.shortcutsCard}>
          <Text style={styles.shortcutsTitle}>Repères spirituels</Text>
          <ShortcutRow icon="mosque" label="Horaires de prière" onPress={() => navigation.navigate('PrayerTimes')} styles={styles} theme={theme} />
          <ShortcutRow icon="silverware-fork-knife" label="Jeûnes à rattraper" onPress={() => navigation.navigate('FastingQadaa')} styles={styles} theme={theme} />
          <ShortcutRow icon="book-open-page-variant-outline" label="Contenus spirituels" last onPress={() => navigation.navigate('Library')} styles={styles} theme={theme} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {flex: 1, backgroundColor: theme.colors.background},
    banner: {position: 'absolute', left: 0, right: 0, top: 0, height: 260, overflow: 'hidden'},
    bannerImage: {width: '100%', position: 'absolute', top: 0},
    bannerFade: {...StyleSheet.absoluteFillObject},
    content: {paddingHorizontal: 16, gap: 14},
    header: {flexDirection: 'row', alignItems: 'center', gap: 8},
    headerButton: {
      width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21,
      backgroundColor: theme.colors.surface, elevation: 2,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.09, shadowRadius: 8,
    },
    headerTitleRow: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
    headerTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
    pressed: {opacity: 0.8},

    heroCard: {
      overflow: 'hidden',
      alignItems: 'center', borderRadius: homeRadii.card, backgroundColor: theme.colors.primarySoft,
      paddingVertical: 22, paddingHorizontal: 20, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.10),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4,
    },
    heroWatermark: {position: 'absolute', right: -26, bottom: -30, opacity: 0.09},
    heroEyebrow: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase'},
    heroDay: {marginTop: 6, color: theme.colors.text, fontFamily: 'serif', fontSize: 46, fontWeight: '700', lineHeight: 52},
    heroMonth: {marginTop: 2, color: theme.colors.primary, fontSize: 17, fontWeight: '700'},
    heroGregorian: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 12.5},

    selectedCard: {borderRadius: homeRadii.card, backgroundColor: theme.colors.surface, padding: 16, ...theme.shadow},
    selectedLabel: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6},
    selectedRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 10},
    selectedCopy: {flex: 1},
    selectedHijri: {color: theme.colors.text, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
    selectedGregorian: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12.5},
    todayPill: {borderRadius: 10, backgroundColor: withAlpha(theme.colors.success, 0.18), paddingHorizontal: 9, paddingVertical: 4},
    todayPillText: {color: theme.colors.success, fontSize: 10.5, fontWeight: '700'},

    monthRefCard: {overflow: 'hidden', borderRadius: homeRadii.card, backgroundColor: theme.colors.surface, padding: 16, ...theme.shadow},
    monthRefCardRamadan: {backgroundColor: theme.colors.primarySoft},
    monthRefWatermark: {position: 'absolute', right: -20, top: -18, opacity: 0.08},
    monthRefHeadingRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    monthRefIcon: {width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft},
    monthRefEyebrow: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6},
    monthPill: {
      alignSelf: 'flex-start', marginTop: 10, borderRadius: 10,
      backgroundColor: withAlpha(theme.colors.warning, 0.15), paddingHorizontal: 9, paddingVertical: 3,
    },
    monthPillText: {color: theme.colors.warning, fontSize: 10.5, fontWeight: '700'},
    monthRefTitle: {marginTop: 6, color: theme.colors.text, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
    monthRefText: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    monthRefButton: {
      alignSelf: 'flex-start', marginTop: 12, minHeight: 40, alignItems: 'center', justifyContent: 'center',
      borderRadius: homeRadii.button, backgroundColor: theme.colors.primary, paddingHorizontal: 16,
    },
    monthRefButtonText: {color: onPrimaryTextColor(theme), fontSize: 12.5, fontWeight: '700'},

    shortcutsCard: {borderRadius: homeRadii.card, backgroundColor: theme.colors.surface, padding: 16, ...theme.shadow},
    shortcutsTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    shortcutRow: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, minHeight: 44},
    shortcutRowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
    shortcutIcon: {width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft},
    shortcutLabel: {flex: 1, color: theme.colors.text, fontSize: 13.5, fontWeight: '600'},
  });
}

export default HijriCalendarScreen;
