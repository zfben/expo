/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readableStreamToString } from '@remix-run/node/dist/stream';
import path from 'path';
import chalk from 'chalk';
import React from 'react';
import type { ReactNode } from 'react';
import { renderToReadableStream, decodeReply } from 'react-server-dom-webpack/server.edge';

import { ctx } from '../../_ctx';
import OS from '../../os';
import { getRoutes } from '../getRoutes';
import { getServerManifest } from '../getServerManifest';

// Importing this from the root will cause a second copy of source-map-support to be loaded which will break stack traces.

const debug = require('debug')('expo:rsc');

export interface RenderContext<T = unknown> {
  rerender: (input: string, searchParams?: URLSearchParams) => void;
  context: T;
}

// NOTE: MUST MATCH THE IMPL IN ExpoMetroConfig.ts
function stringToHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export const fileURLToFilePath = (fileURL: string) => {
  if (!fileURL.startsWith('file://')) {
    throw new Error('Not a file URL');
  }
  return decodeURI(fileURL.slice('file://'.length));
};

export async function getRouteNodeForPathname(pathname: string) {
  // TODO: Populate this with Expo Router results.

  const routes = getRoutes(ctx, {
    importMode: 'lazy',
  });
  console.log('serverManifest.htmlRoutes', routes);
  const serverManifest = await getServerManifest(routes);

  console.log('serverManifest.htmlRoutes', serverManifest.htmlRoutes);
  const matchedNode = serverManifest.htmlRoutes.find((file) =>
    new RegExp(file.namedRegex).test(pathname)
  );
  if (!matchedNode) {
    throw new Error(
      'No matching route found for: ' + pathname + '. Expected: ' + ctx.keys().join(', ')
    );
  }

  const contextKey = matchedNode.file;

  if (!ctx.keys().includes(contextKey)) {
    throw new Error(
      'Failed to find route: ' + contextKey + '. Expected one of: ' + ctx.keys().join(', ')
    );
  }

  return matchedNode;
}

export async function renderRouteWithContextKey(
  contextKey: string,
  props: Record<string, unknown>
) {
  const { default: Component } = await ctx(contextKey);

  if (!Component) {
    throw new Error('No default export found for: ' + contextKey);
  }

  return React.createElement(Component, props);
}

export async function renderToPipeableStream(
  {
    mode,
    elements,
    isExporting,
    url,
    serverUrl,
    serverRoot,
    method,
    input,
    body,
    contentType,
    customImport,
    onReload,
    moduleIdCallback,
  }: {
    elements: Record<string, ReactNode>;
    isExporting: boolean;
    mode: string;
    serverRoot: string;
    url: URL;
    serverUrl: URL;
    method: string;
    input: string;
    body?: ReadableStream | undefined;
    contentType?: string | undefined;
    customImport: (file: string) => Promise<any>;
    onReload: () => void;
    moduleIdCallback?: (module: {
      id: string;
      chunks: string[];
      name: string;
      async: boolean;
    }) => void;
  }
  // moduleMap: WebpackManifest
): Promise<ReadableStream> {
  if (!isExporting) {
    if (process.env.NODE_ENV === 'development') {
      const HMRClient = require('@expo/metro-runtime/build/HMRClientRSC')
        .default as typeof import('@expo/metro-runtime/build/HMRClientRSC').default;
      const { createNodeFastRefresh } =
        require('@expo/metro-runtime/build/nodeFastRefresh') as typeof import('@expo/metro-runtime/build/nodeFastRefresh');

      // Make the URL for this file accessible so we can register it as an HMR client entry for RSC HMR.
      globalThis.__DEV_SERVER_URL__ = serverUrl;
      // Make the WebSocket constructor available to RSC HMR.
      global.WebSocket = require('ws').WebSocket;
      createNodeFastRefresh({
        onReload,
      });

      HMRClient.setup({
        isEnabled: true,
        onError(error) {
          // Do nothing and reload.
          // TODO: If we handle this better it could result in faster error feedback.
          onReload();
        },
      });
    }
  }

  if (!isExporting) {
    url.searchParams.set('modulesOnly', 'true');
    url.searchParams.set('runModule', 'false');

    // TODO: Maybe add a new param to execute and return the module exports.
  }

  const resolveClientEntry = (
    file: string // filePath or fileURL
  ) => {
    if (!isExporting) {
      const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
      const metroOpaqueId = stringToHash(filePath);
      const relativeFilePath = path.relative(serverRoot, filePath);
      // TODO: May need to remove the original extension.
      url.pathname = relativeFilePath + '.bundle';
      // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
      url.hash = String(metroOpaqueId);

      // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
      const id = url.pathname + url.search + url.hash;
      return { id, url: id };
    } else {
      // if (!file.startsWith('@id/')) {
      //   throw new Error('Unexpected client entry in PRD: ' + file);
      // }
      // url.pathname = file.slice('@id/'.length);

      // TODO: This should be different for prod
      const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
      const metroOpaqueId = stringToHash(filePath);
      const relativeFilePath = path.relative(serverRoot, filePath);
      // TODO: May need to remove the original extension.
      url.pathname = relativeFilePath;
      // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
      url.hash = String(metroOpaqueId);

      // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
      const id = '/' + url.hash;
      return { id, url: url.pathname + url.search + url.hash };
    }
  };

  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        debug('Get manifest entry:', encodedId);
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
        const entry = resolveClientEntry(file);
        debug('Returning server module:', entry, 'for', encodedId);
        moduleIdCallback?.({ id: entry.url, chunks: [entry.url], name, async: true });

        return { id: entry.id, chunks: [entry.id], name, async: true };
      },
    }
  );

  if (method === 'POST') {
    const rsfId = decodeURIComponent(decodeInput(input));
    let args: unknown[] = [];
    let bodyStr = '';
    if (body) {
      if (body instanceof ReadableStream) {
        bodyStr = await readableStreamToString(body);
      } else if (typeof body === 'string') {
        bodyStr = body;
      } else {
        throw new Error('Unexpected body type: ' + body);
      }
    }
    if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
      // XXX This doesn't support streaming unlike busboy
      const formData = parseFormData(bodyStr, contentType);
      args = await decodeReply(formData);
    } else if (bodyStr) {
      args = await decodeReply(bodyStr);
    }
    const [fileId, name] = rsfId.split('#') as [string, string];
    let mod: any;
    if (!isExporting) {
      // console.log('Loading module:', fileId, name);
      mod = await customImport(resolveClientEntry(fileId).url);
      // console.log('Loaded module:', mod);
    } else {
      // if (!fileId.startsWith('@id/')) {
      //   throw new Error('Unexpected server entry in PRD');
      // }
      // mod = await loadModule!(fileId.slice('@id/'.length));
    }
    const fn = mod[name] || mod;
    // console.log('Target function:', fn);

    const elements: Promise<Record<string, ReactNode>> = Promise.resolve({});
    let rendered = false;

    // TODO: Define context
    const context = {};
    const rerender = (input: string, searchParams = new URLSearchParams()) => {
      if (rendered) {
        throw new Error('already rendered');
      }
      const renderContext: RenderContext = { rerender, context };
      throw new Error('TODO: Rerender');
      // elements = Promise.all([elements, render(renderContext, input, searchParams)]).then(
      //   ([oldElements, newElements]) => ({
      //     ...oldElements,
      //     ...newElements,
      //   })
      // );
    };
    const renderContext: RenderContext = { rerender, context };
    const data = await fn.apply(renderContext, args);
    const resolvedElements = await elements;
    rendered = true;
    return renderToReadableStream({ ...resolvedElements, _value: data }, bundlerConfig, {
      onPostpone(reason) {},
    });
  }

  //   moduleMap

  // TODO: Populate this with Expo Router results.
  // const renderEntries = async (input: string) => {
  //   const routes = getRoutes(ctx, {
  //     importMode: 'lazy',
  //   });
  //   console.log('serverManifest.htmlRoutes', routes);
  //   const serverManifest = await getServerManifest(routes);

  //   console.log('serverManifest.htmlRoutes', serverManifest.htmlRoutes);
  //   const matchedNode = serverManifest.htmlRoutes.find((file) =>
  //     new RegExp(file.namedRegex).test(input)
  //   );
  //   if (!matchedNode) {
  //     throw new Error(
  //       'No matching route found for: ' + input + '. Expected: ' + ctx.keys().join(', ')
  //     );
  //   }

  //   const contextKey = matchedNode.file;

  //   if (!ctx.keys().includes(contextKey)) {
  //     throw new Error(
  //       'Failed to find route: ' + contextKey + '. Expected one of: ' + ctx.keys().join(', ')
  //     );
  //   }

  //   const { default: Component } = await ctx(contextKey);

  //   if (!Component) {
  //     throw new Error('No default export found for: ' + contextKey);
  //   }

  //   console.log('Render entry>', contextKey);
  //   // TODO: Sanitize input and use it to select a component to render.
  //   return React.createElement(Component, props);
  // };

  // const render = async (
  //   renderContext: RenderContext,
  //   input: string,
  //   searchParams: URLSearchParams
  // ) => {
  //   const elements = await renderEntries.call(renderContext, input, searchParams);
  //   if (elements === null) {
  //     const err = new Error('No function component found');
  //     (err as any).statusCode = 404; // HACK our convention for NotFound
  //     throw err;
  //   }
  //   if (Object.keys(elements).some((key) => key.startsWith('_'))) {
  //     throw new Error('"_" prefix is reserved');
  //   }
  //   return elements;
  // };

  // const elements = await render({}, input, url.searchParams);
  console.log('Elements:', elements, input);
  const stream = renderToReadableStream(elements, bundlerConfig);

  // Logging is very useful for native platforms where the network tab isn't always available.
  if (debug.enabled) {
    return withDebugLogging(stream);
  }

  return stream;
}

function withDebugLogging(stream: ReadableStream) {
  const textDecoder = new TextDecoder();

  // Wrap the stream and log chunks to the terminal.
  return new ReadableStream({
    start(controller) {
      stream.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chalk`{dim ${OS} [rsc]}`, textDecoder.decode(chunk));
            controller.enqueue(chunk);
          },
          close() {
            controller.close();
          },
          abort(reason) {
            controller.error(reason);
          },
        })
      );
    },
  });
}

// TODO is this correct? better to use a library?
const parseFormData = (body: string, contentType: string) => {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  const formData = new FormData();
  for (const part of parts) {
    if (part.trim() === '' || part === '--') continue;
    const [rawHeaders, content] = part.split('\r\n\r\n', 2);
    const headers = rawHeaders!.split('\r\n').reduce(
      (acc, currentHeader) => {
        const [key, value] = currentHeader.split(': ');
        acc[key!.toLowerCase()] = value!;
        return acc;
      },
      {} as Record<string, string>
    );
    const contentDisposition = headers['content-disposition'];
    const nameMatch = /name="([^"]+)"/.exec(contentDisposition!);
    const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition!);
    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        const filename = filenameMatch[1];
        const type = headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([content!], { type });
        formData.append(name!, blob, filename);
      } else {
        formData.append(name!, content!.trim());
      }
    }
  }
  return formData;
};

const decodeInput = (encodedInput: string) => {
  if (encodedInput === 'index.txt') {
    return '';
  }
  if (encodedInput?.endsWith('.txt')) {
    return encodedInput.slice(0, -'.txt'.length);
  }
  const err = new Error('Invalid encoded input');
  (err as any).statusCode = 400;
  throw err;
};
