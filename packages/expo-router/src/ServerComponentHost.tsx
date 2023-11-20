import { use, useState, unstable_getCacheForType, unstable_useCacheRefresh } from 'react';
import { createFromFetch } from 'react-server-dom-webpack/client.browser';
import { Platform } from 'react-native';

function createResponseCache() {
  return new Map();
}

// export function useRefresh() {
//   const refreshCache = unstable_useCacheRefresh();
//   return function refresh(key, seededResponse) {
//     refreshCache(createResponseCache, new Map([[key, seededResponse]]));
//   };
// }

const initialCache = new Map();

export function useServerComponent(props) {
  const [cache, setCache] = useState(initialCache);
  const key = JSON.stringify(props);
  let content = cache.get(key);
  if (!content) {
    content = createFromFetch(
      fetch(
        `/_expo/rsc?props=${encodeURIComponent(key)}&route=${encodeURIComponent(
          props.$$route
          // TODO: Mock react-native when bundling for ios/android
        )}&platform=${'web'}&manifest=${encodeURIComponent(
          // Injected by the serializer in development
          JSON.stringify(global.$$expo_rsc_manifest)
        )}`
        //   )}&platform=${Platform.OS}`
      )
    );
    cache.set(location, content);
  }

  return use(content);
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
