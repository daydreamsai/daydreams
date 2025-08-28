import chalk from "chalk";
import ora from "ora";
import { GCloudService } from "../services/gcloud.js";

export async function listCommand(options: any) {
  const spinner = ora();

  try {
    if (!options.project) {
      console.error(chalk.red("✖ Project ID is required"));
      console.log(chalk.gray("  Use --project <id> to specify your Google Cloud project"));
      process.exit(1);
    }

    spinner.start("Fetching deployed agents...");

    const gcloud = new GCloudService(options.project);
    const deployments = await gcloud.listDeployments(options.project, options.region);

    spinner.stop();

    if (deployments.length === 0) {
      console.log(chalk.yellow("No agents deployed yet."));
      console.log(chalk.gray("Deploy your first agent with: daydreams-deploy deploy"));
      return;
    }

    console.log(chalk.bold(`\nDeployed Agents (${deployments.length}):\n`));

    for (const deployment of deployments) {
      const status = deployment.status === "READY" 
        ? chalk.green("● READY") 
        : chalk.yellow("● DEPLOYING");

      console.log(`${status} ${chalk.cyan(deployment.name)}`);
      console.log(`    URL: ${chalk.blue(deployment.url)}`);
      if (deployment.customDomain) {
        console.log(`    Custom: ${chalk.blue(`https://${deployment.customDomain}`)}`);
      }
      console.log(`    Region: ${deployment.region}`);
      console.log(`    Memory: ${deployment.config.memory}`);
      console.log(`    Scaling: ${deployment.config.minInstances}-${deployment.config.maxInstances} instances`);
      console.log(`    Updated: ${deployment.updatedAt.toLocaleString()}`);
      console.log();
    }

  } catch (error) {
    spinner.fail("Failed to list deployments");
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red("\n❌ Error:"), errorMessage);
    throw error;
  }
}
