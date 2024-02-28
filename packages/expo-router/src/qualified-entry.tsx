// The entry component (one that uses context modules) cannot be in the same file as the
// entry side-effects, otherwise they'll be updated when files are added/removed from the
// app directory. This will cause a lot of unfortunate errors regarding HMR and Fast Refresh.
// This is because Fast Refresh is sending the entire file containing an updated component.

// This has to be the string "expo-router/_ctx" as we resolve the exact string to
// a different file in a custom resolver for bundle splitting in Node.js.
// import getDevServer from '@expo/metro-runtime/build/getDevServer';
// import { ctx } from 'expo-router/_ctx';
import React from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from './exports';

// MUST be the one from metro-runtime as it contains the URL query parameters for the bundle to configure Metro.
import { Router } from './rsc/router/client';
import { Try } from './views/Try';
import { Text } from 'react-native';
import { LocationContext } from './rsc/router/WindowLocationContext';

// TODO: There's something wrong with this on native. It shouldn't be needed.
const fallback = (
  <Text
    style={{
      marginHorizontal: 8,
      marginTop: 56,
      padding: 12,
      fontSize: 16,
      borderColor: 'blue',
      borderWidth: 2,
    }}>
    [Root Suspense Boundary]
  </Text>
);

// Must be exported or Fast Refresh won't update the context
export function App() {
  return (
    <LocationContext>
      <SafeAreaProvider>
        <Try catch={ErrorBoundary}>
          <Router />
        </Try>
      </SafeAreaProvider>
    </LocationContext>
  );
}
