'use client';

import { View, Text, Button } from 'react-native';
import { ReactElement, useState, useTransition } from 'react';

export const Counter = ({ greet }: { greet: (name: string) => Promise<ReactElement> }) => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState<string | Promise<ReactElement>>('');
  const [isPending, startTransition] = useTransition();
  const handleClick = () => {
    startTransition(() => {
      setText(greet('c=' + count));
    });
  };
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'darkcyan',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text>(client component)</Text>
      <Button onPress={() => setCount((c) => c + 1)} title="Increment++" />

      <Button onPress={handleClick} title={`Invoke: greet("c=" + ${count})`} />
      <Text>{`${isPending ? 'Transition Pending...' : ''}`}</Text>

      <Text>Server Result → {text as string}</Text>
    </View>
  );
};
