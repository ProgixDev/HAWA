import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
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
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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
  MENOPAUSE_SYMPTOM_OPTIONS,
  MENOPAUSE_TREATMENT_STATUS_ICONS,
  MENOPAUSE_TREATMENT_STATUS_LABELS,
} from '../../config/menopauseJournalConfig';
import {getMenopausePreferences} from '../../state/menopausePreferences';
import type {MenopauseSymptom} from '../../state/menopausePreferences';
import {
  addMenopauseLabResult,
  getMenopauseJournalEntry,
  getMenopauseLabResults,
  hydrateMenopauseJournal,
  saveMenopauseJournalField,
  type MenopauseEnergyLevel,
  type MenopauseIntensity,
  type MenopauseJournalCategory,
  type MenopauseLabType,
  type MenopauseSleepQuality,
  type MenopauseTreatmentStatus,
} from '../../state/menopauseJournalStore';
import {isIntimacyUnlocked} from '../../state/privateSectionAuthStore';
import type {MoodLevel} from '../../types/journal';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type RouteProps = RouteProp<RootStackParamList, 'MenopauseJournalEntry'>;

const CATEGORY_COPY: Record<
  MenopauseJournalCategory,
  {description: string; saveLabel: string}
> = {
  symptoms: {
    description: 'Sélectionne les symptômes que tu ressens aujourd’hui. Tu peux en choisir plusieurs.',
    saveLabel: 'Enregistrer le suivi',
  },
  mood: {
    description: 'Comment te sens-tu aujourd’hui ? Choisis l’humeur qui te correspond le mieux.',
    saveLabel: 'Enregistrer l’humeur',
  },
  sleep: {
    description: 'Note la durée et la qualité de ton sommeil cette nuit.',
    saveLabel: 'Enregistrer mon sommeil',
  },
  energy: {
    description: 'Comment te sens-tu niveau énergie aujourd’hui ? Choisis l’option qui te correspond.',
    saveLabel: 'Enregistrer mon énergie',
  },
  treatment: {
    description: 'Indique si tu as pris ton traitement aujourd’hui. C’est un suivi personnel, sans jugement.',
    saveLabel: 'Enregistrer le suivi',
  },
  labResults: {
    description: 'Ajoute tes résultats d’analyses pour suivre leur évolution au fil du temps.',
    saveLabel: 'Enregistrer le résultat',
  },
  notes: {
    description: 'Un espace privé pour noter tes pensées, émotions ou tout ce qui compte pour toi.',
    saveLabel: 'Enregistrer ma note',
  },
};

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

const SLEEP_QUALITY_COPY: Record<MenopauseSleepQuality, string> = {
  good: 'Nuit réparatrice, je me sens reposée.',
  average: 'Quelques réveils, repos moyen.',
  poor: 'Sommeil léger ou réveils fréquents.',
};

const todayKey = (): string => new Date().toLocaleDateString('en-CA');

function formatResultDate(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function selectionLabel(count: number, singular = 'sélectionnée'): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
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
  return <View style={[styles.journalCard, style]}>{children}</View>;
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
  return (
    <View style={styles.cardHeading}>
      <IconCircle icon={icon} size={40} />
      <View style={styles.cardHeadingCopy}>
        <Text style={styles.cardHeadingTitle}>
          {title}
          {optional ? <Text style={styles.optionalText}> (optionnel)</Text> : null}
        </Text>
        {subtitle ? <Text style={styles.cardHeadingSubtitle}>{subtitle}</Text> : null}
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
      <Text numberOfLines={compact ? 3 : 2} style={[styles.optionLabel, compact && styles.optionLabelCompact]}>
        {label}
      </Text>
      {description ? <Text numberOfLines={compact ? 3 : 2} style={styles.optionDescription}>{description}</Text> : null}
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
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
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
      <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {params} = useRoute<RouteProps>();
  const {category} = params;
  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;
  const insets = useSafeAreaInsets();
  const toast = useJournalSaveToast();
  const today = useMemo(() => todayKey(), []);
  const item = MENOPAUSE_JOURNAL_ITEMS.find(candidate => candidate.key === category)!;
  const preferences = useMemo(() => getMenopausePreferences(), []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The existing narrow PIN / biometrics gate remains the only access gate
  // for daily notes. The other six categories are never gated.
  const [notesUnlocked] = useState(() => category !== 'notes' || isIntimacyUnlocked());

  const [symptoms, setSymptoms] = useState<MenopauseSymptom[]>([]);
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
  const [labResultsHistory, setLabResultsHistory] = useState(() =>
    getMenopauseLabResults(labType ?? undefined),
  );

  useEffect(() => {
    if (category === 'notes' && !isIntimacyUnlocked()) {
      navigation.replace('PrivateIntimacyUnlock', {target: 'menopauseNotes'});
    }
  }, [category, navigation]);

  useEffect(() => {
    let active = true;
    hydrateMenopauseJournal().then(() => {
      if (!active) {
        return;
      }
      const entry = getMenopauseJournalEntry(today);
      setSymptoms(entry?.symptoms ?? []);
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
      setLabResultsHistory(getMenopauseLabResults(labType ?? undefined));
    });
    return () => {
      active = false;
    };
    // Hydration is deliberately run once for this draft screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLabResultsHistory(getMenopauseLabResults(labType ?? undefined));
  }, [labType]);

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
    setSaving(true);

    try {
      switch (category) {
        case 'symptoms':
          await saveMenopauseJournalField(today, 'symptoms', symptoms);
          if (intensity) {
            await saveMenopauseJournalField(today, 'symptomIntensity', intensity);
          }
          break;
        case 'mood':
          if (!mood) {
            setError('Sélectionne ton humeur.');
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(today, 'mood', mood);
          break;
        case 'sleep': {
          const parsedDuration = sleepDuration.trim()
            ? Number(sleepDuration.replace(',', '.'))
            : undefined;
          if (
            parsedDuration !== undefined &&
            (Number.isNaN(parsedDuration) || parsedDuration < 0 || parsedDuration > 24)
          ) {
            setError('Indique une durée de sommeil valide, entre 0 et 24 heures.');
            setSaving(false);
            return;
          }
          if (parsedDuration !== undefined) {
            await saveMenopauseJournalField(today, 'sleepDurationHours', parsedDuration);
          }
          if (sleepQuality) {
            await saveMenopauseJournalField(today, 'sleepQuality', sleepQuality);
          }
          break;
        }
        case 'energy':
          if (!energyLevel) {
            setError('Sélectionne ton niveau d’énergie.');
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(today, 'energyLevel', energyLevel);
          break;
        case 'treatment':
          if (!treatmentStatus) {
            setError('Indique si tu as pris ton traitement aujourd’hui.');
            setSaving(false);
            return;
          }
          await saveMenopauseJournalField(today, 'treatmentStatus', treatmentStatus);
          if (treatmentNote.trim()) {
            await saveMenopauseJournalField(today, 'treatmentNote', treatmentNote.trim());
          }
          break;
        case 'labResults': {
          if (!labType) {
            setError('Sélectionne un type d’analyse.');
            setSaving(false);
            return;
          }
          const parsedValue = Number(labValue.replace(',', '.'));
          if (!labValue.trim() || Number.isNaN(parsedValue)) {
            setError('Indique une valeur numérique pour ce résultat.');
            setSaving(false);
            return;
          }
          await addMenopauseLabResult({
            type: labType,
            value: parsedValue,
            unit: labUnit.trim() || undefined,
            date: today,
          });
          setLabValue('');
          setLabUnit('');
          setLabResultsHistory(getMenopauseLabResults(labType));
          break;
        }
        case 'notes':
          await saveMenopauseJournalField(today, 'notes', notes.trim());
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
      toast.show('Enregistré', item.journalSubtitle, () => navigation.goBack());
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
          badge={selectionLabel(symptoms.length)}
          icon="heart-pulse"
          title="Symptômes ressentis"
        />
        <ChoiceGrid third>
          {MENOPAUSE_SYMPTOM_OPTIONS.map(option => (
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
      </JournalCard>

      <JournalCard>
        <CardHeading
          icon="chart-bell-curve"
          optional
          subtitle="Comment évalues-tu l’intensité globale aujourd’hui ?"
          title="Intensité générale"
        />
        <ChoiceGrid third>
          {(Object.keys(MENOPAUSE_INTENSITY_LABELS) as MenopauseIntensity[]).map(level => (
            <SelectableIconCard
              compact
              icon={INTENSITY_ICONS[level]}
              iconColor={MENOPAUSE_INTENSITY_COLORS[level]}
              key={level}
              label={MENOPAUSE_INTENSITY_LABELS[level]}
              onPress={() => setIntensity(level)}
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
        badge={mood ? selectionLabel(1) : 'À choisir'}
        icon="emoticon-outline"
        title="Comment te sens-tu ?"
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
        text="Il est tout à fait normal d’avoir des hauts et des bas. Prends soin de toi, à ton rythme."
        title="Chaque émotion est normale"
      />
    </JournalCard>
  );

  const renderSleep = () => (
    <>
      <JournalCard>
        <CardHeading icon="clock-outline" title="Durée de sommeil" />
        <View style={styles.durationRow}>
          <Pressable
            accessibilityLabel="Diminuer la durée de sommeil"
            accessibilityRole="button"
            onPress={() => adjustSleep(-0.5)}
            style={({pressed}) => [styles.stepButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="minus" size={25} />
          </Pressable>
          <View style={styles.durationInputWrap}>
            <TextInput
              accessibilityLabel="Durée du sommeil en heures"
              keyboardType="decimal-pad"
              onChangeText={setSleepDuration}
              placeholder="7"
              placeholderTextColor={theme.colors.textMuted}
              selectTextOnFocus
              style={styles.durationInput}
              value={sleepDuration}
            />
            <Text style={styles.durationSuffix}>h</Text>
          </View>
          <Pressable
            accessibilityLabel="Augmenter la durée de sommeil"
            accessibilityRole="button"
            onPress={() => adjustSleep(0.5)}
            style={({pressed}) => [styles.stepButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="plus" size={25} />
          </Pressable>
        </View>
        <Text style={styles.durationHint}>Heures passées à dormir, approximativement</Text>
        <View style={styles.sleepPresetRow}>
          {[4, 5, 6, 7, 8, 9].map(hours => {
            const selected = Number(sleepDuration.replace(',', '.')) === hours;
            return (
              <Pressable
                accessibilityLabel={`${hours} heures`}
                accessibilityRole="radio"
                accessibilityState={{checked: selected}}
                key={hours}
                onPress={() => setSleepPreset(hours)}
                style={({pressed}) => [styles.sleepPreset, selected && styles.sleepPresetSelected, pressed && styles.pressed]}>
                <Text style={[styles.sleepPresetText, selected && styles.sleepPresetTextSelected]}>
                  {hours === 9 ? '+9 h' : `${hours} h`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </JournalCard>

      <JournalCard>
        <CardHeading
          icon="star-outline"
          subtitle="Comment qualifierais-tu la qualité de ta nuit ?"
          title="Qualité du sommeil"
        />
        <ChoiceGrid third>
          {(Object.keys(MENOPAUSE_SLEEP_QUALITY_LABELS) as MenopauseSleepQuality[]).map(quality => (
            <SelectableIconCard
              compact
              description={SLEEP_QUALITY_COPY[quality]}
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
      <CardHeading icon="lightning-bolt-outline" title="Ton niveau d’énergie aujourd’hui" />
      <ChoiceGrid third>
        {(Object.keys(MENOPAUSE_ENERGY_LABELS) as MenopauseEnergyLevel[]).map(level => (
          <SelectableIconCard
            compact
            description={
              level === 'low'
                ? 'Je me sens épuisée, sans énergie.'
                : level === 'medium'
                  ? 'J’ai un niveau d’énergie correct.'
                  : 'Je me sens en forme et pleine d’énergie.'
            }
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
        text="Ton niveau d’énergie peut varier selon ton sommeil, ton humeur ou ton activité."
        title="Chaque jour est différent"
      />
    </JournalCard>
  );

  const renderTreatment = () => (
    <>
      <JournalCard>
        <CardHeading
          badge="Aujourd’hui"
          icon="calendar-outline"
          subtitle="As-tu pris ton traitement hormonal aujourd’hui ?"
          title="Statut du jour"
        />
        <ChoiceGrid>
          {(Object.keys(MENOPAUSE_TREATMENT_STATUS_LABELS) as MenopauseTreatmentStatus[]).map(status => (
            <SelectableIconCard
              description={
                status === 'taken'
                  ? 'J’ai pris mon traitement comme prévu.'
                  : 'Je n’ai pas pris mon traitement aujourd’hui.'
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
          subtitle="Ajoute une note si tu veux préciser quelque chose."
          title="Notes sur le traitement"
        />
        <PremiumTextArea
          accessibilityLabel="Notes sur le traitement"
          maxLength={300}
          onChangeText={setTreatmentNote}
          placeholder="Écris ici…"
          value={treatmentNote}
        />
      </JournalCard>

      <InformativePanel
        accent={theme.colors.primary}
        icon="shield-lock-outline"
        text="AWA ne propose ni dose, ni horaire, ni recommandation. Tu gardes le contrôle sur ton suivi."
        title="Ton suivi t’appartient"
        tint={theme.colors.primarySoft}
      />
    </>
  );

  const renderLabResults = () => (
    <>
      <JournalCard>
        {preferences.labTracking === 'both' ? (
          <>
            <CardHeading icon="flask-outline" title="1. Type d’analyse" />
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

        <View style={preferences.labTracking === 'both' ? styles.subsection : undefined}>
          <CardHeading icon="flask-outline" title={preferences.labTracking === 'both' ? '2. Résultat' : 'Résultat'} />
          <View style={styles.labInputRow}>
            <View style={[styles.labField, styles.labValueField]}>
              <Text style={styles.fieldLabel}>Valeur</Text>
              <TextInput
                accessibilityLabel="Valeur de l’analyse"
                keyboardType="decimal-pad"
                onChangeText={setLabValue}
                placeholder="12,6"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.labValueInput}
                value={labValue}
              />
            </View>
            <View style={styles.labField}>
              <Text style={styles.fieldLabel}>Unité <Text style={styles.fieldOptional}>(optionnel)</Text></Text>
              <TextInput
                accessibilityLabel="Unité de l’analyse"
                onChangeText={setLabUnit}
                placeholder="UI/L"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.labUnitInput}
                value={labUnit}
              />
            </View>
          </View>
          <InformativePanel
            icon="information-outline"
            text="Saisis la valeur exactement comme indiquée sur ton résultat."
            title="Information"
          />
        </View>

        <View style={styles.subsection}>
          <CardHeading icon="calendar-outline" title="Date du prélèvement" />
          <View accessibilityLabel={`Date du prélèvement : ${todayLabel()}`} style={styles.dateField}>
            <IconCircle icon="calendar-outline" size={38} />
            <View style={styles.dateFieldCopy}>
              <Text style={styles.dateFieldTitle}>Aujourd’hui</Text>
              <Text style={styles.dateFieldText}>{todayLabel()}</Text>
            </View>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-down" size={20} />
          </View>
        </View>
      </JournalCard>

      {labResultsHistory.length > 0 ? (
        <JournalCard>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Mes derniers résultats</Text>
            <View style={styles.historyBadge}><Text style={styles.historyBadgeText}>Voir tout</Text></View>
          </View>
          <View style={styles.recordsList}>
            {labResultsHistory.slice(0, 5).map(result => (
              <View key={result.id} style={styles.recordRow}>
                <IconCircle
                  color={result.type === 'fsh' ? '#6D4AE8' : '#D45D7B'}
                  icon={MENOPAUSE_LAB_TYPE_ICONS[result.type]}
                  size={38}
                  tint={result.type === 'fsh' ? '#F1ECFA' : '#FCEEF2'}
                />
                <View style={styles.recordCopy}>
                  <Text style={styles.recordTitle}>{MENOPAUSE_LAB_TYPE_LABELS[result.type]}</Text>
                  <Text style={styles.recordText}>
                    {result.value}{result.unit ? ` ${result.unit}` : ''} · {formatResultDate(result.date)}
                  </Text>
                </View>
                <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={20} />
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
        text="Elles restent sur cet appareil. L’accès à cette section utilise ton code ou ta biométrie, si tu les as configurés."
        title="Tes notes sont privées"
      />
      <JournalCard>
        <View style={styles.notesHeadingRow}>
          <Text style={styles.notesCardTitle}>Ta note d’aujourd’hui</Text>
          <View style={styles.datePill}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-outline" size={15} />
            <Text style={styles.datePillText}>{todayLabel()}</Text>
          </View>
        </View>
        <PremiumTextArea
          accessibilityLabel="Notes du jour"
          maxLength={500}
          minHeight={compact ? 170 : 220}
          onChangeText={setNotes}
          placeholder="Écris ici…"
          value={notes}
        />
        <InformativePanel
          icon="heart-outline"
          text="Il n’y a pas de bonne ou mauvaise façon d’écrire. Écris librement, à ton rythme."
          title="Un espace à toi"
        />
      </JournalCard>

      <JournalCard>
        <Text style={styles.inspirationTitle}>Besoin d’inspiration ?</Text>
        <Text style={styles.inspirationSubtitle}>Choisis un sujet pour commencer si tu le souhaites.</Text>
        <View style={styles.inspirationGrid}>
          {[
            ['heart-outline', 'Ce pour quoi je suis reconnaissante'],
            ['weather-night', 'Ma journée en quelques mots'],
            ['flower-outline', 'Ce que j’ai envie de lâcher'],
            ['star-outline', 'Ce qui m’a apporté de la joie'],
            ['lightbulb-outline', 'Mes intentions pour demain'],
            ['pencil-outline', 'Écrire librement'],
          ].map(([icon, label]) => (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              key={label}
              onPress={() => setNotes(current => current || `${label} : `)}
              style={({pressed}) => [styles.inspirationChip, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name={icon as IconName} size={18} />
              <Text numberOfLines={2} style={styles.inspirationChipText}>{label}</Text>
            </Pressable>
          ))}
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

  const copy = CATEGORY_COPY[category];

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>
        <View style={[styles.topBar, {paddingTop: getTopPadding(insets.top, true)}]}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.topButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.accent} name="chevron-left" size={24} />
          </Pressable>
        </View>

        <ScrollView
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
              {!compact ? <Text style={styles.heroEyebrow}>PÉRIMÉNOPAUSE / MÉNOPAUSE</Text> : null}
              <Text style={[styles.heroDescription, compact && styles.heroDescriptionCompact]}>{copy.description}</Text>
            </View>

            <View style={styles.body}>{renderCategory()}</View>

            {error ? (
              <View style={styles.errorCard}>
                <MaterialDesignIcons color={theme.colors.danger} name="alert-circle-outline" size={18} />
                <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityLabel={copy.saveLabel}
              accessibilityRole="button"
              accessibilityState={{disabled: saving}}
              disabled={saving}
              onPress={handleSave}
              style={({pressed}) => [
                styles.saveButton,
                (pressed || saving) && styles.pressed,
                saving && styles.saveButtonDisabled,
              ]}>
              <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={saving ? 'loading' : 'lock-outline'} size={22} />
              <Text style={styles.saveButtonText}>{saving ? 'Enregistrement…' : copy.saveLabel}</Text>
            </Pressable>

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

  // Exact same canonical AWA page background decor as ProfileScreen —
  // reused verbatim (colors/locations already matched above; this is the
  // 3-glow overlay), never a per-screen approximation.
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

  topButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.055,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 20,
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

  heroEyebrow: {
    marginTop: 4,
    color: theme.colors.primary,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.05,
    textAlign: 'center',
  },

  heroDescription: {
    maxWidth: 330,
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },

  heroDescriptionCompact: {
    fontSize: 10.5,
    lineHeight: 15.5,
  },

  body: {
    gap: 8,
  },

  journalCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.095),
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.surface, 0.95),
    padding: 13,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
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

  cardHeadingTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },

  optionalText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },

  cardHeadingSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  countBadge: {
    alignSelf: 'flex-start',
    marginLeft: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  countBadgeText: {
    color: theme.colors.primary,
    fontSize: 9.5,
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
    borderRadius: 17,
    backgroundColor: withAlpha(theme.colors.surface, 0.80),
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  optionCardCompact: {
    width: '31.5%',
    minHeight: 118,
    paddingHorizontal: 4,
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
    fontSize: 9.5,
    lineHeight: 13,
  },

  optionDescription: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 8.4,
    lineHeight: 11.5,
    textAlign: 'center',
  },

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
    borderRadius: 15,
    padding: 10,
  },

  infoCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 0,
  },

  infoTitle: {
    color: theme.colors.accent,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },

  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },

  durationInputWrap: {
    height: 64,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: withAlpha(theme.colors.primary, 0.50),
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
  },

  durationInput: {
    minWidth: 62,
    padding: 0,
    color: theme.colors.primary,
    fontSize: 31,
    fontWeight: '800',
    textAlign: 'right',
  },

  durationSuffix: {
    marginLeft: 6,
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },

  durationHint: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    textAlign: 'center',
  },

  sleepPresetRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 11,
  },

  sleepPreset: {
    flex: 1,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  sleepPresetSelected: {
    backgroundColor: theme.colors.primary,
  },

  sleepPresetText: {
    color: theme.colors.accent,
    fontSize: 9.5,
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
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },

  textArea: {
    minHeight: '100%',
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 30,
    color: theme.colors.accent,
    fontSize: 11,
    lineHeight: 16,
  },

  charCount: {
    position: 'absolute',
    right: 11,
    bottom: 9,
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },

  labInputRow: {
    flexDirection: 'row',
    gap: 8,
  },

  labField: {
    minHeight: 65,
    flex: 1,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.13),
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 11,
    paddingTop: 8,
  },

  labValueField: {
    borderColor: withAlpha(theme.colors.primary, 0.50),
  },

  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },

  fieldOptional: {
    fontWeight: '400',
  },

  labValueInput: {
    padding: 0,
    color: theme.colors.accent,
    fontSize: 19,
    fontWeight: '800',
  },

  labUnitInput: {
    padding: 0,
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.13),
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    padding: 9,
  },

  dateFieldCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },

  dateFieldTitle: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },

  dateFieldText: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  historyTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },

  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
  },

  historyBadgeText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },

  recordsList: {
    gap: 1,
  },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(theme.colors.primary, 0.08),
  },

  recordCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },

  recordTitle: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },

  recordText: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 9.3,
  },

  notesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
    marginBottom: 11,
  },

  notesCardTitle: {
    flex: 1,
    color: theme.colors.accent,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },

  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  datePillText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },

  inspirationTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },

  inspirationSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },

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
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  inspirationChipText: {
    flex: 1,
    color: theme.colors.accent,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '600',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.danger, 0.12),
    padding: 9,
  },

  errorText: {
    flexShrink: 1,
    color: theme.colors.danger,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  saveButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  saveButtonDisabled: {
    opacity: 0.72,
  },

  saveButtonText: {
    color: onPrimaryTextColor(theme),
    fontSize: 13,
    fontWeight: '800',
  },

  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 11,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.surface, 0.72),
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  privacyFooterText: {
    color: theme.colors.primary,
    fontSize: 9.5,
    fontWeight: '700',
  },
  });
}

export default MenopauseJournalEntryScreen;