import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';

import {AwaThemeProvider} from '../AwaThemeProvider';
import {AwaRootStatusBar} from '../AwaRootStatusBar';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

let mockColorScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme,
}));

beforeEach(async () => {
  mockColorScheme = 'light';
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('system');
  await setTrueBlackEnabled(false);
});

async function renderRootStatusBar() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <AwaRootStatusBar />
      </AwaThemeProvider>,
    );
  });
  return renderer!;
}

function findStatusBar(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findByType(StatusBar).props as {
    backgroundColor: string;
    barStyle: 'light-content' | 'dark-content';
    hidden: boolean;
  };
}

describe('AwaRootStatusBar', () => {
  it('uses the resolved theme.statusBarStyle (light -> dark-content) and preserves hidden', async () => {
    await act(async () => {
      await setAppearanceMode('light');
    });
    const renderer = await renderRootStatusBar();

    const props = findStatusBar(renderer);
    expect(props.barStyle).toBe('dark-content');
    expect(props.backgroundColor).toBe('#FCFAFF');
    expect(props.hidden).toBe(true);

    act(() => renderer.unmount());
  });

  it('dark resolves to light-content', async () => {
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const renderer = await renderRootStatusBar();

    expect(findStatusBar(renderer).barStyle).toBe('light-content');

    act(() => renderer.unmount());
  });

  it('true black stays readable (still light-content, background becomes the true-black surface)', async () => {
    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });
    const renderer = await renderRootStatusBar();

    const props = findStatusBar(renderer);
    expect(props.barStyle).toBe('light-content');
    expect(props.backgroundColor).toBe('#030304');

    act(() => renderer.unmount());
  });

  it('updates immediately when the theme changes, without remounting', async () => {
    const renderer = await renderRootStatusBar();
    expect(findStatusBar(renderer).barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findStatusBar(renderer).barStyle).toBe('light-content');

    act(() => renderer.unmount());
  });
});
