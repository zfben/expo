export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js' | 'map' | 'json';
    metadata: {
        isAsync?: boolean;
        modulePaths?: string[];
    } & Record<string, boolean | string | string[]>;
};
