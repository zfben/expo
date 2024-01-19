export declare const encodeInput: (input: string) => string;
export declare const decodeInput: (encodedInput: string) => string;
export declare const hasStatusCode: (x: unknown) => x is {
    statusCode: number;
};
export declare const generatePrefetchCode: (basePrefix: string, inputs: Iterable<string>, moduleIds: Iterable<string>) => string;
export declare const deepFreeze: (x: unknown) => void;
//# sourceMappingURL=utils.d.ts.map