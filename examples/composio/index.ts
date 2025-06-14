/**
 * Basic example demonstrating a simple chat interface using Dreams
 * with a command line interface and Groq's LLM.
 */
import { createGroq } from "@ai-sdk/groq";
import { LogLevel } from "@daydreamsai/core";
import {
  createDreams,
  context,
  render,
  Logger,
  action,
  validateEnv,
} from "@daydreamsai/core";
import { cliExtension } from "@daydreamsai/cli";
import { string, z } from "zod";
import { composio } from "./composio";

const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  })
);

// Initialize Groq client
const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

const template = `
Goal: {{goal}}
Tasks: {{tasks}}
Current Task: {{currentTask}}
`;

type GoalMemory = {
  goal: string;
  tasks: string[];
  currentTask: string;
};

const goalContexts = context({
  type: "goal",
  schema: z.object({
    id: string(),
    initialGoal: z.string(),
    initialTasks: z.array(z.string()),
  }),

  key({ id }) {
    return id;
  },

  create(state) {
    return {
      goal: state.args.initialGoal,
      tasks: state.args.initialTasks ?? [],
      currentTask: state.args.initialTasks?.[0],
    };
  },

  render({ memory }) {
    return render(template, {
      goal: memory.goal,
      tasks: memory.tasks.join("\n"),
      currentTask: memory.currentTask ?? "NONE",
    });
  },
});

createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cliExtension, composio],
  logger: new Logger({ level: LogLevel.ERROR }),
  context: goalContexts,
}).start({ id: "test", initialGoal: "", initialTasks: [] });
