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
// import getDevServer from '@expo/metro-runtime/build/getDevServer';
// import { ctx } from 'expo-router/_ctx';
const react_1 = __importDefault(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const exports_1 = require("./exports");
// MUST be the one from metro-runtime as it contains the URL query parameters for the bundle to configure Metro.
const client_1 = require("./rsc/router/client");
const Try_1 = require("./views/Try");
const react_native_1 = require("react-native");
const WindowLocationContext_1 = require("./rsc/router/WindowLocationContext");
// TODO: There's something wrong with this on native. It shouldn't be needed.
const fallback = (<react_native_1.Text style={{
        marginHorizontal: 8,
        marginTop: 56,
        padding: 12,
        fontSize: 16,
        borderColor: 'blue',
        borderWidth: 2,
    }}>
    [Root Suspense Boundary]
  </react_native_1.Text>);
// Must be exported or Fast Refresh won't update the context
function App() {
    return (<WindowLocationContext_1.LocationContext>
      <react_1.default.Suspense fallback={fallback}>
        <react_native_safe_area_context_1.SafeAreaProvider>
          <Try_1.Try catch={exports_1.ErrorBoundary}>
            <client_1.Router />
          </Try_1.Try>
        </react_native_safe_area_context_1.SafeAreaProvider>
      </react_1.default.Suspense>
    </WindowLocationContext_1.LocationContext>);
}
exports.App = App;
//# sourceMappingURL=qualified-entry.js.map