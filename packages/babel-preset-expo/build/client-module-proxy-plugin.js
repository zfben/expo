"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoRouterServerComponentClientReferencesPlugin = exports.rscForbiddenReactAPIsPlugin = void 0;
const url_1 = __importDefault(require("url"));
const common_1 = require("./common");
const INVALID_SERVER_REACT_DOM_APIS = [
    'findDOMNode',
    'flushSync',
    'unstable_batchedUpdates',
    'useFormStatus',
    'useFormState',
];
// From the "React" docs: https://github.com/vercel/next.js/blob/d43a387d271263f2c1c4da6b9db826e382fc489c/packages/next-swc/crates/next-custom-transforms/src/transforms/react_server_components.rs#L665-L681
const INVALID_SERVER_REACT_APIS = [
    'Component',
    'createContext',
    'createFactory',
    'PureComponent',
    'useDeferredValue',
    'useEffect',
    'useImperativeHandle',
    'useInsertionEffect',
    'useLayoutEffect',
    'useReducer',
    'useRef',
    'useState',
    'useSyncExternalStore',
    'useTransition',
    'useOptimistic',
];
function isNodeModule(path) {
    return path != null && /[\\/]node_modules[\\/]/.test(path);
}
// Restricts imports from `react` and `react-dom` when using React Server Components.
const FORBIDDEN_IMPORTS = {
    react: INVALID_SERVER_REACT_APIS,
    'react-dom': INVALID_SERVER_REACT_DOM_APIS,
};
function rscForbiddenReactAPIsPlugin(api) {
    const { types: t } = api;
    return {
        name: 'expo-rsc-forbidden-server-apis',
        visitor: {
            ImportDeclaration(path, state) {
                // Skip node_modules
                if (isNodeModule(state.file.opts.filename)) {
                    return;
                }
                const sourceValue = path.node.source.value;
                const forbiddenList = FORBIDDEN_IMPORTS[sourceValue];
                if (forbiddenList) {
                    path.node.specifiers.forEach((specifier) => {
                        if (t.isImportSpecifier(specifier)) {
                            const importName = t.isStringLiteral(specifier.imported)
                                ? specifier.imported.value
                                : specifier.imported.name;
                            // Check for both named and namespace imports
                            const isForbidden = forbiddenList.includes(importName);
                            if (isForbidden) {
                                // Add special handling for `Component` since it is different to a function API.
                                throw path.buildCodeFrameError(`Client-only "${sourceValue}" API "${importName}" cannot be imported in a React server component. Add the "use client" directive to the top of this file or one of the parent files to enable running this stateful code on a user's device.`);
                            }
                        }
                        else {
                            const importName = t.isStringLiteral(specifier.local)
                                ? specifier.local
                                : specifier.local.name;
                            // Save namespace import for later checks in MemberExpression
                            path.scope.setData('importedNamespace', { [importName]: sourceValue });
                        }
                    });
                }
            },
            MemberExpression(path) {
                const importedNamespaces = path.scope.getData('importedNamespace') || {};
                Object.keys(importedNamespaces).forEach((namespace) => {
                    const library = importedNamespaces[namespace];
                    const forbiddenList = FORBIDDEN_IMPORTS[library];
                    const objectName = t.isIdentifier(path.node.object) ? path.node.object.name : null;
                    if (objectName === namespace &&
                        forbiddenList &&
                        t.isIdentifier(path.node.property) &&
                        forbiddenList.includes(path.node.property.name)) {
                        // Throw a special error for class components since it's not always clear why they cannot be used in RSC.
                        // e.g. https://x.com/Baconbrix/status/1749223042440392806?s=20
                        if (path.node.property.name === 'Component') {
                            throw path.buildCodeFrameError(`Class components cannot be used in a React server component due to their ability to contain stateful and interactive APIs that cannot be statically evaluated in non-interactive environments such as a server or at build-time. Migrate to a function component, or add the "use client" directive to the top of this file or one of the parent files to render this class component on a user's device.`);
                        }
                        throw path.buildCodeFrameError(`Client-only "${namespace}" API "${path.node.property.name}" cannot be used in a React server component. Add the "use client" directive to the top of this file or one of the parent files to enable running this stateful code on a user's device.`);
                    }
                });
            },
        },
    };
}
exports.rscForbiddenReactAPIsPlugin = rscForbiddenReactAPIsPlugin;
function expoRouterServerComponentClientReferencesPlugin(api) {
    const { types: t } = api;
    const isServer = api.caller(common_1.getIsReactServer);
    // const isDev = api.caller(getIsDev);
    return {
        name: 'expo-rsc-client-references',
        visitor: {
            Program(path, state) {
                const isUseClient = path.node.directives.some((directive) => directive.value.value === 'use client');
                // TODO: use server can be added to scopes inside of the file. https://github.com/facebook/react/blob/29fbf6f62625c4262035f931681c7b7822ca9843/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js#L55
                const isUseServer = path.node.directives.some((directive) => directive.value.value === 'use server');
                if (isUseClient && isUseServer) {
                    throw path.buildCodeFrameError("It's not possible to have both `use client` and `use server` directives in the same file.");
                }
                const filePath = state.file.opts.filename; //nodePath.relative(serverRoot, state.file.opts.filename);
                const outputKey = url_1.default.pathToFileURL(filePath).href;
                // File starts with "use client" directive.
                if (!isUseClient && !isUseServer) {
                    // Do nothing for code that isn't marked as a client component.
                    return;
                }
                // NOTE: This is unused but may be used for production manifests in the future
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
                    if (isUseClient) {
                        path.node.body = [];
                        path.node.directives = [];
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
                        // Inject the following:
                        // ;(() => {
                        //  const { registerServerReference } = require('react-server-dom-webpack/server');
                        //  if (typeof module.exports === 'function') registerServerReference(module.exports, moduleId, null);
                        //  else {
                        //    for (const key in module.exports) {
                        //      if (typeof module.exports[key] === 'function') {
                        //        registerServerReference(module.exports[key], moduleId, key);
                        //       }
                        //     }
                        //   }
                        // })()
                        const mmexp = t.memberExpression(t.callExpression(t.identifier('require'), [
                            t.stringLiteral('react-server-dom-webpack/server'),
                        ]), t.identifier('registerServerReference'));
                        // Create the loop body
                        const loopBody = t.blockStatement([
                            t.ifStatement(t.binaryExpression('===', t.unaryExpression('typeof', t.memberExpression(t.memberExpression(t.identifier('module'), t.identifier('exports')), t.identifier('key'), true)), t.stringLiteral('function')), t.expressionStatement(t.callExpression(mmexp, [
                                t.memberExpression(t.memberExpression(t.identifier('module'), t.identifier('exports')), t.identifier('key'), true),
                                t.stringLiteral(outputKey),
                                t.identifier('key'),
                            ]))),
                        ]);
                        // Create the for-in loop
                        const forInStatement = t.forInStatement(t.variableDeclaration('const', [t.variableDeclarator(t.identifier('key'))]), t.memberExpression(t.identifier('module'), t.identifier('exports')), loopBody);
                        path.pushContainer('body', t.expressionStatement(t.callExpression(t.arrowFunctionExpression([], t.blockStatement([
                            t.ifStatement(t.binaryExpression('===', t.unaryExpression('typeof', t.memberExpression(t.identifier('module'), t.identifier('exports'))), t.stringLiteral('function')), 
                            // registerServerReference(module.exports, moduleId, null);
                            t.blockStatement([
                                t.expressionStatement(t.callExpression(mmexp, [
                                    t.memberExpression(t.identifier('module'), t.identifier('exports')),
                                    t.stringLiteral(outputKey),
                                    t.nullLiteral(),
                                ])),
                            ]), 
                            // Else
                            t.blockStatement([
                                // for (const key in module.exports) {
                                //   if (typeof module.exports[key] === 'function') {
                                //     registerServerReference(module.exports[key], moduleId, key);
                                //   }
                                // }
                                forInStatement,
                            ])),
                        ])), [])));
                        //
                    }
                }
            },
        },
    };
}
exports.expoRouterServerComponentClientReferencesPlugin = expoRouterServerComponentClientReferencesPlugin;
