import React, {memo, useEffect, useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {PurityPrayerResult} from '../../utils/purityPrayerLogic';
import {dateFormatLocale} from '../../utils/cycleMath';
import {formatClockTimeInZone} from '../../utils/timeOfDay';
import {displayUpperCase} from '../../utils/textCase';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type Props = {
  result: PurityPrayerResult;
  periodEndDateTime: Date | null;
  timezone?: string;
  loading: boolean;
  error: boolean;
  onEdit: () => void;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Instant in the prayer location's zone, 24-hour: hourCycle h23 so 00:05 is never "24:05" under en-US.
const formatTime = (date: Date, timezone?: string) => formatClockTimeInZone(date, dateFormatLocale(), timezone);

const formatDeclaredEnd = (t: TranslateFn, date: Date, timezone?: string): string => {
  if (sameDay(date, new Date())) {
    return t('prayerTimes.purity.todayAt', {time: formatTime(date, timezone)});
  }
  const dateLabel = new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long'}).format(date);
  return t('prayerTimes.purity.dateAt', {date: dateLabel, time: formatTime(date, timezone)});
};

function PurityStatusCard({result, periodEndDateTime, timezone, loading, error, onEdit}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Gentle fade + scale whenever the status itself changes (e.g.
  // Menstrues -> Pureté right after confirming the period end) — a calm
  // acknowledgement of the state change, not a re-mount of the subtree.
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = 0;
    scale.value = 0.98;
    opacity.value = withTiming(1, {duration: 320});
    scale.value = withTiming(1, {duration: 320});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.status]);

  const stateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  return (
    <AwaCard variant="outlined">
      <View style={styles.headingRow}>
        <AwaText variant="titleMedium" style={styles.title}>{t('prayerTimes.purity.title')}</AwaText>
        {result.status === 'pure' ? (
          <AwaButton icon="pencil-outline" label={t('prayerTimes.modify')} onPress={onEdit} size="compact" variant="text" />
        ) : null}
      </View>

      <Animated.View style={stateAnimatedStyle}>
        {result.status === 'menstruating' ? (
          <View style={styles.neutralBlock}>
            <View style={styles.discreetRow}>
              <View style={[styles.discreetDot, styles.discreetDotPeriod]} />
              <AwaText variant="titleSmall">{t('prayerTimes.purity.menstruatingLabel')}</AwaText>
            </View>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.neutralHint}>
              {t('prayerTimes.purity.menstruatingHint')}
            </AwaText>
          </View>
        ) : null}

        {result.status === 'unknown' ? (
          <View style={styles.unknownBlock}>
            <View style={styles.discreetRow}>
              <View style={styles.discreetDot} />
              <AwaText variant="titleSmall" style={styles.unknownLabel}>{t('prayerTimes.purity.unknownLabel')}</AwaText>
            </View>
            <AwaButton label={t('prayerTimes.purity.declareButton')} onPress={onEdit} size="compact" />
          </View>
        ) : null}

        {result.status === 'pure' ? (
          <>
            <View style={styles.pureHeadline}>
              <View style={styles.pureCheckCircle}>
                <MaterialDesignIcons color={theme.colors.success} name="check" size={14} />
              </View>
              <View style={styles.pureCopy}>
                <AwaText colorRole="success" variant="titleMedium">{t('prayerTimes.purity.pureTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.pureSubtitle}>
                  {t('prayerTimes.purity.pureSubtitle', {value: periodEndDateTime ? formatDeclaredEnd(t, periodEndDateTime, timezone) : '—'})}
                </AwaText>
              </View>
            </View>

            {result.prayerDue && result.prayerName && result.prayerStart && result.prayerEnd ? (
              <View style={styles.dueSection}>
                <AwaText colorRole="onSurfaceVariant" variant="labelSmall" style={styles.dueLabel}>{displayUpperCase(t('prayerTimes.purity.dueLabel'))}</AwaText>
                <AwaText variant="headlineSmall" style={styles.duePrayerName}>{result.prayerName}</AwaText>
                <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.dueRange}>
                  {formatTime(result.prayerStart, timezone)} → {formatTime(result.prayerEnd, timezone)}
                </AwaText>

                <View style={styles.duePill}>
                  <MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="hand-heart-outline" size={14} />
                  <Text style={styles.duePillText}>{t('prayerTimes.purity.dueBadge', {prayerName: result.prayerName})}</Text>
                </View>

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.dueSubtitle}>
                  {t('prayerTimes.purity.dueSubtitle', {prayerName: result.prayerName})}
                </AwaText>
              </View>
            ) : result.nextPrayerName && result.nextPrayerTime ? (
              <View style={styles.betweenSection}>
                <AwaText variant="bodyMedium">{t('prayerTimes.purity.betweenTitle')}</AwaText>
                <View style={styles.nextAfterPurityBlock}>
                  <AwaText colorRole="onSurfaceVariant" variant="labelSmall" style={styles.nextAfterPurityLabel}>{displayUpperCase(t('prayerTimes.purity.nextAfterPurityLabel'))}</AwaText>
                  <AwaText colorRole="primary" variant="titleMedium" style={styles.nextAfterPurityValue}>
                    {result.nextPrayerName} · {formatTime(result.nextPrayerTime, timezone)}
                  </AwaText>
                </View>
              </View>
            ) : (loading || error) ? (
              <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.pendingNote}>
                {loading ? t('prayerTimes.purity.loadingSchedule') : t('prayerTimes.purity.scheduleUnavailable')}
              </AwaText>
            ) : null}
          </>
        ) : null}
      </Animated.View>
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
    title: {flex: 1, minWidth: 0},

    discreetRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    discreetDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textSecondary},
    // Menstrual-status indicator dot — a semantic/medical period color, not
    // an app-chrome color; deliberately out of scope for the theme-token
    // system (see awaThemeTokens.ts's SCOPE note) and left as the same
    // literal used by every other period indicator in the app.
    discreetDotPeriod: {backgroundColor: '#DC7B82'},

    neutralBlock: {marginTop: 14},
    neutralHint: {marginTop: 8},

    unknownBlock: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14},
    unknownLabel: {flexShrink: 1},

    pureHeadline: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14},
    pureCheckCircle: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: withAlpha(theme.colors.success, 0.18)},
    pureCopy: {flex: 1},
    pureSubtitle: {marginTop: 2},

    dueSection: {marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    dueLabel: {textTransform: 'uppercase', letterSpacing: 0.6},
    duePrayerName: {marginTop: 4},
    dueRange: {marginTop: 2},
    duePill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
      marginTop: 12, borderRadius: 12, backgroundColor: theme.colors.success, paddingHorizontal: 12, paddingVertical: 7,
      maxWidth: '100%',
    },
    // flexShrink: the badge text ("Bugün kılınması gereken namaz: …") must wrap inside the pill, not overflow it.
    duePillText: {flexShrink: 1, color: pickReadableTextColor(theme.colors.success), fontSize: 12.5, fontWeight: '700'},
    dueSubtitle: {marginTop: 10},

    betweenSection: {marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    nextAfterPurityBlock: {marginTop: 12},
    nextAfterPurityLabel: {textTransform: 'uppercase', letterSpacing: 0.6},
    nextAfterPurityValue: {marginTop: 3},

    pendingNote: {marginTop: 14},
  });
}

export default memo(PurityStatusCard);
