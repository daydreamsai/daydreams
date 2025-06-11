import {
  extension,
  action,
  type Extension,
  type AnyAgent,
} from "@daydreamsai/core";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

import type {
  SyntheticConfig,
  SyntheticFormat,
  SyntheticRecord,
  ValidatedSyntheticConfig,
} from "./types";
import { SyntheticConfigSchema } from "./types";
import { RealtimeSyntheticCollector } from "./collector";
import { SyntheticExporter } from "./exporter";
import { SyntheticAnalyzer } from "./analytics";

/**
 * Creates a synthetic data generation extension for Daydreams agents
 */
export function createSyntheticExtension(config: SyntheticConfig): Extension {
  let collector: RealtimeSyntheticCollector;
  let exporter: SyntheticExporter;
  let analyzer: SyntheticAnalyzer;
  let agent: AnyAgent;

  // Validate configuration
  const validatedConfig = SyntheticConfigSchema.parse(
    config
  ) as ValidatedSyntheticConfig;

  return extension({
    name: "synthetic",

    async install(agentInstance) {
      agent = agentInstance;

      // Initialize components
      collector = new RealtimeSyntheticCollector(validatedConfig, agent);
      exporter = new SyntheticExporter();
      analyzer = new SyntheticAnalyzer();

      // Ensure output directory exists
      await fs.mkdir(validatedConfig.outputDir, { recursive: true });

      // Hook into agent's log stream to capture data
      if (validatedConfig.enabled && validatedConfig.mode === "realtime") {
        console.log("🔧 Setting up synthetic data collection hooks...");

        // APPROACH 3: Hook into the agent's saveContext method to catch new contexts
        const originalSaveContext = agent.saveContext.bind(agent);
        agent.saveContext = async function (ctxState, workingMemory) {
          // Call the original method first
          const result = await originalSaveContext(ctxState, workingMemory);

          // Now subscribe to this new context
          console.log(`🔗 New context detected, subscribing: ${ctxState.id}`);
          agent.subscribeContext(ctxState.id, async (log, done) => {
            const context = await agent.getContextById(ctxState.id);
            if (context) {
              await collector.addLog(log, {
                id: context.id,
                context: context.context,
                args: context.args,
                options: context.options,
                settings: context.settings,
                memory: context.memory,
                workingMemory: await agent.getWorkingMemory(context.id),
              });
            }
          });

          return result;
        };

        // Also subscribe to any existing contexts
        const existingContexts = await agent.getContexts();
        console.log(
          `🔍 Found ${existingContexts.length} existing contexts, subscribing...`
        );

        for (const contextInfo of existingContexts) {
          console.log(`🔗 Subscribing to existing context: ${contextInfo.id}`);
          agent.subscribeContext(contextInfo.id, async (log, done) => {
            const context = await agent.getContextById(contextInfo.id);
            if (context) {
              await collector.addLog(log, {
                id: context.id,
                context: context.context,
                args: context.args,
                options: context.options,
                settings: context.settings,
                memory: context.memory,
                workingMemory: await agent.getWorkingMemory(context.id),
              });
            }
          });
        }
      }

      console.log(
        `🔬 Synthetic data generation enabled (${validatedConfig.mode} mode)`
      );
      console.log(`📁 Output directory: ${validatedConfig.outputDir}`);
      console.log(`📊 Formats: ${validatedConfig.formats.join(", ")}`);
    },

    actions: [
      // Action to manually trigger data processing
      action({
        name: "synthetic.process",
        description: "Process accumulated logs into synthetic training data",
        schema: {
          export: z
            .boolean()
            .optional()
            .describe("Whether to export the processed data"),
          analyze: z
            .boolean()
            .optional()
            .describe("Whether to analyze data quality"),
        },
        handler: async ({ export: shouldExport = true, analyze = true }) => {
          if (!collector) {
            return { error: "Synthetic data collector not initialized" };
          }

          try {
            // Process logs into records
            const records = await collector.process();

            let analysis = null;
            if (analyze && records.length > 0) {
              analysis = analyzer.generateStats(records);
            }

            // Export data if requested
            if (shouldExport && records.length > 0) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
              const exportPromises = validatedConfig.formats.map(
                async (format: SyntheticFormat) => {
                  const filename = `synthetic-${format}-${timestamp}.${exporter.getExtension(
                    format
                  )}`;
                  const outputPath = path.join(
                    validatedConfig.outputDir,
                    filename
                  );
                  await exporter.export(records, format, outputPath);
                  return { format, path: outputPath };
                }
              );

              const exportResults = await Promise.all(exportPromises);
              collector.clear(); // Clear processed data

              return {
                processed: records.length,
                exported: exportResults,
                analysis,
              };
            }

            return {
              processed: records.length,
              analysis,
            };
          } catch (error) {
            return {
              error: `Failed to process synthetic data: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),

      // Action to configure synthetic data generation
      action({
        name: "synthetic.configure",
        description: "Update synthetic data generation configuration",
        schema: {
          enabled: z.boolean().optional(),
          mode: z.enum(["realtime", "batch"]).optional(),
          formats: z
            .array(
              z.enum([
                "instruction-tuning",
                "conversation",
                "reasoning-chains",
                "action-sequences",
                "episodes",
                "custom",
              ])
            )
            .optional(),
          outputDir: z.string().optional(),
          capture: z
            .object({
              conversations: z.boolean().optional(),
              reasoning: z.boolean().optional(),
              actions: z.boolean().optional(),
              episodes: z.boolean().optional(),
            })
            .optional(),
        },
        handler: async ({ enabled, mode, formats, outputDir, capture }) => {
          try {
            // Update configuration
            if (enabled !== undefined) validatedConfig.enabled = enabled;
            if (mode !== undefined) validatedConfig.mode = mode;
            if (formats !== undefined) validatedConfig.formats = formats;
            if (outputDir !== undefined) {
              validatedConfig.outputDir = outputDir;
              await fs.mkdir(outputDir as string, { recursive: true });
            }
            if (capture !== undefined) {
              validatedConfig.capture = {
                ...validatedConfig.capture,
                ...capture,
              };
            }

            // Reinitialize collector with new config
            if (collector) {
              collector = new RealtimeSyntheticCollector(
                validatedConfig,
                agent
              );
            }

            return {
              success: true,
              config: validatedConfig,
            };
          } catch (error) {
            return {
              error: `Failed to update configuration: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),

      // Action to get current statistics
      action({
        name: "synthetic.status",
        description:
          "Get current synthetic data generation status and statistics",
        handler: async () => {
          return {
            enabled: validatedConfig.enabled,
            mode: validatedConfig.mode,
            outputDir: validatedConfig.outputDir,
            formats: validatedConfig.formats,
            capture: validatedConfig.capture,
            bufferSize: collector ? collector.getBufferSize() : 0,
            config: validatedConfig,
          };
        },
      }),

      // Action to analyze existing synthetic data
      action({
        name: "synthetic.analyze",
        description: "Analyze quality of existing synthetic data files",
        schema: {
          filePath: z
            .string()
            .optional()
            .describe("Path to synthetic data file to analyze"),
        },
        handler: async ({ filePath }) => {
          try {
            if (filePath) {
              // Analyze specific file
              const data = await fs.readFile(filePath as string, "utf-8");
              const records: SyntheticRecord[] = data
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line));

              const quality = analyzer.analyzeQuality(records);
              const stats = analyzer.generateStats(records);
              const issues = analyzer.detectIssues(records);

              return { quality, stats, issues };
            } else {
              // Analyze current buffer
              const records = await collector.process();

              if (records.length === 0) {
                return { message: "No data to analyze" };
              }

              const quality = analyzer.analyzeQuality(records);
              const stats = analyzer.generateStats(records);
              const issues = analyzer.detectIssues(records);

              return { quality, stats, issues };
            }
          } catch (error) {
            return {
              error: `Failed to analyze data: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),

      // Action to export all agent episodes as training data
      action({
        name: "synthetic.exportAllEpisodes",
        description: "Export all stored episodes as synthetic training data",
        schema: {
          format: z
            .enum([
              "instruction-tuning",
              "conversation",
              "reasoning-chains",
              "action-sequences",
              "episodes",
            ])
            .optional()
            .default("episodes"),
        },
        handler: async ({ format = "episodes" }) => {
          try {
            // Use the agent's built-in export functionality if available
            if (agent.exportAllTrainingData) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
              const filename = `episodes-export-${timestamp}.jsonl`;
              const outputPath = path.join(validatedConfig.outputDir, filename);

              await agent.exportAllTrainingData(outputPath);

              return {
                exported: true,
                path: outputPath,
                format,
              };
            } else {
              return {
                error: "Agent does not support episode export",
              };
            }
          } catch (error) {
            return {
              error: `Failed to export episodes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),

      // Action to clear accumulated data
      action({
        name: "synthetic.clear",
        description: "Clear accumulated synthetic data buffer",
        handler: async () => {
          const bufferSize = collector ? collector.getBufferSize() : 0;

          if (collector) {
            collector.clear();
          }

          return {
            cleared: bufferSize,
            message: `Cleared ${bufferSize} buffered records`,
          };
        },
      }),
    ],
  });
}

/**
 * Default configuration for synthetic data generation
 */
export const defaultSyntheticConfig: SyntheticConfig = {
  enabled: true,
  outputDir: "./synthetic-data",
  formats: ["instruction-tuning", "conversation"],
  capture: {
    conversations: true,
    reasoning: true,
    actions: true,
    episodes: true,
    preferences: false, // GRPO disabled by default
  },
  mode: "batch",
  batchSize: 50,
  filters: {
    minConversationLength: 2,
    maxConversationLength: 50,
    successfulOnly: false,
  },
  privacy: {
    anonymizeUsers: true,
    removeTimestamps: false,
  },
};

/**
 * Convenience function to create a synthetic extension with default config
 */
export function createSyntheticData(overrides: Partial<SyntheticConfig> = {}) {
  return createSyntheticExtension({
    ...defaultSyntheticConfig,
    ...overrides,
  });
}
