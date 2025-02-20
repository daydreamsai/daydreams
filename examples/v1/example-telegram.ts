import { createGroq } from "@ai-sdk/groq";
import {
  createDreams,
  LogLevel,
  telegram,
  seachWebAction,
  getWeatherAction,
} from "@daydreamsai/core/v1";
import { deepResearch } from "./deep-research/research";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

createDreams({
  logger: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [telegram, deepResearch],
  actions: [seachWebAction, getWeatherAction],
}).start();
