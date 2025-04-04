/**
 * Type definitions for the Renegade Darkpool API.
 */

export enum OrderSide {
    BUY = "Buy",
    SELL = "Sell",
}

export interface ApiExternalAssetTransfer {
    mint: string;
    amount: bigint;
}

export interface ApiTimestampedPrice {
    price: string;
    timestamp: bigint;
}

export interface ApiExternalMatchResult {
    quote_mint: string;
    base_mint: string;
    quote_amount: bigint;
    base_amount: bigint;
    direction: OrderSide;
}

export interface FeeTake {
    relayer_fee: bigint;
    protocol_fee: bigint;
}

export interface ExternalOrder {
    quote_mint: string;
    base_mint: string;
    side: OrderSide;
    base_amount?: bigint;
    quote_amount?: bigint;
    exact_base_output?: bigint;
    exact_quote_output?: bigint;
    min_fill_size?: bigint;
}

export interface ApiExternalQuote {
    order: ExternalOrder;
    match_result: ApiExternalMatchResult;
    fees: FeeTake;
    send: ApiExternalAssetTransfer;
    receive: ApiExternalAssetTransfer;
    price: ApiTimestampedPrice;
    timestamp: bigint;
}

export interface ApiSignedExternalQuote {
    quote: ApiExternalQuote;
    signature: string;
}

export interface GasSponsorshipInfo {
    refund_amount: bigint;
    refund_native_eth: boolean;
    refund_address?: string;
}

export interface SignedGasSponsorshipInfo {
    gas_sponsorship_info: GasSponsorshipInfo;
    signature: string;
}

export interface SignedExternalQuote {
    quote: ApiExternalQuote;
    signature: string;
    gas_sponsorship_info?: SignedGasSponsorshipInfo;
}

export interface SettlementTransaction {
    tx_type: string;
    to: string;
    data: string;
    value: string;
}

export interface AtomicMatchApiBundle {
    match_result: ApiExternalMatchResult;
    fees: FeeTake;
    receive: ApiExternalAssetTransfer;
    send: ApiExternalAssetTransfer;
    settlement_tx: SettlementTransaction;
}

export interface ExternalQuoteRequest {
    external_order: ExternalOrder;
}

export interface ExternalQuoteResponse {
    signed_quote: ApiSignedExternalQuote;
    gas_sponsorship_info?: SignedGasSponsorshipInfo;
}

export interface AssembleExternalMatchRequest {
    do_gas_estimation?: boolean;
    receiver_address?: string;
    signed_quote: ApiSignedExternalQuote;
    updated_order?: ExternalOrder;
}

export interface ExternalMatchResponse {
    match_bundle: AtomicMatchApiBundle;
    gas_sponsored: boolean;
    gas_sponsorship_info?: GasSponsorshipInfo;
} 