'use client';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComponentProps } from 'react';
import { Link } from 'expo-router/build/rsc/router/client';

export function Footer({
  items,
  path,
}: {
  path: string;
  items: { icon: ComponentProps<typeof MaterialIcons>['name']; href: string }[];
}) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        backgroundColor: 'white',
        height: 48 + bottom,
        paddingBottom: bottom,
      }}>
      {items.map((item, index) => (
        <View key={index} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Link to={item.href}>
            <MaterialIcons
              name={item.icon}
              size={24}
              color={path === item.href ? '#EE81C3' : '#353745'}
            />
          </Link>
        </View>
      ))}
    </View>
  );
}
