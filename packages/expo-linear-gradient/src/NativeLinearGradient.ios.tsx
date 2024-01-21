'use client';

import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { NativeLinearGradientProps } from './NativeLinearGradient.types';

export default requireNativeViewManager(
  'ExpoLinearGradient'
) as React.FC<NativeLinearGradientProps>;
