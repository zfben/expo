// Class components cannot be used in Server Components.
import React from 'react';
import { Text, View } from 'react-native';

export default class App extends React.Component {
  render() {
    return (
      <View
        style={{
          borderStyle: 'dashed',
          borderWidth: 3,
          borderColor: 'darkteal',
          gap: 8,
          padding: 8,
        }}>
        <Text>12) Error on class (Server Component)</Text>
      </View>
    );
  }
}
