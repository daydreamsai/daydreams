import type { Episode } from "../../types";
import type {
  EpisodeExporter,
  ExportParams,
  ExportResult,
  ExportTransform,
} from "./types";

/**
 * Manages episode export operations
 */
export class ExportManager {
  private exporters = new Map<string, EpisodeExporter>();

  /**
   * Register an exporter
   */
  registerExporter(exporter: EpisodeExporter): void {
    this.exporters.set(exporter.name, exporter);
  }

  /**
   * Unregister an exporter
   */
  unregisterExporter(name: string): void {
    this.exporters.delete(name);
  }

  /**
   * Get list of available exporters
   */
  listExporters(): Array<{
    name: string;
    formats: string[];
    description?: string;
  }> {
    return Array.from(this.exporters.values()).map((exporter) => ({
      name: exporter.name,
      formats: exporter.formats,
      description: exporter.description,
    }));
  }

  /**
   * Export episodes using specified exporter
   */
  async export(params: ExportParams): Promise<ExportResult> {
    const exporter = this.exporters.get(params.exporter);
    if (!exporter) {
      return {
        success: false,
        format: "",
        error: new Error(`Exporter '${params.exporter}' not found`),
      };
    }

    // Validate format if specified
    if (params.format && !exporter.formats.includes(params.format)) {
      return {
        success: false,
        format: params.format,
        error: new Error(
          `Format '${params.format}' not supported by ${params.exporter} exporter`
        ),
      };
    }

    // Validate exporter options if validator exists
    if (exporter.validate && params.options) {
      const isValid = await exporter.validate(params.options);
      if (!isValid) {
        return {
          success: false,
          format: params.format || exporter.formats[0],
          error: new Error("Invalid exporter options"),
        };
      }
    }

    // Apply transformations
    let episodes = [...params.episodes];
    if (params.transform) {
      episodes = this.transformEpisodes(episodes, params.transform);
    }

    // Export
    try {
      if (episodes.length === 0) {
        return {
          success: true,
          format: params.format || exporter.formats[0],
          metadata: { episodeCount: 0 },
        };
      } else if (episodes.length === 1) {
        return await exporter.exportEpisode(episodes[0], params.options);
      } else {
        return await exporter.exportBatch(episodes, params.options);
      }
    } catch (error) {
      return {
        success: false,
        format: params.format || exporter.formats[0],
        error: error as Error,
      };
    }
  }

  /**
   * Transform episodes based on options
   */
  private transformEpisodes(
    episodes: Episode[],
    transform: ExportTransform
  ): Episode[] {
    let transformed = [...episodes];

    // Apply sanitization
    if (transform.sanitize) {
      transformed = transformed.map(transform.sanitize);
    }

    // Apply field filtering
    if (transform.fields) {
      transformed = transformed.map((episode) =>
        this.filterFields(episode, transform.fields!)
      );
    }

    // Apply sorting
    if (transform.sortBy) {
      transformed.sort((a, b) => {
        const aVal = a[transform.sortBy as keyof Episode] as any;
        const bVal = b[transform.sortBy as keyof Episode] as any;
        const order = transform.sortOrder === "desc" ? -1 : 1;

        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    }

    return transformed;
  }

  /**
   * Filter object fields based on include/exclude lists
   */
  private filterFields(
    obj: any,
    fields: { include?: string[]; exclude?: string[] }
  ): any {
    if (fields.include) {
      const filtered: any = {};
      fields.include.forEach((field) => {
        if (field in obj) {
          filtered[field] = obj[field];
        }
      });
      return filtered;
    }

    if (fields.exclude) {
      const filtered = { ...obj };
      fields.exclude.forEach((field) => {
        delete filtered[field];
      });
      return filtered;
    }

    return obj;
  }

  /**
   * Cleanup all registered exporters
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.exporters.values())
      .filter((exporter) => exporter.cleanup)
      .map((exporter) => exporter.cleanup!());

    await Promise.all(cleanupPromises);
  }
}
