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
// This has to be the string "expo-router/_ctx" as we resolve the exact string to
// a different file in a custom resolver for bundle splitting in Node.js.
const _ctx_1 = require("expo-router/_ctx");
const react_1 = __importDefault(require("react"));
// import { ExpoRoot } from './ExpoRoot';
const head_1 = require("./head");
const client_1 = require("./rsc/client");
// Must be exported or Fast Refresh won't update the context
function App() {
    console.log('ctx', _ctx_1.ctx.keys());
    // {/* <ExpoRoot context={ctx} /> */}
    return (<head_1.Head.Provider>
      <client_1.Root initialSearchParamsString={`platform=${'web'}&manifest=${encodeURIComponent(
        // Injected by the serializer in development
        JSON.stringify(global.$$expo_rsc_manifest))}`}>
        <client_1.Slot id="App"/>
      </client_1.Root>
    </head_1.Head.Provider>);
}
exports.App = App;
//# sourceMappingURL=qualified-entry.js.map