import type { Logger, LogEntry, EventType } from "../logger";

/**
 * Simple request and cost tracking using logger events
 * Replaces the complex tracking system with a lightweight event-based approach
 */

export interface RequestMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  totalCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  modelCalls: number;
  actionCalls: number;
  status: "running" | "completed" | "failed";
  agentName?: string;
  userId?: string;
  sessionId?: string;
}

export interface SimpleAnalytics {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  completedRequests: number;
  successRate: number;
  averageResponseTime: number;
  costByModel: Record<string, number>;
  costByAction: Record<string, number>;
  tokensByModel: Record<string, number>;
}

export class SimpleTracker {
  private events: LogEntry[] = [];
  private requests = new Map<string, RequestMetrics>();
  private maxEvents = 10000;

  constructor(private logger: Logger) {
    // Listen to all logger events and extract tracking data
    this.logger.on("*", (entry) => {
      this.processLogEntry(entry);
    });
  }

  private processLogEntry(entry: LogEntry): void {
    // Add to events (with memory management)
    this.events.push(entry);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents); // Keep recent events
    }

    // Extract correlation IDs from log data
    const requestId = entry.data?.requestId;
    if (!requestId) return;

    // Get or create request metrics
    let request = this.requests.get(requestId);
    if (!request) {
      request = {
        requestId,
        startTime: entry.timestamp,
        totalCost: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        modelCalls: 0,
        actionCalls: 0,
        status: "running",
        agentName: entry.data?.agentName,
        userId: entry.data?.userId,
        sessionId: entry.data?.sessionId,
      };
      this.requests.set(requestId, request);
    }

    // Update metrics based on event type
    switch (entry.eventType) {
      case "MODEL_CALL_COMPLETE":
        request.modelCalls++;
        if (entry.data?.cost) request.totalCost += entry.data.cost;
        if (entry.data?.tokens) {
          request.totalTokens += entry.data.tokens.total || 0;
          request.inputTokens += entry.data.tokens.input || 0;
          request.outputTokens += entry.data.tokens.output || 0;
          request.reasoningTokens += entry.data.tokens.reasoning || 0;
        }
        break;

      case "ACTION_COMPLETE":
      case "ACTION_ERROR":
        request.actionCalls++;
        break;

      case "AGENT_COMPLETE":
      case "REQUEST_COMPLETE":
        request.endTime = entry.timestamp;
        request.status = "completed";
        break;

      case "AGENT_ERROR":
      case "REQUEST_ERROR":
        request.endTime = entry.timestamp;
        request.status = "failed";
        break;
    }

    // Clean up old requests (keep last 1000)
    if (this.requests.size > 1000) {
      const oldestRequests = Array.from(this.requests.entries())
        .sort(([, a], [, b]) => a.startTime - b.startTime)
        .slice(0, this.requests.size - 1000);

      for (const [requestId] of oldestRequests) {
        this.requests.delete(requestId);
      }
    }
  }

  /**
   * Get total cost for a time period
   */
  getTotalCost(timeRange?: { start: number; end: number }): number {
    return this.getCompletedRequests(timeRange).reduce(
      (sum, req) => sum + req.totalCost,
      0
    );
  }

  /**
   * Get total tokens for a time period
   */
  getTotalTokens(timeRange?: { start: number; end: number }): number {
    return this.getCompletedRequests(timeRange).reduce(
      (sum, req) => sum + req.totalTokens,
      0
    );
  }

  /**
   * Get cost breakdown by model
   */
  getCostByModel(timeRange?: {
    start: number;
    end: number;
  }): Record<string, number> {
    const modelCosts: Record<string, number> = {};

    this.getEventsInRange("MODEL_CALL_COMPLETE", timeRange).forEach((event) => {
      const modelId = event.data?.modelId;
      const cost = event.data?.cost || 0;
      if (modelId && cost > 0) {
        modelCosts[modelId] = (modelCosts[modelId] || 0) + cost;
      }
    });

    return modelCosts;
  }

  /**
   * Get cost breakdown by action
   */
  getCostByAction(timeRange?: {
    start: number;
    end: number;
  }): Record<string, number> {
    const actionCosts: Record<string, number> = {};

    // Track model calls by their parent action
    this.getEventsInRange("MODEL_CALL_COMPLETE", timeRange).forEach((event) => {
      const actionName = event.data?.actionName || "unknown";
      const cost = event.data?.cost || 0;
      if (cost > 0) {
        actionCosts[actionName] = (actionCosts[actionName] || 0) + cost;
      }
    });

    return actionCosts;
  }

  /**
   * Get user activity summary
   */
  getUserActivity(
    userId: string,
    timeRange?: { start: number; end: number }
  ): {
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    averageResponseTime: number;
  } {
    const userRequests = this.getCompletedRequests(timeRange).filter(
      (req) => req.userId === userId
    );

    const totalRequests = userRequests.length;
    const totalCost = userRequests.reduce((sum, req) => sum + req.totalCost, 0);
    const totalTokens = userRequests.reduce(
      (sum, req) => sum + req.totalTokens,
      0
    );

    const responseTimes = userRequests
      .filter((req) => req.endTime)
      .map((req) => req.endTime! - req.startTime);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    return {
      totalRequests,
      totalCost,
      totalTokens,
      averageResponseTime,
    };
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(timeRange?: { start: number; end: number }): SimpleAnalytics {
    const allRequests = Array.from(this.requests.values()).filter(
      (req) =>
        !timeRange ||
        (req.startTime >= timeRange.start && req.startTime <= timeRange.end)
    );

    const completedRequests = allRequests.filter(
      (req) => req.status === "completed"
    );
    const totalRequests = allRequests.length;
    const totalCompleted = completedRequests.length;

    const totalCost = completedRequests.reduce(
      (sum, req) => sum + req.totalCost,
      0
    );
    const totalTokens = completedRequests.reduce(
      (sum, req) => sum + req.totalTokens,
      0
    );

    const responseTimes = completedRequests
      .filter((req) => req.endTime)
      .map((req) => req.endTime! - req.startTime);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    return {
      totalCost,
      totalTokens,
      totalRequests,
      completedRequests: totalCompleted,
      successRate: totalRequests > 0 ? totalCompleted / totalRequests : 0,
      averageResponseTime,
      costByModel: this.getCostByModel(timeRange),
      costByAction: this.getCostByAction(timeRange),
      tokensByModel: this.getTokensByModel(timeRange),
    };
  }

  /**
   * Get all request metrics
   */
  getAllRequests(): RequestMetrics[] {
    return Array.from(this.requests.values());
  }

  /**
   * Get specific request metrics
   */
  getRequest(requestId: string): RequestMetrics | null {
    return this.requests.get(requestId) || null;
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.events = [];
    this.requests.clear();
  }

  private getCompletedRequests(timeRange?: {
    start: number;
    end: number;
  }): RequestMetrics[] {
    return Array.from(this.requests.values())
      .filter((req) => req.status === "completed")
      .filter(
        (req) =>
          !timeRange ||
          (req.startTime >= timeRange.start && req.startTime <= timeRange.end)
      );
  }

  private getEventsInRange(
    eventType: EventType,
    timeRange?: { start: number; end: number }
  ): LogEntry[] {
    return this.events
      .filter((event) => event.eventType === eventType)
      .filter(
        (event) =>
          !timeRange ||
          (event.timestamp >= timeRange.start &&
            event.timestamp <= timeRange.end)
      );
  }

  private getTokensByModel(timeRange?: {
    start: number;
    end: number;
  }): Record<string, number> {
    const modelTokens: Record<string, number> = {};

    this.getEventsInRange("MODEL_CALL_COMPLETE", timeRange).forEach((event) => {
      const modelId = event.data?.modelId;
      const tokens = event.data?.tokens?.total || 0;
      if (modelId && tokens > 0) {
        modelTokens[modelId] = (modelTokens[modelId] || 0) + tokens;
      }
    });

    return modelTokens;
  }
}

/**
 * Create a simple tracker instance
 */
export function createSimpleTracker(logger: Logger): SimpleTracker {
  return new SimpleTracker(logger);
}

/**
 * Utility functions for formatting metrics
 */
export const formatMetrics = {
  cost: (cost: number): string => {
    if (cost < 0.01) return `$${(cost * 1000).toFixed(3)}k`;
    return `$${cost.toFixed(3)}`;
  },

  tokens: (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  },

  duration: (ms: number): string => {
    if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  },
};
