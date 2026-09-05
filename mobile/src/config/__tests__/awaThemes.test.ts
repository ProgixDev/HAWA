import {
  AWA_THEMES,
  DEFAULT_AWA_THEME_ID,
  getAwaThemeById,
  getEnabledAwaThemes,
  isValidAwaThemeId,
  resolveAwaThemeTap,
  resolveEffectiveThemeId,
} from '../awaThemes';

describe('AWA_THEMES registry', () => {
  it('defines exactly the 7 required themes, each with a complete color token set', () => {
    expect(AWA_THEMES).toHaveLength(7);
    const requiredColorKeys = [
      'background', 'surface', 'surfaceSecondary', 'primary', 'primarySoft',
      'secondary', 'text', 'textSecondary', 'border', 'navigation', 'accent',
      'success', 'warning', 'danger',
    ];
    AWA_THEMES.forEach(theme => {
      requiredColorKeys.forEach(key => {
        expect(typeof theme.colors[key as keyof typeof theme.colors]).toBe('string');
      });
    });
  });

  it('AWA Original is the only FREE theme; every other theme is Premium', () => {
    const free = AWA_THEMES.filter(theme => !theme.isPremium);
    expect(free).toHaveLength(1);
    expect(free[0].id).toBe('awa-original');
    const premiumIds = AWA_THEMES.filter(theme => theme.isPremium).map(theme => theme.id).sort();
    expect(premiumIds).toEqual(
      ['lavender-night', 'midnight', 'ocean-calm', 'rose-quartz', 'sage-serenity', 'warm-sand'].sort(),
    );
  });

  it('the default theme id is AWA Original and it exists, enabled, in the registry', () => {
    expect(DEFAULT_AWA_THEME_ID).toBe('awa-original');
    const theme = getAwaThemeById(DEFAULT_AWA_THEME_ID);
    expect(theme).toBeDefined();
    expect(theme!.enabled).toBe(true);
    expect(theme!.isPremium).toBe(false);
  });

  it('getEnabledAwaThemes returns only enabled themes ordered by displayOrder', () => {
    const enabled = getEnabledAwaThemes();
    const expectedEnabled = AWA_THEMES.filter(theme => theme.enabled)
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);

    expect(enabled).toEqual(expectedEnabled);
    expect(enabled.every(theme => theme.enabled)).toBe(true);
    for (let i = 1; i < enabled.length; i += 1) {
      expect(enabled[i].displayOrder).toBeGreaterThan(enabled[i - 1].displayOrder);
    }
    expect(enabled[0].id).toBe('awa-original');
  });

  it('a disabled registry theme (kept only as an internal color base) is excluded from getEnabledAwaThemes but still resolvable by id', () => {
    const disabled = AWA_THEMES.filter(theme => !theme.enabled);
    if (disabled.length === 0) {
      // Nothing currently disabled in the registry — nothing to assert.
      return;
    }
    const enabledIds = getEnabledAwaThemes().map(theme => theme.id);
    disabled.forEach(theme => {
      expect(enabledIds).not.toContain(theme.id);
      expect(getAwaThemeById(theme.id)).toEqual(theme);
    });
  });

  it('isValidAwaThemeId accepts only real registry ids', () => {
    expect(isValidAwaThemeId('awa-original')).toBe(true);
    expect(isValidAwaThemeId('midnight')).toBe(true);
    expect(isValidAwaThemeId('not-a-real-theme')).toBe(false);
    expect(isValidAwaThemeId(42)).toBe(false);
    expect(isValidAwaThemeId(undefined)).toBe(false);
  });
});

describe('resolveAwaThemeTap — the selection/lock decision', () => {
  it('AWA Original (free) is always selectable, Premium or not', () => {
    const original = getAwaThemeById('awa-original')!;
    expect(resolveAwaThemeTap(original, false)).toEqual({action: 'select'});
    expect(resolveAwaThemeTap(original, true)).toEqual({action: 'select'});
  });

  it('a FREE user tapping a Premium theme requires Premium — never silently selects it', () => {
    const sage = getAwaThemeById('sage-serenity')!;
    expect(resolveAwaThemeTap(sage, false)).toEqual({action: 'requiresPremium'});
  });

  it('a Premium user tapping any Premium theme selects it immediately', () => {
    const sage = getAwaThemeById('sage-serenity')!;
    const midnight = getAwaThemeById('midnight')!;
    expect(resolveAwaThemeTap(sage, true)).toEqual({action: 'select'});
    expect(resolveAwaThemeTap(midnight, true)).toEqual({action: 'select'});
  });
});

describe('resolveEffectiveThemeId — Premium expiration safety net', () => {
  it('keeps the saved FREE theme regardless of Premium status', () => {
    expect(resolveEffectiveThemeId('awa-original', false)).toBe('awa-original');
    expect(resolveEffectiveThemeId('awa-original', true)).toBe('awa-original');
  });

  it('keeps a saved Premium theme while the user still has Premium', () => {
    expect(resolveEffectiveThemeId('midnight', true)).toBe('midnight');
  });

  it('falls back to AWA Original when a saved Premium theme is no longer accessible', () => {
    expect(resolveEffectiveThemeId('midnight', false)).toBe('awa-original');
    expect(resolveEffectiveThemeId('rose-quartz', false)).toBe('awa-original');
  });
});
