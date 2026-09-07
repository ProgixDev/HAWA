import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getBottomPadding, spacing} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import PregnancyEventForm, {TYPE_LABELS, fromISODate} from '../../components/pregnancy/PregnancyEventForm';
import {
  deletePregnancyMedicalEvent,
  getPregnancyMedicalEvents,
  type PregnancyMedicalEvent,
  type PregnancyMedicalEventType,
} from '../../state/pregnancyMedicalEventsStore';
import {cancelEventReminder} from '../../utils/pregnancyEventReminders';
import {hydratePregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';

// Legacy combined "browse every Rendez-vous/Examen" list + generic
// type-togglable form. No navigation call in the app reaches this screen
// without an `eventId`/`initialType` any more — Dashboard and Calendar now
// go straight to the dedicated PregnancyAppointmentScreen.tsx/
// PregnancyExamScreen.tsx (see their own headers), which lock the type and
// never show the Rendez-vous/Examen selector below. This screen is kept for
// its own "Rendez-vous et examens" browsing/list feature and its generic
// "Ajouter un événement" entry point, which still legitimately lets the
// user choose either type — both this screen and the two dedicated ones
// share the same PregnancyEventForm.tsx implementation, so none of them
// duplicate the field/reminder/save/delete logic.
type Props = NativeStackScreenProps<RootStackParamList, 'PregnancyAppointments'>;

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
}

function sortEvents(events: PregnancyMedicalEvent[]): PregnancyMedicalEvent[] {
  return [...events].sort((a, b) => (a.date === b.date ? (a.time ?? '').localeCompare(b.time ?? '') : a.date.localeCompare(b.date)));
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
    setView('form');
  }, []);

  const startEdit = useCallback((event: PregnancyMedicalEvent) => {
    setEditingId(event.id);
    setType(event.type);
    setView('form');
  }, []);

  // Resolve navigation params once, on mount — a direct "edit this exact
  // event" deep link needs the real saved values, not just the type.
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

  const handleFormSaved = useCallback(
    (next: PregnancyMedicalEvent[]) => {
      setEvents(sortEvents(next));
      if (cameDirectlyToForm) {
        navigation.goBack();
      } else {
        setView('list');
      }
    },
    [cameDirectlyToForm, navigation],
  );

  const handleFormDeleted = useCallback(
    (next: PregnancyMedicalEvent[]) => {
      setEvents(sortEvents(next));
      if (cameDirectlyToForm) {
        navigation.goBack();
      } else {
        setView('list');
      }
    },
    [cameDirectlyToForm, navigation],
  );

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
          },
        },
      ],
    );
  };

  const editingEvent = editingId ? events.find(item => item.id === editingId) : undefined;
  const headerTitle = view === 'list' ? 'Rendez-vous et examens' : editingId ? 'Modifier l’événement' : 'Ajouter un événement';

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
            <PregnancyEventForm
              initialEvent={editingEvent}
              onDeleted={handleFormDeleted}
              onSaved={handleFormSaved}
              onTypeChange={setType}
              type={type}
            />
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

  pressed: {opacity: 0.85},

  addButton: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
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
