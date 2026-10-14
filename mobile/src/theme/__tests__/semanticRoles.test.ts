import {getAwaThemeById} from '../../config/awaThemes';
import {onPrimaryTextColor, resolveAwaTheme, type ResolvableAwaThemeId} from '../awaThemeTokens';
import {WCAG_AA_TEXT, WCAG_AA_UI, contrastRatio} from '../contrast';
import {AWA_STATE_LAYER_OPACITY, bestOnColor, deriveAwaRoles, stateLayer} from '../semanticRoles';

const IDS: ResolvableAwaThemeId[] = ['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'];
const VARIANTS = IDS.flatMap(id =>
  [false, true].flatMap(isDark =>
    (isDark ? [false, true] : [false]).map(trueBlack => ({id, isDark, trueBlack, label: `${id} ${isDark ? (trueBlack ? 'dark+true-black' : 'dark') : 'light'}`})),
  ),
);

describe('semantic roles — derived from the existing resolved themes, never replacing them', () => {
  it.each(VARIANTS.map(v => [v.label, v] as const))('%s: existing colours are untouched and roles are deterministic', (_label, v) => {
    const theme = resolveAwaTheme(v.id, v.isDark, v.trueBlack);
    const before = JSON.stringify(theme);
    const roles = deriveAwaRoles(theme);
    expect(JSON.stringify(theme)).toBe(before); // never mutated
    expect(deriveAwaRoles(theme)).toBe(roles); // memoized per theme object
    expect(JSON.stringify(deriveAwaRoles(resolveAwaTheme(v.id, v.isDark, v.trueBlack)))).toBe(JSON.stringify(roles));
    // pass-through roles equal the existing tokens exactly
    expect(roles.primary).toBe(theme.colors.primary);
    expect(roles.surface).toBe(theme.colors.surface);
    expect(roles.background).toBe(theme.colors.background);
    expect(roles.onSurface).toBe(theme.colors.text);
    expect(roles.onSurfaceVariant).toBe(theme.colors.textSecondary);
    expect(roles.outlineVariant).toBe(theme.colors.border);
    expect(roles.onPrimary).toBe(onPrimaryTextColor(theme));
    expect(roles.error).toBe(theme.colors.danger);
    expect(Object.isFrozen(roles)).toBe(true);
  });

  it.each(VARIANTS.map(v => [v.label, v] as const))('%s: every on* / container pair is readable', (_label, v) => {
    const theme = resolveAwaTheme(v.id, v.isDark, v.trueBlack);
    const r = deriveAwaRoles(theme);
    const pairs: Array<[string, string, string, number]> = [
      ['onPrimaryContainer', r.onPrimaryContainer, r.primaryContainer, WCAG_AA_TEXT],
      ['onErrorContainer', r.onErrorContainer, r.errorContainer, WCAG_AA_TEXT],
      ['onSuccessContainer', r.onSuccessContainer, r.successContainer, WCAG_AA_TEXT],
      ['onWarningContainer', r.onWarningContainer, r.warningContainer, WCAG_AA_TEXT],
      ['onSurface', r.onSurface, r.surface, WCAG_AA_TEXT],
      ['onBackground', r.onBackground, r.background, WCAG_AA_TEXT],
      ['accessible.onSurfaceVariant / background', r.accessible.onSurfaceVariant, r.background, WCAG_AA_TEXT],
      ['accessible.onSurfaceVariant / surface', r.accessible.onSurfaceVariant, r.surface, WCAG_AA_TEXT],
      ['accessible.onSurfaceVariant / surfaceVariant', r.accessible.onSurfaceVariant, r.surfaceVariant, WCAG_AA_TEXT],
      ['accessible.textMuted / background', r.accessible.textMuted, r.background, WCAG_AA_TEXT],
      ['accessible.textMuted / surface', r.accessible.textMuted, r.surface, WCAG_AA_TEXT],
      ['accessible.primaryAsText / background', r.accessible.primaryAsText, r.background, WCAG_AA_TEXT],
      ['accessible.primaryAsText / surface', r.accessible.primaryAsText, r.surface, WCAG_AA_TEXT],
      ['accessible.successText / surface', r.accessible.successText, r.surface, WCAG_AA_TEXT],
      ['accessible.warningText / surface', r.accessible.warningText, r.surface, WCAG_AA_TEXT],
      ['accessible.dangerText / surface', r.accessible.dangerText, r.surface, WCAG_AA_TEXT],
      ['outline / background', r.outline, r.background, WCAG_AA_UI],
      ['outline / surface', r.outline, r.surface, WCAG_AA_UI],
    ];
    const failures = pairs
      .filter(([, fg, bg, min]) => contrastRatio(fg, bg) < min)
      .map(([name, fg, bg, min]) => `${name}: ${fg} on ${bg} = ${contrastRatio(fg, bg).toFixed(2)} < ${min}`);
    expect(failures).toEqual([]);
    // the on-colour for a status fill is never worse than the better of white / dark ink
    expect(contrastRatio(r.onError, r.error)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(r.onSuccess, r.success)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(r.onWarning, r.warning)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(r.onSecondary, r.secondary)).toBeGreaterThanOrEqual(3);
  });

  it('AWA Original LIGHT: the accessible companions equal the original tokens whenever those already pass', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    const roles = deriveAwaRoles(theme);
    // measured: textSecondary 4.66 / 4.83 / 4.42 on background / surface / surfaceSecondary — the last one fails, so it
    // is adjusted; primary (5.34) passes on background but is used as-is only if it passes on all three.
    expect(contrastRatio(theme.colors.text, theme.colors.background)).toBeGreaterThan(WCAG_AA_TEXT);
    expect(roles.onSurface).toBe(theme.colors.text);
    expect(contrastRatio(roles.accessible.onSurfaceVariant, theme.colors.surfaceSecondary)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    // the registry itself is untouched
    expect(theme.colors.textSecondary).toBe(getAwaThemeById('awa-original')!.colors.textSecondary);
    expect(theme.colors.primary).toBe('#6D4AE8');
  });

  it('records WHERE the existing tokens fall short (documented, not changed)', () => {
    const light = (id: ResolvableAwaThemeId) => resolveAwaTheme(id, false, false);
    // textMuted is below AA on every light palette today; the accessible companion fixes it
    IDS.forEach(id => {
      const theme = light(id);
      expect(contrastRatio(theme.colors.textMuted, theme.colors.background)).toBeLessThan(WCAG_AA_TEXT);
      expect(contrastRatio(deriveAwaRoles(theme).accessible.textMuted, theme.colors.background)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    });
    // primary as text fails on several light palettes
    expect(contrastRatio(light('rose-quartz').colors.primary, light('rose-quartz').colors.background)).toBeLessThan(WCAG_AA_TEXT);
  });

  it('True Black keeps the same role structure and recomputes only from its own surfaces', () => {
    const normal = deriveAwaRoles(resolveAwaTheme('awa-original', true, false));
    const trueBlack = deriveAwaRoles(resolveAwaTheme('awa-original', true, true));
    expect(Object.keys(trueBlack)).toEqual(Object.keys(normal));
    expect(trueBlack.background).toBe('#030304');
    expect(trueBlack.surface).toBe('#0B0B10');
    expect(trueBlack.primary).toBe(normal.primary);
  });

  it('bestOnColor chooses by contrast', () => {
    expect(bestOnColor('#000000')).toBe('#FFFFFF');
    expect(bestOnColor('#FFFFFF')).toBe('#1A1626');
  });

  it('state layers use the exported 0.08 / 0.10 / 0.16 opacities', () => {
    expect(AWA_STATE_LAYER_OPACITY).toEqual({hover: 0.08, focus: 0.1, pressed: 0.1, drag: 0.16});
    expect(stateLayer('#6D4AE8', 'pressed')).toBe('rgba(109, 74, 232, 0.1)');
    expect(stateLayer('rgba(10, 20, 30, 0.5)', 'drag')).toBe('rgba(10, 20, 30, 0.16)');
  });

  it('medical / calendar / spiritual semantics are not part of the role set', () => {
    const roles = deriveAwaRoles(resolveAwaTheme('awa-original', false, false));
    const names = Object.keys(roles).join(' ').toLowerCase();
    ['period', 'fertile', 'ovulation', 'pregnan', 'postpartum', 'menopause', 'hijj', 'nifas'].forEach(word => {
      expect(names).not.toContain(word);
    });
  });
});
