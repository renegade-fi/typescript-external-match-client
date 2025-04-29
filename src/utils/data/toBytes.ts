import { numberToHex, type NumberToHexOpts } from "./toHex";
import type { ByteArray, Hex } from "./types";

const charCodeMap = {
    zero: 48,
    nine: 57,
    A: 65,
    F: 70,
    a: 97,
    f: 102,
} as const;

function charCodeToBase16(char: number) {
    if (char >= charCodeMap.zero && char <= charCodeMap.nine) return char - charCodeMap.zero;
    if (char >= charCodeMap.A && char <= charCodeMap.F) return char - (charCodeMap.A - 10);
    if (char >= charCodeMap.a && char <= charCodeMap.f) return char - (charCodeMap.a - 10);
    return undefined;
}

export type HexToBytesOpts = {
    /** Size of the output bytes. */
    size?: number | undefined;
};

/**
 * Encodes a hex string into a byte array.
 */
export function hexToBytes(hex_: Hex): ByteArray {
    const hex = hex_;

    let hexString = hex.slice(2) as string;
    if (hexString.length % 2) hexString = `0${hexString}`;

    const length = hexString.length / 2;
    const bytes = new Uint8Array(length);
    for (let index = 0, j = 0; index < length; index++) {
        const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
        const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
        if (nibbleLeft === undefined || nibbleRight === undefined) {
            throw new Error(
                `Invalid byte sequence ("${hexString[j - 2]}${
                    hexString[j - 1]
                }" in "${hexString}").`,
            );
        }
        bytes[index] = nibbleLeft * 16 + nibbleRight;
    }
    return bytes;
}

/**
 * Encodes a number into a byte array.
 */
export function numberToBytes(value: bigint | number, opts?: NumberToHexOpts | undefined) {
    const hex = numberToHex(value, opts);
    return hexToBytes(hex);
}
