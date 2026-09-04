import {DefaultTheme} from '@react-navigation/native';

import {resolveAwaTheme} from '../awaThemeTokens';
import {toReactNavigationTheme} from '../awaNavigationTheme';

describe('toReactNavigationTheme — light', () => {
  it('receives dark: false for a light resolved theme', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    const navTheme = toReactNavigationTheme(theme);
    expect(navTheme.dark).toBe(false);
  });

  it('maps every color role deliberately, never an arbitrary hex', () => {
    const theme = resolveAwaTheme('rose-quartz', false, false);
    const navTheme = toReactNavigationTheme(theme);

    expect(navTheme.colors.primary).toBe(theme.colors.primary);
    expect(navTheme.colors.background).toBe(theme.colors.background);
    expect(navTheme.colors.card).toBe(theme.colors.surface);
    expect(navTheme.colors.text).toBe(theme.colors.text);
    expect(navTheme.colors.border).toBe(theme.colors.border);
    expect(navTheme.colors.notification).toBe(theme.colors.danger);
  });

  it('preserves React Navigation’s own required fonts field', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    const navTheme = toReactNavigationTheme(theme);
    expect(navTheme.fonts).toBe(DefaultTheme.fonts);
  });
});

describe('toReactNavigationTheme — dark', () => {
  it('receives dark: true for a dark resolved theme', () => {
    const theme = resolveAwaTheme('awa-original', true, false);
    const navTheme = toReactNavigationTheme(theme);
    expect(navTheme.dark).toBe(true);
  });

  it('maps every color role from the dark resolved theme', () => {
    const theme = resolveAwaTheme('ocean-calm', true, false);
    const navTheme = toReactNavigationTheme(theme);

    expect(navTheme.colors.primary).toBe(theme.colors.primary);
    expect(navTheme.colors.background).toBe(theme.colors.background);
    expect(navTheme.colors.card).toBe(theme.colors.surface);
    expect(navTheme.colors.text).toBe(theme.colors.text);
    expect(navTheme.colors.border).toBe(theme.colors.border);
  });
});

describe('toReactNavigationTheme — true black', () => {
  it('background/card reflect the true-black surfaces once resolved', () => {
    const theme = resolveAwaTheme('awa-original', true, true);
    const navTheme = toReactNavigationTheme(theme);
    expect(navTheme.colors.background).toBe('#030304');
    expect(navTheme.colors.card).toBe('#0B0B10');
  });
});

describe('toReactNavigationTheme — AWA Original contract', () => {
  it('LIGHT resolves to the exact canonical background/primary/text/border used by the app today', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    const navTheme = toReactNavigationTheme(theme);
    expect(navTheme.colors.background).toBe('#FCFAFF');
    expect(navTheme.colors.primary).toBe('#6D4AE8');
    expect(navTheme.colors.text).toBe('#2F2258');
  });
});
