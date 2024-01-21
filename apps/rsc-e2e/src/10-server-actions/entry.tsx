import { Text, View } from 'react-native';

import { Counter } from './counter';
import { greet } from './func';

type ServerFunction<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never;

export default function ServerActionTest() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>10) Server Action (Server Component)</Text>

      <Counter greet={greet as unknown as ServerFunction<typeof greet>} />
      <Text>Date rendered: {new Date().toISOString()}</Text>
    </View>
  );
}
