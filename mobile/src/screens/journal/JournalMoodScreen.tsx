import {useJournalDay} from '../../hooks/useJournalDay';
import {JournalDaySwitcher} from '../../components/journal/JournalDaySwitcher';
import {useDaughterJournal} from '../../hooks/useDaughterJournal';
import React, {useEffect, useMemo, useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {presentSaveFailure} from '../../services/saveFailure';
import {ClearEntryButton} from '../../components/journal/ClearEntryButton';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {useJournalCycleDay} from '../../hooks/useJournalCycleDay';
import type {MoodLevel} from '../../types/journal';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {dateFormatLocale} from '../../utils/cycleMath';
import {DAUGHTER_TITLE_MIN_SIZE, planDaughterTitle} from './daughterTitleFit';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {deriveAwaRoles} from '../../theme/semanticRoles';
import '../../i18n';

type MoodOption = {labelKey: string; icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; value: MoodLevel};
type LevelRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

// Labels reuse the same cycleHome.mood.* glossary entries HeroCycleCard reads
// for these exact 9 mood levels — never a second, duplicated translation.
const MOODS: MoodOption[] = [
  {labelKey: 'cycleHome.mood.veryGood', icon: 'emoticon-happy-outline', value: 'veryGood'},
  {labelKey: 'cycleHome.mood.good', icon: 'emoticon-outline', value: 'good'},
  {labelKey: 'cycleHome.mood.neutral', icon: 'emoticon-neutral-outline', value: 'neutral'},
  {labelKey: 'cycleHome.mood.stressed', icon: 'emoticon-confused-outline', value: 'stressed'},
  {labelKey: 'cycleHome.mood.irritable', icon: 'emoticon-angry-outline', value: 'irritable'},
  {labelKey: 'cycleHome.mood.anxious', icon: 'emoticon-frown-outline', value: 'anxious'},
  {labelKey: 'cycleHome.mood.sad', icon: 'emoticon-cry-outline', value: 'sad'},
  {labelKey: 'cycleHome.mood.tired', icon: 'sleep', value: 'tired'},
  {labelKey: 'cycleHome.mood.motivated', icon: 'emoticon-excited-outline', value: 'motivated'},
];

function LevelRow({label, value, onChange}: LevelRowProps) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.levelRow}>
      <Text style={styles.levelLabel}>{label}</Text>
      <View accessibilityRole="adjustable" accessibilityValue={{min: 1, max: 5, now: value}} style={styles.scale}>
        <View style={[styles.scaleTrack, {backgroundColor: withAlpha(theme.colors.primary, 0.2)}]} />
        <View style={[styles.scaleFill, {backgroundColor: theme.colors.primary, width: `${(value - 1) * 25}%`}]} />
        {[1, 2, 3, 4, 5].map(level => (
          <Pressable
            key={level}
            accessibilityLabel={t('journalMood.levelOutOfFive', {label, level})}
            accessibilityRole="button"
            onPress={() => onChange(level)}
            style={styles.scaleStep} />
        ))}
        <View pointerEvents="none" style={[styles.scaleThumb, {backgroundColor: theme.colors.primary, left: `${(value - 1) * 25}%`}]} />
      </View>
    </View>
  );
}

export default function JournalMoodScreen(): React.JSX.Element {
  const {t} = useTranslation();
  // Managed daughter profile only (null for the mother, whose screen renders exactly as before): no illustrated hero,
  // no encouragement card, compact mood grid, third-person wording with her first name.
  const {daughter, tx} = useDaughterJournal();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  // The entry can be filled in for a previous day too (arrows next to the date): `today` / `todayKey` below are the DAY BEING EDITED.
  const journalDay = useJournalDay();
  const today = journalDay.day;
  const todayKey = journalDay.dayKey;
  const insets = useSafeAreaInsets();
  const {width, height, fontScale} = useWindowDimensions();
  // Daughter profile only: the width between the back and the save button, to fit her title (see daughterTitleFit.ts).
  const [headerCopyWidth, setHeaderCopyWidth] = useState(0);
  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;
  // Null (no "Jour N du cycle" in the header) when this objective/state has
  // no valid menstrual cycle day - see journalCycleDayFor().
  const cycleDay = useJournalCycleDay(today);
  const moodTitle = tx('dailyJournalSheet.items.mood.title', 'titles.mood');
  // The header copy has 8 dp of padding each side. The title never goes below DAUGHTER_TITLE_MIN_SIZE sp.
  const daughterTitlePlan = planDaughterTitle({title: moodTitle, availableWidth: headerCopyWidth - 16, fontScale});
  const dateLabel = new Intl.DateTimeFormat(dateFormatLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(today);
  const [mood, setMood] = useState<MoodLevel>('veryGood');
  const [energy, setEnergy] = useState(4);
  const [stress, setStress] = useState(3);
  const [irritability, setIrritability] = useState(2);
  const [motivation, setMotivation] = useState(4);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  // M25: true only while a saved mood exists for today (shows "Effacer").
  const [hasSaved, setHasSaved] = useState(false);

  const remaining = useMemo(() => 300 - note.length, [note.length]);

  // Reopening today's mood shows what was already saved instead of the
  // defaults, so pressing Save without editing rewrites the same values
  // (never overwrites the day with the defaults above). The note is already
  // decrypted by getJournalEntry() (see dailyJournalStore.ts).
  useEffect(() => {
    let mounted = true;
    // Another day: start from the defaults (a day with nothing saved must not show the previous day's values).
    setMood('veryGood');
    setEnergy(4);
    setStress(3);
    setIrritability(2);
    setMotivation(4);
    setNote('');
    setHasSaved(false);
    getJournalEntry(todayKey).then(entry => {
      const saved = entry?.mood;
      if (!mounted || !saved) {
        return;
      }
      setHasSaved(true);
      setMood(saved.level);
      setEnergy(saved.energy);
      setStress(saved.stress);
      setIrritability(saved.irritability);
      setMotivation(saved.motivation);
      setNote(saved.note ?? '');
    });
    return () => {
      mounted = false;
    };
  }, [todayKey]);

  // M25: removes the saved mood for today (section absent = the canonical
  // empty state); reopening shows the untouched defaults again.
  const clearEntry = async () => {
    try {
      await deleteJournalSection(todayKey, 'mood');
    } catch (saveError) {
      presentSaveFailure(saveError);
      return;
    }
    setHasSaved(false);
    navigation.goBack();
  };

  const save = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await saveJournalSection(
        todayKey,
        'mood',
        {
          level: mood,
          energy,
          stress,
          irritability,
          motivation,
          note: note.trim(),
        },
      );

      navigation.goBack();
    } catch (saveError) {
      presentSaveFailure(saveError, {title: t('journalMood.errorTitle'), message: tx('journalMood.errorMessage', 'mood.errorMessage')});
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.statusBarStyle} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View
          style={[
            styles.topBar,
            isSmallScreen && styles.topBarSmall,
            isVerySmallScreen && styles.topBarVerySmall,
          ]}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="arrow-left"
            onPress={navigation.goBack}
          />
          <View onLayout={daughter ? event => setHeaderCopyWidth(event.nativeEvent.layout.width) : undefined} style={styles.headerCopy}>
            {daughter ? (
              <AwaText
                adjustsFontSizeToFit={daughterTitlePlan.numberOfLines === 1}
                minimumFontScale={Math.min(1, DAUGHTER_TITLE_MIN_SIZE / daughterTitlePlan.fontSize)}
                numberOfLines={daughterTitlePlan.numberOfLines}
                style={[styles.daughterTitle, {fontSize: daughterTitlePlan.fontSize, lineHeight: daughterTitlePlan.lineHeight}]}
                variant="headlineSmall">
                {moodTitle}
              </AwaText>
            ) : (
              <AwaText variant="headlineSmall">{moodTitle}</AwaText>
            )}
            <JournalDaySwitcher
              canGoNext={journalDay.canGoNext}
              canGoPrevious={journalDay.canGoPrevious}
              label={cycleDay !== null ? t('journalMood.dateWithCycleDay', {date: dateLabel, day: cycleDay}) : dateLabel}
              nextDay={journalDay.nextDay}
              onNext={journalDay.goNext}
              onPrevious={journalDay.goPrevious}
              previousDay={journalDay.previousDay}
            />
          </View>
          <AwaIconButton
            accessibilityLabel={t('journalMood.saveMood')}
            disabled={saving}
            icon="check"
            onPress={save}
            variant="filled"
          />
        </View>

        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 24}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {daughter ? null : (
            <View style={styles.heroText}>
              <AwaText colorRole="onSurfaceVariant" style={styles.heroSubtitle} variant="bodyMedium">{t('journalMood.heroSubtitle')}</AwaText>
            </View>
          )}

          <AwaCard padding="compact" variant="outlined">
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><MaterialDesignIcons color={theme.colors.primary} name="emoticon-happy-outline" size={18} /></View>
              <Text style={[styles.sectionTitle, daughter && styles.daughterSectionTitle]}>{daughter ? tx('', 'mood.question') : t('journalMood.mainMoodSectionTitle')}</Text>
            </View>
            <View style={styles.moodGrid}>
              {MOODS.map(option => {
                const selected = mood === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    onPress={() => setMood(option.value)}
                    style={({pressed}) => [styles.moodCard, selected && styles.moodCardSelected, pressed && styles.pressed]}>
                    <MaterialDesignIcons color={selected ? theme.colors.primary : theme.colors.textMuted} name={option.icon} size={30} style={styles.moodIcon} />
                    <Text numberOfLines={2} style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{t(option.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AwaCard>

          <AwaCard padding="compact" variant="outlined">
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitleFlush}>{t('journalMood.levelsSectionTitle')}</Text>
            </View>
            <LevelRow label={t('cycleHome.energyChipLabel')} onChange={setEnergy} value={energy} />
            <LevelRow label={t('journalMood.stressLabel')} onChange={setStress} value={stress} />
            <LevelRow label={t('journalMood.irritabilityLabel')} onChange={setIrritability} value={irritability} />
            <LevelRow label={t('journalMood.motivationLabel')} onChange={setMotivation} value={motivation} />
          </AwaCard>

          <AwaCard padding="compact" variant="outlined">
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><MaterialDesignIcons color={theme.colors.primary} name="pencil-outline" size={17} /></View>
              <Text style={styles.sectionTitle}>{t('journalMood.commentSectionTitle')}</Text>
            </View>
            <View style={styles.noteBox}>
              <TextInput
                accessibilityLabel={tx('journalMood.commentAccessibility', 'mood.commentAccessibility')}
                maxLength={300}
                multiline
                onChangeText={setNote}
                placeholder={t('journalMood.commentPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={styles.noteInput}
                textAlignVertical="top"
                value={note}
              />
              <Text style={styles.counter}>{300 - remaining} / 300</Text>
            </View>
          </AwaCard>

          <AwaButton
            accessibilityLabel={t('journalMood.saveMood')}
            label={saving ? t('periodStartSheet.saving') : t('common.save')}
            loading={saving}
            onPress={save}
            size="large"
            style={styles.saveButton}
          />

          {hasSaved ? <ClearEntryButton onConfirm={clearEntry} subject={t('journalMood.clearSubject')} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.colors.background},
  flex: {flex: 1},
  topBar: {minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: TOP_SPACING_EXTRA, paddingBottom: 8, paddingHorizontal: 14},
  topBarSmall: {minHeight: 62, paddingTop: TOP_SPACING_EXTRA_COMPACT, paddingBottom: 7, paddingHorizontal: 10},
  topBarVerySmall: {minHeight: 58, paddingTop: TOP_SPACING_EXTRA_COMPACT, paddingBottom: 6, paddingHorizontal: 8},
  headerCopy: {flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8},
  content: {paddingHorizontal: 11, paddingBottom: 34, gap: 8},
  // Daughter journal only: the title wraps between the back and save buttons; mood tiles and labels grow with the text.
  daughterTitle: {alignSelf: 'stretch', minWidth: 0, textAlign: 'center'},
  daughterSectionTitle: {flex: 1, minWidth: 0, marginLeft: 8},
  // Plain heading (no photo): padded like the cards below it so the copy never touches the screen edge.
  heroText: {paddingHorizontal: 12, paddingTop: 4, paddingBottom: 6},
  heroSubtitle: {marginTop: 6},
  sectionHeading: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  headingIcon: {width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.colors.primarySoft},
  sectionTitle: {marginLeft: 8, color: theme.colors.accent, fontSize: 15.5, fontWeight: '700'},
  // A section title with no icon before it ("Niveaux du jour"): it starts at the card's own padding edge.
  sectionTitleFlush: {color: theme.colors.accent, fontSize: 15.5, fontWeight: '700'},
  moodGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8},
  moodCard: {width: '18.2%', minWidth: 67, minHeight: 88, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 4, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12, backgroundColor: theme.colors.surfaceSecondary},
  moodCardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  // The line icon sits directly on the card (no circular badge).
  moodIcon: {marginBottom: 4},
  moodLabel: {marginTop: 4, color: theme.colors.text, fontSize: 11, textAlign: 'center'},
  // DESIGN.md: selected text = onPrimaryContainer (primary text on the soft fill fails contrast in some palettes).
  moodLabelSelected: {color: deriveAwaRoles(theme).onPrimaryContainer, fontWeight: '700'},
  levelRow: {minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.14)},
  levelLabel: {width: 92, color: theme.colors.accent, fontSize: 13, fontWeight: '700'},
  scale: {flex: 1, height: 28, flexDirection: 'row', alignItems: 'center'},
  scaleStep: {flex: 1, height: 28, alignItems: 'center', justifyContent: 'center'},
  scaleTrack: {position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3},
  scaleFill: {position: 'absolute', left: 0, height: 6, borderRadius: 3},
  scaleThumb: {position: 'absolute', width: 17, height: 17, marginLeft: -8.5, borderWidth: 2, borderColor: theme.colors.surface, borderRadius: 9},
  noteBox: {height: 82, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12, backgroundColor: theme.colors.surface},
  noteInput: {flex: 1, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 20, color: theme.colors.text, fontSize: 11.5},
  counter: {position: 'absolute', right: 9, bottom: 6, color: theme.colors.textMuted, fontSize: 11},
 saveButton: {width: '88%', maxWidth: 360, alignSelf: 'center', marginTop: 12, marginBottom: 8},

  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  });
}
