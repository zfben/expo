// Emulates the window.location object on native.

import { Linking, Platform } from 'react-native';

// getInitialURL = () =>
// ,
// subscribe = (listener) => {
// const callback = ({ url }: { url: string }) => listener(url);

// const subscription = Linking.addEventListener('url', callback) as
//   | { remove(): void }
//   | undefined;

// return () => {
//   subscription?.remove();
// };
// },

import * as React from 'react';
import { getInitialURL, addEventListener } from '../../link/linking';
import { extractExpoPathFromURL } from '../../fork/extractPathFromURL';

function useInitialLocation() {
  const [initialUrl, setInitial] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const v = await getInitialURL();

      setInitial(v);
    })();

    return addEventListener((url) => {
      setInitial(url);
    });
  }, []);

  return initialUrl;
}
// window.history.pushState

const Location = React.createContext<{
  // urlFragment: URL | null;
  // window.history[method](window.history.state, '', url);
  setHistory: (method: string, url: string | URL) => void;
}>({ urlFragment: null, setHistory: () => {} });

function coerceUrl(url: any) {
  if (typeof url === 'object' && 'pathname' in url) {
    return url as URL;
  }
  try {
    return new URL(url);
  } catch (e) {
    return new URL(url, 'http://localhost:8081');
  }
}

export function LocationContext({ children }: { children: React.ReactElement }) {
  const [loaded, setLoaded] = React.useState(null);
  // const [initialUrl, setInitial] = React.useState<URL | null>(null);

  const setUrl = (url: string) => {
    console.log('Set URL:', url);
    const v = coerceUrl(url);
    globalThis.expoVirtualLocation = v;
    // setInitial(v);
  };

  React.useEffect(() => {
    (async () => {
      const v = await getInitialURL();
      setUrl(extractExpoPathFromURL(v));
      setLoaded(true);
    })();

    return addEventListener((url) => {
      setUrl(extractExpoPathFromURL(url));
    });
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <Location.Provider
      value={{
        // urlFragment: initialUrl,
        setHistory(method, url) {
          if (method === 'pushState') {
            setUrl(url);
          } else {
            console.warn('Only pushState is supported atm');
          }
        },
      }}>
      {children}
    </Location.Provider>
  );
}

export function useVirtualLocation() {
  return React.useContext(Location);
}
