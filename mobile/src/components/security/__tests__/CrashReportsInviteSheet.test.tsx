import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CrashReportsInviteHost from '../CrashReportsInviteSheet';
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import {setAppLockState} from '../../../state/appLockStore';
import {getCrashReportsChoice, resetCrashReportsChoiceForTests, setCrashReportsChoice} from '../../../state/crashReportsPreferences';
import i18n from '../../../i18n';

jest.mock('../../../services/sentry', () => ({
  setCrashReportsEnabled: jest.fn(async (enabled: boolean) => {
    const prefs = require('../../../state/crashReportsPreferences');
    await prefs.setCrashReportsChoice(enabled ? 'granted' : 'declined');
  }),
}));

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount(onOpenPolicy = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <CrashReportsInviteHost onOpenPolicy={onOpenPolicy} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return {renderer, onOpenPolicy};
}

const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
  await flush();
};

const sheetOpen = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Modal).length > 0;
const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const button = renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];
  await act(async () => {
    button.props.onPress();
  });
  await flush();
};

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetCrashReportsChoiceForTests();
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  setAppLockState('unlocked');
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('one-time crash-report invitation', () => {
  it('appears after a short delay when she was never asked and the app is unlocked, in her language', async () => {
    const {renderer} = await mount();
    expect(sheetOpen(renderer)).toBe(false); // not before the delay
    await advance(1600);
    expect(sheetOpen(renderer)).toBe(true);
    const text = JSON.stringify(renderer.toJSON());
    expect(text).toContain('Aider à améliorer AWA ?');
    expect(text).toContain('Activer');
    expect(text).toContain('Non merci');
  });

  it('"Activer" records the agreement and closes the sheet', async () => {
    const {renderer} = await mount();
    await advance(1600);
    await pressByLabel(renderer, 'Activer');
    expect(getCrashReportsChoice()).toBe('granted');
    expect(sheetOpen(renderer)).toBe(false);
  });

  it('"Non merci" records the refusal and closes the sheet', async () => {
    const {renderer} = await mount();
    await advance(1600);
    await pressByLabel(renderer, 'Non merci');
    expect(getCrashReportsChoice()).toBe('declined');
    expect(sheetOpen(renderer)).toBe(false);
  });

  it('reading the policy answers nothing: the choice stays open and the sheet does not come back this session', async () => {
    const {renderer, onOpenPolicy} = await mount();
    await advance(1600);
    await pressByLabel(renderer, 'Politique de confidentialité');
    expect(onOpenPolicy).toHaveBeenCalledTimes(1);
    expect(getCrashReportsChoice()).toBeNull();
    expect(sheetOpen(renderer)).toBe(false);
    await advance(5000);
    expect(sheetOpen(renderer)).toBe(false);
  });

  it('never appears once she has answered, whatever the answer', async () => {
    await setCrashReportsChoice('declined');
    const declined = await mount();
    await advance(2000);
    expect(sheetOpen(declined.renderer)).toBe(false);

    resetCrashReportsChoiceForTests();
    await setCrashReportsChoice('granted');
    const granted = await mount();
    await advance(2000);
    expect(sheetOpen(granted.renderer)).toBe(false);
  });

  it('never appears over the lock screen, and appears once the app is unlocked', async () => {
    setAppLockState('locked');
    const {renderer} = await mount();
    await advance(2000);
    expect(sheetOpen(renderer)).toBe(false);

    await act(async () => {
      setAppLockState('unlocked');
    });
    await flush();
    expect(sheetOpen(renderer)).toBe(true);
  });
});
