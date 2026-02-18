type ModelConfig = {
  assist?: boolean;
  prefix?: string;
  thinkTag?: string;
};

export const modelsResponseConfig: Record<string, ModelConfig> = {
  "o3-mini": {
    assist: false,
    prefix: "",
  },
  "claude-3-7-sonnet-20250219": {},
  "qwen-qwq-32b": {
    prefix: "",
  },
  // "google/gemini-2.0-flash-001": {},
  "deepseek-r1-distill-llama-70b": {
    prefix: "",
    assist: false,
  },
};

export const reasoningModels = [
  "claude-3-7-sonnet-20250219",
  "qwen-qwq-32b",
  "deepseek-r1-distill-llama-70b",
  "o3-mini",
];
