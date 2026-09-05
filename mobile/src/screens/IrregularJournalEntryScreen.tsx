import React, {useEffect, useMemo, useState} from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  JournalSaveToast,
  useJournalSaveToast,
} from '../components/journal/JournalSaveToast';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
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
import type {FlowIntensity} from '../types/journal';
import {computeWeightVariation} from '../utils/irregularDailyTrackingMath';

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

const CATEGORY_META: Record<
  IrregularJournalRouteCategory,
  {
    title: string;
    icon: IconName;
    tint: string;
    prompt: string;
    saveLabel: string;
  }
> = {
  period: {
    title: 'Règles',
    icon: 'water',
    tint: '#FFE9F0',
    prompt:
      'Renseigne ton flux et les sensations ressenties aujourd’hui.',
    saveLabel: 'Enregistrer mes règles',
  },

  acne: {
    title: 'Acné',
    icon: 'face-woman-outline',
    tint: '#FFF0E9',
    prompt:
      'Observe simplement l’état de ta peau aujourd’hui.',
    saveLabel: 'Enregistrer mon suivi',
  },

  hairGrowth: {
    title: 'Pilosité',
    icon: 'human',
    tint: '#EEE7FC',
    prompt:
      'Note les changements que tu souhaites suivre, à ton rythme.',
    saveLabel: 'Enregistrer mon suivi',
  },

  weight: {
    title: 'Poids',
    icon: 'scale-bathroom',
    tint: '#EAF4F0',
    prompt:
      'Enregistre ta mesure du jour, sans jugement.',
    saveLabel: 'Enregistrer mon poids',
  },

  pain: {
    title: 'Douleurs',
    icon: 'lightning-bolt-outline',
    tint: '#FFEDEA',
    prompt:
      'Note ce que tu ressens aujourd’hui.',
    saveLabel: 'Enregistrer mes douleurs',
  },

  mood: {
    title: 'Humeur',
    icon: 'emoticon-outline',
    tint: '#F2EAFF',
    prompt:
      'Comment te sens-tu aujourd’hui ?',
    saveLabel: 'Enregistrer mon humeur',
  },

  fatigue: {
    title: 'Fatigue & symptômes',
    icon: 'battery-medium',
    tint: '#EEF0FF',
    prompt:
      'Prends un moment pour faire le point sur ta journée.',
    saveLabel: 'Enregistrer mon suivi',
  },
};

const PERIOD_STATUS = [
  {
    value: 'yes',
    label: 'Oui',
    icon: 'check-circle-outline',
  },
  {
    value: 'no',
    label: 'Non',
    icon: 'close-circle-outline',
  },
  {
    value: 'spotting',
    label: 'Spotting',
    icon: 'water-outline',
  },
] as const;

const ACNE_OPTIONS = [
  'Aucune',
  'Légère',
  'Modérée',
  'Marquée',
  'Très marquée',
];

const HAIR_OPTIONS = [
  'Aucune',
  'Légère',
  'Modérée',
  'Importante',
  'Très importante',
];

const PAIN_TYPES = [
  'Crampes',
  'Bas-ventre',
  'Dos',
  'Maux de tête',
  'Autre',
];

const WEIGHT_FEELINGS = [
  'Bien',
  'Neutre',
  'Préoccupée',
];

const ACNE_AREAS = [
  'Visage',
  'Dos',
  'Poitrine',
  'Autre',
];

const HAIR_AREAS = [
  'Visage',
  'Menton',
  'Ventre',
  'Bras',
  'Jambes',
  'Autre',
];

const PAIN_AREAS = [
  'Bas-ventre',
  'Dos',
  'Tête',
  'Seins',
  'Autre',
];

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
        numberOfLines={2}
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
}: {
  icon?: IconName;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.chips}>
      {options.map(option => {
        const active = selected.includes(option);

        return (
          <Pressable
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
              {option}
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
            Notes
          </Text>

          <Text style={styles.optional}>
            Optionnel
          </Text>
        </View>
      </View>

      <View style={styles.noteContainer}>
        <TextInput
          accessibilityLabel="Note personnelle"
          maxLength={300}
          multiline
          onChangeText={onChangeText}
          placeholder="Ajouter une note…"
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList>
    >();

  const route = useRoute<Props>();
  const {category} = route.params;

  const insets = useSafeAreaInsets();
  const meta = CATEGORY_META[category];

  const todayKey = useMemo(
    () => new Date().toLocaleDateString('en-CA'),
    [],
  );

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
        getIrregularJournalEntry(todayKey);

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

      setSymptoms(
        category === 'fatigue' ||
        category === 'pain'
          ? detail?.symptoms ??
              entry?.symptoms ??
              []
          : [],
      );

      setNote(detail?.note ?? '');

      if (category === 'weight') {
        const dates = Object.keys(
          getAllIrregularJournalEntries(),
        )
          .filter(
            date =>
              date < todayKey &&
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
  }, [category, todayKey]);

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

    if (
      category === 'period' &&
      !periodStatus
    ) {
      setError(
        'Choisis si tu as tes règles aujourd’hui avant d’enregistrer.',
      );
      return;
    }

    if (
      category === 'period' &&
      periodStatus !== 'no' &&
      !value
    ) {
      setError(
        'Choisis l’intensité du flux avant d’enregistrer.',
      );
      return;
    }

    if (
      category !== 'period' &&
      !value.trim()
    ) {
      setError(
        'Choisis une réponse avant d’enregistrer.',
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
      await saveIrregularJournalEntry(
        todayKey,
        category,
        summary,
        details,
      );

      if (category === 'period') {
        const intensity =
          periodStatus === 'no' ||
          periodStatus === 'spotting'
            ? 'none'
            : FLOW_MAP[value] ??
              'moderate';

        await saveJournalSection(
          todayKey,
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

      saveToast.show(
        `${meta.title} enregistré${
          category === 'period'
            ? 'es'
            : ''
        }`,
        'Ton suivi du jour a bien été mis à jour.',
        navigation.goBack,
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <LinearGradient
      colors={[
        theme.colors.background,
        theme.colors.background,
      ]}
      style={styles.screen}>
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
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              style={({pressed}) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.text}
                name="chevron-left"
                size={27}
              />
            </Pressable>

            <View pointerEvents="none" style={styles.topBarTitleWrap}>
              <Text numberOfLines={1} style={styles.topBarTitle}>
                {meta.title}
              </Text>
              <Text numberOfLines={1} style={styles.topBarSubtitle}>
                Suivi du jour
              </Text>
            </View>

            <View style={styles.topBarRightSpacer} />
          </View>

          {/* PREMIUM HERO */}

          <LinearGradient
            colors={[theme.colors.surface, theme.colors.surfaceSecondary, meta.tint]}
            locations={[0, 0.62, 1]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.hero}>
            <View pointerEvents="none" style={styles.heroGlow} />
            <View pointerEvents="none" style={styles.heroGlowSecondary} />

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
                  SUIVI SOPK
                </Text>
              </View>

              <Text style={styles.heroTitle}>{meta.title}</Text>
              <Text style={styles.heroPrompt}>{meta.prompt}</Text>
            </View>
          </LinearGradient>

          {category === 'period' ? (
            <>
              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  As-tu tes règles
                  aujourd’hui ?
                </Text>

                <View
                  style={styles.stack}>
                  {PERIOD_STATUS.map(
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
              </View>

              {periodStatus !== 'no' &&
              periodStatus !== '' ? (
                <View
                  style={styles.card}>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    Intensité du flux
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
                          label={option}
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
                    Douleurs associées ?
                  </Text>

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
                        label={option}
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
                </View>
              ) : null}
            </>
          ) : null}

          {/* ACNE */}

          {category === 'acne' ? (
            <>
              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  État de ta peau
                  aujourd’hui
                </Text>

                <View
                  style={styles.stack}>
                  {ACNE_OPTIONS.map(
                    option => (
                      <ChoiceRow
                        key={option}
                        label={option}
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
              </View>

              <View style={styles.card}>
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    Zones concernées
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    Optionnel
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
                  options={ACNE_AREAS}
                  selected={areas}
                />
              </View>
            </>
          ) : null}

          {/* HAIR */}

          {category ===
          'hairGrowth' ? (
            <>
              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  Niveau aujourd’hui
                </Text>

                <View
                  style={styles.stack}>
                  {HAIR_OPTIONS.map(
                    option => (
                      <ChoiceRow
                        key={option}
                        label={option}
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
              </View>

              <View style={styles.card}>
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    Zones concernées
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    Optionnel
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
                    Sélectionne les zones
                    que tu souhaites
                    suivre.
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
                  options={HAIR_AREAS}
                  selected={areas}
                />
              </View>
            </>
          ) : null}

          {/* WEIGHT */}

          {category === 'weight' ? (
            <>
              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  Ton poids aujourd’hui
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
                    accessibilityLabel="Poids du jour"
                    keyboardType="decimal-pad"
                    onChangeText={
                      setValue
                    }
                    placeholder="Ex. 64,2 kg"
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
                      Variation depuis
                      la dernière mesure :{' '}
                      <Text
                        style={
                          styles.variationStrong
                        }>
                        {weightVariation}
                      </Text>
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  Comment te sens-tu par
                  rapport à ton poids ?
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
                        label={option}
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
              </View>
            </>
          ) : null}

          {/* PAIN */}

          {category === 'pain' ? (
            <>
              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  Quelles douleurs
                  ressens-tu ?
                </Text>

                <Chips
                  icon="lightning-bolt-outline"
                  onToggle={option =>
                    toggle(
                      setAreas,
                      option,
                    )
                  }
                  options={PAIN_TYPES}
                  selected={areas}
                />

                <Text
                  style={[
                    styles.cardTitle,
                    styles.subsectionTitle,
                  ]}>
                  Intensité
                </Text>

                <View
                  style={styles.stack}>
                  {IRREGULAR_INTENSITY_OPTIONS.map(
                    option => (
                      <ChoiceRow
                        key={option}
                        label={option}
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
              </View>

              <View style={styles.card}>
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    Zones concernées
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    Optionnel
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
                  options={PAIN_AREAS}
                  selected={symptoms}
                />
              </View>
            </>
          ) : null}

          {/* MOOD */}

          {category === 'mood' ? (
            <View style={styles.card}>
              <Text
                style={styles.cardTitle}>
                Comment te sens-tu
                aujourd’hui ?
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
                        label={option}
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
                    Chaque émotion est
                    normale
                  </Text>

                  <Text
                    style={
                      styles.kindnessText
                    }>
                    Prends soin de toi,
                    à ton rythme.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* FATIGUE */}

          {category === 'fatigue' ? (
            <>
              <View style={styles.card}>
                <Text
                  style={styles.cardTitle}>
                  Ton niveau de fatigue
                  aujourd’hui
                </Text>

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
                        label={option}
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
              </View>

              <View style={styles.card}>
                <View
                  style={
                    styles.titleWithBadge
                  }>
                  <Text
                    style={
                      styles.cardTitle
                    }>
                    Symptômes associés
                  </Text>

                  <Text
                    style={
                      styles.optionalBadge
                    }>
                    Optionnel
                  </Text>
                </View>

                <Text
                  style={
                    styles.sectionDescription
                  }>
                  Sélectionne tout ce qui
                  s’applique aujourd’hui.
                </Text>

                <Chips
                  icon="plus-circle-outline"
                  onToggle={option =>
                    toggle(
                      setSymptoms,
                      option,
                    )
                  }
                  options={
                    IRREGULAR_SYMPTOM_OPTIONS
                  }
                  selected={symptoms}
                />
              </View>
            </>
          ) : null}

          {/* NOTES */}

          <View style={styles.card}>
            <NotesField
              onChangeText={setNote}
              value={note}
            />
          </View>

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

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: saving,
            }}
            disabled={saving}
            onPress={save}
            style={({pressed}) => [
              styles.saveButton,
              (pressed || saving) &&
                styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name={
                saving
                  ? 'loading'
                  : 'check'
              }
              size={21}
            />

            <Text
              style={styles.saveText}>
              {saving
                ? 'Enregistrement…'
                : meta.saveLabel}
            </Text>
          </Pressable>
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
    </LinearGradient>
  );
}

/* ============================================================
 * STYLES
 * ========================================================== */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
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
    ...theme.shadow,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.surface, 0.97),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),
  },

  topBarTitleWrap: {
    position: 'absolute',
    left: 54,
    right: 54,
    top: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBarTitle: {
    maxWidth: '100%',
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
  },

  topBarSubtitle: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  topBarRightSpacer: {
    width: 44,
    height: 44,
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
    borderRadius: 27,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  heroGlow: {
    position: 'absolute',
    top: -72,
    right: -44,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: withAlpha(theme.colors.surface, 0.58),
  },

  heroGlowSecondary: {
    position: 'absolute',
    bottom: -75,
    left: -48,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: withAlpha(theme.colors.surface, 0.38),
  },

  heroIconRing: {
    width: 64,
    height: 64,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
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
    borderRadius: 18,
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
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.85,
  },

  heroTitle: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
  },

  heroPrompt: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /* CARD */

  card: {
    ...theme.shadow,

    marginBottom: 12,

    padding: 16,

    borderRadius: 22,

    backgroundColor:
      withAlpha(theme.colors.surface, 0.97),

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.09),
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

    borderRadius: 9,

    backgroundColor: theme.colors.primarySoft,

    color: theme.colors.primary,

    fontSize: 10,
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

    borderRadius: 15,

    backgroundColor: theme.colors.surface,
  },

  choiceRowIcon: {
    width: 31,
    height: 31,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,
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

    paddingHorizontal: 6,
    paddingVertical: 10,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),

    borderRadius: 17,

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
    minHeight: 35,

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

    padding: 10,

    borderRadius: 14,

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

    borderRadius: 13,

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

    padding: 10,

    borderRadius: 13,

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

    padding: 11,

    borderRadius: 15,

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

    borderRadius: 13,

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

    fontSize: 10.5,
  },

  /* ERROR */

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,

    marginBottom: 12,

    padding: 11,

    borderRadius: 14,

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
    ...theme.shadow,

    minHeight: 57,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 9,

    marginTop: 2,

    borderRadius: 19,

    backgroundColor: theme.colors.primary,
  },

  saveText: {
    color: onPrimaryTextColor(theme),

    fontSize: 16,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.78,
  },
  });
}
