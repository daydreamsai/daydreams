import { z } from "zod";
import { action, type Agent } from "@daydreamsai/core";
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

// Schema for the 'generateImage' action
const generateImageActionSchema = z.object({
    text: z.string().describe("The text prompt to generate the image from."),
    model: z
        .string()
        .optional()
        .default("gemini-2.0-flash-preview-image-generation")
        .describe("The model to use for generation."),
});

const generateImageReturnSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    attachments: z.array(
        z.object({
            url: z.string().describe("The local path to the generated image."),
            filename: z.string().optional(),
        })
    ),
    prompt: z.string(),
});

// The 'generateImage' action definition
export const generateImageAction = action({
    name: "generateImage",
    description:
        "Generates an image and saves it locally. The result can be sent to Discord using the 'discord:message-with-attachments' output.",
    schema: generateImageActionSchema,
    returns: generateImageReturnSchema,
    async handler(data, ctx: any, agent: Agent) {
        const { text, model: modelId } = data;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not set.");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        console.log(`[GenAI Pkg] Generating image with prompt: "${text}"`);

        const response = await ai.models.generateContent({
            model: modelId,
            contents: text,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        if (
            !response.candidates ||
            response.candidates.length === 0 ||
            !response.candidates[0].content ||
            !response.candidates[0].content.parts
        ) {
            throw new Error("Invalid response from image generation API.");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                const imageData = part.inlineData.data;
                const buffer = Buffer.from(imageData, "base64");

                const tempDir = os.tmpdir();
                const filename = `daydreams-img-${Date.now()}.png`;
                const filepath = path.join(tempDir, filename);
                await fs.writeFile(filepath, buffer);

                return {
                    success: true,
                    message: `Image generated successfully and saved to ${filepath}`,
                    attachments: [
                        {
                            url: filepath,
                            filename,
                        },
                    ],
                    prompt: text,
                };
            }
        }

        throw new Error("Image generation failed. No image data received.");
    },
}); 