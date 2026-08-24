import React, {memo, useEffect, useRef} from 'react';
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

import {homeColors, homeRadii, homeShadow} from './homeTheme';
import type {PrayerWindow} from '../../services/prayerTimes';
import type {PurityPrayerResult} from '../../utils/purityPrayerLogic';

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
  onManage?: () => void;
  onPressNifas?: () => void;
  onPressPuritySummary?: () => void;
};

const formatTime = (date: Date, timezone?: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    ...(timezone ? {timeZone: timezone} : {}),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoBlock}>
      <MaterialDesignIcons
        color={homeColors.primary}
        name={icon}
        size={19}
      />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      {/*
       * IMPORTANT:
       * Pas de numberOfLines ici.
       *
       * Ainsi, "Jour 3 · Pertes en cours" peut passer
       * sur plusieurs lignes sans être coupé.
       */}
      <Text style={styles.infoValue}>
        {value}
      </Text>
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
  onManage,
  onPressNifas,
  onPressPuritySummary,
}: Props): React.JSX.Element {
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
    ? 'Localisation requise'
    : prayerLoading
      ? 'Calcul en cours…'
      : prayerError
        ? 'Horaires momentanément indisponibles'
        : prayerAvailable && nextWindow
          ? `${nextWindow.name} · ${formatTime(nextWindow.start, timezone)}`
          : 'Indisponible';

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
    ? `Pureté retrouvée à ${formatTime(periodEndDateTime, timezone)}`
    : '';

  const nextPrayerAfterPurityLine =
    purityResult?.prayerDue && purityResult.prayerName
      ? `${purityResult.prayerName} est due`
      : purityResult?.nextPrayerName && purityResult.nextPrayerTime
        ? `1re prière après la pureté : ${
            purityResult.nextPrayerName
          } · ${formatTime(purityResult.nextPrayerTime, timezone)}`
        : '';

  const puritySummaryAccessibilityLabel = [
    purityPrimaryLine,
    nextPrayerAfterPurityLine,
  ]
    .filter(Boolean)
    .join('. ');

  const cardAccessibilityLabel = isCycle
    ? `Repères spirituels. Statut ${
        isMenstruating ? 'Menstrues' : 'Pureté'
      }.`
    : 'Repères spirituels.';

  return (
    <Animated.View
      accessibilityLabel={cardAccessibilityLabel}
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
      {/* Watermark */}
      <MaterialDesignIcons
        color={homeColors.lightLavender}
        name="mosque"
        size={110}
        style={styles.watermark}
      />

      {/* Header */}
      <View style={styles.headingRow}>
        <View style={styles.mosqueCircle}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name="mosque"
            size={22}
          />
        </View>

        <Text style={styles.title}>
          Repères spirituels
        </Text>

        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onManage}
          style={({pressed}) => pressed && styles.pressed}>
          <Text style={styles.manageLink}>
            Voir mes repères
          </Text>
        </Pressable>
      </View>

      {/* Badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, styles.activeBadge]}>
          <Text style={styles.activeBadgeText}>
            Actif
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
              {isMenstruating ? 'Menstrues' : 'Pureté'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Localisation */}
      <View style={styles.locationRow}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name="map-marker-outline"
          size={15}
        />

        <Text style={styles.locationText}>
          {locationName ??
            'Configure ta localisation pour des horaires précis'}
        </Text>
      </View>

      {/* Informations principales */}
      <View style={styles.body}>
        <InfoBlock
          icon="alarm"
          label="Prochaine prière"
          value={prayerValue}
        />

        <View style={styles.separator} />

        <InfoBlock
          icon="calendar-month-outline"
          label="Date Hijri"
          value={hijriDate ?? 'Indisponible'}
        />

        {isCycle ? (
          <>
            <View style={styles.separator} />

            <InfoBlock
              icon="silverware-fork-knife"
              label="Jeûnes à rattraper"
              value={qadaaDays > 0 ? `${qadaaDays} jours` : 'À jour'}
            />
          </>
        ) : null}

        {isPostpartum && nifasValue ? (
          <>
            <View style={styles.separator} />

            <InfoBlock
              icon="flower-outline"
              label="Nifas"
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
            <Text
              numberOfLines={1}
              style={styles.puritySummaryPrimary}>
              {purityPrimaryLine}
            </Text>

            {nextPrayerAfterPurityLine ? (
              <Text
                numberOfLines={2}
                style={styles.puritySummarySecondary}>
                {nextPrayerAfterPurityLine}
              </Text>
            ) : null}
          </View>

          <MaterialDesignIcons
            color={homeColors.textSecondary}
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
            color={homeColors.primary}
            name="book-open-page-variant-outline"
            size={17}
          />

          <View style={styles.nifasEducationCopy}>
            <Text style={styles.nifasEducationTitle}>
              Comprendre le nifas
            </Text>

            <Text style={styles.nifasEducationText}>
              Les références juridiques peuvent varier selon les écoles.
            </Text>
          </View>

          <MaterialDesignIcons
            color={homeColors.textSecondary}
            name="chevron-right"
            size={18}
          />
        </Pressable>
      ) : null}

      {/* Rappel Nifas */}
      {isPostpartum && nifasReminderStatus !== 'none' ? (
        <Pressable
          accessibilityLabel="Consulter le repère du nifas"
          accessibilityRole="button"
          onPress={onPressNifas}
          style={({pressed}) => [
            styles.nifasReminder,
            pressed && styles.pressed,
          ]}>
          <View style={styles.nifasReminderIcon}>
            <MaterialDesignIcons
              color={homeColors.primary}
              name="bell-outline"
              size={18}
            />
          </View>

          <View style={styles.nifasReminderCopy}>
            <Text style={styles.nifasReminderTitle}>
              Repère du nifas
            </Text>

            <Text style={styles.nifasReminderText}>
              {nifasReminderStatus === 'reference_reached'
                ? 'Le repère présenté par AWA a été atteint.'
                : 'Le repère présenté par AWA approche.'}
            </Text>
          </View>

          <Text style={styles.nifasReminderLink}>
            {nifasReminderStatus === 'reference_reached'
              ? 'Consulter'
              : 'En savoir plus'}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },

  watermark: {
    position: 'absolute',
    right: -22,
    bottom: -22,
    opacity: 0.5,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mosqueCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: homeColors.lightLavender,
  },

  title: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },

  manageLink: {
    color: homeColors.primary,
    fontSize: 11.5,
    fontWeight: '700',
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginLeft: 50,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  activeBadge: {
    backgroundColor: homeColors.greenLight,
  },

  activeBadgeText: {
    color: homeColors.green,
    fontSize: 10.5,
    fontWeight: '700',
  },

  periodBadge: {
    backgroundColor: '#F5DEDE',
  },

  purityBadge: {
    backgroundColor: homeColors.greenLight,
  },

  badgeText: {
    fontSize: 10.5,
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
    color: homeColors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
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
    color: homeColors.textSecondary,
    fontSize: 9.5,
    lineHeight: 13,
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
    color: homeColors.textPrimary,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  separator: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 4,
    backgroundColor: homeColors.cardBorder,
  },

  pressed: {
    opacity: 0.7,
  },

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
    backgroundColor: '#FFFFFF',
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
    borderRadius: 15,
    backgroundColor: '#F4EEFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  nifasEducationCopy: {
    flex: 1,
    minWidth: 0,
  },

  nifasEducationTitle: {
    color: homeColors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  nifasEducationText: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },

  nifasReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E6D9F8',
    borderRadius: 15,
    backgroundColor: '#FBF8FF',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  nifasReminderIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F0E7FC',
    flexShrink: 0,
  },

  nifasReminderCopy: {
    flex: 1,
    minWidth: 0,
  },

  nifasReminderTitle: {
    color: homeColors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  nifasReminderText: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },

  nifasReminderLink: {
    flexShrink: 0,
    color: homeColors.primary,
    fontSize: 9.5,
    fontWeight: '800',
  },
});

export default memo(SpiritualGuidanceCard);