import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, type ImageSourcePropType, type ImageStyle, type StyleProp} from 'react-native';

type Props = {
  accessibilityLabel: string;
  /** Accepted for API compatibility only: the decorative idle float loop was removed (DESIGN.md: no decorative looping motion). */
  idle?: boolean;
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
};

const ENTER_DURATION = 560;
const EXIT_DURATION = 170;

export default function BabyDevelopmentImage({accessibilityLabel, source, style}: Props): React.JSX.Element {
  const [displayedSource, setDisplayedSource] = useState(source);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let mounted = true;

    const enter = (reduceMotion: boolean) => {
      if (!mounted) {return;}
      opacity.setValue(reduceMotion ? 1 : 0);
      scale.setValue(reduceMotion ? 1 : 0.94);
      translateY.setValue(reduceMotion ? 0 : 8);
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration: reduceMotion ? 0 : ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(scale, {toValue: 1, duration: reduceMotion ? 0 : ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(translateY, {toValue: 0, duration: reduceMotion ? 0 : ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      ]).start();
    };

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!mounted) {return;}
      Animated.timing(opacity, {toValue: 0, duration: reduceMotion ? 0 : EXIT_DURATION, easing: Easing.in(Easing.quad), useNativeDriver: true}).start(() => {
        if (!mounted) {return;}
        setDisplayedSource(source);
        enter(reduceMotion);
      });
    });

    return () => {mounted = false;};
  }, [opacity, scale, source, translateY]);

  return (
    <Animated.Image
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      source={displayedSource}
      style={[style, {opacity, transform: [{scale}, {translateY}]}]}
    />
  );
}
