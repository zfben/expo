import type { ReactNode } from 'react';

import { Link } from 'expo-router/build/rsc/router/client';
import { ActivityIndicator, Text, View } from 'react-native';
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

const HomeLayout = ({
  children,
  ...props
}: {
  children: ReactNode;
  path: string;
  searchParams: URLSearchParams;
}) => {
  return (
    <View
      testID="safe-area-root"
      style={{
        gap: 8,
        margin: 8,
        padding: 8,
        borderColor: '#454758',
        borderWidth: 1,
        flex: 1,
      }}>
      {/* <title>Concurrent Router</title> */}
      <View
        testID="navigation"
        style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <View>
          <Link
            style={{ textAlign: 'center', color: '#EE81C3', textDecorationLine: 'underline' }}
            to="/fashion"
            pending={<ActivityIndicator animating />}
            notPending={<ActivityIndicator animating={false} />}>
            /fashion
          </Link>
        </View>
        <View>
          <Link
            style={{ textAlign: 'center', color: '#EE81C3', textDecorationLine: 'underline' }}
            to="/fashion/nova"
            pending={<ActivityIndicator animating />}
            notPending={<ActivityIndicator animating={false} />}>
            /fashion/nova
          </Link>
        </View>
      </View>
      <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
        {children}
      </View>
    </View>
  );
};

export default HomeLayout;
