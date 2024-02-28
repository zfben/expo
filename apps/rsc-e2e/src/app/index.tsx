import { Text, View } from 'react-native';

const Home = () => (
  <View
    testID="index-root"
    style={{ borderRadius: 2, flex: 1, padding: 12, flexShrink: 0, backgroundColor: '#282A35' }}>
    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Home</Text>
  </View>
);

export default Home;
