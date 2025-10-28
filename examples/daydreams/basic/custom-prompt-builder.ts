import {
  createDreams,
  context,
  createPromptBuilder,
  type PromptBuildContext,
  output,
  input,
  Logger,
  LogLevel,
} from "@daydreamsai/core";
import * as z from "zod";
import { openai } from "@ai-sdk/openai";

// 1) Define a tiny context
const demoContext = context({
  type: "demo",
  schema: z.object({ sessionId: z.string() }),
  create: () => ({ seen: 0 }),
  onRun: async (ctx) => {
    ctx.memory.seen++;
  },
  render: (state) =>
    `Session: ${state.args.sessionId} | Seen: ${state.memory.seen}`,
});

// 2) Define agent-level I/O to keep the example self-contained
const textInput = input({
  schema: z.string(),
  handler: async (data) => ({ data }),
});

const textOutput = output({
  schema: z.object({ content: z.string() }),
  handler: async (data) => {
    // Print to console when we receive an output
    console.log("[output:text]", data.content);
    return { data: { content: data.content }, processed: true };
  },
});

// 3) Implement a custom PromptBuilder (not tied to the default XML template)
const customPromptBuilder = createPromptBuilder(
  "custom-demo",
  ({ workingMemory, contexts }: PromptBuildContext) => {
    const pendingInputs = (workingMemory.inputs || []).filter(
      (i) => !i.processed
    );
    const contextSummary = contexts
      .map((c) => `${c.context.type}(${c.id})`)
      .join(", ");

    const instructions = [
      "Respond to any pending inputs.",
      "Wrap your response in <response> tags.",
      'Include a <reasoning> block and one <output name="text"> with JSON {"content": string}.',
    ].join(" ");

    const prompt = `
System: You are a helpful assistant.
Context: ${contextSummary || "none"}
Pending Inputs: ${
      pendingInputs.map((i) => String(i.content)).join(" | ") || "none"
    }

${instructions}
`;

    return { prompt };
  }
);

// 4) Create the agent with our custom PromptBuilder
const agent = createDreams({
  logger: new Logger({ level: LogLevel.TRACE }),
  model: openai("gpt-4o-mini"),
  prompt: customPromptBuilder,
  contexts: [demoContext],
  inputs: { text: textInput },
  outputs: { text: textOutput },
});

// 5) Run a minimal demo
async function main() {
  await agent.start();

  await agent.send({
    context: demoContext,
    args: { sessionId: "s-1" },
    input: { type: "text", data: "Hello from custom prompt builder" },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
