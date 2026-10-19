import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Svg, {Circle, Defs, LinearGradient as SvgGradient, Stop} from 'react-native-svg';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {interpolateHex, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';

// The single animated progress ring shared across objective Dashboards —
// originally built (and still used) as ContraceptionDashboard.tsx's
// "PillPackProgressRing". Material 3 migration: the decorative looping layers
// (breathing glow, rotating dashed halo, orbiting glint, floating core, sparkles)
// were removed; the ring is now the track, the progress arc (animated once to
// `progress`) and the centre label. This component is deliberately PRESENTATIONAL: it never
// computes `progress` itself (e.g. never a hardcoded day/totalDays or
// day/28 division) — every caller computes its own real `progress` value
// and passes it in, so the same visual ring can represent a genuinely
// different kind of underlying data per objective (a real pack fraction for
// Contraception; a purely decorative "actively tracked" indicator for an
// objective — like SOPK/Cycles irréguliers — that has no valid fixed-length
// denominator to divide by) without this file needing to know the
// difference.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const RING_SIZE = 142;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type AnimatedProgressRingProps = {
  /** 0 to 1 — always computed by the caller. Never derived inside this
   * component, so it never assumes what "progress" means for a given
   * objective. */
  progress: number;
  /** When false, the center shows `statusIcon`/`statusText` instead of
   * `centerCaption`/`centerValue`/`centerDetail`, and the footnote/
   * accessibility label passed in should reflect the unconfigured state too
   * — exactly like Contraception's own "not configured yet" ring state. */
  isConfigured: boolean;
  centerCaption?: string;
  centerValue?: string | number;
  centerDetail?: string;
  statusColor: string;
  statusIcon: IconName;
  statusText: string;
  footnote: string;
  accessibilityLabel: string;
};

export function AnimatedProgressRing({
  progress,
  isConfigured,
  centerCaption,
  centerValue,
  centerDetail,
  statusColor,
  statusIcon,
  statusText,
  footnote,
  accessibilityLabel,
}: AnimatedProgressRingProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const gradientStops = useMemo(
    () => [
      interpolateHex(theme.colors.primarySoft, theme.colors.primary, 0),
      interpolateHex(theme.colors.primarySoft, theme.colors.primary, 0.34),
      interpolateHex(theme.colors.primarySoft, theme.colors.primary, 0.68),
      theme.colors.primary,
    ],
    [theme],
  );

  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressAnimation.setValue(0);

    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 1250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimation]);

  const dashOffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="image" style={styles.outer}>
      <View style={styles.core}>
        <Svg height={RING_SIZE} width={RING_SIZE}>
          <Defs>
            <SvgGradient id="animatedProgressRingGradient" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor={gradientStops[0]} />
              <Stop offset="0.34" stopColor={gradientStops[1]} />
              <Stop offset="0.68" stopColor={gradientStops[2]} />
              <Stop offset="1" stopColor={gradientStops[3]} />
            </SvgGradient>
          </Defs>

          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            fill="none"
            r={RING_RADIUS}
            stroke={theme.colors.primarySoft}
            strokeWidth={RING_STROKE}
          />

          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            fill="none"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            r={RING_RADIUS}
            rotation="-90"
            stroke="url(#animatedProgressRingGradient)"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={RING_STROKE}
          />
        </Svg>

        <View pointerEvents="none" style={styles.inner}>
          {isConfigured ? (
            <>
              {centerCaption ? (
                <AwaText colorRole="onSurfaceVariant" variant="labelSmall">{centerCaption}</AwaText>
              ) : null}
              <AwaText color={theme.colors.accent} variant="headlineSmall">{centerValue}</AwaText>
              {centerDetail ? (
                <AwaText colorRole="primary" variant="labelSmall">{centerDetail}</AwaText>
              ) : null}
            </>
          ) : (
            <>
              <View style={[styles.statusIcon, {backgroundColor: `${statusColor}18`}]}>
                <MaterialDesignIcons color={statusColor} name={statusIcon} size={23} />
              </View>
              <AwaText color={statusColor} style={styles.status} variant="labelMedium">{statusText}</AwaText>
            </>
          )}
        </View>
      </View>

      <AwaText colorRole="primary" pointerEvents="none" style={styles.footnote} variant="labelSmall">{footnote}</AwaText>
    </View>
  );
}

// PHASE D2 — createStyles(theme) factory. Material 3 migration: only the ring
// layout, the centre disc and the status chip remain.
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    outer: {
      position: 'relative',
      width: RING_SIZE,
      minHeight: RING_SIZE + 27,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexShrink: 0,
    },

    core: {
      position: 'relative',
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },

    inner: {
      position: 'absolute',
      top: 22,
      left: 22,
      width: RING_SIZE - 44,
      height: RING_SIZE - 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: (RING_SIZE - 44) / 2,
      backgroundColor: theme.colors.surface,
    },

    statusIcon: {width: 32, height: 32, marginTop: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 16},
    status: {marginTop: 2, textAlign: 'center'},

    // DESIGN.md: in flow (not absolutely pinned) so a longer / wrapped footnote grows the block instead of overlapping the ring.
    footnote: {marginTop: 8, textAlign: 'center'},
  });
}

export default AnimatedProgressRing;
