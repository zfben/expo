type ResolvedConfig = {
    publicDir: string;
    basePath: string;
    rscPath: string;
};
export declare const renderHtml: (opts: {
    serverRoot: string;
    config: ResolvedConfig;
    pathname: string;
    searchParams: URLSearchParams;
    htmlHead: string;
    renderRscForHtml: (input: string, searchParams: URLSearchParams) => Promise<ReadableStream>;
    getSsrConfigForHtml: (pathname: string, searchParams: URLSearchParams) => Promise<{
        input: string;
        searchParams?: URLSearchParams | undefined;
        body: ReadableStream;
    } | null>;
} & ({
    isDev: false;
    loadModule: (id: string) => Promise<unknown>;
    isBuild: boolean;
} | {
    isDev: true;
    rootDir: string;
    loadServerFile: (fileURL: string) => Promise<unknown>;
})) => Promise<ReadableStream | null>;
export {};
//# sourceMappingURL=html-renderer.d.ts.map