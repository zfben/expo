'use client';

import { Text, View } from 'react-native';
import { unstable_styles } from './client-styles.module.css';

export default function CSSModuleTest() {
  return <Text style={unstable_styles.clientText}>(client) This text should be purple.</Text>;
}
