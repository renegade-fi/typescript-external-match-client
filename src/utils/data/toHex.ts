import { pad } from "./pad";
import type { Hex } from "./types";

/**
 * Encodes a byte array into a hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
    return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export type NumberToHexOpts =
    | {
          /** Whether or not the number of a signed representation. */
          signed?: boolean | undefined;
          /** The size (in bytes) of the output hex value. */
          size: number;
      }
    | {
          signed?: undefined;
          /** The size (in bytes) of the output hex value. */
          size?: number | undefined;
      };

/**
 * Encodes a number or bigint into a hex string
 */
export function numberToHex(value_: number | bigint, opts: NumberToHexOpts = {}): Hex {
    const { signed, size } = opts;

    const value = BigInt(value_);

    let maxValue: bigint | number | undefined;
    if (size) {
        if (signed) maxValue = (1n << (BigInt(size) * 8n - 1n)) - 1n;
        else maxValue = 2n ** (BigInt(size) * 8n) - 1n;
    } else if (typeof value_ === "number") {
        maxValue = BigInt(Number.MAX_SAFE_INTEGER);
    }

    const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;

    if ((maxValue && value > maxValue) || value < minValue) {
        const suffix = typeof value_ === "bigint" ? "n" : "";
        const max = maxValue ? `${maxValue}${suffix}` : undefined;
        const min = `${minValue}${suffix}`;
        throw new Error(
            `Number "${value}" is not in safe ${
                size ? `${size * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""
            }integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`,
        );
    }

    const hex = `0x${(
        signed && value < 0 ? (1n << BigInt(size * 8)) + BigInt(value) : value
    ).toString(16)}` as Hex;
    if (size) return pad(hex, { size }) as Hex;
    return hex;
}
