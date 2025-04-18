/**
 * Client for interacting with the Renegade external matching API.
 * 
 * This client handles authentication and provides methods for requesting quotes,
 * assembling matches, and executing trades.
 */

import { RelayerHttpClient, RENEGADE_HEADER_PREFIX } from './http';
import { VERSION } from './version';
import type {
    ExternalOrder,
    SignedExternalQuote,
    ExternalQuoteRequest,
    ExternalQuoteResponse,
    AssembleExternalMatchRequest,
    ExternalMatchResponse,
    ApiSignedExternalQuote,
    AtomicMatchApiBundle
} from './types';

// Constants for API URLs
const SEPOLIA_BASE_URL = "https://testnet.auth-server.renegade.fi";
const MAINNET_BASE_URL = "https://mainnet.auth-server.renegade.fi";

// Header constants
const RENEGADE_API_KEY_HEADER = "x-renegade-api-key";
const RENEGADE_SDK_VERSION_HEADER = "x-renegade-sdk-version";

// API Routes
const REQUEST_EXTERNAL_QUOTE_ROUTE = "/v0/matching-engine/quote";
const ASSEMBLE_EXTERNAL_MATCH_ROUTE = "/v0/matching-engine/assemble-external-match";

// Query Parameters
const DISABLE_GAS_SPONSORSHIP_QUERY_PARAM = "disable_gas_sponsorship";
const GAS_REFUND_ADDRESS_QUERY_PARAM = "refund_address";
const REFUND_NATIVE_ETH_QUERY_PARAM = "refund_native_eth";

/**
 * Get the SDK version string.
 * 
 * @returns The SDK version prefixed with "typescript-v"
 */
function getSdkVersion(): string {
    return `typescript-v${VERSION}`;
}

/**
 * Options for requesting a quote.
 */
export class RequestQuoteOptions {
    disableGasSponsorship: boolean = false;
    gasRefundAddress?: string;
    refundNativeEth: boolean = false;

    /**
     * Create a new instance of RequestQuoteOptions.
     */
    static new(): RequestQuoteOptions {
        return new RequestQuoteOptions();
    }

    /**
     * Set whether gas sponsorship should be disabled.
     */
    withGasSponsorshipDisabled(disableGasSponsorship: boolean): RequestQuoteOptions {
        this.disableGasSponsorship = disableGasSponsorship;
        return this;
    }

    /**
     * Set the gas refund address.
     */
    withGasRefundAddress(gasRefundAddress: string): RequestQuoteOptions {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    /**
     * Set whether to refund in native ETH.
     */
    withRefundNativeEth(refundNativeEth: boolean): RequestQuoteOptions {
        this.refundNativeEth = refundNativeEth;
        return this;
    }

    /**
     * Build the request path with query parameters.
     */
    buildRequestPath(): string {
        const params = new URLSearchParams();
        params.set(DISABLE_GAS_SPONSORSHIP_QUERY_PARAM, this.disableGasSponsorship.toString());
        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        if (this.refundNativeEth) {
            params.set(REFUND_NATIVE_ETH_QUERY_PARAM, this.refundNativeEth.toString());
        }

        return `${REQUEST_EXTERNAL_QUOTE_ROUTE}?${params.toString()}`;
    }
}

/**
 * Options for assembling an external match.
 */
export class AssembleExternalMatchOptions {
    doGasEstimation: boolean = false;
    allowShared: boolean = false;
    receiverAddress?: string;
    updatedOrder?: ExternalOrder;
    requestGasSponsorship: boolean = false;
    gasRefundAddress?: string;

    /**
     * Create a new instance of AssembleExternalMatchOptions.
     */
    static new(): AssembleExternalMatchOptions {
        return new AssembleExternalMatchOptions();
    }

    /**
     * Set whether to do gas estimation.
     */
    withGasEstimation(doGasEstimation: boolean): AssembleExternalMatchOptions {
        this.doGasEstimation = doGasEstimation;
        return this;
    }

    /**
     * Set whether to allow shared gas sponsorship.
     */
    withAllowShared(allowShared: boolean): AssembleExternalMatchOptions {
        this.allowShared = allowShared;
        return this;
    }

    /**
     * Set the receiver address.
     */
    withReceiverAddress(receiverAddress: string): AssembleExternalMatchOptions {
        this.receiverAddress = receiverAddress;
        return this;
    }

    /**
     * Set the updated order.
     */
    withUpdatedOrder(updatedOrder: ExternalOrder): AssembleExternalMatchOptions {
        this.updatedOrder = updatedOrder;
        return this;
    }

    /**
     * Set whether to request gas sponsorship.
     * @deprecated Request gas sponsorship when requesting a quote instead
     */
    withGasSponsorship(requestGasSponsorship: boolean): AssembleExternalMatchOptions {
        this.requestGasSponsorship = requestGasSponsorship;
        return this;
    }

    /**
     * Set the gas refund address.
     * @deprecated Request gas sponsorship when requesting a quote instead
     */
    withGasRefundAddress(gasRefundAddress: string): AssembleExternalMatchOptions {
        this.gasRefundAddress = gasRefundAddress;
        return this;
    }

    /**
     * Build the request path with query parameters.
     */
    buildRequestPath(): string {
        // If no query parameters are needed, return the base path
        if (!this.requestGasSponsorship && !this.gasRefundAddress) {
            return ASSEMBLE_EXTERNAL_MATCH_ROUTE;
        }

        const params = new URLSearchParams();
        if (this.requestGasSponsorship) {
            // We only write this query parameter if it was explicitly set
            params.set(DISABLE_GAS_SPONSORSHIP_QUERY_PARAM, (!this.requestGasSponsorship).toString());
        }

        if (this.gasRefundAddress) {
            params.set(GAS_REFUND_ADDRESS_QUERY_PARAM, this.gasRefundAddress);
        }

        return `${ASSEMBLE_EXTERNAL_MATCH_ROUTE}?${params.toString()}`;
    }
}

/**
 * Error thrown by the ExternalMatchClient.
 */
export class ExternalMatchClientError extends Error {
    statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'ExternalMatchClientError';
        this.statusCode = statusCode;
    }
}

/**
 * Client for interacting with the Renegade external matching API.
 */
export class ExternalMatchClient {
    private apiKey: string;
    private httpClient: RelayerHttpClient;

    /**
     * Initialize a new ExternalMatchClient.
     * 
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @param baseUrl The base URL of the Renegade API
     */
    constructor(apiKey: string, apiSecret: string, baseUrl: string) {
        this.apiKey = apiKey;
        this.httpClient = new RelayerHttpClient(baseUrl, apiSecret);
    }

    /**
     * Create a new client configured for the Sepolia testnet.
     * 
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @returns A new ExternalMatchClient configured for Sepolia
     */
    static newSepoliaClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(apiKey, apiSecret, SEPOLIA_BASE_URL);
    }

    /**
     * Create a new client configured for mainnet.
     * 
     * @param apiKey The API key for authentication
     * @param apiSecret The API secret for request signing
     * @returns A new ExternalMatchClient configured for mainnet
     */
    static newMainnetClient(apiKey: string, apiSecret: string): ExternalMatchClient {
        return new ExternalMatchClient(apiKey, apiSecret, MAINNET_BASE_URL);
    }

    /**
     * Request a quote for the given order.
     * 
     * @param order The order to request a quote for
     * @returns A promise that resolves to a signed quote if one is available, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async requestQuote(order: ExternalOrder): Promise<SignedExternalQuote | null> {
        return this.requestQuoteWithOptions(order, RequestQuoteOptions.new());
    }

    /**
     * Request a quote for the given order with custom options.
     * 
     * @param order The order to request a quote for
     * @param options Custom options for the quote request
     * @returns A promise that resolves to a signed quote if one is available, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async requestQuoteWithOptions(
        order: ExternalOrder,
        options: RequestQuoteOptions
    ): Promise<SignedExternalQuote | null> {
        const request: ExternalQuoteRequest = {
            external_order: order
        };

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        try {
            const response = await this.httpClient.post<ExternalQuoteResponse>(path, request, headers);

            // Handle 204 No Content (no quotes available)
            if (response.status === 204 || !response.data) {
                return null;
            }

            const quoteResp = response.data;
            const signedQuote: SignedExternalQuote = {
                quote: quoteResp.signed_quote.quote,
                signature: quoteResp.signed_quote.signature,
                gas_sponsorship_info: quoteResp.gas_sponsorship_info
            };

            return signedQuote;
        } catch (error: any) {
            // Handle HTTP-related errors from fetch implementation
            if (error.status === 204) {
                return null;
            }

            throw new ExternalMatchClientError(
                error.message || 'Failed to request quote',
                error.status
            );
        }
    }

    /**
     * Assemble a quote into a match bundle with default options.
     * 
     * @param quote The signed quote to assemble
     * @returns A promise that resolves to a match response if assembly succeeds, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async assembleQuote(quote: SignedExternalQuote): Promise<ExternalMatchResponse | null> {
        return this.assembleQuoteWithOptions(quote, AssembleExternalMatchOptions.new());
    }

    /**
     * Assemble a quote into a match bundle with custom options.
     * 
     * @param quote The signed quote to assemble
     * @param options Custom options for quote assembly
     * @returns A promise that resolves to a match response if assembly succeeds, null otherwise
     * @throws ExternalMatchClientError if the request fails
     */
    async assembleQuoteWithOptions(
        quote: SignedExternalQuote,
        options: AssembleExternalMatchOptions
    ): Promise<ExternalMatchResponse | null> {
        const signedQuote: ApiSignedExternalQuote = {
            quote: quote.quote,
            signature: quote.signature,
        };

        const request: AssembleExternalMatchRequest = {
            do_gas_estimation: options.doGasEstimation,
            allow_shared: options.allowShared,
            receiver_address: options.receiverAddress,
            signed_quote: signedQuote,
            updated_order: options.updatedOrder,
        };

        const path = options.buildRequestPath();
        const headers = this.getHeaders();

        try {
            const response = await this.httpClient.post<ExternalMatchResponse>(path, request, headers);

            // Handle 204 No Content
            if (response.status === 204 || !response.data) {
                return null;
            }

            return response.data;
        } catch (error: any) {
            // Handle HTTP-related errors from fetch implementation
            if (error.status === 204) {
                return null;
            }

            throw new ExternalMatchClientError(
                error.message || 'Failed to assemble quote',
                error.status
            );
        }
    }

    /**
     * Get the headers required for API requests.
     * 
     * @returns Headers containing the API key and SDK version
     */
    private getHeaders(): Record<string, string> {
        return {
            [RENEGADE_API_KEY_HEADER]: this.apiKey,
            [RENEGADE_SDK_VERSION_HEADER]: getSdkVersion(),
        };
    }
}
