import type { Episode } from "../../types";

/**
 * Core interface for episode exporters
 */
export interface EpisodeExporter<TOptions = any> {
  /** Unique name for this exporter */
  name: string;

  /** Human-readable description */
  description?: string;

  /** Supported export formats */
  formats: string[];

  /** Export a single episode */
  exportEpisode(episode: Episode, options?: TOptions): Promise<ExportResult>;

  /** Export multiple episodes */
  exportBatch(episodes: Episode[], options?: TOptions): Promise<ExportResult>;

  /** Validate options before export */
  validate?(options: TOptions): Promise<boolean>;

  /** Cleanup resources if needed */
  cleanup?(): Promise<void>;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  success: boolean;
  location?: string; // File path, URL, etc.
  format: string;
  size?: number;
  metadata?: Record<string, any>;
  error?: Error;
}

/**
 * Parameters for export operations
 */
export interface ExportParams {
  /** Episodes to export */
  episodes: Episode[];

  /** Exporter name */
  exporter: string;

  /** Export format (optional, uses default if not specified) */
  format?: string;

  /** Exporter-specific options */
  options?: any;

  /** Data transformation options */
  transform?: ExportTransform;
}

/**
 * Options for transforming episodes during export
 */
export interface ExportTransform {
  /** Fields to include/exclude */
  fields?: {
    include?: string[];
    exclude?: string[];
  };

  /** Custom sanitization function */
  sanitize?: (episode: Episode) => Episode;

  /** Sort episodes */
  sortBy?: "timestamp" | "type" | "duration";
  sortOrder?: "asc" | "desc";
}

/**
 * Query for fetching episodes
 */
export interface EpisodeQuery {
  contextId?: string;
  timeRange?: { start: Date; end: Date };
  types?: Episode["type"][];
  limit?: number;
  metadata?: Record<string, any>;
}
