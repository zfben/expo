"use strict";
// The entry component (one that uses context modules) cannot be in the same file as the
// entry side-effects, otherwise they'll be updated when files are added/removed from the
// app directory. This will cause a lot of unfortunate errors regarding HMR and Fast Refresh.
// This is because Fast Refresh is sending the entire file containing an updated component.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importDefault(require("react"));
// import { ExpoRoot } from './ExpoRoot';
const head_1 = require("./head");
const client_1 = require("./rsc/client");
// MUST be the one from metro-runtime as it contains the URL query parameters for the bundle to configure Metro.
const getDevServer_1 = __importDefault(require("@expo/metro-runtime/build/getDevServer"));
const introUrl = (0, getDevServer_1.default)().fullBundleUrl;
// TODO: This is buggy and doesn't work well, maybe inject the query params in babel.
const searchParams = introUrl ? new URL(introUrl).searchParams.toString() : '';
// console.log('searchParams', searchParams);
// Must be exported or Fast Refresh won't update the context
function App() {
    // console.log('ctx', ctx.keys());
    // {/* <ExpoRoot context={ctx} /> */}
    return (<head_1.Head.Provider>
      <client_1.Root initialSearchParamsString={searchParams}>
        <client_1.Slot id="index"/>
      </client_1.Root>
    </head_1.Head.Provider>);
}
exports.App = App;
//# sourceMappingURL=qualified-entry.js.map