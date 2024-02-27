/// <reference types="react/canary" />
'use client';

import { Suspense, useState, use } from 'react';
import { View, Text } from 'react-native';

export const Counter = ({ delayedMessage }: { delayedMessage: Promise<string> }) => {
  const [count, setCount] = useState(0);
  return (
    <View
      style={{
        borderStyle: 'dashed',
        borderWidth: 3,
        borderColor: 'darkteal',
        gap: 8,
        padding: 8,
      }}>
      <Text>Count: {count}</Text>
      <Text onPress={() => setCount((c) => c + 1)}>Increment</Text>
      <Text>This is a client component.</Text>
      <Suspense fallback={<Text>"Pending..."</Text>}>
        <Message count={count} delayedMessage={delayedMessage} />
      </Suspense>
    </View>
  );
};

const Message = ({ count, delayedMessage }: { count: number; delayedMessage: Promise<string> }) => {
  return (
    <View>
      <Text>count: {count}</Text>
      <Text>delayedMessage: {use(delayedMessage)}</Text>
    </View>
  );
};
