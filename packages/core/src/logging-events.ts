import { LogLevel } from "./types";
import type { StructuredLogData } from "./logger";
import { Logger } from "./logger";
import type { RequestContext, TokenUsage, ModelCallMetrics } from "./tracking";
import { getCorrelationIds } from "./tracking";

/**
 * Semantic log event types for agent execution
 */
export enum LogEventType {
  AGENT_START = "AGENT_START",
  AGENT_COMPLETE = "AGENT_COMPLETE", 
  AGENT_ERROR = "AGENT_ERROR",
  
  CONTEXT_CREATE = "CONTEXT_CREATE",
  CONTEXT_ACTIVATE = "CONTEXT_ACTIVATE",
  CONTEXT_UPDATE = "CONTEXT_UPDATE",
  
  ACTION_START = "ACTION_START",
  ACTION_COMPLETE = "ACTION_COMPLETE",
  ACTION_ERROR = "ACTION_ERROR",
  
  MODEL_CALL_START = "MODEL_CALL_START",
  MODEL_CALL_COMPLETE = "MODEL_CALL_COMPLETE",
  MODEL_CALL_ERROR = "MODEL_CALL_ERROR",
  
  MEMORY_READ = "MEMORY_READ",
  MEMORY_WRITE = "MEMORY_WRITE",
  
  REQUEST_START = "REQUEST_START",
  REQUEST_COMPLETE = "REQUEST_COMPLETE",
  REQUEST_ERROR = "REQUEST_ERROR",
}

/**
 * Base interface for all structured log events
 */
export interface BaseLogEvent {
  eventType: LogEventType;
  timestamp: number;
  requestContext: RequestContext;
}

/**
 * Agent lifecycle events
 */
export interface AgentStartEvent extends BaseLogEvent {
  eventType: LogEventType.AGENT_START;
  agentName: string;
  configuration?: Record<string, unknown>;
}

export interface AgentCompleteEvent extends BaseLogEvent {
  eventType: LogEventType.AGENT_COMPLETE;
  agentName: string;
  executionTime: number;
  totalTokenUsage?: TokenUsage;
  totalCost?: number;
}

export interface AgentErrorEvent extends BaseLogEvent {
  eventType: LogEventType.AGENT_ERROR;
  agentName: string;
  error: {
    message: string;
    code?: string;
    cause?: unknown;
  };
}

/**
 * Context lifecycle events
 */
export interface ContextCreateEvent extends BaseLogEvent {
  eventType: LogEventType.CONTEXT_CREATE;
  contextType: string;
  contextId: string;
  argsHash?: string;
}

export interface ContextActivateEvent extends BaseLogEvent {
  eventType: LogEventType.CONTEXT_ACTIVATE;
  contextType: string;
  contextId: string;
  memoryOperations: number;
}

export interface ContextUpdateEvent extends BaseLogEvent {
  eventType: LogEventType.CONTEXT_UPDATE;
  contextType: string;
  contextId: string;
  updateType: "memory" | "state" | "config";
  details?: Record<string, unknown>;
}

/**
 * Action execution events
 */
export interface ActionStartEvent extends BaseLogEvent {
  eventType: LogEventType.ACTION_START;
  actionName: string;
  parameters?: Record<string, unknown>;
}

export interface ActionCompleteEvent extends BaseLogEvent {
  eventType: LogEventType.ACTION_COMPLETE;
  actionName: string;
  executionTime: number;
  tokenUsage?: TokenUsage;
  cost?: number;
  result?: unknown;
}

export interface ActionErrorEvent extends BaseLogEvent {
  eventType: LogEventType.ACTION_ERROR;
  actionName: string;
  error: {
    message: string;
    code?: string;
    cause?: unknown;
  };
}

/**
 * Model call events
 */
export interface ModelCallStartEvent extends BaseLogEvent {
  eventType: LogEventType.MODEL_CALL_START;
  provider: string;
  modelId: string;
  callType: "generate" | "stream" | "embed" | "reasoning";
  inputTokens?: number;
}

export interface ModelCallCompleteEvent extends BaseLogEvent {
  eventType: LogEventType.MODEL_CALL_COMPLETE;
  provider: string;
  modelId: string;
  callType: "generate" | "stream" | "embed" | "reasoning";
  tokenUsage: TokenUsage;
  metrics: ModelCallMetrics;
  cost?: number;
}

export interface ModelCallErrorEvent extends BaseLogEvent {
  eventType: LogEventType.MODEL_CALL_ERROR;
  provider: string;
  modelId: string;
  callType: "generate" | "stream" | "embed" | "reasoning";
  error: {
    message: string;
    code?: string;
    cause?: unknown;
  };
}

/**
 * Memory operation events
 */
export interface MemoryReadEvent extends BaseLogEvent {
  eventType: LogEventType.MEMORY_READ;
  keys: string[];
  cacheHit: boolean;
}

export interface MemoryWriteEvent extends BaseLogEvent {
  eventType: LogEventType.MEMORY_WRITE;
  keys: string[];
  size?: number;
}

/**
 * Request lifecycle events
 */
export interface RequestStartEvent extends BaseLogEvent {
  eventType: LogEventType.REQUEST_START;
  source: string;
  userId?: string;
  sessionId?: string;
}

export interface RequestCompleteEvent extends BaseLogEvent {
  eventType: LogEventType.REQUEST_COMPLETE;
  source: string;
  executionTime: number;
  totalTokenUsage?: TokenUsage;
  totalCost?: number;
}

export interface RequestErrorEvent extends BaseLogEvent {
  eventType: LogEventType.REQUEST_ERROR;
  source: string;
  error: {
    message: string;
    code?: string;
    cause?: unknown;
  };
}

/**
 * Union type for all log events
 */
export type LogEvent = 
  | AgentStartEvent
  | AgentCompleteEvent
  | AgentErrorEvent
  | ContextCreateEvent
  | ContextActivateEvent
  | ContextUpdateEvent
  | ActionStartEvent
  | ActionCompleteEvent
  | ActionErrorEvent
  | ModelCallStartEvent
  | ModelCallCompleteEvent
  | ModelCallErrorEvent
  | MemoryReadEvent
  | MemoryWriteEvent
  | RequestStartEvent
  | RequestCompleteEvent
  | RequestErrorEvent;

/**
 * Utility class for logging structured events
 */
export class StructuredLogger {
  constructor(private logger: Logger) {}

  /**
   * Log a structured event with appropriate level and formatting
   */
  logEvent(event: LogEvent): void {
    const level = this.getLogLevel(event.eventType);
    const message = this.formatEventMessage(event);
    const data = this.formatEventData(event);

    this.logger.structured(level, "agent", message, data);
  }

  private getLogLevel(eventType: LogEventType): LogLevel {
    switch (eventType) {
      case LogEventType.AGENT_ERROR:
      case LogEventType.ACTION_ERROR:
      case LogEventType.MODEL_CALL_ERROR:
      case LogEventType.REQUEST_ERROR:
        return LogLevel.ERROR;
      
      case LogEventType.AGENT_START:
      case LogEventType.AGENT_COMPLETE:
      case LogEventType.REQUEST_START:
      case LogEventType.REQUEST_COMPLETE:
        return LogLevel.INFO;
      
      case LogEventType.ACTION_START:
      case LogEventType.ACTION_COMPLETE:
      case LogEventType.MODEL_CALL_START:
      case LogEventType.MODEL_CALL_COMPLETE:
        return LogLevel.DEBUG;
      
      default:
        return LogLevel.TRACE;
    }
  }

  private formatEventMessage(event: LogEvent): string {
    switch (event.eventType) {
      case LogEventType.AGENT_START:
        return `Starting agent: ${(event as AgentStartEvent).agentName}`;
      case LogEventType.AGENT_COMPLETE:
        const agentComplete = event as AgentCompleteEvent;
        return `Agent completed: ${agentComplete.agentName} (${agentComplete.executionTime}ms)`;
      case LogEventType.AGENT_ERROR:
        return `Agent failed: ${(event as AgentErrorEvent).agentName}`;
      
      case LogEventType.ACTION_START:
        return `Starting action: ${(event as ActionStartEvent).actionName}`;
      case LogEventType.ACTION_COMPLETE:
        const actionComplete = event as ActionCompleteEvent;
        return `Action completed: ${actionComplete.actionName} (${actionComplete.executionTime}ms)`;
      case LogEventType.ACTION_ERROR:
        return `Action failed: ${(event as ActionErrorEvent).actionName}`;
      
      case LogEventType.MODEL_CALL_START:
        const modelStart = event as ModelCallStartEvent;
        return `Model call started: ${modelStart.provider}/${modelStart.modelId} (${modelStart.callType})`;
      case LogEventType.MODEL_CALL_COMPLETE:
        const modelComplete = event as ModelCallCompleteEvent;
        return `Model call completed: ${modelComplete.provider}/${modelComplete.modelId} (${modelComplete.metrics.totalTime}ms)`;
      case LogEventType.MODEL_CALL_ERROR:
        const modelError = event as ModelCallErrorEvent;
        return `Model call failed: ${modelError.provider}/${modelError.modelId}`;
      
      case LogEventType.CONTEXT_CREATE:
        const contextCreate = event as ContextCreateEvent;
        return `Context created: ${contextCreate.contextType}`;
      case LogEventType.CONTEXT_ACTIVATE:
        const contextActivate = event as ContextActivateEvent;
        return `Context activated: ${contextActivate.contextType}`;
      
      case LogEventType.MEMORY_READ:
        const memoryRead = event as MemoryReadEvent;
        return `Memory read: ${memoryRead.keys.length} keys (${memoryRead.cacheHit ? 'hit' : 'miss'})`;
      case LogEventType.MEMORY_WRITE:
        const memoryWrite = event as MemoryWriteEvent;
        return `Memory write: ${memoryWrite.keys.length} keys`;
      
      case LogEventType.REQUEST_START:
        return `Request started: ${(event as RequestStartEvent).source}`;
      case LogEventType.REQUEST_COMPLETE:
        const requestComplete = event as RequestCompleteEvent;
        return `Request completed: ${requestComplete.source} (${requestComplete.executionTime}ms)`;
      case LogEventType.REQUEST_ERROR:
        return `Request failed: ${(event as RequestErrorEvent).source}`;
      
      default:
        return `Event: ${event.eventType}`;
    }
  }

  private formatEventData(event: LogEvent): StructuredLogData {
    const baseData: StructuredLogData = {
      correlationIds: getCorrelationIds(event.requestContext),
    };

    switch (event.eventType) {
      case LogEventType.AGENT_COMPLETE:
        const agentComplete = event as AgentCompleteEvent;
        return {
          ...baseData,
          tokenUsage: agentComplete.totalTokenUsage,
          cost: agentComplete.totalCost,
          executionTime: agentComplete.executionTime,
        };
      
      case LogEventType.ACTION_COMPLETE:
        const actionComplete = event as ActionCompleteEvent;
        return {
          ...baseData,
          actionInfo: {
            actionName: actionComplete.actionName,
            status: "complete",
          },
          tokenUsage: actionComplete.tokenUsage,
          executionTime: actionComplete.executionTime,
        };
      
      case LogEventType.MODEL_CALL_COMPLETE:
        const modelComplete = event as ModelCallCompleteEvent;
        return {
          ...baseData,
          modelInfo: {
            provider: modelComplete.provider,
            modelId: modelComplete.modelId,
          },
          tokenUsage: modelComplete.tokenUsage,
          metrics: modelComplete.metrics,
        };
      
      case LogEventType.AGENT_ERROR:
        return {
          ...baseData,
          error: (event as AgentErrorEvent).error,
        };
      case LogEventType.ACTION_ERROR:
        return {
          ...baseData,
          error: (event as ActionErrorEvent).error,
        };
      case LogEventType.MODEL_CALL_ERROR:
        return {
          ...baseData,
          error: (event as ModelCallErrorEvent).error,
        };
      case LogEventType.REQUEST_ERROR:
        return {
          ...baseData,
          error: (event as RequestErrorEvent).error,
        };
      
      default:
        return baseData;
    }
  }
}