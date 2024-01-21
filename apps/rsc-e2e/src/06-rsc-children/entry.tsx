import { Text, View } from 'react-native';

import ClientWithRscChildren from './child';

export default function RSCChildren() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'aquamarine',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>6) RSC children props (Client Component)</Text>

      <ClientWithRscChildren>
        <Text>Static children</Text>
      </ClientWithRscChildren>
    </View>
  );
}
