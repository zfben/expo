import type { ReactNode } from 'react';
declare global {
    interface ImportMeta {
        readonly env: Record<string, string>;
    }
}
type Elements = Promise<Record<string, ReactNode>>;
export declare const fetchRSC: any;
export declare const prefetchRSC: any;
export declare const Root: ({ initialInput, initialSearchParamsString, children, }: {
    initialInput?: string | undefined;
    initialSearchParamsString?: string | undefined;
    children: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<(input: string, searchParams?: URLSearchParams) => void>>;
export declare const useRefetch: () => any;
export declare const Slot: ({ id, children, fallback, }: {
    id: string;
    children?: ReactNode;
    fallback?: ReactNode;
}) => string | number | true | import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>> | import("react").ReactFragment | import("react").FunctionComponentElement<import("react").ProviderProps<ReactNode>>;
export declare const Children: () => any;
export declare const ServerRoot: ({ elements, children }: {
    elements: Elements;
    children: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<Elements | null>>;
export {};
//# sourceMappingURL=client.d.ts.map