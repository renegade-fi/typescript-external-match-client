/**
 * Basic example of using the Renegade External Match Client
 *
 * This example demonstrates how to create a client, request a quote, assemble a match, and submit the transaction on-chain.
 */

import { ExternalMatchClient, OrderSide } from "../index";
import type { ExternalOrder } from "../index";

// Viem imports for on-chain transactions
import { http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

// Get API credentials from environment variables
const API_KEY = process.env.EXTERNAL_MATCH_KEY || "";
const API_SECRET = process.env.EXTERNAL_MATCH_SECRET || "";
const PRIVATE_KEY = process.env.PKEY || "";
const RPC_URL = process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

// Validate API credentials
if (!API_KEY || !API_SECRET) {
    console.error("Error: Missing API credentials");
    console.error("Please set EXTERNAL_MATCH_KEY and EXTERNAL_MATCH_SECRET environment variables");
    process.exit(1);
}

// Validate wallet private key
if (!PRIVATE_KEY) {
    console.error("Error: Missing private key");
    console.error("Please set PKEY environment variable");
    process.exit(1);
}

// Set up wallet client for blockchain transactions
const privateKey = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
const walletClient = createWalletClient({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
});

// Create the external match client
console.log("API KEY", API_KEY);
const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

// Example order for USDC/WETH pair
const order: ExternalOrder = {
    quote_mint: "0xdf8d259c04020562717557f2b5a3cf28e92707d1", // USDC
    base_mint: "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a", // WETH
    side: OrderSide.BUY,
    quote_amount: BigInt(20_000_000), // 20 USDC
};

/**
 * Submit a transaction to the chain
 * @param settlementTx The settlement transaction
 * @returns The transaction hash
 */
async function submitTransaction(settlementTx: any): Promise<`0x${string}`> {
    console.log("Submitting transaction...");

    const tx = await walletClient.sendTransaction({
        to: settlementTx.to as `0x${string}`,
        data: settlementTx.data as `0x${string}`,
        value: settlementTx.value ? BigInt(settlementTx.value) : BigInt(0),
    });

    return tx;
}

// Full example with on-chain submission
async function fullExample() {
    try {
        // Step 1: Request a quote
        console.log("Requesting quote...");
        const quote = await client.requestQuote(order);

        if (!quote) {
            console.log("No quote available");
            return;
        }

        console.log("Quote received!");

        // Step 2: Assemble the quote into a match bundle
        console.log("Assembling match...");
        const bundle = await client.assembleQuote(quote);

        if (!bundle) {
            console.log("No match available");
            return;
        }

        console.log("Match assembled!");

        // Step 3: Submit the transaction on-chain
        const txHash = await submitTransaction(bundle.match_bundle.settlement_tx);
        console.log(
            "Transaction submitted:",
            `${walletClient.chain.blockExplorers?.default.url}/tx/${txHash}`,
        );
    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the examples
async function main() {
    console.log("Running full example with on-chain submission...");
    await fullExample();
}

// Only run if this file is being executed directly
if (require.main === module) {
    main().catch(console.error);
}
