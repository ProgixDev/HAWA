import React, {memo, useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// `color` is caller-supplied (CalendarScreen.tsx passes the existing
// semantic period/fertile/ovulation/next constants) — this component never
// invents or re-themes those values, only the generic card chrome around them.
export type TimelineStep = {key: string; icon: IconName; label: string; date: string; color: string};

type Props = {
  steps: TimelineStep[];
  onPressSeeAll?: () => void;
};

function CycleTimelineCard({steps, onPressSeeAll}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline de ton cycle</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onPressSeeAll} style={({pressed}) => pressed && styles.pressed}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.step}>
            <View style={styles.stepHeader}>
              {index > 0 ? <View style={styles.connector} /> : <View style={styles.connectorHidden} />}
              <View style={[styles.dot, {backgroundColor: step.color}]}>
                <MaterialDesignIcons color={pickReadableTextColor(step.color)} name={step.icon} size={14} />
              </View>
              {index < steps.length - 1 ? <View style={styles.connector} /> : <View style={styles.connectorHidden} />}
            </View>
            <Text numberOfLines={2} style={styles.stepLabel}>{step.label}</Text>
            <Text numberOfLines={1} style={styles.stepDate}>{step.date}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    seeAll: {color: theme.colors.primary, fontSize: 12, fontWeight: '700'},
    row: {flexDirection: 'row', marginTop: 16, paddingRight: 8},
    step: {minWidth: 84, paddingHorizontal: 4, alignItems: 'center'},
    stepHeader: {flexDirection: 'row', alignItems: 'center', width: '100%'},
    connector: {flex: 1, height: 2, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    connectorHidden: {flex: 1, height: 2, backgroundColor: 'transparent'},
    dot: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15},
    stepLabel: {marginTop: 8, color: theme.colors.text, fontSize: 10.5, fontWeight: '600', textAlign: 'center', lineHeight: 13},
    stepDate: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 9.5, textAlign: 'center'},
    pressed: {opacity: 0.7},
  });
}

export default memo(CycleTimelineCard);
