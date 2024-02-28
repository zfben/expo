import type { ReactNode } from 'react';

import { Link } from 'expo-router/build/rsc/router/client';
import { ActivityIndicator, Text, View } from 'react-native';
import SafeAreaView from '@/components/safe-area';
import { Footer } from '@/components/footer';

const COLORS = {
  selected: '#EE81C3',
  notSelected: '#FFFFFF',
};

const HomeLayout = ({
  children,
  ...props
}: {
  children: ReactNode;
  path: string;
  searchParams: URLSearchParams;
}) => {
  console.log('[props]>', props);
  const getColor = (path: string) => {
    return props.path === path ? COLORS.selected : COLORS.notSelected;
  };

  return (
    <SafeAreaView
      edges={{
        bottom: 'off',
        top: 'additive',
      }}
      testID="safe-area-root"
      style={{ backgroundColor: '#191A20', flex: 1, gap: 8 }}>
      {/* <title>Concurrent Router</title> */}
      <View
        testID="navigation"
        style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <View>
          <Link
            style={{ textAlign: 'center', color: getColor('/'), textDecorationLine: 'underline' }}
            to="/"
            pending={<ActivityIndicator animating />}
            notPending={<ActivityIndicator animating={false} />}>
            Home
          </Link>
        </View>
        <View>
          <Link
            style={{
              textAlign: 'center',
              color: getColor('/bar'),
              textDecorationLine: 'underline',
            }}
            to="/bar"
            pending={<ActivityIndicator animating />}
            notPending={<ActivityIndicator animating={false} />}>
            Bar
          </Link>
        </View>
        <View>
          <Link
            style={{
              textAlign: 'center',
              color: getColor('/foo'),
              textDecorationLine: 'underline',
            }}
            to="/foo"
            pending={<ActivityIndicator animating />}
            notPending={<ActivityIndicator animating={false} />}>
            Foo
          </Link>
        </View>
      </View>
      <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
        {children}
      </View>
      <Footer
        path={props.path}
        items={[
          { icon: 'home', href: '/' },
          { icon: 'apple-keyboard-option', href: '/bar' },
          { icon: 'share-outline', href: '/foo' },
        ]}
      />
    </SafeAreaView>
  );
};

export default HomeLayout;
