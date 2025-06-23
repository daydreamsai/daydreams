import { extension } from "@daydreamsai/core";
import { analyzeImageAction } from "./images";
import { generateImageAction } from "./images-generate";
import { analyzeVideoAction } from "./videos";

export const genai = extension({
    name: "genai",
    actions: [analyzeImageAction, generateImageAction, analyzeVideoAction],
});

// Re-export actions if they need to be individually accessible elsewhere,
// though typically consumers will just use the 'genai' extension.
export * from "./images";
export * from "./images-generate";
export * from "./videos";