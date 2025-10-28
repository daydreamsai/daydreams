import type { ResponseAdapter } from "../types";
import {
  wrapStream,
  handleStream,
  type StackElement,
  type StackElementChunk,
} from "../handlers";
import { modelsResponseConfig } from "../config";

export const defaultXmlResponseAdapter: ResponseAdapter = {
  prepareStream({ model, stream, isReasoningModel }) {
    const modelId =
      typeof model === "string" ? model : model.modelId || "unknown";
    const cfg = modelsResponseConfig[modelId] || {};
    const prefix =
      cfg.prefix ??
      (isReasoningModel ? cfg.thinkTag ?? "<think>" : "<response>");
    const suffix = "</response>";

    return {
      getTextResponse: async () => {
        const result = await stream.text;
        let cleanedResult = result.replace(
          /<\/response>\s*(<\/response>\s*)*$/g,
          ""
        );
        const needsSuffix = !cleanedResult.includes("</response>");
        return prefix + cleanedResult + (needsSuffix ? suffix : "");
      },
      stream: wrapStream(stream.textStream, prefix, suffix),
    };
  },

  async handleStream({ textStream, index, defaultHandlers, abortSignal }) {
    if (!defaultHandlers) {
      throw new Error(
        "XML adapter requires defaultHandlers (tags/streamHandler)"
      );
    }
    await handleStream(
      textStream as AsyncGenerator<string>,
      index,
      defaultHandlers.tags,
      defaultHandlers.streamHandler as (el: StackElement) => void,
      defaultHandlers.__streamChunkHandler as
        | undefined
        | ((chunk: StackElementChunk) => void),
      abortSignal
    );
  },
};

export default defaultXmlResponseAdapter;
