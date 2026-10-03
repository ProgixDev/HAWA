import React from 'react';
import {StyleSheet, View} from 'react-native';

import {ANONYMOUS_AVATAR_ILLUSTRATIONS, type AnonymousAvatarIllustrationId} from './anonymousAvatarIllustrations';
import type {AnonymousAvatarStyleId} from '../../state/profileAvatarPreferences';
import i18n from '../../i18n';

// Single source of truth for the anonymous avatar CHOICES (id + label) —
// shared by ProfileScreen's header and AnonymousAvatarCustomizerScreen so
// they can never disagree about what a saved preference looks like. The
// illustrations themselves live in anonymousAvatarIllustrations.tsx. Labels
// are kept on this same array reference and refreshed in place on
// languageChanged (see buildAvatarStyleLabels() below) rather than converted
// to a getStyles(t) factory, since it's exported and consumed by two
// independent screens.
export const ANONYMOUS_AVATAR_STYLES: Array<{id: AnonymousAvatarIllustrationId; label: string}> = [
  {id: 'hijab', label: ''},
  {id: 'glasses', label: ''},
  {id: 'hat', label: ''},
  {id: 'minimal', label: ''},
  {id: 'headscarfGlasses', label: ''},
  {id: 'silhouetteHat', label: ''},
  {id: 'turban', label: ''},
  {id: 'shortHair', label: ''},
];

function applyAvatarStyleLabels(): void {
  ANONYMOUS_AVATAR_STYLES.forEach(style => {
    style.label = i18n.t(`anonymous.avatarStyles.${style.id}`);
  });
}

applyAvatarStyleLabels();
i18n.on('languageChanged', applyAvatarStyleLabels);

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
