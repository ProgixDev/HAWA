import React, {memo, useEffect, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {PurityPrayerResult} from '../../utils/purityPrayerLogic';
import {dateFormatLocale} from '../../utils/cycleMath';
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

const formatTime = (date: Date, timezone?: string) =>
  new Intl.DateTimeFormat(dateFormatLocale(), {
    ...(timezone ? {timeZone: timezone} : {}),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

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
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingLeft}>
          <View style={styles.dropCircle}>
            <MaterialDesignIcons color={theme.colors.primary} name="water-outline" size={18} />
          </View>
          <Text style={styles.title}>{t('prayerTimes.purity.title')}</Text>
        </View>
        {result.status === 'pure' ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onEdit} style={({pressed}) => [styles.editButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="pencil-outline" size={13} />
            <Text style={styles.editText}>{t('prayerTimes.modify')}</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.View style={stateAnimatedStyle}>
        {result.status === 'menstruating' ? (
          <View style={styles.neutralBlock}>
            <View style={styles.discreetRow}>
              <View style={[styles.discreetDot, styles.discreetDotPeriod]} />
              <Text style={styles.discreetText}>{t('prayerTimes.purity.menstruatingLabel')}</Text>
            </View>
            <Text style={styles.neutralHint}>
              {t('prayerTimes.purity.menstruatingHint')}
            </Text>
          </View>
        ) : null}

        {result.status === 'unknown' ? (
          <View style={styles.unknownBlock}>
            <View style={styles.discreetRow}>
              <View style={styles.discreetDot} />
              <Text style={styles.discreetText}>{t('prayerTimes.purity.unknownLabel')}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onEdit} style={({pressed}) => [styles.renseignerButton, pressed && styles.pressed]}>
              <Text style={styles.renseignerText}>{t('prayerTimes.purity.declareButton')}</Text>
            </Pressable>
          </View>
        ) : null}

        {result.status === 'pure' ? (
          <>
            <View style={styles.pureHeadline}>
              <View style={styles.pureCheckCircle}>
                <MaterialDesignIcons color={theme.colors.success} name="check" size={14} />
              </View>
              <View style={styles.pureCopy}>
                <Text style={styles.pureTitle}>{t('prayerTimes.purity.pureTitle')}</Text>
                <Text style={styles.pureSubtitle}>
                  {t('prayerTimes.purity.pureSubtitle', {value: periodEndDateTime ? formatDeclaredEnd(t, periodEndDateTime, timezone) : '—'})}
                </Text>
              </View>
            </View>

            {result.prayerDue && result.prayerName && result.prayerStart && result.prayerEnd ? (
              <View style={styles.dueSection}>
                <Text style={styles.dueLabel}>{displayUpperCase(t('prayerTimes.purity.dueLabel'))}</Text>
                <Text style={styles.duePrayerName}>{result.prayerName}</Text>
                <Text style={styles.dueRange}>
                  {formatTime(result.prayerStart, timezone)} → {formatTime(result.prayerEnd, timezone)}
                </Text>

                <View style={styles.duePill}>
                  <MaterialDesignIcons color={pickReadableTextColor(theme.colors.success)} name="hand-heart-outline" size={14} />
                  <Text style={styles.duePillText}>{t('prayerTimes.purity.dueBadge', {prayerName: result.prayerName})}</Text>
                </View>

                <Text style={styles.dueSubtitle}>
                  {t('prayerTimes.purity.dueSubtitle', {prayerName: result.prayerName})}
                </Text>
              </View>
            ) : result.nextPrayerName && result.nextPrayerTime ? (
              <View style={styles.betweenSection}>
                <Text style={styles.betweenTitle}>{t('prayerTimes.purity.betweenTitle')}</Text>
                <View style={styles.nextAfterPurityBlock}>
                  <Text style={styles.nextAfterPurityLabel}>{displayUpperCase(t('prayerTimes.purity.nextAfterPurityLabel'))}</Text>
                  <Text style={styles.nextAfterPurityValue}>
                    {result.nextPrayerName} · {formatTime(result.nextPrayerTime, timezone)}
                  </Text>
                </View>
              </View>
            ) : (loading || error) ? (
              <Text style={styles.pendingNote}>
                {loading ? t('prayerTimes.purity.loadingSchedule') : t('prayerTimes.purity.scheduleUnavailable')}
              </Text>
            ) : null}
          </>
        ) : null}
      </Animated.View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {borderRadius: homeRadii.card, backgroundColor: theme.colors.surface, padding: 16, ...theme.shadow},
    headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    headingLeft: {flexDirection: 'row', alignItems: 'center', gap: 9},
    dropCircle: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16.5, fontWeight: '700'},
    editButton: {flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 30, paddingHorizontal: 4},
    editText: {color: theme.colors.primary, fontSize: 12, fontWeight: '700'},
    pressed: {opacity: 0.7},

    discreetRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    discreetDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textSecondary},
    // Menstrual-status indicator dot — a semantic/medical period color, not
    // an app-chrome color; deliberately out of scope for the theme-token
    // system (see awaThemeTokens.ts's SCOPE note) and left as the same
    // literal used by every other period indicator in the app.
    discreetDotPeriod: {backgroundColor: '#DC7B82'},
    discreetText: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},

    neutralBlock: {marginTop: 14},
    neutralHint: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},

    unknownBlock: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14},
    renseignerButton: {
      minHeight: 34, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
      borderRadius: homeRadii.button, backgroundColor: theme.colors.primary,
    },
    renseignerText: {color: onPrimaryTextColor(theme), fontSize: 12.5, fontWeight: '700'},

    pureHeadline: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14},
    pureCheckCircle: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: withAlpha(theme.colors.success, 0.18)},
    pureCopy: {flex: 1},
    pureTitle: {color: theme.colors.success, fontSize: 15, fontWeight: '700'},
    pureSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12},

    dueSection: {marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    dueLabel: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6},
    duePrayerName: {marginTop: 4, color: theme.colors.text, fontFamily: 'serif', fontSize: 26, fontWeight: '700'},
    dueRange: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 13},
    duePill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
      marginTop: 12, borderRadius: 12, backgroundColor: theme.colors.success, paddingHorizontal: 12, paddingVertical: 7,
      maxWidth: '100%',
    },
    // flexShrink: the badge text ("Bugün kılınması gereken namaz: …") must wrap inside the pill, not overflow it.
    duePillText: {flexShrink: 1, color: pickReadableTextColor(theme.colors.success), fontSize: 12.5, fontWeight: '700'},
    dueSubtitle: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},

    betweenSection: {marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    betweenTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 18},
    nextAfterPurityBlock: {marginTop: 12},
    nextAfterPurityLabel: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6},
    nextAfterPurityValue: {marginTop: 3, color: theme.colors.primary, fontSize: 16, fontWeight: '700'},

    pendingNote: {marginTop: 14, color: theme.colors.textSecondary, fontSize: 12},
  });
}

export default memo(PurityStatusCard);
