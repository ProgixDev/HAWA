import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PostpartumInfoPanel,
  PostpartumJournalScreenLayout,
} from '../components/postpartum/PostpartumJournalScreenLayout';

import { JournalSaveToast, useJournalSaveToast } from '../components/journal/JournalSaveToast';

import { homeColors } from '../components/home/homeTheme';

import type { RootStackParamList } from '../navigation/AppNavigator';

import {
  getMiscarriageJournalEntry,
  hydrateMiscarriageJournal,
  saveMiscarriageJournalField,
} from '../state/miscarriageJournalStore';

import { isIntimacyUnlocked } from '../state/privateSectionAuthStore';

import {
  MISCARRIAGE_BLEEDING_OPTIONS,
  MISCARRIAGE_JOURNAL_ITEMS,
  MISCARRIAGE_PHYSICAL_SYMPTOMS,
  MISCARRIAGE_TRYING_AGAIN_OPTIONS,
} from '../config/miscarriageJournalConfig';

import {
  setMiscarriageTryingAgainStatus,
  type MiscarriageTryingAgainStatus,
} from '../state/miscarriagePreferences';

/* ============================================================
   THEME
============================================================ */

const PURPLE = homeColors.primary;
const PURPLE_DARK = homeColors.textPrimary;
const TEXT_SECONDARY = homeColors.textSecondary;

const LAVENDER = '#F1EAFB';
const LAVENDER_LIGHT = '#FAF7FD';

const PINK = '#DC5278';
const PINK_LIGHT = '#FDECF1';

const GREEN = '#669A73';
const GREEN_LIGHT = '#EDF6EF';

const BLUE = '#5E84A6';
const BLUE_LIGHT = '#EDF4F9';

const BORDER = 'rgba(105,73,190,0.10)';
const BORDER_ACTIVE = 'rgba(105,73,190,0.30)';

type Props = RouteProp<RootStackParamList, 'MiscarriageJournalEntry'>;

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

/* ============================================================
   SYMPTOM VISUALS
============================================================ */

const SYMPTOM_VISUALS: Record<
  string,
  {
    icon: IconName;
    color: string;
    tint: string;
  }
> = {
  Fatigue: {
    icon: 'lightning-bolt-outline',
    color: '#D35A79',
    tint: '#FBEAF0',
  },

  Crampes: {
    icon: 'heart-pulse',
    color: PURPLE,
    tint: LAVENDER,
  },

  'Douleurs pelviennes': {
    icon: 'human-female',
    color: '#C85C79',
    tint: '#FBEAF0',
  },

  'Maux de tête': {
    icon: 'head-outline',
    color: BLUE,
    tint: BLUE_LIGHT,
  },

  Nausées: {
    icon: 'emoticon-sick-outline',
    color: '#7755BC',
    tint: LAVENDER,
  },

  Vertiges: {
    icon: 'weather-windy',
    color: BLUE,
    tint: BLUE_LIGHT,
  },

  Sensibilité: {
    icon: 'heart-outline',
    color: PINK,
    tint: PINK_LIGHT,
  },
};

/* ============================================================
   DATE
============================================================ */

function formatToday(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/* ============================================================
   ANIMATION
============================================================ */

function useEntrance(delay = 0): Animated.Value {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!mounted) {
        return;
      }

      Animated.timing(animation, {
        toValue: 1,
        duration: reduceMotion ? 0 : 380,
        delay: reduceMotion ? 0 : delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      mounted = false;
    };
  }, [animation, delay]);

  return animation;
}

function AnimatedSection({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: object;
}): React.JSX.Element {
  const entrance = useEntrance(delay);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: entrance,

          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],

                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

export default function MiscarriageJournalEntryScreen(): React.JSX.Element | null {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();

  const saveToast = useJournalSaveToast();

  const route = useRoute<Props>();

  const { category } = route.params;

  const item = MISCARRIAGE_JOURNAL_ITEMS.find(entry => entry.key === category);

  // "Notes personnelles" reuses the app's single existing intimacy PIN/
  // biometric gate (same as Vie intime/Rapports/Photos privées/Contraception's
  // Notes) — never a Miscarriage-specific PIN. Computed once on mount so a
  // locked Notes screen never flashes its content before the redirect
  // effect below fires; every other category is never gated.
  const [notesUnlocked] = useState(() => category !== 'personalNotes' || isIntimacyUnlocked());

  useEffect(() => {
    if (category === 'personalNotes' && !isIntimacyUnlocked()) {
      navigation.replace('PrivateIntimacyUnlock', { target: 'miscarriageNotes' });
    }
  }, [category, navigation]);

  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const todaySubtitle = useMemo(() => `Aujourd’hui  •  ${formatToday()}`, []);

  /* ==========================================================
     STATE
  ========================================================== */

  const [bleeding, setBleeding] = useState<string | undefined>(undefined);

  const [bleedingColor, setBleedingColor] = useState('Rouge clair');

  const [bleedingStartDate, setBleedingStartDate] = useState(todayKey);

  const [bleedingNote, setBleedingNote] = useState('');

  const [symptoms, setSymptoms] = useState<string[]>([]);

  const [symptomsNote, setSymptomsNote] = useState('');

  const [personalNotes, setPersonalNotes] = useState('');

  const [tryingAgain, setTryingAgain] = useState<
    MiscarriageTryingAgainStatus | undefined
  >(undefined);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  /* ==========================================================
     HYDRATE
  ========================================================== */

  useEffect(() => {
    let active = true;

    hydrateMiscarriageJournal().then(() => {
      if (!active) {
        return;
      }

      const entry = getMiscarriageJournalEntry(todayKey);

      setBleeding(entry?.bleeding);

      setBleedingColor(entry?.bleedingColor ?? 'Rouge clair');

      setBleedingStartDate(entry?.bleedingStartDate ?? todayKey);

      setBleedingNote(entry?.bleedingNote ?? '');

      setSymptoms(entry?.physicalSymptoms ?? []);

      setSymptomsNote(entry?.physicalSymptomsNote ?? '');

      // Never load the real note text into state while the private section
      // is locked — notesUnlocked was already computed once at mount, so
      // this stays consistent for the lifetime of a locked screen (which
      // redirects away before the user could act on it anyway).
      if (notesUnlocked) {
        setPersonalNotes(entry?.personalNotes ?? '');
      }

      setTryingAgain(entry?.tryingAgain);
    });

    return () => {
      active = false;
    };
  }, [todayKey, notesUnlocked]);

  /* ==========================================================
     SYMPTOM TOGGLE
  ========================================================== */

  const toggleSymptom = (option: string) => {
    setSymptoms(current =>
      current.includes(option)
        ? current.filter(value => value !== option)
        : [...current, option],
    );
  };

  /* ==========================================================
     SAVE
  ========================================================== */

  const save = async () => {
    setError('');

    /* ================= SAIGNEMENTS ================= */

    if (category === 'bleeding') {
      if (!bleeding) {
        setError('Choisis une intensité avant d’enregistrer.');

        return;
      }

      setSaving(true);

      try {
        await saveMiscarriageJournalField(todayKey, 'bleeding', bleeding);

        await saveMiscarriageJournalField(
          todayKey,
          'bleedingColor',
          bleedingColor,
        );

        await saveMiscarriageJournalField(
          todayKey,
          'bleedingStartDate',
          bleedingStartDate,
        );

        await saveMiscarriageJournalField(
          todayKey,
          'bleedingNote',
          bleedingNote.trim(),
        );

        saveToast.show('Saignements enregistrés', 'Ton suivi a bien été mis à jour.', navigation.goBack);
      } finally {
        setSaving(false);
      }

      return;
    }

    /* ================= SYMPTÔMES ================= */

    if (category === 'physicalSymptoms') {
      if (symptoms.length === 0) {
        setError('Choisis au moins un symptôme avant d’enregistrer.');

        return;
      }

      setSaving(true);

      try {
        await saveMiscarriageJournalField(
          todayKey,
          'physicalSymptoms',
          symptoms,
        );

        if (symptomsNote.trim()) {
          await saveMiscarriageJournalField(
            todayKey,
            'physicalSymptomsNote',
            symptomsNote.trim(),
          );
        }

        saveToast.show('Symptômes enregistrés', 'Ton suivi a bien été mis à jour.', navigation.goBack);
      } finally {
        setSaving(false);
      }

      return;
    }

    /* ================= NOTES ================= */

    if (category === 'personalNotes') {
      if (!personalNotes.trim()) {
        setError('Ajoute une note avant d’enregistrer.');

        return;
      }

      setSaving(true);

      try {
        await saveMiscarriageJournalField(
          todayKey,
          'personalNotes',
          personalNotes.trim(),
        );

        saveToast.show('Note enregistrée', 'Ta note personnelle a bien été enregistrée.', navigation.goBack);
      } finally {
        setSaving(false);
      }

      return;
    }

    /* ================= REPRISE DES ESSAIS ================= */

    if (!tryingAgain) {
      setError('Choisis une réponse avant d’enregistrer.');

      return;
    }

    setSaving(true);

    try {
      await saveMiscarriageJournalField(todayKey, 'tryingAgain', tryingAgain);

      await setMiscarriageTryingAgainStatus(tryingAgain);

      saveToast.show('Information enregistrée', 'Ton suivi a bien été mis à jour.', navigation.goBack);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     SAVE CONFIRMATION TOAST

     Rendered as a sibling of PostpartumJournalScreenLayout (never as one
     of its `children`, which live inside its internal ScrollView — an
     absolutely-positioned toast anchored there would sit at the bottom of
     the scrollable content instead of the visible screen). Shared across
     all 4 categories below since each is its own screen instance (one
     mounted MiscarriageJournalEntryScreen = one category = one save
     action = one toast).
  ========================================================== */

  const toastElement = (
    <JournalSaveToast
      animation={saveToast.animation}
      bottom={Math.max(insets.bottom, 18) + 12}
      message={saveToast.message}
      onDismiss={saveToast.hide}
      title={saveToast.title}
      visible={saveToast.visible}
    />
  );

  /* ==========================================================
     SYMPTÔMES PHYSIQUES
  ========================================================== */

  if (category === 'physicalSymptoms') {
    return (
      <View style={styles.screenWrapper}>
        <PostpartumJournalScreenLayout
          compact
          error={error}
          icon={item?.icon ?? 'clipboard-pulse-outline'}
          onSave={save}
          saving={saving}
          subtitle={todaySubtitle}
          tint="#EEE7FC"
          title="Symptômes physiques"
        >
          <SymptomsContent
            note={symptomsNote}
            selected={symptoms}
            setNote={setSymptomsNote}
            toggle={toggleSymptom}
          />
        </PostpartumJournalScreenLayout>

        {toastElement}
      </View>
    );
  }

  /* ==========================================================
     NOTES PERSONNELLES
  ========================================================== */

  if (category === 'personalNotes') {
    if (!notesUnlocked) {
      return null;
    }
    return (
      <View style={styles.screenWrapper}>
        <PostpartumJournalScreenLayout
          compact
          error={error}
          icon="notebook-edit-outline"
          onSave={save}
          saving={saving}
          subtitle={todaySubtitle}
          tint="#EEE7FC"
          title="Notes personnelles"
        >
          <NotesContent note={personalNotes} setNote={setPersonalNotes} />
        </PostpartumJournalScreenLayout>

        {toastElement}
      </View>
    );
  }

  /* ==========================================================
     REPRISE DES ESSAIS
  ========================================================== */

  if (category === 'tryingAgain') {
    return (
      <View style={styles.screenWrapper}>
        <PostpartumJournalScreenLayout
          compact
          error={error}
          icon="heart-outline"
          onSave={save}
          saving={saving}
          subtitle={todaySubtitle}
          tint="#FBEAF0"
          title="Reprise des essais"
        >
          <TryingAgainContent onSelect={setTryingAgain} selected={tryingAgain} />
        </PostpartumJournalScreenLayout>

        {toastElement}
      </View>
    );
  }

  /* ==========================================================
     SAIGNEMENTS

     IMPORTANT:
     title = Saignements
     subtitle = date d'aujourd'hui
  ========================================================== */

  return (
    <View style={styles.screenWrapper}>
      <PostpartumJournalScreenLayout
        compact
        error={error}
        icon="water-outline"
        onSave={save}
        saving={saving}
        subtitle={todaySubtitle}
        tint="#FBEAF0"
        title="Saignements"
      >
        <BleedingContent
          color={bleedingColor}
          note={bleedingNote}
          onSelect={setBleeding}
          selected={bleeding}
          setColor={setBleedingColor}
          setNote={setBleedingNote}
          setStartDate={setBleedingStartDate}
          startDate={bleedingStartDate}
        />
      </PostpartumJournalScreenLayout>

      {toastElement}
    </View>
  );
}

/* ============================================================
   SMALL SECTION HEADER
============================================================ */

function SectionHeader({
  title,
  subtitle,
  icon,
  color = PURPLE,
  tint = LAVENDER,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  color?: string;
  tint?: string;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor: tint,
          },
        ]}
      >
        <MaterialDesignIcons color={color} name={icon} size={18} />
      </View>

      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================
   SAIGNEMENTS
============================================================ */

function BleedingContent({
  selected,
  onSelect,
  color,
  setColor,
  startDate,
  setStartDate,
  note,
  setNote,
}: {
  selected: string | undefined;

  onSelect: (value: string) => void;

  color: string;

  setColor: (value: string) => void;

  startDate: string;

  setStartDate: (value: string) => void;

  note: string;

  setNote: (value: string) => void;
}): React.JSX.Element {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const colors = [
    {
      label: 'Rouge clair',
      hex: '#E84D76',
    },
    {
      label: 'Rouge foncé',
      hex: '#991D36',
    },
    {
      label: 'Brun',
      hex: '#9B5C38',
    },
    {
      label: 'Rose',
      hex: '#F4B7C4',
    },
    {
      label: 'Autre',
      hex: '#F7F3FB',
    },
  ];

  const intensitySizes: Record<string, number> = {
    Absent: 18,
    Léger: 25,
    Modéré: 21,
    Important: 17,
  };

  const selectedDate = new Date(`${startDate}T12:00:00`);

  const formattedDate = selectedDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const onDateChange = (_event: DateTimePickerChangeEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (!date) {
      return;
    }

    setStartDate(date.toLocaleDateString('en-CA'));
  };

  return (
    <>
      {/* ================= FLUX ================= */}

      <AnimatedSection style={styles.card}>
        <SectionHeader
          color={PINK}
          icon="water-outline"
          subtitle="Sélectionne l’intensité d’aujourd’hui"
          tint={PINK_LIGHT}
          title="Flux"
        />

        <View style={styles.qualityRow}>
          {MISCARRIAGE_BLEEDING_OPTIONS.map(option => {
            const active = selected === option;

            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: active,
                }}
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [
                  styles.qualityBox,

                  active && styles.qualityBoxActive,

                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[styles.dropCircle, active && styles.dropCircleActive]}
                >
                  <MaterialDesignIcons
                    color={
                      option === 'Absent'
                        ? '#A489D5'
                        : active
                        ? '#E52E61'
                        : '#D97191'
                    }
                    name={option === 'Absent' ? 'water-outline' : 'water'}
                    size={intensitySizes[option]}
                  />
                </View>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.qualityLabel,

                    active && styles.qualityLabelActive,
                  ]}
                >
                  {option}
                </Text>

                {active ? (
                  <View style={styles.smallCheck}>
                    <MaterialDesignIcons
                      color="#FFFFFF"
                      name="check"
                      size={9}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </AnimatedSection>

      {/* ================= COULEUR ================= */}

      <AnimatedSection delay={60} style={styles.card}>
        <SectionHeader
          color={PINK}
          icon="palette-outline"
          subtitle="Indique la couleur observée"
          tint={PINK_LIGHT}
          title="Couleur"
        />

        <View style={styles.colorRow}>
          {colors.map(option => {
            const active = color === option.label;

            return (
              <Pressable
                accessibilityLabel={`Couleur ${option.label}`}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: active,
                }}
                key={option.label}
                onPress={() => setColor(option.label)}
                style={({ pressed }) => [
                  styles.colorChoice,

                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.colorCircle,

                    active && styles.colorCircleActive,
                  ]}
                >
                  <View
                    style={[
                      styles.colorSwatch,

                      {
                        backgroundColor: option.hex,
                      },

                      option.label === 'Autre' && styles.otherSwatch,
                    ]}
                  />

                  {active ? (
                    <View style={styles.colorSelectedBadge}>
                      <MaterialDesignIcons
                        color="#FFFFFF"
                        name="check"
                        size={8}
                      />
                    </View>
                  ) : null}
                </View>

                <Text
                  numberOfLines={2}
                  style={[styles.colorLabel, active && styles.colorLabelActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AnimatedSection>

      {/* ================= DURÉE ================= */}

      <AnimatedSection delay={100} style={styles.card}>
        <SectionHeader
          icon="calendar-clock-outline"
          subtitle="Depuis quand les observes-tu ?"
          title="Durée"
        />

        <Pressable
          accessibilityLabel="Choisir la date de début"
          accessibilityRole="button"
          onPress={() => setShowDatePicker(true)}
          style={({ pressed }) => [styles.dateCard, pressed && styles.pressed]}
        >
          <View style={styles.dateLeft}>
            <View style={styles.dateMiniIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="calendar-month-outline"
                size={20}
              />
            </View>

            <View style={styles.dateCopy}>
              <Text style={styles.dateEyebrow}>Depuis le</Text>

              <Text style={styles.dateValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.dateArrow}>
            <MaterialDesignIcons
              color={PURPLE}
              name="chevron-right"
              size={20}
            />
          </View>
        </Pressable>

        {showDatePicker ? (
          <DateTimePicker
            maximumDate={new Date()}
            mode="date"
            onValueChange={onDateChange}
            value={selectedDate}
          />
        ) : null}
      </AnimatedSection>

      {/* ================= NOTES ================= */}

      <AnimatedSection delay={140} style={styles.card}>
        <SectionHeader
          icon="notebook-edit-outline"
          subtitle="Optionnel et privé"
          title="Notes"
        />

        <PremiumTextArea
          maxLength={300}
          onChangeText={setNote}
          placeholder="Comment te sens-tu aujourd’hui ?"
          value={note}
        />
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   PREMIUM TEXT AREA
============================================================ */

function PremiumTextArea({
  value,
  onChangeText,
  placeholder,
  maxLength,
  large = false,
}: {
  value: string;

  onChangeText: (value: string) => void;

  placeholder: string;

  maxLength: number;

  large?: boolean;
}): React.JSX.Element {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.noteBox,

        focused && styles.noteBoxFocused,

        large && styles.noteBoxLarge,
      ]}
    >
      <TextInput
        maxLength={maxLength}
        multiline
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor="#A094AE"
        style={[styles.noteInput, large && styles.noteInputLarge]}
        textAlignVertical="top"
        value={value}
      />

      <View style={styles.noteFooter}>
        <View style={styles.privatePill}>
          <MaterialDesignIcons color={PURPLE} name="lock-outline" size={11} />

          <Text style={styles.privatePillText}>Privé</Text>
        </View>

        <Text style={styles.noteCounter}>
          {value.length}/{maxLength}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   SYMPTÔME CARD
============================================================ */

function SymptomChoice({
  option,
  active,
  onPress,
}: {
  option: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;

  const config = SYMPTOM_VISUALS[option] ?? {
    icon: 'heart-pulse' as IconName,

    color: PURPLE,

    tint: LAVENDER,
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 70,
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.symptomItemWrapper,

        {
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        accessibilityLabel={option}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: active,
        }}
        onPress={handlePress}
        style={[styles.symptomCard, active && styles.symptomCardActive]}
      >
        <View
          style={[
            styles.symptomIcon,

            {
              backgroundColor: active ? PURPLE : config.tint,
            },
          ]}
        >
          <MaterialDesignIcons
            color={active ? '#FFFFFF' : config.color}
            name={config.icon}
            size={21}
          />
        </View>

        <Text
          numberOfLines={2}
          style={[styles.symptomName, active && styles.symptomNameActive]}
        >
          {option}
        </Text>

        <View
          style={[styles.symptomRadio, active && styles.symptomRadioActive]}
        >
          {active ? (
            <MaterialDesignIcons color="#FFFFFF" name="check" size={10} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   SYMPTÔMES PHYSIQUES
============================================================ */

function SymptomsContent({
  selected,
  toggle,
  note,
  setNote,
}: {
  selected: string[];

  toggle: (value: string) => void;

  note: string;

  setNote: (value: string) => void;
}): React.JSX.Element {
  return (
    <>
      {/* HERO */}

      <AnimatedSection style={styles.symptomHero}>
        <View style={styles.heroGlow} />

        <View style={styles.heroLargeIcon}>
          <MaterialDesignIcons color={PURPLE} name="heart-pulse" size={27} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Comment te sens-tu ?</Text>

          <Text style={styles.heroSubtitle}>
            Sélectionne les symptômes que tu ressens aujourd’hui.
          </Text>
        </View>
      </AnimatedSection>

      {/* SYMPTOMES */}

      <AnimatedSection delay={60} style={styles.card}>
        <SectionHeader
          icon="clipboard-pulse-outline"
          subtitle="Tu peux en sélectionner plusieurs"
          title="Symptômes ressentis"
        />

        <View style={styles.symptomsGrid}>
          {MISCARRIAGE_PHYSICAL_SYMPTOMS.map(option => (
            <SymptomChoice
              active={selected.includes(option)}
              key={option}
              onPress={() => toggle(option)}
              option={option}
            />
          ))}
        </View>

        {selected.length > 0 ? (
          <View style={styles.selectedSummary}>
            <View style={styles.selectedSummaryIcon}>
              <MaterialDesignIcons color={GREEN} name="check" size={12} />
            </View>

            <Text style={styles.selectedSummaryText}>
              {selected.length} symptôme
              {selected.length > 1 ? 's' : ''} sélectionné
              {selected.length > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
      </AnimatedSection>

      {/* NOTE */}

      <AnimatedSection delay={110} style={styles.card}>
        <SectionHeader
          icon="notebook-outline"
          subtitle="Optionnel et privé"
          title="Ajouter un détail"
        />

        <PremiumTextArea
          maxLength={300}
          onChangeText={setNote}
          placeholder="Intensité, durée, moment de la journée ou autre détail…"
          value={note}
        />
      </AnimatedSection>

      <PostpartumInfoPanel
        icon="information-outline"
        text="Ce suivi t’aide à observer ton évolution au fil des jours."
        title="Ton suivi"
      />
    </>
  );
}

/* ============================================================
   NOTES PERSONNELLES
============================================================ */

function NotesContent({
  note,
  setNote,
}: {
  note: string;

  setNote: (value: string) => void;
}): React.JSX.Element {
  return (
    <>
      {/* HERO */}

      <AnimatedSection style={styles.notesHero}>
        <View style={styles.notesGlow} />

        <View style={styles.notesHeroIcon}>
          <MaterialDesignIcons color={PURPLE} name="book-heart" size={28} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Ton espace personnel</Text>

          <Text style={styles.heroSubtitle}>
            Un endroit calme et privé pour déposer ce que tu ressens.
          </Text>
        </View>
      </AnimatedSection>

      {/* EDITOR */}

      <AnimatedSection delay={70} style={styles.card}>
        <SectionHeader
          icon="notebook-edit-outline"
          subtitle="Écris librement, à ton rythme"
          title="Ce que je souhaite noter"
        />

        <PremiumTextArea
          large
          maxLength={1000}
          onChangeText={setNote}
          placeholder="Écris librement ce que tu ressens aujourd’hui, une pensée, une émotion ou quelque chose que tu souhaites simplement garder…"
          value={note}
        />

        <View style={styles.encouragementCard}>
          <View style={styles.encouragementIcon}>
            <MaterialDesignIcons color={PINK} name="heart-outline" size={16} />
          </View>

          <Text style={styles.encouragementText}>
            Quelques mots suffisent. Il n’y a aucune manière parfaite d’écrire
            ce que tu ressens.
          </Text>
        </View>
      </AnimatedSection>

      <PostpartumInfoPanel
        icon="flower-outline"
        text="Écoute-toi avec bienveillance et avance à ton propre rythme."
        title="Chaque étape compte"
      />
    </>
  );
}

/* ============================================================
   REPRISE DES ESSAIS OPTION
============================================================ */

function TryingAgainChoice({
  option,
  active,
  onPress,
  index,
}: {
  option: (typeof MISCARRIAGE_TRYING_AGAIN_OPTIONS)[number];

  active: boolean;

  onPress: () => void;

  index: number;
}): React.JSX.Element {
  const entrance = useEntrance(index * 55);

  const scale = useRef(new Animated.Value(1)).current;

  const palette =
    option.id === 'not_now'
      ? {
          color: PURPLE,

          tint: LAVENDER,
        }
      : option.id === 'soon'
      ? {
          color: GREEN,

          tint: GREEN_LIGHT,
        }
      : {
          color: PINK,

          tint: PINK_LIGHT,
        };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 70,
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: entrance,

        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],

              outputRange: [10, 0],
            }),
          },

          { scale },
        ],
      }}
    >
      <Pressable
        accessibilityLabel={option.label}
        accessibilityRole="radio"
        accessibilityState={{
          checked: active,
        }}
        onPress={handlePress}
        style={[styles.tryingCard, active && styles.tryingCardActive]}
      >
        <View
          style={[
            styles.tryingIcon,

            {
              backgroundColor: active ? PURPLE : palette.tint,
            },
          ]}
        >
          <MaterialDesignIcons
            color={active ? '#FFFFFF' : palette.color}
            name={option.icon}
            size={23}
          />
        </View>

        <View style={styles.tryingCopy}>
          <Text
            style={[styles.tryingTitle, active && styles.tryingTitleActive]}
          >
            {option.label}
          </Text>

          <Text style={styles.tryingSubtitle}>{option.subtitle}</Text>
        </View>

        <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
          {active ? <View style={styles.radioInner} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   REPRISE DES ESSAIS
============================================================ */

function TryingAgainContent({
  selected,
  onSelect,
}: {
  selected: MiscarriageTryingAgainStatus | undefined;

  onSelect: (value: MiscarriageTryingAgainStatus) => void;
}): React.JSX.Element {
  return (
    <>
      {/* HERO */}

      <AnimatedSection style={styles.tryingHero}>
        <View style={styles.tryingHeroGlow} />

        <View style={styles.tryingHeroIcon}>
          <MaterialDesignIcons color={PINK} name="heart-outline" size={29} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Où en es-tu aujourd’hui ?</Text>

          <Text style={styles.heroSubtitle}>
            Il n’y a pas de bonne ou de mauvaise réponse. Choisis simplement ce
            qui te correspond.
          </Text>
        </View>
      </AnimatedSection>

      {/* CHOICES */}

      <AnimatedSection delay={50} style={styles.card}>
        <SectionHeader
          color={PINK}
          icon="heart-circle-outline"
          subtitle="Ce choix personnalise uniquement ton accompagnement"
          tint={PINK_LIGHT}
          title="Reprise des essais"
        />

        <View style={styles.tryingList}>
          {MISCARRIAGE_TRYING_AGAIN_OPTIONS.map((option, index) => (
            <TryingAgainChoice
              active={selected === option.id}
              index={index}
              key={option.id}
              onPress={() => onSelect(option.id)}
              option={option}
            />
          ))}
        </View>
      </AnimatedSection>

      <PostpartumInfoPanel
        icon="flower-outline"
        text="Ton choix ne change jamais automatiquement ton objectif. Tu restes libre d’avancer à ton rythme."
        title="Sans pression"
      />
    </>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  // Wraps PostpartumJournalScreenLayout (which fills the screen on its own)
  // so JournalSaveToast can be rendered as its sibling — never inside its
  // `children`, which live inside its internal ScrollView — and still
  // resolve its `position: 'absolute'` against the full screen.
  screenWrapper: {
    flex: 1,
  },

  pressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* ========================================================
       CARDS
    ======================================================== */

  card: {
    marginBottom: 14,

    padding: 16,

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 24,

    backgroundColor: '#FFFFFF',

    shadowColor: '#4E319A',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.055,

    shadowRadius: 12,

    elevation: 2,
  },

  /* ========================================================
       SECTION HEADER
    ======================================================== */

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 15,
  },

  sectionIcon: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 14,
  },

  sectionHeaderCopy: {
    flex: 1,

    minWidth: 0,
  },

  sectionTitle: {
    color: PURPLE_DARK,

    fontFamily: 'serif',

    fontSize: 16,

    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 2,

    color: TEXT_SECONDARY,

    fontSize: 9.6,

    lineHeight: 14,
  },

  /* ========================================================
       SAIGNEMENTS — FLUX
    ======================================================== */

  qualityRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    gap: 7,
  },

  qualityBox: {
    position: 'relative',

    flex: 1,

    minWidth: 0,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 1,

    paddingTop: 4,

    paddingBottom: 2,
  },

  qualityBoxActive: {},

  dropCircle: {
    width: 57,
    height: 57,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: 'rgba(105,73,190,0.08)',

    borderRadius: 29,

    backgroundColor: '#FCFAFE',

    shadowColor: '#5533A8',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.05,

    shadowRadius: 8,

    elevation: 1,
  },

  dropCircleActive: {
    borderWidth: 2,

    borderColor: '#F09AB2',

    backgroundColor: '#FFF0F5',

    shadowColor: '#E84D76',

    shadowOpacity: 0.14,

    elevation: 3,
  },

  qualityLabel: {
    marginTop: 8,

    color: TEXT_SECONDARY,

    fontSize: 9.5,

    fontWeight: '600',

    textAlign: 'center',
  },

  qualityLabelActive: {
    color: PURPLE_DARK,

    fontWeight: '800',
  },

  smallCheck: {
    position: 'absolute',

    top: 0,
    right: 1,

    width: 18,
    height: 18,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#FFFFFF',

    borderRadius: 9,

    backgroundColor: PINK,
  },

  /* ========================================================
       SAIGNEMENTS — COULEUR
    ======================================================== */

  colorRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    gap: 4,
  },

  colorChoice: {
    flex: 1,

    minWidth: 0,

    alignItems: 'center',
  },

  colorCircle: {
    position: 'relative',

    width: 48,
    height: 48,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: 'rgba(105,73,190,0.07)',

    borderRadius: 24,

    backgroundColor: '#FFFFFF',
  },

  colorCircleActive: {
    borderWidth: 2,

    borderColor: '#F19AB1',

    backgroundColor: '#FFF0F4',
  },

  colorSwatch: {
    width: 27,
    height: 27,

    borderRadius: 14,
  },

  otherSwatch: {
    borderWidth: 2,

    borderColor: '#B99AE7',
  },

  colorSelectedBadge: {
    position: 'absolute',

    right: -1,
    bottom: -1,

    width: 17,
    height: 17,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#FFFFFF',

    borderRadius: 9,

    backgroundColor: PURPLE,
  },

  colorLabel: {
    minHeight: 28,

    marginTop: 6,

    color: TEXT_SECONDARY,

    fontSize: 8.5,

    lineHeight: 11,

    textAlign: 'center',
  },

  colorLabelActive: {
    color: PURPLE,

    fontWeight: '800',
  },

  /* ========================================================
       DATE
    ======================================================== */

  dateCard: {
    minHeight: 72,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 12,

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 18,

    backgroundColor: LAVENDER_LIGHT,
  },

  dateLeft: {
    flex: 1,

    minWidth: 0,

    flexDirection: 'row',

    alignItems: 'center',
  },

  dateMiniIcon: {
    width: 42,
    height: 42,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: LAVENDER,
  },

  dateCopy: {
    flex: 1,

    minWidth: 0,

    marginLeft: 10,
  },

  dateEyebrow: {
    color: TEXT_SECONDARY,

    fontSize: 9.5,

    fontWeight: '600',
  },

  dateValue: {
    marginTop: 3,

    color: PURPLE_DARK,

    fontSize: 13,

    fontWeight: '800',
  },

  dateArrow: {
    width: 33,
    height: 33,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: '#FFFFFF',
  },

  /* ========================================================
       TEXT AREA
    ======================================================== */

  noteBox: {
    overflow: 'hidden',

    minHeight: 126,

    borderWidth: 1,

    borderColor: 'rgba(105,73,190,0.14)',

    borderRadius: 18,

    backgroundColor: '#FCFAFE',
  },

  noteBoxFocused: {
    borderColor: PURPLE,

    backgroundColor: '#FFFFFF',

    shadowColor: PURPLE,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,

    shadowRadius: 7,

    elevation: 2,
  },

  noteBoxLarge: {
    minHeight: 220,
  },

  noteInput: {
    minHeight: 91,

    paddingHorizontal: 13,

    paddingTop: 13,

    color: PURPLE_DARK,

    fontSize: 12.5,

    lineHeight: 18,
  },

  noteInputLarge: {
    minHeight: 182,
  },

  noteFooter: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 11,

    paddingBottom: 9,
  },

  privatePill: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    paddingHorizontal: 7,

    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor: LAVENDER,
  },

  privatePillText: {
    color: PURPLE,

    fontSize: 8,

    fontWeight: '700',
  },

  noteCounter: {
    color: TEXT_SECONDARY,

    fontSize: 8.5,
  },

  /* ========================================================
       GENERIC HERO
    ======================================================== */

  heroGlow: {
    position: 'absolute',

    top: -35,
    right: -25,

    width: 110,
    height: 110,

    borderRadius: 55,

    backgroundColor: 'rgba(255,255,255,0.40)',
  },

  heroLargeIcon: {
    width: 54,
    height: 54,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 19,

    backgroundColor: '#FFFFFF',
  },

  heroCopy: {
    flex: 1,

    minWidth: 0,

    marginLeft: 12,
  },

  heroTitle: {
    color: PURPLE_DARK,

    fontFamily: 'serif',

    fontSize: 16.5,

    fontWeight: '800',

    lineHeight: 21,
  },

  heroSubtitle: {
    marginTop: 4,

    color: TEXT_SECONDARY,

    fontSize: 9.7,

    lineHeight: 14,
  },

  /* ========================================================
       SYMPTOMS HERO
    ======================================================== */

  symptomHero: {
    position: 'relative',

    overflow: 'hidden',

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 14,

    padding: 15,

    borderRadius: 23,

    backgroundColor: '#F3EDFC',
  },

  /* ========================================================
       SYMPTOMS GRID
    ======================================================== */

  symptomsGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    rowGap: 9,
  },

  symptomItemWrapper: {
    width: '48.5%',
  },

  symptomCard: {
    position: 'relative',

    minHeight: 108,

    alignItems: 'flex-start',

    padding: 12,

    borderWidth: 1,

    borderColor: 'rgba(105,73,190,0.08)',

    borderRadius: 18,

    backgroundColor: LAVENDER_LIGHT,
  },

  symptomCardActive: {
    borderColor: BORDER_ACTIVE,

    backgroundColor: '#F5F0FC',

    shadowColor: PURPLE,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.07,

    shadowRadius: 7,

    elevation: 2,
  },

  symptomIcon: {
    width: 40,
    height: 40,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 14,
  },

  symptomName: {
    minHeight: 30,

    marginTop: 9,

    paddingRight: 18,

    color: PURPLE_DARK,

    fontSize: 10.5,

    lineHeight: 14,

    fontWeight: '700',
  },

  symptomNameActive: {
    color: PURPLE,

    fontWeight: '800',
  },

  symptomRadio: {
    position: 'absolute',

    top: 11,
    right: 10,

    width: 20,
    height: 20,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1.5,

    borderColor: '#CEC2DB',

    borderRadius: 10,
  },

  symptomRadioActive: {
    borderColor: PURPLE,

    backgroundColor: PURPLE,
  },

  selectedSummary: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 12,

    padding: 10,

    borderRadius: 13,

    backgroundColor: GREEN_LIGHT,
  },

  selectedSummaryIcon: {
    width: 25,
    height: 25,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,

    borderRadius: 9,

    backgroundColor: '#FFFFFF',
  },

  selectedSummaryText: {
    color: '#587B60',

    fontSize: 9.4,

    fontWeight: '700',
  },

  /* ========================================================
       NOTES HERO
    ======================================================== */

  notesHero: {
    position: 'relative',

    overflow: 'hidden',

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 14,

    padding: 16,

    borderWidth: 1,

    borderColor: 'rgba(105,73,190,0.07)',

    borderRadius: 24,

    backgroundColor: '#F3EDFC',
  },

  notesGlow: {
    position: 'absolute',

    top: -45,
    right: -25,

    width: 120,
    height: 120,

    borderRadius: 60,

    backgroundColor: 'rgba(255,255,255,0.46)',
  },

  notesHeroIcon: {
    width: 55,
    height: 55,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    shadowColor: PURPLE,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.07,

    shadowRadius: 7,

    elevation: 2,
  },

  encouragementCard: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    marginTop: 12,

    padding: 10,

    borderRadius: 13,

    backgroundColor: PINK_LIGHT,
  },

  encouragementIcon: {
    width: 27,
    height: 27,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,

    borderRadius: 9,

    backgroundColor: '#FFFFFF',
  },

  encouragementText: {
    flex: 1,

    color: '#826571',

    fontSize: 9.2,

    lineHeight: 13.5,
  },

  /* ========================================================
       TRYING HERO
    ======================================================== */

  tryingHero: {
    position: 'relative',

    overflow: 'hidden',

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 14,

    padding: 16,

    borderRadius: 24,

    backgroundColor: '#FFF3F7',
  },

  tryingHeroGlow: {
    position: 'absolute',

    top: -40,
    right: -25,

    width: 115,
    height: 115,

    borderRadius: 58,

    backgroundColor: 'rgba(255,255,255,0.42)',
  },

  tryingHeroIcon: {
    width: 55,
    height: 55,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 20,

    backgroundColor: '#FFFFFF',
  },

  /* ========================================================
       TRYING OPTIONS
    ======================================================== */

  tryingList: {
    gap: 10,
  },

  tryingCard: {
    minHeight: 84,

    flexDirection: 'row',

    alignItems: 'center',

    padding: 12,

    borderWidth: 1,

    borderColor: BORDER,

    borderRadius: 19,

    backgroundColor: '#FCFAFE',
  },

  tryingCardActive: {
    borderColor: BORDER_ACTIVE,

    backgroundColor: '#F7F3FC',

    shadowColor: PURPLE,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.07,

    shadowRadius: 7,

    elevation: 2,
  },

  tryingIcon: {
    width: 46,
    height: 46,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 16,
  },

  tryingCopy: {
    flex: 1,

    minWidth: 0,

    marginHorizontal: 10,
  },

  tryingTitle: {
    color: PURPLE_DARK,

    fontSize: 12,

    fontWeight: '700',
  },

  tryingTitleActive: {
    color: PURPLE,

    fontWeight: '800',
  },

  tryingSubtitle: {
    marginTop: 3,

    color: TEXT_SECONDARY,

    fontSize: 8.8,

    lineHeight: 13,
  },

  radioOuter: {
    width: 23,
    height: 23,

    flexShrink: 0,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1.7,

    borderColor: '#CABDD9',

    borderRadius: 12,
  },

  radioOuterActive: {
    borderColor: PURPLE,
  },

  radioInner: {
    width: 12,
    height: 12,

    borderRadius: 6,

    backgroundColor: PURPLE,
  },
});
