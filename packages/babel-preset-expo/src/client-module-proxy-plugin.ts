import { ConfigAPI, types } from '@babel/core';
import url from 'url';

import { getIsDev, getServerRoot } from './common';

const debug = require('debug')('expo:babel:rsc');

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
      Program(path: any, state: any) {
        const isUseClient = path.node.directives.some(
          (directive: any) => directive.value.value === 'use client'
        );
        // TODO: use server can be added to scopes inside of the file. https://github.com/facebook/react/blob/29fbf6f62625c4262035f931681c7b7822ca9843/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js#L55
        const isUseServer = path.node.directives.some(
          (directive: any) => directive.value.value === 'use server'
        );

        if (isUseClient && isUseServer) {
          throw path.buildCodeFrameError(
            'Cannot use both "use client" and "use server" directives in the same file'
          );
        }

        const filePath = state.file.opts.filename; //nodePath.relative(serverRoot, state.file.opts.filename);
        const outputKey = url.pathToFileURL(filePath).href;

        // File starts with "use client" directive.
        if (!isUseClient && !isUseServer) {
          // Do nothing for code that isn't marked as a client component.
          return;
        }

        // NOTE: This is unused but may be used for production manifests in the future
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
                    ]
                  )
                )
              )
            );
          } else {
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

            const mmexp = t.memberExpression(
              t.callExpression(t.identifier('require'), [
                t.stringLiteral('react-server-dom-webpack/server'),
              ]),
              t.identifier('registerServerReference')
            );

            // Create the loop body
            const loopBody = t.blockStatement([
              t.ifStatement(
                t.binaryExpression(
                  '===',
                  t.unaryExpression(
                    'typeof',
                    t.memberExpression(
                      t.memberExpression(t.identifier('module'), t.identifier('exports')),
                      t.identifier('key'),
                      true
                    )
                  ),
                  t.stringLiteral('function')
                ),
                t.expressionStatement(
                  t.callExpression(mmexp, [
                    t.memberExpression(
                      t.memberExpression(t.identifier('module'), t.identifier('exports')),
                      t.identifier('key'),
                      true
                    ),
                    t.stringLiteral(outputKey),
                    t.identifier('key'),
                  ])
                )
              ),
            ]);

            // Create the for-in loop
            const forInStatement = t.forInStatement(
              t.variableDeclaration('const', [t.variableDeclarator(t.identifier('key'))]),
              t.memberExpression(t.identifier('module'), t.identifier('exports')),
              loopBody
            );

            path.pushContainer(
              'body',
              t.expressionStatement(
                t.callExpression(
                  t.arrowFunctionExpression(
                    [],

                    t.blockStatement([
                      t.ifStatement(
                        t.binaryExpression(
                          '===',
                          t.unaryExpression(
                            'typeof',
                            t.memberExpression(t.identifier('module'), t.identifier('exports'))
                          ),
                          t.stringLiteral('function')
                        ),
                        // registerServerReference(module.exports, moduleId, null);
                        t.blockStatement([
                          t.expressionStatement(
                            t.callExpression(mmexp, [
                              t.memberExpression(t.identifier('module'), t.identifier('exports')),
                              t.stringLiteral(outputKey),
                              t.nullLiteral(),
                            ])
                          ),
                        ]),
                        // Else
                        t.blockStatement([
                          // for (const key in module.exports) {
                          //   if (typeof module.exports[key] === 'function') {
                          //     registerServerReference(module.exports[key], moduleId, key);
                          //   }
                          // }
                          forInStatement,
                        ])
                      ),
                    ])
                  ),
                  []
                )
              )
            );

            //
          }
        }
      },
    },
  };
}
