import React, {memo, useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

import {homeColors, homeRadii} from '../home/homeTheme';

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

  if (variant === 'card') {
    return (
      <Animated.View style={[styles.card, width ? {width} : styles.cardFallbackWidth, {opacity}]}>
        <View style={styles.cardThumb} />
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
        <View style={styles.track} />
      </Animated.View>
    );
  }

  if (variant === 'grid') {
    return (
      <Animated.View style={[styles.grid, {opacity}]}>
        <View style={styles.gridIcon} />
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.row, {opacity}]}>
      <View style={styles.rowThumb} />
      <View style={styles.rowContent}>
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
        <View style={styles.track} />
      </View>
    </Animated.View>
  );
}

const PLACEHOLDER = '#E9E2FA';

const styles = StyleSheet.create({
  card: {borderRadius: homeRadii.card, backgroundColor: '#FFFFFF', padding: 12, borderWidth: 1, borderColor: homeColors.cardBorder},
  cardFallbackWidth: {flexGrow: 1, minWidth: 150},
  cardThumb: {height: 96, borderRadius: 16, backgroundColor: PLACEHOLDER},
  grid: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    gap: 8,
  },
  gridIcon: {width: 40, height: 40, borderRadius: 14, backgroundColor: PLACEHOLDER},
  row: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
  },
  rowThumb: {width: 64, height: 64, borderRadius: 16, backgroundColor: PLACEHOLDER, flexShrink: 0},
  rowContent: {flex: 1, minWidth: 0, gap: 8, justifyContent: 'center'},
  line: {height: 10, marginTop: 10, borderRadius: 5, backgroundColor: PLACEHOLDER, width: '90%'},
  lineShort: {width: '55%', marginTop: 6},
  track: {height: 6, marginTop: 10, borderRadius: 3, backgroundColor: PLACEHOLDER, width: '100%'},
});

export default memo(ArticleCardSkeleton);
