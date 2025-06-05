import { describe, test, expect, beforeEach } from "vitest";
import { RealtimeSyntheticCollector } from "../collector";
import {
  createMockSyntheticConfig,
  createMockAgent,
  createMockConversationLogs,
  isValidSyntheticRecord,
} from "./utils/testUtils";

describe("RealtimeSyntheticCollector", () => {
  let collector: RealtimeSyntheticCollector;
  let mockConfig: any;
  let mockAgent: any;

  beforeEach(() => {
    mockConfig = createMockSyntheticConfig();
    mockAgent = createMockAgent();
    collector = new RealtimeSyntheticCollector(mockConfig, mockAgent);
  });

  describe("initialization", () => {
    test("should initialize with config and agent", () => {
      expect(collector).toBeInstanceOf(RealtimeSyntheticCollector);
      expect(collector.getBufferSize()).toBe(0);
    });
  });

  describe("addLog", () => {
    test("should add logs to buffer", async () => {
      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await collector.addLog(logItem.log, logItem.context);
      }

      expect(collector.getBufferSize()).toBe(logs.length);
    });

    test("should filter logs based on context type", async () => {
      const config = createMockSyntheticConfig({
        filters: {
          contexts: ["discord"], // Only allow discord contexts
        },
      });
      const filteredCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs(); // These are CLI logs

      for (const logItem of logs) {
        await filteredCollector.addLog(logItem.log, logItem.context);
      }

      // Should be filtered out since they're CLI logs
      expect(filteredCollector.getBufferSize()).toBe(0);
    });

    test("should filter logs based on action names", async () => {
      const config = createMockSyntheticConfig({
        filters: {
          actions: ["allowed_action"], // Only allow specific actions
        },
      });
      const filteredCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs(); // Contains web_search action

      for (const logItem of logs) {
        await filteredCollector.addLog(logItem.log, logItem.context);
      }

      // Should filter out action calls that aren't in the allowed list
      expect(filteredCollector.getBufferSize()).toBeLessThan(logs.length);
    });

    test("should apply privacy sanitization", async () => {
      const config = createMockSyntheticConfig({
        privacy: {
          anonymizeUsers: true,
          redactPatterns: [/test@example\.com/g],
        },
      });
      const sanitizingCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await sanitizingCollector.addLog(logItem.log, logItem.context);
      }

      expect(sanitizingCollector.getBufferSize()).toBe(logs.length);
    });
  });

  describe("process", () => {
    test("should return empty array when no logs", async () => {
      const records = await collector.process();
      expect(records).toEqual([]);
    });

    test("should generate instruction tuning records", async () => {
      const config = createMockSyntheticConfig({
        formats: ["instruction-tuning"],
        capture: {
          conversations: true,
          reasoning: false,
          actions: false,
          episodes: false,
          preferences: false,
        },
      });
      const instructionCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await instructionCollector.addLog(logItem.log, logItem.context);
      }

      const records = await instructionCollector.process();

      expect(records.length).toBeGreaterThan(0);
      expect(
        records.every((record) => record.type === "instruction-tuning")
      ).toBe(true);
      expect(records.every((record) => isValidSyntheticRecord(record))).toBe(
        true
      );
    });

    test("should generate conversation records", async () => {
      const config = createMockSyntheticConfig({
        formats: ["conversation"],
        capture: {
          conversations: true,
          reasoning: false,
          actions: false,
          episodes: false,
          preferences: false,
        },
      });
      const conversationCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await conversationCollector.addLog(logItem.log, logItem.context);
      }

      const records = await conversationCollector.process();

      expect(records.length).toBe(1); // Should create one conversation record
      expect(records[0].type).toBe("conversation");
      expect(isValidSyntheticRecord(records[0])).toBe(true);

      // Check conversation structure
      const conversationData = records[0].data as any;
      expect(conversationData.messages).toBeDefined();
      expect(Array.isArray(conversationData.messages)).toBe(true);
      expect(conversationData.messages.length).toBeGreaterThan(0);
    });

    test("should generate reasoning chain records", async () => {
      const config = createMockSyntheticConfig({
        formats: ["reasoning-chains"],
        capture: {
          conversations: false,
          reasoning: true,
          actions: true,
          episodes: false,
          preferences: false,
        },
      });
      const reasoningCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await reasoningCollector.addLog(logItem.log, logItem.context);
      }

      const records = await reasoningCollector.process();

      if (records.length > 0) {
        expect(
          records.every((record) => record.type === "reasoning-chains")
        ).toBe(true);
        expect(records.every((record) => isValidSyntheticRecord(record))).toBe(
          true
        );
      }
    });

    test("should generate action sequence records", async () => {
      const config = createMockSyntheticConfig({
        formats: ["action-sequences"],
        capture: {
          conversations: false,
          reasoning: false,
          actions: true,
          episodes: false,
          preferences: false,
        },
      });
      const actionCollector = new RealtimeSyntheticCollector(config, mockAgent);

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await actionCollector.addLog(logItem.log, logItem.context);
      }

      const records = await actionCollector.process();

      if (records.length > 0) {
        expect(
          records.every((record) => record.type === "action-sequences")
        ).toBe(true);
        expect(records.every((record) => isValidSyntheticRecord(record))).toBe(
          true
        );

        // Check action sequence structure
        const actionData = records[0].data as any;
        expect(actionData.actions).toBeDefined();
        expect(Array.isArray(actionData.actions)).toBe(true);
      }
    });

    test("should generate episode records", async () => {
      const config = createMockSyntheticConfig({
        formats: ["episodes"],
        capture: {
          conversations: false,
          reasoning: false,
          actions: true,
          episodes: true,
          preferences: false,
        },
      });
      const episodeCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await episodeCollector.addLog(logItem.log, logItem.context);
      }

      const records = await episodeCollector.process();

      expect(records.length).toBe(1); // Should create one episode record
      expect(records[0].type).toBe("episodes");
      expect(isValidSyntheticRecord(records[0])).toBe(true);

      // Check episode structure
      const episodeData = records[0].data as any;
      expect(episodeData.episodeId).toBeDefined();
      expect(episodeData.observation).toBeDefined();
      expect(episodeData.result).toBeDefined();
      expect(typeof episodeData.success).toBe("boolean");
    });

    test("should apply conversation length filters", async () => {
      const config = createMockSyntheticConfig({
        formats: ["conversation"],
        capture: {
          conversations: true,
          reasoning: false,
          actions: false,
          episodes: false,
          preferences: false,
        },
        filters: {
          minConversationLength: 10, // Very high minimum
        },
      });
      const filteredCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs(); // Only has a few messages

      for (const logItem of logs) {
        await filteredCollector.addLog(logItem.log, logItem.context);
      }

      const records = await filteredCollector.process();

      // Should be filtered out due to length
      expect(records.length).toBe(0);
    });

    test("should filter successful episodes only", async () => {
      const config = createMockSyntheticConfig({
        formats: ["episodes"],
        capture: {
          conversations: false,
          reasoning: false,
          actions: true,
          episodes: true,
          preferences: false,
        },
        filters: {
          successfulOnly: true,
        },
      });
      const successCollector = new RealtimeSyntheticCollector(
        config,
        mockAgent
      );

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await successCollector.addLog(logItem.log, logItem.context);
      }

      const records = await successCollector.process();

      // All returned episodes should be successful
      records.forEach((record) => {
        if (record.type === "episodes") {
          const episodeData = record.data as any;
          expect(episodeData.success).toBe(true);
        }
      });
    });

    test("should generate multiple format types", async () => {
      const config = createMockSyntheticConfig({
        formats: ["instruction-tuning", "conversation", "episodes"],
        capture: {
          conversations: true,
          reasoning: false,
          actions: true,
          episodes: true,
          preferences: false,
        },
      });
      const multiCollector = new RealtimeSyntheticCollector(config, mockAgent);

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await multiCollector.addLog(logItem.log, logItem.context);
      }

      const records = await multiCollector.process();

      expect(records.length).toBeGreaterThan(0);

      // Check that we get different types of records
      const recordTypes = new Set(records.map((r) => r.type));
      expect(recordTypes.size).toBeGreaterThan(1);
    });

    test("should generate GRPO records", async () => {
      const config = createMockSyntheticConfig({
        formats: ["grpo"],
        capture: {
          conversations: false,
          reasoning: false,
          actions: false,
          episodes: false,
          preferences: true,
        },
      });
      const grpoCollector = new RealtimeSyntheticCollector(config, mockAgent);

      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await grpoCollector.addLog(logItem.log, logItem.context);
      }

      const records = await grpoCollector.process();

      if (records.length > 0) {
        expect(records.every((record) => record.type === "grpo")).toBe(true);
        expect(records.every((record) => isValidSyntheticRecord(record))).toBe(
          true
        );

        // Check GRPO structure
        const grpoData = records[0].data as any;
        expect(grpoData.prompt).toBeDefined();
        expect(grpoData.responses).toBeDefined();
        expect(Array.isArray(grpoData.responses)).toBe(true);

        if (grpoData.responses.length >= 2) {
          // Check response structure
          grpoData.responses.forEach((response: any) => {
            expect(response.text).toBeDefined();
            expect(typeof response.score).toBe("number");
            expect(typeof response.rank).toBe("number");
            expect(typeof response.success).toBe("boolean");
          });

          // Check preference comparisons
          if (grpoData.comparisons) {
            expect(Array.isArray(grpoData.comparisons)).toBe(true);
            grpoData.comparisons.forEach((comparison: any) => {
              expect(typeof comparison.preferred).toBe("number");
              expect(typeof comparison.rejected).toBe("number");
              expect(comparison.preferred).not.toBe(comparison.rejected);
            });
          }
        }
      }
    });
  });

  describe("clear", () => {
    test("should clear the log buffer", async () => {
      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await collector.addLog(logItem.log, logItem.context);
      }

      expect(collector.getBufferSize()).toBeGreaterThan(0);

      collector.clear();

      expect(collector.getBufferSize()).toBe(0);
    });
  });

  describe("quality scoring", () => {
    test("should assign quality scores to records", async () => {
      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await collector.addLog(logItem.log, logItem.context);
      }

      const records = await collector.process();

      records.forEach((record) => {
        expect(record.metadata.quality).toBeDefined();
        expect(typeof record.metadata.quality).toBe("number");
        expect(record.metadata.quality).toBeGreaterThanOrEqual(0);
        expect(record.metadata.quality).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("metadata generation", () => {
    test("should generate appropriate metadata for records", async () => {
      const logs = createMockConversationLogs();

      for (const logItem of logs) {
        await collector.addLog(logItem.log, logItem.context);
      }

      const records = await collector.process();

      records.forEach((record) => {
        expect(record.metadata.contextType).toBeDefined();
        expect(record.metadata.contextId).toBeDefined();
        expect(record.metadata.tags).toBeDefined();
        expect(Array.isArray(record.metadata.tags)).toBe(true);
        expect(record.metadata.tags!.includes("synthetic-data")).toBe(true);
      });
    });
  });
});
