import React, {memo, useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {homeColors} from './homeTheme';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {dateFormatLocale} from '../../utils/cycleMath';
import {formatClockTimeInZone} from '../../utils/timeOfDay';
import type {PrayerWindow} from '../../services/prayerTimes';
import {
  nifasReferenceApproachingHeadline,
  nifasReferenceReachedHeadline,
} from '../../config/nifasReminderConfig';
import type {PurityPrayerResult} from '../../utils/purityPrayerLogic';
import '../../i18n';

// ============================================================================
// PHASE C — SEMANTIC vs THEMEABLE COLORS IN THIS FILE
// ============================================================================
// The "Menstrues"/"Pureté" status badge (and its accompanying purity-summary
// block) encode real menstrual/religious status — a health+religious
// meaning — and are DELIBERATELY left exactly as they were, still sourced
// from `homeColors.green`/`homeColors.greenLight` and the fixed rose
// '#A8505A'/'#F5DEDE' pair, never `theme.colors.*`. Switching from Rose
// Quartz to Sage Serenity must not change what "Pureté" or "Menstrues" look
// like. Everything else (card chrome, generic info blocks, the "Actif"
// feature-status badge, Nifas education/reminder cards) is decorative and
// now theme-driven.

type Props = {
  /**
   * 'cycle' (default) shows the full existing section — menstruation/
   * purity badge, purity-restored summary, and the qadaa (period-dependent
   * fasting catch-up) info block.
   *
   * 'pregnancy', 'postpartum', 'miscarriage', 'contraception' and 'menopause'
   * all hide those three: none of them must ever display menstrual purity
   * status or period-derived qadaa.
   */
  objective?: 'cycle' | 'pregnancy' | 'postpartum' | 'miscarriage' | 'contraception' | 'menopause';

  hijriDate?: string;
  nextWindow?: PrayerWindow;
  timezone?: string;
  locationName?: string;
  prayerLoading?: boolean;
  prayerError?: boolean;
  qadaaDays?: number;
  isMenstruating?: boolean;
  purityResult?: PurityPrayerResult;
  periodEndDateTime?: Date | null;

  /**
   * Postpartum-only neutral tracking line.
   * Example:
   * "Jour 4 · Pertes en cours"
   */
  nifasValue?: string;

  /**
   * Neutral product-reference reminder calculated from persisted
   * postpartum + lochia data by the caller.
   */
  nifasReminderStatus?: 'none' | 'approaching' | 'reference_reached';

  locationConfigured: boolean;
  onPressNifas?: () => void;
  onPressPuritySummary?: () => void;
};

// Instant in the prayer location's zone, 24-hour: hourCycle h23 so 00:05 is never "24:05" under en-US.
const formatTime = (date: Date, timezone?: string) => formatClockTimeInZone(date, dateFormatLocale(), timezone);

function InfoBlock({
  icon,
  label,
  value,
  theme,
  styles,
}: {
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
  value: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.infoBlock}>
      <MaterialDesignIcons
        color={theme.colors.primary}
        name={icon}
        size={19}
      />

      <AwaText colorRole="onSurfaceVariant" style={styles.infoLabel} variant="labelSmall">
        {label}
      </AwaText>

      {/*
       * IMPORTANT:
       * Pas de numberOfLines ici.
       *
       * Ainsi, "Jour 3 · Pertes en cours" peut passer
       * sur plusieurs lignes sans être coupé.
       */}
      <AwaText emphasized style={styles.infoValue} variant="labelMedium">
        {value}
      </AwaText>
    </View>
  );
}

function SpiritualGuidanceCard({
  objective = 'cycle',
  hijriDate,
  nextWindow,
  timezone,
  locationName,
  prayerLoading = false,
  prayerError = false,
  qadaaDays = 0,
  isMenstruating = false,
  purityResult,
  periodEndDateTime,
  nifasValue,
  nifasReminderStatus = 'none',
  locationConfigured,
  onPressNifas,
  onPressPuritySummary,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isCycle = objective === 'cycle';
  const isPostpartum = objective === 'postpartum';

  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduceMotion ? 0 : 430,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [entrance]);

  const prayerAvailable = Boolean(nextWindow);

  const prayerValue = !locationConfigured
    ? t('spiritualGuidance.locationRequired')
    : prayerLoading
      ? t('spiritualGuidance.calculating')
      : prayerError
        ? t('spiritualGuidance.prayerTimesUnavailable')
        : prayerAvailable && nextWindow
          ? `${nextWindow.name} · ${formatTime(nextWindow.start, timezone)}`
          : t('spiritualGuidance.unavailable');

  const showPuritySummary =
    isCycle &&
    !isMenstruating &&
    purityResult?.status === 'pure' &&
    Boolean(periodEndDateTime);

  /**
   * Deux concepts différents :
   *
   * - InfoBlock "Prochaine prière" :
   *   prochaine prière par rapport à maintenant.
   *
   * - Résumé de pureté :
   *   première prière après le moment exact
   *   où la pureté a été retrouvée.
   */
  const purityPrimaryLine = periodEndDateTime
    ? t('spiritualGuidance.purityRestoredAt', {time: formatTime(periodEndDateTime, timezone)})
    : '';

  const nextPrayerAfterPurityLine =
    purityResult?.prayerDue && purityResult.prayerName
      ? t('spiritualGuidance.prayerDue', {prayerName: purityResult.prayerName})
      : purityResult?.nextPrayerName && purityResult.nextPrayerTime
        ? t('spiritualGuidance.firstPrayerAfterPurity', {
            prayerName: purityResult.nextPrayerName,
            time: formatTime(purityResult.nextPrayerTime, timezone),
          })
        : '';

  const puritySummaryAccessibilityLabel = [
    purityPrimaryLine,
    nextPrayerAfterPurityLine,
  ]
    .filter(Boolean)
    .join('. ');

  const cardAccessibilityLabel = isCycle
    ? t('spiritualGuidance.accessibilityCycle', {
        status: isMenstruating ? t('spiritualGuidance.menstruating') : t('spiritualGuidance.pure'),
      })
    : t('spiritualGuidance.accessibilityOther');

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
            {
              scale: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}>
      <AwaCard accessibilityLabel={cardAccessibilityLabel} style={styles.cardSurface}>
      {/* Header */}
      <View style={styles.headingRow}>
        <AwaText style={styles.title} variant="titleMedium">
          {t('spiritualGuidance.title')}
        </AwaText>
      </View>

      {/* Badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, styles.activeBadge]}>
          <Text style={styles.activeBadgeText}>
            {t('spiritualGuidance.active')}
          </Text>
        </View>

        {isCycle ? (
          <View
            style={[
              styles.badge,
              isMenstruating
                ? styles.periodBadge
                : styles.purityBadge,
            ]}>
            <MaterialDesignIcons
              color={
                isMenstruating
                  ? '#A8505A'
                  : homeColors.green
              }
              name={
                isMenstruating
                  ? 'flower-outline'
                  : 'shield-check-outline'
              }
              size={13}
            />

            <Text
              style={[
                styles.badgeText,
                isMenstruating
                  ? styles.periodText
                  : styles.purityText,
              ]}>
              {isMenstruating ? t('spiritualGuidance.menstruating') : t('spiritualGuidance.pure')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Localisation */}
      <View style={styles.locationRow}>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name="map-marker-outline"
          size={15}
        />

        <AwaText colorRole="onSurfaceVariant" style={styles.locationText} variant="bodySmall">
          {locationName ?? t('spiritualGuidance.locationPlaceholder')}
        </AwaText>
      </View>

      {/* Informations principales */}
      <View style={styles.body}>
        <InfoBlock
          icon="alarm"
          label={t('spiritualGuidance.nextPrayerLabel')}
          styles={styles}
          theme={theme}
          value={prayerValue}
        />

        <View style={styles.separator} />

        <InfoBlock
          icon="calendar-month-outline"
          label={t('spiritualGuidance.hijriDateLabel')}
          styles={styles}
          theme={theme}
          value={hijriDate ?? t('spiritualGuidance.unavailable')}
        />

        {isCycle ? (
          <>
            <View style={styles.separator} />

            <InfoBlock
              icon="silverware-fork-knife"
              label={t('cycleHome.quickActions.qadaa')}
              styles={styles}
              theme={theme}
              value={qadaaDays > 0 ? t('spiritualGuidance.daysCount', {count: qadaaDays}) : t('spiritualGuidance.upToDate')}
            />
          </>
        ) : null}

        {isPostpartum && nifasValue ? (
          <>
            <View style={styles.separator} />

            <InfoBlock
              icon="flower-outline"
              label={t('spiritualGuidance.nifasLabel')}
              styles={styles}
              theme={theme}
              value={nifasValue}
            />
          </>
        ) : null}
      </View>

      {/* Résumé pureté - Cycle seulement */}
      {showPuritySummary ? (
        <Pressable
          accessibilityLabel={puritySummaryAccessibilityLabel}
          accessibilityRole="button"
          onPress={onPressPuritySummary}
          style={({pressed}) => [
            styles.puritySummary,
            pressed && styles.pressed,
          ]}>
          <View style={styles.purityCheckCircle}>
            <MaterialDesignIcons
              color={homeColors.green}
              name="check"
              size={13}
            />
          </View>

          <View style={styles.puritySummaryCopy}>
            <Text style={styles.puritySummaryPrimary}>
              {purityPrimaryLine}
            </Text>

            {nextPrayerAfterPurityLine ? (
              <Text style={styles.puritySummarySecondary}>
                {nextPrayerAfterPurityLine}
              </Text>
            ) : null}
          </View>

          <MaterialDesignIcons
            color={theme.colors.textSecondary}
            name="chevron-right"
            size={17}
          />
        </Pressable>
      ) : null}

      {/* Carte éducative Nifas */}
      {isPostpartum && nifasValue ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressNifas}
          style={({pressed}) => [
            styles.nifasEducation,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="book-open-page-variant-outline"
            size={17}
          />

          <View style={styles.nifasEducationCopy}>
            <AwaText emphasized variant="labelLarge">
              {t('spiritualGuidance.understandNifas')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" style={styles.nifasEducationText} variant="bodySmall">
              {t('spiritualGuidance.nifasDisclaimer')}
            </AwaText>
          </View>

          <MaterialDesignIcons
            color={theme.colors.textSecondary}
            name="chevron-right"
            size={18}
          />
        </Pressable>
      ) : null}

      {/* Rappel Nifas */}
      {isPostpartum && nifasReminderStatus !== 'none' ? (
        <Pressable
          accessibilityLabel={t('spiritualGuidance.nifasReminderAccessibility')}
          accessibilityRole="button"
          onPress={onPressNifas}
          style={({pressed}) => [
            styles.nifasReminder,
            pressed && styles.pressed,
          ]}>
          <View style={styles.nifasReminderIcon}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="bell-outline"
              size={18}
            />
          </View>

          <View style={styles.nifasReminderCopy}>
            <AwaText emphasized variant="labelLarge">
              {t('spiritualGuidance.nifasReminderTitle')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" style={styles.nifasReminderText} variant="bodySmall">
              {nifasReminderStatus === 'reference_reached'
                ? `${nifasReferenceReachedHeadline()}.`
                : `${nifasReferenceApproachingHeadline()}.`}
            </AwaText>
          </View>

          <AwaText colorRole="primary" emphasized style={styles.nifasReminderLink} variant="labelMedium">
            {nifasReminderStatus === 'reference_reached'
              ? t('spiritualGuidance.consult')
              : t('spiritualGuidance.learnMore')}
          </AwaText>
        </Pressable>
      ) : null}
      </AwaCard>
    </Animated.View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
    },

    cardSurface: {
      overflow: 'hidden',
    },

    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    title: {
      flex: 1,
      minWidth: 0,
    },

    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },

    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },

    // Generic "this feature is on" status chip — not itself a menstrual/
    // religious status value (that's the period/purity badge below), so it
    // follows the theme's own success token.
    activeBadge: {
      backgroundColor: theme.colors.success,
    },

    activeBadgeText: {
      color: pickReadableTextColor(theme.colors.success),
      fontSize: 11,
      fontWeight: '700',
    },

    // SEMANTIC — menstrual status, never theme-driven (see file header note).
    periodBadge: {
      backgroundColor: '#F5DEDE',
    },

    purityBadge: {
      backgroundColor: homeColors.greenLight,
    },

    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    periodText: {
      color: '#A8505A',
    },

    purityText: {
      color: homeColors.green,
    },

    locationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 5,
      marginTop: 12,
      paddingHorizontal: 4,
    },

    locationText: {
      flex: 1,
      minWidth: 0,
    },

    /**
     * IMPORTANT:
     * Les blocs restent sur une seule ligne mais chacun
     * peut réduire sa largeur proprement.
     */
    body: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: 14,
    },

    /**
     * minWidth: 0 est important en React Native
     * lorsque plusieurs éléments flexibles sont côte à côte.
     */
    infoBlock: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      paddingHorizontal: 2,
    },

    infoLabel: {
      marginTop: 6,
      textAlign: 'center',
    },

    /**
     * Pas de hauteur fixe.
     * Pas de numberOfLines.
     *
     * Cela permet :
     *
     * Jour 3 · Pertes
     * en cours
     *
     * ou même 3 lignes sur un très petit écran.
     */
    infoValue: {
      width: '100%',
      flexShrink: 1,
      marginTop: 3,
      textAlign: 'center',
    },

    separator: {
      width: StyleSheet.hairlineWidth,
      marginHorizontal: 4,
      backgroundColor: theme.colors.border,
    },

    pressed: {
      opacity: 0.7,
    },

    // SEMANTIC — same purity-confirmed language as the badge above, never
    // theme-driven, except the neutral white icon backdrop below.
    puritySummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      width: '100%',
      marginTop: 14,
      borderRadius: 16,
      backgroundColor: homeColors.greenLight,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    purityCheckCircle: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      flexShrink: 0,
    },

    puritySummaryCopy: {
      flex: 1,
      minWidth: 0,
      flexShrink: 1,
    },

    puritySummaryPrimary: {
      color: '#1F5C34',
      fontSize: 12.5,
      fontWeight: '700',
      lineHeight: 17,
    },

    puritySummarySecondary: {
      marginTop: 2,
      color: '#3E7A54',
      fontSize: 11.5,
      fontWeight: '600',
      lineHeight: 15,
    },

    nifasEducation: {
      marginTop: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    nifasEducationCopy: {
      flex: 1,
      minWidth: 0,
    },

    nifasEducationText: {
      marginTop: 2,
    },

    nifasReminder: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    nifasReminderIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.colors.primarySoft,
      flexShrink: 0,
    },

    nifasReminderCopy: {
      flex: 1,
      minWidth: 0,
    },

    nifasReminderText: {
      marginTop: 2,
    },

    nifasReminderLink: {
      flexShrink: 0,
    },
  });
}

export default memo(SpiritualGuidanceCard);
