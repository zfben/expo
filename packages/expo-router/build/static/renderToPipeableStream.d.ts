/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { ReactNode } from 'react';
export interface RenderContext<T = unknown> {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: T;
}
export declare const fileURLToFilePath: (fileURL: string) => string;
export declare function getRouteNodeForPathname(pathname: string): Promise<import("../getServerManifest").ExpoRouterServerManifestV1Route<string>>;
export declare function renderRouteWithContextKey(contextKey: string, props: Record<string, unknown>): Promise<React.DetailedReactHTMLElement<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>>;
export declare function renderToPipeableStream({ mode, elements, isExporting, url, serverUrl, serverRoot, method, input, body, contentType, customImport, onReload, moduleIdCallback, }: {
    elements: Record<string, ReactNode>;
    isExporting: boolean;
    mode: string;
    serverRoot: string;
    url: URL;
    serverUrl: URL;
    method: string;
    input: string;
    body?: ReadableStream | undefined;
    contentType?: string | undefined;
    customImport: (file: string) => Promise<any>;
    onReload: () => void;
    moduleIdCallback?: (module: {
        id: string;
        chunks: string[];
        name: string;
        async: boolean;
    }) => void;
}): Promise<ReadableStream>;
//# sourceMappingURL=renderToPipeableStream.d.ts.map