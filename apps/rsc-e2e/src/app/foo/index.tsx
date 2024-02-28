import { Text, View } from 'react-native';

const Bar = () => (
  <View
    testID="bar-root"
    style={{ borderRadius: 2, flex: 1, padding: 12, backgroundColor: '#353745' }}>
    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Foo</Text>
  </View>
);

export default Bar;
