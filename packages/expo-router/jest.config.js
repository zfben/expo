const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  //   getAndroidPreset,
} = require('jest-expo/config/getPlatformPreset');
const { withWatchPlugins } = require('jest-expo/config/withWatchPlugins');

function withDefaults({ watchPlugins, ...config }) {
  return {
    ...config,
    roots: ['src'],
    clearMocks: true,
    // setupFilesAfterEnv: ['./build/testing-library/mocks.js'],
  };
}
const nodePreset = getNodePreset();

module.exports = withWatchPlugins({
  projects: [
    // Create a new project for each platform.
    getWebPreset(),
    {
      ...nodePreset,
      testEnvironmentOptions: {
        ...(nodePreset.testEnvironmentOptions || {}),
        customExportConditions: ['node', 'import', 'react-server', 'server'],
      },
      // transform: {
      //   '^.+\\.jsx?$': 'babel-jest',
      //   // Add any other transforms here
      // },
      // transformIgnorePatterns: [
      //   '/node_modules/(?!((jest-)?react-native|acorn-loose|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      //   '/node_modules/react-native-reanimated/plugin/',

      //   // ...(nodePreset.transformIgnorePatterns || []),
      //   // 'node_modules/(?!(acorn-loose)/)',
      // ],
    },
    getIOSPreset(),
    //   getAndroidPreset(),
  ].map(withDefaults),
});
