const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
// Adds Debug IDs to the bundle so release stack traces can be symbolicated with the uploaded source maps.
const { withSentryConfig } = require('@sentry/react-native/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config));
