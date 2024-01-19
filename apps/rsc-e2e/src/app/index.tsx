import { Counter } from '../components/Counter';
import { View, Text } from 'react-native-web';
import DateStatic from '../components/Date-static';

const App = ({ name }: { name: string }) => {
  return (
    <View style={{ flex: 1 }}>
      <Text>Hey</Text>
      <div style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}>
        <title>Expo x Metro RSC</title>
        {/* <h1>Hello {name}!!</h1> */}
        <h3>Expo x Metro RSC (web) demo.</h3>
        <h3>This is a server component.</h3>
        <DateStatic />
        <Counter />
        <div>{new Date().toISOString()}</div>
      </div>
    </View>
  );
};

export default App;
