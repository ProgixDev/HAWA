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
  },
}));
