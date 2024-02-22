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
const getDevServer_1 = __importDefault(require("@expo/metro-runtime/build/getDevServer"));
const react_1 = __importDefault(require("react"));
// import { ExpoRoot } from './ExpoRoot';
const head_1 = require("./head");
// MUST be the one from metro-runtime as it contains the URL query parameters for the bundle to configure Metro.
const Try_1 = require("./views/Try");
const exports_1 = require("./exports");
const client_1 = require("./rsc/router/client");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const rsc_navigator_1 = __importDefault(require("./rsc-navigator"));
const introUrl = (0, getDevServer_1.default)().fullBundleUrl;
// TODO: This is buggy and doesn't work well, maybe inject the query params in babel.
const searchParams = introUrl ? new URL(introUrl).searchParams.toString() : '';
// console.log('searchParams', searchParams);
// Must be exported or Fast Refresh won't update the context
function App() {
    // console.log('ctx', ctx.keys());
    // {/* <ExpoRoot context={ctx} /> */}
    // return (
    //   <View style={{ flex: 1 }}>
    //     <Text>Hey</Text>
    //   </View>
    // );
    // console.log('Mount')
    // return (
    //   <Text>HeyHeyHeyHeyHeyHey</Text>
    // )
    return (<react_1.default.Suspense fallback={null}>
      <head_1.Head.Provider>
        <react_native_safe_area_context_1.SafeAreaProvider>
          <rsc_navigator_1.default>
            <Try_1.Try catch={exports_1.ErrorBoundary}>
              <client_1.Router />
              {/* <Root initialSearchParamsString={searchParams}> */}
              {/* <Slot id={input} /> */}
              {/* </Root> */}
            </Try_1.Try>
          </rsc_navigator_1.default>
        </react_native_safe_area_context_1.SafeAreaProvider>
      </head_1.Head.Provider>
    </react_1.default.Suspense>);
}
exports.App = App;
//# sourceMappingURL=qualified-entry.js.map