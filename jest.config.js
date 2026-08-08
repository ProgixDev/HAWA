module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|react-native-reanimated|react-native-linear-gradient|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '\\.(png|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
