/**
 * HTTP client for making authenticated requests to the Renegade relayer API.
 * This client handles request signing and authentication using HMAC-SHA256.
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { bytesToHex } from '@noble/hashes/utils';
import JSONBigInt from 'json-bigint';

// Constants for authentication
export const RENEGADE_HEADER_PREFIX = 'x-renegade';
export const RENEGADE_AUTH_HEADER = 'x-renegade-auth';
export const RENEGADE_AUTH_EXPIRATION_HEADER = 'x-renegade-auth-expiration';

// Authentication constants
const REQUEST_SIGNATURE_DURATION_MS = 10 * 1000; // 10 seconds in milliseconds

// Configure JSON-BigInt for parsing and stringifying
const jsonProcessor = JSONBigInt({
    alwaysParseAsBig: true,
    useNativeBigInt: true,
});

/**
 * Parse JSON string that may contain BigInt values
 */
export const parseBigJSON = (data: string) => {
    try {
        return jsonProcessor.parse(data);
    } catch (error) {
        // If parsing fails, return original data
        console.error('Failed to parse JSON with BigInt', error);
        return data;
    }
};

/**
 * Stringify object that may contain BigInt values
 */
export const stringifyBigJSON = (data: any) => {
    return jsonProcessor.stringify(data);
};

export class RelayerHttpClient {
    private client: AxiosInstance;
    private authKey: Uint8Array;

    /**
     * Initialize a new RelayerHttpClient.
     * 
     * @param baseUrl The base URL of the relayer API
     * @param authKey The base64-encoded authentication key for request signing
     */
    constructor(baseUrl: string, authKey: string) {
        this.client = axios.create({
            baseURL: baseUrl,
            transformRequest: [(data) => {
                // Use JSON-BigInt for stringifying request data
                if (data && typeof data === 'object') {
                    return stringifyBigJSON(data);
                }
                return data;
            }],
            transformResponse: [(data) => {
                // Use JSON-BigInt for parsing response data
                if (typeof data === 'string') {
                    return parseBigJSON(data);
                }
                return data;
            }],
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Decode base64 auth key
        this.authKey = this.decodeBase64(authKey);

        // Add request interceptor for authentication
        this.client.interceptors.request.use(
            this.addAuthInterceptor.bind(this),
            (error) => Promise.reject(error)
        );
    }

    /**
     * Make a GET request with custom headers.
     * 
     * @param path The API endpoint path
     * @param headers Additional headers to include
     * @returns The API response
     */
    public async get<T>(path: string, headers: Record<string, string> = {}): Promise<AxiosResponse<T>> {
        return this.client.get<T>(path, { headers });
    }

    /**
     * Make a POST request with custom headers.
     * 
     * @param path The API endpoint path
     * @param data The request body to send
     * @param headers Additional headers to include
     * @returns The API response
     */
    public async post<T, D = any>(path: string, data: D, headers: Record<string, string> = {}): Promise<AxiosResponse<T>> {
        return this.client.post<T>(path, data, { headers });
    }

    /**
     * Add authentication headers to a request.
     */
    private addAuthInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
        // Create headers if they don't exist
        if (!config.headers) {
            config.headers = axios.defaults.headers.common as AxiosRequestHeaders;
        }

        // Add timestamp and expiry
        const timestamp = Date.now();
        const expiry = timestamp + REQUEST_SIGNATURE_DURATION_MS;
        config.headers[RENEGADE_AUTH_EXPIRATION_HEADER] = expiry.toString();

        // Calculate signature
        const mac = hmac.create(sha256, this.authKey);

        // Get the full path including query params (url is already relative to baseUrl)
        const fullPath = config.url || '';
        const pathBytes = new TextEncoder().encode(fullPath);
        mac.update(pathBytes);

        // Add Renegade headers
        const headers = Object.entries(config.headers)
            .filter(([key]) => key.toLowerCase().startsWith(RENEGADE_HEADER_PREFIX))
            .filter(([key]) => key.toLowerCase() !== RENEGADE_AUTH_HEADER.toLowerCase())
            .sort(([a], [b]) => a.localeCompare(b));

        for (const [key, value] of headers) {
            mac.update(new TextEncoder().encode(key));
            mac.update(new TextEncoder().encode(value.toString()));
        }

        // Add body - use the same stringification as the request will use
        let body = '';
        if (config.data) {
            body = typeof config.data === 'string'
                ? config.data
                : stringifyBigJSON(config.data);
        }
        mac.update(new TextEncoder().encode(body));

        // Set signature header
        config.headers[RENEGADE_AUTH_HEADER] = this.encodeBase64(Buffer.from(mac.digest()));

        return config;
    }

    /**
     * Decode a base64 string to a Uint8Array.
     */
    private decodeBase64(base64: string): Uint8Array {
        return Buffer.from(base64, 'base64');
    }

    /**
     * Encode a Uint8Array or Buffer to a base64 string.
     */
    private encodeBase64(data: Uint8Array | Buffer): string {
        return Buffer.from(data).toString('base64').replace(/=+$/, '');
    }
} 