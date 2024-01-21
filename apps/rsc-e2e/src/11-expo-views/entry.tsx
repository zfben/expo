import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { Text, View } from 'react-native';

export default function ExpoViewsTest() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>11) Expo Views (Server Component)</Text>

      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={{ padding: 15, alignItems: 'center', borderRadius: 5, width: 100, height: 100 }}
      />
      <BlurView
        tint="dark"
        style={{ padding: 15, alignItems: 'center', borderRadius: 5, width: 100, height: 100 }}
      />
    </View>
  );
}
