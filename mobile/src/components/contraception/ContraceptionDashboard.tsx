import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {MainTabScreenProps} from '../../navigation/MainTabNavigator';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getFloatingTabBarClearance} from '../../theme/spacing';

import HomeHeader from '../home/HomeHeader';
import QuickActionsGrid, {
  type QuickActionItem,
} from '../home/QuickActionsGrid';
import SpiritualGuidanceCard from '../home/SpiritualGuidanceCard';
import ObjectiveArticlesSection from '../home/ObjectiveArticlesSection';
import {AnimatedProgressRing} from '../home/AnimatedProgressRing';

import {
  getFirstName,
  getSelectedLocation,
  getSpiritualMarkersEnabled,
  hydrateSelectedLocation,
  subscribeSelectedLocation,
} from '../../state/onboardingPreferences';

import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  subscribeContraceptionPreferences,
} from '../../state/contraceptionPreferences';

import {
  deleteContraceptionIntakeRecord,
  getAllContraceptionIntakeRecords,
  getContraceptionIntakeRecord,
  getRecentContraceptionIntakeRecords,
  hydrateContraceptionIntakeHistory,
  setContraceptionIntakeStatus,
  subscribeContraceptionIntakeHistory,
  type ContraceptionIntakeRecord,
  type ContraceptionIntakeStatus,
} from '../../state/contraceptionIntakeHistoryStore';

import {
  deleteContraceptionEvent,
  getAllContraceptionEvents,
  getContraceptionEventsForDate,
  getRecentContraceptionEvents,
  hydrateContraceptionEvents,
  subscribeContraceptionEvents,
  type ContraceptionEvent,
} from '../../state/contraceptionEventStore';

import {
  CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL,
  CONTRACEPTION_DEFAULT_REMINDER_CONTENT,
  CONTRACEPTION_EVENT_ICONS,
  CONTRACEPTION_EVENT_LABELS,
  CONTRACEPTION_HERO_ACTION_LABELS,
  CONTRACEPTION_INTAKE_ACTION_LABEL,
  CONTRACEPTION_INTAKE_STATUS_LABELS,
  CONTRACEPTION_METHOD_EVENT_TYPES,
  CONTRACEPTION_METHOD_ICONS,
  CONTRACEPTION_METHOD_LABELS,
  CONTRACEPTION_REMINDER_CONTENT,
  getContraceptionEventSummaryLabel,
  isContraceptionEventForMethod,
  isContraceptionIntakeRecordForMethod,
} from '../../config/contraceptionLabels';

import {getPillPackDay} from '../../utils/contraceptionMath';
import {usePremium} from '../../hooks/usePremium';
import {HawaPremiumBottomSheet} from '../premium/HawaPremiumBottomSheet';
import {filterRecordsForHistoryAccess} from '../../utils/historyAccess';

import {
  getContraceptionJournalEntry,
  hydrateContraceptionJournal,
  subscribeContraceptionJournal,
} from '../../state/contraceptionJournalStore';

import {useContraceptionSpiritualStatus} from '../../hooks/usePrayerPurityStatus';

import {
  formatFullDate,
  formatHijriDate,
} from '../../utils/cycleMath';

// PHASE D2 — PURPLE/PURPLE_DARK/PURPLE_SOFT/BORDER_STRONG/MUTED/CARD_BACKGROUND
// used to be fixed literals here; they are now derived from useAwaTheme() at
// the top of ContraceptionDashboard() (and re-derived identically inside
// createStyles(theme)) so every decorative-purple usage in this file follows
// the resolved global theme. Only ONE usage (HeroIntakeActionButton's
// unselected label, styles.heroActionText) keeps a hardcoded dark-purple
// literal instead — see that style's own comment for why.

const SUCCESS = '#42A66A';
const SUCCESS_SOFT = '#EDF8F1';

const DANGER = '#D96176';
const DANGER_SOFT = '#FFF0F3';

// Same hex as ContraceptionJournalEntryScreen.tsx's local ORANGE — the
// 'late' status's color everywhere it appears, so it never drifts between
// where it's set (Journal) and where it's displayed (here).
const WARNING = '#C77B2E';
const WARNING_SOFT = '#FFF0E3';

// Dashboard hero's 3-way intake quick actions — one shared color pair per
// status, reusing the exact SUCCESS/WARNING/DANGER tokens already used
// elsewhere in this file (LIGNE 1's icon, PillPackProgressRing's status
// display) so "taken"/"late"/"missed" never disagree on color between the
// hero and the rest of the Dashboard.
const HERO_ACTION_COLORS: Record<ContraceptionIntakeStatus, {color: string; soft: string}> = {
  taken: {color: SUCCESS, soft: SUCCESS_SOFT},
  late: {color: WARNING, soft: WARNING_SOFT},
  missed: {color: DANGER, soft: DANGER_SOFT},
};

const CONTRACEPTION_CAPSULE_IMAGE = require('../../assets/images/contraception/contraception-capsule.png');
const CONTRACEPTION_PILL_PACK_IMAGE = require('../../assets/images/contraception/contraception-pill-pack.png');

type Props = MainTabScreenProps<'CycleHome'>;

type HistoryDay = {
  dateKey: string;
  weekday: string;
  dayNumber: string;
  isToday: boolean;
  record: ContraceptionIntakeRecord | undefined;
};

const todayKey = (): string =>
  new Date().toLocaleDateString('en-CA');

const formatRecordTime = (
  recordedAt: string,
): string => {
  const parsed = new Date(recordedAt);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
};

const formatRecordDate = (
  dateKey: string,
): string => {
  const parsed = new Date(
    `${dateKey}T12:00:00`,
  );

  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }

  return formatFullDate(parsed);
};

// Thin wrapper preserving the EXACT same call-site signature this file
// already used everywhere (day/totalDays/statusColor/statusIcon/statusText)
// so nothing else in this file needed to change. The actual animated ring
// (SVG arc, breathe/glint/float/sparkle loops) now lives in the shared
// src/components/home/AnimatedProgressRing.tsx, reused identically by the
// SOPK Dashboard — same component, same animation, same timing. `progress`
// is still computed here, exactly as before (day/totalDays — a REAL pack
// length from the user's own PillScheduleScreen answer, never hardcoded),
// since AnimatedProgressRing itself never assumes what "progress" means.
function PillPackProgressRing({
  day,
  totalDays,
  statusColor,
  statusIcon,
  statusText,
}: {
  day: number | null;
  /** Real total pack length from the user's own PillScheduleScreen answer
   * — never a hardcoded 28. `day` is only ever non-null when this is also
   * non-null (see pillPackDay's computation), but the type stays separate
   * and defensive rather than assuming that invariant here. */
  totalDays: number | null;
  statusColor: string;
  statusIcon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  statusText: string;
}): React.JSX.Element {
  const isConfigured = day !== null && totalDays !== null;
  const progress = isConfigured ? day / totalDays : 0;

  return (
    <AnimatedProgressRing
      accessibilityLabel={
        isConfigured ? `Jour ${day} sur ${totalDays}, plaquette en cours` : `${statusText}, suivi en cours`
      }
      centerCaption="Jour"
      centerDetail={isConfigured ? `sur ${totalDays}` : undefined}
      centerValue={day ?? undefined}
      footnote={isConfigured ? 'Plaquette en cours' : 'Suivi en cours'}
      isConfigured={isConfigured}
      progress={progress}
      statusColor={statusColor}
      statusIcon={statusIcon}
      statusText={statusText}
    />
  );
}

/** One of the hero's 3 daily-intake quick actions (taken/late/missed) — a
 * single reusable button so the 2 different layouts below (one row on
 * regular screens, a full-width row + a 2-column row on compact ones) don't
 * each hand-duplicate 3 near-identical Pressable blocks. Writes go through
 * the same canonical setContraceptionIntakeStatus() call the Journal and
 * History use — this is a second UI entry point onto the same one record,
 * never a second store. */
function HeroIntakeActionButton({
  status,
  label,
  icon,
  selected,
  onPress,
  compact,
  styles,
}: {
  status: ContraceptionIntakeStatus;
  label: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  selected: boolean;
  onPress: () => void;
  compact: boolean;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {color, soft} = HERO_ACTION_COLORS[status];

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.heroActionButton,
        {borderColor: selected ? color : `${color}30`, backgroundColor: selected ? color : soft},
        pressed && styles.pressed,
      ]}>
      <View style={[styles.heroActionIcon, selected && styles.heroActionIconSelected]}>
        <MaterialDesignIcons color={selected ? '#FFFFFF' : color} name={icon} size={compact ? 14 : 15} />
      </View>

      <Text
        numberOfLines={2}
        style={[styles.heroActionText, selected && styles.heroActionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Most-recent-first — mirrors getRecentContraceptionIntakeRecords()'s own
 * comparator so the "Voir tout l'historique" ordering never changes. */
const sortIntakeRecordsDesc = (
  entries: Record<string, ContraceptionIntakeRecord>,
): ContraceptionIntakeRecord[] =>
  Object.values(entries).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/** Most-recent-first (by date, then by recordedAt within a date) — mirrors
 * getRecentContraceptionEvents()'s own comparator. */
const sortEventsDesc = (
  entries: Record<string, ContraceptionEvent[]>,
): ContraceptionEvent[] =>
  Object.values(entries)
    .flat()
    .sort((a, b) => {
      if (a.date !== b.date) {return a.date < b.date ? 1 : -1;}
      return a.recordedAt < b.recordedAt ? 1 : -1;
    });

function ContraceptionDashboard({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const {width, height} =
    useWindowDimensions();

  const compact =
    width < 380 || height < 720;

  const {open: openJournal} = useJournalSheet();

  const {isPremium} = usePremium();
  const [historyPremiumVisible, setHistoryPremiumVisible] = useState(false);

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // PHASE D2 — decorative-brand-purple identifiers, now theme-derived (see
  // the module-level comment above where these used to be fixed literals).
  // SUCCESS/WARNING/DANGER (health-status semantics) stay fixed module
  // consts, untouched.
  const PURPLE = theme.colors.primary;
  const PURPLE_DARK = theme.colors.accent;
  const PURPLE_SOFT = theme.colors.primarySoft;
  const MUTED = theme.colors.textMuted;

  /*
   * ============================================================
   * CONTRACEPTION PREFERENCES
   * ============================================================
   */

  const [
    contraception,
    setContraception,
  ] = useState(
    getContraceptionPreferences,
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateContraceptionPreferences().then(
        value => {
          if (active) {
            setContraception(value);
          }
        },
      );

      const unsubscribe =
        subscribeContraceptionPreferences(
          () => {
            if (active) {
              setContraception(
                getContraceptionPreferences(),
              );
            }
          },
        );

      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  /*
   * ============================================================
   * INTAKE HISTORY
   * ============================================================
   */

  const today = useMemo(
    () => todayKey(),
    [],
  );

  const [
    rawTodayRecord,
    setRawTodayRecord,
  ] = useState<
    ContraceptionIntakeRecord | undefined
  >(() =>
    getContraceptionIntakeRecord(today),
  );

  const [
    rawRecentRecords,
    setRawRecentRecords,
  ] = useState<
    ContraceptionIntakeRecord[]
  >(() =>
    getRecentContraceptionIntakeRecords(7),
  );

  const [
    rawAllHistoryRecords,
    setRawAllHistoryRecords,
  ] = useState<
    ContraceptionIntakeRecord[]
  >(() =>
    filterRecordsForHistoryAccess(
      sortIntakeRecordsDesc(getAllContraceptionIntakeRecords()),
      isPremium,
    ),
  );

  const [
    historyVisible,
    setHistoryVisible,
  ] = useState(false);

  // "Voir tout l'historique" filters — display-only, same pattern as
  // ContraceptionCalendarContent.tsx's filter chips: never touch the
  // underlying stores, only which already-loaded rows are shown.
  const [historyIntakeFilters, setHistoryIntakeFilters] = useState<
    Record<ContraceptionIntakeStatus, boolean>
  >({taken: true, late: true, missed: true});

  const [historyEventFilters, setHistoryEventFilters] = useState<
    Record<ContraceptionEvent['type'], boolean>
  >({
    ring_insertion: true,
    ring_removal: true,
    ring_replacement: true,
    patch_application: true,
    patch_removal: true,
    patch_replacement: true,
  });

  // History row actions — correcting/deleting a PAST day's record via its
  // own real date, never by silently writing to today. Kept separate from
  // ContraceptionJournalEntryScreen.tsx (which is hardcoded to today's date
  // by design) rather than reusing/extending it for arbitrary dates.
  const [
    recordActionTarget,
    setRecordActionTarget,
  ] = useState<ContraceptionIntakeRecord | null>(null);

  const closeRecordAction = useCallback(() => setRecordActionTarget(null), []);

  const correctRecordStatus = useCallback(
    async (status: ContraceptionIntakeStatus) => {
      if (!recordActionTarget) {return;}
      await setContraceptionIntakeStatus(recordActionTarget.date, status);
      closeRecordAction();
    },
    [recordActionTarget, closeRecordAction],
  );

  const confirmDeleteRecord = useCallback(() => {
    if (!recordActionTarget) {return;}
    const target = recordActionTarget;
    Alert.alert(
      'Supprimer cet enregistrement ?',
      `${formatRecordDate(target.date)} — cette action ne peut pas être annulée.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteContraceptionIntakeRecord(target.date);
            closeRecordAction();
          },
        },
      ],
    );
  }, [recordActionTarget, closeRecordAction]);

  const confirmDeleteEvent = useCallback((event: ContraceptionEvent) => {
    Alert.alert(
      'Supprimer cet événement ?',
      `${CONTRACEPTION_EVENT_LABELS[event.type]} — ${formatRecordDate(event.date)} — cette action ne peut pas être annulée.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteContraceptionEvent(event.id),
        },
      ],
    );
  }, []);

  const refreshIntakeHistory =
    useCallback(() => {
      setRawTodayRecord(
        getContraceptionIntakeRecord(
          today,
        ),
      );

      setRawRecentRecords(
        getRecentContraceptionIntakeRecords(
          7,
        ),
      );

      setRawAllHistoryRecords(
        filterRecordsForHistoryAccess(
          sortIntakeRecordsDesc(getAllContraceptionIntakeRecords()),
          isPremium,
        ),
      );
    }, [today, isPremium]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateContraceptionIntakeHistory().then(
        () => {
          if (active) {
            refreshIntakeHistory();
          }
        },
      );

      const unsubscribe =
        subscribeContraceptionIntakeHistory(
          () => {
            if (active) {
              refreshIntakeHistory();
            }
          },
        );

      return () => {
        active = false;
        unsubscribe();
      };
    }, [refreshIntakeHistory]),
  );

  /*
   * ============================================================
   * EVENT HISTORY (ring/patch — insertion/removal/replacement, application/
   * removal/replacement) — a SEPARATE store from intake history above,
   * never merged with it. See contraceptionEventStore.ts.
   * ============================================================
   */

  const [
    todayEvents,
    setTodayEvents,
  ] = useState<
    ContraceptionEvent[]
  >(() =>
    getContraceptionEventsForDate(today),
  );

  const [
    recentEvents,
    setRecentEvents,
  ] = useState<
    ContraceptionEvent[]
  >(() =>
    getRecentContraceptionEvents(7),
  );

  const [
    allHistoryEvents,
    setAllHistoryEvents,
  ] = useState<
    ContraceptionEvent[]
  >(() =>
    filterRecordsForHistoryAccess(
      sortEventsDesc(getAllContraceptionEvents()),
      isPremium,
    ),
  );

  const refreshEventHistory =
    useCallback(() => {
      setTodayEvents(
        getContraceptionEventsForDate(
          today,
        ),
      );

      setRecentEvents(
        getRecentContraceptionEvents(
          7,
        ),
      );

      setAllHistoryEvents(
        filterRecordsForHistoryAccess(
          sortEventsDesc(getAllContraceptionEvents()),
          isPremium,
        ),
      );
    }, [today, isPremium]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateContraceptionEvents().then(
        () => {
          if (active) {
            refreshEventHistory();
          }
        },
      );

      const unsubscribe =
        subscribeContraceptionEvents(
          () => {
            if (active) {
              refreshEventHistory();
            }
          },
        );

      return () => {
        active = false;
        unsubscribe();
      };
    }, [refreshEventHistory]),
  );

  // Upgrading/downgrading Premium changes which already-stored records are
  // reachable, not which exist — re-derive both "all history" lists
  // immediately so access reflects the new entitlement without waiting for
  // the next focus/store event.
  useEffect(() => {
    refreshIntakeHistory();
    refreshEventHistory();
  }, [isPremium, refreshIntakeHistory, refreshEventHistory]);

  /*
   * ============================================================
   * CONTRACEPTION JOURNAL (effets ressentis / notes)
   * ============================================================
   */

  const [todayJournalEntry, setTodayJournalEntry] = useState(() =>
    getContraceptionJournalEntry(today),
  );

  const refreshJournalEntry = useCallback(() => {
    setTodayJournalEntry(getContraceptionJournalEntry(today));
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateContraceptionJournal().then(() => {
        if (active) {
          refreshJournalEntry();
        }
      });

      const unsubscribe = subscribeContraceptionJournal(() => {
        if (active) {
          refreshJournalEntry();
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, [refreshJournalEntry]),
  );

  /*
   * ============================================================
   * LOCATION
   * ============================================================
   */

  const [
    location,
    setLocation,
  ] = useState(
    getSelectedLocation(),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydrateSelectedLocation().then(
        value => {
          if (active) {
            setLocation(value);
          }
        },
      );

      const unsubscribe =
        subscribeSelectedLocation(
          () => {
            if (active) {
              setLocation(
                getSelectedLocation(),
              );
            }
          },
        );

      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  /*
   * ============================================================
   * SPIRITUAL MARKERS
   * ============================================================
   */

  const [
    spiritualMarkersEnabled,
    setSpiritualMarkersEnabled,
  ] = useState(
    getSpiritualMarkersEnabled(),
  );

  useFocusEffect(
    useCallback(() => {
      setSpiritualMarkersEnabled(
        getSpiritualMarkersEnabled(),
      );
    }, []),
  );

  const spiritual =
    useContraceptionSpiritualStatus(
      spiritualMarkersEnabled,
    );

  /*
   * ============================================================
   * CURRENT CONTRACEPTION
   * ============================================================
   */

  const {
    method,
    methodStartDate,
    pillScheduleType,
    activeDays,
    breakDays,
    remindersEnabled,
  } = contraception;

  const isPill = method === 'pill';

  // Real total pack length, ONLY when the user actually entered a cyclic
  // schedule (PillScheduleScreen) — never a hardcoded 28. `null` for
  // continuous/unknown/not-yet-configured, which the progress ring below
  // (and getPillPackDay) treat as "no finite pack to count down."
  const pillScheduleTotalDays =
    pillScheduleType === 'cyclic' && activeDays !== null && breakDays !== null
      ? activeDays + breakDays
      : null;

  // Ring/patch are tracked as discrete insertion/removal/replacement events
  // (contraceptionEventStore.ts), never as a single daily taken/late/missed
  // status — so the "Suivi du jour" row below (which reads and writes
  // contraceptionIntakeHistoryStore.ts) doesn't apply to them.
  const isEventMethod = method === 'ring' || method === 'patch';

  // pill and other are both tracked via the same daily taken/late/missed
  // status — 'other' was previously incorrectly lumped in with ring/patch
  // for history/statistics display even though its real data lives in the
  // exact same store as pill.
  const isIntakeMethod = method === 'pill' || method === 'other';

  const methodEventTypes = method
    ? CONTRACEPTION_METHOD_EVENT_TYPES[method] ?? []
    : [];

  // Method-isolation fix: contraceptionEventStore.ts is shared across every
  // event-based method ever used (switching ring -> patch never deletes the
  // old ring events), so the raw todayEvents/recentEvents/allHistoryEvents
  // state above can legitimately contain a mix of methods. Every piece of
  // CURRENT-method operational UI below (Dashboard "Suivi du jour", the
  // "Historique" mini card, and the "Voir tout l'historique" modal, which
  // is this same card's own drill-down — not a separate deliberately-global
  // archive) must only ever show the ACTIVE method's events. Filtering here
  // — once, via the shared isContraceptionEventForMethod() helper — never
  // touches the store, so a real historical event from a previous method is
  // never lost; switching back to that method makes it visible again.
  const currentMethodTodayEvents = useMemo(
    () => todayEvents.filter(event => isContraceptionEventForMethod(event.type, method)),
    [todayEvents, method],
  );
  const currentMethodRecentEvents = useMemo(
    () => recentEvents.filter(event => isContraceptionEventForMethod(event.type, method)),
    [recentEvents, method],
  );
  const currentMethodAllHistoryEvents = useMemo(
    () => allHistoryEvents.filter(event => isContraceptionEventForMethod(event.type, method)),
    [allHistoryEvents, method],
  );

  // Same reasoning as the events filtering above, applied to intake records:
  // pill and other share one store/shape with no way to tell them apart
  // except the record's own optional `method` tag (see
  // isContraceptionIntakeRecordForMethod). Named to shadow the plain
  // "todayRecord"/"recentRecords"/"allHistoryRecords" identifiers on purpose
  // — every render site below already reads those names, so scoping the
  // filter here (once) makes the whole file method-safe without having to
  // touch each of the ~30 usages individually.
  const todayRecord = useMemo(
    () =>
      rawTodayRecord && isContraceptionIntakeRecordForMethod(rawTodayRecord.method, method)
        ? rawTodayRecord
        : undefined,
    [rawTodayRecord, method],
  );
  const recentRecords = useMemo(
    () => rawRecentRecords.filter(record => isContraceptionIntakeRecordForMethod(record.method, method)),
    [rawRecentRecords, method],
  );
  const allHistoryRecords = useMemo(
    () => rawAllHistoryRecords.filter(record => isContraceptionIntakeRecordForMethod(record.method, method)),
    [rawAllHistoryRecords, method],
  );

  const methodLabel = method
    ? CONTRACEPTION_METHOD_LABELS[
        method
      ]
    : 'Non renseignée';

  const methodIcon = method
    ? CONTRACEPTION_METHOD_ICONS[
        method
      ]
    : 'pill';

  const startDate = methodStartDate
    ? new Date(
        `${methodStartDate}T12:00:00`,
      )
    : null;

  const reminderContent = method
    ? CONTRACEPTION_REMINDER_CONTENT[
        method
      ]
    : CONTRACEPTION_DEFAULT_REMINDER_CONTENT;

  /*
   * ============================================================
   * SUIVI DU JOUR — DERIVED STATE LABELS
   * ============================================================
   */

  const intakeActionLabel = method
    ? CONTRACEPTION_INTAKE_ACTION_LABEL[method]
    : CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL;

  const intakeStateLabel =
    todayRecord?.status === 'taken'
      ? 'Enregistré'
      : todayRecord?.status === 'late'
        ? 'En retard'
        : todayRecord?.status === 'missed'
          ? 'Oubli signalé'
          : 'À renseigner';

  const feelingsCount = todayJournalEntry?.feelings?.length ?? 0;

  const feelingsStateLabel =
    feelingsCount > 0
      ? `${feelingsCount} élément${feelingsCount > 1 ? 's' : ''}`
      : 'À renseigner';

  const hasNotesToday = Boolean(todayJournalEntry?.notes?.trim());

  const pillPackDay = useMemo(
    () =>
      isPill && pillScheduleTotalDays !== null
        ? getPillPackDay(methodStartDate, today, pillScheduleTotalDays)
        : null,
    [isPill, methodStartDate, today, pillScheduleTotalDays],
  );

  // Real schedule only — never a fabricated 21+7. `pillScheduleType` is set
  // exclusively via PillScheduleScreen (a real user answer), never guessed.
  const methodScheduleLabel = isPill
    ? pillScheduleType === 'cyclic' && activeDays !== null && breakDays !== null
      ? `${activeDays} jours de pilule + ${breakDays} jours d’arrêt`
      : pillScheduleType === 'continuous'
        ? 'Prise continue, sans arrêt programmé'
        : 'Schéma de pilule non renseigné'
    : reminderContent.cardDescription;

  const sevenDayHistory = useMemo<HistoryDay[]>(() => {
    const byDate = new Map(
      recentRecords.map(record => [record.date, record]),
    );

    const current = new Date(`${today}T12:00:00`);

    return Array.from({length: 7}, (_, index) => {
      const offset = 6 - index;
      const date = new Date(current);
      date.setDate(current.getDate() - offset);

      const dateKey = date.toLocaleDateString('en-CA');

      return {
        dateKey,
        weekday: new Intl.DateTimeFormat('fr-FR', {
          weekday: 'short',
        })
          .format(date)
          .replace('.', '')
          .slice(0, 3),
        dayNumber: String(date.getDate()),
        isToday: dateKey === today,
        record: byDate.get(dateKey),
      };
    });
  }, [recentRecords, today]);

  /*
   * ============================================================
   * TODAY ACTIONS
   * ============================================================
   */

  // Tags the record with whichever intake method is CURRENTLY active — see
  // isContraceptionIntakeRecordForMethod / ContraceptionIntakeRecord.method.
  const currentIntakeMethodTag: 'pill' | 'other' | undefined =
    method === 'pill' || method === 'other' ? method : undefined;

  const handleMarkTaken =
    async () => {
      await setContraceptionIntakeStatus(
        today,
        'taken',
        currentIntakeMethodTag,
      );
    };

  const handleMarkLate =
    async () => {
      await setContraceptionIntakeStatus(
        today,
        'late',
        currentIntakeMethodTag,
      );
    };

  const handleMarkMissed =
    async () => {
      await setContraceptionIntakeStatus(
        today,
        'missed',
        currentIntakeMethodTag,
      );
    };

  // Method-adaptive hero button wording — pill keeps its existing colloquial
  // phrasing ("Prise effectuée"/"J'ai oublié"); every other intake-tracked
  // method (currently just 'other') falls back to the shared, method-neutral
  // CONTRACEPTION_INTAKE_STATUS_LABELS. Never hardcode pill wording here.
  const heroActionLabel = (status: ContraceptionIntakeStatus): string =>
    (method ? CONTRACEPTION_HERO_ACTION_LABELS[method]?.[status] : undefined) ??
    CONTRACEPTION_INTAKE_STATUS_LABELS[status];

  /*
   * ============================================================
   * HERO COPY
   * ============================================================
   */

  const heroTitle = isPill
    ? todayRecord?.status ===
      'taken'
      ? 'Pilule \nenregistrée'
      : todayRecord?.status === 'late'
        ? 'Retard enregistré'
        : todayRecord?.status ===
            'missed'
          ? 'Oubli enregistré'
          : 'Pilule à prendre'
    : methodLabel;

  const heroSubtitle = isPill
    ? todayRecord?.status ===
      'taken'
      ? 'Ta prise du jour est enregistrée.'
      : todayRecord?.status === 'late'
        ? 'Ton retard du jour est enregistré.'
        : todayRecord?.status ===
            'missed'
          ? 'Ton oubli du jour est enregistré.'
          : 'N’oublie pas d’enregistrer ta prise aujourd’hui.'
    : remindersEnabled
      ? 'Tes rappels sont activés.'
      : 'Tes rappels sont désactivés.';

  const circleStatusText = isEventMethod
    ? currentMethodTodayEvents.length > 0
      ? 'Enregistré'
      : 'À faire'
    : todayRecord?.status ===
      'taken'
      ? 'Pris'
      : todayRecord?.status === 'late'
        ? 'Retard'
        : todayRecord?.status ===
            'missed'
          ? 'Oubli'
          : 'À faire';

  const circleStatusIcon = isEventMethod
    ? currentMethodTodayEvents.length > 0
      ? CONTRACEPTION_EVENT_ICONS[currentMethodTodayEvents[0].type]
      : methodIcon
    : todayRecord?.status ===
      'taken'
      ? 'check'
      : todayRecord?.status === 'late'
        ? 'clock-alert-outline'
        : todayRecord?.status ===
            'missed'
          ? 'alert-outline'
          : methodIcon;

  const circleStatusColor = isEventMethod
    ? PURPLE
    : todayRecord?.status ===
      'taken'
      ? SUCCESS
      : todayRecord?.status === 'late'
        ? WARNING
        : todayRecord?.status ===
            'missed'
          ? DANGER
          : PURPLE;

  /*
   * ============================================================
   * QUICK ACTIONS
   * ============================================================
   */

  const quickActionItems: QuickActionItem[] =
    [
      {
        key: 'prayer-times',
        icon: 'mosque',
        iconColor: PURPLE,
        iconBg: PURPLE_SOFT,
        label:
          'Horaires\nde prière',
        onPress: () =>
          navigation.navigate(
            'PrayerTimes',
          ),
      },

      {
        key: 'library',
        icon:
          'book-open-page-variant-outline',
        iconColor: PURPLE,
        iconBg: PURPLE_SOFT,
        label: 'Bibliothèque',
        onPress: () =>
          navigation.navigate(
            'Library',
          ),
      },

      {
        key: 'daily-journal',
        icon:
          'notebook-edit-outline',
        iconColor: '#B23F63',
        iconBg: '#F9DCE8',
        label: 'Journal quotidien',
        onPress: openJournal,
      },

      {
        key: 'hijri-calendar',
        icon:
          'moon-waning-crescent',
        iconColor: PURPLE,
        iconBg: PURPLE_SOFT,
        label:
          'Calendrier Hijri',
        onPress: () =>
          navigation.navigate(
            'HijriCalendar',
          ),
      },

      {
        key: 'qadaa',
        icon:
          'silverware-fork-knife',
        iconColor: PURPLE,
        iconBg: PURPLE_SOFT,
        label:
          'Jeûne à rattraper',
        onPress: () =>
          navigation.navigate(
            'FastingQadaa',
          ),
      },

      {
        key: 'statistics',
        icon: 'chart-donut',
        iconColor: '#328C92',
        iconBg: '#E3F2F3',
        label: 'Statistiques',
        onPress: () =>
          navigation.navigate(
            'Statistics',
          ),
      },
    ];

  const visibleQuickActions =
    quickActionItems.filter(
      item =>
        spiritualMarkersEnabled ||
        (item.key !==
          'prayer-times' &&
          item.key !==
            'hijri-calendar' &&
          item.key !== 'qadaa'),
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[
        0,
        0.32,
        0.7,
        1,
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.background}>
      <View
        pointerEvents="none"
        style={
          styles.pageBackgroundDecor
        }>
        <View
          style={
            styles.pageGlowTop
          }
        />

        <View
          style={
            styles.pageGlowMiddle
          }
        />

        <View
          style={
            styles.pageGlowBottom
          }
        />
      </View>

      <SafeAreaView
        style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: getFloatingTabBarClearance(insets.bottom, 48),
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          <HomeHeader
            firstName={getFirstName()}
            onPressProfile={() =>
              navigation.navigate(
                'Profile',
              )
            }
            subtitle="Ton suivi, en toute discrétion."
          />

          {/* ===========================
              HERO TODAY
          =========================== */}

          <View
            style={
              styles.todayHeroCard
            }>
            <View
              pointerEvents="none"
              style={
                styles.todayHeroGlowOne
              }
            />

            <View
              pointerEvents="none"
              style={
                styles.todayHeroGlowTwo
              }
            />

            <View
              style={
                styles.todayBadge
              }>
              <Text
                style={
                  styles.todayBadgeText
                }>
                AUJOURD’HUI
              </Text>
            </View>

            <View
              style={
                styles.todayHeroBody
              }>
              <View
                style={
                  styles.todayHeroCopy
                }>
                <View
                  style={
                    styles.todayHeroTitleRow
                  }>
                  <Text
                    style={
                      styles.todayHeroTitle
                    }>
                    {heroTitle}
                  </Text>

                  <View
                    style={
                      styles.todayMethodMiniIcon
                    }>
                    {isPill ? (
                      <Image
                        resizeMode="cover"
                        source={CONTRACEPTION_CAPSULE_IMAGE}
                        style={styles.todayMethodImage}
                      />
                    ) : (
                      <MaterialDesignIcons
                        color={PURPLE}
                        name={methodIcon}
                        size={18}
                      />
                    )}
                  </View>
                </View>

                <View
                  style={
                    styles.todayMetaRow
                  }>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name={
                      remindersEnabled
                        ? 'bell-check-outline'
                        : 'bell-off-outline'
                    }
                    size={15}
                  />

                  <Text
                    style={
                      styles.todayMetaText
                    }>
                    {remindersEnabled
                      ? 'Rappels activés'
                      : 'Rappels désactivés'}
                  </Text>
                </View>

                <Text
                  style={
                    styles.todayHeroSubtitle
                  }>
                  {heroSubtitle}
                </Text>
              </View>

              <PillPackProgressRing
                day={pillPackDay}
                statusColor={circleStatusColor}
                statusIcon={circleStatusIcon}
                statusText={circleStatusText}
                totalDays={pillScheduleTotalDays}
              />
            </View>

            {isIntakeMethod ? (
              compact ? (
                <View style={styles.heroActionsColumn}>
                  <View style={styles.heroActionsRowNested}>
                    <HeroIntakeActionButton
                      compact={compact}
                      icon="check-bold"
                      label={heroActionLabel('taken')}
                      onPress={handleMarkTaken}
                      selected={todayRecord?.status === 'taken'}
                      status="taken"
                      styles={styles}
                    />
                  </View>

                  <View style={styles.heroActionsRowNested}>
                    <HeroIntakeActionButton
                      compact={compact}
                      icon="clock-alert-outline"
                      label={heroActionLabel('late')}
                      onPress={handleMarkLate}
                      selected={todayRecord?.status === 'late'}
                      status="late"
                      styles={styles}
                    />

                    <HeroIntakeActionButton
                      compact={compact}
                      icon="alert-outline"
                      label={heroActionLabel('missed')}
                      onPress={handleMarkMissed}
                      selected={todayRecord?.status === 'missed'}
                      status="missed"
                      styles={styles}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.heroActionsRow}>
                  <HeroIntakeActionButton
                    compact={compact}
                    icon="check-bold"
                    label={heroActionLabel('taken')}
                    onPress={handleMarkTaken}
                    selected={todayRecord?.status === 'taken'}
                    status="taken"
                    styles={styles}
                  />

                  <HeroIntakeActionButton
                    compact={compact}
                    icon="clock-alert-outline"
                    label={heroActionLabel('late')}
                    onPress={handleMarkLate}
                    selected={todayRecord?.status === 'late'}
                    status="late"
                    styles={styles}
                  />

                  <HeroIntakeActionButton
                    compact={compact}
                    icon="alert-outline"
                    label={heroActionLabel('missed')}
                    onPress={handleMarkMissed}
                    selected={todayRecord?.status === 'missed'}
                    status="missed"
                    styles={styles}
                  />
                </View>
              )
            ) : null}
          </View>

          {/* ===========================
              METHOD SUMMARY
          =========================== */}

          <View
            style={
              styles.methodCard
            }>
            <View
              style={
                styles.methodCardHeader
              }>
              <Text
                style={
                  styles.methodCardEyebrow
                }>
                Ma méthode
              </Text>

              <Pressable
                accessibilityLabel="Modifier ma contraception"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() =>
                  navigation.navigate(
                    'ContraceptionMethod',
                    {
                      mode: 'edit',
                    },
                  )
                }
                style={({
                  pressed,
                }) =>
                  pressed &&
                  styles.pressed
                }>
                <View
                  style={
                    styles.methodEditRow
                  }>
                  <Text
                    style={
                      styles.methodEditText
                    }>
                    Modifier ma méthode
                  </Text>

                  <MaterialDesignIcons
                    color={PURPLE}
                    name="chevron-right"
                    size={17}
                  />
                </View>
              </Pressable>
            </View>

            <View style={styles.methodCardBody}>
              <View style={styles.methodOverviewRow}>
                <View style={styles.methodLargeIcon}>
                  <LinearGradient
                    colors={[withAlpha(theme.colors.primary, 0.06), theme.colors.primarySoft]}
                    style={styles.methodLargeIconGradient}>
                    {isPill ? (
                      <Image
                        resizeMode="cover"
                        source={CONTRACEPTION_PILL_PACK_IMAGE}
                        style={styles.methodPackImage}
                      />
                    ) : (
                      <MaterialDesignIcons
                        color={PURPLE}
                        name={methodIcon}
                        size={30}
                      />
                    )}
                  </LinearGradient>
                </View>

                <View style={styles.methodMainCopy}>
                  <Text style={styles.methodName}>{methodLabel}</Text>

                  <Text style={styles.methodDescription}>
                    {methodScheduleLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.methodStartBox}>
                <View style={styles.methodStartIcon}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="calendar-blank-outline"
                    size={18}
                  />
                </View>

                <View style={styles.methodStartCopy}>
                  <Text style={styles.methodStartLabel}>
                    {isPill ? 'Début de plaquette' : 'Début du suivi'}
                  </Text>

                  <Text style={styles.methodStartValue}>
                    {startDate ? formatFullDate(startDate) : 'Non renseigné'}
                  </Text>
                </View>
              </View>

              {isPill ? (
                <Pressable
                  accessibilityLabel="Schéma de pilule"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('PillSchedule', {mode: 'edit'})}
                  style={({pressed}) => [styles.methodStartBox, styles.methodScheduleBox, pressed && styles.pressed]}>
                  <View style={styles.methodStartIcon}>
                    <MaterialDesignIcons color={PURPLE} name="calendar-month-outline" size={18} />
                  </View>

                  <View style={styles.methodStartCopy}>
                    <Text style={styles.methodStartLabel}>Schéma de pilule</Text>
                    <Text style={styles.methodStartValue}>
                      {pillScheduleType === 'cyclic' && activeDays !== null && breakDays !== null
                        ? `${activeDays} j. de prise + ${breakDays} j. d’arrêt`
                        : pillScheduleType === 'continuous'
                          ? 'Prise continue'
                          : 'Non renseigné'}
                    </Text>
                  </View>

                  {pillScheduleType === null || pillScheduleType === 'unknown' ? (
                    <View style={styles.methodConfigureBadge}>
                      <Text style={styles.methodConfigureText}>Configurer</Text>
                    </View>
                  ) : (
                    <MaterialDesignIcons color={MUTED} name="chevron-right" size={18} />
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* ===========================
              ACTIONS RAPIDES
          =========================== */}

  

          <View
            style={
              styles.quickActionsWrapper
            }>
            <QuickActionsGrid
              items={
                visibleQuickActions
              }
            />
          </View>

          {/* ===========================
              REPÈRES SPIRITUELS
          =========================== */}

          {spiritualMarkersEnabled ? (
            <View
              style={
                styles.spiritualSection
              }>
    
              <SpiritualGuidanceCard
                hijriDate={formatHijriDate(
                  new Date(),
                )}
                locationConfigured={Boolean(
                  location,
                )}
                locationName={
                  location
                    ? `${location.city}, ${location.country}`
                    : undefined
                }
                nextWindow={
                  spiritual.nextWindow
                }
                objective="contraception"
                onManage={() =>
                  navigation.navigate(
                    'SpiritualPreferences',
                  )
                }
                prayerError={
                  spiritual.error
                }
                prayerLoading={
                  spiritual.loading
                }
                timezone={
                  spiritual.schedule
                    ?.timezone
                }
              />
            </View>
          ) : null}

          {/* ===========================
              SUIVI DU JOUR
          =========================== */}

          <View style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <View style={styles.dailyHeaderLeft}>
                <View style={styles.dailyTitleIcon}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="clipboard-pulse-outline"
                    size={19}
                  />
                </View>

                <View style={styles.flexOne}>
                  <Text style={styles.dailyTitle}>
                    Suivi du jour
                  </Text>

                  <Text style={styles.dailySubtitle}>
                    Ton journal de contraception aujourd’hui
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dailyStatsList}>
              {/* LIGNE 1 — PRISE / UTILISATION DU JOUR */}
              <Pressable
                accessibilityLabel={intakeActionLabel}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('ContraceptionJournalEntry', {category: 'intake'})
                }
                style={({pressed}) => [styles.dailyStatRow, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.dailyStatIcon,
                    isEventMethod
                      ? currentMethodTodayEvents.length > 0
                        ? styles.dailyStatusPurple
                        : styles.dailyStatusMuted
                      : todayRecord?.status === 'taken'
                        ? styles.dailyStatusGreen
                        : todayRecord?.status === 'late'
                          ? styles.dailyStatusAmber
                          : todayRecord?.status === 'missed'
                            ? styles.dailyStatusRed
                            : styles.dailyStatusMuted,
                  ]}>
                  <MaterialDesignIcons
                    color={
                      isEventMethod
                        ? currentMethodTodayEvents.length > 0
                          ? PURPLE
                          : MUTED
                        : todayRecord?.status === 'taken'
                          ? SUCCESS
                          : todayRecord?.status === 'late'
                            ? WARNING
                            : todayRecord?.status === 'missed'
                              ? DANGER
                              : MUTED
                    }
                    name={
                      isEventMethod && currentMethodTodayEvents.length > 0
                        ? CONTRACEPTION_EVENT_ICONS[currentMethodTodayEvents[0].type]
                        : !isEventMethod && todayRecord?.status === 'missed'
                          ? 'alert-outline'
                          : !isEventMethod && todayRecord?.status === 'late'
                            ? 'clock-alert-outline'
                            : 'check-circle-outline'
                    }
                    size={18}
                  />
                </View>

                <View style={styles.dailyStatTextGroup}>
                  <Text numberOfLines={1} style={styles.dailyStatLabel}>
                    {intakeActionLabel}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.dailyStatValue,
                      isEventMethod
                        ? currentMethodTodayEvents.length > 0
                          ? undefined
                          : styles.dailyValueMuted
                        : todayRecord?.status === 'taken'
                          ? styles.dailyValueSuccess
                          : todayRecord?.status === 'late'
                            ? styles.dailyValueWarning
                            : todayRecord?.status === 'missed'
                              ? styles.dailyValueDanger
                              : styles.dailyValueMuted,
                    ]}>
                    {isEventMethod
                      ? getContraceptionEventSummaryLabel(currentMethodTodayEvents)
                      : intakeStateLabel}
                  </Text>
                </View>

                <View style={styles.dailyStatTrailing}>
                  <MaterialDesignIcons color={MUTED} name="chevron-right" size={18} />
                </View>
              </Pressable>

              {/* LIGNE 2 — EFFETS RESSENTIS */}
              <Pressable
                accessibilityLabel="Effets ressentis"
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('ContraceptionJournalEntry', {category: 'feelings'})
                }
                style={({pressed}) => [styles.dailyStatRow, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.dailyStatIcon,
                    feelingsCount > 0 ? styles.dailyStatusPurple : styles.dailyStatusMuted,
                  ]}>
                  <MaterialDesignIcons
                    color={feelingsCount > 0 ? PURPLE : MUTED}
                    name="heart-pulse"
                    size={18}
                  />
                </View>

                <View style={styles.dailyStatTextGroup}>
                  <Text numberOfLines={1} style={styles.dailyStatLabel}>
                    Effets ressentis
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.dailyStatValue,
                      feelingsCount > 0 ? undefined : styles.dailyValueMuted,
                    ]}>
                    {feelingsStateLabel}
                  </Text>
                </View>

                <View style={styles.dailyStatTrailing}>
                  <MaterialDesignIcons color={MUTED} name="chevron-right" size={18} />
                </View>
              </Pressable>

              {/* LIGNE 3 — NOTES DU JOUR */}
              <Pressable
                accessibilityLabel="Notes du jour"
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('ContraceptionJournalEntry', {category: 'notes'})
                }
                style={({pressed}) => [styles.dailyStatRow, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.dailyStatIcon,
                    hasNotesToday ? styles.dailyStatusPurple : styles.dailyStatusMuted,
                  ]}>
                  <MaterialDesignIcons
                    color={hasNotesToday ? PURPLE : MUTED}
                    name="notebook-edit-outline"
                    size={18}
                  />
                </View>

                <View style={styles.dailyStatTextGroup}>
                  <Text numberOfLines={1} style={styles.dailyStatLabel}>
                    Notes du jour
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.dailyStatValue,
                      hasNotesToday ? undefined : styles.dailyValueMuted,
                    ]}>
                    {hasNotesToday ? 'Note ajoutée' : 'Ajouter une note'}
                  </Text>
                </View>

                <View style={styles.dailyStatTrailing}>
                  <MaterialDesignIcons color={MUTED} name="chevron-right" size={18} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* ===========================
              HISTORIQUE
          =========================== */}

          {isEventMethod ? (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleGroup}>
                  <View style={styles.historyTitleIcon}>
                    <MaterialDesignIcons color={PURPLE} name="calendar-check-outline" size={18} />
                  </View>

                  <View style={styles.historyHeaderCopy}>
                    <Text style={styles.historyTitle}>Historique</Text>
                    <Text style={styles.historySubtitle}>Événements les plus récents</Text>
                  </View>
                </View>
              </View>

              {currentMethodRecentEvents.length === 0 ? (
                <Text style={styles.emptySummaryText}>Aucun événement enregistré pour le moment.</Text>
              ) : (
                <View style={styles.recentEventsList}>
                  {currentMethodRecentEvents.map(event => (
                    <View key={event.id} style={styles.recentEventRow}>
                      <View style={[styles.dailyStatIcon, styles.dailyStatusPurple]}>
                        <MaterialDesignIcons color={PURPLE} name={CONTRACEPTION_EVENT_ICONS[event.type]} size={16} />
                      </View>
                      <View style={styles.dailyStatTextGroup}>
                        <Text numberOfLines={1} style={styles.dailyStatLabel}>
                          {CONTRACEPTION_EVENT_LABELS[event.type]}
                        </Text>
                        <Text numberOfLines={1} style={styles.dailyValueMuted}>
                          {formatRecordDate(event.date)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                accessibilityLabel="Voir tout l’historique"
                accessibilityRole="button"
                onPress={() => setHistoryVisible(true)}
                style={({pressed}) => [
                  styles.historyViewAllButton,
                  pressed && styles.historyViewAllButtonPressed,
                ]}>
                <Text style={styles.historyViewAllText}>Voir tout l’historique</Text>

                <View style={styles.historyViewAllIcon}>
                  <MaterialDesignIcons color={PURPLE} name="chevron-right" size={19} />
                </View>
              </Pressable>
            </View>
          ) : isIntakeMethod ? (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleGroup}>
                  <View style={styles.historyTitleIcon}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name="calendar-check-outline"
                      size={18}
                    />
                  </View>

                  <View style={styles.historyHeaderCopy}>
                    <Text style={styles.historyTitle}>
                      Historique des prises
                    </Text>

                    <Text style={styles.historySubtitle}>
                      Les 7 derniers jours
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.historyWeekRow}>
                {sevenDayHistory.map(item => {
                  const status = item.record?.status;

                  return (
                    <View
                      key={item.dateKey}
                      style={[
                        styles.historyDayCard,
                        item.isToday && styles.historyDayCardToday,
                      ]}>
                      <Text
                        style={[
                          styles.historyWeekday,
                          item.isToday && styles.historyWeekdayToday,
                        ]}>
                        {item.weekday}
                      </Text>

                      <Text
                        style={[
                          styles.historyDayNumber,
                          item.isToday && styles.historyDayNumberToday,
                        ]}>
                        {item.dayNumber}
                      </Text>

                      <View
                        style={[
                          styles.historyDayStatusCircle,
                          status === 'taken'
                            ? styles.historyDayTakenCircle
                            : status === 'late'
                              ? styles.historyDayLateCircle
                              : status === 'missed'
                                ? styles.historyDayMissedCircle
                                : styles.historyDayEmptyCircle,
                        ]}>
                        {status ? (
                          <MaterialDesignIcons
                            color="#FFFFFF"
                            name={
                              status === 'taken'
                                ? 'check-bold'
                                : status === 'late'
                                  ? 'clock-alert-outline'
                                  : 'close'
                            }
                            size={14}
                          />
                        ) : (
                          <View style={styles.historyDayEmptyDot} />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.historyDayStatusText,
                          status === 'taken'
                            ? styles.historyDayStatusTaken
                            : status === 'late'
                              ? styles.historyDayStatusLate
                              : status === 'missed'
                                ? styles.historyDayStatusMissed
                                : styles.historyDayStatusEmpty,
                        ]}>
                        {status === 'taken'
                          ? 'Prise'
                          : status === 'late'
                            ? 'Retard'
                            : status === 'missed'
                              ? 'Oubli'
                              : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Pressable
                accessibilityLabel="Voir tout l’historique"
                accessibilityRole="button"
                onPress={() => setHistoryVisible(true)}
                style={({pressed}) => [
                  styles.historyViewAllButton,
                  pressed && styles.historyViewAllButtonPressed,
                ]}>
                <Text style={styles.historyViewAllText}>
                  Voir tout l’historique
                </Text>

                <View style={styles.historyViewAllIcon}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="chevron-right"
                    size={19}
                  />
                </View>
              </Pressable>
            </View>
          ) : null}

          <ObjectiveArticlesSection
            objective="contraception"
            onOpenArticle={articleId => navigation.navigate('ArticleReader', {articleId})}
            onSeeAll={() => navigation.navigate('Library')}
          />
        </ScrollView>

        <Modal
          animationType="slide"
          onRequestClose={() => setHistoryVisible(false)}
          statusBarTranslucent
          transparent
          visible={historyVisible}>
          <View style={styles.historyModalBackdrop}>
            <Pressable
              accessibilityLabel="Fermer l’historique"
              onPress={() => setHistoryVisible(false)}
              style={styles.historyModalOutside}
            />

            <View
              style={[
                styles.historyModalSheet,
                {
                  paddingBottom: Math.max(insets.bottom, 14),
                },
              ]}>
              <View style={styles.historyModalHandle} />

              <View style={styles.historyModalHeader}>
                <View style={styles.historyModalHeaderLeft}>
                  <View style={styles.historyModalHeaderIcon}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name="history"
                      size={20}
                    />
                  </View>

                  <View style={styles.historyModalHeaderCopy}>
                    <Text style={styles.historyModalTitle}>
                      {isEventMethod ? 'Historique des événements' : 'Historique des prises'}
                    </Text>

                    <Text style={styles.historyModalSubtitle}>
                      {isEventMethod ? 'Tous tes événements enregistrés' : 'Toutes tes prises enregistrées'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityLabel="Fermer"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setHistoryVisible(false)}
                  style={({pressed}) => [
                    styles.historyModalClose,
                    pressed && styles.pressed,
                  ]}>
                  <MaterialDesignIcons
                    color={PURPLE_DARK}
                    name="close"
                    size={20}
                  />
                </Pressable>
              </View>

              <View style={styles.historyModalDivider} />

              <View style={styles.historyFilterRow}>
                {isEventMethod
                  ? methodEventTypes.map(type => {
                      const active = historyEventFilters[type];
                      return (
                        <Pressable
                          accessibilityLabel={CONTRACEPTION_EVENT_LABELS[type]}
                          accessibilityRole="checkbox"
                          accessibilityState={{checked: active}}
                          key={type}
                          onPress={() =>
                            setHistoryEventFilters(current => ({...current, [type]: !current[type]}))
                          }
                          style={({pressed}) => [
                            styles.historyFilterChip,
                            active && styles.historyFilterChipActive,
                            pressed && styles.pressed,
                          ]}>
                          <Text
                            style={[
                              styles.historyFilterChipText,
                              active && styles.historyFilterChipTextActive,
                            ]}>
                            {CONTRACEPTION_EVENT_LABELS[type]}
                          </Text>
                        </Pressable>
                      );
                    })
                  : (['taken', 'late', 'missed'] as ContraceptionIntakeStatus[]).map(status => {
                      const active = historyIntakeFilters[status];
                      return (
                        <Pressable
                          accessibilityLabel={CONTRACEPTION_INTAKE_STATUS_LABELS[status]}
                          accessibilityRole="checkbox"
                          accessibilityState={{checked: active}}
                          key={status}
                          onPress={() =>
                            setHistoryIntakeFilters(current => ({...current, [status]: !current[status]}))
                          }
                          style={({pressed}) => [
                            styles.historyFilterChip,
                            active && styles.historyFilterChipActive,
                            pressed && styles.pressed,
                          ]}>
                          <Text
                            style={[
                              styles.historyFilterChipText,
                              active && styles.historyFilterChipTextActive,
                            ]}>
                            {CONTRACEPTION_INTAKE_STATUS_LABELS[status]}
                          </Text>
                        </Pressable>
                      );
                    })}
              </View>

              <ScrollView
                contentContainerStyle={styles.historyModalList}
                nestedScrollEnabled
                persistentScrollbar
                showsVerticalScrollIndicator
                style={styles.historyModalScroll}>
                {isEventMethod ? (
                  currentMethodAllHistoryEvents.filter(event => historyEventFilters[event.type]).length === 0 ? (
                    <View style={styles.historyModalEmpty}>
                      <View style={styles.historyModalEmptyIcon}>
                        <MaterialDesignIcons color={PURPLE} name="calendar-blank-outline" size={25} />
                      </View>

                      <Text style={styles.historyModalEmptyTitle}>Aucun historique</Text>

                      <Text style={styles.historyModalEmptyText}>
                        Tes événements apparaîtront ici après leur enregistrement.
                      </Text>
                    </View>
                  ) : (
                    currentMethodAllHistoryEvents.filter(event => historyEventFilters[event.type]).map(event => (
                      <Pressable
                        accessibilityHint="Ouvre les options de suppression"
                        accessibilityLabel={`${CONTRACEPTION_EVENT_LABELS[event.type]}, ${formatRecordDate(event.date)}`}
                        accessibilityRole="button"
                        key={event.id}
                        onPress={() => confirmDeleteEvent(event)}
                        style={({pressed}) => [styles.historyModalRow, pressed && styles.pressed]}>
                        <View style={[styles.historyModalStatusIcon, styles.historyModalPurpleIcon]}>
                          <MaterialDesignIcons color={PURPLE} name={CONTRACEPTION_EVENT_ICONS[event.type]} size={15} />
                        </View>

                        <View style={styles.historyModalMainCopy}>
                          <Text style={styles.historyModalDate}>{formatRecordDate(event.date)}</Text>
                          <Text style={[styles.historyModalStatus, styles.historyModalStatusPurple]}>
                            {CONTRACEPTION_EVENT_LABELS[event.type]}
                          </Text>
                        </View>

                        <View style={styles.historyModalTimeBox}>
                          <MaterialDesignIcons color={MUTED} name="clock-outline" size={13} />
                          <Text style={styles.historyModalTime}>{formatRecordTime(event.recordedAt)}</Text>
                        </View>
                      </Pressable>
                    ))
                  )
                ) : allHistoryRecords.filter(record => historyIntakeFilters[record.status]).length === 0 ? (
                  <View style={styles.historyModalEmpty}>
                    <View style={styles.historyModalEmptyIcon}>
                      <MaterialDesignIcons
                        color={PURPLE}
                        name="calendar-blank-outline"
                        size={25}
                      />
                    </View>

                    <Text style={styles.historyModalEmptyTitle}>
                      Aucun historique
                    </Text>

                    <Text style={styles.historyModalEmptyText}>
                      Tes prises et oublis apparaîtront ici après leur enregistrement.
                    </Text>
                  </View>
                ) : (
                  allHistoryRecords.filter(record => historyIntakeFilters[record.status]).map(record => {
                    const taken = record.status === 'taken';
                    const late = record.status === 'late';

                    return (
                      <Pressable
                        accessibilityHint="Ouvre les options de modification et de suppression"
                        accessibilityLabel={`${taken ? 'Prise effectuée' : late ? 'Retard enregistré' : 'Oubli enregistré'}, ${formatRecordDate(record.date)}`}
                        accessibilityRole="button"
                        key={record.date}
                        onPress={() => setRecordActionTarget(record)}
                        style={({pressed}) => [styles.historyModalRow, pressed && styles.pressed]}>
                        <View
                          style={[
                            styles.historyModalStatusIcon,
                            taken
                              ? styles.historyModalTakenIcon
                              : late
                                ? styles.historyModalLateIcon
                                : styles.historyModalMissedIcon,
                          ]}>
                          <MaterialDesignIcons
                            color={taken ? SUCCESS : late ? WARNING : DANGER}
                            name={taken ? 'check-bold' : late ? 'clock-alert-outline' : 'close'}
                            size={15}
                          />
                        </View>

                        <View style={styles.historyModalMainCopy}>
                          <Text style={styles.historyModalDate}>
                            {formatRecordDate(record.date)}
                          </Text>

                          <Text
                            style={[
                              styles.historyModalStatus,
                              taken
                                ? styles.historyModalStatusTaken
                                : late
                                  ? styles.historyModalStatusLate
                                  : styles.historyModalStatusMissed,
                            ]}>
                            {taken
                              ? 'Prise effectuée'
                              : late
                                ? 'Retard enregistré'
                                : 'Oubli enregistré'}
                          </Text>
                        </View>

                        <View style={styles.historyModalTimeBox}>
                          <MaterialDesignIcons
                            color={MUTED}
                            name="clock-outline"
                            size={13}
                          />

                          <Text style={styles.historyModalTime}>
                            {formatRecordTime(record.recordedAt)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}

                {!isPremium ? (
                  <Pressable
                    accessibilityLabel="Débloquer tout l’historique avec Premium"
                    accessibilityRole="button"
                    onPress={() => setHistoryPremiumVisible(true)}
                    style={({pressed}) => [
                      styles.historyPremiumHint,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialDesignIcons color={PURPLE} name="infinity" size={16} />

                    <Text style={styles.historyPremiumHintText}>
                      Avec Premium, retrouve tout ton historique sans limite de 30 jours.
                    </Text>

                    <MaterialDesignIcons color={PURPLE} name="chevron-right" size={16} />
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <HawaPremiumBottomSheet
          onClose={() => setHistoryPremiumVisible(false)}
          visible={historyPremiumVisible}
        />

        <Modal
          animationType="fade"
          onRequestClose={closeRecordAction}
          statusBarTranslucent
          transparent
          visible={recordActionTarget !== null}>
          <View style={styles.historyModalBackdrop}>
            <Pressable
              accessibilityLabel="Fermer"
              onPress={closeRecordAction}
              style={styles.historyModalOutside}
            />

            <View style={[styles.recordActionSheet, {paddingBottom: Math.max(insets.bottom, 14)}]}>
              <View style={styles.historyModalHandle} />

              <Text style={styles.recordActionTitle}>
                {recordActionTarget ? formatRecordDate(recordActionTarget.date) : ''}
              </Text>
              <Text style={styles.recordActionSubtitle}>Modifier ou supprimer cet enregistrement</Text>

              {(['taken', 'late', 'missed'] as ContraceptionIntakeStatus[]).map(status => {
                const active = recordActionTarget?.status === status;
                return (
                  <Pressable
                    accessibilityLabel={CONTRACEPTION_INTAKE_STATUS_LABELS[status]}
                    accessibilityRole="radio"
                    accessibilityState={{checked: active}}
                    key={status}
                    onPress={() => correctRecordStatus(status)}
                    style={({pressed}) => [
                      styles.recordActionRow,
                      active && styles.recordActionRowActive,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialDesignIcons
                      color={
                        status === 'taken' ? SUCCESS : status === 'late' ? WARNING : DANGER
                      }
                      name={
                        status === 'taken'
                          ? 'check-bold'
                          : status === 'late'
                            ? 'clock-alert-outline'
                            : 'close'
                      }
                      size={18}
                    />
                    <Text style={styles.recordActionRowText}>
                      {CONTRACEPTION_INTAKE_STATUS_LABELS[status]}
                    </Text>
                    {active ? (
                      <MaterialDesignIcons color={PURPLE} name="check" size={16} />
                    ) : null}
                  </Pressable>
                );
              })}

              <Pressable
                accessibilityLabel="Supprimer cet enregistrement"
                accessibilityRole="button"
                onPress={confirmDeleteRecord}
                style={({pressed}) => [styles.recordActionRow, pressed && styles.pressed]}>
                <MaterialDesignIcons color={DANGER} name="trash-can-outline" size={18} />
                <Text style={[styles.recordActionRowText, styles.recordActionDeleteText]}>
                  Supprimer cet enregistrement
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// PHASE D2 — converted to a createStyles(theme) factory (see D1's
// CycleHomeScreen.tsx for the identical pattern). PURPLE/PURPLE_DARK/
// PURPLE_SOFT/BORDER_STRONG/MUTED/CARD_BACKGROUND are re-derived here (same
// mapping as the component-body copies above) so every style below keeps
// working unchanged by name. SUCCESS/SUCCESS_SOFT/DANGER/DANGER_SOFT/
// WARNING/WARNING_SOFT (module-level, above) stay fixed semantic literals —
// never theme-driven.
function createStyles(theme: ResolvedAwaTheme) {
  const PURPLE = theme.colors.primary;
  const PURPLE_DARK = theme.colors.accent;
  const PURPLE_SOFT = theme.colors.primarySoft;
  const BORDER_STRONG = withAlpha(theme.colors.primary, 0.18);
  const MUTED = theme.colors.textMuted;
  const CARD_BACKGROUND = withAlpha(theme.colors.surface, 0.97);

  return StyleSheet.create({
    flexOne: {
      flex: 1,
    },

    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    safeArea: {
      flex: 1,
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
      backgroundColor: withAlpha(theme.colors.primary, 0.07),
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '37%',
      left: -135,
      width: 270,
      height: 270,
      borderRadius: 135,
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

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 2,
    },

    pressed: {
      opacity: 0.82,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    /* HERO */

    todayHeroCard: {
      position: 'relative',
      overflow: 'hidden',
      marginTop: 14,
      padding: 17,
      borderWidth: 1,
      borderColor:
        BORDER_STRONG,
      borderRadius: 28,
      backgroundColor:
        CARD_BACKGROUND,

      shadowColor: theme.shadow.shadowColor,

      shadowOffset: {
        width: 0,
        height: 11,
      },

      shadowOpacity: 0.12,
      shadowRadius: 23,
      elevation: 7,
    },

    todayHeroGlowOne: {
      position: 'absolute',
      width: 190,
      height: 190,
      top: -100,
      right: -62,
      borderRadius: 95,
      backgroundColor: withAlpha(theme.colors.primary, 0.10),
    },

    todayHeroGlowTwo: {
      position: 'absolute',
      width: 170,
      height: 170,
      left: -90,
      bottom: -105,
      borderRadius: 85,
      backgroundColor: withAlpha(theme.colors.secondary, 0.11),
    },

    todayBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: PURPLE_SOFT,
    },

    todayBadgeText: {
      color: PURPLE,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    todayHeroBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
    },

    todayHeroCopy: {
      flex: 1,
      minWidth: 0,
    },

    todayHeroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    todayHeroTitle: {
      flexShrink: 1,
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '900',
    },

    todayMethodMiniIcon: {
      width: 31,
      height: 31,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 11,
      backgroundColor:
        PURPLE_SOFT,
      overflow: 'hidden',
    },

    todayMethodImage: {
      width: 31,
      height: 31,
    },

    todayMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },

    todayMetaText: {
      color: PURPLE,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
    },

    todayHeroSubtitle: {
      maxWidth: 205,
      marginTop: 8,
      color: MUTED,
      fontSize: 10.5,
      lineHeight: 15,
    },

    /* CIRCLE — see src/components/home/AnimatedProgressRing.tsx, the shared
       component the ring itself now lives in (also reused by the SOPK
       Dashboard). Nothing under this dashboard's own `styles` needs to size
       or style the ring anymore. */

    heroActionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    // Same row shape as heroActionsRow, but without its own top margin —
    // used for the two inner rows of the compact column layout, where
    // heroActionsColumn already supplies the spacing (its own marginTop
    // above the first row, its `gap` between the two rows).
    heroActionsRowNested: {
      flexDirection: 'row',
      gap: 8,
    },

    heroActionButton: {
      flex: 1,
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderRadius: 14,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: 6,
      elevation: 2,
    },

    heroActionsColumn: {
      gap: 8,
      marginTop: 14,
    },

    heroActionIcon: {
      width: 25,
      height: 25,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },

    heroActionIconSelected: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      shadowOpacity: 0,
      elevation: 0,
    },

    heroActionText: {
      flexShrink: 1,
      // Fixed, NOT `PURPLE_DARK` — this label sits on the unselected state's
      // background (HERO_ACTION_COLORS[status].soft), which is one of the
      // deliberately-fixed SUCCESS_SOFT/WARNING_SOFT/DANGER_SOFT pastels
      // (always light, regardless of palette/dark mode). `theme.colors.
      // accent` inverts to a LIGHT tint in dark mode and would lose contrast
      // against that always-light background — see MotivationCard's
      // identical "fixed text over a fixed surface" precedent (Phase D1).
      color: '#28166F',
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: '800',
      textAlign: 'center',
    },

    heroActionTextSelected: {
      color: '#FFFFFF',
    },

    /* METHOD */

    methodCard: {
      marginTop: 15,
      padding: 16,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      borderRadius: 26,
      backgroundColor: withAlpha(theme.colors.surface, 0.98),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },

    methodCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10,
    },

    methodCardEyebrow: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 14.5,
      fontWeight: '900',
      letterSpacing: 0.1,
    },

    methodEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: PURPLE_SOFT,
    },

    methodEditText: {
      color: PURPLE,
      fontSize: 10.5,
      fontWeight: '800',
    },

    methodCardBody: {
      marginTop: 15,
      gap: 12,
      padding: 13,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    methodOverviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    methodLargeIcon: {
      width: 58,
      height: 58,
      borderRadius: 19,
      overflow: 'hidden',
      flexShrink: 0,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.08,
      shadowRadius: 7,
      elevation: 2,
    },

    methodLargeIconGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    methodPackImage: {
      width: 58,
      height: 58,
    },

    methodMainCopy: {
      flex: 1,
      minWidth: 0,
    },

    methodName: {
      color: PURPLE_DARK,
      fontSize: 13.5,
      fontWeight: '900',
    },

    methodDescription: {
      marginTop: 4,
      color: MUTED,
      fontSize: 9.8,
      lineHeight: 14.5,
    },

    methodStartBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 11,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
      borderRadius: 15,
      backgroundColor: theme.colors.surface,
    },

    methodStartIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 11,
      backgroundColor: PURPLE_SOFT,
    },

    methodStartCopy: {
      flex: 1,
      minWidth: 0,
    },

    methodStartLabel: {
      color: MUTED,
      fontSize: 9.5,
      lineHeight: 13,
      fontWeight: '700',
    },

    methodStartValue: {
      marginTop: 2,
      color: PURPLE_DARK,
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: '900',
    },

    methodScheduleBox: {
      marginTop: 10,
    },

    methodConfigureBadge: {
      flexShrink: 0,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: PURPLE,
    },

    methodConfigureText: {
      color: onPrimaryTextColor(theme),
      fontSize: 9.5,
      fontWeight: '800',
    },

    /* SECTIONS */

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: 22,
      marginBottom: 9,
      paddingHorizontal: 3,
    },

    sectionTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '900',
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
      backgroundColor: PURPLE_SOFT,
    },

    sectionMoon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: PURPLE_SOFT,
    },

    quickActionsWrapper: {
      marginTop: -2,
    },

    spiritualSection: {
      marginTop: 2,
    },

    /* DAILY */

    dailyCard: {
      marginTop: 20,
      padding: 15,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.11),
      borderRadius: 24,
      backgroundColor: withAlpha(theme.colors.surface, 0.98),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 3,
    },

    dailyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    dailyHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    dailyTitleIcon: {
      width: 39,
      height: 39,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 13,
      backgroundColor: PURPLE_SOFT,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.07),
    },

    dailyTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 16,
      fontWeight: '900',
    },

    dailySubtitle: {
      marginTop: 2,
      color: MUTED,
      fontSize: 9.8,
      lineHeight: 13,
    },

    dailyStatsList: {
      marginTop: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.08),
      borderRadius: 17,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    dailyStatRow: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: withAlpha(theme.colors.primary, 0.09),
      backgroundColor: theme.colors.surfaceSecondary,
    },

    dailyStatIcon: {
      width: 35,
      height: 35,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 11,
    },

    dailyStatTextGroup: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },

    dailyStatTrailing: {
      width: 22,
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexShrink: 0,
      marginLeft: 8,
    },

    dailyStatusPurple: {
      backgroundColor: PURPLE_SOFT,
    },

    dailyStatusGreen: {
      backgroundColor: SUCCESS_SOFT,
    },

    dailyStatusRed: {
      backgroundColor: DANGER_SOFT,
    },

    dailyStatusAmber: {
      backgroundColor: WARNING_SOFT,
    },

    dailyStatusMuted: {
      backgroundColor: theme.colors.surfaceSecondary,
    },

    dailyStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },

    dailyStatusDotPurple: {
      backgroundColor: PURPLE,
    },

    dailyStatusDotGreen: {
      backgroundColor: SUCCESS,
    },

    dailyStatusDotRed: {
      backgroundColor: DANGER,
    },

    dailyStatusDotMuted: {
      backgroundColor: MUTED,
    },

    dailyStatLabel: {
      color: MUTED,
      fontSize: 9.4,
      lineHeight: 12,
      fontWeight: '700',
    },

    dailyStatValue: {
      marginTop: 2,
      color: PURPLE_DARK,
      fontSize: 10.8,
      lineHeight: 15,
      fontWeight: '900',
    },

    dailyValueSuccess: {
      color: SUCCESS,
    },

    dailyValueDanger: {
      color: DANGER,
    },

    dailyValueWarning: {
      color: WARNING,
    },

    dailyValueMuted: {
      color: MUTED,
    },


    /* HISTORY */

    historyCard: {
      marginTop: 16,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 13,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.11),
      borderRadius: 25,
      backgroundColor: withAlpha(theme.colors.surface, 0.98),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 3,
    },

    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    emptySummaryText: {
      marginTop: 12,
      color: MUTED,
      fontSize: 11.5,
      lineHeight: 16,
    },

    recentEventsList: {
      marginTop: 12,
      gap: 8,
    },

    recentEventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    historyTitleGroup: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    historyTitleIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 12,
      backgroundColor: PURPLE_SOFT,
    },

    historyHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },

    historyTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 14.5,
      lineHeight: 19,
      fontWeight: '900',
    },

    historySubtitle: {
      marginTop: 1,
      color: MUTED,
      fontSize: 9.2,
      lineHeight: 13,
    },

    historyWeekRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      marginTop: 15,
      paddingHorizontal: 1,
    },

    historyDayCard: {
      width: '13.1%',
      minHeight: 108,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 1,
      paddingTop: 9,
      paddingBottom: 7,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.075),
      borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.surface, 0.98),
    },

    historyDayCardToday: {
      borderWidth: 1.5,
      borderColor: PURPLE,
      backgroundColor: PURPLE_SOFT,
      shadowColor: PURPLE,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 1,
    },

    historyWeekday: {
      color: MUTED,
      fontSize: 8.1,
      lineHeight: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
      textAlign: 'center',
    },

    historyWeekdayToday: {
      color: PURPLE,
      fontWeight: '900',
    },

    historyDayNumber: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      textAlign: 'center',
    },

    historyDayNumberToday: {
      color: PURPLE_DARK,
      fontWeight: '900',
    },

    historyDayStatusCircle: {
      width: 26,
      height: 26,
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
    },

    historyDayTakenCircle: {
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

    historyDayMissedCircle: {
      backgroundColor: DANGER,
      shadowColor: DANGER,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.16,
      shadowRadius: 4,
      elevation: 2,
    },

    historyDayLateCircle: {
      backgroundColor: WARNING,
      shadowColor: WARNING,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.16,
      shadowRadius: 4,
      elevation: 2,
    },

    historyDayEmptyCircle: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    historyDayEmptyDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: MUTED,
    },

    historyDayStatusText: {
      width: '100%',
      marginTop: 7,
      paddingHorizontal: 1,
      fontSize: 7.2,
      lineHeight: 9.5,
      fontWeight: '800',
      textAlign: 'center',
    },

    // Fixed, not `SUCCESS` — a pre-existing, slightly different green than
    // SUCCESS ('#42A66A'). Semantic (health-status), not decorative, and a
    // known minor authoring drift documented rather than "fixed" here, same
    // treatment as D1's dual-ovulation-purple finding.
    historyDayStatusTaken: {
      color: '#3D9460',
    },

    historyDayStatusMissed: {
      color: DANGER,
    },

    historyDayStatusLate: {
      color: WARNING,
    },

    historyDayStatusEmpty: {
      color: MUTED,
    },

    historyViewAllButton: {
      position: 'relative',
      width: '100%',
      minHeight: 47,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
      paddingHorizontal: 14,
      borderWidth: 1.25,
      borderColor: PURPLE,
      borderRadius: 15,
      backgroundColor: withAlpha(theme.colors.surface, 0.66),
    },

    historyViewAllButtonPressed: {
      opacity: 0.8,
      transform: [
        {
          scale: 0.992,
        },
      ],
    },

    historyViewAllText: {
      paddingHorizontal: 28,
      color: PURPLE_DARK,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '800',
      textAlign: 'center',
    },

    historyViewAllIcon: {
      position: 'absolute',
      right: 10,
      width: 29,
      height: 29,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: PURPLE_SOFT,
    },


    // Fixed — a modal dim/scrim, not a surface. Matches Phase C's
    // InAppNotificationCenter precedent: overlay dims stay dark regardless
    // of the resolved theme so the sheet above it always pops.
    historyModalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(35,22,61,0.32)',
    },

    historyModalOutside: {
      flex: 1,
    },

    historyModalSheet: {
      height: '55%',
      minHeight: 390,
      overflow: 'hidden',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: -8,
      },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 24,
    },

    historyModalHandle: {
      width: 44,
      height: 5,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 12,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
    },

    recordActionSheet: {
      paddingHorizontal: 18,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: -8},
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 24,
    },

    recordActionTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
    },

    recordActionSubtitle: {
      marginTop: 4,
      marginBottom: 14,
      color: MUTED,
      fontSize: 11,
      textAlign: 'center',
    },

    recordActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
    },

    recordActionRowActive: {
      borderColor: PURPLE,
      backgroundColor: PURPLE_SOFT,
    },

    recordActionRowText: {
      flex: 1,
      minWidth: 0,
      color: PURPLE_DARK,
      fontSize: 13,
      fontWeight: '700',
    },

    recordActionDeleteText: {
      color: DANGER,
    },

    historyModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 14,
    },

    historyModalHeaderLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
    },

    historyModalHeaderIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginRight: 11,
      borderRadius: 14,
      backgroundColor: PURPLE_SOFT,
    },

    historyModalHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },

    historyModalTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '900',
    },

    historyModalSubtitle: {
      marginTop: 2,
      color: MUTED,
      fontSize: 11,
      lineHeight: 15,
    },

    historyModalClose: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginLeft: 10,
      borderRadius: 13,
      backgroundColor: PURPLE_SOFT,
    },

    historyModalDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: 18,
      backgroundColor: withAlpha(theme.colors.primary, 0.12),
    },

    historyFilterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
    },

    historyFilterChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.16),
      backgroundColor: theme.colors.surface,
    },

    historyFilterChipActive: {
      borderColor: PURPLE,
      backgroundColor: PURPLE_SOFT,
    },

    historyFilterChipText: {
      color: MUTED,
      fontSize: 10.5,
      fontWeight: '700',
    },

    historyFilterChipTextActive: {
      color: PURPLE,
    },

    historyModalScroll: {
      flex: 1,
    },

    historyModalList: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },

    historyPremiumHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.18),
      backgroundColor: withAlpha(theme.colors.primary, 0.06),
    },

    historyPremiumHintText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: '600',
      color: PURPLE_DARK,
    },

    historyModalRow: {
      minHeight: 67,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
      paddingVertical: 10,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.045,
      shadowRadius: 8,
      elevation: 1,
    },

    historyModalStatusIcon: {
      width: 37,
      height: 37,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginRight: 11,
      borderRadius: 13,
    },

    historyModalTakenIcon: {
      backgroundColor: SUCCESS_SOFT,
    },

    historyModalMissedIcon: {
      backgroundColor: DANGER_SOFT,
    },

    historyModalLateIcon: {
      backgroundColor: WARNING_SOFT,
    },

    historyModalPurpleIcon: {
      backgroundColor: PURPLE_SOFT,
    },

    historyModalMainCopy: {
      flex: 1,
      minWidth: 0,
    },

    historyModalDate: {
      color: PURPLE_DARK,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '800',
    },

    historyModalStatus: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
    },

    historyModalStatusTaken: {
      color: SUCCESS,
    },

    historyModalStatusMissed: {
      color: DANGER,
    },

    historyModalStatusLate: {
      color: WARNING,
    },

    historyModalStatusPurple: {
      color: PURPLE,
    },

    historyModalTimeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      marginLeft: 8,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    historyModalTime: {
      color: MUTED,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
    },

    historyModalEmpty: {
      minHeight: 230,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    historyModalEmptyIcon: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderRadius: 18,
      backgroundColor: PURPLE_SOFT,
    },

    historyModalEmptyTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 17,
      fontWeight: '900',
      textAlign: 'center',
    },

    historyModalEmptyText: {
      maxWidth: 280,
      marginTop: 7,
      color: MUTED,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },

  });
}

export default ContraceptionDashboard;
