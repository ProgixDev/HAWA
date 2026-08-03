module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '\\.(png|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
