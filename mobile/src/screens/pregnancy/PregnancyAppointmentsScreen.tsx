import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getBottomPadding, spacing, TOP_SPACING_EXTRA} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {AWA_DISPLAY_FONT} from '../../theme/awaTypography';
import PregnancyEventForm, {TYPE_LABELS, fromISODate} from '../../components/pregnancy/PregnancyEventForm';
import {
  getPregnancyMedicalEvents,
  type PregnancyMedicalEvent,
  type PregnancyMedicalEventType,
} from '../../state/pregnancyMedicalEventsStore';
import {hydratePregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';
import {dateFormatLocale} from '../../utils/cycleMath';

// "Mes rendez-vous": the list of every medical appointment and exam ("À venir" sorted by date, then "Passés"), a fixed "Ajouter un RDV"
// button, and the type-togglable form (Rendez-vous / Examen) that adds, edits or deletes one. The store keeps a LIST of events
// (state/pregnancyMedicalEventsStore.ts), so several appointments are possible. Originally a combined browse list + generic form. No navigation call in the app reaches this screen
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
  return new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
}

function sortEvents(events: PregnancyMedicalEvent[]): PregnancyMedicalEvent[] {
  return [...events].sort((a, b) => (a.date === b.date ? (a.time ?? '').localeCompare(b.time ?? '') : a.date.localeCompare(b.date)));
}

function PregnancyAppointmentsScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
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

  const editingEvent = editingId ? events.find(item => item.id === editingId) : undefined;
  const headerTitle = editingId ? 'Modifier l’événement' : 'Ajouter un événement';
  const todayISO = new Date().toLocaleDateString('en-CA');
  const upcoming = events.filter(event => event.date >= todayISO);
  const past = events.filter(event => event.date < todayISO).reverse();

  const renderRow = (event: PregnancyMedicalEvent, last: boolean, muted: boolean) => (
    <Pressable
      accessibilityLabel={`${event.title}. ${TYPE_LABELS[event.type]}, ${formatLongDate(fromISODate(event.date))}${event.time ? `, ${event.time}` : ''}`}
      accessibilityRole="button"
      key={event.id}
      onPress={() => startEdit(event)}
      style={({pressed}) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, muted && styles.rowMuted]}>
        <MaterialDesignIcons
          color={muted ? theme.colors.textMuted : theme.colors.primary}
          name={event.type === 'exam' ? 'stethoscope' : 'calendar-month-outline'}
          size={20}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={2} style={[styles.rowTitle, muted && styles.rowTitleMuted]}>{event.title}</Text>
        <Text style={styles.rowMeta}>
          {TYPE_LABELS[event.type]} · {formatLongDate(fromISODate(event.date))}
          {event.time ? `, ${event.time}` : ''}
        </Text>
      </View>
      <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={styles.header}>
          <AwaIconButton
            accessibilityLabel="Retour"
            icon="arrow-left"
            onPress={handleBack}
          />
          {view === 'list' ? (
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.screenTitle}>{t('pregnancyAppointmentsList.title', {defaultValue: 'Mes rendez-vous'})}</Text>
              <Text style={styles.screenSubtitle}>{t('pregnancyAppointmentsList.subtitle', {defaultValue: 'Rendez-vous et examens médicaux'})}</Text>
            </View>
          ) : (
            <>
              <AwaText variant="headlineSmall" style={styles.headerTitle}>{headerTitle}</AwaText>
              <View style={styles.headerSpacer} />
            </>
          )}
        </View>
        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: getBottomPadding(insets.bottom, spacing.lg) + (view === 'list' ? 96 : 80)}]}
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
          ) : events.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={34} />
              </View>
              <AwaText variant="titleMedium" style={styles.emptyTitle}>Aucun rendez-vous enregistré</AwaText>
              <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.emptyText}>
                Ajoute un rendez-vous ou un examen pour le retrouver ici, sur ton tableau de bord et dans ton calendrier.
              </AwaText>
            </View>
          ) : (
            <>
              {upcoming.length > 0 ? (
                <>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>{t('pregnancyAppointmentsList.upcoming', {defaultValue: 'À venir'})}</Text>
                  <View style={styles.card}>{upcoming.map((event, index) => renderRow(event, index === upcoming.length - 1, false))}</View>
                </>
              ) : null}
              {past.length > 0 ? (
                <>
                  <Text accessibilityRole="header" style={[styles.sectionTitle, styles.sectionTitleMuted]}>{t('pregnancyAppointmentsList.past', {defaultValue: 'Passés'})}</Text>
                  <View style={[styles.card, styles.cardMuted]}>{past.map((event, index) => renderRow(event, index === past.length - 1, true))}</View>
                </>
              ) : null}
            </>
          )}
        </ScrollView>

        {view === 'list' ? (
          <View style={[styles.bottomBar, {paddingBottom: Math.max(insets.bottom, 12) + 4}]}>
            <AwaButton
              accessibilityLabel={t('pregnancyDashboard.appointments.addAppointment', {defaultValue: 'Ajouter un RDV'})}
              fullWidth
              icon="plus"
              label={t('pregnancyDashboard.appointments.addAppointment', {defaultValue: 'Ajouter un RDV'})}
              onPress={() => resetForm('appointment')}
              size="large"
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: theme.colors.background},
  flex: {flex: 1},
  header: {minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: TOP_SPACING_EXTRA},
  headerTitle: {flex: 1, marginHorizontal: 10, textAlign: 'center'},
  headerSpacer: {width: 40},
  content: {paddingHorizontal: spacing.md, paddingTop: spacing.sm},

  pressed: {opacity: 0.85},

  empty: {alignItems: 'center', marginTop: 28, paddingHorizontal: 12},
  emptyIcon: {width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.primarySoft},
  emptyTitle: {marginTop: 13, textAlign: 'center'},
  emptyText: {marginTop: 8, textAlign: 'center'},

  headerCopy: {flex: 1, minWidth: 0, marginLeft: 10},
  screenTitle: {color: theme.colors.text, fontFamily: AWA_DISPLAY_FONT, fontSize: 24, lineHeight: 30, fontWeight: '600'},
  screenSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  sectionTitle: {marginTop: 18, marginBottom: 8, marginLeft: 4, color: theme.colors.text, fontSize: 14, fontWeight: '700'},
  sectionTitleMuted: {color: theme.colors.textMuted},
  card: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
    backgroundColor: theme.colors.surface,
  },
  cardMuted: {opacity: 0.8},
  row: {minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10},
  rowDivider: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  rowIcon: {width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
  rowMuted: {backgroundColor: withAlpha(theme.colors.textMuted, 0.14)},
  rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  rowTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 18, fontWeight: '600'},
  rowTitleMuted: {color: theme.colors.textSecondary},
  rowMeta: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},
  bottomBar: {paddingHorizontal: spacing.md, paddingTop: 10, backgroundColor: theme.colors.background},
  });
}

export default PregnancyAppointmentsScreen;
