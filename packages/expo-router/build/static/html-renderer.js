"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtml = void 0;
const stream_1 = require("../rsc/stream");
const path_1 = require("../rsc/path");
const utils_1 = require("./utils");
// TODO(bacon): Add this somehow
const importMetaUrl = import.meta.url;
// HACK for react-server-dom-webpack without webpack
globalThis.__webpack_module_loading__ ||= new Map();
globalThis.__webpack_module_cache__ ||= new Map();
globalThis.__webpack_chunk_load__ ||= async (id) => globalThis.__webpack_module_loading__.get(id);
globalThis.__webpack_require__ ||= (id) => globalThis.__webpack_module_cache__.get(id);
const moduleLoading = globalThis.__webpack_module_loading__;
const moduleCache = globalThis.__webpack_module_cache__;
const fakeFetchCode = `
  Promise.resolve(new Response(new ReadableStream({
    start(c) {
      const f = (s) => new TextEncoder().encode(decodeURI(s));
      globalThis.__WAKU_PUSH__ = (s) => s ? c.enqueue(f(s)) : c.close();
    }
  })))
  `
    .split('\n')
    .map((line) => line.trim())
    .join('');
const injectRscPayload = (readable, urlForFakeFetch) => {
    const chunks = [];
    const copied = readable.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            chunks.push(chunk);
            controller.enqueue(chunk);
        },
    }));
    const modifyHead = (data) => {
        const matchPrefetched = data.match(
        // HACK This is very brittle
        /(.*<script[^>]*>\nglobalThis\.__WAKU_PREFETCHED__ = {\n)(.*?)(\n};.*)/s);
        if (matchPrefetched) {
            data = matchPrefetched[1] + `  '${urlForFakeFetch}': ${fakeFetchCode},` + matchPrefetched[3];
        }
        const closingHeadIndex = data.indexOf('</head>');
        if (closingHeadIndex === -1) {
            throw new Error('closing head not found');
        }
        let code = '';
        if (!matchPrefetched) {
            code += `
  globalThis.__WAKU_PREFETCHED__ = {
    '${urlForFakeFetch}': ${fakeFetchCode},
  };
  `;
        }
        if (code) {
            data =
                data.slice(0, closingHeadIndex) +
                    `<script type="module" async>${code}</script>` +
                    data.slice(closingHeadIndex);
        }
        return data;
    };
    const interleave = () => {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let headSent = false;
        let data = '';
        let scriptsClosed = false;
        const sendScripts = (controller, close) => {
            if (scriptsClosed) {
                return;
            }
            const scripts = chunks.splice(0).map((chunk) => `
  <script type="module" async>globalThis.__WAKU_PUSH__("${encodeURI(decoder.decode(chunk))}")</script>`);
            if (close) {
                scriptsClosed = true;
                scripts.push(`
  <script type="module" async>globalThis.__WAKU_PUSH__()</script>`);
            }
            if (scripts.length) {
                controller.enqueue(encoder.encode(scripts.join('')));
            }
        };
        return new TransformStream({
            transform(chunk, controller) {
                if (!(chunk instanceof Uint8Array)) {
                    throw new Error('Unknown chunk type');
                }
                data += decoder.decode(chunk);
                if (!headSent) {
                    if (!data.includes('</head>')) {
                        return;
                    }
                    headSent = true;
                    data = modifyHead(data);
                }
                const closingBodyIndex = data.lastIndexOf('</body>');
                if (closingBodyIndex === -1) {
                    controller.enqueue(encoder.encode(data));
                    data = '';
                    sendScripts(controller);
                }
                else {
                    controller.enqueue(encoder.encode(data.slice(0, closingBodyIndex)));
                    sendScripts(controller, true);
                    controller.enqueue(encoder.encode(data.slice(closingBodyIndex)));
                    data = '';
                }
            },
        });
    };
    return [copied, interleave];
};
// HACK for now, do we want to use HTML parser?
const rectifyHtml = () => {
    const pending = [];
    const decoder = new TextDecoder();
    let timer;
    return new TransformStream({
        transform(chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            pending.push(chunk);
            if (/<\/\w+>$/.test(decoder.decode(chunk))) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    controller.enqueue((0, stream_1.concatUint8Arrays)(pending.splice(0)));
                });
            }
        },
        flush(controller) {
            clearTimeout(timer);
            if (pending.length) {
                controller.enqueue((0, stream_1.concatUint8Arrays)(pending.splice(0)));
            }
        },
    });
};
const buildHtml = (createElement, head, body) => createElement('html', null, createElement('head', { dangerouslySetInnerHTML: { __html: head } }), createElement('body', null, body));
const react_1 = require("react");
const server_edge_1 = require("react-dom/server.edge");
const client_edge_1 = require("react-server-dom-webpack/client.edge");
const client_1 = require("../rsc/client");
const renderHtml = async (opts) => {
    const { config, pathname, searchParams, htmlHead, renderRscForHtml, getSsrConfigForHtml, isDev } = opts;
    const ssrConfig = await getSsrConfigForHtml?.(pathname, searchParams);
    if (!ssrConfig) {
        return null;
    }
    let stream;
    try {
        stream = await renderRscForHtml(ssrConfig.input, ssrConfig.searchParams || searchParams);
    }
    catch (e) {
        if ((0, utils_1.hasStatusCode)(e) && e.statusCode === 404) {
            return null;
        }
        throw e;
    }
    const moduleMap = new Proxy({}, {
        get(_target, filePath) {
            return new Proxy({}, {
                get(_target, name) {
                    const file = filePath.slice(config.basePath.length);
                    // TODO too long, we need to refactor this logic
                    if (isDev) {
                        const filePath = file.startsWith('@fs/')
                            ? file.slice('@fs'.length)
                            : (0, path_1.joinPath)(opts.rootDir, file);
                        const wakuDist = (0, path_1.joinPath)((0, path_1.fileURLToFilePath)(importMetaUrl), '../../..');
                        if (filePath.startsWith(wakuDist)) {
                            const id = 'waku' + filePath.slice(wakuDist.length).replace(/\.\w+$/, '');
                            if (!moduleLoading.has(id)) {
                                moduleLoading.set(id, Promise.resolve(`${id}`).then(s => __importStar(require(s))).then((m) => {
                                    moduleCache.set(id, m);
                                }));
                            }
                            return { id, chunks: [id], name };
                        }
                        const id = (0, path_1.filePathToFileURL)(filePath);
                        if (!moduleLoading.has(id)) {
                            moduleLoading.set(id, opts.loadServerFile(id).then((m) => {
                                moduleCache.set(id, m);
                            }));
                        }
                        return { id, chunks: [id], name };
                    }
                    // !isDev
                    const id = file;
                    if (!moduleLoading.has(id)) {
                        moduleLoading.set(id, opts.loadModule((0, path_1.joinPath)(config.publicDir, id)).then((m) => {
                            moduleCache.set(id, m);
                        }));
                    }
                    return { id, chunks: [id], name };
                },
            });
        },
    });
    const [copied, interleave] = injectRscPayload(stream, config.basePath + config.rscPath + '/' + (0, utils_1.encodeInput)(ssrConfig.input));
    const elements = (0, client_edge_1.createFromReadableStream)(copied, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    const body = (0, client_edge_1.createFromReadableStream)(ssrConfig.body, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    const readable = (await (0, server_edge_1.renderToReadableStream)(buildHtml(react_1.createElement, htmlHead, (0, react_1.createElement)(client_1.ServerRoot, { elements }, body)), {
        onError(err) {
            console.error(err);
        },
    }))
        .pipeThrough(rectifyHtml())
        .pipeThrough(interleave());
    return readable;
};
exports.renderHtml = renderHtml;
//# sourceMappingURL=html-renderer.js.map