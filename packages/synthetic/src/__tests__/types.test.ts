import { describe, test, expect } from "vitest";
import { SyntheticConfigSchema } from "../types";
import type { SyntheticConfig } from "../types";

describe("SyntheticConfigSchema", () => {
  test("should validate a complete valid config", () => {
    const validConfig: SyntheticConfig = {
      enabled: true,
      outputDir: "./test-output",
      formats: ["instruction-tuning", "conversation"],
      capture: {
        conversations: true,
        reasoning: true,
        actions: false,
        episodes: true,
        preferences: false,
      },
      mode: "batch",
      batchSize: 50,
      filters: {
        minConversationLength: 2,
        maxConversationLength: 100,
        successfulOnly: false,
        contexts: ["cli", "discord"],
        actions: ["web_search"],
      },
      privacy: {
        redactPatterns: [],
        anonymizeUsers: true,
        removeTimestamps: false,
      },
    };

    expect(() => SyntheticConfigSchema.parse(validConfig)).not.toThrow();
  });

  test("should validate minimal config", () => {
    const minimalConfig = {
      enabled: true,
      outputDir: "./output",
      formats: ["instruction-tuning"],
      capture: {
        conversations: true,
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "realtime",
    };

    expect(() => SyntheticConfigSchema.parse(minimalConfig)).not.toThrow();
  });

  test("should reject config with missing required fields", () => {
    const invalidConfig = {
      enabled: true,
      // Missing outputDir
      formats: ["instruction-tuning"],
      capture: {
        conversations: true,
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "batch",
    };

    expect(() => SyntheticConfigSchema.parse(invalidConfig)).toThrow();
  });

  test("should reject config with invalid format", () => {
    const invalidConfig = {
      enabled: true,
      outputDir: "./output",
      formats: ["invalid-format"], // Invalid format
      capture: {
        conversations: true,
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "batch",
    };

    expect(() => SyntheticConfigSchema.parse(invalidConfig)).toThrow();
  });

  test("should reject config with invalid mode", () => {
    const invalidConfig = {
      enabled: true,
      outputDir: "./output",
      formats: ["instruction-tuning"],
      capture: {
        conversations: true,
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "invalid-mode", // Invalid mode
    };

    expect(() => SyntheticConfigSchema.parse(invalidConfig)).toThrow();
  });

  test("should allow all valid formats", () => {
    const validFormats = [
      "instruction-tuning",
      "conversation",
      "reasoning-chains",
      "action-sequences",
      "episodes",
      "grpo",
      "custom",
    ];

    const config = {
      enabled: true,
      outputDir: "./output",
      formats: validFormats,
      capture: {
        conversations: true,
        reasoning: true,
        actions: true,
        episodes: true,
        preferences: true,
      },
      mode: "batch",
    };

    expect(() => SyntheticConfigSchema.parse(config)).not.toThrow();
  });

  test("should validate optional nested fields", () => {
    const configWithOptionals = {
      enabled: true,
      outputDir: "./output",
      formats: ["instruction-tuning"],
      capture: {
        conversations: true,
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "batch",
      batchSize: 25,
      filters: {
        minConversationLength: 3,
        successfulOnly: true,
      },
      privacy: {
        anonymizeUsers: true,
      },
    };

    expect(() =>
      SyntheticConfigSchema.parse(configWithOptionals)
    ).not.toThrow();
  });

  test("should reject invalid capture field types", () => {
    const invalidConfig = {
      enabled: true,
      outputDir: "./output",
      formats: ["instruction-tuning"],
      capture: {
        conversations: "yes", // Should be boolean
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "batch",
    };

    expect(() => SyntheticConfigSchema.parse(invalidConfig)).toThrow();
  });

  test("should reject extra unknown fields with strict schema", () => {
    const configWithExtra = {
      enabled: true,
      outputDir: "./output",
      formats: ["instruction-tuning"],
      capture: {
        conversations: true,
        reasoning: false,
        actions: false,
        episodes: false,
        preferences: false,
      },
      mode: "batch",
      unknownField: "should not be allowed", // Extra field
    };

    expect(() => SyntheticConfigSchema.parse(configWithExtra)).toThrow();
  });
});
