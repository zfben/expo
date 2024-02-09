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

// MUST be the one from metro-runtime as it contains the URL query parameters for the bundle to configure Metro.
import getDevServer from '@expo/metro-runtime/build/getDevServer';
// import { Try } from './views/Try';
// import { ErrorBoundary } from './exports';

const introUrl = getDevServer().fullBundleUrl;
// TODO: This is buggy and doesn't work well, maybe inject the query params in babel.
const searchParams = introUrl ? new URL(introUrl).searchParams.toString() : '';

// console.log('searchParams', searchParams);
// Must be exported or Fast Refresh won't update the context
export function App() {
  // console.log('ctx', ctx.keys());
  // {/* <ExpoRoot context={ctx} /> */}

  // return (
  //   <View style={{ flex: 1 }}>
  //     <Text>Hey</Text>
  //   </View>
  // );
  return (
    <React.Suspense fallback={null}>
      <Head.Provider>
        {/* <Try catch={ErrorBoundary}> */}
        <Root initialSearchParamsString={searchParams}>
          <Slot id="index" />
        </Root>
        {/* </Try> */}
      </Head.Provider>
    </React.Suspense>
  );
}
