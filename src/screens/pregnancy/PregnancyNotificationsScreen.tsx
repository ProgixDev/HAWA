import React, {useCallback, useState} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {homeColors} from '../../components/home/homeTheme';
import {getBottomPadding, spacing} from '../../theme/spacing';
import {
  getPregnancyNotificationSettings,
  hydratePregnancyNotificationSettings,
  setPregnancyNotificationSettings,
  type PregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {
  deleteHealthReminder,
  getHealthReminders,
  saveHealthReminder,
  type HealthReminder,
  type HealthReminderKind,
} from '../../state/pregnancyHealthRemindersStore';
import {
  deleteCustomReminder,
  getCustomReminders,
  saveCustomReminder,
  type CustomReminder,
  type CustomReminderRepeat,
} from '../../state/pregnancyCustomRemindersStore';
import {REMINDER_OFFSETS, REMINDER_OFFSET_LABELS} from '../../utils/pregnancyEventReminders';
import {
  cancelCustomReminderNotification,
  cancelHealthReminderNotification,
  resyncAllPregnancyNotifications,
  syncCustomReminder,
  syncHealthReminder,
} from '../../utils/pregnancyReminderScheduling';
import type {PregnancyReminderOffset} from '../../state/pregnancyMedicalEventsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'PregnancyNotifications'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const CUSTOM_REPEAT_OPTIONS: {key: CustomReminderRepeat; label: string}[] = [
  {key: 'once', label: 'Une fois'},
  {key: 'daily', label: 'Tous les jours'},
  {key: 'weekly', label: 'Chaque semaine'},
];

function toISODate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatTimeValue(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(date);
}

function parseTimeToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
}

/* ============================================================
   SHARED UI PIECES
============================================================ */

function SectionHeader({icon, title, subtitle}: {icon: IconName; title: string; subtitle?: string}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialDesignIcons color={homeColors.primary} name={icon} size={21} />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleHeaderRow}>
        <View style={styles.fieldIcon}>
          <MaterialDesignIcons color={homeColors.primary} name={icon} size={18} />
        </View>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleDescription}>{description}</Text>
        </View>
        <Switch
          ios_backgroundColor="#E2D8F0"
          onValueChange={onValueChange}
          thumbColor="#FFFFFF"
          trackColor={{false: '#E2D8F0', true: homeColors.primary}}
          value={value}
        />
      </View>
      {value && children ? <View style={styles.toggleBody}>{children}</View> : null}
    </View>
  );
}

function OffsetPicker({
  value,
  onChange,
}: {
  value: PregnancyReminderOffset;
  onChange: (value: PregnancyReminderOffset) => void;
}): React.JSX.Element {
  return (
    <View style={styles.chips}>
      {REMINDER_OFFSETS.map(option => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{selected: value === option}}
          key={option}
          onPress={() => onChange(option)}
          style={[styles.chip, value === option && styles.chipActive]}>
          <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{REMINDER_OFFSET_LABELS[option]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ReminderListRow({
  icon,
  title,
  meta,
  enabled,
  onToggle,
  onPress,
  onDelete,
}: {
  icon: IconName;
  title: string;
  meta: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onPress: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.listRow, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <MaterialDesignIcons color={homeColors.primary} name={icon} size={18} />
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.rowMeta}>{meta}</Text>
      </View>
      <Switch
        ios_backgroundColor="#E2D8F0"
        onValueChange={onToggle}
        thumbColor="#FFFFFF"
        trackColor={{false: '#E2D8F0', true: homeColors.primary}}
        value={enabled}
      />
      <Pressable accessibilityLabel={`Supprimer ${title}`} hitSlop={8} onPress={onDelete} style={styles.rowDelete}>
        <MaterialDesignIcons color="#A8505A" name="trash-can-outline" size={17} />
      </Pressable>
    </Pressable>
  );
}

function EmptyRow({text}: {text: string}): React.JSX.Element {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.textFieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A79BC7"
        style={[styles.textInput, multiline && styles.textInputMultiline]}
        value={value}
      />
    </View>
  );
}

function FieldRow({icon, label, value, active, onPress}: {icon: IconName; label: string; value: string; active: boolean; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.field, active && styles.fieldActive, pressed && styles.pressed]}>
      <View style={styles.fieldIcon}>
        <MaterialDesignIcons color={homeColors.primary} name={icon} size={18} />
      </View>
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      <MaterialDesignIcons color={homeColors.textSecondary} name={active ? 'chevron-up' : 'chevron-down'} size={20} />
    </Pressable>
  );
}

/* ============================================================
   HEALTH REMINDER MODAL (vitamins & médicaments)
============================================================ */

type HealthDraft = {
  id: string | null;
  kind: HealthReminderKind;
  name: string;
  time: Date;
  startDate: Date;
  endDate: Date | null;
  enabled: boolean;
};

function emptyHealthDraft(kind: HealthReminderKind): HealthDraft {
  const time = new Date();
  time.setHours(9, 0, 0, 0);
  return {id: null, kind, name: '', time, startDate: new Date(), endDate: null, enabled: true};
}

function HealthReminderModal({
  draft,
  onChange,
  onSave,
  onDismiss,
  onDelete,
}: {
  draft: HealthDraft;
  onChange: (draft: HealthDraft) => void;
  onSave: () => void;
  onDismiss: () => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const [activePicker, setActivePicker] = useState<'time' | 'start' | 'end' | null>(null);
  const isMedication = draft.kind === 'medication';

  return (
    <Modal animationType="slide" onRequestClose={onDismiss} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{isMedication ? 'Rappel de médicament' : 'Rappel de vitamine'}</Text>

            <TextField
              label="Nom"
              onChangeText={name => onChange({...draft, name})}
              placeholder={isMedication ? 'Ex. Fer' : 'Ex. Acide folique'}
              value={draft.name}
            />

            <FieldRow
              active={activePicker === 'time'}
              icon="clock-outline"
              label="Heure"
              onPress={() => setActivePicker(current => (current === 'time' ? null : 'time'))}
              value={formatTimeValue(draft.time)}
            />
            {activePicker === 'time' ? (
              <DateTimePicker
                display="default"
                mode="time"
                onValueChange={(_e: DateTimePickerChangeEvent, selected: Date) => {setActivePicker(null); onChange({...draft, time: selected});}}
                value={draft.time}
              />
            ) : null}

            <Text style={styles.fieldLabel}>Répétition</Text>
            <Text style={styles.staticValue}>Tous les jours</Text>

            {isMedication ? (
              <>
                <FieldRow
                  active={activePicker === 'start'}
                  icon="calendar-start"
                  label="Date de début"
                  onPress={() => setActivePicker(current => (current === 'start' ? null : 'start'))}
                  value={formatLongDate(draft.startDate)}
                />
                {activePicker === 'start' ? (
                  <DateTimePicker
                    display="default"
                    mode="date"
                    onValueChange={(_e: DateTimePickerChangeEvent, selected: Date) => {setActivePicker(null); onChange({...draft, startDate: selected});}}
                    value={draft.startDate}
                  />
                ) : null}

                <FieldRow
                  active={activePicker === 'end'}
                  icon="calendar-end"
                  label="Date de fin (optionnelle)"
                  onPress={() => setActivePicker(current => (current === 'end' ? null : 'end'))}
                  value={draft.endDate ? formatLongDate(draft.endDate) : 'Non définie'}
                />
                {activePicker === 'end' ? (
                  <DateTimePicker
                    display="default"
                    mode="date"
                    onValueChange={(_e: DateTimePickerChangeEvent, selected: Date) => {setActivePicker(null); onChange({...draft, endDate: selected});}}
                    value={draft.endDate ?? draft.startDate}
                  />
                ) : null}
                {draft.endDate ? (
                  <Pressable accessibilityRole="button" onPress={() => onChange({...draft, endDate: null})} style={styles.clearLink}>
                    <Text style={styles.clearLinkText}>Retirer la date de fin</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            <View style={styles.modalActionsRow}>
              {onDelete ? (
                <Pressable accessibilityRole="button" onPress={onDelete} style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}>
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={onDismiss} style={({pressed}) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!draft.name.trim()}
                onPress={onSave}
                style={({pressed}) => [styles.saveButton, !draft.name.trim() && styles.saveButtonDisabled, pressed && styles.pressed]}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   CUSTOM REMINDER MODAL
============================================================ */

type CustomDraft = {
  id: string | null;
  title: string;
  description: string;
  date: Date;
  time: Date;
  repeat: CustomReminderRepeat;
  enabled: boolean;
};

function emptyCustomDraft(): CustomDraft {
  const time = new Date();
  time.setHours(9, 0, 0, 0);
  return {id: null, title: '', description: '', date: new Date(), time, repeat: 'once', enabled: true};
}

function CustomReminderModal({
  draft,
  onChange,
  onSave,
  onDismiss,
  onDelete,
}: {
  draft: CustomDraft;
  onChange: (draft: CustomDraft) => void;
  onSave: () => void;
  onDismiss: () => void;
  onDelete?: () => void;
}): React.JSX.Element {
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  return (
    <Modal animationType="slide" onRequestClose={onDismiss} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Rappel personnalisé</Text>

            <TextField label="Titre" onChangeText={title => onChange({...draft, title})} placeholder="Ex. Cours de préparation" value={draft.title} />
            <TextField
              label="Description (optionnelle)"
              multiline
              onChangeText={description => onChange({...draft, description})}
              placeholder="Ajouter un détail…"
              value={draft.description}
            />

            <FieldRow
              active={activePicker === 'date'}
              icon="calendar-month-outline"
              label="Date"
              onPress={() => setActivePicker(current => (current === 'date' ? null : 'date'))}
              value={formatLongDate(draft.date)}
            />
            {activePicker === 'date' ? (
              <DateTimePicker
                display="default"
                mode="date"
                onValueChange={(_e: DateTimePickerChangeEvent, selected: Date) => {setActivePicker(null); onChange({...draft, date: selected});}}
                value={draft.date}
              />
            ) : null}

            <FieldRow
              active={activePicker === 'time'}
              icon="clock-outline"
              label="Heure"
              onPress={() => setActivePicker(current => (current === 'time' ? null : 'time'))}
              value={formatTimeValue(draft.time)}
            />
            {activePicker === 'time' ? (
              <DateTimePicker
                display="default"
                mode="time"
                onValueChange={(_e: DateTimePickerChangeEvent, selected: Date) => {setActivePicker(null); onChange({...draft, time: selected});}}
                value={draft.time}
              />
            ) : null}

            <Text style={styles.fieldLabel}>Répétition</Text>
            <View style={styles.chips}>
              {CUSTOM_REPEAT_OPTIONS.map(option => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{selected: draft.repeat === option.key}}
                  key={option.key}
                  onPress={() => onChange({...draft, repeat: option.key})}
                  style={[styles.chip, draft.repeat === option.key && styles.chipActive]}>
                  <Text style={[styles.chipText, draft.repeat === option.key && styles.chipTextActive]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              {onDelete ? (
                <Pressable accessibilityRole="button" onPress={onDelete} style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}>
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={onDismiss} style={({pressed}) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!draft.title.trim()}
                onPress={onSave}
                style={({pressed}) => [styles.saveButton, !draft.title.trim() && styles.saveButtonDisabled, pressed && styles.pressed]}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   MAIN
============================================================ */

function PregnancyNotificationsScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<PregnancyNotificationSettings>(getPregnancyNotificationSettings);
  const [healthReminders, setHealthReminders] = useState<HealthReminder[]>([]);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [dailyJournalPickerOpen, setDailyJournalPickerOpen] = useState(false);

  const [healthDraft, setHealthDraft] = useState<HealthDraft | null>(null);
  const [customDraft, setCustomDraft] = useState<CustomDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([hydratePregnancyNotificationSettings(), getHealthReminders(), getCustomReminders()]).then(
        ([settingsValue, healthValue, customValue]) => {
          if (!mounted) {return;}
          setSettings(settingsValue);
          setHealthReminders(healthValue);
          setCustomReminders(customValue);
        },
      );
      return () => {mounted = false;};
    }, []),
  );

  const persistSettings = useCallback(async (next: PregnancyNotificationSettings) => {
    setSettings(next);
    await setPregnancyNotificationSettings(next);
    resyncAllPregnancyNotifications();
  }, []);

  /* ------------------------------------------------------------
     HEALTH REMINDERS (vitamins & médicaments)
  ------------------------------------------------------------ */

  const openNewHealthReminder = (kind: HealthReminderKind) => setHealthDraft(emptyHealthDraft(kind));

  const openEditHealthReminder = (reminder: HealthReminder) => {
    setHealthDraft({
      id: reminder.id,
      kind: reminder.kind,
      name: reminder.name,
      time: parseTimeToDate(reminder.time),
      startDate: reminder.startDate ? fromISODate(reminder.startDate) : new Date(),
      endDate: reminder.endDate ? fromISODate(reminder.endDate) : null,
      enabled: reminder.enabled,
    });
  };

  const saveHealthDraft = async () => {
    if (!healthDraft || !healthDraft.name.trim()) {return;}
    const now = new Date().toISOString();
    const existing = healthDraft.id ? healthReminders.find(item => item.id === healthDraft.id) : undefined;
    const reminder: HealthReminder = {
      id: healthDraft.id ?? `pregnancy-health-${Date.now()}`,
      kind: healthDraft.kind,
      name: healthDraft.name.trim(),
      time: formatTimeValue(healthDraft.time),
      repeat: 'daily',
      startDate: healthDraft.kind === 'medication' ? toISODate(healthDraft.startDate) : undefined,
      endDate: healthDraft.kind === 'medication' && healthDraft.endDate ? toISODate(healthDraft.endDate) : undefined,
      enabled: healthDraft.enabled,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = await saveHealthReminder(reminder);
    setHealthReminders(next);
    syncHealthReminder(reminder);
    setHealthDraft(null);
  };

  const toggleHealthReminder = async (reminder: HealthReminder, enabled: boolean) => {
    const updated: HealthReminder = {...reminder, enabled, updatedAt: new Date().toISOString()};
    const next = await saveHealthReminder(updated);
    setHealthReminders(next);
    syncHealthReminder(updated);
  };

  const removeHealthReminder = (reminder: HealthReminder) => {
    Alert.alert(
      reminder.kind === 'medication' ? 'Supprimer ce médicament ?' : 'Supprimer cette vitamine ?',
      'Cette action supprimera également le rappel associé.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const next = await deleteHealthReminder(reminder.id);
            setHealthReminders(next);
            cancelHealthReminderNotification(reminder);
            setHealthDraft(null);
          },
        },
      ],
    );
  };

  /* ------------------------------------------------------------
     CUSTOM REMINDERS
  ------------------------------------------------------------ */

  const openNewCustomReminder = () => setCustomDraft(emptyCustomDraft());

  const openEditCustomReminder = (reminder: CustomReminder) => {
    setCustomDraft({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description ?? '',
      date: fromISODate(reminder.date),
      time: parseTimeToDate(reminder.time),
      repeat: reminder.repeat,
      enabled: reminder.enabled,
    });
  };

  const saveCustomDraft = async () => {
    if (!customDraft || !customDraft.title.trim()) {return;}
    const now = new Date().toISOString();
    const existing = customDraft.id ? customReminders.find(item => item.id === customDraft.id) : undefined;
    const reminder: CustomReminder = {
      id: customDraft.id ?? `pregnancy-custom-${Date.now()}`,
      title: customDraft.title.trim(),
      description: customDraft.description.trim() || undefined,
      date: toISODate(customDraft.date),
      time: formatTimeValue(customDraft.time),
      repeat: customDraft.repeat,
      enabled: customDraft.enabled,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = await saveCustomReminder(reminder);
    setCustomReminders(next);
    syncCustomReminder(reminder);
    setCustomDraft(null);
  };

  const toggleCustomReminder = async (reminder: CustomReminder, enabled: boolean) => {
    const updated: CustomReminder = {...reminder, enabled, updatedAt: new Date().toISOString()};
    const next = await saveCustomReminder(updated);
    setCustomReminders(next);
    syncCustomReminder(updated);
  };

  const removeCustomReminder = (reminder: CustomReminder) => {
    Alert.alert('Supprimer ce rappel ?', 'Cette action supprimera également le rappel associé.', [
      {text: 'Annuler', style: 'cancel'},
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteCustomReminder(reminder.id);
          setCustomReminders(next);
          cancelCustomReminderNotification(reminder);
          setCustomDraft(null);
        },
      },
    ]);
  };

  const vitamins = healthReminders.filter(item => item.kind === 'vitamin');
  const medications = healthReminders.filter(item => item.kind === 'medication');

  const healthReminderMeta = (reminder: HealthReminder): string => {
    if (reminder.kind === 'vitamin') {return `Tous les jours · ${reminder.time}`;}
    const range = reminder.endDate ? `jusqu’au ${formatLongDate(fromISODate(reminder.endDate))}` : 'sans date de fin';
    return `Tous les jours · ${reminder.time} · ${range}`;
  };

  const customReminderMeta = (reminder: CustomReminder): string => {
    const repeatLabel = CUSTOM_REPEAT_OPTIONS.find(option => option.key === reminder.repeat)?.label ?? '';
    return `${formatLongDate(fromISODate(reminder.date))} · ${reminder.time} · ${repeatLabel}`;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View style={styles.glowTop} />
        <View style={styles.glowMiddle} />
      </View>

      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({pressed}) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}>
          <MaterialDesignIcons color={homeColors.primaryDark} name="chevron-left" size={22} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={2}
            style={styles.headerTitle}>
            Notifications & rappels
          </Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>
            Personnalise ce que tu souhaites recevoir
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: getBottomPadding(insets.bottom, spacing.lg)}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <MaterialDesignIcons color={homeColors.primary} name="bell-outline" size={20} />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Des rappels utiles, à ton rythme</Text>
            <Text style={styles.introText}>
              Active uniquement les notifications qui t’accompagnent vraiment au quotidien.
            </Text>
          </View>
        </View>

        {/* ============================= A. GROSSESSE ============================= */}
        <View style={styles.card}>
          <SectionHeader icon="human-pregnant" title="Grossesse" />

          <ToggleRow
            description="Recevoir un rappel lorsqu’une nouvelle semaine de grossesse commence."
            icon="calendar-week"
            onValueChange={value => persistSettings({...settings, weeklyUpdateEnabled: value})}
            title="Suivi hebdomadaire"
            value={settings.weeklyUpdateEnabled}
          />

          <View style={styles.divider} />

          <ToggleRow
            description="Me rappeler de compléter mon suivi du jour."
            icon="notebook-outline"
            onValueChange={value => persistSettings({...settings, dailyJournalEnabled: value})}
            title="Journal quotidien"
            value={settings.dailyJournalEnabled}>
            <FieldRow
              active={dailyJournalPickerOpen}
              icon="clock-outline"
              label="Heure du rappel"
              onPress={() => setDailyJournalPickerOpen(open => !open)}
              value={settings.dailyJournalTime}
            />
            {dailyJournalPickerOpen ? (
              <DateTimePicker
                display="default"
                mode="time"
                onValueChange={(_e: DateTimePickerChangeEvent, selected: Date) => {
                  setDailyJournalPickerOpen(false);
                  persistSettings({...settings, dailyJournalTime: formatTimeValue(selected)});
                }}
                value={parseTimeToDate(settings.dailyJournalTime)}
              />
            ) : null}
          </ToggleRow>
        </View>

        {/* ===================== B. RENDEZ-VOUS & EXAMENS ===================== */}
        <View style={styles.card}>
          <SectionHeader icon="calendar-heart" title="Rendez-vous & examens" />

          <ToggleRow
            description="Recevoir un rappel avant tes rendez-vous médicaux."
            icon="calendar-heart"
            onValueChange={value => persistSettings({...settings, appointmentsEnabled: value})}
            title="Rendez-vous médicaux"
            value={settings.appointmentsEnabled}>
            <Text style={styles.toggleHint}>Rappel par défaut</Text>
            <OffsetPicker
              onChange={offset => persistSettings({...settings, defaultAppointmentReminderOffset: offset})}
              value={settings.defaultAppointmentReminderOffset}
            />
          </ToggleRow>

          <View style={styles.divider} />

          <ToggleRow
            description="Recevoir un rappel avant tes examens."
            icon="clipboard-pulse-outline"
            onValueChange={value => persistSettings({...settings, examsEnabled: value})}
            title="Examens"
            value={settings.examsEnabled}>
            <Text style={styles.toggleHint}>Rappel par défaut</Text>
            <OffsetPicker
              onChange={offset => persistSettings({...settings, defaultExamReminderOffset: offset})}
              value={settings.defaultExamReminderOffset}
            />
          </ToggleRow>

          <Text style={styles.cardFootnote}>Chaque rendez-vous ou examen peut définir son propre rappel depuis sa fiche.</Text>
        </View>

        {/* ============================== C. SANTÉ ============================== */}
        <View style={styles.card}>
          <SectionHeader icon="pill" title="Santé" />

          <View style={styles.subsectionHeaderRow}>
            <Text style={styles.subsectionTitle}>Vitamines & compléments</Text>
            <Pressable accessibilityLabel="Ajouter une vitamine" accessibilityRole="button" onPress={() => openNewHealthReminder('vitamin')} style={styles.addChip}>
              <MaterialDesignIcons color={homeColors.primary} name="plus" size={16} />
            </Pressable>
          </View>
          {vitamins.length === 0 ? (
            <EmptyRow text="Aucune vitamine enregistrée." />
          ) : (
            <View style={styles.list}>
              {vitamins.map(item => (
                <ReminderListRow
                  enabled={item.enabled}
                  icon="pill"
                  key={item.id}
                  meta={healthReminderMeta(item)}
                  onDelete={() => removeHealthReminder(item)}
                  onPress={() => openEditHealthReminder(item)}
                  onToggle={value => toggleHealthReminder(item, value)}
                  title={item.name}
                />
              ))}
            </View>
          )}

          <View style={[styles.subsectionHeaderRow, styles.subsectionSpacing]}>
            <Text style={styles.subsectionTitle}>Médicaments</Text>
            <Pressable accessibilityLabel="Ajouter un médicament" accessibilityRole="button" onPress={() => openNewHealthReminder('medication')} style={styles.addChip}>
              <MaterialDesignIcons color={homeColors.primary} name="plus" size={16} />
            </Pressable>
          </View>
          {medications.length === 0 ? (
            <EmptyRow text="Aucun médicament enregistré." />
          ) : (
            <View style={styles.list}>
              {medications.map(item => (
                <ReminderListRow
                  enabled={item.enabled}
                  icon="pill"
                  key={item.id}
                  meta={healthReminderMeta(item)}
                  onDelete={() => removeHealthReminder(item)}
                  onPress={() => openEditHealthReminder(item)}
                  onToggle={value => toggleHealthReminder(item, value)}
                  title={item.name}
                />
              ))}
            </View>
          )}

          <Text style={styles.cardFootnote}>L’application se contente de te rappeler ce que tu as toi-même renseigné — aucun dosage ni conseil médical n’est fourni.</Text>
        </View>

        {/* ======================= D. RAPPELS PERSONNALISÉS ======================= */}
        <View style={styles.card}>
          <View style={styles.subsectionHeaderRow}>
            <SectionHeader icon="bell-plus-outline" title="Rappels personnalisés" />
            <Pressable accessibilityLabel="Ajouter un rappel personnalisé" accessibilityRole="button" onPress={openNewCustomReminder} style={styles.addChip}>
              <MaterialDesignIcons color={homeColors.primary} name="plus" size={16} />
            </Pressable>
          </View>

          {customReminders.length === 0 ? (
            <EmptyRow text="Aucun rappel personnalisé enregistré." />
          ) : (
            <View style={styles.list}>
              {customReminders.map(item => (
                <ReminderListRow
                  enabled={item.enabled}
                  icon="bell-outline"
                  key={item.id}
                  meta={customReminderMeta(item)}
                  onDelete={() => removeCustomReminder(item)}
                  onPress={() => openEditCustomReminder(item)}
                  onToggle={value => toggleCustomReminder(item, value)}
                  title={item.title}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {healthDraft ? (
        <HealthReminderModal
          draft={healthDraft}
          onChange={setHealthDraft}
          onDelete={healthDraft.id ? () => {
            const existing = healthReminders.find(item => item.id === healthDraft.id);
            if (existing) {removeHealthReminder(existing);}
          } : undefined}
          onDismiss={() => setHealthDraft(null)}
          onSave={saveHealthDraft}
        />
      ) : null}

      {customDraft ? (
        <CustomReminderModal
          draft={customDraft}
          onChange={setCustomDraft}
          onDelete={customDraft.id ? () => {
            const existing = customReminders.find(item => item.id === customDraft.id);
            if (existing) {removeCustomReminder(existing);}
          } : undefined}
          onDismiss={() => setCustomDraft(null)}
          onSave={saveCustomDraft}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8FD',
  },

  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -155,
    right: -125,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(112,82,200,0.055)',
  },
  glowMiddle: {
    position: 'absolute',
    top: '42%',
    left: -150,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(163,135,204,0.035)',
  },

  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 5,
    paddingBottom: 6,
  },
  backButton: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#4B396C',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },
  backButtonPressed: {
    opacity: 0.72,
    transform: [{scale: 0.96}],
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    width: '100%',
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSubtitle: {
    maxWidth: '100%',
    marginTop: 1,
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 38,
    height: 38,
    flexShrink: 0,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 2,
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.085)',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.76)',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  introIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderRadius: 13,
    backgroundColor: '#F1EBFA',
  },
  introCopy: {
    flex: 1,
    minWidth: 0,
  },
  introTitle: {
    color: homeColors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  introText: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  card: {
    marginTop: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#493765',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },

  sectionHeader: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  sectionIcon: {
    width: 33,
    height: 33,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 11,
    backgroundColor: '#F2EDFA',
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 1,
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },

  divider: {
    height: 7,
    backgroundColor: 'transparent',
  },

  toggleRow: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.075)',
    borderRadius: 14,
    backgroundColor: '#FDFBFE',
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  toggleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    width: 31,
    height: 31,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F1EBFA',
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 8,
  },
  toggleTitle: {
    color: homeColors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  toggleDescription: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },
  toggleBody: {
    marginTop: 8,
    paddingLeft: 39,
  },
  toggleHint: {
    marginBottom: 6,
    color: homeColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    borderRadius: 10,
    backgroundColor: '#F4F0F9',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: homeColors.primary,
    backgroundColor: homeColors.primary,
  },
  chipText: {
    color: homeColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  cardFootnote: {
    marginTop: 9,
    color: '#8C8498',
    fontSize: 10,
    lineHeight: 14,
  },

  subsectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subsectionSpacing: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(109,74,232,0.09)',
  },
  subsectionTitle: {
    flex: 1,
    minWidth: 0,
    color: homeColors.textPrimary,
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '800',
  },
  addChip: {
    width: 27,
    height: 27,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    borderRadius: 9,
    backgroundColor: '#F1EBFA',
  },

  emptyText: {
    marginTop: 7,
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },

  list: {
    marginTop: 7,
    gap: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.075)',
    borderRadius: 13,
    backgroundColor: '#FDFBFE',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F1EBFA',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: homeColors.textPrimary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  rowMeta: {
    marginTop: 1,
    color: homeColors.textSecondary,
    fontSize: 9.5,
    lineHeight: 12,
  },
  rowDelete: {
    width: 27,
    height: 27,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#FCEFF1',
  },

  pressed: {
    opacity: 0.82,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 47,
    marginTop: 7,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
  },
  fieldActive: {
    borderColor: homeColors.primary,
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    color: homeColors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  fieldValue: {
    marginTop: 1,
    color: homeColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  staticValue: {
    marginTop: 3,
    marginBottom: 1,
    color: homeColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },

  textFieldWrap: {
    marginTop: 10,
  },
  textInput: {
    minHeight: 45,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    color: homeColors.textPrimary,
    fontSize: 12,
  },
  textInputMultiline: {
    minHeight: 72,
    paddingTop: 9,
    textAlignVertical: 'top',
  },

  clearLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearLinkText: {
    color: homeColors.primary,
    fontSize: 10.5,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(29,20,45,0.36)',
  },
  modalCard: {
    maxHeight: '88%',
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    marginBottom: 3,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 15,
    marginBottom: 6,
  },

  deleteButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E9C7CC',
    backgroundColor: '#FBEEF0',
  },
  deleteButtonText: {
    color: '#A8505A',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.09)',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: homeColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: homeColors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
})

export default PregnancyNotificationsScreen;