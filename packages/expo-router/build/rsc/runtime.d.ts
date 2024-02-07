/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
declare const rscClientModuleCache: Map<any, any>;
/**
 * Must satisfy the requirements of the Metro bundler.
 * https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0605-lazy-bundling.md#__loadbundleasync-in-metro
 */
type AsyncRequire = (path: string) => Promise<void>;
/** Create an `loadBundleAsync` function in the expected shape for Metro bundler. */
declare function buildProdAsyncRequire(): AsyncRequire | null;
declare const prodFetcher: AsyncRequire | null;
//# sourceMappingURL=runtime.d.ts.map