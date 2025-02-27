import { spawn, type SpawnOptions } from "child_process";
import * as os from "os";
import {
  BaseAnthropicTool,
  CLIResult,
  ToolError,
  type ToolResult,
} from "./base";

// Platform-specific shell configuration
const SHELL_CONFIG = {
  win32: {
    command: "powershell.exe",
    args: ["-NoProfile", "-NonInteractive"],
    sentinelCommand: (cmd: string) => `${cmd}; Write-Output '${SENTINEL}'`,
  },
  unix: {
    command: "/bin/bash",
    args: [],
    sentinelCommand: (cmd: string) => `${cmd}; echo '${SENTINEL}'`,
  },
} as const;

const TIMEOUT = 120000; // milliseconds
const SENTINEL = "<<exit>>";

class BashSession {
  private process: ReturnType<typeof spawn> | null = null;
  private started = false;
  private timedOut = false;
  private readonly isWindows: boolean;
  private readonly shellConfig:
    | typeof SHELL_CONFIG.unix
    | typeof SHELL_CONFIG.win32;

  constructor() {
    this.isWindows = os.platform() === "win32";
    this.shellConfig = this.isWindows ? SHELL_CONFIG.win32 : SHELL_CONFIG.unix;
  }

  async start(): Promise<void> {
    if (this.started) return;

    const options: SpawnOptions = {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true, // Hide terminal window on Windows
    };

    if (!this.isWindows) {
      // Set process group on Unix-like systems
      options.detached = true;
    }

    this.process = spawn(
      this.shellConfig.command,
      this.shellConfig.args,
      options
    );
    this.started = true;

    // Handle process errors
    this.process.on("error", (err) => {
      throw new ToolError(`Shell process error: ${err.message}`);
    });

    // Set encoding for all streams
    this.process.stdout!.setEncoding("utf8");
    this.process.stderr!.setEncoding("utf8");
    this.process.stdin!.setDefaultEncoding("utf8");

    // Initial setup for Windows PowerShell
    if (this.isWindows) {
      // Set UTF-8 encoding and other PowerShell specific configs
      const initCommands = [
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
        '$PSDefaultParameterValues["*:Encoding"] = "utf8"',
        "Set-StrictMode -Version Latest",
      ].join("; ");

      this.process.stdin!.write(`${initCommands}\n`);
    }
  }

  stop(): void {
    if (!this.started || !this.process) {
      throw new ToolError("Session has not started.");
    }

    if (this.process.exitCode === null) {
      if (this.isWindows) {
        spawn("taskkill", ["/pid", this.process.pid!.toString(), "/f", "/t"]);
      } else {
        process.kill(-this.process.pid!, "SIGTERM");
      }
    }
  }

  async run(command: string): Promise<ToolResult> {
    if (!this.started || !this.process) {
      throw new ToolError("Session has not started.");
    }

    if (this.process.exitCode !== null) {
      return {
        system: "tool must be restarted",
        error: `shell has exited with return code ${this.process.exitCode}`,
      };
    }

    if (this.timedOut) {
      throw new ToolError(
        `timed out: shell has not returned in ${TIMEOUT}ms and must be restarted`
      );
    }
    return new Promise<ToolResult>((resolve, reject) => {
      let outputBuffer = "";
      let errorBuffer = "";
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.process!.stdout!.removeAllListeners("data");
        this.process!.stderr!.removeAllListeners("data");
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        this.timedOut = true;
        reject(
          new ToolError(
            `timed out: shell has not returned in ${TIMEOUT}ms and must be restarted`
          )
        );
      }, TIMEOUT) as NodeJS.Timeout;

      // Collect stdout
      this.process!.stdout!.on("data", (data) => {
        outputBuffer += data;

        const sentinelIndex = outputBuffer.indexOf(SENTINEL);
        if (sentinelIndex !== -1) {
          cleanup();

          const output = outputBuffer.substring(0, sentinelIndex).trim();
          resolve(new CLIResult(output, errorBuffer || undefined));
        }
      });

      this.process!.stderr!.on("data", (data) => {
        errorBuffer += data;
      });

      try {
        const formattedCommand = this.shellConfig.sentinelCommand(command);
        this.process!.stdin!.write(`${formattedCommand}\n`);
      } catch (error) {
        cleanup();
        reject(new ToolError(`Failed to write command: ${error}`));
      }
    });
  }
}

export class BashTool extends BaseAnthropicTool {
  private session: BashSession | null = null;

  async execute(params: {
    command?: string;
    restart?: boolean;
  }): Promise<ToolResult> {
    const { command, restart } = params;

    if (restart) {
      if (this.session) {
        this.session.stop();
      }
      this.session = new BashSession();
      await this.session.start();
      return {
        system: "tool has been restarted.",
      };
    }

    if (!this.session) {
      this.session = new BashSession();
      await this.session.start();
    }

    if (!command) {
      throw new ToolError("no command provided.");
    }

    return this.session.run(command);
  }

  toParams() {
    return {
      type: "bash_20241022",
      name: "bash",
    };
  }
}
