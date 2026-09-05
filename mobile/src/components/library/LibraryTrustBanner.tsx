import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii} from '../home/homeTheme';

function LibraryTrustBanner(): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialDesignIcons color={homeColors.primary} name="shield-check-outline" size={20} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Contenus rédigés par des professionnels</Text>
        <Text style={styles.subtitle}>Toutes nos informations sont vérifiées et validées par des professionnels de santé et des savants.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: homeRadii.card,
    backgroundColor: homeColors.lightLavender,
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  content: {flex: 1, minWidth: 0},
  title: {color: homeColors.primary, fontSize: 13, fontWeight: '700'},
  subtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 11.5, lineHeight: 16},
});

export default memo(LibraryTrustBanner);
