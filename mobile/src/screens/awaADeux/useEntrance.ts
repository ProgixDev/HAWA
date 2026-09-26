import {useEffect} from 'react';
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
