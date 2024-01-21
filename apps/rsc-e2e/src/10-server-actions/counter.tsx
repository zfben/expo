'use client';

import { View, Text } from 'react-native';
import { useState, useTransition } from 'react';

export const Counter = ({ greet }: { greet: (name: string) => Promise<string> }) => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState<string | Promise<string>>('');
  const [isPending, startTransition] = useTransition();
  const handleClick = () => {
    startTransition(() => {
      setText(greet('BACON+c=' + count));
    });
  };
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'orange',
        borderStyle: 'dashed',
        padding: 8,
      }}>
      <Text>Count: {count}</Text>
      <Text onPress={() => setCount((c) => c + 1)}>Increment</Text>
      <Text>
        <Text onPress={handleClick}>greet(&quot;c=&quot; + count) = {text as string}</Text>{' '}
        {isPending ? 'Pending...' : ''}
      </Text>
      <Text>This is a client component.</Text>
    </View>
  );
};
