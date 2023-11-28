// import { renderRouter } from '../../testing-library';
// import { renderToPipeableStream } from '../renderStaticContent';
// import { Text } from 'react-native';
import React from 'react';
import { Writable } from 'stream';
// import { router } from 'expo-router';
// import { useGlobalSearchParams } from '../../hooks';
// import requireContext from '../../testing-library/require-context-ponyfill';

jest.mock('../../../_ctx-html.js', () => {
  const { inMemoryContext } = require('../../testing-library/context-stubs');
  return inMemoryContext({});
});

jest.mock('../../../_ctx.web.js', () => {
  const { inMemoryContext } = require('../../testing-library/context-stubs');
  return inMemoryContext({
    index: function MyIndexRoute() {
      //   const router = useRouter();

      return <p>Press me</p>;
    },
    '/profile/[name]': function MyRoute() {
      //   const { name } = useGlobalSearchParams();
      //   return <Text>{name}</Text>;
      return <p>Profile</p>;
    },
  });
});

import ReactDOMServer from 'react-dom/server.node';

const { renderToPipeableStream } = require('react-server-dom-webpack/server');
const register = require('react-server-dom-webpack/node-register');
register();

it(`renders browser-native RSC`, async () => {
  const moduleMap = {};

  expect(await renderFlight(<div foo="bar" />, moduleMap)).toEqual(
    `0:["$","div",null,{"foo":"bar"}]`
  );
});

it(`renders with client references`, async () => {
  const moduleMap = {
    Component: {
      id: './src/index.client.js',
      chunks: ['main'],
      name: '',
    },
  };

  const props = {};

  function Other() {
    return <span>Hey</span>;
  }
  const Component = async function App() {
    return (
      <div>
        Hey 1<Other />
      </div>
    );
  };

  expect(await renderFlight(<Component {...props} />, moduleMap)).toEqual(`0:"$L1"`);
});

async function renderFlight(component: React.ReactNode, moduleMap: any) {
  const rsc = renderToPipeableStream(component, moduleMap);

  const rscStream = new ReadableStream({
    start(controller) {
      rsc.pipe(
        new Writable({
          write(chunk, encoding, callback) {
            controller.enqueue(chunk);
            callback();
          },
          destroy(error, callback) {
            if (error) {
              controller.error(error);
            } else {
              controller.close();
            }
            callback(error);
          },
        })
      );
    },
  });

  const res = await rscStream.getReader().read();
  return res.value.toString().trim();
}
