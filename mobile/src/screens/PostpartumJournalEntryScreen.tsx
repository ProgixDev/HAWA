import {useToday} from '../hooks/useToday';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';

import {
  PostpartumInfoPanel,
  PostpartumJournalScreenLayout,
} from '../components/postpartum/PostpartumJournalScreenLayout';
import {
  PostpartumCycleStyleJournalLayout,
  PostpartumJournalCard,
} from '../components/postpartum/PostpartumCycleStyleJournalLayout';
import {
  PostpartumWellnessRatingLayout,
  type WellnessRatingOption,
} from '../components/postpartum/PostpartumWellnessRatingLayout';
import { useAwaTheme } from '../theme/AwaThemeProvider';
import { withAlpha, type ResolvedAwaTheme } from '../theme/awaThemeTokens';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  clearPostpartumJournalCategory,
  clearPostpartumMoodNote,
  getPostpartumJournalEntry,
  hydratePostpartumJournal,
  savePostpartumJournalField,
} from '../state/postpartumJournalStore';
import {
  POSTPARTUM_FATIGUE_OPTIONS,
  POSTPARTUM_JOURNAL_ITEMS,
  POSTPARTUM_MOOD_OPTIONS,
  POSTPARTUM_PAIN_OPTIONS,
  POSTPARTUM_RECOVERY_OPTIONS,
  POSTPARTUM_SLEEP_OPTIONS,
} from '../config/postpartumJournalConfig';
import {journalOptionLabel} from '../utils/journalOptionLabels';
import {
  getPostpartumPreferences,
  subscribePostpartumPreferences,
} from '../state/postpartumPreferences';
import { computePostpartumStatus } from '../utils/postpartumTrackingUtils';
import { showPostpartumSuccessToast } from '../state/postpartumSuccessToastStore';
import { dateFormatLocale } from '../utils/cycleMath';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';

// Single generic entry screen for all 5 Postpartum daily-tracking categories
// — reached from BOTH the shared "Journal quotidien" sheet AND the
// Dashboard's "Suivi du jour" tiles with `{category}` as a route param, so
// there is only ever one canonical Postpartum entry path per category
// (never two diverging screens/routes). Writes exclusively to
// postpartumJournalStore — never pregnancyJournalStore or the Cycle-shared
// dailyJournalStore.
//
// Categories are Postpartum-specific (Fatigue / Sommeil / Humeur / Douleurs
// / Récupération physique) — deliberately DIFFERENT from Pregnancy's own
// Journal quotidien (Symptômes / Poids / Humeur / Sommeil / Informations
// médicales). Sommeil/Humeur render inside PostpartumCycleStyleJournalLayout
// (visually matching Cycle's own Sleep/Mood screens, unchanged by this
// correction); Fatigue/Douleurs/Récupération physique render inside the
// simpler PostpartumJournalScreenLayout chrome (the same one previously used
// for Poids/Informations médicales, reused rather than building a third
// chrome for these new categories).

type Props = RouteProp<RootStackParamList, 'PostpartumJournalEntry'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// DATA-BEARING keys — NOT display-only text. These keys are POSTPARTUM_MOOD_OPTIONS'
// exact raw French label strings (see postpartumJournalConfig.ts), used here purely
// to look up an emoji; they must stay French and untranslated so the lookup keeps
// matching the DATA-BEARING option values rendered below.
const MOOD_EMOJI: Record<string, string> = {
  'Très difficile': '😣',
  Difficile: '😟',
  Neutre: '😐',
  Bien: '🙂',
  'Très bien': '😊',
};

// Same 5 emoticon icons Cycle's own JournalSleepScreen uses for its quality
// selector (already proven-valid MaterialDesignIcons names in this
// codebase). Ascending bad→good, reused as-is for Sommeil and for
// Récupération physique (same semantic direction: Difficile→Très bonne).
const ASCENDING_SEVERITY_ICONS: IconName[] = [
  'emoticon-sad-outline',
  'emoticon-frown-outline',
  'emoticon-neutral-outline',
  'emoticon-happy-outline',
  'emoticon-excited-outline',
];

// Descending good→bad, reused for Fatigue and Douleurs (Aucune→Très forte).
const DESCENDING_SEVERITY_ICONS: IconName[] = [
  'emoticon-excited-outline',
  'emoticon-happy-outline',
  'emoticon-neutral-outline',
  'emoticon-frown-outline',
  'emoticon-sad-outline',
];

// The 3 option lists below are built inside the component (see
// useFatigueRatings/usePainRatings/useRecoveryRatings) instead of staying
// module-level constants, so `description`/`displayLabel` re-render with the
// active language. `label` is DATA-BEARING — NOT display-only text: it is the
// exact raw French string from POSTPARTUM_FATIGUE_OPTIONS/
// POSTPARTUM_PAIN_OPTIONS/POSTPARTUM_RECOVERY_OPTIONS (postpartumJournalConfig.ts),
// matched against `selected` and saved verbatim via savePostpartumJournalField(...)
// — there is no separate enum — so it must stay French and untranslated.
// `description` (a purely presentational blurb) was already translated;
// PHASE 7H adds `displayLabel` (journalOptionLabel) so the VISIBLE/
// accessibility text for `label` itself now also follows the app language —
// see PostpartumWellnessRatingLayout.tsx's own `option.displayLabel ?? option.label`.
function useFatigueRatings(t: (key: string, options?: Record<string, unknown>) => string): WellnessRatingOption[] {
  return useMemo(
    () => [
      {
        label: 'Aucune',
        displayLabel: journalOptionLabel('postpartumFatigue', 'Aucune', t),
        description: t('postpartumJournalEntry.fatigueRatings.none.description'),
        icon: 'weather-sunny',
        tint: '#FFF2C9',
      },
      {
        label: 'Légère',
        displayLabel: journalOptionLabel('postpartumFatigue', 'Légère', t),
        description: t('postpartumJournalEntry.fatigueRatings.light.description'),
        icon: 'weather-partly-cloudy',
        tint: '#FFF0DF',
      },
      {
        label: 'Modérée',
        displayLabel: journalOptionLabel('postpartumFatigue', 'Modérée', t),
        description: t('postpartumJournalEntry.fatigueRatings.moderate.description'),
        icon: 'weather-cloudy',
        tint: '#F1E8FF',
      },
      {
        label: 'Forte',
        displayLabel: journalOptionLabel('postpartumFatigue', 'Forte', t),
        description: t('postpartumJournalEntry.fatigueRatings.strong.description'),
        icon: 'weather-pouring',
        tint: '#EEE5FF',
      },
      {
        label: 'Très forte',
        displayLabel: journalOptionLabel('postpartumFatigue', 'Très forte', t),
        description: t('postpartumJournalEntry.fatigueRatings.veryStrong.description'),
        icon: 'weather-night',
        tint: '#E8E0FA',
      },
    ],
    [t],
  );
}

function usePainRatings(t: (key: string, options?: Record<string, unknown>) => string): WellnessRatingOption[] {
  return useMemo(
    () => [
      {
        label: 'Aucune',
        displayLabel: journalOptionLabel('postpartumPain', 'Aucune', t),
        description: t('postpartumJournalEntry.painRatings.none.description'),
        icon: 'heart-outline',
        tint: '#F4ECFF',
      },
      {
        label: 'Légère',
        displayLabel: journalOptionLabel('postpartumPain', 'Légère', t),
        description: t('postpartumJournalEntry.painRatings.light.description'),
        icon: 'heart-pulse',
        tint: '#FCEBF2',
      },
      {
        label: 'Modérée',
        displayLabel: journalOptionLabel('postpartumPain', 'Modérée', t),
        description: t('postpartumJournalEntry.painRatings.moderate.description'),
        icon: 'alert-circle-outline',
        tint: '#FFF0E8',
      },
      {
        label: 'Forte',
        displayLabel: journalOptionLabel('postpartumPain', 'Forte', t),
        description: t('postpartumJournalEntry.painRatings.strong.description'),
        icon: 'alert-outline',
        tint: '#FFE9EC',
      },
      {
        label: 'Très forte',
        displayLabel: journalOptionLabel('postpartumPain', 'Très forte', t),
        description: t('postpartumJournalEntry.painRatings.veryStrong.description'),
        icon: 'medical-bag',
        tint: '#F9E4E8',
      },
    ],
    [t],
  );
}

function useRecoveryRatings(t: (key: string, options?: Record<string, unknown>) => string): WellnessRatingOption[] {
  return useMemo(
    () => [
      {
        label: 'Difficile',
        displayLabel: journalOptionLabel('postpartumRecovery', 'Difficile', t),
        description: t('postpartumJournalEntry.recoveryRatings.difficult.description'),
        icon: 'weather-cloudy',
        tint: '#F4EAFE',
      },
      {
        label: 'Lente',
        displayLabel: journalOptionLabel('postpartumRecovery', 'Lente', t),
        description: t('postpartumJournalEntry.recoveryRatings.slow.description'),
        icon: 'walk',
        tint: '#F0E8FF',
      },
      {
        label: 'Stable',
        displayLabel: journalOptionLabel('postpartumRecovery', 'Stable', t),
        description: t('postpartumJournalEntry.recoveryRatings.stable.description'),
        icon: 'chart-line',
        tint: '#E9F2FF',
      },
      {
        label: 'Bonne',
        displayLabel: journalOptionLabel('postpartumRecovery', 'Bonne', t),
        description: t('postpartumJournalEntry.recoveryRatings.good.description'),
        icon: 'sprout',
        tint: '#E8F7EE',
      },
      {
        label: 'Très bonne',
        displayLabel: journalOptionLabel('postpartumRecovery', 'Très bonne', t),
        description: t('postpartumJournalEntry.recoveryRatings.veryGood.description'),
        icon: 'star-outline',
        tint: '#FFF2D9',
      },
    ],
    [t],
  );
}

export default function PostpartumJournalEntryScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<Props>();
  const { category } = route.params;
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const fatigueRatings = useFatigueRatings(t);
  const painRatings = usePainRatings(t);
  const recoveryRatings = useRecoveryRatings(t);

  const item = POSTPARTUM_JOURNAL_ITEMS.find(entry => entry.key === category);
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {today, todayKey} = useToday();

  const [fatigue, setFatigue] = useState<string | undefined>(undefined);

  const [mood, setMood] = useState<string | undefined>(undefined);
  const [moodNote, setMoodNote] = useState('');

  const [sleepQuality, setSleepQuality] = useState<string | undefined>(
    undefined,
  );
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);

  const [pain, setPain] = useState<string | undefined>(undefined);
  const [physicalRecovery, setPhysicalRecovery] = useState<string | undefined>(
    undefined,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Whether today already has a saved answer for THIS category — only then is
  // "Effacer ma réponse" offered (M25).
  const [hasSavedAnswer, setHasSavedAnswer] = useState(false);

  useEffect(() => {
    let active = true;
    hydratePostpartumJournal().then(() => {
      if (!active) {
        return;
      }
      const entry = getPostpartumJournalEntry(todayKey);
      setHasSavedAnswer(Boolean(entry?.[category]));

      setFatigue(entry?.fatigue);
      setMood(entry?.mood);
      setMoodNote(entry?.moodNote ?? '');
      setSleepQuality(entry?.sleep);
      setSleepDuration(entry?.sleepDuration ?? null);
      setPain(entry?.pain);
      setPhysicalRecovery(entry?.physicalRecovery);
    });
    return () => {
      active = false;
    };
  }, [todayKey, category]);

  const adjustSleepDuration = (delta: number) => {
    setSleepDuration(current => {
      const base = current ?? 7;
      return Math.min(24, Math.max(0, Math.round((base + delta) * 2) / 2));
    });
  };

  const save = async () => {
    if (saving) {
      return;
    }
    setError('');

    const complete = (title: string) => {
      showPostpartumSuccessToast({
        title,
        message: t('postpartumJournalEntry.toast.dailyUpToDate'),
      });
      navigation.navigate('MainTabs', { screen: 'CycleHome' });
    };

    if (category === 'fatigue') {
      if (!fatigue) {
        setError(t('postpartumJournalEntry.errors.fatigue'));
        return;
      }
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'fatigue', fatigue);
        complete(t('postpartumJournalEntry.toast.saved.fatigue'));
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'mood') {
      if (!mood) {
        setError(t('postpartumJournalEntry.errors.mood'));
        return;
      }
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'mood', mood);
        if (moodNote.trim()) {
          await savePostpartumJournalField(
            todayKey,
            'moodNote',
            moodNote.trim(),
          );
        } else {
          // An emptied note field must clear the previously saved note.
          await clearPostpartumMoodNote(todayKey);
        }
        complete(t('postpartumJournalEntry.toast.saved.mood'));
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'sleep') {
      if (!sleepQuality) {
        setError(t('postpartumJournalEntry.errors.sleep'));
        return;
      }
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'sleep', sleepQuality);
        if (sleepDuration !== null) {
          await savePostpartumJournalField(
            todayKey,
            'sleepDuration',
            sleepDuration,
          );
        }
        complete(t('postpartumJournalEntry.toast.saved.sleep'));
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'pain') {
      if (!pain) {
        setError(t('postpartumJournalEntry.errors.pain'));
        return;
      }
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'pain', pain);
        complete(t('postpartumJournalEntry.toast.saved.pain'));
      } catch (saveError) {
        presentSaveFailure(saveError);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!physicalRecovery) {
      setError(t('postpartumJournalEntry.errors.physicalRecovery'));
      return;
    }
    setSaving(true);
    try {
      await savePostpartumJournalField(
        todayKey,
        'physicalRecovery',
        physicalRecovery,
      );
      complete(t('postpartumJournalEntry.toast.saved.physicalRecovery'));
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  // Clears today's saved answer for this category (mood also drops its note,
  // sleep its duration) back to "not answered"; other categories and other
  // days are untouched. Reopening the screen shows the empty state.
  const clearAnswer = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      await clearPostpartumJournalCategory(todayKey, category);
      setFatigue(undefined);
      setMood(undefined);
      setMoodNote('');
      setSleepQuality(undefined);
      setSleepDuration(null);
      setPain(undefined);
      setPhysicalRecovery(undefined);
      setHasSavedAnswer(false);
      showPostpartumSuccessToast({
        title: t('postpartumJournalEntry.toast.cleared'),
        message: t('postpartumJournalEntry.toast.dailyUpToDate'),
      });
      navigation.navigate('MainTabs', { screen: 'CycleHome' });
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };
  const onClear = hasSavedAnswer ? clearAnswer : undefined;

  // Postpartum-derived date subtitle ("lundi 14 août · Jour X post-partum")
  // — the same visual slot Cycle's own Sleep/Mood screens use for
  // "· Jour X du cycle", but computed purely from Postpartum's own
  // deliveryDate preference (never Cycle data).
  const [postpartumPrefs, setPostpartumPrefs] = useState(
    getPostpartumPreferences,
  );
  useEffect(
    () =>
      subscribePostpartumPreferences(() =>
        setPostpartumPrefs(getPostpartumPreferences()),
      ),
    [],
  );
  const deliveryDate = useMemo(
    () =>
      postpartumPrefs.deliveryDate
        ? new Date(`${postpartumPrefs.deliveryDate}T12:00:00`)
        : null,
    [postpartumPrefs.deliveryDate],
  );
  const postpartumStatus = useMemo(
    () => computePostpartumStatus(deliveryDate, today),
    [deliveryDate, today],
  );
  const dateLabel = useMemo(() => {
    const base = new Intl.DateTimeFormat(dateFormatLocale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(today);
    return postpartumStatus.configured
      ? t('postpartumJournalEntry.dateLabel.withDay', {base, day: postpartumStatus.postpartumDay})
      : base;
  }, [postpartumStatus, today, t]);

  if (category === 'mood') {
    return (
      <PostpartumCycleStyleJournalLayout
        dateLabel={dateLabel}
        error={error}
        heroIcon="heart-outline"
        heroImage={require('../assets/images/mood-header-woman.png')}
        heroText={t('postpartumJournalEntry.mood.heroText')}
        heroTitle={t('postpartumJournalEntry.mood.heroTitle')}
        onSave={save}
        onClear={onClear}
        saving={saving}
        title={item?.label ?? t('postpartumJournalEntry.categoryTitle.mood')}
      >
        <MoodContent
          note={moodNote}
          onSelect={setMood}
          selected={mood}
          setNote={setMoodNote}
        />
      </PostpartumCycleStyleJournalLayout>
    );
  }

  if (category === 'sleep') {
    return (
      <PostpartumCycleStyleJournalLayout
        dateLabel={dateLabel}
        error={error}
        heroIcon="weather-night"
        heroImage={require('../assets/images/sleep-header-woman.png')}
        heroText={t('postpartumJournalEntry.sleep.heroText')}
        heroTitle={t('postpartumJournalEntry.sleep.heroTitle')}
        onSave={save}
        onClear={onClear}
        saving={saving}
        title={item?.label ?? t('postpartumJournalEntry.categoryTitle.sleep')}
      >
        <SleepContent
          duration={sleepDuration}
          onAdjustDuration={adjustSleepDuration}
          onSelectQuality={setSleepQuality}
          quality={sleepQuality}
        />
      </PostpartumCycleStyleJournalLayout>
    );
  }

  if (category === 'fatigue') {
    return (
      <PostpartumWellnessRatingLayout
        adviceIcon="weather-night"
        adviceText={t('postpartumJournalEntry.fatigue.adviceText')}
        adviceTitle={t('postpartumJournalEntry.fatigue.adviceTitle')}
        dateLabel={dateLabel}
        error={error}
        heroImage={require('../assets/images/postpartum/postpartum-fatigue.png')}
        heroText={t('postpartumJournalEntry.fatigue.heroText')}
        heroTitle={t('postpartumJournalEntry.fatigue.heroTitle')}
        onSave={save}
        onClear={onClear}
        onSelect={setFatigue}
        options={fatigueRatings}
        saving={saving}
        selected={fatigue}
        title={item?.label ?? t('postpartumJournalEntry.categoryTitle.fatigue')}
      />
    );
  }

  if (category === 'pain') {
    return (
      <PostpartumWellnessRatingLayout
        adviceIcon="heart-pulse"
        adviceText={t('postpartumJournalEntry.pain.adviceText')}
        adviceTitle={t('postpartumJournalEntry.pain.adviceTitle')}
        dateLabel={dateLabel}
        error={error}
        heroImage={require('../assets/images/postpartum/postpartum-pain.png')}
        heroText={t('postpartumJournalEntry.pain.heroText')}
        heroTitle={t('postpartumJournalEntry.pain.heroTitle')}
        onSave={save}
        onClear={onClear}
        onSelect={setPain}
        options={painRatings}
        saving={saving}
        selected={pain}
        title={item?.label ?? t('postpartumJournalEntry.categoryTitle.pain')}
      />
    );
  }

  if (category === 'physicalRecovery') {
    return (
      <PostpartumWellnessRatingLayout
        adviceIcon="heart-outline"
        adviceText={t('postpartumJournalEntry.physicalRecovery.adviceText')}
        adviceTitle={t('postpartumJournalEntry.physicalRecovery.adviceTitle')}
        dateLabel={dateLabel}
        error={error}
        heroImage={require('../assets/images/postpartum/postpartum-recovery.png')}
        heroText={t('postpartumJournalEntry.physicalRecovery.heroText')}
        heroTitle={t('postpartumJournalEntry.physicalRecovery.heroTitle')}
        onSave={save}
        onClear={onClear}
        onSelect={setPhysicalRecovery}
        options={recoveryRatings}
        saving={saving}
        selected={physicalRecovery}
        title={item?.label ?? t('postpartumJournalEntry.categoryTitle.physicalRecovery')}
      />
    );
  }

  return (
    <PostpartumJournalScreenLayout
      error={error}
      icon={item?.icon ?? 'heart-pulse'}
      onSave={save}
      saving={saving}
      subtitle={item?.journalSubtitle ?? ''}
      tint={item?.tint ?? theme.colors.primarySoft}
      title={item?.label ?? t('postpartumJournalEntry.categoryTitle.fallback')}
    >
      {category === 'fatigue' ? (
        <FatigueContent onSelect={setFatigue} selected={fatigue} />
      ) : null}
      {category === 'pain' ? (
        <PainContent onSelect={setPain} selected={pain} />
      ) : null}
      {category === 'physicalRecovery' ? (
        <RecoveryContent
          onSelect={setPhysicalRecovery}
          selected={physicalRecovery}
        />
      ) : null}
    </PostpartumJournalScreenLayout>
  );
}

/* ============================================================
   FATIGUE
============================================================ */

function FatigueContent({
  selected,
  onSelect,
}: {
  selected: string | undefined;
  onSelect: (value: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('postpartumJournalEntry.fatigue.levelTitle')}</Text>
        {/* DATA-BEARING render site — `option` is a raw POSTPARTUM_FATIGUE_OPTIONS
            French string saved verbatim via savePostpartumJournalField(...);
            the chip label itself must stay untranslated (only the card chrome
            above is translated). */}
        <View style={styles.qualityRow}>
          {POSTPARTUM_FATIGUE_OPTIONS.map((option, index) => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={journalOptionLabel('postpartumFatigue', option, t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [
                  styles.qualityBox,
                  active && styles.qualityBoxActive,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                  name={DESCENDING_SEVERITY_ICONS[index]}
                  size={24}
                />
                <Text
                  numberOfLines={2}
                  style={[
                    styles.qualityLabel,
                    active && styles.qualityLabelActive,
                  ]}
                >
                  {journalOptionLabel('postpartumFatigue', option, t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PostpartumInfoPanel
        icon="information-outline"
        text={t('postpartumJournalEntry.fatigue.infoText')}
        title={t('postpartumJournalEntry.fatigue.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   DOULEURS
============================================================ */

function PainContent({
  selected,
  onSelect,
}: {
  selected: string | undefined;
  onSelect: (value: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('postpartumJournalEntry.pain.levelTitle')}</Text>
        {/* DATA-BEARING render site — see FatigueContent's comment above;
            same rule for POSTPARTUM_PAIN_OPTIONS. */}
        <View style={styles.qualityRow}>
          {POSTPARTUM_PAIN_OPTIONS.map((option, index) => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={journalOptionLabel('postpartumPain', option, t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [
                  styles.qualityBox,
                  active && styles.qualityBoxActive,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                  name={DESCENDING_SEVERITY_ICONS[index]}
                  size={24}
                />
                <Text
                  numberOfLines={2}
                  style={[
                    styles.qualityLabel,
                    active && styles.qualityLabelActive,
                  ]}
                >
                  {journalOptionLabel('postpartumPain', option, t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PostpartumInfoPanel
        icon="information-outline"
        text={t('postpartumJournalEntry.pain.infoText')}
        title={t('postpartumJournalEntry.pain.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   RÉCUPÉRATION PHYSIQUE
============================================================ */

function RecoveryContent({
  selected,
  onSelect,
}: {
  selected: string | undefined;
  onSelect: (value: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('postpartumJournalEntry.categoryTitle.physicalRecovery')}</Text>
        {/* DATA-BEARING render site — see FatigueContent's comment above;
            same rule for POSTPARTUM_RECOVERY_OPTIONS. */}
        <View style={styles.qualityRow}>
          {POSTPARTUM_RECOVERY_OPTIONS.map((option, index) => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={journalOptionLabel('postpartumRecovery', option, t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [
                  styles.qualityBox,
                  active && styles.qualityBoxActive,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                  name={ASCENDING_SEVERITY_ICONS[index]}
                  size={24}
                />
                <Text
                  numberOfLines={2}
                  style={[
                    styles.qualityLabel,
                    active && styles.qualityLabelActive,
                  ]}
                >
                  {journalOptionLabel('postpartumRecovery', option, t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PostpartumInfoPanel
        icon="information-outline"
        text={t('postpartumJournalEntry.physicalRecovery.infoText')}
        title={t('postpartumJournalEntry.physicalRecovery.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   HUMEUR
============================================================ */

function MoodContent({
  selected,
  onSelect,
  note,
  setNote,
}: {
  selected: string | undefined;
  onSelect: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <PostpartumJournalCard icon="heart-outline" title={t('postpartumJournalEntry.mood.mainMoodTitle')}>
        {/* DATA-BEARING render site — `option` is a raw POSTPARTUM_MOOD_OPTIONS
            French string saved verbatim via savePostpartumJournalField(...);
            the chip label itself must stay untranslated. */}
        <View style={styles.moodGrid}>
          {POSTPARTUM_MOOD_OPTIONS.map(option => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={journalOptionLabel('postpartumMood', option, t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={option}
                onPress={() => onSelect(option)}
                style={({ pressed }) => [
                  styles.moodCard,
                  active && styles.moodCardActive,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.emojiCircle,
                    active && styles.emojiCircleActive,
                  ]}
                >
                  <Text style={styles.moodEmoji}>{MOOD_EMOJI[option]}</Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={[styles.moodLabel, active && styles.moodLabelActive]}
                >
                  {journalOptionLabel('postpartumMood', option, t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PostpartumJournalCard>

      <PostpartumJournalCard
        icon="pencil-outline"
        optional
        title={t('postpartumJournalEntry.mood.noteTitle')}
      >
        <View style={styles.noteBox}>
          <TextInput
            accessibilityLabel={t('postpartumJournalEntry.mood.noteTitle')}
            maxLength={300}
            multiline
            onChangeText={setNote}
            placeholder={t('postpartumJournalEntry.mood.notePlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={styles.noteInput}
            value={note}
          />
          <Text style={styles.noteCounter}>{t('postpartumJournalEntry.mood.noteCounter', {count: note.length})}</Text>
        </View>
      </PostpartumJournalCard>

      <PostpartumInfoPanel
        icon="heart"
        text={t('postpartumJournalEntry.mood.infoText')}
        title={t('postpartumJournalEntry.mood.infoTitle')}
      />
    </>
  );
}

/* ============================================================
   SOMMEIL
============================================================ */

function SleepContent({
  duration,
  onAdjustDuration,
  quality,
  onSelectQuality,
}: {
  duration: number | null;
  onAdjustDuration: (delta: number) => void;
  quality: string | undefined;
  onSelectQuality: (value: string) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const durationLabel =
    duration !== null ? `${String(duration).replace('.', ',')} h` : '— h';
  return (
    <>
      <PostpartumJournalCard icon="weather-night" title={t('postpartumJournalEntry.sleep.durationTitle')}>
        <View style={styles.stepperRow}>
          <Pressable
            accessibilityLabel={t('postpartumJournalEntry.sleep.decreaseDurationLabel')}
            accessibilityRole="button"
            onPress={() => onAdjustDuration(-0.5)}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="minus"
              size={22}
            />
          </Pressable>

          <View style={styles.durationBlock}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="weather-night"
              size={20}
            />
            <Text style={styles.durationValue}>{durationLabel}</Text>
          </View>

          <Pressable
            accessibilityLabel={t('postpartumJournalEntry.sleep.increaseDurationLabel')}
            accessibilityRole="button"
            onPress={() => onAdjustDuration(0.5)}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="plus"
              size={22}
            />
          </Pressable>
        </View>
      </PostpartumJournalCard>

      <PostpartumJournalCard icon="star-outline" title={t('postpartumJournalEntry.sleep.qualityTitle')}>
        {/* DATA-BEARING render site — `option` is a raw POSTPARTUM_SLEEP_OPTIONS
            French string saved verbatim via savePostpartumJournalField(...);
            the chip label itself must stay untranslated. */}
        <View style={styles.qualityRow}>
          {POSTPARTUM_SLEEP_OPTIONS.map((option, index) => {
            const active = quality === option;
            return (
              <Pressable
                accessibilityLabel={journalOptionLabel('postpartumSleep', option, t)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={option}
                onPress={() => onSelectQuality(option)}
                style={({ pressed }) => [
                  styles.qualityBox,
                  active && styles.qualityBoxActive,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                  name={ASCENDING_SEVERITY_ICONS[index]}
                  size={24}
                />
                <Text
                  numberOfLines={2}
                  style={[
                    styles.qualityLabel,
                    active && styles.qualityLabelActive,
                  ]}
                >
                  {journalOptionLabel('postpartumSleep', option, t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PostpartumJournalCard>

      <PostpartumInfoPanel
        icon="weather-night"
        text={t('postpartumJournalEntry.sleep.infoText')}
        title={t('postpartumJournalEntry.sleep.infoTitle')}
      />
    </>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },

  card: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    padding: 16,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 1,
  },
  cardTitle: {
    marginBottom: 12,
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },

  /* DURÉE SOMMEIL — stepper row */
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  stepperButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: theme.colors.primarySoft,
  },
  durationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  durationValue: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '800',
  },

  /* HUMEUR — mirrors Cycle's JournalMoodScreen moodGrid/moodCard pattern */
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  moodCard: {
    width: '18.2%',
    minWidth: 62,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
  },
  moodCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  emojiCircle: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  emojiCircleActive: {
    backgroundColor: theme.colors.surface,
    transform: [{ scale: 1.08 }],
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 12,
    textAlign: 'center',
  },
  moodLabelActive: { color: theme.colors.primary, fontWeight: '800' },

  /* SOMMEIL / FATIGUE / DOULEURS / RÉCUPÉRATION — shared 5-option quality-box row */
  qualityRow: { flexDirection: 'row', gap: 7 },
  qualityBox: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  qualityBoxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  qualityLabel: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 8.2,
    fontWeight: '600',
    textAlign: 'center',
  },
  qualityLabelActive: { color: theme.colors.primary, fontWeight: '800' },

  noteBox: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },
  noteInput: {
    minHeight: 90,
    padding: 12,
    paddingBottom: 22,
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  noteCounter: {
    position: 'absolute',
    right: 10,
    bottom: 7,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
  },
  });
}
