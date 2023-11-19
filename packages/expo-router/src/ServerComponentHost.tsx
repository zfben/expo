import { use, unstable_getCacheForType, unstable_useCacheRefresh } from 'react';
import { createFromFetch } from 'react-server-dom-webpack';
import { Platform } from 'react-native';

function createResponseCache() {
  return new Map();
}

export function useRefresh() {
  const refreshCache = unstable_useCacheRefresh();
  return function refresh(key, seededResponse) {
    refreshCache(createResponseCache, new Map([[key, seededResponse]]));
  };
}

export function useServerComponent(props) {
  const key = JSON.stringify(props);
  const cache = unstable_getCacheForType(createResponseCache);
  let response = cache.get(key);
  if (response) {
    return response;
  }
  response = createFromFetch(
    fetch(
      `/_expo/rsc?props=${encodeURIComponent(key)}&route=${encodeURIComponent(
        props.$$route
        // TODO: Mock react-native when bundling for ios/android
      )}&platform=${'web'}`
      //   )}&platform=${Platform.OS}`
    )
  );
  cache.set(key, response);
  return response;
}

// export function useServerComponentAlt(props) {
//   const key = JSON.stringify(props);
//   const response = createFromFetch(
//     fetch(
//       `/_expo/rsc?props=${encodeURIComponent(key)}&route=${encodeURIComponent(
//         props.$$route
//         // TODO: Mock react-native when bundling for ios/android
//       )}&platform=${'web'}`
//       //   )}&platform=${Platform.OS}`
//     )
//   );
//   return use(response);
// }

export function ServerComponentHost(props) {
  return useServerComponent(props).readRoot();
}
