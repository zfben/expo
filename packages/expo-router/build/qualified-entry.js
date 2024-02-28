"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importDefault(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const exports_1 = require("./exports");
const client_1 = require("./rsc/router/client");
const Try_1 = require("./views/Try");
const WindowLocationContext_1 = require("./rsc/router/WindowLocationContext");
// Must be exported or Fast Refresh won't update the context
function App() {
    return (<WindowLocationContext_1.LocationContext>
      <react_native_safe_area_context_1.SafeAreaProvider>
        <Try_1.Try catch={exports_1.ErrorBoundary}>
          <client_1.Router />
        </Try_1.Try>
      </react_native_safe_area_context_1.SafeAreaProvider>
    </WindowLocationContext_1.LocationContext>);
}
exports.App = App;
//# sourceMappingURL=qualified-entry.js.map