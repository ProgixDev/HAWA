import {useToday} from '../../hooks/useToday';
import {useDaughterJournal} from '../../hooks/useDaughterJournal';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {presentSaveFailure} from '../../services/saveFailure';
import {ClearEntryButton} from '../../components/journal/ClearEntryButton';
import {JOURNAL_HERO_INK} from '../../components/journal/journalHeroInk';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {useJournalCycleDay} from '../../hooks/useJournalCycleDay';
import type {MoodLevel} from '../../types/journal';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {dateFormatLocale} from '../../utils/cycleMath';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {deriveAwaRoles} from '../../theme/semanticRoles';
import '../../i18n';

type MoodOption = {labelKey: string; emoji: string; value: MoodLevel};
type LevelRowProps = {
  label: string;
  value: number;
  color: string;
  paleColor: string;
  onChange: (value: number) => void;
};

// Labels reuse the same cycleHome.mood.* glossary entries HeroCycleCard reads
// for these exact 9 mood levels — never a second, duplicated translation.
const MOODS: MoodOption[] = [
  {labelKey: 'cycleHome.mood.veryGood', emoji: '😊', value: 'veryGood'},
  {labelKey: 'cycleHome.mood.good', emoji: '🙂', value: 'good'},
  {labelKey: 'cycleHome.mood.neutral', emoji: '😐', value: 'neutral'},
  {labelKey: 'cycleHome.mood.stressed', emoji: '😟', value: 'stressed'},
  {labelKey: 'cycleHome.mood.irritable', emoji: '😠', value: 'irritable'},
  {labelKey: 'cycleHome.mood.anxious', emoji: '😰', value: 'anxious'},
  {labelKey: 'cycleHome.mood.sad', emoji: '😢', value: 'sad'},
  {labelKey: 'cycleHome.mood.tired', emoji: '😴', value: 'tired'},
  {labelKey: 'cycleHome.mood.motivated', emoji: '🤩', value: 'motivated'},
];

function LevelRow({label, value, color, paleColor, onChange}: LevelRowProps) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.levelRow}>
      <Text style={styles.levelLabel}>{label}</Text>
      <View accessibilityRole="adjustable" accessibilityValue={{min: 1, max: 5, now: value}} style={styles.scale}>
        <View style={[styles.scaleTrack, {backgroundColor: paleColor}]} />
        <View style={[styles.scaleFill, {backgroundColor: color, width: `${(value - 1) * 25}%`}]} />
        {[1, 2, 3, 4, 5].map(level => (
          <Pressable
            key={level}
            accessibilityLabel={t('journalMood.levelOutOfFive', {label, level})}
            accessibilityRole="button"
            onPress={() => onChange(level)}
            style={styles.scaleStep} />
        ))}
        <View pointerEvents="none" style={[styles.scaleThumb, {backgroundColor: color, left: `${(value - 1) * 25}%`}]} />
      </View>
      <Text style={styles.levelValue}>{value} / 5</Text>
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
  const {today, todayKey} = useToday();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;
  // Null (no "Jour N du cycle" in the header) when this objective/state has
  // no valid menstrual cycle day - see journalCycleDayFor().
  const cycleDay = useJournalCycleDay(today);
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
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = useMemo(() => 300 - note.length, [note.length]);

  useEffect(() => {
    return () => {
      if (successToastTimeout.current) {
        clearTimeout(successToastTimeout.current);
      }
    };
  }, []);

  // Reopening today's mood shows what was already saved instead of the
  // defaults, so pressing Save without editing rewrites the same values
  // (never overwrites the day with the defaults above). The note is already
  // decrypted by getJournalEntry() (see dailyJournalStore.ts).
  useEffect(() => {
    let mounted = true;
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

  const showSuccessToast = () => {
    if (successToastTimeout.current) {
      clearTimeout(successToastTimeout.current);
    }

    setSuccessVisible(true);
    successToastAnimation.stopAnimation();
    successToastAnimation.setValue(0);

    Animated.spring(successToastAnimation, {
      toValue: 1,
      damping: 17,
      stiffness: 180,
      mass: 0.85,
      useNativeDriver: true,
    }).start();

    successToastTimeout.current = setTimeout(() => {
      Animated.timing(successToastAnimation, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setSuccessVisible(false);

          // JournalMoodScreen est ouvert depuis CycleHome.
          // goBack() retourne vers CycleHome sans conflit de typage.
          navigation.goBack();
        }
      });
    }, 2500);
  };

  const hideSuccessToast = () => {
    if (successToastTimeout.current) {
      clearTimeout(successToastTimeout.current);
      successToastTimeout.current = null;
    }

    Animated.timing(successToastAnimation, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setSuccessVisible(false);
      }
    });
  };

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

      showSuccessToast();
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
          <View style={styles.headerCopy}>
            <AwaText numberOfLines={daughter ? 2 : undefined} style={daughter ? styles.daughterTitle : undefined} variant="headlineSmall">
              {tx('dailyJournalSheet.items.mood.title', 'titles.mood')}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" numberOfLines={1} variant="bodySmall">
              {cycleDay !== null ? t('journalMood.dateWithCycleDay', {date: dateLabel, day: cycleDay}) : dateLabel}
            </AwaText>
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
            <ImageBackground imageStyle={styles.heroImage} source={require('../../assets/images/mood-header-woman.png')} style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>{t('journalMood.heroTitle')}</Text>
                <Text style={styles.heroSubtitle}>{t('journalMood.heroSubtitle')}</Text>
              </View>
            </ImageBackground>
          )}

          <AwaCard padding="compact" variant="outlined">
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><Text style={styles.headingEmoji}>☺</Text></View>
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
                    <Text style={styles.emoji}>{option.emoji}</Text>
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
            <LevelRow color="#2B7656" label={t('cycleHome.energyChipLabel')} onChange={setEnergy} paleColor="#DAE9DD" value={energy} />
            <LevelRow color="#EA788A" label={t('journalMood.stressLabel')} onChange={setStress} paleColor="#F9E0E5" value={stress} />
            <LevelRow color="#EF984D" label={t('journalMood.irritabilityLabel')} onChange={setIrritability} paleColor="#FAE5D1" value={irritability} />
            <LevelRow color="#A480C0" label={t('journalMood.motivationLabel')} onChange={setMotivation} paleColor="#EDE4F3" value={motivation} />
          </AwaCard>

          <AwaCard padding="compact" variant="outlined">
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><MaterialDesignIcons color={theme.colors.primary} name="pencil-outline" size={17} /></View>
              <Text style={styles.sectionTitle}>{t('journalMood.commentSectionTitle')} <Text style={styles.optional}>{t('journalMood.optional')}</Text></Text>
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
            {daughter ? null : (
              <View style={styles.kindnessBox}>
                <View style={styles.kindnessIcon}><Text style={styles.kindnessEmoji}>💚</Text></View>
                <View style={styles.kindnessCopy}>
                  <Text style={styles.kindnessTitle}>{t('journalMood.kindnessTitle')}</Text>
                  <Text style={styles.kindnessText}>{t('journalMood.kindnessText')}</Text>
                </View>
                <MaterialDesignIcons color={withAlpha(theme.colors.primary, 0.45)} name="sprout" size={34} />
              </View>
            )}
          </AwaCard>

          <AwaButton
            accessibilityLabel={t('journalMood.saveMood')}
            icon="content-save-outline"
            label={saving ? t('periodStartSheet.saving') : t('common.save')}
            loading={saving}
            onPress={save}
            size="large"
            style={styles.saveButton}
          />

          {hasSaved ? <ClearEntryButton onConfirm={clearEntry} subject={t('journalMood.clearSubject')} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {successVisible ? (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom: Math.max(insets.bottom, 18) + 12,
              opacity: successToastAnimation,
              transform: [
                {
                  translateY: successToastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
                {
                  scale: successToastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.toastIcon}>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="check"
              size={14}
            />
          </View>

          <Text style={styles.toastText}>
            {t('journalMood.savedToast')}
          </Text>

          <Pressable
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={hideSuccessToast}
            style={({pressed}) => [
              styles.toastCloseButton,
              pressed && styles.toastCloseButtonPressed,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.textSecondary}
              name="close"
              size={17}
            />
          </Pressable>
        </Animated.View>
      ) : null}
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
  daughterTitle: {flex: 1, minWidth: 0, textAlign: 'center'},
  daughterSectionTitle: {flex: 1, minWidth: 0, marginLeft: 8},
  hero: {minHeight: 125, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12, backgroundColor: theme.colors.surface},
  heroImage: {borderRadius: 12, resizeMode: 'cover'},
  heroCopy: {width: '58%', paddingLeft: 26},
  heroTitle: {color: JOURNAL_HERO_INK.title, fontSize: 19, lineHeight: 23, fontWeight: '700'},
  heroSubtitle: {marginTop: 7, color: JOURNAL_HERO_INK.body, fontSize: 11.5, lineHeight: 16},
  sectionHeading: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  headingIcon: {width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.colors.primarySoft},
  headingEmoji: {color: theme.colors.primary, fontSize: 20, lineHeight: 23},
  sectionTitle: {marginLeft: 8, color: theme.colors.accent, fontSize: 15.5, fontWeight: '700'},
  // A section title with no icon before it ("Niveaux du jour"): it starts at the card's own padding edge.
  sectionTitleFlush: {color: theme.colors.accent, fontSize: 15.5, fontWeight: '700'},
  optional: {fontFamily: undefined, fontSize: 11, fontWeight: '400'},
  moodGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8},
  moodCard: {width: '18.2%', minWidth: 67, minHeight: 88, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 4, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12, backgroundColor: theme.colors.surfaceSecondary},
  moodCardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  // The emoji sits directly on the card (no circular badge): larger, with its own line height so Android never clips it.
  emoji: {fontSize: 32, lineHeight: 40, textAlign: 'center'},
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
  levelValue: {width: 46, marginLeft: 12, color: theme.colors.textSecondary, fontSize: 13, textAlign: 'right'},
  noteBox: {height: 82, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12, backgroundColor: theme.colors.surface},
  noteInput: {flex: 1, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 20, color: theme.colors.text, fontSize: 11.5},
  counter: {position: 'absolute', right: 9, bottom: 6, color: theme.colors.textMuted, fontSize: 11},
  kindnessBox: {minHeight: 54, flexDirection: 'row', alignItems: 'center', marginTop: 8, borderRadius: 12, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 12},
  kindnessIcon: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
  kindnessEmoji: {fontSize: 16},
  kindnessCopy: {flex: 1, marginLeft: 9},
  kindnessTitle: {color: theme.colors.accent, fontSize: 11, fontWeight: '700'},
  kindnessText: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11},
 saveButton: {width: '88%', maxWidth: 360, alignSelf: 'center', marginTop: 12, marginBottom: 8},

  toast: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },

  toastIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },

  toastText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.accent,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
  },

  toastCloseButton: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  toastCloseButtonPressed: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.8,
  },

  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  });
}
