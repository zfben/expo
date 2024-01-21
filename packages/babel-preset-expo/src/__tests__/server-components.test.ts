import * as babel from '@babel/core';

import preset from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  projectRoot: '/',
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEF_OPTIONS = {
  // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
  filename: '/unknown',

  babelrc: false,
  presets: [[preset, { disableImportExportTransform: true }]],
  sourceMaps: true,
  configFile: false,
  compact: false,
  comments: true,
  retainLines: false,
  caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

xit(`does nothing without use client directive`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
  };

  const sourceCode = `
  export const foo = 'bar';
`;

  const contents = babel.transform(sourceCode, options)!.code;

  expect(contents).toMatchSnapshot();
});

xit(`replaces client exports with React client references`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
  };

  const sourceCode = `
"use client";
import { Text } from 'react-native';

export const foo = 'bar';

export default function App() {
  return <Text>Hello World</Text>
}
`;

  const contents = babel.transform(sourceCode, options)!.code;
  expect(contents).toMatchSnapshot();
});

it(`replaces server action exports with React server references`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
  };

  const sourceCode = `
  'use server';

  export const greet = (name: string) => \`Hello $\{name} from server!\`;
`;

  const contents = babel.transform(sourceCode, options)!.code;
  expect(contents).toMatchSnapshot();
});

xit(`collects metadata with React client references`, () => {
  const options = {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, isReactServer: false, platform: 'ios' }),
  };

  const sourceCode = `
"use client";
import { Text } from 'react-native';

export const foo = 'bar';

export default function App() {
  return <Text>Hello World</Text>
}
`;

  const contents = babel.transform(sourceCode, options);
  expect(contents.metadata).toEqual({
    clientReferences: { entryPoint: '/unknown', exports: ['foo', 'default'] },
  });
  //   expect(contents.code).toMatchSnapshot();
});
