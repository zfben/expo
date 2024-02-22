'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const NavigationContainer_1 = __importDefault(require("./fork/NavigationContainer"));
const router_store_1 = require("./global-state/router-store");
const _ctx_1 = require("expo-router/_ctx");
function ContextNavigator({ context = _ctx_1.ctx, location: initialLocation, 
//   wrapper: WrapperComponent = Fragment,
children, }) {
    const store = (0, router_store_1.useInitializeExpoRouter)(context, initialLocation);
    // if (store.shouldShowTutorial()) {
    //   SplashScreen.hideAsync();
    //   if (process.env.NODE_ENV === 'development') {
    //     const Tutorial = require('./onboard/Tutorial').Tutorial;
    //     return (
    //       <WrapperComponent>
    //         <Tutorial />
    //       </WrapperComponent>
    //     );
    //   } else {
    //     // Ensure tutorial styles are stripped in production.
    //     return null;
    //   }
    // }
    // const Component = store.rootComponent;
    return (<NavigationContainer_1.default ref={store.navigationRef} initialState={store.initialState} linking={store.linking} 
    // onUnhandledAction={onUnhandledAction}
    documentTitle={{
            enabled: false,
        }}>
      {children}
    </NavigationContainer_1.default>);
}
exports.default = ContextNavigator;
//# sourceMappingURL=rsc-navigator.js.map