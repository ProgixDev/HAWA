import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';
import {RING_CENTER_RATIO, planCycleRingText} from './cycleRingLayout';
import '../../i18n';

const SEGMENT_COUNT = 60;
const DEFAULT_SIZE = 116;
// The phases the cycle dashboards can show. The text sizes are planned for the longest of them in the current language
// (plus the one passed in), so the caption and the number never change size or place when the phase changes.
const RING_PHASES = ['menstruation', 'follicular', 'fertile', 'ovulation', 'luteal'] as const;

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
  const {t, i18n} = useTranslation();
  const {theme} = useAwaTheme();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  const safeCycleLength = Math.max(cycleLength, 1);
  const progress = currentDay === null ? 0 : Math.min(Math.max(currentDay / safeCycleLength, 0), 1);
  const caption = t('journalNote.cycleDayLabel');
  const phaseNames = RING_PHASES.map(phase => t(`cyclePhase.${phase}`));
  const plan = useMemo(
    () => planCycleRingText({size, caption, phaseLabels: phaseLabel ? [...phaseNames, phaseLabel] : phaseNames}),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phaseNames changes only with the language
    [size, caption, phaseLabel, i18n.language],
  );
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  // Planned sizes are applied INLINE, never through StyleSheet.create: the Android shape layer raises any font size below
  // 11 sp there (and these are deliberately smaller — an 82 dp disc cannot hold 11 sp text), and plain objects are left alone.
  const textStyles = useMemo(
    () => ({
      caption: {fontSize: plan.caption.fontSize, lineHeight: plan.caption.lineHeight, letterSpacing: 0},
      number: {marginTop: plan.gap, fontSize: plan.number.fontSize, lineHeight: plan.number.lineHeight},
      phaseBlock: {marginTop: plan.gap, height: plan.phaseReservedLines * plan.phase.lineHeight},
      phase: {fontSize: plan.phase.fontSize, lineHeight: plan.phase.lineHeight},
    }),
    [plan],
  );
  const phaseLines = phaseLabel ? plan.phaseLines[phaseLabel] ?? [phaseLabel] : [];

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

      {/* The three texts are planned to sit inside the disc (cycleRingLayout.ts); the disc does not grow with the system
          font size, so they do not scale with it either — a larger text would simply spill out of the circle. */}
      <View style={styles.ringCenter}>
        <AwaText allowFontScaling={false} colorRole="onSurfaceVariant" numberOfLines={1} style={[styles.ringText, textStyles.caption]} variant="labelSmall">{caption}</AwaText>
        <AwaText allowFontScaling={false} emphasized style={[styles.ringText, textStyles.number]} variant="headlineSmall">{currentDay === null ? '—' : String(currentDay)}</AwaText>
        {phaseLabel ? (
          <View style={[styles.ringPhaseBlock, textStyles.phaseBlock]}>
            <Text
              accessibilityLabel={phaseLabel}
              allowFontScaling={false}
              android_hyphenationFrequency="none"
              numberOfLines={plan.phaseReservedLines}
              style={[styles.ringPhase, textStyles.phase, {color: ringColor}]}>
              {phaseLines.join('\n')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme, size: number) {
  // Same 116/82 ratio as the original fixed-size ring, just scalable via `size`.
  const centerSize = Math.round(size * RING_CENTER_RATIO);
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
    // Caption, number and phase: their sizes, line heights and spacing come from planCycleRingText (applied inline, see
    // textStyles above) — never a fixed 11 / 24 / 9.5 any more; no letter-spacing (the small-label tracking would widen
    // "Jour du cycle" past the circle); everything centred.
    ringText: {textAlign: 'center', includeFontPadding: false},
    // Reserves the planned number of lines, so the number stays where it is from one phase to the next.
    ringPhaseBlock: {alignItems: 'center'},
    // `ringPhase`'s `color` is set per-render from the `ringColor` prop (SEMANTIC) at the
    // JSX call site above — no color here.
    ringPhase: {fontWeight: '700', textAlign: 'center', includeFontPadding: false},
  });
}
