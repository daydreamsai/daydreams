import { createGroq } from "@ai-sdk/groq";
import { createDreams, LogLevel } from "@daydreamsai/core";
import { telegram } from "@daydreamsai/telegram";

const groq = createGroq({});

createDreams({
  logLevel: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [telegram],
}).start();
