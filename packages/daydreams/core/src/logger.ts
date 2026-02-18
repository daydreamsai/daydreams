import { LogLevel } from "./types";

// --- Color Theme ---

export interface ColorTheme {
  // Primary colors
  orange: string;
  blue: string;
  darkBlue: string;
  cyan: string;

  // Status colors
  success: string;
  warning: string;
  error: string;

  // Text colors
  primary: string;
  secondary: string;
  muted: string;

  // Accents
  bright: string;
  dim: string;

  // Reset
  reset: string;
}

// Blade Runner 2049 inspired color theme
export const BladeRunnerTheme: ColorTheme = {
  // Signature orange from the film
  orange: "\x1b[38;2;255;165;0m", // Bright orange
  blue: "\x1b[38;2;0;191;255m", // Electric blue
  darkBlue: "\x1b[38;2;0;100;139m", // Dark teal blue
  cyan: "\x1b[38;2;0;255;255m", // Bright cyan

  // Status colors
  success: "\x1b[38;2;0;255;127m", // Neo green
  warning: "\x1b[38;2;255;165;0m", // Orange warning
  error: "\x1b[38;2;255;69;58m", // Red alert

  // Text hierarchy
  primary: "\x1b[38;2;255;255;255m", // Pure white
  secondary: "\x1b[38;2;176;196;222m", // Light steel blue
  muted: "\x1b[38;2;119;136;153m", // Slate gray

  // Accent elements
  bright: "\x1b[38;2;255;255;255;1m", // Bright white + bold
  dim: "\x1b[38;2;105;105;105m", // Dim gray

  // Control
  reset: "\x1b[0m",
};

// Easy theme customization - export for users to modify
export let currentTheme: ColorTheme = BladeRunnerTheme;

export function setLoggerTheme(theme: ColorTheme): void {
  currentTheme = theme;
}

// --- Core Types ---

export interface LogEntry {
  level: LogLevel;
  timestamp: number;
  context?: string;
  message: string;
  data?: any;
  eventType?: string;
}

export type EventType =
  | "AGENT_START"
  | "AGENT_COMPLETE"
  | "AGENT_ERROR"
  | "MODEL_CALL_START"
  | "MODEL_CALL_COMPLETE"
  | "MODEL_CALL_ERROR"
  | "ACTION_START"
  | "ACTION_COMPLETE"
  | "ACTION_ERROR"
  | "CONTEXT_CREATE"
  | "CONTEXT_ACTIVATE"
  | "CONTEXT_UPDATE"
  | "MEMORY_READ"
  | "MEMORY_WRITE"
  | "REQUEST_START"
  | "REQUEST_COMPLETE"
  | "REQUEST_ERROR";

export interface EventData {
  // Agent events
  agentName?: string;
  executionTime?: number;
  configuration?: Record<string, unknown>;

  // Model events
  provider?: string;
  modelId?: string;
  callType?: "generate" | "stream" | "embed" | "reasoning";
  tokens?: {
    input?: number;
    output?: number;
    reasoning?: number;
    total?: number;
  };
  cost?: number;
  duration?: number;

  // Action events
  actionName?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;

  // Context events
  contextType?: string;
  contextId?: string;
  memoryOperations?: number;
  updateType?: "memory" | "state" | "config";

  // Memory events
  keys?: string[];
  cacheHit?: boolean;
  size?: number;

  // Request events
  source?: string;
  userId?: string;
  sessionId?: string;

  // Error events
  error?: {
    message: string;
    code?: string;
    cause?: unknown;
    stack?: string;
  };

  // Status for start/complete/error events
  status?: "start" | "complete" | "error";

  // Generic additional data
  [key: string]: unknown;
}

// --- Transport System ---

export interface Transport {
  name: string;
  log(entry: LogEntry): void | Promise<void>;
  init?(): Promise<void> | void;
  close?(): Promise<void> | void;
}

export class ConsoleTransport implements Transport {
  name = "console";
  private styled: boolean = true;

  constructor(options: { styled?: boolean } = {}) {
    this.styled = options.styled ?? true;
  }

  log(entry: LogEntry): void {
    const formatted = this.format(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  private format(entry: LogEntry): string {
    if (!this.styled) {
      return this.formatPlain(entry);
    }

    const theme = currentTheme;
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const context = this.formatContext(entry.context, entry.eventType);
    const message = this.formatMessage(
      entry.message,
      entry.level,
      entry.eventType
    );

    let formatted = `${timestamp} ${level} ${context}${message}`;

    // Add structured data with syntax highlighting
    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = this.formatData(entry.data);
      formatted += `\n${dataStr}`;
    }

    return formatted + theme.reset;
  }

  private formatPlain(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    const context = entry.context ? `[${entry.context}]` : "";
    const message = entry.message;

    let formatted = `${timestamp} [${level}] ${context} ${message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = JSON.stringify(entry.data, null, 2);
      formatted += `\n${dataStr}`;
    }

    return formatted;
  }

  private formatTimestamp(timestamp: number): string {
    const theme = currentTheme;
    const date = new Date(timestamp);
    const timeStr = date.toISOString().replace("T", " ").slice(0, -1);
    return `${theme.dim}${timeStr}${theme.reset}`;
  }

  private formatLevel(level: LogLevel): string {
    const theme = currentTheme;
    const levelStr = LogLevel[level].padEnd(5);

    switch (level) {
      case LogLevel.ERROR:
        return `${theme.error}[${levelStr}]${theme.reset}`;
      case LogLevel.WARN:
        return `${theme.warning}[${levelStr}]${theme.reset}`;
      case LogLevel.INFO:
        return `${theme.blue}[${levelStr}]${theme.reset}`;
      case LogLevel.DEBUG:
        return `${theme.cyan}[${levelStr}]${theme.reset}`;
      case LogLevel.TRACE:
        return `${theme.muted}[${levelStr}]${theme.reset}`;
      default:
        return `${theme.secondary}[${levelStr}]${theme.reset}`;
    }
  }

  private formatContext(context?: string, eventType?: string): string {
    if (!context && !eventType) return "";

    const theme = currentTheme;

    if (eventType) {
      // Color contexts based on event type categories
      if (eventType.startsWith("AGENT_")) {
        return `${theme.orange}[${context || "agent"}]${theme.reset} `;
      } else if (eventType.startsWith("MODEL_")) {
        return `${theme.blue}[${context || "model"}]${theme.reset} `;
      } else if (eventType.startsWith("ACTION_")) {
        return `${theme.cyan}[${context || "action"}]${theme.reset} `;
      } else if (eventType.startsWith("CONTEXT_")) {
        return `${theme.darkBlue}[${context || "context"}]${theme.reset} `;
      } else if (eventType.startsWith("MEMORY_")) {
        return `${theme.success}[${context || "memory"}]${theme.reset} `;
      }
    }

    return context ? `${theme.secondary}[${context}]${theme.reset} ` : "";
  }

  private formatMessage(
    message: string,
    level: LogLevel,
    eventType?: string
  ): string {
    const theme = currentTheme;

    // Style message based on level and event type
    if (level === LogLevel.ERROR) {
      return `${theme.error}${message}${theme.reset}`;
    } else if (eventType) {
      if (eventType.endsWith("_START")) {
        return `${theme.cyan}▶ ${theme.primary}${message}${theme.reset}`;
      } else if (eventType.endsWith("_COMPLETE")) {
        return `${theme.success}✓ ${theme.primary}${message}${theme.reset}`;
      } else if (eventType.endsWith("_ERROR")) {
        return `${theme.error}✗ ${theme.primary}${message}${theme.reset}`;
      } else {
        return `${theme.orange}◆ ${theme.primary}${message}${theme.reset}`;
      }
    }

    return `${theme.primary}${message}${theme.reset}`;
  }

  private formatData(data: any, indent: number = 2): string {
    const theme = currentTheme;

    try {
      const jsonStr = JSON.stringify(data, null, indent);
      return this.syntaxHighlight(jsonStr);
    } catch (error) {
      return `${theme.muted}${String(data)}${theme.reset}`;
    }
  }

  private syntaxHighlight(json: string): string {
    const theme = currentTheme;

    return json
      .replace(/(".*?"):/g, `${theme.orange}$1${theme.reset}:`) // Keys in orange
      .split("\n")
      .map((line) => `${theme.dim}│${theme.reset} ${line}`) // Left border
      .join("\n");
  }
}

export class FileTransport implements Transport {
  name = "file";
  private writeStream?: any; // fs.WriteStream

  constructor(private filePath: string) {}

  async init(): Promise<void> {
    const fs = await import("fs");
    this.writeStream = fs.createWriteStream(this.filePath, { flags: "a" });
  }

  log(entry: LogEntry): void {
    if (!this.writeStream) {
      console.error("FileTransport not initialized");
      return;
    }

    const formatted = this.format(entry);
    this.writeStream.write(formatted + "\n");
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream.end(resolve);
      });
    }
  }

  private format(entry: LogEntry): string {
    // JSON format for file logging - easier to parse
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      context: entry.context,
      message: entry.message,
      eventType: entry.eventType,
      data: entry.data,
    });
  }
}

export class StreamTransport implements Transport {
  name = "stream";

  constructor(private stream: NodeJS.WritableStream) {}

  log(entry: LogEntry): void {
    const formatted = JSON.stringify(entry) + "\n";
    this.stream.write(formatted);
  }
}

export class HttpTransport implements Transport {
  name = "http";
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(
    private endpoint: string,
    private options: {
      batchSize?: number;
      flushInterval?: number;
      headers?: Record<string, string>;
    } = {}
  ) {
    this.options.batchSize = options.batchSize ?? 100;
    this.options.flushInterval = options.flushInterval ?? 5000;
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.options.batchSize!) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(
        () => this.flush(),
        this.options.flushInterval
      );
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.options.headers,
        },
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      console.error("HttpTransport flush failed:", error);
      // Could implement retry logic here
    }
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

// --- Logger Implementation ---

export class Logger {
  private transports: Transport[] = [];
  private level: LogLevel = LogLevel.INFO;
  private eventListeners: Map<
    EventType | "*",
    Array<(entry: LogEntry) => void>
  > = new Map();

  constructor(
    options: {
      level?: LogLevel;
      transports?: Transport[];
    } = {}
  ) {
    this.level = options.level ?? LogLevel.INFO;
    this.transports = options.transports ?? [new ConsoleTransport()];

    // Initialize transports
    this.init();
  }

  private async init(): Promise<void> {
    for (const transport of this.transports) {
      if (transport.init) {
        try {
          await transport.init();
        } catch (error) {
          console.error(
            `Failed to initialize transport ${transport.name}:`,
            error
          );
        }
      }
    }
  }

  // --- Configuration ---

  configure(options: { level?: LogLevel }): void {
    if (options.level !== undefined) {
      this.level = options.level;
    }
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
    if (transport.init) {
      const result = transport.init();
      if (result instanceof Promise) {
        result.catch((error: any) =>
          console.error(
            `Failed to initialize transport ${transport.name}:`,
            error
          )
        );
      }
    }
  }

  removeTransport(name: string): void {
    const index = this.transports.findIndex((t) => t.name === name);
    if (index >= 0) {
      const transport = this.transports[index];
      this.transports.splice(index, 1);

      if (transport.close) {
        const result = transport.close();
        if (result instanceof Promise) {
          result.catch((error: any) =>
            console.error(`Failed to close transport ${transport.name}:`, error)
          );
        }
      }
    }
  }

  // --- Simple Logging API ---

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  trace(message: string, context?: string, data?: any): void {
    this.log(LogLevel.TRACE, message, context, data);
  }

  // --- Backward Compatibility ---

  /**
   * Legacy structured logging method - now delegates to regular log
   * @deprecated Use event() for structured logging or regular log methods
   */
  structured(
    level: LogLevel,
    context: string,
    message: string,
    data?: any
  ): void {
    this.log(level, message, context, data);
  }

  // --- Event-Based Structured Logging ---

  event(type: EventType, data: EventData = {}): void {
    const level = this.getEventLevel(type);
    const message = this.formatEventMessage(type, data);
    const context = this.getEventContext(type);

    this.log(level, message, context, data, type);
  }

  // --- Event Streaming for External Consumption ---

  on(
    eventType: EventType | "*",
    listener: (entry: LogEntry) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  createStream(): ReadableStream<LogEntry> {
    let unsubscribeFn: (() => void) | undefined;

    return new ReadableStream({
      start: (controller) => {
        unsubscribeFn = this.on("*", (entry) => {
          controller.enqueue(entry);
        });
      },
      cancel: () => {
        if (unsubscribeFn) {
          unsubscribeFn();
        }
      },
    });
  }

  // --- Core Logging Implementation ---

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    eventType?: string
  ): void {
    if (level > this.level) return;

    const entry: LogEntry = {
      level,
      timestamp: Date.now(),
      context,
      message,
      data,
      eventType,
    };

    // Send to transports
    this.transports.forEach((transport) => {
      try {
        transport.log(entry);
      } catch (error) {
        console.error(`Transport ${transport.name} failed:`, error);
      }
    });

    // Emit to event listeners
    this.emitToListeners(entry);
  }

  private emitToListeners(entry: LogEntry): void {
    // Emit to specific event type listeners
    if (entry.eventType) {
      const listeners = this.eventListeners.get(entry.eventType as EventType);
      listeners?.forEach((listener) => {
        try {
          listener(entry);
        } catch (error) {
          console.error("Event listener error:", error);
        }
      });
    }

    // Emit to wildcard listeners
    const wildcardListeners = this.eventListeners.get("*");
    wildcardListeners?.forEach((listener) => {
      try {
        listener(entry);
      } catch (error) {
        console.error("Wildcard event listener error:", error);
      }
    });
  }

  private getEventLevel(type: EventType): LogLevel {
    if (type.endsWith("_ERROR")) return LogLevel.ERROR;
    if (type.endsWith("_START") || type.endsWith("_COMPLETE")) {
      if (type.startsWith("AGENT_") || type.startsWith("REQUEST_")) {
        return LogLevel.INFO;
      }
      return LogLevel.DEBUG;
    }
    return LogLevel.TRACE;
  }

  private formatEventMessage(type: EventType, data: EventData): string {
    switch (type) {
      case "AGENT_START":
        return `Starting agent: ${data.agentName || "unknown"}`;
      case "AGENT_COMPLETE":
        return `Agent completed: ${data.agentName || "unknown"} (${
          data.executionTime || 0
        }ms)`;
      case "AGENT_ERROR":
        return `Agent failed: ${data.agentName || "unknown"} - ${
          data.error?.message || "Unknown error"
        }`;

      case "MODEL_CALL_START":
        return `Model call started: ${data.provider}/${data.modelId} (${
          data.callType || "unknown"
        })`;
      case "MODEL_CALL_COMPLETE":
        const tokens = data.tokens
          ? `${data.tokens.input || 0}→${data.tokens.output || 0}`
          : "unknown tokens";
        return `Model call completed: ${data.provider}/${data.modelId} (${
          data.duration || 0
        }ms, ${tokens})`;
      case "MODEL_CALL_ERROR":
        return `Model call failed: ${data.provider}/${data.modelId} - ${
          data.error?.message || "Unknown error"
        }`;

      case "ACTION_START":
        return `Action started: ${data.actionName}`;
      case "ACTION_COMPLETE":
        return `Action completed: ${data.actionName} (${
          data.executionTime || 0
        }ms)`;
      case "ACTION_ERROR":
        return `Action failed: ${data.actionName} - ${
          data.error?.message || "Unknown error"
        }`;

      case "CONTEXT_CREATE":
        return `Context created: ${data.contextType}`;
      case "CONTEXT_ACTIVATE":
        return `Context activated: ${data.contextType}`;
      case "CONTEXT_UPDATE":
        return `Context updated: ${data.contextType} (${
          data.updateType || "unknown"
        })`;

      case "MEMORY_READ":
        return `Memory read: ${data.keys?.length || 0} keys (${
          data.cacheHit ? "hit" : "miss"
        })`;
      case "MEMORY_WRITE":
        return `Memory write: ${data.keys?.length || 0} keys`;

      case "REQUEST_START":
        return `Request started: ${data.source}`;
      case "REQUEST_COMPLETE":
        return `Request completed: ${data.source} (${
          data.executionTime || 0
        }ms)`;
      case "REQUEST_ERROR":
        return `Request failed: ${data.source} - ${
          data.error?.message || "Unknown error"
        }`;

      default:
        return `Event: ${type}`;
    }
  }

  private getEventContext(type: EventType): string {
    if (type.startsWith("AGENT_")) return "agent";
    if (type.startsWith("MODEL_")) return "model";
    if (type.startsWith("ACTION_")) return "action";
    if (type.startsWith("CONTEXT_")) return "context";
    if (type.startsWith("MEMORY_")) return "memory";
    if (type.startsWith("REQUEST_")) return "request";
    return "event";
  }

  // --- Cleanup ---

  async close(): Promise<void> {
    for (const transport of this.transports) {
      if (transport.close) {
        try {
          await transport.close();
        } catch (error) {
          console.error(`Failed to close transport ${transport.name}:`, error);
        }
      }
    }

    // Clear event listeners
    this.eventListeners.clear();
  }
}

// --- Additional Themes ---

export const ClassicTheme: ColorTheme = {
  orange: "\x1b[33m", // Yellow (classic)
  blue: "\x1b[34m", // Blue
  darkBlue: "\x1b[36m", // Cyan
  cyan: "\x1b[96m", // Bright cyan

  success: "\x1b[32m", // Green
  warning: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red

  primary: "\x1b[37m", // White
  secondary: "\x1b[90m", // Bright black
  muted: "\x1b[2m", // Dim

  bright: "\x1b[1m", // Bold
  dim: "\x1b[2m", // Dim

  reset: "\x1b[0m",
};

export const MonochromeTheme: ColorTheme = {
  orange: "\x1b[37m", // White
  blue: "\x1b[37m", // White
  darkBlue: "\x1b[90m", // Bright black
  cyan: "\x1b[37m", // White

  success: "\x1b[37m", // White
  warning: "\x1b[37m", // White
  error: "\x1b[37m", // White

  primary: "\x1b[37m", // White
  secondary: "\x1b[90m", // Bright black
  muted: "\x1b[2m", // Dim

  bright: "\x1b[1m", // Bold
  dim: "\x1b[2m", // Dim

  reset: "\x1b[0m",
};

// --- Convenience Factory Functions ---

export function createLogger(options?: {
  level?: LogLevel;
  style?: "console" | "file" | "json";
  theme?: ColorTheme | "bladerunner" | "classic" | "monochrome";
  styled?: boolean;
  filePath?: string;
  transports?: Transport[];
}): Logger {
  // Set theme if provided
  if (options?.theme) {
    if (typeof options.theme === "string") {
      switch (options.theme) {
        case "bladerunner":
          setLoggerTheme(BladeRunnerTheme);
          break;
        case "classic":
          setLoggerTheme(ClassicTheme);
          break;
        case "monochrome":
          setLoggerTheme(MonochromeTheme);
          break;
      }
    } else {
      setLoggerTheme(options.theme);
    }
  }

  let transports: Transport[];

  if (options?.transports) {
    transports = options.transports;
  } else {
    switch (options?.style) {
      case "file":
        if (!options.filePath) {
          throw new Error("filePath required for file transport");
        }
        transports = [new FileTransport(options.filePath)];
        break;
      case "json":
        transports = [new StreamTransport(process.stdout)];
        break;
      case "console":
      default:
        transports = [
          new ConsoleTransport({
            styled: options?.styled !== false,
          }),
        ];
        break;
    }
  }

  return new Logger({
    level: options?.level,
    transports,
  });
}

// --- Usage Examples ---

/*
// Simple usage with Blade Runner 2049 theme (default)
const logger = createLogger({ 
  level: LogLevel.DEBUG,
  theme: 'bladerunner'
});

logger.info("Agent starting", "agent:run", { contextId: "ctx-123" });
logger.error("Model call failed", "model:openai", { error: "Rate limited" });

// Custom theme colors (easy to tweak!)
const customTheme: ColorTheme = {
  ...BladeRunnerTheme,
  orange: '\x1b[38;2;255;100;50m',  // Custom orange-red
  blue: '\x1b[38;2;50;150;255m',    // Custom bright blue
  // ... modify any colors you want
};

const styledLogger = createLogger({ 
  theme: customTheme,
  level: LogLevel.DEBUG
});

// Different theme styles
const classicLogger = createLogger({ theme: 'classic' });
const monoLogger = createLogger({ theme: 'monochrome' });
const unstyledLogger = createLogger({ styled: false });

// Event-based structured logging with beautiful styling
logger.event("MODEL_CALL_START", {
  provider: "openai",
  modelId: "gpt-4",
  callType: "generate"
});

logger.event("MODEL_CALL_COMPLETE", {
  provider: "openai",
  modelId: "gpt-4", 
  callType: "generate",
  tokens: { input: 100, output: 50, total: 150 },
  duration: 1200,
  cost: 0.003
});

logger.event("AGENT_START", {
  agentName: "discord-bot",
  configuration: { maxSteps: 5, temperature: 0.7 }
});

// Multiple transports with styling
const logger = new Logger({
  transports: [
    new ConsoleTransport({ styled: true }),      // Styled console output
    new FileTransport('/var/log/agent.log'),    // Plain JSON for files
    new HttpTransport('https://logs.mycompany.com/ingest')
  ]
});

// Switch themes at runtime
setLoggerTheme(ClassicTheme);  // Switch to classic colors
logger.info("Now using classic theme");

setLoggerTheme(BladeRunnerTheme);  // Back to Blade Runner
logger.info("Back to cyberpunk styling");

// Event streaming and listeners work the same
const logStream = logger.createStream();
logger.on('MODEL_CALL_COMPLETE', (entry) => {
  console.log('Model call completed:', entry.data);
});

logger.on('*', (entry) => {
  if (entry.level === LogLevel.ERROR) {
    // Send alert to monitoring system
    alerting.send(entry);
  }
});

// Example output with Blade Runner theme:
// 2024-01-15 14:30:22.123 [INFO ] [agent] ▶ Starting agent: discord-bot
// │ {
// │   "agentName": "discord-bot",
// │   "configuration": {
// │     "maxSteps": 5,
// │     "temperature": 0.7
// │   }
// │ }
//
// 2024-01-15 14:30:22.456 [DEBUG] [model] ▶ Model call started: openai/gpt-4 (generate)
// 2024-01-15 14:30:23.789 [DEBUG] [model] ✓ Model call completed: openai/gpt-4 (1200ms, 100→50)
*/
