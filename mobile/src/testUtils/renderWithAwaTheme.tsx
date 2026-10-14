import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../theme/AwaThemeProvider';
import {resolveAwaTheme, type ResolvableAwaThemeId, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {deriveAwaRoles, type AwaRoles} from '../theme/semanticRoles';
import {resetPremiumStateForTests, updatePremiumState} from '../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../state/themePreferences';

// Test helper for the shared UI components: renders an element inside the REAL AwaThemeProvider for one of the six
// palettes in Light, Dark or True Black, and returns the theme / roles the provider is expected to resolve, so a test
// can assert against the same source of truth the components use.
//
// Non-Original palettes are Premium themes (resolveEffectiveThemeId), so Premium is switched on for the render and the
// store is reset afterwards by `resetThemeStores()`.

export const AWA_PALETTES: ResolvableAwaThemeId[] = [
  'awa-original',
  'lavender-night',
  'rose-quartz',
  'sage-serenity',
  'ocean-calm',
  'warm-sand',
];

export type ThemeVariantSpec = {id: ResolvableAwaThemeId; mode: 'light' | 'dark'; trueBlack: boolean; label: string};

export const THEME_VARIANTS: ThemeVariantSpec[] = AWA_PALETTES.flatMap(id => [
  {id, mode: 'light' as const, trueBlack: false, label: `${id} light`},
  {id, mode: 'dark' as const, trueBlack: false, label: `${id} dark`},
  {id, mode: 'dark' as const, trueBlack: true, label: `${id} true-black`},
]);

export const DEFAULT_VARIANT: ThemeVariantSpec = THEME_VARIANTS[0];

const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

export type ThemedRender = {
  renderer: ReactTestRenderer.ReactTestRenderer;
  theme: ResolvedAwaTheme;
  roles: AwaRoles;
};

export async function renderWithAwaTheme(
  element: React.ReactElement,
  variant: ThemeVariantSpec = DEFAULT_VARIANT,
  options?: ReactTestRenderer.TestRendererOptions,
): Promise<ThemedRender> {
  updatePremiumState({isPremium: true, initialized: true});
  await setSelectedThemeId(variant.id);
  await setAppearanceMode(variant.mode);
  await setTrueBlackEnabled(variant.trueBlack);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AwaThemeProvider>{element}</AwaThemeProvider>, options);
  });
  renderers.push(renderer);
  const theme = resolveAwaTheme(variant.id, variant.mode === 'dark', variant.trueBlack);
  return {renderer, theme, roles: deriveAwaRoles(theme)};
}

export async function resetThemeStores(): Promise<void> {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
}

/** Flattens a React Native style (object / array / nested arrays / falsy) into one object. */
export function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) {return {};}
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return style as Record<string, unknown>;
}

/**
 * The HOST node (the native component itself) carrying a testID. `findByProps({testID})` would match the composite
 * wrapper first (it carries the same prop), which has the caller's props rather than the resolved native ones.
 */
export function hostByTestId(
  renderer: ReactTestRenderer.ReactTestRenderer,
  type: React.ElementType,
  testID: string,
): ReactTestRenderer.ReactTestInstance {
  const match = renderer.root.findAllByType(type as never).find(node => node.props.testID === testID);
  if (!match) {
    throw new Error(`no ${String(type)} host with testID "${testID}"`);
  }
  return match;
}
