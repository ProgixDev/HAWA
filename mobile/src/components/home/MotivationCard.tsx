import React, {memo, useMemo} from 'react';
import {ImageBackground, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {homeRadii} from './homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaText} from '../ui/AwaText';
import '../../i18n';
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
  const {t} = useTranslation();
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
        <AwaText emphasized style={styles.title} variant="titleMedium">{t('motivationCard.title')}</AwaText>
        <AwaText style={styles.subtitle} variant="bodySmall">{t('motivationCard.subtitle')}</AwaText>
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
    title: {
  marginLeft: -14,
  color: '#2F2258',
},

subtitle: {
  marginTop: 4,
  marginLeft: -14,
  color: '#746D92',
},
  });
}

export default memo(MotivationCard);
