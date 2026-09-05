import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, type ImageSourcePropType, type ImageStyle, type StyleProp} from 'react-native';

type Props = {
  accessibilityLabel: string;
  idle?: boolean;
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
};

const ENTER_DURATION = 560;
const EXIT_DURATION = 170;

export default function BabyDevelopmentImage({accessibilityLabel, idle = false, source, style}: Props): React.JSX.Element {
  const [displayedSource, setDisplayedSource] = useState(source);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let idleLoop: Animated.CompositeAnimation | undefined;

    const enter = (reduceMotion: boolean) => {
      if (!mounted) {return;}
      opacity.setValue(reduceMotion ? 1 : 0);
      scale.setValue(reduceMotion ? 1 : 0.94);
      translateY.setValue(reduceMotion ? 0 : 8);
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration: reduceMotion ? 0 : ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(scale, {toValue: 1, duration: reduceMotion ? 0 : ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(translateY, {toValue: 0, duration: reduceMotion ? 0 : ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      ]).start(() => {
        if (idle && !reduceMotion && mounted) {
          idleLoop = Animated.loop(Animated.sequence([
            Animated.timing(float, {toValue: -3, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
            Animated.timing(float, {toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          ]));
          idleLoop.start();
        }
      });
    };

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!mounted) {return;}
      Animated.timing(opacity, {toValue: 0, duration: reduceMotion ? 0 : EXIT_DURATION, easing: Easing.in(Easing.quad), useNativeDriver: true}).start(() => {
        if (!mounted) {return;}
        setDisplayedSource(source);
        enter(reduceMotion);
      });
    });

    return () => {mounted = false; idleLoop?.stop();};
  }, [float, idle, opacity, scale, source, translateY]);

  return (
    <Animated.Image
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      source={displayedSource}
      style={[style, {opacity, transform: [{scale}, {translateY: Animated.add(translateY, float)}]}]}
    />
  );
}
