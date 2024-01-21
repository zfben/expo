'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';

export default function ClientPlatformExt() {
  const [state, setState] = useState(0);
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'darkblue',
        borderStyle: 'dashed',
        padding: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>5) Client Component</Text>
      <p>web-specific extension</p>
      <Text onPress={() => setState((i) => i + 1)}>Increment: {state}</Text>
    </View>
  );
}
