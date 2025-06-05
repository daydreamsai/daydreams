// Types
export type {
  SyntheticConfig,
  SyntheticFormat,
  SyntheticRecord,
  InstructionTuningRecord,
  ConversationRecord,
  ReasoningChainRecord,
  ActionSequenceRecord,
  EpisodeRecord,
  CustomRecord,
  SyntheticFormatter,
  SyntheticCollector,
  SyntheticExporter as ISyntheticExporter,
  SyntheticAnalytics,
  QualityMetrics,
  DatasetStats,
  DataIssue,
  ValidatedSyntheticConfig,
} from "./types";

export { SyntheticConfigSchema } from "./types";

// Core components
export { RealtimeSyntheticCollector } from "./collector";
export { SyntheticExporter } from "./exporter";
export { SyntheticAnalyzer } from "./analytics";

// Main extension and utilities
export {
  createSyntheticExtension,
  createSyntheticData,
  defaultSyntheticConfig,
} from "./extension";

// Re-export for convenience
export { extension, action } from "@daydreamsai/core";
