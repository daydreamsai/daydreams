import { describe, test, expect, beforeEach, vi } from "vitest";
import { SyntheticExporter } from "../exporter";
import {
  sampleMixedRecords,
  sampleInstructionTuningRecords,
} from "./fixtures/sampleData";
import { promises as fs } from "fs";

// Mock the fs module
vi.mock("fs", () => ({
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockFs = vi.mocked(fs);

describe("SyntheticExporter", () => {
  let exporter: SyntheticExporter;

  beforeEach(() => {
    exporter = new SyntheticExporter();
    vi.clearAllMocks();
  });

  describe("getExtension", () => {
    test("should return correct extensions for different formats", () => {
      expect(exporter.getExtension("instruction-tuning")).toBe("jsonl");
      expect(exporter.getExtension("conversation")).toBe("jsonl");
      expect(exporter.getExtension("reasoning-chains")).toBe("jsonl");
      expect(exporter.getExtension("action-sequences")).toBe("jsonl");
      expect(exporter.getExtension("episodes")).toBe("jsonl");
      expect(exporter.getExtension("custom")).toBe("json");
    });
  });

  describe("validate", () => {
    test("should validate valid records", () => {
      expect(exporter.validate(sampleMixedRecords)).toBe(true);
    });

    test("should reject invalid records", () => {
      const invalidRecords = [
        { id: "test", type: "invalid" }, // Missing required fields
      ];

      expect(exporter.validate(invalidRecords as any)).toBe(false);
    });

    test("should reject non-array input", () => {
      expect(exporter.validate("not an array" as any)).toBe(false);
    });

    test("should reject records missing required fields", () => {
      const incompleteRecords = [
        {
          id: "test",
          // Missing timestamp, type, data, metadata
        },
      ];

      expect(exporter.validate(incompleteRecords as any)).toBe(false);
    });
  });

  describe("export", () => {
    test("should export instruction tuning format", async () => {
      const outputPath = "./test-output.jsonl";

      await exporter.export(
        sampleInstructionTuningRecords,
        "instruction-tuning",
        outputPath
      );

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"instruction"'),
        "utf-8"
      );
    });

    test("should export conversation format", async () => {
      const outputPath = "./test-conversation.jsonl";
      const conversationRecords = sampleMixedRecords.filter(
        (r) => r.type === "conversation"
      );

      await exporter.export(conversationRecords, "conversation", outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"messages"'),
        "utf-8"
      );
    });

    test("should export reasoning chains format", async () => {
      const outputPath = "./test-reasoning.jsonl";
      const reasoningRecords = sampleMixedRecords.filter(
        (r) => r.type === "reasoning-chains"
      );

      await exporter.export(reasoningRecords, "reasoning-chains", outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(String),
        "utf-8"
      );
    });

    test("should export action sequences format", async () => {
      const outputPath = "./test-actions.jsonl";
      const actionRecords = sampleMixedRecords.filter(
        (r) => r.type === "action-sequences"
      );

      await exporter.export(actionRecords, "action-sequences", outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(String),
        "utf-8"
      );
    });

    test("should export episodes format", async () => {
      const outputPath = "./test-episodes.jsonl";
      const episodeRecords = sampleMixedRecords.filter(
        (r) => r.type === "episodes"
      );

      await exporter.export(episodeRecords, "episodes", outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(String),
        "utf-8"
      );
    });

    test("should export custom format as JSON", async () => {
      const outputPath = "./test-custom.json";

      await exporter.export(sampleMixedRecords, "custom", outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringMatching(/^\[\s*{.*}\s*\]$/s), // Should be JSON array format
        "utf-8"
      );
    });

    test("should throw error for invalid records", async () => {
      const invalidRecords = [{ invalid: "record" }];

      await expect(
        exporter.export(
          invalidRecords as any,
          "instruction-tuning",
          "./test.jsonl"
        )
      ).rejects.toThrow("Invalid records provided for export");
    });

    test("should handle empty records array", async () => {
      const outputPath = "./test-empty.jsonl";

      await exporter.export([], "instruction-tuning", outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        "", // Empty content
        "utf-8"
      );
    });

    test("should filter records by type when exporting", async () => {
      const outputPath = "./test-filtered.jsonl";

      // Export instruction tuning format with mixed records
      await exporter.export(
        sampleMixedRecords,
        "instruction-tuning",
        outputPath
      );

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;

      // Should only contain instruction tuning records
      const lines = writtenContent.split("\n").filter((line) => line.trim());
      lines.forEach((line) => {
        if (line) {
          const parsed = JSON.parse(line);
          expect(parsed.instruction).toBeDefined();
          expect(parsed.response).toBeDefined();
        }
      });
    });

    test("should create valid JSONL format", async () => {
      const outputPath = "./test-jsonl.jsonl";

      await exporter.export(
        sampleInstructionTuningRecords,
        "instruction-tuning",
        outputPath
      );

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;

      // Each line should be valid JSON
      const lines = writtenContent.split("\n").filter((line) => line.trim());
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
    });
  });

  describe("format-specific exports", () => {
    test("instruction tuning should have required fields", async () => {
      const outputPath = "./test-instruction.jsonl";

      await exporter.export(
        sampleInstructionTuningRecords,
        "instruction-tuning",
        outputPath
      );

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      const lines = writtenContent.split("\n").filter((line) => line.trim());

      lines.forEach((line) => {
        const parsed = JSON.parse(line);
        expect(parsed.instruction).toBeDefined();
        expect(parsed.response).toBeDefined();
        expect(typeof parsed.instruction).toBe("string");
        expect(typeof parsed.response).toBe("string");
      });
    });

    test("conversation should have messages array", async () => {
      const conversationRecords = sampleMixedRecords.filter(
        (r) => r.type === "conversation"
      );
      const outputPath = "./test-conversation-fields.jsonl";

      if (conversationRecords.length > 0) {
        await exporter.export(conversationRecords, "conversation", outputPath);

        const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
        const lines = writtenContent.split("\n").filter((line) => line.trim());

        lines.forEach((line) => {
          const parsed = JSON.parse(line);
          expect(parsed.messages).toBeDefined();
          expect(Array.isArray(parsed.messages)).toBe(true);
          parsed.messages.forEach((msg: any) => {
            expect(msg.role).toBeDefined();
            expect(msg.content).toBeDefined();
          });
        });
      }
    });
  });
});
