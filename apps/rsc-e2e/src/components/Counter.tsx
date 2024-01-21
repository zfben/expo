'use client';

import { useState } from 'react';

import { Text, Button, View } from 'react-native';

export const Counter = ({ children }) => {
  const [count, setCount] = useState(0);
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'aquamarine',
        borderStyle: 'dashed',
        padding: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>Client Component</Text>

      <Text>Count: {count}</Text>
      <Button onPress={() => setCount((c) => c + 1)} title="Increment" />
      {children}
    </View>
  );
};
