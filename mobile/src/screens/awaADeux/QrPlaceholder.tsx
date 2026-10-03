/* eslint-disable no-bitwise -- a tiny deterministic hash for the placeholder picture is bit manipulation by definition */
import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Svg, {Rect} from 'react-native-svg';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// VISUAL PLACEHOLDER for the association QR code — NOT a real, scannable QR code.
//
// AWA has no QR-encoding library (only react-native-svg is installed, which draws but
// does not encode), and this phase must not add a dependency. So this draws a QR-looking
// grid from react-native-svg: the three finder squares plus modules derived
// deterministically from the text. It encodes nothing. When real pairing exists, replace
// it with a real QR component fed with the real invitation value.

const GRID = 25;
const QUIET = 2; // quiet zone, in modules

// Small deterministic hash → pseudo-random bits (same text → same picture).
function bitsFor(text: string): boolean[] {
  let seed = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    seed = Math.imul(seed ^ text.charCodeAt(index), 16777619) >>> 0;
  }
  const bits: boolean[] = [];
  for (let index = 0; index < GRID * GRID; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    bits.push(((seed >>> 16) & 3) !== 0 && ((seed >>> 8) & 1) === 1);
  }
  return bits;
}

const inFinder = (x: number, y: number) => {
  const near = (value: number) => value < 8;
  const far = (value: number) => value >= GRID - 8;
  return (near(x) && near(y)) || (far(x) && near(y)) || (near(x) && far(y));
};

type Props = {
  value: string;
  size?: number;
};

export default function QrPlaceholder({value, size = 200}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);

  const modules = useMemo(() => {
    const bits = bitsFor(value);
    const cells: Array<{x: number; y: number}> = [];
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID; x += 1) {
        const centre = x >= 9 && x <= 15 && y >= 9 && y <= 15; // room for the heart
        if (!inFinder(x, y) && !centre && bits[y * GRID + x]) {cells.push({x, y});}
      }
    }
    return cells;
  }, [value]);

  const total = GRID + QUIET * 2;
  const finders = [
    {x: 0, y: 0},
    {x: GRID - 7, y: 0},
    {x: 0, y: GRID - 7},
  ];

  return (
    <View
      accessibilityLabel={t('awaADeux.dialogs.qr.accessibility', {code: value})}
      accessibilityRole="image"
      style={styles.box}>
      <Svg height={size} viewBox={`0 0 ${total} ${total}`} width={size}>
        {modules.map(cell => (
          <Rect key={`${cell.x}-${cell.y}`} fill={theme.colors.text} height={1} width={1} x={cell.x + QUIET} y={cell.y + QUIET} />
        ))}
        {finders.map(finder => (
          <React.Fragment key={`${finder.x}-${finder.y}`}>
            <Rect fill={theme.colors.text} height={7} width={7} x={finder.x + QUIET} y={finder.y + QUIET} />
            <Rect fill={theme.colors.surface} height={5} width={5} x={finder.x + QUIET + 1} y={finder.y + QUIET + 1} />
            <Rect fill={theme.colors.text} height={3} width={3} x={finder.x + QUIET + 2} y={finder.y + QUIET + 2} />
          </React.Fragment>
        ))}
      </Svg>
      <View style={styles.heart}>
        <MaterialDesignIcons color={theme.colors.primary} name="heart" size={size * 0.13} />
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme, size: number) {
  return StyleSheet.create({
    box: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    heart: {
      position: 'absolute',
      width: size * 0.2,
      height: size * 0.2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size * 0.05,
      backgroundColor: theme.colors.surface,
    },
  });
}
