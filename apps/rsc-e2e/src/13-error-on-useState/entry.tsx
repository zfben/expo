// Server components cannot use useState
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <View
      style={{
        borderStyle: 'dashed',
        borderWidth: 3,
        borderColor: 'darkteal',
        gap: 8,
        padding: 8,
      }}>
      <Text>13) Error on useState (Server Component)</Text>
    </View>
  );
}
