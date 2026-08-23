import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';

import {
  PostpartumInfoPanel,
  PostpartumJournalScreenLayout,
} from '../../components/postpartum/PostpartumJournalScreenLayout';

import {homeColors} from '../../components/home/homeTheme';

import type {RootStackParamList} from '../../navigation/AppNavigator';

import {
  CONTRACEPTION_FEELINGS_OPTIONS,
  CONTRACEPTION_JOURNAL_ITEMS,
} from '../../config/contraceptionJournalConfig';

import {
  CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL,
  CONTRACEPTION_EVENT_ICONS,
  CONTRACEPTION_EVENT_LABELS,
  CONTRACEPTION_INTAKE_ACTION_LABEL,
  CONTRACEPTION_INTAKE_STATUS_LABELS,
  CONTRACEPTION_METHOD_EVENT_TYPES,
} from '../../config/contraceptionLabels';

import {
  getContraceptionPreferences,
} from '../../state/contraceptionPreferences';

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
  saveContraceptionJournalField,
} from '../../state/contraceptionJournalStore';

const PURPLE = homeColors.primary;
const PURPLE_DARK = homeColors.textPrimary;
const TEXT_SECONDARY = homeColors.textSecondary;

const LAVENDER = '#F1EAFB';

const GREEN = '#42A66A';
const GREEN_LIGHT = '#EDF8F1';

const ORANGE = '#C77B2E';
const ORANGE_LIGHT = '#FFF0E3';

const DANGER = '#D96176';


type Props = RouteProp<RootStackParamList, 'ContraceptionJournalEntry'>;

function formatToday(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/* ============================================================
   SMALL SECTION HEADER
============================================================ */

function SectionHeader({
  title,
  subtitle,
  icon,
  color = PURPLE,
  tint = LAVENDER,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  color?: string;
  tint?: string;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, {backgroundColor: tint}]}>
        <MaterialDesignIcons color={color} name={icon} size={18} />
      </View>

      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
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
        placeholderTextColor="#A094AE"
        style={[styles.noteInput, large && styles.noteInputLarge]}
        textAlignVertical="top"
        value={value}
      />

      <View style={styles.noteFooter}>
        <View style={styles.privatePill}>
          <MaterialDesignIcons color={PURPLE} name="lock-outline" size={11} />
          <Text style={styles.privatePillText}>Privé</Text>
        </View>

        <Text style={styles.noteCounter}>{value.length}/{maxLength}</Text>
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
  accent = PURPLE,
  tint = '#F0E7FB',
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  accent?: string;
  tint?: string;
}): React.JSX.Element {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F3FD', tint]}
      locations={[0, 0.58, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.hero}>
      <View pointerEvents="none" style={styles.heroGlow} />
      <View pointerEvents="none" style={styles.heroGlowSecondary} />

      <View style={[styles.heroLargeIconRing, {borderColor: `${accent}26`}]}>
        <View style={styles.heroLargeIcon}>
          <MaterialDesignIcons color={accent} name={icon} size={29} />
        </View>
      </View>

      <View style={styles.heroCopy}>
        <View style={styles.heroEyebrowRow}>
          <View style={[styles.heroEyebrowDot, {backgroundColor: accent}]} />
          <Text style={[styles.heroEyebrow, {color: accent}]}>SUIVI DU JOUR</Text>
        </View>

        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
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
  return (
    <>
      <PremiumHero
        icon="calendar-check-outline"
        subtitle={heroSubtitle}
        title={heroTitle}
      />

      <View style={styles.card}>
        <SectionHeader
          icon="calendar-today"
          subtitle="Choisis ce qui correspond le mieux à ta journée"
          title="Aujourd’hui"
        />

        <View style={styles.statusChoiceList}>
          <Pressable
            accessibilityLabel={CONTRACEPTION_INTAKE_STATUS_LABELS.taken}
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
                color={status === 'taken' ? '#FFFFFF' : GREEN}
                name="check-bold"
                size={20}
              />
            </View>

            <View style={styles.statusChoiceCopy}>
              <Text style={[styles.statusChoiceText, status === 'taken' && styles.statusChoiceTextActive]}>
                {CONTRACEPTION_INTAKE_STATUS_LABELS.taken}
              </Text>
              <Text style={styles.statusChoiceSubtitle}>Enregistre l’utilisation comme effectuée aujourd’hui</Text>
            </View>

            <View style={[styles.radioOuter, status === 'taken' && styles.radioOuterActive]}>
              {status === 'taken' ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel={CONTRACEPTION_INTAKE_STATUS_LABELS.late}
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
                color={status === 'late' ? '#FFFFFF' : ORANGE}
                name="clock-alert-outline"
                size={20}
              />
            </View>

            <View style={styles.statusChoiceCopy}>
              <Text style={[styles.statusChoiceText, status === 'late' && styles.statusChoiceTextActive]}>
                {CONTRACEPTION_INTAKE_STATUS_LABELS.late}
              </Text>
              <Text style={styles.statusChoiceSubtitle}>Garde une trace d’un retard dans ton suivi</Text>
            </View>

            <View style={[styles.radioOuter, status === 'late' && styles.radioOuterActive]}>
              {status === 'late' ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel={CONTRACEPTION_INTAKE_STATUS_LABELS.missed}
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
                color={status === 'missed' ? '#FFFFFF' : DANGER}
                name="alert-outline"
                size={20}
              />
            </View>

            <View style={styles.statusChoiceCopy}>
              <Text style={[styles.statusChoiceText, status === 'missed' && styles.statusChoiceTextActive]}>
                {CONTRACEPTION_INTAKE_STATUS_LABELS.missed}
              </Text>
              <Text style={styles.statusChoiceSubtitle}>Signale simplement un oubli pour aujourd’hui</Text>
            </View>

            <View style={[styles.radioOuter, status === 'missed' && styles.radioOuterActive]}>
              {status === 'missed' ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>
        </View>
      </View>

      <PostpartumInfoPanel
        icon="information-outline"
        text="Ce suivi t’aide à garder une trace claire, jour après jour."
        title="Ton suivi"
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
  return (
    <>
      <PremiumHero
        icon="calendar-check-outline"
        subtitle={heroSubtitle}
        title={heroTitle}
      />

      <View style={styles.card}>
        <SectionHeader
          icon="calendar-today"
          subtitle="Choisis ce qui correspond le mieux à ta journée"
          title="Aujourd’hui"
        />

        <View style={styles.statusChoiceList}>
          {eventTypes.map(type => {
            const active = selected === type;
            return (
              <Pressable
                accessibilityLabel={CONTRACEPTION_EVENT_LABELS[type]}
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
                    {CONTRACEPTION_EVENT_LABELS[type]}
                  </Text>
                  <Text style={styles.statusChoiceSubtitle}>Ajouter cet événement à ton suivi du jour</Text>
                </View>

                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {todayEvents.length > 0 ? (
        <View style={styles.selectedSummary}>
          <View style={styles.selectedSummaryIcon}>
            <MaterialDesignIcons color={GREEN} name="check" size={12} />
          </View>
          <Text style={styles.selectedSummaryText}>
            Déjà enregistré aujourd’hui : {todayEvents.map(event => CONTRACEPTION_EVENT_LABELS[event.type]).join(', ')}
          </Text>
        </View>
      ) : null}

      <PostpartumInfoPanel
        icon="information-outline"
        text="Ce suivi t’aide à garder une trace claire, jour après jour."
        title="Ton suivi"
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
}: {
  selected: string[];
  toggle: (option: string) => void;
}): React.JSX.Element {
  return (
    <>
      <PremiumHero
        accent="#8B5FC7"
        icon="heart-pulse"
        subtitle="Sélectionne ce que tu as ressenti aujourd’hui — cela reste un suivi personnel, jamais un diagnostic."
        tint="#F2EAF8"
        title="Comment te sens-tu ?"
      />

      <View style={styles.card}>
        <SectionHeader
          icon="clipboard-pulse-outline"
          subtitle="Tu peux en sélectionner plusieurs"
          title="Effets ressentis"
        />

        <View style={styles.chipsWrap}>
          {CONTRACEPTION_FEELINGS_OPTIONS.map(option => {
            const active = selected.includes(option);
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="checkbox"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => toggle(option)}
                style={({pressed}) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
                {active ? (
                  <View style={styles.chipCheck}>
                    <MaterialDesignIcons color="#FFFFFF" name="check" size={10} />
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
            <Text style={styles.selectedSummaryText}>
              {selected.length} élément{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <PostpartumInfoPanel
        icon="shield-check-outline"
        text="Ce suivi t’appartient — il n’émet aucune interprétation médicale."
        title="Suivi personnel"
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
  return (
    <>
      <PremiumHero
        accent="#7C5AC7"
        icon="notebook-edit-outline"
        subtitle="Un endroit privé pour ce que tu souhaites garder."
        tint="#EEE7FA"
        title="Ton espace personnel"
      />

      <View style={styles.card}>
        <SectionHeader
          icon="notebook-edit-outline"
          subtitle="Écris librement, à ton rythme"
          title="Ce que je souhaite noter"
        />

        <PremiumTextArea
          large
          maxLength={1000}
          onChangeText={setNote}
          placeholder="Ajoute une information personnelle sur ta journée…"
          value={note}
        />
      </View>
    </>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

export default function ContraceptionJournalEntryScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<Props>();
  const {category} = route.params;

  const item = CONTRACEPTION_JOURNAL_ITEMS.find(entry => entry.key === category);

  const [method] = useState(() => getContraceptionPreferences().method);
  const isEventMethod = method === 'ring' || method === 'patch';
  const eventTypes = method ? CONTRACEPTION_METHOD_EVENT_TYPES[method] ?? [] : [];

  const todayKey = React.useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const todaySubtitle = React.useMemo(() => `Aujourd’hui  •  ${formatToday()}`, []);

  const intakeActionLabel = method
    ? CONTRACEPTION_INTAKE_ACTION_LABEL[method]
    : CONTRACEPTION_DEFAULT_INTAKE_ACTION_LABEL;

  const [status, setStatus] = useState<ContraceptionIntakeStatus | undefined>(undefined);
  const [eventType, setEventType] = useState<ContraceptionEventType | undefined>(undefined);
  const [todayEvents, setTodayEvents] = useState<ContraceptionEvent[]>([]);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (category === 'intake' && isEventMethod) {
      hydrateContraceptionEvents().then(() => {
        if (active) {
          setTodayEvents(getContraceptionEventsForDate(todayKey));
        }
      });
      return () => {active = false;};
    }

    if (category === 'intake' || category === 'missedOrLate') {
      hydrateContraceptionIntakeHistory().then(() => {
        if (active) {
          setStatus(getContraceptionIntakeRecord(todayKey)?.status);
        }
      });
      return () => {active = false;};
    }

    hydrateContraceptionJournal().then(() => {
      if (!active) {return;}
      const entry = getContraceptionJournalEntry(todayKey);
      setFeelings(entry?.feelings ?? []);
      setNotes(entry?.notes ?? '');
    });

    return () => {active = false;};
  }, [category, isEventMethod, todayKey]);

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
        setError('Choisis une réponse avant d’enregistrer.');
        return;
      }
      setSaving(true);
      try {
        await addContraceptionEvent(todayKey, eventType);
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'intake' || category === 'missedOrLate') {
      if (!status) {
        setError('Choisis une réponse avant d’enregistrer.');
        return;
      }
      setSaving(true);
      try {
        await setContraceptionIntakeStatus(todayKey, status);
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'feelings') {
      if (feelings.length === 0) {
        setError('Choisis au moins un élément avant d’enregistrer.');
        return;
      }
      setSaving(true);
      try {
        await saveContraceptionJournalField(todayKey, 'feelings', feelings);
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!notes.trim()) {
      setError('Ajoute une note avant d’enregistrer.');
      return;
    }
    setSaving(true);
    try {
      await saveContraceptionJournalField(todayKey, 'notes', notes.trim());
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  // Defense-in-depth: ring/patch don't have a daily taken/missed/late status
  // (they log discrete events instead — see EventTypeContent above), so this
  // category should never actually be reached for them. MainTabNavigator's
  // journal-sheet and ContraceptionDashboard's "Oubli ou retard" row both
  // already avoid navigating here for those methods, but if this route is
  // ever reached anyway (e.g. a stale back-navigation), redirect out rather
  // than rendering a pill-shaped status screen that would write into
  // contraceptionIntakeHistoryStore.ts — the wrong store for these methods.
  useEffect(() => {
    if (category === 'missedOrLate' && isEventMethod) {
      navigation.goBack();
    }
  }, [category, isEventMethod, navigation]);

  if (category === 'missedOrLate' && isEventMethod) {
    return <></>;
  }

  if (category === 'missedOrLate') {
    return (
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon={item?.icon ?? 'alert-outline'}
        onSave={save}
        saving={saving}
        subtitle={todaySubtitle}
        tint={ORANGE_LIGHT}
        title="Oubli ou retard">
        <IntakeStatusContent
          heroSubtitle={`Signale un oubli ou un retard pour : ${intakeActionLabel.toLowerCase()}.`}
          heroTitle="Un oubli, un retard ?"
          onSelect={setStatus}
          status={status}
        />
      </PostpartumJournalScreenLayout>
    );
  }

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
        title="Effets ressentis">
        <FeelingsContent selected={feelings} toggle={toggleFeeling} />
      </PostpartumJournalScreenLayout>
    );
  }

  if (category === 'notes') {
    return (
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon={item?.icon ?? 'notebook-edit-outline'}
        onSave={save}
        saving={saving}
        subtitle={todaySubtitle}
        tint="#E8DDF8"
        title="Notes du jour">
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
          heroSubtitle="Enregistre ton suivi d’aujourd’hui."
          heroTitle={intakeActionLabel}
          onSelect={setEventType}
          selected={eventType}
          todayEvents={todayEvents}
        />
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
        heroSubtitle="Enregistre ton suivi d’aujourd’hui."
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

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.987}],
  },

  card: {
    marginBottom: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.985)',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.075,
    shadowRadius: 18,
    elevation: 4,
  },

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
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 17.5,
    lineHeight: 22,
    fontWeight: '900',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: TEXT_SECONDARY,
    fontSize: 10.2,
    lineHeight: 14.5,
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 19,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
    borderRadius: 30,
    shadowColor: '#5A3FA2',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.075,
    shadowRadius: 17,
    elevation: 3,
  },

  heroGlow: {
    position: 'absolute',
    top: -65,
    right: -40,
    width: 175,
    height: 175,
    borderRadius: 88,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },

  heroGlowSecondary: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: 'rgba(105,73,190,0.055)',
  },

  heroLargeIconRing: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },

  heroLargeIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4E319A',
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

  heroEyebrow: {
    fontSize: 8.6,
    letterSpacing: 0.8,
    fontWeight: '900',
  },

  heroTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 18.5,
    lineHeight: 24,
    fontWeight: '900',
  },

  heroSubtitle: {
    marginTop: 5,
    color: TEXT_SECONDARY,
    fontSize: 10.5,
    lineHeight: 15.5,
  },

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
    borderColor: 'rgba(105,73,190,0.10)',
    borderRadius: 21,
    backgroundColor: '#FCFAFE',
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.028,
    shadowRadius: 8,
    elevation: 1,
  },

  statusChoiceTakenActive: {
    borderColor: 'rgba(66,166,106,0.50)',
    backgroundColor: '#F1FAF4',
    shadowColor: GREEN,
    shadowOpacity: 0.09,
    elevation: 2,
  },

  statusChoiceLateActive: {
    borderColor: 'rgba(199,123,46,0.46)',
    backgroundColor: '#FFF7ED',
    shadowColor: ORANGE,
    shadowOpacity: 0.08,
    elevation: 2,
  },

  statusChoiceMissedActive: {
    borderColor: 'rgba(217,97,118,0.46)',
    backgroundColor: '#FFF3F5',
    shadowColor: DANGER,
    shadowOpacity: 0.08,
    elevation: 2,
  },

  statusChoiceIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  statusChoiceIconTakenActive: {
    borderColor: GREEN,
    backgroundColor: GREEN,
  },

  statusChoiceIconLateActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },

  statusChoiceIconMissedActive: {
    borderColor: DANGER,
    backgroundColor: DANGER,
  },

  statusChoiceCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },

  statusChoiceText: {
    color: PURPLE_DARK,
    fontSize: 12.7,
    lineHeight: 17,
    fontWeight: '800',
  },

  statusChoiceTextActive: {
    fontWeight: '900',
  },

  statusChoiceSubtitle: {
    marginTop: 2,
    color: TEXT_SECONDARY,
    fontSize: 9.1,
    lineHeight: 13,
  },

  radioOuter: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.7,
    borderColor: '#CABDD9',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  radioOuterActive: {
    borderColor: PURPLE,
    backgroundColor: '#F5EFFB',
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: PURPLE,
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
    borderColor: 'rgba(105,73,190,0.11)',
    borderRadius: 18,
    backgroundColor: '#FCFAFE',
  },

  chipActive: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 2,
  },

  chipText: {
    color: PURPLE_DARK,
    fontSize: 11.6,
    lineHeight: 15,
    fontWeight: '700',
  },

  chipTextActive: {
    color: '#FFFFFF',
  },

  chipCheck: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.23)',
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
    backgroundColor: GREEN_LIGHT,
  },

  selectedSummaryIcon: {
    width: 29,
    height: 29,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  selectedSummaryText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
    color: '#3B6B48',
    fontSize: 9.9,
    lineHeight: 14,
    fontWeight: '700',
  },

  noteBox: {
    overflow: 'hidden',
    minHeight: 136,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.13)',
    borderRadius: 22,
    backgroundColor: '#FCFAFE',
  },

  noteBoxFocused: {
    borderColor: PURPLE,
    backgroundColor: '#FFFFFF',
    shadowColor: PURPLE,
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
    color: PURPLE_DARK,
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
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 10,
    backgroundColor: LAVENDER,
  },

  privatePillText: {
    color: PURPLE,
    fontSize: 8.4,
    fontWeight: '800',
  },

  noteCounter: {
    color: TEXT_SECONDARY,
    fontSize: 8.8,
    fontWeight: '600',
  },
});