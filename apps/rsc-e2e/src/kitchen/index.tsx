// const App = () => {
//   return (
//     <div>
//       <h1>First</h1>
//       <a href="/second">second</a>
//     </div>
//   );
// };

// export default App;

import React, { Suspense } from 'react';
import OS from 'expo-router/os';
// import { Text, View } from 'react-native';
import { Text, View, ScrollView } from 'react-native';
import SafeAreaView from '../../components/safe-area';

import A02_Suspense from '../02-suspense/entry';
import A03_Promises from '../03-promises/entry';
import A04_ServerPlatformExtensions from '../04-server-platform-extensions/entry';
import A05_ClientPlatformExtensions from '../05-client-platform-extensions/entry';
import A06_RSCChildren from '../06-rsc-children/entry';
// import A07_AsyncServerComponent from '../07-async-server-component/entry';
import A08_NodeBuiltins from '../08-node-builtins/entry';
// import A09_CSSModules from '../09-css-modules/entry';
import A10_ServerActions from '../10-server-actions/entry';
import A11_ExpoViewsTest from '../11-expo-views/entry';
import A14_RNW from '../14-react-native-web/entry';

// import { LinearGradient } from 'expo-linear-gradient';

// const Container = OS === 'web' ? (props) => <div {...props} /> : (props) => <View {...props} />;

// import Demo from '../13-error-on-useState/entry';
// import Demo from '../12-error-on-class/entry';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, padding: 8 }}
        contentContainerStyle={{ gap: 8, justifyContent: 'center', alignItems: 'stretch' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            Universal React Server Components with Expo Router
          </Text>
          <Text>A whole new world.</Text>
        </View>
        {/* <Demo /> */}
        {/* <A02_Suspense />
      <A03_Promises /> */}
        <A04_ServerPlatformExtensions />
        <A06_RSCChildren />
        {/* <A05_ClientPlatformExtensions /> */}
        {/* <A02_Suspense />
      <A06_RSCChildren /> */}
        {/* <A02_Suspense />
      <A03_Promises />
      <A04_ServerPlatformExtensions />
      <A05_ClientPlatformExtensions />
      <A06_RSCChildren /> */}
        {/* <Container>
        <A07_AsyncServerComponent />
      </Container> */}
        <A08_NodeBuiltins />
        {/* <A09_CSSModules /> */}
        {/* <A10_ServerActions /> */}
        {/* <A11_ExpoViewsTest /> */}
        {/* <A14_RNW /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
