import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import type {CycleRegularity} from '../../state/onboardingPreferences';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type PredictionItem = {key: string; icon: IconName; label: string; value: string; subtitle: string};

type Props = {
  items: PredictionItem[];
  regularity: CycleRegularity;
};

const CONFIDENCE: Record<CycleRegularity, {label: string; color: string; bg: string}> = {
  yes: {label: 'Fiabilité élevée', color: homeColors.green, bg: homeColors.greenLight},
  no: {label: 'Fiabilité modérée', color: '#B58A2E', bg: '#FBF1DC'},
  unknown: {label: 'Fiabilité limitée', color: homeColors.textSecondary, bg: homeColors.lightLavender},
};

function PredictionsCard({items, regularity}: Props): React.JSX.Element {
  const confidence = CONFIDENCE[regularity];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Prédictions personnalisées</Text>
        <View style={[styles.confidenceBadge, {backgroundColor: confidence.bg}]}>
          <Text numberOfLines={1} style={[styles.confidenceText, {color: confidence.color}]}>{confidence.label}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {items.map(item => (
          <View key={item.key} style={styles.column}>
            <View style={styles.iconCircle}>
              <MaterialDesignIcons color={homeColors.primary} name={item.icon} size={17} />
            </View>
            <Text numberOfLines={2} style={styles.label}>{item.label}</Text>
            <Text numberOfLines={2} style={styles.value}>{item.value}</Text>
            <Text numberOfLines={2} style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.captionRow}>
        <MaterialDesignIcons color={homeColors.textSecondary} name="information-outline" size={14} />
        <Text style={styles.caption}>Prédictions calculées à partir de tes cycles enregistrés.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },
  header: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  title: {flexShrink: 1, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  confidenceBadge: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5},
  confidenceText: {fontSize: 10.5, fontWeight: '700'},
  row: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
  column: {flexBasis: '42%', flexGrow: 1, alignItems: 'center'},
  iconCircle: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: homeColors.lightLavender},
  label: {marginTop: 7, color: homeColors.textSecondary, fontSize: 10, textAlign: 'center'},
  value: {marginTop: 3, color: homeColors.textPrimary, fontSize: 12.5, fontWeight: '700', textAlign: 'center'},
  subtitle: {marginTop: 1, color: homeColors.textSecondary, fontSize: 9.5, textAlign: 'center'},
  captionRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 14},
  caption: {flex: 1, color: homeColors.textSecondary, fontSize: 10.5, lineHeight: 14},
});

export default memo(PredictionsCard);
