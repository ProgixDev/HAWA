import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, StyleSheet, Text, View} from 'react-native';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';

const SEGMENT_COUNT = 60;
const DEFAULT_SIZE = 116;

type Props = {
  /** 1-based day within the cycle. `null` → the center shows "—" and the ring stays empty
   * (used by the read-only partner view when the day itself is not shared/available). */
  currentDay: number | null;
  /** Total cycle length used to compute progress; ignored while `currentDay` is `null`. */
  cycleLength: number;
  /** SEMANTIC, per-phase identity color (never theme-driven) — see the caller's own phase
   * map (e.g. HeroCycleCard's `PHASE_INSIGHTS` / `getCyclePhaseIdentity`). */
  ringColor: string;
  /** Phase label shown under the day number, colored with `ringColor`. `null` hides it. */
  phaseLabel: string | null;
  size?: number;
  accessibilityLabel?: string;
};

/**
 * The animated segmented "Jour du cycle" ring, first built for the owner's HeroCycleCard
 * (Suivi de cycle dashboard) and extracted here so every consumer — owner AND partner —
 * gets the EXACT SAME ring: same 60-segment draw, same progress-animation timing, same
 * reduced-motion handling. Never re-implement this drawing elsewhere; only the caller-
 * supplied color/label/day/length differ per screen. The caller owns everything else
 * (title, message, chips, card chrome) — this component only draws the ring + its center.
 */
export default function CycleProgressRing({
  currentDay,
  cycleLength,
  ringColor,
  phaseLabel,
  size = DEFAULT_SIZE,
  accessibilityLabel,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  const safeCycleLength = Math.max(cycleLength, 1);
  const progress = currentDay === null ? 0 : Math.min(Math.max(currentDay / safeCycleLength, 0), 1);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) {setReduceMotion(value);}
    });
    return () => {mounted = false;};
  }, []);

  useEffect(() => {
    progressAnimation.setValue(reduceMotion ? progress : 0);
    if (reduceMotion) {return undefined;}

    const animation = Animated.timing(progressAnimation, {
      delay: 150,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      toValue: progress,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, progressAnimation, reduceMotion]);

  const segments = useMemo(() => Array.from({length: SEGMENT_COUNT}, (_, index) => index), []);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      style={styles.ring}>
      {segments.map(index => {
        const start = index / SEGMENT_COUNT;
        const end = Math.min((index + 0.85) / SEGMENT_COUNT, 1);
        const opacity = progressAnimation.interpolate({
          inputRange: index === 0 ? [0, end] : [start - 0.001, start, end],
          outputRange: index === 0 ? [0, 1] : [0, 0.12, 1],
          extrapolate: 'clamp',
        });

        return (
          <View
            key={index}
            style={[styles.segmentOrbit, {transform: [{rotate: `${index * (360 / SEGMENT_COUNT)}deg`}]}]}>
            <View style={styles.trackSegment} />
            <Animated.View style={[styles.activeSegment, {backgroundColor: ringColor, opacity}]} />
          </View>
        );
      })}

      <View style={styles.ringCenter}>
        <Text style={styles.ringEyebrow}>Jour du cycle</Text>
        <Text style={styles.ringNumber}>{currentDay === null ? '—' : String(currentDay)}</Text>
        {phaseLabel ? <Text numberOfLines={2} style={[styles.ringPhase, {color: ringColor}]}>{phaseLabel}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme, size: number) {
  // Same 116/82 ratio as the original fixed-size ring, just scalable via `size`.
  const centerSize = Math.round(size * (82 / 116));
  return StyleSheet.create({
    ring: {width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center'},
    segmentOrbit: {position: 'absolute', width: size, height: size, alignItems: 'center'},
    // TRACK — decorative, themeable.
    trackSegment: {
      position: 'absolute',
      top: 0,
      width: 3,
      height: 8,
      borderRadius: 2,
      backgroundColor: theme.colors.primarySoft,
    },
    // ACTIVE segment color comes from the `ringColor` prop (SEMANTIC per-phase color) —
    // this style intentionally carries no color of its own.
    activeSegment: {position: 'absolute', top: 0, width: 3, height: 8, borderRadius: 2},
    ringCenter: {
      width: centerSize,
      height: centerSize,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: centerSize / 2,
      backgroundColor: theme.colors.primarySoft,
    },
    ringEyebrow: {color: theme.colors.textSecondary, fontSize: 9.5, fontWeight: '600'},
    ringNumber: {marginTop: 1, color: theme.colors.text, fontFamily: 'serif', fontSize: 30, fontWeight: '700', lineHeight: 34},
    // `ringPhase`'s `color` is set per-render from the `ringColor` prop (SEMANTIC) at the
    // JSX call site above — no color here.
    ringPhase: {marginTop: 1, fontSize: 9.5, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6},
  });
}
