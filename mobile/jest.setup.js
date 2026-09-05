/* eslint-env jest */
require('react-native-reanimated').setUpTests();

const mockAsyncStorageData = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async key => mockAsyncStorageData.get(key) ?? null),
    setItem: jest.fn(async (key, value) => { mockAsyncStorageData.set(key, value); }),
    removeItem: jest.fn(async key => { mockAsyncStorageData.delete(key); }),
    clear: jest.fn(async () => { mockAsyncStorageData.clear(); }),
    // PHASE E2 — DataManagementScreen (src/screens/DataPrivacyScreens.tsx)
    // is the first test to exercise getAllKeys(); added to this pre-existing
    // mock rather than to the (unrelated) screen under test.
    getAllKeys: jest.fn(async () => Array.from(mockAsyncStorageData.keys())),
  },
}));

// Importing '@react-native-community/geolocation' triggers its real
// NativeEventEmitter/native-module lookup at require-time (see
// js/nativeInterface.ts), which throws in Jest because no native module is
// linked into the test environment — this is a Jest/Node limitation, not an
// Android runtime issue (the native module is genuinely linked for the real
// app). Mocking it here replaces the module before LocationScreen.tsx (via
// App.tsx) ever reaches that require, so App.test.tsx can render without
// touching real native code. Only the two methods LocationScreen.tsx
// actually calls (getCurrentPosition, requestAuthorization) are provided.
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn(),
    requestAuthorization: jest.fn(),
  },
}));

// Same require-time problem as Geolocation above, one level further down the
// same import chain (LocationScreen.tsx -> @maplibre/maplibre-react-native):
// its Camera component pulls in a Fabric native component spec written as
// ESM, which Jest's transformIgnorePatterns doesn't cover and which has no
// native backing in the test environment anyway. Mocked with plain
// components exposing only what LocationScreen.tsx actually renders
// (Camera, Map, UserLocation) — real map rendering is untouched, it only
// ever runs on-device.
jest.mock('@maplibre/maplibre-react-native', () => {
  const {forwardRef} = require('react');
  return {
    __esModule: true,
    Camera: forwardRef((_props, _ref) => null),
    Map: ({children}) => children ?? null,
    UserLocation: () => null,
  };
});

// Same require-time problem again, this time from
// '@react-native-community/datetimepicker' (its source ships as an
// untransformed ESM `.js` file) — reached because AppNavigator.tsx eagerly
// imports every screen, and 14 of them import this date/time picker. Only
// the default export (the picker component itself) is used anywhere in the
// app; it's mocked as a no-op component here.
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));

// Same require-time problem again, from '@notifee/react-native' (the app's
// single local-notification chokepoint, see pregnancyNotifications.ts) — it
// constructs its native module at import time and throws when none is
// linked. The package ships its own official Jest mock for exactly this
// case (see its jest-mock.js header comment) — reused as-is rather than
// hand-rolling the many enums (AndroidImportance, AndroidVisibility, etc.)
// it exports.
jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));

// Same require-time problem again, from 'react-native-image-picker' (used by
// the profile/journal photo pickers) — its source ships as untransformed
// ESM. Only the two functions actually called anywhere in the app
// (launchCamera, launchImageLibrary) are mocked; both are only ever invoked
// from a button press, never during render, so a cancelled-pick response is
// a safe default.
jest.mock('react-native-image-picker', () => ({
  __esModule: true,
  launchCamera: jest.fn(async () => ({didCancel: true})),
  launchImageLibrary: jest.fn(async () => ({didCancel: true})),
}));

// Same require-time problem again, from '@dr.pogodin/react-native-fs' (used
// by privatePhotoStorage.ts and medicalExportShare.ts). Shape matches the
// mock medicalExportShare.test.ts already defines locally for itself — that
// file's own jest.mock() still takes precedence there; this one only covers
// the two production files that otherwise reach the real, untransformed
// package via AppNavigator's eager screen imports.
jest.mock('@dr.pogodin/react-native-fs', () => ({
  __esModule: true,
  CachesDirectoryPath: '/mock-caches-dir',
  DocumentDirectoryPath: '/mock-document-dir',
  exists: jest.fn(),
  mkdir: jest.fn(),
  readDir: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

// Same require-time problem again, from 'react-native-share' (used by
// medicalExportShare.ts for the Medical Export "share" sheet) — its native
// TurboModule isn't registered in the Jest environment. Shape matches the
// mock medicalExportShare.test.ts already defines locally for itself.
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {open: jest.fn()},
}));
