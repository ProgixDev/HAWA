import React, { useEffect, useMemo, useState } from 'react';
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
import { onPrimaryTextColor, withAlpha, type ResolvedAwaTheme } from '../theme/awaThemeTokens';
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
import { PostpartumConsistencyModal } from '../components/postpartum/PostpartumConsistencyModal';

type Props = NativeStackScreenProps<RootStackParamList, 'PostpartumLochia'>;
type Flow = 'Très léger' | 'Léger' | 'Modéré' | 'Abondant';
type LochiaColor = 'Rouge vif' | 'Rouge' | 'Rose' | 'Brun' | 'Jaune / blanc';
type Consistency = 'Liquide' | 'Épais' | 'Avec petits caillots';

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
  const [deliveryDate, setDeliveryDate] = useState(
    getPostpartumPreferences().deliveryDate,
  );
  const [entries, setEntries] = useState<Record<string, PostpartumLochiaEntry>>(
    {},
  );
  const [tracking, setTracking] = useState<PostpartumLochiaTracking>(
    getPostpartumLochiaTracking,
  );
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

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

  const save = () => {
    savePostpartumLochiaEntry(todayKey, {
      flow,
      color,
      consistency,
      symptoms,
      note: note.trim() || undefined,
    });
    setSaveConfirmationVisible(true);
  };

  const finishTracking = () => {
    setFinishModalVisible(true);
  };

  const confirmFinishTracking = async () => {
    setFinishModalVisible(false);
    await markPostpartumLochiaEnded(todayKey);
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
    await reopenPostpartumLochiaTracking();
  };

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
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
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />
        <View style={styles.page}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              style={styles.backButton}
            >
              <MaterialDesignIcons
                color={theme.colors.text}
                name="arrow-left"
                size={24}
              />
            </Pressable>
            <Text style={styles.headerTitle}>Lochies</Text>
            <View style={styles.infoButton}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="information-outline"
                size={20}
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dateCard}>
              <View>
                <Text style={styles.dateEyebrow}>AUJOURD'HUI</Text>
                <Text style={styles.dateText}>{todayLabel}</Text>
              </View>
              <View style={styles.calendarIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="calendar-month-outline"
                  size={20}
                />
              </View>
            </View>

            <View style={styles.durationCard}>
              <View style={styles.durationHeader}>
                <View style={styles.durationIcon}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="timeline-clock-outline"
                    size={20}
                  />
                </View>
                <View style={styles.durationCopy}>
                  <Text style={styles.durationTitle}>Durée des lochies</Text>
                  <Text style={styles.durationSubtitle}>
                    {summary.status === 'no_data'
                      ? 'Aucune observation enregistrée pour le moment.'
                      : summary.status === 'ended'
                      ? `Terminées le ${formatLocalDate(summary.endedDate)}`
                      : 'Suivi médical en cours'}
                  </Text>
                </View>
              </View>
              <View style={styles.durationMetrics}>
                <DurationMetric
                  label="Début"
                  styles={styles}
                  value={formatLocalDate(summary.deliveryDate)}
                />
                <DurationMetric
                  label="Dernier relevé"
                  styles={styles}
                  value={formatLocalDate(summary.lastRecordedDate)}
                />
                <DurationMetric
                  label="Durée"
                  styles={styles}
                  value={
                    summary.durationDays ? `${summary.durationDays} jours` : '—'
                  }
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={
                  summary.status === 'ended' ? reopenTracking : finishTracking
                }
                style={({ pressed }) => [
                  styles.endButton,
                  summary.status === 'ended' && styles.reopenButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  color={summary.status === 'ended' ? theme.colors.primary : onPrimaryTextColor(theme)}
                  name={
                    summary.status === 'ended'
                      ? 'backup-restore'
                      : 'check-circle-outline'
                  }
                  size={18}
                />
                <Text
                  style={[
                    styles.endButtonText,
                    summary.status === 'ended' && styles.reopenButtonText,
                  ]}
                >
                  {summary.status === 'ended'
                    ? 'Corriger et reprendre le suivi'
                    : 'Mes lochies sont terminées'}
                </Text>
              </Pressable>
            </View>

            <Section styles={styles} title="Flux">
              <View style={styles.flowRow}>
                {flowOptions.map(item => {
                  const selected = flow === item.label;
                  return (
                    <Pressable
                      accessibilityLabel={item.label}
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
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title="Couleur">
              <View style={styles.colorRow}>
                {colorOptions.map(item => {
                  const selected = color === item.label;
                  return (
                    <Pressable
                      accessibilityLabel={item.label}
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
                        numberOfLines={2}
                        style={[
                          styles.colorLabel,
                          selected && styles.selectedText,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title="Consistance">
              <View style={styles.consistencyRow}>
                {consistencyOptions.map(item => {
                  const selected = consistency === item;
                  return (
                    <Pressable
                      accessibilityLabel={item}
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
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title="Symptômes associés">
              <View style={styles.symptomWrap}>
                {symptomOptions.map(item => {
                  const selected = symptoms.includes(item);
                  return (
                    <Pressable
                      accessibilityLabel={item}
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
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section styles={styles} title="Notes">
              <View style={styles.noteBox}>
                <TextInput
                  accessibilityLabel="Notes"
                  maxLength={300}
                  multiline
                  onChangeText={setNote}
                  placeholder="Ajoute une note si tu le souhaites..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.noteInput}
                  textAlignVertical="top"
                  value={note}
                />
                <Text style={styles.counter}>{note.length} / 300</Text>
              </View>
            </Section>

            <View style={styles.reassurance}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="heart-outline"
                size={18}
              />
              <Text style={styles.reassuranceText}>
                Observe simplement l’évolution jour après jour. Chaque corps
                récupère à son propre rythme.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialDesignIcons
                color={onPrimaryTextColor(theme)}
                name="content-save-outline"
                size={20}
              />
              <Text style={styles.saveText}>Enregistrer</Text>
            </Pressable>
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
              accessibilityLabel="Fermer la confirmation"
              onPress={() => setFinishModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View accessibilityRole="alert" style={styles.confirmModalCard}>
              <View style={styles.confirmIconWrap}>
                <View style={styles.confirmIconHalo}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="check-circle-outline"
                    size={34}
                  />
                </View>
              </View>

              <Text style={styles.confirmTitle}>
                Terminer le suivi des lochies ?
              </Text>

              <Text style={styles.confirmText}>
                Le <Text style={styles.confirmDate}>{todayLabel}</Text> sera
                enregistré comme date de fin.
              </Text>

              <View style={styles.confirmInfoBox}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={18}
                />
                <Text style={styles.confirmInfoText}>
                  Tu pourras corriger ce choix plus tard et reprendre le suivi
                  si nécessaire.
                </Text>
              </View>

              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFinishModalVisible(false)}
                  style={({ pressed }) => [
                    styles.confirmCancelButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmCancelText}>Annuler</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={confirmFinishTracking}
                  style={({ pressed }) => [
                    styles.confirmPrimaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={18} />
                  <Text style={styles.confirmPrimaryText}>Confirmer</Text>
                </Pressable>
              </View>
            </View>
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
              accessibilityLabel="Fermer la confirmation"
              onPress={() => setReopenModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View accessibilityRole="alert" style={styles.confirmModalCard}>
              <View style={styles.confirmIconWrap}>
                <View style={[styles.confirmIconHalo, styles.reopenIconHalo]}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="backup-restore"
                    size={34}
                  />
                </View>
              </View>

              <Text style={styles.confirmTitle}>Reprendre le suivi ?</Text>

              <Text style={styles.confirmText}>
                La date de fin des lochies sera retirée et le suivi redeviendra
                actif.
              </Text>

              <View style={styles.confirmInfoBox}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={18}
                />
                <Text style={styles.confirmInfoText}>
                  Tes observations déjà enregistrées seront conservées. Tu
                  pourras continuer ton suivi à partir d’aujourd’hui.
                </Text>
              </View>

              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setReopenModalVisible(false)}
                  style={({ pressed }) => [
                    styles.confirmCancelButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmCancelText}>Annuler</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={confirmReopenTracking}
                  style={({ pressed }) => [
                    styles.confirmPrimaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialDesignIcons
                    color={onPrimaryTextColor(theme)}
                    name="backup-restore"
                    size={18}
                  />
                  <Text style={styles.confirmPrimaryText}>Reprendre</Text>
                </Pressable>
              </View>
            </View>
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
              accessibilityLabel="Fermer la confirmation"
              onPress={() => setSaveConfirmationVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.confirmModalCard}>
              <View style={styles.confirmIconWrap}>
                <View style={styles.confirmIconHalo}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="check-circle-outline"
                    size={34}
                  />
                </View>
              </View>

              <Text style={styles.confirmTitle}>Lochies</Text>

              <Text style={styles.confirmText}>
                Tes observations du jour ont été enregistrées.
              </Text>

              <Pressable
                accessibilityLabel="OK"
                accessibilityRole="button"
                onPress={() => setSaveConfirmationVisible(false)}
                style={({ pressed }) => [
                  styles.confirmPrimaryButton,
                  styles.confirmSingleButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmPrimaryText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <PostpartumConsistencyModal
          visible={reopenConsistencyVisible}
          title="Vérifie ton suivi"
          message="Une reprise du cycle est déjà enregistrée alors que tu souhaites reprendre le suivi des lochies."
          infoText="Ces deux informations peuvent devenir incohérentes. Vérifie ton suivi avant de continuer."
          primaryLabel="Voir le retour du cycle"
          onPrimary={() => {
            setReopenConsistencyVisible(false);
            navigation.navigate('PostpartumCycleReturn');
          }}
          onSecondary={() => setReopenConsistencyVisible(false)}
          onRequestClose={() => setReopenConsistencyVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const formatLocalDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T12:00:00`))
    : 'Non renseigné';

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
      <Text style={styles.durationMetricLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.durationMetricValue}>
        {value}
      </Text>
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
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: { flex: 1, backgroundColor: theme.colors.background },

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
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
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
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.surface, 0.86),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
  },
  infoButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 14 },
  dateCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  durationCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    padding: 14,
  },
  durationHeader: { flexDirection: 'row', alignItems: 'center' },
  durationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },
  durationCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  durationTitle: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '800',
  },
  durationSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 13,
  },
  durationMetrics: {
    flexDirection: 'row',
    marginTop: 13,
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
    paddingVertical: 10,
  },
  durationMetric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  durationMetricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8.5,
    textAlign: 'center',
  },
  durationMetricValue: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  endButton: {
    minHeight: 43,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  reopenButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },
  endButtonText: { color: onPrimaryTextColor(theme), fontSize: 11.5, fontWeight: '800' },
  reopenButtonText: { color: theme.colors.primary },
  dateEyebrow: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  dateText: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calendarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  sectionCard: {
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 13,
  },
  sectionTitle: {
    marginBottom: 10,
    color: theme.colors.text,
    fontSize: 13.5,
    fontWeight: '800',
  },
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
    paddingHorizontal: 4,
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
    fontSize: 9.5,
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
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: 'center',
  },
  consistencyRow: { flexDirection: 'row', gap: 7 },
  consistencyChip: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 7,
  },
  consistencyText: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
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
  symptomText: { color: theme.colors.textSecondary, fontSize: 9.8, fontWeight: '600' },
  selectedBox: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  selectedText: { color: theme.colors.text, fontWeight: '800' },
  noteBox: {
    minHeight: 104,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 25,
  },
  noteInput: {
    minHeight: 64,
    padding: 0,
    color: theme.colors.text,
    fontSize: 11,
    lineHeight: 16,
  },
  counter: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    color: theme.colors.textSecondary,
    fontSize: 9,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.92),
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reassuranceText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },
  saveButton: {
    width: '88%',
    maxWidth: 360,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 5,
  },
  saveText: { color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '800' },

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
  confirmModalCard: {
    width: '100%',
    maxWidth: 390,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 12,
  },
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
  confirmTitle: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmText: {
    marginTop: 9,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  confirmDate: {
    color: theme.colors.text,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
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
  confirmInfoText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  confirmCancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },
  confirmCancelText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  confirmPrimaryButton: {
    flex: 1.2,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmPrimaryText: {
    color: onPrimaryTextColor(theme),
    fontSize: 13,
    fontWeight: '800',
  },
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
