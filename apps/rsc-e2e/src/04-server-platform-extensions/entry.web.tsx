import { Text, View } from 'react-native';

export default function ServerPlatformExt() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'darkblue',
        borderStyle: 'dashed',
        padding: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>4) Server Component</Text>
      <Text>web-specific extension</Text>
    </View>
  );
}
