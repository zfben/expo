import { Counter } from '../components/Counter';
import { View, Text, Platform, LogBox } from 'react-native';
import DateStatic from '../components/Date-static';
import AsyncBuildData from '../components/AsyncBuildData';
import {ClientPlatformExt} from '../components/ClientPlatformExt';
import ServerPlatformExt from '../components/ServerPlatformExt';

const Container = Platform.select({
  web: props => <div {...props} />,
  default: View,
})

const App = () => {
  return (
    <View style={{ flex: 1, padding: 16, gap: 8, justifyContent: 'center', alignItems: 'stretch' }}>

      <View>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
        Universal React Server Components with Expo Router
      </Text>

      <Text>A whole new world.</Text>
      </View>
      <Container>
      <AsyncBuildData />
      </Container>
      <ClientPlatformExt>
        <Text>Child</Text>
      </ClientPlatformExt>
      <ServerPlatformExt />
      <DateStatic />
      <Counter>
        <View
          style={{
            borderWidth: 3,
            borderColor: 'dodgerblue',
            borderStyle: 'dashed',
            padding: 8,
          }}>
          <Text>Nested static component child</Text>
        </View>
      </Counter>
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
