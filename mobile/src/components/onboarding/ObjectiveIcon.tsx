import React, {useMemo} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {ObjectiveId} from '../../state/onboardingPreferences';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// The single source of truth for how an objective is drawn: one outlined Material Design icon per objective, in the
// theme's primary colour, inside a 46 dp bordered rounded square. Used by the objective picker of the onboarding
// (ObjectiveScreen) and by the "Changer mon objectif" bottom sheet of the Profile, so the two can never drift apart.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export const OBJECTIVE_ICONS: Readonly<Record<ObjectiveId, IconName>> = {
  cycle: 'calendar-month-outline',
  conceive: 'dna',
  contraception: 'plus-circle-outline',
  irregular: 'chart-line-variant',
  menopause: 'face-woman-shimmer-outline',
  pregnancy: 'human-pregnant',
  postpartum: 'human-female-girl',
  loss: 'sprout-outline',
};

export const OBJECTIVE_ICON_FRAME_SIZE = 46;
export const OBJECTIVE_ICON_SIZE = 26;

type Props = {
  objective: ObjectiveId;
  /** The chosen option: full-strength border and the soft primary fill. */
  selected?: boolean;
  /** Spacing from the caller (the picker and the sheet space the icon differently). */
  style?: StyleProp<ViewStyle>;
};

export function ObjectiveIcon({objective, selected = false, style}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View importantForAccessibility="no-hide-descendants" style={[styles.frame, selected && styles.frameSelected, style]}>
      <MaterialDesignIcons color={theme.colors.primary} name={OBJECTIVE_ICONS[objective]} size={OBJECTIVE_ICON_SIZE} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    frame: {
      width: OBJECTIVE_ICON_FRAME_SIZE,
      height: OBJECTIVE_ICON_FRAME_SIZE,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: withAlpha(theme.colors.primary, 0.4),
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    frameSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  });
}
