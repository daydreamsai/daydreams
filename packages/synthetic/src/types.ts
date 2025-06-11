import { z } from "zod";
import type {
  AnyRef,
  AnyAgent,
  AgentContext,
  AnyContext,
} from "@daydreamsai/core";

/**
 * Configuration for synthetic data generation
 */
export interface SyntheticConfig {
  /** Whether to enable synthetic data generation */
  enabled: boolean;

  /** Output directory for generated datasets */
  outputDir: string;

  /** Formats to export data in */
  formats: SyntheticFormat[];

  /** What types of data to capture */
  capture: {
    /** Capture input/output pairs for instruction tuning */
    conversations: boolean;
    /** Capture reasoning chains for chain-of-thought training */
    reasoning: boolean;
    /** Capture action usage patterns */
    actions: boolean;
    /** Capture episodic memory formation */
    episodes: boolean;
    /** Capture preference data for GRPO training */
    preferences: boolean;
  };

  /** Filters for what data to include */
  filters?: {
    /** Minimum conversation length */
    minConversationLength?: number;
    /** Maximum conversation length */
    maxConversationLength?: number;
    /** Include only successful episodes */
    successfulOnly?: boolean;
    /** Context types to include */
    contexts?: string[];
    /** Action names to include */
    actions?: string[];
  };

  /** Privacy controls */
  privacy?: {
    /** Redact sensitive patterns */
    redactPatterns?: RegExp[];
    /** Anonymize user identifiers */
    anonymizeUsers?: boolean;
    /** Remove timestamps */
    removeTimestamps?: boolean;
  };

  /** Real-time or batch processing */
  mode: "realtime" | "batch";

  /** Batch size for processing */
  batchSize?: number;

  /** Custom formatters for specific use cases */
  customFormatters?: Record<string, SyntheticFormatter>;
}

/**
 * Supported export formats for synthetic data
 */
export type SyntheticFormat =
  | "instruction-tuning" // JSONL format for instruction fine-tuning
  | "conversation" // Chat conversation format
  | "reasoning-chains" // Step-by-step reasoning format
  | "action-sequences" // Action call and result sequences
  | "episodes" // Episodic memory format
  | "grpo" // Group Relative Policy Optimization format
  | "custom"; // Custom format using provided formatter

/**
 * Synthetic data record representing a single training example
 */
export interface SyntheticRecord {
  /** Unique identifier for this record */
  id: string;

  /** Timestamp when this was captured */
  timestamp: number;

  /** Type of record */
  type: SyntheticFormat;

  /** The actual training data */
  data:
    | InstructionTuningRecord
    | ConversationRecord
    | ReasoningChainRecord
    | ActionSequenceRecord
    | EpisodeRecord
    | GRPORecord
    | CustomRecord;

  /** Metadata about the record */
  metadata: {
    /** Context type where this was captured */
    contextType: string;
    /** Context ID */
    contextId: string;
    /** Agent model used */
    model?: string;
    /** Success/failure status */
    success?: boolean;
    /** Quality score (0-1) */
    quality?: number;
    /** Tags for categorization */
    tags?: string[];
  };
}

/**
 * Instruction tuning format (input/output pairs)
 */
export interface InstructionTuningRecord {
  /** User input/instruction */
  instruction: string;
  /** Model response */
  response: string;
  /** Optional system prompt */
  system?: string;
  /** Optional context/background */
  context?: string;
}

/**
 * Conversation format (multi-turn dialogue)
 */
export interface ConversationRecord {
  /** Array of conversation turns */
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: number;
  }>;
  /** Optional conversation summary */
  summary?: string;
}

/**
 * Reasoning chain format (step-by-step thinking)
 */
export interface ReasoningChainRecord {
  /** The problem or question */
  problem: string;
  /** Step-by-step reasoning process */
  reasoning: Array<{
    step: number;
    thought: string;
    action?: string;
    result?: string;
  }>;
  /** Final conclusion */
  conclusion: string;
}

/**
 * Action sequence format (actions and results)
 */
export interface ActionSequenceRecord {
  /** Context/situation description */
  situation: string;
  /** Sequence of actions taken */
  actions: Array<{
    name: string;
    arguments: any;
    result: any;
    timestamp: number;
    success: boolean;
  }>;
  /** Final outcome */
  outcome: string;
}

/**
 * Episode format (complete interaction episode)
 */
export interface EpisodeRecord {
  /** Episode identifier */
  episodeId: string;
  /** Initial observation/context */
  observation: string;
  /** Agent's thoughts and reasoning */
  thoughts: string[];
  /** Actions taken */
  actions: ActionSequenceRecord["actions"];
  /** Final result */
  result: string;
  /** Success status */
  success: boolean;
  /** Episode duration */
  duration: number;
}

/**
 * GRPO format (Group Relative Policy Optimization)
 */
export interface GRPORecord {
  /** The input prompt/query */
  prompt: string;
  /** Array of candidate responses with scores/rankings */
  responses: Array<{
    /** Response text */
    text: string;
    /** Quality score (0-1) or reward signal */
    score: number;
    /** Rank among responses (1 = best) */
    rank: number;
    /** Whether this response was successful */
    success: boolean;
    /** Model used to generate this response */
    model?: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
  }>;
  /** Optional system prompt */
  system?: string;
  /** Optional context/background information */
  context?: string;
  /** Preference comparison pairs (optional) */
  comparisons?: Array<{
    /** Index of preferred response in responses array */
    preferred: number;
    /** Index of rejected response in responses array */
    rejected: number;
    /** Confidence in preference (0-1) */
    confidence?: number;
  }>;
}

/**
 * Custom format (user-defined structure)
 */
export interface CustomRecord {
  /** Custom data structure */
  [key: string]: any;
}

/**
 * Formatter function for custom data formats
 */
export type SyntheticFormatter = (
  logs: AnyRef[],
  context: AgentContext<AnyContext>,
  agent: AnyAgent
) => SyntheticRecord[];

/**
 * Real-time data collector that processes agent logs
 */
export interface SyntheticCollector {
  /** Add a log entry for processing */
  addLog(log: AnyRef, context: AgentContext<AnyContext>): Promise<void>;

  /** Process accumulated logs into synthetic records */
  process(): Promise<SyntheticRecord[]>;

  /** Clear processed logs */
  clear(): void;

  /** Get current buffer size */
  getBufferSize(): number;
}

/**
 * Exporter for writing synthetic data to files
 */
export interface SyntheticExporter {
  /** Export records to specified format and location */
  export(
    records: SyntheticRecord[],
    format: SyntheticFormat,
    outputPath: string
  ): Promise<void>;

  /** Get file extension for format */
  getExtension(format: SyntheticFormat): string;

  /** Validate records before export */
  validate(records: SyntheticRecord[]): boolean;
}

/**
 * Analytics for synthetic data quality
 */
export interface SyntheticAnalytics {
  /** Calculate quality metrics for records */
  analyzeQuality(records: SyntheticRecord[]): QualityMetrics;

  /** Generate statistics about the dataset */
  generateStats(records: SyntheticRecord[]): DatasetStats;

  /** Identify potential issues with the data */
  detectIssues(records: SyntheticRecord[]): DataIssue[];
}

/**
 * Quality metrics for synthetic data
 */
export interface QualityMetrics {
  /** Overall quality score (0-1) */
  overallScore: number;

  /** Diversity score (0-1) */
  diversity: number;

  /** Completeness score (0-1) */
  completeness: number;

  /** Consistency score (0-1) */
  consistency: number;

  /** Per-format quality scores */
  byFormat: Record<SyntheticFormat, number>;
}

/**
 * Statistics about the generated dataset
 */
export interface DatasetStats {
  /** Total number of records */
  totalRecords: number;

  /** Records by format */
  byFormat: Record<SyntheticFormat, number>;

  /** Average record length */
  avgLength: number;

  /** Time range covered */
  timeRange: {
    start: number;
    end: number;
    duration: number;
  };

  /** Context distribution */
  contextDistribution: Record<string, number>;

  /** Action distribution */
  actionDistribution: Record<string, number>;

  /** Success rate */
  successRate: number;
}

/**
 * Data quality issues
 */
export interface DataIssue {
  /** Type of issue */
  type: "duplicate" | "incomplete" | "invalid" | "privacy" | "quality";

  /** Severity level */
  severity: "low" | "medium" | "high";

  /** Description of the issue */
  description: string;

  /** Record IDs affected */
  recordIds: string[];

  /** Suggested fix */
  suggestion?: string;
}

/**
 * Zod schemas for validation
 */
export const SyntheticConfigSchema = z
  .object({
    enabled: z.boolean(),
    outputDir: z.string(),
    formats: z.array(
      z.enum([
        "instruction-tuning",
        "conversation",
        "reasoning-chains",
        "action-sequences",
        "episodes",
        "grpo",
        "custom",
      ])
    ),
    capture: z.object({
      conversations: z.boolean(),
      reasoning: z.boolean(),
      actions: z.boolean(),
      episodes: z.boolean(),
      preferences: z.boolean(),
    }),
    filters: z
      .object({
        minConversationLength: z.number().optional(),
        maxConversationLength: z.number().optional(),
        successfulOnly: z.boolean().optional(),
        contexts: z.array(z.string()).optional(),
        actions: z.array(z.string()).optional(),
      })
      .optional(),
    privacy: z
      .object({
        redactPatterns: z.array(z.any()).optional(),
        anonymizeUsers: z.boolean().optional(),
        removeTimestamps: z.boolean().optional(),
      })
      .optional(),
    mode: z.enum(["realtime", "batch"]),
    batchSize: z.number().optional(),
  })
  .strict();

export type ValidatedSyntheticConfig = z.infer<typeof SyntheticConfigSchema>;
