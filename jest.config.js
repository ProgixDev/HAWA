module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // @noble/ciphers ships ESM-only .js files (used by privateNotesEncryption.ts/
  // privateJournalEncryption.ts for local AES-256-GCM encryption) — needs
  // Babel transformation like the RN packages already allow-listed here,
  // otherwise Jest fails to parse its `export`/`import` syntax.
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|react-native-reanimated|react-native-linear-gradient|@react-native|@react-navigation|@noble)/)',
  ],
  moduleNameMapper: {
    '\\.(png|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
