/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, types } from '@babel/core';
export declare function environmentRestrictedImportsPlugin(api: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
export declare function rscForbiddenReactAPIsPlugin(api: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
export declare function expoRouterServerComponentClientReferencesPlugin(api: ConfigAPI & {
    types: typeof types;
}): {
    name: string;
    visitor: {
        Program(path: any, state: any): void;
    };
};
