function decodeStream(textDecoder = new TextDecoder()) {
  return new TransformStream<Uint8Array, string>({
    transform(chunk, controller) {
      return controller.enqueue(textDecoder.decode(chunk, { stream: true }));
    },
    flush(controller) {
      return controller.enqueue(textDecoder.decode());
    },
  });
}

// const streamToString = async (stream: ReadableStream): Promise<string> => {
//     const decoder = new TextDecoder();
//     const reader = stream.getReader();
//     const outs: string[] = [];
//     let result: ReadableStreamReadResult<unknown>;
//     do {
//       result = await reader.read();
//       if (result.value) {
//         if (!(result.value instanceof Uint8Array)) {
//           throw new Error('Unexepected buffer type');
//         }
//         outs.push(decoder.decode(result.value, { stream: true }));
//       }
//     } while (!result.done);
//     outs.push(decoder.decode());
//     return outs.join('');
//   };
export async function streamToStringAsync(stream: ReadableStream<Uint8Array>) {
  let output = '';

  await stream
    // Decode the streamed chunks to turn them into strings.
    .pipeThrough(decodeStream())
    .pipeTo(
      new WritableStream<string>({
        write(chunk) {
          output += chunk;
        },
      })
    );

  return output;
}
