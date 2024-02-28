import type { ReactNode } from 'react';

import { Link } from 'expo-router/build/rsc/router/client';
import { Text, View } from 'react-native';
import SafeAreaView from '@/components/safe-area';

const Pending = ({ isPending }: { isPending: boolean }) => (
  <Text
    style={{
      marginLeft: 5,
      // transition: 'opacity 75ms 100ms',
      opacity: isPending ? 1 : 0,
    }}>
    Pending...
  </Text>
);

const HomeLayout = ({ children }: { children: ReactNode }) => (
  <SafeAreaView>
    {/* <title>Concurrent Router</title> */}
    <View>
      <View>
        <Link
          style={{ color: 'blue', textDecorationLine: 'underline' }}
          to="/"
          pending={<Pending isPending />}
          notPending={<Pending isPending={false} />}>
          Home
        </Link>
      </View>
      <View>
        <Link
          style={{ color: 'blue', textDecorationLine: 'underline' }}
          to="/bar"
          pending={<Pending isPending />}
          notPending={<Pending isPending={false} />}>
          Bar
        </Link>
      </View>
    </View>
    {children}
  </SafeAreaView>
);

export default HomeLayout;
