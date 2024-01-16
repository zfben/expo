import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Root, Slot } from 'expo-router/build/rsc/client';

const rootElement = (
  <StrictMode>
    <Root>
      <Slot id="App" />
    </Root>
  </StrictMode>
);

// if (import.meta.env.WAKU_HYDRATE) {
//   hydrateRoot(document.body, rootElement);
// } else {
createRoot(document.body).render(rootElement);
// }
