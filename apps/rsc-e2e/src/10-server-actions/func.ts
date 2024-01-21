'use server';

import OS from 'expo-router/os';

export const greet = (name: string) => {
  return `Hello ${name} from ${OS} Expo Router server!`;
};
