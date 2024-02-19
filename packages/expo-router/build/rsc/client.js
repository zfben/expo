// From Waku -- https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/client.ts#L1
/// <reference types="react/canary" />
'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRoot = exports.Children = exports.Slot = exports.useRefetch = exports.Root = exports.prefetchRSC = exports.fetchRSC = void 0;
const react_1 = require("react");
const client_1 = __importDefault(require("react-server-dom-webpack/client"));
const utils_1 = require("./renderers/utils");
const getDevServer_1 = require("../getDevServer");
const os_1 = __importDefault(require("../../os"));
const { createFromFetch, encodeReply } = client_1.default;
// NOTE: Ensured to start with `/`.
const RSC_PATH = process.env.EXPO_RSC_PATH;
let BASE_PATH = `${process.env.EXPO_BASE_URL}${RSC_PATH}`;
if (!BASE_PATH.startsWith('/')) {
    BASE_PATH = '/' + BASE_PATH;
}
if (!BASE_PATH.endsWith('/')) {
    BASE_PATH += '/';
}
if (BASE_PATH === '/') {
    if (typeof process.env.EXPO_RSC_PATH !== 'string') {
        throw new Error('process.env.EXPO_RSC_PATH was not defined. This is likely a misconfigured babel.config.js. Ensure babel-preset-expo is used.');
    }
    throw new Error(`Invalid RSC path "${BASE_PATH}". The path should not live at the project root, e.g. /RSC/. Dev server URL: ${(0, getDevServer_1.getDevServer)().fullBundleUrl}`);
}
console.log('[RSC]: Base path:', BASE_PATH, { BASE_URL: process.env.EXPO_BASE_URL, RSC_PATH });
const checkStatus = async (responsePromise) => {
    const response = await responsePromise;
    if (!response.ok) {
        const err = new Error(response.statusText);
        err.statusCode = response.status;
        throw err;
    }
    console.log('[RSC]: Fetched', response.url, response.status);
    return response;
};
function getCached(c, m, k) {
    return (m.has(k) ? m : m.set(k, c())).get(k);
}
const cache1 = new WeakMap();
const mergeElements = (a, b) => {
    const getResult = async () => {
        const nextElements = { ...(await a), ...(await b) };
        delete nextElements._value;
        return nextElements;
    };
    const cache2 = getCached(() => new WeakMap(), cache1, a);
    return getCached(getResult, cache2, b);
};
const fetchCache = [];
const fetchRSC = (input, searchParamsString, setElements, cache = fetchCache) => {
    let entry = cache[0];
    if (entry && entry[0] === input && entry[1] === searchParamsString) {
        entry[2] = setElements;
        return entry[3];
    }
    const options = {
        async callServer(actionId, args) {
            const response = fetch(BASE_PATH + (0, utils_1.encodeInput)(encodeURIComponent(actionId)), {
                method: 'POST',
                body: await encodeReply(args),
            });
            const data = createFromFetch(checkStatus(response), options);
            const setElements = entry[2];
            (0, react_1.startTransition)(() => {
                // FIXME this causes rerenders even if data is empty
                setElements((prev) => mergeElements(prev, data));
            });
            return (await data)._value;
        },
    };
    const prefetched = (globalThis.__WAKU_PREFETCHED__ ||= {});
    const url = BASE_PATH + (0, utils_1.encodeInput)(input) + (searchParamsString ? '?' + searchParamsString : '');
    console.log('fetch', url);
    const response = prefetched[url] || fetch(getAdjustedFilePath(url));
    delete prefetched[url];
    const data = createFromFetch(checkStatus(response), options);
    cache[0] = entry = [input, searchParamsString, setElements, data];
    return data;
};
exports.fetchRSC = fetchRSC;
const FS = __importStar(require("expo-file-system"));
function getAdjustedFilePath(path) {
    if (os_1.default === 'web' || (0, getDevServer_1.getDevServer)().bundleLoadedFromServer) {
        return path;
    }
    if (os_1.default === 'android') {
        return 'file:///android_asset' + path;
    }
    console.log('FS.bundleDirectory', FS.bundleDirectory);
    return 'file://' + FS.bundleDirectory + path;
}
const prefetchRSC = (input, searchParamsString) => {
    const prefetched = (globalThis.__WAKU_PREFETCHED__ ||= {});
    const url = BASE_PATH + (0, utils_1.encodeInput)(input) + (searchParamsString ? '?' + searchParamsString : '');
    if (!(url in prefetched)) {
        prefetched[url] = fetch(url);
    }
};
exports.prefetchRSC = prefetchRSC;
const RefetchContext = (0, react_1.createContext)(() => {
    throw new Error('Missing Root component');
});
const ElementsContext = (0, react_1.createContext)(null);
const Root = ({ initialInput, initialSearchParamsString, cache, children, }) => {
    const [elements, setElements] = (0, react_1.useState)(() => (0, exports.fetchRSC)(initialInput || '', initialSearchParamsString || '', (fn) => setElements(fn), cache));
    const refetch = (0, react_1.useCallback)((input, searchParams) => {
        const data = (0, exports.fetchRSC)(input, searchParams?.toString() || '', setElements, cache);
        setElements((prev) => mergeElements(prev, data));
    }, [cache]);
    return (0, react_1.createElement)(RefetchContext.Provider, { value: refetch }, (0, react_1.createElement)(ElementsContext.Provider, { value: elements }, children));
};
exports.Root = Root;
const useRefetch = () => (0, react_1.use)(RefetchContext);
exports.useRefetch = useRefetch;
const ChildrenContext = (0, react_1.createContext)(undefined);
const ChildrenContextProvider = (0, react_1.memo)(ChildrenContext.Provider);
const Slot = ({ id, children, fallback, }) => {
    const elementsPromise = (0, react_1.use)(ElementsContext);
    if (!elementsPromise) {
        throw new Error('Missing Root component');
    }
    const elements = (0, react_1.use)(elementsPromise);
    if (!(id in elements)) {
        if (fallback) {
            return fallback;
        }
        throw new Error('Not found: ' + id);
    }
    return (0, react_1.createElement)(ChildrenContextProvider, { value: children }, elements[id]);
};
exports.Slot = Slot;
const Children = () => (0, react_1.use)(ChildrenContext);
exports.Children = Children;
const ServerRoot = ({ elements, children }) => (0, react_1.createElement)(ElementsContext.Provider, { value: elements }, children);
exports.ServerRoot = ServerRoot;
//# sourceMappingURL=client.js.map