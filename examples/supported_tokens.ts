/**
 * Example of using the Renegade External Match Client to fetch supported tokens and token prices.
 *
 * This example demonstrates how to create a client and request supported tokens and token prices.
 */

import { ExternalMatchClient } from "../index";

// Get API credentials from environment variables
const API_KEY = process.env.EXTERNAL_MATCH_KEY || "";
const API_SECRET = process.env.EXTERNAL_MATCH_SECRET || "";

// Validate API credentials
if (!API_KEY || !API_SECRET) {
  console.error("Error: Missing API credentials");
  console.error(
    "Please set EXTERNAL_MATCH_KEY and EXTERNAL_MATCH_SECRET environment variables"
  );
  process.exit(1);
}

// Create the external match client
console.log("API KEY", API_KEY);
const client = ExternalMatchClient.newArbitrumSepoliaClient(
  API_KEY,
  API_SECRET
);

async function main() {
  try {
    const tokens = await client.getSupportedTokens();
    console.log("Supported tokens:", JSON.stringify(tokens, null, 2));

    const prices = await client.getTokenPrices();
    console.log("Token prices:", JSON.stringify(prices, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main().catch(console.error);
}
