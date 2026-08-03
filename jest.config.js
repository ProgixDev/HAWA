module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '\\.(png|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
