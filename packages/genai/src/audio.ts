import { z } from "zod";
import { action, type LanguageModelV1, type Agent } from "@daydreamsai/core";
import {
    generateText,
    type CoreMessage,
    type TextPart,
    type FilePart as VercelFilePart,
} from "ai";

// Schema for audio attachments
const audioAttachmentSchema = z.object({
    url: z.string().url().describe("URL of the audio attachment."),
    filename: z.string().optional().describe("Filename of the audio attachment."),
    contentType: z
        .string()
        .describe("MIME type of the audio attachment (e.g., 'audio/mpeg')."),
    data: z
        .custom<Buffer>((val) => Buffer.isBuffer(val))
        .optional()
        .describe(
            "Pre-fetched Buffer data, if available and processed by an input extension."
        ),
});

// Schema for the analyzeAudio action
const analyzeAudioActionSchema = z.object({
    text: z.string().describe("The text prompt accompanying the audio(s)."),
    attachments: z
        .array(audioAttachmentSchema)
        .min(1, "At least one audio attachment is required.")
        .describe("Array of audio attachments to analyze."),
});

// Helper function for multimodal generation with audio
async function internalGenerateAudioResponse(
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
            // Ensure we have contentType, and a URL or data for the audio
            if (
                attachment.contentType.startsWith("audio/") &&
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
                            "[GenAI Pkg] audio attachment has no URL and no data, skipping."
                        );
                        continue;
                    }
                } catch (error) {
                    console.error(
                        "[GenAI Pkg] Error processing audio attachment:",
                        error
                    );
                }
            }
        }
    }

    const filePartsCount = parts.filter((p) => p.type === "file").length;
    if (filePartsCount === 0) {
        return "No audios were processed. Please provide an audio attachment with a valid audio MIME type.";
    }
    if (filePartsCount > 0 && inputText.trim() === "") {
        inputText = "Describe this audio."; // Default prompt if only audio is sent
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

// The 'analyzeAudio' action definition
export const analyzeAudioAction = action({
    name: "analyzeAudio",
    description:
        "Analyzes provided text and accompanying audio attachments, then generates a relevant textual response. Use this to describe audio, answer questions about them, or perform other audio-related tasks.",
    schema: analyzeAudioActionSchema,
    async handler(data, _ctx: any, agent: Agent) {
        const { text, attachments } = data;

        if (!agent.model) {
            throw new Error(
                "No language model configured on the agent for analyzeAudio action."
            );
        }
        return internalGenerateAudioResponse(agent.model, text, attachments);
    },
});
