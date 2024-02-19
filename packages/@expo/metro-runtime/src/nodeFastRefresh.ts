export function createNodeFastRefresh({ onReload }: { onReload }) {
  // This needs to run before the renderer initializes.

  const ReactRefreshRuntime = require('react-refresh/runtime');
  ReactRefreshRuntime.injectIntoGlobalHook(global);

  const Refresh = {
    performFullRefresh: onReload,

    createSignatureFunctionForTransform: ReactRefreshRuntime.createSignatureFunctionForTransform,

    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,

    getFamilyByType: ReactRefreshRuntime.getFamilyByType,

    register: ReactRefreshRuntime.register,

    performReactRefresh() {
      //   if (ReactRefreshRuntime.hasUnrecoverableErrors()) {
      onReload();
      //     return;
      //   }
      //   ReactRefreshRuntime.performReactRefresh();
    },
  };

  // The metro require polyfill can not have dependencies (applies for all polyfills).
  // Expose `Refresh` by assigning it to global to make it available in the polyfill.
  globalThis[(globalThis.__METRO_GLOBAL_PREFIX__ || '') + '__ReactRefresh'] = Refresh;
}
