import React, {useMemo} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';

// The SAME background system every AWA dashboard already uses (PregnancyDashboard.tsx,
// CycleHomeScreen.tsx, ConceiveDashboard.tsx, ContraceptionDashboard.tsx,
// IrregularDashboard.tsx, MenopauseDashboard.tsx, MiscarriageDashboard.tsx,
// PostpartumDashboard.tsx — all identical): theme.gradients.pageBackground on a diagonal
// (locations [0, 0.32, 0.7, 1], start top-left, end bottom-right), plus 3 soft
// absolutely-positioned decorative "glow" circles (withAlpha(theme.colors.primary, …))
// behind the content. Fully theme-driven, so it follows Light/Dark/every palette exactly
// like the dashboards do — nothing here is a new palette or a hardcoded hex.
//
// Background-only: no SafeAreaView, no ScrollView, no business logic. Each partner screen
// keeps its own existing useSafeAreaInsets()/ScrollView handling untouched — this only
// replaces the flat, undecorated gradient wrapper they used before.
export default function PartnerScreenBackground({children}: {children: React.ReactNode}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.decor}>
        <View style={styles.glowTop} />
        <View style={styles.glowMiddle} />
        <View style={styles.glowBottom} />
      </View>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      {children}
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},
    decor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
    glowTop: {
      position: 'absolute',
      top: -150,
      right: -110,
      width: 330,
      height: 330,
      borderRadius: 165,
      backgroundColor: withAlpha(theme.colors.primary, 0.07),
    },
    glowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },
    glowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor: withAlpha(theme.colors.primary, 0.05),
    },
  });
}
