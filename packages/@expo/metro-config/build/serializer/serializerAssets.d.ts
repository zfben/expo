export type SerialAsset = {
    originFilename: string;
    filename: string;
    source: string;
    type: 'css' | 'js' | 'map' | 'json';
    metadata: Record<string, boolean | string | string[]>;
};
