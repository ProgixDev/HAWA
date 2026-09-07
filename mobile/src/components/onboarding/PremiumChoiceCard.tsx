import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// Shared selectable option card for the single-choice onboarding steps
// (icon + title + subtitle + radio, selected = purple border + light
// lavender fill + filled radio) — used by MiscarriageBleedingScreen,
// MiscarriageCycleReturnScreen and MiscarriageTryingAgainScreen so the
// three screens stay visually identical without triplicating the same
// ~150 lines of styles.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  icon: IconName;
  iconTint: string;
  /** Overrides the icon glyph color (defaults to `theme.colors.primary`).
   * Lets a caller keep this shared component's own theme-resolution rules
   * untouched while still supplying a background-appropriate icon color for
   * an `iconTint` it has itself adapted for a specific surface (e.g. a
   * dark-mode-tinted chip) — see MenopauseDashboard's "Mon étape" sheet. */
  iconColor?: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  /** Extra content rendered inside the card, only while selected — e.g. the
   * conditional "date des règles revenues" field on MiscarriageCycleReturnScreen. */
  children?: React.ReactNode;
  /** 'radio' (default) keeps every existing single-select caller unchanged.
   * 'checkbox' swaps the trailing indicator for a check square and the
   * accessibility role for "checkbox" — for multi-select onboarding steps
   * (e.g. MenopauseSymptomsScreen) where more than one card can be selected
   * at once, without introducing a visually different sibling component. */
  selectionStyle?: 'radio' | 'checkbox';
};

function PremiumChoiceCard({
  icon,
  iconTint,
  iconColor,
  title,
  subtitle,
  selected,
  onPress,
  children,
  selectionStyle = 'radio',
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isCheckbox = selectionStyle === 'checkbox';
  return (
    <Pressable
      accessibilityRole={isCheckbox ? 'checkbox' : 'radio'}
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, {backgroundColor: iconTint}]}>
          <MaterialDesignIcons color={iconColor ?? theme.colors.primary} name={icon} size={22} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {isCheckbox ? (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} /> : null}
          </View>
        ) : (
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
        )}
      </View>

      {selected && children ? <View style={styles.extra}>{children}</View> : null}
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      minHeight: 74,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 13,
      paddingVertical: 12,
      elevation: 3,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.07,
      shadowRadius: 9,
    },
    cardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    row: {flexDirection: 'row', alignItems: 'center'},
    iconBox: {
      width: 46,
      height: 46,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
    },
    copy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    title: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19},
    subtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    radio: {
      width: 22,
      height: 22,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 11,
    },
    radioSelected: {borderColor: theme.colors.primary},
    radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary},
    checkbox: {
      width: 22,
      height: 22,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 7,
    },
    checkboxSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    extra: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    pressed: {opacity: 0.86},
  });
}

export default PremiumChoiceCard;
