import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../AwaThemeProvider';
import {PrivacyCover} from '../PrivacyCover';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderPrivacyCover() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <PrivacyCover />
      </AwaThemeProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
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

describe('PrivacyCover — resolved global theme', () => {
  it('uses theme.colors.background in Light, not a fixed lavender', async () => {
    const renderer = await renderPrivacyCover();
    const cover = renderer.root.findByProps({accessibilityLabel: 'AWA protégée'});
    expect(flattenStyle(cover.props.style).backgroundColor).toBe('#FCFAFF');
  });

  it('updates immediately to the dark surface when appearance mode changes, without remounting', async () => {
    const renderer = await renderPrivacyCover();
    const cover = () => renderer.root.findByProps({accessibilityLabel: 'AWA protégée'});
    const lightBg = flattenStyle(cover().props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkBg = flattenStyle(cover().props.style).backgroundColor;
    expect(darkBg).not.toBe(lightBg);
  });

  it('True Black forces the true-black background once Dark is active', async () => {
    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });
    const renderer = await renderPrivacyCover();
    const cover = renderer.root.findByProps({accessibilityLabel: 'AWA protégée'});
    expect(flattenStyle(cover.props.style).backgroundColor).toBe('#030304');
  });
});
