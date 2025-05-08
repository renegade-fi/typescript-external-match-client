/**
 * Fetch a quote from the external api and execute a malleable match
 *
 * Malleable matches allow the exact swap amount to be determined at settlement
 * time within a predefined range, offering more flexibility than standard
 * matches.
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
    side: OrderSide.SELL,
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
        const bundle = await client.assembleMalleableQuote(quote);

        if (!bundle) {
            console.log("No match available");
            return;
        }

        // Print bundle info
        console.log("Bundle info:");
        const [minBase, maxBase] = bundle.baseBounds();
        console.log(`Base bounds: ${minBase} - ${maxBase}`);

        // Pick a random base amount and see the send and receive amounts at that base amount
        const dummyBaseAmount = randomInRange(minBase, maxBase);
        const dummySendAmount = bundle.sendAmountAtBase(dummyBaseAmount);
        const dummyReceiveAmount = bundle.receiveAmountAtBase(dummyBaseAmount);
        console.log(`Hypothetical base amount: ${dummyBaseAmount}`);
        console.log(`Hypothetical send amount: ${dummySendAmount}`);
        console.log(`Hypothetical receive amount: ${dummyReceiveAmount}`);

        // Pick an actual base amount to swap with
        const swappedBaseAmount = randomInRange(minBase, maxBase);

        // Setting the base amount will return the receive amount at the new base
        // You can also call sendAmount and receiveAmount to get the amounts at the
        // currently set base amount
        const _recv = bundle.setBaseAmount(swappedBaseAmount);
        const send = bundle.sendAmount();
        const recv = bundle.receiveAmount();
        console.log(`Swapped base amount: ${swappedBaseAmount}`);
        console.log(`Send amount: ${send}`);
        console.log(`Receive amount: ${recv}`);

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

/**
 * Generate a random value in the given range
 */
function randomInRange(min: bigint, max: bigint): bigint {
    return min + BigInt(Math.floor(Math.random() * (Number(max) - Number(min))));
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
