import type { ByteArray } from "./types";

/**
 * Concatenates an array of byte arrays into a single byte array
 */
export function concatBytes(values: readonly ByteArray[]): ByteArray {
    let length = 0;
    for (const arr of values) {
        length += arr.length;
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const arr of values) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
