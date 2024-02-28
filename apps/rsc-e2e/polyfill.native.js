// import 'react-native-polyfill-globals/auto';
// import 'react-native-polyfill-globals/src/base64';
// import 'react-native-polyfill-globals/src/encoding';
// import 'react-native-polyfill-globals/src/readable-stream';
// import 'react-native-polyfill-globals/src/fetch';
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
import { wrapFetchWithWindowLocation } from '@expo/metro-runtime/build/location/install.native';

// export default () => {
[
  require('react-native-polyfill-globals/src/base64'),
  require('react-native-polyfill-globals/src/encoding'),
  require('react-native-polyfill-globals/src/readable-stream'),
  ({ polyfill() { 



    const { fetch, Headers, Request, Response } = require('react-native-fetch-api');

    
    // wrapFetchWithWindowLocation(fetch)
    Object.defineProperty(global, 'fetch', {
      value: wrapFetchWithWindowLocation(fetch),
    });
    // polyfillGlobal('fetch', () => );
    polyfillGlobal('Headers', () => Headers);
    polyfillGlobal('Request', () => Request);
    polyfillGlobal('Response', () => Response);


  }}),
  // require('react-native-polyfill-globals/src/fetch'),
  // require('react-native-polyfill-globals/src/url'),
  // require('react-native-polyfill-globals/src/crypto'),
].forEach(({ polyfill }) => polyfill());
// };
