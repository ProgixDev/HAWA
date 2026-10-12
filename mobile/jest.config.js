module.exports = {
  // Half of the cores. With one worker per core (the Jest default, cores - 1) the ~400 suites — many of which mount
  // whole screens and run AES-GCM — oversubscribe CPU and memory: a handful of ordinary tests (each ~0.2-1 s alone)
  // then exceed the unchanged 5 s per-test timeout, a DIFFERENT handful on every run. At 50% both the default and the
  // encrypted run are fully green and no slower. This caps parallelism only; no timeout was raised and no test skipped.
  // Override on the command line with --maxWorkers=<n> when a machine has plenty of headroom.
  maxWorkers: '50%',
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
    'node_modules/(?!((@)?react-native|react-native-reanimated|react-native-linear-gradient|@react-native|@react-navigation|@noble|@notifee|@react-native-documents)/)',
  ],
  moduleNameMapper: {
    '\\.(png|webp|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
