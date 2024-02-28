export type RouteProps = {
    path: string;
    searchParams: URLSearchParams;
};
export declare function getComponentIds(path: string): readonly string[];
export declare function getInputString(path: string): string;
export declare function parseInputString(input: string): string;
export declare const PARAM_KEY_SKIP = "expo_router_skip";
export declare const SHOULD_SKIP_ID = "/SHOULD_SKIP";
export type ShouldSkip = Record<string, {
    path?: boolean;
    keys?: string[];
}>;
//# sourceMappingURL=common.d.ts.map