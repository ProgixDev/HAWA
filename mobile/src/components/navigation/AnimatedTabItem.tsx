import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';

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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const indicator = useRef(new Animated.Value(focused ? 1 : 0)).current;
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

  // The active destination is shown by its coloured icon + label and a short bar under the label that fades and widens in (no background).
  useEffect(() => {
    indicator.stopAnimation();
    const animation = Animated.timing(indicator, {
      duration: reduceMotion ? 120 : focused ? 250 : 200,
      easing: Easing.out(Easing.cubic),
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, indicator, reduceMotion]);

  const indicatorScaleX = indicator.interpolate({inputRange: [0, 1], outputRange: [0.5, 1]});

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{selected: focused}}
      hitSlop={8}
      onPress={onPress}
      style={({pressed}) => [styles.pressable, pressed && styles.pressed]}>
      <Animated.View
        style={[styles.underline, {opacity: indicator, transform: [{scaleX: reduceMotion ? 1 : indicatorScaleX}]}]}
      />
      <View style={styles.icon}>{icon}</View>
      <Text
        ellipsizeMode="tail"
        numberOfLines={1}
        style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  // The slot is flexible (the bar shares its width between four tabs and the centre button) up to 72 dp.
  pressable: {
    flex: 1,
    maxWidth: 72,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  pressed: {opacity: 0.86},
  // Active tab: no tile or background of any kind — only the primary-coloured icon + label and the short bar under the label.
  underline: {
    position: 'absolute',
    bottom: 3,
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  icon: {alignItems: 'center', justifyContent: 'center'},
  // Label Small (11 / 16), the SAME size for every tab (no shrink-to-fit). A longer translation ends with an ellipsis.
  label: {
    maxWidth: 72,
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
  labelFocused: {fontWeight: '700', color: theme.colors.primary},
  });
}

export const AnimatedTabItem = memo(AnimatedTabItemComponent);
