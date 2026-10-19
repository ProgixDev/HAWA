import {useToday} from '../../hooks/useToday';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {JournalSaveToast, useJournalSaveToast} from '../../components/journal/JournalSaveToast';
import {getTopPadding, spacing} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  MENOPAUSE_ENERGY_ICONS,
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_INTENSITY_COLORS,
  MENOPAUSE_INTENSITY_LABELS,
  MENOPAUSE_INTENSITY_TINTS,
  MENOPAUSE_JOURNAL_ITEMS,
  MENOPAUSE_LAB_TYPE_ICONS,
  MENOPAUSE_LAB_TYPE_LABELS,
  MENOPAUSE_MOOD_COLORS,
  MENOPAUSE_MOOD_ICONS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_MOOD_TINTS,
  MENOPAUSE_SLEEP_QUALITY_ICONS,
  MENOPAUSE_SLEEP_QUALITY_LABELS,
  MENOPAUSE_TREATMENT_STATUS_ICONS,
  MENOPAUSE_TREATMENT_STATUS_LABELS,
  getVisibleMenopauseSymptomOptions,
} from '../../config/menopauseJournalConfig';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  subscribeMenopausePreferences,
} from '../../state/menopausePreferences';
import type {MenopauseSymptom} from '../../state/menopausePreferences';
import {
  MENOPAUSE_CATEGORY_FIELDS,
  addMenopauseLabResult,
  clearMenopauseJournalFields,
  deleteMenopauseLabResult,
  getMenopauseJournalEntry,
  getMenopauseLabResults,
  hydrateMenopauseJournal,
  saveMenopauseJournalField,
  updateMenopauseLabResult,
  type MenopauseEnergyLevel,
  type MenopauseIntensity,
  type MenopauseJournalCategory,
  type MenopauseJournalEntry,
  type MenopauseLabResult,
  type MenopauseLabType,
  type MenopauseSleepQuality,
  type MenopauseTreatmentStatus,
} from '../../state/menopauseJournalStore';
import {isIntimacyUnlocked} from '../../state/privateSectionAuthStore';
import type {MoodLevel} from '../../types/journal';
import {dateFormatLocale} from '../../utils/cycleMath';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {AwaTextField} from '../../components/ui/AwaTextField';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type RouteProps = RouteProp<RootStackParamList, 'MenopauseJournalEntry'>;

// Built inside the component (via useMemo, keyed on `t`) so the copy follows
// the app language — same buildXxx(t) pattern as
// ContraceptionStatisticsScreen.tsx's buildPeriodOptions(t).
function buildCategoryCopy(t: (key: string) => string): Record<
  MenopauseJournalCategory,
  {description: string; saveLabel: string}
> {
  return {
    symptoms: {
      description: t('menopauseJournalEntry.categories.symptoms.description'),
      saveLabel: t('menopauseJournalEntry.categories.symptoms.saveLabel'),
    },
    mood: {
      description: t('menopauseJournalEntry.categories.mood.description'),
      saveLabel: t('menopauseJournalEntry.categories.mood.saveLabel'),
    },
    sleep: {
      description: t('menopauseJournalEntry.categories.sleep.description'),
      saveLabel: t('menopauseJournalEntry.categories.sleep.saveLabel'),
    },
    energy: {
      description: t('menopauseJournalEntry.categories.energy.description'),
      saveLabel: t('menopauseJournalEntry.categories.energy.saveLabel'),
    },
    treatment: {
      description: t('menopauseJournalEntry.categories.treatment.description'),
      saveLabel: t('menopauseJournalEntry.categories.treatment.saveLabel'),
    },
    labResults: {
      description: t('menopauseJournalEntry.categories.labResults.description'),
      saveLabel: t('menopauseJournalEntry.categories.labResults.saveLabel'),
    },
    notes: {
      description: t('menopauseJournalEntry.categories.notes.description'),
      saveLabel: t('menopauseJournalEntry.categories.notes.saveLabel'),
    },
  };
}

const INTENSITY_ICONS: Record<MenopauseIntensity, IconName> = {
  mild: 'sprout-outline',
  moderate: 'waves-arrow-up',
  severe: 'fire',
};

const ENERGY_COLORS: Record<MenopauseEnergyLevel, string> = {
  low: '#D45D7B',
  medium: '#D78B37',
  high: '#4C9A6E',
};

const ENERGY_TINTS: Record<MenopauseEnergyLevel, string> = {
  low: '#FCEEF2',
  medium: '#FCF4E9',
  high: '#EBF6EF',
};

function buildSleepQualityCopy(t: (key: string) => string): Record<MenopauseSleepQuality, string> {
  return {
    good: t('menopauseJournalEntry.sleep.qualityDescriptions.good'),
    average: t('menopauseJournalEntry.sleep.qualityDescriptions.average'),
    poor: t('menopauseJournalEntry.sleep.qualityDescriptions.poor'),
  };
}

function formatResultDate(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }
  return new Intl.DateTimeFormat(dateFormatLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function todayLabel(): string {
  return new Intl.DateTimeFormat(dateFormatLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function IconCircle({
  icon,
  color,
  tint,
  size = 42,
}: {
  icon: IconName;
  color?: string;
  tint?: string;
  size?: number;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.iconCircle,
        {
          backgroundColor: tint ?? theme.colors.primarySoft,
          borderRadius: Math.round(size * 0.36),
          height: size,
          width: size,
        },
      ]}>
      <MaterialDesignIcons color={color ?? theme.colors.primary} name={icon} size={Math.round(size * 0.48)} />
    </View>
  );
}

function JournalCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <AwaCard style={[styles.journalCard, style]}>{children}</AwaCard>;
}

function CardHeading({
  icon,
  title,
  subtitle,
  optional = false,
  badge,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  optional?: boolean;
  badge?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  return (
    <View style={styles.cardHeading}>
      <IconCircle icon={icon} size={40} />
      <View style={styles.cardHeadingCopy}>
        <AwaText variant="titleSmall" style={styles.cardHeadingTitle}>
          {title}
          {optional ? <AwaText variant="bodySmall" colorRole="onSurfaceVariant"> {t('menopauseJournalEntry.common.optionalLabel')}</AwaText> : null}
        </AwaText>
        {subtitle ? <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardHeadingSubtitle}>{subtitle}</AwaText> : null}
      </View>
      {badge ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SelectableIconCard({
  icon,
  iconColor,
  tint,
  label,
  description,
  selected,
  onPress,
  multi = false,
  compact = false,
}: {
  icon: IconName;
  iconColor: string;
  tint: string;
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
  compact?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.optionCard,
        compact && styles.optionCardCompact,
        selected && styles.optionCardSelected,
        pressed && styles.pressed,
      ]}>
      <IconCircle color={iconColor} icon={icon} size={compact ? 52 : 58} tint={tint} />
      <Text style={[styles.optionLabel, compact && styles.optionLabelCompact]}>
        {label}
      </Text>
      {description ? <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.optionDescription}>{description}</AwaText> : null}
      <View style={[styles.selectionMark, selected && styles.selectionMarkSelected]}>
        {selected ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={13} /> : null}
      </View>
    </Pressable>
  );
}

function ChoiceGrid({children, third = false}: {children: React.ReactNode; third?: boolean}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={[styles.choiceGrid, third && styles.choiceGridThird]}>{children}</View>;
}

function InformativePanel({
  icon,
  title,
  text,
  accent,
  tint,
}: {
  icon: IconName;
  title: string;
  text: string;
  accent?: string;
  tint?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.infoPanel, {backgroundColor: tint ?? theme.colors.primarySoft}]}>
      <IconCircle
        color={accent ?? theme.colors.primary}
        icon={icon}
        size={40}
        tint={withAlpha(theme.colors.surface, 0.72)}
      />
      <View style={styles.infoCopy}>
        <AwaText variant="labelSmall" style={styles.infoTitle}>{title}</AwaText>
        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{text}</AwaText>
      </View>
    </View>
  );
}

function PremiumTextArea({
  accessibilityLabel,
  value,
  onChangeText,
  placeholder,
  maxLength,
  minHeight = 116,
}: {
  accessibilityLabel: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength: number;
  minHeight?: number;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.textAreaWrap, {minHeight}]}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        maxLength={maxLength}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.textArea}
        textAlignVertical="top"
        value={value}
      />
      <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.charCount}>{value.length}/{maxLength}</AwaText>
    </View>
  );
}

function FadeIn({children}: {children: React.ReactNode}): React.JSX.Element {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!active) {
        return;
      }
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduceMotion ? 0 : 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      active = false;
    };
  }, [entrance]);

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

function MenopauseJournalEntryScreen(): React.JSX.Element | null {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const categoryCopy = useMemo(() => buildCategoryCopy(t), [t]);
  const sleepQualityCopy = useMemo(() => buildSleepQualityCopy(t), [t]);
  const labFutureDateMessage = t('menopauseJournalEntry.errors.labFutureDate');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {params} = useRoute<RouteProps>();
  const {category} = params;
  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;
  const insets = useSafeAreaInsets();
  const toast = useJournalSaveToast();
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {todayKey: today} = useToday();
  // The day this journal writes to: today by default, or an explicit PAST day
  // when opened from the Calendar's selected day (same optional `date` route
  // param pattern as IrregularJournalEntryScreen). A future day is never
  // accepted. Lab results are NOT day entries: they carry their own sample
  // date (see labDateKey) and ignore this.
  const requestedDate = params.date;
  const entryDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today;
  const isFutureEntryDate = entryDate > today;
  const isPastEntryDate = entryDate < today && category !== 'labResults';
  const item = MENOPAUSE_JOURNAL_ITEMS.find(candidate => candidate.key === category)!;
  // Live preferences (not a mount snapshot): the symptoms screen can send the
  // user to edit her tracked symptoms and must reflect the change on return.
  const [preferences, setPreferences] = useState(getMenopausePreferences);
  useEffect(() => {
    let active = true;
    hydrateMenopausePreferences().then(value => {
      if (active) {setPreferences(value);}
    });
    const unsubscribe = subscribeMenopausePreferences(() => {
      if (active) {setPreferences(getMenopausePreferences());}
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // What is currently persisted for the day being edited: drives the
  // "Effacer" action and the save-time clearing of optional sub-fields.
  const [savedEntry, setSavedEntry] = useState<MenopauseJournalEntry | undefined>(undefined);

  // The existing narrow PIN / biometrics gate remains the only access gate
  // for daily notes. The other six categories are never gated.
  const [notesUnlocked] = useState(() => category !== 'notes' || isIntimacyUnlocked());

  const [symptoms, setSymptoms] = useState<MenopauseSymptom[]>([]);
  // What is already saved for today - kept offered even if no longer tracked.
  const [savedSymptoms, setSavedSymptoms] = useState<MenopauseSymptom[]>([]);
  const [intensity, setIntensity] = useState<MenopauseIntensity | null>(null);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [sleepDuration, setSleepDuration] = useState('');
  const [sleepQuality, setSleepQuality] = useState<MenopauseSleepQuality | null>(null);
  const [energyLevel, setEnergyLevel] = useState<MenopauseEnergyLevel | null>(null);
  const [treatmentStatus, setTreatmentStatus] = useState<MenopauseTreatmentStatus | null>(null);
  const [treatmentNote, setTreatmentNote] = useState('');
  const [notes, setNotes] = useState('');
  const [labType, setLabType] = useState<MenopauseLabType | null>(
    preferences.labTracking === 'fsh'
      ? 'fsh'
      : preferences.labTracking === 'estradiol'
        ? 'estradiol'
        : null,
  );
  const [labValue, setLabValue] = useState('');
  const [labUnit, setLabUnit] = useState('');
  // Sample ("prélèvement") date. null = follow today (moves with useToday when the day
  // changes); a picked date is kept as chosen. The stored result's `date` IS
  // this sample date; `recordedAt` (set by the store) stays the moment it was
  // entered in AWA.
  const [labDateKey, setLabDateKey] = useState<string | null>(null);
  const [showLabDatePicker, setShowLabDatePicker] = useState(false);
  const [showAllLabResults, setShowAllLabResults] = useState(false);
  // Id of the existing lab result being edited (null = the form adds a new one).
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [labResultsHistory, setLabResultsHistory] = useState(() =>
    getMenopauseLabResults(labType ?? undefined),
  );

  useEffect(() => {
    if (category === 'notes' && !isIntimacyUnlocked()) {
      navigation.replace('PrivateIntimacyUnlock', {target: 'menopauseNotes'});
    }
  }, [category, navigation]);

  const applyEntryToForm = (entry: MenopauseJournalEntry | undefined) => {
    setSavedEntry(entry);
    setSymptoms(entry?.symptoms ?? []);
    setSavedSymptoms(entry?.symptoms ?? []);
    setIntensity(entry?.symptomIntensity ?? null);
    setMood(entry?.mood ?? null);
    setSleepDuration(entry?.sleepDurationHours !== undefined ? String(entry.sleepDurationHours) : '');
    setSleepQuality(entry?.sleepQuality ?? null);
    setEnergyLevel(entry?.energyLevel ?? null);
    setTreatmentStatus(entry?.treatmentStatus ?? null);
    setTreatmentNote(entry?.treatmentNote ?? '');
    if (notesUnlocked) {
      setNotes(entry?.notes ?? '');
    }
  };

  useEffect(() => {
    let active = true;
    hydrateMenopauseJournal().then(() => {
      if (!active) {
        return;
      }
      applyEntryToForm(getMenopauseJournalEntry(entryDate));
      setLabResultsHistory(getMenopauseLabResults(labType ?? undefined));
    });
    return () => {
      active = false;
    };
    // Hydration runs once per entry day for this draft screen (the form
    // represents TODAY's entry unless a past `date` was requested; see useToday).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryDate]);

  useEffect(() => {
    setLabResultsHistory(getMenopauseLabResults(labType ?? undefined));
  }, [labType]);

  const visibleSymptomOptions = useMemo(
    () => getVisibleMenopauseSymptomOptions(preferences.trackedSymptoms, savedSymptoms),
    [preferences.trackedSymptoms, savedSymptoms],
  );

  const editTrackedSymptoms = useCallback(() => {
    navigation.navigate('MenopauseSymptoms', {mode: 'edit'});
  }, [navigation]);

  const effectiveLabDateKey = labDateKey ?? today;
  const onLabDateChange = (_event: DateTimePickerChangeEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowLabDatePicker(false);
    }
    if (!date) {
      return;
    }
    const picked = date.toLocaleDateString('en-CA');
    // A sample cannot have been taken in the future: reject, keep the date.
    if (picked > today) {
      setError(labFutureDateMessage);
      return;
    }
    setError('');
    setLabDateKey(picked === today ? null : picked);
  };

  const resetLabForm = () => {
    setEditingLabId(null);
    setLabValue('');
    setLabUnit('');
    setLabDateKey(null);
    setShowLabDatePicker(false);
    setError('');
  };

  const startEditLab = (result: MenopauseLabResult) => {
    setEditingLabId(result.id);
    setLabType(result.type);
    setLabValue(String(result.value));
    setLabUnit(result.unit ?? '');
    setLabDateKey(result.date >= today ? null : result.date);
    setShowLabDatePicker(false);
    setError('');
    scrollRef.current?.scrollTo?.({y: 0, animated: true});
  };

  const requestDeleteLab = (result: MenopauseLabResult) => {
    Alert.alert(
      t('menopauseJournalEntry.alerts.deleteLabTitle'),
      t('menopauseJournalEntry.alerts.deleteLabMessage', {
        type: MENOPAUSE_LAB_TYPE_LABELS[result.type],
        value: result.value,
        unit: result.unit ? ` ${result.unit}` : '',
        date: formatResultDate(result.date),
      }),
      [
        {text: t('menopauseJournalEntry.common.cancel'), style: 'cancel'},
        {
          text: t('menopauseJournalEntry.common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenopauseLabResult(result.id);
            } catch (saveError) {
              presentSaveFailure(saveError);
              return;
            }
            if (editingLabId === result.id) {
              resetLabForm();
            }
            setLabResultsHistory(getMenopauseLabResults(labType ?? undefined));
          },
        },
      ],
    );
  };

  // Fields this category owns that currently hold a saved value for the day.
  const clearableFields = MENOPAUSE_CATEGORY_FIELDS[category].filter(field => {
    const value = savedEntry?.[field];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });

  const requestClearCategory = () => {
    Alert.alert(
      t('menopauseJournalEntry.alerts.clearTitle'),
      isPastEntryDate
        ? t('menopauseJournalEntry.alerts.clearMessagePast', {date: formatResultDate(entryDate)})
        : t('menopauseJournalEntry.alerts.clearMessageToday'),
      [
        {text: t('menopauseJournalEntry.common.cancel'), style: 'cancel'},
        {
          text: t('menopauseJournalEntry.common.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearMenopauseJournalFields(entryDate, MENOPAUSE_CATEGORY_FIELDS[category]);
            } catch (saveError) {
              presentSaveFailure(saveError);
              return;
            }
            applyEntryToForm(getMenopauseJournalEntry(entryDate));
          },
        },
      ],
    );
  };

  const toggleSymptom = (id: MenopauseSymptom) => {
    setSymptoms(current =>
      current.includes(id) ? current.filter(value => value !== id) : [...current, id],
    );
  };

  const setSleepPreset = (hours: number) => {
    setSleepDuration(String(hours));
  };

  const adjustSleep = (delta: number) => {
    const parsed = Number(sleepDuration.replace(',', '.'));
    const current = Number.isNaN(parsed) ? 7 : parsed;
    const next = Math.max(0, Math.min(24, Math.round((current + delta) * 2) / 2));
    setSleepDuration(String(next));
  };

  const handleSave = async () => {
    setError('');
    if (isFutureEntryDate && category !== 'labResults') {
      setError(t('menopauseJournalEntry.errors.futureDate'));
      return;
    }
    setSaving(true);

    try {
      switch (category) {
        case 'symptoms':
          if (visibleSymptomOptions.length === 0) {
            setError(t('menopauseJournalEntry.errors.chooseSymptomsFirst'));
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(entryDate, 'symptoms', symptoms);
          if (intensity) {
            await saveMenopauseJournalField(entryDate, 'symptomIntensity', intensity);
          } else if (savedEntry?.symptomIntensity) {
            // The user deselected the optional intensity: persist that.
            await clearMenopauseJournalFields(entryDate, ['symptomIntensity']);
          }
          break;
        case 'mood':
          if (!mood) {
            setError(t('menopauseJournalEntry.errors.selectMood'));
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(entryDate, 'mood', mood);
          break;
        case 'sleep': {
          const parsedDuration = sleepDuration.trim()
            ? Number(sleepDuration.replace(',', '.'))
            : undefined;
          if (
            parsedDuration !== undefined &&
            (Number.isNaN(parsedDuration) || parsedDuration < 0 || parsedDuration > 24)
          ) {
            setError(t('menopauseJournalEntry.errors.invalidSleepDuration'));
            setSaving(false);
            return;
          }
          if (parsedDuration !== undefined) {
            await saveMenopauseJournalField(entryDate, 'sleepDurationHours', parsedDuration);
          } else if (savedEntry?.sleepDurationHours !== undefined) {
            // The duration field was emptied: persist that instead of silently keeping the old value.
            await clearMenopauseJournalFields(entryDate, ['sleepDurationHours']);
          }
          if (sleepQuality) {
            await saveMenopauseJournalField(entryDate, 'sleepQuality', sleepQuality);
          }
          break;
        }
        case 'energy':
          if (!energyLevel) {
            setError(t('menopauseJournalEntry.errors.selectEnergyLevel'));
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(entryDate, 'energyLevel', energyLevel);
          break;
        case 'treatment':
          if (!treatmentStatus) {
            setError(
              isPastEntryDate
                ? t('menopauseJournalEntry.errors.treatmentRequiredPast')
                : t('menopauseJournalEntry.errors.treatmentRequiredToday'),
            );
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(entryDate, 'treatmentStatus', treatmentStatus);
          if (treatmentNote.trim()) {
            await saveMenopauseJournalField(entryDate, 'treatmentNote', treatmentNote.trim());
          } else if (savedEntry?.treatmentNote) {
            await clearMenopauseJournalFields(entryDate, ['treatmentNote']);
          }
          break;
        case 'labResults': {
          if (!labType) {
            setError(t('menopauseJournalEntry.errors.selectLabType'));
            setSaving(false);
            return;
          }
          const parsedValue = Number(labValue.replace(',', '.'));
          if (!labValue.trim() || Number.isNaN(parsedValue)) {
            setError(t('menopauseJournalEntry.errors.invalidLabValue'));
            setSaving(false);
            return;
          }
          if (effectiveLabDateKey > today) {
            setError(labFutureDateMessage);
            setSaving(false);
            return;
          }
          if (editingLabId) {
            // Edit an existing result in place (same id / recordedAt).
            const updated = await updateMenopauseLabResult(editingLabId, {
              value: parsedValue,
              unit: labUnit.trim() || undefined,
              date: effectiveLabDateKey,
            });
            if (!updated) {
              resetLabForm();
              setError(t('menopauseJournalEntry.errors.labResultGone'));
              setLabResultsHistory(getMenopauseLabResults(labType));
              setSaving(false);
              return;
            }
          } else {
            await addMenopauseLabResult({
              type: labType,
              value: parsedValue,
              unit: labUnit.trim() || undefined,
              date: effectiveLabDateKey,
            });
          }
          resetLabForm();
          setLabResultsHistory(getMenopauseLabResults(labType));
          break;
        }
        case 'notes':
          await saveMenopauseJournalField(entryDate, 'notes', notes.trim());
          break;
        default:
          break;
      }

      // Same "toast then return" pattern as the project's other objective
      // journal screens: navigation only fires once the toast has actually
      // been visible and finished its fade-out (useJournalSaveToast's own
      // onDone callback), never immediately — so the success feedback is
      // never cut off by an instant unmount. Every validation-failure
      // branch above already `return`s before this line, so a toast/return
      // never fires on invalid input, and this line is only reached after
      // the real menopauseJournalStore writes above have completed.
      toast.show(
        t('menopauseJournalEntry.common.savedToastTitle'),
        isPastEntryDate ? t('menopauseJournalEntry.common.savedToastPast', {date: formatResultDate(entryDate)}) : item.journalSubtitle,
        () => navigation.goBack(),
      );
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  if (!notesUnlocked) {
    return null;
  }

  const renderSymptoms = () => (
    <>
      <JournalCard>
        <CardHeading
          badge={t('menopauseJournalEntry.common.selectedCount', {count: symptoms.length})}
          icon="heart-pulse"
          title={t('menopauseJournalEntry.symptoms.sectionTitle')}
        />
        {visibleSymptomOptions.length > 0 ? (
          <>
            <ChoiceGrid third>
              {visibleSymptomOptions.map(option => (
                <SelectableIconCard
                  compact
                  icon={option.icon}
                  iconColor={option.iconColor}
                  key={option.id}
                  label={option.label}
                  multi
                  onPress={() => toggleSymptom(option.id)}
                  selected={symptoms.includes(option.id)}
                  tint={option.tint}
                />
              ))}
            </ChoiceGrid>
            <AwaButton
              label={t('menopauseJournalEntry.symptoms.editTrackedLink')}
              onPress={editTrackedSymptoms}
              size="compact"
              style={styles.editSymptomsLink}
              variant="tonal"
            />
          </>
        ) : (
          <View>
            <InformativePanel
              icon="information-outline"
              text={t('menopauseJournalEntry.symptoms.noneTrackedText')}
              title={t('menopauseJournalEntry.symptoms.noneTrackedTitle')}
            />
            <AwaButton
              fullWidth
              label={t('menopauseJournalEntry.symptoms.chooseCta')}
              onPress={editTrackedSymptoms}
              style={styles.editSymptomsCta}
            />
          </View>
        )}
      </JournalCard>

      <JournalCard>
        <CardHeading
          icon="chart-bell-curve"
          optional
          subtitle={t('menopauseJournalEntry.symptoms.intensitySubtitle')}
          title={t('menopauseJournalEntry.symptoms.intensityTitle')}
        />
        <ChoiceGrid third>
          {(Object.keys(MENOPAUSE_INTENSITY_LABELS) as MenopauseIntensity[]).map(level => (
            <SelectableIconCard
              compact
              icon={INTENSITY_ICONS[level]}
              iconColor={MENOPAUSE_INTENSITY_COLORS[level]}
              key={level}
              label={MENOPAUSE_INTENSITY_LABELS[level]}
              onPress={() => setIntensity(current => (current === level ? null : level))}
              selected={intensity === level}
              tint={MENOPAUSE_INTENSITY_TINTS[level]}
            />
          ))}
        </ChoiceGrid>
      </JournalCard>
    </>
  );

  const renderMood = () => (
    <JournalCard>
      <CardHeading
        badge={mood ? t('menopauseJournalEntry.common.selectedCount', {count: 1}) : t('menopauseJournalEntry.common.toChoose')}
        icon="emoticon-outline"
        title={t('menopauseJournalEntry.mood.title')}
      />
      <ChoiceGrid third>
        {(Object.keys(MENOPAUSE_MOOD_LABELS) as MoodLevel[]).map(level => (
          <SelectableIconCard
            compact
            icon={MENOPAUSE_MOOD_ICONS[level]}
            iconColor={MENOPAUSE_MOOD_COLORS[level]}
            key={level}
            label={MENOPAUSE_MOOD_LABELS[level]}
            onPress={() => setMood(level)}
            selected={mood === level}
            tint={MENOPAUSE_MOOD_TINTS[level]}
          />
        ))}
      </ChoiceGrid>
      <InformativePanel
        icon="star-four-points-outline"
        text={t('menopauseJournalEntry.mood.kindnessText')}
        title={t('menopauseJournalEntry.mood.kindnessTitle')}
      />
    </JournalCard>
  );

  const renderSleep = () => (
    <>
      <JournalCard>
        <CardHeading icon="clock-outline" title={t('menopauseJournalEntry.sleep.durationTitle')} />
        <View style={styles.durationRow}>
          <AwaIconButton
            accessibilityLabel={t('menopauseJournalEntry.sleep.decreaseAccessibility')}
            accessibilityRole="button"
            onPress={() => adjustSleep(-0.5)}
            icon="minus"
            iconSize={25}
          />
          <View style={styles.durationInputWrap}>
            <TextInput
              accessibilityLabel={t('menopauseJournalEntry.sleep.durationInputAccessibility')}
              keyboardType="decimal-pad"
              onChangeText={setSleepDuration}
              placeholder="7"
              placeholderTextColor={theme.colors.textMuted}
              selectTextOnFocus
              style={styles.durationInput}
              value={sleepDuration}
            />
            <AwaText variant="titleSmall" style={styles.durationSuffix}>h</AwaText>
          </View>
          <AwaIconButton
            accessibilityLabel={t('menopauseJournalEntry.sleep.increaseAccessibility')}
            accessibilityRole="button"
            onPress={() => adjustSleep(0.5)}
            icon="plus"
            iconSize={25}
          />
        </View>
        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.durationHint}>{t('menopauseJournalEntry.sleep.durationHint')}</AwaText>
        <View style={styles.sleepPresetRow}>
          {[4, 5, 6, 7, 8, 9].map(hours => {
            const selected = Number(sleepDuration.replace(',', '.')) === hours;
            return (
              <Pressable
                accessibilityLabel={t('menopauseJournalEntry.sleep.hoursAccessibility', {hours})}
                accessibilityRole="radio"
                accessibilityState={{checked: selected}}
                key={hours}
                onPress={() => setSleepPreset(hours)}
                style={({pressed}) => [styles.sleepPreset, selected && styles.sleepPresetSelected, pressed && styles.pressed]}>
                <Text style={[styles.sleepPresetText, selected && styles.sleepPresetTextSelected]}>
                  {hours === 9
                    ? t('menopauseJournalEntry.sleep.presetPlusLabel', {hours})
                    : t('menopauseJournalEntry.sleep.presetLabel', {hours})}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </JournalCard>

      <JournalCard>
        <CardHeading
          icon="star-outline"
          subtitle={t('menopauseJournalEntry.sleep.qualitySubtitle')}
          title={t('menopauseJournalEntry.sleep.qualityTitle')}
        />
        <ChoiceGrid third>
          {(Object.keys(MENOPAUSE_SLEEP_QUALITY_LABELS) as MenopauseSleepQuality[]).map(quality => (
            <SelectableIconCard
              compact
              description={sleepQualityCopy[quality]}
              icon={MENOPAUSE_SLEEP_QUALITY_ICONS[quality]}
              iconColor={theme.colors.primary}
              key={quality}
              label={MENOPAUSE_SLEEP_QUALITY_LABELS[quality]}
              onPress={() => setSleepQuality(quality)}
              selected={sleepQuality === quality}
              tint={theme.colors.primarySoft}
            />
          ))}
        </ChoiceGrid>
      </JournalCard>
    </>
  );

  const renderEnergy = () => (
    <JournalCard>
      <CardHeading
        icon="lightning-bolt-outline"
        title={isPastEntryDate ? t('menopauseJournalEntry.energy.titlePast') : t('menopauseJournalEntry.energy.titleToday')}
      />
      <ChoiceGrid third>
        {(Object.keys(MENOPAUSE_ENERGY_LABELS) as MenopauseEnergyLevel[]).map(level => (
          <SelectableIconCard
            compact
            description={t(`menopauseJournalEntry.energy.descriptions.${level}`)}
            icon={MENOPAUSE_ENERGY_ICONS[level]}
            iconColor={ENERGY_COLORS[level]}
            key={level}
            label={MENOPAUSE_ENERGY_LABELS[level]}
            onPress={() => setEnergyLevel(level)}
            selected={energyLevel === level}
            tint={ENERGY_TINTS[level]}
          />
        ))}
      </ChoiceGrid>
      <InformativePanel
        icon="star-four-points-outline"
        text={t('menopauseJournalEntry.energy.varyText')}
        title={t('menopauseJournalEntry.energy.varyTitle')}
      />
    </JournalCard>
  );

  const renderTreatment = () => (
    <>
      <JournalCard>
        <CardHeading
          badge={isPastEntryDate ? formatResultDate(entryDate) : t('menopauseJournalEntry.common.today')}
          icon="calendar-outline"
          subtitle={
            isPastEntryDate
              ? t('menopauseJournalEntry.treatment.subtitlePast')
              : t('menopauseJournalEntry.treatment.subtitleToday')
          }
          title={t('menopauseJournalEntry.treatment.statusTitle')}
        />
        <ChoiceGrid>
          {(Object.keys(MENOPAUSE_TREATMENT_STATUS_LABELS) as MenopauseTreatmentStatus[]).map(status => (
            <SelectableIconCard
              description={
                status === 'taken'
                  ? t('menopauseJournalEntry.treatment.descriptions.taken')
                  : isPastEntryDate
                    ? t('menopauseJournalEntry.treatment.descriptions.notTakenPast')
                    : t('menopauseJournalEntry.treatment.descriptions.notTakenToday')
              }
              icon={MENOPAUSE_TREATMENT_STATUS_ICONS[status]}
              iconColor={status === 'taken' ? '#56866B' : '#D45D7B'}
              key={status}
              label={MENOPAUSE_TREATMENT_STATUS_LABELS[status]}
              onPress={() => setTreatmentStatus(status)}
              selected={treatmentStatus === status}
              tint={status === 'taken' ? '#EDF4EF' : '#FCEEF2'}
            />
          ))}
        </ChoiceGrid>
      </JournalCard>

      <JournalCard>
        <CardHeading
          icon="notebook-edit-outline"
          optional
          subtitle={t('menopauseJournalEntry.treatment.notesSubtitle')}
          title={t('menopauseJournalEntry.treatment.notesTitle')}
        />
        <PremiumTextArea
          accessibilityLabel={t('menopauseJournalEntry.treatment.notesAccessibility')}
          maxLength={300}
          onChangeText={setTreatmentNote}
          placeholder={t('menopauseJournalEntry.common.writeHerePlaceholder')}
          value={treatmentNote}
        />
      </JournalCard>

      <InformativePanel
        accent={theme.colors.primary}
        icon="shield-lock-outline"
        text={t('menopauseJournalEntry.treatment.ownershipText')}
        title={t('menopauseJournalEntry.treatment.ownershipTitle')}
        tint={theme.colors.primarySoft}
      />
    </>
  );

  const renderLabResults = () => (
    <>
      <JournalCard>
        {editingLabId ? (
          <InformativePanel
            icon="pencil-outline"
            text={t('menopauseJournalEntry.lab.editingText', {type: labType ? MENOPAUSE_LAB_TYPE_LABELS[labType] : ''})}
            title={t('menopauseJournalEntry.lab.editingTitle')}
          />
        ) : null}
        {preferences.labTracking === 'both' && !editingLabId ? (
          <>
            <CardHeading icon="flask-outline" title={t('menopauseJournalEntry.lab.typeStepTitle')} />
            <ChoiceGrid>
              {(Object.keys(MENOPAUSE_LAB_TYPE_LABELS) as MenopauseLabType[]).map(type => (
                <SelectableIconCard
                  icon={MENOPAUSE_LAB_TYPE_ICONS[type]}
                  iconColor={type === 'fsh' ? '#6D4AE8' : '#D45D7B'}
                  key={type}
                  label={MENOPAUSE_LAB_TYPE_LABELS[type]}
                  onPress={() => setLabType(type)}
                  selected={labType === type}
                  tint={type === 'fsh' ? '#F1ECFA' : '#FCEEF2'}
                />
              ))}
            </ChoiceGrid>
          </>
        ) : null}

        <View style={preferences.labTracking === 'both' && !editingLabId ? styles.subsection : undefined}>
          <CardHeading
            icon="flask-outline"
            title={preferences.labTracking === 'both' && !editingLabId ? t('menopauseJournalEntry.lab.resultStepTitle2') : t('menopauseJournalEntry.lab.resultStepTitle')}
          />
          <View style={styles.labInputRow}>
            <AwaTextField
              accessibilityLabel={t('menopauseJournalEntry.lab.valueAccessibility')}
              keyboardType="decimal-pad"
              label={t('menopauseJournalEntry.lab.valueFieldLabel')}
              onChangeText={setLabValue}
              placeholder={t('menopauseJournalEntry.lab.valuePlaceholder')}
              value={labValue}
              wrapperStyle={styles.labField}
            />
            <AwaTextField
              accessibilityLabel={t('menopauseJournalEntry.lab.unitAccessibility')}
              label={`${t('menopauseJournalEntry.lab.unitFieldLabel')} ${t('menopauseJournalEntry.common.optionalLabel')}`}
              onChangeText={setLabUnit}
              placeholder="UI/L"
              value={labUnit}
              wrapperStyle={styles.labField}
            />
          </View>
          <InformativePanel
            icon="information-outline"
            text={t('menopauseJournalEntry.lab.infoText')}
            title={t('menopauseJournalEntry.lab.infoTitle')}
          />
        </View>

        <View style={styles.subsection}>
          <CardHeading icon="calendar-outline" title={t('menopauseJournalEntry.lab.sampleDateTitle')} />
          <AwaCard
            padding="none"
            variant="filled"
            accessibilityLabel={t('menopauseJournalEntry.lab.sampleDateAccessibility', {date: formatResultDate(effectiveLabDateKey)})}
            accessibilityRole="button"
            onPress={() => setShowLabDatePicker(current => !current)}
            style={styles.dateField}>
            <IconCircle icon="calendar-outline" size={38} />
            <View style={styles.dateFieldCopy}>
              <AwaText variant="labelSmall" style={styles.dateFieldTitle}>{effectiveLabDateKey === today ? t('menopauseJournalEntry.common.today') : t('menopauseJournalEntry.lab.dateChosenLabel')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.dateFieldText}>{formatResultDate(effectiveLabDateKey)}</AwaText>
            </View>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-down" size={20} />
          </AwaCard>
          {showLabDatePicker ? (
            <DateTimePicker
              maximumDate={new Date(`${today}T12:00:00`)}
              mode="date"
              onValueChange={onLabDateChange}
              value={new Date(`${effectiveLabDateKey}T12:00:00`)}
            />
          ) : null}
        </View>
      </JournalCard>

      {labResultsHistory.length > 0 ? (
        <JournalCard>
          <View style={styles.historyHeader}>
            <AwaText variant="titleSmall" style={styles.historyTitle}>{t('menopauseJournalEntry.lab.historyTitle')}</AwaText>
            {labResultsHistory.length > 5 ? (
              <AwaButton
                accessibilityLabel={showAllLabResults ? t('menopauseJournalEntry.lab.collapseAccessibility') : t('menopauseJournalEntry.lab.expandAccessibility')}
                label={showAllLabResults ? t('menopauseJournalEntry.lab.collapseLabel') : t('menopauseJournalEntry.lab.expandLabel')}
                onPress={() => setShowAllLabResults(current => !current)}
                size="compact"
                variant="text"
              />
            ) : null}
          </View>
          <View style={styles.recordsList}>
            {(showAllLabResults ? labResultsHistory : labResultsHistory.slice(0, 5)).map(result => (
              <View key={result.id} style={styles.recordRow}>
                <IconCircle
                  color={result.type === 'fsh' ? '#6D4AE8' : '#D45D7B'}
                  icon={MENOPAUSE_LAB_TYPE_ICONS[result.type]}
                  size={38}
                  tint={result.type === 'fsh' ? '#F1ECFA' : '#FCEEF2'}
                />
                <View style={styles.recordCopy}>
                  <AwaText variant="labelSmall" style={styles.recordTitle}>{MENOPAUSE_LAB_TYPE_LABELS[result.type]}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.recordText}>
                    {result.value}{result.unit ? ` ${result.unit}` : ''} · {formatResultDate(result.date)}
                  </AwaText>
                </View>
                <View style={styles.recordActions}>
                  <AwaButton
                    accessibilityLabel={t('menopauseJournalEntry.lab.editResultAccessibility', {type: MENOPAUSE_LAB_TYPE_LABELS[result.type], date: formatResultDate(result.date)})}
                    label={t('menopauseJournalEntry.lab.editLabel')}
                    onPress={() => startEditLab(result)}
                    size="compact"
                    variant={editingLabId === result.id ? 'filled' : 'tonal'}
                  />
                  <AwaButton
                    accessibilityLabel={t('menopauseJournalEntry.lab.deleteResultAccessibility', {type: MENOPAUSE_LAB_TYPE_LABELS[result.type], date: formatResultDate(result.date)})}
                    label={t('menopauseJournalEntry.lab.deleteLabel')}
                    onPress={() => requestDeleteLab(result)}
                    size="compact"
                    variant="destructive"
                  />
                </View>
              </View>
            ))}
          </View>
        </JournalCard>
      ) : null}
    </>
  );

  const renderNotes = () => (
    <>
      <InformativePanel
        icon="lock-outline"
        text={t('menopauseJournalEntry.notes.privateText')}
        title={t('menopauseJournalEntry.notes.privateTitle')}
      />
      <JournalCard>
        <View style={styles.notesHeadingRow}>
          <AwaText variant="titleSmall" style={styles.notesCardTitle}>{t('menopauseJournalEntry.notes.todayTitle')}</AwaText>
          <View style={styles.datePill}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-outline" size={15} />
            <AwaText variant="labelSmall" colorRole="primary">{todayLabel()}</AwaText>
          </View>
        </View>
        <PremiumTextArea
          accessibilityLabel={t('menopauseJournalEntry.notes.notesAccessibility')}
          maxLength={500}
          minHeight={compact ? 170 : 220}
          onChangeText={setNotes}
          placeholder={t('menopauseJournalEntry.common.writeHerePlaceholder')}
          value={notes}
        />
        <InformativePanel
          icon="heart-outline"
          text={t('menopauseJournalEntry.notes.freedomText')}
          title={t('menopauseJournalEntry.notes.freedomTitle')}
        />
      </JournalCard>

      <JournalCard>
        <AwaText variant="titleSmall" style={styles.inspirationTitle}>{t('menopauseJournalEntry.notes.inspirationTitle')}</AwaText>
        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.inspirationSubtitle}>{t('menopauseJournalEntry.notes.inspirationSubtitle')}</AwaText>
        <View style={styles.inspirationGrid}>
          {(
            [
              ['heart-outline', 'gratitude'],
              ['weather-night', 'day'],
              ['flower-outline', 'letGo'],
              ['star-outline', 'joy'],
              ['lightbulb-outline', 'intentions'],
              ['pencil-outline', 'freeWriting'],
            ] as const
          ).map(([icon, key]) => {
            const label = t(`menopauseJournalEntry.notes.inspirationChips.${key}`);
            return (
              <Pressable
                accessibilityLabel={label}
                accessibilityRole="button"
                key={key}
                onPress={() => setNotes(current => current || `${label} : `)}
                style={({pressed}) => [styles.inspirationChip, pressed && styles.pressed]}>
                <MaterialDesignIcons color={theme.colors.primary} name={icon as IconName} size={18} />
                <AwaText variant="labelSmall" style={styles.inspirationChipText}>{label}</AwaText>
              </Pressable>
            );
          })}
        </View>
      </JournalCard>
    </>
  );

  const renderCategory = () => {
    switch (category) {
      case 'symptoms':
        return renderSymptoms();
      case 'mood':
        return renderMood();
      case 'sleep':
        return renderSleep();
      case 'energy':
        return renderEnergy();
      case 'treatment':
        return renderTreatment();
      case 'labResults':
        return renderLabResults();
      case 'notes':
        return renderNotes();
      default:
        return null;
    }
  };

  const copy = categoryCopy[category];

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>
        <View style={[styles.topBar, {paddingTop: getTopPadding(insets.top, true)}]}>
          <AwaIconButton
            accessibilityLabel={t('menopauseJournalEntry.common.back')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            icon="chevron-left"
          />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            compact && styles.contentCompact,
            {paddingBottom: Math.max(insets.bottom, 16) + spacing.lg + 12},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <FadeIn>
            <View style={[styles.hero, compact && styles.heroCompact]}>
              {!compact ? (
                <>
                  <View pointerEvents="none" style={styles.heroLeafLeft}>
                    <MaterialDesignIcons color={withAlpha(theme.colors.primary, 0.13)} name="leaf" size={72} />
                  </View>
                  <View pointerEvents="none" style={styles.heroLeafRight}>
                    <MaterialDesignIcons color={withAlpha(theme.colors.secondary, 0.13)} name="flower-outline" size={68} />
                  </View>
                </>
              ) : null}
              <View style={[styles.heroIcon, compact && styles.heroIconCompact, {backgroundColor: item.tint}]}>
                <MaterialDesignIcons color={item.iconColor} name={item.icon} size={compact ? 24 : 32} />
              </View>
              <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>{item.label}</Text>
              {!compact ? <AwaText variant="labelSmall" colorRole="primary" style={styles.heroEyebrow}>{t('menopauseJournalEntry.hero.eyebrow')}</AwaText> : null}
              <Text style={[styles.heroDescription, compact && styles.heroDescriptionCompact]}>
                {isPastEntryDate
                  ? t('menopauseJournalEntry.hero.pastDescription', {date: formatResultDate(entryDate)})
                  : copy.description}
              </Text>
            </View>

            <View style={styles.body}>{renderCategory()}</View>

            {error ? (
              <View style={styles.errorCard}>
                <MaterialDesignIcons color={theme.colors.danger} name="alert-circle-outline" size={18} />
                <AwaText variant="bodySmall" colorRole="error" accessibilityRole="alert" style={styles.errorText}>{error}</AwaText>
              </View>
            ) : null}

            {category === 'labResults' && editingLabId ? (
              <AwaButton
                fullWidth
                label={t('menopauseJournalEntry.lab.cancelEdit')}
                onPress={resetLabForm}
                style={styles.secondaryAction}
                variant="text"
              />
            ) : null}

            <AwaButton
              disabled={saving}
              fullWidth
              icon={saving ? undefined : 'lock-outline'}
              label={saving
                ? t('menopauseJournalEntry.common.saving')
                : category === 'labResults' && editingLabId
                  ? t('menopauseJournalEntry.lab.saveEditLabel')
                  : copy.saveLabel}
              loading={saving}
              onPress={handleSave}
              size="large"
              style={styles.saveButton}
            />

            {clearableFields.length > 0 ? (
              <AwaButton
                fullWidth
                label={t('menopauseJournalEntry.actions.clearThisTracking')}
                onPress={requestClearCategory}
                style={styles.secondaryAction}
                variant="destructive"
              />
            ) : null}

          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>

      <JournalSaveToast
        animation={toast.animation}
        bottom={Math.max(insets.bottom, 16) + 16}
        message={toast.message}
        onDismiss={toast.hide}
        title={toast.title}
        visible={toast.visible}
      />
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },


  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.985}],
  },

  topBar: {
    zIndex: 2,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },

  topBarSpacer: {
    flex: 1,
  },


  content: {
    paddingHorizontal: 14,
    paddingTop: 0,
  },

  contentCompact: {
    paddingHorizontal: 11,
  },

  hero: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 10,
  },

  // Compact devices (Galaxy A13-class, per useWindowDimensions()' existing
  // `compact` flag) get a visibly smaller hero — same content, no
  // decorative leaf icons, smaller icon circle, tighter padding — so the
  // interactive card underneath isn't pushed unnecessarily far down the
  // viewport on short screens.
  heroCompact: {
    paddingTop: 0,
    paddingBottom: 6,
  },

  heroLeafLeft: {
    position: 'absolute',
    left: 10,
    bottom: 4,
    opacity: 0.58,
    transform: [{rotate: '12deg'}],
  },

  heroLeafRight: {
    position: 'absolute',
    right: 10,
    top: 0,
    opacity: 0.58,
    transform: [{rotate: '20deg'}],
  },

  heroIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: withAlpha(theme.colors.surface, 0.95),
    borderRadius: 12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.075,
    shadowRadius: 10,
    elevation: 2,
  },

  heroIconCompact: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },

  heroTitle: {
    marginTop: 7,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.25,
  },

  heroTitleCompact: {
    marginTop: 4,
    fontSize: 21,
    lineHeight: 26,
  },

  heroEyebrow: {marginTop: 4, textAlign: 'center'},

  heroDescription: {
    maxWidth: 330,
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },

  heroDescriptionCompact: {
    fontSize: 11,
    lineHeight: 16,
  },

  body: {
    gap: 8,
  },

  journalCard: {
    overflow: 'hidden',
  },

  cardHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  cardHeadingCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
    paddingTop: 1,
  },

  cardHeadingTitle: {color: theme.colors.accent},


  cardHeadingSubtitle: {marginTop: 2},

  countBadge: {
    alignSelf: 'flex-start',
    marginLeft: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  countBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  choiceGridThird: {
    gap: 7,
  },

  optionCard: {
    position: 'relative',
    width: '48%',
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
    borderRadius: 16,
    backgroundColor: withAlpha(theme.colors.surface, 0.80),
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  optionCardCompact: {
    width: '31.5%',
    minHeight: 118,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 16,
  },

  optionCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 1.4,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },

  optionLabel: {
    marginTop: 7,
    color: theme.colors.accent,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  optionLabelCompact: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
  },

  optionDescription: {marginTop: 3, textAlign: 'center'},

  selectionMark: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: withAlpha(theme.colors.textSecondary, 0.25),
    borderRadius: 10,
    backgroundColor: withAlpha(theme.colors.surface, 0.88),
  },

  selectionMarkSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  subsection: {
    marginTop: 14,
  },

  infoPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 11,
    borderRadius: 16,
    padding: 12,
  },

  infoCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 0,
  },

  infoTitle: {color: theme.colors.accent},

  infoText: {marginTop: 2},

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },


  durationInputWrap: {
    minHeight: 64,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: withAlpha(theme.colors.primary, 0.50),
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },

  durationInput: {
    minWidth: 62,
    padding: 0,
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'right',
  },

  durationSuffix: {marginLeft: 6, color: theme.colors.accent},

  durationHint: {marginTop: 7, textAlign: 'center'},

  sleepPresetRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 11,
  },

  sleepPreset: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  sleepPresetSelected: {
    backgroundColor: theme.colors.primary,
  },

  sleepPresetText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  sleepPresetTextSelected: {
    color: onPrimaryTextColor(theme),
  },

  textAreaWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.13),
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },

  textArea: {
    minHeight: '100%',
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 30,
    color: theme.colors.accent,
    fontSize: 14,
    lineHeight: 20,
  },

  charCount: {position: 'absolute', right: 11, bottom: 9},

  labInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  labField: {
    flex: 1,
    minWidth: 0,
  },

  dateField: {flexDirection: 'row', alignItems: 'center', padding: 12},

  dateFieldCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },

  dateFieldTitle: {color: theme.colors.accent},

  dateFieldText: {marginTop: 1},

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  historyTitle: {color: theme.colors.accent},

  editSymptomsLink: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  editSymptomsCta: {
    marginTop: 12,
  },

  recordsList: {
    gap: 1,
  },

  recordActions: {
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },

  secondaryAction: {
    marginTop: 10,
  },

  recordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(theme.colors.primary, 0.08),
  },

  recordCopy: {
    flex: 1,
    flexBasis: 110,
    minWidth: 0,
    marginLeft: 8,
  },

  recordTitle: {color: theme.colors.accent},

  recordText: {marginTop: 1},

  notesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
    marginBottom: 11,
  },

  notesCardTitle: {flex: 1, color: theme.colors.accent},

  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },


  inspirationTitle: {color: theme.colors.accent},

  inspirationSubtitle: {marginTop: 2},

  inspirationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 11,
  },

  inspirationChip: {
    width: '48%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  inspirationChipText: {flex: 1, color: theme.colors.accent},

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.danger, 0.12),
    padding: 12,
  },

  errorText: {flexShrink: 1, textAlign: 'center'},

  saveButton: {
    marginTop: 14,
  },


  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 11,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.72),
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  privacyFooterText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  });
}

export default MenopauseJournalEntryScreen;