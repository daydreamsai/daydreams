import chalk from "chalk";
import ora from "ora";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function logsCommand(name: string, options: any) {
  const spinner = ora();

  try {
    if (!options.project) {
      console.error(chalk.red("✖ Project ID is required"));
      console.log(chalk.gray("  Use --project <id> to specify your Google Cloud project"));
      process.exit(1);
    }

    const serviceName = `agent-${name}`;
    const region = options.region || "us-central1";

    spinner.start(`Fetching logs for ${chalk.cyan(name)}...`);

    // Build gcloud command
    let command = `gcloud run services logs read ${serviceName}`;
    command += ` --project=${options.project}`;
    command += ` --region=${region}`;
    command += ` --limit=${options.lines || 100}`;
    
    if (!options.follow) {
      // One-time fetch
      spinner.stop();
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error(chalk.red("Error fetching logs:"), stderr);
      }
      
      if (stdout) {
        console.log(stdout);
      } else {
        console.log(chalk.yellow("No logs found for this agent."));
      }
    } else {
      // Follow logs (streaming)
      spinner.stop();
      console.log(chalk.gray(`Following logs for ${name}... (Ctrl+C to stop)\n`));
      
      command += " --tail";
      
      const { spawn } = await import("child_process");
      const logProcess = spawn("gcloud", command.split(" ").slice(1), {
        stdio: "inherit",
      });

      process.on("SIGINT", () => {
        logProcess.kill();
        process.exit(0);
      });
    }

  } catch (error) {
    spinner.fail("Failed to fetch logs");
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red("\n❌ Error:"), errorMessage);
    console.log(chalk.gray("\nMake sure you have gcloud CLI installed and authenticated."));
    throw error;
  }
}
