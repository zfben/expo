// The entry component (one that uses context modules) cannot be in the same file as the
// entry side-effects, otherwise they'll be updated when files are added/removed from the
// app directory. This will cause a lot of unfortunate errors regarding HMR and Fast Refresh.
// This is because Fast Refresh is sending the entire file containing an updated component.

// This has to be the string "expo-router/_ctx" as we resolve the exact string to
// a different file in a custom resolver for bundle splitting in Node.js.
import { ctx } from 'expo-router/_ctx';
import React from 'react';

// import { ExpoRoot } from './ExpoRoot';
import { Head } from './head';
import { Slot, Root } from './rsc/client';

// Must be exported or Fast Refresh won't update the context
export function App() {
  console.log('ctx', ctx.keys());
  // {/* <ExpoRoot context={ctx} /> */}
  return (
    <Head.Provider>
      <Root
        initialSearchParamsString={`platform=${'web'}&manifest=${encodeURIComponent(
          // Injected by the serializer in development
          JSON.stringify(global.$$expo_rsc_manifest)
        )}`}>
        <Slot id="index" />
      </Root>
    </Head.Provider>
  );
}
