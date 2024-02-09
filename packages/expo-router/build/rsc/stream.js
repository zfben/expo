"use strict";
// From waku https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/utils/stream.ts#L1
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamToString = exports.concatUint8Arrays = exports.endStream = void 0;
const endStream = async (stream, message) => {
    const writer = stream.getWriter();
    await writer.ready;
    if (message) {
        await writer.write(new TextEncoder().encode(message));
    }
    await writer.close();
};
exports.endStream = endStream;
const concatUint8Arrays = (arrs) => {
    const len = arrs.reduce((acc, arr) => acc + arr.length, 0);
    const array = new Uint8Array(len);
    let offset = 0;
    for (const arr of arrs) {
        array.set(arr, offset);
        offset += arr.length;
    }
    return array;
};
exports.concatUint8Arrays = concatUint8Arrays;
const streamToString = async (stream) => {
    const decoder = new TextDecoder();
    const reader = stream.getReader();
    const outs = [];
    let result;
    do {
        result = await reader.read();
        if (result.value) {
            if (!(result.value instanceof Uint8Array)) {
                throw new Error('Unexepected buffer type');
            }
            outs.push(decoder.decode(result.value, { stream: true }));
        }
    } while (!result.done);
    outs.push(decoder.decode());
    return outs.join('');
};
exports.streamToString = streamToString;
//# sourceMappingURL=stream.js.map