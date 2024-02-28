// 'use client';
// import {
//   createContext,
//   createElement,
//   useCallback,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
//   useTransition,
//   Fragment,
// } from 'react';
// import type {
//   ComponentProps,
//   FunctionComponent,
//   ReactNode,
//   AnchorHTMLAttributes,
//   ReactElement,
//   MouseEvent,
// } from 'react';
// import { getComponentIds, getInputString, PARAM_KEY_SKIP, SHOULD_SKIP_ID } from './common.js';
// import type { RouteProps, ShouldSkip } from './common.js';
// import { prefetchRSC, Root, Slot, useRefetch } from '../client.js';
// declare global {
//   interface ImportMeta {
//     readonly env: Record<string, string>;
//   }
// }
// const parseLocation = (): RouteProps => {
//   if ((globalThis as any).__WAKU_ROUTER_404__) {
//     return { path: '/404', searchParams: new URLSearchParams() };
//   }
//   const { pathname, search } = window.location;
//   const searchParams = new URLSearchParams(search);
//   if (searchParams.has(PARAM_KEY_SKIP)) {
//     console.warn(`The search param "${PARAM_KEY_SKIP}" is reserved`);
//   }
//   return { path: pathname, searchParams };
// };
// type ChangeLocation = (
//   path?: string,
//   searchParams?: URLSearchParams,
//   hash?: string,
//   method?: 'pushState' | 'replaceState' | false,
//   scrollTo?: ScrollToOptions | false
// ) => void;
// type PrefetchLocation = (path: string, searchParams: URLSearchParams) => void;
// const RouterContext = createContext<{
//   loc: ReturnType<typeof parseLocation>;
//   changeLocation: ChangeLocation;
//   prefetchLocation: PrefetchLocation;
// } | null>(null);
// export function useChangeLocation() {
//   const value = useContext(RouterContext);
//   if (!value) {
//     return () => {
//       throw new Error('Missing Router');
//     };
//   }
//   return value.changeLocation;
// }
// export function usePrefetchLocation() {
//   const value = useContext(RouterContext);
//   if (!value) {
//     return () => {
//       throw new Error('Missing Router');
//     };
//   }
//   return value.prefetchLocation;
// }
// export function useLocation() {
//   const value = useContext(RouterContext);
//   if (!value) {
//     throw new Error('Missing Router');
//   }
//   return value.loc;
// }
// export type LinkProps = {
//   to: string;
//   pending?: ReactNode;
//   notPending?: ReactNode;
//   children: ReactNode;
//   unstable_prefetchOnEnter?: boolean;
// } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;
// export function Link({
//   to,
//   children,
//   pending,
//   notPending,
//   unstable_prefetchOnEnter,
//   ...props
// }: LinkProps): ReactElement {
//   if (!to.startsWith('/')) {
//     throw new Error('Link must start with "/"');
//   }
//   const value = useContext(RouterContext);
//   const changeLocation = value
//     ? value.changeLocation
//     : () => {
//         throw new Error('Missing Router');
//       };
//   const prefetchLocation = value
//     ? value.prefetchLocation
//     : () => {
//         throw new Error('Missing Router');
//       };
//   const [isPending, startTransition] = useTransition();
//   const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
//     event.preventDefault();
//     const url = new URL(to, window.location.href);
//     if (url.href !== window.location.href) {
//       prefetchLocation(url.pathname, url.searchParams);
//       startTransition(() => {
//         changeLocation(url.pathname, url.searchParams, url.hash);
//       });
//     }
//     props.onClick?.(event);
//   };
//   const onMouseEnter = unstable_prefetchOnEnter
//     ? (event: MouseEvent<HTMLAnchorElement>) => {
//         const url = new URL(to, window.location.href);
//         if (url.href !== window.location.href) {
//           prefetchLocation(url.pathname, url.searchParams);
//         }
//         props.onMouseEnter?.(event);
//       }
//     : props.onMouseEnter;
//   const ele = createElement('a', { ...props, href: to, onClick, onMouseEnter }, children);
//   if (isPending && pending !== undefined) {
//     return createElement(Fragment, null, ele, pending);
//   }
//   if (!isPending && notPending !== undefined) {
//     return createElement(Fragment, null, ele, notPending);
//   }
//   return ele;
// }
// const getSkipList = (
//   componentIds: readonly string[],
//   props: RouteProps,
//   cached: Record<string, RouteProps>
// ): string[] => {
//   const ele: any = document.querySelector('meta[name="waku-should-skip"]');
//   if (!ele) {
//     return [];
//   }
//   const shouldSkip: ShouldSkip = JSON.parse(ele.content);
//   return componentIds.filter((id) => {
//     const prevProps = cached[id];
//     if (!prevProps) {
//       return false;
//     }
//     const shouldCheck = shouldSkip?.[id];
//     if (!shouldCheck) {
//       return false;
//     }
//     if (shouldCheck.path && props.path !== prevProps.path) {
//       return false;
//     }
//     if (
//       shouldCheck.keys?.some(
//         (key) => props.searchParams.get(key) !== prevProps.searchParams.get(key)
//       )
//     ) {
//       return false;
//     }
//     return true;
//   });
// };
// const equalRouteProps = (a: RouteProps, b: RouteProps) => {
//   if (a.path !== b.path) {
//     return false;
//   }
//   if (a.searchParams.size !== b.searchParams.size) {
//     return false;
//   }
//   if (
//     Array.from(a.searchParams.entries()).some(([key, value]) => value !== b.searchParams.get(key))
//   ) {
//     return false;
//   }
//   return true;
// };
// function InnerRouter(props) {
//   const refetch = useRefetch();
//   const [loc, setLoc] = useState(parseLocation);
//   const componentIds = getComponentIds(loc.path);
//   const [cached, setCached] = useState<Record<string, RouteProps>>(() => {
//     return Object.fromEntries(componentIds.map((id) => [id, loc]));
//   });
//   const cachedRef = useRef(cached);
//   useEffect(() => {
//     cachedRef.current = cached;
//   }, [cached]);
//   const changeLocation: ChangeLocation = useCallback(
//     (path, searchParams, hash, method = 'pushState', scrollTo = { top: 0, left: 0 }) => {
//       const url = new URL(window.location.href);
//       if (typeof path === 'string') {
//         url.pathname = path;
//       }
//       if (searchParams) {
//         url.search = '?' + searchParams.toString();
//       }
//       if (typeof hash === 'string') {
//         url.hash = hash;
//       }
//       if (method) {
//         window.history[method](window.history.state, '', url);
//       }
//       const loc = parseLocation();
//       setLoc(loc);
//       if (scrollTo) {
//         window.scrollTo(scrollTo);
//       }
//       const componentIds = getComponentIds(loc.path);
//       if (
//         !method &&
//         componentIds.every((id) => {
//           const cachedLoc = cachedRef.current[id];
//           return cachedLoc && equalRouteProps(cachedLoc, loc);
//         })
//       ) {
//         return; // everything is cached
//       }
//       const skip = getSkipList(componentIds, loc, cachedRef.current);
//       if (componentIds.every((id) => skip.includes(id))) {
//         return; // everything is skipped
//       }
//       const input = getInputString(loc.path);
//       refetch(
//         input,
//         new URLSearchParams([
//           ...Array.from(loc.searchParams.entries()),
//           ...skip.map((id) => [PARAM_KEY_SKIP, id]),
//         ])
//       );
//       setCached((prev) => ({
//         ...prev,
//         ...Object.fromEntries(componentIds.flatMap((id) => (skip.includes(id) ? [] : [[id, loc]]))),
//       }));
//     },
//     [refetch]
//   );
//   const prefetchLocation: PrefetchLocation = useCallback((path, searchParams) => {
//     const componentIds = getComponentIds(path);
//     const routeProps: RouteProps = { path, searchParams };
//     const skip = getSkipList(componentIds, routeProps, cachedRef.current);
//     if (componentIds.every((id) => skip.includes(id))) {
//       return; // everything is cached
//     }
//     const input = getInputString(path);
//     const searchParamsString = new URLSearchParams([
//       ...Array.from(searchParams.entries()),
//       ...skip.map((id) => [PARAM_KEY_SKIP, id]),
//     ]).toString();
//     prefetchRSC(input, searchParamsString);
//     (globalThis as any).__WAKU_ROUTER_PREFETCH__?.(path);
//   }, []);
//   useEffect(() => {
//     const callback = () => {
//       const loc = parseLocation();
//       changeLocation(loc.path, loc.searchParams, '', false, false);
//     };
//     window.addEventListener('popstate', callback);
//     return () => window.removeEventListener('popstate', callback);
//   }, [changeLocation]);
//   const children = componentIds.reduceRight(
//     (acc: ReactNode, id) => createElement(Slot, { id, fallback: acc }, acc),
//     null
//   );
//   return createElement(
//     Fragment,
//     null,
//     createElement(Slot, { id: SHOULD_SKIP_ID }),
//     createElement(
//       RouterContext.Provider,
//       { value: { loc, changeLocation, prefetchLocation } },
//       // props.children
//       children
//     )
//   );
// }
// export function Router({ children }: { children?: ReactElement }) {
//   const loc = parseLocation();
//   const initialInput = getInputString(loc.path);
//   const initialSearchParamsString = loc.searchParams.toString();
//   return createElement(
//     Root as FunctionComponent<Omit<ComponentProps<typeof Root>, 'children'>>,
//     { initialInput, initialSearchParamsString },
//     createElement(InnerRouter, { children })
//   );
// }
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.Link = exports.useLocation = exports.usePrefetchLocation = exports.useChangeLocation = void 0;
const react_1 = require("react");
const common_js_1 = require("./common.js");
const client_js_1 = require("../client.js");
const WindowLocationContext_js_1 = require("./WindowLocationContext.js");
const react_native_1 = require("react-native");
const parseLocation = (fragment = globalThis.expoVirtualLocation) => {
    if (globalThis.__WAKU_ROUTER_404__) {
        return { path: '/404', searchParams: new URLSearchParams() };
    }
    const { pathname, search } = fragment;
    //   const { pathname, search } = window.location;
    const searchParams = new URLSearchParams(search);
    if (searchParams.has(common_js_1.PARAM_KEY_SKIP)) {
        console.warn(`The search param "${common_js_1.PARAM_KEY_SKIP}" is reserved`);
    }
    return { path: pathname, searchParams };
};
const RouterContext = (0, react_1.createContext)(null);
function useChangeLocation() {
    const value = (0, react_1.useContext)(RouterContext);
    if (!value) {
        return () => {
            throw new Error('Missing Router');
        };
    }
    return value.changeLocation;
}
exports.useChangeLocation = useChangeLocation;
function usePrefetchLocation() {
    const value = (0, react_1.useContext)(RouterContext);
    if (!value) {
        return () => {
            throw new Error('Missing Router');
        };
    }
    return value.prefetchLocation;
}
exports.usePrefetchLocation = usePrefetchLocation;
function useLocation() {
    const value = (0, react_1.useContext)(RouterContext);
    if (!value) {
        throw new Error('Missing Router');
    }
    return value.loc;
}
exports.useLocation = useLocation;
function Link({ to, children, pending, notPending, unstable_prefetchOnEnter, ...props }) {
    if (!to.startsWith('/')) {
        throw new Error('Link must start with "/"');
    }
    const value = (0, react_1.useContext)(RouterContext);
    const changeLocation = value
        ? value.changeLocation
        : () => {
            throw new Error('Missing Router');
        };
    const prefetchLocation = value
        ? value.prefetchLocation
        : () => {
            throw new Error('Missing Router');
        };
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const onClick = (event) => {
        event.preventDefault();
        const url = new URL(to, globalThis.expoVirtualLocation.href);
        if (url.href !== globalThis.expoVirtualLocation.href) {
            prefetchLocation(url.pathname, url.searchParams);
            startTransition(() => {
                changeLocation(url.pathname, url.searchParams, url.hash);
            });
        }
        props.onClick?.(event);
    };
    const onMouseEnter = unstable_prefetchOnEnter
        ? (event) => {
            const url = new URL(to, globalThis.expoVirtualLocation.href);
            if (url.href !== globalThis.expoVirtualLocation.href) {
                prefetchLocation(url.pathname, url.searchParams);
            }
            props.onMouseEnter?.(event);
        }
        : props.onMouseEnter;
    const ele = (0, react_1.createElement)(react_native_1.Text, {
        ...props,
        onPress: onClick,
        // onMouseEnter
    }, children);
    if (isPending && pending !== undefined) {
        return (0, react_1.createElement)(react_1.Fragment, null, ele, pending);
    }
    if (!isPending && notPending !== undefined) {
        return (0, react_1.createElement)(react_1.Fragment, null, ele, notPending);
    }
    return ele;
}
exports.Link = Link;
const getSkipList = (componentIds, props, cached) => {
    return [];
    const ele = document.querySelector('meta[name="waku-should-skip"]');
    if (!ele) {
        return [];
    }
    const shouldSkip = JSON.parse(ele.content);
    return componentIds.filter((id) => {
        const prevProps = cached[id];
        if (!prevProps) {
            return false;
        }
        const shouldCheck = shouldSkip?.[id];
        if (!shouldCheck) {
            return false;
        }
        if (shouldCheck.path && props.path !== prevProps.path) {
            return false;
        }
        if (shouldCheck.keys?.some((key) => props.searchParams.get(key) !== prevProps.searchParams.get(key))) {
            return false;
        }
        return true;
    });
};
const equalRouteProps = (a, b) => {
    if (a.path !== b.path) {
        return false;
    }
    if (a.searchParams.size !== b.searchParams.size) {
        return false;
    }
    if (Array.from(a.searchParams.entries()).some(([key, value]) => value !== b.searchParams.get(key))) {
        return false;
    }
    return true;
};
function InnerRouter(props) {
    const refetch = (0, client_js_1.useRefetch)();
    const { setHistory } = (0, WindowLocationContext_js_1.useVirtualLocation)();
    const [loc, setLoc] = (0, react_1.useState)(parseLocation);
    const componentIds = (0, common_js_1.getComponentIds)(loc.path);
    const [cached, setCached] = (0, react_1.useState)(() => {
        return Object.fromEntries(componentIds.map((id) => [id, loc]));
    });
    const cachedRef = (0, react_1.useRef)(cached);
    (0, react_1.useEffect)(() => {
        cachedRef.current = cached;
    }, [cached]);
    const changeLocation = (0, react_1.useCallback)((path, searchParams, hash, method = 'pushState', scrollTo = { top: 0, left: 0 }) => {
        const url = new URL(globalThis.expoVirtualLocation);
        if (typeof path === 'string') {
            url.pathname = path;
        }
        if (searchParams) {
            url.search = '?' + searchParams.toString();
        }
        if (typeof hash === 'string') {
            url.hash = hash;
        }
        if (method) {
            // window.history[method](window.history.state, '', url);
            setHistory(method, url);
        }
        const loc = parseLocation();
        setLoc(loc);
        if (scrollTo) {
            console.warn('scrollTo is not implemented on native yet');
            // window.scrollTo(scrollTo);
        }
        const componentIds = (0, common_js_1.getComponentIds)(loc.path);
        if (!method &&
            componentIds.every((id) => {
                const cachedLoc = cachedRef.current[id];
                return cachedLoc && equalRouteProps(cachedLoc, loc);
            })) {
            return; // everything is cached
        }
        const skip = getSkipList(componentIds, loc, cachedRef.current);
        if (componentIds.every((id) => skip.includes(id))) {
            return; // everything is skipped
        }
        const input = (0, common_js_1.getInputString)(loc.path);
        refetch(input, new URLSearchParams([
            ...Array.from(loc.searchParams.entries()),
            ...skip.map((id) => [common_js_1.PARAM_KEY_SKIP, id]),
        ]));
        setCached((prev) => ({
            ...prev,
            ...Object.fromEntries(componentIds.flatMap((id) => (skip.includes(id) ? [] : [[id, loc]]))),
        }));
    }, [refetch]);
    const prefetchLocation = (0, react_1.useCallback)((path, searchParams) => {
        const componentIds = (0, common_js_1.getComponentIds)(path);
        const routeProps = { path, searchParams };
        const skip = getSkipList(componentIds, routeProps, cachedRef.current);
        if (componentIds.every((id) => skip.includes(id))) {
            return; // everything is cached
        }
        const input = (0, common_js_1.getInputString)(path);
        const searchParamsString = new URLSearchParams([
            ...Array.from(searchParams.entries()),
            ...skip.map((id) => [common_js_1.PARAM_KEY_SKIP, id]),
        ]).toString();
        (0, client_js_1.prefetchRSC)(input, searchParamsString);
        globalThis.__WAKU_ROUTER_PREFETCH__?.(path);
    }, []);
    // useEffect(() => {
    //   const callback = () => {
    //     const loc = parseLocation();
    //     changeLocation(loc.path, loc.searchParams, '', false, false);
    //   };
    //   window.addEventListener('popstate', callback);
    //   return () => window.removeEventListener('popstate', callback);
    // }, [changeLocation]);
    const children = componentIds.reduceRight((acc, id) => (0, react_1.createElement)(client_js_1.Slot, { id, fallback: acc }, acc), null);
    return (0, react_1.createElement)(react_1.Fragment, null, (0, react_1.createElement)(client_js_1.Slot, { id: common_js_1.SHOULD_SKIP_ID }), (0, react_1.createElement)(RouterContext.Provider, { value: { loc, changeLocation, prefetchLocation } }, 
    // props.children
    children));
}
function Router({ children }) {
    return (0, react_1.createElement)(WindowLocationContext_js_1.LocationContext, {
        children: (0, react_1.createElement)(ContextualRouter, { children }),
    });
}
exports.Router = Router;
function ContextualRouter({ children }) {
    // const virtualLocation = useVirtualLocation();
    // console.log('[virtual]>', );
    const loc = parseLocation();
    const initialInput = (0, common_js_1.getInputString)(loc.path);
    const initialSearchParamsString = loc.searchParams.toString();
    return (0, react_1.createElement)(client_js_1.Root, { initialInput, initialSearchParamsString }, (0, react_1.createElement)(InnerRouter, { children }));
}
//# sourceMappingURL=client.js.map