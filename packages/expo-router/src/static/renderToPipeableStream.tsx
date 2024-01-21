/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import path from 'path';
import { ctx } from '../../_ctx';

type WebpackManifestSubType = {
  // "id": "./src/index.client.js",
  id: string;
  // ['main']
  chunks: string[];
  // "name": ""
  name: string;
};
// type WebpackManifest = {
//   // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/index.client.js"
//   [filepath: string]: {
//     // "*"
//     [name: string]: WebpackManifestSubType;
//   };
// };

// NOTE: MUST MATCH THE IMPL IN ExpoMetroConfig.ts
function stringToHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export const fileURLToFilePath = (fileURL: string) => {
  if (!fileURL.startsWith('file://')) {
    throw new Error('Not a file URL');
  }
  return decodeURI(fileURL.slice('file://'.length));
};

export async function renderToPipeableStream(
  { $$route: route, ...props }: { $$route: string },
  { mode, url, serverRoot }: { mode: string; serverRoot: string; url: URL }
  // moduleMap: WebpackManifest
) {
  const { renderToReadableStream } = require('react-server-dom-webpack/server.edge');

  if (!ctx.keys().includes(route)) {
    throw new Error(
      'Failed to find route: ' + route + '. Expected one of: ' + ctx.keys().join(', ')
    );
  }

  const { default: Component } = await ctx(route);
  console.log('Initial component', Component, route);
  // const node = getNodeFinder()(route);

  // if (node?._route) {

  // const { default: Component } = node._route.loadRoute();
  // const rsc = renderToPipeableStream(
  //   // TODO: Does this support async?
  //   // <Component {...props} />,
  //   React.createElement(Component, props),
  //   moduleMap
  // );

  // return await pipeTo(rsc.pipe);

  // method === 'GET'
  // const renderContext: RenderContext = {
  //   rerender: () => {
  //     throw new Error('Cannot rerender');
  //   },
  //   context,
  // };

  const isDev = mode === 'development';

  if (isDev) {
    url.searchParams.set('modulesOnly', 'true');
    url.searchParams.set('runModule', 'false');

    // TODO: Maybe add a new param to execute and return the module exports.
  }

  const resolveClientEntry = (
    file: string // filePath or fileURL
  ) => {
    if (isDev) {
      const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
      const metroOpaqueId = stringToHash(filePath);
      const relativeFilePath = path.relative(serverRoot, filePath);
      // TODO: May need to remove the original extension.
      url.pathname = relativeFilePath + '.bundle';
      // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
      url.hash = String(metroOpaqueId);

      // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
      return url.pathname + url.search + url.hash;
    } else {
      if (!file.startsWith('@id/')) {
        throw new Error('Unexpected client entry in PRD');
      }
      url.pathname = file.slice('@id/'.length);
    }
    return url.toString();
  };

  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        console.log('Get manifest entry:', encodedId);
        // const [file, name] = encodedId.split('#') as [string, string];
        // return moduleMap[encodedId];

        const [
          // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
          file,
          // The name of the import (e.g. "default" or "")
          name,
        ] = encodedId.split('#') as [string, string];

        // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
        // This is similar to how we handle lazy bundling.
        const id = resolveClientEntry(file);
        console.log('Returning server module:', id, 'for', encodedId);
        // moduleIdCallback?.(id);
        return { id, chunks: [id], name, async: true };
      },
    }
  );

  //   moduleMap

  const elements = React.createElement(Component, props);
  return renderToReadableStream(elements, bundlerConfig);

  // return rsc.pipe;
  // }

  // throw new Error('Failed to render server component at: ' + route);
}

import { Writable } from 'stream';

async function pipeTo(pipe) {
  const rscStream = new ReadableStream({
    start(controller) {
      pipe(
        new Writable({
          write(chunk, encoding, callback) {
            controller.enqueue(chunk);
            callback();
          },
          destroy(error, callback) {
            if (error) {
              controller.error(error);
            } else {
              controller.close();
            }
            callback(error);
          },
        })
      );
    },
  });

  const res = await rscStream.getReader().read();
  return res.value.toString().trim();
}
