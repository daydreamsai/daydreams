import { config } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware, type Network } from "x402-hono";
import { createDreams, context, LogLevel } from "@daydreamsai/core";

import * as z from "zod";
import { privateKeyToAccount } from "viem/accounts";
import { createDreamsRouterAuth } from "@daydreamsai/ai-sdk-provider";

// Simple paid nanoservice exposing an AI assistant.
// - Paid: POST /assistant (guarded by x402)
// - Free:  GET /health, GET /

config();

// Authenticated Dreams router used as the model provider.
const { dreamsRouter } = await createDreamsRouterAuth(
  privateKeyToAccount(Bun.env.PRIVATE_KEY as `0x${string}`),
  {
    baseURL: "http://localhost:8080/v1",
    payments: {
      amount: "100000", // $0.10 USDC to access the router
      network: "base-sepolia",
    },
  }
);

// x402 facilitator and payment parameters
const facilitatorUrl = "https://facilitator.x402.rs";
const payTo =
  (process.env.ADDRESS as `0x${string}`) ||
  "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429";
const network = (process.env.NETWORK as Network) || "base-sepolia";

// Per-session memory tracked by the assistant
interface AssistantMemory {
  requestCount: number;
  lastQuery?: string;
  history: Array<{ query: string; response: string; timestamp: Date }>;
}

// Context: defines args, memory shape, and a short render for debugging
const assistantContext = context({
  type: "ai-assistant",

  schema: z.object({
    sessionId: z.string().describe("Session identifier"),
  }),

  create: (): AssistantMemory => ({
    requestCount: 0,
    history: [],
  }),

  render: (state) => {
    return `
AI Assistant Session: ${state.args.sessionId}
Requests: ${state.memory.requestCount}
${state.memory.lastQuery ? `Last Query: ${state.memory.lastQuery}` : ""}
Recent History: ${
      state.memory.history
        .slice(-3)
        .map((h) => `- ${h.query}`)
        .join("\n") || "None"
    }
    `.trim();
  },

  instructions: `You are a helpful AI assistant providing a paid nano service.
Provide concise, valuable responses and use conversation history when helpful.`,
});

// Agent configuration
const agent = createDreams({
  logLevel: LogLevel.INFO,
  model: dreamsRouter("google-vertex/gemini-2.5-flash"),
  contexts: [assistantContext],
  inputs: {
    text: {
      description: "User query",
      schema: z.string(),
    },
  },
  outputs: {
    text: {
      description: "Assistant response",
      schema: z.string(),
    },
  },
});
// Start the agent runtime
await agent.start();
// HTTP server
const app = new Hono();
// Payment guard: charge $0.01 for /assistant; other routes are free
app.use(
  paymentMiddleware(
    payTo,
    {
      "/assistant": {
        price: "$0.01", // 1 cent per request
        network,
      },
    },
    {
      url: facilitatorUrl,
    }
  )
);

// Main assistant endpoint (paid)
app.post("/assistant", async (c) => {
  try {
    const body = await c.req.json();
    const { query, sessionId = "default" } = body;

    if (!query) {
      return c.json({ error: "Query is required" }, 400);
    }

    // Load session-scoped memory
    const contextState = await agent.getContext({
      context: assistantContext,
      args: { sessionId },
    });

    // Update memory
    contextState.memory.requestCount++;
    contextState.memory.lastQuery = query;

    // Query the agent
    const result = await agent.send({
      context: assistantContext,
      args: { sessionId },
      input: { type: "text", data: query },
    });

    // Extract text output
    const output = result.find((r) => r.ref === "output");
    const response =
      output && "data" in output
        ? output.data
        : "I couldn't process your request.";

    return c.json({
      response,
      sessionId,
      requestCount: contextState.memory.requestCount,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Health check (free)
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "AI Assistant Nano Service",
    timestamp: new Date().toISOString(),
  });
});

// Usage info (free)
app.get("/", (c) => {
  return c.json({
    service: "AI Assistant Nano Service",
    endpoints: {
      "/health": "Health check (free)",
      "/assistant": "AI assistant endpoint (POST, $0.01 per request)",
    },
    usage: {
      method: "POST",
      endpoint: "/assistant",
      body: {
        query: "Your question here",
        sessionId: "optional-session-id",
      },
    },
    pricing: "$0.01 per request",
    network,
  });
});

serve({
  fetch: app.fetch,
  port: 4021,
});
