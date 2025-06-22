/**
 * QuickBooks Assistant Example
 * 
 * This example demonstrates how to use the QuickBooks extension to create
 * an AI assistant that can help small business owners analyze their financial data.
 */
import { openrouter } from "@openrouter/ai-sdk-provider";
import {
  createDreams,
  context,
  validateEnv,
  LogLevel
} from "@daydreamsai/core";
import { quickbooks } from "@daydreamsai/quickbooks";
import { cliExtension, cli } from "@daydreamsai/cli";
import { z } from "zod";

// Validate required environment variables
validateEnv(
  z.object({
    OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
    QUICKBOOKS_CLIENT_ID: z.string().min(1, "QUICKBOOKS_CLIENT_ID is required"),
    QUICKBOOKS_CLIENT_SECRET: z.string().min(1, "QUICKBOOKS_CLIENT_SECRET is required"),
  })
);

// Create a business assistant context that uses QuickBooks
const businessAssistantContext = context({
  type: "business.assistant",
  schema: z.object({
    businessName: z.string(),
    realmId: z.string(),
    accessToken: z.string()
  }),

  instructions: `You are a helpful financial advisor for small business owners. 
  
  You can help with:
  - Analyzing revenue trends and identifying top customers
  - Understanding expense patterns and finding cost-saving opportunities  
  - Monitoring cash flow and accounts receivable
  - Providing insights on business performance
  
  When answering questions:
  1. First explore the data model if you're unsure about available fields
  2. Write SQL queries to gather the relevant data
  3. Analyze the results to provide meaningful insights
  4. Give actionable recommendations based on the data
  
  Always be specific with numbers and percentages when possible.`,

  render({ args }) {
    return `Business Assistant for ${args.businessName}`;
  }
})
  // Compose with QuickBooks context
  .use((state) => [
    {
      context: quickbooks.contexts!.quickbooks,
      args: {
        realmId: state.args.realmId,
        accessToken: state.args.accessToken
      }
    }
  ]);

const quickbooksCli = cli.use((state) => [{
  context: businessAssistantContext,
  args: {
    businessName: "Demo Company",
    realmId: process.env.QUICKBOOKS_REALM_ID || "123456789",
    accessToken: process.env.QUICKBOOKS_ACCESS_TOKEN || "demo-token"
  }
}]);

// Create the agent
const agent = await createDreams({
  model: openrouter("google/gemini-2.0-flash-001"),
  extensions: [quickbooks, cliExtension],
  contexts: [quickbooksCli],
  logLevel: LogLevel.INFO
}).start({
  user: "admin"
});