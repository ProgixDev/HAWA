import {rollSelectedDate} from '../utils/dayRollover';
import {useToday} from '../hooks/useToday';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Image, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaInfoRow} from '../components/ui/AwaInfoRow';
import {AwaText} from '../components/ui/AwaText';
import HijriMonthGrid from '../components/hijri/HijriMonthGrid';
import {
  capitalize,
  dateFormatLocale,
  formatFullDate,
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  sameDay,
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
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {displayUpperCase} from '../utils/textCase';

const MOSQUE_BANNER = require('../assets/images/auth-mosque-background.png');
const MOSQUE_BANNER_RATIO = 848 / 1854;

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// DESIGN.md: a navigation row with a chevron is an AwaInfoRow; the negative margin cancels the card padding so the
// row's own 16 dp inset and divider line up with the card edges.
function ShortcutRow({
  icon, label, onPress, last, styles,
}: {
  icon: IconName; label: string; onPress: () => void; last?: boolean;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return <AwaInfoRow icon={icon} last={last} onPress={onPress} style={styles.shortcutRow} title={label} />;
}

function HijriCalendarScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const {today} = useToday();
  const [monthStart, setMonthStart] = useState(() => hijriMonthStart(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [direction, setDirection] = useState<1 | -1>(1);

  // A new day began: a selection / viewed Hijri month that was FOLLOWING today
  // moves to the new day; a date or month the user navigated to is never moved.
  const previousTodayRef = useRef(today);
  useEffect(() => {
    const previousToday = previousTodayRef.current;
    if (previousToday.getTime() === today.getTime()) {return;}
    previousTodayRef.current = today;
    setSelectedDate(current => rollSelectedDate(current, previousToday, today));
    setMonthStart(current => {
      const wasViewingTodaysMonth = current.getTime() === hijriMonthStart(previousToday).getTime();
      const next = hijriMonthStart(today);
      return wasViewingTodaysMonth && next.getTime() !== current.getTime() ? next : current;
    });
  }, [today]);

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
  const weekdayLocale = dateFormatLocale();
  const todayWeekdayDate = `${capitalize(new Intl.DateTimeFormat(weekdayLocale, {weekday: 'long'}).format(today))} ${formatFullDate(today)}`;

  const selectedHijriDate = formatHijriDate(selectedDate) ?? '—';
  const selectedWeekdayDate = `${capitalize(new Intl.DateTimeFormat(weekdayLocale, {weekday: 'long'}).format(selectedDate))} ${formatFullDate(selectedDate)}`;
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
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="chevron-left"
            iconSize={26}
            onPress={navigation.goBack}
          />
          <View style={styles.headerTitleRow}>
            <AwaText variant="headlineSmall" style={styles.headerTitle}>
              {t('hijriCalendar.title')}
            </AwaText>
          </View>
          <AwaIconButton
            accessibilityLabel={t('hijriCalendar.todayAccessibility')}
            icon="calendar-today"
            onPress={goToToday}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(450)}>
          <AwaCard style={styles.heroCard} variant="filled">
            <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium" style={styles.heroEyebrow}>{displayUpperCase(t('hijriCalendar.today'))}</AwaText>
            <AwaText variant="displaySmall" style={styles.heroDay}>{todayHijriDay}</AwaText>
            <AwaText colorRole="primary" variant="titleMedium" style={styles.heroMonth}>{todayHijriMonthYear}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.heroGregorian}>{todayWeekdayDate}</AwaText>
          </AwaCard>
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
          <Animated.View style={selectedAnimatedStyle}>
            <AwaCard variant="outlined">
              <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.selectedLabel}>{displayUpperCase(t('hijriCalendar.selectedDateLabel'))}</AwaText>
              <View style={styles.selectedRow}>
                <View style={styles.selectedCopy}>
                  <AwaText variant="titleMedium">{selectedHijriDate}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.selectedGregorian}>{selectedWeekdayDate}</AwaText>
                </View>
                {selectedIsToday ? (
                  <View style={styles.todayPill}>
                    <AwaText colorRole="success" emphasized variant="labelSmall">{t('hijriCalendar.today')}</AwaText>
                  </View>
                ) : null}
              </View>
            </AwaCard>
          </Animated.View>
        </Animated.View>

        <Animated.View style={monthRefAnimatedStyle}>
          <AwaCard variant={ramadan ? 'filled' : 'outlined'}>
            <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.monthRefEyebrow}>{displayUpperCase(t('hijriCalendar.monthReferenceEyebrow'))}</AwaText>

            {ramadan ? (
              <View style={styles.monthPill}>
                <AwaText colorRole="warning" emphasized variant="labelSmall">{t('hijriCalendar.ramadanPill')}</AwaText>
              </View>
            ) : null}

            <AwaText variant="titleMedium" style={styles.monthRefTitle}>{monthLabel}</AwaText>

            {ramadan ? (
              <>
                <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.monthRefText}>
                  {t('hijriCalendar.ramadanText')}
                </AwaText>
                <AwaButton
                  label={t('hijriCalendar.ramadanButton')}
                  onPress={() => navigation.navigate('FastingQadaa')}
                  style={styles.monthRefButton}
                />
              </>
            ) : dhoulHijja ? (
              <>
                <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.monthRefText}>{t('hijriCalendar.dhoulHijjaText')}</AwaText>
                <AwaButton
                  label={t('hijriCalendar.dhoulHijjaButton')}
                  onPress={() => navigation.navigate('SpiritualPreferences', {mode: 'edit'})}
                  style={styles.monthRefButton}
                />
              </>
            ) : (
              <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.monthRefText}>{t('hijriCalendar.noSpecialReference')}</AwaText>
            )}
          </AwaCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(420)}>
          <AwaCard variant="outlined">
          <AwaText variant="titleMedium">{t('hijriCalendar.shortcutsTitle')}</AwaText>
          <ShortcutRow icon="mosque" label={t('hijriCalendar.shortcutPrayerTimes')} onPress={() => navigation.navigate('PrayerTimes')} styles={styles} />
          <ShortcutRow icon="silverware-fork-knife" label={t('hijriCalendar.shortcutQadaa')} onPress={() => navigation.navigate('FastingQadaa')} styles={styles} />
          <ShortcutRow icon="book-open-page-variant-outline" label={t('hijriCalendar.shortcutLibrary')} last onPress={() => navigation.navigate('Library')} styles={styles} />
          </AwaCard>
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
    headerTitleRow: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
    headerTitle: {color: theme.colors.text, textAlign: 'center'},

    heroCard: {alignItems: 'center', paddingVertical: 22, paddingHorizontal: 20},
    heroEyebrow: {letterSpacing: 0.5, textTransform: 'uppercase'},
    heroDay: {marginTop: 6},
    heroMonth: {marginTop: 2},
    heroGregorian: {marginTop: 8},

    selectedLabel: {textTransform: 'uppercase', letterSpacing: 0.6},
    selectedRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 10},
    selectedCopy: {flex: 1},
    selectedGregorian: {marginTop: 2},
    todayPill: {borderRadius: 12, backgroundColor: withAlpha(theme.colors.success, 0.18), paddingHorizontal: 9, paddingVertical: 4},

    monthRefEyebrow: {textTransform: 'uppercase', letterSpacing: 0.6},
    monthPill: {
      alignSelf: 'flex-start', marginTop: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.15), paddingHorizontal: 9, paddingVertical: 3,
    },
    monthRefTitle: {marginTop: 6},
    monthRefText: {marginTop: 8},
    monthRefButton: {alignSelf: 'flex-start', marginTop: 12},

    shortcutRow: {marginHorizontal: -16},
  });
}

export default HijriCalendarScreen;
