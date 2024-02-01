/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on this but with web support:
 * https://github.com/facebook/react-native/blob/086714b02b0fb838dee5a66c5bcefe73b53cf3df/Libraries/Utilities/HMRClient.js
 */
type LogLevel = 'trace' | 'info' | 'warn' | 'error' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
export type HMRClientNativeInterface = {
    enable(): void;
    disable(): void;
    registerBundle(requestUrl: string): void;
    log(level: LogLevel, data: any[]): void;
    setup(props: {
        isEnabled: boolean;
        onError?: (error: Error) => void;
    }): void;
};
/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
declare const HMRClient: HMRClientNativeInterface;
export default HMRClient;
//# sourceMappingURL=HMRClientRSC.d.ts.map