/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { EntriesDev, EntriesPrd } from '../rsc/server';
export interface RenderContext<T = unknown> {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: T;
}
export declare const fileURLToFilePath: (fileURL: string) => string;
export declare function getRouteNodeForPathname(pathname: string): Promise<import("../getServerManifest").ExpoRouterServerManifestV1Route<string>>;
type ResolvedConfig = any;
export declare function renderRsc(opts: {
    config: ResolvedConfig;
    input: string;
    searchParams: URLSearchParams;
    method: 'GET' | 'POST';
    context: unknown;
    body?: ReadableStream | undefined;
    contentType?: string | undefined;
    moduleIdCallback?: (module: {
        id: string;
        chunks: string[];
        name: string;
        async: boolean;
    }) => void;
    resolveClientEntry: (id: string) => {
        id: string;
        url: string;
    };
} & ({
    isExporting: true;
    entries: EntriesPrd;
} | {
    isExporting: false;
    entries: EntriesDev;
    customImport: (fileURL: string) => Promise<unknown>;
})): Promise<ReadableStream>;
export declare function getBuildConfig(opts: {
    config: ResolvedConfig;
    entries: EntriesPrd;
}): Promise<Iterable<{
    pathname: string;
    entries?: Iterable<{
        input: string;
        skipPrefetch?: boolean | undefined;
        isStatic?: boolean | undefined;
    }> | undefined;
    customCode?: string | undefined;
    context?: unknown;
}>>;
export {};
//# sourceMappingURL=rsc-renderer.d.ts.map