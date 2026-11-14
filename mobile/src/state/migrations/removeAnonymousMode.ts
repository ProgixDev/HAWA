import AsyncStorage from '@react-native-async-storage/async-storage';

// One-time clean-up after the removal of "Mode anonyme": takes the old `anonymousMode` field out of the privacy settings and deletes the
// anonymous identifier and avatar keys an earlier version may have written. Idempotent: it records itself as done, and every step is a
// no-op when there is nothing left to remove. A step that throws leaves the marker unset, so the next launch simply runs it again.

const MARKER_KEY = '@awa/migrations/remove-anonymous-v1';
const SETTINGS_KEY = '@awa/security/settings-v1';
const LEFTOVER_KEYS = [
  '@hawa/security/anonymous-id',
  '@hawa/security/anonymous-created-at',
  '@hawa/profile-avatar-preferences/v1',
];

export async function removeAnonymousModeLeftovers(): Promise<void> {
  if ((await AsyncStorage.getItem(MARKER_KEY)) === 'true') {
    return;
  }

  const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY);
  if (rawSettings) {
    try {
      const parsed: unknown = JSON.parse(rawSettings);
      if (parsed && typeof parsed === 'object' && 'anonymousMode' in parsed) {
        const rest = {...(parsed as Record<string, unknown>)};
        delete rest.anonymousMode;
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(rest));
      }
    } catch {
      // unreadable settings JSON: left exactly as it is (the settings reader already falls back to its defaults)
    }
  }

  await Promise.all(LEFTOVER_KEYS.map(key => AsyncStorage.removeItem(key)));
  await AsyncStorage.setItem(MARKER_KEY, 'true');
}
