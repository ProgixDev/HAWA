import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {homeRadii} from './homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import '../../i18n';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {
  applyVisibleOrderToFullOrder,
  filterQuickActionsForSpiritualMarkers,
  loadQuickActionsOrder,
  resolveQuickActionsOrder,
  saveQuickActionsOrder,
} from '../../state/quickActionsPreferences';
import {
  getSpiritualMarkersEnabled,
  hydrateSpiritualMarkersEnabled,
  subscribeSpiritualMarkersEnabled,
} from '../../state/onboardingPreferences';

// PHASE C — `item.iconColor`/`item.iconBg` are supplied by the CALLING
// objective dashboard, one pair per action, encoding that action's own
// category identity (e.g. a specific tint per action type). This component
// never owns those colors and must not recolor them — only its own generic
// card/border/label/shadow/"customize" chrome is migrated here.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type QuickActionItem = {
  key: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress?: () => void;
};

// `items` is ALWAYS the objective's full list. Spiritual entries (prayer
// times, Hijri calendar, Qadaa — see SPIRITUAL_QUICK_ACTION_KEYS) are hidden
// HERE, from the canonical spiritual-markers preference, so no dashboard
// keeps its own copy of that filter. Hidden entries keep their slot in the
// persisted order (turning the markers back ON restores the arrangement).
type Props = {items: QuickActionItem[]};

type TileProps = {
  item: QuickActionItem;
  armed: boolean;
  reorderMode: boolean;
  compact: boolean;
  onLongPress: () => void;
  onTap: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
};

function QuickActionTile({item, armed, reorderMode, compact, onLongPress, onTap, theme, styles}: TileProps) {
  const {t} = useTranslation();
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
      // DESIGN.md: no decorative looping pulse — the armed tile (reorder mode) fades its halo in once and holds it;
      // the 1.5 px primary border and the scale-up remain the functional "armed" feedback.
      Animated.timing(glow, {toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true}).start();
      return undefined;
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
            shadowOpacity: glow.interpolate({inputRange: [0, 1], outputRange: [0, 0.15]}),
          },
        ]}
      />
      <Pressable
        accessibilityHint={reorderMode ? t('cycleHome.quickActions.reorderHint') : undefined}
        accessibilityLabel={item.label}
        accessibilityRole="button"
        delayLongPress={320}
        onLongPress={onLongPress}
        onPress={onTap}
        style={({pressed}) => [styles.tile, armed && styles.tileArmed, pressed && !armed && styles.pressed]}>
        <Pressable
          accessibilityLabel={t('cycleHome.quickActions.optionsFor', {label: item.label})}
          hitSlop={14}
          onPress={onLongPress}
          style={styles.menuDot}>
          <MaterialDesignIcons color={theme.colors.textMuted} name="dots-vertical" size={14} />
        </Pressable>

        <View style={[styles.iconCircle, {backgroundColor: item.iconBg}]}>
          <MaterialDesignIcons color={item.iconColor} name={item.icon} size={20} />
        </View>

        <AwaText style={styles.tileLabel} variant="labelMedium">{item.label}</AwaText>
      </Pressable>
    </Animated.View>
  );
}

function QuickActionsGrid({items}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // FULL order (visible + hidden spiritual keys) — the persisted value.
  const [order, setOrder] = useState<string[]>(() => items.map(item => item.key));
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [spiritualMarkersEnabled, setSpiritualMarkersEnabledState] = useState(getSpiritualMarkersEnabled);

  useEffect(() => {
    let active = true;
    hydrateSpiritualMarkersEnabled().then(() => {
      if (active) {setSpiritualMarkersEnabledState(getSpiritualMarkersEnabled());}
    });
    const unsubscribe = subscribeSpiritualMarkersEnabled(() => {
      if (active) {setSpiritualMarkersEnabledState(getSpiritualMarkersEnabled());}
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    loadQuickActionsOrder().then(saved => {
      if (!mounted || !saved) {return;}
      // Validated against the objective's FULL key set (visible + hidden), so
      // an order saved while spiritual actions were hidden is never discarded.
      setOrder(resolveQuickActionsOrder(saved, items.map(item => item.key)));
    });
    return () => {mounted = false;};
    // Only re-validate against a saved order once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = filterQuickActionsForSpiritualMarkers(items, spiritualMarkersEnabled);
  const visibleKeySet = new Set(visibleItems.map(item => item.key));
  // Keys present in `items` but absent from the persisted order (an item added
  // later) are appended rather than silently dropped.
  const fullOrder = [
    ...order.filter(key => items.some(item => item.key === key)),
    ...items.map(item => item.key).filter(key => !order.includes(key)),
  ];
  const visibleOrder = fullOrder.filter(key => visibleKeySet.has(key));
  // An armed tile that just became hidden (toggle switched OFF) is disarmed.
  const effectiveArmedKey = armedKey && visibleKeySet.has(armedKey) ? armedKey : null;

  const arm = (key: string) => {
    if (effectiveArmedKey === key) {
      setArmedKey(null);
      return;
    }
    if (effectiveArmedKey) {
      const nextVisible = [...visibleOrder];
      const from = nextVisible.indexOf(effectiveArmedKey);
      const to = nextVisible.indexOf(key);
      [nextVisible[from], nextVisible[to]] = [nextVisible[to], nextVisible[from]];
      const nextFull = applyVisibleOrderToFullOrder(fullOrder, nextVisible);
      setOrder(nextFull);
      saveQuickActionsOrder(nextFull);
      setArmedKey(null);
      return;
    }
    setArmedKey(key);
  };

  const handleTap = (item: QuickActionItem) => {
    if (effectiveArmedKey) {
      arm(item.key);
      return;
    }
    item.onPress?.();
  };

  const byKey = new Map(visibleItems.map(item => [item.key, item]));
  const ordered = visibleOrder.map(key => byKey.get(key)).filter((item): item is QuickActionItem => Boolean(item));

  return (
    <AwaCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AwaText variant="titleMedium">{t('cycleHome.quickActions.title')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('cycleHome.quickActions.subtitle')}</AwaText>
        </View>

        <AwaButton
          icon={reorderMode ? 'check' : 'pencil-outline'}
          label={reorderMode ? t('cycleHome.quickActions.done') : t('cycleHome.quickActions.customize')}
          onPress={() => {
            setReorderMode(value => !value);
            setArmedKey(null);
          }}
          size="compact"
          variant={reorderMode ? 'filled' : 'tonal'}
        />
      </View>

      <View style={styles.grid}>
        {ordered.map(item => (
          <QuickActionTile
            armed={effectiveArmedKey === item.key}
            compact={compact}
            item={item}
            key={item.key}
            onLongPress={() => arm(item.key)}
            onTap={() => handleTap(item)}
            reorderMode={reorderMode}
            styles={styles}
            theme={theme}
          />
        ))}
      </View>
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {marginTop: 16},
    header: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
    headerCopy: {flex: 1, marginRight: 10},
    subtitle: {marginTop: 3},
    grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 10},
    tileWrap: {position: 'relative', flexGrow: 1},
    tileWrapWide: {flexBasis: '30%'},
    tileWrapCompact: {flexBasis: '46%'},
    glow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: homeRadii.quickAction,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: {width: 0, height: 0},
      shadowRadius: 12,
      elevation: 4,
    },
    tile: {
      minHeight: 96,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: homeRadii.quickAction,
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    tileArmed: {borderColor: theme.colors.primary, borderWidth: 1.5},
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
      textAlign: 'center',
    },
    pressed: {opacity: 0.85, transform: [{scale: 0.98}]},
  });
}

export default memo(QuickActionsGrid);
