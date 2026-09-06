import {getFloatingTabBarClearance, spacing} from '../spacing';

// The floating bottom tab bar (src/components/navigation/CustomBottomTabBar.tsx)
// became an absolute overlay and no longer reserves layout space, so every
// scrollable main-tab screen must add getFloatingTabBarClearance(...) to its
// own bottom padding instead of a screen-specific magic number. This mirrors
// the navbar's own literals (pill height 58, top spacing 4, min bottom inset
// 8) — kept in sync manually since CustomBottomTabBar.tsx is out of scope for
// screen-side fixes.

describe('getFloatingTabBarClearance', () => {
  it('is exported as a function', () => {
    expect(typeof getFloatingTabBarClearance).toBe('function');
  });

  it('accounts for the navbar pill height + top spacing + its own SafeArea floor, plus the default extra', () => {
    // insetsBottom below the navbar's own 8px floor: floor + pill(58) + topSpacing(4) + default extra (spacing.md)
    expect(getFloatingTabBarClearance(0)).toBe(8 + 58 + 4 + spacing.md);
  });

  it('uses the real inset once it exceeds the navbar floor, without double-counting it', () => {
    const insetsBottom = 40;
    expect(getFloatingTabBarClearance(insetsBottom)).toBe(insetsBottom + 58 + 4 + spacing.md);
  });

  it('preserves a screen-specific breathing-room "extra" value instead of forcing one fixed number', () => {
    expect(getFloatingTabBarClearance(0, 120)).toBe(8 + 58 + 4 + 120);
    expect(getFloatingTabBarClearance(0, 24)).not.toBe(getFloatingTabBarClearance(0, 120));
  });

  it('is always larger than the navbar pill height alone, so content never sits exactly flush against the pill', () => {
    expect(getFloatingTabBarClearance(24, 0)).toBeGreaterThan(58);
  });
});
