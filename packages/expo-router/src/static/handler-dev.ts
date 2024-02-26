import { ExpoResponse } from 'expo-router/server';
import { Readable, Writable } from 'node:stream';
// import { createServer as createViteServer } from 'vite';
// import viteReact from '@vitejs/plugin-react';

// import type { Config } from '../../config.js';
// import { resolveConfig } from '../config.js';
import React from 'react';

import { renderHtml } from './html-renderer';
import { decodeInput, hasStatusCode } from './utils';
import { Slot } from '../rsc/client';
import { joinPath, fileURLToFilePath, decodeFilePathFromAbsolute } from '../rsc/path.js';
import { endStream } from '../rsc/stream';

// import {
//   initializeWorker,
//   registerReloadCallback,
//   registerImportCallback,
//   registerModuleCallback,
//   renderRscWithWorker,
//   getSsrConfigWithWorker,
// } from './dev-worker-api.js';
// import { patchReactRefresh } from '../plugins/patch-react-refresh.js';
// import { rscIndexPlugin } from '../plugins/vite-plugin-rsc-index.js';
// import {
//   rscHmrPlugin,
//   hotImport,
//   moduleImport,
// } from '../plugins/vite-plugin-rsc-hmr.js';
// import { rscEnvPlugin } from '../plugins/vite-plugin-rsc-env.js';
// import type { BaseReq, BaseRes, Handler } from './types.js';
// import { mergeUserViteConfig } from '../utils/merge-vite-config.js';

export const CLIENT_MODULE_MAP = {
  react: require('react'),
  'rd-server': require('react-dom/server.edge'),
  'rsdw-client': require('react-server-dom-webpack/client.edge'),
  'waku-client': require('expo-router/build/rsc/client.js'),
};
export type CLIENT_MODULE_KEY = keyof typeof CLIENT_MODULE_MAP;

type Config = {
  basePath: string;
  rscPath: string;
  htmlHead: string;
  srcDir: string;
  mainJs: string;
  publicDir: string;
};

export function createHandler<Context, Req extends Request, Res extends Response>(options: {
  projectRoot: string;
  config: Config;
  ssr?: boolean;
  env?: Record<string, string>;
  //   unstable_prehook?: (req: Req, res: Res) => Context;
  //   unstable_posthook?: (req: Req, res: Res, ctx: Context) => void;
  ssrLoadModule: (fileURL: string) => Promise<unknown>;
  transformIndexHtml: (pathname: string, data: string) => Promise<string>;
  renderRscWithWorker: <Context>(props: {
    input: string;
    searchParamsString: string;
    method: 'GET' | 'POST';
    contentType: string | undefined;
    config: Config;
    context: unknown;
    stream?: ReadableStream | undefined;
    moduleIdCallback?: (id: string) => void;
  }) => Promise<readonly [ReadableStream, Context]>;
}) {
  const {
    ssr,
    // unstable_prehook, unstable_posthook
  } = options;
  //   if (!unstable_prehook && unstable_posthook) {
  //     throw new Error('prehook is required if posthook is provided');
  //   }
  (globalThis as any).__WAKU_PRIVATE_ENV__ = options.env || {};

  const loadServerFile = async (fileURL: string) => {
    return options.ssrLoadModule(fileURLToFilePath(fileURL));
  };

  const transformIndexHtml = async (pathname: string) => {
    // const vite = await vitePromise;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let headSent = false;
    return new TransformStream({
      transform(chunk, controller) {
        if (!(chunk instanceof Uint8Array)) {
          throw new Error('Unknown chunk type');
        }
        if (!headSent) {
          headSent = true;
          let data = decoder.decode(chunk);
          // FIXME without removing async, Vite will move it
          // to the proxy cache, which breaks __WAKU_PUSH__.
          data = data.replace(/<script type="module" async>/, '<script>');
          return new Promise<void>((resolve) => {
            options.transformIndexHtml(pathname, data).then((result) => {
              controller.enqueue(encoder.encode(result));
              resolve();
            });
          });
        }
        controller.enqueue(chunk);
      },
      flush() {
        if (!headSent) {
          throw new Error('head not yet sent');
        }
      },
    });
  };

  return async (req) => {
    // const res = new ExpoResponse();
    // // const basePrefix = options.config.basePath + options.config.rscPath + '/';
    // const handleError = (err: unknown) => {
    //   if (hasStatusCode(err)) {
    //     res.status
    //     res.status = err.statusCode;
    //   } else {
    //     console.info('Cannot render RSC', err);
    //     res.setStatus(500);
    //   }
    //   endStream(res.stream, String(err));
    // };
    let context: Context | undefined;
    // try {
    //   //   context = unstable_prehook?.(req, res);
    // } catch (e) {
    //   handleError(e);
    //   return;
    // }
    const { config } = options;
    // if (ssr) {
    // try {
    const readable = await renderHtml({
      config: config!,
      serverRoot: options.projectRoot,
      pathname: req.url.pathname,
      searchParams: req.url.searchParams,
      htmlHead: `${options.config.htmlHead}
<script src="${options.config.basePath}${options.config.srcDir}/${options.config.mainJs}" async type="module"></script>`,
      renderRscForHtml: async (input, searchParams) => {
        console.log('renderRscForHtml>', input, searchParams);
        const [readable, nextCtx] = await options.renderRscWithWorker({
          input,
          searchParamsString: searchParams?.toString() ?? '',
          method: 'GET',
          contentType: undefined,
          config: options.config,
          context,
        });
        context = nextCtx as Context;
        return readable;
      },
      async getSsrConfigForHtml(pathname, options) {
        console.log('getSsrConfigForHtml>', pathname, options);
        return {
          input: '',
          body: React.createElement(Slot, { id: 'index' }),
        };
      },
      //getSsrConfigWithWorker(config, pathname, options),
      // loadClientModule: (key) => CLIENT_MODULE_MAP[key],
      isDev: true,
      rootDir: options.projectRoot,
      loadServerFile,
    });
    const res = new ExpoResponse(readable, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });
    if (readable) {
      //   unstable_posthook?.(req, res, context as Context);
      // res.setHeader('content-type', 'text/html; charset=utf-8');
      readable.pipeThrough(await transformIndexHtml(req.url.pathname)).pipeTo(res.body);
    }
    return res;
    // } catch (e) {
    //   handleError(e);
    //   return;
    // }
    // }
    // if (req.url.pathname.startsWith(basePrefix)) {
    //   const { method, contentType } = req;
    //   if (method !== 'GET' && method !== 'POST') {
    //     throw new Error(`Unsupported method '${method}'`);
    //   }
    //   try {
    //     const input = decodeInput(req.url.pathname.slice(basePrefix.length));
    //     const [readable, nextCtx] = await options.renderRscWithWorker({
    //       input,
    //       searchParamsString: req.url.searchParams.toString(),
    //       method,
    //       contentType,
    //       config: options.config,
    //       context,
    //       stream: req.stream,
    //     });
    //     // unstable_posthook?.(req, res, nextCtx as Context);
    //     readable.pipeTo(res.stream);
    //   } catch (e) {
    //     handleError(e);
    //   }
    //   return;
    // }
    // throw new Error('Unhandled request: ' + req.url.pathname);
  };
}
