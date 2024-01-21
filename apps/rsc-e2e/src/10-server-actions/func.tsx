'use server';

import OS from 'expo-router/os';

import { View, Switch, TextInput, ScrollView, Text } from 'react-native';

export const greet = (name: string) => {
  return (
    <View>
      <Text style={{ color: 'darkcyan' }}>
        Hello {name} from {OS} Expo Router server!
      </Text>
      <Text>More native! views from the server</Text>
      <TextInput
        style={{
          height: 40,
          margin: 12,
          borderWidth: 1,
          padding: 10,
        }}
        placeholder="useless placeholder"
      />
      <Switch trackColor={{ false: '#767577', true: '#81b0ff' }} ios_backgroundColor="#3e3e3e" />
    </View>
  );
};
