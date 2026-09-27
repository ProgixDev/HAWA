import React, {useMemo} from 'react';
import {View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AnimatedTabItem} from './AnimatedTabItem';
import type {PartnerMainTabParamList} from '../../navigation/PartnerMainTabNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// The partner's tab bar — visually the same "floating pill" as the main user's
// CustomBottomTabBar.tsx (same AnimatedTabItem, same theme tokens, same shadow/radius),
// but for the 4 read-only partner tabs and with NO central "+" button (the partner never
// logs or edits anything — see PartnerHomeScreen.tsx's header comment). CustomBottomTabBar
// itself is untouched; this is a separate component so the main user's tab bar keeps its
// exact current behavior.
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const TAB_META: Record<keyof PartnerMainTabParamList, {icon: IconName; label: string}> = {
  PartnerHome: {icon: 'home-variant', label: 'Accueil'},
  PartnerCalendar: {icon: 'calendar-month-outline', label: 'Calendrier'},
  PartnerAdvice: {icon: 'hand-heart-outline', label: 'Conseils'},
  PartnerProfile: {icon: 'account-outline', label: 'Profil'},
};

function PartnerBottomTabBar({state, navigation}: BottomTabBarProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const onPill = pickReadableTextColor(theme.colors.accent);

  return (
    <View pointerEvents="box-none" style={[styles.bottomBarArea, {paddingBottom: Math.max(insets.bottom, 8)}]}>
      <View style={styles.bottomBar}>
        {state.routes.map((route, routeIndex) => {
          const meta = TAB_META[route.name as keyof PartnerMainTabParamList];
          const isFocused = state.index === routeIndex;
          const onPress = () => {
            const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
            if (!isFocused && !event.defaultPrevented) {navigation.navigate(route.name);}
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
        })}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return {
    bottomBarArea: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      paddingTop: 4,
    },
    bottomBar: {
      height: 58,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-around' as const,
      marginHorizontal: 10,
      borderRadius: 34,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 7,
      elevation: 8,
    },
  };
}

export default PartnerBottomTabBar;
