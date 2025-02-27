import { z } from "zod";
import { action } from "@daydreamsai/core";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Action to execute a simple bash command and return the result
 */
export const executeBashAction = action({
  name: "executeBash",
  description: "Execute a bash command and return the output",
  schema: z.object({
    command: z.string().describe("The bash command to execute"),
    workingDirectory: z
      .string()
      .optional()
      .describe("Working directory for command execution"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in milliseconds (default: 30000)"),
  }),
  async handler(call, ctx) {
    try {
      const { command, workingDirectory, timeout = 30000 } = call.data;

      console.log(`Executing bash command: ${command}`);

      const options: any = {
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      };

      if (workingDirectory) {
        options.cwd = workingDirectory;
      }

      const { stdout, stderr } = await execPromise(command, options);

      console.log("stdout", stdout);
      console.log("stderr", stderr);

      return {
        success: true,
        stdout: stdout.toString().trim(),
        stderr: stderr.toString().trim(),
        command,
      };
    } catch (error) {
      const errorObj = error as any;
      return {
        success: false,
        error: errorObj.message || String(error),
        stdout: errorObj.stdout?.trim() || "",
        stderr: errorObj.stderr?.trim() || "",
        command: call.data.command,
      };
    }
  },
});

/**
 * Action to execute a long-running bash command with streaming output
 */
export const executeLongRunningBashAction = action({
  name: "executeLongRunningBash",
  description: "Execute a long-running bash command with streaming output",
  schema: z.object({
    command: z.string().describe("The bash command to execute"),
    args: z
      .array(z.string())
      .optional()
      .describe("Command arguments as an array"),
    workingDirectory: z
      .string()
      .optional()
      .describe("Working directory for command execution"),
    maxOutputLines: z
      .number()
      .optional()
      .describe("Maximum number of output lines to capture (default: 100)"),
  }),
  async handler(call, ctx) {
    try {
      const {
        command,
        args = [],
        workingDirectory,
        maxOutputLines = 100,
      } = call.data;

      console.log(
        `Executing long-running bash command: ${command} ${args.join(" ")}`
      );

      const options: any = {};
      if (workingDirectory) {
        options.cwd = workingDirectory;
      }

      // Split command into command and arguments if args not provided
      const finalCommand = args.length > 0 ? command : command.split(" ")[0];
      const finalArgs = args.length > 0 ? args : command.split(" ").slice(1);

      return new Promise((resolve) => {
        const childProcess = spawn(finalCommand, finalArgs, options);

        let stdout = "";
        let stderr = "";
        let outputLines = 0;
        let killed = false;

        childProcess.stdout.on("data", (data) => {
          const text = data.toString();
          stdout += text;
          outputLines += text.split("\n").length - 1;

          console.log(`[STDOUT]: ${text.trim()}`);

          // Kill if too much output
          if (outputLines > maxOutputLines && !killed) {
            console.log(
              `Command output exceeded ${maxOutputLines} lines, terminating...`
            );
            childProcess.kill();
            killed = true;
          }
        });

        childProcess.stderr.on("data", (data) => {
          const text = data.toString();
          stderr += text;
          console.log(`[STDERR]: ${text.trim()}`);
        });

        childProcess.on("close", (code) => {
          console.log(`Command exited with code ${code}`);

          if (killed) {
            stdout += `\n[Command terminated after exceeding ${maxOutputLines} lines of output]`;
          }

          resolve({
            success: code === 0,
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            command: `${command} ${args.join(" ")}`.trim(),
            terminated: killed,
          });
        });

        childProcess.on("error", (error) => {
          console.error(`Command execution error: ${error.message}`);
          resolve({
            success: false,
            error: error.message,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            command: `${command} ${args.join(" ")}`.trim(),
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stdout: "",
        stderr: "",
        command:
          `${call.data.command} ${call.data.args?.join(" ") || ""}`.trim(),
      };
    }
  },
});

/**
 * Action to get system information using bash commands
 */
export const getSystemInfoAction = action({
  name: "getSystemInfo",
  description: "Get system information using bash commands",
  schema: z.object({}),
  async handler(call, ctx) {
    try {
      // Execute multiple commands to gather system information
      const osInfo = await execPromise("uname -a");
      const cpuInfo = await execPromise(
        'cat /proc/cpuinfo | grep "model name" | head -n1 || sysctl -n machdep.cpu.brand_string'
      );
      const memInfo = await execPromise(
        "free -h || vm_stat && sysctl hw.memsize"
      );
      const diskInfo = await execPromise("df -h");
      const processInfo = await execPromise("ps aux | head -10");

      return {
        success: true,
        system: {
          os: osInfo.stdout.trim(),
          cpu: cpuInfo.stdout.trim(),
          memory: memInfo.stdout.trim(),
          disk: diskInfo.stdout.trim(),
          processes: processInfo.stdout.trim(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Action to find files using the find command
 */
export const findFilesAction = action({
  name: "findFiles",
  description: "Find files matching a pattern using the find command",
  schema: z.object({
    directory: z.string().describe("Directory to search in"),
    pattern: z
      .string()
      .describe("File pattern to search for (e.g., '*.js', '*.txt')"),
    maxDepth: z
      .number()
      .optional()
      .describe("Maximum directory depth to search"),
    type: z
      .enum(["f", "d", "l"])
      .optional()
      .describe(
        "Type of file to find (f=regular file, d=directory, l=symlink)"
      ),
  }),
  async handler(call, ctx) {
    try {
      const { directory, pattern, maxDepth, type } = call.data;

      let command = `find ${directory} -name "${pattern}"`;

      if (maxDepth !== undefined) {
        command += ` -maxdepth ${maxDepth}`;
      }

      if (type) {
        command += ` -type ${type}`;
      }

      const { stdout, stderr } = await execPromise(command);

      const files = stdout.trim().split("\n").filter(Boolean);

      return {
        success: true,
        files,
        count: files.length,
        command,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        command: `find ${call.data.directory} -name "${call.data.pattern}"`,
      };
    }
  },
});

/**
 * Action to grep for patterns in files
 */
export const grepFilesAction = action({
  name: "grepFiles",
  description: "Search for patterns in files using grep",
  schema: z.object({
    pattern: z.string().describe("Pattern to search for"),
    files: z
      .string()
      .describe(
        "Files or directory pattern to search in (e.g., '*.js', 'src/')"
      ),
    recursive: z
      .boolean()
      .optional()
      .describe("Search recursively in directories"),
    ignoreCase: z.boolean().optional().describe("Ignore case distinctions"),
    lineNumbers: z.boolean().optional().describe("Show line numbers"),
    context: z
      .number()
      .optional()
      .describe("Number of context lines before and after match"),
  }),
  async handler(call, ctx) {
    try {
      const { pattern, files, recursive, ignoreCase, lineNumbers, context } =
        call.data;

      let command = "grep";

      if (recursive) {
        command += " -r";
      }

      if (ignoreCase) {
        command += " -i";
      }

      if (lineNumbers) {
        command += " -n";
      }

      if (context !== undefined) {
        command += ` -C ${context}`;
      }

      command += ` "${pattern}" ${files}`;

      const { stdout, stderr } = await execPromise(command);

      const matches = stdout.trim().split("\n").filter(Boolean);

      return {
        success: true,
        matches,
        count: matches.length,
        command,
      };
    } catch (error) {
      const errorObj = error as any;
      // grep returns exit code 1 when no matches are found, which is not an error
      if (errorObj.code === 1 && !errorObj.stderr) {
        return {
          success: true,
          matches: [],
          count: 0,
          command: `grep "${call.data.pattern}" ${call.data.files}`,
        };
      }

      return {
        success: false,
        error: errorObj.message || String(error),
        command: `grep "${call.data.pattern}" ${call.data.files}`,
      };
    }
  },
});
