import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ManagedProfileSwipeRow, {clampSwipeOffset, shouldClaimSwipeGesture, shouldRevealDelete} from '../ManagedProfileSwipeRow';

// PanResponder's own touch-responder machinery (TouchHistoryMath) cannot be driven
// faithfully from a plain Jest test without a real native touch-event stream — so the
// RULES that actually matter (reveal threshold, fling velocity, horizontal-vs-vertical
// gating) are exported as plain functions from ManagedProfileSwipeRow.tsx and tested
// directly here. Integration behavior (mother's row never wrapped in this component,
// delete confirmation, persistence) is covered by ProfileScreen.test.tsx.

describe('ManagedProfileSwipeRow — swipe decision logic', () => {
  it('claims the gesture only for a clearly horizontal drag — a vertical drag is left to the parent ScrollView', () => {
    expect(shouldClaimSwipeGesture(2, 40)).toBe(false); // mostly vertical → scroll
    expect(shouldClaimSwipeGesture(-30, 2)).toBe(true); // mostly horizontal, left → swipe
    expect(shouldClaimSwipeGesture(30, 2)).toBe(true); // horizontal, right (closes an open row) → also claimed
    expect(shouldClaimSwipeGesture(-4, 1)).toBe(false); // too small to be an intentional swipe yet
  });

  it('a full left drag reveals delete; a small one does not', () => {
    expect(shouldRevealDelete(-60, 0)).toBe(true); // well past the reveal threshold
    expect(shouldRevealDelete(-10, 0)).toBe(false); // small/incomplete swipe → snaps back closed
  });

  it('a fast fling reveals delete even below the distance threshold', () => {
    expect(shouldRevealDelete(-20, -0.8)).toBe(true);
  });

  it('a right-to-left-then-back gesture (net small distance, no fling) does not reveal delete', () => {
    expect(shouldRevealDelete(-5, 0)).toBe(false);
  });

  it('a swipe right-to-left never reveals from a plain rightward swipe alone', () => {
    expect(shouldRevealDelete(20, 0)).toBe(false); // dragging right (positive dx) never opens
  });

  it('clamps the row offset between fully open and closed — no jitter past either end', () => {
    expect(clampSwipeOffset(40)).toBe(0); // never slides right of closed
    expect(clampSwipeOffset(-200)).toBe(-76); // never slides past fully open
    expect(clampSwipeOffset(-40)).toBe(-40); // mid-drag stays as-is
  });
});

describe('ManagedProfileSwipeRow — component behavior', () => {
  function renderRow(overrides: Partial<React.ComponentProps<typeof ManagedProfileSwipeRow>> = {}) {
    const onSwipeOpen = jest.fn();
    const onDeletePress = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <AwaThemeProvider>
          <ManagedProfileSwipeRow
            deleteAccessibilityLabel="Supprimer le profil de Lina"
            forceClosed={false}
            onDeletePress={onDeletePress}
            onSwipeOpen={onSwipeOpen}
            {...overrides}>
            <Text>Lina</Text>
          </ManagedProfileSwipeRow>
        </AwaThemeProvider>,
      );
    });
    return {renderer, onSwipeOpen, onDeletePress};
  }

  it('renders the row content and a trash delete action with the given accessibility label', () => {
    const {renderer} = renderRow();
    expect(renderer.root.findAllByType(Text).some(node => [node.props.children].flat(Infinity).join('') === 'Lina')).toBe(true);
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && node.props.accessibilityRole === 'button',
    );
    expect(trash.length).toBeGreaterThan(0);
  });

  it('swiping is never itself a delete — only pressing the revealed trash action calls onDeletePress', () => {
    const {renderer, onDeletePress} = renderRow();
    expect(onDeletePress).not.toHaveBeenCalled();
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && typeof node.props.onPress === 'function',
    )[0];
    act(() => {
      trash.props.onPress();
    });
    expect(onDeletePress).toHaveBeenCalledTimes(1);
  });

  it('forceClosed renders without crashing and never triggers a delete by itself', () => {
    const {onDeletePress} = renderRow({forceClosed: true});
    expect(onDeletePress).not.toHaveBeenCalled();
  });
});
