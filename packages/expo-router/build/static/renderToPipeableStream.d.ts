/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
type WebpackManifestSubType = {
    id: string;
    chunks: string[];
    name: string;
};
type WebpackManifest = {
    [filepath: string]: {
        [name: string]: WebpackManifestSubType;
    };
};
export declare function renderToPipeableStream({ $$route: route, ...props }: {
    [x: string]: any;
    $$route: any;
}, moduleMap: WebpackManifest): Promise<any>;
export {};
//# sourceMappingURL=renderToPipeableStream.d.ts.map