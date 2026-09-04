module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // @noble/ciphers ships ESM-only .js files (used by privateNotesEncryption.ts/
  // privateJournalEncryption.ts for local AES-256-GCM encryption) — needs
  // Babel transformation like the RN packages already allow-listed here,
  // otherwise Jest fails to parse its `export`/`import` syntax.
  // @notifee/react-native's own official jest-mock.js (see jest.setup.js) is
  // likewise ESM source, not a pre-built CJS file — it needs the same
  // transformation to be `require()`-able from the mock factory.
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|react-native-reanimated|react-native-linear-gradient|@react-native|@react-navigation|@noble|@notifee)/)',
  ],
  moduleNameMapper: {
    '\\.(png|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
