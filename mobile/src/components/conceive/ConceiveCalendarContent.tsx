import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useJournalSheet } from '../../navigation/JournalSheetContext';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import {
  loadPersonalInformation,
  type CalendarPreference,
} from '../../state/personalInformationStore';
import {
  capitalize,
  formatFullDate,
  formatHijriDate,
  formatHijriDay,
  formatHijriMonthYear,
  cycleDayFor,
  phaseFor,
  sameDay,
  startOfDay,
  WEEK_DAYS,
} from '../../utils/cycleMath';
import {
  getCyclePreferences,
  getHasConfirmedCycleData,
  getSpiritualMarkersEnabled,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
} from '../../state/onboardingPreferences';
import {isDhoulHijja, isRamadan} from '../../utils/hijriCalendar';
import { getAllJournalEntries } from '../../state/dailyJournalStore';
import { withResolvedIntimacyForDisplayMany } from '../../services/privateJournalEncryption';
import type { DailyJournalEntry } from '../../types/journal';
import { TOP_SPACING_EXTRA } from '../../theme/spacing';
import type { CyclePhase } from '../home/CycleStatusCard';
import { usePremium } from '../../hooks/usePremium';
import { HawaPremiumBottomSheet } from '../premium/HawaPremiumBottomSheet';
import { isMonthWithinHistoryAccess } from '../../utils/historyAccess';

// Trying-to-Conceive Calendar — a dedicated content branch for the ONE
// global Calendar tab (see ObjectiveAwareCalendarScreen.tsx), structurally
// modeled after MiscarriageCalendarContent.tsx (same premium HAWA card
// language, month nav, Grégorien/Hijri/Double mode, Filtres/Légende sheets,
// selected-day card) but with TTC-specific meaning/markers/data. TTC is
// cycle-based, unlike Miscarriage — it reads the SAME onboardingPreferences
// cycle store + cycleMath.ts phaseFor()/cycleDayFor() ConceiveDashboard.tsx
// already uses, plus the generic dailyJournalStore.ts for real
// temperature/cervicalMucus/lhTest/intimacy/symptoms/note entries. Never
// pregnancy/postpartum/Nifas/miscarriage/contraception data.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const MODES: Array<{ key: CalendarPreference; label: string }> = [
  { key: 'gregorian', label: 'Grégorien' },
  { key: 'hijri', label: 'Hijri' },
  { key: 'double', label: 'Double' },
];

// SEMANTIC — TTC-specific category identity colors, fixed and never
// theme-driven (same reasoning as every sibling calendar's period/fertile/
// ovulation constants): PURPLE/PERIOD/FERTILE_COLOR/OVULATION are the exact
// TTC palette this file has always used.
const PURPLE = '#6949BE';
const PERIOD = '#DC7B82';
const PERIOD_LIGHT = '#F7D7D6';
const FERTILE_COLOR = '#8B6FD1';
const FERTILE_LIGHT = '#EEE7FA';
const OVULATION = '#4E319A';
// Same value every sibling calendar content (MenopauseCalendarContent.tsx,
// ContraceptionCalendarContent.tsx, ...) already uses for these two markers —
// never invented locally.
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

/* ============================================================
   CATEGORY META — 3 computed cycle-phase categories (Règles,
   Fenêtre fertile, Ovulation — from cycleMath.ts, the same logic
   ConceiveDashboard.tsx already uses) plus the 4 real journal
   categories (dailyJournalStore.ts) that have their own dedicated
   TTC Journal entry (Température basale/Glaire cervicale/Test LH/
   Rapports). The TTC Journal's 5th category, "Évolution du cycle",
   is deliberately represented ONLY through the 3 computed
   cycle-phase categories above (+ the existing "Jour du
   cycle"/"Statut de fertilité" status row) rather than as its own
   marker — it has no independent calendar meaning of its own. The
   ONLY categories this calendar ever displays — no pregnancy/
   postpartum/Nifas/miscarriage/contraception content, and no
   generic Symptômes/Notes marker (not part of the TTC Journal).
============================================================ */

type PhaseCategory = 'menstruation' | 'fertile' | 'ovulation';
type JournalCategory = 'temperature' | 'cervicalMucus' | 'lhTest' | 'intimacy';
type ConceiveCategory = PhaseCategory | JournalCategory;

const CATEGORY_META: Record<
  ConceiveCategory,
  { label: string; description: string; icon: IconName; color: string }
> = {
  menstruation: {
    label: 'Règles',
    description: 'Jours de règles, calculés à partir de ton cycle.',
    icon: 'water',
    color: PERIOD,
  },
  fertile: {
    label: 'Fenêtre fertile',
    description: 'Période la plus propice à la conception.',
    icon: 'leaf',
    color: FERTILE_COLOR,
  },
  ovulation: {
    label: 'Ovulation estimée',
    description: 'Jour d’ovulation estimé pour ce cycle.',
    icon: 'egg-outline',
    color: OVULATION,
  },
  temperature: {
    label: 'Température basale',
    description: 'Température enregistrée dans ton journal.',
    icon: 'thermometer',
    color: PURPLE,
  },
  cervicalMucus: {
    label: 'Glaire cervicale',
    description: 'Observation de ta glaire cervicale.',
    icon: 'water-outline',
    color: '#3E8E56',
  },
  lhTest: {
    label: 'Test LH',
    description: 'Un repère « LH+ » apparaît sur le calendrier pour un test positif. Tous tes résultats restent visibles dans le détail du jour.',
    icon: 'test-tube',
    color: '#B23F63',
  },
  intimacy: {
    label: 'Rapports',
    description: 'Rapport enregistré dans ton journal, de façon privée.',
    icon: 'heart-outline',
    color: '#B23F63',
  },
};

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as ConceiveCategory[];
const JOURNAL_CATEGORY_KEYS: JournalCategory[] = [
  'temperature',
  'cervicalMucus',
  'lhTest',
  'intimacy',
];

const PHASE_LABEL: Record<CyclePhase, string> = {
  menstruation: 'Règles',
  follicular: 'Phase folliculaire',
  fertile: 'Fenêtre fertile',
  ovulation: 'Ovulation',
  luteal: 'Phase lutéale',
  pregnancy: 'Grossesse',
  postpartum: 'Post-partum',
};

const MUCUS_LABEL: Record<string, string> = {
  dry: 'Sèche',
  sticky: 'Collante',
  creamy: 'Crémeuse',
  watery: 'Aqueuse',
  eggWhite: 'Claire et élastique',
};

const LH_LABEL: Record<string, string> = {
  negative: 'Négatif',
  positive: 'Positif',
  invalid: 'Non valide',
};

const dateKey = (date: Date): string => date.toLocaleDateString('en-CA');
const backgroundColorStyle = (backgroundColor: string) => ({ backgroundColor });

/* ============================================================
   MONTH-GRID MARKERS — presence-only, used for the small dots (and
   the LH+ text marker) drawn on each day cell. LH deliberately only
   marks POSITIVE results here so the month view isn't cluttered with
   every negative test — negative/invalid results stay fully visible
   in the selected-day detail below instead (spec section 8/16).
============================================================ */

function journalMarkersPresent(entry: DailyJournalEntry | undefined): JournalCategory[] {
  if (!entry) {
    return [];
  }
  return JOURNAL_CATEGORY_KEYS.filter(key => {
    if (key === 'lhTest') {
      return entry.lhTest?.result === 'positive';
    }
    if (key === 'intimacy') {
      return entry.intimacy?.answer === 'yes';
    }
    return Boolean(entry[key]);
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function ConceiveCalendarContent(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { open: openJournal } = useJournalSheet();

  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const { isPremium } = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  // "Historique illimité" — going backward is the only direction that can
  // leave the FREE history window; forward navigation is never restricted.
  // Tapping a locked previous month opens the existing Premium sheet
  // instead of silently doing nothing — see historyAccess.ts.
  const goToPreviousMonth = useCallback(() => {
    setVisibleMonth(current => {
      const target = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      if (!isMonthWithinHistoryAccess(target, isPremium)) {
        setPremiumVisible(true);
        return current;
      }
      return target;
    });
  }, [isPremium]);

  const goToNextMonth = useCallback(() => {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }, []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayMode, setDisplayMode] = useState<CalendarPreference>('double');
  const [sheet, setSheet] = useState<'filters' | 'legend' | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<Set<ConceiveCategory>>(
    () => new Set(CATEGORY_KEYS),
  );

  // Same cycle store CycleHomeScreen/ConceiveDashboard already read — TTC
  // has no separate cycle store of its own.
  const [cyclePrefs, setCyclePrefs] = useState(getCyclePreferences);
  const [hasConfirmedCycleData, setHasConfirmedCycleData] = useState(getHasConfirmedCycleData);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabled] = useState(getSpiritualMarkersEnabled);
  useEffect(() => {
    let active = true;
    hydrateCyclePreferences().then(value => {
      if (active) {
        setCyclePrefs(value);
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    const unsubscribe = subscribeCyclePreferences(() => {
      if (active) {
        setCyclePrefs(getCyclePreferences());
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Real journal data (dailyJournalStore.ts) — pulled once and indexed by
  // date client-side, same approach ConceiveDashboard.tsx already uses.
  const [entriesByDate, setEntriesByDate] = useState<Record<string, DailyJournalEntry>>({});
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllJournalEntries()
        .then(withResolvedIntimacyForDisplayMany)
        .then(entries => {
          if (!active) {
            return;
          }
          const byDate: Record<string, DailyJournalEntry> = {};
          entries.forEach(entry => {
            byDate[entry.date] = entry;
          });
          setEntriesByDate(byDate);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  // Same shared Grégorien/Hijri/Double preference every other objective's
  // calendar already reads.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadPersonalInformation().then(info => {
        if (mounted) {
          setDisplayMode(info.calendar);
        }
      });
      setSpiritualMarkersEnabled(getSpiritualMarkersEnabled());
      return () => {
        mounted = false;
      };
    }, []),
  );

  const phaseForDate = useCallback(
    (date: Date): CyclePhase => phaseFor(date, cyclePrefs),
    [cyclePrefs],
  );

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from(
        { length: count },
        (_, index) => new Date(year, month, index + 1),
      ),
    ];
  }, [visibleMonth]);

  const monthTitle = capitalize(
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
      visibleMonth,
    ),
  );
  const showHijri = displayMode !== 'gregorian';
  const selectedTitle = capitalize(
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(selectedDate),
  );
  const selectedKey = dateKey(selectedDate);
  const selectedEntry = entriesByDate[selectedKey];
  const isTodaySelected = sameDay(selectedDate, today);
  const selectedPhase = phaseForDate(selectedDate);
  const selectedCycleDay = cycleDayFor(selectedDate, cyclePrefs);

  const toggleFilter = (key: ConceiveCategory) => {
    setVisibleFilters(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // TTC fields (Température basale/Glaire cervicale/Test LH/Rapports) are
  // ALWAYS shown for the selected day — real value when present, an honest
  // "Non renseigné" otherwise — gated only by which filters are active, so
  // turning a filter off hides that row consistently with the month-grid
  // marker it controls. Never a fabricated value: absence is spelled out,
  // not invented.
  const ttcFields = useMemo(() => {
    const fields: Array<{ key: JournalCategory; icon: IconName; label: string; value: string }> = [];
    if (visibleFilters.has('temperature')) {
      fields.push({
        key: 'temperature',
        icon: CATEGORY_META.temperature.icon,
        label: CATEGORY_META.temperature.label,
        value: selectedEntry?.temperature
          ? selectedEntry.temperature.time
            ? `${selectedEntry.temperature.value}°${selectedEntry.temperature.unit} · ${selectedEntry.temperature.time}`
            : `${selectedEntry.temperature.value}°${selectedEntry.temperature.unit}`
          : 'Non renseigné',
      });
    }
    if (visibleFilters.has('cervicalMucus')) {
      fields.push({
        key: 'cervicalMucus',
        icon: CATEGORY_META.cervicalMucus.icon,
        label: CATEGORY_META.cervicalMucus.label,
        value: selectedEntry?.cervicalMucus
          ? MUCUS_LABEL[selectedEntry.cervicalMucus.type] ?? selectedEntry.cervicalMucus.type
          : 'Non renseignée',
      });
    }
    if (visibleFilters.has('lhTest')) {
      fields.push({
        key: 'lhTest',
        icon: CATEGORY_META.lhTest.icon,
        label: CATEGORY_META.lhTest.label,
        value: selectedEntry?.lhTest
          ? LH_LABEL[selectedEntry.lhTest.result] ?? selectedEntry.lhTest.result
          : 'Non renseigné',
      });
    }
    if (visibleFilters.has('intimacy')) {
      fields.push({
        key: 'intimacy',
        icon: CATEGORY_META.intimacy.icon,
        label: CATEGORY_META.intimacy.label,
        // Presence only — never the protection/libido/discomfort detail,
        // respecting the same private-content boundary the rest of the app
        // already uses for intimacy data.
        value: selectedEntry?.intimacy?.answer === 'yes' ? 'Enregistré' : 'Non renseigné',
      });
    }
    return fields;
  }, [selectedEntry, visibleFilters]);

  // "Évolution du cycle" has no marker/row of its own here — it's
  // represented by the always-visible "Jour du cycle"/"Statut de
  // fertilité" status row above plus the Règles/Fenêtre fertile/Ovulation
  // estimée markers on the grid, per the TTC calendar's category mapping.
  const detailRows = ttcFields;

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
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
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 30 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Calendrier</Text>
              <Text style={styles.subtitle}>
                Ton cycle et ta fertilité, en un coup d’œil
              </Text>
            </View>

            <HeaderAction
              icon="tune-variant"
              label="Filtres"
              onPress={() => setSheet('filters')}
            />
            <HeaderAction
              icon="format-list-bulleted"
              label="Légende"
              onPress={() => setSheet('legend')}
            />
          </View>

          {/* CALENDAR CARD */}
          <View style={styles.calendarCard}>
            <View style={styles.modeRow}>
              {MODES.map(mode => (
                <Pressable
                  accessibilityRole="button"
                  key={mode.key}
                  onPress={() => setDisplayMode(mode.key)}
                  style={[
                    styles.modeButton,
                    displayMode === mode.key && styles.modeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      displayMode === mode.key && styles.modeTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel="Mois précédent"
                onPress={goToPreviousMonth}
                style={styles.arrowButton}
              >
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-left"
                  size={23}
                />
              </Pressable>

              <View style={styles.monthCopy}>
                <Text style={styles.monthTitle}>{monthTitle}</Text>
                {showHijri ? (
                  <Text style={styles.hijriMonth}>
                    {formatHijriMonthYear(visibleMonth)}
                  </Text>
                ) : null}
              </View>

              <Pressable
                accessibilityLabel="Mois suivant"
                onPress={goToNextMonth}
                style={styles.arrowButton}
              >
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chevron-right"
                  size={23}
                />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const selected = sameDay(date, selectedDate);
                const isToday = sameDay(date, today);
                // Menstruation/fertile/ovulation are all derived from
                // cyclePrefs via phaseForDate() — until real cycle data is
                // confirmed that's the app's internal fallback, not a real
                // prediction, so none of these markers may render (see
                // getHasConfirmedCycleData()'s doc comment). Real journal
                // category dots (`markers` below) are unaffected — they
                // reflect genuine logged entries, independent of the
                // cycle baseline.
                const phase = hasConfirmedCycleData ? phaseForDate(date) : null;
                const isMenstruationDay =
                  phase === 'menstruation' && visibleFilters.has('menstruation');
                const isFertileDay =
                  (phase === 'fertile' || phase === 'ovulation') &&
                  visibleFilters.has('fertile');
                const isOvulationDay =
                  phase === 'ovulation' && visibleFilters.has('ovulation');
                const dayEntry = entriesByDate[dateKey(date)];
                const markers = journalMarkersPresent(dayEntry).filter(key =>
                  visibleFilters.has(key),
                );
                // Light text is ONLY for the strong-purple selected fill.
                // Event-day cells (menstruation/fertile) use a light
                // pink/lavender background, so their number must stay dark.
                // Never whiten text/markers on Today — it has no colored
                // background left to contrast against (see styles.todayDay),
                // so every category color must render at full, real value.
                const lightText = selected && !isToday;

                // Visible regardless of displayMode — reuses the exact
                // canonical per-date Hijri helpers (see MonthCalendarCard.tsx,
                // no new conversion logic). Independent corner channel from
                // the ovulation badge (opposite corner) and the marker dots.
                const spiritualMonth = !spiritualMarkersEnabled
                  ? null
                  : isRamadan(date)
                    ? 'ramadan'
                    : isDhoulHijja(date)
                      ? 'dhoulHijja'
                      : null;
                const spiritualMarkerColor = lightText
                  ? onPrimaryTextColor(theme)
                  : spiritualMonth === 'ramadan'
                    ? RAMADAN_MARKER_COLOR
                    : DHOUL_HIJJA_MARKER_COLOR;
                const spiritualMarkerLabel =
                  spiritualMonth === 'ramadan'
                    ? ', Ramadan'
                    : spiritualMonth === 'dhoulHijja'
                      ? ', Dhou al-Hijja'
                      : '';

                return (
                  <View key={date.toISOString()} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`${date.getDate()} ${monthTitle}${
                        isMenstruationDay ? ', règles' : ''
                      }${isFertileDay ? ', fenêtre fertile' : ''}${
                        isOvulationDay ? ', ovulation estimée' : ''
                      }${spiritualMarkerLabel}`}
                      onPress={() => setSelectedDate(date)}
                      style={[
                        styles.dayButton,
                        // TODAY always wins over every colored background —
                        // its neutral fill (styles.todayDay) must never be
                        // covered by menstruation/fertile/selected tints, so
                        // the dashed outline and journal markers stay legible.
                        isMenstruationDay && !selected && !isToday && styles.menstruationDay,
                        isFertileDay && !selected && !isToday && styles.fertileDay,
                        selected && !isToday && styles.selectedDay,
                        isToday && styles.todayDay,
                      ]}
                    >
                      {isOvulationDay ? (
                        // A small corner icon, not a border ring — a border
                        // would silently lose to the today-dashed-border
                        // style when a day is both today and ovulation,
                        // hiding the ovulation indicator (spec section 15/16
                        // explicitly require overlapping states to never
                        // erase one another).
                        <View pointerEvents="none" style={styles.ovulationBadge}>
                          <MaterialDesignIcons
                            color={lightText ? onPrimaryTextColor(theme) : OVULATION}
                            name="star-four-points"
                            size={9}
                          />
                        </View>
                      ) : null}

                      {spiritualMonth ? (
                        <View pointerEvents="none" style={styles.spiritualMarkerBadge}>
                          <MaterialDesignIcons
                            color={spiritualMarkerColor}
                            name="moon-waning-crescent"
                            size={9}
                          />
                        </View>
                      ) : null}

                      <Text
                        style={[
                          styles.dayText,
                          lightText && styles.lightText,
                          // Today keeps its bold dark-violet treatment even
                          // when also selected — it no longer has a colored
                          // fill to contrast against (see `lightText` above).
                          isToday && styles.todayDayText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>

                      {showHijri ? (
                        <Text
                          style={[
                            styles.hijriDay,
                            lightText && styles.lightText,
                            isToday && styles.todayHijriText,
                          ]}
                        >
                          {formatHijriDay(date)}
                        </Text>
                      ) : null}

                      {markers.length > 0 ? (
                        <View style={styles.markerRow}>
                          {markers.slice(0, 4).map(key =>
                            key === 'lhTest' ? (
                              // Compact "LH+" text for a positive test —
                              // negative/invalid tests never reach this list
                              // (see journalMarkersPresent), so this marker
                              // only ever means a positive result.
                              <Text
                                key={key}
                                style={[styles.lhMarker, lightText && styles.lightText]}
                              >
                                LH+
                              </Text>
                            ) : (
                              <View
                                key={key}
                                style={[
                                  styles.marker,
                                  backgroundColorStyle(
                                    lightText
                                      ? onPrimaryTextColor(theme)
                                      : CATEGORY_META[key].color,
                                  ),
                                ]}
                              />
                            ),
                          )}
                        </View>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* INLINE LEGEND */}
            <View style={styles.inlineLegend}>
              {CATEGORY_KEYS.map(key => (
                <View key={key} style={styles.inlineLegendItem}>
                  <View
                    style={[
                      styles.inlineLegendDot,
                      backgroundColorStyle(CATEGORY_META[key].color),
                    ]}
                  />
                  <Text style={styles.inlineLegendText}>
                    {CATEGORY_META[key].label}
                  </Text>
                </View>
              ))}
              <View style={styles.inlineLegendItem}>
                <View style={styles.inlineTodayIndicator} />
                <Text style={styles.inlineLegendText}>Aujourd’hui</Text>
              </View>
              {spiritualMarkersEnabled ? (
                <>
                  <View style={styles.inlineLegendItem}>
                    <MaterialDesignIcons color={RAMADAN_MARKER_COLOR} name="moon-waning-crescent" size={11} />
                    <Text style={[styles.inlineLegendText, styles.inlineLegendTextWithIcon]}>Ramadan</Text>
                  </View>
                  <View style={styles.inlineLegendItem}>
                    <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={11} />
                    <Text style={[styles.inlineLegendText, styles.inlineLegendTextWithIcon]}>Dhou al-Hijja</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* SELECTED CARD */}
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="calendar-check-outline"
                  size={21}
                />
              </View>
              <View style={styles.flexCopy}>
                <Text style={styles.selectedTitle}>{selectedTitle}</Text>
                <Text style={styles.selectedDate}>
                  {formatFullDate(selectedDate)}
                  {showHijri ? ` · ${formatHijriDate(selectedDate) ?? ''}` : ''}
                </Text>
              </View>
            </View>

            {/* CONTEXTUAL STATUS — cycle day + fertility status are always
                computable (never "missing"), unlike journal-logged items,
                but ONLY once real cycle data is confirmed — otherwise this
                would present the internal fallback (28-day cycle, "5 days
                ago" last period) as personalized fact. */}
            {hasConfirmedCycleData ? (
              <View style={styles.statusGrid}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusInfoLabel}>Jour du cycle</Text>
                  <Text style={styles.statusInfoValue}>
                    Jour {selectedCycleDay}
                  </Text>
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusInfoLabel}>Statut de fertilité</Text>
                  <Text style={styles.statusInfoValue}>
                    {PHASE_LABEL[selectedPhase]}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="calendar-alert-outline"
                  size={19}
                />
                <Text style={styles.emptyText}>
                  Configure ton cycle pour voir ton jour du cycle et ta fenêtre fertile.
                </Text>
                <Pressable
                  accessibilityLabel="Configurer mon cycle"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('CycleInformation', { fromDashboardCTA: true })}
                  style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                >
                  <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="calendar-edit" size={16} />
                  <Text style={styles.addButtonText}>Configurer mon cycle</Text>
                </Pressable>
              </View>
            )}

            {/* TTC FIELDS — Température basale/Glaire cervicale/Test LH/
                Rapports always render (real value or "Non renseigné"),
                gated only by their filter. */}
            {detailRows.length > 0 ? (
              <View style={styles.dailyInfoGrid}>
                {detailRows.map(item => (
                  <View key={item.key} style={styles.dailyInfoItem}>
                    <View style={styles.dailyInfoIcon}>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name={item.icon}
                        size={19}
                      />
                    </View>
                    <View style={styles.flexCopy}>
                      <Text style={styles.dailyInfoLabel}>{item.label}</Text>
                      <Text numberOfLines={2} style={styles.dailyInfoValue}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="information-outline"
                  size={19}
                />
                <Text style={styles.emptyText}>
                  Active au moins un filtre pour voir le suivi de cette
                  journée.
                </Text>
              </View>
            )}

            {isTodaySelected ? (
              <Pressable
                accessibilityLabel="Ajouter au journal"
                accessibilityRole="button"
                onPress={openJournal}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="plus" size={16} />
                <Text style={styles.addButtonText}>Ajouter au journal</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {/* SHEET */}
        <ConceiveCalendarSheet
          mode={sheet}
          onClose={() => setSheet(null)}
          onToggle={toggleFilter}
          showHijri={showHijri}
          showSpiritualMarkers={spiritualMarkersEnabled}
          today={today}
          visibleFilters={visibleFilters}
        />

        <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
   HEADER ACTION
============================================================ */

function HeaderAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
    >
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      <Text style={styles.headerActionLabel}>{label}</Text>
    </Pressable>
  );
}

/* ============================================================
   CALENDAR SHEET — Filtres / Légende, same premium bottom-sheet
   pattern as the other objectives' calendars. The Légende sheet's
   footer ("Fermer") stays flexShrink:0 below a scrollable list, so
   it can never be hidden behind the Android nav bar/tab bar.
============================================================ */

function ConceiveCalendarSheet({
  mode,
  onClose,
  onToggle,
  visibleFilters,
  today,
  showHijri,
  showSpiritualMarkers,
}: {
  mode: 'filters' | 'legend' | null;
  onClose: () => void;
  onToggle: (key: ConceiveCategory) => void;
  visibleFilters: Set<ConceiveCategory>;
  today: Date;
  showHijri: boolean;
  showSpiritualMarkers: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={mode !== null}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={styles.backdrop}
        />

        {mode === 'legend' ? (
          <View
            style={[
              styles.sheet,
              styles.legendSheet,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <View style={styles.handle} />

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.legendScrollContent}
              showsVerticalScrollIndicator={false}
              style={styles.legendScroll}
            >
              <View style={styles.legendSheetHeader}>
                <Text style={styles.legendSheetTitle}>
                  Légende du calendrier
                </Text>
                <Text style={styles.legendSheetSubtitle}>
                  Comprendre les couleurs et repères utilisés.
                </Text>
              </View>

              <View style={styles.legendRows}>
                {CATEGORY_KEYS.map((key, index) => {
                  const meta = CATEGORY_META[key];
                  return (
                    <View
                      key={key}
                      style={[
                        styles.legendRow,
                        index === CATEGORY_KEYS.length - 1 &&
                          !showSpiritualMarkers &&
                          styles.legendRowLast,
                      ]}
                    >
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
                          name={meta.icon}
                          size={27}
                        />
                      </View>
                      <View
                        style={[
                          styles.legendDotLarge,
                          backgroundColorStyle(meta.color),
                        ]}
                      />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>{meta.label}</Text>
                        <Text style={styles.legendRowText}>
                          {meta.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {showSpiritualMarkers ? (
                  <>
                    <View style={styles.legendRow}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons color={RAMADAN_MARKER_COLOR} name="moon-waning-crescent" size={27} />
                      </View>
                      <View style={[styles.legendDotLarge, backgroundColorStyle(RAMADAN_MARKER_COLOR)]} />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>Ramadan</Text>
                        <Text style={styles.legendRowText}>Ce jour se situe dans le mois du Ramadan (jeûne).</Text>
                      </View>
                    </View>
                    <View style={[styles.legendRow, styles.legendRowLast]}>
                      <View style={styles.legendLargeIcon}>
                        <MaterialDesignIcons color={DHOUL_HIJJA_MARKER_COLOR} name="moon-waning-crescent" size={27} />
                      </View>
                      <View style={[styles.legendDotLarge, backgroundColorStyle(DHOUL_HIJJA_MARKER_COLOR)]} />
                      <View style={styles.legendRowCopy}>
                        <Text style={styles.legendRowTitle}>Dhou al-Hijja</Text>
                        <Text style={styles.legendRowText}>Ce jour se situe dans le mois de Dhou al-Hijja.</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.todayLegend}>
                <View style={styles.todayLegendPreview}>
                  <Text style={styles.todayLegendDay}>{today.getDate()}</Text>
                  {showHijri ? (
                    <Text style={styles.todayLegendHijri}>
                      {formatHijriDay(today)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.todayCopy}>
                  <Text style={styles.todayTitle}>Aujourd’hui</Text>
                  <Text style={styles.todayText}>
                    Le contour noir en pointillés indique la date d’aujourd’hui.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.legendFooter}>
              <Pressable
                accessibilityLabel="Fermer la légende"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeLegendButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeLegendText}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        ) : mode === 'filters' ? (
          <View
            style={[
              styles.sheet,
              styles.filterSheet,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filtres du calendrier</Text>
              <Text style={styles.filterSheetSubtitle}>
                Choisis les informations à afficher sur ton calendrier.
              </Text>
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.filterRows}
              showsVerticalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {CATEGORY_KEYS.map((key, index) => {
                const meta = CATEGORY_META[key];
                const active = visibleFilters.has(key);
                return (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: active }}
                    key={key}
                    onPress={() => onToggle(key)}
                    style={[
                      styles.filterRow,
                      index === CATEGORY_KEYS.length - 1 &&
                        styles.filterRowLast,
                    ]}
                  >
                    <View style={styles.filterIcon}>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name={meta.icon}
                        size={24}
                      />
                    </View>
                    <View style={styles.filterCopy}>
                      <Text style={styles.filterTitle}>{meta.label}</Text>
                      <Text style={styles.filterDescription}>
                        {meta.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.switchTrack,
                        active && styles.switchTrackActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.switchThumb,
                          active && styles.switchThumbActive,
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.filterFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.doneButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doneText}>Terminé</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: { flex: 1, backgroundColor: theme.colors.background },
  pageBackgroundDecor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },
  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: withAlpha(theme.colors.primary, 0.045),
  },
  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: withAlpha(theme.colors.primary, 0.05),
  },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: TOP_SPACING_EXTRA },
  flexCopy: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },

  /* HEADER */
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 10.5 },
  headerAction: {
    ...theme.shadow,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
  },
  headerActionLabel: {
    marginTop: 2,
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '800',
  },

  /* CALENDAR */
  calendarCard: {
    ...theme.shadow,
    padding: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 23,
    backgroundColor: theme.colors.surface,
  },
  modeRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  modeButtonActive: { backgroundColor: theme.colors.primary },
  modeText: {
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  modeTextActive: { color: onPrimaryTextColor(theme) },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 11,
  },
  arrowButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  monthCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  monthTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },
  hijriMonth: { marginTop: 1, color: theme.colors.textSecondary, fontSize: 9 },

  weekRow: { flexDirection: 'row' },
  weekDay: {
    width: '14.2857%',
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: '88%',
    height: '91%',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  selectedDay: { backgroundColor: theme.colors.primary },
  todayDay: {
    // Neutral fill — always wins over menstruation/fertile/selected
    // backgrounds so the dashed outline and journal markers stay legible.
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1.7,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: 13,
  },
  menstruationDay: { backgroundColor: PERIOD_LIGHT },
  fertileDay: { backgroundColor: FERTILE_LIGHT },
  // Corner icon, not a border — see the inline comment at its usage for why
  // a border-based ovulation marker would conflict with todayDay's border.
  ovulationBadge: { position: 'absolute', top: 2, right: 2 },
  // Opposite corner from ovulationBadge so both can appear on the same day
  // without overlapping — independent channel from the marker dots below.
  spiritualMarkerBadge: { position: 'absolute', top: 2, left: 2 },
  dayText: { color: theme.colors.accent, fontSize: 12, fontWeight: '700' },
  lightText: { color: onPrimaryTextColor(theme) },
  // Wins over `lightText`/any background tint whenever a day is today —
  // today's number must always stay readable, regardless of selection or
  // event-day overlap (same rule MonthCalendarCard.tsx already applies).
  todayDayText: { color: theme.colors.text, fontWeight: '800', zIndex: 4 },
  hijriDay: { marginTop: 1, color: theme.colors.textSecondary, fontSize: 7 },
  todayHijriText: { color: theme.colors.text },

  markerRow: { position: 'absolute', bottom: 3, flexDirection: 'row', alignItems: 'center', gap: 2 },
  marker: { width: 3.5, height: 3.5, borderRadius: 2 },
  lhMarker: { color: '#B23F63', fontSize: 6, lineHeight: 7, fontWeight: '800' },

  /* INLINE LEGEND */
  inlineLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.10),
  },
  inlineLegendItem: { flexDirection: 'row', alignItems: 'center' },
  inlineLegendDot: { width: 7, height: 7, marginRight: 4, borderRadius: 4 },
  inlineTodayIndicator: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: 5,
  },
  inlineLegendText: {
    color: theme.colors.textSecondary,
    fontSize: 8.5,
    fontWeight: '600',
  },
  inlineLegendTextWithIcon: { marginLeft: 4 },

  /* SELECTED CARD */
  selectedCard: {
    ...theme.shadow,
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  selectedIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
  },
  selectedTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },
  selectedDate: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 10 },

  statusGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusInfo: {
    flex: 1,
    minWidth: 0,
    padding: 11,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  statusInfoLabel: { color: theme.colors.textSecondary, fontSize: 9.5 },
  statusInfoValue: {
    marginTop: 4,
    color: theme.colors.primary,
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* DAILY INFO */
  dailyInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dailyInfoItem: {
    width: '100%',
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },
  dailyInfoIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyInfoLabel: {
    color: theme.colors.accent,
    fontSize: 10.5,
    fontWeight: '800',
  },
  dailyInfoValue: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 13,
  },

  emptyBox: {
    alignItems: 'center',
    marginTop: 14,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  emptyText: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
  },
  addButtonText: { color: onPrimaryTextColor(theme), fontSize: 12.5, fontWeight: '800' },

  /* MODAL */
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  // Fixed modal scrim — never themed, same precedent as every migrated screen.
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35,22,65,0.34)',
  },
  sheet: {
    maxHeight: '90%',
    paddingTop: 9,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  handle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    flexShrink: 0,
    borderRadius: 3,
    backgroundColor: withAlpha(theme.colors.primary, 0.30),
  },

  /* FILTER SHEET */
  filterSheet: { height: '88%' },
  filterScroll: { flex: 1, minHeight: 0 },
  filterSheetHeader: {
    flexShrink: 0,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 22,
  },
  filterSheetTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  filterSheetSubtitle: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  filterRows: { paddingHorizontal: 22, paddingBottom: 10 },
  filterRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  filterRowLast: { borderBottomWidth: 0 },
  filterIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
  },
  filterCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  filterTitle: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  filterDescription: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },
  switchTrack: {
    width: 42,
    height: 24,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  switchTrackActive: { backgroundColor: theme.colors.primary },
  switchThumb: {
    ...theme.shadow,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  switchThumbActive: { alignSelf: 'flex-end' },
  filterFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.10),
    backgroundColor: theme.colors.surface,
  },
  doneButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
  },
  doneText: { color: onPrimaryTextColor(theme), fontSize: 14, fontWeight: '800' },

  /* LEGEND SHEET */
  legendSheet: { height: '88%', paddingHorizontal: 0 },
  legendScroll: { flex: 1, minHeight: 0 },
  legendScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 16,
  },
  legendSheetHeader: { marginTop: 18 },
  legendSheetTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  legendSheetSubtitle: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  legendRows: { marginTop: 16 },
  legendRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  legendRowLast: { borderBottomWidth: 0 },
  legendLargeIcon: {
    width: 54,
    height: 54,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
  },
  legendDotLarge: {
    width: 11,
    height: 11,
    flexShrink: 0,
    marginLeft: 16,
    borderRadius: 6,
  },
  legendRowCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  legendRowTitle: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  legendRowText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  todayLegend: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  todayLegendPreview: {
    width: 52,
    height: 58,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.8,
    borderColor: theme.colors.text,
    borderStyle: 'dashed',
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },
  todayLegendDay: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  todayLegendHijri: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  todayCopy: { flex: 1, minWidth: 0 },
  todayTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  todayText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  legendFooter: {
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.10),
    backgroundColor: theme.colors.surface,
  },
  closeLegendButton: {
    width: '100%',
    height: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5,
  },
  closeLegendText: { color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800' },
  });
}

export default ConceiveCalendarContent;
