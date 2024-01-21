'use server';

export const greet = (name: string) => {
  console.log('IN_SERVER_ACTION:', name, arguments);
  return `Hello ${name} from server!`;
};

// console.log('bafoo:', module.exports);

// (function () {
//   if (typeof module.exports === 'function') {
//     require('react-server-dom-webpack/server').registerServerReference(
//       module.exports,
//       'file:///unknown',
//       null
//     );
//   } else {
//     for (var key in module.exports) {
//       if (typeof module.exports[key] === 'function')
//         require('react-server-dom-webpack/server').registerServerReference(
//           module.exports[key],
//           'file:///unknown',
//           key
//         );
//     }
//   }
// })();
