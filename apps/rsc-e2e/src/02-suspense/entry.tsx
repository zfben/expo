/// <reference types="react/canary" />

import { Suspense } from 'react';
import { Text, View } from 'react-native';

const App = () => {
  return (
    <View
      style={{
        borderStyle: 'dashed',
        borderWidth: 3,
        borderColor: 'teal',
        gap: 8,
        padding: 8,
      }}>
      <Text>2) Suspense (Server Component)</Text>

      <Suspense fallback="Pending...">
        {/* @ts-expect-error: Async Component not supported on types */}
        <ServerMessage />
      </Suspense>
      <Text>{new Date().toISOString()}</Text>
    </View>
  );
};

const ServerMessage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return <Text>Hello from server!</Text>;
};

export default App;
