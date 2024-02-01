/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export interface RenderContext<T = unknown> {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: T;
}
export declare const fileURLToFilePath: (fileURL: string) => string;
export declare function renderToPipeableStream({ $$route: route, ...props }: {
    $$route: string;
}, { mode, url, serverUrl, serverRoot, method, input, body, contentType, customImport, onReload, }: {
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
}): Promise<ReadableStream>;
//# sourceMappingURL=renderToPipeableStream.d.ts.map