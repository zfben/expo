"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtml = void 0;
const react_1 = require("react");
const server_edge_1 = require("react-dom/server.edge");
const client_edge_1 = require("react-server-dom-webpack/client.edge");
const utils_1 = require("./utils");
const client_1 = require("../rsc/client");
const path_1 = require("../rsc/path");
const stream_1 = require("../rsc/stream");
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
    const resolveClientEntry = (file // filePath or fileURL
    ) => {
        // if (!isExporting) {
        const filePath = file.startsWith('file://') ? (0, path_1.fileURLToFilePath)(file) : file;
        const metroOpaqueId = stringToHash(filePath);
        const relativeFilePath = path.relative(opts.serverRoot, filePath);
        // TODO: May need to remove the original extension.
        url.pathname = relativeFilePath + '.bundle';
        // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
        url.hash = String(metroOpaqueId);
        // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
        const id = url.pathname + url.search + url.hash;
        return { id, url: id };
        // } else {
        //   // if (!file.startsWith('@id/')) {
        //   //   throw new Error('Unexpected client entry in PRD: ' + file);
        //   // }
        //   // url.pathname = file.slice('@id/'.length);
        //   // TODO: This should be different for prod
        //   const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
        //   const metroOpaqueId = stringToHash(filePath);
        //   const relativeFilePath = path.relative(serverRoot, filePath);
        //   // TODO: May need to remove the original extension.
        //   url.pathname = relativeFilePath;
        //   // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
        //   url.hash = String(metroOpaqueId);
        //   // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
        //   const id = '/' + url.hash;
        //   return { id, url: url.pathname + url.search + url.hash };
        // }
    };
    const moduleMap = new Proxy({}, {
        get(_target, filePath) {
            return new Proxy({}, {
                get(_target, encodedId) {
                    // const file = filePath.slice(config.basePath.length);
                    console.log('TODO: GET MODULE:>', encodedId);
                    // TODO too long, we need to refactor this logic
                    // if (isDev) {
                    //   const filePath = file.startsWith('@fs/')
                    //     ? file.slice('@fs'.length)
                    //     : joinPath(opts.rootDir, file);
                    //   const wakuDist = joinPath(fileURLToFilePath(importMetaUrl), '../../..');
                    //   if (filePath.startsWith(wakuDist)) {
                    //     const id = 'waku' + filePath.slice(wakuDist.length).replace(/\.\w+$/, '');
                    //     if (!moduleLoading.has(id)) {
                    //       moduleLoading.set(
                    //         id,
                    //         import(id).then((m) => {
                    //           moduleCache.set(id, m);
                    //         })
                    //       );
                    //     }
                    //     return { id, chunks: [id], name };
                    //   }
                    //   const id = filePathToFileURL(filePath);
                    //   if (!moduleLoading.has(id)) {
                    //     moduleLoading.set(
                    //       id,
                    //       opts.loadServerFile(id).then((m) => {
                    //         moduleCache.set(id, m);
                    //       })
                    //     );
                    //   }
                    //   return { id, chunks: [id], name };
                    // }
                    // // !isDev
                    // const id = file;
                    // if (!moduleLoading.has(id)) {
                    //   moduleLoading.set(
                    //     id,
                    //     opts.loadModule(joinPath(config.publicDir, id)).then((m: any) => {
                    //       moduleCache.set(id, m);
                    //     })
                    //   );
                    // }
                    // debug('Get manifest entry:', encodedId);
                    // const [file, name] = encodedId.split('#') as [string, string];
                    // return moduleMap[encodedId];
                    const [
                    // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
                    file, 
                    // The name of the import (e.g. "default" or "")
                    name,] = encodedId.split('#');
                    // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
                    // This is similar to how we handle lazy bundling.
                    const entry = resolveClientEntry(file);
                    console.log('Returning server module:', entry, 'for', encodedId);
                    // moduleIdCallback?.({ id: entry.url, chunks: [entry.url], name, async: true });
                    return { id: entry.id, chunks: [entry.id], name, async: true };
                    // return { id, chunks: [id], name };
                },
            });
        },
    });
    const [copied, interleave] = injectRscPayload(stream, config.basePath + config.rscPath + '/' + (0, utils_1.encodeInput)(ssrConfig.input));
    const elements = (0, client_edge_1.createFromReadableStream)(copied, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    // const body: Promise<ReactNode> = createFromReadableStream(ssrConfig.body, {
    //   ssrManifest: { moduleMap, moduleLoading: null },
    // });
    const readable = (await (0, server_edge_1.renderToReadableStream)(buildHtml(react_1.createElement, htmlHead, (0, react_1.createElement)(client_1.ServerRoot, { elements }
    // body as any
    )), {
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