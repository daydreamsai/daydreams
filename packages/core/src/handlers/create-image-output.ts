import { z } from "zod";
import {
  experimental_generateImage as generateImage,
  type ImageModel,
} from "ai";
import type {
  Action,
  AnyAgent,
  AnyContext,
  Output,
  OutputRef,
  OutputRefResponse,
  WorkingMemory,
} from "../types";
import type { SharedV2ProviderOptions } from "@ai-sdk/provider";
import { action } from "../utils";
// Using strict ImageModel from AI SDK

// Base fields per AI SDK docs
const imageOutputBaseSchema = z.object({
  prompt: z.string(),
  n: z.number().int().min(1).max(100).optional(),
  size: z
    .union([
      z.string(),
      z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
    ])
    .optional(),
  aspectRatio: z.string().optional(),
  seed: z.number().optional(),
  maxImagesPerCall: z.number().int().min(1).max(100).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  providerOptions: z.record(z.string(), z.any()).optional(),
});

// Accepts either direct fields or a wrapper { content: { ...fields } }
export const imageOutputSchema = z.preprocess((val) => {
  if (val && typeof val === "object") {
    const maybe = val as { content?: unknown };
    if (maybe.content && typeof maybe.content === "object")
      return maybe.content;
  }
  return val;
}, imageOutputBaseSchema);

export type ImageOutputData = z.infer<typeof imageOutputBaseSchema>;

type ImageArtifact = {
  url?: string;
  base64?: string;
  mime?: string;
};

function hasWorkingMemory(x: unknown): x is { workingMemory: WorkingMemory } {
  return typeof x === "object" && x !== null && "workingMemory" in x;
}

// Reserved for future variation/edit flows; not needed for basic generation per SDK docs
// function getCurrentImageSrc(ctx: unknown): string | undefined {
//   if (!hasWorkingMemory(ctx)) return undefined;
//   const current = ctx.workingMemory.currentImage;
//   return current ? current.toString() : undefined;
// }

function buildProviderOptions(
  data: ImageOutputData
): Record<string, unknown> | undefined {
  const { providerOptions } = data;
  if (!providerOptions) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(providerOptions)) out[k] = v;
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeImageArtifacts(result: unknown): ImageArtifact[] {
  const out: ImageArtifact[] = [];

  const tryArtifact = (v: unknown) => {
    if (typeof v !== "object" || v === null) return;
    const maybe = v as Record<string, unknown>;
    const url =
      typeof maybe.url === "string"
        ? maybe.url
        : typeof maybe.imageUrl === "string"
        ? (maybe.imageUrl as string)
        : undefined;
    const base64 =
      typeof maybe.base64 === "string"
        ? maybe.base64
        : typeof maybe.b64 === "string"
        ? (maybe.b64 as string)
        : undefined;
    const mime =
      typeof maybe.mime === "string"
        ? maybe.mime
        : typeof maybe.contentType === "string"
        ? (maybe.contentType as string)
        : undefined;
    if (url || base64) out.push({ url, base64, mime });
  };

  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    if (Array.isArray(obj.images)) {
      for (const item of obj.images as unknown[]) tryArtifact(item);
    } else if (obj.image !== undefined) {
      tryArtifact(obj.image);
    }
  }
  return out;
}

export function createDefaultImageOutput<
  TContext extends AnyContext,
  TAgent extends AnyAgent
>(
  imageModel: ImageModel
): Omit<
  Output<typeof imageOutputSchema, OutputRefResponse, TContext, TAgent>,
  "name"
> {
  return {
    description:
      "Generate or transform images using the configured image model.",
    instructions:
      "Provide a 'prompt'. Optionally supply size/aspectRatio, n, seed, providerOptions. Do not include base64 or binary fields in content.",
    schema: imageOutputSchema,
    async handler(data, ctx, agent) {
      if (!agent.imageModel) {
        agent.logger.warn("agent:image", "imageModel not configured");
        const resp: OutputRefResponse = {
          data: { error: "imageModel not configured" },
          processed: true,
        };
        return resp;
      }

      const prompt = data.prompt;
      const providerOptions = buildProviderOptions(data);

      let result: unknown;
      try {
        const sizeParam =
          typeof data.size === "string"
            ? data.size
            : data.size &&
              typeof (data.size as any).width === "number" &&
              typeof (data.size as any).height === "number"
            ? `${(data.size as any).width}x${(data.size as any).height}`
            : undefined;
        result = await generateImage({
          model: imageModel,
          prompt,
          n: data.n,
          size: sizeParam as `${number}x${number}` | undefined,
          aspectRatio: data.aspectRatio as `${number}:${number}` | undefined,
          seed: data.seed,
          maxImagesPerCall: data.maxImagesPerCall,
          headers: data.headers as Record<string, string> | undefined,
          providerOptions: providerOptions as SharedV2ProviderOptions,
        });
      } catch (error) {
        agent.logger.error("agent:image", "Image generation failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        const resp: OutputRefResponse = {
          data: { error: "image generation failed" },
          processed: true,
        };
        return resp;
      }

      const artifacts = normalizeImageArtifacts(result);
      if (artifacts.length === 0) {
        const resp: OutputRefResponse = {
          data: { error: "no images returned" },
          processed: true,
        };
        return resp;
      }

      const refs: OutputRefResponse[] = artifacts.map((img, idx) => ({
        data: {
          prompt,
          url: img.url,
          mime: img.mime,
          index: idx,
        },
        processed: true,
      }));

      // Set first as current image for reuse if present
      const first = refs[0]?.data as
        | { url?: string; mime?: string }
        | undefined;
      const url = first?.url;
      const mime = first?.mime;
      const src = url;
      if (src && hasWorkingMemory(ctx)) {
        try {
          ctx.workingMemory.currentImage = new URL(src);
        } catch {
          // If URL parsing fails, leave currentImage unchanged
        }
      }

      return refs;
    },
    format(ref: OutputRef) {
      const d = ref.data as Record<string, unknown> | undefined;
      const src = typeof d?.url === "string" ? d.url : "";
      const prompt = typeof d?.prompt === "string" ? d.prompt : undefined;
      const desc = prompt ? ` ${prompt}` : "";
      return `<output name="image" timestamp="${ref.timestamp}" src="${src}">Generated image.${desc}</output>`;
    },
  };
}

// Provide an action alias to improve robustness when models prefer action_call
export function createDefaultImageAction() {
  return action({
    name: "image",
    description:
      "Generate images using the configured image model (action alias).",
    instructions:
      "Use this action to generate one or more images. Provide prompt, size/aspectRatio, n, seed as needed.",
    schema: z.object({
      prompt: z.string(),
      size: z.string().optional(),
      aspectRatio: z.string().optional(),
      n: z.number().optional(),
      seed: z.number().optional(),
      maxImagesPerCall: z.number().optional(),
      headers: z.record(z.string(), z.string()).optional(),
      providerOptions: z.record(z.string(), z.any()).optional(),
    }),
    returns: z.object({
      images: z.array(
        z.object({
          prompt: z.string(),
          url: z.string().optional(),
          mime: z.string().optional(),
          index: z.number(),
        })
      ),
    }),
    async handler(args, ctx, agent) {
      if (!agent.imageModel) {
        agent.logger.warn("agent:image", "imageModel not configured");
        return { images: [] };
      }

      // Progress: queued
      try {
        ctx.emit?.("image:progress", {
          status: "queued",
          prompt: args.prompt,
        });
      } catch {}

      const providerOptions = buildProviderOptions(args);
      let result: unknown;
      try {
        // Progress: generating
        try {
          ctx.emit?.("image:progress", { status: "generating" });
        } catch {}
        const sizeParam =
          typeof args.size === "string"
            ? args.size
            : args.size &&
              typeof (args.size as any).width === "number" &&
              typeof (args.size as any).height === "number"
            ? `${(args.size as any).width}x${(args.size as any).height}`
            : undefined;
        result = await generateImage({
          model: agent.imageModel,
          prompt: args.prompt,
          n: args.n,
          size: sizeParam as `${number}x${number}` | undefined,
          aspectRatio: args.aspectRatio as `${number}:${number}` | undefined,
          seed: args.seed,
          maxImagesPerCall: args.maxImagesPerCall,
          headers: args.headers,
          providerOptions: providerOptions as
            | SharedV2ProviderOptions
            | undefined,
        });
      } catch (error) {
        agent.logger.error("agent:image", "Image generation failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        try {
          (ctx as any).emit?.("image:progress", {
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        } catch {}
        return { images: [] };
      }

      const artifacts = normalizeImageArtifacts(result);
      // Avoid returning base64 in action result to keep prompt small
      const images = artifacts.map((img, idx) => ({
        prompt: args.prompt,
        url: img.url,
        mime: img.mime,
        index: idx,
      }));

      // Progress: completed
      try {
        (ctx as any).emit?.("image:progress", {
          status: "completed",
          count: images.length,
          urls: images.map((i) => i.url).filter(Boolean),
        });
      } catch {}

      // Set first as current image
      const first = images[0];
      const src = first?.url;
      if (src && hasWorkingMemory(ctx)) {
        try {
          ctx.workingMemory.currentImage = new URL(src);
        } catch {}
      }

      return { images };
    },
    format: (res) => {
      const data = res.data as unknown as {
        images: { url?: string; index: number }[];
      };
      if (!data?.images?.length) return "Generated 0 images.";
      const items = data.images
        .map((i) =>
          i.url ? `image[${i.index}]: ${i.url}` : `image[${i.index}]: (inline)`
        )
        .join("\n");
      return [`Generated ${data.images.length} image(s):`, items].join("\n");
    },
    examples: [
      JSON.stringify({
        prompt: "Santa Claus driving a Cadillac",
        size: "1024x1024",
      }),
    ],
  });
}
