import {I18nManager, NativeModules, Platform} from 'react-native';

// The device's preferred languages, most preferred first, as raw locale tags ("fr-DZ", "fr_DZ", "zh-Hans-CN" ...).
// This file only READS them; deciding which one AWA supports is themePreferences.ts's job (it owns the supported list and
// the normalisation), so there is one language rule, not two.
//
// Sources, in order:
//  1. Android: the small in-app native module `AwaDeviceLocales` (android/.../AwaDeviceLocalesModule.kt) returns the
//     system's whole ordered language list (Settings -> Languages), which React Native itself does not expose.
//  2. React Native's own I18nManager constant `localeIdentifier` (the primary locale only) — used when the native module
//     is not in the installed build, so an older build still follows the phone's main language.
//  3. iOS: the AppleLanguages / AppleLocale settings.
// Any failure returns an empty list (the caller then falls back to English); this never throws.

type DeviceLocalesModule = {getPreferredLocales?: () => Promise<unknown>};

const asTags = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

export async function readDeviceLocaleTags(): Promise<string[]> {
  try {
    const native = (NativeModules as {AwaDeviceLocales?: DeviceLocalesModule}).AwaDeviceLocales;
    if (native && typeof native.getPreferredLocales === 'function') {
      const tags = asTags(await native.getPreferredLocales());
      if (tags.length > 0) {
        return tags;
      }
    }
  } catch {
    // fall through to the next source
  }

  const tags: string[] = [];
  try {
    const identifier = (I18nManager as unknown as {getConstants?: () => {localeIdentifier?: unknown}}).getConstants?.().localeIdentifier;
    if (typeof identifier === 'string' && identifier.trim()) {
      tags.push(identifier);
    }
  } catch {
    // no locale constant on this build
  }

  if (Platform.OS === 'ios') {
    try {
      const settings = (NativeModules as {SettingsManager?: {settings?: {AppleLanguages?: unknown; AppleLocale?: unknown}}}).SettingsManager?.settings;
      tags.unshift(...asTags(settings?.AppleLanguages));
      if (typeof settings?.AppleLocale === 'string') {
        tags.push(settings.AppleLocale);
      }
    } catch {
      // ignore
    }
  }
  return tags;
}
