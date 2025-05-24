import { z } from "zod";
import { action, type LanguageModelV1, type Agent } from "@daydreamsai/core";
import {
  generateText,
  type CoreMessage,
  type TextPart,
  type FilePart as VercelFilePart,
} from "ai";

// Schema for video attachments
const videoAttachmentSchema = z.object({
  url: z.string().url().describe("URL of the video attachment."),
  filename: z.string().optional().describe("Filename of the video attachment."),
  contentType: z
    .string()
    .describe("MIME type of the video attachment (e.g., 'video/mp4')."),
  data: z
    .custom<Buffer>((val) => Buffer.isBuffer(val))
    .optional()
    .describe(
      "Pre-fetched Buffer data, if available and processed by an input extension."
    ),
});

// Schema for the analyzeVideo action
const analyzeVideoActionSchema = z.object({
  text: z.string().describe("The text prompt accompanying the video(s)."),
  attachments: z
    .array(videoAttachmentSchema)
    .min(1, "At least one video attachment is required.")
    .describe("Array of video attachments to analyze."),
});

// Helper function for multimodal generation with video
async function internalGenerateVideoResponse(
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
      // Ensure we have contentType, and a URL or data for the video
      if (
        attachment.contentType.startsWith("video/") &&
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
              "[GenAI Pkg] Video attachment has no URL and no data, skipping."
            );
            continue;
          }
        } catch (error) {
          console.error(
            "[GenAI Pkg] Error processing video attachment:",
            error
          );
        }
      }
    }
  }

  const filePartsCount = parts.filter((p) => p.type === "file").length;
  if (filePartsCount === 0) {
    return "No videos were processed. Please provide a video attachment with a valid video MIME type.";
  }
  if (filePartsCount > 0 && inputText.trim() === "") {
    inputText = "Describe this video."; // Default prompt if only video is sent
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

// The 'analyzeVideo' action definition
export const analyzeVideoAction = action({
  name: "analyzeVideo",
  description:
    "Analyzes provided text and accompanying video attachments, then generates a relevant textual response. Use this to describe videos, answer questions about them, or perform other video-related tasks.",
  schema: analyzeVideoActionSchema,
  async handler(data, _ctx: any, agent: Agent) {
    const { text, attachments } = data;

    if (!agent.model) {
      throw new Error(
        "No language model configured on the agent for analyzeVideo action."
      );
    }
    return internalGenerateVideoResponse(agent.model, text, attachments);
  },
});
