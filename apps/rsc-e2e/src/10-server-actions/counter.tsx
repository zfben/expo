'use client';

import { View, Text } from 'react-native';
import { useState, useTransition } from 'react';

export const Counter = ({ greet }: { greet: (name: string) => Promise<string> }) => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState<string | Promise<string>>('');
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
      }}>
      <Text>(client component)</Text>
      <Text
        selectable={false}
        style={{ padding: 8, fontWeight: 'bold' }}
        onPress={() => setCount((c) => c + 1)}>
        Increment++
      </Text>

      <Text>
        <Text selectable={false} style={{ fontFamily: 'monospace' }} onPress={handleClick}>
          greet(&quot;c=&quot; + {count}) → {text as string}
        </Text>{' '}
        {isPending ? 'Pending...' : ''}
      </Text>
    </View>
  );
};
