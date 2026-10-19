import React, {memo, useMemo} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {awaShapes} from '../../theme/shapes';
import {awaSpace} from '../../theme/spaceScale';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaText} from '../ui/AwaText';
import {pressedStyle} from '../ui/pressFeedback';

// The "Filtres" / "Légende" action chip in the header of EVERY calendar (generic cycle, conception, pregnancy,
// postpartum, miscarriage, contraception, irregular, menopause). It used to be copied into each calendar with a fixed
// 52 x 52 box that the 11 sp label filled edge to edge; this one grows with its label, keeps 8 dp between icon and
// text and 12 dp of padding inside the border, and is the only definition so the calendars cannot drift apart again.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type CalendarHeaderActionProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

function CalendarHeaderActionComponent({icon, label, onPress}: CalendarHeaderActionProps): React.JSX.Element {
  const {roles} = useAwaTokens();
  const styles = useMemo(() => createStyles(roles), [roles]);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.chip, pressed && pressedStyle(roles.surface, roles.onSurface)]}>
      <MaterialDesignIcons color={roles.primary} name={icon} size={20} />
      <AwaText colorRole="primary" emphasized numberOfLines={1} variant="labelMedium">
        {label}
      </AwaText>
    </Pressable>
  );
}

function createStyles(roles: ReturnType<typeof useAwaTokens>['roles']) {
  return StyleSheet.create({
    chip: {
      minWidth: 64,
      minHeight: 56,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: awaSpace.s4,
      marginLeft: awaSpace.s8,
      paddingHorizontal: awaSpace.s12,
      paddingVertical: awaSpace.s8,
      borderWidth: 1,
      borderColor: roles.outlineVariant,
      borderRadius: awaShapes.large,
      backgroundColor: roles.surface,
    },
  });
}

export const CalendarHeaderAction = memo(CalendarHeaderActionComponent);
