"use strict";
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderToPipeableStream = exports.fileURLToFilePath = void 0;
const react_1 = __importDefault(require("react"));
const path_1 = __importDefault(require("path"));
const _ctx_1 = require("../../_ctx");
// type WebpackManifest = {
//   // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/index.client.js"
//   [filepath: string]: {
//     // "*"
//     [name: string]: WebpackManifestSubType;
//   };
// };
// NOTE: MUST MATCH THE IMPL IN ExpoMetroConfig.ts
function stringToHash(str) {
    let hash = 0;
    if (str.length === 0)
        return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
const fileURLToFilePath = (fileURL) => {
    if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
    }
    return decodeURI(fileURL.slice('file://'.length));
};
exports.fileURLToFilePath = fileURLToFilePath;
async function renderToPipeableStream({ $$route: route, ...props }, { mode, url, serverRoot }
// moduleMap: WebpackManifest
) {
    const { renderToReadableStream } = require('react-server-dom-webpack/server.edge');
    if (!_ctx_1.ctx.keys().includes(route)) {
        throw new Error('Failed to find route: ' + route + '. Expected one of: ' + _ctx_1.ctx.keys().join(', '));
    }
    const { default: Component } = await (0, _ctx_1.ctx)(route);
    console.log('Initial component', Component, route);
    // const node = getNodeFinder()(route);
    // if (node?._route) {
    // const { default: Component } = node._route.loadRoute();
    // const rsc = renderToPipeableStream(
    //   // TODO: Does this support async?
    //   // <Component {...props} />,
    //   React.createElement(Component, props),
    //   moduleMap
    // );
    // return await pipeTo(rsc.pipe);
    // method === 'GET'
    // const renderContext: RenderContext = {
    //   rerender: () => {
    //     throw new Error('Cannot rerender');
    //   },
    //   context,
    // };
    const isDev = mode === 'development';
    if (isDev) {
        url.searchParams.set('modulesOnly', 'true');
        url.searchParams.set('runModule', 'false');
        // TODO: Maybe add a new param to execute and return the module exports.
    }
    const resolveClientEntry = (file // filePath or fileURL
    ) => {
        if (isDev) {
            const filePath = file.startsWith('file://') ? (0, exports.fileURLToFilePath)(file) : file;
            const metroOpaqueId = stringToHash(filePath);
            const relativeFilePath = path_1.default.relative(serverRoot, filePath);
            // TODO: May need to remove the original extension.
            url.pathname = relativeFilePath + '.bundle';
            // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
            url.hash = String(metroOpaqueId);
            let relativeUrl = url.pathname + url.search + url.hash;
            return relativeUrl;
        }
        else {
            if (!file.startsWith('@id/')) {
                throw new Error('Unexpected client entry in PRD');
            }
            url.pathname = file.slice('@id/'.length);
        }
        return url.toString();
    };
    const bundlerConfig = new Proxy({}, {
        get(_target, encodedId) {
            console.log('Get manifest entry:', encodedId);
            // const [file, name] = encodedId.split('#') as [string, string];
            // return moduleMap[encodedId];
            const [
            // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
            file, 
            // The name of the import (e.g. "default" or "")
            name,] = encodedId.split('#');
            // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
            // This is similar to how we handle lazy bundling.
            const id = resolveClientEntry(file);
            console.log('Returning server module:', id, 'for', encodedId);
            // moduleIdCallback?.(id);
            return { id, chunks: [id], name, async: true };
        },
    });
    //   moduleMap
    const elements = react_1.default.createElement(Component, props);
    return renderToReadableStream(elements, bundlerConfig);
    // return rsc.pipe;
    // }
    // throw new Error('Failed to render server component at: ' + route);
}
exports.renderToPipeableStream = renderToPipeableStream;
const stream_1 = require("stream");
async function pipeTo(pipe) {
    const rscStream = new ReadableStream({
        start(controller) {
            pipe(new stream_1.Writable({
                write(chunk, encoding, callback) {
                    controller.enqueue(chunk);
                    callback();
                },
                destroy(error, callback) {
                    if (error) {
                        controller.error(error);
                    }
                    else {
                        controller.close();
                    }
                    callback(error);
                },
            }));
        },
    });
    const res = await rscStream.getReader().read();
    return res.value.toString().trim();
}
//# sourceMappingURL=renderToPipeableStream.js.map