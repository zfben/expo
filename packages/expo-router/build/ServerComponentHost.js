"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerComponentHost = exports.useServerComponent = void 0;
const react_1 = require("react");
const client_browser_1 = require("react-server-dom-webpack/client.browser");
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
function useServerComponent(props) {
    const [cache, setCache] = (0, react_1.useState)(initialCache);
    const key = JSON.stringify(props);
    let content = cache.get(key);
    if (!content) {
        content = (0, client_browser_1.createFromFetch)(fetch(`/_expo/rsc?props=${encodeURIComponent(key)}&route=${encodeURIComponent(props.$$route
        // TODO: Mock react-native when bundling for ios/android
        )}&platform=${'web'}&manifest=${encodeURIComponent(
        // Injected by the serializer in development
        JSON.stringify(global.$$expo_rsc_manifest))}`
        //   )}&platform=${Platform.OS}`
        ));
        cache.set(location, content);
    }
    return (0, react_1.use)(content);
}
exports.useServerComponent = useServerComponent;
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
function ServerComponentHost(props) {
    return useServerComponent(props).readRoot();
}
exports.ServerComponentHost = ServerComponentHost;
//# sourceMappingURL=ServerComponentHost.js.map