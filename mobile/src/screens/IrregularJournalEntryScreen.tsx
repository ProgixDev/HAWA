import {useToday} from '../hooks/useToday';
import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  JournalSaveToast,
  useJournalSaveToast,
} from '../components/journal/JournalSaveToast';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {formatFullDate} from '../utils/cycleMath';
import {getTopPadding} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';
import {
  IRREGULAR_INTENSITY_OPTIONS,
  IRREGULAR_MOOD_OPTIONS,
  IRREGULAR_SYMPTOM_OPTIONS,
} from '../config/irregularJournalConfig';
import {
  getAllIrregularJournalEntries,
  getIrregularJournalEntry,
  hydrateIrregularJournal,
  saveIrregularJournalEntry,
  type IrregularJournalDetails,
  type IrregularJournalRouteCategory,
} from '../state/irregularJournalStore';
import {saveJournalSection} from '../state/dailyJournalStore';
import {presentSaveFailure} from '../services/saveFailure';
import type {FlowIntensity} from '../types/journal';
import {computeWeightVariation} from '../utils/irregularDailyTrackingMath';
import {getIrregularFatigueSymptoms} from '../utils/irregularJournalSelectors';
import {journalOptionLabel, type JournalOptionNamespace} from '../utils/journalOptionLabels';
import '../i18n';

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

type Props = RouteProp<
  RootStackParamList,
  'IrregularJournalEntry'
>;

// SEMANTIC — the same tone family every ChoiceRow/ChoiceTile/mood-tone-array
// usage below relies on to color-code an actual tracked category/severity/
// mood value (Acné & Pilosité severity, Douleurs intensity, Humeur, Poids
// "feeling", Fatigue severity ramp, and the Règles/period identity color).
// These never derive from the resolved theme — see the CLAUDE.md "MEDICAL /
// TRACKING SEMANTIC" rule — so switching the app's color theme can never
// blur what these colors mean. ACCENT doubles as the *default* tone (Pilosité
// relies on ChoiceRow's own default) as well as one of the fixed Humeur/Poids/
// Fatigue tones, so it stays frozen everywhere it flows through `tone`.
const ACCENT = '#7040D9';
const ROSE = '#EA5A8B';
const ORANGE = '#F29A52';
const GREEN = '#41A77A';

type CategoryMeta = {
  title: string;
  icon: IconName;
  tint: string;
  saveLabel: string;
  toastTitle: string;
};

// Display-only copy for each SOPK journal category. Built from `t()` so it
// tracks the active language — same `xLabels(t)`/`xMeta(t)` factory pattern
// as JournalCervicalMucusScreen.tsx's `mucusLabels(t)`. The category "prompt"
// (hero subtitle) is intentionally NOT here — it carries a `{{day}}`
// placeholder that must be interpolated in the same `t()` call as the
// translation lookup (see `categoryPrompt` in the screen body below), never
// filled in afterwards with a runtime `.replace()` on the translated prose,
// since the French substring being replaced no longer exists once the
// string is in English.
function categoryMeta(t: (key: string) => string): Record<IrregularJournalRouteCategory, CategoryMeta> {
  return {
    period: {
      title: t('irregularJournalEntry.categories.period.title'),
      icon: 'water',
      tint: '#FFE9F0',
      saveLabel: t('irregularJournalEntry.categories.period.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.period.toastTitle'),
    },

    acne: {
      title: t('irregularJournalEntry.categories.acne.title'),
      icon: 'face-woman-outline',
      tint: '#FFF0E9',
      saveLabel: t('irregularJournalEntry.categories.acne.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.acne.toastTitle'),
    },

    hairGrowth: {
      title: t('irregularJournalEntry.categories.hairGrowth.title'),
      icon: 'human',
      tint: '#EEE7FC',
      saveLabel: t('irregularJournalEntry.categories.hairGrowth.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.hairGrowth.toastTitle'),
    },

    weight: {
      title: t('irregularJournalEntry.categories.weight.title'),
      icon: 'scale-bathroom',
      tint: '#EAF4F0',
      saveLabel: t('irregularJournalEntry.categories.weight.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.weight.toastTitle'),
    },

    pain: {
      title: t('irregularJournalEntry.categories.pain.title'),
      icon: 'lightning-bolt-outline',
      tint: '#FFEDEA',
      saveLabel: t('irregularJournalEntry.categories.pain.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.pain.toastTitle'),
    },

    mood: {
      title: t('irregularJournalEntry.categories.mood.title'),
      icon: 'emoticon-outline',
      tint: '#F2EAFF',
      saveLabel: t('irregularJournalEntry.categories.mood.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.mood.toastTitle'),
    },

    fatigue: {
      title: t('irregularJournalEntry.categories.fatigue.title'),
      icon: 'battery-medium',
      tint: '#EEF0FF',
      saveLabel: t('irregularJournalEntry.categories.fatigue.saveLabel'),
      toastTitle: t('irregularJournalEntry.categories.fatigue.toastTitle'),
    },
  };
}

// `value` is the persisted `status` enum ('yes'/'no'/'spotting', saved
// verbatim by `save()` below) — never translated. `label` is display-only
// and comes from `t()` at call sites via `periodStatusOptions(t)`.
const PERIOD_STATUS_VALUES = [
  {value: 'yes', icon: 'check-circle-outline'},
  {value: 'no', icon: 'close-circle-outline'},
  {value: 'spotting', icon: 'water-outline'},
] as const;

function periodStatusOptions(
  t: (key: string) => string,
): {value: 'yes' | 'no' | 'spotting'; icon: IconName; label: string}[] {
  return PERIOD_STATUS_VALUES.map(option => ({
    ...option,
    label: t(`irregularJournalEntry.period.status.${option.value}`),
  }));
}

// DATA-BEARING — NOT display-only text. `save()` below persists this raw
// French label string verbatim into `entries[date].acne` (via
// `summary = value.trim()`), and `irregularJournalSelectors.ts`'s
// `IRREGULAR_NO_SYMPTOM_ANSWER = 'Aucune'` compares stored category answers
// against this exact French word to decide whether a day has a positive
// occurrence. Translating these options would silently corrupt every
// already-saved entry AND break that "Aucune" comparison, so they stay
// French — same rule as IRREGULAR_SYMPTOM_OPTIONS/IRREGULAR_INTENSITY_OPTIONS/
// IRREGULAR_MOOD_OPTIONS in irregularJournalConfig.ts.
const ACNE_OPTIONS = [
  'Aucune',
  'Légère',
  'Modérée',
  'Marquée',
  'Très marquée',
];

// DATA-BEARING — same reasoning as ACNE_OPTIONS above: persisted verbatim
// into `entries[date].hairGrowth`, and 'Aucune' is compared by
// isIrregularSymptomAnswer(). Stays French.
const HAIR_OPTIONS = [
  'Aucune',
  'Légère',
  'Modérée',
  'Importante',
  'Très importante',
];

// DATA-BEARING — persisted verbatim into `details.areas` (via
// `toggle(setAreas, option)` below), restored on reopen by comparing against
// these exact strings. Not read by the "Aucune" occurrence logic, but still
// raw data written to AsyncStorage — translating it would leave a mix of
// French and English area names across entries saved before/after a language
// switch. Stays French, same conservative rule as the other local option
// arrays in this file.
const PAIN_TYPES = [
  'Crampes',
  'Bas-ventre',
  'Dos',
  'Maux de tête',
  'Autre',
];

// DATA-BEARING — persisted verbatim into `details.weightFeeling`. Stays
// French, same reasoning as PAIN_TYPES above.
const WEIGHT_FEELINGS = [
  'Bien',
  'Neutre',
  'Préoccupée',
];

// DATA-BEARING — persisted verbatim into `details.areas`. Stays French, same
// reasoning as PAIN_TYPES above.
const ACNE_AREAS = [
  'Visage',
  'Dos',
  'Poitrine',
  'Autre',
];

// DATA-BEARING — persisted verbatim into `details.areas`. Stays French, same
// reasoning as PAIN_TYPES above.
const HAIR_AREAS = [
  'Visage',
  'Menton',
  'Ventre',
  'Bras',
  'Jambes',
  'Autre',
];

// DATA-BEARING — persisted verbatim into `details.symptoms` (the pain
// category's own "Zones concernées", distinct from `entry.symptoms` used by
// Fatigue). Stays French, same reasoning as PAIN_TYPES above.
const PAIN_AREAS = [
  'Bas-ventre',
  'Dos',
  'Tête',
  'Seins',
  'Autre',
];

// Lookup only, never rendered as UI copy — maps the raw French flow-intensity
// value (IRREGULAR_INTENSITY_OPTIONS[1..4], itself DATA-BEARING and never
// translated) to the stable FlowIntensity enum mirrored into the shared
// dailyJournalStore. Left untouched: as long as IRREGULAR_INTENSITY_OPTIONS's
// values stay French, this mapping keeps working correctly regardless of the
// app's display language.
const FLOW_MAP: Record<string, FlowIntensity> = {
  Légère: 'light',
  Modérée: 'moderate',
  Forte: 'heavy',
  'Très forte': 'veryHeavy',
};

/* ============================================================
 * CHOICE ROW
 * ========================================================== */

function ChoiceRow({
  icon,
  label,
  onPress,
  selected,
  tone = ACCENT,
}: {
  icon?: IconName;
  label: string;
  onPress: () => void;
  selected: boolean;
  tone?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.choiceRow,
        selected && {
          borderColor: `${tone}55`,
          backgroundColor: `${tone}0D`,
        },
        pressed && styles.pressed,
      ]}>
      {icon ? (
        <View
          style={[
            styles.choiceRowIcon,
            {backgroundColor: `${tone}13`},
          ]}>
          <MaterialDesignIcons
            color={tone}
            name={icon}
            size={20}
          />
        </View>
      ) : null}

      <Text
        style={[
          styles.choiceRowText,
          selected && {color: tone},
        ]}>
        {label}
      </Text>

      <View
        style={[
          styles.radio,
          selected && {
            borderColor: tone,
            backgroundColor: tone,
          },
        ]}>
        {selected ? (
          <MaterialDesignIcons
            color="#FFFFFF"
            name="check"
            size={13}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

/* ============================================================
 * CHOICE TILE
 * ========================================================== */

function ChoiceTile({
  icon,
  label,
  onPress,
  selected,
  tone = ACCENT,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  selected: boolean;
  tone?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.choiceTile,
        selected && {
          borderColor: `${tone}55`,
          backgroundColor: `${tone}0B`,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.tileIcon,
          {backgroundColor: `${tone}13`},
        ]}>
        <MaterialDesignIcons
          color={tone}
          name={icon}
          size={23}
        />
      </View>

      <Text
        style={[
          styles.choiceTileText,
          selected && {color: tone},
        ]}>
        {label}
      </Text>

      <View
        style={[
          styles.tileRadio,
          selected && {
            borderColor: tone,
            backgroundColor: tone,
          },
        ]}>
        {selected ? (
          <MaterialDesignIcons
            color="#FFFFFF"
            name="check"
            size={12}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

/* ============================================================
 * CHIPS
 * ========================================================== */

function Chips({
  icon,
  options,
  selected,
  onToggle,
  namespace,
}: {
  icon?: IconName;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  /** Optional: when the options are DATA-BEARING (the persisted value), the
   * rendered label is translated display-only via journalOptionLabel — the
   * stored/compared/selected value (`option` itself) never changes. */
  namespace?: JournalOptionNamespace;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.chips}>
      {options.map(option => {
        const active = selected.includes(option);
        const label = namespace ? journalOptionLabel(namespace, option, t) : option;

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="checkbox"
            accessibilityState={{checked: active}}
            key={option}
            onPress={() => onToggle(option)}
            style={({pressed}) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}>
            {icon ? (
              <MaterialDesignIcons
                color={active ? theme.colors.primary : theme.colors.textMuted}
                name={icon}
                size={14}
              />
            ) : null}

            <Text
              style={[
                styles.chipText,
                active && styles.chipTextActive,
              ]}>
              {label}
            </Text>

            {active ? (
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="check-circle"
                size={14}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============================================================
 * NOTES
 * ========================================================== */

function NotesField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="pencil-outline"
            size={18}
          />
        </View>

        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>
            {t('irregularJournalEntry.notes.title')}
          </Text>

          <Text style={styles.optional}>
            {t('irregularJournalEntry.optional')}
          </Text>
        </View>
      </View>

      <View style={styles.noteContainer}>
        <TextInput
          accessibilityLabel={t('irregularJournalEntry.notes.accessibilityLabel')}
          maxLength={300}
          multiline
          onChangeText={onChangeText}
          placeholder={t('irregularJournalEntry.notes.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.noteInput}
          textAlignVertical="top"
          value={value}
        />

        <Text style={styles.counter}>
          {value.length}/300
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
 * SCREEN
 * ========================================================== */

export default function IrregularJournalEntryScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const route = useRoute<Props>();
  const {category} = route.params;
  const requestedDate = route.params.date;

  const insets = useSafeAreaInsets();
  const meta = useMemo(() => categoryMeta(t)[category], [t, category]);

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {todayKey} = useToday();

  // The day this entry is written to — today by default, or an explicit PAST
  // (or today's) day when opened from the Calendar's selected day so a period
  // can be recorded/corrected retroactively. A future day is never accepted.
  const entryDateKey =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : todayKey;
  const isFutureEntryDate = entryDateKey > todayKey;
  const isPastEntryDate = entryDateKey < todayKey;
  // Wording only: a past day is never described as "today".
  const dayWord = isPastEntryDate
    ? t('irregularJournalEntry.dayWord.past')
    : t('irregularJournalEntry.dayWord.today');
  // The hero prompt's `{{day}}` placeholder is interpolated here, in the
  // same t() call as the lookup — never via a runtime `.replace()` on the
  // already-translated string (see the comment on `categoryMeta` above).
  const categoryPrompt = t(`irregularJournalEntry.categories.${category}.prompt`, {day: dayWord});

  const [value, setValue] = useState('');
  const [secondary, setSecondary] = useState('');

  const [periodStatus, setPeriodStatus] =
    useState<'yes' | 'no' | 'spotting' | ''>('');

  const [areas, setAreas] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const [previousWeight, setPreviousWeight] =
    useState<string | undefined>();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveToast = useJournalSaveToast();

  /* ========================================================
   * HYDRATION
   * ====================================================== */

  useEffect(() => {
    let active = true;

    hydrateIrregularJournal().then(() => {
      if (!active) {
        return;
      }

      const entry =
        getIrregularJournalEntry(entryDateKey);

      const detail =
        entry?.details?.[category];

      setValue(
        category === 'period'
          ? detail?.flowIntensity ?? ''
          : entry?.[category] ?? '',
      );

      setSecondary(
        category === 'period'
          ? detail?.painLevel ?? ''
          : detail?.weightFeeling ?? '',
      );

      setPeriodStatus(
        category === 'period'
          ? detail?.status ?? ''
          : '',
      );

      setAreas(detail?.areas ?? []);

      // Fatigue's associated symptoms live at the entry's top level (with a
      // fallback for entries saved under details.fatigue.symptoms); the pain
      // types are the pain category's own details.symptoms. The two must
      // never read each other's data.
      setSymptoms(
        category === 'fatigue'
          ? getIrregularFatigueSymptoms(entry)
          : category === 'pain'
            ? detail?.symptoms ?? []
            : [],
      );

      setNote(detail?.note ?? '');

      if (category === 'weight') {
        const dates = Object.keys(
          getAllIrregularJournalEntries(),
        )
          .filter(
            date =>
              date < entryDateKey &&
              Boolean(
                getIrregularJournalEntry(date)
                  ?.weight,
              ),
          )
          .sort();

        const date = dates[dates.length - 1];

        setPreviousWeight(
          date
            ? getIrregularJournalEntry(date)
                ?.weight
            : undefined,
        );
      }
    });

    return () => {
      active = false;
    };
  }, [category, entryDateKey]);

  const toggle = (
    setter: React.Dispatch<
      React.SetStateAction<string[]>
    >,
    option: string,
  ) => {
    setter(current =>
      current.includes(option)
        ? current.filter(
            item => item !== option,
          )
        : [...current, option],
    );
  };

  const weightVariation =
    category === 'weight'
      ? computeWeightVariation(
          previousWeight,
          value.trim(),
        )
      : null;

  /* ========================================================
   * SAVE
   * ====================================================== */

  const save = async () => {
    if (saving) {
      return;
    }

    if (isFutureEntryDate) {
      setError(
        t('irregularJournalEntry.errors.futureDate'),
      );
      return;
    }

    if (
      category === 'period' &&
      !periodStatus
    ) {
      setError(
        isPastEntryDate
          ? t('irregularJournalEntry.errors.periodStatusPast')
          : t('irregularJournalEntry.errors.periodStatusToday'),
      );
      return;
    }

    if (
      category === 'period' &&
      periodStatus !== 'no' &&
      !value
    ) {
      setError(
        t('irregularJournalEntry.errors.periodFlow'),
      );
      return;
    }

    if (
      category !== 'period' &&
      !value.trim()
    ) {
      setError(
        t('irregularJournalEntry.errors.chooseAnswer'),
      );
      return;
    }

    const details: IrregularJournalDetails = {
      note: note.trim() || undefined,

      areas,

      symptoms:
        category === 'fatigue' ||
        category === 'pain'
          ? symptoms
          : undefined,

      status:
        category === 'period'
          ? periodStatus || undefined
          : undefined,

      flowIntensity:
        category === 'period'
          ? value || undefined
          : undefined,

      painLevel:
        category === 'period'
          ? secondary || undefined
          : undefined,

      weightFeeling:
        category === 'weight'
          ? secondary || undefined
          : undefined,
    };

    // DATA-BEARING — NOT display-only text. This compact summary is
    // persisted verbatim into `entries[date].period` (see
    // saveIrregularJournalEntry below, `summary` param) — it is a stored
    // record, not the on-screen PERIOD_STATUS radio labels (those ARE
    // translated via periodStatusOptions(t) above). Stays French, same
    // reasoning as ACNE_OPTIONS/HAIR_OPTIONS above and the imported
    // IRREGULAR_INTENSITY_OPTIONS (also embedded here via `value`).
    const periodSummary =
      periodStatus === 'no'
        ? 'Non'
        : `${
            periodStatus === 'spotting'
              ? 'Spotting'
              : 'Oui'
          }${value ? ` · ${value}` : ''}`;

    const summary =
      category === 'period'
        ? periodSummary
        : value.trim();

    setError('');
    setSaving(true);

    try {
      // Period: the shared flow record is written FIRST so that, when the
      // SOPK store notifies its subscribers, Dashboard / Calendar already
      // find both halves of the answer (flow + the No/Spotting/Oui status).
      if (category === 'period') {
        const intensity =
          periodStatus === 'no' ||
          periodStatus === 'spotting'
            ? 'none'
            : FLOW_MAP[value] ??
              'moderate';

        await saveJournalSection(
          entryDateKey,
          'flow',
          {
            intensity,
            pain:
              secondary || undefined,
            note:
              note.trim() || undefined,
          },
        );
      }

      await saveIrregularJournalEntry(
        entryDateKey,
        category,
        summary,
        details,
      );

      saveToast.show(
        meta.toastTitle,
        t('irregularJournalEntry.toastMessage'),
        navigation.goBack,
      );
    } catch (saveError) {
      // Not persisted: no success toast, no navigation, the form keeps what was entered (see services/saveFailure.ts).
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(
                getTopPadding(
                  insets.top,
                  false,
                ) - 12,
                8,
              ),

              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + 18,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* PREMIUM CENTERED HEADER */}

          <View style={styles.topBar}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              icon="chevron-left"
              onPress={navigation.goBack}
              style={styles.backButton}
              variant="tonal"
            />

            <View pointerEvents="none" style={styles.topBarTitleWrap}>
              <AwaText style={styles.topBarTitle} variant="titleMedium">
                {meta.title}
              </AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.topBarSubtitle} variant="bodySmall">
                {t('irregularJournalEntry.todaySubtitle')}
              </AwaText>
            </View>

            <View style={styles.topBarRightSpacer} />
          </View>

          {/* PREMIUM HERO */}

          <View style={styles.hero}>

            <View
              style={[
                styles.heroIconRing,
                category === 'period'
                  ? styles.heroIconRingPeriod
                  : styles.heroIconRingDefault,
              ]}>
              <View style={[styles.heroIcon, {backgroundColor: meta.tint}]}>
                <MaterialDesignIcons
                  color={category === 'period' ? ROSE : ACCENT}
                  name={meta.icon}
                  size={28}
                />
              </View>
            </View>

            <View style={styles.heroCopy}>
              <View style={styles.heroEyebrowRow}>
                <View
                  style={[
                    styles.heroEyebrowDot,
                    {backgroundColor: category === 'period' ? ROSE : ACCENT},
                  ]}
                />
                <Text
                  style={[
                    styles.heroEyebrow,
                    {color: category === 'period' ? ROSE : ACCENT},
                  ]}>
                  {t('irregularJournalEntry.todayEyebrow')}
                </Text>
              </View>

              <AwaText colorRole="onSurfaceVariant" style={styles.heroPrompt} variant="bodyMedium">
                {categoryPrompt}
              </AwaText>
              {isPastEntryDate || isFutureEntryDate ? (
                <AwaText colorRole="onSurfaceVariant" style={styles.heroPrompt} variant="bodyMedium">
                  {formatFullDate(new Date(`${entryDateKey}T12:00:00`))}
                </AwaText>
              ) : null}
            </View>
          </View>

          {category === 'period' ? (
            <>
              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {isPastEntryDate
                    ? t('irregularJournalEntry.period.questionPast')
                    : t('irregularJournalEntry.period.questionToday')}
                </Text>

                <View
                  style={styles.stack}>
                  {periodStatusOptions(t).map(
                    option => (
                      <ChoiceRow
                        icon={option.icon}
                        key={
                          option.value
                        }
                        label={
                          option.label
                        }
                        onPress={() =>
                          setPeriodStatus(
                            option.value,
                          )
                        }
                        selected={
                          periodStatus ===
                          option.value
                        }
                        tone={ROSE}
                      />
                    ),
                  )}
                </View>
              </AwaCard>

              {periodStatus !== 'no' &&
              periodStatus !== '' ? (
                <AwaCard style={styles.card} variant="filled">
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    {t('irregularJournalEntry.period.flowIntensityTitle')}
                  </Text>

                  <View
                    style={
                      styles.fourGrid
                    }>
                    {IRREGULAR_INTENSITY_OPTIONS.slice(
                      1,
                    ).map(
                      (
                        option,
                        index,
                      ) => (
                        <ChoiceTile
                          icon={
                            index < 2
                              ? 'water-outline'
                              : 'water'
                          }
                          key={option}
                          label={journalOptionLabel('irregularIntensity', option, t)}
                          onPress={() =>
                            setValue(
                              option,
                            )
                          }
                          selected={
                            value ===
                            option
                          }
                          tone={ROSE}
                        />
                      ),
                    )}
                  </View>

                  <Text
                    style={[
                      styles.cardTitle,
                      styles.subsectionTitle,
                    ]}>
                    {t('irregularJournalEntry.period.associatedPainTitle')}
                  </Text>

                  {/* DATA-BEARING — persisted verbatim into
                      details.painLevel. Stays French, same reasoning as
                      ACNE_OPTIONS above. */}
                  <View
                    style={
                      styles.fourGrid
                    }>
                    {[
                      'Aucune',
                      'Légères',
                      'Modérées',
                      'Sévères',
                    ].map(option => (
                      <ChoiceTile
                        icon={
                          option ===
                          'Aucune'
                            ? 'water-outline'
                            : 'lightning-bolt-outline'
                        }
                        key={option}
                        label={journalOptionLabel('irregularPeriodPainLevel', option, t)}
                        onPress={() =>
                          setSecondary(
                            option,
                          )
                        }
                        selected={
                          secondary ===
                          option
                        }
                        tone={ROSE}
                      />
                    ))}
                  </View>
                </AwaCard>
              ) : null}
            </>
          ) : null}

          {/* ACNE */}

          {category === 'acne' ? (
            <>
              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {t('irregularJournalEntry.acne.skinStateTitle', {day: dayWord})}
                </Text>

                <View
                  style={styles.stack}>
                  {ACNE_OPTIONS.map(
                    option => (
                      <ChoiceRow
                        key={option}
                        label={journalOptionLabel('irregularAcne', option, t)}
                        onPress={() =>
                          setValue(
                            option,
                          )
                        }
                        selected={
                          value === option
                        }
                        tone={ROSE}
                      />
                    ),
                  )}
                </View>
              </AwaCard>

              <AwaCard style={styles.card} variant="filled">
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    {t('irregularJournalEntry.areasTitle')}
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    {t('irregularJournalEntry.optional')}
                  </Text>
                </View>

                <Chips
                  icon="map-marker-outline"
                  onToggle={option =>
                    toggle(
                      setAreas,
                      option,
                    )
                  }
                  namespace="irregularAcneArea"
                  options={ACNE_AREAS}
                  selected={areas}
                />
              </AwaCard>
            </>
          ) : null}

          {/* HAIR */}

          {category ===
          'hairGrowth' ? (
            <>
              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {t('irregularJournalEntry.hairGrowth.levelTitle', {day: dayWord})}
                </Text>

                <View
                  style={styles.stack}>
                  {HAIR_OPTIONS.map(
                    option => (
                      <ChoiceRow
                        key={option}
                        label={journalOptionLabel('irregularHair', option, t)}
                        onPress={() =>
                          setValue(
                            option,
                          )
                        }
                        selected={
                          value === option
                        }
                      />
                    ),
                  )}
                </View>
              </AwaCard>

              <AwaCard style={styles.card} variant="filled">
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    {t('irregularJournalEntry.areasTitle')}
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    {t('irregularJournalEntry.optional')}
                  </Text>
                </View>

                <View
                  style={
                    styles.helperRow
                  }>
                  <View
                    style={
                      styles.helperIcon
                    }>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="human-male-female"
                      size={19}
                    />
                  </View>

                  <Text
                    style={
                      styles.helperText
                    }>
                    {t('irregularJournalEntry.hairGrowth.helperText')}
                  </Text>
                </View>

                <Chips
                  icon="map-marker-outline"
                  onToggle={option =>
                    toggle(
                      setAreas,
                      option,
                    )
                  }
                  namespace="irregularHairArea"
                  options={HAIR_AREAS}
                  selected={areas}
                />
              </AwaCard>
            </>
          ) : null}

          {/* WEIGHT */}

          {category === 'weight' ? (
            <>
              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {isPastEntryDate ? t('irregularJournalEntry.weight.titlePast') : t('irregularJournalEntry.weight.titleToday')}
                </Text>

                <View
                  style={
                    styles.weightRow
                  }>
                  <View
                    style={
                      styles.weightIcon
                    }>
                    <MaterialDesignIcons
                      color={GREEN}
                      name="scale-bathroom"
                      size={22}
                    />
                  </View>

                  <TextInput
                    accessibilityLabel={t('irregularJournalEntry.weight.accessibilityLabel')}
                    keyboardType="decimal-pad"
                    onChangeText={
                      setValue
                    }
                    placeholder={t('irregularJournalEntry.weight.placeholder')}
                    placeholderTextColor={theme.colors.textMuted}
                    style={
                      styles.weightInput
                    }
                    value={value}
                  />
                </View>

                {weightVariation ? (
                  <View
                    style={
                      styles.variation
                    }>
                    <MaterialDesignIcons
                      color={GREEN}
                      name="trending-up"
                      size={17}
                    />

                    <Text
                      style={
                        styles.variationText
                      }>
                      {t('irregularJournalEntry.weight.variationLabel')}{' '}
                      <Text
                        style={
                          styles.variationStrong
                        }>
                        {weightVariation}
                      </Text>
                    </Text>
                  </View>
                ) : null}
              </AwaCard>

              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {t('irregularJournalEntry.weight.feelingTitle')}
                </Text>

                <View
                  style={
                    styles.threeGrid
                  }>
                  {WEIGHT_FEELINGS.map(
                    (
                      option,
                      index,
                    ) => (
                      <ChoiceTile
                        icon={
                          index === 0
                            ? 'emoticon-happy-outline'
                            : index === 1
                              ? 'emoticon-neutral-outline'
                              : 'emoticon-sad-outline'
                        }
                        key={option}
                        label={journalOptionLabel('irregularWeightFeeling', option, t)}
                        onPress={() =>
                          setSecondary(
                            option,
                          )
                        }
                        selected={
                          secondary ===
                          option
                        }
                        tone={
                          index === 2
                            ? ROSE
                            : ACCENT
                        }
                      />
                    ),
                  )}
                </View>
              </AwaCard>
            </>
          ) : null}

          {/* PAIN */}

          {category === 'pain' ? (
            <>
              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {t('irregularJournalEntry.pain.whichPainTitle')}
                </Text>

                <Chips
                  icon="lightning-bolt-outline"
                  onToggle={option =>
                    toggle(
                      setAreas,
                      option,
                    )
                  }
                  namespace="irregularPainType"
                  options={PAIN_TYPES}
                  selected={areas}
                />

                <Text
                  style={[
                    styles.cardTitle,
                    styles.subsectionTitle,
                  ]}>
                  {t('irregularJournalEntry.pain.intensityTitle')}
                </Text>

                <View
                  style={styles.stack}>
                  {IRREGULAR_INTENSITY_OPTIONS.map(
                    option => (
                      <ChoiceRow
                        key={option}
                        label={journalOptionLabel('irregularIntensity', option, t)}
                        onPress={() =>
                          setValue(
                            option,
                          )
                        }
                        selected={
                          value === option
                        }
                        tone={ROSE}
                      />
                    ),
                  )}
                </View>
              </AwaCard>

              <AwaCard style={styles.card} variant="filled">
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    {t('irregularJournalEntry.areasTitle')}
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    {t('irregularJournalEntry.optional')}
                  </Text>
                </View>

                <Chips
                  icon="map-marker-outline"
                  onToggle={option =>
                    toggle(
                      setSymptoms,
                      option,
                    )
                  }
                  namespace="irregularPainArea"
                  options={PAIN_AREAS}
                  selected={symptoms}
                />
              </AwaCard>
            </>
          ) : null}

          {/* MOOD */}

          {category === 'mood' ? (
            <AwaCard style={styles.card} variant="filled">
              <Text
                style={styles.cardTitle}>
                {isPastEntryDate ? t('irregularJournalEntry.mood.questionPast') : t('irregularJournalEntry.mood.questionToday')}
              </Text>

              <View
                style={styles.moodGrid}>
                {IRREGULAR_MOOD_OPTIONS.map(
                  (option, index) => {
                    const icons: IconName[] =
                      [
                        'emoticon-sad-outline',
                        'emoticon-sad-outline',
                        'emoticon-neutral-outline',
                        'emoticon-happy-outline',
                        'emoticon-excited-outline',
                      ];

                    const tones = [
                      '#557ACB',
                      ORANGE,
                      '#8C77C9',
                      GREEN,
                      ACCENT,
                    ];

                    return (
                      <ChoiceTile
                        icon={
                          icons[index]
                        }
                        key={option}
                        label={journalOptionLabel('irregularMood', option, t)}
                        onPress={() =>
                          setValue(
                            option,
                          )
                        }
                        selected={
                          value === option
                        }
                        tone={
                          tones[index]
                        }
                      />
                    );
                  },
                )}
              </View>

              <View
                style={
                  styles.kindnessCard
                }>
                <View
                  style={
                    styles.kindnessIcon
                  }>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="star-four-points-outline"
                    size={19}
                  />
                </View>

                <View
                  style={
                    styles.kindnessCopy
                  }>
                  <Text
                    style={
                      styles.kindnessTitle
                    }>
                    {t('irregularJournalEntry.mood.kindnessTitle')}
                  </Text>

                  <Text
                    style={
                      styles.kindnessText
                    }>
                    {t('irregularJournalEntry.mood.kindnessText')}
                  </Text>
                </View>
              </View>
            </AwaCard>
          ) : null}

          {/* FATIGUE */}

          {category === 'fatigue' ? (
            <>
              <AwaCard style={styles.card} variant="filled">
                <Text
                  style={styles.cardTitle}>
                  {isPastEntryDate
                    ? t('irregularJournalEntry.fatigue.levelTitlePast')
                    : t('irregularJournalEntry.fatigue.levelTitleToday')}
                </Text>

                {/* DATA-BEARING — persisted verbatim into
                    entries[date].fatigue, and 'Aucune' is compared by
                    isIrregularSymptomAnswer(). Stays French, same reasoning
                    as ACNE_OPTIONS above. */}
                <View
                  style={
                    styles.fourGrid
                  }>
                  {[
                    'Aucune',
                    'Légère',
                    'Modérée',
                    'Forte',
                  ].map(
                    (
                      option,
                      index,
                    ) => (
                      <ChoiceTile
                        icon={
                          index === 0
                            ? 'battery-high'
                            : index === 1
                              ? 'battery-medium'
                              : index === 2
                                ? 'battery-low'
                                : 'battery-alert-variant-outline'
                        }
                        key={option}
                        label={journalOptionLabel('irregularFatigueLevel', option, t)}
                        onPress={() =>
                          setValue(
                            option,
                          )
                        }
                        selected={
                          value === option
                        }
                        tone={
                          index > 2
                            ? ROSE
                            : ACCENT
                        }
                      />
                    ),
                  )}
                </View>
              </AwaCard>

              <AwaCard style={styles.card} variant="filled">
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    {t('irregularJournalEntry.fatigue.symptomsTitle')}
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    {t('irregularJournalEntry.optional')}
                  </Text>
                </View>

                <Text
                  style={
                    styles.sectionDescription
                  }>
                  {t('irregularJournalEntry.fatigue.symptomsDescription', {day: dayWord})}
                </Text>

                <Chips
                  icon="plus-circle-outline"
                  onToggle={option =>
                    toggle(
                      setSymptoms,
                      option,
                    )
                  }
                  namespace="irregularSymptom"
                  options={
                    IRREGULAR_SYMPTOM_OPTIONS
                  }
                  selected={symptoms}
                />
              </AwaCard>
            </>
          ) : null}

          {/* NOTES */}

          <AwaCard style={styles.card} variant="filled">
            <NotesField
              onChangeText={setNote}
              value={note}
            />
          </AwaCard>

          {/* ERROR */}

          {error ? (
            <View
              style={styles.errorCard}>
              <MaterialDesignIcons
                color={theme.colors.danger}
                name="alert-circle-outline"
                size={18}
              />

              <Text
                accessibilityRole="alert"
                style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* SAVE */}

          <AwaButton
            disabled={saving}
            fullWidth
            icon={saving ? undefined : 'check'}
            label={saving
              ? t('periodStartSheet.saving')
              : meta.saveLabel}
            loading={saving}
            onPress={save}
            size="large"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <JournalSaveToast
        animation={
          saveToast.animation
        }
        bottom={
          Math.max(
            insets.bottom,
            18,
          ) + 12
        }
        message={saveToast.message}
        onDismiss={saveToast.hide}
        title={saveToast.title}
        visible={saveToast.visible}
      />
    </View>
  );
}

/* ============================================================
 * STYLES
 * ========================================================== */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 17,
  },

  /* HEADER */

  topBar: {
    position: 'relative',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  backButton: {
    zIndex: 2,
  },

  topBarTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBarTitle: {
    maxWidth: '100%',
    textAlign: 'center',
  },

  topBarSubtitle: {
    marginTop: 2,
    textAlign: 'center',
  },

  topBarRightSpacer: {
    width: 40,
    height: 40,
  },

  /* HERO */

  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 124,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    paddingHorizontal: 17,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.09),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },



  heroIconRing: {
    width: 64,
    height: 64,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.52),
  },

  // SEMANTIC — the hero icon ring's border always reflects the same
  // Règles/period vs. everything-else identity color as heroEyebrowDot/
  // heroEyebrow/the hero icon color below (ACCENT@0.18 / ROSE@0.18) — kept
  // as fixed literals, never theme-driven, alongside those.
  heroIconRingDefault: {
    borderColor: 'rgba(112,64,217,0.18)',
  },

  heroIconRingPeriod: {
    borderColor: 'rgba(234,90,139,0.18)',
  },

  heroIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.surface, 0.92),
    // SEMANTIC — matches the frozen ACCENT hero icon color (see render body).
    shadowColor: '#7040D9',
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },

  heroCopy: {
    flex: 1,
    minWidth: 0,
  },

  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  heroEyebrowDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 3,
  },

  heroEyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 0.85,
  },

  heroPrompt: {
    marginTop: 4,
  },

  /* CARD */

  card: {
    marginBottom: 12,
  },

  cardTitle: {
    color: theme.colors.text,

    fontSize: 16,
    lineHeight: 21,

    fontWeight: '800',
  },

  subsectionTitle: {
    marginTop: 20,
  },

  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',

    gap: 8,
  },

  optional: {
    marginTop: 1,

    color: theme.colors.textSecondary,

    fontSize: 11,
    fontWeight: '600',
  },

  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,

    color: theme.colors.primary,

    fontSize: 11,
    fontWeight: '700',
  },

  stack: {
    marginTop: 13,
    gap: 8,
  },

  /* CHOICE ROW */

  choiceRow: {
    minHeight: 52,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,

    paddingHorizontal: 12,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),

    borderRadius: 16,

    backgroundColor: theme.colors.surface,
  },

  choiceRowIcon: {
    width: 31,
    height: 31,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,
  },

  choiceRowText: {
    flex: 1,

    color: theme.colors.text,

    fontSize: 14,
    fontWeight: '700',
  },

  radio: {
    width: 21,
    height: 21,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1.5,
    borderColor: withAlpha(theme.colors.primary, 0.2),

    borderRadius: 11,
  },

  /* GRID */

  fourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 8,

    marginTop: 13,
  },

  threeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 8,

    marginTop: 13,
  },

  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 8,

    marginTop: 13,
  },

  choiceTile: {
    position: 'relative',

    flexGrow: 1,
    flexBasis: '22%',

    minWidth: 72,
    minHeight: 94,

    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),

    borderRadius: 16,

    backgroundColor: theme.colors.surface,
  },

  tileIcon: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 20,
  },

  choiceTileText: {
    color: theme.colors.text,

    fontSize: 11,
    lineHeight: 14,

    fontWeight: '800',

    textAlign: 'center',
  },

  tileRadio: {
    position: 'absolute',

    top: 8,
    right: 8,

    width: 19,
    height: 19,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1.4,
    borderColor: withAlpha(theme.colors.primary, 0.2),

    borderRadius: 10,
  },

  /* CHIPS */

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 7,

    marginTop: 12,
  },

  chip: {
    minHeight: 40,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    paddingHorizontal: 11,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),

    borderRadius: 18,

    backgroundColor: theme.colors.surface,
  },

  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  chipText: {
    color: theme.colors.textSecondary,

    fontSize: 11.5,
    fontWeight: '700',
  },

  chipTextActive: {
    color: theme.colors.primary,
  },

  /* HELPER */

  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,

    marginTop: 10,

    padding: 12,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  helperIcon: {
    width: 34,
    height: 34,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  helperText: {
    flex: 1,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 16,
  },

  /* WEIGHT */

  weightRow: {
    minHeight: 58,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,

    marginTop: 13,

    paddingHorizontal: 13,

    borderWidth: 1.3,
    borderColor: withAlpha(theme.colors.primary, 0.16),

    borderRadius: 16,

    backgroundColor: theme.colors.surface,
  },

  // SEMANTIC — weight-trend colors (icon + variation callout below), paired
  // with the frozen GREEN accent used in the render body. Never theme-driven.
  weightIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: '#EDF8F3',
  },

  weightInput: {
    flex: 1,

    color: theme.colors.text,

    fontSize: 17,
    fontWeight: '800',
  },

  variation: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 7,

    marginTop: 11,

    padding: 12,

    borderRadius: 12,

    // SEMANTIC — see weightIcon above.
    backgroundColor: '#EDF8F2',
  },

  variationText: {
    flex: 1,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 16,
  },

  variationStrong: {
    color: GREEN,
    fontWeight: '800',
  },

  /* KINDNESS */

  kindnessCard: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,

    marginTop: 14,

    padding: 12,

    borderRadius: 16,

    backgroundColor: theme.colors.primarySoft,
  },

  kindnessIcon: {
    width: 35,
    height: 35,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  kindnessCopy: {
    flex: 1,
  },

  kindnessTitle: {
    color: theme.colors.text,

    fontSize: 12.5,
    fontWeight: '800',
  },

  kindnessText: {
    marginTop: 2,

    color: theme.colors.textSecondary,

    fontSize: 11,
    lineHeight: 15,
  },

  /* SECTION */

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,
  },

  sectionIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  sectionCopy: {
    flex: 1,
  },

  sectionTitle: {
    color: theme.colors.text,

    fontSize: 15,
    fontWeight: '800',
  },

  sectionDescription: {
    marginTop: 6,

    color: theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 16,
  },

  /* NOTES */

  noteContainer: {
    position: 'relative',

    marginTop: 12,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),

    borderRadius: 16,

    backgroundColor: theme.colors.surface,

    overflow: 'hidden',
  },

  noteInput: {
    minHeight: 100,

    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 27,

    color: theme.colors.text,

    fontSize: 13,
    lineHeight: 19,
  },

  counter: {
    position: 'absolute',

    right: 11,
    bottom: 8,

    color: theme.colors.textMuted,

    fontSize: 11,
  },

  /* ERROR */

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,

    marginBottom: 12,

    padding: 12,

    borderRadius: 12,

    backgroundColor: withAlpha(theme.colors.danger, 0.1),
  },

  errorText: {
    flex: 1,

    color: theme.colors.danger,

    fontSize: 12,
    lineHeight: 17,

    fontWeight: '600',
  },

  /* SAVE */

  saveButton: {
    marginTop: 2,
  },

  pressed: {
    opacity: 0.78,
  },
  });
}
