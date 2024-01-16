import { ConfigAPI, NodePath, types } from '@babel/core';
import { getConfig, ProjectConfig } from 'expo/config';
import nodePath from 'path';
import resolveFrom from 'resolve-from';
import url from 'url';

import {
  getIsServer,
  getExpoRouterAbsoluteAppRoot,
  getPlatform,
  getPossibleProjectRoot,
  getServerRoot,
  getIsDev,
} from './common';

const debug = require('debug')('expo:babel:router');

let config: undefined | ProjectConfig;

function getConfigMemo(projectRoot: string) {
  if (!config || process.env._EXPO_INTERNAL_TESTING) {
    config = getConfig(projectRoot);
  }
  return config;
}

function getExpoRouterImportMode(projectRoot: string, platform: string): string {
  const envVar = 'EXPO_ROUTER_IMPORT_MODE_' + platform.toUpperCase();
  if (process.env[envVar]) {
    return process.env[envVar]!;
  }
  const env = process.env.NODE_ENV || process.env.BABEL_ENV;

  const { exp } = getConfigMemo(projectRoot);

  let asyncRoutesSetting;

  if (exp.extra?.router?.asyncRoutes) {
    const asyncRoutes = exp.extra?.router?.asyncRoutes;
    if (typeof asyncRoutes === 'string') {
      asyncRoutesSetting = asyncRoutes;
    } else if (typeof asyncRoutes === 'object') {
      asyncRoutesSetting = asyncRoutes[platform] ?? asyncRoutes.default;
    }
  }

  let mode = [env, true].includes(asyncRoutesSetting) ? 'lazy' : 'sync';

  // TODO: Production bundle splitting

  if (env === 'production' && mode === 'lazy') {
    throw new Error(
      'Async routes are not supported in production yet. Set the `expo-router` Config Plugin prop `asyncRoutes` to `development`, `false`, or `undefined`.'
    );
  }

  // NOTE: This is a temporary workaround for static rendering on web.
  if (platform === 'web' && (exp.web || {}).output === 'static') {
    mode = 'sync';
  }

  // Development
  debug('Router import mode', mode);

  process.env[envVar] = mode;
  return mode;
}

function getExpoRouterAppRoot(projectRoot: string, appFolder: string) {
  // TODO: We should have cache invalidation if the expo-router/entry file location changes.
  const routerEntry = resolveFrom(projectRoot, 'expo-router/entry');

  const appRoot = nodePath.relative(nodePath.dirname(routerEntry), appFolder);

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
 * EXPO_ROUTER_IMPORT_MODE_IOS
 * EXPO_ROUTER_IMPORT_MODE_ANDROID
 * EXPO_ROUTER_IMPORT_MODE_WEB
 */
export function expoRouterBabelPlugin(api: ConfigAPI & { types: typeof types }) {
  const { types: t } = api;

  const platform = api.caller(getPlatform);
  const possibleProjectRoot = api.caller(getPossibleProjectRoot);
  const routerAbsoluteRoot = api.caller(getExpoRouterAbsoluteAppRoot);

  function isFirstInAssign(path: NodePath<types.MemberExpression>) {
    return types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
  }

  return {
    name: 'expo-router',
    visitor: {
      // Convert `process.env.EXPO_ROUTER_APP_ROOT` to a string literal
      MemberExpression(path: any, state: any) {
        const projectRoot = possibleProjectRoot || state.file.opts.root || '';

        if (path.get('object').matchesPattern('process.env')) {
          const key = path.toComputedKey();
          if (t.isStringLiteral(key) && !isFirstInAssign(path)) {
            // Used for log box on web.
            if (key.value.startsWith('EXPO_PROJECT_ROOT')) {
              path.replaceWith(t.stringLiteral(projectRoot));
            } else if (
              // TODO: Add cache invalidation.
              key.value.startsWith('EXPO_PUBLIC_USE_STATIC')
            ) {
              if (platform === 'web') {
                const isStatic =
                  process.env.EXPO_PUBLIC_USE_STATIC === 'true' ||
                  process.env.EXPO_PUBLIC_USE_STATIC === '1';
                path.replaceWith(t.booleanLiteral(isStatic));
              } else {
                path.replaceWith(t.booleanLiteral(false));
              }
            }

            if (
              // Skip loading the app root in tests.
              // This is handled by the testing-library utils
              process.env.NODE_ENV !== 'test'
            ) {
              if (key.value.startsWith('EXPO_ROUTER_ABS_APP_ROOT')) {
                path.replaceWith(t.stringLiteral(routerAbsoluteRoot));
              } else if (key.value.startsWith('EXPO_ROUTER_APP_ROOT')) {
                path.replaceWith(
                  t.stringLiteral(getExpoRouterAppRoot(possibleProjectRoot, routerAbsoluteRoot))
                );
              }
            }
          }
        }

        if (
          !t.isIdentifier(path.node.object, { name: 'process' }) ||
          !t.isIdentifier(path.node.property, { name: 'env' })
        ) {
          return;
        }

        const parent = path.parentPath;

        if (!t.isMemberExpression(parent.node)) {
          return;
        }

        if (
          // Expose the app route import mode.
          platform &&
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_ROUTER_IMPORT_MODE_' + platform.toUpperCase(),
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(getExpoRouterImportMode(projectRoot, platform)));
        }
      },
    },
  };
}

export function expoRouterServerComponentClientReferencesPlugin(
  api: ConfigAPI & { types: typeof types }
) {
  const { types: t } = api;

  // @ts-expect-error
  const isServer = api.caller((caller) => caller?.isReactServer ?? false);
  const isDev = api.caller(getIsDev);
  const mode = isDev ? 'development' : 'production';
  const serverRoot = api.caller(getServerRoot) as string;
  return {
    name: 'expo-rsc-client-references',
    visitor: {
      // Fast cheap react optimizer
      // IfStatement(path, state) {
      //   const test = path.node.test;

      //   if (!state.file.opts.filename?.includes('react')) {
      //     return;
      //   }

      //   // Check if the test is a strict equality comparison involving process.env.NODE_ENV
      //   if (
      //     t.isBinaryExpression(test) &&
      //     test.operator === '===' &&
      //     t.isMemberExpression(test.left) &&
      //     t.isIdentifier(test.left.object, { name: 'process' }) &&
      //     t.isIdentifier(test.left.property, { name: 'env' }) &&
      //     t.isMemberExpression(test.left.object) &&
      //     t.isIdentifier(test.left.object.property, { name: 'NODE_ENV' }) &&
      //     t.isStringLiteral(test.right)
      //   ) {
      //     const envValue = test.right.value;

      //     // If the environment matches the input transform environment, replace the if statement
      //     if (envValue === mode) {
      //       if (isDev) {
      //         if (path.node.alternate) {
      //           path.replaceWith(path.node.alternate);
      //         } else {
      //           path.remove();
      //         }
      //       } else {
      //         path.replaceWith(path.node.consequent);
      //       }
      //     } else {
      //       // If it's the other condition, remove the if statement
      //       path.remove();
      //     }
      //   }
      // },

      Program(path: any, state: any) {
        const isUseClient = path.node.directives.some(
          (directive: any) => directive.value.value === 'use client'
        );
        // File starts with "use client" directive.
        if (!isUseClient) {
          // Do nothing for code that isn't marked as a client component.
          return;
        }

        const filePath = state.file.opts.filename; //nodePath.relative(serverRoot, state.file.opts.filename);
        const outputKey = url.pathToFileURL(filePath).href;

        // Collect a list of all the exports in the file.
        const exports: string[] = [];
        path.traverse({
          ExportNamedDeclaration(path: any) {
            const { node } = path;
            if (node.declaration) {
              if (t.isVariableDeclaration(node.declaration)) {
                exports.push(...node.declaration.declarations.map((decl: any) => decl.id.name));
              } else {
                exports.push(node.declaration.id.name);
              }
            } else if (node.specifiers) {
              exports.push(...node.specifiers.map((spec: any) => spec.exported.name));
            }
          },
          ExportDefaultDeclaration(path: any) {
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
            path.pushContainer(
              'body',
              t.expressionStatement(
                t.callExpression(t.identifier('console.log'), [
                  t.stringLiteral('Loaded client module proxy for'),
                  t.stringLiteral(outputKey),
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral('react-server-dom-webpack/server'),
                  ]),
                ])
              )
            );

            // Inject the following:
            //
            // module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(outputKey)
            path.pushContainer(
              'body',
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.memberExpression(t.identifier('module'), t.identifier('exports')),
                  t.callExpression(
                    t.memberExpression(
                      t.callExpression(t.identifier('require'), [
                        t.stringLiteral('react-server-dom-webpack/server'),
                      ]),
                      t.identifier('createClientModuleProxy')
                    ),
                    [t.stringLiteral(outputKey)]
                  )
                )
              )
            );

            return;
          } else {
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
