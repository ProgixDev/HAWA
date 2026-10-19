import {useToday} from '../../hooks/useToday';
import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {
  PostpartumInfoPanel,
  PostpartumJournalScreenLayout,
} from '../../components/postpartum/PostpartumJournalScreenLayout';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme, softTone, softToneInk, softToneOpaque} from '../../theme/awaThemeTokens';

import type {RootStackParamList} from '../../navigation/AppNavigator';

import {isIntimacyUnlocked} from '../../state/privateSectionAuthStore';

import {
  CONTRACEPTION_FEELINGS_OPTIONS,
  CONTRACEPTION_JOURNAL_ITEMS,
} from '../../config/contraceptionJournalConfig';
import {journalOptionLabel} from '../../utils/journalOptionLabels';

import {
  contraceptionDefaultIntakeActionLabel,
  CONTRACEPTION_EVENT_ICONS,
  contraceptionEventLabels,
  contraceptionIntakeActionLabels,
  contraceptionIntakeStatusLabels,
  CONTRACEPTION_METHOD_EVENT_TYPES,
  isContraceptionEventForMethod,
} from '../../config/contraceptionLabels';

import {
  getContraceptionPreferences,
} from '../../state/contraceptionPreferences';
import '../../i18n';
import {getCyclicPillSchedule, isPillBreakDateKey} from '../../utils/contraceptionMath';
import {dateFormatLocale} from '../../utils/cycleMath';

import {
  getContraceptionIntakeRecord,
  hydrateContraceptionIntakeHistory,
  setContraceptionIntakeStatus,
  type ContraceptionIntakeStatus,
} from '../../state/contraceptionIntakeHistoryStore';

import {
  addContraceptionEvent,
  getContraceptionEventsForDate,
  hydrateContraceptionEvents,
  type ContraceptionEvent,
  type ContraceptionEventType,
} from '../../state/contraceptionEventStore';

import {
  getContraceptionJournalEntry,
  hydrateContraceptionJournal,
  clearContraceptionJournalField,
  saveContraceptionJournalField,
} from '../../state/contraceptionJournalStore';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';

// PHASE E4 — PURPLE/PURPLE_DARK/TEXT_SECONDARY/LAVENDER used to be fixed
// literals sourced from homeColors here; every decorative usage below is now
// derived from useAwaTheme() inside each sub-component (and re-derived
// identically inside each createStyles(theme)) so this screen follows the
// resolved global theme, matching ContraceptionDashboard.tsx and
// ContraceptionCalendarContent.tsx.
//
// GREEN/GREEN_LIGHT/ORANGE/DANGER stay fixed module literals — the
// taken/late/missed health-status semantics must never change meaning across
// palettes, exactly like ContraceptionDashboard.tsx's SUCCESS/WARNING/DANGER
// and ContraceptionCalendarContent.tsx's own SUCCESS/WARNING/DANGER (same
// exact WARNING/DANGER hex; SUCCESS/SUCCESS_SOFT is a pre-existing,
// untouched inconsistency between this file and the Calendar's shade — see
// this file's own final migration notes).

const GREEN = '#42A66A';
const GREEN_LIGHT = '#EDF8F1';

const ORANGE = '#C77B2E';

const DANGER = '#D96176';


type Props = RouteProp<RootStackParamList, 'ContraceptionJournalEntry'>;

function formatToday(date: Date): string {
  return new Intl.DateTimeFormat(dateFormatLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/* ============================================================
   SMALL SECTION HEADER
============================================================ */

function SectionHeader({
  title,
  subtitle,
  icon,
  color,
  tint,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  color?: string;
  tint?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const effectiveColor = color ?? theme.colors.primary;
  const effectiveTint = tint ?? theme.colors.primarySoft;

  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, {backgroundColor: effectiveTint}]}>
        <MaterialDesignIcons color={effectiveColor} name={icon} size={18} />
      </View>

      <View style={styles.sectionHeaderCopy}>
        <AwaText variant="titleMedium" style={styles.sectionTitle}>{title}</AwaText>
        {subtitle ? <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionSubtitle}>{subtitle}</AwaText> : null}
      </View>
    </View>
  );
}

/* ============================================================
   PREMIUM TEXT AREA
============================================================ */

function PremiumTextArea({
  value,
  onChangeText,
  placeholder,
  maxLength,
  large = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength: number;
  large?: boolean;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.noteBox, focused && styles.noteBoxFocused, large && styles.noteBoxLarge]}>
      <TextInput
        maxLength={maxLength}
        multiline
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.noteInput, large && styles.noteInputLarge]}
        textAlignVertical="top"
        value={value}
      />

      <View style={styles.noteFooter}>
        <View style={styles.privatePill}>
          <MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={11} />
          <AwaText variant="labelSmall" colorRole="primary">{t('contraceptionJournalEntry.private')}</AwaText>
        </View>

        <AwaText variant="labelSmall" colorRole="onSurfaceVariant">{value.length}/{maxLength}</AwaText>
      </View>
    </View>
  );
}


/* ============================================================
   PREMIUM HERO
============================================================ */

function PremiumHero({
  title,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  accent?: string;
  tint?: string;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const effectiveAccent = accent ?? theme.colors.primary;

  return (
    <AwaCard padding="none" style={styles.hero}>

      <View style={[styles.heroLargeIconRing, {borderColor: `${effectiveAccent}26`}]}>
        <View style={styles.heroLargeIcon}>
          <MaterialDesignIcons color={effectiveAccent} name={icon} size={29} />
        </View>
      </View>

      <View style={styles.heroCopy}>
        <View style={styles.heroEyebrowRow}>
          <View style={[styles.heroEyebrowDot, {backgroundColor: effectiveAccent}]} />
          <AwaText variant="labelSmall" style={[styles.heroEyebrow, {color: effectiveAccent}]}>{t('contraceptionJournalEntry.todayEyebrow')}</AwaText>
        </View>

        <AwaText variant="titleMedium" style={styles.heroTitle}>{title}</AwaText>
        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.heroSubtitle}>{subtitle}</AwaText>
      </View>
    </AwaCard>
  );
}

/* ============================================================
   INTAKE / MISSED-OR-LATE — SHARED BINARY STATUS CONTENT
   (both categories read/write the SAME contraceptionIntakeHistoryStore
   record for today — see the config's comment for why)
============================================================ */

function IntakeStatusContent({
  heroTitle,
  heroSubtitle,
  status,
  onSelect,
}: {
  heroTitle: string;
  heroSubtitle: string;
  status: ContraceptionIntakeStatus | undefined;
  onSelect: (value: ContraceptionIntakeStatus) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const intakeStatusLabels = contraceptionIntakeStatusLabels(t);

  return (
    <>
      <PremiumHero
        icon="calendar-check-outline"
        subtitle={heroSubtitle}
        title={heroTitle}
      />

      <AwaCard padding="none" variant="filled" style={styles.card}>
        <SectionHeader
          icon="calendar-today"
          subtitle={t('contraceptionJournalEntry.today.subtitle')}
          title={t('contraceptionJournalEntry.today.title')}
        />

        <View style={styles.statusChoiceList}>
          <Pressable
            accessibilityLabel={intakeStatusLabels.taken}
            accessibilityRole="radio"
            accessibilityState={{checked: status === 'taken'}}
            onPress={() => onSelect('taken')}
            style={({pressed}) => [
              styles.statusChoice,
              status === 'taken' && styles.statusChoiceTakenActive,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.statusChoiceIcon, status === 'taken' && styles.statusChoiceIconTakenActive]}>
              <MaterialDesignIcons
                color={GREEN}
                name="check-bold"
                size={18}
              />
            </View>

            <View style={styles.statusChoiceCopy}>
              <Text style={[styles.statusChoiceText, status === 'taken' && styles.statusChoiceTextActive]}>
                {intakeStatusLabels.taken}
              </Text>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.statusChoiceSubtitle}>{t('contraceptionJournalEntry.intake.takenSubtitle')}</AwaText>
            </View>

            <View style={[styles.radioOuter, status === 'taken' && styles.radioOuterActive]}>
              {status === 'taken' ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel={intakeStatusLabels.late}
            accessibilityRole="radio"
            accessibilityState={{checked: status === 'late'}}
            onPress={() => onSelect('late')}
            style={({pressed}) => [
              styles.statusChoice,
              status === 'late' && styles.statusChoiceLateActive,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.statusChoiceIcon, status === 'late' && styles.statusChoiceIconLateActive]}>
              <MaterialDesignIcons
                color={ORANGE}
                name="clock-alert-outline"
                size={18}
              />
            </View>

            <View style={styles.statusChoiceCopy}>
              <Text style={[styles.statusChoiceText, status === 'late' && styles.statusChoiceTextActive]}>
                {intakeStatusLabels.late}
              </Text>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.statusChoiceSubtitle}>{t('contraceptionJournalEntry.intake.lateSubtitle')}</AwaText>
            </View>

            <View style={[styles.radioOuter, status === 'late' && styles.radioOuterActive]}>
              {status === 'late' ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel={intakeStatusLabels.missed}
            accessibilityRole="radio"
            accessibilityState={{checked: status === 'missed'}}
            onPress={() => onSelect('missed')}
            style={({pressed}) => [
              styles.statusChoice,
              status === 'missed' && styles.statusChoiceMissedActive,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.statusChoiceIcon, status === 'missed' && styles.statusChoiceIconMissedActive]}>
              <MaterialDesignIcons
                color={DANGER}
                name="alert-outline"
                size={18}
              />
            </View>

            <View style={styles.statusChoiceCopy}>
              <Text style={[styles.statusChoiceText, status === 'missed' && styles.statusChoiceTextActive]}>
                {intakeStatusLabels.missed}
              </Text>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.statusChoiceSubtitle}>{t('contraceptionJournalEntry.intake.missedSubtitle')}</AwaText>
            </View>

            <View style={[styles.radioOuter, status === 'missed' && styles.radioOuterActive]}>
              {status === 'missed' ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>
        </View>
      </AwaCard>

      <PostpartumInfoPanel
        icon="information-outline"
        text={t('contraceptionJournalEntry.intake.infoText')}
        title={t('contraceptionJournalEntry.intake.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   RING / PATCH — EVENT-TYPE CONTENT (writes to contraceptionEventStore,
   a separate append-only list, not the single-status intake record above)
============================================================ */

function EventTypeContent({
  heroTitle,
  heroSubtitle,
  eventTypes,
  selected,
  onSelect,
  todayEvents,
}: {
  heroTitle: string;
  heroSubtitle: string;
  eventTypes: ContraceptionEventType[];
  selected: ContraceptionEventType | undefined;
  onSelect: (value: ContraceptionEventType) => void;
  todayEvents: ContraceptionEvent[];
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const eventLabels = contraceptionEventLabels(t);

  return (
    <>
      <PremiumHero
        icon="calendar-check-outline"
        subtitle={heroSubtitle}
        title={heroTitle}
      />

      <AwaCard padding="none" variant="filled" style={styles.card}>
        <SectionHeader
          icon="calendar-today"
          subtitle={t('contraceptionJournalEntry.today.subtitle')}
          title={t('contraceptionJournalEntry.today.title')}
        />

        <View style={styles.statusChoiceList}>
          {eventTypes.map(type => {
            const active = selected === type;
            return (
              <Pressable
                accessibilityLabel={eventLabels[type]}
                accessibilityRole="radio"
                accessibilityState={{checked: active}}
                key={type}
                onPress={() => onSelect(type)}
                style={({pressed}) => [
                  styles.statusChoice,
                  active && styles.statusChoiceTakenActive,
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.statusChoiceIcon, active && styles.statusChoiceIconTakenActive]}>
                  <MaterialDesignIcons
                    color={active ? '#FFFFFF' : GREEN}
                    name={CONTRACEPTION_EVENT_ICONS[type]}
                    size={20}
                  />
                </View>

                <View style={styles.statusChoiceCopy}>
                  <Text style={[styles.statusChoiceText, active && styles.statusChoiceTextActive]}>
                    {eventLabels[type]}
                  </Text>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.statusChoiceSubtitle}>{t('contraceptionJournalEntry.event.optionSubtitle')}</AwaText>
                </View>

                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </AwaCard>

      {todayEvents.length > 0 ? (
        <View style={styles.selectedSummary}>
          <View style={styles.selectedSummaryIcon}>
            <MaterialDesignIcons color={GREEN} name="check" size={12} />
          </View>
          <AwaText variant="labelSmall" style={styles.selectedSummaryText}>
            {t('contraceptionJournalEntry.event.alreadyRecorded', {
              list: todayEvents.map(event => eventLabels[event.type]).join(', '),
            })}
          </AwaText>
        </View>
      ) : null}

      <PostpartumInfoPanel
        icon="information-outline"
        text={t('contraceptionJournalEntry.intake.infoText')}
        title={t('contraceptionJournalEntry.intake.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   EFFETS RESSENTIS
============================================================ */

function FeelingsContent({
  selected,
  toggle,
  dayWord,
}: {
  selected: string[];
  toggle: (option: string) => void;
  dayWord: string;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const chipCheckIconColor = onPrimaryTextColor(theme);

  return (
    <>
      <PremiumHero
        accent={theme.colors.primary}
        icon="heart-pulse"
        subtitle={t('contraceptionJournalEntry.feelings.heroSubtitle', {dayWord})}
        tint={theme.colors.primarySoft}
        title={t('contraceptionJournalEntry.feelings.heroTitle')}
      />

      <AwaCard padding="none" variant="filled" style={styles.card}>
        <SectionHeader
          icon="clipboard-pulse-outline"
          subtitle={t('contraceptionJournalEntry.feelings.sectionSubtitle')}
          title={t('contraceptionJournalEntry.feelings.sectionTitle')}
        />

        <View style={styles.chipsWrap}>
          {CONTRACEPTION_FEELINGS_OPTIONS.map(option => {
            const active = selected.includes(option);
            return (
              <Pressable
                accessibilityLabel={journalOptionLabel('contraceptionFeeling', option, t)}
                accessibilityRole="checkbox"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => toggle(option)}
                style={({pressed}) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{journalOptionLabel('contraceptionFeeling', option, t)}</Text>
                {active ? (
                  <View style={styles.chipCheck}>
                    <MaterialDesignIcons color={chipCheckIconColor} name="check" size={10} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {selected.length > 0 ? (
          <View style={styles.selectedSummary}>
            <View style={styles.selectedSummaryIcon}>
              <MaterialDesignIcons color={GREEN} name="check" size={12} />
            </View>
            <AwaText variant="labelSmall" style={styles.selectedSummaryText}>
              {t('contraceptionJournalEntry.feelings.selectedCount', {count: selected.length})}
            </AwaText>
          </View>
        ) : null}
      </AwaCard>

      <PostpartumInfoPanel
        icon="shield-check-outline"
        text={t('contraceptionJournalEntry.feelings.infoText')}
        title={t('contraceptionJournalEntry.feelings.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   NOTES DU JOUR
============================================================ */

function NotesContent({
  note,
  setNote,
}: {
  note: string;
  setNote: (value: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <PremiumHero
        accent="#7C5AC7"
        icon="notebook-edit-outline"
        subtitle={t('contraceptionJournalEntry.notes.heroSubtitle')}
        tint="#EEE7FA"
        title={t('contraceptionJournalEntry.notes.heroTitle')}
      />

      <AwaCard padding="none" variant="filled" style={styles.card}>
        <SectionHeader
          icon="notebook-edit-outline"
          subtitle={t('contraceptionJournalEntry.notes.sectionSubtitle')}
          title={t('contraceptionJournalEntry.notes.sectionTitle')}
        />

        <PremiumTextArea
          large
          maxLength={1000}
          onChangeText={setNote}
          placeholder={t('contraceptionJournalEntry.notes.placeholder')}
          value={note}
        />
      </AwaCard>
    </>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

export default function ContraceptionJournalEntryScreen(): React.JSX.Element | null {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const route = useRoute<Props>();
  const {category} = route.params;
  const requestedDate = route.params.date;

  const item = CONTRACEPTION_JOURNAL_ITEMS.find(entry => entry.key === category);

  const [contraceptionPrefs] = useState(getContraceptionPreferences);
  const method = contraceptionPrefs.method;
  const isEventMethod = method === 'ring' || method === 'patch';
  const eventTypes = method ? CONTRACEPTION_METHOD_EVENT_TYPES[method] ?? [] : [];

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {today, todayKey} = useToday();

  // M21 — ONLY "Effets ressentis" (general tracking data, no effect on any
  // schedule or adherence figure) can be written to an explicit PAST day, when
  // opened from the Calendar's selected day. Intake (taken/late/missed pill,
  // ring/patch events) stays strictly today-only and "Notes du jour" too (its
  // PIN-unlock redirect does not carry a date). A future date is never
  // accepted.
  const entryDateKey =
    category === 'feelings' && requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : todayKey;
  const isFutureEntryDate = entryDateKey > todayKey;
  const isPastEntryDate = entryDateKey < todayKey;
  const dayWord = isPastEntryDate
    ? t('contraceptionJournalEntry.feelings.dayWordPast')
    : t('contraceptionJournalEntry.feelings.dayWordToday');

  const todaySubtitle = React.useMemo(
    () =>
      entryDateKey === todayKey
        ? t('contraceptionJournalEntry.todayLabel', {date: formatToday(today)})
        : formatToday(new Date(`${entryDateKey}T12:00:00`)),
    [entryDateKey, todayKey, today, t],
  );

  const intakeActionLabel = method
    ? contraceptionIntakeActionLabels(t)[method]
    : contraceptionDefaultIntakeActionLabel(t);

  const [status, setStatus] = useState<ContraceptionIntakeStatus | undefined>(undefined);
  const [intakeLoaded, setIntakeLoaded] = useState(false);
  const [eventType, setEventType] = useState<ContraceptionEventType | undefined>(undefined);
  const [todayEvents, setTodayEvents] = useState<ContraceptionEvent[]>([]);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // "Notes du jour" reuses the app's single existing intimacy PIN/biometric
  // gate (Cycle "Vie intime" / TTC "Rapports") — never a Contraception-
  // specific PIN. Computed once on mount so a locked Notes screen never
  // flashes its content before the redirect effect below fires; `intake`
  // and `feelings` are never gated.
  const [notesUnlocked] = useState(() => category !== 'notes' || isIntimacyUnlocked());

  useEffect(() => {
    if (category === 'notes' && !isIntimacyUnlocked()) {
      navigation.replace('PrivateIntimacyUnlock', {target: 'contraceptionNotes'});
    }
  }, [category, navigation]);

  useEffect(() => {
    let active = true;

    if (category === 'intake' && isEventMethod) {
      hydrateContraceptionEvents().then(() => {
        if (active) {
          // Method-isolation: a date can hold real events from a PREVIOUS
          // method (e.g. old Patch events never deleted on a method
          // switch) — only today's CURRENT-method events belong in this
          // "already recorded today" summary.
          setTodayEvents(
            getContraceptionEventsForDate(todayKey).filter(event =>
              isContraceptionEventForMethod(event.type, method),
            ),
          );
        }
      });
      return () => {active = false;};
    }

    if (category === 'intake') {
      hydrateContraceptionIntakeHistory().then(() => {
        if (active) {
          setStatus(getContraceptionIntakeRecord(todayKey)?.status);
          setIntakeLoaded(true);
        }
      });
      return () => {active = false;};
    }

    hydrateContraceptionJournal().then(() => {
      if (!active) {return;}
      const entry = getContraceptionJournalEntry(entryDateKey);
      setFeelings(entry?.feelings ?? []);
      // Never load the real note text into state while the private section
      // is locked — notesUnlocked was already computed once at mount, so
      // this stays consistent for the lifetime of a locked screen (which
      // redirects away before the user could act on it anyway).
      if (notesUnlocked) {
        setNotes(entry?.notes ?? '');
      }
    });

    return () => {active = false;};
  }, [category, isEventMethod, method, todayKey, entryDateKey, notesUnlocked]);

  // A BREAK day of a CYCLIC pill schedule (same predicate as the Dashboard,
  // Calendar and Statistics): nothing is expected, so the normal
  // taken / late / missed choice is NEVER offered (also while the intake
  // history is still hydrating, and also when a status already exists — that
  // earlier record stays visible as read-only information, no new intake
  // action is proposed and nothing is written from here).
  const isPillBreakDayToday =
    method === 'pill' &&
    isPillBreakDateKey(todayKey, contraceptionPrefs.methodStartDate, getCyclicPillSchedule(contraceptionPrefs));

  const toggleFeeling = (option: string) => {
    setFeelings(current =>
      current.includes(option)
        ? current.filter(value => value !== option)
        : [...current, option],
    );
  };

  const save = async () => {
    setError('');

    if (category === 'intake' && isEventMethod) {
      if (!eventType) {
        setError(t('contraceptionJournalEntry.errors.chooseBeforeSaving'));
        return;
      }
      setSaving(true);
      try {
        await addContraceptionEvent(todayKey, eventType);
        navigation.goBack();
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'intake') {
      if (isPillBreakDayToday) {
        // Defensive: the break-day panel has no intake action, but never
        // write a taken/late/missed record for a day nothing is expected.
        navigation.goBack();
        return;
      }
      if (!status) {
        setError(t('contraceptionJournalEntry.errors.chooseBeforeSaving'));
        return;
      }
      setSaving(true);
      try {
        await setContraceptionIntakeStatus(
          todayKey,
          status,
          method === 'pill' || method === 'other' ? method : undefined,
        );
        navigation.goBack();
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'feelings') {
      // Emptying a selection that was already saved CLEARS it (the user is
      // correcting an accidental entry); an empty selection with nothing
      // saved has nothing to save.
      if (isFutureEntryDate) {
        setError(t('contraceptionJournalEntry.errors.futureDate'));
        return;
      }
      const hasSavedFeelings = (getContraceptionJournalEntry(entryDateKey)?.feelings?.length ?? 0) > 0;
      if (feelings.length === 0 && !hasSavedFeelings) {
        setError(t('contraceptionJournalEntry.errors.chooseAtLeastOne'));
        return;
      }
      setSaving(true);
      try {
        if (feelings.length === 0) {
          await clearContraceptionJournalField(entryDateKey, 'feelings');
        } else {
          await saveContraceptionJournalField(entryDateKey, 'feelings', feelings);
        }
        navigation.goBack();
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Same for the (encrypted) note: emptying a saved note deletes it.
    const hasSavedNote = Boolean(getContraceptionJournalEntry(todayKey)?.notes);
    if (!notes.trim() && !hasSavedNote) {
      setError(t('contraceptionJournalEntry.errors.addNoteBeforeSaving'));
      return;
    }
    setSaving(true);
    try {
      if (!notes.trim()) {
        await clearContraceptionJournalField(todayKey, 'notes');
      } else {
        await saveContraceptionJournalField(todayKey, 'notes', notes.trim());
      }
      navigation.goBack();
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  if (category === 'feelings') {
    return (
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon={item?.icon ?? 'heart-pulse'}
        onSave={save}
        saving={saving}
        subtitle={todaySubtitle}
        tint="#F1E8F5"
        title={t('contraceptionJournalConfig.feelings.label')}>
        <FeelingsContent dayWord={dayWord} selected={feelings} toggle={toggleFeeling} />
      </PostpartumJournalScreenLayout>
    );
  }

  if (category === 'notes') {
    if (!notesUnlocked) {
      return null;
    }
    return (
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon={item?.icon ?? 'notebook-edit-outline'}
        onSave={save}
        saving={saving}
        subtitle={todaySubtitle}
        tint="#E8DDF8"
        title={t('contraceptionJournalConfig.notes.label')}>
        <NotesContent note={notes} setNote={setNotes} />
      </PostpartumJournalScreenLayout>
    );
  }

  if (isEventMethod) {
    return (
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon="check-circle-outline"
        onSave={save}
        saving={saving}
        subtitle={todaySubtitle}
        tint={GREEN_LIGHT}
        title={intakeActionLabel}>
        <EventTypeContent
          eventTypes={eventTypes}
          heroSubtitle={t('contraceptionJournalEntry.intake.statusSubtitle')}
          heroTitle={intakeActionLabel}
          onSelect={setEventType}
          selected={eventType}
          todayEvents={todayEvents}
        />
      </PostpartumJournalScreenLayout>
    );
  }

  if (isPillBreakDayToday) {
    return (
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon="pause-circle-outline"
        onSave={navigation.goBack}
        saving={false}
        subtitle={todaySubtitle}
        tint={GREEN_LIGHT}
        title={t('contraceptionJournalEntry.breakDay.title')}>
        <PostpartumInfoPanel
          icon="information-outline"
          text={t('contraceptionJournalEntry.breakDay.infoText')}
          title={t('contraceptionJournalEntry.breakDay.title')}
        />
        {intakeLoaded && status !== undefined ? (
          <PostpartumInfoPanel
            icon="check-circle-outline"
            text={t('contraceptionJournalEntry.breakDay.alreadyRecorded', {status: contraceptionIntakeStatusLabels(t)[status]})}
            title={t('contraceptionJournalEntry.breakDay.alreadyRecordedTitle')}
          />
        ) : null}
      </PostpartumJournalScreenLayout>
    );
  }

  return (
    <PostpartumJournalScreenLayout
      compact
      error={error}
      icon="check-circle-outline"
      onSave={save}
      saving={saving}
      subtitle={todaySubtitle}
      tint={GREEN_LIGHT}
      title={intakeActionLabel}>
      <IntakeStatusContent
        heroSubtitle={t('contraceptionJournalEntry.intake.statusSubtitle')}
        heroTitle={intakeActionLabel}
        onSelect={setStatus}
        status={status}
      />
    </PostpartumJournalScreenLayout>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.987}],
  },

  card: {marginBottom: 18, padding: 17},

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  sectionIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 16,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {color: theme.colors.accent},

  sectionSubtitle: {marginTop: 3},

  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 19,
  },



  heroLargeIconRing: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.48),
  },

  heroLargeIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },

  heroCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 15,
  },

  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  heroEyebrowDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 3,
  },

  heroEyebrow: {},

  heroTitle: {color: theme.colors.accent},

  heroSubtitle: {marginTop: 5},

  statusChoiceList: {
    gap: 12,
  },

  statusChoice: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.028,
    shadowRadius: 8,
    elevation: 1,
  },

  // STATUS SEMANTIC — taken/late/missed borders, fills and shadow tints stay
  // fixed against GREEN/ORANGE/DANGER (never theme-derived); see the
  // module-level comment at the top of this file.
  statusChoiceTakenActive: {
    borderColor: 'rgba(66,166,106,0.50)',
    backgroundColor: softToneOpaque(theme, '#F1FAF4', GREEN, theme.colors.surface),
    // One flat surface: no shadow on the selected card (a shadow on a tinted fill shows as a dark block behind the text).
    shadowOpacity: 0,
    elevation: 0,
  },

  statusChoiceLateActive: {
    borderColor: 'rgba(199,123,46,0.46)',
    backgroundColor: softToneOpaque(theme, '#FFF7ED', ORANGE, theme.colors.surface),
    // One flat surface: no shadow on the selected card (a shadow on a tinted fill shows as a dark block behind the text).
    shadowOpacity: 0,
    elevation: 0,
  },

  statusChoiceMissedActive: {
    borderColor: 'rgba(217,97,118,0.46)',
    backgroundColor: softToneOpaque(theme, '#FFF3F5', DANGER, theme.colors.surface),
    // One flat surface: no shadow on the selected card (a shadow on a tinted fill shows as a dark block behind the text).
    shadowOpacity: 0,
    elevation: 0,
  },

  // A round 40 dp icon holder (it was a 44 dp rounded square). Selected, it keeps the status colour as a soft tint with a
  // thin ring and a coloured glyph instead of a solid saturated fill with a white glyph, so the icon no longer dominates
  // the option while taken / late / missed still read green / amber / red.
  statusChoiceIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },

  statusChoiceIconTakenActive: {
    borderColor: withAlpha(GREEN, 0.5),
    backgroundColor: withAlpha(GREEN, 0.16),
  },

  statusChoiceIconLateActive: {
    borderColor: withAlpha(ORANGE, 0.5),
    backgroundColor: withAlpha(ORANGE, 0.16),
  },

  statusChoiceIconMissedActive: {
    borderColor: withAlpha(DANGER, 0.5),
    backgroundColor: withAlpha(DANGER, 0.16),
  },

  statusChoiceCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },

  statusChoiceText: {
    color: theme.colors.accent,
    fontSize: 12.7,
    lineHeight: 17,
    fontWeight: '800',
  },

  statusChoiceTextActive: {
    fontWeight: '900',
  },

  statusChoiceSubtitle: {marginTop: 2},

  radioOuter: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.7,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  radioOuterActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  chip: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 2,
  },

  chipText: {
    color: theme.colors.accent,
    fontSize: 11.6,
    lineHeight: 15,
    fontWeight: '700',
  },

  chipTextActive: {
    color: onPrimaryTextColor(theme),
  },

  chipCheck: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: withAlpha(onPrimaryTextColor(theme), 0.23),
  },

  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(66,166,106,0.13)',
    borderRadius: 16,
    backgroundColor: softTone(theme, GREEN_LIGHT, GREEN),
  },

  selectedSummaryIcon: {
    width: 29,
    height: 29,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  selectedSummaryText: {flex: 1, minWidth: 0, paddingTop: 4, color: softToneInk(theme, '#3B6B48')},

  noteBox: {
    overflow: 'hidden',
    minHeight: 136,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.13),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  noteBoxFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },

  noteBoxLarge: {
    minHeight: 224,
  },

  noteInput: {
    minHeight: 98,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    color: theme.colors.accent,
    fontSize: 12.5,
    lineHeight: 19,
  },

  noteInputLarge: {
    minHeight: 184,
  },

  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },

  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },


  });
}
