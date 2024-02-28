"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { fileURLToPath } from 'node:url';
// import path from 'node:path';
// import { existsSync } from 'node:fs';
// import fsPromises from 'node:fs/promises';
const _ctx_1 = require("expo-router/_ctx");
const react_1 = require("react");
const defineRouter_1 = require("./defineRouter");
const getRoutes_1 = require("../../getRoutes");
// const routesDir = path.join(
//   path.dirname(fileURLToPath(import.meta.url)),
//   'routes',
// );
const getMappingAndItems = async (id) => {
    const mapping = {};
    const items = id.split('/');
    for (let i = 0; i < items.length - 1; ++i) {
        // const dir = path.join(routesDir, ...items.slice(0, i));
        // if (!existsSync(dir)) {
        //   return null;
        // }
        // TODO: Check logic
        const files = _ctx_1.ctx.keys();
        if (!files.includes(items[i])) {
            const slug = files.find((file) => file.match(/^(\[\w+\]|_\w+_)$/));
            if (slug) {
                mapping[slug.slice(1, -1)] = items[i];
                items[i] = slug;
            }
        }
    }
    return { mapping, items };
};
const getPathConfig = async () => {
    const files = _ctx_1.ctx.keys().map((file) => file.replace(/^\.\//, ''));
    return files.map((file) => {
        const names = file.split('/').filter(Boolean).slice(0, -1);
        const pathSpec = names.map((name) => {
            const match = name.match(/^(\[\w+\]|_\w+_)$/);
            if (match) {
                return { type: 'group', name: match[1].slice(1, -1) };
            }
            return { type: 'literal', name };
        });
        return {
            path: pathSpec,
            isStatic: pathSpec.every(({ type }) => type === 'literal'),
        };
    });
};
const routes = (0, getRoutes_1.getRoutes)(_ctx_1.ctx, {
    importMode: 'lazy',
});
function wakuRouteIdToExpoRoute(route, routeId) {
    // Route like `layout` or `page` to match `_layout` or `index`
    // Route like `second/layout` or `second/page` to match `second/_layout` or `second`
    const parts = routeId.split('/');
    let currentRoute = route;
    console.log('0.', parts);
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log('1.', part);
        if (i === parts.length - 1) {
            console.log('Last =>', part, currentRoute);
            if (part === 'layout' && currentRoute?.type === 'layout') {
                return currentRoute;
                // return route;
            }
            if (part === 'page') {
                console.log('2.', part);
                if (currentRoute?.type === 'layout') {
                    console.log('3.', part);
                    // TODO: Obviously not right, doesn't account for nested index or groups.
                    return currentRoute.children?.find((child) => child.type === 'route' && child.route === 'index');
                }
                return currentRoute;
            }
            else {
                return null;
            }
        }
        currentRoute = currentRoute?.children?.find((child) => child.route === part);
    }
    return currentRoute;
}
exports.default = (0, defineRouter_1.defineRouter)(
// getPathConfig
async () => {
    const pathConfig = await getPathConfig();
    console.log('[CLI|ROUTER]: getPathConfig', require('util').inspect(pathConfig, { depth: 20, colors: true }));
    return pathConfig;
}, 
// getComponent (id is "**/layout" or "**/page")
async (id, unstable_setShouldSkip) => {
    unstable_setShouldSkip({}); // always skip if possible
    const route = wakuRouteIdToExpoRoute(routes, id);
    // NOTE: Hack to test other stuff
    console.log('getComponent', id, route);
    if (route) {
        const { loadRoute, children, ...rest } = route;
        // const { mapping, items } = result;
        const RouteNode = (0, react_1.lazy)(async () => {
            const value = await loadRoute();
            return value;
        });
        return RouteNode;
    }
    console.log('Missing router entry for:', id);
    return null;
    // if (id.includes('page')) {
    //   return (props) => createElement(ctx('./index.tsx').default, props);
    // } else {
    //   return (props) => createElement(View, props);
    // }
    // if (!route) {
    //   console.error('No route found for', id, ctx.keys());
    //   return null;
    // }
    // // const result = await getMappingAndItems(id);
    // // if (result === null) {
    // //   return null;
    // // }
    // console.log('Loading route:', RouteNode);
    // // const Route = ctx(id); // getRoute(items);
    // const Component = (props: Record<string, unknown>) =>
    //   createElement(RouteNode, {
    //     ...props,
    //     // ...mapping,
    //   });
    // // const Component = (props: Record<string, unknown>) => (
    // //   <Route node={stripFunctions(route)}>
    // //     {createElement(RouteNode, {
    // //       ...props,
    // //       // ...mapping,
    // //     })}
    // //   </Route>
    // // );
    // return Component;
});
function stripFunctions(routeNode) {
    return {
        ...routeNode,
        children: routeNode.children.map(stripFunctions),
        loadRoute: null,
    };
}
//# sourceMappingURL=expo-definedRouter.js.map