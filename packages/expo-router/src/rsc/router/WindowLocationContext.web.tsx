// Emulates the window.location object on native.
import * as React from 'react';

export function LocationContext({ children }: { children: React.ReactElement }) {
  return <>{children}</>;
}

export function useVirtualLocation() {
  return null;
}
