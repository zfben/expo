'use client';

import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function ClientWithRscChildren({ children }) {
  const [count, setCount] = useState(0);
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'aquamarine',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text>Count: {count}</Text>
      <Button onPress={() => setCount((c) => c + 1)} title="Increment" />
      {children}
    </View>
  );
}
