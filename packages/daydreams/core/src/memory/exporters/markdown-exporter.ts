import type { Episode } from "../../types";
import type { EpisodeExporter, ExportResult } from "./types";

export interface MarkdownExportOptions {
  /** Include raw metadata section */
  includeMetadata?: boolean;
  /** Include timestamps */
  includeTimestamps?: boolean;
  /** Custom section separator */
  separator?: string;
}

/**
 * Exports episodes to Markdown format
 */
export class MarkdownExporter
  implements EpisodeExporter<MarkdownExportOptions>
{
  name = "markdown";
  description = "Export episodes as Markdown documents";
  formats = ["md", "markdown"];

  async exportEpisode(
    episode: Episode,
    options?: MarkdownExportOptions
  ): Promise<ExportResult> {
    try {
      const md = this.episodeToMarkdown(episode, options);

      return {
        success: true,
        location: "memory",
        format: "md",
        size: md.length,
        metadata: { content: md },
      };
    } catch (error) {
      return {
        success: false,
        format: "md",
        error: error as Error,
      };
    }
  }

  async exportBatch(
    episodes: Episode[],
    options?: MarkdownExportOptions
  ): Promise<ExportResult> {
    try {
      const separator = options?.separator || "\n\n---\n\n";
      const sections = episodes.map((e) => this.episodeToMarkdown(e, options));
      const content = sections.join(separator);

      return {
        success: true,
        location: "memory",
        format: "md",
        size: content.length,
        metadata: {
          content,
          episodeCount: episodes.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        format: "md",
        error: error as Error,
      };
    }
  }

  private episodeToMarkdown(
    episode: Episode,
    options?: MarkdownExportOptions
  ): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Episode: ${episode.id}`);
    sections.push("");
    sections.push(`**Type**: ${episode.type}`);

    if (options?.includeTimestamps !== false) {
      sections.push(`**Date**: ${new Date(episode.timestamp).toISOString()}`);
    }

    if (episode.duration) {
      sections.push(`**Duration**: ${this.formatDuration(episode.duration)}`);
    }

    if (episode.context) {
      sections.push(`**Context**: ${episode.context}`);
    }

    // Summary
    if (episode.summary) {
      sections.push("");
      sections.push("## Summary");
      sections.push("");
      sections.push(episode.summary);
    }

    // Conversation content
    if (episode.input || episode.output) {
      sections.push("");
      sections.push("## Conversation");

      if (episode.input) {
        sections.push("");
        sections.push("### User");
        sections.push("");
        sections.push(this.formatContent(episode.input));
      }

      if (episode.output) {
        sections.push("");
        sections.push("### Assistant");
        sections.push("");
        sections.push(this.formatContent(episode.output));
      }
    }

    // Metadata (optional)
    if (options?.includeMetadata && episode.metadata) {
      sections.push("");
      sections.push("## Metadata");
      sections.push("");
      sections.push("```json");
      sections.push(JSON.stringify(episode.metadata, null, 2));
      sections.push("```");
    }

    return sections.join("\n");
  }

  private formatContent(content: any): string {
    if (typeof content === "string") {
      return content;
    }

    if (content?.content) {
      return this.formatContent(content.content);
    }

    if (content?.text) {
      return content.text;
    }

    if (Array.isArray(content)) {
      return content.map((item) => this.formatContent(item)).join("\n\n");
    }

    // For complex objects, try to extract meaningful text
    if (typeof content === "object" && content !== null) {
      // Look for common text fields
      for (const field of ["message", "value", "data"]) {
        if (content[field]) {
          return this.formatContent(content[field]);
        }
      }
    }

    // Fallback to JSON for unrecognized formats
    return JSON.stringify(content, null, 2);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  async validate(options: MarkdownExportOptions): Promise<boolean> {
    // All options are optional and valid
    return true;
  }
}
