import {
  createDreams,
  context,
  createPromptBuilder,
  type PromptBuildContext,
  type ResponseAdapter,
  input,
  output,
  createOutputRef,
  randomUUIDv7,
  Logger,
  LogLevel,
} from "@daydreamsai/core";
import { openai } from "@ai-sdk/openai";
import * as z from "zod";

// Simple context
const demo = context({
  type: "json-demo",
  schema: z.object({ id: z.string() }),
  create: () => ({ count: 0 }),
  onRun: async (ctx) => {
    ctx.memory.count++;
  },
});

// I/O
const textIn = input({
  schema: z.string(),
  handler: async (d) => ({ data: d }),
});
const textOut = output({
  schema: z.object({ content: z.string() }),
  handler: async (data) => {
    console.log("[json-adapter output]", data.content);
    return { data, processed: true };
  },
});

// Prompt builder instructs the model to return JSON
const jsonBuilder = createPromptBuilder(
  "json-demo",
  ({ workingMemory, contexts }: PromptBuildContext) => {
    const lastInput = workingMemory.inputs.at(-1)?.content ?? "";
    const prompt = `You are a helpful assistant. Reply ONLY with a single JSON object:
{
  "reasoning": string,
  "outputs": [ { "name": "text", "data": { "content": string } } ]
}
User: ${lastInput}`;
    return { prompt };
  }
);

// JSON response adapter (no XML). Buffers the stream, parses JSON, and pushes logs.
const jsonResponseAdapter: ResponseAdapter = {
  prepareStream({ stream }) {
    return {
      stream: stream.textStream,
      getTextResponse: async () => await stream.text,
    };
  },
  async handleStream({ textStream, index, pushLog }) {
    let buf = "";
    for await (const chunk of textStream as AsyncGenerator<string>) {
      buf += chunk;
    }

    try {
      const parsed = JSON.parse(buf);
      const now = Date.now();

      if (parsed.reasoning && typeof parsed.reasoning === "string") {
        pushLog(
          {
            id: randomUUIDv7(),
            ref: "thought",
            content: parsed.reasoning,
            processed: true,
            timestamp: now,
          },
          true
        );
      }

      const outs = Array.isArray(parsed.outputs) ? parsed.outputs : [];
      for (const o of outs) {
        if (!o || !o.name) continue;
        const data = o.data ?? {};
        const ref = createOutputRef({
          name: o.name,
          data,
          content: JSON.stringify(data),
          processed: false,
        });
        // engine will parse and process this output
        pushLog(ref, true);
      }
    } catch (e) {
      // If JSON parse fails, push the raw content as a text output
      const data = { content: buf };
      pushLog(
        createOutputRef({
          name: "text",
          data,
          content: JSON.stringify(data),
          processed: false,
        }),
        true
      );
    }
  },
};

const agent = createDreams({
  logger: new Logger({ level: LogLevel.TRACE }),
  model: openai("gpt-4o-mini"),
  prompt: jsonBuilder,
  response: jsonResponseAdapter,
  contexts: [demo],
  inputs: { text: textIn },
  outputs: { text: textOut },
});

async function main() {
  await agent.start();
  await agent.send({
    context: demo,
    args: { id: "1" },
    input: { type: "text", data: "Say hello using JSON schema" },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
