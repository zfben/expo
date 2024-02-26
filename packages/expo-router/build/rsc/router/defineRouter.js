"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineRouter = void 0;
const react_1 = require("react");
const common_js_1 = require("./common.js");
const client_js_1 = require("../client.js");
const path_js_1 = require("../path.js");
const os_1 = __importDefault(require("expo-router/os"));
const ShoudSkipComponent = ({ shouldSkip }) => {
    // TODO: Modify the React Native renderer to support Document Metadata and other head elements
    if (os_1.default === 'web') {
        return (0, react_1.createElement)('meta', {
            name: 'waku-should-skip',
            content: JSON.stringify(shouldSkip),
        });
    }
    return null;
};
function defineRouter(getPathConfig, getComponent) {
    const pathConfigPromise = getPathConfig().then((pathConfig) => Array.from(pathConfig).map((item) => {
        const is404 = item.path.length === 1 && item.path[0].type === 'literal' && item.path[0].name === '404';
        return { ...item, is404 };
    }));
    const has404Promise = pathConfigPromise.then((pathConfig) => pathConfig.some(({ is404 }) => is404));
    const existsPath = async (pathname) => {
        const pathConfig = await pathConfigPromise;
        return pathConfig.some(({ path: pathSpec }) => (0, path_js_1.getPathMapping)(pathSpec, pathname));
    };
    const shouldSkip = {};
    const renderEntries = async (input, searchParams) => {
        const pathname = (0, common_js_1.parseInputString)(input);
        if (!existsPath(pathname)) {
            return null;
        }
        const skip = searchParams.getAll(common_js_1.PARAM_KEY_SKIP) || [];
        const componentIds = (0, common_js_1.getComponentIds)(pathname);
        const props = { path: pathname, searchParams };
        const entries = (await Promise.all(componentIds.map(async (id) => {
            if (skip?.includes(id)) {
                return [];
            }
            const mod = await getComponent(id, (val) => {
                if (val) {
                    shouldSkip[id] = val;
                }
                else {
                    delete shouldSkip[id];
                }
            });
            const component = mod && 'default' in mod ? mod.default : mod;
            if (!component) {
                return [];
            }
            const element = (0, react_1.createElement)(component, props, (0, react_1.createElement)(client_js_1.Children));
            return [[id, element]];
        }))).flat();
        entries.push([common_js_1.SHOULD_SKIP_ID, (0, react_1.createElement)(ShoudSkipComponent, { shouldSkip })]);
        return Object.fromEntries(entries);
    };
    const getBuildConfig = async (unstable_collectClientModules) => {
        const pathConfig = await pathConfigPromise;
        const path2moduleIds = {};
        for (const { path: pathSpec } of pathConfig) {
            if (pathSpec.some(({ type }) => type !== 'literal')) {
                continue;
            }
            const pathname = '/' + pathSpec.map(({ name }) => name).join('/');
            const input = (0, common_js_1.getInputString)(pathname);
            const moduleIds = await unstable_collectClientModules(input);
            path2moduleIds[pathname] = moduleIds;
        }
        const customCode = `
globalThis.__WAKU_ROUTER_PREFETCH__ = (path) => {
  const path2ids = ${JSON.stringify(path2moduleIds)};
  for (const id of path2ids[path] || []) {
    import(id);
  }
};`;
        const buildConfig = [];
        for (const { path: pathSpec, isStatic = false, is404 } of pathConfig) {
            const entries = [];
            if (pathSpec.every(({ type }) => type === 'literal')) {
                const pathname = '/' + pathSpec.map(({ name }) => name).join('/');
                const input = (0, common_js_1.getInputString)(pathname);
                entries.push({ input, isStatic });
            }
            buildConfig.push({
                pathname: pathSpec,
                isStatic,
                entries,
                customCode: customCode + (is404 ? 'globalThis.__WAKU_ROUTER_404__ = true;' : ''),
            });
        }
        return buildConfig;
    };
    const getSsrConfig = async (pathname) => {
        if (!(await existsPath(pathname))) {
            if (await has404Promise) {
                pathname = '/404';
            }
            else {
                return null;
            }
        }
        const componentIds = (0, common_js_1.getComponentIds)(pathname);
        const input = (0, common_js_1.getInputString)(pathname);
        const body = (0, react_1.createElement)(react_1.Fragment, null, (0, react_1.createElement)(client_js_1.Slot, { id: common_js_1.SHOULD_SKIP_ID }), componentIds.reduceRight((acc, id) => (0, react_1.createElement)(client_js_1.Slot, { id, fallback: acc }, acc), null));
        return { input, body };
    };
    return { renderEntries, getBuildConfig, getSsrConfig };
}
exports.defineRouter = defineRouter;
//# sourceMappingURL=defineRouter.js.map