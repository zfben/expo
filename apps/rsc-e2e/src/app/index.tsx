import React, { Suspense } from 'react';
import OS from 'expo-router/os';
import { Text, View, ScrollView } from 'react-native';

import A02_Suspense from '../02-suspense/entry';
import A03_Promises from '../03-promises/entry';
import A04_ServerPlatformExtensions from '../04-server-platform-extensions/entry';
import A05_ClientPlatformExtensions from '../05-client-platform-extensions/entry';
import A06_RSCChildren from '../06-rsc-children/entry';
import A07_AsyncServerComponent from '../07-async-server-component/entry';
import A08_NodeBuiltins from '../08-node-builtins/entry';
import A09_CSSModules from '../09-css-modules/entry';
import A10_ServerActions from '../10-server-actions/entry';
import A11_ExpoViewsTest from '../11-expo-views/entry';

import { LinearGradient } from 'expo-linear-gradient';

const Container = OS === 'web' ? (props) => <div {...props} /> : (props) => <View {...props} />;

const App = () => {
  // return (
  //   <View>
  //     <LinearGradient
  //       colors={['#4c669f', '#3b5998', '#192f6a']}
  //       style={{ padding: 15, alignItems: 'center', borderRadius: 5, width: 100, height: 100 }}
  //     />
  //   </View>
  // );
  return (
    <ScrollView
      style={{ flex: 1, padding: 16, gap: 8 }}
      contentContainerStyle={{ justifyContent: 'center', alignItems: 'stretch' }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          Universal React Server Components with Expo Router
        </Text>

        <Text>A whole new world.</Text>
      </View>
      {/* <A02_Suspense /> */}
      {/* <A03_Promises /> */}
      <A04_ServerPlatformExtensions />
      <A05_ClientPlatformExtensions />
      <A06_RSCChildren />
      {/* <Container>
        <A07_AsyncServerComponent />
      </Container> */}
      <A08_NodeBuiltins />
      {/* <A09_CSSModules /> */}
      <A10_ServerActions />
      <A11_ExpoViewsTest />
    </ScrollView>
  );
};

export default App;
