import { z } from "zod";
import { extension, action, type LanguageModelV1 } from "@daydreamsai/core";
import { generateText, type CoreMessage, type ImagePart, type TextPart } from 'ai';

// This schema is for the data the action *expects* as input.
const imageAttachmentSchemaForAction = z.object({
    url: z.string().url().describe("URL of the attachment."),
    filename: z.string().optional().describe("Filename of the attachment."),
    contentType: z.string().optional().describe("MIME type of the attachment."),
    data: z.custom<Buffer>(val => Buffer.isBuffer(val)).optional()
        .describe("Pre-fetched Buffer data, if available and processed by an input extension (e.g., Discord).")
});

// analyzeImage schema
const analyzeImageActionSchema = z.object({
    text: z.string().describe("The text prompt accompanying the image(s)."),
    attachments: z.array(imageAttachmentSchemaForAction)
        .min(1, "At least one image attachment is required.")
        .describe("Array of image attachments to analyze.")
});

// Helper function for multimodal generation, internal to this genai extension
async function internalGenerateMultimodalResponse(
    model: LanguageModelV1,
    inputText: string,
    attachments: Array<{ url: string; filename?: string; contentType?: string; data?: Buffer }> | undefined
): Promise<string> {
    const parts: (TextPart | ImagePart)[] = [{ type: 'text', text: inputText }];

    if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            // Ensure it's an image and we have data or a URL
            if (attachment.contentType && attachment.contentType.startsWith('image/') && (attachment.data || attachment.url)) {
                try {
                    let imageBuffer: Buffer;
                    if (attachment.data) {
                        imageBuffer = attachment.data;
                    } else if (attachment.url) { // Fallback to URL if data is not present
                        const response = await fetch(attachment.url);
                        if (!response.ok) {
                            console.error(`[GenAI Pkg] Failed to fetch image ${attachment.url}: ${response.statusText}`);
                            continue; // Skip this attachment
                        }
                        imageBuffer = Buffer.from(await response.arrayBuffer());
                    } else {
                        // This case should ideally not be hit if the above condition (attachment.data || attachment.url) is met
                        console.warn('[GenAI Pkg] Attachment has no data and no URL after check, skipping.');
                        continue;
                    }
                    parts.push({
                        type: 'image',
                        image: imageBuffer,
                        mimeType: attachment.contentType,
                    });
                } catch (error) {
                    console.error('[GenAI Pkg] Error processing attachment:', error);
                }
            }
        }
    }

    // BOAT: why?? this sucks. need to refact or remove. 05/17/25
    // Check if any images were actually added. If not, and text is short, maybe don't proceed.
    const imagePartsCount = parts.filter(p => p.type === 'image').length;
    if (imagePartsCount === 0 && inputText.length < 10) { // Adjusted minimum text length
        return "No images were processed. Please provide an image or a more descriptive text prompt.";
    }
    if (imagePartsCount > 0 && inputText.trim() === "") {
        inputText = "Describe this image."; // Default prompt if only image is sent
        parts[0] = { type: 'text', text: inputText }; // Update the text part
    }


    const userMessage: CoreMessage = { role: 'user', content: parts };
    const { text } = await generateText({
        model: model,
        messages: [userMessage],
    });
    return text;
}

// The 'analyzeImage' action definition
export const analyzeImageAction = action({
    name: "analyzeImage",
    description: "Analyzes provided text and accompanying image attachments, then generates a relevant textual response. Use this to describe images, answer questions about them, or perform other vision-related tasks.",
    schema: analyzeImageActionSchema,
    async handler(args, _ctx, agent) {
        if (!agent.model) {
            throw new Error("No language model configured on the agent for analyzeImage action.");
        }
        // The attachments in `args.attachments` should directly match what `internalGenerateMultimodalResponse` expects
        return internalGenerateMultimodalResponse(agent.model, args.text, args.attachments);
    },
});

// TO DO: 
// when we finish building out more action integrations, e.g. "videos.ts", let's move
// the export of the extension to the top level of the package 
// (re-export * from ./) in a dedicated "index.ts" file.
// this will make it easier to import the extension into other packages.
// here good time to look into extensions, servives, and exposing bare components if useful

// export const genai = extension({
// name: "genai",
// actions: [analyzeImageAction],
// }); 