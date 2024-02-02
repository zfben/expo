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

function getOpts(caller: Record<string, string | boolean>) {
  return {
    ...DEF_OPTIONS,
    caller: getCaller({ ...ENABLED_CALLER, ...caller }),
  };
}

describe('forbidden server APIs', () => {
  function runServerPass(src: string) {
    return babel.transform(
      src,
      getOpts({
        isReactServer: true,
        platform: 'ios',
      })
    );
  }
  it(`does not assert importing client-side APIs in client components (react server mode)`, () => {
    // This test covers the order of server registry running before the assertion to remove the import.
    expect(runServerPass(`"use client"; import { useState } from 'react';`).code).toMatch(
      'react-server-dom-webpack'
    );
  });
  it(`asserts importing client-side React APIs in server components`, () => {
    expect(() => runServerPass(`import { useState } from 'react';`)).toThrowErrorMatchingSnapshot();
    expect(() => runServerPass(`import { useRef, useContext } from 'react';`)).toThrowError();
    expect(() => runServerPass(`import { PureComponent } from 'react';`)).toThrowError();
    expect(() => runServerPass(`import { Component } from 'react';`)).toThrowError();
    expect(() => runServerPass(`import { useRandom } from 'react';`)).not.toThrowError();
  });
  it(`asserts importing client-side react-dom APIs in server components`, () => {
    expect(() =>
      runServerPass(`import { findDOMNode } from 'react-dom';`)
    ).toThrowErrorMatchingSnapshot();
    expect(() => runServerPass(`import { useRandom } from 'react-dom';`)).not.toThrowError();
  });
  it(`does not assert importing client-side react-dom APIs in server components if they are in node modules`, () => {
    expect(
      babel.transform(`import { findDOMNode } from 'react-dom';`, {
        ...DEF_OPTIONS,
        filename: '/bacon/node_modules/@bacons/breakfast.js',
        caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
      }).code
    ).toBe(`import { findDOMNode } from 'react-dom';`);
  });

  it(`asserts client-side React API usage in server components`, () => {
    expect(() =>
      runServerPass(`
    import * as React from 'react';
    
    export default function App() {
      const [state, setState] = React.useState(0);
      return <div>{state}</div>;
    }
    `)
    ).toThrow(/cannot be used in a React server component/);
  });
  it(`asserts client-side React API usage in server components (default import)`, () => {
    expect(() =>
      runServerPass(`
    import React from 'react';
    
    export default function App() {
      const ref = React.useRef(null);
      return <div>{ref}</div>;
    }
    `)
    ).toThrow(/cannot be used in a React server component/);
  });
  it(`asserts client-side React class component usage in server components`, () => {
    expect(() =>
      runServerPass(`
    import React from 'react';
    
    class App extends React.Component {
        render() {
        return <div />;
        }
    }
    `)
    ).toThrow(/Class components cannot be/);
  });

  it(`allows client-side React API usage in client components`, () => {
    runServerPass(`
    "use client"
    import React from 'react';
    
    export default function App() {
      const ref = React.useRef(null);
      return <div>{ref}</div>;
    }
    `);
    runServerPass(`
    "use client"
    import * as React from 'react';
    
    export default function App() {
      const ref = React.useRef(null);
      return <div>{ref}</div>;
    }
    `);
  });

  it(`allows client-side React class component usage in client components`, () => {
    runServerPass(`
      "use client"
    import React from 'react';
    
    class App extends React.Component {
        render() {
        return <div />;
        }
    }
    `);
  });
});

describe('use client', () => {
  it(`does nothing without use client directive`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
    };

    const sourceCode = `
      export const foo = 'bar';
    `;

    const contents = babel.transform(sourceCode, options)!.code;

    expect(contents).toMatchSnapshot();
    expect(contents).not.toMatch('react-server-dom-webpack');
  });
  it(`collects metadata with React client references`, () => {
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
      clientReferences: { entryPoint: 'file:///unknown', exports: ['foo', 'default'] },
    });

    // This isn't added because the process is not react server.
    expect(contents.code).not.toMatch('react-server-dom-webpack');
  });

  it(`replaces client exports with React client references`, () => {
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

    expect(contents).toMatch('react-server-dom-webpack');
  });

  it(`asserts that use client and use server cannot be used together`, () => {
    const options = {
      ...DEF_OPTIONS,
      caller: getCaller({ ...ENABLED_CALLER, isReactServer: true, platform: 'ios' }),
    };

    const sourceCode = `
    'use server';
    'use client';
    
    export const greet = (name: string) => \`Hello $\{name} from server!\`;
    `;

    expect(() => babel.transform(sourceCode, options)).toThrowErrorMatchingSnapshot();
  });
});

describe('use server', () => {
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
});
