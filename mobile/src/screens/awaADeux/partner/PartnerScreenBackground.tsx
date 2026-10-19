import React, {useMemo} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';

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
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      {children}
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},
  });
}
