import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {AwaThemeProvider} from '../AwaThemeProvider';
import {PrivacyCover} from '../PrivacyCover';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import i18n from '../../i18n';

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
  // PrivacyCover.tsx's accessibilityLabel comes from useTranslation()/t(), and
  // nothing else in this render tree ever imports '../../i18n' — run
  // standalone, react-i18next has no instance yet and t() falls back to the
  // raw key ('privacyCover.a11y'), matching neither language's string.
  // Explicitly initializing/pinning the language (English, the app's
  // default since Phase 7M) makes the real translated label render.
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('PrivacyCover — resolved global theme', () => {
  it('uses theme.colors.background in Light, not a fixed lavender', async () => {
    const renderer = await renderPrivacyCover();
    const cover = renderer.root.findByProps({accessibilityLabel: 'AWA protected'});
    expect(flattenStyle(cover.props.style).backgroundColor).toBe('#FCFAFF');
  });

  it('updates immediately to the dark surface when appearance mode changes, without remounting', async () => {
    const renderer = await renderPrivacyCover();
    const cover = () => renderer.root.findByProps({accessibilityLabel: 'AWA protected'});
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
    const cover = renderer.root.findByProps({accessibilityLabel: 'AWA protected'});
    expect(flattenStyle(cover.props.style).backgroundColor).toBe('#030304');
  });
});
