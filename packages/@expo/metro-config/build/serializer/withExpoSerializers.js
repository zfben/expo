"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSerializerFromSerialProcessors = exports.withSerializerPlugins = exports.withExpoSerializers = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const jsc_safe_url_1 = require("jsc-safe-url");
const bundleToString_1 = __importDefault(require("metro/src/lib/bundleToString"));
const environmentVariableSerializerPlugin_1 = require("./environmentVariableSerializerPlugin");
const baseJSBundle_1 = require("./fork/baseJSBundle");
const serializeChunks_1 = require("./serializeChunks");
const env_1 = require("../env");
function withExpoSerializers(config) {
    const processors = [];
    processors.push(environmentVariableSerializerPlugin_1.serverPreludeSerializerPlugin);
    if (!env_1.env.EXPO_NO_CLIENT_ENV_VARS) {
        processors.push(environmentVariableSerializerPlugin_1.environmentVariableSerializerPlugin);
    }
    return withSerializerPlugins(config, processors);
}
exports.withExpoSerializers = withExpoSerializers;
// There can only be one custom serializer as the input doesn't match the output.
// Here we simply run
function withSerializerPlugins(config, processors) {
    const originalSerializer = config.serializer?.customSerializer;
    return {
        ...config,
        serializer: {
            ...config.serializer,
            customSerializer: createSerializerFromSerialProcessors(config, processors, originalSerializer),
        },
    };
}
exports.withSerializerPlugins = withSerializerPlugins;
function getDefaultSerializer(config, fallbackSerializer) {
    const defaultSerializer = fallbackSerializer ??
        (async (...params) => {
            const bundle = (0, baseJSBundle_1.baseJSBundle)(...params);
            const outputCode = (0, bundleToString_1.default)(bundle).code;
            return outputCode;
        });
    return async (...props) => {
        const [, , , options] = props;
        const customSerializerOptions = options.serializerOptions;
        // Custom options can only be passed outside of the dev server, meaning
        // we don't need to stringify the results at the end, i.e. this is `npx expo export` or `npx expo export:embed`.
        const supportsNonSerialReturn = !!customSerializerOptions?.output;
        const serializerOptions = (() => {
            if (customSerializerOptions) {
                return {
                    includeBytecode: customSerializerOptions.includeBytecode,
                    outputMode: customSerializerOptions.output,
                    includeSourceMaps: customSerializerOptions.includeSourceMaps,
                };
            }
            if (options.sourceUrl) {
                const sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
                    ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
                    : options.sourceUrl;
                const url = new URL(sourceUrl, 'https://expo.dev');
                return {
                    outputMode: url.searchParams.get('serializer.output'),
                    includeSourceMaps: url.searchParams.get('serializer.map') === 'true',
                    includeBytecode: url.searchParams.get('serializer.bytecode') === 'true',
                };
            }
            return null;
        })();
        if (serializerOptions?.outputMode !== 'static') {
            const res = await defaultSerializer(...props);
            //  console.log('>>', res, props);
            // if (typeof res === 'string')  {}
            // if (options.runModule) {
            //   const paths = [...options.runBeforeMainModule, entryPoint];
            //   for (const path of paths) {
            //     if (modules.some((module: Module<>) => module.path === path)) {
            //       const code = options.getRunModuleStatement(
            //         options.createModuleId(path),
            //       );
            //       output.push({
            //         path: `require-${path}`,
            //         dependencies: new Map(),
            //         getSource: (): Buffer => Buffer.from(''),
            //         inverseDependencies: new CountingSet(),
            //         output: [
            //           {
            //             type: 'js/script/virtual',
            //             data: {
            //               code,
            //               lineCount: countLines(code),
            //               map: [],
            //             },
            //           },
            //         ],
            //       });
            //     }
            //   }
            // }
            return res;
        }
        // Mutate the serializer options with the parsed options.
        options.serializerOptions = {
            ...options.serializerOptions,
            ...serializerOptions,
        };
        const assets = await (0, serializeChunks_1.graphToSerialAssetsAsync)(config, {
            includeSourceMaps: !!serializerOptions.includeSourceMaps,
            includeBytecode: !!serializerOptions.includeBytecode,
        }, ...props);
        if (supportsNonSerialReturn) {
            // @ts-expect-error: this is future proofing for adding assets to the output as well.
            return assets;
        }
        return JSON.stringify(assets);
    };
}
function createSerializerFromSerialProcessors(config, processors, originalSerializer) {
    const finalSerializer = getDefaultSerializer(config, originalSerializer);
    return (...props) => {
        for (const processor of processors) {
            if (processor) {
                props = processor(...props);
            }
        }
        return finalSerializer(...props);
    };
}
exports.createSerializerFromSerialProcessors = createSerializerFromSerialProcessors;
