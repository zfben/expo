'use client';

import { useState } from 'react';

import { Text, Button, View } from 'react-native';

export const ClientPlatformExt = ({ children }) => {
  useState(0);
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'darkcyan',
        borderStyle: 'dashed',
        padding: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>Client Component</Text>
      <Text>web-specific extension</Text>
      {children}
    </View>
  );
};
