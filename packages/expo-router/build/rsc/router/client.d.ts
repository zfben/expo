import type { ReactNode, AnchorHTMLAttributes, ReactElement } from 'react';
import type { RouteProps } from './common';
type ChangeLocation = (path?: string, searchParams?: URLSearchParams, mode?: 'push' | 'replace' | false) => void;
export declare function useChangeLocation(): ChangeLocation;
export declare function useLocation(): RouteProps;
export type LinkProps = {
    to: string;
    pending?: ReactNode;
    notPending?: ReactNode;
    children: ReactNode;
    unstable_prefetchOnEnter?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;
export declare function Link({ to, children, pending, notPending, unstable_prefetchOnEnter, ...props }: LinkProps): ReactElement;
export declare function Router(): import("react").FunctionComponentElement<Omit<{
    initialInput?: string | undefined;
    initialSearchParamsString?: string | undefined;
    children: ReactNode;
}, "children">>;
export {};
//# sourceMappingURL=client.d.ts.map