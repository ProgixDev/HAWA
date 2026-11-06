import React, {useMemo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaText} from '../ui/AwaText';
import {GlassIcon} from '../ui/GlassIcon';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  title: string;
  /** The description under the title. */
  description: string;
  /** Icon of the section (Material Design Icons: the icon library AWA already uses; Lucide is not installed). */
  icon: IconName;
  onPress?: () => void;
  /** Colour of the icon; the theme's primary by default. */
  iconColor?: string;
  /** Optional current value (for example the chosen objective), shown in the primary colour under the description. */
  status?: string;
};

/** One settings entry: a rounded, bordered card on the theme surface with, from left to right, a small round "glass" container holding
 * the section's icon (translucent primary fill, hairline border, soft inner highlight; stronger fill in dark mode, very light in light
 * mode), the bold title with its description, and a chevron. A light press animation. */
export function SettingsCard({title, description, icon, onPress, iconColor, status}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {toValue, damping: 18, stiffness: 260, mass: 0.8, useNativeDriver: true}).start();

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
        style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
        <GlassIcon color={iconColor} icon={icon} />

        <View style={styles.copy}>
          <AwaText emphasized variant="titleSmall">{title}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.description} variant="bodySmall">{description}</AwaText>
          {status ? <AwaText colorRole="primary" emphasized style={styles.description} variant="labelMedium">{status}</AwaText> : null}
        </View>

        <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    cardPressed: {opacity: 0.92},
    copy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    description: {marginTop: 3},
  });
}
