/**
 * Example of using the Renegade External Match Client to fetch order book depth.
 *
 * This example demonstrates how to create a client and request order book depth for a given base token mint.
 */

import { ExternalMatchClient } from "../index";
import type { OrderBookDepth } from "../src/types";

// Get API credentials from environment variables
const API_KEY = process.env.EXTERNAL_MATCH_KEY || "";
const API_SECRET = process.env.EXTERNAL_MATCH_SECRET || "";

// Validate API credentials
if (!API_KEY || !API_SECRET) {
    console.error("Error: Missing API credentials");
    console.error("Please set EXTERNAL_MATCH_KEY and EXTERNAL_MATCH_SECRET environment variables");
    process.exit(1);
}

// Create the external match client
console.log("API KEY", API_KEY);
const client = ExternalMatchClient.newArbitrumSepoliaClient(API_KEY, API_SECRET);

// Example base token mint (USDC)
const WETH = "0xc3414a7ef14aaaa9c4522dfc00a4e66e74e9c25a";

async function main() {
    try {
        console.log("Fetching order book depth for", WETH);
        const depth = (await client.getOrderBookDepth(WETH)) as OrderBookDepth;
        console.log("Order book depth:", JSON.stringify(depth, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

// Only run if this file is being executed directly
if (require.main === module) {
    main().catch(console.error);
}
