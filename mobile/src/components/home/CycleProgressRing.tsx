import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';
import '../../i18n';

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
const PHASE_LABEL_BASE_SIZE = 9.5;
const PHASE_LABEL_MIN_SIZE = 7;
const PHASE_LABEL_HORIZONTAL_PADDING = 12;
// Average advance of a bold letter, in em. Calibrated on the shipped copy: "folliculaire" (12 Latin letters) always fit
// at 9.5 and "Фолликулярная" (13 Cyrillic letters) did not; Cyrillic and capitals are wider than Latin lowercase.
const EM_LATIN_LOWER = 0.58;
const EM_LATIN_UPPER = 0.7;
const EM_OTHER = 0.68;

const wordWidthEm = (word: string): number =>
  [...word].reduce((sum, letter) => {
    if (/[a-zà-ÿß]/.test(letter)) {return sum + EM_LATIN_LOWER;}
    if (/[A-ZÀ-ÞĞİŞ]/.test(letter)) {return sum + EM_LATIN_UPPER;}
    return sum + EM_OTHER;
  }, 0);

/**
 * Font size of the phase name in the centre of the ring. The disc is only about 0.7 x the ring wide, so a single long
 * word ("Фолликулярная", "Follikelphase") used to be broken in the middle by the text layout ("Фоллик / улярная").
 * Names whose longest word would not fit at the base size are scaled down, never below PHASE_LABEL_MIN_SIZE; names
 * that already fit (French, English, Spanish, Italian, Turkish) keep the original 9.5. Exported for tests.
 */
export function phaseLabelFontSize(label: string | null, ringSize: number): number {
  if (!label) {return PHASE_LABEL_BASE_SIZE;}
  const longestEm = Math.max(...label.split(/\s+/).map(wordWidthEm), 1);
  const available = Math.round(ringSize * (82 / 116)) - PHASE_LABEL_HORIZONTAL_PADDING;
  const fitting = available / longestEm;
  return Math.max(PHASE_LABEL_MIN_SIZE, Math.min(PHASE_LABEL_BASE_SIZE, Math.round(fitting * 10) / 10));
}

export default function CycleProgressRing({
  currentDay,
  cycleLength,
  ringColor,
  phaseLabel,
  size = DEFAULT_SIZE,
  accessibilityLabel,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  const safeCycleLength = Math.max(cycleLength, 1);
  const progress = currentDay === null ? 0 : Math.min(Math.max(currentDay / safeCycleLength, 0), 1);
  const phaseFontSize = phaseLabelFontSize(phaseLabel, size);

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
        <AwaText colorRole="onSurfaceVariant" variant="labelSmall">{t('journalNote.cycleDayLabel')}</AwaText>
        <AwaText emphasized style={styles.ringNumber} variant="headlineSmall">{currentDay === null ? '—' : String(currentDay)}</AwaText>
        {phaseLabel ? (
          <Text
            maxFontSizeMultiplier={1.1}
            numberOfLines={2}
            style={[styles.ringPhase, {color: ringColor, fontSize: phaseFontSize}]}>
            {phaseLabel}
          </Text>
        ) : null}
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
    ringNumber: {marginTop: 1},
    // `ringPhase`'s `color` is set per-render from the `ringColor` prop (SEMANTIC) at the
    // JSX call site above — no color here.
    ringPhase: {marginTop: 1, fontSize: 11, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6},
  });
}
