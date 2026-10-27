import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAwaTheme } from '../theme/AwaThemeProvider';
import { pickReadableTextColor, withAlpha, type ResolvedAwaTheme } from '../theme/awaThemeTokens';
import InlineCalendarPickerModal from '../components/onboarding/InlineCalendarPickerModal';
import { PostpartumConsistencyModal } from '../components/postpartum/PostpartumConsistencyModal';
import {
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
} from '../state/postpartumLochiaStore';

import {
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  clearFirstPostpartumPeriod,
  recordFirstPostpartumPeriod,
  subscribePostpartumPreferences,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';

import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
  subscribePostpartumJournal,
} from '../state/postpartumJournalStore';

import { diffDays, formatFullDate, startOfDay } from '../utils/cycleMath';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';

/* ============================================================
   TYPES
============================================================ */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PostpartumCycleReturn'
>;

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

/* ============================================================
   CONSTANTS
============================================================ */

const CYCLE_RETURNED_BACKGROUND = require('../assets/images/postpartum/postpartum-cycle-returned-card.png');

// The "cycle repris" hero illustration is a fixed pale lavender/pink
// graphic (see the asset itself) — it never changes with the active AWA
// theme, so text drawn directly over it (no chip/background of its own)
// must not use theme.colors.text/textSecondary/primary, which are light
// colors in Dark mode meant for dark surfaces and disappear against this
// always-light image. The readable foreground is derived from the actual
// visual surface via the existing pickReadableTextColor helper, exactly
// like a fixed semantic swatch elsewhere in the app — never from
// theme.isDark. Only STATUT ACTUEL / the title / the body sentence need
// this (see the hero JSX): the status chip and calendar icon already sit on
// their own opaque theme.colors.primarySoft chip, which is independently
// theme-correct in every mode.
const CYCLE_RETURNED_ILLUSTRATION_BASE = '#EDE6F5';
const HERO_ILLUSTRATION_TEXT = pickReadableTextColor(CYCLE_RETURNED_ILLUSTRATION_BASE);

// setFeedingType() persists the PostpartumFeedingType enum key (see
// src/state/postpartumPreferences.ts), never this label text — these are a
// display-only lookup, distinct wording from PostpartumFeedingScreen's own
// options (this one is a single-line summary, shown in a numberOfLines={2}
// FactorRow value), so they get their own keys rather than sharing one.
const FEEDING_LABEL_KEYS: Record<PostpartumFeedingType, string> = {
  exclusive_breastfeeding: 'postpartumCycleReturn.feedingLabels.exclusiveBreastfeeding',
  mixed: 'postpartumCycleReturn.feedingLabels.mixed',
  exclusive_bottle: 'postpartumCycleReturn.feedingLabels.exclusiveBottle',
  unknown: 'postpartumCycleReturn.feedingLabels.unknown',
};

const EVOLUTION_STAGE_KEYS: Array<{
  icon: IconName;
  rangeKey: string;
  labelKey: string;
}> = [
  {
    icon: 'heart-pulse',
    rangeKey: 'postpartumCycleReturn.evolutionStages.recovery.range',
    labelKey: 'postpartumCycleReturn.evolutionStages.recovery.label',
  },
  {
    icon: 'flower-outline',
    rangeKey: 'postpartumCycleReturn.evolutionStages.adaptation.range',
    labelKey: 'postpartumCycleReturn.evolutionStages.adaptation.label',
  },
  {
    icon: 'sync',
    rangeKey: 'postpartumCycleReturn.evolutionStages.evolution.range',
    labelKey: 'postpartumCycleReturn.evolutionStages.evolution.label',
  },
  {
    icon: 'calendar-heart',
    rangeKey: 'postpartumCycleReturn.evolutionStages.gradualReturn.range',
    labelKey: 'postpartumCycleReturn.evolutionStages.gradualReturn.label',
  },
];

/* ============================================================
   FACTOR ROW
============================================================ */

function FactorRow({
  icon,
  title,
  value,
  description,
  onPress,
  last,
  theme,
  styles,
}: {
  icon: IconName;
  title: string;
  value: string;
  description: string;
  onPress?: () => void;
  last?: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const content = (
    <>
      <View style={styles.factorIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={19} />
      </View>

      <View style={styles.flexCopy}>
        <AwaText variant="labelSmall">{title}</AwaText>

        <AwaText variant="labelSmall" colorRole="primary" style={styles.factorValue}>
          {value}
        </AwaText>

        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.factorDescription}>
          {description}
        </AwaText>
      </View>

      {onPress ? (
        <View style={styles.factorChevron}>
          <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={18} />
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.factorRow, last && styles.factorRowLast]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.factorRow,
        last && styles.factorRowLast,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function PostpartumCycleReturnScreen({ navigation }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  /*
   * Plus d'espace en haut.
   * On prend la Safe Area Android + 10px supplémentaires.
   */
  const topSpacing = Math.max(insets.top + 10, 22);

  const entrance = useRef(new Animated.Value(0)).current;

  const statusEntrance = useRef(new Animated.Value(1)).current;

  const reduceMotion = useRef(false);

  /* ==========================================================
     POSTPARTUM PREFERENCES
  ========================================================== */

  const [postpartum, setPostpartum] = useState(getPostpartumPreferences);

  useEffect(() => {
    let active = true;

    hydratePostpartumPreferences().then(value => {
      if (active) {
        setPostpartum(value);
      }
    });

    const unsubscribe = subscribePostpartumPreferences(() => {
      if (active) {
        setPostpartum(getPostpartumPreferences());
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  /* ==========================================================
     POSTPARTUM JOURNAL
  ========================================================== */

  const [entries, setEntries] = useState(getAllPostpartumJournalEntries);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydratePostpartumJournal().then(() => {
        if (active) {
          setEntries(getAllPostpartumJournalEntries());
        }
      });

      const unsubscribe = subscribePostpartumJournal(() => {
        if (active) {
          setEntries(getAllPostpartumJournalEntries());
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  /* ==========================================================
     DATES
  ========================================================== */

  const deliveryDate = useMemo(
    () =>
      postpartum.deliveryDate
        ? startOfDay(new Date(`${postpartum.deliveryDate}T12:00:00`))
        : null,
    [postpartum.deliveryDate],
  );

  const firstPeriodDate = useMemo(
    () =>
      postpartum.firstPostpartumPeriodDate
        ? startOfDay(
            new Date(`${postpartum.firstPostpartumPeriodDate}T12:00:00`),
          )
        : null,
    [postpartum.firstPostpartumPeriodDate],
  );

  const hasReturned = Boolean(firstPeriodDate);

  const [pickerVisible, setPickerVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [consistencyWarning, setConsistencyWarning] = useState<
    'lochia-active' | 'date-order' | 'before-delivery' | null
  >(null);

  /* ==========================================================
     MOTION
  ========================================================== */

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,

      duration: reduceMotion.current ? 0 : 450,

      easing: Easing.out(Easing.cubic),

      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    statusEntrance.setValue(0);

    Animated.timing(statusEntrance, {
      toValue: 1,

      duration: reduceMotion.current ? 0 : 380,

      easing: Easing.out(Easing.cubic),

      useNativeDriver: true,
    }).start();
  }, [hasReturned, statusEntrance]);

  /* ==========================================================
     SAVE PERIOD
  ========================================================== */

  // A first period cannot be in the future; the picker greys those days too.
  const clearPeriodDate = async () => {
    setSaving(true);
    try {
      await clearFirstPostpartumPeriod();
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  const confirmPeriodDate = async (date: Date) => {
    if (deliveryDate && diffDays(startOfDay(date), deliveryDate) < 0) {
      setPickerVisible(false);
      setConsistencyWarning('before-delivery');
      return;
    }

    await hydratePostpartumLochia();
    const lochiaTracking = getPostpartumLochiaTracking();
    if (!lochiaTracking.endedDate) {
      setPickerVisible(false);
      setConsistencyWarning('lochia-active');
      return;
    }
    const endedDate = startOfDay(
      new Date(`${lochiaTracking.endedDate}T12:00:00`),
    );
    if (diffDays(startOfDay(date), endedDate) < 0) {
      setPickerVisible(false);
      setConsistencyWarning('date-order');
      return;
    }

    setSaving(true);

    try {
      await recordFirstPostpartumPeriod(date);
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     LATEST JOURNAL
  ========================================================== */

  const latestJournalValue = useCallback(
    (field: 'mood' | 'sleep' | 'fatigue'): string | null => {
      const dates = Object.keys(entries).sort().reverse();

      for (const date of dates) {
        const value = entries[date]?.[field];

        if (value) {
          return value;
        }
      }

      return null;
    },
    [entries],
  );

  const latestSleep = useMemo(
    () => latestJournalValue('sleep'),
    [latestJournalValue],
  );

  const latestMood = useMemo(
    () => latestJournalValue('mood'),
    [latestJournalValue],
  );

  const latestFatigue = useMemo(
    () => latestJournalValue('fatigue'),
    [latestJournalValue],
  );

  const feedingLabel = postpartum.feedingType
    ? t(FEEDING_LABEL_KEYS[postpartum.feedingType])
    : t('postpartumCycleReturn.notProvided');

  /* ==========================================================
     INFO
  ========================================================== */

  const showAmenorrheaInfo = () => {
    setHelpModalVisible(true);
  };

  const entranceStyle = {
    opacity: entrance,

    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],

          outputRange: [12, 0],
        }),
      },
    ],
  };

  const statusStyle = {
    opacity: statusEntrance,

    transform: [
      {
        translateY: statusEntrance.interpolate({
          inputRange: [0, 1],

          outputRange: [6, 0],
        }),
      },
    ],
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <View style={styles.safe}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      {/* ======================================================
          HEADER
      ======================================================= */}

      <View
        style={[
          styles.header,
          {
            paddingTop: topSpacing,
          },
        ]}
      >
        <AwaIconButton
          accessibilityLabel={t('common.back')}
          hitSlop={10}
          icon="arrow-left"
          onPress={navigation.goBack}
          variant="outlined"
        />

        <View style={styles.headerCopy}>
          <AwaText variant="labelSmall" colorRole="primary">{t('postpartumCycleReturn.header.eyebrow')}</AwaText>

          <AwaText variant="titleLarge" style={styles.headerTitle}>{t('postpartumCycleReturn.header.title')}</AwaText>
        </View>

        <AwaIconButton
          accessibilityLabel={t('postpartumCycleReturn.header.helpAccessibilityLabel')}
          hitSlop={10}
          icon="help-circle-outline"
          onPress={showAmenorrheaInfo}
          variant="tonal"
        />
      </View>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entranceStyle}>
          {/* ==================================================
              HERO STATUS
          =================================================== */}

          <View style={styles.statusHero}>
            {hasReturned ? (
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={t('postpartumCycleReturn.hero.illustrationAccessibilityLabel')}
                resizeMode="cover"
                source={CYCLE_RETURNED_BACKGROUND}
                style={styles.returnedBackground}
              />
            ) : (
              <>
              </>
            )}

            <View style={styles.statusHeroTop}>
              <View
                style={[
                  styles.statusHeroIcon,

                  hasReturned && styles.statusHeroIconReturned,
                ]}
              >
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name={
                    hasReturned
                      ? 'calendar-check-outline'
                      : 'calendar-clock-outline'
                  }
                  size={27}
                />
              </View>
            </View>

            <Animated.View style={statusStyle}>
              <AwaText variant="labelSmall" colorRole="primary" style={[styles.statusEyebrow, hasReturned && styles.statusEyebrowOnIllustration]}>
                {t('postpartumCycleReturn.hero.statusLabel')}
              </AwaText>

              <AwaText variant="bodyMedium" style={[styles.statusValue, hasReturned && styles.statusValueOnIllustration]}>
                {hasReturned ? t('postpartumCycleReturn.hero.returned') : t('postpartumCycleReturn.hero.notReturned')}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={[styles.statusDescription, hasReturned && styles.statusDescriptionOnIllustration]}>
                {hasReturned && firstPeriodDate
                  ? t('postpartumCycleReturn.hero.returnedDescription', {date: formatFullDate(firstPeriodDate)})
                  : t('postpartumCycleReturn.hero.notReturnedDescription')}
              </AwaText>
            </Animated.View>

            {!hasReturned ? (
              <View style={styles.statusBadge}>
                <View style={styles.statusBadgeDot} />

                <Text style={styles.statusBadgeText}>
                  {t('postpartumCycleReturn.hero.amenorrheaBadge')}
                </Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="check-circle-outline"
                  size={13}
                />

                <Text style={styles.statusBadgeText}>{t('postpartumCycleReturn.hero.returnedBadge')}</Text>
              </View>
            )}

            {!hasReturned ? (
              <View style={styles.normalPanel}>
                <View style={styles.normalPanelIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="leaf" size={17} />
                </View>

                <View style={styles.flexCopy}>
                  <AwaText variant="labelSmall">
                    {t('postpartumCycleReturn.hero.normalPanelTitle')}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalPanelText}>
                    {t('postpartumCycleReturn.hero.normalPanelText')}
                  </AwaText>
                </View>
              </View>
            ) : null}
          </View>

          {/* ==================================================
              PERIOD RETURN
          =================================================== */}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="water-outline"
                  size={20}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <AwaText variant="titleSmall">{t('postpartumCycleReturn.period.sectionTitle')}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionSubtitle}>
                  {t('postpartumCycleReturn.period.sectionSubtitle')}
                </AwaText>
              </View>
            </View>

            <View style={styles.periodPanel}>
              <View style={styles.periodDateIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name={hasReturned ? 'calendar-check' : 'calendar-plus'}
                  size={23}
                />
              </View>

              <View style={styles.periodCopy}>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{t('postpartumCycleReturn.period.label')}</AwaText>

                <AwaText variant="labelSmall" style={styles.periodValue}>
                  {hasReturned && firstPeriodDate
                    ? formatFullDate(firstPeriodDate)
                    : t('postpartumCycleReturn.period.valueNotRecorded')}
                </AwaText>
              </View>

              <AwaButton
                accessibilityLabel={
                  hasReturned
                    ? t('postpartumCycleReturn.period.editAccessibilityLabel')
                    : t('postpartumCycleReturn.period.addAccessibilityLabel')
                }
                disabled={saving}
                label={hasReturned ? t('postpartumCycleReturn.period.edit') : t('common.add')}
                onPress={() => setPickerVisible(true)}
                size="compact"
                style={styles.periodAction}
              />
            </View>

            {hasReturned ? (
              <AwaButton
                accessibilityLabel={t('postpartumCycleReturn.period.clearAccessibilityLabel')}
                disabled={saving}
                label={t('postpartumCycleReturn.period.clearLabel')}
                onPress={clearPeriodDate}
                size="compact"
                style={styles.periodClear}
                variant="text"
              />
            ) : null}

            <Pressable
              accessibilityLabel={t('postpartumCycleReturn.period.recordedRowAccessibilityLabel')}
              accessibilityRole="button"
              onPress={() => setPickerVisible(true)}
              style={({ pressed }) => [
                styles.lastPeriodRow,

                pressed && styles.pressed,
              ]}
            >
              <View style={styles.lastPeriodIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="history" size={17} />
              </View>

              <View style={styles.flexCopy}>
                <AwaText variant="labelSmall">{t('postpartumCycleReturn.period.recordedLabel')}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.lastPeriodValue}>
                  {hasReturned && firstPeriodDate
                    ? formatFullDate(firstPeriodDate)
                    : t('postpartumCycleReturn.period.noDate')}
                </AwaText>
              </View>

              <MaterialDesignIcons
                color={theme.colors.textSecondary}
                name="chevron-right"
                size={18}
              />
            </Pressable>
          </View>

          {/* ==================================================
              FACTORS
          =================================================== */}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chart-timeline-variant"
                  size={20}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <AwaText variant="titleSmall">{t('postpartumCycleReturn.factors.sectionTitle')}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionSubtitle}>
                  {t('postpartumCycleReturn.factors.sectionSubtitle')}
                </AwaText>
              </View>
            </View>

            <View style={styles.hormonalEducation}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="information-outline"
                size={17}
              />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.hormonalEducationText}>
                {t('postpartumCycleReturn.factors.educationText')}
              </AwaText>
            </View>

            <AwaText variant="labelSmall" colorRole="primary" style={styles.trackedContextLabel}>{t('postpartumCycleReturn.factors.trackedContextLabel')}</AwaText>

            <View style={styles.factorContainer}>
              <FactorRow
                styles={styles}
                theme={theme}
                description={t('postpartumCycleReturn.factors.feeding.description')}
                icon="baby-face-outline"
                onPress={() =>
                  navigation.navigate('PostpartumFeeding', {mode: 'edit'})
                }
                title={t('postpartumCycleReturn.factors.feeding.title')}
                value={feedingLabel}
              />

              <FactorRow
                styles={styles}
                theme={theme}
                description={t('postpartumCycleReturn.factors.cycleReturn.description')}
                icon="calendar-heart"
                title={t('postpartumCycleReturn.factors.cycleReturn.title')}
                value={
                  hasReturned && firstPeriodDate
                    ? formatFullDate(firstPeriodDate)
                    : t('postpartumCycleReturn.factors.cycleReturn.notReturned')
                }
              />

              <FactorRow
                styles={styles}
                theme={theme}
                description={t('postpartumCycleReturn.factors.amenorrhea.description')}
                icon="calendar-remove-outline"
                onPress={showAmenorrheaInfo}
                title={t('postpartumCycleReturn.factors.amenorrhea.title')}
                value={hasReturned ? t('postpartumCycleReturn.factors.amenorrhea.finished') : t('postpartumCycleReturn.factors.amenorrhea.ongoing')}
              />

              <FactorRow
                styles={styles}
                theme={theme}
                description={t('postpartumCycleReturn.factors.sleep.description')}
                icon="weather-night"
                onPress={() =>
                  navigation.navigate('PostpartumJournalEntry', {
                    category: 'sleep',
                  })
                }
                title={t('postpartumCycleReturn.factors.sleep.title')}
                value={latestSleep ?? t('postpartumCycleReturn.notProvided')}
              />

              <FactorRow
                styles={styles}
                theme={theme}
                description={t('postpartumCycleReturn.factors.mood.description')}
                icon="flower-outline"
                onPress={() =>
                  navigation.navigate('PostpartumJournalEntry', {
                    category: 'mood',
                  })
                }
                title={t('postpartumCycleReturn.factors.mood.title')}
                value={latestMood ?? t('postpartumCycleReturn.notProvided')}
              />

              <FactorRow
                styles={styles}
                theme={theme}
                description={t('postpartumCycleReturn.factors.fatigue.description')}
                icon="lightning-bolt-outline"
                last
                onPress={() =>
                  navigation.navigate('PostpartumJournalEntry', {
                    category: 'fatigue',
                  })
                }
                title={t('postpartumCycleReturn.factors.fatigue.title')}
                value={latestFatigue ?? t('postpartumCycleReturn.notProvided')}
              />
            </View>
          </View>

          {/* ==================================================
              TIMELINE
          =================================================== */}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="timeline-clock-outline"
                  size={20}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <AwaText variant="titleSmall">{t('postpartumCycleReturn.timeline.sectionTitle')}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionSubtitle}>
                  {t('postpartumCycleReturn.timeline.sectionSubtitle')}
                </AwaText>
              </View>
            </View>

            <View style={styles.timelineList}>
              {EVOLUTION_STAGE_KEYS.map((stage, index) => (
                <View key={stage.rangeKey} style={styles.timelineItem}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot}>
                      <MaterialDesignIcons
                        color={theme.colors.primary}
                        name={stage.icon}
                        size={16}
                      />
                    </View>

                    {index < EVOLUTION_STAGE_KEYS.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRangeBadge}>
                      <AwaText variant="labelSmall" colorRole="primary">{t(stage.rangeKey)}</AwaText>
                    </View>

                    <AwaText variant="labelSmall" style={styles.timelineText}>{t(stage.labelKey)}</AwaText>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.timelineDisclaimer}>
              <MaterialDesignIcons
                color={theme.colors.textSecondary}
                name="information-outline"
                size={15}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineDisclaimerText}>
                {t('postpartumCycleReturn.timeline.disclaimer')}
              </AwaText>
            </View>
          </View>

          {/* ==================================================
              REMINDER
          =================================================== */}

          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="heart-outline"
                size={20}
              />
            </View>

            <View style={styles.flexCopy}>
              <AwaText variant="labelSmall" colorRole="primary">{t('postpartumCycleReturn.reminder.eyebrow')}</AwaText>

              <AwaText variant="labelSmall" style={styles.reminderTitle}>{t('postpartumCycleReturn.reminder.title')}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.reminderText}>
                {t('postpartumCycleReturn.reminder.text')}
              </AwaText>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ======================================================
          CALENDAR
      ======================================================= */}

      <Modal
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={helpModalVisible}
      >
        <View style={styles.helpModalOverlay}>
          <Pressable
            accessibilityLabel={t('postpartumCycleReturn.helpModal.closeAccessibilityLabel')}
            onPress={() => setHelpModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />

          <AwaCard padding="none" variant="elevated" accessibilityRole="alert" style={styles.helpModalCard}>
            <View style={styles.helpModalIconWrap}>
              <View style={styles.helpModalIconHalo}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="help-circle-outline"
                  size={36}
                />
              </View>
            </View>

            <AwaText variant="headlineSmall" style={styles.helpModalTitle}>{t('postpartumCycleReturn.factors.amenorrhea.title')}</AwaText>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.helpModalText}>
              {t('postpartumCycleReturn.helpModal.text')}
            </AwaText>

            <View style={styles.helpModalInfoBox}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="information-outline"
                size={18}
              />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.helpModalInfoText}>
                {t('postpartumCycleReturn.helpModal.infoText')}
              </AwaText>
            </View>

            <AwaButton
              accessibilityRole="button"
              onPress={() => setHelpModalVisible(false)}
              label={t('postpartumCycleReturn.helpModal.button')}
              style={styles.helpModalButton}
            />
          </AwaCard>
        </View>
      </Modal>

      <InlineCalendarPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={date => {
          setPickerVisible(false);

          confirmPeriodDate(date);
        }}
        subtitle={t('postpartumCycleReturn.picker.subtitle')}
        title={t('postpartumCycleReturn.picker.title')}
        maximumDate={startOfDay(new Date())}
        value={firstPeriodDate ?? deliveryDate ?? new Date()}
        visible={pickerVisible}
      />
      <PostpartumConsistencyModal
        visible={consistencyWarning !== null}
        title={
          consistencyWarning === 'lochia-active'
            ? t('postpartumCycleReturn.consistency.lochiaActiveTitle')
            : t('postpartumCycleReturn.consistency.dateCheckTitle')
        }
        message={
          consistencyWarning === 'before-delivery'
            ? t('postpartumCycleReturn.consistency.beforeDeliveryMessage')
            : consistencyWarning === 'date-order'
            ? t('postpartumCycleReturn.consistency.dateOrderMessage')
            : t('postpartumCycleReturn.consistency.lochiaActiveMessage')
        }
        infoText={
          consistencyWarning === 'before-delivery'
            ? t('postpartumCycleReturn.consistency.beforeDeliveryInfo')
            : consistencyWarning === 'date-order'
            ? t('postpartumCycleReturn.consistency.dateOrderInfo')
            : t('postpartumCycleReturn.consistency.lochiaActiveInfo')
        }
        primaryLabel={
          consistencyWarning === 'before-delivery'
            ? t('postpartumCycleReturn.consistency.editDate')
            : t('postpartumCycleReturn.consistency.viewLochia')
        }
        onPrimary={() => {
          setConsistencyWarning(null);
          if (consistencyWarning === 'before-delivery') {
            setPickerVisible(true);
            return;
          }
          navigation.navigate('PostpartumLochia');
        }}
        onSecondary={() => setConsistencyWarning(null)}
        onRequestClose={() => setConsistencyWarning(null)}
      />
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flexCopy: {
    flex: 1,
    minWidth: 0,
  },

  pressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  content: {
    paddingHorizontal: 16,

    /*
     * Petit espace supplémentaire entre
     * le header et la première carte.
     */
    paddingTop: 9,
  },

  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    minHeight: 78,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,

    /*
     * paddingTop dynamique ajouté dans le composant.
     */
    paddingBottom: 11,

    backgroundColor: theme.colors.background,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,

    alignItems: 'center',

    marginHorizontal: 10,
  },


  headerTitle: {marginTop: 2, textAlign: 'center'},

  headerSpacer: {
    width: 42,
  },

  /* ==========================================================
     HERO STATUS
  ========================================================== */

  statusHero: {
    ...theme.shadow,

    position: 'relative',
    overflow: 'hidden',

    padding: 18,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 12,

    backgroundColor: theme.colors.surface,
  },

  returnedBackground: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },



  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 14,
  },

  statusHeroIcon: {
    width: 55,
    height: 55,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  statusHeroIconReturned: {
    backgroundColor: theme.colors.primarySoft,
  },

  infoButton: {
    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: withAlpha(theme.colors.surface, 0.9),
  },

  statusEyebrow: {},

  // Applied only while the fixed cycle-returned illustration is showing
  // behind this text (see the hero JSX's hasReturned check) — the
  // illustration's own always-light tone, never the active theme.
  statusEyebrowOnIllustration: {
    color: HERO_ILLUSTRATION_TEXT,
  },

  statusValue: {
    marginTop: 4,

    color: theme.colors.text,

    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
  },

  statusValueOnIllustration: {color: HERO_ILLUSTRATION_TEXT},

  statusDescription: {maxWidth: 300, marginTop: 6},

  // Slightly softened (not faded-out) so the body sentence still reads as
  // secondary to statusValue while keeping strong contrast against the
  // illustration (~7:1, still comfortably AAA).
  statusDescriptionOnIllustration: {
    color: withAlpha(HERO_ILLUSTRATION_TEXT, 0.75),
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    alignSelf: 'flex-start',

    marginTop: 13,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  statusBadgeDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: theme.colors.primary,
  },

  statusBadgeText: {
    color: theme.colors.primary,

    fontSize: 11,
    fontWeight: '800',
  },

  normalPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 9,

    marginTop: 15,

    padding: 12,

    borderRadius: 16,

    backgroundColor: theme.colors.primarySoft,
  },

  normalPanelIcon: {
    width: 31,
    height: 31,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },


  normalPanelText: {marginTop: 2},

  /* ==========================================================
     GENERIC SECTION
  ========================================================== */

  sectionCard: {
    ...theme.shadow,

    marginTop: 13,

    padding: 15,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 12,

    backgroundColor: theme.colors.surface,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 13,
  },

  sectionHeaderIcon: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },


  sectionSubtitle: {marginTop: 2},

  /* ==========================================================
     PERIOD
  ========================================================== */

  periodPanel: {
    minHeight: 75,

    flexDirection: 'row',
    alignItems: 'center',

    padding: 12,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  periodDateIcon: {
    width: 43,
    height: 43,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  periodCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },


  periodValue: {marginTop: 3},

  periodClear: {alignSelf: 'flex-start', marginTop: 8},

  periodAction: {marginLeft: 8},


  lastPeriodRow: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 10,

    paddingHorizontal: 4,
  },

  lastPeriodIcon: {
    width: 34,
    height: 34,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },


  lastPeriodValue: {marginTop: 2},

  /* ==========================================================
     FACTORS
  ========================================================== */

  hormonalEducation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  hormonalEducationText: {flex: 1},

  trackedContextLabel: {marginBottom: 7},

  factorContainer: {
    overflow: 'hidden',

    borderRadius: 16,

    backgroundColor: theme.colors.surface,
  },

  factorRow: {
    minHeight: 78,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 10,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: theme.colors.border,
  },

  factorRowLast: {
    borderBottomWidth: 0,
  },

  factorIcon: {
    width: 40,
    height: 40,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },


  factorValue: {marginTop: 2},

  factorDescription: {marginTop: 2},

  factorChevron: {
    width: 28,
    height: 28,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 6,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  /* ==========================================================
     TIMELINE
  ========================================================== */

  timelineList: {
    marginTop: 2,
  },

  timelineItem: {
    minHeight: 70,

    flexDirection: 'row',
  },

  timelineRail: {
    width: 42,

    alignItems: 'center',
  },

  timelineDot: {
    width: 34,
    height: 34,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  timelineLine: {
    flex: 1,

    width: 1,

    marginVertical: 3,

    borderLeftWidth: 1.3,
    borderStyle: 'dashed',
    borderLeftColor: withAlpha(theme.colors.primary, 0.28),
  },

  timelineContent: {
    flex: 1,
    minWidth: 0,

    paddingLeft: 7,
    paddingBottom: 15,
  },

  timelineRangeBadge: {
    alignSelf: 'flex-start',

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },


  timelineText: {marginTop: 5},

  timelineDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 7,

    marginTop: 3,

    padding: 12,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  timelineDisclaimerText: {flex: 1},

  // Fixed — a modal dim/scrim, not a surface; overlay dims stay dark
  // regardless of the resolved theme so the sheet above it always pops
  // (same PostpartumDashboard nifasModalOverlay precedent).
  helpModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,20,69,0.40)',
    paddingHorizontal: 22,
  },

  helpModalCard: {width: '100%', maxWidth: 390, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18},

  helpModalIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },

  helpModalIconHalo: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 37,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },

  helpModalTitle: {textAlign: 'center'},

  helpModalText: {marginTop: 10, textAlign: 'center'},

  helpModalInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  helpModalInfoText: {flex: 1},

  helpModalButton: {marginTop: 18},


  /* ==========================================================
     REMINDER
  ========================================================== */

  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 11,

    marginTop: 13,

    padding: 14,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,
  },

  reminderIcon: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: theme.colors.surface,
  },


  reminderTitle: {marginTop: 2},

  reminderText: {marginTop: 3},
  });
}

export default PostpartumCycleReturnScreen;
