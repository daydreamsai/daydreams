import { LogLevel } from "./types";
import type { StructuredLogData } from "./logger";
import { Logger } from "./logger";
import type { RequestContext, TokenUsage, ModelCallMetrics } from "./tracking";
import { getCorrelationIds, formatCorrelationIds } from "./tracking";

/**
 * Helper functions for consistent logging throughout the agent system
 */

/**
 * Creates a standardized logger context string with correlation IDs
 */
export function createLoggerContext(
  baseContext: string,
  requestContext?: RequestContext
): string {
  if (!requestContext) {
    return baseContext;
  }

  const correlationIds = getCorrelationIds(requestContext);
  const formattedIds = formatCorrelationIds(correlationIds);
  return `${baseContext}[${formattedIds}]`;
}

/**
 * Creates structured log data for model-related operations
 */
export function createModelLogData(
  requestContext: RequestContext,
  provider: string,
  modelId: string,
  tokenUsage?: TokenUsage,
  metrics?: ModelCallMetrics,
  error?: { message: string; code?: string; cause?: unknown }
): StructuredLogData {
  return {
    correlationIds: getCorrelationIds(requestContext),
    modelInfo: {
      provider,
      modelId,
    },
    tokenUsage,
    metrics,
    error,
  };
}

/**
 * Creates structured log data for action-related operations
 */
export function createActionLogData(
  requestContext: RequestContext,
  actionName: string,
  status: "start" | "complete" | "error",
  executionTime?: number,
  tokenUsage?: TokenUsage,
  error?: { message: string; code?: string; cause?: unknown }
): StructuredLogData {
  return {
    correlationIds: getCorrelationIds(requestContext),
    actionInfo: {
      actionName,
      status,
    },
    executionTime,
    tokenUsage,
    error,
  };
}

/**
 * Creates structured log data for context-related operations
 */
export function createContextLogData(
  requestContext: RequestContext,
  contextType: string,
  contextId?: string,
  memoryOperations?: number,
  updateDetails?: Record<string, unknown>
): StructuredLogData {
  return {
    correlationIds: getCorrelationIds(requestContext),
    contextInfo: {
      contextType,
      memoryOperations,
    },
    contextId,
    updateDetails,
  };
}

/**
 * Logs a model call with consistent formatting
 */
export function logModelCall(
  logger: Logger,
  level: LogLevel,
  operation: "start" | "complete" | "error",
  requestContext: RequestContext,
  provider: string,
  modelId: string,
  options?: {
    tokenUsage?: TokenUsage;
    metrics?: ModelCallMetrics;
    error?: { message: string; code?: string; cause?: unknown };
    callType?: string;
  }
): void {
  const context = createLoggerContext("model", requestContext);
  const data = createModelLogData(
    requestContext,
    provider,
    modelId,
    options?.tokenUsage,
    options?.metrics,
    options?.error
  );

  let message: string;
  switch (operation) {
    case "start":
      message = `Starting ${options?.callType || "call"}: ${provider}/${modelId}`;
      break;
    case "complete":
      message = `Completed ${options?.callType || "call"}: ${provider}/${modelId}`;
      if (options?.metrics?.totalTime) {
        message += ` (${options.metrics.totalTime}ms)`;
      }
      if (options?.tokenUsage?.totalTokens) {
        message += ` [${options.tokenUsage.totalTokens} tokens]`;
      }
      break;
    case "error":
      message = `Failed ${options?.callType || "call"}: ${provider}/${modelId}`;
      if (options?.error?.message) {
        message += ` - ${options.error.message}`;
      }
      break;
  }

  logger.structured(level, context, message, data);
}

/**
 * Logs an action execution with consistent formatting
 */
export function logActionExecution(
  logger: Logger,
  level: LogLevel,
  operation: "start" | "complete" | "error",
  requestContext: RequestContext,
  actionName: string,
  options?: {
    executionTime?: number;
    tokenUsage?: TokenUsage;
    cost?: number;
    error?: { message: string; code?: string; cause?: unknown };
    parameters?: Record<string, unknown>;
    result?: unknown;
  }
): void {
  const context = createLoggerContext("action", requestContext);
  const data = createActionLogData(
    requestContext,
    actionName,
    operation,
    options?.executionTime,
    options?.tokenUsage,
    options?.error
  );

  let message: string;
  switch (operation) {
    case "start":
      message = `Starting action: ${actionName}`;
      if (options?.parameters) {
        const paramCount = Object.keys(options.parameters).length;
        message += ` (${paramCount} params)`;
      }
      break;
    case "complete":
      message = `Completed action: ${actionName}`;
      if (options?.executionTime) {
        message += ` (${options.executionTime}ms)`;
      }
      if (options?.cost) {
        message += ` [$${options.cost.toFixed(4)}]`;
      }
      break;
    case "error":
      message = `Failed action: ${actionName}`;
      if (options?.error?.message) {
        message += ` - ${options.error.message}`;
      }
      break;
  }

  logger.structured(level, context, message, data);
}

/**
 * Logs context operations with consistent formatting
 */
export function logContextOperation(
  logger: Logger,
  level: LogLevel,
  operation: "create" | "activate" | "update" | "save",
  requestContext: RequestContext,
  contextType: string,
  contextId: string,
  options?: {
    memoryOperations?: number;
    updateType?: string;
    details?: Record<string, unknown>;
  }
): void {
  const context = createLoggerContext("context", requestContext);
  const data = createContextLogData(
    requestContext,
    contextType,
    contextId,
    options?.memoryOperations,
    options?.details
  );

  let message: string;
  switch (operation) {
    case "create":
      message = `Created context: ${contextType}`;
      break;
    case "activate":
      message = `Activated context: ${contextType}`;
      if (options?.memoryOperations) {
        message += ` (${options.memoryOperations} memory ops)`;
      }
      break;
    case "update":
      message = `Updated context: ${contextType}`;
      if (options?.updateType) {
        message += ` (${options.updateType})`;
      }
      break;
    case "save":
      message = `Saved context: ${contextType}`;
      break;
  }

  logger.structured(level, context, message, data);
}

/**
 * Logs agent lifecycle events with consistent formatting
 */
export function logAgentLifecycle(
  logger: Logger,
  level: LogLevel,
  operation: "start" | "complete" | "error",
  requestContext: RequestContext,
  agentName: string,
  options?: {
    executionTime?: number;
    totalTokenUsage?: TokenUsage;
    totalCost?: number;
    error?: { message: string; code?: string; cause?: unknown };
    configuration?: Record<string, unknown>;
  }
): void {
  const context = createLoggerContext("agent", requestContext);
  const data: StructuredLogData = {
    correlationIds: getCorrelationIds(requestContext),
    agentName,
    executionTime: options?.executionTime,
    tokenUsage: options?.totalTokenUsage,
    cost: options?.totalCost,
    error: options?.error,
    configuration: options?.configuration,
  };

  let message: string;
  switch (operation) {
    case "start":
      message = `Starting agent: ${agentName}`;
      break;
    case "complete":
      message = `Completed agent: ${agentName}`;
      if (options?.executionTime) {
        message += ` (${options.executionTime}ms)`;
      }
      if (options?.totalCost) {
        message += ` [$${options.totalCost.toFixed(4)}]`;
      }
      break;
    case "error":
      message = `Failed agent: ${agentName}`;
      if (options?.error?.message) {
        message += ` - ${options.error.message}`;
      }
      break;
  }

  logger.structured(level, context, message, data);
}

/**
 * Logs memory operations with consistent formatting
 */
export function logMemoryOperation(
  logger: Logger,
  level: LogLevel,
  operation: "read" | "write",
  requestContext: RequestContext,
  keys: string[],
  options?: {
    cacheHit?: boolean;
    size?: number;
    error?: { message: string; code?: string; cause?: unknown };
  }
): void {
  const context = createLoggerContext("memory", requestContext);
  const data: StructuredLogData = {
    correlationIds: getCorrelationIds(requestContext),
    memoryOperation: {
      operation,
      keys,
      cacheHit: options?.cacheHit,
      size: options?.size,
    },
    error: options?.error,
  };

  let message: string;
  switch (operation) {
    case "read":
      message = `Memory read: ${keys.length} keys`;
      if (options?.cacheHit !== undefined) {
        message += ` (${options.cacheHit ? "hit" : "miss"})`;
      }
      break;
    case "write":
      message = `Memory write: ${keys.length} keys`;
      if (options?.size) {
        message += ` (${options.size} bytes)`;
      }
      break;
  }

  logger.structured(level, context, message, data);
}

/**
 * Logs request lifecycle events with consistent formatting
 */
export function logRequestLifecycle(
  logger: Logger,
  level: LogLevel,
  operation: "start" | "complete" | "error",
  requestContext: RequestContext,
  source: string,
  options?: {
    executionTime?: number;
    totalTokenUsage?: TokenUsage;
    totalCost?: number;
    error?: { message: string; code?: string; cause?: unknown };
    userId?: string;
    sessionId?: string;
  }
): void {
  const context = createLoggerContext("request", requestContext);
  const data: StructuredLogData = {
    correlationIds: getCorrelationIds(requestContext),
    source,
    executionTime: options?.executionTime,
    tokenUsage: options?.totalTokenUsage,
    cost: options?.totalCost,
    error: options?.error,
    userId: options?.userId,
    sessionId: options?.sessionId,
  };

  let message: string;
  switch (operation) {
    case "start":
      message = `Request started: ${source}`;
      if (options?.userId) {
        message += ` (user: ${options.userId})`;
      }
      break;
    case "complete":
      message = `Request completed: ${source}`;
      if (options?.executionTime) {
        message += ` (${options.executionTime}ms)`;
      }
      if (options?.totalCost) {
        message += ` [$${options.totalCost.toFixed(4)}]`;
      }
      break;
    case "error":
      message = `Request failed: ${source}`;
      if (options?.error?.message) {
        message += ` - ${options.error.message}`;
      }
      break;
  }

  logger.structured(level, context, message, data);
}

/**
 * Formats token usage for display
 */
export function formatTokenUsage(tokenUsage: TokenUsage): string {
  const parts = [
    `${tokenUsage.inputTokens}→${tokenUsage.outputTokens}`,
  ];
  
  if (tokenUsage.reasoningTokens) {
    parts.push(`reasoning:${tokenUsage.reasoningTokens}`);
  }
  
  if (tokenUsage.estimatedCost) {
    parts.push(`$${tokenUsage.estimatedCost.toFixed(4)}`);
  }
  
  return `[${parts.join(', ')}]`;
}

/**
 * Formats execution time for display
 */
export function formatExecutionTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  } else if (timeMs < 60000) {
    return `${(timeMs / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = ((timeMs % 60000) / 1000).toFixed(1);
    return `${minutes}m${seconds}s`;
  }
}

/**
 * Formats cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000000).toFixed(0)}µ`;
  } else if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(1)}m`;
  } else {
    return `$${cost.toFixed(4)}`;
  }
}