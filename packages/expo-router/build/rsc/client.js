// From Waku -- https://github.com/dai-shi/waku/blob/main/packages/waku/src/client.ts
/// <reference types="react/canary" />
'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRoot = exports.Children = exports.Slot = exports.useRefetch = exports.Root = exports.prefetchRSC = exports.fetchRSC = void 0;
const react_1 = require("react");
const client_1 = __importDefault(require("react-server-dom-webpack/client"));
const utils_1 = require("./renderers/utils");
const { createFromFetch, encodeReply } = client_1.default;
// TODO: Add this env var
const RSC_PATH = process.env.EXPO_RSC_PATH || '/rsc';
const BASE_PATH = `${process.env.EXPO_BASE_URL}${RSC_PATH}/`;
const checkStatus = async (responsePromise) => {
    const response = await responsePromise;
    if (!response.ok) {
        const err = new Error(response.statusText);
        err.statusCode = response.status;
        throw err;
    }
    return response;
};
const mergeElements = (0, react_1.cache)(async (a, b) => {
    const nextElements = { ...(await a), ...(await b) };
    delete nextElements._value;
    return nextElements;
});
exports.fetchRSC = (0, react_1.cache)((input, searchParamsString, rerender) => {
    const options = {
        async callServer(actionId, args) {
            console.log('call server action', actionId, args);
            const searchParams = new URLSearchParams(searchParamsString);
            const response = fetch(BASE_PATH + (0, utils_1.encodeInput)(encodeURIComponent(actionId)) + '?' + searchParams.toString(), {
                method: 'POST',
                body: await encodeReply(args),
                // reactNative: { textStreaming: true },
            });
            const data = createFromFetch(checkStatus(response), options);
            (0, react_1.startTransition)(() => {
                console.log('update renderer:', data);
                // FIXME this causes rerenders even if data is empty
                rerender((prev) => mergeElements(prev, data));
            });
            return (await data)._value;
        },
    };
    const prefetched = (globalThis.__WAKU_PREFETCHED__ ||= {});
    const url = BASE_PATH + (0, utils_1.encodeInput)(input) + (searchParamsString ? '?' + searchParamsString : '');
    console.log('fetchRSC', url);
    const response = prefetched[url] ||
        fetch(url, {
        // reactNative: { textStreaming: true }
        });
    delete prefetched[url];
    const data = createFromFetch(checkStatus(response), options);
    return data;
});
exports.prefetchRSC = (0, react_1.cache)((input, searchParamsString) => {
    const prefetched = (globalThis.__WAKU_PREFETCHED__ ||= {});
    const url = BASE_PATH + (0, utils_1.encodeInput)(input) + (searchParamsString ? '?' + searchParamsString : '');
    if (!(url in prefetched)) {
        console.log('prefetchRSC', url);
        prefetched[url] = fetch(url, {
        // reactNative: { textStreaming: true }
        });
    }
});
const RefetchContext = (0, react_1.createContext)(() => {
    throw new Error('Missing Root component');
});
const ElementsContext = (0, react_1.createContext)(null);
// HACK there should be a better way...
const createRerender = (0, react_1.cache)(() => {
    let rerender;
    const stableRerender = (fn) => {
        rerender?.(fn);
    };
    const getRerender = () => stableRerender;
    const setRerender = (newRerender) => {
        rerender = newRerender;
    };
    return [getRerender, setRerender];
});
// export function ServerComponentHost(props) {
//   return useServerComponent(props).readRoot();
// }
const Root = ({ initialInput, initialSearchParamsString, children, }) => {
    const [getRerender, setRerender] = createRerender();
    const [elements, setElements] = (0, react_1.useState)(() => (0, exports.fetchRSC)(initialInput || '', initialSearchParamsString || '', getRerender()));
    setRerender(setElements);
    const refetch = (0, react_1.useCallback)((input, searchParams) => {
        const data = (0, exports.fetchRSC)(input, searchParams?.toString() || '', getRerender());
        setElements((prev) => mergeElements(prev, data));
    }, [getRerender]);
    console.log('Render with elements,', elements);
    return (0, react_1.createElement)(RefetchContext.Provider, { value: refetch }, (0, react_1.createElement)(ElementsContext.Provider, { value: elements }, children));
};
exports.Root = Root;
const useRefetch = () => (0, react_1.use)(RefetchContext);
exports.useRefetch = useRefetch;
const ChildrenContext = (0, react_1.createContext)(undefined);
const ChildrenContextProvider = (0, react_1.memo)(ChildrenContext.Provider);
const Slot = ({ id, children, fallback, }) => {
    // const elementsPromise = ElementsContext;
    const elementsPromise = (0, react_1.use)(ElementsContext);
    if (!elementsPromise) {
        throw new Error('Missing Root component');
    }
    // const elements = elementsPromise;
    const elements = (0, react_1.use)(elementsPromise);
    if (!(id in elements)) {
        if (fallback) {
            return fallback;
        }
        console.log('Expected one of:', elements);
        // throw new Error('Not found: ' + id);
    }
    // TODO: Fix this to support multiple children
    return (0, react_1.createElement)(ChildrenContextProvider, { value: children }, elements);
    // return createElement(ChildrenContextProvider, { value: children }, elements[id]);
};
exports.Slot = Slot;
const Children = () => (0, react_1.use)(ChildrenContext);
exports.Children = Children;
const ServerRoot = ({ elements, children }) => (0, react_1.createElement)(ElementsContext.Provider, { value: elements }, children);
exports.ServerRoot = ServerRoot;
//# sourceMappingURL=client.js.map