'use client';

import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { NativeLinearGradientProps } from './NativeLinearGradient.types';

const INativeLinearGradient = requireNativeViewManager(
  'ExpoLinearGradient'
) as React.FC<NativeLinearGradientProps>;

export default function NativeLinearGradient(props: NativeLinearGradientProps): React.ReactElement {
  return <INativeLinearGradient {...props} />;
}
