"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphToSerialAssetsAsync = exports.clientManifestSerializerPlugin = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const assert_1 = __importDefault(require("assert"));
const jsc_safe_url_1 = __importDefault(require("jsc-safe-url"));
const getAssets_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/getAssets"));
const sourceMapString_1 = __importDefault(require("metro/src/DeltaBundler/Serializers/sourceMapString"));
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const path_1 = __importDefault(require("path"));
const path_to_regexp_1 = __importDefault(require("path-to-regexp"));
const url_1 = require("url");
const exportHermes_1 = require("./exportHermes");
const exportPath_1 = require("./exportPath");
const baseJSBundle_1 = require("./fork/baseJSBundle");
const getCssDeps_1 = require("./getCssDeps");
/** Strips the process.env polyfill in server environments to allow for accessing environment variables off the global. */
function clientManifestSerializerPlugin(entryPoint, preModules, graph, options) {
    // NOTE: Partially replicates the Webpack version.
    // https://github.com/facebook/react/blob/6c7b41da3de12be2d95c60181b3fe896f824f13a/packages/react-server-dom-webpack/src/ReactFlightWebpackPlugin.js#L387
    const rscClientReferenceManifest = {};
    // Create client reference manifest for server components
    graph.dependencies.forEach((module) => {
        module.output.forEach((output) => {
            // @ts-expect-error
            const clientReferences = output.data.clientReferences;
            if (clientReferences) {
                const entry = '/' + path_1.default.relative(options.serverRoot ?? options.projectRoot, module.path);
                const currentUrl = new URL(jsc_safe_url_1.default.toNormalUrl(options.sourceUrl));
                // NOTE: This is a hack to find the opaque module ID for usage later when loading the bundle on the client.
                const opaqueId = options.createModuleId(module.path);
                console.log('options.sourceUrl', options.sourceUrl, opaqueId);
                currentUrl.pathname = entry.replace(/\.([tj]sx?|[mc]js)$/, '.bundle');
                currentUrl.searchParams.delete('serializer.output');
                currentUrl.searchParams.set('modulesOnly', 'true');
                // TODO: Add params to indicate that `module.exports = __r()` should be used as the run module statement.
                currentUrl.searchParams.set('runModule', 'false');
                const outputKey = (0, url_1.pathToFileURL)(module.path).href;
                // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/NoteEditor.js": {
                //   "id": "./src/NoteEditor.js",
                //   "chunks": [
                //     "vendors-node_modules_sanitize-html_index_js-node_modules_marked_lib_marked_esm_js",
                //     "client1"
                //   ],
                //   "name": "*"
                // },
                // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/NoteEditor.js#": {
                //   "id": "./src/NoteEditor.js",
                //   "chunks": [
                //     "vendors-node_modules_sanitize-html_index_js-node_modules_marked_lib_marked_esm_js",
                //     "client1"
                //   ],
                //   "name": ""
                // },
                const pushRef = (exp) => {
                    const key = `${outputKey}${exp === '*' ? '' : `#${exp}`}`;
                    rscClientReferenceManifest[key] = {
                        id: entry,
                        chunks: [
                            options.dev ? currentUrl.toString() + `#${opaqueId}` : 'TODO-PRODUCTION-CHUNK-NAMES',
                        ],
                        name: exp,
                    };
                };
                // NOTE: These come from the demo, not sure why we need them.
                pushRef('*');
                pushRef('');
                clientReferences.exports.forEach((exp) => {
                    pushRef(exp);
                });
            }
        });
    });
    const rscManifestChunkTemplate = preModules.find((module) => module.path.endsWith('.expo/metro/react-client-manifest.js'));
    // let rscAsset: SerialAsset | null = null;
    if (rscManifestChunkTemplate) {
        rscManifestChunkTemplate.output.forEach((output) => {
            output.data.code = output.data.code.replace(/\$\$expo_rsc_manifest\s?=\s?{}/, `$$$expo_rsc_manifest = ${JSON.stringify(rscClientReferenceManifest)} /* registered */`);
            // @ts-expect-error
            output.data.lineCount = (0, countLines_1.default)(output.data.code);
        });
        // rscAsset = {
        //   filename: '/dist/_expo/react-client-manifest.js',
        //   metadata: {},
        //   originFilename: '/react-client-manifest.js',
        //   source: JSON.stringify(rscClientReferenceManifest),
        //   type: 'json',
        // };
    }
    return [entryPoint, preModules, graph, options];
}
exports.clientManifestSerializerPlugin = clientManifestSerializerPlugin;
async function graphToSerialAssetsAsync(config, serializeChunkOptions, ...props) {
    const [entryFile, preModules, graph, options] = props;
    const cssDeps = (0, getCssDeps_1.getCssSerialAssets)(graph.dependencies, {
        projectRoot: options.projectRoot,
        processModuleFilter: options.processModuleFilter,
    });
    // NOTE: Partially replicates the Webpack version.
    // https://github.com/facebook/react/blob/6c7b41da3de12be2d95c60181b3fe896f824f13a/packages/react-server-dom-webpack/src/ReactFlightWebpackPlugin.js#L387
    const rscClientReferenceManifest = {};
    // Create client reference manifest for server components
    props[2].dependencies.forEach((module) => {
        module.output.forEach((output) => {
            // @ts-expect-error
            const clientReferences = output.data.clientReferences;
            if (clientReferences) {
                const entry = '/' + path_1.default.relative(options.serverRoot ?? options.projectRoot, module.path);
                const currentUrl = new URL(jsc_safe_url_1.default.toNormalUrl(options.sourceUrl));
                console.log('options.sourceUrl', options.sourceUrl);
                currentUrl.pathname = entry.replace(/\.([tj]sx?|[mc]js)$/, '.bundle');
                currentUrl.searchParams.delete('serializer.output');
                currentUrl.searchParams.set('modulesOnly', 'true');
                // TODO: Add params to indicate that `module.exports = __r()` should be used as the run module statement.
                currentUrl.searchParams.set('runModule', 'false');
                const outputKey = (0, url_1.pathToFileURL)(module.path).href;
                // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/NoteEditor.js": {
                //   "id": "./src/NoteEditor.js",
                //   "chunks": [
                //     "vendors-node_modules_sanitize-html_index_js-node_modules_marked_lib_marked_esm_js",
                //     "client1"
                //   ],
                //   "name": "*"
                // },
                // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/NoteEditor.js#": {
                //   "id": "./src/NoteEditor.js",
                //   "chunks": [
                //     "vendors-node_modules_sanitize-html_index_js-node_modules_marked_lib_marked_esm_js",
                //     "client1"
                //   ],
                //   "name": ""
                // },
                const pushRef = (exp) => {
                    const key = `${outputKey}${exp === '*' ? '' : `#${exp}`}`;
                    rscClientReferenceManifest[key] = {
                        id: entry,
                        chunks: [options.dev ? currentUrl.toString() : 'TODO-PRODUCTION-CHUNK-NAMES'],
                        name: exp,
                    };
                };
                // NOTE: These come from the demo, not sure why we need them.
                pushRef('*');
                pushRef('');
                clientReferences.exports.forEach((exp) => {
                    pushRef(exp);
                });
            }
        });
    });
    const rscManifestChunkTemplate = preModules.find((module) => module.path.endsWith('.expo/metro/react-client-manifest.js'));
    let rscAsset = null;
    if (rscManifestChunkTemplate) {
        rscManifestChunkTemplate.output.forEach((output) => {
            output.data.code = output.data.code.replace(/\$\$expo_rsc_manifest\s?=\s?{}/, `$$$expo_rsc_manifest = ${JSON.stringify(rscClientReferenceManifest)} /* registered */`);
            // @ts-expect-error
            output.data.lineCount = (0, countLines_1.default)(output.data.code);
        });
        rscAsset = {
            filename: '/dist/_expo/react-client-manifest.js',
            metadata: {},
            originFilename: '/react-client-manifest.js',
            source: JSON.stringify(rscClientReferenceManifest),
            type: 'json',
        };
    }
    // Create chunks for splitting.
    const chunks = new Set();
    [
        {
            test: (0, path_to_regexp_1.default)(entryFile),
        },
    ].map((chunkSettings) => gatherChunks(chunks, chunkSettings, preModules, graph, options, false));
    // Get the common modules and extract them into a separate chunk.
    const entryChunk = [...chunks.values()].find((chunk) => !chunk.isAsync && chunk.hasAbsolutePath(entryFile));
    if (entryChunk) {
        for (const chunk of chunks.values()) {
            if (chunk !== entryChunk && chunk.isAsync) {
                for (const dep of chunk.deps.values()) {
                    if (entryChunk.deps.has(dep)) {
                        // Remove the dependency from the async chunk since it will be loaded in the main chunk.
                        chunk.deps.delete(dep);
                    }
                }
            }
        }
        const toCompare = [...chunks.values()];
        const commonDependencies = [];
        while (toCompare.length) {
            const chunk = toCompare.shift();
            for (const chunk2 of toCompare) {
                if (chunk !== chunk2 && chunk.isAsync && chunk2.isAsync) {
                    const commonDeps = [...chunk.deps].filter((dep) => chunk2.deps.has(dep));
                    for (const dep of commonDeps) {
                        chunk.deps.delete(dep);
                        chunk2.deps.delete(dep);
                    }
                    commonDependencies.push(...commonDeps);
                }
            }
        }
        // Add common chunk if one exists.
        if (commonDependencies.length) {
            const commonDependenciesUnique = [...new Set(commonDependencies)];
            const commonChunk = new Chunk(chunkIdForModules(commonDependenciesUnique), commonDependenciesUnique, graph, options, false, true);
            entryChunk.requiredChunks.add(commonChunk);
            chunks.add(commonChunk);
        }
    }
    const jsAssets = await serializeChunksAsync(chunks, config.serializer ?? {}, serializeChunkOptions);
    // TODO: Convert to serial assets
    // TODO: Disable this call dynamically in development since assets are fetched differently.
    const metroAssets = (await (0, getAssets_1.default)(graph.dependencies, {
        processModuleFilter: options.processModuleFilter,
        assetPlugins: config.transformer?.assetPlugins ?? [],
        platform: (0, baseJSBundle_1.getPlatformOption)(graph, options) ?? 'web',
        projectRoot: options.projectRoot,
        publicPath: config.transformer?.publicPath ?? '/',
    }));
    return {
        artifacts: [...jsAssets, ...cssDeps, rscAsset].filter(Boolean),
        rscManifest: rscClientReferenceManifest,
        assets: metroAssets,
    };
}
exports.graphToSerialAssetsAsync = graphToSerialAssetsAsync;
class Chunk {
    name;
    entries;
    graph;
    options;
    isAsync;
    isVendor;
    deps = new Set();
    preModules = new Set();
    // Chunks that are required to be loaded synchronously before this chunk.
    // These are included in the HTML as <script> tags.
    requiredChunks = new Set();
    constructor(name, entries, graph, options, isAsync = false, isVendor = false) {
        this.name = name;
        this.entries = entries;
        this.graph = graph;
        this.options = options;
        this.isAsync = isAsync;
        this.isVendor = isVendor;
        this.deps = new Set(entries);
    }
    getPlatform() {
        (0, assert_1.default)(this.graph.transformOptions.platform, "platform is required to be in graph's transformOptions");
        return this.graph.transformOptions.platform;
    }
    getFilename(src) {
        return this.options.dev
            ? this.name
            : (0, exportPath_1.getExportPathForDependencyWithOptions)(this.name, {
                platform: this.getPlatform(),
                src,
                serverRoot: this.options.serverRoot,
            });
    }
    getFilenameForConfig(serializerConfig) {
        return this.getFilename(this.options.dev
            ? ''
            : this.serializeToCodeWithTemplates(serializerConfig, {
                // Disable source maps when creating a sha to reduce the number of possible changes that could
                // influence the cache hit.
                serializerOptions: {
                    includeSourceMaps: false,
                },
                sourceMapUrl: undefined,
            }));
    }
    serializeToCodeWithTemplates(serializerConfig, options = {}) {
        const entryFile = this.name;
        const jsSplitBundle = (0, baseJSBundle_1.baseJSBundleWithDependencies)(entryFile, [...this.preModules.values()], [...this.deps], {
            ...this.options,
            runBeforeMainModule: serializerConfig?.getModulesRunBeforeMainModule?.(path_1.default.relative(this.options.projectRoot, entryFile)) ?? [],
            runModule: !this.isVendor && !this.isAsync,
            modulesOnly: this.preModules.size === 0,
            platform: this.getPlatform(),
            baseUrl: (0, baseJSBundle_1.getBaseUrlOption)(this.graph, this.options),
            splitChunks: (0, baseJSBundle_1.getSplitChunksOption)(this.graph, this.options),
            skipWrapping: true,
            computedAsyncModulePaths: null,
            ...options,
        });
        return (0, bundleToString_1.default)(jsSplitBundle).code;
    }
    hasAbsolutePath(absolutePath) {
        return [...this.deps].some((module) => module.path === absolutePath);
    }
    getComputedPathsForAsyncDependencies(serializerConfig, chunks) {
        const baseUrl = (0, baseJSBundle_1.getBaseUrlOption)(this.graph, this.options);
        // Only calculate production paths when all chunks are being exported.
        if (this.options.includeAsyncPaths) {
            return null;
        }
        const computedAsyncModulePaths = {};
        this.deps.forEach((module) => {
            module.dependencies.forEach((dependency) => {
                if (dependency.data.data.asyncType === 'async') {
                    const chunkContainingModule = chunks.find((chunk) => chunk.hasAbsolutePath(dependency.absolutePath));
                    (0, assert_1.default)(chunkContainingModule, 'Chunk containing module not found: ' + dependency.absolutePath);
                    const moduleIdName = chunkContainingModule.getFilenameForConfig(serializerConfig);
                    computedAsyncModulePaths[dependency.absolutePath] = (baseUrl ?? '/') + moduleIdName;
                }
            });
        });
        return computedAsyncModulePaths;
    }
    getAdjustedSourceMapUrl(serializerConfig) {
        // Metro really only accounts for development, so we'll use the defaults here.
        if (this.options.dev) {
            return this.options.sourceMapUrl ?? null;
        }
        if (this.options.serializerOptions?.includeSourceMaps !== true) {
            return null;
        }
        if (this.options.inlineSourceMap || !this.options.sourceMapUrl) {
            return this.options.sourceMapUrl ?? null;
        }
        const isAbsolute = this.getPlatform() !== 'web';
        const baseUrl = (0, baseJSBundle_1.getBaseUrlOption)(this.graph, this.options);
        const filename = this.getFilenameForConfig(serializerConfig);
        const isAbsoluteBaseUrl = !!baseUrl?.match(/https?:\/\//);
        const pathname = (isAbsoluteBaseUrl ? '' : baseUrl.replace(/\/+$/, '')) +
            '/' +
            filename.replace(/^\/+$/, '') +
            '.map';
        let adjustedSourceMapUrl = this.options.sourceMapUrl;
        // Metro has lots of issues...
        if (this.options.sourceMapUrl.startsWith('//localhost')) {
            adjustedSourceMapUrl = 'http:' + this.options.sourceMapUrl;
        }
        try {
            const parsed = new URL(pathname, isAbsoluteBaseUrl ? baseUrl : adjustedSourceMapUrl);
            if (isAbsoluteBaseUrl || isAbsolute) {
                return parsed.href;
            }
            return parsed.pathname;
        }
        catch (error) {
            console.error(`Failed to link source maps because the source map URL "${this.options.sourceMapUrl}" is corrupt:`, error);
            return null;
        }
    }
    serializeToCode(serializerConfig, chunks) {
        return this.serializeToCodeWithTemplates(serializerConfig, {
            skipWrapping: false,
            sourceMapUrl: this.getAdjustedSourceMapUrl(serializerConfig) ?? undefined,
            computedAsyncModulePaths: this.getComputedPathsForAsyncDependencies(serializerConfig, chunks),
        });
    }
    async serializeToAssetsAsync(serializerConfig, chunks, { includeSourceMaps, includeBytecode, }) {
        const jsCode = this.serializeToCode(serializerConfig, chunks);
        const relativeEntry = path_1.default.relative(this.options.projectRoot, this.name);
        const outputFile = this.getFilenameForConfig(
        // Create hash without wrapping to prevent it changing when the wrapping changes.
        serializerConfig);
        const jsAsset = {
            filename: outputFile,
            originFilename: relativeEntry,
            type: 'js',
            metadata: {
                isAsync: this.isAsync,
                requires: [...this.requiredChunks.values()].map((chunk) => chunk.getFilenameForConfig(serializerConfig)),
            },
            source: jsCode,
        };
        const assets = [jsAsset];
        if (
        // Only include the source map if the `options.sourceMapUrl` option is provided and we are exporting a static build.
        includeSourceMaps &&
            !this.options.inlineSourceMap &&
            this.options.sourceMapUrl) {
            const modules = [
                ...this.preModules,
                ...getSortedModules([...this.deps], {
                    createModuleId: this.options.createModuleId,
                }),
            ].map((module) => {
                // TODO: Make this user-configurable.
                // Make all paths relative to the server root to prevent the entire user filesystem from being exposed.
                if (module.path.startsWith('/')) {
                    return {
                        ...module,
                        path: '/' + path_1.default.relative(this.options.serverRoot ?? this.options.projectRoot, module.path),
                    };
                }
                return module;
            });
            const sourceMap = (0, sourceMapString_1.default)(modules, {
                excludeSource: false,
                ...this.options,
            });
            assets.push({
                filename: this.options.dev ? jsAsset.filename + '.map' : outputFile + '.map',
                originFilename: jsAsset.originFilename,
                type: 'map',
                metadata: {},
                source: sourceMap,
            });
        }
        if (includeBytecode && this.isHermesEnabled()) {
            const adjustedSource = jsAsset.source.replace(/^\/\/# (sourceMappingURL)=(.*)$/gm, (...props) => {
                if (props[1] === 'sourceMappingURL') {
                    const mapName = props[2].replace(/\.js\.map$/, '.hbc.map');
                    return `//# ${props[1]}=` + mapName;
                }
                return '';
            });
            // TODO: Generate hbc for each chunk
            const hermesBundleOutput = await (0, exportHermes_1.buildHermesBundleAsync)({
                filename: this.name,
                code: adjustedSource,
                map: assets[1] ? assets[1].source : null,
                // TODO: Maybe allow prod + no minify.
                minify: true, //!this.options.dev,
            });
            if (hermesBundleOutput.hbc) {
                // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
                // jsAsset.metadata.hbc = hermesBundleOutput.hbc;
                // @ts-expect-error: TODO
                jsAsset.source = hermesBundleOutput.hbc;
                jsAsset.filename = jsAsset.filename.replace(/\.js$/, '.hbc');
            }
            if (assets[1] && hermesBundleOutput.sourcemap) {
                assets[1].source = hermesBundleOutput.sourcemap;
                assets[1].filename = assets[1].filename.replace(/\.js\.map$/, '.hbc.map');
            }
        }
        return assets;
    }
    supportsBytecode() {
        return this.getPlatform() !== 'web';
    }
    isHermesEnabled() {
        // TODO: Revisit.
        // TODO: There could be an issue with having the serializer for export:embed output hermes since the native scripts will
        // also create hermes bytecode. We may need to disable in one of the two places.
        return (!this.options.dev &&
            this.supportsBytecode() &&
            this.graph.transformOptions.customTransformOptions?.engine === 'hermes');
    }
}
function getEntryModulesForChunkSettings(graph, settings) {
    return [...graph.dependencies.entries()]
        .filter(([path]) => settings.test.test(path))
        .map(([, module]) => module);
}
function chunkIdForModules(modules) {
    return modules
        .map((module) => module.path)
        .sort()
        .join('=>');
}
function gatherChunks(chunks, settings, preModules, graph, options, isAsync = false) {
    let entryModules = getEntryModulesForChunkSettings(graph, settings);
    const existingChunks = [...chunks.values()];
    entryModules = entryModules.filter((module) => {
        return !existingChunks.find((chunk) => chunk.entries.includes(module));
    });
    // Prevent processing the same entry file twice.
    if (!entryModules.length) {
        return chunks;
    }
    const entryChunk = new Chunk(chunkIdForModules(entryModules), entryModules, graph, options, isAsync);
    // Add all the pre-modules to the first chunk.
    if (preModules.length) {
        // On native, use the preModules in insert code in the entry chunk.
        for (const module of preModules.values()) {
            entryChunk.preModules.add(module);
        }
    }
    chunks.add(entryChunk);
    const splitChunks = (0, baseJSBundle_1.getSplitChunksOption)(graph, options);
    function includeModule(entryModule) {
        for (const dependency of entryModule.dependencies.values()) {
            if (dependency.data.data.asyncType === 'async' &&
                // Support disabling multiple chunks.
                splitChunks) {
                gatherChunks(chunks, { test: (0, path_to_regexp_1.default)(dependency.absolutePath) }, [], graph, options, true);
            }
            else {
                const module = graph.dependencies.get(dependency.absolutePath);
                if (module) {
                    // Prevent circular dependencies from creating infinite loops.
                    if (!entryChunk.deps.has(module)) {
                        entryChunk.deps.add(module);
                        includeModule(module);
                    }
                }
            }
        }
    }
    for (const entryModule of entryModules) {
        includeModule(entryModule);
    }
    return chunks;
}
async function serializeChunksAsync(chunks, serializerConfig, { includeSourceMaps, includeBytecode }) {
    const jsAssets = [];
    const chunksArray = [...chunks.values()];
    await Promise.all(chunksArray.map(async (chunk) => {
        jsAssets.push(...(await chunk.serializeToAssetsAsync(serializerConfig, chunksArray, {
            includeSourceMaps,
            includeBytecode,
        })));
    }));
    return jsAssets;
}
function getSortedModules(modules, { createModuleId, }) {
    // Assign IDs to modules in a consistent order
    for (const module of modules) {
        createModuleId(module.path);
    }
    // Sort by IDs
    return modules.sort((a, b) => createModuleId(a.path) - createModuleId(b.path));
}
