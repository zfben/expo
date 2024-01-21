"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoRouterServerComponentClientReferencesPlugin = exports.expoRouterBabelPlugin = void 0;
const core_1 = require("@babel/core");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
const debug = require('debug')('expo:babel:router');
function getExpoRouterAppRoot(projectRoot, appFolder) {
    // TODO: We should have cache invalidation if the expo-router/entry file location changes.
    const routerEntry = (0, resolve_from_1.default)(projectRoot, 'expo-router/entry');
    const appRoot = path_1.default.relative(path_1.default.dirname(routerEntry), appFolder);
    debug('routerEntry', routerEntry, appFolder, appRoot);
    return appRoot;
}
/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_PUBLIC_USE_STATIC
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE
 */
function expoRouterBabelPlugin(api) {
    const { types: t } = api;
    const platform = api.caller(common_1.getPlatform);
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot);
    const asyncRoutes = api.caller(common_1.getAsyncRoutes);
    const routerAbsoluteRoot = api.caller(common_1.getExpoRouterAbsoluteAppRoot);
    function isFirstInAssign(path) {
        return core_1.types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
    }
    return {
        name: 'expo-router',
        visitor: {
            MemberExpression(path, state) {
                const projectRoot = possibleProjectRoot || state.file.opts.root || '';
                if (path.get('object').matchesPattern('process.env')) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key) && !isFirstInAssign(path)) {
                        // Used for log box on web.
                        if (key.value.startsWith('EXPO_PROJECT_ROOT')) {
                            path.replaceWith(t.stringLiteral(projectRoot));
                        }
                        else if (
                        // TODO: Add cache invalidation.
                        key.value.startsWith('EXPO_PUBLIC_USE_STATIC')) {
                            if (platform === 'web') {
                                const isStatic = process.env.EXPO_PUBLIC_USE_STATIC === 'true' ||
                                    process.env.EXPO_PUBLIC_USE_STATIC === '1';
                                path.replaceWith(t.booleanLiteral(isStatic));
                            }
                            else {
                                path.replaceWith(t.booleanLiteral(false));
                            }
                        }
                        else if (key.value.startsWith('EXPO_ROUTER_IMPORT_MODE')) {
                            path.replaceWith(t.stringLiteral(asyncRoutes ? 'lazy' : 'sync'));
                        }
                        if (
                        // Skip loading the app root in tests.
                        // This is handled by the testing-library utils
                        process.env.NODE_ENV !== 'test') {
                            if (key.value.startsWith('EXPO_ROUTER_ABS_APP_ROOT')) {
                                path.replaceWith(t.stringLiteral(routerAbsoluteRoot));
                            }
                            else if (key.value.startsWith('EXPO_ROUTER_APP_ROOT')) {
                                path.replaceWith(t.stringLiteral(getExpoRouterAppRoot(possibleProjectRoot, routerAbsoluteRoot)));
                            }
                        }
                    }
                }
            },
        },
    };
}
exports.expoRouterBabelPlugin = expoRouterBabelPlugin;
function expoRouterServerComponentClientReferencesPlugin(api) {
    const { types: t } = api;
    // @ts-expect-error
    const isServer = api.caller((caller) => caller?.isReactServer ?? false);
    const isDev = api.caller(common_1.getIsDev);
    const mode = isDev ? 'development' : 'production';
    const serverRoot = api.caller(common_1.getServerRoot);
    return {
        name: 'expo-rsc-client-references',
        visitor: {
            Program(path, state) {
                const isUseClient = path.node.directives.some((directive) => directive.value.value === 'use client');
                // File starts with "use client" directive.
                if (!isUseClient) {
                    // Do nothing for code that isn't marked as a client component.
                    return;
                }
                const filePath = state.file.opts.filename; //nodePath.relative(serverRoot, state.file.opts.filename);
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                // Collect a list of all the exports in the file.
                const exports = [];
                path.traverse({
                    ExportNamedDeclaration(path) {
                        const { node } = path;
                        if (node.declaration) {
                            if (t.isVariableDeclaration(node.declaration)) {
                                exports.push(...node.declaration.declarations.map((decl) => decl.id.name));
                            }
                            else {
                                exports.push(node.declaration.id.name);
                            }
                        }
                        else if (node.specifiers) {
                            exports.push(...node.specifiers.map((spec) => spec.exported.name));
                        }
                    },
                    ExportDefaultDeclaration(path) {
                        const { node } = path;
                        if (node.declaration) {
                            exports.push('default');
                        }
                    },
                });
                // TODO: Handle module.exports somehow...
                console.log('Client references', filePath, outputKey, exports);
                // Bundling for the RSC requests, collect the manifest as metadata.
                state.file.metadata['clientReferences'] = {
                    entryPoint: outputKey,
                    exports,
                };
                if (isServer) {
                    // Clear the body
                    path.node.body = [];
                    path.node.directives = [];
                    if (isUseClient) {
                        // Inject the following:
                        // console.log('Loaded client module proxy for', outputKey, require('react-server-dom-webpack/server'))
                        // path.pushContainer(
                        //   'body',
                        //   t.expressionStatement(
                        //     t.callExpression(t.identifier('console.log'), [
                        //       t.stringLiteral('Loaded client module proxy for'),
                        //       t.stringLiteral(outputKey),
                        //       t.callExpression(t.identifier('require'), [
                        //         t.stringLiteral('react-server-dom-webpack/server'),
                        //       ]),
                        //     ])
                        //   )
                        // );
                        // Inject the following:
                        //
                        // module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(`${outputKey}#${require.resolveWeak(filePath)}`)
                        path.pushContainer('body', t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('module'), t.identifier('exports')), t.callExpression(t.memberExpression(t.callExpression(t.identifier('require'), [
                            t.stringLiteral('react-server-dom-webpack/server'),
                        ]), t.identifier('createClientModuleProxy')), 
                        // `${outputKey}#${require.resolveWeak(filePath)}`
                        [
                            t.stringLiteral(outputKey),
                            // t.stringLiteral(
                            //   `${outputKey}#${
                            //     // NOTE: This is super fragile!!
                            //     stringToHash(filePath)
                            //   }`
                            // ),
                            // Now add "+ require.resolveWeak(filePath)"
                            // This didn't work for some reason so we'll just hack in the fact that the name is stable in metro-runtime (it should be like this anyways).
                            // t.binaryExpression(
                            //   '+',
                            //   t.stringLiteral(`${outputKey}#`),
                            //   t.callExpression(t.identifier('require.resolveWeak'), [
                            //     t.stringLiteral(filePath),
                            //   ])
                            // ),
                        ]))));
                    }
                    else {
                        // Now we'll replace all the code in the file with client references, e.g.
                        // export default { $$typeof: Symbol.for("react.client.reference"), $$async: false, $$id: "${outputKey}#default", name: "default" }
                        // const registerServerReference = require('react-server-dom-webpack/server').registerServerReference;
                        // const createClientModuleProxy = require('react-server-dom-webpack/server').createClientModuleProxy;
                        // for (const exp of exports) {
                        //   if (exp === 'default') {
                        //     // export default { $$typeof: Symbol.for("react.client.reference"), $$async: false, $$id: "${outputKey}#default", name: "default" }
                        //     path.pushContainer(
                        //       'body',
                        //       t.exportDefaultDeclaration(
                        //         t.objectExpression([
                        //           t.objectProperty(
                        //             t.identifier('$$typeof'),
                        //             t.stringLiteral('react.client.reference')
                        //           ),
                        //           t.objectProperty(t.identifier('$$async'), t.booleanLiteral(false)),
                        //           t.objectProperty(t.identifier('$$id'), t.stringLiteral(`${outputKey}#default`)),
                        //           t.objectProperty(t.identifier('name'), t.stringLiteral('default')),
                        //         ])
                        //       )
                        //     );
                        //   } else {
                        //     // export const ${exp} = { $$typeof: Symbol.for("react.client.reference"), $$async: false, $$id: "${outputKey}#${exp}", name: "${exp}" }
                        //     path.pushContainer(
                        //       'body',
                        //       t.exportNamedDeclaration(
                        //         t.variableDeclaration('const', [
                        //           t.variableDeclarator(
                        //             t.identifier(exp),
                        //             t.objectExpression([
                        //               t.objectProperty(
                        //                 t.identifier('$$typeof'),
                        //                 t.stringLiteral('react.client.reference')
                        //               ),
                        //               t.objectProperty(t.identifier('$$async'), t.booleanLiteral(false)),
                        //               t.objectProperty(
                        //                 t.identifier('$$id'),
                        //                 t.stringLiteral(`${outputKey}#${exp}`)
                        //               ),
                        //               t.objectProperty(t.identifier('name'), t.stringLiteral(exp)),
                        //             ])
                        //           ),
                        //         ])
                        //       )
                        //     );
                        //   }
                        // }
                    }
                }
            },
        },
    };
}
exports.expoRouterServerComponentClientReferencesPlugin = expoRouterServerComponentClientReferencesPlugin;
