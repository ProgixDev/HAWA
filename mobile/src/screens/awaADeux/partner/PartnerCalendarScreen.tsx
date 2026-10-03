import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../../../components/home/homeTheme';
import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import PartnerScreenBackground from './PartnerScreenBackground';
import {getHasConfirmedCycleData, getRecordedPeriodHistory} from '../../../state/onboardingPreferences';
import {getAppLanguage} from '../../../state/themePreferences';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {getFloatingTabBarClearance, getTopPadding} from '../../../theme/spacing';
import {pickReadableTextColor, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {addDays, capitalize, formatFullDate, localizedWeekDays, sameDay, startOfDay} from '../../../utils/cycleMath';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {computePartnerCycleInfo} from '../../../utils/awaADeuxPartnerCycleInfo';

// The partner's read-only calendar (PartnerMainTabs "Calendrier") — a read-only rendering
// of the SAME calendar design AWA's own objective calendars already use
// (src/components/calendar/MonthCalendarCard.tsx, the card behind CycleHomeScreen /
// ConceiveCalendarContent / etc., and its companion src/components/calendar/LegendSheet.tsx).
// Card radius/shadow, month header, weekday row, day-cell geometry, the "Today" dashed
// neutral fill and the period/fertile colors + legend wording below are all taken from
// those two files, not reinvented — see each style/constant's own comment for exactly
// which one it mirrors. No date is pressable, there is no day-editor and no way to open
// the shared daily-journal sheet: this screen only ever reads, never writes.
//
// A permission that is OFF removes its marker AND its legend entry entirely (never merely
// visually de-emphasized), so nothing indirectly hints at hidden information. Period days
// come from the same confirmed history the owner's own calendar reads
// (getRecordedPeriodHistory()); the fertile window and next-period date come from
// computePartnerCycleInfo() (utils/cycleMath.ts, reused — not re-derived).
// SEMANTIC calendar-tracking colors — the exact same fixed literals the owner's own
// calendar system uses (MonthCalendarCard.tsx's PERIOD_DOT_COLOR/PERIOD_FILL_COLOR/
// FERTILE_COLOR/FERTILE_FILL_COLOR, itself duplicated the same way in LegendSheet.tsx):
// deliberately NOT theme-driven, so switching an AWA palette can never change what
// "period"/"fertile" mean. Duplicated here rather than exported, matching how
// LegendSheet.tsx already duplicates MonthCalendarCard.tsx's own copies — an established
// pattern in this codebase for these specific colors, not a new palette.
const PERIOD_DOT_COLOR = '#DC7B82';
const PERIOD_FILL_COLOR = '#F7D7D6';
const FERTILE_COLOR = '#3E8E56';
const FERTILE_FILL_COLOR = '#DCEFE0';

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
// Monday-first leading blanks, matching WEEK_DAYS (Lun..Dim) — same formula as
// MonthCalendarCard's own calendarDays computation.
function leadingBlanks(date: Date): number {
  const weekday = startOfMonth(date).getDay(); // 0 = Sunday
  return (weekday + 6) % 7;
}

export default function PartnerCalendarScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Live app language, not a fixed 'fr-FR' — recomputed every render (cheap) so a runtime
  // FR→EN switch updates the month header immediately (same pattern as PrayerTimesScreen.tsx).
  const monthLabel = new Intl.DateTimeFormat(getAppLanguage() === 'en' ? 'en-US' : 'fr-FR', {month: 'long', year: 'numeric'});

  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const info = useMemo(() => computePartnerCycleInfo(), []);
  const hasHistory = getHasConfirmedCycleData();
  const periodDays = useMemo(() => {
    if (!visibility.fields.periodStatus || !hasHistory) {return [] as Date[];}
    const days: Date[] = [];
    getRecordedPeriodHistory().forEach(record => {
      let cursor = startOfDay(new Date(`${record.startDate}T12:00:00`));
      const end = startOfDay(new Date(`${record.endDate}T12:00:00`));
      while (cursor.getTime() <= end.getTime()) {
        days.push(cursor);
        cursor = addDays(cursor, 1);
      }
    });
    return days;
  }, [visibility.fields.periodStatus, hasHistory]);

  // computePartnerCycleInfo() only ever runs for today; this is the CURRENTLY upcoming
  // fertile window / predicted period date, so they only ever mark days that actually
  // fall within them — never redrawn as if they recurred every month.
  const fertileRange = visibility.fields.fertileWindow ? info.fertileWindowRange : null;
  const nextPeriodDate = visibility.fields.nextPeriod ? info.nextPeriodDate : null;
  const isFertileDay = (date: Date) =>
    !!fertileRange && date.getTime() >= fertileRange.start.getTime() && date.getTime() <= fertileRange.end.getTime();

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(monthCursor);
  const totalDays = daysInMonth(monthCursor);
  const blanks = leadingBlanks(monthCursor);
  const cells: Array<Date | null> = [...Array(blanks).fill(null), ...Array.from({length: totalDays}, (_, index) => addDays(monthStart, index))];

  // Gated purely by the sharing permission (not by whether a day is visible THIS month) —
  // the same philosophy MonthCalendarCard's own legend uses (it doesn't hide "Ovulation"
  // just because no ovulation day falls in the visible month either).
  const legend: Array<{color: string; label: string; description: string}> = [];
  if (visibility.fields.periodStatus || visibility.fields.nextPeriod) {
    legend.push({color: PERIOD_DOT_COLOR, label: t('calendar.legendPeriod'), description: t('calendar.legendSheet.periodDescription')});
  }
  if (visibility.fields.fertileWindow) {
    legend.push({color: FERTILE_COLOR, label: t('cycleHome.fertileWindowLabel'), description: t('calendar.legendSheet.fertileDescription')});
  }

  return (
    <PartnerScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: getFloatingTabBarClearance(insets.bottom, 16)}]}
        showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>{t('awaADeux.partnerSide.calendar.title')}</Text>

        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityLabel={t('awaADeux.partnerSide.calendar.previousMonth')}
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setMonthCursor(previous => startOfMonth(addDays(previous, -1)))}>
              <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={24} />
            </Pressable>
            <View style={styles.monthTitleBlock}>
              <Text numberOfLines={1} style={styles.monthTitle}>{capitalize(monthLabel.format(monthCursor))}</Text>
            </View>
            <Pressable
              accessibilityLabel={t('awaADeux.partnerSide.calendar.nextMonth')}
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setMonthCursor(previous => startOfMonth(addDays(previous, daysInMonth(previous) + 1)))}>
              <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={24} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {localizedWeekDays().map(day => (
              <Text key={day} numberOfLines={1} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {cells.map((date, index) => {
              if (!date) {return <View key={`blank-${index}`} style={styles.dayCell} />;}
              const isToday = sameDay(date, today);
              const isPeriod = periodDays.some(period => sameDay(period, date)) || (!!nextPeriodDate && sameDay(date, nextPeriodDate));
              const isFertile = !isPeriod && isFertileDay(date);
              const label = [
                formatFullDate(date),
                isPeriod && t('awaADeux.partnerSide.calendar.periodTag'),
                isFertile && t('awaADeux.partnerSide.calendar.fertileTag'),
                isToday && t('awaADeux.partnerSide.calendar.todayTag'),
              ].filter(Boolean).join(', ');
              const dots: string[] = [];
              if (isPeriod) {dots.push(PERIOD_DOT_COLOR);}
              if (isFertile) {dots.push(FERTILE_COLOR);}

              return (
                <View key={date.toISOString()} style={styles.dayCell}>
                  <View
                    accessibilityLabel={label}
                    accessibilityRole="text"
                    style={[
                      styles.day,
                      // "Today" always wins over any colored fill (same priority order as
                      // MonthCalendarCard's own DayCell), so the day stays clearly readable.
                      !isToday && isPeriod && styles.periodDay,
                      !isToday && isFertile && styles.fertileDay,
                      isToday && styles.todayDay,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        // Same rule as MonthCalendarCard's own onColoredBg: the fixed
                        // semantic fills stay readable regardless of Light/Dark by deriving
                        // their own text color directly from the fill, never from
                        // theme.colors.text (which flips brightness with the theme and
                        // would go unreadable on these fixed pastel backgrounds).
                        !isToday && isPeriod && styles.periodDayText,
                        !isToday && isFertile && styles.fertileDayText,
                        isToday && styles.todayDayText,
                      ]}>
                      {date.getDate()}
                    </Text>
                    {dots.length > 0 ? (
                      <View style={styles.dotRow}>
                        {dots.map((color, dotIndex) => (
                          <View key={dotIndex} style={[styles.dot, {backgroundColor: color}]} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {legend.length > 0 ? (
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>{t('awaADeux.partnerSide.calendar.legendTitle')}</Text>
            {legend.map((item, index) => (
              <View key={item.label} style={[styles.legendRow, index > 0 && styles.legendRowDivider]}>
                <View style={[styles.legendDot, {backgroundColor: item.color}]} />
                <View style={styles.legendCopy}>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.legendCard}>
            <Text style={styles.emptyText}>{t('awaADeux.partnerSide.calendar.emptyLegend')}</Text>
          </View>
        )}
      </ScrollView>
    </PartnerScreenBackground>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: 20, paddingBottom: 20},
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 26, lineHeight: 32, fontWeight: '700'},
    // Same card treatment as MonthCalendarCard.tsx: homeRadii.card, theme.colors.surface,
    // 16 padding, theme.shadow.
    card: {
      marginTop: 18,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
      ...theme.shadow,
    },
    // Same month-header anatomy as MonthCalendarCard.tsx (bare chevrons, no button chrome).
    monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    monthTitleBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 6},
    monthTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 19, fontWeight: '700', textTransform: 'capitalize'},
    weekRow: {flexDirection: 'row', marginTop: 14},
    weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center'},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6},
    dayCell: {width: '14.2857%', minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
    day: {width: '86%', minHeight: 40, maxWidth: 42, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 14},
    dayText: {color: theme.colors.text, fontSize: 13, fontWeight: '600'},
    // SEMANTIC backgrounds — never theme-driven, see the file header note.
    periodDay: {backgroundColor: PERIOD_FILL_COLOR},
    fertileDay: {backgroundColor: FERTILE_FILL_COLOR},
    // Text color derived from the fixed fill itself (pickReadableTextColor), not from
    // theme.colors.text — keeps these two fills readable in both Light and Dark.
    periodDayText: {fontWeight: '700', color: pickReadableTextColor(PERIOD_FILL_COLOR)},
    fertileDayText: {fontWeight: '700', color: pickReadableTextColor(FERTILE_FILL_COLOR)},
    // Neutral fill, always wins — identical treatment to MonthCalendarCard's own
    // todayDayBorder (primarySoft fill + dashed theme.colors.text border, radius 14).
    todayDay: {
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1.8,
      borderStyle: 'dashed',
      borderColor: theme.colors.text,
    },
    todayDayText: {color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    dotRow: {flexDirection: 'row', gap: 2, marginTop: 1},
    dot: {width: 3.5, height: 3.5, borderRadius: 2},
    // The legend as a compact card, reusing LegendSheet.tsx's own row/dot/label/description
    // anatomy (16×16 dot, bold label, secondary description) instead of its modal chrome.
    legendCard: {
      marginTop: 14,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 4,
      ...theme.shadow,
    },
    legendTitle: {marginTop: 12, marginBottom: 2, color: theme.colors.text, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
    legendRow: {minHeight: 52, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10},
    legendRowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    legendDot: {width: 16, height: 16, marginTop: 2, borderRadius: 8},
    legendCopy: {flex: 1, minWidth: 0},
    legendLabel: {color: theme.colors.text, fontSize: 14, fontWeight: '700'},
    legendDescription: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},
    emptyText: {paddingVertical: 16, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20},
  });
}
