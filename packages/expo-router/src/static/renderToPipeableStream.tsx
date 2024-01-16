/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { ctx } from '../../_ctx';

type WebpackManifestSubType = {
  // "id": "./src/index.client.js",
  id: string;
  // ['main']
  chunks: string[];
  // "name": ""
  name: string;
};
type WebpackManifest = {
  // "file:///Users/evanbacon/Documents/GitHub/server-components-demo/src/index.client.js"
  [filepath: string]: {
    // "*"
    [name: string]: WebpackManifestSubType;
  };
};

export async function renderToPipeableStream(
  { $$route: route, ...props },
  moduleMap: WebpackManifest
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

  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        console.log('Get manifest entry:', encodedId);
        return moduleMap[encodedId];
        // const [file, name] = encodedId.split('#') as [string, string];
        // const id = resolveClientEntry(file, config, isDev);
        // moduleIdCallback?.(id);
        // return { id, chunks: [id], name, async: true };
      },
    },
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
