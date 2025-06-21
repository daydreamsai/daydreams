import type {
  RequestTrackingStorage,
  TokenUsage,
  RequestQueryCriteria,
  MetricsQueryCriteria,
} from "../tracking";

/**
 * Analytics utilities for request tracking data
 */
export class RequestAnalytics {
  constructor(private storage: RequestTrackingStorage) {}

  /**
   * Get cost breakdown by time period
   */
  async getCostBreakdown(
    timeRange: { start: number; end: number },
    granularity: "hour" | "day" | "week" = "day"
  ): Promise<
    Array<{ timestamp: number; cost: number; tokenUsage: TokenUsage }>
  > {
    const requests = await this.storage.queryRequests({
      timeRange,
      status: ["completed"],
    });

    const buckets = new Map<
      number,
      { cost: number; tokenUsages: TokenUsage[] }
    >();
    const bucketSize = this.getBucketSize(granularity);

    for (const request of requests) {
      const bucketKey = Math.floor(request.startTime / bucketSize) * bucketSize;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { cost: 0, tokenUsages: [] });
      }

      const bucket = buckets.get(bucketKey)!;
      bucket.cost += request.totalCost || 0;
      if (request.totalTokenUsage) {
        bucket.tokenUsages.push(request.totalTokenUsage);
      }
    }

    return Array.from(buckets.entries())
      .map(([timestamp, { cost, tokenUsages }]) => ({
        timestamp,
        cost,
        tokenUsage: this.aggregateTokenUsages(tokenUsages),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get top performing agents by efficiency (tokens per second)
   */
  async getAgentEfficiency(
    timeRange?: { start: number; end: number },
    limit = 10
  ): Promise<
    Array<{
      agentName: string;
      totalRequests: number;
      averageTokensPerSecond: number;
      totalCost: number;
      successRate: number;
    }>
  > {
    const criteria: MetricsQueryCriteria = {
      aggregateBy: "agent",
      groupBy: [],
    };
    if (timeRange) {
      criteria.timeRange = timeRange;
    }

    const metrics = await this.storage.getMetrics(criteria);

    return metrics.breakdown
      .map((item) => ({
        agentName: item.group.agentName,
        totalRequests: item.metrics.requests,
        averageTokensPerSecond:
          item.metrics.averageResponseTime > 0
            ? item.metrics.tokenUsage.totalTokens /
              (item.metrics.averageResponseTime / 1000)
            : 0,
        totalCost: item.metrics.cost,
        successRate: item.metrics.successRate,
      }))
      .sort((a, b) => b.averageTokensPerSecond - a.averageTokensPerSecond)
      .slice(0, limit);
  }

  /**
   * Get most expensive actions
   */
  async getMostExpensiveActions(
    timeRange?: { start: number; end: number },
    limit = 10
  ): Promise<
    Array<{
      actionName: string;
      contextType: string;
      agentName: string;
      totalCost: number;
      totalCalls: number;
      averageCostPerCall: number;
      totalTokens: number;
    }>
  > {
    const criteria: MetricsQueryCriteria = {
      aggregateBy: "action",
    };
    if (timeRange) {
      criteria.timeRange = timeRange;
    }

    const metrics = await this.storage.getMetrics(criteria);

    return metrics.breakdown
      .map((item) => ({
        actionName: item.group.actionName,
        contextType: item.group.contextType,
        agentName: item.group.agentName,
        totalCost: item.metrics.cost,
        totalCalls: item.metrics.requests,
        averageCostPerCall:
          item.metrics.requests > 0
            ? item.metrics.cost / item.metrics.requests
            : 0,
        totalTokens: item.metrics.tokenUsage.totalTokens,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Get model usage statistics
   */
  async getModelUsageStats(timeRange?: { start: number; end: number }): Promise<
    Array<{
      modelId: string;
      provider: string;
      callType: string;
      totalCalls: number;
      totalTokens: number;
      totalCost: number;
      averageResponseTime: number;
      successRate: number;
    }>
  > {
    const criteria: MetricsQueryCriteria = {
      aggregateBy: "model",
    };
    if (timeRange) {
      criteria.timeRange = timeRange;
    }

    const metrics = await this.storage.getMetrics(criteria);

    return metrics.breakdown
      .map((item) => ({
        modelId: item.group.modelId,
        provider: item.group.provider,
        callType: item.group.callType,
        totalCalls: item.metrics.requests,
        totalTokens: item.metrics.tokenUsage.totalTokens,
        totalCost: item.metrics.cost,
        averageResponseTime: item.metrics.averageResponseTime,
        successRate: item.metrics.successRate,
      }))
      .sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(
    userId: string,
    timeRange?: { start: number; end: number }
  ): Promise<{
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    averageResponseTime: number;
    mostUsedAgent: string;
    requestsByDay: Array<{ date: string; requests: number; cost: number }>;
  }> {
    const queryOptions: RequestQueryCriteria = { userId };
    if (timeRange) {
      queryOptions.timeRange = timeRange;
    }

    const requests = await this.storage.queryRequests(queryOptions);
    const completedRequests = requests.filter((r) => r.status === "completed");

    const totalRequests = requests.length;
    const totalCost = requests.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalTokens = requests.reduce(
      (sum, r) => sum + (r.totalTokenUsage?.totalTokens || 0),
      0
    );

    const responseTimes = completedRequests
      .filter((r) => r.endTime)
      .map((r) => r.endTime! - r.startTime);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Find most used agent
    const agentCounts = new Map<string, number>();
    for (const request of requests) {
      for (const agentRun of request.agentRuns) {
        agentCounts.set(
          agentRun.agentName,
          (agentCounts.get(agentRun.agentName) || 0) + 1
        );
      }
    }
    const mostUsedAgent =
      Array.from(agentCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "none";

    // Group by day
    const dayBuckets = new Map<string, { requests: number; cost: number }>();
    for (const request of requests) {
      const date = new Date(request.startTime).toISOString().split("T")[0];
      if (!dayBuckets.has(date)) {
        dayBuckets.set(date, { requests: 0, cost: 0 });
      }
      const bucket = dayBuckets.get(date)!;
      bucket.requests += 1;
      bucket.cost += request.totalCost || 0;
    }

    const requestsByDay = Array.from(dayBuckets.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      totalCost,
      totalTokens,
      averageResponseTime,
      mostUsedAgent,
      requestsByDay,
    };
  }

  /**
   * Get performance bottlenecks
   */
  async getPerformanceBottlenecks(
    timeRange?: { start: number; end: number },
    limit = 10
  ): Promise<
    Array<{
      type: "agent" | "context" | "action";
      name: string;
      averageResponseTime: number;
      slowestResponseTime: number;
      totalCalls: number;
      failureRate: number;
    }>
  > {
    const requests = await this.storage.queryRequests({
      timeRange,
      status: ["completed", "failed"],
    });

    const bottlenecks = new Map<
      string,
      {
        type: "agent" | "context" | "action";
        name: string;
        responseTimes: number[];
        totalCalls: number;
        failures: number;
      }
    >();

    for (const request of requests) {
      const requestTime = request.endTime
        ? request.endTime - request.startTime
        : 0;

      for (const agentRun of request.agentRuns) {
        const agentKey = `agent:${agentRun.agentName}`;
        if (!bottlenecks.has(agentKey)) {
          bottlenecks.set(agentKey, {
            type: "agent",
            name: agentRun.agentName,
            responseTimes: [],
            totalCalls: 0,
            failures: 0,
          });
        }
        const agentStats = bottlenecks.get(agentKey)!;
        agentStats.totalCalls += 1;
        if (agentRun.endTime) {
          agentStats.responseTimes.push(agentRun.endTime - agentRun.startTime);
        }
        if (agentRun.status === "failed") {
          agentStats.failures += 1;
        }

        for (const context of agentRun.contexts) {
          const contextKey = `context:${context.type}`;
          if (!bottlenecks.has(contextKey)) {
            bottlenecks.set(contextKey, {
              type: "context",
              name: context.type,
              responseTimes: [],
              totalCalls: 0,
              failures: 0,
            });
          }
          const contextStats = bottlenecks.get(contextKey)!;
          contextStats.totalCalls += 1;

          for (const action of context.actionCalls) {
            const actionKey = `action:${action.actionName}`;
            if (!bottlenecks.has(actionKey)) {
              bottlenecks.set(actionKey, {
                type: "action",
                name: action.actionName,
                responseTimes: [],
                totalCalls: 0,
                failures: 0,
              });
            }
            const actionStats = bottlenecks.get(actionKey)!;
            actionStats.totalCalls += 1;
            if (action.endTime) {
              actionStats.responseTimes.push(action.endTime - action.startTime);
            }
            if (action.status === "failed") {
              actionStats.failures += 1;
            }
          }
        }
      }
    }

    return Array.from(bottlenecks.values())
      .map((stats) => ({
        type: stats.type,
        name: stats.name,
        averageResponseTime:
          stats.responseTimes.length > 0
            ? stats.responseTimes.reduce((sum, time) => sum + time, 0) /
              stats.responseTimes.length
            : 0,
        slowestResponseTime:
          stats.responseTimes.length > 0 ? Math.max(...stats.responseTimes) : 0,
        totalCalls: stats.totalCalls,
        failureRate:
          stats.totalCalls > 0 ? stats.failures / stats.totalCalls : 0,
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, limit);
  }

  private getBucketSize(granularity: "hour" | "day" | "week"): number {
    switch (granularity) {
      case "hour":
        return 60 * 60 * 1000;
      case "day":
        return 24 * 60 * 60 * 1000;
      case "week":
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  private aggregateTokenUsages(usages: TokenUsage[]): TokenUsage {
    if (usages.length === 0) {
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }

    return usages.reduce((total, usage) => ({
      inputTokens: total.inputTokens + usage.inputTokens,
      outputTokens: total.outputTokens + usage.outputTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
      reasoningTokens:
        (total.reasoningTokens || 0) + (usage.reasoningTokens || 0),
      estimatedCost: (total.estimatedCost || 0) + (usage.estimatedCost || 0),
    }));
  }
}

/**
 * Utility functions for request tracking analytics
 */
export const trackingAnalytics = {
  /**
   * Format cost in a human-readable way
   */
  formatCost(cost: number): string {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(3)}k`;
    }
    return `$${cost.toFixed(3)}`;
  },

  /**
   * Format token count in a human-readable way
   */
  formatTokens(tokens: number): string {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  },

  /**
   * Format duration in a human-readable way
   */
  formatDuration(ms: number): string {
    if (ms >= 60000) {
      return `${(ms / 60000).toFixed(1)}m`;
    }
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  },

  /**
   * Calculate cost efficiency (tokens per dollar)
   */
  calculateCostEfficiency(tokenUsage: TokenUsage): number {
    if (!tokenUsage.estimatedCost || tokenUsage.estimatedCost === 0) {
      return 0;
    }
    return tokenUsage.totalTokens / tokenUsage.estimatedCost;
  },

  /**
   * Calculate performance score (composite metric)
   */
  calculatePerformanceScore(
    averageResponseTime: number,
    successRate: number,
    costEfficiency: number
  ): number {
    // Normalize metrics to 0-1 scale and weight them
    const responseTimeScore = Math.max(0, 1 - averageResponseTime / 10000); // 10s = 0 score
    const successRateScore = successRate;
    const efficiencyScore = Math.min(1, costEfficiency / 1000); // 1000 tokens/$ = max score

    return (
      responseTimeScore * 0.4 + successRateScore * 0.4 + efficiencyScore * 0.2
    );
  },
};
