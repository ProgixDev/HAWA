import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';

function LibraryTrustBanner(): React.JSX.Element {
  const {roles} = useAwaTokens();

  return (
    <AwaCard padding="default" style={styles.card} variant="filled">
      <MaterialDesignIcons color={roles.accessible.primaryAsText} name="shield-check-outline" size={24} />
      <View style={styles.content}>
        <AwaText colorRole="primary" emphasized variant="titleSmall">Contenus rédigés par des professionnels</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">
          Toutes nos informations sont vérifiées et validées par des professionnels de santé et des savants.
        </AwaText>
      </View>
    </AwaCard>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginHorizontal: 16},
  content: {flex: 1, minWidth: 0},
  subtitle: {marginTop: 4},
});

export default memo(LibraryTrustBanner);
