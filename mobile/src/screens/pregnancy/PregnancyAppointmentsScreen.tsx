import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {homeRadii} from '../../components/home/homeTheme';
import {getBottomPadding, spacing} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  deletePregnancyMedicalEvent,
  getPregnancyMedicalEvents,
  savePregnancyMedicalEvent,
  type PregnancyMedicalEvent,
  type PregnancyMedicalEventType,
  type PregnancyReminderOffset,
} from '../../state/pregnancyMedicalEventsStore';
import {REMINDER_OFFSETS, REMINDER_OFFSET_LABELS, cancelEventReminder, syncEventReminder} from '../../utils/pregnancyEventReminders';
import {getPregnancyNotificationSettings, hydratePregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'PregnancyAppointments'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type ActivePicker = 'date' | 'time' | 'reminderTime' | null;

const TYPE_LABELS: Record<PregnancyMedicalEventType, string> = {appointment: 'Rendez-vous', exam: 'Examen'};
const TITLE_PLACEHOLDERS: Record<PregnancyMedicalEventType, string> = {
  appointment: 'Ex. Consultation prénatale',
  exam: 'Ex. Échographie T2',
};

function toISODate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
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

function defaultReminderTime(): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  return date;
}

function sortEvents(events: PregnancyMedicalEvent[]): PregnancyMedicalEvent[] {
  return [...events].sort((a, b) => (a.date === b.date ? (a.time ?? '').localeCompare(b.time ?? '') : a.date.localeCompare(b.date)));
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
        <Pressable accessibilityLabel="Effacer l’heure" hitSlop={8} onPress={onClear} style={styles.fieldClear}>
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

function PregnancyAppointmentsScreen({navigation, route}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const params = route.params;
  const cameDirectlyToForm = Boolean(params?.eventId || params?.initialType);

  const [view, setView] = useState<'list' | 'form'>(cameDirectlyToForm ? 'form' : 'list');
  const [events, setEvents] = useState<PregnancyMedicalEvent[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<PregnancyMedicalEventType>(params?.initialType ?? 'appointment');
  const [dateValue, setDateValue] = useState<Date>(new Date());
  const [hasTime, setHasTime] = useState(false);
  const [timeValue, setTimeValue] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [practitioner, setPractitioner] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffset, setReminderOffset] = useState<PregnancyReminderOffset>(() => defaultOffsetFor(params?.initialType ?? 'appointment'));
  const [reminderTime, setReminderTime] = useState<Date>(defaultReminderTime);
  const [reminderOffsetOpen, setReminderOffsetOpen] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    hydratePregnancyNotificationSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getPregnancyMedicalEvents().then(value => {
        if (mounted) {setEvents(sortEvents(value));}
      });
      return () => {mounted = false;};
    }, []),
  );

  const resetForm = useCallback((initialType: PregnancyMedicalEventType = 'appointment') => {
    setEditingId(null);
    setType(initialType);
    setDateValue(new Date());
    setHasTime(false);
    setTimeValue(new Date());
    setTitle('');
    setPractitioner('');
    setLocation('');
    setNotes('');
    setReminderEnabled(false);
    setReminderOffset(defaultOffsetFor(initialType));
    setReminderTime(defaultReminderTime());
    setReminderOffsetOpen(false);
    setActivePicker(null);
    setError('');
    setView('form');
  }, []);

  const startEdit = useCallback((event: PregnancyMedicalEvent) => {
    setEditingId(event.id);
    setType(event.type);
    setDateValue(fromISODate(event.date));
    setHasTime(Boolean(event.time));
    setTimeValue(event.time ? parseTimeToDate(event.time) : new Date());
    setTitle(event.title);
    setPractitioner(event.practitioner ?? '');
    setLocation(event.location ?? '');
    setNotes(event.notes ?? '');
    setReminderEnabled(Boolean(event.reminderEnabled));
    setReminderOffset(event.reminderOffset ?? defaultOffsetFor(event.type));
    setReminderTime(event.reminderTime ? parseTimeToDate(event.reminderTime) : defaultReminderTime());
    setReminderOffsetOpen(false);
    setActivePicker(null);
    setError('');
    setView('form');
  }, []);

  // Resolve navigation params once, on mount — a direct "edit this exact
  // event" deep link (from Dashboard's Prochain RDV/examen or the Calendar)
  // needs the real saved values, not just the type.
  useEffect(() => {
    let mounted = true;
    const eventId = params?.eventId;
    const initialType = params?.initialType;
    if (eventId) {
      getPregnancyMedicalEvents().then(value => {
        if (!mounted) {return;}
        const existing = value.find(item => item.id === eventId);
        if (existing) {
          startEdit(existing);
        } else if (initialType) {
          resetForm(initialType);
        } else {
          setView('list');
        }
      });
    } else if (initialType) {
      resetForm(initialType);
    }
    return () => {mounted = false;};
    // Runs once, using the route params this screen was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    if (view === 'form' && !cameDirectlyToForm) {
      setView('list');
      return;
    }
    navigation.goBack();
  };

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
    if (!title.trim()) {setError('Indique un intitulé.'); return;}
    const existing = editingId ? events.find(item => item.id === editingId) : undefined;
    const now = new Date().toISOString();
    const event: PregnancyMedicalEvent = {
      id: editingId ?? `pregnancy-event-${Date.now()}`,
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
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = await savePregnancyMedicalEvent(event);
    setEvents(sortEvents(next));
    syncEventReminder(event);
    if (cameDirectlyToForm) {
      navigation.goBack();
    } else {
      setView('list');
    }
  };

  const removeEvent = (id: string, eventType: PregnancyMedicalEventType) => {
    Alert.alert(
      eventType === 'exam' ? 'Supprimer cet examen ?' : 'Supprimer ce rendez-vous ?',
      'Cette action supprimera également le rappel associé.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const next = await deletePregnancyMedicalEvent(id);
            setEvents(sortEvents(next));
            cancelEventReminder(id);
            if (cameDirectlyToForm) {
              navigation.goBack();
            } else {
              setView('list');
            }
          },
        },
      ],
    );
  };

  const headerTitle = view === 'list' ? 'Rendez-vous et examens' : editingId ? 'Modifier l’événement' : 'Ajouter un événement';
  const canSave = title.trim().length > 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Retour" accessibilityRole="button" hitSlop={10} onPress={handleBack} style={styles.backButton}>
            <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: getBottomPadding(insets.bottom, spacing.lg) + 80}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {view === 'form' ? (
            <>
              <View style={styles.segment}>
                {(['appointment', 'exam'] as PregnancyMedicalEventType[]).map(option => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{selected: type === option}}
                    key={option}
                    onPress={() => setType(option)}
                    style={[styles.segmentOption, type === option && styles.segmentOptionActive]}>
                    <Text style={[styles.segmentText, type === option && styles.segmentTextActive]}>{TYPE_LABELS[option]}</Text>
                  </Pressable>
                ))}
              </View>

              <FieldRow
                active={activePicker === 'date'}
                icon="calendar-month-outline"
                label="Date"
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
                label="Heure (optionnelle)"
                onClear={hasTime ? () => {setHasTime(false); setActivePicker(null);} : undefined}
                onPress={() => setActivePicker(current => (current === 'time' ? null : 'time'))}
                styles={styles}
                theme={theme}
                value={hasTime ? formatTimeValue(timeValue) : 'Non définie'}
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
                label="Titre"
                onChangeText={text => {setTitle(text); setError('');}}
                placeholder={TITLE_PLACEHOLDERS[type]}
                styles={styles}
                theme={theme}
                value={title}
              />
              <TextField label="Praticien (optionnel)" onChangeText={setPractitioner} placeholder="Ex. Dr. Benali" styles={styles} theme={theme} value={practitioner} />
              <TextField label="Lieu (optionnel)" onChangeText={setLocation} placeholder="Ex. Clinique El Nour" styles={styles} theme={theme} value={location} />
              <TextField label="Notes (optionnelles)" multiline onChangeText={setNotes} placeholder="Ajouter une note..." styles={styles} theme={theme} value={notes} />

              <View style={styles.reminderCard}>
                <View style={styles.reminderHeaderRow}>
                  <View style={styles.fieldIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name="bell-outline" size={18} />
                  </View>
                  <Text style={styles.reminderLabel}>Rappel</Text>
                  <Switch
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
                  <Text style={styles.reminderEmptyText}>Aucun rappel</Text>
                ) : (
                  <View style={styles.reminderBody}>
                    <Pressable accessibilityRole="button" onPress={() => setReminderOffsetOpen(open => !open)} style={styles.reminderRow}>
                      <Text style={styles.reminderRowLabel}>Me rappeler</Text>
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
                          <Text style={styles.reminderRowLabel}>Heure du rappel</Text>
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
                {editingId ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => removeEvent(editingId, type)}
                    style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}>
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={!canSave}
                  onPress={save}
                  style={({pressed}) => [
                    styles.saveButton,
                    editingId ? styles.saveButtonFlex : styles.saveButtonFull,
                    !canSave && styles.saveButtonDisabled,
                    pressed && canSave && styles.pressed,
                  ]}>
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => resetForm('appointment')}
                style={({pressed}) => [styles.addButton, pressed && styles.pressed]}>
                <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="plus" size={19} />
                <Text style={styles.addButtonText}>Ajouter un événement</Text>
              </Pressable>

              {events.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={34} />
                  </View>
                  <Text style={styles.emptyTitle}>Aucun rendez-vous enregistré</Text>
                  <Text style={styles.emptyText}>
                    Ajoute un rendez-vous ou un examen pour le retrouver ici, sur ton tableau de bord et dans ton calendrier.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {events.map(event => (
                    <Pressable
                      accessibilityLabel={`Modifier ${event.title}`}
                      accessibilityRole="button"
                      key={event.id}
                      onPress={() => startEdit(event)}
                      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
                      <View style={styles.rowIcon}>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
                          name={event.type === 'appointment' ? 'calendar-heart' : 'clipboard-pulse-outline'}
                          size={19}
                        />
                      </View>
                      <View style={styles.rowCopy}>
                        <Text style={styles.rowTitle}>{event.title}</Text>
                        <Text style={styles.rowMeta}>
                          {TYPE_LABELS[event.type]} · {formatLongDate(fromISODate(event.date))}
                          {event.time ? ` · ${event.time}` : ''}
                        </Text>
                        {event.practitioner ? <Text style={styles.rowMeta}>{event.practitioner}</Text> : null}
                      </View>
                      <Pressable
                        accessibilityLabel={`Supprimer ${event.title}`}
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => removeEvent(event.id, event.type)}
                        style={styles.rowDelete}>
                        <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={18} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: theme.colors.background},
  flex: {flex: 1},
  header: {minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm},
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    ...theme.shadow,
  },
  headerTitle: {flex: 1, marginHorizontal: 10, color: theme.colors.text, fontFamily: 'serif', fontSize: 19, fontWeight: '700', textAlign: 'center'},
  headerSpacer: {width: 44},
  content: {paddingHorizontal: spacing.md, paddingTop: spacing.sm},

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

  addButton: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: homeRadii.button,
    backgroundColor: theme.colors.primary,
    ...theme.shadow,
  },
  addButtonText: {color: onPrimaryTextColor(theme), fontSize: 14.5, fontWeight: '700'},

  empty: {alignItems: 'center', marginTop: 28, paddingHorizontal: 12},
  emptyIcon: {width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: theme.colors.primarySoft},
  emptyTitle: {marginTop: 13, color: theme.colors.text, fontSize: 15, fontWeight: '800', textAlign: 'center'},
  emptyText: {marginTop: 7, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center'},

  list: {marginTop: 18, gap: 10},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowIcon: {width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: theme.colors.primarySoft},
  rowCopy: {flex: 1, minWidth: 0},
  rowTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
  rowMeta: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11},
  rowDelete: {width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: withAlpha(theme.colors.danger, 0.1)},
  });
}

export default PregnancyAppointmentsScreen;
