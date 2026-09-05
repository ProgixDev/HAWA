import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {View} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ReadingControls from '../ReadingControls';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {resetPremiumStateForTests} from '../../../state/premiumStore';

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderControls() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <ReadingControls articleId="test-article" durationMinutes={5} scrollRef={{current: null}} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
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

describe('ReadingControls — resolved theme tokens', () => {
  it('uses the resolved theme colors for its chrome', async () => {
    const renderer = await renderControls();
    const playIcon = renderer.root.findAll(node => node.props.name === 'play')[0];
    expect(playIcon.props.color).toBe('#6D4AE8'); // awa-original primary
  });

  it('reacts to Light/Dark — background/icon colors change with appearanceMode', async () => {
    const renderer = await renderControls();
    const root = renderer.root.findAllByType(View)[0];
    const lightBg = flattenStyle(root.props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkBg = flattenStyle(root.props.style).backgroundColor;
    expect(darkBg).not.toBe(lightBg);
  });

  it('changes brand chrome when the palette changes, without remounting', async () => {
    const renderer = await renderControls();
    const playIcon = () => renderer.root.findAll(node => node.props.name === 'play')[0];
    expect(playIcon().props.color).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(playIcon().props.color).toBe('#5C8CA6'); // ocean-calm primary
  });
});
