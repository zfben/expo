import React from 'react';

import { Text, View } from 'react-native';

export default function App() {
  const [s, setS] = React.useState(null);
  React.useEffect(() => {
    fetch('RSC/index.txt')
      .then((t) => t.text())
      .then((t) => {
        setS(t);
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Open up App.js to start working on your app!</Text>
      {s && <Text>Data: {s}</Text>}
    </View>
  );
}
