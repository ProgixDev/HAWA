import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

// Shared selectable option card for the single-choice onboarding steps
// (icon + title + subtitle + radio, selected = purple border + light
// lavender fill + filled radio) — used by MiscarriageBleedingScreen,
// MiscarriageCycleReturnScreen and MiscarriageTryingAgainScreen so the
// three screens stay visually identical without triplicating the same
// ~150 lines of styles.
const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  icon: IconName;
  iconTint: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  /** Extra content rendered inside the card, only while selected — e.g. the
   * conditional "date des règles revenues" field on MiscarriageCycleReturnScreen. */
  children?: React.ReactNode;
};

function PremiumChoiceCard({
  icon,
  iconTint,
  title,
  subtitle,
  selected,
  onPress,
  children,
}: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, {backgroundColor: iconTint}]}>
          <MaterialDesignIcons color={PURPLE} name={icon} size={22} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>

      {selected && children ? <View style={styles.extra}>{children}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 74,
    borderWidth: 1.4,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.94)',
    paddingHorizontal: 13,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.07,
    shadowRadius: 9,
  },
  cardSelected: {
    borderColor: PURPLE,
    backgroundColor: '#F5F0FC',
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
  title: {color: PURPLE_DARK, fontSize: 14.5, fontWeight: '700', lineHeight: 19},
  subtitle: {marginTop: 2, color: TEXT_SECONDARY, fontSize: 11.5, lineHeight: 16},
  radio: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#AE9BCF',
    borderRadius: 11,
  },
  radioSelected: {borderColor: PURPLE},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: PURPLE},
  extra: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(111,83,190,0.18)',
  },
  pressed: {opacity: 0.86},
});

export default PremiumChoiceCard;
