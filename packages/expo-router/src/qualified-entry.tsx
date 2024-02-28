import React from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from './exports';

import { Router } from './rsc/router/client';
import { Try } from './views/Try';
import { LocationContext } from './rsc/router/WindowLocationContext';

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
