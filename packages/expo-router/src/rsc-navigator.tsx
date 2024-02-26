'use client';
import { ctx } from 'expo-router/_ctx';
import React, { Fragment, FunctionComponent, ReactNode } from 'react';

import UpstreamNavigationContainer from './fork/NavigationContainer';
import { useInitializeExpoRouter } from './global-state/router-store';
import { SplashScreen } from './views/Splash';

export default function ContextNavigator({
  context = ctx,
  location: initialLocation,
  //   wrapper: WrapperComponent = Fragment,
  children,
}) {
  const store = useInitializeExpoRouter(context, initialLocation);

  // if (store.shouldShowTutorial()) {
  //   SplashScreen.hideAsync();
  //   if (process.env.NODE_ENV === 'development') {
  //     const Tutorial = require('./onboard/Tutorial').Tutorial;
  //     return (
  //       <WrapperComponent>
  //         <Tutorial />
  //       </WrapperComponent>
  //     );
  //   } else {
  //     // Ensure tutorial styles are stripped in production.
  //     return null;
  //   }
  // }

  // const Component = store.rootComponent;

  return (
    <UpstreamNavigationContainer
      ref={store.navigationRef}
      initialState={store.initialState}
      linking={store.linking}
      // onUnhandledAction={onUnhandledAction}
      documentTitle={{
        enabled: false,
      }}>
      {children}
    </UpstreamNavigationContainer>
  );
}
