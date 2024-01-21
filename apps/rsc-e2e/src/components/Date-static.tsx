import fs from 'fs';
import path from 'path';
import { Text, View } from 'react-native';

const files = fs.readdirSync(path.join(process.cwd(), './'));

export default function DateStatic() {
  return (
    <View style={{ borderWidth: 3, gap: 8, borderColor: 'lime', borderStyle: 'dashed', padding: 8 }}>
      <Text style={{ fontWeight: 'bold'}}>Server Component</Text>
      <View>
      <Text style={{ fontWeight: 'bold'}}>File system reads with Node.js built-ins:</Text>
      <Text>{files.join(' ')}</Text>
      </View>

      <View>
      <Text style={{ fontWeight: 'bold'}}>Secrets are available here:</Text>
      <Text>process.env.FAKE_SECRET={process.env.FAKE_SECRET}</Text>
      </View>
    </View>
  );
}
