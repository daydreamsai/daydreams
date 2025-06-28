import type { WorkingMemory, AnyRef } from "../types";
import type { MemoryManager } from "./types";
import { generateText } from "ai";

/**
 * Built-in memory managers that users can easily adopt
 */

/**
 * Token-based memory limiter that prunes based on estimated token count
 */
export function tokenLimiter(maxTokens: number): MemoryManager {
  return {
    maxSize: Math.floor(maxTokens / 4), // Rough estimation: 4 chars per token TODO: add tiktoken
    strategy: "fifo",
    shouldPrune: async (ctx, workingMemory, newEntry) => {
      const estimatedTokens = estimateTokenCount(workingMemory);
      return estimatedTokens >= maxTokens;
    },
    preserve: {
      recentInputs: 3,
      recentOutputs: 3,
    },
  };
}

/**
 * Smart memory manager with AI-powered compression
 */
export function smartMemoryManager(options: {
  maxSize: number;
  compressionThreshold?: number;
  preserveImportant?: boolean;
}): MemoryManager {
  return {
    maxSize: options.maxSize,
    strategy: "smart",
    compress: async (ctx, entries, agent) => {
      if (!agent.model) {
        return `Compressed ${entries.length} entries (no model available for AI compression)`;
      }

      const conversationEntries = entries
        .filter((entry) => entry.ref === "input" || entry.ref === "output")
        .slice(-10)
        .map((entry) => {
          const type = entry.ref === "input" ? "User" : "Assistant";
          const content =
            "content" in entry ? entry.content : JSON.stringify(entry);
          return `${type}: ${content}`;
        })
        .join("\n");

      if (!conversationEntries) {
        return `Compressed ${entries.length} system entries`;
      }

      try {
        const prompt = `Summarize this conversation segment in 2-3 concise sentences. Focus on key topics, decisions, and important information:

${conversationEntries}

Summary:`;

        const response = await generateText({
          model: agent.model,
          prompt,
          maxTokens: 2000,
          temperature: 0.3,
        });

        return response.text.trim();
      } catch (error) {
        agent.logger.warn(
          "AI compression failed:",
          JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
            contextId: ctx.id,
            entriesCount: entries.length,
          })
        );
        return `Compressed ${entries.length} entries (${
          entries.filter((e) => e.ref === "input").length
        } inputs, ${entries.filter((e) => e.ref === "output").length} outputs)`;
      }
    },
    preserve: {
      recentInputs: options.preserveImportant ? 5 : 2,
      recentOutputs: options.preserveImportant ? 5 : 2,
    },
  };
}

/**
 * Context-aware memory manager that preserves task-relevant information
 */
export function contextAwareManager(options: {
  maxSize: number;
  taskKeywords?: string[];
  preserveErrors?: boolean;
}): MemoryManager {
  return {
    maxSize: options.maxSize,
    strategy: "custom",
    shouldPrune: async (ctx, workingMemory, newEntry) => {
      const currentSize =
        workingMemory.inputs.length +
        workingMemory.outputs.length +
        workingMemory.calls.length +
        workingMemory.results.length;
      return currentSize >= options.maxSize;
    },
    onMemoryPressure: async (ctx, workingMemory) => {
      const { taskKeywords = [], preserveErrors = true } = options;

      const preserveEntry = (entry: AnyRef): boolean => {
        if (preserveErrors && "error" in entry && entry.error) {
          return true;
        }

        if (taskKeywords.length > 0) {
          const content =
            "content" in entry ? entry.content : JSON.stringify(entry);
          const hasKeyword = taskKeywords.some((keyword) =>
            content.toLowerCase().includes(keyword.toLowerCase())
          );
          if (hasKeyword) return true;
        }

        return false;
      };

      const preservedInputs = workingMemory.inputs.filter(preserveEntry);
      const recentInputs = workingMemory.inputs.slice(
        -Math.max(5, options.maxSize * 0.2)
      );
      
      // Properly deduplicate by id to avoid overlaps and ensure efficiency
      const seenInputIds = new Set<string>();
      const combinedInputs = [];
      
      // Add preserved inputs first (priority)
      for (const input of preservedInputs) {
        if (!seenInputIds.has(input.id)) {
          seenInputIds.add(input.id);
          combinedInputs.push(input);
        }
      }
      
      // Add recent inputs that aren't already preserved
      for (const input of recentInputs) {
        if (!seenInputIds.has(input.id)) {
          seenInputIds.add(input.id);
          combinedInputs.push(input);
        }
      }

      const preservedOutputs = workingMemory.outputs.filter(preserveEntry);
      const recentOutputs = workingMemory.outputs.slice(
        -Math.max(5, options.maxSize * 0.2)
      );
      
      // Properly deduplicate by id to avoid overlaps and ensure efficiency
      const seenOutputIds = new Set<string>();
      const combinedOutputs = [];
      
      // Add preserved outputs first (priority)
      for (const output of preservedOutputs) {
        if (!seenOutputIds.has(output.id)) {
          seenOutputIds.add(output.id);
          combinedOutputs.push(output);
        }
      }
      
      // Add recent outputs that aren't already preserved
      for (const output of recentOutputs) {
        if (!seenOutputIds.has(output.id)) {
          seenOutputIds.add(output.id);
          combinedOutputs.push(output);
        }
      }

      return {
        ...workingMemory,
        inputs: combinedInputs,
        outputs: combinedOutputs,
        thoughts: workingMemory.thoughts.slice(
          -Math.max(3, options.maxSize * 0.1)
        ),
        calls: workingMemory.calls.slice(-Math.max(10, options.maxSize * 0.3)),
        results: workingMemory.results.slice(
          -Math.max(10, options.maxSize * 0.3)
        ),
      };
    },
  };
}

/**
 * Simple FIFO memory manager with preservation rules
 */
export function fifoManager(options: {
  maxSize: number;
  preserveInputs?: number;
  preserveOutputs?: number;
  preserveActions?: string[];
}): MemoryManager {
  return {
    maxSize: options.maxSize,
    strategy: "fifo",
    preserve: {
      recentInputs: options.preserveInputs || 3,
      recentOutputs: options.preserveOutputs || 3,
      actionNames: options.preserveActions || [],
    },
  };
}

/**
 * Improved token count estimation that considers different content types
 * 
 * TODO: Replace with proper tokenization library (tiktoken, @anthropic-ai/tokenizer, etc.)
 * based on the target model when available. This is a more accurate estimation
 * than the previous 4 chars/token but still not perfect.
 */
function estimateTokenCount(workingMemory: WorkingMemory): number {
  let totalTokens = 0;

  // Estimate tokens for different content types with varying ratios
  workingMemory.inputs.forEach((entry) => {
    const content = entry.content?.toString() || "";
    totalTokens += estimateContentTokens(content);
  });

  workingMemory.outputs.forEach((entry) => {
    const content = entry.content?.toString() || "";
    totalTokens += estimateContentTokens(content);
  });

  workingMemory.thoughts.forEach((entry) => {
    // Thoughts are typically more verbose prose
    totalTokens += estimateContentTokens(entry.content, "prose");
  });

  workingMemory.calls.forEach((entry) => {
    // Action calls are typically structured/code-like
    totalTokens += estimateContentTokens(entry.content, "structured");
  });

  workingMemory.results.forEach((entry) => {
    // JSON data has different token density
    const jsonContent = JSON.stringify(entry.data || "");
    totalTokens += estimateContentTokens(jsonContent, "json");
  });

  return Math.ceil(totalTokens);
}

/**
 * Estimate tokens for different content types with more accurate ratios
 * Based on empirical analysis of different tokenizers (GPT, Claude, etc.)
 */
function estimateContentTokens(content: string, type: "text" | "prose" | "structured" | "json" = "text"): number {
  if (!content) return 0;
  
  const charCount = content.length;
  
  // Different content types have different character-to-token ratios
  switch (type) {
    case "prose":
      // Natural language prose: ~3.5 chars/token (more efficient)
      return charCount / 3.5;
    case "structured":
      // Code/structured data: ~4.5 chars/token (less efficient due to symbols)
      return charCount / 4.5;
    case "json":
      // JSON: ~4.8 chars/token (even less efficient due to syntax overhead)
      return charCount / 4.8;
    case "text":
    default:
      // General text: ~4 chars/token (balanced average)
      return charCount / 4;
  }
}
