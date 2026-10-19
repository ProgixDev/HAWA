import {I18nManager, NativeModules, Platform} from 'react-native';

import {readDeviceLocaleTags} from '../deviceLanguage';

// The device's preferred languages: the Android native list first, then React Native's primary locale, then the iOS
// settings; every failure ends in an empty list (the caller falls back to English), never in an exception.

const modules = NativeModules as {AwaDeviceLocales?: unknown};
let constantsSpy: jest.SpyInstance;

beforeEach(() => {
  delete modules.AwaDeviceLocales;
  constantsSpy = jest.spyOn(I18nManager as unknown as {getConstants: () => unknown}, 'getConstants').mockReturnValue({localeIdentifier: undefined});
});

afterEach(() => {
  delete modules.AwaDeviceLocales;
  constantsSpy.mockRestore();
});

describe('readDeviceLocaleTags', () => {
  it('returns the whole ordered list from the Android native module (Arabic first, French second)', async () => {
    modules.AwaDeviceLocales = {getPreferredLocales: jest.fn(async () => ['ar-DZ', 'fr-DZ', 'en-US'])};
    await expect(readDeviceLocaleTags()).resolves.toEqual(['ar-DZ', 'fr-DZ', 'en-US']);
  });

  it('ignores non-string entries in the native list', async () => {
    modules.AwaDeviceLocales = {getPreferredLocales: jest.fn(async () => ['de-DE', 42, null, '', '  ', 'fr'])};
    await expect(readDeviceLocaleTags()).resolves.toEqual(['de-DE', 'fr']);
  });

  it('falls back to React Native\'s primary locale when the native module is not in the installed build', async () => {
    constantsSpy.mockReturnValue({localeIdentifier: 'fr_DZ'});
    await expect(readDeviceLocaleTags()).resolves.toEqual(['fr_DZ']);
  });

  it('falls back to the primary locale when the native module fails or returns nothing', async () => {
    constantsSpy.mockReturnValue({localeIdentifier: 'es_ES'});
    modules.AwaDeviceLocales = {getPreferredLocales: jest.fn(async () => { throw new Error('boom'); })};
    await expect(readDeviceLocaleTags()).resolves.toEqual(['es_ES']);
    modules.AwaDeviceLocales = {getPreferredLocales: jest.fn(async () => [])};
    await expect(readDeviceLocaleTags()).resolves.toEqual(['es_ES']);
    modules.AwaDeviceLocales = {getPreferredLocales: 'not a function'};
    await expect(readDeviceLocaleTags()).resolves.toEqual(['es_ES']);
  });

  it('returns an empty list, never throws, when nothing can be read', async () => {
    await expect(readDeviceLocaleTags()).resolves.toEqual([]);
    constantsSpy.mockImplementation(() => { throw new Error('no constants'); });
    await expect(readDeviceLocaleTags()).resolves.toEqual([]);
  });

  it('on iOS also reads the AppleLanguages / AppleLocale settings', async () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'ios');
    const original = (NativeModules as {SettingsManager?: unknown}).SettingsManager;
    (NativeModules as {SettingsManager?: unknown}).SettingsManager = {settings: {AppleLanguages: ['it-IT', 'en-US'], AppleLocale: 'it_IT'}};
    try {
      await expect(readDeviceLocaleTags()).resolves.toEqual(['it-IT', 'en-US', 'it_IT']);
    } finally {
      (NativeModules as {SettingsManager?: unknown}).SettingsManager = original;
      platform.restore();
    }
  });
});
