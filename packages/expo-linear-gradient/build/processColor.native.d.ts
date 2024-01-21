/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */
import type { ColorValue } from 'react-native';
type NativeColorValue = any;
export type ProcessedColorValue = number | NativeColorValue;
declare function processColor(color?: (number | ColorValue) | null): ProcessedColorValue | null;
export default processColor;
//# sourceMappingURL=processColor.native.d.ts.map