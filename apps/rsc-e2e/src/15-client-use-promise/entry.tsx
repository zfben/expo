'use client';

import { Suspense, use, useState } from 'react';
import { Text, View } from 'react-native';

export default function ExpoViewsTest() {
  const [mount, setMount] = useState(false);
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>15) Client + use hook + Promise (Client Component)</Text>

      <Text onPress={() => setMount(true)} style={{ fontWeight: 'bold' }}>
        Mount promise (may freeze native)
      </Text>

      {mount && <Child />}
    </View>
  );
}

function Child() {
  const value = use(getServerMessage());

  return <Suspense fallback={<Text>Pending...</Text>}>{value}</Suspense>;
}

function getServerMessage() {
  return new Promise((resolve) => setTimeout(resolve, 2000)).then(() => (
    <Text>Hello from server!</Text>
  ));
}
