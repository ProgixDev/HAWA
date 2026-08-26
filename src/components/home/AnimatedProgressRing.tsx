import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Svg, {Circle, Defs, LinearGradient as SvgGradient, Stop} from 'react-native-svg';

// The single animated progress ring shared across objective Dashboards —
// originally built (and still used) as ContraceptionDashboard.tsx's
// "PillPackProgressRing", extracted here unchanged (same layers, same
// durations/easings, same SVG gradient/dash-array arc, same breathe/glint/
// float/sparkle loops) so every consumer gets an IDENTICAL animation, never
// an approximation. This component is deliberately PRESENTATIONAL: it never
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

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const MUTED = '#776C92';

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
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const breatheAnimation = useRef(new Animated.Value(0)).current;
  const glintAnimation = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressAnimation.setValue(0);

    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 1250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnimation, {toValue: 1, duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(breatheAnimation, {toValue: 0, duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );

    const glint = Animated.loop(
      Animated.timing(glintAnimation, {toValue: 1, duration: 5600, easing: Easing.linear, useNativeDriver: true}),
    );

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(floatAnimation, {toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );

    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnimation, {toValue: 1, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        Animated.timing(sparkleAnimation, {toValue: 0, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
      ]),
    );

    breathe.start();
    glint.start();
    floating.start();
    sparkle.start();

    return () => {
      breathe.stop();
      glint.stop();
      floating.stop();
      sparkle.stop();
    };
  }, [breatheAnimation, floatAnimation, glintAnimation, progress, progressAnimation, sparkleAnimation]);

  const dashOffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const breatheScale = breatheAnimation.interpolate({inputRange: [0, 1], outputRange: [1, 1.035]});
  const coreScale = breatheAnimation.interpolate({inputRange: [0, 1], outputRange: [1, 1.018]});
  const breatheOpacity = breatheAnimation.interpolate({inputRange: [0, 1], outputRange: [0.09, 0.25]});
  const floatTranslateY = floatAnimation.interpolate({inputRange: [0, 1], outputRange: [1.5, -3.5]});
  const glintRotation = glintAnimation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  const haloRotation = glintAnimation.interpolate({inputRange: [0, 1], outputRange: ['360deg', '0deg']});
  const sparkleOpacity = sparkleAnimation.interpolate({inputRange: [0, 1], outputRange: [0.35, 1]});
  const sparkleScale = sparkleAnimation.interpolate({inputRange: [0, 1], outputRange: [0.78, 1.16]});

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="image" style={styles.outer}>
      <Animated.View style={[styles.premiumCore, {transform: [{translateY: floatTranslateY}, {scale: coreScale}]}]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, {opacity: breatheOpacity, transform: [{scale: breatheScale}]}]}
        />

        <Animated.View pointerEvents="none" style={[styles.halo, {transform: [{rotate: haloRotation}]}]} />

        <Svg height={RING_SIZE} width={RING_SIZE}>
          <Defs>
            <SvgGradient id="animatedProgressRingGradient" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor="#D9C9F6" />
              <Stop offset="0.34" stopColor="#A87BE9" />
              <Stop offset="0.68" stopColor="#7A4FD0" />
              <Stop offset="1" stopColor={PURPLE} />
            </SvgGradient>
          </Defs>

          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            fill="none"
            r={RING_RADIUS}
            stroke="#E9DFF7"
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
              {centerCaption ? <Text style={styles.caption}>{centerCaption}</Text> : null}
              <Text style={styles.value}>{centerValue}</Text>
              {centerDetail ? <Text style={styles.detail}>{centerDetail}</Text> : null}
            </>
          ) : (
            <>
              <View style={[styles.statusIcon, {backgroundColor: `${statusColor}18`}]}>
                <MaterialDesignIcons color={statusColor} name={statusIcon} size={23} />
              </View>
              <Text style={[styles.status, {color: statusColor}]}>{statusText}</Text>
            </>
          )}
        </View>

        <Animated.View pointerEvents="none" style={[styles.glintOrbit, {transform: [{rotate: glintRotation}]}]}>
          <View style={styles.glintDot}>
            <View style={styles.glintCore} />
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.sparkleTop, {opacity: sparkleOpacity, transform: [{scale: sparkleScale}]}]}>
          <MaterialDesignIcons color="#FFFFFF" name="creation" size={10} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.sparkleBottom, {opacity: sparkleOpacity, transform: [{scale: sparkleScale}]}]}>
          <View style={styles.miniSparkle} />
        </Animated.View>
      </Animated.View>

      <Text pointerEvents="none" style={styles.footnote}>{footnote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    width: RING_SIZE,
    height: RING_SIZE + 27,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
  },

  premiumCore: {
    position: 'relative',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: RING_SIZE - 12,
    height: RING_SIZE - 12,
    borderRadius: (RING_SIZE - 12) / 2,
    backgroundColor: '#9C70E4',
    shadowColor: '#8E62D9',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 5,
  },

  halo: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: RING_SIZE + 10,
    height: RING_SIZE + 10,
    borderRadius: (RING_SIZE + 10) / 2,
    borderWidth: 1.25,
    borderStyle: 'dashed',
    borderColor: 'rgba(142,98,217,0.32)',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    shadowColor: '#6949BE',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
  },

  caption: {color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 0.2},
  value: {marginTop: -2, color: PURPLE_DARK, fontFamily: 'serif', fontSize: 31, lineHeight: 34, fontWeight: '900'},
  detail: {marginTop: -2, color: PURPLE, fontSize: 9.5, fontWeight: '900'},

  statusIcon: {width: 32, height: 32, marginTop: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 16},
  status: {marginTop: 2, fontSize: 10.5, fontWeight: '900'},

  glintOrbit: {position: 'absolute', top: 0, left: 0, width: RING_SIZE, height: RING_SIZE},
  glintDot: {
    position: 'absolute',
    top: -1,
    left: RING_SIZE / 2 - 5,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.46)',
    shadowColor: '#FFFFFF',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 9,
    elevation: 4,
  },
  glintCore: {width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF'},

  sparkleTop: {
    position: 'absolute',
    top: 15,
    right: 7,
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9.5,
    backgroundColor: '#A77AE7',
    shadowColor: '#8E62D9',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 3,
  },
  sparkleBottom: {position: 'absolute', left: 7, bottom: 23, width: 12, height: 12, alignItems: 'center', justifyContent: 'center'},
  miniSparkle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D8C3F4',
    shadowColor: '#A77AE7',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.65,
    shadowRadius: 5,
    elevation: 2,
  },

  footnote: {position: 'absolute', bottom: 0, color: PURPLE, fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 0.1},
});

export default AnimatedProgressRing;
