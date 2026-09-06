import React, {useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getTopPadding} from '../../theme/spacing';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {ensureNotificationPermission} from '../../services/pregnancyNotifications';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

import {
  getIrregularPreferences,
  hydrateIrregularPreferences,
  setIrregularPreferences,
  type IrregularCyclePattern,
  type IrregularTrackedItem,
} from '../../state/irregularPreferences';

// Onboarding for "Cycles irréguliers / SOPK" (ObjectiveId 'irregular') — the
// SAME 4-screen Shell/Choice/Info pattern already established by
// ConceptionOnboardingScreens.tsx (colors/spacing/animation copied verbatim
// for visual consistency), adapted to SOPK's own 4 questions. None of these
// answers are ever used to diagnose PCOS or to classify a long cycle as
// "late" — see irregularPreferences.ts's and irregularReminderScheduling.ts's
// own header comments for the same rule enforced on the data/scheduling side.

/* ============================================================
 * TYPES
 * ============================================================ */

type RouteName =
  | 'IrregularCyclePattern'
  | 'IrregularLastPeriod'
  | 'IrregularTrackedItems'
  | 'IrregularReminders';

type Props = NativeStackScreenProps<RootStackParamList, RouteName>;

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

/* ============================================================
 * OPTIONS
 * ============================================================ */

const cyclePatternOptions: Array<{id: IrregularCyclePattern; label: string; description: string; icon: IconName}> = [
  {
    id: 'regular',
    label: 'Plutôt réguliers',
    description: 'Mes cycles reviennent à peu près à la même fréquence.',
    icon: 'sync',
  },
  {
    id: 'irregular',
    label: 'Irréguliers',
    description: 'La durée de mes cycles varie sensiblement d’un mois à l’autre.',
    icon: 'chart-timeline-variant',
  },
  {
    id: 'very_variable',
    label: 'Très variables',
    description: 'Mes cycles peuvent être très courts ou très longs, sans schéma clair.',
    icon: 'chart-bell-curve-cumulative',
  },
  {
    id: 'unknown',
    label: 'Je ne sais pas encore',
    description: 'Je préfère observer avec AWA avant de me prononcer.',
    icon: 'help-circle-outline',
  },
];

const trackedItemOptions: Array<{
  id: IrregularTrackedItem;
  label: string;
  description?: string;
  icon: IconName;
}> = [
  {
    id: 'acne',
    label: 'Acné',
    icon: 'face-woman-outline',
  },
  {
    id: 'hairGrowth',
    label: 'Pilosité',
    icon: 'human-male',
  },
  {
    id: 'weight',
    label: 'Poids',
    icon: 'scale-bathroom',
  },
  {
    id: 'pain',
    label: 'Douleurs',
    icon: 'lightning-bolt-outline',
  },
  {
    id: 'mood',
    label: 'Humeur',
    icon: 'emoticon-happy-outline',
  },
  {
    id: 'fatigue',
    label: 'Fatigue',
    icon: 'battery-medium',
  },
  {
    id: 'otherSymptoms',
    label: 'Autres symptômes',
    description: 'Nausées, douleurs mammaires, ballonnements, etc.',
    icon: 'dots-horizontal',
  },
];

/* ============================================================
 * SHARED ONBOARDING SHELL — same structure as ConceptionOnboardingScreens.tsx's
 * Shell, kept local to this file since it's SOPK-specific copy (step count,
 * button labels) and this file is meant to stand alone.
 * ============================================================ */

function Shell({
  navigation,
  step,
  title,
  subtitle,
  children,
  nextDisabled,
  nextLabel,
  onNext,
  theme,
  styles,
}: Props & {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  nextDisabled?: boolean;
  nextLabel?: string;
  onNext: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(getTopPadding(insets.top) - 10, insets.top + 6),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Pressable
            accessibilityLabel="Revenir à l’étape précédente"
            accessibilityRole="button"
            hitSlop={8}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
          </Pressable>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {children}

        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            disabled={nextDisabled}
            onPress={onNext}
            style={({pressed}) => [
              styles.primary,
              nextDisabled && styles.disabled,
              pressed && !nextDisabled && styles.primaryPressed,
            ]}>
            <Text style={styles.primaryText}>{nextLabel ?? (step === 4 ? 'Continuer' : 'Suivant')}</Text>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="arrow-right" size={18} />
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/* ============================================================
 * 1 — CYCLE PATTERN
 * ============================================================ */

export function IrregularCyclePatternScreen({navigation, route}: Props) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selected, setSelected] = useState<IrregularCyclePattern | null>(
    () => getIrregularPreferences().cyclePattern,
  );

  useEffect(() => {
    hydrateIrregularPreferences().then(value => setSelected(value.cyclePattern));
  }, []);

  return (
    <Shell
      navigation={navigation}
      nextDisabled={!selected}
      onNext={async () => {
        if (!selected) {return;}
        await setIrregularPreferences({cyclePattern: selected});
        if (route.params?.mode === 'edit') {
          navigation.goBack();
          return;
        }
        navigation.navigate('IrregularLastPeriod');
      }}
      route={route}
      step={1}
      styles={styles}
      subtitle="Cela nous aide à adapter ton suivi, sans jamais poser de diagnostic."
      theme={theme}
      title="Comment sont généralement tes cycles ?">
      <View style={[styles.list, styles.listTop]}>
        {cyclePatternOptions.map(item => (
          <Choice
            description={item.description}
            icon={item.icon}
            key={item.id}
            label={item.label}
            onPress={() => setSelected(item.id)}
            selected={selected === item.id}
            styles={styles}
            theme={theme}
          />
        ))}
      </View>

      <Info
        styles={styles}
        text="Chaque cycle est différent. AWA t’accompagne pour mieux comprendre le tien, à ton rythme."
        theme={theme}
      />
    </Shell>
  );
}

/* ============================================================
 * 2 — LAST PERIOD DATE
 * ============================================================ */

export function IrregularLastPeriodScreen({navigation, route}: Props) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const stored = getIrregularPreferences().lastPeriodDate;
    return stored ? new Date(`${stored}T12:00:00`) : null;
  });
  const [skipped, setSkipped] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    hydrateIrregularPreferences().then(value => {
      setSelectedDate(value.lastPeriodDate ? new Date(`${value.lastPeriodDate}T12:00:00`) : null);
    });
  }, []);

  const formattedDate = selectedDate
    ? new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(selectedDate)
    : null;

  return (
    <Shell
      navigation={navigation}
      onNext={async () => {
        // Neutral/null state when skipped or never chosen — never a
        // fabricated default date (spec requirement).
        const lastPeriodDate = !skipped && selectedDate ? selectedDate.toLocaleDateString('en-CA') : null;
        await setIrregularPreferences({lastPeriodDate});
        if (route.params?.mode === 'edit') {
          navigation.goBack();
          return;
        }
        navigation.navigate('IrregularTrackedItems');
      }}
      route={route}
      step={2}
      styles={styles}
      subtitle="Cette information reste indicative — elle ne détermine jamais un retard."
      theme={theme}
      title="Quand ont commencé tes dernières règles ?">
      <View style={[styles.list, styles.listTop]}>
        <Pressable
          accessibilityLabel={formattedDate ? `Date sélectionnée : ${formattedDate}` : 'Choisir une date'}
          accessibilityRole="button"
          onPress={() => {
            setSkipped(false);
            setPickerVisible(true);
          }}
          style={({pressed}) => [
            styles.dateField,
            !skipped && selectedDate && styles.dateFieldSelected,
            pressed && styles.choicePressed,
          ]}>
          <View style={styles.dateFieldIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={22} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.label}>Choisir une date</Text>
            <Text style={styles.description}>{formattedDate ?? 'JJ / MM / AAAA'}</Text>
          </View>
        </Pressable>

        <Choice
          checkbox
          description="Je préfère renseigner cette information plus tard, depuis mon Journal."
          icon="calendar-remove-outline"
          label="Je ne sais pas / Je préfère renseigner plus tard"
          onPress={() => setSkipped(true)}
          selected={skipped || !selectedDate}
          styles={styles}
          theme={theme}
        />
      </View>

      <Info icon="lightbulb-outline" styles={styles} text="Pas de souci si tu ne sais pas encore. Tu pourras toujours l’ajouter plus tard." theme={theme} />

      <InlineCalendarPickerModal
        maximumDate={new Date()}
        onClose={() => setPickerVisible(false)}
        onSelect={date => {
          setSelectedDate(date);
          setSkipped(false);
          setPickerVisible(false);
        }}
        subtitle="Sélectionne le premier jour de tes dernières règles."
        title="Dernières règles"
        value={selectedDate ?? new Date()}
        visible={pickerVisible}
      />
    </Shell>
  );
}

/* ============================================================
 * 3 — TRACKED ITEMS
 * ============================================================ */

export function IrregularTrackedItemsScreen({navigation, route}: Props) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selected, setSelected] = useState<Set<IrregularTrackedItem>>(
    () => new Set(getIrregularPreferences().trackedItems),
  );

  useEffect(() => {
    hydrateIrregularPreferences().then(value => setSelected(new Set(value.trackedItems)));
  }, []);

  const toggle = (id: IrregularTrackedItem) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Shell
      navigation={navigation}
      nextDisabled={selected.size === 0}
      onNext={async () => {
        await setIrregularPreferences({trackedItems: [...selected]});
        if (route.params?.mode === 'edit') {
          navigation.goBack();
          return;
        }
        navigation.navigate('IrregularReminders');
      }}
      route={route}
      step={3}
      styles={styles}
      subtitle="Sélectionne ceux qui sont importants pour toi. Tu pourras les modifier à tout moment."
      theme={theme}
      title="Quels éléments souhaites-tu suivre ?">
      <View style={[styles.list, styles.listTop, styles.trackedItemsList]}>
        {trackedItemOptions.map(item => (
          <Choice
            checkbox
            compact
            description={item.description}
            icon={item.icon}
            key={item.id}
            label={item.label}
            onPress={() => toggle(item.id)}
            selected={selected.has(item.id)}
            styles={styles}
            theme={theme}
          />
        ))}
      </View>

      <Info icon="notebook-outline" styles={styles} text="Tu retrouveras toujours l’ensemble de ton Journal quotidien, quels que soient tes choix ici." theme={theme} />
    </Shell>
  );
}

/* ============================================================
 * 4 — REMINDERS
 * ============================================================ */

// Same local 'HH:mm' formatting/parsing convention as CycleRemindersScreen.tsx/
// MenopauseRemindersScreen.tsx's own un-exported helpers — kept local since
// it's pure UI display formatting.
function formatTimeValue(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(date);
}
function parseTimeToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

type RemindersProps = NativeStackScreenProps<RootStackParamList, 'IrregularReminders'>;

export function IrregularRemindersScreen({navigation, route}: RemindersProps) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Same canonical irregularPreferences.ts store regardless of mode — this is
  // what makes onboarding and Profile → Notifications & rappels literally the
  // same setting rather than two disconnected copies (see
  // irregularReminderScheduling.ts, the sole scheduler, which reads this
  // exact store). Reached with {mode:'edit'} from ProfileScreen.tsx and
  // SummaryScreen.tsx; defaults to 'onboarding' for the real onboarding flow.
  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';
  const insets = useSafeAreaInsets();

  const initial = getIrregularPreferences().reminders;
  const [dailyJournalEnabled, setDailyJournalEnabled] = useState(initial.dailyJournalEnabled);
  const [dailyJournalTime, setDailyJournalTime] = useState<string | null>(initial.dailyJournalTime);
  const [unrecordedPeriodEnabled, setUnrecordedPeriodEnabled] = useState(initial.unrecordedPeriodEnabled);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissionNotice, setPermissionNotice] = useState(false);

  useEffect(() => {
    hydrateIrregularPreferences().then(value => {
      setDailyJournalEnabled(value.reminders.dailyJournalEnabled);
      setDailyJournalTime(value.reminders.dailyJournalTime);
      setUnrecordedPeriodEnabled(value.reminders.unrecordedPeriodEnabled);
    });
  }, []);

  const goToNext = () => {
    if (isEdit) {
      navigation.goBack();
    } else {
      navigation.navigate('SecuritySetup');
    }
  };

  const handleSave = async () => {
    if (saving) {return;}
    if (dailyJournalEnabled && !dailyJournalTime) {
      setError('Choisis une heure pour ton rappel de journal quotidien.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await setIrregularPreferences({
        reminders: {dailyJournalEnabled, dailyJournalTime, unrecordedPeriodEnabled},
      });

      if (dailyJournalEnabled || unrecordedPeriodEnabled) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          setPermissionNotice(true);
          return;
        }
      }

      goToNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(getTopPadding(insets.top) - 10, insets.top + 6),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.progressRow}>
            {isEdit ? (
              <Pressable
                accessibilityLabel="Retour"
                accessibilityRole="button"
                hitSlop={8}
                onPress={navigation.goBack}
                style={({pressed}) => [styles.back, pressed && styles.pressed]}>
                <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.title}>Quels rappels souhaites-tu recevoir ?</Text>
          <Text style={styles.subtitle}>
            {isEdit
              ? 'Choisis les rappels qui t’accompagnent dans ton suivi.'
              : 'Choisis seulement les rappels qui te sont vraiment utiles. Tu pourras les modifier à tout moment depuis ton profil.'}
          </Text>

          <View style={[styles.list, styles.listTop]}>
            <View style={styles.reminderCard}>
              <View style={styles.reminderTopRow}>
                <View style={styles.reminderIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={22} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.label}>Journal quotidien</Text>
                  <Text style={styles.description}>
                    Comment te sens-tu aujourd’hui ? Pense à mettre ton suivi à jour.
                  </Text>
                </View>
                <Switch
                  accessibilityRole="switch"
                  ios_backgroundColor={theme.colors.surfaceSecondary}
                  onValueChange={value => {
                    setDailyJournalEnabled(value);
                    setError('');
                  }}
                  thumbColor={theme.colors.surface}
                  trackColor={{false: theme.colors.surfaceSecondary, true: theme.colors.primary}}
                  value={dailyJournalEnabled}
                />
              </View>

              {dailyJournalEnabled ? (
                <Pressable
                  accessibilityLabel={dailyJournalTime ? `Heure du rappel, ${dailyJournalTime}` : 'Choisir une heure de rappel'}
                  accessibilityRole="button"
                  onPress={() => setTimePickerVisible(true)}
                  style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                  <View style={styles.dateFieldIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.timeLabel}>Heure du rappel</Text>
                    <Text style={dailyJournalTime ? styles.timeValue : styles.description}>
                      {dailyJournalTime ?? 'Choisir une heure'}
                    </Text>
                  </View>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.reminderCard}>
              <View style={styles.reminderTopRow}>
                <View style={styles.reminderIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="calendar-alert-outline" size={22} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.label}>Règles non renseignées</Text>
                  <Text style={styles.description}>
                    Tu n’as pas encore renseigné de nouvelles règles. Pense à mettre ton suivi à jour si elles ont
                    commencé.
                  </Text>
                </View>
                <Switch
                  accessibilityRole="switch"
                  ios_backgroundColor={theme.colors.surfaceSecondary}
                  onValueChange={value => {
                    setUnrecordedPeriodEnabled(value);
                    setError('');
                  }}
                  thumbColor={theme.colors.surface}
                  trackColor={{false: theme.colors.surfaceSecondary, true: theme.colors.primary}}
                  value={unrecordedPeriodEnabled}
                />
              </View>
            </View>
          </View>

          {timePickerVisible ? (
            <DateTimePicker
              display="default"
              mode="time"
              onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                setTimePickerVisible(false);
                if (selected) {
                  setDailyJournalTime(formatTimeValue(selected));
                  setError('');
                }
              }}
              value={dailyJournalTime ? parseTimeToDate(dailyJournalTime) : new Date()}
            />
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={16} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {permissionNotice ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="bell-off-outline" size={16} />
              <Text style={styles.errorText}>
                Active les notifications dans les réglages de ton téléphone pour recevoir tes rappels.
              </Text>
            </View>
          ) : null}

          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={handleSave}
              style={({pressed}) => [styles.primary, (pressed || saving) && styles.primaryPressed]}>
              <Text style={styles.primaryText}>
                {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Continuer'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
 * SHARED CHOICE
 * ============================================================ */

function Choice({
  label,
  description,
  icon,
  selected,
  checkbox,
  compact,
  onPress,
  theme,
  styles,
}: {
  label: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  checkbox?: boolean;
  compact?: boolean;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole={checkbox ? 'checkbox' : 'radio'}
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.choice,
        compact && styles.choiceCompact,
        selected && styles.choiceSelected,
        pressed && styles.choicePressed,
      ]}>
      {icon ? (
        <View
          style={[
            styles.iconBox,
            compact && styles.iconBoxCompact,
            selected && styles.iconBoxSelected,
          ]}>
          <MaterialDesignIcons
            color={selected ? onPrimaryTextColor(theme) : theme.colors.primary}
            name={icon}
            size={compact ? 20 : 21}
          />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <View style={[checkbox ? styles.checkbox : styles.radio, selected && styles.selectedMark]}>
        {selected ? (
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={checkbox ? 'check' : 'circle'} size={checkbox ? 15 : 9} />
        ) : null}
      </View>
    </Pressable>
  );
}

/* ============================================================
 * SHARED INFO
 * ============================================================ */

function Info({text, icon = 'heart-outline', theme, styles}: {text: string; icon?: IconName; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>}) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />
      </View>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/* ============================================================
 * STYLES — same visual language as ConceptionOnboardingScreens.tsx.
 * ============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},
    safeArea: {flex: 1},
    pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
    pageGlowTop: {
      position: 'absolute', top: -175, right: -120, width: 355, height: 355,
      borderRadius: 178, backgroundColor: withAlpha(theme.colors.primary, 0.065),
    },
    pageGlowMiddle: {
      position: 'absolute', top: '38%', left: -145, width: 290, height: 290,
      borderRadius: 145, backgroundColor: withAlpha(theme.colors.primary, 0.04),
    },
    pageGlowBottom: {
      position: 'absolute', bottom: -175, right: -115, width: 335, height: 335,
      borderRadius: 168, backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },

    content: {flexGrow: 1, paddingHorizontal: 16},

    progressRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
      minHeight: 42, marginBottom: 4,
    },
    back: {
      width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13,
      backgroundColor: withAlpha(theme.colors.surface, 0.94),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },

    title: {
      alignSelf: 'center', width: '100%', maxWidth: 335, marginTop: 8,
      color: theme.colors.text, fontFamily: 'serif', fontSize: 22, lineHeight: 28,
      fontWeight: '800', textAlign: 'center', flexShrink: 1,
    },
    subtitle: {
      alignSelf: 'center', width: '100%', maxWidth: 320, marginTop: 7,
      color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 15.5,
      textAlign: 'center', flexShrink: 1,
    },

    list: {gap: 9},
    listTop: {marginTop: 18},

    trackedItemsList: {
      gap: 7,
      marginTop: 16,
    },

    choiceCompact: {
      minHeight: 58,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: withAlpha(theme.colors.surface, 0.97),
    },

    iconBoxCompact: {
      width: 38,
      height: 38,
      marginRight: 10,
      borderRadius: 12,
    },

    choice: {
      position: 'relative', minHeight: 68, flexDirection: 'row', alignItems: 'center',
      overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.95),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.035, shadowRadius: 9, elevation: 1,
    },
    choiceSelected: {
      borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft,
      shadowColor: theme.colors.primary, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3,
      transform: [{translateY: -1}],
    },
    choicePressed: {opacity: 0.86, transform: [{scale: 0.99}]},

    dateField: {
      minHeight: 68, flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.95),
    },
    dateFieldSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    dateFieldIcon: {
      width: 40, height: 40, marginRight: 10, flexShrink: 0,
      alignItems: 'center', justifyContent: 'center', borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },

    iconBox: {
      width: 40, height: 40, marginRight: 10, flexShrink: 0,
      alignItems: 'center', justifyContent: 'center', borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    iconBoxSelected: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.16, shadowRadius: 5, elevation: 2,
    },

    copy: {flex: 1, minWidth: 0, paddingRight: 8},
    label: {
      color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '700', flexShrink: 1,
    },
    labelSelected: {color: theme.colors.accent, fontWeight: '800'},
    description: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 10,
      lineHeight: 14.5,
      flexShrink: 1,
    },

    radio: {
      width: 22, height: 22, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: withAlpha(theme.colors.primary, 0.35), borderRadius: 11, backgroundColor: theme.colors.surface,
    },
    checkbox: {
      width: 22, height: 22, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: withAlpha(theme.colors.primary, 0.35), borderRadius: 7, backgroundColor: theme.colors.surface,
    },
    selectedMark: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 17,
      backgroundColor: withAlpha(theme.colors.primarySoft, 0.86),
    },
    infoIcon: {
      width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
    },
    infoText: {
      flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 10, lineHeight: 14.5,
    },

    reminderCard: {
      padding: 13, borderWidth: 1, borderColor: theme.colors.border,
      borderRadius: 21, backgroundColor: withAlpha(theme.colors.surface, 0.95),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.04, shadowRadius: 10, elevation: 1,
    },
    reminderTopRow: {flexDirection: 'row', alignItems: 'flex-start'},
    reminderIcon: {
      width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      marginRight: 10, borderRadius: 14, backgroundColor: theme.colors.primarySoft,
    },

    timeRow: {
      minHeight: 52, marginTop: 11, flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 11, borderWidth: 1,
      borderColor: theme.colors.border, borderRadius: 15,
      backgroundColor: theme.colors.surface,
    },
    timeLabel: {color: theme.colors.textSecondary, fontSize: 10, fontWeight: '700'},
    timeValue: {marginTop: 2, color: theme.colors.text, fontSize: 13.5, fontWeight: '800'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.danger, 0.08), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.15),
    },
    errorText: {flex: 1, minWidth: 0, color: theme.colors.danger, fontSize: 11, lineHeight: 15},

    navRow: {alignItems: 'center', justifyContent: 'center', marginTop: 18, paddingTop: 12},
    primary: {
      width: '86%', maxWidth: 360, minHeight: 52,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      borderRadius: 18, backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.18, shadowRadius: 9, elevation: 4,
    },
    primaryPressed: {opacity: 0.90, transform: [{scale: 0.985}]},
    disabled: {opacity: 0.45, elevation: 0},
    primaryText: {color: onPrimaryTextColor(theme), fontSize: 14, fontWeight: '800'},

    pressed: {opacity: 0.80},
  });
}
