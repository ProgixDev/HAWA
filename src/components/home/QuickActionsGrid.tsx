import React, {memo, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from './homeTheme';
import {loadQuickActionsOrder, saveQuickActionsOrder} from '../../state/quickActionsPreferences';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type QuickActionItem = {
  key: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress?: () => void;
};

type Props = {items: QuickActionItem[]};

type TileProps = {
  item: QuickActionItem;
  armed: boolean;
  reorderMode: boolean;
  compact: boolean;
  onLongPress: () => void;
  onTap: () => void;
};

function QuickActionTile({item, armed, reorderMode, compact, onLongPress, onTap}: TileProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: armed ? 1.05 : 1,
      damping: 14,
      stiffness: 220,
      useNativeDriver: true,
    }).start();

    if (armed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {toValue: 1, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
          Animated.timing(glow, {toValue: 0.35, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }

    glow.setValue(0);
    return undefined;
  }, [armed, glow, scale]);

  return (
    <Animated.View style={[styles.tileWrap, compact ? styles.tileWrapCompact : styles.tileWrapWide, {transform: [{scale}]}]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glow,
            shadowOpacity: glow.interpolate({inputRange: [0, 1], outputRange: [0, 0.45]}),
          },
        ]}
      />
      <Pressable
        accessibilityHint={reorderMode ? 'Touche une autre carte pour l’échanger de place' : undefined}
        accessibilityLabel={item.label}
        accessibilityRole="button"
        delayLongPress={320}
        onLongPress={onLongPress}
        onPress={onTap}
        style={({pressed}) => [styles.tile, armed && styles.tileArmed, pressed && !armed && styles.pressed]}>
        <Pressable
          accessibilityLabel={`Options pour ${item.label}`}
          hitSlop={8}
          onPress={onLongPress}
          style={styles.menuDot}>
          <MaterialDesignIcons color={homeColors.textSecondary} name="dots-vertical" size={14} />
        </Pressable>

        <View style={[styles.iconCircle, {backgroundColor: item.iconBg}]}>
          <MaterialDesignIcons color={item.iconColor} name={item.icon} size={20} />
        </View>

        <Text numberOfLines={2} style={styles.tileLabel}>{item.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function QuickActionsGrid({items}: Props): React.JSX.Element {
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const [order, setOrder] = useState<string[]>(() => items.map(item => item.key));
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadQuickActionsOrder().then(saved => {
      if (!mounted || !saved) {return;}
      const knownKeys = items.map(item => item.key);
      const isValid = saved.length === knownKeys.length && saved.every(key => knownKeys.includes(key));
      if (isValid) {setOrder(saved);}
    });
    return () => {mounted = false;};
    // Only re-validate against a saved order once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arm = (key: string) => {
    setArmedKey(current => {
      if (current === key) {return null;}
      if (current) {
        setOrder(previous => {
          const next = [...previous];
          const from = next.indexOf(current);
          const to = next.indexOf(key);
          [next[from], next[to]] = [next[to], next[from]];
          saveQuickActionsOrder(next);
          return next;
        });
        return null;
      }
      return key;
    });
  };

  const handleTap = (item: QuickActionItem) => {
    if (armedKey) {
      arm(item.key);
      return;
    }
    item.onPress?.();
  };

  const byKey = new Map(items.map(item => [item.key, item]));
  const ordered = order.map(key => byKey.get(key)).filter((item): item is QuickActionItem => Boolean(item));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Actions rapides</Text>
          <Text style={styles.subtitle}>Appuie longuement pour personnaliser</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setReorderMode(value => !value);
            setArmedKey(null);
          }}
          style={({pressed}) => [styles.customizeButton, reorderMode && styles.customizeButtonActive, pressed && styles.pressed]}>
          <MaterialDesignIcons
            color={reorderMode ? '#FFFFFF' : homeColors.primary}
            name={reorderMode ? 'check' : 'pencil-outline'}
            size={14}
          />
          <Text style={[styles.customizeText, reorderMode && styles.customizeTextActive]}>
            {reorderMode ? 'Terminé' : 'Personnaliser'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {ordered.map(item => (
          <QuickActionTile
            armed={armedKey === item.key}
            compact={compact}
            item={item}
            key={item.key}
            onLongPress={() => arm(item.key)}
            onTap={() => handleTap(item)}
            reorderMode={reorderMode}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },
  header: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  headerCopy: {flex: 1, marginRight: 10},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  subtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 11},
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 30,
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.lightLavender,
    paddingHorizontal: 11,
  },
  customizeButtonActive: {backgroundColor: homeColors.primary},
  customizeText: {color: homeColors.primary, fontSize: 11.5, fontWeight: '700'},
  customizeTextActive: {color: '#FFFFFF'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 10},
  tileWrap: {position: 'relative', flexGrow: 1},
  tileWrapWide: {flexBasis: '30%'},
  tileWrapCompact: {flexBasis: '46%'},
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: homeRadii.quickAction,
    backgroundColor: homeColors.primary,
    shadowColor: homeColors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowRadius: 12,
    elevation: 6,
  },
  tile: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: homeRadii.quickAction,
    backgroundColor: '#FFFDFF',
    paddingVertical: 12,
    paddingHorizontal: 4,
    shadowColor: homeColors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tileArmed: {borderColor: homeColors.primary, borderWidth: 1.5},
  menuDot: {position: 'absolute', top: 6, right: 6, padding: 3},
  iconCircle: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  tileLabel: {
    marginTop: 8,
    color: homeColors.textPrimary,
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  pressed: {opacity: 0.85, transform: [{scale: 0.98}]},
});

export default memo(QuickActionsGrid);
