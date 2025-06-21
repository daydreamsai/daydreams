import type {
  RequestTracking,
  ModelCall,
  RequestTrackingStorage,
  RequestQueryCriteria,
  MetricsQueryCriteria,
  AggregatedMetrics,
  TokenUsage,
} from "../tracking";
import { aggregateTokenUsage } from "../tracking";
import type { Logger } from "../logger";

/**
 * In-memory storage implementation for request tracking
 * Suitable for development and testing
 */
export class InMemoryRequestTrackingStorage implements RequestTrackingStorage {
  private requests = new Map<string, RequestTracking>();
  private modelCalls = new Map<string, ModelCall>();
  private logger?: Logger;
  private enableLogging: boolean;

  constructor(logger?: Logger, enableLogging: boolean = false) {
    this.logger = logger;
    this.enableLogging = enableLogging;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (this.enableLogging && this.logger) {
      this.logger[level]('InMemoryRequestTrackingStorage', message, data);
    }
  }

  async storeRequest(request: RequestTracking): Promise<void> {
    try {
      if (!request || !request.id) {
        throw new Error('Invalid request: missing id');
      }
      
      if (typeof request.id !== 'string' || request.id.trim() === '') {
        throw new Error('Invalid request: id must be a non-empty string');
      }
      
      this.requests.set(request.id, { ...request });
      this.log('debug', `Stored request: ${request.id}`, { requestId: request.id, source: request.source });
    } catch (error) {
      const errorMessage = `Failed to store request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { requestId: request?.id, error });
      throw new Error(errorMessage);
    }
  }

  async getRequest(requestId: string): Promise<RequestTracking | null> {
    try {
      if (!requestId || typeof requestId !== 'string' || requestId.trim() === '') {
        throw new Error('Invalid requestId: must be a non-empty string');
      }
      
      const result = this.requests.get(requestId) || null;
      this.log('debug', `Retrieved request: ${requestId}`, { requestId, found: !!result });
      return result;
    } catch (error) {
      const errorMessage = `Failed to get request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { requestId, error });
      throw new Error(errorMessage);
    }
  }

  async storeModelCall(modelCall: ModelCall): Promise<void> {
    try {
      if (!modelCall || !modelCall.id) {
        throw new Error('Invalid model call: missing id');
      }
      
      if (typeof modelCall.id !== 'string' || modelCall.id.trim() === '') {
        throw new Error('Invalid model call: id must be a non-empty string');
      }
      
      this.modelCalls.set(modelCall.id, { ...modelCall });
      this.log('debug', `Stored model call: ${modelCall.id}`, { 
        modelCallId: modelCall.id, 
        callType: modelCall.callType,
        modelId: modelCall.metrics?.modelId 
      });
    } catch (error) {
      const errorMessage = `Failed to store model call: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { modelCallId: modelCall?.id, error });
      throw new Error(errorMessage);
    }
  }

  async queryRequests(criteria: RequestQueryCriteria): Promise<RequestTracking[]> {
    try {
      if (!criteria || typeof criteria !== 'object') {
        throw new Error('Invalid criteria: must be an object');
      }
      
      this.log('debug', 'Querying requests', { criteria });
      let results = Array.from(this.requests.values());

      // Apply filters with validation
      if (criteria.userId) {
        if (typeof criteria.userId !== 'string') {
          throw new Error('Invalid criteria: userId must be a string');
        }
        results = results.filter(r => r.userId === criteria.userId);
      }

      if (criteria.sessionId) {
        if (typeof criteria.sessionId !== 'string') {
          throw new Error('Invalid criteria: sessionId must be a string');
        }
        results = results.filter(r => r.sessionId === criteria.sessionId);
      }

      if (criteria.agentName) {
        if (typeof criteria.agentName !== 'string') {
          throw new Error('Invalid criteria: agentName must be a string');
        }
        results = results.filter(r => 
          r.agentRuns && r.agentRuns.some(run => run.agentName === criteria.agentName)
        );
      }

      if (criteria.timeRange) {
        if (!criteria.timeRange.start || !criteria.timeRange.end) {
          throw new Error('Invalid criteria: timeRange must have start and end');
        }
        if (typeof criteria.timeRange.start !== 'number' || typeof criteria.timeRange.end !== 'number') {
          throw new Error('Invalid criteria: timeRange start and end must be numbers');
        }
        if (criteria.timeRange.start > criteria.timeRange.end) {
          throw new Error('Invalid criteria: timeRange start must be before end');
        }
        results = results.filter(r => 
          r.startTime >= criteria.timeRange!.start && 
          r.startTime <= criteria.timeRange!.end
        );
      }

      if (criteria.status) {
        if (!Array.isArray(criteria.status)) {
          throw new Error('Invalid criteria: status must be an array');
        }
        results = results.filter(r => criteria.status!.includes(r.status));
      }

      // Sort by start time (newest first)
      results.sort((a, b) => b.startTime - a.startTime);

      // Apply pagination with validation
      if (criteria.offset !== undefined) {
        if (typeof criteria.offset !== 'number' || criteria.offset < 0) {
          throw new Error('Invalid criteria: offset must be a non-negative number');
        }
        results = results.slice(criteria.offset);
      }
      if (criteria.limit !== undefined) {
        if (typeof criteria.limit !== 'number' || criteria.limit < 0) {
          throw new Error('Invalid criteria: limit must be a non-negative number');
        }
        results = results.slice(0, criteria.limit);
      }

      this.log('debug', `Query completed: found ${results.length} requests`);
      return results;
    } catch (error) {
      const errorMessage = `Failed to query requests: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { criteria, error });
      throw new Error(errorMessage);
    }
  }

  async getMetrics(criteria: MetricsQueryCriteria): Promise<AggregatedMetrics> {
    try {
      if (!criteria || typeof criteria !== 'object') {
        throw new Error('Invalid criteria: must be an object');
      }
      
      this.log('debug', 'Computing metrics', { criteria });
      let requests = Array.from(this.requests.values());

      // Apply time range filter with validation
      if (criteria.timeRange) {
        if (!criteria.timeRange.start || !criteria.timeRange.end) {
          throw new Error('Invalid criteria: timeRange must have start and end');
        }
        if (typeof criteria.timeRange.start !== 'number' || typeof criteria.timeRange.end !== 'number') {
          throw new Error('Invalid criteria: timeRange start and end must be numbers');
        }
        if (criteria.timeRange.start > criteria.timeRange.end) {
          throw new Error('Invalid criteria: timeRange start must be before end');
        }
        requests = requests.filter(r => 
          r.startTime >= criteria.timeRange!.start && 
          r.startTime <= criteria.timeRange!.end
        );
      }

      // Apply user filter with validation
      if (criteria.userId) {
        if (typeof criteria.userId !== 'string') {
          throw new Error('Invalid criteria: userId must be a string');
        }
        requests = requests.filter(r => r.userId === criteria.userId);
      }

      // Apply agent filter with validation
      if (criteria.agentName) {
        if (typeof criteria.agentName !== 'string') {
          throw new Error('Invalid criteria: agentName must be a string');
        }
        requests = requests.filter(r => 
          r.agentRuns && r.agentRuns.some(run => run.agentName === criteria.agentName)
        );
      }

      // Calculate overall metrics
      const totalRequests = requests.length;
      const completedRequests = requests.filter(r => r.status === "completed");
      const successRate = totalRequests > 0 ? completedRequests.length / totalRequests : 0;

      const allTokenUsages = requests
        .map(r => r.totalTokenUsage)
        .filter((usage): usage is TokenUsage => usage !== undefined);
      
      const totalTokenUsage = allTokenUsages.length > 0 
        ? aggregateTokenUsage(allTokenUsages)
        : { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

      const totalCost = requests.reduce((sum, r) => {
        const cost = r.totalCost || 0;
        return sum + (typeof cost === 'number' && !isNaN(cost) ? cost : 0);
      }, 0);

      const responseTimes = completedRequests
        .filter(r => r.endTime && typeof r.endTime === 'number')
        .map(r => r.endTime! - r.startTime)
        .filter(time => typeof time === 'number' && !isNaN(time) && time >= 0);
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Generate breakdown based on aggregateBy
      const breakdown = this.generateBreakdown(requests, criteria);

      const result = {
        totalRequests,
        totalTokenUsage,
        totalCost,
        averageResponseTime,
        successRate,
        breakdown,
      };

      this.log('debug', `Metrics computed: ${totalRequests} requests, ${completedRequests.length} completed`);
      return result;
    } catch (error) {
      const errorMessage = `Failed to get metrics: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { criteria, error });
      throw new Error(errorMessage);
    }
  }

  private generateBreakdown(
    requests: RequestTracking[],
    criteria: MetricsQueryCriteria
  ): AggregatedMetrics["breakdown"] {
    try {
      const groups = new Map<string, RequestTracking[]>();

      for (const request of requests) {
        try {
          const groupKeys = this.getGroupKeys(request, criteria);
          
          for (const groupKey of groupKeys) {
            if (!groups.has(groupKey)) {
              groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(request);
          }
        } catch (error) {
          // Skip invalid requests but don't fail the entire operation
          this.log('warn', 'Skipping invalid request in breakdown', { requestId: request?.id, error });
          continue;
        }
      }

      return Array.from(groups.entries()).map(([groupKey, groupRequests]) => {
        try {
          const groupData = JSON.parse(groupKey);
          const completedRequests = groupRequests.filter(r => r.status === "completed");
          
          const groupTokenUsages = groupRequests
            .map(r => r.totalTokenUsage)
            .filter((usage): usage is TokenUsage => usage !== undefined);
          
          const groupTokenUsage = groupTokenUsages.length > 0
            ? aggregateTokenUsage(groupTokenUsages)
            : { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

          const groupCost = groupRequests.reduce((sum, r) => {
            const cost = r.totalCost || 0;
            return sum + (typeof cost === 'number' && !isNaN(cost) ? cost : 0);
          }, 0);
          
          const groupResponseTimes = completedRequests
            .filter(r => r.endTime && typeof r.endTime === 'number')
            .map(r => r.endTime! - r.startTime)
            .filter(time => typeof time === 'number' && !isNaN(time) && time >= 0);
          const groupAverageResponseTime = groupResponseTimes.length > 0
            ? groupResponseTimes.reduce((sum, time) => sum + time, 0) / groupResponseTimes.length
            : 0;

          const groupSuccessRate = groupRequests.length > 0
            ? completedRequests.length / groupRequests.length
            : 0;

          return {
            group: groupData,
            metrics: {
              requests: groupRequests.length,
              tokenUsage: groupTokenUsage,
              cost: groupCost,
              averageResponseTime: groupAverageResponseTime,
              successRate: groupSuccessRate,
            },
          };
        } catch (error) {
          // Return a safe fallback for invalid groups
          this.log('warn', 'Invalid group data in breakdown', { groupKey, error });
          return {
            group: { error: 'Invalid group data' },
            metrics: {
              requests: 0,
              tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
              cost: 0,
              averageResponseTime: 0,
              successRate: 0,
            },
          };
        }
      });
    } catch (error) {
      // Return empty breakdown if entire operation fails
      this.log('error', 'Failed to generate breakdown', { error });
      return [];
    }
  }

  private getGroupKeys(request: RequestTracking, criteria: MetricsQueryCriteria): string[] {
    try {
      if (!request || !request.id) {
        throw new Error('Invalid request: missing id');
      }
      
      if (!criteria || !criteria.aggregateBy) {
        return [JSON.stringify({ requestId: request.id })];
      }
      
      const keys: string[] = [];

      switch (criteria.aggregateBy) {
        case "request":
          keys.push(JSON.stringify({ requestId: request.id }));
          break;
        
        case "agent":
          if (request.agentRuns && Array.isArray(request.agentRuns)) {
            for (const agentRun of request.agentRuns) {
              if (agentRun && agentRun.agentName) {
                const group: Record<string, string> = { agentName: agentRun.agentName };
                if (criteria.groupBy && Array.isArray(criteria.groupBy)) {
                  for (const groupField of criteria.groupBy) {
                    if (groupField === "userId" && request.userId) {
                      group.userId = request.userId;
                    }
                    if (groupField === "sessionId" && request.sessionId) {
                      group.sessionId = request.sessionId;
                    }
                  }
                }
                keys.push(JSON.stringify(group));
              }
            }
          }
          break;
        
        case "context":
          if (request.agentRuns && Array.isArray(request.agentRuns)) {
            for (const agentRun of request.agentRuns) {
              if (agentRun && agentRun.contexts && Array.isArray(agentRun.contexts)) {
                for (const context of agentRun.contexts) {
                  if (context && context.type && agentRun.agentName) {
                    const group: Record<string, string> = { 
                      contextType: context.type,
                      agentName: agentRun.agentName,
                    };
                    if (criteria.groupBy && Array.isArray(criteria.groupBy)) {
                      for (const groupField of criteria.groupBy) {
                        if (groupField === "userId" && request.userId) {
                          group.userId = request.userId;
                        }
                      }
                    }
                    keys.push(JSON.stringify(group));
                  }
                }
              }
            }
          }
          break;
        
        case "action":
          if (request.agentRuns && Array.isArray(request.agentRuns)) {
            for (const agentRun of request.agentRuns) {
              if (agentRun && agentRun.contexts && Array.isArray(agentRun.contexts)) {
                for (const context of agentRun.contexts) {
                  if (context && context.actionCalls && Array.isArray(context.actionCalls)) {
                    for (const action of context.actionCalls) {
                      if (action && action.actionName && context.type && agentRun.agentName) {
                        const group: Record<string, string> = {
                          actionName: action.actionName,
                          contextType: context.type,
                          agentName: agentRun.agentName,
                        };
                        keys.push(JSON.stringify(group));
                      }
                    }
                  }
                }
              }
            }
          }
          break;
        
        case "model":
          if (request.agentRuns && Array.isArray(request.agentRuns)) {
            for (const agentRun of request.agentRuns) {
              if (agentRun && agentRun.contexts && Array.isArray(agentRun.contexts)) {
                for (const context of agentRun.contexts) {
                  if (context && context.actionCalls && Array.isArray(context.actionCalls)) {
                    for (const action of context.actionCalls) {
                      if (action && action.modelCalls && Array.isArray(action.modelCalls)) {
                        for (const modelCall of action.modelCalls) {
                          if (modelCall && modelCall.callType) {
                            const group: Record<string, string> = {
                              modelId: modelCall.metrics?.modelId || "unknown",
                              provider: modelCall.metrics?.provider || "unknown",
                              callType: modelCall.callType,
                            };
                            keys.push(JSON.stringify(group));
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          break;
        
        default:
          // Fallback to request grouping for unknown aggregateBy values
          keys.push(JSON.stringify({ requestId: request.id }));
          break;
      }

      return keys.length > 0 ? keys : [JSON.stringify({ requestId: request.id })];
    } catch (error) {
      // Fallback to basic request grouping if anything fails
      return [JSON.stringify({ requestId: request.id || 'unknown' })];
    }
  }

  /**
   * Clear all stored data (useful for testing)
   */
  async clear(): Promise<void> {
    try {
      this.requests.clear();
      this.modelCalls.clear();
      this.log('debug', 'Storage cleared');
    } catch (error) {
      const errorMessage = `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { error });
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all stored requests (useful for testing)
   */
  async getAllRequests(): Promise<RequestTracking[]> {
    try {
      const result = Array.from(this.requests.values());
      this.log('debug', `Retrieved all requests: ${result.length} total`);
      return result;
    } catch (error) {
      const errorMessage = `Failed to get all requests: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { error });
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all stored model calls (useful for testing)
   */
  async getAllModelCalls(): Promise<ModelCall[]> {
    try {
      const result = Array.from(this.modelCalls.values());
      this.log('debug', `Retrieved all model calls: ${result.length} total`);
      return result;
    } catch (error) {
      const errorMessage = `Failed to get all model calls: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { error });
      throw new Error(errorMessage);
    }
  }
}

/**
 * No-op storage implementation for when tracking is disabled
 */
export class NoOpRequestTrackingStorage implements RequestTrackingStorage {
  async storeRequest(_request: RequestTracking): Promise<void> {
    // No-op
  }

  async getRequest(_requestId: string): Promise<RequestTracking | null> {
    return null;
  }

  async storeModelCall(_modelCall: ModelCall): Promise<void> {
    // No-op
  }

  async queryRequests(_criteria: RequestQueryCriteria): Promise<RequestTracking[]> {
    return [];
  }

  async getMetrics(_criteria: MetricsQueryCriteria): Promise<AggregatedMetrics> {
    return {
      totalRequests: 0,
      totalTokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      breakdown: [],
    };
  }
}