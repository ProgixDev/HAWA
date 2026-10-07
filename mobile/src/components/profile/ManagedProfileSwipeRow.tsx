import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, PanResponder, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// Right-to-left swipe-to-reveal for ONE managed (daughter) profile row inside "Gérer
// les profils" (see ProfileScreen.tsx). Deliberately scoped: the mother's own row is
// simply never wrapped in this component, so it can never reveal delete — a
// structural guarantee rather than an extra runtime check.
//
// Gesture: React Native's own PanResponder + Animated — the project has no
// react-native-gesture-handler dependency; PanResponder is the SAME primitive
// DailyJournalSheet.tsx already uses for its own drag gesture, so this reuses what's
// already installed rather than adding one. Swiping never deletes anything itself —
// it only reveals a trash button; the caller (ProfileScreen.tsx) opens a confirmation
// dialog from `onDeletePress`.

const DELETE_WIDTH = 82;
const OPEN_THRESHOLD = -DELETE_WIDTH * 0.45;
const FLING_VELOCITY = -0.5;
const HORIZONTAL_CLAIM_DISTANCE = 10;
const SPRING = {damping: 20, stiffness: 220, useNativeDriver: true} as const;
// Same radius as the row content itself (ProfileScreen.tsx's objectiveOption).
// The delete capsule (deleteButton below) is rounded on ALL FOUR corners —
// not just the two facing the outer edge — so it reads as a genuine rounded
// capsule sitting BEHIND the sliding card (z-order: capsule first/back, card
// second/front — see the render tree below), rather than a rectangle whose
// only rounded side happens to be the one against the wrapper's own clipped
// edge. The capsule's LEFT corners stay progressively hidden under the
// sliding card until the swipe fully opens, at which point the card's own
// (flat) trailing edge lands exactly on the capsule's rounded left edge —
// that's what makes it read as "emerging from behind" instead of a hard cut.
const CARD_RADIUS = 19;
// Insets the capsule a few dp above/below the row's own edges so it reads as
// nested behind the card rather than exactly matching (and so visually
// competing with) the row's own full-height silhouette.
const DELETE_VERTICAL_INSET = 4;
const ICON_CIRCLE_SIZE = 32;

// Pure decision logic, exported separately so it can be unit-tested directly —
// PanResponder's own touch-responder machinery (TouchHistoryMath) cannot be driven
// faithfully from a plain Jest test without a real touch-event stream, but the
// actual RULES that matter (reveal threshold, fling velocity, horizontal-vs-vertical
// gating) are these two plain functions.

/** Claims the gesture only once it is clearly horizontal — a vertical drag (scrolling
 * the sheet) is always left to the parent ScrollView instead. */
export function shouldClaimSwipeGesture(dx: number, dy: number): boolean {
  return Math.abs(dx) > HORIZONTAL_CLAIM_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5;
}

/** Past this drag distance, or fast enough left-fling, the row snaps open on release. */
export function shouldRevealDelete(dx: number, vx: number): boolean {
  return dx < OPEN_THRESHOLD || vx < FLING_VELOCITY;
}

/** Clamps the row's horizontal offset between fully open (-DELETE_WIDTH) and closed (0). */
export function clampSwipeOffset(offset: number): number {
  return Math.min(0, Math.max(-DELETE_WIDTH, offset));
}

type Props = {
  children: React.ReactNode;
  /** True while a DIFFERENT row is the one currently open — closes this row if it was open. */
  forceClosed: boolean;
  /** Called once this row finishes opening (past the reveal threshold) — the
   * caller uses this to close any other currently-open row (only one open at a time). */
  onSwipeOpen: () => void;
  onDeletePress: () => void;
  deleteAccessibilityLabel: string;
};

export default function ManagedProfileSwipeRow({
  children,
  forceClosed,
  onSwipeOpen,
  onDeletePress,
  deleteAccessibilityLabel,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const translateX = useRef(new Animated.Value(0)).current;
  // The last SETTLED position (0 = closed, -DELETE_WIDTH = open) — read during the
  // next gesture instead of Animated.Value's own (private) current value.
  const settledRef = useRef(0);

  const settleTo = (value: number) => {
    settledRef.current = value;
    Animated.spring(translateX, {toValue: value, ...SPRING}).start();
  };

  useEffect(() => {
    if (forceClosed && settledRef.current !== 0) {settleTo(0);}
    // settleTo is stable across renders (only reads refs); re-running on it is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceClosed]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => shouldClaimSwipeGesture(gesture.dx, gesture.dy),
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(clampSwipeOffset(settledRef.current + gesture.dx));
      },
      onPanResponderRelease: (_, gesture) => {
        const next = clampSwipeOffset(settledRef.current + gesture.dx);
        const shouldOpen = shouldRevealDelete(next, gesture.vx);
        settleTo(shouldOpen ? -DELETE_WIDTH : 0);
        if (shouldOpen) {onSwipeOpen();}
      },
      onPanResponderTerminate: () => settleTo(settledRef.current),
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      <View pointerEvents="box-none" style={styles.deleteLayer}>
        <Pressable
          accessibilityLabel={deleteAccessibilityLabel}
          accessibilityRole="button"
          onPress={onDeletePress}
          style={({pressed}) => [styles.deleteButton, pressed && styles.pressed]}>
          <View style={styles.iconCircle}>
            <MaterialDesignIcons color={pickReadableTextColor(theme.colors.danger)} name="trash-can-outline" size={19} />
          </View>
          <Text style={styles.deleteText}>{t('profile.managedProfiles.swipeDeleteLabel')}</Text>
        </Pressable>
      </View>

      <Animated.View {...panResponder.panHandlers} style={[styles.rowLayer, {transform: [{translateX}]}]}>
        {children}
      </Animated.View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  const destructiveText = pickReadableTextColor(theme.colors.danger);
  return StyleSheet.create({
    // Clips the sliding row itself to the same rounded shape as its content
    // (objectiveOption, in ProfileScreen.tsx) — a secondary safety net; the
    // capsule itself (deleteButton below) is independently rounded on all
    // four corners regardless of this clip, since Android doesn't always
    // honor overflow:'hidden' clipping for an absolutely-positioned child's
    // background color.
    wrapper: {borderRadius: CARD_RADIUS, overflow: 'hidden'},
    deleteLayer: {...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'flex-end'},
    deleteButton: {
      width: DELETE_WIDTH,
      marginVertical: DELETE_VERTICAL_INSET,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: theme.colors.danger,
      // ALL FOUR corners rounded — a genuine capsule, not a rectangle with
      // only its outer-facing side rounded. The left corners stay hidden
      // under the sliding card until fully revealed (see the CARD_RADIUS
      // comment above for why that reads as "emerging from behind").
      borderRadius: CARD_RADIUS,
    },
    // Subtle, theme-derived circular backdrop for the icon — same idea as
    // the 56dp icon circle in ManagedProfileDeleteConfirmModal.tsx/
    // QadaaDeleteConfirmModal.tsx (a translucent ring around the trash
    // icon), scaled down for this compact capsule and tinted from the
    // computed readable-text color (never a new hardcoded color) since the
    // surrounding fill here is theme.colors.danger itself, not a neutral
    // surface.
    iconCircle: {
      width: ICON_CIRCLE_SIZE,
      height: ICON_CIRCLE_SIZE,
      borderRadius: ICON_CIRCLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(destructiveText, 0.16),
    },
    deleteText: {color: destructiveText, fontSize: 11, fontWeight: '600'},
    rowLayer: {backgroundColor: theme.colors.surface},
    pressed: {opacity: 0.85},
  });
}
