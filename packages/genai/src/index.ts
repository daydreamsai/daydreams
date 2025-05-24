import { extension } from "@daydreamsai/core";
import { analyzeImageAction } from "./images";
import { analyzeVideoAction } from "./videos";
import { generateImageAction } from "./generate-image";

export const genai = extension({
    name: "genai",
    actions: [analyzeImageAction, analyzeVideoAction, generateImageAction],
});

// Re-export actions if they need to be individually accessible elsewhere,
// though typically consumers will just use the 'genai' extension.
export * from "./images";
export * from "./videos";
export * from "./generate-image";