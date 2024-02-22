'use strict';
// This file should not include Node specific code.
Object.defineProperty(exports, '__esModule', { value: true });
exports.deepFreeze =
  exports.generatePrefetchCode =
  exports.hasStatusCode =
  exports.decodeInput =
  exports.encodeInput =
    void 0;
const encodeInput = (input) => {
  if (input === '') {
    return 'index.txt';
  }
  if (input === 'index') {
    throw new Error('Input should not be `index`');
  }
  // if (input.startsWith('/')) {
  //     throw new Error('Input should not start with `/`');
  // }
  // if (input.endsWith('/')) {
  //     throw new Error('Input should not end with `/`');
  // }
  return input + '.txt';
};
exports.encodeInput = encodeInput;
const decodeInput = (encodedInput) => {
  if (encodedInput === 'index.txt') {
    return '';
  }
  if (encodedInput?.endsWith('.txt')) {
    return encodedInput.slice(0, -'.txt'.length);
  }
  const err = new Error('Invalid encoded input');
  err.statusCode = 400;
  throw err;
};
exports.decodeInput = decodeInput;
const hasStatusCode = (x) => typeof x?.statusCode === 'number';
exports.hasStatusCode = hasStatusCode;
const generatePrefetchCode = (basePrefix, inputs, moduleIds) => {
  const inputsArray = Array.from(inputs);
  let code = '';
  if (inputsArray.length) {
    code += `
  globalThis.__WAKU_PREFETCHED__ = {
  ${inputsArray
    .map((input) => {
      const url = basePrefix + (0, exports.encodeInput)(input);
      return `  '${url}': fetch('${url}'),`;
    })
    .join('\n')}
  };`;
  }
  for (const moduleId of moduleIds) {
    code += `
  import('${moduleId}');`;
  }
  return code;
};
exports.generatePrefetchCode = generatePrefetchCode;
const deepFreeze = (x) => {
  if (typeof x === 'object' && x !== null) {
    Object.freeze(x);
    for (const value of Object.values(x)) {
      (0, exports.deepFreeze)(value);
    }
  }
};
exports.deepFreeze = deepFreeze;
//# sourceMappingURL=utils.js.map
