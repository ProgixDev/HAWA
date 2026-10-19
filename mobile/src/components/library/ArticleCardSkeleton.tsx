import React, {memo, useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaCard} from '../ui/AwaCard';

type Props = {
  variant: 'card' | 'row' | 'grid';
  width?: number;
};

function useShimmer() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.4, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return pulse;
}

function ArticleCardSkeleton({variant, width}: Props): React.JSX.Element {
  const opacity = useShimmer();
  const {roles} = useAwaTokens();
  // The placeholder blocks use the tonal container so they read on the filled card in every palette and appearance.
  const block = {backgroundColor: roles.surfaceContainerHigh};

  if (variant === 'card') {
    return (
      <Animated.View style={[width ? {width} : styles.cardFallbackWidth, {opacity}]}>
        <AwaCard padding="compact" variant="filled">
          <View style={[styles.cardThumb, block]} />
          <View style={[styles.line, block]} />
          <View style={[styles.line, styles.lineShort, block]} />
          <View style={[styles.track, block]} />
        </AwaCard>
      </Animated.View>
    );
  }

  if (variant === 'grid') {
    return (
      <Animated.View style={[styles.grid, {opacity}]}>
        <AwaCard padding="default" style={styles.gridCard} variant="filled">
          <View style={[styles.gridIcon, block]} />
          <View style={[styles.line, block]} />
          <View style={[styles.line, styles.lineShort, block]} />
        </AwaCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{opacity}}>
      <AwaCard padding="default" style={styles.row} variant="filled">
        <View style={[styles.rowThumb, block]} />
        <View style={styles.rowContent}>
          <View style={[styles.line, block]} />
          <View style={[styles.line, styles.lineShort, block]} />
          <View style={[styles.track, block]} />
        </View>
      </AwaCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardFallbackWidth: {flexGrow: 1, minWidth: 152},
  cardThumb: {height: 96, borderRadius: 12},
  grid: {flexBasis: '48%', flexGrow: 1},
  gridCard: {gap: 8},
  gridIcon: {width: 40, height: 40, borderRadius: 12},
  row: {flexDirection: 'row', gap: 12},
  rowThumb: {width: 64, height: 64, borderRadius: 12, flexShrink: 0},
  rowContent: {flex: 1, minWidth: 0, gap: 8, justifyContent: 'center'},
  line: {height: 10, marginTop: 8, borderRadius: 5, width: '90%'},
  lineShort: {width: '55%', marginTop: 8},
  track: {height: 6, marginTop: 8, borderRadius: 3, width: '100%'},
});

export default memo(ArticleCardSkeleton);
