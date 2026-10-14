import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import * as spacingModule from '../spacing';
import * as typographyModule from '../typography';
import * as colorsModule from '../colors';
import * as themeIndex from '../index';
import {homeColors, homeRadii, homeShadow} from '../../components/home/homeTheme';
import {AWA_THEMES} from '../../config/awaThemes';
import {resolveAwaTheme} from '../awaThemeTokens';
import {AwaThemeProvider, useAwaTheme} from '../AwaThemeProvider';
import {useAwaTokens, type AwaTokens} from '../useAwaTokens';
import {deriveAwaRoles} from '../semanticRoles';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

// Phase 1 is additive: these tests pin the PUBLIC shape of the existing theme layer so that any accidental change to it
// (a renamed key, a removed token, an extra field on the resolved theme) fails here.

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

describe('the existing theme layer is unchanged', () => {
  it('ResolvedAwaTheme has exactly its original fields and colour keys', () => {
    const theme = resolveAwaTheme('awa-original', false, false);
    expect(Object.keys(theme).sort()).toEqual(['colors', 'gradients', 'id', 'isDark', 'shadow', 'statusBarStyle']);
    expect(Object.keys(theme.colors).sort()).toEqual(
      [
        'accent', 'background', 'border', 'danger', 'navigation', 'navigationActive', 'navigationInactive',
        'primary', 'primarySoft', 'secondary', 'success', 'surface', 'surfaceSecondary', 'text', 'textMuted',
        'textSecondary', 'warning',
      ].sort(),
    );
    expect(Object.keys(theme.gradients)).toEqual(['pageBackground']);
    expect(Object.keys(theme.shadow).sort()).toEqual(['elevation', 'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius']);
  });

  it('AWA Original light colours are the canonical literals', () => {
    const {colors} = resolveAwaTheme('awa-original', false, false);
    expect(colors.background).toBe('#FCFAFF');
    expect(colors.primary).toBe('#6D4AE8');
    expect(colors.text).toBe('#2F2258');
    expect(colors.textSecondary).toBe('#746D92');
    expect(colors.surface).toBe('#FFFFFF');
  });

  it('spacing, typography, colors, homeTheme and the theme registry keep their exports', () => {
    expect(Object.keys(spacingModule).sort()).toEqual(
      [
        'READING_CONTROLS_SPACE', 'TOP_SPACING_EXTRA', 'TOP_SPACING_EXTRA_COMPACT', 'getBottomPadding',
        'getFloatingTabBarClearance', 'getTopPadding', 'spacing',
      ].sort(),
    );
    expect(spacingModule.spacing).toEqual({xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48});
    expect(Object.keys(typographyModule)).toEqual(['typography']);
    expect(Object.keys(typographyModule.typography).sort()).toEqual(['button', 'slogan', 'welcomeTitle']);
    expect(Object.keys(colorsModule)).toEqual(['colors']);
    expect(homeRadii).toEqual({card: 26, button: 20, quickAction: 22});
    expect(homeColors.primary).toBe('#6D4AE8');
    expect(homeShadow.shadowColor).toBe('#2F2258');
    expect(AWA_THEMES.map(theme => theme.id)).toEqual([
      'awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand', 'midnight',
    ]);
  });

  it('the Phase 1 barrel only adds modules (no existing theme export is re-exported or shadowed)', () => {
    const names = Object.keys(themeIndex);
    ['spacing', 'typography', 'colors', 'resolveAwaTheme', 'useAwaTheme', 'AwaThemeProvider', 'homeColors'].forEach(name => {
      expect(names).not.toContain(name);
    });
    ['AWA_TYPESCALE', 'awaShapes', 'awaIconSizes', 'awaSpace', 'deriveAwaRoles', 'contrastRatio', 'useAwaTokens'].forEach(name => {
      expect(names).toContain(name);
    });
  });
});

describe('useAwaTokens', () => {
  const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

  function Probe({onValue}: {onValue: (tokens: AwaTokens, theme: ReturnType<typeof useAwaTheme>['theme']) => void}): null {
    const tokens = useAwaTokens();
    const {theme} = useAwaTheme();
    onValue(tokens, theme);
    return null;
  }

  beforeEach(async () => {
    resetPremiumStateForTests();
    await setSelectedThemeId('awa-original');
    await setAppearanceMode('light');
    await setTrueBlackEnabled(false);
  });

  afterEach(() => {
    act(() => {
      activeRenderers.splice(0).forEach(renderer => renderer.unmount());
    });
  });

  it('returns the SAME theme object as useAwaTheme plus derived roles and the static token sets', async () => {
    let tokens: AwaTokens | undefined;
    let theme: ReturnType<typeof useAwaTheme>['theme'] | undefined;
    await act(async () => {
      activeRenderers.push(
        ReactTestRenderer.create(
          <AwaThemeProvider>
            <Probe onValue={(t, th) => { tokens = t; theme = th; }} />
          </AwaThemeProvider>,
        ),
      );
    });
    expect(tokens!.theme).toBe(theme);
    expect(tokens!.roles).toBe(deriveAwaRoles(theme!));
    expect(tokens!.shapes.medium).toBe(12);
    expect(tokens!.typescale.bodyLarge.fontSize).toBe(16);
    expect(tokens!.iconSizes.md).toBe(24);
    expect(tokens!.space.s16).toBe(16);
    expect(tokens!.dimensionProposals.floatingTabBarPill.verified).toBe(false);
  });

  it('throws like useAwaTheme outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      act(() => {
        ReactTestRenderer.create(<Probe onValue={() => {}} />);
      });
    }).toThrow('useAwaTheme() must be called within an AwaThemeProvider.');
    consoleError.mockRestore();
  });

  it('follows a theme change without disturbing the original provider contract', async () => {
    let tokens: AwaTokens | undefined;
    await act(async () => {
      activeRenderers.push(
        ReactTestRenderer.create(
          <AwaThemeProvider>
            <Probe onValue={t => { tokens = t; }} />
          </AwaThemeProvider>,
        ),
      );
    });
    const lightPrimary = tokens!.roles.primary;
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(tokens!.theme.isDark).toBe(true);
    expect(tokens!.roles.background).toBe(tokens!.theme.colors.background);
    expect(tokens!.roles.primary).not.toBe(lightPrimary);
  });
});
