import type { ReactNode } from 'react';

import { Link } from 'expo-router/build/rsc/router/client';
import { Text, View } from 'react-native';
import SafeAreaView from '@/components/safe-area';

const Pending = ({ isPending }: { isPending: boolean }) => {
  if (!isPending) return null;
  return (
    <Text
      style={{
        marginLeft: 5,
        color: 'white',
        // transition: 'opacity 75ms 100ms',
        opacity: isPending ? 1 : 0,
      }}>
      Pending...
    </Text>
  );
};

const HomeLayout = ({ children }: { children: ReactNode }) => (
  <SafeAreaView
    testID="safe-area-root"
    style={{ backgroundColor: '#191A20', flex: 1, gap: 8, padding: 12 }}>
    {/* <title>Concurrent Router</title> */}
    <View
      testID="navigation"
      style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
      <View>
        <Link
          style={{ textAlign: 'center', color: '#EE81C3', textDecorationLine: 'underline' }}
          to="/foo"
          pending={<Pending isPending />}
          notPending={<Pending isPending={false} />}>
          Foo
        </Link>
      </View>
      <View>
        <Link
          style={{ textAlign: 'center', color: '#EE81C3', textDecorationLine: 'underline' }}
          to="/foo/nova"
          pending={<Pending isPending />}
          notPending={<Pending isPending={false} />}>
          Foo/Nova
        </Link>
      </View>
    </View>
    <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
      {children}
    </View>
  </SafeAreaView>
);

export default HomeLayout;
