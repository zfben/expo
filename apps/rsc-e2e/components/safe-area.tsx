'use client';

// TODO: Some wonky errors with `react-native-safe-area-context` and React Native SafeAreaView.
import { SafeAreaView as Upstream } from 'react-native-safe-area-context';

export default function SafeAreaView(props) {
  return <Upstream {...props} />;
}
