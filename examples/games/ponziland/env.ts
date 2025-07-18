import * as z from "zod/v4";
import ponziland_manifest from "./contracts/ponziland_manifest_mainnet.json";
import view_manifest from "./contracts/ponziland_manifest_mainnet.json";

const envSchema = z.object({
  CHROMA_URL: z.string().default("http://localhost:8000"),
  STARKNET_RPC_URL: z.string(),
  STARKNET_ADDRESS: z.string(),
  STARKNET_PRIVATE_KEY: z.string(),
  OPENROUTER_API_KEY: z.string(),
  GRAPHQL_URL: z.string(),
  WEBSOCKET_URL: z.string().default("ws://localhost:8080"),
  DRY_RUN: z
    .preprocess((val) => val === "1" || val === "true", z.boolean())
    .default(true),
});
export const env = envSchema.parse(process.env);
