import {useToday} from '../../hooks/useToday';
import {useDaughterJournal} from '../../hooks/useDaughterJournal';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
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
import {
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {dateFormatLocale} from '../../utils/cycleMath';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {deriveAwaRoles} from '../../theme/semanticRoles';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import '../../i18n';

// ACTIVITIES/FEELINGS/INTENSITIES labels are DATA here, not just display
// text: `save()` below persists `type`/`intensity`/`feeling` as the raw
// selected `.label` string directly into dailyJournalStore (no separate
// semantic value, unlike JournalSymptomsScreen's INTENSITIES). The raw French
// string stays the stored/compared/selected value forever — PHASE 7H adds a
// DISPLAY-ONLY translation via journalOptionLabel('cycleActivityType'/
// 'cycleActivityFeeling'/'cycleActivityIntensity', value, t), falling back to
// the original French string for any legacy/unknown value. INTENSITIES'
// `description` field is different: it is pure UI chrome (never persisted —
// only `label` is), so it is now translated directly via t() instead
// (see INTENSITY_DESCRIPTION_KEYS below) — this was a genuine, harmless gap
// (the array's hardcoded `description` strings were never actually wrapped in
// t(), unlike every sibling field in this file).
const ACTIVITIES: Array<{
  label: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
}> = [
  {
    label: 'Marche',
    icon: 'walk',
  },
  {
    label: 'Course',
    icon: 'run',
  },
  {
    label: 'Yoga',
    icon: 'meditation',
  },
  {
    label: 'Musculation',
    icon: 'dumbbell',
  },
  {
    label: 'Natation',
    icon: 'swim',
  },
  {
    label: 'Vélo',
    icon: 'bike',
  },
  {
    label: 'Étirements',
    icon: 'human-handsup',
  },
  {
    label: 'Pilates',
    icon: 'human',
  },
  {
    label: 'Danse',
    icon: 'dance-ballroom',
  },
  {
    label: 'Autre',
    icon: 'dots-horizontal-circle-outline',
  },
];

const FEELINGS = [
  {
    label: 'Très fatiguée',
    emoji: '🥵',
  },
  {
    label: 'Fatiguée',
    emoji: '😓',
  },
  {
    label: 'Neutre',
    emoji: '😐',
  },
  {
    label: 'Bien',
    emoji: '🙂',
  },
  {
    label: 'Très bien',
    emoji: '🤩',
  },
];

const INTENSITIES: Array<{
  label: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  description: string;
}> = [
  {
    label: 'Légère',
    icon: 'heart-outline',
    description: 'Effort doux',
  },
  {
    label: 'Modérée',
    icon: 'lightning-bolt',
    description: 'Effort moyen',
  },
  {
    label: 'Élevée',
    icon: 'fire',
    description: 'Effort intense',
  },
];

// `description` above is pure UI chrome (never persisted — only `label` is),
// so it is translated directly via t(), unlike every other field in this
// file. Keyed by the (unchanged, DATA-BEARING) `label` string.
const INTENSITY_DESCRIPTION_KEYS: Record<string, string> = {
  'Légère': 'journalActivity.intensityLightDescription',
  'Modérée': 'journalActivity.intensityModerateDescription',
  'Élevée': 'journalActivity.intensityHighDescription',
};
export default function JournalActivityScreen(): React.JSX.Element {
  const {t} = useTranslation();
  // Managed daughter profile only (null for the mother, whose screen renders exactly as before): no illustrated hero,
  // no encouragement card, third-person wording with her first name.
  const {daughter, tx} = useDaughterJournal();
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {today, todayKey} = useToday();

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activity, setActivity] = useState('Marche');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('Élevée');
  const [feeling, setFeeling] = useState('Très bien');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  // M25: true only while a saved activity exists for today (shows "Effacer").
  const [hasSaved, setHasSaved] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation =
    useRef(new Animated.Value(0)).current;

  const successToastTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // Null (no "Jour N du cycle" in the header) when this objective/state has
  // no valid menstrual cycle day - see journalCycleDayFor().
  const cycleDay = useJournalCycleDay(today);

  const dateLabel = new Intl.DateTimeFormat(dateFormatLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(today);

  useEffect(() => {
    return () => {
      if (successToastTimeout.current) {
        clearTimeout(successToastTimeout.current);
      }
    };
  }, []);

  // Reopening today's activity shows what was already saved instead of the
  // defaults, so pressing Save without editing rewrites the same values. The
  // note is already decrypted by getJournalEntry().
  useEffect(() => {
    let mounted = true;
    getJournalEntry(todayKey).then(entry => {
      const saved = entry?.activity;
      if (!mounted || !saved) {
        return;
      }
      setHasSaved(true);
      if (saved.type) {
        setActivity(saved.type);
      }
      if (typeof saved.durationMinutes === 'number') {
        setDuration(saved.durationMinutes);
      }
      if (saved.intensity) {
        setIntensity(saved.intensity);
      }
      if (saved.feeling) {
        setFeeling(saved.feeling);
      }
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

  // M25: removes the saved activity for today (section absent = the canonical
  // empty state); reopening shows the untouched defaults again.
  const clearEntry = async () => {
    try {
      await deleteJournalSection(todayKey, 'activity');
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
        'activity',
        {
          none: false,
          type: activity,
          durationMinutes: duration,
          intensity,
          feeling,
          note: note.trim(),
        },
      );

      showSuccessToast();
    } catch (saveError) {
      presentSaveFailure(saveError, {title: t('journalActivity.errorTitle'), message: tx('journalActivity.errorMessage', 'activity.errorMessage')});
    } finally {
      setSaving(false);
    }
  };

  const changeDuration = (step: number) => {
    setDuration(value =>
      Math.min(
        120,
        Math.max(10, value + step),
      ),
    );
  };

  const durationPercent = Math.max(
    0,
    Math.min(100, (duration / 120) * 100),
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safe}>

      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.statusBarStyle}
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>

        {/* HEADER */}
        <View
          style={[
            styles.header,
            isSmallScreen && styles.headerSmall,
            isVerySmallScreen &&
              styles.headerVerySmall,
          ]}>

          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="chevron-left"
            onPress={() => navigation.goBack()}
          />

          <View style={styles.headerCopy}>

            <AwaText numberOfLines={2} style={[styles.title, daughter && styles.daughterTitle]} variant="headlineSmall">
              {tx('dailyJournalSheet.items.activity.title', 'titles.activity')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" numberOfLines={2} style={styles.date} variant="bodySmall">
              {cycleDay !== null ? t('journalActivity.dateWithCycleDay', {date: dateLabel, day: cycleDay}) : dateLabel}
            </AwaText>

          </View>

          <AwaIconButton
            accessibilityLabel={t('common.save')}
            disabled={saving}
            icon="check"
            onPress={save}
            variant="filled"
          />

        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isSmallScreen &&
              styles.contentSmall,
            isVerySmallScreen &&
              styles.contentVerySmall,
            {
              paddingBottom:
                Math.max(insets.bottom, 16) + 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* HERO — IMAGE CONSERVÉE (not shown for a daughter's journal) */}
          {daughter ? null : (
          <ImageBackground
            imageStyle={styles.heroImage}
            source={require('../../assets/images/activity-header-woman.png')}
            style={styles.hero}>

            <View style={styles.heroCopy}>

              <Text style={styles.heroTitle}>
                {t('journalActivity.heroTitle')}
              </Text>

              <Text style={styles.heroText}>
                {t('journalActivity.heroText')}
              </Text>

            </View>

          </ImageBackground>
          )}

          {/* TYPE D'ACTIVITÉ */}
          <AwaCard padding="compact" variant="outlined">

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="run"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  {t('journalActivity.typeSectionTitle')}
                </Text>

                <Text style={styles.hint}>
                  {tx('journalActivity.typeSectionHint', 'activity.typeHint')}
                </Text>
              </View>

            </View>

            <View style={styles.activityGrid}>

              {ACTIVITIES.map(item => {
                const active =
                  activity === item.label;

                return (
                  <Pressable
                    accessibilityLabel={journalOptionLabel('cycleActivityType', item.label, t)}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    key={item.label}
                    onPress={() =>
                      setActivity(item.label)
                    }
                    style={({pressed}) => [
                      styles.activity,
                      active &&
                        styles.activitySelected,
                      pressed &&
                        styles.activityPressed,
                    ]}>

                    <View
                      style={[
                        styles.activityIcon,
                        active &&
                          styles.activityIconSelected,
                      ]}>

                      <MaterialDesignIcons
                        color={
                          active
                            ? onPrimaryTextColor(theme)
                            : theme.colors.primary
                        }
                        name={item.icon}
                        size={22}
                      />

                    </View>

                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      numberOfLines={2}
                      style={[
                        styles.activityLabel,
                        active &&
                          styles.activityLabelSelected,
                      ]}>
                      {journalOptionLabel('cycleActivityType', item.label, t)}
                    </Text>

                    {active ? (
                      <View style={styles.activityCheck}>
                        <MaterialDesignIcons
                          color={onPrimaryTextColor(theme)}
                          name="check"
                          size={9}
                        />
                      </View>
                    ) : null}

                  </Pressable>
                );
              })}

            </View>

          </AwaCard>

          {/* DURÉE */}
          <AwaCard padding="compact" variant="outlined">

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="clock-outline"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  {t('journalActivity.durationSectionTitle')}
                </Text>

                <Text style={styles.hint}>
                  {tx('journalActivity.durationSectionHint', 'activity.durationHint')}
                </Text>
              </View>

            </View>

            <View style={styles.durationPremiumBox}>

              <Pressable
                accessibilityLabel={t('journalActivity.decreaseDuration')}
                accessibilityRole="button"
                onPress={() => changeDuration(-10)}
                style={({pressed}) => [
                  styles.durationButton,
                  pressed &&
                    styles.durationButtonPressed,
                ]}>

                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="minus"
                  size={20}
                />

              </Pressable>

              <View style={styles.durationCenter}>

                <Text style={styles.durationValue}>
                  {duration}
                </Text>

                <Text style={styles.durationUnit}>
                  {t('journalActivity.minutes')}
                </Text>

              </View>

              <Pressable
                accessibilityLabel={t('journalActivity.increaseDuration')}
                accessibilityRole="button"
                onPress={() => changeDuration(10)}
                style={({pressed}) => [
                  styles.durationButton,
                  pressed &&
                    styles.durationButtonPressed,
                ]}>

                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="plus"
                  size={20}
                />

              </Pressable>

            </View>

            <View style={styles.durationTrack}>

              <View
                style={[
                  styles.durationFill,
                  {
                    width: `${durationPercent}%`,
                  },
                ]}
              />

              <View
                pointerEvents="none"
                style={[
                  styles.durationThumb,
                  {
                    left: `${durationPercent}%`,
                  },
                ]}
              />

            </View>

            <View style={styles.scaleLabels}>

              {[10, 30, 60, 90, 120].map(
                value => {
                  const active =
                    duration === value;

                  return (
                    <Pressable
                      hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}
                      key={value}
                      onPress={() =>
                        setDuration(value)
                      }
                      style={[
                        styles.scaleButton,
                        active &&
                          styles.scaleButtonSelected,
                      ]}>

                      <Text
                        style={[
                          styles.scaleText,
                          active &&
                            styles.scaleTextSelected,
                        ]}>
                        {value}
                      </Text>

                    </Pressable>
                  );
                },
              )}

            </View>

          </AwaCard>

          {/* INTENSITÉ */}
          <AwaCard padding="compact" variant="outlined">

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="pulse"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  {t('journalActivity.intensitySectionTitle')}
                </Text>

                <Text style={styles.hint}>
                  {tx('journalActivity.intensitySectionHint', 'activity.intensityHint')}
                </Text>
              </View>

            </View>

            <View style={styles.intensityRow}>

              {INTENSITIES.map(item => {
                const active =
                  intensity === item.label;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    key={item.label}
                    onPress={() =>
                      setIntensity(item.label)
                    }
                    style={({pressed}) => [
                      styles.intensity,
                      active &&
                        styles.intensitySelected,
                      pressed &&
                        styles.intensityPressed,
                    ]}>

                    <View
                      style={[
                        styles.intensityIcon,
                        active &&
                          styles.intensityIconSelected,
                      ]}>

                      <MaterialDesignIcons
                        color={
                          active
                            ? onPrimaryTextColor(theme)
                            : theme.colors.primary
                        }
                        name={item.icon}
                        size={21}
                      />

                    </View>

                    <Text
                      style={[
                        styles.intensityText,
                        active &&
                          styles.intensityTextSelected,
                      ]}>
                      {journalOptionLabel('cycleActivityIntensity', item.label, t)}
                    </Text>

                    <Text
                      style={[
                        styles.intensityDescription,
                        active &&
                          styles.intensityDescriptionSelected,
                      ]}>
                      {INTENSITY_DESCRIPTION_KEYS[item.label] ? t(INTENSITY_DESCRIPTION_KEYS[item.label]) : item.description}
                    </Text>

                    {active ? (
                      <View
                        style={
                          styles.intensityCheck
                        }>
                        <MaterialDesignIcons
                          color={onPrimaryTextColor(theme)}
                          name="check"
                          size={9}
                        />
                      </View>
                    ) : null}

                  </Pressable>
                );
              })}

            </View>

          </AwaCard>

          {/* RESSENTI */}
          <AwaCard padding="compact" variant="outlined">

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="emoticon-happy-outline"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  {tx('journalActivity.feelingSectionTitle', 'activity.feelingTitle')}
                </Text>
              </View>

            </View>

            <View style={styles.feelings}>

              {FEELINGS.map(item => {
                const active =
                  feeling === item.label;

                return (
                  <Pressable
                    accessibilityLabel={t('journalActivity.feelingAccessibility', {label: journalOptionLabel('cycleActivityFeeling', item.label, t)})}
                    accessibilityRole="radio"
                    accessibilityState={{checked: active}}
                    key={item.label}
                    onPress={() =>
                      setFeeling(item.label)
                    }
                    style={[
                      styles.feeling,
                      active &&
                        styles.feelingSelected,
                    ]}>

                    <Text style={styles.emoji}>
                      {item.emoji}
                    </Text>

                    <Text
                      style={[
                        styles.feelingText,
                        active &&
                          styles.feelingTextSelected,
                      ]}>
                      {journalOptionLabel('cycleActivityFeeling', item.label, t)}
                    </Text>

                  </Pressable>
                );
              })}

            </View>

          </AwaCard>

          {/* COMMENTAIRE */}
          <AwaCard padding="compact" variant="outlined">

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="pencil-outline"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>

                <Text style={styles.sectionTitle}>
                  {t('journalMood.commentSectionTitle')}{' '}
                  <Text style={styles.optional}>
                    {t('journalMood.optional')}
                  </Text>
                </Text>

                <Text style={styles.hint}>
                  {t('journalActivity.commentHint')}
                </Text>

              </View>

            </View>

            <View style={styles.noteBox}>

              <TextInput
                maxLength={200}
                multiline
                onChangeText={setNote}
                placeholder={t('journalSymptoms.notesPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={styles.note}
                textAlignVertical="top"
                value={note}
              />

              <View style={styles.noteFooter}>

                <Text style={styles.counter}>
                  {note.length} / 200
                </Text>

                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="paperclip"
                  size={18}
                />

                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="camera-outline"
                  size={19}
                />

              </View>

            </View>

          </AwaCard>

          {daughter ? null : (
          <View style={styles.kindness}>

            <View style={styles.kindnessIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="heart-outline"
                size={17}
              />
            </View>

            <Text style={styles.kindnessText}>
              {t('journalActivity.kindnessText')}
            </Text>

          </View>
          )}

          <AwaButton
            accessibilityLabel={t('journalActivity.saveActivity')}
            icon="content-save"
            label={saving ? t('periodStartSheet.saving') : t('common.save')}
            loading={saving}
            onPress={save}
            size="large"
            style={styles.save}
          />

          {hasSaved ? <ClearEntryButton onConfirm={clearEntry} subject={t('journalActivity.clearSubject')} /> : null}

        </ScrollView>

      </KeyboardAvoidingView>

      {successVisible ? (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom:
                Math.max(insets.bottom, 18) + 12,
              opacity: successToastAnimation,
              transform: [
                {
                  translateY:
                    successToastAnimation.interpolate(
                      {
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      },
                    ),
                },
                {
                  scale:
                    successToastAnimation.interpolate(
                      {
                        inputRange: [0, 1],
                        outputRange: [0.97, 1],
                      },
                    ),
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
            {t('journalActivity.savedToast')}
          </Text>

          <Pressable
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={hideSuccessToast}
            style={({pressed}) => [
              styles.toastCloseButton,
              pressed &&
                styles.toastCloseButtonPressed,
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
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },

  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 8,
    paddingHorizontal: 14,
  },

  headerSmall: {
    minHeight: 62,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 7,
    paddingHorizontal: 10,
  },

  headerVerySmall: {
    minHeight: 58,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  title: {textAlign: 'center'},

  // Daughter journal only: the title wraps between the back and save buttons.
  daughterTitle: {flexShrink: 1},

  date: {maxWidth: '100%', textAlign: 'center'},

  content: {
    paddingTop: 8,
    paddingHorizontal: 13,
    gap: 9,
  },

  contentSmall: {
    paddingTop: 6,
    paddingHorizontal: 10,
    gap: 8,
  },

  contentVerySmall: {
    paddingTop: 5,
    paddingHorizontal: 8,
    gap: 7,
  },

  /* HERO IMAGE */
  hero: {
    minHeight: 112,
    justifyContent: 'center',
    paddingVertical: 10,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  heroImage: {
    borderRadius: 12,
    resizeMode: 'cover',
  },

  heroCopy: {
    width: '58%',
    paddingLeft: 15,
    paddingTop: 6,
  },

  // FIXED VISUAL ISLAND — heroTitle/heroText sit directly on top of the
  // preserved illustration (`activity-header-woman.png`); their color is
  // calibrated for contrast against that specific image, not the theme.
  heroTitle: {
    color: JOURNAL_HERO_INK.title,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },

  heroText: {
    marginTop: 6,
    color: JOURNAL_HERO_INK.body,
    fontSize: 11,
    lineHeight: 16,
  },

  /* CARDS */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionHeaderIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  hint: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  /* ACTIVITÉS */
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },

  activity: {
    position: 'relative',
    width: '23%',
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 3,
    paddingVertical: 7,
  },

  activitySelected: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  activityPressed: {
    opacity: 0.82,
    transform: [{scale: 0.97}],
  },

  activityIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  activityIconSelected: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  activityLabel: {
    maxWidth: '100%',
    color: theme.colors.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // DESIGN.md: selected text = onPrimaryContainer (the fill is primarySoft).
  activityLabelSelected: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
    fontWeight: '700',
  },

  activityCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },

  /* DURÉE */
  durationPremiumBox: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  durationButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  durationButtonPressed: {
    opacity: 0.75,
    transform: [{scale: 0.95}],
  },

  durationCenter: {
    minWidth: 110,
    alignItems: 'center',
    marginHorizontal: 17,
  },

  durationValue: {
    color: theme.colors.accent,
    fontSize: 29,
    lineHeight: 31,
    fontWeight: '800',
  },

  durationUnit: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },

  durationTrack: {
    position: 'relative',
    height: 6,
    marginTop: 16,
    borderRadius: 5,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  durationFill: {
    height: 6,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },

  durationThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },

  scaleButton: {
    minWidth: 34,
    minHeight: 28,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  scaleButtonSelected: {
    backgroundColor: theme.colors.primarySoft,
  },

  scaleText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  scaleTextSelected: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
    fontWeight: '800',
  },

  /* INTENSITÉ */
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },

  intensity: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },

  intensitySelected: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  intensityPressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },

  intensityIcon: {
    width: 37,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  intensityIconSelected: {
    backgroundColor: theme.colors.primary,
  },

  intensityText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  intensityTextSelected: {
    color: theme.colors.accent,
  },

  intensityDescription: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },

  intensityDescriptionSelected: {
    color: theme.colors.textSecondary,
  },

  intensityCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },

  /* FEELINGS */
  feelings: {
    flexDirection: 'row',
    gap: 7,
  },

  feeling: {
    flex: 1,
    minWidth: 0,
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
  },

  feelingSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  emoji: {
    fontSize: 20,
  },

  feelingText: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },

  feelingTextSelected: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
    fontWeight: '700',
  },

  /* NOTE */
  optional: {
    fontSize: 11,
    fontWeight: '400',
  },

  noteBox: {
    minHeight: 78,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  note: {
    minHeight: 48,
    paddingHorizontal: 10,
    paddingTop: 9,
    color: theme.colors.text,
    fontSize: 11.5,
  },

  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 7,
  },

  counter: {
    marginRight: 'auto',
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  /* MESSAGE */
  kindness: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  kindnessIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  kindnessText: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  /* SAVE */
  save: {width: '88%', maxWidth: 360, alignSelf: 'center'},

  /* TOAST */
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
    shadowOffset: {
      width: 0,
      height: 5,
    },
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

  });
}
