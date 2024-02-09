export declare const encodeFilePathToAbsolute: (filePath: string) => string;
export declare const decodeFilePathFromAbsolute: (filePath: string) => string;
export declare const filePathToFileURL: (filePath: string) => string;
export declare const fileURLToFilePath: (fileURL: string) => string;
export declare const joinPath: (...paths: string[]) => string;
export declare const extname: (filePath: string) => string;
export type PathSpecItem = {
    type: 'literal';
    name: string;
} | {
    type: 'group';
    name?: string;
} | {
    type: 'wildcard';
    name?: string;
};
export type PathSpec = readonly PathSpecItem[];
export declare const parsePathWithSlug: (path: string) => PathSpec;
export declare const getPathMapping: (pathSpec: PathSpec, pathname: string) => Record<string, string | string[]> | null;
//# sourceMappingURL=path.d.ts.map