import React, {memo, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {FadeInUp} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {dateFormatLocale} from '../../utils/cycleMath';
import {formatClockTimeInZone} from '../../utils/timeOfDay';
import type {PrayerName, PrayerWindow} from '../../services/prayerTimes';

type Props = {
  windows: PrayerWindow[];
  timezone?: string;
  highlightName?: PrayerName;
};

// Instant in the prayer location's zone, 24-hour: hourCycle h23 so 00:05 is never "24:05" under en-US.
const formatTime = (date: Date, timezone?: string) => formatClockTimeInZone(date, dateFormatLocale(), timezone);

function PrayerScheduleList({windows, timezone, highlightName}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AwaCard variant="outlined">
      <View style={styles.headingRow}>
        <AwaText variant="titleMedium" style={styles.title}>{t('prayerTimes.schedule.title')}</AwaText>
        <View style={styles.headingRight}>
          <MaterialDesignIcons color={theme.colors.textSecondary} name="clock-outline" size={13} />
          <AwaText colorRole="onSurfaceVariant" variant="labelSmall">{t('prayerTimes.schedule.localTimes')}</AwaText>
        </View>
      </View>

      {windows.map((window, index) => {
        const active = window.name === highlightName;
        const isLast = index === windows.length - 1;
        return (
          <Animated.View
            entering={FadeInUp.delay(60 + index * 45).duration(320)}
            key={window.name}
            style={[styles.row, active && styles.rowActive]}>
            <View style={styles.timelineColumn}>
              <View style={[styles.dot, active && styles.dotActive]} />
              {!isLast ? <View style={styles.timelineLine} /> : null}
            </View>

            <View style={styles.rowBody}>
              <View style={styles.rowHeadLine}>
                <AwaText colorRole={active ? 'onPrimaryContainer' : 'onSurface'} emphasized style={styles.name} variant="titleSmall">{window.name}</AwaText>
                <AwaText colorRole={active ? 'onPrimaryContainer' : 'onSurface'} emphasized variant="titleMedium">{formatTime(window.start, timezone)}</AwaText>
              </View>
              {active ? (
                <View style={styles.nextBadge}>
                  <AwaText colorRole="primary" emphasized variant="labelSmall">{t('spiritualGuidance.nextPrayerLabel')}</AwaText>
                </View>
              ) : (
                <AwaText colorRole="onSurfaceVariant" style={styles.endLabel} variant="bodySmall">{t('prayerTimes.nextPrayerEndCaption', {time: formatTime(window.end, timezone)})}</AwaText>
              )}
            </View>
          </Animated.View>
        );
      })}

      <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.footnote}>
        {t('prayerTimes.schedule.footnote')}
      </AwaText>
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    title: {flexShrink: 1},
    headingRight: {flexDirection: 'row', alignItems: 'center', gap: 4},
    row: {flexDirection: 'row', alignItems: 'stretch', borderRadius: 12, paddingHorizontal: 12},
    rowActive: {backgroundColor: theme.colors.primarySoft},
    timelineColumn: {width: 22, alignItems: 'center'},
    dot: {
      marginTop: 15,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      // Original literal ('#D9CDF0') is a light, desaturated tint of
      // primary that isn't a byte-for-byte match to any single token —
      // reproduced as a soft primary tint so the inactive-dot ring stays
      // visually related to theme.colors.primary across all themes.
      borderColor: withAlpha(theme.colors.primary, 0.3),
      backgroundColor: theme.colors.surface,
    },
    dotActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    timelineLine: {flex: 1, width: 2, marginTop: 2, marginBottom: 2, backgroundColor: theme.colors.border},
    rowBody: {flex: 1, paddingVertical: 12, paddingLeft: 8},
    rowHeadLine: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
    name: {flexShrink: 1},
    endLabel: {marginTop: 2},
    nextBadge: {
      alignSelf: 'flex-start', marginTop: 5, borderRadius: 12,
      backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 2,
    },
    footnote: {marginTop: 10, textAlign: 'center'},
  });
}

export default memo(PrayerScheduleList);
