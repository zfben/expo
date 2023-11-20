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

const register = require('react-server-dom-webpack/node-register');
register();

it(`renders RSC`, async () => {
  //   const { ctx } = renderRouter({
  //     index: function MyIndexRoute() {
  //       //   const router = useRouter();

  //       return (
  //         <Text testID="index" onPress={() => router.push('/profile/test-name')}>
  //           Press me
  //         </Text>
  //       );
  //     },
  //     '/profile/[name]': function MyRoute() {
  //       const { name } = useGlobalSearchParams();
  //       return <Text>{name}</Text>;
  //     },
  //   });
  //   jest.mock();

  const moduleMap = { foo: {} };
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

  const rsc = ReactDOMServer.renderToPipeableStream(
    // TODO: Does this support async?
    <Component {...props} />,
    // await Component(props),
    // TODO: Me!
    moduleMap
  );

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

  console.log('rsc', rsc.pipe);
  const res = await rscStream.getReader().read();

  console.log('res', res.value.toString());
});
