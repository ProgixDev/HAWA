import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

// Ensures i18next is initialized even when this component is rendered
// directly (e.g. in isolated tests) — see AppearanceScreen.tsx's identical
// import for the full rationale.
import '../../i18n';

import {AnimatedTabItem} from './AnimatedTabItem';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import type {MainTabParamList} from '../../navigation/MainTabNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, IconName> = {
  CycleHome: 'home',
  Calendar: 'calendar-month-outline',
  Statistics: 'chart-bar',
  Profile: 'account-outline',
};

function useTabMeta(): Record<keyof MainTabParamList, {icon: IconName; label: string}> {
  const {t} = useTranslation();
  return {
    CycleHome: {icon: TAB_ICONS.CycleHome, label: t('navigation.home')},
    Calendar: {icon: TAB_ICONS.Calendar, label: t('navigation.calendar')},
    Statistics: {icon: TAB_ICONS.Statistics, label: t('navigation.statistics')},
    Profile: {icon: TAB_ICONS.Profile, label: t('navigation.profile')},
  };
}

function CentralAddButton({theme, styles}: {theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>}): React.JSX.Element {
  const {t} = useTranslation();
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
      accessibilityLabel={t('common.add')}
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
        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="plus" size={28} />
      </Animated.View>
    </Pressable>
  );
}

function CustomBottomTabBar({state, navigation}: BottomTabBarProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const tabMeta = useTabMeta();

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    const meta = tabMeta[route.name as keyof MainTabParamList];
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
        icon={<MaterialDesignIcons color={isFocused ? theme.colors.primary : theme.colors.textSecondary} name={meta.icon} size={24} />}
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
        <View style={styles.addSlot}>
          <CentralAddButton styles={styles} theme={theme} />
        </View>
        {renderTab(2)}
        {renderTab(3)}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  // Room above the bar for the raised "+" button (the area is transparent and box-none, so it never blocks touches).
  bottomBarArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingTop: 28,
  },

  // The floating pill: the theme surface with a hairline primary border (light: white / lavender, dark: deep surface), so it follows
  // light, dark and the Premium palettes instead of a fixed purple fill.
  bottomBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.28),
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 7,
    elevation: 8,
  },

  addSlot: {
    width: 64,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // A round button that rises above the bar, with a soft ring in the primary colour.
  addButton: {
    position: 'absolute',
    top: -14,
    left: 3,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    borderWidth: 4,
    borderColor: withAlpha(theme.colors.primary, 0.3),
    backgroundColor: theme.colors.primary,
    elevation: 6,
  },

  pressed: {
    opacity: 0.7,
    transform: [{scale: 0.97}],
  },
  });
}

export default CustomBottomTabBar;
