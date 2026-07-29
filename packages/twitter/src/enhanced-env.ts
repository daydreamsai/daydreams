import * as z from "zod";

function environmentBoolean(defaultValue: "true" | "false") {
  return z
    .enum(["0", "1", "false", "true"])
    .default(defaultValue)
    .transform((value) => value === "1" || value === "true");
}

const enhancedEnvironmentSchema = z
  .object({
    TWITTER_USERNAME: z.string(),
    TWITTER_PASSWORD: z.string(),
    TWITTER_EMAIL: z.string(),
    TWITTER_SEARCH_BACKEND: z.enum(["native", "xquik"]).default("native"),
    XQUIK_API_KEY: z.string().default(""),
    XQUIK_BASE_URL: z.string().url().optional(),
    DRY_RUN: environmentBoolean("true"),
    TWITTER_AUTO_ENGAGE: environmentBoolean("false"),
    TWITTER_RATE_LIMIT_DELAY: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(1000),
  })
  .refine(
    (environment) =>
      environment.TWITTER_SEARCH_BACKEND !== "xquik" ||
      environment.XQUIK_API_KEY.trim() !== "",
    {
      message: "XQUIK_API_KEY is required when TWITTER_SEARCH_BACKEND=xquik",
      path: ["XQUIK_API_KEY"],
    }
  );

export type EnhancedEnvironment = z.infer<typeof enhancedEnvironmentSchema>;

export function parseEnhancedEnvironment(
  environment: NodeJS.ProcessEnv
): EnhancedEnvironment {
  return enhancedEnvironmentSchema.parse(environment);
}
