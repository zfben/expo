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
// Importing this from the root will cause a second copy of source-map-support to be loaded which will break stack traces.
const stream_1 = require("@remix-run/node/dist/stream");
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
    return hash;
}
const fileURLToFilePath = (fileURL) => {
    if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
    }
    return decodeURI(fileURL.slice('file://'.length));
};
exports.fileURLToFilePath = fileURLToFilePath;
async function renderToPipeableStream({ $$route: route, ...props }, { mode, url, serverRoot, method, input, body, contentType, customImport, }
// moduleMap: WebpackManifest
) {
    const { renderToReadableStream, decodeReply } = require('react-server-dom-webpack/server.edge');
    if (!_ctx_1.ctx.keys().includes(route)) {
        throw new Error('Failed to find route: ' + route + '. Expected one of: ' + _ctx_1.ctx.keys().join(', '));
    }
    const { default: Component } = await (0, _ctx_1.ctx)(route);
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
            // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
            return url.pathname + url.search + url.hash;
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
            debug('Get manifest entry:', encodedId);
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
            debug('Returning server module:', id, 'for', encodedId);
            // moduleIdCallback?.(id);
            return { id, chunks: [id], name, async: true };
        },
    });
    if (method === 'POST') {
        const rsfId = decodeURIComponent(decodeInput(input));
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
            args = await decodeReply(formData);
        }
        else if (bodyStr) {
            args = await decodeReply(bodyStr);
        }
        const [fileId, name] = rsfId.split('#');
        let mod;
        if (isDev) {
            // console.log('Loading module:', fileId, name);
            mod = await customImport(resolveClientEntry(fileId));
            // console.log('Loaded module:', mod);
        }
        else {
            // if (!fileId.startsWith('@id/')) {
            //   throw new Error('Unexpected server entry in PRD');
            // }
            // mod = await loadModule!(fileId.slice('@id/'.length));
        }
        const fn = mod[name] || mod;
        // console.log('Target function:', fn);
        let elements = Promise.resolve({});
        let rendered = false;
        // TODO: Define context
        const context = {};
        const rerender = (input, searchParams = new URLSearchParams()) => {
            if (rendered) {
                throw new Error('already rendered');
            }
            const renderContext = { rerender, context };
            throw new Error('TODO: Rerender');
            // elements = Promise.all([elements, render(renderContext, input, searchParams)]).then(
            //   ([oldElements, newElements]) => ({
            //     ...oldElements,
            //     ...newElements,
            //   })
            // );
        };
        const renderContext = { rerender, context };
        const data = await fn.apply(renderContext, args);
        const resolvedElements = await elements;
        rendered = true;
        return renderToReadableStream({ ...resolvedElements, _value: data }, bundlerConfig);
    }
    //   moduleMap
    const elements = react_1.default.createElement(Component, props);
    return renderToReadableStream(elements, bundlerConfig);
    // return rsc.pipe;
    // }
    // throw new Error('Failed to render server component at: ' + route);
}
exports.renderToPipeableStream = renderToPipeableStream;
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
//# sourceMappingURL=renderToPipeableStream.js.map