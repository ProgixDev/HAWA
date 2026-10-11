import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import InAppNotificationCenter from '../InAppNotificationCenter';
import {addInAppNotification, hydrateInAppNotifications} from '../../../state/inAppNotificationStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';

// Phase 2 — F17: the received-at label of an in-app reminder must never read "24:15".
//
// It formatted the local time with Intl `hour12: false`, which writes 00:15 as "24:15" under en-US (V8 verified):
// an item received in the first hour of the day was labelled "Today · 24:15". The label now uses the Intl-free,
// locale-independent formatTimeOfDay(), identical to the previous output for every other hour and language.

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderCenter() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <InAppNotificationCenter visible onClose={() => undefined} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await flush();
  return renderer;
}

/** A local-time instant TODAY (the phone's own clock), as the ISO string the store keeps. */
const todayAt = (hours: number, minutes: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0).toISOString();
};

async function seed(id: string, receivedAt: string) {
  await addInAppNotification({
    id,
    type: 'cycle-reminder',
    title: 'Rappel',
    message: 'Message',
    receivedAt,
    read: false,
  });
}

// The jest-preset AsyncStorage mock predates getMany/setMany/removeMany, which inAppNotificationStore.ts needs; polyfilled
// here (this file only) so the real store is exercised.
beforeAll(() => {
  const store = AsyncStorage as unknown as {
    getMany?: (keys: string[]) => Promise<Record<string, string | null>>;
    setMany?: (entries: Record<string, string>) => Promise<void>;
    removeMany?: (keys: string[]) => Promise<void>;
  };
  if (!store.getMany) {
    store.getMany = async keys => {
      const result: Record<string, string | null> = {};
      for (const key of keys) {result[key] = await AsyncStorage.getItem(key);}
      return result;
    };
  }
  if (!store.setMany) {
    store.setMany = async entries => {
      for (const [key, value] of Object.entries(entries)) {await AsyncStorage.setItem(key, value);}
    };
  }
  if (!store.removeMany) {
    store.removeMany = async keys => {
      for (const key of keys) {await AsyncStorage.removeItem(key);}
    };
  }
});

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await hydrateInAppNotifications();
});

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('InAppNotificationCenter received-at label', () => {
  it('00:15 reads "Today · 00:15" in English, never "24:15"', async () => {
    await seed('midnight-1', todayAt(0, 15));

    const texts = textsOf(await renderCenter());

    expect(texts.some(text => text.startsWith('Today · 00:15'))).toBe(true);
    expect(texts.some(text => text.includes('24:'))).toBe(false);
  });

  it('00:00 reads 00:00', async () => {
    await seed('midnight-2', todayAt(0, 0));

    const texts = textsOf(await renderCenter());

    expect(texts.some(text => text.startsWith('Today · 00:00'))).toBe(true);
  });

  it('other hours are unchanged (zero-padded 24-hour clock)', async () => {
    await seed('morning', todayAt(7, 5));
    await seed('evening', todayAt(23, 59));

    const texts = textsOf(await renderCenter());

    expect(texts.some(text => text.startsWith('Today · 07:05'))).toBe(true);
    expect(texts.some(text => text.startsWith('Today · 23:59'))).toBe(true);
  });
});
