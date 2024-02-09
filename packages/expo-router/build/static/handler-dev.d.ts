export declare const CLIENT_MODULE_MAP: {
    react: any;
    'rd-server': any;
    'rsdw-client': any;
    'waku-client': any;
};
export type CLIENT_MODULE_KEY = keyof typeof CLIENT_MODULE_MAP;
type Config = {
    basePath: string;
    rscPath: string;
    htmlHead: string;
    srcDir: string;
    mainJs: string;
    publicDir: string;
};
export declare function createHandler<Context, Req extends Request, Res extends Response>(options: {
    projectRoot: string;
    config: Config;
    ssr?: boolean;
    env?: Record<string, string>;
    ssrLoadModule: (fileURL: string) => Promise<unknown>;
    transformIndexHtml: (pathname: string, data: string) => Promise<string>;
    renderRscWithWorker: <Context>(props: {
        input: string;
        searchParamsString: string;
        method: 'GET' | 'POST';
        contentType: string | undefined;
        config: Config;
        context: unknown;
        stream?: ReadableStream | undefined;
        moduleIdCallback?: (id: string) => void;
    }) => Promise<readonly [ReadableStream, Context]>;
}): (req: any, res: any, next: any) => Promise<void>;
export {};
//# sourceMappingURL=handler-dev.d.ts.map