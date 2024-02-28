"use strict";
// Emulates the window.location object on native.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVirtualLocation = exports.LocationContext = void 0;
// getInitialURL = () =>
// ,
// subscribe = (listener) => {
// const callback = ({ url }: { url: string }) => listener(url);
// const subscription = Linking.addEventListener('url', callback) as
//   | { remove(): void }
//   | undefined;
// return () => {
//   subscription?.remove();
// };
// },
const React = __importStar(require("react"));
const linking_1 = require("../../link/linking");
const extractPathFromURL_1 = require("../../fork/extractPathFromURL");
function useInitialLocation() {
    const [initialUrl, setInitial] = React.useState(null);
    React.useEffect(() => {
        (async () => {
            const v = await (0, linking_1.getInitialURL)();
            setInitial(v);
        })();
        return (0, linking_1.addEventListener)((url) => {
            setInitial(url);
        });
    }, []);
    return initialUrl;
}
// window.history.pushState
const Location = React.createContext({ urlFragment: null, setHistory: () => { } });
function coerceUrl(url) {
    if (typeof url === 'object' && 'pathname' in url) {
        return url;
    }
    try {
        return new URL(url);
    }
    catch (e) {
        return new URL(url, 'http://localhost:8081');
    }
}
function LocationContext({ children }) {
    const [loaded, setLoaded] = React.useState(null);
    // const [initialUrl, setInitial] = React.useState<URL | null>(null);
    const setUrl = (url) => {
        console.log('Set URL:', url);
        const v = coerceUrl(url);
        globalThis.expoVirtualLocation = v;
        // setInitial(v);
    };
    React.useEffect(() => {
        (async () => {
            const v = await (0, linking_1.getInitialURL)();
            setUrl((0, extractPathFromURL_1.extractExpoPathFromURL)(v));
            setLoaded(true);
        })();
        return (0, linking_1.addEventListener)((url) => {
            setUrl((0, extractPathFromURL_1.extractExpoPathFromURL)(url));
        });
    }, []);
    if (!loaded) {
        return null;
    }
    return (<Location.Provider value={{
            // urlFragment: initialUrl,
            setHistory(method, url) {
                if (method === 'pushState') {
                    setUrl(url);
                }
                else {
                    console.warn('Only pushState is supported atm');
                }
            },
        }}>
      {children}
    </Location.Provider>);
}
exports.LocationContext = LocationContext;
function useVirtualLocation() {
    return React.useContext(Location);
}
exports.useVirtualLocation = useVirtualLocation;
//# sourceMappingURL=WindowLocationContext.js.map