import React, {useMemo, useState} from 'react';
import {Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getAppLanguage} from '../../state/themePreferences';
import {
  deletePregnancyMedicalEvent,
  savePregnancyMedicalEvent,
  type PregnancyMedicalEvent,
  type PregnancyMedicalEventType,
  type PregnancyReminderOffset,
} from '../../state/pregnancyMedicalEventsStore';
import {REMINDER_OFFSETS, REMINDER_OFFSET_LABELS, cancelEventReminder, syncEventReminder} from '../../utils/pregnancyEventReminders';
import {getPregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';
import '../../i18n';

// Shared Appointment/Exam form — extracted so PregnancyAppointmentScreen.tsx
// and PregnancyExamScreen.tsx (each locked to one `type`, no selector) and
// the legacy combined PregnancyAppointmentsScreen.tsx (still lets the user
// toggle `type` via the optional `onTypeChange` prop) never duplicate this
// ~300-line form. Business logic — validation, event shape, reminder sync,
// persistence — is unchanged from the pre-split implementation; only the
// type switcher's visibility became conditional (present only when a caller
// actually passes `onTypeChange`).

export type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type ActivePicker = 'date' | 'time' | 'reminderTime' | null;

// Frozen, non-translated fallback — still consumed as a plain Record (not a
// factory) by the legacy combined PregnancyAppointmentsScreen.tsx (confirmed
// dead code, out of scope for this localization pass; see that file's own
// header comment). Left untouched so that file keeps compiling. The live
// dedicated Appointment/Exam form below uses `eventTypeLabels(t)` instead.
export const TYPE_LABELS: Record<PregnancyMedicalEventType, string> = {appointment: 'Rendez-vous', exam: 'Examen'};

// Display-only labels for the persisted PregnancyMedicalEventType enum (the
// semantic value itself, never the label, is what's saved).
function eventTypeLabels(t: (key: string) => string): Record<PregnancyMedicalEventType, string> {
  return {
    appointment: t('pregnancyEvent.types.appointment'),
    exam: t('pregnancyEvent.types.exam'),
  };
}

function titlePlaceholders(t: (key: string) => string): Record<PregnancyMedicalEventType, string> {
  return {
    appointment: t('pregnancyEvent.form.titlePlaceholderAppointment'),
    exam: t('pregnancyEvent.form.titlePlaceholderExam'),
  };
}

export function toISODate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateFormatLocale(): string {
  return getAppLanguage() === 'en' ? 'en-US' : 'fr-FR';
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
}

function formatTimeValue(date: Date): string {
  return new Intl.DateTimeFormat(dateFormatLocale(), {hour: '2-digit', minute: '2-digit', hour12: false}).format(date);
}

function parseTimeToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function defaultReminderTime(): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  return date;
}

function defaultOffsetFor(type: PregnancyMedicalEventType): PregnancyReminderOffset {
  const settings = getPregnancyNotificationSettings();
  return type === 'exam' ? settings.defaultExamReminderOffset : settings.defaultAppointmentReminderOffset;
}

function FieldRow({
  icon,
  label,
  value,
  active,
  onPress,
  onClear,
  theme,
  styles,
}: {
  icon: IconName;
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
  onClear?: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.field, active && styles.fieldActive, pressed && styles.pressed]}>
      <View style={styles.fieldIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      </View>
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      {onClear ? (
        <Pressable accessibilityLabel={t('pregnancyEvent.form.clearTime')} hitSlop={8} onPress={onClear} style={styles.fieldClear}>
          <MaterialDesignIcons color={theme.colors.textSecondary} name="close-circle-outline" size={18} />
        </Pressable>
      ) : (
        <MaterialDesignIcons color={theme.colors.textSecondary} name={active ? 'chevron-up' : 'chevron-down'} size={20} />
      )}
    </Pressable>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  theme,
  styles,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.textFieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.textInput, multiline && styles.textInputMultiline]}
        value={value}
      />
    </View>
  );
}

export type PregnancyEventFormProps = {
  /** The event type this render represents. Fixed for the dedicated
   * Appointment/Exam screens; only mutable (via `onTypeChange`) for the
   * legacy combined form, which still lets the user pick either. */
  type: PregnancyMedicalEventType;
  /** When provided, renders the Rendez-vous/Examen segmented selector and
   * calls this on selection. Omit entirely to lock the form to `type` with
   * no selector — the dedicated Appointment/Exam screens always omit it. */
  onTypeChange?: (type: PregnancyMedicalEventType) => void;
  /** The event being edited, or undefined to create a new one. */
  initialEvent?: PregnancyMedicalEvent;
  /** Called after a successful save with the full up-to-date event list. */
  onSaved: (events: PregnancyMedicalEvent[]) => void;
  /** Called after a successful delete with the full up-to-date event list. */
  onDeleted: (events: PregnancyMedicalEvent[]) => void;
};

function PregnancyEventForm({
  type,
  onTypeChange,
  initialEvent,
  onSaved,
  onDeleted,
}: PregnancyEventFormProps): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const typeLabels = eventTypeLabels(t);
  const placeholders = titlePlaceholders(t);

  const [dateValue, setDateValue] = useState<Date>(() => (initialEvent ? fromISODate(initialEvent.date) : new Date()));
  const [hasTime, setHasTime] = useState(() => Boolean(initialEvent?.time));
  const [timeValue, setTimeValue] = useState<Date>(() => (initialEvent?.time ? parseTimeToDate(initialEvent.time) : new Date()));
  const [title, setTitle] = useState(() => initialEvent?.title ?? '');
  const [practitioner, setPractitioner] = useState(() => initialEvent?.practitioner ?? '');
  const [location, setLocation] = useState(() => initialEvent?.location ?? '');
  const [notes, setNotes] = useState(() => initialEvent?.notes ?? '');
  const [reminderEnabled, setReminderEnabled] = useState(() => Boolean(initialEvent?.reminderEnabled));
  const [reminderOffset, setReminderOffset] = useState<PregnancyReminderOffset>(
    () => initialEvent?.reminderOffset ?? defaultOffsetFor(type),
  );
  const [reminderTime, setReminderTime] = useState<Date>(
    () => (initialEvent?.reminderTime ? parseTimeToDate(initialEvent.reminderTime) : defaultReminderTime()),
  );
  const [reminderOffsetOpen, setReminderOffsetOpen] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [error, setError] = useState('');

  const handleDateChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {setActivePicker(null);}
    setDateValue(selected);
  };

  const handleTimeChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {setActivePicker(null);}
    setHasTime(true);
    setTimeValue(selected);
  };

  const handleReminderTimeChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') {setActivePicker(null);}
    setReminderTime(selected);
  };

  const handlePickerDismiss = () => {
    if (Platform.OS === 'android') {setActivePicker(null);}
  };

  const save = async () => {
    if (!title.trim()) {setError(t('pregnancyEvent.form.titleRequired')); return;}
    const now = new Date().toISOString();
    const event: PregnancyMedicalEvent = {
      id: initialEvent?.id ?? `pregnancy-event-${Date.now()}`,
      type,
      date: toISODate(dateValue),
      time: hasTime ? formatTimeValue(timeValue) : undefined,
      title: title.trim(),
      practitioner: practitioner.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      reminderEnabled,
      reminderOffset: reminderEnabled ? reminderOffset : undefined,
      reminderTime: reminderEnabled && reminderOffset === 'custom' ? formatTimeValue(reminderTime) : undefined,
      createdAt: initialEvent?.createdAt ?? now,
      updatedAt: now,
    };
    const next = await savePregnancyMedicalEvent(event);
    await syncEventReminder(event);
    onSaved(next);
  };

  const requestDelete = () => {
    if (!initialEvent) {return;}
    const eventId = initialEvent.id;
    Alert.alert(
      type === 'exam' ? t('pregnancyEvent.form.deleteExamTitle') : t('pregnancyEvent.form.deleteAppointmentTitle'),
      t('pregnancyEvent.form.deleteMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('pregnancyEvent.form.delete'),
          style: 'destructive',
          onPress: async () => {
            const next = await deletePregnancyMedicalEvent(eventId);
            cancelEventReminder(eventId);
            onDeleted(next);
          },
        },
      ],
    );
  };

  const canSave = title.trim().length > 0;

  return (
    <>
      {onTypeChange ? (
        <View style={styles.segment}>
          {(['appointment', 'exam'] as PregnancyMedicalEventType[]).map(option => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: type === option}}
              key={option}
              onPress={() => onTypeChange(option)}
              style={[styles.segmentOption, type === option && styles.segmentOptionActive]}>
              <Text style={[styles.segmentText, type === option && styles.segmentTextActive]}>{typeLabels[option]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FieldRow
        active={activePicker === 'date'}
        icon="calendar-month-outline"
        label={t('pregnancyEvent.form.dateLabel')}
        onPress={() => setActivePicker(current => (current === 'date' ? null : 'date'))}
        styles={styles}
        theme={theme}
        value={formatLongDate(dateValue)}
      />
      {activePicker === 'date' ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          mode="date"
          onDismiss={handlePickerDismiss}
          onValueChange={handleDateChange}
          value={dateValue}
        />
      ) : null}

      <FieldRow
        active={activePicker === 'time'}
        icon="clock-outline"
        label={t('pregnancyEvent.form.timeLabel')}
        onClear={hasTime ? () => {setHasTime(false); setActivePicker(null);} : undefined}
        onPress={() => setActivePicker(current => (current === 'time' ? null : 'time'))}
        styles={styles}
        theme={theme}
        value={hasTime ? formatTimeValue(timeValue) : t('pregnancyEvent.form.timeNotSet')}
      />
      {activePicker === 'time' ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          mode="time"
          onDismiss={handlePickerDismiss}
          onValueChange={handleTimeChange}
          value={timeValue}
        />
      ) : null}

      <TextField
        label={t('pregnancyEvent.form.titleLabel')}
        onChangeText={text => {setTitle(text); setError('');}}
        placeholder={placeholders[type]}
        styles={styles}
        theme={theme}
        value={title}
      />
      <TextField
        label={t('pregnancyEvent.form.practitionerLabel')}
        onChangeText={setPractitioner}
        placeholder={t('pregnancyEvent.form.practitionerPlaceholder')}
        styles={styles}
        theme={theme}
        value={practitioner}
      />
      <TextField
        label={t('pregnancyEvent.form.locationLabel')}
        onChangeText={setLocation}
        placeholder={t('pregnancyEvent.form.locationPlaceholder')}
        styles={styles}
        theme={theme}
        value={location}
      />
      <TextField
        label={t('pregnancyEvent.form.notesLabel')}
        multiline
        onChangeText={setNotes}
        placeholder={t('pregnancyEvent.form.notesPlaceholder')}
        styles={styles}
        theme={theme}
        value={notes}
      />

      <View style={styles.reminderCard}>
        <View style={styles.reminderHeaderRow}>
          <View style={styles.fieldIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="bell-outline" size={18} />
          </View>
          <Text style={styles.reminderLabel}>{t('pregnancyEvent.form.reminderLabel')}</Text>
          <Switch
            accessibilityLabel={t('pregnancyEvent.form.reminderLabel')}
            accessibilityRole="switch"
            accessibilityState={{checked: reminderEnabled}}
            ios_backgroundColor={theme.colors.primarySoft}
            onValueChange={value => {
              setReminderEnabled(value);
              if (!value) {setReminderOffsetOpen(false); if (activePicker === 'reminderTime') {setActivePicker(null);}}
            }}
            thumbColor={theme.colors.surface}
            trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
            value={reminderEnabled}
          />
        </View>

        {!reminderEnabled ? (
          <Text style={styles.reminderEmptyText}>{t('pregnancyEvent.form.noReminder')}</Text>
        ) : (
          <View style={styles.reminderBody}>
            <Pressable accessibilityRole="button" onPress={() => setReminderOffsetOpen(open => !open)} style={styles.reminderRow}>
              <Text style={styles.reminderRowLabel}>{t('pregnancyEvent.form.remindMe')}</Text>
              <View style={styles.reminderRowValueWrap}>
                <Text style={styles.reminderRowValue}>{REMINDER_OFFSET_LABELS[reminderOffset]}</Text>
                <MaterialDesignIcons color={theme.colors.textSecondary} name={reminderOffsetOpen ? 'chevron-up' : 'chevron-down'} size={18} />
              </View>
            </Pressable>

            {reminderOffsetOpen ? (
              <View style={styles.reminderChips}>
                {REMINDER_OFFSETS.map(option => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{selected: reminderOffset === option}}
                    key={option}
                    onPress={() => {setReminderOffset(option); setReminderOffsetOpen(false);}}
                    style={[styles.reminderChip, reminderOffset === option && styles.reminderChipActive]}>
                    <Text style={[styles.reminderChipText, reminderOffset === option && styles.reminderChipTextActive]}>
                      {REMINDER_OFFSET_LABELS[option]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {reminderOffset === 'custom' ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActivePicker(current => (current === 'reminderTime' ? null : 'reminderTime'))}
                  style={styles.reminderRow}>
                  <Text style={styles.reminderRowLabel}>{t('pregnancyEvent.form.reminderTimeLabel')}</Text>
                  <View style={styles.reminderRowValueWrap}>
                    <Text style={styles.reminderRowValue}>{formatTimeValue(reminderTime)}</Text>
                    <MaterialDesignIcons
                      color={theme.colors.textSecondary}
                      name={activePicker === 'reminderTime' ? 'chevron-up' : 'chevron-down'}
                      size={18}
                    />
                  </View>
                </Pressable>
                {activePicker === 'reminderTime' ? (
                  <DateTimePicker
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    mode="time"
                    onDismiss={handlePickerDismiss}
                    onValueChange={handleReminderTimeChange}
                    value={reminderTime}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actionsRow}>
        {initialEvent ? (
          <Pressable
            accessibilityLabel={type === 'exam' ? t('pregnancyEvent.form.deleteExamAccessibility') : t('pregnancyEvent.form.deleteAppointmentAccessibility')}
            accessibilityRole="button"
            onPress={requestDelete}
            style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}>
            <Text style={styles.deleteButtonText}>{t('pregnancyEvent.form.delete')}</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityLabel={t('common.save')}
          accessibilityRole="button"
          accessibilityState={{disabled: !canSave}}
          disabled={!canSave}
          onPress={save}
          style={({pressed}) => [
            styles.saveButton,
            initialEvent ? styles.saveButtonFlex : styles.saveButtonFull,
            !canSave && styles.saveButtonDisabled,
            pressed && canSave && styles.pressed,
          ]}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </Pressable>
      </View>
    </>
  );
}

export function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    segment: {flexDirection: 'row', gap: 8, padding: 4, borderRadius: homeRadii.button, backgroundColor: theme.colors.primarySoft},
    segmentOption: {flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: homeRadii.button - 4},
    segmentOptionActive: {backgroundColor: theme.colors.primary, ...theme.shadow},
    segmentText: {color: theme.colors.textSecondary, fontSize: 14, fontWeight: '700'},
    segmentTextActive: {color: onPrimaryTextColor(theme)},

    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      minHeight: 62,
      marginTop: 16,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 13,
    },
    fieldActive: {borderColor: theme.colors.primary},
    fieldIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.colors.primarySoft},
    fieldCopy: {flex: 1, minWidth: 0},
    fieldLabel: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '600'},
    fieldValue: {marginTop: 2, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    fieldClear: {padding: 4},

    textFieldWrap: {marginTop: 16},
    textInput: {
      minHeight: 52,
      marginTop: 7,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      color: theme.colors.text,
      fontSize: 14.5,
    },
    textInputMultiline: {minHeight: 96, paddingTop: 14, textAlignVertical: 'top'},

    reminderCard: {
      marginTop: 18,
      padding: 15,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
    },
    reminderHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
    reminderLabel: {flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '700'},
    reminderEmptyText: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 12.5},
    reminderBody: {marginTop: 4},
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      marginTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingTop: 10,
    },
    reminderRowLabel: {color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '600'},
    reminderRowValueWrap: {flexDirection: 'row', alignItems: 'center', gap: 4},
    reminderRowValue: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
    reminderChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
    reminderChip: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 9},
    reminderChipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    reminderChipText: {color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700'},
    reminderChipTextActive: {color: onPrimaryTextColor(theme)},

    error: {marginTop: 14, color: theme.colors.danger, fontSize: 12.5, textAlign: 'center'},

    actionsRow: {flexDirection: 'row', gap: 10, marginTop: 22},
    saveButton: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 4,
    },
    saveButtonFull: {flex: 1},
    saveButtonFlex: {flex: 1},
    saveButtonDisabled: {opacity: 0.45},
    saveButtonText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '700'},
    deleteButton: {
      flex: 1,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      borderWidth: 1.4,
      borderColor: withAlpha(theme.colors.danger, 0.3),
      backgroundColor: withAlpha(theme.colors.danger, 0.1),
    },
    deleteButtonText: {color: theme.colors.danger, fontSize: 15, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}

export default PregnancyEventForm;
