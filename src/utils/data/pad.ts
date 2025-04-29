import type { Hex, ByteArray } from "./types";

type PadOptions = {
    dir?: "left" | "right" | undefined;
    size?: number | null | undefined;
};
export type PadReturnType<value extends ByteArray | Hex> = value extends Hex ? Hex : ByteArray;

/**
 * Pads a hex string or byte array to a given size
 */
export function pad<value extends ByteArray | Hex>(
    hexOrBytes: value,
    { dir, size = 32 }: PadOptions = {},
): PadReturnType<value> {
    if (typeof hexOrBytes === "string")
        return padHex(hexOrBytes, { dir, size }) as PadReturnType<value>;
    return padBytes(hexOrBytes, { dir, size }) as PadReturnType<value>;
}

/**
 * Pads a hex string to a given size
 */
export function padHex(hex_: Hex, { dir, size = 32 }: PadOptions = {}) {
    if (size === null) return hex_;
    const hex = hex_.replace("0x", "");
    if (hex.length > size * 2)
        throw new Error(`Hex size (${size}) exceeds padding size (${size}).`);

    return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size * 2, "0")}` as Hex;
}

/**
 * Pads a byte array to a given size
 */
export function padBytes(bytes: ByteArray, { dir, size = 32 }: PadOptions = {}) {
    if (size === null) return bytes;
    if (bytes.length > size)
        throw new Error(`Bytes size (${bytes.length}) exceeds padding size (${size}).`);
    const paddedBytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        const padEnd = dir === "right";
        // @ts-ignore
        paddedBytes[padEnd ? i : size - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
    }
    return paddedBytes;
}
