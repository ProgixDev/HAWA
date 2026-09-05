import React from 'react';
import {StyleSheet, View} from 'react-native';

import {colors} from '../theme/colors';

type BotanicalDecorationProps = {
  side: 'left' | 'right';
};

const leaves = [
  {bottom: 38, offset: 12, rotate: -35},
  {bottom: 82, offset: 32, rotate: 32},
  {bottom: 126, offset: 5, rotate: -28},
  {bottom: 168, offset: 29, rotate: 38},
  {bottom: 210, offset: 9, rotate: -24},
];

const toDegree = (value: number): `${number}deg` =>
  `${Number.isFinite(value) ? value : 0}deg`;

function BotanicalDecoration({side}: BotanicalDecorationProps): React.JSX.Element {
  const isLeft = side === 'left';

  return (
    <View
      pointerEvents="none"
      style={[styles.container, isLeft ? styles.left : styles.right]}>
      <View style={[styles.stem, !isLeft && styles.mirroredStem]} />
      {leaves.map((leaf, index) => (
        <View
          key={`${side}-${leaf.bottom}`}
          style={[
            styles.leaf,
            {
              bottom: leaf.bottom,
              [isLeft ? 'left' : 'right']: leaf.offset,
              transform: [
                {rotate: toDegree(isLeft ? leaf.rotate : -leaf.rotate)},
                {scaleX: index % 2 === 0 ? 1 : -1},
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -18,
    width: 110,
    height: 270,
    opacity: 0.12,
  },
  left: {left: -16},
  right: {right: -16},
  stem: {
    position: 'absolute',
    bottom: -20,
    left: 42,
    width: 2,
    height: 285,
    borderRadius: 2,
    backgroundColor: colors.muted,
    transform: [{rotate: '18deg'}],
  },
  mirroredStem: {left: 66, transform: [{rotate: '-18deg'}]},
  leaf: {
    position: 'absolute',
    width: 34,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.muted,
  },
});

export default BotanicalDecoration;
