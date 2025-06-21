export * from "../tracking";
export * from "./storage";
export * from "./tracker";
export * from "./analytics";

import { v7 as randomUUIDv7 } from "uuid";

/**
 * Token usage information from model calls
 */
export interface TokenUsage {
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Total tokens (input + output) */
  totalTokens: number;
  /** Reasoning tokens for reasoning models */
  reasoningTokens?: number;
  /** Estimated cost in USD */
  estimatedCost?: number;
}

/**
 * Model call performance metrics
 */
export interface ModelCallMetrics {
  /** Time to first token (TTFT) in milliseconds */
  timeToFirstToken?: number;
  /** Total execution time in milliseconds */
  totalTime: number;
  /** Tokens per second */
  tokensPerSecond?: number;
  /** Model ID used for this call */
  modelId: string;
  /** Provider name (anthropic, openai, etc.) */
  provider: string;
}

/**
 * Individual model call tracking information
 */
export interface ModelCall {
  /** Unique model call ID */
  id: string;
  /** Parent action call ID */
  actionCallId: string;
  /** Parent context ID */
  contextId: string;
  /** Parent agent run ID */
  agentRunId: string;
  /** Root request ID */
  requestId: string;
  /** Timestamp when call started */
  startTime: number;
  /** Timestamp when call completed */
  endTime?: number;
  /** Token usage information */
  tokenUsage?: TokenUsage;
  /** Performance metrics */
  metrics?: ModelCallMetrics;
  /** Call type (generate, stream, embed, etc.) */
  callType: "generate" | "stream" | "embed" | "reasoning";
  /** Error information if call failed */
  error?: {
    message: string;
    code?: string;
    cause?: unknown;
  };
}

/**
 * Action call tracking information
 */
export interface ActionCallTracking {
  /** Action call ID */
  id: string;
  /** Parent context ID */
  contextId: string;
  /** Parent agent run ID */
  agentRunId: string;
  /** Root request ID */
  requestId: string;
  /** Action name */
  actionName: string;
  /** Timestamp when action started */
  startTime: number;
  /** Timestamp when action completed */
  endTime?: number;
  /** Model calls made during this action */
  modelCalls: ModelCall[];
  /** Aggregated token usage from all model calls */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Action execution status */
  status: "running" | "completed" | "failed";
  /** Error information if action failed */
  error?: {
    message: string;
    cause?: unknown;
  };
}

/**
 * Context tracking information
 */
export interface ContextTracking {
  /** Context ID */
  id: string;
  /** Context type */
  type: string;
  /** Parent agent run ID */
  agentRunId: string;
  /** Root request ID */
  requestId: string;
  /** Context arguments hash for caching */
  argsHash?: string;
  /** Timestamp when context was created */
  startTime: number;
  /** Timestamp when context was last used */
  lastUsedTime?: number;
  /** Action calls made in this context */
  actionCalls: ActionCallTracking[];
  /** Aggregated metrics from all actions */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Memory operations count */
  memoryOperations: number;
}

/**
 * Agent run tracking information
 */
export interface AgentRunTracking {
  /** Agent run ID */
  id: string;
  /** Agent name/type */
  agentName: string;
  /** Root request ID */
  requestId: string;
  /** Timestamp when run started */
  startTime: number;
  /** Timestamp when run completed */
  endTime?: number;
  /** Contexts used during this run */
  contexts: ContextTracking[];
  /** Aggregated metrics from all contexts */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Run status */
  status: "running" | "completed" | "failed";
  /** Error information if run failed */
  error?: {
    message: string;
    cause?: unknown;
  };
}

/**
 * Top-level request tracking information
 */
export interface RequestTracking {
  /** Unique request ID */
  id: string;
  /** User/session identifier */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
  /** Request source/type */
  source: string;
  /** Timestamp when request started */
  startTime: number;
  /** Timestamp when request completed */
  endTime?: number;
  /** Agent runs triggered by this request */
  agentRuns: AgentRunTracking[];
  /** Aggregated metrics from all agent runs */
  totalTokenUsage?: TokenUsage;
  /** Total estimated cost */
  totalCost?: number;
  /** Request status */
  status: "running" | "completed" | "failed";
  /** Error information if request failed */
  error?: {
    message: string;
    cause?: unknown;
  };
  /** Request metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Request tracking context passed through execution
 */
export interface RequestContext {
  /** Current request ID */
  requestId: string;
  /** Current agent run ID */
  agentRunId?: string;
  /** Current context ID */
  contextId?: string;
  /** Current action call ID */
  actionCallId?: string;
  /** Whether tracking is enabled */
  trackingEnabled: boolean;
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for request tracking
 */
export interface RequestTrackingConfig {
  /** Whether tracking is enabled */
  enabled: boolean;
  /** Whether to track token usage */
  trackTokenUsage: boolean;
  /** Whether to track performance metrics */
  trackPerformance: boolean;
  /** Whether to track costs */
  trackCosts: boolean;
  /** Whether to log tracking metrics */
  enableLogging?: boolean;
  /** Minimum log level for tracking metrics */
  logLevel?: "trace" | "debug" | "info" | "warn" | "error";
  /** Cost estimation per model/provider */
  costEstimation?: {
    [modelProvider: string]: {
      inputTokenCost: number; // Cost per 1 million input tokens
      outputTokenCost: number; // Cost per 1 million output tokens
      reasoningTokenCost?: number; // Cost per 1 million reasoning tokens
    };
  };
  /** Storage backend for tracking data */
  storage?: RequestTrackingStorage;
}

/**
 * Storage interface for request tracking data
 */
export interface RequestTrackingStorage {
  /** Store request tracking data */
  storeRequest(request: RequestTracking): Promise<void>;
  /** Retrieve request tracking data */
  getRequest(requestId: string): Promise<RequestTracking | null>;
  /** Store model call data */
  storeModelCall(modelCall: ModelCall): Promise<void>;
  /** Query requests by criteria */
  queryRequests(criteria: RequestQueryCriteria): Promise<RequestTracking[]>;
  /** Get aggregated metrics */
  getMetrics(criteria: MetricsQueryCriteria): Promise<AggregatedMetrics>;
}

/**
 * Query criteria for requests
 */
export interface RequestQueryCriteria {
  /** User ID filter */
  userId?: string;
  /** Session ID filter */
  sessionId?: string;
  /** Agent name filter */
  agentName?: string;
  /** Time range filter */
  timeRange?: {
    start: number;
    end: number;
  };
  /** Status filter */
  status?: ("running" | "completed" | "failed")[];
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Query criteria for metrics
 */
export interface MetricsQueryCriteria {
  /** Time range filter */
  timeRange?: {
    start: number;
    end: number;
  };
  /** Aggregation level */
  aggregateBy: "request" | "agent" | "context" | "action" | "model";
  /** Group by fields */
  groupBy?: string[];
  /** User ID filter */
  userId?: string;
  /** Agent name filter */
  agentName?: string;
}

/**
 * Aggregated metrics result
 */
export interface AggregatedMetrics {
  /** Total requests */
  totalRequests: number;
  /** Total token usage */
  totalTokenUsage: TokenUsage;
  /** Total cost */
  totalCost: number;
  /** Average response time */
  averageResponseTime: number;
  /** Success rate */
  successRate: number;
  /** Breakdown by group */
  breakdown: Array<{
    group: Record<string, string>;
    metrics: {
      requests: number;
      tokenUsage: TokenUsage;
      cost: number;
      averageResponseTime: number;
      successRate: number;
    };
  }>;
}

/**
 * Creates a new request context
 */
export function createRequestContext(
  source: string,
  options?: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    trackingEnabled?: boolean;
  }
): RequestContext {
  return {
    requestId: randomUUIDv7(),
    trackingEnabled: options?.trackingEnabled ?? true,
    metadata: {
      source,
      userId: options?.userId,
      sessionId: options?.sessionId,
      ...options?.metadata,
    },
  };
}

/**
 * Creates a child context for agent runs
 */
export function createAgentRunContext(
  parentContext: RequestContext,
  agentName: string
): RequestContext {
  return {
    ...parentContext,
    agentRunId: randomUUIDv7(),
    metadata: {
      ...parentContext.metadata,
      agentName,
    },
  };
}

/**
 * Creates a child context for context operations
 */
export function createContextTrackingContext(
  parentContext: RequestContext,
  contextId: string,
  contextType: string
): RequestContext {
  return {
    ...parentContext,
    contextId,
    metadata: {
      ...parentContext.metadata,
      contextType,
    },
  };
}

/**
 * Creates a child context for action calls
 */
export function createActionCallContext(
  parentContext: RequestContext,
  actionName: string
): RequestContext {
  return {
    ...parentContext,
    actionCallId: randomUUIDv7(),
    metadata: {
      ...parentContext.metadata,
      actionName,
    },
  };
}

/**
 * Extracts correlation IDs from request context for logging
 */
export interface CorrelationIds {
  requestId: string;
  agentRunId?: string;
  contextId?: string;
  actionCallId?: string;
}

/**
 * Extracts correlation IDs from request context
 */
export function getCorrelationIds(context: RequestContext): CorrelationIds {
  return {
    requestId: context.requestId,
    agentRunId: context.agentRunId,
    contextId: context.contextId,
    actionCallId: context.actionCallId,
  };
}

/**
 * Creates a correlation ID string for logging context
 */
export function formatCorrelationIds(ids: CorrelationIds): string {
  const parts = [`req:${ids.requestId.slice(-8)}`];

  if (ids.agentRunId) {
    parts.push(`run:${ids.agentRunId.slice(-8)}`);
  }

  if (ids.contextId) {
    parts.push(`ctx:${ids.contextId.slice(-8)}`);
  }

  if (ids.actionCallId) {
    parts.push(`act:${ids.actionCallId.slice(-8)}`);
  }

  return parts.join("|");
}

/**
 * Utility to aggregate token usage
 */
export function aggregateTokenUsage(usages: TokenUsage[]): TokenUsage {
  return usages.reduce(
    (total, usage) => ({
      inputTokens: total.inputTokens + usage.inputTokens,
      outputTokens: total.outputTokens + usage.outputTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
      reasoningTokens:
        (total.reasoningTokens || 0) + (usage.reasoningTokens || 0),
      estimatedCost: (total.estimatedCost || 0) + (usage.estimatedCost || 0),
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0,
      estimatedCost: 0,
    }
  );
}

/**
 * Utility to estimate cost based on token usage
 */
export function estimateCost(
  tokenUsage: TokenUsage,
  modelProvider: string,
  costConfig?: RequestTrackingConfig["costEstimation"]
): number {
  if (!costConfig || !costConfig[modelProvider]) {
    return 0;
  }

  const perMillionTokens = 1000000;

  const rates = costConfig[modelProvider];
  const inputCost =
    (tokenUsage.inputTokens / perMillionTokens) * rates.inputTokenCost;
  const outputCost =
    (tokenUsage.outputTokens / perMillionTokens) * rates.outputTokenCost;
  const reasoningCost =
    tokenUsage.reasoningTokens && rates.reasoningTokenCost
      ? (tokenUsage.reasoningTokens / perMillionTokens) *
        rates.reasoningTokenCost
      : 0;

  return inputCost + outputCost + reasoningCost;
}
