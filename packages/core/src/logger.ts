import { LogLevel } from "./types"; // Assuming LogLevel is defined elsewhere
import type { CorrelationIds, TokenUsage, ModelCallMetrics } from "./tracking";
import { formatCorrelationIds as formatCorrelationIdsUtil } from "./tracking";

// --- Interfaces ---

export interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  context: string;
  message: string;
  data?: any;
  correlationIds?: CorrelationIds;
}

export interface StructuredLogData {
  correlationIds?: CorrelationIds;
  tokenUsage?: TokenUsage;
  metrics?: ModelCallMetrics;
  modelInfo?: {
    provider: string;
    modelId: string;
  };
  actionInfo?: {
    actionName: string;
    status: "start" | "complete" | "error";
  };
  contextInfo?: {
    contextType: string;
    memoryOperations?: number;
  };
  error?: {
    message: string;
    code?: string;
    cause?: unknown;
  };
  [key: string]: unknown;
}

export interface LogFormatter {
  format(entry: LogEntry): string;
}

export interface Transport {
  log(formattedMessage: string, entry: LogEntry): void;
  init?(): Promise<void> | void; // Optional initialization (e.g., open file stream)
  close?(): Promise<void> | void; // Optional cleanup
}

export interface LoggerConfig {
  level: LogLevel;
  transports: Transport[];
  formatter: LogFormatter;
}

// --- Default Implementations ---

export class DefaultFormatter implements LogFormatter {
  private enableTimestamp: boolean;

  constructor(options: { enableTimestamp?: boolean } = {}) {
    this.enableTimestamp = options.enableTimestamp ?? true;
  }

  format(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    parts.push(`[${LogLevel[entry.level]}]`);
    
    if (entry.correlationIds) {
      parts.push(`[${formatCorrelationIdsUtil(entry.correlationIds)}]`);
    }
    
    parts.push(`[${entry.context}]`);
    parts.push(entry.message);

    return parts.join(" ");
  }
}

export class EnhancedFormatter implements LogFormatter {
  private enableTimestamp: boolean;
  private enableColors: boolean;
  private enableStructuredData: boolean;
  private compactMode: boolean;

  constructor(options: { 
    enableTimestamp?: boolean; 
    enableColors?: boolean;
    enableStructuredData?: boolean;
    compactMode?: boolean;
  } = {}) {
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.enableColors = options.enableColors ?? true;
    this.enableStructuredData = options.enableStructuredData ?? true;
    this.compactMode = options.compactMode ?? false;
  }

  format(entry: LogEntry): string {
    const { level, timestamp, context, message, correlationIds, data } = entry;
    const style = logLevelStyles[level];
    const lines: string[] = [];
    
    // Main log line
    const mainParts: string[] = [];
    
    // Timestamp
    if (this.enableTimestamp) {
      if (this.enableColors) {
        mainParts.push(formatTimestamp(timestamp));
      } else {
        mainParts.push(`[${timestamp.toLocaleTimeString()}]`);
      }
    }
    
    // Level badge/icon
    if (this.enableColors) {
      if (this.compactMode) {
        mainParts.push(colorize(style.icon, style.color));
      } else {
        mainParts.push(style.badge);
      }
    } else {
      mainParts.push(`[${LogLevel[level].padEnd(5)}]`);
    }
    
    // Correlation IDs
    if (correlationIds) {
      if (this.enableColors) {
        mainParts.push(`[${formatCorrelationIds(correlationIds)}]`);
      } else {
        mainParts.push(`[${formatCorrelationIdsUtil(correlationIds)}]`);
      }
    }
    
    // Context
    if (this.enableColors) {
      const contextColor = getContextColor(context);
      mainParts.push(`[${colorize(context, contextColor)}]`);
    } else {
      mainParts.push(`[${context}]`);
    }
    
    // Message
    if (this.enableColors) {
      mainParts.push(colorize(message, style.color));
    } else {
      mainParts.push(message);
    }
    
    lines.push(mainParts.join(' '));
    
    // Structured data on additional lines
    if (this.enableStructuredData && data && this.enableColors) {
      const dataLines = formatStructuredData(data, level);
      lines.push(...dataLines);
    }
    
    return lines.join('\n');
  }
}

// Specialized formatters for different use cases
export class CompactFormatter implements LogFormatter {
  private enableColors: boolean;

  constructor(options: { enableColors?: boolean } = {}) {
    this.enableColors = options.enableColors ?? true;
  }

  format(entry: LogEntry): string {
    const { level, timestamp, context, message, correlationIds } = entry;
    const style = logLevelStyles[level];
    
    const time = timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeStyle: 'medium' 
    });
    
    const parts = [
      this.enableColors ? colorize(time.slice(-8), colors.gray) : time.slice(-8),
      this.enableColors ? style.icon : LogLevel[level][0],
    ];
    
    if (correlationIds) {
      const reqId = correlationIds.requestId?.slice(-4) || '----';
      parts.push(this.enableColors ? colorize(reqId, colors.cyan + colors.dim) : reqId);
    }
    
    const contextColor = this.enableColors ? getContextColor(context) : '';
    const shortContext = context.split(':')[0];
    parts.push(this.enableColors ? colorize(shortContext.slice(0, 6), contextColor) : shortContext.slice(0, 6));
    
    const messageColor = this.enableColors ? style.color : '';
    parts.push(this.enableColors ? colorize(message, messageColor) : message);
    
    return parts.join(' ');
  }
}

export class VerboseFormatter implements LogFormatter {
  private enableColors: boolean;

  constructor(options: { enableColors?: boolean } = {}) {
    this.enableColors = options.enableColors ?? true;
  }

  format(entry: LogEntry): string {
    const { level, timestamp, context, message, correlationIds, data } = entry;
    const style = logLevelStyles[level];
    const lines: string[] = [];
    
    // Header line with full timestamp
    const header = this.enableColors 
      ? `${colorize('═'.repeat(80), colors.gray + colors.dim)}`
      : '='.repeat(80);
    lines.push(header);
    
    // Main info line
    const timeStr = timestamp.toISOString();
    const levelStr = this.enableColors ? style.badge : `[${LogLevel[level]}]`;
    const contextStr = this.enableColors ? colorize(context, getContextColor(context)) : context;
    
    lines.push(`${levelStr} ${timeStr} ${contextStr}`);
    
    // Message
    const msgLine = this.enableColors ? colorize(message, style.color + colors.bright) : message;
    lines.push(`${style.icon} ${msgLine}`);
    
    // Correlation info
    if (correlationIds) {
      const corrLine = this.enableColors 
        ? `🔗 ${formatCorrelationIds(correlationIds)}`
        : `Correlation: ${correlationIds.requestId}`;
      lines.push(corrLine);
    }
    
    // Structured data
    if (data) {
      if (this.enableColors) {
        lines.push(...formatStructuredData(data, level));
      } else {
        lines.push(`Data: ${JSON.stringify(data, null, 2)}`);
      }
    }
    
    return lines.join('\n');
  }
}

// Enhanced color palette with more sophisticated styling
const colors = {
  // Base colors
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  
  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  
  // Background colors
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  
  // RGB colors for better aesthetics
  orange: "\x1b[38;5;208m",
  purple: "\x1b[38;5;135m",
  pink: "\x1b[38;5;213m",
  teal: "\x1b[38;5;51m",
  lime: "\x1b[38;5;154m",
};

const logLevelStyles: { [key in LogLevel]: { color: string; icon: string; badge: string } } = {
  [LogLevel.ERROR]: { 
    color: colors.red + colors.bright, 
    icon: "❌", 
    badge: colors.bgRed + colors.white + " ERROR " + colors.reset 
  },
  [LogLevel.WARN]: { 
    color: colors.orange + colors.bright, 
    icon: "⚠️ ", 
    badge: colors.bgYellow + colors.black + " WARN  " + colors.reset 
  },
  [LogLevel.INFO]: { 
    color: colors.cyan + colors.bright, 
    icon: "ℹ️ ", 
    badge: colors.bgCyan + colors.black + " INFO  " + colors.reset 
  },
  [LogLevel.DEBUG]: { 
    color: colors.green, 
    icon: "🔍", 
    badge: colors.bgGreen + colors.black + " DEBUG " + colors.reset 
  },
  [LogLevel.TRACE]: { 
    color: colors.gray, 
    icon: "📍", 
    badge: colors.gray + " TRACE " + colors.reset 
  },
};

const contextColors = {
  agent: colors.purple + colors.bright,
  model: colors.teal + colors.bright,
  action: colors.lime + colors.bright,
  context: colors.yellow + colors.bright,
  memory: colors.magenta + colors.bright,
  request: colors.cyan + colors.bright,
  engine: colors.orange + colors.bright,
};

function getContextColor(context: string): string {
  const baseContext = context.split(':')[0].split('[')[0];
  return contextColors[baseContext as keyof typeof contextColors] || colors.white;
}

function colorize(message: string, color: string): string {
  return `${color}${message}${colors.reset}`;
}

function formatTimestamp(date: Date): string {
  const time = date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  return colorize(time, colors.gray + colors.dim);
}

function formatCorrelationIds(correlationIds: CorrelationIds): string {
  const formatted = formatCorrelationIdsUtil(correlationIds);
  
  // Color different parts of correlation chain
  const parts = formatted.split('|');
  const coloredParts = parts.map((part: string, index: number) => {
    const partColors = [colors.cyan, colors.blue, colors.magenta, colors.green];
    const color = partColors[index % partColors.length];
    return colorize(part, color + colors.dim);
  });
  
  return coloredParts.join(colorize('│', colors.gray + colors.dim));
}

function formatStructuredData(data: any, level: LogLevel): string[] {
  const lines: string[] = [];
  
  if (!data || typeof data !== 'object') return lines;
  
  // Handle token usage
  if (data.tokenUsage) {
    const usage = data.tokenUsage;
    const tokenStr = `${usage.inputTokens}→${usage.outputTokens}`;
    const parts = [colorize(tokenStr, colors.cyan)];
    
    if (usage.reasoningTokens) {
      parts.push(colorize(`think:${usage.reasoningTokens}`, colors.purple));
    }
    
    if (usage.estimatedCost) {
      const cost = usage.estimatedCost < 0.001 
        ? `$${(usage.estimatedCost * 1000000).toFixed(0)}µ`
        : `$${usage.estimatedCost.toFixed(4)}`;
      parts.push(colorize(cost, colors.green));
    }
    
    lines.push(`    💰 ${parts.join(' • ')}`);
  }
  
  // Handle metrics
  if (data.metrics) {
    const metrics = data.metrics;
    const parts: string[] = [];
    
    if (metrics.totalTime) {
      const time = metrics.totalTime < 1000 
        ? `${metrics.totalTime}ms`
        : `${(metrics.totalTime / 1000).toFixed(1)}s`;
      parts.push(colorize(time, colors.yellow));
    }
    
    if (metrics.tokensPerSecond) {
      parts.push(colorize(`${metrics.tokensPerSecond.toFixed(1)} tok/s`, colors.lime));
    }
    
    if (parts.length > 0) {
      lines.push(`    ⚡ ${parts.join(' • ')}`);
    }
  }
  
  // Handle model info
  if (data.modelInfo) {
    const model = `${data.modelInfo.provider}/${data.modelInfo.modelId}`;
    lines.push(`    🤖 ${colorize(model, colors.teal)}`);
  }
  
  // Handle action info
  if (data.actionInfo) {
    const status = data.actionInfo.status;
    const statusIcon = status === 'complete' ? '✅' : status === 'error' ? '❌' : '🔄';
    lines.push(`    ${statusIcon} ${colorize(data.actionInfo.actionName, colors.lime)}`);
  }
  
  // Handle errors
  if (data.error) {
    lines.push(`    💥 ${colorize(data.error.message, colors.red)}`);
  }
  
  return lines;
}

// --- Enhanced Console Transport ---
export class ConsoleTransport implements Transport {
  private enableColors: boolean;

  constructor(options: { enableColors?: boolean } = {}) {
    this.enableColors = options.enableColors ?? true;
  }

  log(formattedMessage: string, entry: LogEntry): void {
    // The formatted message already includes colors and styling
    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> & { 
    style?: 'default' | 'enhanced' | 'compact' | 'verbose';
    enableColors?: boolean;
    enableStructuredData?: boolean;
  } = {}) {
    // Provide defaults if necessary
    const transports =
      !config.transports || config.transports.length === 0
        ? [new ConsoleTransport({ enableColors: config.enableColors })]
        : config.transports;

    // Choose formatter based on style preference
    let formatter: LogFormatter;
    if (config.formatter) {
      formatter = config.formatter;
    } else {
      const style = config.style || 'enhanced';
      const enableColors = config.enableColors ?? true;
      const enableStructuredData = config.enableStructuredData ?? true;
      
      switch (style) {
        case 'compact':
          formatter = new CompactFormatter({ enableColors });
          break;
        case 'verbose':
          formatter = new VerboseFormatter({ enableColors });
          break;
        case 'enhanced':
          formatter = new EnhancedFormatter({ 
            enableColors, 
            enableStructuredData,
            compactMode: false 
          });
          break;
        case 'default':
        default:
          formatter = new DefaultFormatter();
          break;
      }
    }

    this.config = {
      level: config.level ?? LogLevel.INFO,
      transports: transports,
      formatter: formatter,
    };

    // Initialize transports
    this.config.transports.forEach((transport) => {
      if (typeof transport.init === "function") {
        Promise.try(transport.init).catch((err) =>
          console.error("Error initializing transport:", err)
        );
      }
    });
  }

  configure(config: Pick<LoggerConfig, "level">) {
    this.config.level = config.level;
  }

  error(context: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, context, message, data);
  }

  warn(context: string, message: string, data?: any) {
    this.log(LogLevel.WARN, context, message, data);
  }

  info(context: string, message: string, data?: any) {
    this.log(LogLevel.INFO, context, message, data);
  }

  debug(context: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  trace(context: string, message: string, data?: any) {
    this.log(LogLevel.TRACE, context, message, data);
  }

  /**
   * Structured logging method with correlation IDs and rich metadata
   */
  structured(level: LogLevel, context: string, message: string, data: StructuredLogData) {
    if (level > this.config.level) return;

    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      context,
      message,
      data,
      correlationIds: data.correlationIds,
    };

    const formattedMessage = this.config.formatter.format(entry);

    this.config.transports.forEach((transport) => {
      try {
        transport.log(formattedMessage, entry);
      } catch (error) {
        console.error(
          `Error logging to transport ${transport.constructor.name}:`,
          error
        );
      }
    });
  }

  private log(level: LogLevel, context: string, message: string, data?: any) {
    if (level > this.config.level) return;

    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      context,
      message,
      data,
    };

    const formattedMessage = this.config.formatter.format(entry); // Format the core message

    // Send to all transports (passing both formatted string and raw entry)
    this.config.transports.forEach((transport) => {
      try {
        transport.log(formattedMessage, entry);
      } catch (error) {
        console.error(
          `Error logging to transport ${transport.constructor.name}:`,
          error
        );
      }
    });
  }

  // Method to gracefully close transports
  async close(): Promise<void> {
    for (const transport of this.config.transports) {
      if (typeof transport.close === "function") {
        try {
          await Promise.try(transport.close);
        } catch (err) {
          console.error(
            `Error closing transport ${transport.constructor.name}:`,
            err
          );
        }
      }
    }
  }
}
