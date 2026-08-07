import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AnimatedTabItem} from './AnimatedTabItem';
import {useJournalSheet} from '../../navigation/JournalSheetContext';
import type {MainTabParamList} from '../../navigation/MainTabNavigator';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const TAB_META: Record<keyof MainTabParamList, {icon: IconName; label: string}> = {
  CycleHome: {icon: 'home-variant', label: 'Accueil'},
  Calendar: {icon: 'calendar-month-outline', label: 'Calendrier'},
  Statistics: {icon: 'chart-donut', label: 'Statistiques'},
  Profile: {icon: 'account-outline', label: 'Profil'},
};

function CentralAddButton(): React.JSX.Element {
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
        <MaterialDesignIcons color="#FFFFFF" name="plus" size={24} />
      </Animated.View>
    </Pressable>
  );
}

function CustomBottomTabBar({state, navigation}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

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
        icon={<MaterialDesignIcons color={isFocused ? PURPLE_DARK : '#F3ECFB'} name={meta.icon} size={22} />}
        key={route.key}
        label={meta.label}
        onPress={onPress}
      />
    );
  };

  return (
    <View style={[styles.bottomBar, {marginBottom: Math.max(insets.bottom, 8)}]}>
      {renderTab(0)}
      {renderTab(1)}
      <CentralAddButton />
      {renderTab(2)}
      {renderTab(3)}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 34,
    backgroundColor: PURPLE_DARK,
    paddingHorizontal: 7,
    elevation: 8,
  },

  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: PURPLE,
    elevation: 4,
  },

  pressed: {
    opacity: 0.7,
    transform: [{scale: 0.97}],
  },
});

export default CustomBottomTabBar;
