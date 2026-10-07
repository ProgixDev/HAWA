import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ManagedProfileSwipeRow, {clampSwipeOffset, shouldClaimSwipeGesture, shouldRevealDelete} from '../ManagedProfileSwipeRow';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

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
    expect(clampSwipeOffset(-200)).toBe(-82); // never slides past fully open (current DELETE_WIDTH)
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

  // VISUAL REDESIGN (round 2 — real-device feedback) — right-corners-only
  // rounding still looked like a rectangle on a physical Android device: the
  // visible seam is between the sliding card's own (always flat) trailing
  // edge and the capsule's LEFT edge, not its right one. The capsule is now
  // rounded on ALL FOUR corners — a genuine capsule sitting behind the
  // sliding card — so the left corner is what "emerges" as the swipe
  // completes, instead of presenting a hard rectangular cut.
  it('the revealed delete action is a capsule rounded on all four corners, matching the row radius — never a rectangle', () => {
    const {renderer} = renderRow();
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && typeof node.props.onPress === 'function',
    )[0];
    const style = flattenStyle(trash.props.style({pressed: false}));
    expect(style.borderRadius).toBeGreaterThan(0);
    // Also confirm no competing single-corner override exists (e.g. a stale
    // right-only radius left in place after the redesign).
    expect(style.borderTopRightRadius).toBeUndefined();
    expect(style.borderBottomRightRadius).toBeUndefined();
    expect(style.borderTopLeftRadius).toBeUndefined();
    expect(style.borderBottomLeftRadius).toBeUndefined();
  });

  it('is inset a few dp top/bottom so it reads as nested behind the row, not matching its exact full-height silhouette', () => {
    const {renderer} = renderRow();
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && typeof node.props.onPress === 'function',
    )[0];
    const style = flattenStyle(trash.props.style({pressed: false}));
    expect(style.marginVertical).toBeGreaterThan(0);
  });

  it('is narrower than the previous 88dp iteration — comfortable, but no longer visually blocky — and matches the swipe-offset clamp', () => {
    const {renderer} = renderRow();
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && typeof node.props.onPress === 'function',
    )[0];
    const style = flattenStyle(trash.props.style({pressed: false}));
    expect(style.width).toBe(82);
    expect(style.width).toBe(-clampSwipeOffset(-200)); // stays in lockstep with the fully-open swipe offset
  });

  it('the outer swipe container clips to the same rounded shape as the row content, as a layout safety net', () => {
    const {renderer} = renderRow();
    // The outermost View wrapping both the delete layer and the sliding row.
    const wrapper = renderer.root.findAllByType(require('react-native').View)[0];
    const style = flattenStyle(wrapper.props.style);
    expect(style.overflow).toBe('hidden');
    expect(style.borderRadius).toBeGreaterThan(0);
  });

  it('the entire revealed delete surface remains one single tappable action — never a tiny icon-only target', () => {
    const {renderer, onDeletePress} = renderRow();
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && typeof node.props.onPress === 'function',
    )[0];
    // The icon and label are children of the SAME pressable surface, not
    // separate tap targets.
    expect(trash.findAllByType(require('react-native').Text).length).toBeGreaterThan(0);
    act(() => {
      trash.props.onPress();
    });
    expect(onDeletePress).toHaveBeenCalledTimes(1);
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

// LOCALIZATION FIX — the visible "Supprimer" label was hardcoded regardless
// of app language (the accessibilityLabel prop was already correctly
// localized by the caller; only the VISIBLE text was missed). Now routed
// through profile.managedProfiles.swipeDeleteLabel.
describe('ManagedProfileSwipeRow — visible delete label follows the app language', () => {
  afterEach(async () => {
    await resetAppLanguageForTests();
    await i18n.changeLanguage('en');
  });

  it.each([
    ['fr', 'Supprimer'],
    ['en', 'Delete'],
    ['es', 'Eliminar'],
  ] as const)('shows "%s" visible label in %s, never staying in another language', async (language, expectedLabel) => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <AwaThemeProvider>
          <ManagedProfileSwipeRow
            deleteAccessibilityLabel="Supprimer le profil de Lina"
            forceClosed={false}
            onDeletePress={jest.fn()}
            onSwipeOpen={jest.fn()}>
            <Text>Lina</Text>
          </ManagedProfileSwipeRow>
        </AwaThemeProvider>,
      );
    });
    expect(renderer.root.findAllByType(Text).some(node => [node.props.children].flat(Infinity).join('') === expectedLabel)).toBe(true);
  });
});
