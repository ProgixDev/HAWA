import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, PanResponder, Pressable, StyleSheet, useWindowDimensions, View, type LayoutRectangle} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {homeRadii} from './homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import '../../i18n';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {GlassIcon} from '../ui/GlassIcon';
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

// Every action's icon is drawn the same way, in every objective: a glass circle in the theme's primary tone (GlassIcon). The
// `iconColor`/`iconBg` the dashboards still pass are ignored — a per-action colour made some tiles (Journal quotidien, Statistiques) stand
// out from the others.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type QuickActionItem = {
  key: string;
  icon: IconName;
  /** Ignored (see above); kept so the dashboards that still pass them compile unchanged. */
  iconColor?: string;
  iconBg?: string;
  label: string;
  onPress?: () => void;
};

// `items` is ALWAYS the objective's full list. Spiritual entries (prayer
// times, Hijri calendar, Qadaa — see SPIRITUAL_QUICK_ACTION_KEYS) are hidden
// HERE, from the canonical spiritual-markers preference, so no dashboard
// keeps its own copy of that filter. Hidden entries keep their slot in the
// persisted order (turning the markers back ON restores the arrangement).
//
// CUSTOMISING: "Personnaliser" switches the tiles to edit mode — a tile is then DRAGGED (finger down, move, release) onto the tile whose place it
// should take; nothing is opened while editing. A long press on a tile also enters edit mode. "Terminé" goes back to normal use.
type Props = {items: QuickActionItem[]};

type TileProps = {
  item: QuickActionItem;
  editing: boolean;
  dragging: boolean;
  dropTarget: boolean;
  compact: boolean;
  onLayoutTile: (layout: LayoutRectangle) => void;
  onLongPress: () => void;
  onTap: () => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragStart: () => void;
  onDragEnd: (dx: number, dy: number) => void;
  styles: ReturnType<typeof createStyles>;
};

function QuickActionTile({item, editing, dragging, dropTarget, compact, onLayoutTile, onLongPress, onTap, onDragMove, onDragStart, onDragEnd, styles}: TileProps) {
  const {t} = useTranslation();
  const pan = useRef(new Animated.ValueXY()).current;
  // The PanResponder is created once; it always calls the latest handlers through this ref.
  const latest = useRef({editing, onDragMove, onDragStart, onDragEnd});
  latest.current = {editing, onDragMove, onDragStart, onDragEnd};

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.editing,
      onMoveShouldSetPanResponder: () => latest.current.editing,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onDragStart(),
      onPanResponderMove: (_event, gesture) => {
        pan.setValue({x: gesture.dx, y: gesture.dy});
        latest.current.onDragMove(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: (_event, gesture) => {
        pan.setValue({x: 0, y: 0});
        latest.current.onDragEnd(gesture.dx, gesture.dy);
      },
      onPanResponderTerminate: () => {
        pan.setValue({x: 0, y: 0});
        latest.current.onDragEnd(0, 0);
      },
    }),
  ).current;

  return (
    <Animated.View
      onLayout={event => onLayoutTile(event.nativeEvent.layout)}
      style={[
        styles.tileWrap,
        compact ? styles.tileWrapCompact : styles.tileWrapWide,
        dragging && styles.tileWrapDragging,
        {transform: [{translateX: pan.x}, {translateY: pan.y}, {scale: dragging ? 1.06 : 1}]},
      ]}
      {...(editing ? responder.panHandlers : {})}>
      <Pressable
        accessibilityHint={editing ? t('cycleHome.quickActions.reorderHint') : undefined}
        accessibilityLabel={item.label}
        accessibilityRole="button"
        delayLongPress={320}
        // While editing, the touch belongs to the drag: the tile opens nothing.
        disabled={editing}
        onLongPress={onLongPress}
        onPress={onTap}
        style={({pressed}) => [styles.tile, editing && styles.tileEditing, (dragging || dropTarget) && styles.tileArmed, pressed && styles.pressed]}>
        <GlassIcon icon={item.icon} size={44} />

        <AwaText numberOfLines={2} style={styles.tileLabel} variant="labelMedium">{item.label}</AwaText>
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
  const [editing, setEditing] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const layouts = useRef<Record<string, LayoutRectangle>>({});
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

  // The tile whose rectangle contains the centre of the dragged tile (moved by dx / dy), or null.
  const tileUnder = (key: string, dx: number, dy: number): string | null => {
    const origin = layouts.current[key];
    if (!origin) {return null;}
    const centreX = origin.x + origin.width / 2 + dx;
    const centreY = origin.y + origin.height / 2 + dy;
    for (const other of visibleOrder) {
      const box = layouts.current[other];
      if (other !== key && box && centreX >= box.x && centreX <= box.x + box.width && centreY >= box.y && centreY <= box.y + box.height) {
        return other;
      }
    }
    return null;
  };

  // Dropped on another tile: the dragged tile takes that tile's place and the tiles in between shift by one.
  const drop = (key: string, dx: number, dy: number) => {
    const target = tileUnder(key, dx, dy);
    setDragKey(null);
    setTargetKey(null);
    if (!target) {return;}
    const nextVisible = [...visibleOrder];
    const from = nextVisible.indexOf(key);
    const to = nextVisible.indexOf(target);
    if (from < 0 || to < 0 || from === to) {return;}
    nextVisible.splice(to, 0, nextVisible.splice(from, 1)[0]);
    const nextFull = applyVisibleOrderToFullOrder(fullOrder, nextVisible);
    setOrder(nextFull);
    saveQuickActionsOrder(nextFull);
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
          icon={editing ? 'check' : 'pencil-outline'}
          label={editing ? t('cycleHome.quickActions.done') : t('cycleHome.quickActions.customize')}
          onPress={() => {
            setEditing(value => !value);
            setDragKey(null);
            setTargetKey(null);
          }}
          size="compact"
          variant={editing ? 'filled' : 'tonal'}
        />
      </View>

      <View style={styles.grid}>
        {ordered.map(item => (
          <QuickActionTile
            compact={compact}
            dragging={dragKey === item.key}
            dropTarget={targetKey === item.key}
            editing={editing}
            item={item}
            key={item.key}
            onDragEnd={(dx, dy) => drop(item.key, dx, dy)}
            onDragMove={(dx, dy) => {
              const target = tileUnder(item.key, dx, dy);
              setTargetKey(current => (current === target ? current : target));
            }}
            onDragStart={() => setDragKey(item.key)}
            onLayoutTile={layout => {layouts.current[item.key] = layout;}}
            onLongPress={() => setEditing(true)}
            onTap={() => item.onPress?.()}
            styles={styles}
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
    // the dragged tile floats above its neighbours
    tileWrapDragging: {zIndex: 10, elevation: 8, shadowColor: theme.colors.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: {width: 0, height: 4}},
    tile: {
      // one fixed height for every tile, so a two-line label ("Horaires de prière") does not make its card taller than the others
      height: 116,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: homeRadii.quickAction,
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    tileEditing: {borderColor: withAlpha(theme.colors.primary, 0.55)},
    tileArmed: {borderColor: theme.colors.primary, borderWidth: 1.5},
    tileLabel: {
      marginTop: 8,
      textAlign: 'center',
    },
    pressed: {opacity: 0.85, transform: [{scale: 0.98}]},
  });
}

export default memo(QuickActionsGrid);
