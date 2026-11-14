import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getCrashReportsChoice,
  isCrashReportsGranted,
  loadCrashReportsChoice,
  resetCrashReportsChoiceForTests,
  setCrashReportsChoice,
  subscribeCrashReportsChoice,
} from '../crashReportsPreferences';
import {classifyStorageKey} from '../../services/storageKeyClassifier';

const KEY = '@awa/security/crash-reports-v1';

beforeEach(async () => {
  await AsyncStorage.clear();
  resetCrashReportsChoiceForTests();
  jest.restoreAllMocks();
});

describe('crash-report consent store', () => {
  it('has never been asked by default: nothing is granted and the choice is null', async () => {
    expect(await loadCrashReportsChoice()).toBeNull();
    expect(getCrashReportsChoice()).toBeNull();
    expect(isCrashReportsGranted()).toBe(false);
  });

  it('reads back exactly what was stored', async () => {
    await AsyncStorage.setItem(KEY, 'granted');
    expect(await loadCrashReportsChoice()).toBe('granted');
    expect(isCrashReportsGranted()).toBe(true);

    resetCrashReportsChoiceForTests();
    await AsyncStorage.setItem(KEY, 'declined');
    expect(await loadCrashReportsChoice()).toBe('declined');
    expect(isCrashReportsGranted()).toBe(false);
  });

  it('treats any other stored value as "never asked", never as consent', async () => {
    for (const value of ['true', '1', 'yes', 'GRANTED', '']) {
      resetCrashReportsChoiceForTests();
      await AsyncStorage.setItem(KEY, value);
      expect(await loadCrashReportsChoice()).toBeNull();
      expect(isCrashReportsGranted()).toBe(false);
    }
  });

  it('a failed read is "never asked", not consent, and is retried on the next load', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'));
    expect(await loadCrashReportsChoice()).toBeNull();
    expect(isCrashReportsGranted()).toBe(false);

    await AsyncStorage.setItem(KEY, 'granted');
    expect(await loadCrashReportsChoice()).toBe('granted');
  });

  it('persists the answer before it shows in memory, and tells subscribers', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCrashReportsChoice(listener);

    await setCrashReportsChoice('granted');
    expect(await AsyncStorage.getItem(KEY)).toBe('granted');
    expect(isCrashReportsGranted()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    await setCrashReportsChoice('declined');
    expect(await AsyncStorage.getItem(KEY)).toBe('declined');
    expect(isCrashReportsGranted()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await setCrashReportsChoice('granted');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('a write that fails does not look like an accepted choice', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(setCrashReportsChoice('granted')).rejects.toThrow('disk full');
    expect(isCrashReportsGranted()).toBe(false);
    expect(getCrashReportsChoice()).toBeNull();
  });

  it('its key is filed as a preference by the storage classifier (so backups and "delete my data" know it)', () => {
    expect(classifyStorageKey(KEY).kind).toBe('preferences');
  });
});
