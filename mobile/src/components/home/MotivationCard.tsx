import React, {memo, useMemo} from 'react';
import {ImageBackground, StyleSheet, Text, View} from 'react-native';

import {homeRadii} from './homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';

const WOMEN = require('../../assets/images/women.png');

// PHASE D1 — `title`/`subtitle` are deliberately NOT theme-driven: they're
// calibrated to read against this fixed photograph's own lighting (dark
// text over its naturally light area), which never changes with the
// palette. Making them theme-aware (e.g. switching to light text in Dark
// mode) would produce unreadable text over the same unchanged image —
// verify first, per the audit's own instruction, rather than blindly
// theming every color. Only the card's own fallback/edge background (never
// under the text) is migrated.
function MotivationCard(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ImageBackground
      accessibilityIgnoresInvertColors
      imageStyle={styles.image}
      resizeMode="cover"
      source={WOMEN}
      style={styles.card}>
      <View style={styles.spacer} />
      <View style={styles.copy}>
        <Text style={styles.title}>Prends soin de toi, tu es précieuse ✨</Text>
        <Text style={styles.subtitle}>Chaque petit pas compte.</Text>
      </View>
    </ImageBackground>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      minHeight: 118,
      borderRadius: homeRadii.card,
      overflow: 'hidden',
      backgroundColor: theme.colors.primarySoft,
    },
    image: {borderRadius: homeRadii.card},
    spacer: {flex: 0.85},
    copy: {flex: 1.15, paddingVertical: 16, paddingRight: 18},
    // Fixed — see file header note (calibrated against the fixed photo).
    title: {color: '#2F2258', fontFamily: 'serif', fontSize: 15.5, fontWeight: '700', lineHeight: 21},
    subtitle: {marginTop: 5, color: '#746D92', fontSize: 12},
  });
}

export default memo(MotivationCard);
