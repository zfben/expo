/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { fetchAsync } from './fetchAsync';

declare let global: {
  globalEvalWithSourceUrl?: any;
};

/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon`.
 */
export function fetchThenEvalAsync(url: string): Promise<void> {
  return fetchAsync(url).then(({ body, status, headers }) => {
    if (
      headers?.has?.('Content-Type') != null &&
      headers.get('Content-Type')!.includes('application/json')
    ) {
      // Errors are returned as JSON.
      throw new Error(JSON.parse(body).message || `Unknown error fetching '${url}'`);
    }

    // body can be an error from Metro if a module is missing.
    // {"originModulePath":"/Users/evanbacon/Documents/GitHub/expo/.","targetModuleName":"./http://localhost:8081/node_modules/react-native/index.js","message":"Unable to resolve module ./http://localhost:8081/node_modules/react-native/index.js from /Users/evanbacon/Documents/GitHub/expo/.: \n\nNone of these files exist:\n  * ../../http:/localhost:8081/node_modules/react-native/index.js(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n  * ../../http:/localhost:8081/node_modules/react-native/index.js/index(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)","cause":{"candidates":{"file":{"type":"sourceFile","filePathPrefix":"../../http:/localhost:8081/node_modules/react-native/index.js","candidateExts":["",".ios.ts",".native.ts",".ts",".ios.tsx",".native.tsx",".tsx",".ios.mjs",".native.mjs",".mjs",".ios.js",".native.js",".js",".ios.jsx",".native.jsx",".jsx",".ios.json",".native.json",".json",".ios.cjs",".native.cjs",".cjs",".ios.scss",".native.scss",".scss",".ios.sass",".native.sass",".sass",".ios.css",".native.css",".css"]},"dir":{"type":"sourceFile","filePathPrefix":"../../http:/localhost:8081/node_modules/react-native/index.js/index","candidateExts":["",".ios.ts",".native.ts",".ts",".ios.tsx",".native.tsx",".tsx",".ios.mjs",".native.mjs",".mjs",".ios.js",".native.js",".js",".ios.jsx",".native.jsx",".jsx",".ios.json",".native.json",".json",".ios.cjs",".native.cjs",".cjs",".ios.scss",".native.scss",".scss",".ios.sass",".native.sass",".sass",".ios.css",".native.css",".css"]}},"name":"Error","message":"The module could not be resolved because none of these files exist:\n\n  * /Users/evanbacon/Documents/GitHub/expo/http:/localhost:8081/node_modules/react-native/index.js(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n  * /Users/evanbacon/Documents/GitHub/expo/http:/localhost:8081/node_modules/react-native/index.js/index(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)","stack":"Error: The module could not be resolved because none of these files exist:\n\n  * /Users/evanbacon/Documents/GitHub/expo/http:/localhost:8081/node_modules/react-native/index.js(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n  * /Users/evanbacon/Documents/GitHub/expo/http:/localhost:8081/node_modules/react-native/index.js/index(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n    at upstreamResolveRequest (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-resolver/src/resolve.js:59:13)\n    at resolveRequest (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/metro/withMetroResolvers.ts:94:20)\n    at upstreamResolveRequest (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-resolver/src/resolve.js:47:12)\n    at firstResolver (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/metro/withMetroResolvers.ts:94:20)\n    at firstResolver (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/metro/withMetroResolvers.ts:108:16)\n    at resolveRequest (/Users/evanbacon/Documents/GitHub/expo/packages/@expo/cli/src/start/server/metro/withMetroResolvers.ts:137:16)\n    at Object.resolve (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-resolver/src/resolve.js:47:12)\n    at ModuleResolver.resolveDependency (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/node-haste/DependencyGraph/ModuleResolution.js:88:31)\n    at DependencyGraph.resolveDependency (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/node-haste/DependencyGraph.js:279:43)\n    at /Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/lib/transformHelpers.js:176:21\n    at Server._resolveRelativePath (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/Server.js:1093:12)\n    at Server.requestProcessor [as _processBundleRequest] (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/Server.js:456:33)\n    at Server._processRequest (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/Server.js:387:7)"},"errors":[{"description":"Unable to resolve module ./http://localhost:8081/node_modules/react-native/index.js from /Users/evanbacon/Documents/GitHub/expo/.: \n\nNone of these files exist:\n  * ../../http:/localhost:8081/node_modules/react-native/index.js(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n  * ../../http:/localhost:8081/node_modules/react-native/index.js/index(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)"}],"name":"Error","stack":"Error: Unable to resolve module ./http://localhost:8081/node_modules/react-native/index.js from /Users/evanbacon/Documents/GitHub/expo/.: \n\nNone of these files exist:\n  * ../../http:/localhost:8081/node_modules/react-native/index.js(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n  * ../../http:/localhost:8081/node_modules/react-native/index.js/index(.ios.ts|.native.ts|.ts|.ios.tsx|.native.tsx|.tsx|.ios.mjs|.native.mjs|.mjs|.ios.js|.native.js|.js|.ios.jsx|.native.jsx|.jsx|.ios.json|.native.json|.json|.ios.cjs|.native.cjs|.cjs|.ios.scss|.native.scss|.scss|.ios.sass|.native.sass|.sass|.ios.css|.native.css|.css)\n    at ModuleResolver.resolveDependency (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/node-haste/DependencyGraph/ModuleResolution.js:127:15)\n    at DependencyGraph.resolveDependency (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/node-haste/DependencyGraph.js:279:43)\n    at /Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/lib/transformHelpers.js:176:21\n    at Server._resolveRelativePath (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/Server.js:1093:12)\n    at Server.requestProcessor [as _processBundleRequest] (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/Server.js:456:33)\n    at Server._processRequest (/Users/evanbacon/Documents/GitHub/expo/node_modules/metro/src/Server.js:387:7)"}

    if (status === 200) {
      // Some engines do not support `sourceURL` as a comment. We expose a
      // `globalEvalWithSourceUrl` function to handle updates in that case.
      if (global.globalEvalWithSourceUrl) {
        return global.globalEvalWithSourceUrl(body, url);
      } else {
        // eslint-disable-next-line no-eval
        return eval(body);
      }
    } else {
      // Format Metro errors if possible.
      if (process.env.NODE_ENV === 'development') {
        const error = jsonParseOptional(body);
        if (error) {
          // TODO: This is essentially like the Metro native red box errors. We should do a better job formatting them so
          // the user experience doesn't feel bad. This can be tested by loading a split bundle that results in a missing module error from Metro.
          if ('message' in error) {
            throw new Error('Error fetching split bundle from Metro (check terminal):\n' + error.message);
          }
        }
      }

      throw new Error(`Failed to load bundle for ${url}: ${body}`);
    }
  });
}

function jsonParseOptional(json: string): any {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}