import React, { Suspense } from 'react';
import OS from 'expo-router/os';
import { View } from 'react-native';
// import { Text, View, ScrollView } from 'react-native';

// import A02_Suspense from '../02-suspense/entry';
// import A03_Promises from '../03-promises/entry';
// import A04_ServerPlatformExtensions from '../04-server-platform-extensions/entry';
// import A05_ClientPlatformExtensions from '../05-client-platform-extensions/entry';
// import A06_RSCChildren from '../06-rsc-children/entry';
// import A07_AsyncServerComponent from '../07-async-server-component/entry';
// import A08_NodeBuiltins from '../08-node-builtins/entry';
// import A09_CSSModules from '../09-css-modules/entry';
// import A10_ServerActions from '../10-server-actions/entry';
// import A11_ExpoViewsTest from '../11-expo-views/entry';
// import A14_RNW from '../14-react-native-web/entry';

// import { LinearGradient } from 'expo-linear-gradient';

// const Container = OS === 'web' ? (props) => <div {...props} /> : (props) => <View {...props} />;

// const App = () => {
//   return (
//     <ScrollView
//       style={{ flex: 1, padding: 16 }}
//       contentContainerStyle={{ gap: 8, justifyContent: 'center', alignItems: 'stretch' }}>
//       <View>
//         <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
//           Universal React Server Components with Expo Router
//         </Text>
//         <Text>A whole new world.</Text>
//       </View>
//       {/* <A02_Suspense />
//       <A03_Promises />
//       <A04_ServerPlatformExtensions />
//       <A05_ClientPlatformExtensions />
//       <A06_RSCChildren /> */}
//       {/* <Container>
//         <A07_AsyncServerComponent />
//       </Container> */}
//       {/* <A08_NodeBuiltins /> */}
//       {/* <A09_CSSModules /> */}
//       {/* <A10_ServerActions /> */}
//       {/* <A11_ExpoViewsTest /> */}
//       {/* <A14_RNW /> */}
//     </ScrollView>
//   );
// };

// export default App;

// import Child from './client-child';

export default function App() {
  // return (
  //   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //     <Text style={{ fontSize: 24 }}>Hey</Text>
  //   </View>
  // );
  return (
    <>
      {/* <div>
      <h1>Hello world</h1> */}
      <View style={{ flex: 1, width: 256, height: 256, backgroundColor: 'darkblue' }} />
      {/* <Text>Hey</Text> */}
      {/* <LinearGradient colors={['red', 'yellow']} /> */}
      {/* <Child>
        <h2>Child</h2>
      </Child> */}
      {/* </div> */}
    </>
  );
}
