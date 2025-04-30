/**
 * Renegade External Match Client
 * A TypeScript client for interacting with the Renegade Darkpool API.
 */

// Export main client
export {
    ExternalMatchClient,
    ExternalMatchClientError,
    RequestQuoteOptions,
    AssembleExternalMatchOptions,
} from "./src/client";

// Export types
export type {
    ApiExternalAssetTransfer,
    ApiTimestampedPrice,
    ApiExternalMatchResult,
    FeeTake,
    ExternalOrder,
    ApiExternalQuote,
    ApiSignedExternalQuote,
    GasSponsorshipInfo,
    SignedGasSponsorshipInfo,
    SignedExternalQuote,
    SettlementTransaction,
    AtomicMatchApiBundle,
    ExternalQuoteRequest,
    ExternalQuoteResponse,
    AssembleExternalMatchRequest,
    ExternalMatchResponse,
} from "./src/types/index";

// Export enums
export { OrderSide } from "./src/types/index";
