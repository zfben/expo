/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readableStreamToString } from '@remix-run/node/dist/stream';
import chalk from 'chalk';
import type { ReactNode } from 'react';
import { renderToReadableStream, decodeReply } from 'react-server-dom-webpack/server.edge';

import { ctx } from '../../_ctx';
import OS from '../../os';
import { getRoutes } from '../getRoutes';
import { getServerManifest } from '../getServerManifest';
// import { SHOULD_SKIP_ID, ShouldSkip } from '../rsc/router/common';
import { EntriesDev, EntriesPrd } from '../rsc/server';

// Importing this from the root will cause a second copy of source-map-support to be loaded which will break stack traces.

const debug = require('debug')('expo:rsc');

export interface RenderContext<T = unknown> {
  rerender: (input: string, searchParams?: URLSearchParams) => void;
  context: T;
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

type ResolvedConfig = any;

export async function renderRsc(
  opts: {
    // TODO:
    config: ResolvedConfig;

    // Done
    input: string;
    searchParams: URLSearchParams;
    method: 'GET' | 'POST';
    context: unknown;
    body?: ReadableStream | undefined;
    contentType?: string | undefined;
    moduleIdCallback?: (module: {
      id: string;
      chunks: string[];
      name: string;
      async: boolean;
    }) => void;

    // Others
    // serverRoot: string;
    // serverUrl: URL;
    // onReload: () => void;
    resolveClientEntry: (id: string) => { id: string; url: string };
  } & (
    | { isExporting: true; entries: EntriesPrd }
    | {
        isExporting: false;
        entries: EntriesDev;
        customImport: (fileURL: string) => Promise<unknown>;
      }
  )

  // moduleMap: WebpackManifest
): Promise<ReadableStream> {
  // if (!isExporting) {
  //   if (process.env.NODE_ENV === 'development') {
  //     const HMRClient = require('@expo/metro-runtime/build/HMRClientRSC')
  //       .default as typeof import('@expo/metro-runtime/build/HMRClientRSC').default;
  //     const { createNodeFastRefresh } =
  //       require('@expo/metro-runtime/build/nodeFastRefresh') as typeof import('@expo/metro-runtime/build/nodeFastRefresh');

  //     // Make the URL for this file accessible so we can register it as an HMR client entry for RSC HMR.
  //     globalThis.__DEV_SERVER_URL__ = serverUrl;
  //     // Make the WebSocket constructor available to RSC HMR.
  //     global.WebSocket = require('ws').WebSocket;
  //     createNodeFastRefresh({
  //       onReload,
  //     });

  //     HMRClient.setup({
  //       isEnabled: true,
  //       onError(error) {
  //         // Do nothing and reload.
  //         // TODO: If we handle this better it could result in faster error feedback.
  //         onReload();
  //       },
  //     });
  //   }
  // }

  const {
    entries,
    // elements,
    searchParams,
    // isExporting,
    // url,
    // serverRoot,
    method,
    input,
    body,
    contentType,

    // serverUrl,
    // onReload,
    moduleIdCallback,
    context,
  } = opts;

  const {
    default: { renderEntries },
    loadModule,
  } = entries as (EntriesDev & { loadModule: undefined }) | EntriesPrd;

  const resolveClientEntry = opts.resolveClientEntry;

  const render = async (
    renderContext: RenderContext,
    input: string,
    searchParams: URLSearchParams
  ) => {
    const elements = await renderEntries.call(renderContext, input, searchParams);
    if (elements === null) {
      const err = new Error('No function component found');
      (err as any).statusCode = 404; // HACK our convention for NotFound
      throw err;
    }
    if (Object.keys(elements).some((key) => key.startsWith('_'))) {
      throw new Error('"_" prefix is reserved');
    }
    return elements;
  };

  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        // console.log('Get manifest entry:', encodedId);
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
        moduleIdCallback?.({ id: id.url, chunks: [id.url], name, async: true });
        return { id: id.id, chunks: [id.id], name, async: true };
      },
    }
  );

  if (method === 'POST') {
    // TODO(Bacon): Fix Server action ID generation
    const rsfId = decodeURIComponent(input);
    // const rsfId = decodeURIComponent(decodeInput(input));
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
    if (opts.isExporting === false) {
      // console.log('Loading module:', fileId, name);
      mod = await opts.customImport(resolveClientEntry(fileId).url);
      // console.log('Loaded module:', mod);
    } else {
      throw new Error('TODO: Make this work with Metro');
      if (!fileId.startsWith('@id/')) {
        throw new Error('Unexpected server entry in PRD');
      }
      mod = await loadModule!(fileId.slice('@id/'.length));
    }
    const fn = mod[name] || mod;
    // console.log('Target function:', fn);

    let elements: Promise<Record<string, ReactNode>> = Promise.resolve({});
    let rendered = false;

    // TODO: Define context
    // const context = {};
    const rerender = (input: string, searchParams = new URLSearchParams()) => {
      if (rendered) {
        throw new Error('already rendered');
      }
      const renderContext: RenderContext = { rerender, context };
      elements = Promise.all([elements, render(renderContext, input, searchParams)]).then(
        ([oldElements, newElements]) => ({
          ...oldElements,
          ...newElements,
        })
      );
    };
    const renderContext: RenderContext = { rerender, context };
    const data = await fn.apply(renderContext, args);
    const resolvedElements = await elements;
    rendered = true;
    return renderToReadableStream({ ...resolvedElements, _value: data }, bundlerConfig);
  }

  // method === 'GET'
  const renderContext: RenderContext = {
    rerender: () => {
      throw new Error('Cannot rerender');
    },
    context,
  };
  const elements = await render(renderContext, input, searchParams);

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
  console.log('> decodeInput:', encodedInput);
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

// TODO: Implement this in production exports.
export async function getBuildConfig(opts: { config: ResolvedConfig; entries: EntriesPrd }) {
  const { config, entries } = opts;

  const {
    default: { getBuildConfig },
  } = entries;
  if (!getBuildConfig) {
    console.warn(
      "getBuildConfig is undefined. It's recommended for optimization and sometimes required."
    );
    return [];
  }

  const unstable_collectClientModules = async (input: string): Promise<string[]> => {
    const idSet = new Set<string>();
    const readable = await renderRsc({
      config,
      input,
      searchParams: new URLSearchParams(),
      method: 'GET',
      context: null,
      moduleIdCallback: ({ id }) => idSet.add(id),
      isExporting: true,
      resolveClientEntry: (id) => {
        throw new Error('TODO: Implement resolveClientEntry');
      },
      entries,
    });
    await new Promise<void>((resolve, reject) => {
      const writable = new WritableStream({
        close() {
          resolve();
        },
        abort(reason) {
          reject(reason);
        },
      });
      readable.pipeTo(writable);
    });
    return Array.from(idSet);
  };

  const output = await getBuildConfig(unstable_collectClientModules);
  return output;
}
