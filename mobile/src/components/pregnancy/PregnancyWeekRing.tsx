import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';
import {homeColors} from '../home/homeTheme';

// The pregnancy's progress as a circle: the same 60-segment ring as the cycle ring (CycleProgressRing), filled in proportion to the week reached out of the
// 40 weeks. Drawn only from the values it is given; the caller owns the card around it and decides whether the week may be shown at all.

const SEGMENT_COUNT = 60;
const TOTAL_WEEKS = 40;
const CENTER_RATIO = 82 / 116; // the same disc / ring ratio as the cycle ring

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
};
/** `from` → `to` at `ratio` (0..1), as `rgb(r, g, b)`. */
const mixColors = (from: string, to: string, ratio: number): string => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * ratio)).join(', ')})`;
};

type Props = {
  /** Current pregnancy week, 1-based. */
  week: number;
  /** Small word under the number ("semaine"). */
  caption: string;
  size?: number;
  accessibilityLabel?: string;
};

export default function PregnancyWeekRing({week, caption, size = 116, accessibilityLabel}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const progress = Math.min(Math.max(week / TOTAL_WEEKS, 0), 1);
  const filled = Math.round(progress * SEGMENT_COUNT);

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityLabel ? 'image' : undefined} style={styles.ring}>
      {Array.from({length: SEGMENT_COUNT}, (_, index) => (
        <View key={index} style={[styles.orbit, {transform: [{rotate: `${index * (360 / SEGMENT_COUNT)}deg`}]}]}>
          <View
            style={[
              styles.segment,
              index < filled ? {backgroundColor: mixColors(theme.colors.primary, homeColors.pink, filled > 1 ? index / (filled - 1) : 0)} : styles.segmentTrack,
            ]}
          />
        </View>
      ))}
      <View style={styles.center}>
        <AwaText allowFontScaling={false} colorRole="onSurfaceVariant" numberOfLines={1} style={styles.caption} variant="labelSmall">{caption}</AwaText>
        <AwaText allowFontScaling={false} emphasized style={styles.number} variant="headlineSmall">{String(week)}</AwaText>
        <MaterialDesignIcons color={theme.colors.primary} name="heart" size={Math.max(12, Math.round(size * 0.13))} style={styles.heart} />
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme, size: number) {
  const centerSize = Math.round(size * CENTER_RATIO);
  return StyleSheet.create({
    ring: {width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center'},
    orbit: {position: 'absolute', width: size, height: size, alignItems: 'center'},
    segment: {position: 'absolute', top: 0, width: 3, height: 8, borderRadius: 2},
    segmentTrack: {backgroundColor: theme.colors.primarySoft},
    center: {width: centerSize, height: centerSize, alignItems: 'center', justifyContent: 'center', borderRadius: centerSize / 2, backgroundColor: theme.colors.primarySoft},
    caption: {textAlign: 'center', includeFontPadding: false},
    number: {marginTop: 2, textAlign: 'center', includeFontPadding: false},
    heart: {marginTop: 2},
  });
}
