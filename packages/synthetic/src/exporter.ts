import { promises as fs } from "fs";
import type {
  SyntheticRecord,
  SyntheticFormat,
  SyntheticExporter as ISyntheticExporter,
} from "./types";

/**
 * Exporter that writes synthetic data records to various file formats
 */
export class SyntheticExporter implements ISyntheticExporter {
  async export(
    records: SyntheticRecord[],
    format: SyntheticFormat,
    outputPath: string
  ): Promise<void> {
    if (!this.validate(records)) {
      throw new Error("Invalid records provided for export");
    }

    const content = this.formatRecords(records, format);
    await fs.writeFile(outputPath, content, "utf-8");
  }

  getExtension(format: SyntheticFormat): string {
    switch (format) {
      case "instruction-tuning":
      case "conversation":
      case "reasoning-chains":
      case "action-sequences":
      case "episodes":
      case "grpo":
        return "jsonl";
      case "custom":
        return "json";
      default:
        return "jsonl";
    }
  }

  validate(records: SyntheticRecord[]): boolean {
    if (!Array.isArray(records)) {
      return false;
    }

    return records.every(
      (record) =>
        record.id &&
        record.timestamp &&
        record.type &&
        record.data &&
        record.metadata
    );
  }

  private formatRecords(
    records: SyntheticRecord[],
    format: SyntheticFormat
  ): string {
    switch (format) {
      case "instruction-tuning":
        return this.formatInstructionTuning(records);
      case "conversation":
        return this.formatConversation(records);
      case "reasoning-chains":
        return this.formatReasoningChains(records);
      case "action-sequences":
        return this.formatActionSequences(records);
      case "episodes":
        return this.formatEpisodes(records);
      case "grpo":
        return this.formatGRPO(records);
      case "custom":
        return this.formatCustom(records);
      default:
        return this.formatDefault(records);
    }
  }

  private formatInstructionTuning(records: SyntheticRecord[]): string {
    return records
      .filter((record) => record.type === "instruction-tuning")
      .map((record) => JSON.stringify(record.data))
      .join("\n");
  }

  private formatConversation(records: SyntheticRecord[]): string {
    return records
      .filter((record) => record.type === "conversation")
      .map((record) => JSON.stringify(record.data))
      .join("\n");
  }

  private formatReasoningChains(records: SyntheticRecord[]): string {
    return records
      .filter((record) => record.type === "reasoning-chains")
      .map((record) => JSON.stringify(record.data))
      .join("\n");
  }

  private formatActionSequences(records: SyntheticRecord[]): string {
    return records
      .filter((record) => record.type === "action-sequences")
      .map((record) => JSON.stringify(record.data))
      .join("\n");
  }

  private formatEpisodes(records: SyntheticRecord[]): string {
    return records
      .filter((record) => record.type === "episodes")
      .map((record) => JSON.stringify(record.data))
      .join("\n");
  }

  private formatGRPO(records: SyntheticRecord[]): string {
    return records
      .filter((record) => record.type === "grpo")
      .map((record) => JSON.stringify(record.data))
      .join("\n");
  }

  private formatCustom(records: SyntheticRecord[]): string {
    return JSON.stringify(records, null, 2);
  }

  private formatDefault(records: SyntheticRecord[]): string {
    return records.map((record) => JSON.stringify(record)).join("\n");
  }
}
