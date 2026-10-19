import React, {memo, useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {dateFormatLocale} from '../../utils/cycleMath';
import {formatClockTimeInZone} from '../../utils/timeOfDay';
import {displayUpperCase} from '../../utils/textCase';
import type {PrayerWindow} from '../../services/prayerTimes';

const PRAYER_IMAGE = require('../../assets/images/priere.png');
const PRAYER_IMAGE_RATIO = 1536 / 1024;

type Props = {
  window?: PrayerWindow;
  timezone?: string;
  loading: boolean;
  error: boolean;
  now: Date;
};

// Instant in the prayer location's zone, 24-hour: hourCycle h23 so 00:05 is never "24:05" under en-US.
const formatTime = (date: Date, timezone?: string) => formatClockTimeInZone(date, dateFormatLocale(), timezone);

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const formatCountdown = (t: TranslateFn, targetMs: number, nowMs: number): string => {
  const totalMinutes = Math.max(0, Math.ceil((targetMs - nowMs) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {return t('prayerTimes.countdownMinutes', {minutes});}
  if (minutes === 0) {return t('prayerTimes.countdownHours', {hours});}
  return t('prayerTimes.countdownHoursMinutes', {hours, minutes: minutes.toString().padStart(2, '0')});
};

function NextPrayerCard({window, timezone, loading, error, now}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Material 3 migration: the continuous "breathing" loop on the illustration was removed (motion for its own sake).
  return (
    <AwaCard padding="none" style={styles.card} variant="filled">
      <Image resizeMode="contain" source={PRAYER_IMAGE} style={styles.prayerImage} />

      <AwaText colorRole="onSurfaceVariant" variant="labelMedium" style={styles.eyebrow}>{displayUpperCase(t('spiritualGuidance.nextPrayerLabel'))}</AwaText>

      {window ? (
        <>
          <AwaText variant="headlineMedium" style={styles.name}>{window.name}</AwaText>
          <AwaText variant="titleLarge" style={styles.time}>{formatTime(window.start, timezone)}</AwaText>

          <View style={styles.countdownPill}>
            <MaterialDesignIcons color={theme.colors.primary} name="clock-time-four-outline" size={13} />
            <AwaText colorRole="primary" emphasized variant="labelMedium">{formatCountdown(t, window.start.getTime(), now.getTime())}</AwaText>
          </View>

          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.endCaption}>{t('prayerTimes.nextPrayerEndCaption', {time: formatTime(window.end, timezone)})}</AwaText>
        </>
      ) : (
        <AwaText variant="headlineMedium" style={styles.name}>{loading ? t('prayerTimes.calculating') : error ? t('spiritualGuidance.unavailable') : '—'}</AwaText>
      )}
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    prayerImage: {
      width: 96,
      height: 96 / PRAYER_IMAGE_RATIO,
    },
    eyebrow: {marginTop: 14, letterSpacing: 1.4, textTransform: 'uppercase'},
    name: {marginTop: 6, textAlign: 'center'},
    time: {marginTop: 2},
    countdownPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginTop: 14, borderRadius: 12, backgroundColor: theme.colors.surface,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    endCaption: {marginTop: 12},
  });
}

export default memo(NextPrayerCard);
