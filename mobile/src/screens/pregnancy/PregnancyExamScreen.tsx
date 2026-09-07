import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getBottomPadding, spacing} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import PregnancyEventForm from '../../components/pregnancy/PregnancyEventForm';
import {getPregnancyMedicalEvents, type PregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';

// Dedicated Exam flow — see PregnancyAppointmentScreen.tsx for its
// Appointment counterpart; both share PregnancyEventForm.tsx and are locked
// to a fixed `type`, never rendering the Rendez-vous/Examen selector.
type Props = NativeStackScreenProps<RootStackParamList, 'PregnancyExam'>;

function PregnancyExamScreen({navigation, route}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId;

  const [ready, setReady] = useState(!eventId);
  const [initialEvent, setInitialEvent] = useState<PregnancyMedicalEvent | undefined>(undefined);

  useFocusResolve(eventId, setInitialEvent, setReady);

  const handleSaved = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleDeleted = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const headerTitle = initialEvent ? 'Modifier l’examen' : 'Ajouter un examen';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Retour" accessibilityRole="button" hitSlop={10} onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: getBottomPadding(insets.bottom, spacing.lg) + 80}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {ready ? (
            <PregnancyEventForm
              initialEvent={initialEvent}
              onDeleted={handleDeleted}
              onSaved={handleSaved}
              type="exam"
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useFocusResolve(
  eventId: string | undefined,
  setInitialEvent: (event: PregnancyMedicalEvent | undefined) => void,
  setReady: (ready: boolean) => void,
): void {
  useEffect(() => {
    let mounted = true;
    if (!eventId) {setReady(true); return () => {mounted = false;};}
    getPregnancyMedicalEvents().then(events => {
      if (!mounted) {return;}
      setInitialEvent(events.find(item => item.id === eventId));
      setReady(true);
    });
    return () => {mounted = false;};
    // Runs once per mount, using the route param this screen was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  });
}

export default PregnancyExamScreen;
