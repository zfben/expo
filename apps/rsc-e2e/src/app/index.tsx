import OS from 'expo-router/os';
import { Text, View } from 'react-native';

import A02_Suspense from '../02-suspense/entry';
import A03_Promises from '../03-promises/entry';
import A04_ServerPlatformExtensions from '../04-server-platform-extensions/entry';
import A05_ClientPlatformExtensions from '../05-client-platform-extensions/entry';
import A06_RSCChildren from '../06-rsc-children/entry';
import A07_AsyncServerComponent from '../07-async-server-component/entry';
import A08_NodeBuiltins from '../08-node-builtins/entry';
import A09_CSSModules from '../09-css-modules/entry';

const Container = OS === 'web' ? (props) => <div {...props} /> : (props) => <View {...props} />;

const App = () => {
  return (
    <View style={{ flex: 1, padding: 16, gap: 8, justifyContent: 'center', alignItems: 'stretch' }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          Universal React Server Components with Expo Router
        </Text>

        <Text>A whole new world.</Text>
      </View>
      <A02_Suspense />
      <A03_Promises />
      <A04_ServerPlatformExtensions />
      <A05_ClientPlatformExtensions />
      <A06_RSCChildren />

      <Container>
        {/* @ts-expect-error */}
        <A07_AsyncServerComponent />
      </Container>
      <A08_NodeBuiltins />
      <A09_CSSModules />
    </View>
  );
};

export default App;

// import { Counter } from '../components/Counter';
// import { View, Text } from 'react-native-web';
// import DateStatic from '../components/Date-static';
// import AsyncBuildData from '../components/AsyncBuildData';

// const App = ({ name }: { name: string }) => {
//   return (
//     <View style={{ flex: 1 }}>
//       <div style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}>
//         <title>Expo x Metro RSC</title>
//         {/* <h1>Hello {name}!!</h1> */}
//         <h3>Expo x Metro RSC (web) demo.</h3>
//         <h3>This is a server component.</h3>
//         <DateStatic />
//         <AsyncBuildData />
//         <Counter>
//           <div style={{ border: '3px dodgerblue dashed', margin: '1em', padding: '1em' }}>
//             <Text>Nested static component child</Text>
//           </div>
//         </Counter>
//         <div style={{ border: '3px purple dashed', margin: '1em', padding: '1em' }}>
//           <Text>React Native Web client components</Text>
//         </div>
//         <div style={{ border: '3px lime dashed', margin: '1em', padding: '1em' }}>
//           <Text>Secret variable {process.env.EXPO_NOT_PUBLIC_TEST_VALUE}</Text>
//         </div>
//         <div>{new Date().toISOString()}</div>
//       </div>
//     </View>
//   );
// };

// export default App;
