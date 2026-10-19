import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {interpolateHex, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {WCAG_AA_TEXT, ensureContrast} from '../../theme/contrast';

// The profile picture shown in Anonymous Mode: a plain, neutral person silhouette (the project's own `account` glyph) in a
// circular tonal-purple container with a subtle outline. It replaces the cartoon avatar there. It is purely decorative and
// static: a plain View, no press / long-press handler, no badge, never an image the user can add or change.
//
// Colours come only from the resolved theme, so every palette and Light / Dark / True Black follows:
//  - container: the surface tinted with the brand colour (a deeper tint in Dark / True Black), the same blend the
//    semantic roles use for their raised surfaces;
//  - silhouette: the brand colour (a lighter purple than the container in Dark and True Black, a deeper purple in Light),
//    nudged toward the text colour only as far as needed to reach 4.5:1 against the container;
//  - outline: the brand colour at low opacity, like the ring around the profile photo.
export function anonymousProfileIconColors(theme: ResolvedAwaTheme): {container: string; silhouette: string; outline: string} {
  const c = theme.colors;
  const container = interpolateHex(c.surface, c.primary, theme.isDark ? 0.3 : 0.18);
  return {
    container,
    silhouette: ensureContrast(c.primary, container, WCAG_AA_TEXT, c.text),
    outline: withAlpha(c.primary, 0.35),
  };
}

export default function AnonymousProfileIcon({size}: {size: number}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const colors = useMemo(() => anonymousProfileIconColors(theme), [theme]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.circle, {width: size, height: size, borderRadius: size / 2, backgroundColor: colors.container, borderColor: colors.outline}]}>
      <MaterialDesignIcons color={colors.silhouette} name="account" size={Math.round(size * 0.62)} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {alignItems: 'center', justifyContent: 'center', borderWidth: 1},
});
