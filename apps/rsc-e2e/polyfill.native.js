// import 'react-native-polyfill-globals/auto';
// import 'react-native-polyfill-globals/src/base64';
// import 'react-native-polyfill-globals/src/encoding';
// import 'react-native-polyfill-globals/src/readable-stream';
// import 'react-native-polyfill-globals/src/fetch';

// export default () => {
[
  require('react-native-polyfill-globals/src/base64'),
  require('react-native-polyfill-globals/src/encoding'),
  // require('react-native-polyfill-globals/src/readable-stream'),
  // require('react-native-polyfill-globals/src/fetch'),
  // require('react-native-polyfill-globals/src/url'),
  // require('react-native-polyfill-globals/src/crypto'),
].forEach(({ polyfill }) => polyfill());
// };
