import React, {memo, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  type CycleBasics,
  formatHijriDay,
  formatHijriMonthYear,
  kindFor,
  sameDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import {getSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import type {CalendarFilters} from '../../state/calendarFilters';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type CalendarDisplayMode = 'gregorian' | 'hijri' | 'double';

// ============================================================================
// PHASE C — SEMANTIC vs THEMEABLE COLORS IN THIS FILE
// ============================================================================
// Calendar tracking-meaning colors (period/fertile/ovulation/mood/notes dots,
// the two religious-month markers) are DELIBERATELY left as fixed literals,
// NOT sourced from `theme.colors.*` — switching palettes must never change
// what "period"/"fertile"/"ovulation" mean. Only generic, decorative chrome
// (card surface, borders, titles, the segmented mode selector, the "selected
// day" brand-purple fill, shadows) now reads from `useAwaTheme()`.
//
// RAMADAN_MARKER_COLOR previously reused `homeColors.primary` (the app's one
// brand purple) specifically because there was no dedicated "religious
// marker" color at the time — reusing the current brand purple was already
// the deliberate choice. It is now hardcoded to that same resolved value
// ('#6D4AE8') rather than following `theme.colors.primary`, so it stays
// visually stable alongside its fixed sibling DHOUL_HIJJA_MARKER_COLOR —
// switching to Sage Serenity must not turn Ramadan's marker green while
// Dhou al-Hijja's stays gold.

// One boolean per category Cycle's own "Journal quotidien" (CYCLE_JOURNAL_ITEMS
// in DailyJournalSheet.tsx) can actually save. `mood` and `flow` get their own
// dot color (flow reuses the existing "Règles" pink); the rest — notes,
// symptoms, activity, sleep, hydration, intimacy — share the existing
// "Notes / Symptômes" teal dot rather than inventing new colors for each
// (also keeps `intimacy` presence-only on the calendar, never distinguishing
// its value, consistent with how private/intimate data is treated elsewhere).
export type DayJournalFlags = {
  mood: boolean;
  notes: boolean;
  symptoms: boolean;
  activity: boolean;
  sleep: boolean;
  hydration: boolean;
  flow: boolean;
  intimacy: boolean;
};

type Props = {
  visibleMonth: Date;
  onChangeMonth: (offset: number) => void;
  displayMode: CalendarDisplayMode;
  onChangeDisplayMode: (mode: CalendarDisplayMode) => void;
  basics: CycleBasics;
  today: Date;
  selectedDate: Date;
  // Whether `selectedDate` reflects a deliberate user tap (as opposed to the
  // screen's initial default of "today") — controls whether the matching
  // day cell gets the purple "selected" treatment.
  showSelection: boolean;
  onSelectDate: (date: Date) => void;
  journalFlagsByDate: Record<string, DayJournalFlags>;
  filters: CalendarFilters;
  editingPeriod?: boolean;
  draftPeriodDays?: ReadonlySet<string>;
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const backgroundColorStyle = (backgroundColor: string) => ({backgroundColor});

// SEMANTIC — calendar tracking meaning, never theme-driven (see header note).
const PERIOD_DOT_COLOR = '#DC7B82';
const FERTILE_COLOR = '#3E8E56';
const OVULATION_COLOR = '#8B5CF6';
const MOOD_DOT_COLOR = '#E0A93E';
const NOTES_COLOR = '#2C8E93';
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

const MODES: {key: CalendarDisplayMode; label: string}[] = [
  {key: 'gregorian', label: 'Grégorien'},
  {key: 'hijri', label: 'Hijri'},
  {key: 'double', label: 'Double'},
];

function DayCell({
  date,
  basics,
  today,
  selectedDate,
  showSelection,
  onSelectDate,
  showHijri,
  flags,
  filters,
  editingPeriod = false,
  draftPeriodDays,
  spiritualMarkersEnabled,
  theme,
  styles,
}: {
  date: Date | null;
  basics: CycleBasics;
  today: Date;
  selectedDate: Date;
  showSelection: boolean;
  onSelectDate: (date: Date) => void;
  showHijri: boolean;
  flags?: DayJournalFlags;
  filters: CalendarFilters;
  editingPeriod?: boolean;
  draftPeriodDays?: ReadonlySet<string>;
  spiritualMarkersEnabled: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  if (!date) {
    return <View style={styles.dayCell} />;
  }

  const kind = kindFor(date, basics);
  const isDraftPeriod = editingPeriod && Boolean(draftPeriodDays?.has(dateKey(date)));
  const isSelected = showSelection && sameDay(date, selectedDate);
  const isToday = sameDay(date, today);
  const hijriDay = showHijri ? formatHijriDay(date) : undefined;

  // Visible regardless of displayMode (Gregorian/Hijri/Double) — the whole
  // point is surfacing Ramadan/Dhou al-Hijja to a user who never switches to
  // Hijri mode. Reuses the exact canonical per-date Hijri helpers, no new
  // conversion logic. Independent visual channel from the dot row below
  // (never competes for/truncates a real journal-category dot), and follows
  // the exact same light/dark contrast rule already used for the day text.
  const spiritualMonth = !spiritualMarkersEnabled
    ? null
    : isRamadan(date)
      ? 'ramadan'
      : isDhoulHijja(date)
        ? 'dhoulHijja'
        : null;

  // The cell's fill follows a strict priority (matching the `day` style
  // array below): today > selected > ovulation. Only "selected" sits on a
  // THEME-DRIVEN background (`theme.colors.primary`), so only that case
  // needs the dark-mode-aware `onPrimaryTextColor` — ovulation's background
  // is a fixed, always-dark-enough purple, so plain white always contrasts
  // regardless of the active palette/mode.
  const onColoredBg =
    isToday
      ? null
      : isSelected
        ? onPrimaryTextColor(theme)
        : !editingPeriod && kind === 'ovulation'
          ? '#FFFFFF'
          : null;

  const spiritualMarkerColor =
    onColoredBg ??
    (spiritualMonth === 'ramadan' ? RAMADAN_MARKER_COLOR : DHOUL_HIJJA_MARKER_COLOR);
  const spiritualMarkerLabel =
    spiritualMonth === 'ramadan' ? ', Ramadan' : spiritualMonth === 'dhoulHijja' ? ', Dhou al-Hijja' : '';

  const isPeriodDay = kind === 'period' && filters.rules;
  const dots: string[] = [];
  if (isPeriodDay) {dots.push(PERIOD_DOT_COLOR);}
  if (kind === 'ovulation') {dots.push(OVULATION_COLOR);}
  if (kind === 'fertile') {dots.push(FERTILE_COLOR);}
  if (flags?.mood && filters.mood) {dots.push(MOOD_DOT_COLOR);}
  // Manually-logged flow outside a computed period day (e.g. spotting) still
  // deserves a "Règles" dot — skip it when the phase already added one so a
  // single day never shows two identical pink dots.
  if (!isPeriodDay && flags?.flow && filters.rules) {dots.push(PERIOD_DOT_COLOR);}
  const hasMiscTracking = flags?.notes || flags?.symptoms || flags?.activity || flags?.sleep || flags?.hydration || flags?.intimacy;
  const miscFilterOn = filters.notes || filters.symptoms || filters.activity || filters.sleep || filters.hydration || filters.intimacy;
  if (hasMiscTracking && miscFilterOn) {dots.push(NOTES_COLOR);}
  const uniqueDots = Array.from(new Set(dots));

  return (
    <View style={styles.dayCell}>
      <Pressable
        accessibilityLabel={`${date.getDate()}, ${kind}${spiritualMarkerLabel}`}
        accessibilityRole="button"
        onPress={() => onSelectDate(date)}
        style={({pressed}) => [
          styles.day,
          // TODAY always wins over every colored background (period/fertile/
          // ovulation/selected) so the journal dots stay legible — the
          // underlying state (kind/flags) is untouched and still surfaces as
          // its own dot below, only the cell FILL is suppressed for today.
          !editingPeriod && !isToday && kind === 'period' && filters.rules && styles.periodDay,
          !editingPeriod && !isToday && kind === 'fertile' && styles.fertileDay,
          !editingPeriod && !isToday && kind === 'ovulation' && styles.ovulationDay,
          isDraftPeriod && styles.periodDay,
          isSelected && !isToday && styles.selectedDay,
          isToday && styles.todayDayBorder,
          pressed && styles.pressed,
        ]}>
        <Text
          style={[
            styles.dayText,
            // Les jours sélectionnés / ovulation sont normalement clairs —
            // mais jamais pour Aujourd'hui, qui n'a plus de fond coloré à
            // contraster.
            onColoredBg ? {color: onColoredBg} : null,
            // Aujourd'hui doit toujours rester bien visible sur son propre
            // fond neutre, dans n'importe quel thème.
            isToday && styles.todayDayText,
          ]}>
          {date.getDate()}
        </Text>
        {hijriDay ? (
          <Text
            numberOfLines={1}
            style={[styles.hijriDayText, onColoredBg ? {color: onColoredBg} : null]}>
            {hijriDay}
          </Text>
        ) : null}
        {uniqueDots.length > 0 ? (
          <View style={styles.dotRow}>
            {uniqueDots.slice(0, 3).map((color, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  // Never lighten a dot on Today — its neutral background
                  // means every category color already reads fine.
                  backgroundColorStyle(isSelected && !isToday ? onPrimaryTextColor(theme) : color),
                ]}
              />
            ))}
          </View>
        ) : null}
        {spiritualMonth ? (
          <View style={styles.spiritualMarker}>
            <MaterialDesignIcons color={spiritualMarkerColor} name="moon-waning-crescent" size={9} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function MonthCalendarCard({
  visibleMonth,
  onChangeMonth,
  displayMode,
  onChangeDisplayMode,
  basics,
  today,
  selectedDate,
  showSelection,
  onSelectDate,
  journalFlagsByDate,
  filters,
  editingPeriod,
  draftPeriodDays,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({length: offset + count}, (_, index) =>
      index < offset ? null : new Date(year, month, index - offset + 1),
    );
  }, [visibleMonth]);

  const showHijri = displayMode !== 'gregorian';
  // Read once per render rather than per cell — cheap, already-hydrated
  // global preference (same objective-agnostic flag every other religious
  // surface in the app gates on), not a live subscription: this component
  // re-renders on every navigation/filter/focus change already, which is
  // frequent enough for this flag to never stay visibly stale in practice.
  const spiritualMarkersEnabled = getSpiritualMarkersEnabled();

  const hijriRangeLabel = useMemo(() => {
    if (!showHijri) {return undefined;}
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const last = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const firstLabel = formatHijriMonthYear(first);
    const lastLabel = formatHijriMonthYear(last);
    if (!firstLabel) {return undefined;}
    if (!lastLabel || lastLabel === firstLabel) {return firstLabel;}
    return `${firstLabel} – ${lastLabel}`;
  }, [showHijri, visibleMonth]);

  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <Pressable accessibilityLabel="Mois précédent" hitSlop={12} onPress={() => onChangeMonth(-1)}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={24} />
        </Pressable>

        <View style={styles.monthTitleBlock}>
          <Text numberOfLines={1} style={styles.monthTitle}>
            {new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(visibleMonth)}
          </Text>
          {hijriRangeLabel ? (
            <Text numberOfLines={2} style={styles.hijriRange}>{hijriRangeLabel}</Text>
          ) : null}
        </View>

        <Pressable accessibilityLabel="Mois suivant" hitSlop={12} onPress={() => onChangeMonth(1)}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={24} />
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {MODES.map(mode => {
          const active = mode.key === displayMode;
          return (
            <Pressable
              accessibilityRole="button"
              key={mode.key}
              onPress={() => onChangeDisplayMode(mode.key)}
              style={({pressed}) => [styles.modeButton, active && styles.modeButtonActive, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={[styles.modeText, active && styles.modeTextActive]}>{mode.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map(day => (
          <Text key={day} numberOfLines={1} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((date, index) => (
          <DayCell
            basics={basics}
            date={date}
            filters={filters}
            editingPeriod={editingPeriod}
            draftPeriodDays={draftPeriodDays}
            flags={date ? journalFlagsByDate[dateKey(date)] : undefined}
            key={date ? date.toISOString() : `empty-${index}`}
            onSelectDate={onSelectDate}
            selectedDate={selectedDate}
            showHijri={showHijri}
            showSelection={showSelection}
            spiritualMarkersEnabled={spiritualMarkersEnabled}
            styles={styles}
            theme={theme}
            today={today}
          />
        ))}
      </View>

      <View style={styles.legendRow}>
        <LegendDot color={PERIOD_DOT_COLOR} label="Règles" styles={styles} />
        <LegendDot color={FERTILE_COLOR} label="Fertile" styles={styles} />
        <LegendDot color={OVULATION_COLOR} label="Ovulation" styles={styles} />
        <LegendDot color={MOOD_DOT_COLOR} label="Humeur" styles={styles} />
        <LegendDot color={NOTES_COLOR} label="Notes" styles={styles} />
        <LegendDot color={theme.colors.text} label="Aujourd’hui" outline styles={styles} />
        {spiritualMarkersEnabled ? (
          <>
            <LegendDot color={RAMADAN_MARKER_COLOR} icon="moon-waning-crescent" label="Ramadan" styles={styles} />
            <LegendDot color={DHOUL_HIJJA_MARKER_COLOR} icon="moon-waning-crescent" label="Dhou al-Hijja" styles={styles} />
          </>
        ) : null}
      </View>
    </View>
  );
}

function LegendDot({
  color,
  label,
  outline = false,
  icon,
  styles,
}: {
  color: string;
  label: string;
  outline?: boolean;
  icon?: IconName;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.legendItem}>
      {icon ? (
        <MaterialDesignIcons color={color} name={icon} size={11} />
      ) : outline ? (
        <View
          style={[
            styles.legendTodayRing,
            {borderColor: color},
          ]}
        />
      ) : (
        <View style={[styles.legendDot, {backgroundColor: color}]} />
      )}
      <Text numberOfLines={1} style={styles.legendText}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    monthHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    monthTitleBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 6},
    monthTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 19, fontWeight: '700', textTransform: 'capitalize'},
    hijriRange: {marginTop: 2, color: theme.colors.primary, fontSize: 10, fontWeight: '600', textAlign: 'center'},
    modeRow: {flexDirection: 'row', marginTop: 12, gap: 8, backgroundColor: theme.colors.primarySoft, borderRadius: homeRadii.button, padding: 4},
    modeButton: {flex: 1, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderRadius: homeRadii.button - 2},
    modeButtonActive: {backgroundColor: theme.colors.primary},
    modeText: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '700'},
    modeTextActive: {color: onPrimaryTextColor(theme)},
    weekRow: {flexDirection: 'row', marginTop: 14},
    weekDay: {width: '14.2857%', color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center'},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 6},
    dayCell: {width: '14.2857%', minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
    day: {width: '86%', minHeight: 40, maxWidth: 42, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 14},
    dayText: {color: theme.colors.text, fontSize: 13, fontWeight: '600'},
    hijriDayText: {color: theme.colors.textSecondary, fontSize: 8.5, marginTop: 1},
    // SEMANTIC backgrounds — never theme-driven, see file header note.
    periodDay: {backgroundColor: '#F7D7D6'},
    fertileDay: {backgroundColor: '#DCEFE0'},
    ovulationDay: {backgroundColor: OVULATION_COLOR},
    selectedDay: {backgroundColor: theme.colors.primary},
    todayDayBorder: {
      // Neutral fill — always wins over period/fertile/ovulation/selected
      // backgrounds so the dashed outline and journal dots stay legible, in
      // every theme/mode.
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1.8,
      borderStyle: 'dashed',
      borderColor: theme.colors.text,
      borderRadius: 14,
    },
    todayDayText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
      zIndex: 4,
    },
    dotRow: {flexDirection: 'row', gap: 2, marginTop: 1},
    spiritualMarker: {position: 'absolute', top: 3, right: 3},
    dot: {width: 3.5, height: 3.5, borderRadius: 2},
    legendRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
    legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
    legendDot: {width: 9, height: 9, borderRadius: 5},
    legendTodayRing: {
      width: 12,
      height: 12,
      borderWidth: 1.4,
      borderStyle: 'dashed',
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    legendText: {color: theme.colors.textSecondary, fontSize: 10.5},
    pressed: {opacity: 0.8},
  });
}

export default memo(MonthCalendarCard);
