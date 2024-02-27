import type { LogBoxLog } from '@expo/metro-runtime/symbolicate';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View, TextStyle, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from './Pressable';
import { ErrorBoundaryProps } from './Try';
import { Link } from '../link/Link';

let useMetroSymbolication: (error: Error) => LogBoxLog | null;

if (process.env.NODE_ENV === 'development') {
  const { LogBoxLog, parseErrorStack } =
    require('@expo/metro-runtime/symbolicate') as typeof import('@expo/metro-runtime/symbolicate');
  useMetroSymbolication = function (error: Error) {
    const [logBoxLog, setLogBoxLog] = React.useState<LogBoxLog | null>(null);

    React.useEffect(() => {
      let isMounted = true;
      const stack = parseErrorStack(error.stack);

      const log = new LogBoxLog({
        level: 'error',
        message: {
          content: error.message,
          substitutions: [],
        },
        isComponentError: false,
        stack,
        category: error.message,
        componentStack: [],
      });

      log.symbolicate('stack', (symbolicatedLog) => {
        if (isMounted) {
          setLogBoxLog(log);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [error]);

    return logBoxLog;
  };
} else {
  useMetroSymbolication = function () {
    return null;
  };
}

let StackTrace: React.FC<{ logData: LogBoxLog | null }>;
let ErrorMessageText: React.FC<{ text: string; style: TextStyle }>;

if (process.env.NODE_ENV === 'development') {
  const { Ansi } =
    require('@expo/metro-runtime/build/error-overlay/UI/AnsiHighlight') as typeof import('@expo/metro-runtime/build/error-overlay/UI/AnsiHighlight');

  ErrorMessageText = function ({ text, style }) {
    return (
      <Ansi
        style={[
          {
            fontSize: 12,
            includeFontPadding: false,
            lineHeight: 20,
            fontFamily: Platform.select({
              default: 'Courier',
              ios: 'Courier New',
              android: 'monospace',
            }),
          },
          style,
        ]}
        text={text}
      />
    );
  };

  const { LogContext } = require('@expo/metro-runtime/build/error-overlay/Data/LogContext');
  const {
    LogBoxInspectorStackFrames,
  } = require('@expo/metro-runtime/build/error-overlay/overlay/LogBoxInspectorStackFrames');

  StackTrace = function ({ logData }: { logData: LogBoxLog | null }) {
    if (!logData?.symbolicated?.stack?.stack) {
      return null;
    }
    return (
      <ScrollView style={{ flex: 1 }}>
        <LogContext.Provider
          value={{
            isDisabled: false,
            logs: [logData],
            selectedLogIndex: 0,
          }}>
          <LogBoxInspectorStackFrames onRetry={function () {}} type="stack" />
        </LogContext.Provider>
      </ScrollView>
    );
  };
} else {
  ErrorMessageText = function ({ text, style }) {
    return <Text role="heading" aria-level={2} children={text} style={style} />;
  };

  StackTrace = function () {
    return <View style={{ flex: 1 }} />;
  };
}

function useWrapper() {
  if (Platform.OS === 'web') {
    return View;
  }
  const inTabBar = React.useContext(BottomTabBarHeightContext);
  const Wrapper = inTabBar ? View : SafeAreaView;

  return Wrapper;
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // TODO: Add digest support for RSC errors
  // https://github.com/vercel/next.js/blob/f82445b01c885c2dce65c99043666f4a3efdbd9d/packages/next/src/client/components/error-boundary.tsx#L132-L151
  // console.log('E>', error, { digest: error?.digest });
  const logBoxLog = useMetroSymbolication(error);
  const Wrapper = useWrapper();

  return (
    <View style={styles.container}>
      <Wrapper style={{ flex: 1, gap: 8, maxWidth: 720, marginHorizontal: 'auto' }}>
        <View
          style={{
            marginBottom: 12,
            gap: 4,
            flexWrap: 'wrap',
          }}>
          <Text role="heading" aria-level={1} style={styles.title}>
            Something went wrong
          </Text>
          <ErrorMessageText style={styles.errorMessage} text={`Error: ${error.message}`} />
        </View>

        <StackTrace logData={logBoxLog} />
        {process.env.NODE_ENV === 'development' && (
          <Link href="/_sitemap" style={styles.link}>
            Sitemap
          </Link>
        )}
        <Pressable onPress={retry}>
          {({ hovered, pressed }) => (
            <View
              style={[styles.buttonInner, (hovered || pressed) && { backgroundColor: 'white' }]}>
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: hovered || pressed ? 'black' : 'white',
                  },
                ]}>
                Retry
              </Text>
            </View>
          )}
        </Pressable>
      </Wrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 24,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: Platform.select({ web: 32, default: 24 }),
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    ...Platform.select({
      web: {
        transitionDuration: '100ms',
      },
    }),
  },
  buttonInner: {
    ...Platform.select({
      web: {
        transitionDuration: '100ms',
      },
    }),
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderColor: 'white',
    borderWidth: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  code: {
    fontFamily: Platform.select({
      default: 'Courier',
      ios: 'Courier New',
      android: 'monospace',
    }),
    fontWeight: '500',
  },
  errorMessage: {
    color: 'white',
    fontSize: 16,
  },
  subtitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
    // textAlign: "center",
  },
  link: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
});
