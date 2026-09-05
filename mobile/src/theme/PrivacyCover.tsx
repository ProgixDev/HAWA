import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useAwaTheme} from './AwaThemeProvider';
import type {ResolvedAwaTheme} from './awaThemeTokens';

// GLOBAL LIGHT/DARK MIGRATION — App.tsx's full-screen "backgrounded" privacy
// cover used to be a fixed light-lavender View, permanently light regardless
// of the resolved theme. Extracted into its own component (same reason as
// AwaRootStatusBar: App() itself renders AwaThemeProvider, so it can't call
// useAwaTheme() directly — only a child of the provider can), so this now
// reacts to System/Light/Dark/True Black exactly like the rest of the app.
export function PrivacyCover(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View accessibilityLabel="AWA protégée" style={styles.cover}>
      <Text style={styles.title}>AWA</Text>
      <Text style={styles.subtitle}>Ton espace reste privé</Text>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    cover: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10000,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 38,
      fontWeight: '700',
      letterSpacing: 5,
    },
    subtitle: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
  });
}
