import { LogLevel, type Optional } from "./types"; // Assuming LogLevel is defined elsewhere

// --- Interfaces ---

export interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  context: string;
  message: string;
  data?: any;
}

export interface Formatter {
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
  formatter: Formatter;
}

// --- Default Implementations ---

export class DefaultFormatter implements Formatter {
  private enableTimestamp: boolean;

  constructor(options: { enableTimestamp?: boolean } = {}) {
    this.enableTimestamp = options.enableTimestamp ?? true;
  }

  format(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    parts.push(`[${LogLevel[entry.level]}]`); // Assumes LogLevel is an enum
    parts.push(`[${entry.context}]`);
    parts.push(entry.message);

    // Note: Default formatter now DOES NOT stringify data,
    // as transports might want to handle it differently.
    // if (entry.data) {
    //   try {
    //     parts.push(`\n${JSON.stringify(entry.data, null, 2)}`);
    //   } catch (error) {
    //     parts.push("[Unserializable data]");
    //   }
    // }

    return parts.join(" ");
  }
}

const colors: { [key in LogLevel]?: string } = {
  [LogLevel.ERROR]: "\x1b[31m", // Red
  [LogLevel.WARN]: "\x1b[33m", // Yellow
  [LogLevel.INFO]: "\x1b[36m", // Cyan
  [LogLevel.DEBUG]: "\x1b[32m", // Green
  [LogLevel.TRACE]: "\x1b[90m", // Gray
};

const colorReset = "\x1b[0m";

function colorize(message: string, level: LogLevel): string {
  const color = colors[level] || "";
  return `${color}${message}${colorReset}`;
}

// --- UPDATED ConsoleTransport ---
export class ConsoleTransport implements Transport {
  private enableColors: boolean;

  constructor(options: { enableColors?: boolean } = {}) {
    this.enableColors = options.enableColors ?? true;
  }

  log(formattedMessage: string, entry: LogEntry): void {
    const messageParts: any[] = []; // Use array to pass multiple args to console.log

    if (this.enableColors) {
      messageParts.push(colorize(formattedMessage, entry.level));
    } else {
      messageParts.push(formattedMessage);
    }

    // If data exists, log it as a separate argument to console.log
    // This allows the browser/Node console to display it interactively.
    if (entry.data !== undefined) {
      messageParts.push(entry.data);
    }

    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(...messageParts);
        break;
      case LogLevel.WARN:
        console.warn(...messageParts);
        break;
      case LogLevel.INFO:
        console.info(...messageParts);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE: // console.debug and console.trace might behave differently
        console.debug(...messageParts); // Or console.log(...messageParts)
        break;
      default:
        console.log(...messageParts);
    }
  }
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig>) {
    // Provide defaults if necessary
    const transports =
      !config.transports || config.transports.length === 0
        ? [new ConsoleTransport()]
        : config.transports;

    const formatter = config.formatter ?? new DefaultFormatter();

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
