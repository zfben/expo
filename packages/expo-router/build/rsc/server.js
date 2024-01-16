"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = exports.defineEntries = void 0;
function defineEntries(renderEntries, getBuildConfig, getSsrConfig) {
    return { renderEntries, getBuildConfig, getSsrConfig };
}
exports.defineEntries = defineEntries;
function getEnv(key) {
    // HACK we may want to use a server-side context or something
    return globalThis.__WAKU_PRIVATE_ENV__[key];
}
exports.getEnv = getEnv;
//# sourceMappingURL=server.js.map