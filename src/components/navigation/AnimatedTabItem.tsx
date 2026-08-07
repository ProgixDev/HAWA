import React, {memo, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {colors} from '../../theme/colors';

export type AnimatedTabItemProps = {
  label: string;
  icon: React.ReactNode;
  focused: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

function AnimatedTabItemComponent({
  label,
  icon,
  focused,
  onPress,
  accessibilityLabel,
}: AnimatedTabItemProps): React.JSX.Element {
  const motion = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const decoration = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {setReduceMotion(enabled);}
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    motion.stopAnimation();
    decoration.stopAnimation();

    if (reduceMotion) {
      motion.setValue(0);
      Animated.timing(decoration, {
        duration: 120,
        easing: Easing.out(Easing.quad),
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
      }).start();
      return () => decoration.stopAnimation();
    }

    const animation = Animated.parallel([
      focused
        ? Animated.spring(motion, {
            bounciness: 3,
            speed: 20,
            toValue: 1,
            useNativeDriver: true,
          })
        : Animated.timing(motion, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
            toValue: 0,
            useNativeDriver: true,
          }),
      Animated.timing(decoration, {
        duration: focused ? 270 : 210,
        easing: Easing.out(Easing.cubic),
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [decoration, focused, motion, reduceMotion]);

  const translateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });
  const scale = motion.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [1, 1.12, 1.06],
  });

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{selected: focused}}
      hitSlop={8}
      onPress={onPress}
      style={({pressed}) => [styles.pressable, pressed && styles.pressed]}>
      <Animated.View style={[styles.iconArea, {transform: [{translateY}, {scale}]}]}>
        <Animated.View style={[styles.halo, {opacity: decoration}]} />
        <View style={styles.icon}>{icon}</View>
      </Animated.View>
      <View style={styles.labelArea}>
        <Animated.View style={[styles.labelPill, {opacity: decoration}]} />
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      </View>
      <Animated.View
        style={[
          styles.indicator,
          {
            opacity: decoration,
            transform: [{scaleX: decoration}],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  pressed: {opacity: 0.86},
  iconArea: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    shadowColor: '#28166F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {alignItems: 'center', justifyContent: 'center'},
  labelArea: {
    minWidth: 48,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
  },
  labelPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 7,
    backgroundColor: colors.cream,
  },
  label: {color: '#F3ECFB', fontSize: 8, fontWeight: '500'},
  labelFocused: {color: '#6949BE', fontWeight: '700'},
  indicator: {
    width: 13,
    height: 2.5,
    marginTop: 1,
    borderRadius: 2,
    backgroundColor: colors.accentLight,
  },
});

export const AnimatedTabItem = memo(AnimatedTabItemComponent);
