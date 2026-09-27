import {useEffect, useRef} from 'react';
import {Animated, Easing as RNEasing} from 'react-native';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// The one entrance animation of every "AWA à deux" screen: a fade + a small upward
// move (+ an optional scale), driven by ONE shared value on the UI thread with
// react-native-reanimated (already used across AWA). Opacity / transform only.
// With reduced motion the value starts at its end state: same final UI, no motion.
const EASE_OUT = Easing.out(Easing.cubic);

export function useEntrance(
  delay: number,
  duration: number,
  reduceMotion: boolean,
  distance = 12,
  scaleFrom = 1,
  onDone?: () => void,
) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return undefined;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, {duration, easing: EASE_OUT}, finished => {
        if (finished && onDone) {onDone();}
      }),
    );
    return () => cancelAnimation(progress);
    // The sequence is defined once per mount / reduced-motion change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {translateY: (1 - progress.value) * distance},
      {scale: scaleFrom + (1 - scaleFrom) * progress.value},
    ],
  }));
}

/**
 * Entrance of a small hero illustration (e.g. the invitation envelope on
 * AwaADeuxPendingScreen / AwaADeuxInvitationScreen): fade + a small upward move + a
 * slight scale-in, using plain React Native `Animated` (not reanimated) so it can run
 * before/independently of the surrounding <Reveal> stagger. Unlike useEntrance() above,
 * it deliberately starts at 0.65 opacity, never 0 — the illustration must stay visible
 * even if the animation is delayed or fails to run on a physical device.
 */
export function useHeroEntrance() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 550,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress]);
  return {
    opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0.65, 1]}),
    transform: [
      {translateY: progress.interpolate({inputRange: [0, 1], outputRange: [8, 0]})},
      {scale: progress.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]})},
    ],
  };
}
