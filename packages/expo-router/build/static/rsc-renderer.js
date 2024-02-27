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
exports.renderRsc = exports.getRouteNodeForPathname = exports.fileURLToFilePath = void 0;
const stream_1 = require("@remix-run/node/dist/stream");
const chalk_1 = __importDefault(require("chalk"));
const server_edge_1 = require("react-server-dom-webpack/server.edge");
const _ctx_1 = require("../../_ctx");
const os_1 = __importDefault(require("../../os"));
const getRoutes_1 = require("../getRoutes");
const getServerManifest_1 = require("../getServerManifest");
// Importing this from the root will cause a second copy of source-map-support to be loaded which will break stack traces.
const debug = require('debug')('expo:rsc');
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
    return Math.abs(hash);
}
const fileURLToFilePath = (fileURL) => {
    if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
    }
    return decodeURI(fileURL.slice('file://'.length));
};
exports.fileURLToFilePath = fileURLToFilePath;
async function getRouteNodeForPathname(pathname) {
    // TODO: Populate this with Expo Router results.
    const routes = (0, getRoutes_1.getRoutes)(_ctx_1.ctx, {
        importMode: 'lazy',
    });
    console.log('serverManifest.htmlRoutes', routes);
    const serverManifest = await (0, getServerManifest_1.getServerManifest)(routes);
    console.log('serverManifest.htmlRoutes', serverManifest.htmlRoutes);
    const matchedNode = serverManifest.htmlRoutes.find((file) => new RegExp(file.namedRegex).test(pathname));
    if (!matchedNode) {
        throw new Error('No matching route found for: ' + pathname + '. Expected: ' + _ctx_1.ctx.keys().join(', '));
    }
    const contextKey = matchedNode.file;
    if (!_ctx_1.ctx.keys().includes(contextKey)) {
        throw new Error('Failed to find route: ' + contextKey + '. Expected one of: ' + _ctx_1.ctx.keys().join(', '));
    }
    return matchedNode;
}
exports.getRouteNodeForPathname = getRouteNodeForPathname;
async function renderRsc(opts
// moduleMap: WebpackManifest
) {
    // if (!isExporting) {
    //   if (process.env.NODE_ENV === 'development') {
    //     const HMRClient = require('@expo/metro-runtime/build/HMRClientRSC')
    //       .default as typeof import('@expo/metro-runtime/build/HMRClientRSC').default;
    //     const { createNodeFastRefresh } =
    //       require('@expo/metro-runtime/build/nodeFastRefresh') as typeof import('@expo/metro-runtime/build/nodeFastRefresh');
    //     // Make the URL for this file accessible so we can register it as an HMR client entry for RSC HMR.
    //     globalThis.__DEV_SERVER_URL__ = serverUrl;
    //     // Make the WebSocket constructor available to RSC HMR.
    //     global.WebSocket = require('ws').WebSocket;
    //     createNodeFastRefresh({
    //       onReload,
    //     });
    //     HMRClient.setup({
    //       isEnabled: true,
    //       onError(error) {
    //         // Do nothing and reload.
    //         // TODO: If we handle this better it could result in faster error feedback.
    //         onReload();
    //       },
    //     });
    //   }
    // }
    const { entries, 
    // elements,
    searchParams, 
    // isExporting,
    // url,
    // serverRoot,
    method, input, body, contentType, 
    // serverUrl,
    // onReload,
    moduleIdCallback, context, } = opts;
    const { default: { renderEntries }, loadModule, } = entries;
    // if (!isExporting) {
    //   url.searchParams.set('modulesOnly', 'true');
    //   url.searchParams.set('runModule', 'false');
    //   // TODO: Maybe add a new param to execute and return the module exports.
    // }
    const resolveClientEntry = opts.resolveClientEntry;
    // const resolveClientEntry = isExporting ? opts.resolveClientEntry : resolveClientEntryForPrd;
    // const resolveClientEntry = (
    //   file: string // filePath or fileURL
    // ) => {
    //   if (!isExporting) {
    //     const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
    //     const metroOpaqueId = stringToHash(filePath);
    //     const relativeFilePath = path.relative(serverRoot, filePath);
    //     // TODO: May need to remove the original extension.
    //     url.pathname = relativeFilePath + '.bundle';
    //     // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
    //     url.hash = String(metroOpaqueId);
    //     // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
    //     const id = url.pathname + url.search + url.hash;
    //     return { id, url: id };
    //   } else {
    //     // if (!file.startsWith('@id/')) {
    //     //   throw new Error('Unexpected client entry in PRD: ' + file);
    //     // }
    //     // url.pathname = file.slice('@id/'.length);
    //     // TODO: This should be different for prod
    //     const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
    //     const metroOpaqueId = stringToHash(filePath);
    //     const relativeFilePath = path.relative(serverRoot, filePath);
    //     // TODO: May need to remove the original extension.
    //     url.pathname = relativeFilePath;
    //     // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
    //     url.hash = String(metroOpaqueId);
    //     // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
    //     const id = '/' + url.hash;
    //     return { id, url: url.pathname + url.search + url.hash };
    //   }
    // };
    const render = async (renderContext, input, searchParams) => {
        const elements = await renderEntries.call(renderContext, input, searchParams);
        if (elements === null) {
            const err = new Error('No function component found');
            err.statusCode = 404; // HACK our convention for NotFound
            throw err;
        }
        if (Object.keys(elements).some((key) => key.startsWith('_'))) {
            throw new Error('"_" prefix is reserved');
        }
        return elements;
    };
    const bundlerConfig = new Proxy({}, {
        get(_target, encodedId) {
            // console.log('Get manifest entry:', encodedId);
            const [
            // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
            file, 
            // The name of the import (e.g. "default" or "")
            name,] = encodedId.split('#');
            // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
            // This is similar to how we handle lazy bundling.
            const id = resolveClientEntry(file);
            console.log('Returning server module:', id, 'for', encodedId);
            moduleIdCallback?.({ id: id.url, chunks: [id.url], name, async: true });
            return { id: id.id, chunks: [id.id], name, async: true };
        },
    });
    if (method === 'POST') {
        // TODO(Bacon): Fix Server action ID generation
        const rsfId = decodeURIComponent(input);
        // const rsfId = decodeURIComponent(decodeInput(input));
        let args = [];
        let bodyStr = '';
        if (body) {
            if (body instanceof ReadableStream) {
                bodyStr = await (0, stream_1.readableStreamToString)(body);
            }
            else if (typeof body === 'string') {
                bodyStr = body;
            }
            else {
                throw new Error('Unexpected body type: ' + body);
            }
        }
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
            // XXX This doesn't support streaming unlike busboy
            const formData = parseFormData(bodyStr, contentType);
            args = await (0, server_edge_1.decodeReply)(formData);
        }
        else if (bodyStr) {
            args = await (0, server_edge_1.decodeReply)(bodyStr);
        }
        const [fileId, name] = rsfId.split('#');
        let mod;
        if (opts.isExporting === false) {
            // console.log('Loading module:', fileId, name);
            mod = await opts.customImport(resolveClientEntry(fileId).url);
            // console.log('Loaded module:', mod);
        }
        else {
            throw new Error('TODO: Make this work with Metro');
            if (!fileId.startsWith('@id/')) {
                throw new Error('Unexpected server entry in PRD');
            }
            mod = await loadModule(fileId.slice('@id/'.length));
        }
        const fn = mod[name] || mod;
        // console.log('Target function:', fn);
        let elements = Promise.resolve({});
        let rendered = false;
        // TODO: Define context
        // const context = {};
        const rerender = (input, searchParams = new URLSearchParams()) => {
            if (rendered) {
                throw new Error('already rendered');
            }
            const renderContext = { rerender, context };
            elements = Promise.all([elements, render(renderContext, input, searchParams)]).then(([oldElements, newElements]) => ({
                ...oldElements,
                ...newElements,
            }));
        };
        const renderContext = { rerender, context };
        const data = await fn.apply(renderContext, args);
        const resolvedElements = await elements;
        rendered = true;
        return (0, server_edge_1.renderToReadableStream)({ ...resolvedElements, _value: data }, bundlerConfig);
    }
    // method === 'GET'
    const renderContext = {
        rerender: () => {
            throw new Error('Cannot rerender');
        },
        context,
    };
    const elements = await render(renderContext, input, searchParams);
    const stream = (0, server_edge_1.renderToReadableStream)(elements, bundlerConfig);
    // Logging is very useful for native platforms where the network tab isn't always available.
    if (debug.enabled) {
        return withDebugLogging(stream);
    }
    return stream;
}
exports.renderRsc = renderRsc;
function withDebugLogging(stream) {
    const textDecoder = new TextDecoder();
    // Wrap the stream and log chunks to the terminal.
    return new ReadableStream({
        start(controller) {
            stream.pipeTo(new WritableStream({
                write(chunk) {
                    console.log((0, chalk_1.default) `{dim ${os_1.default} [rsc]}`, textDecoder.decode(chunk));
                    controller.enqueue(chunk);
                },
                close() {
                    controller.close();
                },
                abort(reason) {
                    controller.error(reason);
                },
            }));
        },
    });
}
// TODO is this correct? better to use a library?
const parseFormData = (body, contentType) => {
    const boundary = contentType.split('boundary=')[1];
    const parts = body.split(`--${boundary}`);
    const formData = new FormData();
    for (const part of parts) {
        if (part.trim() === '' || part === '--')
            continue;
        const [rawHeaders, content] = part.split('\r\n\r\n', 2);
        const headers = rawHeaders.split('\r\n').reduce((acc, currentHeader) => {
            const [key, value] = currentHeader.split(': ');
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
        const contentDisposition = headers['content-disposition'];
        const nameMatch = /name="([^"]+)"/.exec(contentDisposition);
        const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition);
        if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
                const filename = filenameMatch[1];
                const type = headers['content-type'] || 'application/octet-stream';
                const blob = new Blob([content], { type });
                formData.append(name, blob, filename);
            }
            else {
                formData.append(name, content.trim());
            }
        }
    }
    return formData;
};
const decodeInput = (encodedInput) => {
    console.log('> decodeInput:', encodedInput);
    if (encodedInput === 'index.txt') {
        return '';
    }
    if (encodedInput?.endsWith('.txt')) {
        return encodedInput.slice(0, -'.txt'.length);
    }
    const err = new Error('Invalid encoded input');
    err.statusCode = 400;
    throw err;
};
//# sourceMappingURL=rsc-renderer.js.map