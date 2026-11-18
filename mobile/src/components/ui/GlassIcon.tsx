import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type Props = {
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  /** Outer diameter (default 44). */
  size?: number;
  /** Defaults to the theme's primary. */
  color?: string;
};

/** A round "glass" icon container: translucent primary fill and ONE uniform hairline primary border (stronger fill in dark mode, very
 * light in light mode). One tone for every icon — the app never colours icons per category.
 * The border has a single colour on all four sides: a lighter top side (borderTopColor) is drawn by Android as a brighter half-ring with
 * a visible change of thickness where it meets the other sides, and nothing is clipped inside the circle. */
export function GlassIcon({icon, size = 44, color}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View pointerEvents="none" style={[styles.glass, {width: size, height: size, borderRadius: size / 2}]}>
      <MaterialDesignIcons color={color ?? theme.colors.primary} name={icon} size={Math.round(size * 0.5)} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  const dark = theme.statusBarStyle === 'light-content';
  return StyleSheet.create({
    glass: {
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, dark ? 0.4 : 0.22),
      backgroundColor: withAlpha(theme.colors.primary, dark ? 0.2 : 0.09),
    },
  });
}
