import { describe, expect, it } from "vitest";
import { parseEnhancedEnvironment } from "./enhanced-env";

function environment(rateLimitDelay: string): NodeJS.ProcessEnv {
  return {
    TWITTER_USERNAME: "test-user",
    TWITTER_PASSWORD: "test-password",
    TWITTER_EMAIL: "test@example.com",
    TWITTER_RATE_LIMIT_DELAY: rateLimitDelay,
  };
}

describe("parseEnhancedEnvironment", () => {
  it("preserves documented boolean defaults when variables are unset", () => {
    const result = parseEnhancedEnvironment(environment("250"));

    expect(result.DRY_RUN).toBe(true);
    expect(result.TWITTER_AUTO_ENGAGE).toBe(false);
  });

  it("parses supported boolean environment values", () => {
    const result = parseEnhancedEnvironment({
      ...environment("250"),
      DRY_RUN: "0",
      TWITTER_AUTO_ENGAGE: "1",
    });

    expect(result.DRY_RUN).toBe(false);
    expect(result.TWITTER_AUTO_ENGAGE).toBe(true);
  });

  it("rejects unsupported boolean environment values", () => {
    expect(() =>
      parseEnhancedEnvironment({
        ...environment("250"),
        DRY_RUN: "yes",
      })
    ).toThrow();
  });

  it("accepts the documented string rate-limit delay", () => {
    const result = parseEnhancedEnvironment(environment("250"));

    expect(result.TWITTER_RATE_LIMIT_DELAY).toBe(250);
  });

  it("rejects negative rate-limit delays", () => {
    expect(() => parseEnhancedEnvironment(environment("-1"))).toThrow();
  });

  it("requires an API key only for the Xquik backend", () => {
    expect(() =>
      parseEnhancedEnvironment({
        ...environment("250"),
        TWITTER_SEARCH_BACKEND: "xquik",
      })
    ).toThrow("XQUIK_API_KEY is required");

    expect(
      parseEnhancedEnvironment({
        ...environment("250"),
        TWITTER_SEARCH_BACKEND: "xquik",
        XQUIK_API_KEY: "test-key",
      }).TWITTER_SEARCH_BACKEND
    ).toBe("xquik");
  });
});
