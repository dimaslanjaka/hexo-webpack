/**
 * split array into chunks
 * @param array
 * @param chunkSize
 * @returns
 */
export function splitIntoChunks<T extends any[]>(array: T, chunkSize: number) {
  return array.flatMap((x, i) => (i % chunkSize === 0 ? [array.slice(i, i + chunkSize)] : []));
}
