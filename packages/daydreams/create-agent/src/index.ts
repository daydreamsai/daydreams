import path from "path";
import fs from "fs-extra";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import prompts from "prompts";
import { fileURLToPath } from "url";
import {
  generateTemplateContent,
  createEnvVariables,
  createReadme,
  validateProjectName,
  validateModel,
  getLatestDependencies,
} from "./utils.js";

// Define __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the CLI program
const program = new Command()
  .name("create-agent")
  .description(
    "🤖 Bootstrap a new Daydreams AI agent with extensions and model providers"
  )
  .version("0.1.0")
  .argument(
    "[directory]",
    "Directory to create the agent in (defaults to current directory)"
  )
  .option(
    "--twitter",
    "Include Twitter/X extension for social media interactions"
  )
  .option("--discord", "Include Discord extension for bot functionality")
  .option("--cli", "Include CLI extension for command-line interface")
  .option("--telegram", "Include Telegram extension for messaging")
  .option("--all", "Include all available extensions")
  .option(
    "--model <model>",
    "Specify the model provider (openai, groq, anthropic, google)"
  )
  .option("--skip-install", "Skip dependency installation")
  .option("--verbose", "Show detailed output during creation")
  .addHelpText(
    "after",
    `
Examples:
  $ create-agent my-bot                    Create agent in ./my-bot (will prompt for model)
  $ create-agent --twitter --discord      Create agent with Twitter and Discord
  $ create-agent --model openai --all     Create agent with OpenAI and all extensions
  $ create-agent . --cli                  Create agent in current directory with CLI only

Available Extensions:
  cli       Command-line interface for terminal interactions
  twitter   Twitter/X integration for social media automation
  discord   Discord bot for server management and chat
  telegram  Telegram bot for messaging and notifications

Supported Models:
  groq      Groq's fast inference (free tier available)
  openai    OpenAI GPT models (requires API key)
  anthropic Claude models (requires API key)
  google    Google Gemini models (requires API key)

Environment Setup:
  After creation, copy .env.example to .env and configure your API keys.
  Each extension may require additional environment variables.
`
  );

// Export the main function for testing purposes
export async function main(
  testArgs?: string[],
  testOpts?: Record<string, any>,
  testTemplateContent?: string // Add template content parameter for testing
) {
  // Parse arguments and options only if not in test mode
  if (!testArgs && !testOpts) {
    program.parse(process.argv);
  }

  const options = testOpts || program.opts();
  const targetDir = (testArgs && testArgs[0]) || program.args[0] || ".";
  const cwd = process.cwd();
  const targetPath = path.resolve(cwd, targetDir);

  // Validate project directory name
  if (targetDir !== ".") {
    const validation = validateProjectName(path.basename(targetPath));
    if (!validation.isValid) {
      console.error(chalk.red(`❌ Invalid project name: ${validation.error}`));
      console.log(chalk.yellow(`💡 Try: create-agent my-agent`));
      return;
    }
  }

  // Enhanced verbose logging helper
  const log = (message: string, force = false) => {
    if (options.verbose || force) {
      console.log(chalk.gray(`🔍 ${message}`));
    }
  };

  log(`Target directory: ${targetPath}`);
  log(`Model provider: ${options.model || "not specified - will prompt"}`);

  // Check if target directory exists and is not empty
  if (fs.existsSync(targetPath)) {
    const files = await fs.readdir(targetPath);
    if (files.length > 0) {
      console.log(
        chalk.yellow(`⚠️  Directory ${chalk.cyan(targetPath)} is not empty.`)
      );
      console.log(
        chalk.gray(
          `   Found ${files.length} file(s): ${files.slice(0, 3).join(", ")}${
            files.length > 3 ? "..." : ""
          }`
        )
      );

      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: "Continue and potentially overwrite existing files?",
        initial: false,
      });

      if (!proceed) {
        console.log(chalk.red("❌ Operation cancelled."));
        return;
      }
    }
  } else {
    log(`Creating directory: ${targetPath}`);
    await fs.mkdir(targetPath, { recursive: true });
  }

  console.log();
  console.log(chalk.bold("🚀 Creating a new Daydreams agent..."));
  console.log();

  // Determine selected extensions
  const availableExtensions = ["cli", "twitter", "discord", "telegram"];
  let selectedExtensions = [];

  if (options.all) {
    selectedExtensions = [...availableExtensions];
    console.log(chalk.green("📦 Including all extensions"));
  } else {
    // Collect extensions from command line options
    selectedExtensions = availableExtensions.filter((ext) => options[ext]);

    // If no extensions were selected via flags, prompt the user
    if (selectedExtensions.length === 0) {
      console.log(chalk.cyan("🔧 Choose extensions for your agent:"));
      const { extensions } = await prompts({
        type: "multiselect",
        name: "extensions",
        message: "Select extensions to include",
        choices: [
          {
            title: "CLI",
            value: "cli",
            description: "Command-line interface for terminal interactions",
          },
          {
            title: "Twitter/X",
            value: "twitter",
            description: "Social media automation and interactions",
          },
          {
            title: "Discord",
            value: "discord",
            description: "Discord bot for server management",
          },
          {
            title: "Telegram",
            value: "telegram",
            description: "Telegram bot for messaging",
          },
        ],
        hint: "Use space to select, enter to confirm",
      });

      if (!extensions || extensions.length === 0) {
        console.log(
          chalk.yellow(
            "⚠️  No extensions selected. Including CLI extension by default."
          )
        );
        selectedExtensions = ["cli"];
      } else {
        selectedExtensions = extensions;
      }
    }
  }

  log(`Selected extensions: ${selectedExtensions.join(", ")}`);

  // Determine the model to use
  const validModels = ["openai", "groq", "anthropic", "google"];
  let selectedModel = options.model;

  // If model was explicitly provided via command line, validate it
  if (selectedModel) {
    const modelValidation = validateModel(selectedModel);
    if (!modelValidation.isValid) {
      console.error(chalk.red(`❌ ${modelValidation.error}`));
      console.log(
        chalk.yellow(`💡 Try: --model groq (or openai, anthropic, google)`)
      );
      return;
    }
  } else {
    // No model specified, prompt the user to select one
    console.log(chalk.cyan("🤖 Choose your AI model provider:"));
    const { model } = await prompts({
      type: "select",
      name: "model",
      message: "Select the model provider to use",
      choices: [
        {
          title: "Groq",
          value: "groq",
          description: "Fast inference, free tier available",
        },
        {
          title: "OpenAI",
          value: "openai",
          description: "GPT models, requires API key",
        },
        {
          title: "Anthropic",
          value: "anthropic",
          description: "Claude models, requires API key",
        },
        {
          title: "Google",
          value: "google",
          description: "Gemini models, requires API key",
        },
      ],
      initial: 0,
    });
    selectedModel = model;
  }

  if (!selectedModel) {
    console.error(
      chalk.red("❌ No model provider selected. Operation cancelled.")
    );
    return;
  }

  log(`Selected model: ${selectedModel}`);

  // Create package.json
  const spinner = ora("📦 Fetching latest dependency versions").start();

  let dependencies: Record<string, string>;
  try {
    dependencies = await getLatestDependencies(
      selectedExtensions,
      selectedModel,
      options.verbose
    );
    spinner.succeed(chalk.green("✅ Fetched latest dependency versions"));
  } catch (error) {
    spinner.fail(chalk.yellow("⚠️  Using fallback dependency versions"));
    log(
      `Error fetching dependencies: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Fallback to basic dependencies if something goes wrong
    const baseDeps = {
      "@daydreamsai/core": "^0.2.13",
      ai: "^4.1.25",
      chalk: "^5.4.1",
      typescript: "^5.3.3",
      zod: "^3.24.1",
      "@daydreamsai/ai-sdk-provider": "^0.1.2",
    };

    const modelDep: Record<string, string> = {};
    switch (selectedModel) {
      case "groq":
        modelDep["@ai-sdk/groq"] = "^1.1.7";
        break;
      case "openai":
        modelDep["@ai-sdk/openai"] = "^1.1.14";
        break;
      case "anthropic":
        modelDep["@ai-sdk/anthropic"] = "^1.1.6";
        break;
      case "google":
        modelDep["@ai-sdk/google"] = "^1.1.16";
        break;
    }

    dependencies = { ...baseDeps, ...modelDep };
  }

  spinner.start("Creating package.json");
  const packageJson: {
    name: string;
    version: string;
    type: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
  } = {
    name: path.basename(targetPath),
    version: "0.1.0",
    type: "module",
    scripts: {
      start: "bun run index.ts",
      build: "tsc",
    },
    dependencies,
  };

  try {
    await fs.writeFile(
      path.join(targetPath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
    spinner.succeed(chalk.green("✅ Created package.json"));
    log(`Package name: ${packageJson.name}`);
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create package.json"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Create tsconfig.json
  spinner.start("⚙️  Creating TypeScript configuration");
  const tsconfigJson = {
    compilerOptions: {
      target: "ES2020",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: "dist",
    },
    include: ["*.ts"],
    exclude: ["node_modules"],
  };

  try {
    await fs.writeFile(
      path.join(targetPath, "tsconfig.json"),
      JSON.stringify(tsconfigJson, null, 2)
    );
    spinner.succeed(chalk.green("✅ Created TypeScript configuration"));
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create tsconfig.json"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Copy template file based on selected model
  spinner.start(
    `🤖 Creating agent with ${chalk.cyan(selectedModel)} model and ${chalk.cyan(
      selectedExtensions.length
    )} extension(s)`
  );

  // Read template content - either from test parameter or from file
  let templateContent: string;

  if (testTemplateContent) {
    // Use the provided test template content
    templateContent = testTemplateContent;
  } else {
    // Get the template file path
    const templateFile = path.join(
      __dirname,
      "..",
      "templates",
      "basic",
      "template.ts"
    );

    if (!fs.existsSync(templateFile)) {
      spinner.fail(chalk.red("❌ Template file not found"));
      console.error(
        chalk.red(
          `Error: Template file not found at ${templateFile}. Please check your installation.`
        )
      );
      return;
    }

    try {
      // Read the template file
      templateContent = await fs.readFile(templateFile, "utf-8");
      log(`Template loaded from: ${templateFile}`);
    } catch (error) {
      spinner.fail(chalk.red("❌ Failed to read template file"));
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }
  }

  // Define model-specific replacements
  const modelConfig = {
    groq: {
      MODEL_NAME: "Groq",
      MODEL_IMPORT_FUNCTION: "createGroq",
      MODEL_IMPORT_PATH: "@ai-sdk/groq",
      ENV_VAR_KEY: "GROQ_API_KEY",
      MODEL_VARIABLE: "groq",
      MODEL_VERSION: "deepseek-r1-distill-llama-70b",
    },
    openai: {
      MODEL_NAME: "OpenAI",
      MODEL_IMPORT_FUNCTION: "createOpenAI",
      MODEL_IMPORT_PATH: "@ai-sdk/openai",
      ENV_VAR_KEY: "OPENAI_API_KEY",
      MODEL_VARIABLE: "openai",
      MODEL_VERSION: "gpt-4o",
    },
    anthropic: {
      MODEL_NAME: "Anthropic",
      MODEL_IMPORT_FUNCTION: "createAnthropic",
      MODEL_IMPORT_PATH: "@ai-sdk/anthropic",
      ENV_VAR_KEY: "ANTHROPIC_API_KEY",
      MODEL_VARIABLE: "anthropic",
      MODEL_VERSION: "claude-3-opus-20240229",
    },
    google: {
      MODEL_NAME: "Google",
      MODEL_IMPORT_FUNCTION: "createGoogle",
      MODEL_IMPORT_PATH: "@ai-sdk/google",
      ENV_VAR_KEY: "GOOGLE_API_KEY",
      MODEL_VARIABLE: "google",
      MODEL_VERSION: "gemini-1.5-pro",
    },
  };

  // Replace placeholders with model-specific values
  const config = modelConfig[selectedModel as keyof typeof modelConfig];

  // Prepare extension imports and extension list for template generation
  const extensionImports: string[] = [];
  const extensionsList: string[] = [];

  for (const ext of selectedExtensions) {
    if (ext === "cli") {
      extensionImports.push(`import { cliExtension } from "@daydreamsai/cli";`);
      extensionsList.push("cliExtension");
    } else if (ext === "twitter") {
      extensionImports.push(`import { twitter } from "@daydreamsai/twitter";`);
      extensionsList.push("twitter");
    } else if (ext === "discord") {
      extensionImports.push(`import { discord } from "@daydreamsai/discord";`);
      extensionsList.push("discord");
    } else if (ext === "telegram") {
      extensionImports.push(
        `import { telegram } from "@daydreamsai/telegram";`
      );
      extensionsList.push("telegram");
    }
  }

  // Generate the template content with all replacements
  try {
    const processedContent = generateTemplateContent(
      templateContent,
      config,
      extensionImports,
      extensionsList
    );

    // Write the modified template to the target directory
    await fs.writeFile(path.join(targetPath, "index.ts"), processedContent);
    spinner.succeed(
      chalk.green(
        `✅ Created agent with ${selectedModel} model and extensions: ${chalk.cyan(
          selectedExtensions.join(", ")
        )}`
      )
    );
    log(`Extensions configured: ${selectedExtensions.join(", ")}`);
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create agent file"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Create .env file with required environment variables
  spinner.start("🔐 Creating environment configuration");
  try {
    const envContent = createEnvVariables(selectedModel, selectedExtensions);
    await fs.writeFile(path.join(targetPath, ".env.example"), envContent);
    spinner.succeed(
      chalk.green("✅ Created environment configuration (.env.example)")
    );
    log(
      `Environment variables for: ${selectedModel}, ${selectedExtensions.join(
        ", "
      )}`
    );
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create .env.example"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }

  // Create README
  spinner.start("📖 Creating documentation");
  try {
    const readmeContent = createReadme(
      path.basename(targetPath),
      selectedExtensions,
      selectedModel
    );
    await fs.writeFile(path.join(targetPath, "README.md"), readmeContent);
    spinner.succeed(chalk.green("✅ Created documentation (README.md)"));
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create README"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }

  // Install dependencies - simplified to directly use pnpm
  if (!options.skipInstall) {
    spinner.start("📦 Installing dependencies with pnpm");
    try {
      await execa("pnpm", ["install"], { cwd: targetPath });

      // Verify node_modules exists
      const nodeModulesPath = path.join(targetPath, "node_modules");
      const nodeModulesExists = await fs.pathExists(nodeModulesPath);

      if (nodeModulesExists) {
        spinner.succeed(chalk.green("✅ Installed dependencies"));
        log(`Dependencies installed in: ${nodeModulesPath}`);
      } else {
        spinner.fail(
          chalk.yellow(
            "⚠️  Dependencies installed but node_modules directory wasn't found"
          )
        );
        console.log(
          chalk.yellow(
            "💡 You can install dependencies manually by running 'pnpm install' in the project directory."
          )
        );
      }
    } catch (error: unknown) {
      spinner.fail(chalk.red("❌ Failed to install dependencies"));
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      console.log(
        chalk.yellow(
          "💡 You can install dependencies manually by running 'pnpm install' in the project directory."
        )
      );
    }
  } else {
    console.log(
      chalk.yellow("⏭️  Skipping dependency installation (--skip-install)")
    );
  }

  console.log();
  console.log(
    chalk.green.bold("🎉 Your Daydreams agent has been created successfully!")
  );
  console.log();

  console.log(chalk.cyan("📋 Summary:"));
  console.log(
    `   ${chalk.gray("Project:")} ${chalk.white(path.basename(targetPath))}`
  );
  console.log(`   ${chalk.gray("Location:")} ${chalk.white(targetPath)}`);
  console.log(`   ${chalk.gray("Model:")} ${chalk.white(selectedModel)}`);
  console.log(
    `   ${chalk.gray("Extensions:")} ${chalk.white(
      selectedExtensions.join(", ")
    )}`
  );
  console.log();

  console.log(chalk.cyan("🚀 Next steps:"));

  if (targetDir !== ".") {
    console.log(`   ${chalk.gray("1.")} cd ${chalk.white(targetDir)}`);
  }

  console.log(
    `   ${chalk.gray(targetDir !== "." ? "2." : "1.")} cp .env.example .env`
  );
  console.log(
    `   ${chalk.gray(targetDir !== "." ? "3." : "2.")} ${chalk.gray(
      "# Configure your API keys in .env"
    )}`
  );

  if (options.skipInstall) {
    console.log(
      `   ${chalk.gray(targetDir !== "." ? "4." : "3.")} pnpm install`
    );
    console.log(`   ${chalk.gray(targetDir !== "." ? "5." : "4.")} npm start`);
  } else {
    console.log(`   ${chalk.gray(targetDir !== "." ? "4." : "3.")} npm start`);
  }

  console.log();
  console.log(
    chalk.gray(
      "💡 Need help? Check the README.md file for detailed setup instructions."
    )
  );
  console.log();
}

// Directly run the main function when this file is executed directly
if (
  import.meta.url &&
  process.argv[1] &&
  (import.meta.url.endsWith(process.argv[1]) ||
    process.argv[1].endsWith("index.js") ||
    process.argv[1].endsWith("create-agent"))
) {
  main().catch((error) => {
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  });
}
