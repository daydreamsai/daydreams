import { createDreams, context, LogLevel } from "@daydreamsai/core";
import { openai } from "@ai-sdk/openai";
import z from "zod";

// Minimal chat context
const chatContext = context({
  type: "chat",
  schema: z.object({ userId: z.string() }),
  description: "Simple chat context for demonstrating image generation.",
});

// Create an agent with a text model and an image model
const agent = createDreams({
  logLevel: LogLevel.TRACE,

  // Text model used for reasoning and producing outputs
  model: openai("gpt-4o-mini"),

  // Image model used when the model requests the built-in `image` output
  imageModel: openai.image("dall-e-3"),

  // Register our context
  contexts: [chatContext],

  // Add a basic text input for driving the conversation
  inputs: {
    text: {
      schema: z.string(),
      description: "Plain text input",
    },
  },

  // Minimal text output so the model can reply with text alongside image
  outputs: {
    text: {
      description: "Plain text output",
      schema: z.object({ content: z.string() }),
      format: (ref) =>
        `<output name="text">${(ref.data as any)?.content ?? ""}</output>`,
    },
  },
});

await agent.start();

// Ask the agent to generate an image using the `image` output
const logs = await agent.send({
  context: chatContext,
  args: { userId: "demo" },
  input: {
    type: "text",
    data: "Generate an image of 'Santa Claus driving a Cadillac' at size 1024x1024 using the image output.",
  },
});

// Extract image outputs from the run
const imageOutputs = logs.filter(
  (l): l is Extract<typeof l, { ref: "output"; name: string; data: any }> =>
    (l as any).ref === "output" && (l as any).name === "image"
);

for (const out of imageOutputs) {
  const d = out.data as any;
  const url = typeof d?.url === "string" ? d.url : undefined;
  const base64 = typeof d?.base64 === "string" ? d.base64 : undefined;
  console.log("Image generated:", {
    prompt: d?.prompt,
    url,
    base64Length: base64?.length,
  });
}
