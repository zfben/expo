import type { FunctionComponent, ReactNode } from 'react';
import { defineEntries } from '../server.js';
import type { RouteProps, ShouldSkip } from './common.js';
import { PathSpec } from '../path.js';
export declare function defineRouter(getPathConfig: () => Promise<Iterable<{
    path: PathSpec;
    isStatic?: boolean;
}>>, getComponent: (componentId: string, // "**/layout" or "**/page"
unstable_setShouldSkip: (val?: ShouldSkip[string]) => void) => Promise<FunctionComponent<RouteProps> | FunctionComponent<RouteProps & {
    children: ReactNode;
}> | {
    default: FunctionComponent<RouteProps>;
} | {
    default: FunctionComponent<RouteProps & {
        children: ReactNode;
    }>;
} | null>): ReturnType<typeof defineEntries>;
//# sourceMappingURL=defineRouter.d.ts.map