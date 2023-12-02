/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';

import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import * as Font from 'expo-font/build/server';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { AppRegistry } from 'react-native-web';

import { getRootComponent } from './getRootComponent';
import { ctx } from '../../_ctx';
import { ExpoRoot } from '../ExpoRoot';
import { getNavigationConfig } from '../getLinkingConfig';
import { getRoutes } from '../getRoutes';
import { getServerManifest } from '../getServerManifest';
import { Head } from '../head';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';

const debug = require('debug')('expo:router:renderStaticContent');

AppRegistry.registerComponent('App', () => ExpoRoot);

/** Get the linking manifest from a Node.js process. */
async function getManifest(options: Parameters<typeof getRoutes>[1] = {}) {
  const routeTree = getRoutes(ctx, { preserveApiRoutes: true, ...options });

  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getNavigationConfig(routeTree);
}

/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `expo-router/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
async function getBuildTimeServerManifestAsync(options: Parameters<typeof getRoutes>[1] = {}) {
  const routeTree = getRoutes(ctx, {
    ...options,
  });

  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getServerManifest(routeTree);
}

function resetReactNavigationContexts() {
  // https://github.com/expo/router/discussions/588
  // https://github.com/react-navigation/react-navigation/blob/9fe34b445fcb86e5666f61e144007d7540f014fa/packages/elements/src/getNamedContext.tsx#LL3C1-L4C1

  // React Navigation is storing providers in a global, this is fine for the first static render
  // but subsequent static renders of Stack or Tabs will cause React to throw a warning. To prevent this warning, we'll reset the globals before rendering.
  const contexts = '__react_navigation__elements_contexts';
  global[contexts] = new Map<string, React.Context<any>>();
}

export function getStaticContent(location: URL): string {
  const headContext: { helmet?: any } = {};

  const ref = React.createRef<ServerContainerRef>();

  const {
    // NOTE: The `element` that's returned adds two extra Views and
    // the seemingly unused `RootTagContext.Provider`.
    element,
    getStyleElement,
  } = AppRegistry.getApplication('App', {
    initialProps: {
      location,
      context: ctx,
      wrapper: ({ children }) => (
        <Root>
          <div id="root">{children}</div>
        </Root>
      ),
    },
  });

  const Root = getRootComponent();

  // Clear any existing static resources from the global scope to attempt to prevent leaking between pages.
  // This could break if pages are rendered in parallel or if fonts are loaded outside of the React tree
  Font.resetServerContext();

  // This MUST be run before `ReactDOMServer.renderToString` to prevent
  // "Warning: Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
  resetReactNavigationContexts();

  const html = ReactDOMServer.renderToString(
    <Head.Provider context={headContext}>
      <ServerContainer ref={ref}>{element}</ServerContainer>
    </Head.Provider>
  );

  // Eval the CSS after the HTML is rendered so that the CSS is in the same order
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  let output = mixHeadComponentsWithStaticResults(headContext.helmet, html);

  output = output.replace('</head>', `${css}</head>`);

  const fonts = Font.getServerResources();
  debug(`Pushing static fonts: (count: ${fonts.length})`, fonts);
  // debug('Push static fonts:', fonts)
  // Inject static fonts loaded with expo-font
  output = output.replace('</head>', `${fonts.join('')}</head>`);

  return '<!DOCTYPE html>' + output;
}

function mixHeadComponentsWithStaticResults(helmet: any, html: string) {
  // Head components
  for (const key of ['title', 'priority', 'meta', 'link', 'script', 'style'].reverse()) {
    const result = helmet?.[key]?.toString();
    if (result) {
      html = html.replace('<head>', `<head>${result}`);
    }
  }

  // attributes
  html = html.replace('<html ', `<html ${helmet?.htmlAttributes.toString()} `);
  html = html.replace('<body ', `<body ${helmet?.bodyAttributes.toString()} `);

  return html;
}

// const {
//   renderToPipeableStream: renderToPipeableStreamUpstream,
// } = require('react-server-dom-webpack/writer');

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

import findFocusedRoute from '@react-navigation/core/src/findFocusedRoute';

import { getReactNavigationConfig } from '../getReactNavigationConfig';
import getStateFromPath from '../fork/getStateFromPath';

function getNodeFinder(): (path: string) => null | ReturnType<typeof findFocusedRoute> {
  const routeTree = getRoutes(ctx);

  if (!routeTree) {
    return () => null;
  }
  const config = {
    initialRouteName: routeTree.initialRouteName,
    screens: getReactNavigationConfig(routeTree, false),
  };

  return (path: string) => {
    const state = getStateFromPath(path, config);
    if (state) {
      return findFocusedRoute(state);
    }
    return null;
  };
}

export async function renderToPipeableStream(
  { $$route: route, ...props },
  moduleMap: WebpackManifest
) {
  const { renderToPipeableStream } = require('react-server-dom-webpack/server');

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
  const rsc = renderToPipeableStream(
    // TODO: Does this support async?
    // <Component {...props} />,
    React.createElement(Component, props),
    moduleMap
  );

  return rsc.pipe;
  // }

  // throw new Error('Failed to render server component at: ' + route);
}

// Re-export for use in server
export { getManifest, getBuildTimeServerManifestAsync };
