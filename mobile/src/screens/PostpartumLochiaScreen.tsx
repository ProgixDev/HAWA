import {useToday} from '../hooks/useToday';
import React, { useEffect, useMemo, useState } from 'react';
import {useTranslation} from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { spacing } from '../theme/spacing';
import { useAwaTheme } from '../theme/AwaThemeProvider';
import { withAlpha, type ResolvedAwaTheme } from '../theme/awaThemeTokens';
import {
  getAllPostpartumLochiaEntries,
  getPostpartumLochiaEntry,
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
  markPostpartumLochiaEnded,
  reopenPostpartumLochiaTracking,
  savePostpartumLochiaEntry,
  subscribePostpartumLochia,
  type PostpartumLochiaEntry,
  type PostpartumLochiaTracking,
} from '../state/postpartumLochiaStore';
import {
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
} from '../state/postpartumPreferences';
import { computePostpartumLochiaSummary } from '../utils/postpartumTrackingUtils';
import { validateLochiaEndDate } from '../utils/postpartumLossDateValidation';
import { dateFormatLocale, startOfDay } from '../utils/cycleMath';
import { PostpartumConsistencyModal } from '../components/postpartum/PostpartumConsistencyModal';
import InlineCalendarPickerModal from '../components/onboarding/InlineCalendarPickerModal';
import i18n from '../i18n';
import { journalOptionLabel } from '../utils/journalOptionLabels';
import {displayTitleCase} from '../utils/textCase';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<RootStackParamList, 'PostpartumLochia'>;

// Existing Bibliothèque article (data/libraryContent.ts → LochiaArticleScreen).
const LOCHIA_ARTICLE_ID = 'lochia-comprendre-lochies';
type Flow = 'Très léger' | 'Léger' | 'Modéré' | 'Abondant';
type LochiaColor = 'Rouge vif' | 'Rouge' | 'Rose' | 'Brun' | 'Jaune / blanc';
type Consistency = 'Liquide' | 'Épais' | 'Avec petits caillots';

// DATA-BEARING — the PERSISTED flow/color/consistency/symptoms values are
// the raw French label string(s) themselves via savePostpartumLochiaEntry()
// (see src/state/postpartumLochiaStore.ts's LochiaFlow/LochiaColor/
// LochiaConsistency string-literal union types and FLOWS/COLORS/
// CONSISTENCIES validation arrays — there is no separate stable enum), and
// that storage format never changes (Phase 7H.2). The DISPLAYED label is
// translated per app language via journalOptionLabel('postpartumLochiaFlow'
// |'postpartumLochiaColor'|'postpartumLochiaConsistency'|
// 'postpartumLochiaSymptom', value, t) — selection/comparison below always
// uses the original French value, never the translated label.
const flowOptions: Array<{ label: Flow; icon: string }> = [
  { label: 'Très léger', icon: 'water-outline' },
  { label: 'Léger', icon: 'water' },
  { label: 'Modéré', icon: 'water' },
  { label: 'Abondant', icon: 'water' },
];

const colorOptions: Array<{ label: LochiaColor; color: string }> = [
  { label: 'Rouge vif', color: '#D8334A' },
  { label: 'Rouge', color: '#E76578' },
  { label: 'Rose', color: '#F4A5C3' },
  { label: 'Brun', color: '#A87867' },
  { label: 'Jaune / blanc', color: '#F2D6B3' },
];

const consistencyOptions: Consistency[] = [
  'Liquide',
  'Épais',
  'Avec petits caillots',
];
const symptomOptions = [
  'Aucun',
  'Crampes',
  'Fatigue',
  'Maux de tête',
  'Sensibilité',
  'Autres',
] as const;

function PostpartumLochiaScreen({ navigation }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [flow, setFlow] = useState<Flow>('Léger');
  const [color, setColor] = useState<LochiaColor>('Rose');
  const [consistency, setConsistency] = useState<Consistency>('Épais');
  const [symptoms, setSymptoms] = useState<string[]>(['Aucun']);
  const [note, setNote] = useState('');
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [reopenModalVisible, setReopenModalVisible] = useState(false);
  const [saveConfirmationVisible, setSaveConfirmationVisible] = useState(false);
  const [reopenConsistencyVisible, setReopenConsistencyVisible] =
    useState(false);
  // End-date selection: the day chosen when marking the lochia as ended
  // (defaults to today), the picker shared by "mark ended" and "edit the end
  // date", and the message of a refused date.
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endPicker, setEndPicker] = useState<null | 'finish' | 'edit'>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(
    getPostpartumPreferences().deliveryDate,
  );
  const [entries, setEntries] = useState<Record<string, PostpartumLochiaEntry>>(
    {},
  );
  const [tracking, setTracking] = useState<PostpartumLochiaTracking>(
    getPostpartumLochiaTracking,
  );
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {today, todayKey} = useToday();

  useEffect(() => {
    let active = true;
    hydratePostpartumLochia().then(() => {
      if (!active) {
        return;
      }
      setEntries(getAllPostpartumLochiaEntries());
      setTracking(getPostpartumLochiaTracking());
      const entry = getPostpartumLochiaEntry(todayKey);
      if (!entry) {
        return;
      }
      setFlow(entry.flow);
      setColor(entry.color);
      setConsistency(entry.consistency);
      setSymptoms(entry.symptoms);
      setNote(entry.note ?? '');
    });
    hydratePostpartumPreferences().then(value => {
      if (active) {
        setDeliveryDate(value.deliveryDate);
      }
    });
    const unsubscribeLochia = subscribePostpartumLochia(() => {
      if (active) {
        setEntries(getAllPostpartumLochiaEntries());
        setTracking(getPostpartumLochiaTracking());
      }
    });
    const unsubscribePreferences = subscribePostpartumPreferences(() => {
      if (active) {
        setDeliveryDate(getPostpartumPreferences().deliveryDate);
      }
    });
    return () => {
      active = false;
      unsubscribeLochia();
      unsubscribePreferences();
    };
  }, [todayKey]);

  const summary = useMemo(
    () => computePostpartumLochiaSummary(deliveryDate, entries, tracking),
    [deliveryDate, entries, tracking],
  );

  const save = async () => {
    try {
      await savePostpartumLochiaEntry(todayKey, {
        flow,
        color,
        consistency,
        symptoms,
        note: note.trim() || undefined,
      });
    } catch (saveError) {
      // Not persisted: no confirmation, the form keeps what was entered (see services/saveFailure.ts).
      presentSaveFailure(saveError);
      return;
    }
    setSaveConfirmationVisible(true);
  };

  const finishTracking = () => {
    setEndDate(today);
    setFinishModalVisible(true);
  };

  // Single writer for a chosen end date: order rules first (never in the
  // future, never before delivery, never after an already recorded first
  // period — that date is never moved or deleted here), then the existing
  // markPostpartumLochiaEnded(date).
  const applyEndDate = async (date: Date): Promise<boolean> => {
    await hydratePostpartumPreferences();
    const preferences = getPostpartumPreferences();
    const check = validateLochiaEndDate({
      date,
      now: today,
      deliveryDate: preferences.deliveryDate,
      firstPostpartumPeriodDate: preferences.firstPostpartumPeriodDate,
    });
    if (!check.valid) {
      setEndDateError(check.message);
      return false;
    }
    try {
      await markPostpartumLochiaEnded(date.toLocaleDateString('en-CA'));
    } catch (saveError) {
      presentSaveFailure(saveError);
      return false;
    }
    return true;
  };

  const confirmFinishTracking = async () => {
    setFinishModalVisible(false);
    await applyEndDate(endDate ?? today);
  };

  const openEditEndDate = () => {
    setEndPicker('edit');
  };

  const handleEndDatePicked = (date: Date) => {
    const day = startOfDay(date);
    if (endPicker === 'edit') {
      applyEndDate(day);
      return;
    }
    setEndDate(day);
  };

  const closeEndPicker = () => {
    // Coming from the "mark as ended" confirmation: show it again with the
    // (possibly new) date.
    if (endPicker === 'finish') {
      setFinishModalVisible(true);
    }
    setEndPicker(null);
  };

  const retryEndDate = () => {
    setEndDateError(null);
    if (summary.status === 'ended') {
      setEndPicker('edit');
      return;
    }
    setFinishModalVisible(true);
  };

  const reopenTracking = async () => {
    await hydratePostpartumPreferences();
    if (getPostpartumPreferences().firstPostpartumPeriodDate) {
      setReopenConsistencyVisible(true);
      return;
    }
    setReopenModalVisible(true);
  };

  const confirmReopenTracking = async () => {
    setReopenModalVisible(false);
    try {
      await reopenPostpartumLochiaTracking();
    } catch (saveError) {
      presentSaveFailure(saveError);
    }
  };

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(dateFormatLocale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(today),
    [today],
  );
  const endDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(dateFormatLocale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(endDate ?? today),
    [endDate, today],
  );
  const deliveryDay = useMemo(
    () => (deliveryDate ? startOfDay(new Date(`${deliveryDate}T12:00:00`)) : null),
    [deliveryDate],
  );
  const endedDay = useMemo(
    () =>
      summary.endedDate
        ? startOfDay(new Date(`${summary.endedDate}T12:00:00`))
        : null,
    [summary.endedDate],
  );

  const toggleSymptom = (value: string) => {
    setSymptoms(current => {
      if (value === 'Aucun') {
        return ['Aucun'];
      }
      const withoutNone = current.filter(item => item !== 'Aucun');
      if (withoutNone.includes(value)) {
        const next = withoutNone.filter(item => item !== value);
        return next.length ? next : ['Aucun'];
      }
      return [...withoutNone, value];
    });
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />
        <View style={styles.page}>
          <View style={styles.header}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              icon="arrow-left"
            />
            <AwaText variant="headlineSmall">{t('postpartumLochia.header.title')}</AwaText>
            {/* Opens the existing Bibliothèque article on the lochia — the only
                educational content there is for this topic (no new content). */}
            <AwaIconButton
              accessibilityLabel={t('postpartumLochia.header.infoAccessibilityLabel')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() =>
                navigation.navigate('ArticleReader', {
                  articleId: LOCHIA_ARTICLE_ID,
                })
              }
              icon="information-outline"
              iconSize={20}
            />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AwaCard padding="none" variant="filled" style={styles.dateCard}>
              <View>
                <AwaText variant="labelSmall" colorRole="primary">{t('postpartumLochia.date.eyebrow')}</AwaText>
                <AwaText variant="labelMedium" style={styles.dateText}>{displayTitleCase(todayLabel)}</AwaText>
              </View>
              <View style={styles.calendarIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="calendar-month-outline"
                  size={20}
                />
              </View>
            </AwaCard>

            <AwaCard padding="none" variant="filled" style={styles.durationCard}>
              <View style={styles.durationHeader}>
                <View style={styles.durationIcon}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="timeline-clock-outline"
                    size={20}
                  />
                </View>
                <View style={styles.durationCopy}>
                  <AwaText variant="titleSmall">{t('postpartumLochia.duration.title')}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.durationSubtitle}>
                    {summary.status === 'no_data'
                      ? t('postpartumLochia.duration.subtitleNoData')
                      : summary.status === 'ended'
                      ? t('postpartumLochia.duration.subtitleEnded', {date: formatLocalDate(summary.endedDate)})
                      : t('postpartumLochia.duration.subtitleOngoing')}
                  </AwaText>
                </View>
              </View>
              <View style={styles.durationMetrics}>
                <DurationMetric
                  label={t('postpartumLochia.duration.metrics.start')}
                  styles={styles}
                  value={formatLocalDate(summary.deliveryDate)}
                />
                <DurationMetric
                  label={t('postpartumLochia.duration.metrics.lastRecorded')}
                  styles={styles}
                  value={formatLocalDate(summary.lastRecordedDate)}
                />
                <DurationMetric
                  label={t('postpartumLochia.duration.metrics.duration')}
                  styles={styles}
                  value={
                    summary.durationDays ? t('postpartumLochia.duration.metrics.daysValue', {days: summary.durationDays}) : '—'
                  }
                />
              </View>
              {summary.status === 'ended' ? (
                <AwaButton
                  icon="calendar-edit"
                  label={t('postpartumLochia.duration.editEndDate')}
                  onPress={openEditEndDate}
                  style={styles.endButton}
                  variant="tonal"
                />
              ) : null}
              <AwaButton
                icon={summary.status === 'ended' ? 'backup-restore' : 'check-circle-outline'}
                label={
                  summary.status === 'ended'
                    ? t('postpartumLochia.duration.resumeTracking')
                    : t('postpartumLochia.duration.finishedTracking')
                }
                onPress={summary.status === 'ended' ? reopenTracking : finishTracking}
                style={styles.endButton}
                variant={summary.status === 'ended' ? 'tonal' : 'filled'}
              />
            </AwaCard>

            <Section styles={styles} title={t('postpartumLochia.sections.flow')}>
              <View style={styles.flowRow}>
                {flowOptions.map(item => {
                  const selected = flow === item.label;
                  const displayLabel = journalOptionLabel('postpartumLochiaFlow', item.label, t);
                  return (
                    <Pressable
                      accessibilityLabel={displayLabel}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={item.label}
                      onPress={() => setFlow(item.label)}
                      style={[
                        styles.flowOption,
                        selected && styles.selectedBox,
                      ]}
                    >
                      <View
                        style={[
                          styles.flowIconCircle,
                          selected && styles.flowIconCircleSelected,
                        ]}
                      >
                        <MaterialDesignIcons
                          color={selected ? theme.colors.primary : theme.colors.textSecondary}
                          name={item.icon as never}
                          size={21}
                        />
                      </View>
                      <Text
                        style={[
                          styles.flowLabel,
                          selected && styles.selectedText,
                        ]}
                      >
                        {displayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title={t('postpartumLochia.sections.color')}>
              <View style={styles.colorRow}>
                {colorOptions.map(item => {
                  const selected = color === item.label;
                  const displayLabel = journalOptionLabel('postpartumLochiaColor', item.label, t);
                  return (
                    <Pressable
                      accessibilityLabel={displayLabel}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={item.label}
                      onPress={() => setColor(item.label)}
                      style={styles.colorOption}
                    >
                      <View
                        style={[
                          styles.colorOuter,
                          selected && styles.colorOuterSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.colorLabel,
                          selected && styles.selectedText,
                        ]}
                      >
                        {displayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title={t('postpartumLochia.sections.consistency')}>
              <View style={styles.consistencyRow}>
                {consistencyOptions.map(item => {
                  const selected = consistency === item;
                  const displayLabel = journalOptionLabel('postpartumLochiaConsistency', item, t);
                  return (
                    <Pressable
                      accessibilityLabel={displayLabel}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={item}
                      onPress={() => setConsistency(item)}
                      style={[
                        styles.consistencyChip,
                        selected && styles.selectedBox,
                      ]}
                    >
                      <Text
                        style={[
                          styles.consistencyText,
                          selected && styles.selectedText,
                        ]}
                      >
                        {displayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title={t('postpartumLochia.sections.symptoms')}>
              <View style={styles.symptomWrap}>
                {symptomOptions.map(item => {
                  const selected = symptoms.includes(item);
                  const displayLabel = journalOptionLabel('postpartumLochiaSymptom', item, t);
                  return (
                    <Pressable
                      accessibilityLabel={displayLabel}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      key={item}
                      onPress={() => toggleSymptom(item)}
                      style={[
                        styles.symptomChip,
                        selected && styles.selectedBox,
                      ]}
                    >
                      <Text
                        style={[
                          styles.symptomText,
                          selected && styles.selectedText,
                        ]}
                      >
                        {displayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title={t('postpartumLochia.sections.notes')}>
              <AwaCard padding="none" variant="filled" style={styles.noteBox}>
                <TextInput
                  accessibilityLabel={t('postpartumLochia.sections.notes')}
                  maxLength={300}
                  multiline
                  onChangeText={setNote}
                  placeholder={t('postpartumLochia.notes.placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.noteInput}
                  textAlignVertical="top"
                  value={note}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.counter}>{note.length} / 300</AwaText>
              </AwaCard>
            </Section>

            <View style={styles.reassurance}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="heart-outline"
                size={18}
              />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.reassuranceText}>
                {t('postpartumLochia.reassuranceText')}
              </AwaText>
            </View>

            <AwaButton
              accessibilityRole="button"
              onPress={save}
              label={t('common.save')}
              icon="content-save-outline"
              style={styles.saveButton}
            />
          </ScrollView>
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setFinishModalVisible(false)}
          statusBarTranslucent
          transparent
          visible={finishModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              accessibilityLabel={t('postpartumLochia.modals.closeConfirmationAccessibilityLabel')}
              onPress={() => setFinishModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <AwaCard padding="none" variant="elevated" accessibilityRole="alert" style={styles.confirmModalCard}>
              <View style={styles.confirmIconWrap}>
                <View style={styles.confirmIconHalo}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="check-circle-outline"
                    size={34}
                  />
                </View>
              </View>

              <AwaText variant="headlineSmall" style={styles.confirmTitle}>
                {t('postpartumLochia.finishModal.title')}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.confirmText}>
                {t('postpartumLochia.finishModal.textBefore')} <AwaText variant="titleSmall" style={styles.confirmDate}>{displayTitleCase(endDateLabel)}</AwaText> {t('postpartumLochia.finishModal.textAfter')}
              </AwaText>

              <AwaButton
                icon="calendar-edit"
                label={t('postpartumLochia.finishModal.editDate')}
                onPress={() => {
                  setFinishModalVisible(false);
                  setEndPicker('finish');
                }}
                style={styles.endButton}
                variant="tonal"
              />

              <View style={styles.confirmInfoBox}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={18}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.confirmInfoText}>
                  {t('postpartumLochia.finishModal.infoText')}
                </AwaText>
              </View>

              <View style={styles.confirmActions}>
                <AwaButton
                  accessibilityRole="button"
                  onPress={() => setFinishModalVisible(false)}
                  label={t('common.cancel')}
                  variant="tonal"
                  style={styles.confirmCancelButton}
                />

                <AwaButton
                  icon="check"
                  label={t('postpartumLochia.finishModal.confirm')}
                  onPress={confirmFinishTracking}
                  style={styles.confirmPrimaryButton}
                />
              </View>
            </AwaCard>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => setReopenModalVisible(false)}
          statusBarTranslucent
          transparent
          visible={reopenModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              accessibilityLabel={t('postpartumLochia.modals.closeConfirmationAccessibilityLabel')}
              onPress={() => setReopenModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <AwaCard padding="none" variant="elevated" accessibilityRole="alert" style={styles.confirmModalCard}>
              <View style={styles.confirmIconWrap}>
                <View style={[styles.confirmIconHalo, styles.reopenIconHalo]}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="backup-restore"
                    size={34}
                  />
                </View>
              </View>

              <AwaText variant="headlineSmall" style={styles.confirmTitle}>{t('postpartumLochia.reopenModal.title')}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.confirmText}>
                {t('postpartumLochia.reopenModal.text')}
              </AwaText>

              <View style={styles.confirmInfoBox}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={18}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.confirmInfoText}>
                  {t('postpartumLochia.reopenModal.infoText')}
                </AwaText>
              </View>

              <View style={styles.confirmActions}>
                <AwaButton
                  accessibilityRole="button"
                  onPress={() => setReopenModalVisible(false)}
                  label={t('common.cancel')}
                  variant="tonal"
                  style={styles.confirmCancelButton}
                />

                <AwaButton
                  icon="backup-restore"
                  label={t('postpartumLochia.reopenModal.confirm')}
                  onPress={confirmReopenTracking}
                  style={styles.confirmPrimaryButton}
                />
              </View>
            </AwaCard>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => setSaveConfirmationVisible(false)}
          statusBarTranslucent
          transparent
          visible={saveConfirmationVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              accessibilityLabel={t('postpartumLochia.modals.closeConfirmationAccessibilityLabel')}
              onPress={() => setSaveConfirmationVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <AwaCard padding="none" variant="elevated" accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.confirmModalCard}>
              <View style={styles.confirmIconWrap}>
                <View style={styles.confirmIconHalo}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="check-circle-outline"
                    size={34}
                  />
                </View>
              </View>

              <AwaText variant="headlineSmall" style={styles.confirmTitle}>{t('postpartumLochia.header.title')}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.confirmText}>
                {t('postpartumLochia.saveConfirmation.text')}
              </AwaText>

              <AwaButton
                accessibilityLabel="OK"
                label="OK"
                onPress={() => setSaveConfirmationVisible(false)}
                style={styles.confirmSingleButton}
              />
            </AwaCard>
          </View>
        </Modal>

        <PostpartumConsistencyModal
          visible={reopenConsistencyVisible}
          title={t('postpartumLochia.reopenConsistency.title')}
          message={t('postpartumLochia.reopenConsistency.message')}
          infoText={t('postpartumLochia.reopenConsistency.infoText')}
          primaryLabel={t('postpartumLochia.reopenConsistency.primaryLabel')}
          onPrimary={() => {
            setReopenConsistencyVisible(false);
            navigation.navigate('PostpartumCycleReturn');
          }}
          onSecondary={() => setReopenConsistencyVisible(false)}
          onRequestClose={() => setReopenConsistencyVisible(false)}
        />

        <InlineCalendarPickerModal
          maximumDate={today}
          minimumDate={deliveryDay ?? undefined}
          onClose={closeEndPicker}
          onSelect={handleEndDatePicked}
          subtitle={t('postpartumLochia.picker.subtitle')}
          title={t('postpartumLochia.picker.title')}
          value={endPicker === 'edit' ? endedDay ?? today : endDate ?? today}
          visible={endPicker !== null}
        />

        <PostpartumConsistencyModal
          visible={endDateError !== null}
          title={t('postpartumLochia.endDateError.title')}
          message={endDateError ?? ''}
          infoText={t('postpartumLochia.endDateError.infoText')}
          primaryLabel={t('postpartumLochia.endDateError.primaryLabel')}
          onPrimary={retryEndDate}
          onSecondary={() => setEndDateError(null)}
          onRequestClose={() => setEndDateError(null)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const formatLocalDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat(dateFormatLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T12:00:00`))
    : i18n.t('postpartumLochia.notProvided');

function DurationMetric({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.durationMetric}>
      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.durationMetricLabel}>{label}</AwaText>
      <AwaText variant="labelSmall" style={styles.durationMetricValue}>
        {value}
      </AwaText>
    </View>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <AwaCard padding="none" variant="filled" style={styles.sectionCard}>
      <AwaText variant="labelMedium" style={styles.sectionTitle}>{title}</AwaText>
      {children}
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: { flex: 1, backgroundColor: theme.colors.background },





  safeArea: { flex: 1, backgroundColor: 'transparent' },
  page: { flex: 1 },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: { paddingHorizontal: 14 },
  dateCard: {minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10},
  durationCard: {marginBottom: 10, padding: 14},
  durationHeader: { flexDirection: 'row', alignItems: 'center' },
  durationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  durationCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  durationSubtitle: {marginTop: 2},
  durationMetrics: {
    flexDirection: 'row',
    marginTop: 13,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  durationMetric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  durationMetricLabel: {textAlign: 'center'},
  durationMetricValue: {marginTop: 3, textAlign: 'center'},
  endButton: {marginTop: 12},
  dateText: {marginTop: 3, textTransform: 'capitalize'},
  calendarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  sectionCard: {marginBottom: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 13},
  sectionTitle: {marginBottom: 10},
  flowRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  flowOption: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  flowIconCircle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: theme.colors.primarySoft,
  },
  flowIconCircleSelected: { backgroundColor: theme.colors.primarySoft },
  flowLabel: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  colorOption: { width: '19%', alignItems: 'center' },
  colorOuter: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colorOuterSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  colorDot: { width: 25, height: 25, borderRadius: 13 },
  colorLabel: {
    minHeight: 25,
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  consistencyRow: { flexDirection: 'row', gap: 7 },
  consistencyChip: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 7,
  },
  consistencyText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  symptomWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  symptomChip: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 13,
  },
  symptomText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  selectedBox: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  selectedText: { color: theme.colors.text, fontWeight: '800' },
  noteBox: {minHeight: 104, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 25},
  noteInput: {
    minHeight: 64,
    padding: 0,
    color: theme.colors.text,
    fontSize: 11,
    lineHeight: 16,
  },
  counter: {position: 'absolute', right: 10, bottom: 8},
  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.92),
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reassuranceText: {flex: 1},
  saveButton: {width: '88%', maxWidth: 360, alignSelf: 'center'},

  // Fixed — a modal dim/scrim, not a surface; overlay dims stay dark
  // regardless of the resolved theme so the sheet above it always pops
  // (same PostpartumDashboard nifasModalOverlay precedent).
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,20,69,0.40)',
    paddingHorizontal: 22,
  },
  confirmModalCard: {width: '100%', maxWidth: 390, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18},
  confirmIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmIconHalo: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },
  reopenIconHalo: {
    backgroundColor: theme.colors.primarySoft,
  },
  confirmTitle: {textAlign: 'center'},
  confirmText: {marginTop: 9, textAlign: 'center'},
  confirmDate: {textTransform: 'capitalize'},
  confirmInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  confirmInfoText: {flex: 1},
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  confirmCancelButton: {flex: 1},
  confirmPrimaryButton: {flex: 1.2},
  // Used only by the save-confirmation modal, which has a single "OK"
  // action outside the two-button confirmActions row — overrides
  // confirmPrimaryButton's flex:1.2 (meant for a row sibling) so the button
  // stays a normal-height standalone control instead of stretching to fill
  // the column.
  confirmSingleButton: {
    flex: 0,
    marginTop: 18,
  },

  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  });
}

export default PostpartumLochiaScreen;
