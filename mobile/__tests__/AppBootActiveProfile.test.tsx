/**
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// The profile that was active when the app was closed (a daughter) must be restored AT LAUNCH. It used
// to be restored only when the Profile tab was first opened: until then every screen showed the
// mother's data while the profile switcher named the daughter.

const DAUGHTER = {
  id: 'daughter_boot_test',
  type: 'daughter',
  firstName: 'Noor',
  birthDate: '2014-05-01',
  hasHadFirstPeriod: false,
  lastPeriodDate: null,
  periodLength: null,
  cycleLength: null,
  regularity: null,
  profileImageUri: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('launch restores the saved active profile without opening the Profile tab', async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@hawa/managed-profiles/v1', JSON.stringify([DAUGHTER]));
  await AsyncStorage.setItem('@hawa/active-profile-id', DAUGHTER.id);

  let activeId = 'unset';
  await jest.isolateModulesAsync(async () => {
    require('../App'); // importing the app runs its launch-time hydration
    const {getActiveProfileId} = require('../src/state/activeProfileStore');
    for (let index = 0; index < 60; index += 1) {
      await Promise.resolve();
    }
    activeId = getActiveProfileId();
  });

  expect(activeId).toBe(DAUGHTER.id);
});
