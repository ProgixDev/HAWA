import React from 'react';
import {StyleSheet, View} from 'react-native';

import {ANONYMOUS_AVATAR_ILLUSTRATIONS, type AnonymousAvatarIllustrationId} from './anonymousAvatarIllustrations';
import type {AnonymousAvatarStyleId} from '../../state/profileAvatarPreferences';

// Single source of truth for the anonymous avatar CHOICES (id + label) —
// shared by ProfileScreen's header and AnonymousAvatarCustomizerScreen so
// they can never disagree about what a saved preference looks like. The
// illustrations themselves live in anonymousAvatarIllustrations.tsx.
export const ANONYMOUS_AVATAR_STYLES: ReadonlyArray<{id: AnonymousAvatarIllustrationId; label: string}> = [
  {id: 'hijab', label: 'Avatar avec hijab'},
  {id: 'glasses', label: 'Avatar avec lunettes'},
  {id: 'hat', label: 'Avatar avec chapeau'},
  {id: 'minimal', label: 'Avatar minimal'},
  {id: 'headscarfGlasses', label: 'Avatar avec foulard et lunettes'},
  {id: 'silhouetteHat', label: 'Silhouette avec chapeau élégant'},
  {id: 'turban', label: 'Avatar avec turban'},
  {id: 'shortHair', label: 'Avatar aux cheveux courts'},
];

// Sober AWA palette for the backdrop behind the avatar — no baby pink,
// matches the rest of the anonymous-mode flow's purple/lavender identity.
export const ANONYMOUS_AVATAR_COLORS: readonly string[] = [
  '#6848C8', '#398783', '#61738B', '#5EAAA0', '#865BD3', '#B86755', '#557CA5', '#806B57',
];

export default function AnonymousAvatar({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style: AnonymousAvatarStyleId;
}): React.JSX.Element {
  const Illustration = ANONYMOUS_AVATAR_ILLUSTRATIONS[style] ?? ANONYMOUS_AVATAR_ILLUSTRATIONS.minimal;

  return (
    <View style={[styles.circle, {width: size, height: size, borderRadius: size / 2, backgroundColor: color}]}>
      <Illustration size={Math.round(size * 0.86)} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
});
