// const App = () => {
//   return (
//     <div>
//       <h1>First</h1>
//       <a href="/second">second</a>
//     </div>
//   );
// };
import React, { Suspense } from 'react';
import { ScrollView, Text, View } from 'react-native';

const App = () => {
  return (
    <ScrollView
      style={{ flex: 1, padding: 16 }}
      contentContainerStyle={{ gap: 8, justifyContent: 'center', alignItems: 'stretch' }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          Universal React Server Components with Expo Router
        </Text>
        <Text>A whole new world.</Text>
      </View>
    
    </ScrollView>
  );
};

export default App;
