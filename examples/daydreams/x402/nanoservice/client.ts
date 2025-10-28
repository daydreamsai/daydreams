import { config } from "dotenv";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { decodeXPaymentResponse, wrapFetchWithPayment } from "x402-fetch";

config();

/**
 * Example client for interacting with the AI nano service
 *
 * This client demonstrates:
 * - Automatic payment handling using x402-fetch
 * - Session management for stateful conversations
 * - Multiple service types (assistant, analyzer, generator)
 * - Payment response decoding for transaction details
 *
 * The x402-fetch library wraps the standard fetch API to automatically
 * handle micropayments when accessing paid endpoints.
 */

// Parse command line arguments
const args = process.argv.slice(2);
const urlFlagIndex = args.indexOf('--url');
const SERVICE_URL = urlFlagIndex !== -1 && args[urlFlagIndex + 1] 
  ? args[urlFlagIndex + 1] 
  : process.env.SERVICE_URL || "http://localhost:4021";

const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY environment variable");
  process.exit(1);
}

// Create account and payment-enabled fetch
const account = privateKeyToAccount(PRIVATE_KEY);
const fetchWithPayment = wrapFetchWithPayment(fetch, account);

console.log("Using account:", account.address);

// Helper function to make requests to the service
async function callService(
  endpoint: string,
  data: any,
  method: string = "POST",
  showPaymentInfo: boolean = true
) {
  try {
    const url = `${SERVICE_URL}${endpoint}`;

    // Use payment-enabled fetch for paid endpoints
    const isPaidEndpoint =
      endpoint.startsWith("/service/") || endpoint === "/assistant";
    const fetchFn = isPaidEndpoint ? fetchWithPayment : fetch;

    console.log("🔍 Calling service:", url);

    const response = await fetchFn(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Decode and show payment info if requested
    if (showPaymentInfo && isPaidEndpoint) {
      const paymentHeader = response.headers.get("x-payment-response");
      if (paymentHeader) {
        const paymentResponse = decodeXPaymentResponse(paymentHeader);
        console.log("💳 Payment Info:", {
          success: paymentResponse.success,
          transaction: paymentResponse.transaction,
          network: paymentResponse.network,
          payer: paymentResponse.payer,
        });
      }
    }

    return result;
  } catch (error: any) {
    console.error("Request failed:", error.message || error);
    if (error.response?.data?.error) {
      console.error("Server error:", error.response.data.error);
    }
    throw error;
  }
}

// Track which server type we're using
let serverType: "basic" | "advanced" | null = null;

// Example: Basic assistant query
async function askAssistant(
  query: string,
  userId: string = "demo-user",
  showPayment = true
) {
  console.log("\n📤 Asking assistant:", query);

  // Use appropriate endpoint based on server type
  const endpoint = serverType === "basic" ? "/assistant" : "/service/assistant";
  const body =
    serverType === "basic"
      ? { query, sessionId: userId } // Basic server uses sessionId
      : { query, userId }; // Advanced server uses userId

  const result = await callService(endpoint, body, "POST", showPayment);

  console.log("📥 Response:", result.response);
  if (result.usage) {
    console.log("📊 Usage:", result.usage);
  }

  return result;
}

// Example: Make a request and show payment details
async function demoPayment() {
  console.log("\n💳 Demonstrating payment flow...");

  try {
    // Make a paid request with payment info
    await askAssistant("Show me how x402 payments work", "payment-demo", true);

    // Try the basic server endpoint too if available
    try {
      const result = await callService(
        "/assistant",
        {
          query: "Hello from x402 client",
          sessionId: "payment-demo",
        },
        "POST",
        true
      );
      console.log("📥 Basic server response:", result.response);
    } catch (e) {
      // Basic server might not be running
      console.log("ℹ️  Basic server endpoint not available");
    }
  } catch (error: any) {
    console.error("Payment demo failed:", error.message);
  }
}

// Run examples
async function runExamples() {
  try {
    // Get service info
    console.log("🔍 Getting service info...", SERVICE_URL);
    const info = await fetch(SERVICE_URL).then((r) => r.json());

    // Handle both basic and advanced server responses
    const isAdvancedServer = !!info.services;
    serverType = isAdvancedServer ? "advanced" : "basic";

    if (isAdvancedServer) {
      console.log("📋 Available services:", Object.keys(info.services));
    } else {
      console.log("📋 Service type:", info.service || "AI Assistant");
      console.log("💰 Pricing:", info.pricing || "$0.01 per request");
    }

    // Example 1: Basic assistant query
    await askAssistant("What is the capital of France?");

    // Example 2: Follow-up question (maintains context)
    await askAssistant("What's the population of that city?", "demo-user");

    // Example 3: Demonstrate payment details
    await demoPayment();
  } catch (error) {
    console.error("❌ Example failed:", error);
  }
}

// Interactive mode
async function interactiveMode() {
  // First, detect server type
  try {
    const info = await fetch(SERVICE_URL).then((r) => r.json());
    serverType = info.services ? "advanced" : "basic";
    console.log(`\n🔌 Connected to ${serverType} server at ${SERVICE_URL}`);
  } catch (error) {
    console.error("❌ Failed to connect to server:", error);
    return;
  }

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n🤖 Interactive AI Nano Service Client");
  console.log("Commands:");
  console.log("  ask <question> - Ask the assistant");
  console.log("  ask! <question> - Ask and show payment details");

  if (serverType === "advanced") {
    console.log(
      "  analyze <type> <text> - Analyze text (sentiment/keywords/summary)"
    );
    console.log("  generate <template> <prompt> - Generate content");
    console.log("  style <concise/detailed/technical> - Change response style");
    console.log("  stats - View usage statistics");
  }

  console.log("  payment - Demo payment flow");
  console.log("  exit - Quit");

  const prompt = () => {
    rl.question("\n> ", async (input) => {
      const [cmd, ...args] = input.split(" ");

      try {
        switch (cmd) {
          case "ask":
            await askAssistant(args.join(" "));
            break;

          case "ask!":
            await askAssistant(args.join(" "), "demo-user", true);
            break;

          case "payment":
            await demoPayment();
            break;

          case "stats":
            if (serverType === "basic") {
              console.log("❌ Stats endpoint requires the advanced server");
              break;
            }
            const stats = await fetch(`${SERVICE_URL}/stats/demo-user`).then(
              (r) => r.json()
            );
            console.log("📈 Stats:", JSON.stringify(stats, null, 2));
            break;

          case "exit":
            console.log("👋 Goodbye!");
            rl.close();
            process.exit(0);

          default:
            console.log(
              "❓ Unknown command. Try 'ask', 'ask!', 'analyze', 'generate', 'style', 'payment', 'stats', or 'exit'"
            );
        }
      } catch (error) {
        console.error("❌ Error:", error);
      }

      prompt();
    });
  };

  prompt();
}

// Main
const mode = process.argv[2];

if (mode === "examples") {
  runExamples();
} else if (mode === "interactive") {
  interactiveMode();
} else {
  console.log("Usage:");
  console.log("  bun run client.ts examples    - Run example requests");
  console.log("  bun run client.ts interactive - Interactive mode");
}
