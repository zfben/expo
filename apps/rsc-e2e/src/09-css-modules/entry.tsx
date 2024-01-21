import { Text, View } from 'react-native';
import styles, { unstable_styles } from './styles.module.css';
import ClientChild from './child';

export default function CSSModuleTest() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'orange',
        borderStyle: 'dashed',
        padding: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>9) CSS Modules (Server Component)</Text>

      <Text style={unstable_styles.myText}>(server) This text should be green.</Text>
      <ClientChild />
    </View>
  );
}
