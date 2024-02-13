'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.Link = exports.useLocation = exports.useChangeLocation = void 0;
const react_1 = require("react");
const common_1 = require("./common");
const client_1 = require("../client");
const parseLocation = () => {
    const { pathname, search } = window.location;
    const searchParams = new URLSearchParams(search);
    if (searchParams.has(common_1.PARAM_KEY_SKIP)) {
        console.warn(`The search param "${common_1.PARAM_KEY_SKIP}" is reserved`);
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
        const url = new URL(to, window.location.href);
        if (url.href !== window.location.href) {
            prefetchLocation(url.pathname, url.searchParams);
            startTransition(() => {
                changeLocation(url.pathname, url.searchParams);
            });
        }
        props.onClick?.(event);
    };
    const onMouseEnter = unstable_prefetchOnEnter
        ? (event) => {
            const url = new URL(to, window.location.href);
            if (url.href !== window.location.href) {
                prefetchLocation(url.pathname, url.searchParams);
            }
            props.onMouseEnter?.(event);
        }
        : props.onMouseEnter;
    const ele = (0, react_1.createElement)('a', { ...props, href: to, onClick, onMouseEnter }, children);
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
function InnerRouter() {
    const refetch = (0, client_1.useRefetch)();
    const [loc, setLoc] = (0, react_1.useState)(parseLocation);
    const componentIds = (0, common_1.getComponentIds)(loc.path);
    const [cached, setCached] = (0, react_1.useState)(() => {
        return Object.fromEntries(componentIds.map((id) => [id, loc]));
    });
    const cachedRef = (0, react_1.useRef)(cached);
    (0, react_1.useEffect)(() => {
        cachedRef.current = cached;
    }, [cached]);
    const changeLocation = (0, react_1.useCallback)((path, searchParams, mode = 'push') => {
        const url = new URL(window.location.href);
        if (path) {
            url.pathname = path;
        }
        if (searchParams) {
            url.search = '?' + searchParams.toString();
        }
        if (mode === 'replace') {
            window.history.replaceState(window.history.state, '', url);
        }
        else if (mode === 'push') {
            window.history.pushState(window.history.state, '', url);
        }
        const loc = parseLocation();
        setLoc(loc);
        const componentIds = (0, common_1.getComponentIds)(loc.path);
        const skip = getSkipList(componentIds, loc, cachedRef.current);
        if (componentIds.every((id) => skip.includes(id))) {
            return; // everything is cached
        }
        const input = (0, common_1.getInputString)(loc.path);
        refetch(input, new URLSearchParams([
            ...Array.from(loc.searchParams.entries()),
            ...skip.map((id) => [common_1.PARAM_KEY_SKIP, id]),
        ]));
        setCached((prev) => ({
            ...prev,
            ...Object.fromEntries(componentIds.flatMap((id) => (skip.includes(id) ? [] : [[id, loc]]))),
        }));
    }, [refetch]);
    const prefetchLocation = (0, react_1.useCallback)((path, searchParams) => {
        const componentIds = (0, common_1.getComponentIds)(path);
        const routeProps = { path, searchParams };
        const skip = getSkipList(componentIds, routeProps, cachedRef.current);
        if (componentIds.every((id) => skip.includes(id))) {
            return; // everything is cached
        }
        const input = (0, common_1.getInputString)(path);
        const searchParamsString = new URLSearchParams([
            ...Array.from(searchParams.entries()),
            ...skip.map((id) => [common_1.PARAM_KEY_SKIP, id]),
        ]).toString();
        (0, client_1.prefetchRSC)(input, searchParamsString);
        globalThis.__WAKU_ROUTER_PREFETCH__?.(path);
    }, []);
    (0, react_1.useEffect)(() => {
        const callback = () => {
            const loc = parseLocation();
            prefetchLocation(loc.path, loc.searchParams);
            changeLocation(loc.path, loc.searchParams, false);
        };
        window.addEventListener('popstate', callback);
        return () => window.removeEventListener('popstate', callback);
    }, [changeLocation, prefetchLocation]);
    const children = componentIds.reduceRight((acc, id) => (0, react_1.createElement)(client_1.Slot, { id, fallback: acc }, acc), null);
    return (0, react_1.createElement)(react_1.Fragment, null, (0, react_1.createElement)(client_1.Slot, { id: common_1.SHOULD_SKIP_ID }), (0, react_1.createElement)(RouterContext.Provider, { value: { loc, changeLocation, prefetchLocation } }, children));
}
function Router() {
    const loc = parseLocation();
    const initialInput = (0, common_1.getInputString)(loc.path);
    const initialSearchParamsString = loc.searchParams.toString();
    return (0, react_1.createElement)(client_1.Root, { initialInput, initialSearchParamsString }, (0, react_1.createElement)(InnerRouter));
}
exports.Router = Router;
//# sourceMappingURL=client.js.map