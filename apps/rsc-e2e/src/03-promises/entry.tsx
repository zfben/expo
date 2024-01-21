import { Text, View } from 'react-native';

import { Counter } from './promises';

const App = () => {
  const delayedMessage = new Promise<string>((resolve) => {
    setTimeout(() => resolve('Hello from server!'), 2000);
  });
  return (
    <View
      style={{
        borderStyle: 'dashed',
        borderWidth: 3,
        borderColor: 'darkteal',
        gap: 8,
        padding: 8,
      }}>
      <Text>3) Promises + use hook (Server Component)</Text>
      <Counter delayedMessage={delayedMessage} />
    </View>
  );
};

export default App;
