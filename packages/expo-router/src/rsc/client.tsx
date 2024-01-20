// From Waku -- https://github.com/dai-shi/waku/blob/main/packages/waku/src/client.ts

/// <reference types="react/canary" />
'use client';

import {
  cache,
  createContext,
  createElement,
  memo,
  use,
  useCallback,
  useState,
  startTransition,
  Suspense,
} from 'react';
import type { ReactNode } from 'react';
import RSDWClient from 'react-server-dom-webpack/client';

import { encodeInput } from './renderers/utils';

const { createFromFetch, encodeReply } = RSDWClient;

declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}

// TODO: Add this env var
const RSC_PATH = process.env.EXPO_RSC_PATH || '/rsc';

const BASE_PATH = `${process.env.EXPO_BASE_URL}${RSC_PATH}/`;

const checkStatus = async (responsePromise: Promise<Response>): Promise<Response> => {
  const response = await responsePromise;
  if (!response.ok) {
    const err = new Error(response.statusText);
    (err as any).statusCode = response.status;
    throw err;
  }
  return response;
};

type Elements = Promise<Record<string, ReactNode>>;

const mergeElements = cache(async (a: Elements, b: Elements | Awaited<Elements>): Elements => {
  const nextElements = { ...(await a), ...(await b) };
  delete nextElements._value;
  return nextElements;
});

export const fetchRSC = cache(
  (
    input: string,
    searchParamsString: string,
    rerender: (fn: (prev: Elements) => Elements) => void
  ): Elements => {
    const options = {
      async callServer(actionId: string, args: unknown[]) {
        const response = fetch(BASE_PATH + encodeInput(encodeURIComponent(actionId)), {
          method: 'POST',
          body: await encodeReply(args),
          reactNative: { textStreaming: true },
        });
        const data = createFromFetch<Awaited<Elements>>(checkStatus(response), options);
        startTransition(() => {
          console.log('update renderer:', data);
          // FIXME this causes rerenders even if data is empty
          rerender((prev) => mergeElements(prev, data));
        });
        return (await data)._value;
      },
    };
    const prefetched = ((globalThis as any).__WAKU_PREFETCHED__ ||= {});
    const url =
      BASE_PATH + encodeInput(input) + (searchParamsString ? '?' + searchParamsString : '');
    const response = prefetched[url] || fetch(url, { reactNative: { textStreaming: true } });
    delete prefetched[url];
    const data = createFromFetch<Awaited<Elements>>(checkStatus(response), options);
    return data;
  }
);

export const prefetchRSC = cache((input: string, searchParamsString: string): void => {
  const prefetched = ((globalThis as any).__WAKU_PREFETCHED__ ||= {});
  const url = BASE_PATH + encodeInput(input) + (searchParamsString ? '?' + searchParamsString : '');
  if (!(url in prefetched)) {
    prefetched[url] = fetch(url, { reactNative: { textStreaming: true } });
  }
});

const RefetchContext = createContext<(input: string, searchParams?: URLSearchParams) => void>(
  () => {
    throw new Error('Missing Root component');
  }
);
const ElementsContext = createContext<Elements | null>(null);

// HACK there should be a better way...
const createRerender = cache(() => {
  let rerender: ((fn: (prev: Elements) => Elements) => void) | undefined;
  const stableRerender = (fn: Parameters<NonNullable<typeof rerender>>[0]) => {
    rerender?.(fn);
  };
  const getRerender = () => stableRerender;
  const setRerender = (newRerender: NonNullable<typeof rerender>) => {
    rerender = newRerender;
  };
  return [getRerender, setRerender] as const;
});

// export function ServerComponentHost(props) {
//   return useServerComponent(props).readRoot();
// }

export const Root = ({
  initialInput,
  initialSearchParamsString,
  children,
}: {
  initialInput?: string;
  initialSearchParamsString?: string;
  children: ReactNode;
}) => {
  const [getRerender, setRerender] = createRerender();

  const [elements, setElements] = useState(() =>
    fetchRSC(initialInput || '', initialSearchParamsString || '', getRerender())
  );

  setRerender(setElements);
  const refetch = useCallback(
    (input: string, searchParams?: URLSearchParams) => {
      const data = fetchRSC(input, searchParams?.toString() || '', getRerender());
      setElements((prev) => mergeElements(prev, data));
    },
    [getRerender]
  );
  console.log('Render with elements,', elements);
  return createElement(
    RefetchContext.Provider,
    { value: refetch },
    createElement(ElementsContext.Provider, { value: elements }, children)
  );
};

export const useRefetch = () => use(RefetchContext);

const ChildrenContext = createContext<ReactNode>(undefined);
const ChildrenContextProvider = memo(ChildrenContext.Provider);

export const Slot = ({
  id,
  children,
  fallback,
}: {
  id: string;
  children?: ReactNode;
  fallback?: ReactNode;
}) => {
  // const elementsPromise = ElementsContext;
  const elementsPromise = use(ElementsContext);
  if (!elementsPromise) {
    throw new Error('Missing Root component');
  }
  // const elements = elementsPromise;
  const elements = use(elementsPromise);
  if (!(id in elements)) {
    if (fallback) {
      return fallback;
    }
    console.log('Expected one of:', elements);
    // throw new Error('Not found: ' + id);
  }
  // TODO: Fix this to support multiple children
  return createElement(ChildrenContextProvider, { value: children }, elements);
  // return createElement(ChildrenContextProvider, { value: children }, elements[id]);
};

export const Children = () => use(ChildrenContext);

export const ServerRoot = ({ elements, children }: { elements: Elements; children: ReactNode }) =>
  createElement(ElementsContext.Provider, { value: elements }, children);
