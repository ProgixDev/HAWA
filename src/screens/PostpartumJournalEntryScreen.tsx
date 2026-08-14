import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation, useRoute, type NavigationProp, type RouteProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {PostpartumInfoPanel, PostpartumJournalScreenLayout} from '../components/postpartum/PostpartumJournalScreenLayout';
import {PostpartumCycleStyleJournalLayout, PostpartumJournalCard} from '../components/postpartum/PostpartumCycleStyleJournalLayout';
import {homeColors} from '../components/home/homeTheme';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {getPostpartumJournalEntry, hydratePostpartumJournal, savePostpartumJournalField} from '../state/postpartumJournalStore';
import {
  POSTPARTUM_FATIGUE_OPTIONS,
  POSTPARTUM_JOURNAL_ITEMS,
  POSTPARTUM_MOOD_OPTIONS,
  POSTPARTUM_PAIN_OPTIONS,
  POSTPARTUM_RECOVERY_OPTIONS,
  POSTPARTUM_SLEEP_OPTIONS,
} from '../config/postpartumJournalConfig';
import {getPostpartumPreferences, subscribePostpartumPreferences} from '../state/postpartumPreferences';
import {computePostpartumStatus} from '../utils/postpartumTrackingUtils';

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

const MOOD_EMOJI: Record<string, string> = {
  'Très difficile': '😣',
  'Difficile': '😟',
  'Neutre': '😐',
  'Bien': '🙂',
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

export default function PostpartumJournalEntryScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<Props>();
  const {category} = route.params;

  const item = POSTPARTUM_JOURNAL_ITEMS.find(entry => entry.key === category);
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const [fatigue, setFatigue] = useState<string | undefined>(undefined);

  const [mood, setMood] = useState<string | undefined>(undefined);
  const [moodNote, setMoodNote] = useState('');

  const [sleepQuality, setSleepQuality] = useState<string | undefined>(undefined);
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);

  const [pain, setPain] = useState<string | undefined>(undefined);
  const [physicalRecovery, setPhysicalRecovery] = useState<string | undefined>(undefined);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    hydratePostpartumJournal().then(() => {
      if (!active) {return;}
      const entry = getPostpartumJournalEntry(todayKey);

      setFatigue(entry?.fatigue);
      setMood(entry?.mood);
      setMoodNote(entry?.moodNote ?? '');
      setSleepQuality(entry?.sleep);
      setSleepDuration(entry?.sleepDuration ?? null);
      setPain(entry?.pain);
      setPhysicalRecovery(entry?.physicalRecovery);
    });
    return () => {active = false;};
  }, [todayKey]);

  const adjustSleepDuration = (delta: number) => {
    setSleepDuration(current => {
      const base = current ?? 7;
      return Math.min(24, Math.max(0, Math.round((base + delta) * 2) / 2));
    });
  };

  const save = async () => {
    setError('');

    if (category === 'fatigue') {
      if (!fatigue) {setError('Choisis un niveau de fatigue avant d’enregistrer.'); return;}
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'fatigue', fatigue);
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'mood') {
      if (!mood) {setError('Choisis une humeur avant d’enregistrer.'); return;}
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'mood', mood);
        if (moodNote.trim()) {await savePostpartumJournalField(todayKey, 'moodNote', moodNote.trim());}
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'sleep') {
      if (!sleepQuality) {setError('Choisis une qualité de sommeil avant d’enregistrer.'); return;}
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'sleep', sleepQuality);
        if (sleepDuration !== null) {await savePostpartumJournalField(todayKey, 'sleepDuration', sleepDuration);}
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (category === 'pain') {
      if (!pain) {setError('Choisis un niveau de douleur avant d’enregistrer.'); return;}
      setSaving(true);
      try {
        await savePostpartumJournalField(todayKey, 'pain', pain);
        navigation.goBack();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!physicalRecovery) {setError('Choisis un niveau de récupération avant d’enregistrer.'); return;}
    setSaving(true);
    try {
      await savePostpartumJournalField(todayKey, 'physicalRecovery', physicalRecovery);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  // Postpartum-derived date subtitle ("lundi 14 août · Jour X post-partum")
  // — the same visual slot Cycle's own Sleep/Mood screens use for
  // "· Jour X du cycle", but computed purely from Postpartum's own
  // deliveryDate preference (never Cycle data).
  const [postpartumPrefs, setPostpartumPrefs] = useState(getPostpartumPreferences);
  useEffect(() => subscribePostpartumPreferences(() => setPostpartumPrefs(getPostpartumPreferences())), []);
  const deliveryDate = useMemo(
    () => (postpartumPrefs.deliveryDate ? new Date(`${postpartumPrefs.deliveryDate}T12:00:00`) : null),
    [postpartumPrefs.deliveryDate],
  );
  const postpartumStatus = useMemo(() => computePostpartumStatus(deliveryDate, new Date()), [deliveryDate]);
  const dateLabel = useMemo(() => {
    const base = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).format(new Date());
    return postpartumStatus.configured ? `${base} · Jour ${postpartumStatus.postpartumDay} post-partum` : base;
  }, [postpartumStatus]);

  if (category === 'mood') {
    return (
      <PostpartumCycleStyleJournalLayout
        dateLabel={dateLabel}
        error={error}
        heroIcon="heart-outline"
        heroImage={require('../assets/images/mood-header-woman.png')}
        heroText="Prends un moment pour reconnaître ce que tu ressens."
        heroTitle="Comment te sens-tu aujourd’hui ?"
        onSave={save}
        saving={saving}
        title="Humeur">
        <MoodContent note={moodNote} onSelect={setMood} selected={mood} setNote={setMoodNote} />
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
        heroText="Un bon repos soutient ta récupération et ton énergie."
        heroTitle="Prends soin de ton repos"
        onSave={save}
        saving={saving}
        title="Sommeil">
        <SleepContent
          duration={sleepDuration}
          onAdjustDuration={adjustSleepDuration}
          onSelectQuality={setSleepQuality}
          quality={sleepQuality}
        />
      </PostpartumCycleStyleJournalLayout>
    );
  }

  return (
    <PostpartumJournalScreenLayout
      error={error}
      icon={item?.icon ?? 'heart-pulse'}
      onSave={save}
      saving={saving}
      subtitle={item?.journalSubtitle ?? ''}
      tint={item?.tint ?? homeColors.lightLavender}
      title={item?.label ?? 'Suivi'}>
      {category === 'fatigue' ? <FatigueContent onSelect={setFatigue} selected={fatigue} /> : null}
      {category === 'pain' ? <PainContent onSelect={setPain} selected={pain} /> : null}
      {category === 'physicalRecovery' ? <RecoveryContent onSelect={setPhysicalRecovery} selected={physicalRecovery} /> : null}
    </PostpartumJournalScreenLayout>
  );
}

/* ============================================================
   FATIGUE
============================================================ */

function FatigueContent({selected, onSelect}: {selected: string | undefined; onSelect: (value: string) => void}): React.JSX.Element {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Niveau de fatigue</Text>
        <View style={styles.qualityRow}>
          {POSTPARTUM_FATIGUE_OPTIONS.map((option, index) => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="radio"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => onSelect(option)}
                style={({pressed}) => [styles.qualityBox, active && styles.qualityBoxActive, pressed && styles.pressed]}>
                <MaterialDesignIcons color={active ? homeColors.primary : '#8A7CA7'} name={DESCENDING_SEVERITY_ICONS[index]} size={24} />
                <Text numberOfLines={2} style={[styles.qualityLabel, active && styles.qualityLabelActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PostpartumInfoPanel icon="information-outline" text="Observer ta fatigue t’aide à mieux répartir tes moments de repos." title="Ton énergie" />
    </>
  );
}

/* ============================================================
   DOULEURS
============================================================ */

function PainContent({selected, onSelect}: {selected: string | undefined; onSelect: (value: string) => void}): React.JSX.Element {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Niveau de douleur</Text>
        <View style={styles.qualityRow}>
          {POSTPARTUM_PAIN_OPTIONS.map((option, index) => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="radio"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => onSelect(option)}
                style={({pressed}) => [styles.qualityBox, active && styles.qualityBoxActive, pressed && styles.pressed]}>
                <MaterialDesignIcons color={active ? homeColors.primary : '#8A7CA7'} name={DESCENDING_SEVERITY_ICONS[index]} size={24} />
                <Text numberOfLines={2} style={[styles.qualityLabel, active && styles.qualityLabelActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PostpartumInfoPanel icon="information-outline" text="Ce suivi est un simple repère personnel, pas un diagnostic." title="Ton suivi" />
    </>
  );
}

/* ============================================================
   RÉCUPÉRATION PHYSIQUE
============================================================ */

function RecoveryContent({selected, onSelect}: {selected: string | undefined; onSelect: (value: string) => void}): React.JSX.Element {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Récupération physique</Text>
        <View style={styles.qualityRow}>
          {POSTPARTUM_RECOVERY_OPTIONS.map((option, index) => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="radio"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => onSelect(option)}
                style={({pressed}) => [styles.qualityBox, active && styles.qualityBoxActive, pressed && styles.pressed]}>
                <MaterialDesignIcons color={active ? homeColors.primary : '#8A7CA7'} name={ASCENDING_SEVERITY_ICONS[index]} size={24} />
                <Text numberOfLines={2} style={[styles.qualityLabel, active && styles.qualityLabelActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PostpartumInfoPanel icon="information-outline" text="Chaque corps récupère à son propre rythme après l’accouchement." title="À ton rythme" />
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
  return (
    <>
      <PostpartumJournalCard icon="heart-outline" title="Humeur principale">
        <View style={styles.moodGrid}>
          {POSTPARTUM_MOOD_OPTIONS.map(option => {
            const active = selected === option;
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="radio"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => onSelect(option)}
                style={({pressed}) => [styles.moodCard, active && styles.moodCardActive, pressed && styles.pressed]}>
                <View style={[styles.emojiCircle, active && styles.emojiCircleActive]}>
                  <Text style={styles.moodEmoji}>{MOOD_EMOJI[option]}</Text>
                </View>
                <Text numberOfLines={2} style={[styles.moodLabel, active && styles.moodLabelActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PostpartumJournalCard>

      <PostpartumJournalCard icon="pencil-outline" optional title="Un mot sur ton humeur">
        <View style={styles.noteBox}>
          <TextInput
            accessibilityLabel="Un mot sur ton humeur"
            maxLength={300}
            multiline
            onChangeText={setNote}
            placeholder="Écris ce que tu souhaites retenir..."
            placeholderTextColor="#9A8FB8"
            style={styles.noteInput}
            value={note}
          />
          <Text style={styles.noteCounter}>{note.length} / 300</Text>
        </View>
      </PostpartumJournalCard>

      <PostpartumInfoPanel icon="heart" text="Écoute-toi avec bienveillance, à ton rythme." title="Chaque émotion compte" />
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
  const durationLabel = duration !== null ? `${String(duration).replace('.', ',')} h` : '— h';
  return (
    <>
      <PostpartumJournalCard icon="weather-night" title="Durée de sommeil">
        <View style={styles.stepperRow}>
          <Pressable
            accessibilityLabel="Diminuer la durée de 30 minutes"
            accessibilityRole="button"
            onPress={() => onAdjustDuration(-0.5)}
            style={({pressed}) => [styles.stepperButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={homeColors.primary} name="minus" size={22} />
          </Pressable>

          <View style={styles.durationBlock}>
            <MaterialDesignIcons color={homeColors.primary} name="weather-night" size={20} />
            <Text style={styles.durationValue}>{durationLabel}</Text>
          </View>

          <Pressable
            accessibilityLabel="Augmenter la durée de 30 minutes"
            accessibilityRole="button"
            onPress={() => onAdjustDuration(0.5)}
            style={({pressed}) => [styles.stepperButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={homeColors.primary} name="plus" size={22} />
          </Pressable>
        </View>
      </PostpartumJournalCard>

      <PostpartumJournalCard icon="star-outline" title="Qualité du sommeil">
        <View style={styles.qualityRow}>
          {POSTPARTUM_SLEEP_OPTIONS.map((option, index) => {
            const active = quality === option;
            return (
              <Pressable
                accessibilityLabel={option}
                accessibilityRole="radio"
                accessibilityState={{checked: active}}
                key={option}
                onPress={() => onSelectQuality(option)}
                style={({pressed}) => [styles.qualityBox, active && styles.qualityBoxActive, pressed && styles.pressed]}>
                <MaterialDesignIcons color={active ? homeColors.primary : '#8A7CA7'} name={ASCENDING_SEVERITY_ICONS[index]} size={24} />
                <Text numberOfLines={2} style={[styles.qualityLabel, active && styles.qualityLabelActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PostpartumJournalCard>

      <PostpartumInfoPanel icon="weather-night" text="C’est normal d’avoir un sommeil irrégulier après l’accouchement. Ton corps se régule progressivement." title="Prends soin de toi" />
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {opacity: 0.82, transform: [{scale: 0.99}]},

  card: {
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 1,
  },
  cardTitle: {marginBottom: 12, color: homeColors.textPrimary, fontSize: 15, fontWeight: '800'},

  /* DURÉE SOMMEIL — stepper row */
  stepperRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18},
  stepperButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: homeColors.lightLavender,
  },
  durationBlock: {flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 110, justifyContent: 'center'},
  durationValue: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 26, fontWeight: '800'},

  /* HUMEUR — mirrors Cycle's JournalMoodScreen moodGrid/moodCard pattern */
  moodGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8},
  moodCard: {
    width: '18.2%',
    minWidth: 62,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 13,
    backgroundColor: '#FCF9FF',
  },
  moodCardActive: {borderColor: '#9E86D6', backgroundColor: homeColors.lightLavender},
  emojiCircle: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#F3ECFB'},
  emojiCircleActive: {backgroundColor: '#FFFFFF', transform: [{scale: 1.08}]},
  moodEmoji: {fontSize: 22},
  moodLabel: {marginTop: 5, color: homeColors.textSecondary, fontSize: 9.5, lineHeight: 12, textAlign: 'center'},
  moodLabelActive: {color: homeColors.primary, fontWeight: '800'},

  /* SOMMEIL / FATIGUE / DOULEURS / RÉCUPÉRATION — shared 5-option quality-box row */
  qualityRow: {flexDirection: 'row', gap: 7},
  qualityBox: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 12,
    backgroundColor: '#FCFAFF',
  },
  qualityBoxActive: {borderColor: homeColors.primary, backgroundColor: homeColors.lightLavender},
  qualityLabel: {marginTop: 6, color: homeColors.textSecondary, fontSize: 8.2, fontWeight: '600', textAlign: 'center'},
  qualityLabelActive: {color: homeColors.primary, fontWeight: '800'},

  noteBox: {borderWidth: 1, borderColor: 'rgba(105,73,190,0.14)', borderRadius: 15, backgroundColor: '#FCFAFF'},
  noteInput: {
    minHeight: 90,
    padding: 12,
    paddingBottom: 22,
    color: homeColors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  noteCounter: {position: 'absolute', right: 10, bottom: 7, color: homeColors.textSecondary, fontSize: 9.5},
});
