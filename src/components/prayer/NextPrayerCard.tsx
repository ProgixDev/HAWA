import React, {memo, useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {homeColors, homeRadii} from '../home/homeTheme';
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

const formatTime = (date: Date, timezone?: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    ...(timezone ? {timeZone: timezone} : {}),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

const formatCountdown = (targetMs: number, nowMs: number): string => {
  const totalMinutes = Math.max(0, Math.ceil((targetMs - nowMs) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {return `Dans ${minutes}min`;}
  if (minutes === 0) {return `Dans ${hours}h`;}
  return `Dans ${hours}h ${minutes.toString().padStart(2, '0')}min`;
};

function NextPrayerCard({window, timezone, loading, error, now}: Props): React.JSX.Element {
  // A very subtle, continuous breathing/floating effect on the
  // illustration only — no JS timer involved, driven entirely on the UI
  // thread — to feel calmly "alive" without distracting from the prayer
  // name/time below.
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, {duration: 3400, easing: Easing.inOut(Easing.ease)}),
        withTiming(0, {duration: 3400, easing: Easing.inOut(Easing.ease)}),
      ),
      -1,
      true,
    );
  }, [breathe]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: 1 + breathe.value * 0.04},
      {translateY: -breathe.value * 3},
    ],
  }));

  return (
    <View style={styles.card}>
      <Animated.Image resizeMode="contain" source={PRAYER_IMAGE} style={[styles.prayerImage, floatStyle]} />

      <Text style={styles.eyebrow}>Prochaine prière</Text>

      {window ? (
        <>
          <Text style={styles.name}>{window.name}</Text>
          <Text style={styles.time}>{formatTime(window.start, timezone)}</Text>

          <View style={styles.countdownPill}>
            <MaterialDesignIcons color={homeColors.primary} name="clock-time-four-outline" size={13} />
            <Text style={styles.countdownText}>{formatCountdown(window.start.getTime(), now.getTime())}</Text>
          </View>

          <Text style={styles.endCaption}>Fin du créneau · {formatTime(window.end, timezone)}</Text>
        </>
      ) : (
        <Text style={styles.name}>{loading ? 'Calcul…' : error ? 'Indisponible' : '—'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: homeRadii.card,
    backgroundColor: homeColors.lightLavender,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(109,74,232,0.10)',
    shadowColor: homeColors.primaryDark,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  prayerImage: {
    width: 96,
    height: 96 / PRAYER_IMAGE_RATIO,
  },
  eyebrow: {
    marginTop: 14,
    color: homeColors.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  name: {marginTop: 6, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 30, fontWeight: '700'},
  time: {marginTop: 2, color: homeColors.textPrimary, fontSize: 20, fontWeight: '600'},
  countdownPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, borderRadius: 14, backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: homeColors.primaryDark, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 5,
  },
  countdownText: {color: homeColors.primary, fontSize: 12.5, fontWeight: '700'},
  endCaption: {marginTop: 12, color: homeColors.textSecondary, fontSize: 11.5},
});

export default memo(NextPrayerCard);
