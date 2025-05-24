import { z } from "zod";
import { action, type LanguageModelV1, type Agent } from "@daydreamsai/core";
import {
  generateText,
  type CoreMessage,
  type TextPart,
  type FilePart as VercelFilePart,
} from "ai";

const imageAttachmentSchema = z.object({
  url: z.string().url().describe("URL of the image attachment."),
  filename: z.string().optional().describe("Filename of the image attachment."),
  contentType: z
    .string()
    .describe("MIME type of the image attachment (e.g., 'image/png')."),
});

// Schema for the analyzeImage action
const analyzeImageActionSchema = z.object({
  text: z.string().describe("The text prompt accompanying the image(s)."),
  attachments: z
    .array(imageAttachmentSchema)
    .min(1, "At least one image attachment is required.")
    .describe("Array of image attachments to analyze."),
});
// Helper function for multimodal generation with image
async function internalGenerateImageResponse(
  model: LanguageModelV1,
  inputText: string,
  attachments:
    | Array<{
      url: string;
      filename?: string;
      contentType: string;
      data?: Buffer;
    }>
    | undefined
): Promise<string> {
  const parts: (TextPart | VercelFilePart)[] = [
    { type: "text", text: inputText },
  ];

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      // Ensure we have contentType, and a URL or data for the image
      if (
        attachment.contentType.startsWith("image/") &&
        (attachment.url || attachment.data) // Check if either URL or data is present
      ) {
        try {
          if (attachment.url) {
            // Prioritize URL: AI SDK should download it
            parts.push({
              type: "file",
              data: attachment.url, // Pass the URL string directly
              mimeType: attachment.contentType,
            });
          } else if (attachment.data) {
            // Fallback to Buffer data if no URL but data exists
            parts.push({
              type: "file",
              data: attachment.data, // Pass the Buffer directly
              mimeType: attachment.contentType,
            });
          } else {
            // This case should ideally not be reached if the outer condition is met,
            // but as a safeguard:
            console.warn(
              "[GenAI Pkg] Image attachment has no URL and no data, skipping."
            );
            continue;
          }
        } catch (error) {
          console.error(
            "[GenAI Pkg] Error processing image attachment:",
            error
          );
        }
      }
    }
  }

  const filePartsCount = parts.filter((p) => p.type === "file").length;
  if (filePartsCount === 0) {
    return "No images were processed. Please provide an image attachment with a valid image MIME type.";
  }
  if (filePartsCount > 0 && inputText.trim() === "") {
    inputText = "Describe this image."; // Default prompt if only image is sent
    // Update the text part; ensure it's the first element if it exists or add it.
    const textPartIndex = parts.findIndex((p) => p.type === "text");
    if (textPartIndex !== -1) {
      parts[textPartIndex] = { type: "text", text: inputText };
    } else {
      parts.unshift({ type: "text", text: inputText });
    }
  }

  const userMessage: CoreMessage = { role: "user", content: parts };
  const { text } = await generateText({
    model: model,
    messages: [userMessage],
  });
  return text;
}

// The 'analyzeImage' action definition
export const analyzeImageAction = action({
  name: "analyzeImage",
  description:
    "Analyzes provided text and accompanying image attachments, then generates a relevant textual response. Use this to describe images, answer questions about them, or perform other image-related tasks.",
  schema: analyzeImageActionSchema,
  async handler(data, _ctx: any, agent: Agent) {
    const { text, attachments } = data;

    if (!agent.model) {
      throw new Error(
        "No language model configured on the agent for analyzeImage action."
      );
    }
    return internalGenerateImageResponse(agent.model, text, attachments);
  },
});