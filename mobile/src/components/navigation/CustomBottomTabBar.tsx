import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AnimatedTabItem} from './AnimatedTabItem';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import type {MainTabParamList} from '../../navigation/MainTabNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, pickReadableTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const TAB_META: Record<keyof MainTabParamList, {icon: IconName; label: string}> = {
  CycleHome: {icon: 'home-variant', label: 'Accueil'},
  Calendar: {icon: 'calendar-month-outline', label: 'Calendrier'},
  Statistics: {icon: 'chart-donut', label: 'Statistiques'},
  Profile: {icon: 'account-outline', label: 'Profil'},
};

function CentralAddButton({theme, styles}: {theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>}): React.JSX.Element {
  const {visible, open} = useJournalSheet();
  const plusMotion = useRef(new Animated.Value(0)).current;
  const plusScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(plusMotion, {
      toValue: visible ? 1 : 0,
      damping: 18,
      stiffness: 210,
      useNativeDriver: true,
    }).start();
  }, [plusMotion, visible]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(plusScale, {toValue: 0.9, duration: 90, useNativeDriver: true}),
      Animated.spring(plusScale, {toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true}),
    ]).start();
    open();
  };

  return (
    <Pressable
      accessibilityLabel="Ajouter"
      accessibilityRole="button"
      hitSlop={10}
      onPress={handlePress}
      style={({pressed}) => [styles.addButton, pressed && styles.pressed]}>
      <Animated.View
        style={{
          transform: [
            {scale: plusScale},
            {rotate: plusMotion.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']})},
          ],
        }}>
        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="plus" size={24} />
      </Animated.View>
    </Pressable>
  );
}

function CustomBottomTabBar({state, navigation}: BottomTabBarProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // The pill's fill is theme.colors.accent (see createStyles) — inactive
  // icons sit directly on it, so their color must read against THAT fill,
  // not a fixed light literal.
  const onPill = pickReadableTextColor(theme.colors.accent);

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    const meta = TAB_META[route.name as keyof MainTabParamList];
    const isFocused = state.index === routeIndex;

    const onPress = () => {
      const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <AnimatedTabItem
        focused={isFocused}
        icon={<MaterialDesignIcons color={isFocused ? theme.colors.primary : onPill} name={meta.icon} size={22} />}
        key={route.key}
        label={meta.label}
        onPress={onPress}
      />
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.bottomBarArea,
        {paddingBottom: Math.max(insets.bottom, 8)},
      ]}>
      <View style={styles.bottomBar}>
        {renderTab(0)}
        {renderTab(1)}
        <CentralAddButton styles={styles} theme={theme} />
        {renderTab(2)}
        {renderTab(3)}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  bottomBarArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingTop: 4,
  },

  // A deliberately deep, saturated "floating pill" — sourced from
  // theme.colors.accent (the app's "deep brand" token, used elsewhere for
  // serif headings/CTAs) so it shifts hue per Premium palette and adapts
  // its lightness for Dark/True Black, instead of a fixed purple.
  bottomBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    borderRadius: 34,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 7,
    elevation: 8,
  },

  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    elevation: 4,
  },

  pressed: {
    opacity: 0.7,
    transform: [{scale: 0.97}],
  },
  });
}

export default CustomBottomTabBar;
