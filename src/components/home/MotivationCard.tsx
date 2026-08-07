import React, {memo} from 'react';
import {ImageBackground, StyleSheet, Text, View} from 'react-native';

import {homeColors, homeRadii} from './homeTheme';

const WOMEN = require('../../assets/images/women.png');

function MotivationCard(): React.JSX.Element {
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    minHeight: 118,
    borderRadius: homeRadii.card,
    overflow: 'hidden',
    backgroundColor: homeColors.lightLavender,
  },
  image: {borderRadius: homeRadii.card},
  spacer: {flex: 0.85},
  copy: {flex: 1.15, paddingVertical: 16, paddingRight: 18},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 15.5, fontWeight: '700', lineHeight: 21},
  subtitle: {marginTop: 5, color: homeColors.textSecondary, fontSize: 12},
});

export default memo(MotivationCard);
