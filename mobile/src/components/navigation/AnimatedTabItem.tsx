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
import {pickReadableTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

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

  // Material 3 navigation bar: the active destination gets a pill-shaped indicator behind its icon that fades and
  // widens in (no lift, no scale, no second highlight behind the label).
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
      <View style={styles.iconArea}>
        <Animated.View
          style={[styles.indicator, {opacity: indicator, transform: [{scaleX: reduceMotion ? 1 : indicatorScaleX}]}]}
        />
        <View style={styles.icon}>{icon}</View>
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={1}
        style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  // This item always renders on top of CustomBottomTabBar's own pill, whose
  // fill is `theme.colors.accent` — so inactive icon/label read against that
  // fill via `pickReadableTextColor`, not a fixed light literal.
  const onPill = pickReadableTextColor(theme.colors.accent);
  return StyleSheet.create({
  pressable: {
    width: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {opacity: 0.86},
  // The icon (24 dp box) is centred in the 26 dp high active-indicator pill; the label sits 2 dp below it. The two
  // together are 44 dp, inside the 58 dp floating bar (componentDimensions.floatingTabBarPill).
  iconArea: {
    width: 48,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
  },
  icon: {alignItems: 'center', justifyContent: 'center'},
  // Label Small (11 / 16): the full 16 dp line box belongs to the text (no fixed-height pill around it), so glyphs —
  // including the dots and accents of Turkish and German labels — never touch an edge. The label is capped at the item
  // width and shrinks (adjustsFontSizeToFit) instead of wrapping: Turkish "İstatistikler" is one 13-letter word.
  label: {
    maxWidth: 56,
    marginTop: 2,
    color: onPill,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
  labelFocused: {fontWeight: '600'},
  });
}

export const AnimatedTabItem = memo(AnimatedTabItemComponent);
