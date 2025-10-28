import type { Episode } from "../../types";
import type { EpisodeExporter, ExportResult } from "./types";

export interface JSONExportOptions {
  /** Pretty print JSON with indentation */
  pretty?: boolean;
  /** Export format - json (array) or jsonl (line-delimited) */
  format?: "json" | "jsonl";
}

/**
 * Exports episodes to JSON or JSONL format
 */
export class JSONExporter implements EpisodeExporter<JSONExportOptions> {
  name = "json";
  description = "Export episodes as JSON or JSONL format";
  formats = ["json", "jsonl"];

  async exportEpisode(
    episode: Episode,
    options?: JSONExportOptions
  ): Promise<ExportResult> {
    try {
      const formatted = options?.pretty
        ? JSON.stringify(episode, null, 2)
        : JSON.stringify(episode);

      return {
        success: true,
        location: "memory",
        format: "json",
        size: formatted.length,
        metadata: { content: formatted },
      };
    } catch (error) {
      return {
        success: false,
        format: "json",
        error: error as Error,
      };
    }
  }

  async exportBatch(
    episodes: Episode[],
    options?: JSONExportOptions
  ): Promise<ExportResult> {
    try {
      let content: string;
      const format = options?.format || "json";

      if (format === "jsonl") {
        // JSON Lines format - one JSON object per line
        content = episodes.map((e) => JSON.stringify(e)).join("\n");
      } else {
        // Standard JSON array format
        content = JSON.stringify(episodes, null, options?.pretty ? 2 : 0);
      }

      return {
        success: true,
        location: "memory",
        format,
        size: content.length,
        metadata: {
          content,
          episodeCount: episodes.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        format: options?.format || "json",
        error: error as Error,
      };
    }
  }

  async validate(options: JSONExportOptions): Promise<boolean> {
    if (options.format && !this.formats.includes(options.format)) {
      return false;
    }
    return true;
  }
}
