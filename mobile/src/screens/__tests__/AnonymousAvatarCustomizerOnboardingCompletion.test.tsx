import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import AnonymousAvatarCustomizerScreen from '../AnonymousAvatarCustomizerScreen';
import {getHasCompletedOnboarding, setHasCompletedOnboarding} from '../../state/onboardingPreferences';

// Phase 2 — persistent onboarding completion. This screen's `enterApp()` is
// THE single real write boundary (see onboardingPreferences.ts's section
// comment). Revisiting this same screen later from Settings/Profile
// (fromAuth=false) must NEVER re-trigger or falsely set completion — only
// the genuine onboarding/Auth path (fromAuth=true) may.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(source: 'auth' | undefined, navigation: {replace: jest.Mock; goBack: jest.Mock}) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <AnonymousAvatarCustomizerScreen
            navigation={navigation as any}
            route={{key: 'test', name: 'AnonymousAvatarCustomizer', params: source ? {source} : undefined} as any}
          />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  await setHasCompletedOnboarding(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('AnonymousAvatarCustomizerScreen — onboarding completion boundary', () => {
  it('fromAuth=true: "Enregistrer et continuer" marks onboarding complete and enters MainTabs', async () => {
    const navigation = {replace: jest.fn(), goBack: jest.fn()};
    const renderer = await renderScreen('auth', navigation);

    const saveButton = renderer.root.findByProps({accessibilityLabel: 'Enregistrer et continuer'});
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(getHasCompletedOnboarding()).toBe(true);
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
  });

  it('fromAuth=true: "Plus tard" (skip) also marks onboarding complete — skipping avatar customization still finishes the journey', async () => {
    const navigation = {replace: jest.fn(), goBack: jest.fn()};
    const renderer = await renderScreen('auth', navigation);

    const skipButton = renderer.root.findByProps({accessibilityLabel: 'Plus tard'});
    await act(async () => {
      skipButton.props.onPress();
    });

    expect(getHasCompletedOnboarding()).toBe(true);
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
  });

  it('fromAuth=false (revisited from Settings/Profile): saving changes does NOT mark onboarding complete and does not navigate to MainTabs', async () => {
    const navigation = {replace: jest.fn(), goBack: jest.fn()};
    const renderer = await renderScreen(undefined, navigation);

    const saveButton = renderer.root.findByProps({accessibilityLabel: 'Enregistrer les modifications'});
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(getHasCompletedOnboarding()).toBe(false);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
