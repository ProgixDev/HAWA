import React, {memo, useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import '../../i18n';

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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AwaCard style={styles.card} variant="filled">
      <View style={styles.header}>
        <AwaText style={styles.title} variant="titleMedium">{t('calendar.timelineTitle')}</AwaText>
        {/* Only rendered when a destination is supplied — never a link that
            looks tappable but does nothing. */}
        {onPressSeeAll ? (
          <AwaButton
            hitSlop={8}
            label={t('objectiveArticles.seeAll')}
            onPress={onPressSeeAll}
            size="compact"
            variant="text"
          />
        ) : null}
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
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepDate}>{step.date}</Text>
          </View>
        ))}
      </ScrollView>
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {marginTop: 16},
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    title: {flexShrink: 1},
    row: {flexDirection: 'row', marginTop: 16, paddingRight: 8},
    step: {minWidth: 84, paddingHorizontal: 4, alignItems: 'center'},
    stepHeader: {flexDirection: 'row', alignItems: 'center', width: '100%'},
    connector: {flex: 1, height: 2, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    connectorHidden: {flex: 1, height: 2, backgroundColor: 'transparent'},
    dot: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15},
    stepLabel: {marginTop: 8, color: theme.colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16},
    stepDate: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center'},
  });
}

export default memo(CycleTimelineCard);
