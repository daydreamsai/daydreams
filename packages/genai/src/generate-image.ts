import { z } from "zod";
import {
    action,
    type LanguageModelV1,
    type InferActionArguments
} from "@daydreamsai/core";
import { generateText } from "ai";
import { Buffer } from "buffer"; // Needed for base64 decoding
// Assuming FormData is available (standard in Node 18+ or via polyfill for actions)

interface MyFileFromApi {
    name?: string;
    mimeType: string;
    base64Data: string | undefined;
    url?: string;
}

const generateImageActionSchema = z.object({
    prompt: z.string().describe("The text prompt to generate an image from."),
});

// Updated schema for the returned image object
const generatedImageSchema = z.object({
    name: z.string().describe("Filename of the generated image."),
    mimeType: z.string().describe("MIME type of the generated image."),
    url: z.string().url().describe("URL of the uploaded image on Catbox."), // Changed from content to url
});

type HandlerOutput = z.infer<typeof generatedImageSchema>[];
const actionReturnSchema = z.object({
    name: z.string().describe("Filename of the generated image."),
    mimeType: z.string().describe("MIME type of the generated image."),
    url: z.string().url().describe("URL of the uploaded image on Catbox."), // Changed from content to url
});

const CATBOX_API_URL = "https://catbox.moe/user/api.php";

export const generateImageAction = action({
    name: "generateImage",
    description: "Generates an image based on a textual prompt using the agent's configured model, uploads it to a hosting service (Catbox.moe), and returns an object containing the image URL, name, and MIME type.",
    schema: generateImageActionSchema,
    returns: actionReturnSchema,
    async handler(
        args: InferActionArguments<typeof generateImageActionSchema>,
        _ctx: any,
        _agent: any
    ): Promise<{ images: HandlerOutput }> {
        const { prompt } = args;
        const model = _agent.model as LanguageModelV1;

        if (!model) {
            throw new Error("No language model configured on the agent for generateImage action.");
        }

        console.log(`[GenAI Pkg] Sending prompt to Google: "${prompt}"`);
        const result = await generateText({
            model: model,
            providerOptions: {
                google: { responseModalities: ['TEXT', 'IMAGE'] },
            },
            prompt: prompt,
        });

        if (result.text) {
            console.log(`[GenAI Pkg] Text response from generateText: ${result.text}`);
        }

        const generatedImages: HandlerOutput = [];
        const filesFromResult = result.files as unknown as MyFileFromApi[] | undefined;

        if (filesFromResult && filesFromResult.length > 0) {
            for (const file of filesFromResult) {
                if (file && file.mimeType && file.mimeType.startsWith('image/') && typeof file.base64Data === 'string' && file.base64Data.length > 0) {
                    try {
                        const imageBuffer = Buffer.from(file.base64Data, 'base64');
                        const originalFileName = file.name || `generated_image_${Date.now()}.${file.mimeType.split('/')[1] || 'png'}`;

                        const formData = new FormData();
                        formData.append("reqtype", "fileupload");
                        // formData.append("userhash", ""); // Omitted for anonymous upload
                        formData.append("fileToUpload", new Blob([imageBuffer], { type: file.mimeType }), originalFileName);

                        console.log(`[GenAI Pkg] Uploading ${originalFileName} to Catbox...`);
                        const catboxResponse = await fetch(CATBOX_API_URL, {
                            method: 'POST',
                            body: formData,
                        });

                        if (!catboxResponse.ok) {
                            const errorText = await catboxResponse.text();
                            throw new Error(`Catbox API error: ${catboxResponse.status} - ${errorText}`);
                        }

                        const catboxUrl = await catboxResponse.text();
                        // Ensure catboxUrl is a valid URL (it should be, directly)
                        if (!catboxUrl.startsWith('http')) {
                            throw new Error(`Catbox returned an invalid URL: ${catboxUrl}`);
                        }

                        console.log(`[GenAI Pkg] Uploaded to Catbox: ${catboxUrl}`);
                        generatedImages.push({
                            name: originalFileName,
                            mimeType: file.mimeType,
                            url: catboxUrl,
                        });

                    } catch (uploadError) {
                        console.error(`[GenAI Pkg] Failed to upload image to Catbox or process it: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`, uploadError);
                        // Optionally, decide if you want to skip this image or stop the process
                    }
                } else {
                }
            }
        }
        return { images: generatedImages };
    },
});

export { generateImageActionSchema, generatedImageSchema, actionReturnSchema };
