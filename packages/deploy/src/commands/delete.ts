import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { GCloudService } from "../services/gcloud.js";

export async function deleteCommand(name: string, options: any) {
  const spinner = ora();

  try {
    if (!options.project) {
      console.error(chalk.red("✖ Project ID is required"));
      console.log(chalk.gray("  Use --project <id> to specify your Google Cloud project"));
      process.exit(1);
    }

    // Confirm deletion
    if (!options.yes) {
      const response = await prompts({
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete agent "${chalk.cyan(name)}"?`,
        initial: false,
      });

      if (!response.confirm) {
        console.log(chalk.yellow("✖ Deletion cancelled"));
        return;
      }
    }

    spinner.start(`Deleting agent ${chalk.cyan(name)}...`);

    const gcloud = new GCloudService(options.project);
    await gcloud.deleteDeployment(name, options.project, options.region, options.domain);

    spinner.succeed(`Agent ${chalk.cyan(name)} deleted successfully`);

    console.log(chalk.gray("\nNote: DNS records may take some time to update."));

  } catch (error) {
    spinner.fail("Failed to delete agent");
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red("\n❌ Error:"), errorMessage);
    throw error;
  }
}
