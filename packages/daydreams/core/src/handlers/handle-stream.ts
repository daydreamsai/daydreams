import type { Log, LogChunk } from "../types";
import { randomUUIDv7 } from "../utils";
import { xmlStreamParser } from "../parsing";

type PartialLog = Partial<Log> &
  Pick<Log, "ref" | "id" | "timestamp" | "processed">;

export type StackElement = {
  index: number;
  tag: string;
  attributes: Record<string, any>;
  content: string;
  done: boolean;
  _depth: number;
};

export type StackElementChunk =
  | { type: "el"; el: StackElement }
  | { type: "content"; index: number; content: string }
  | { type: "end"; index: number };

export async function handleStream(
  textStream: AsyncGenerator<string>,
  initialIndex: number,
  tags: Set<string>,
  push: (el: StackElement) => void,
  __pushChunk?: (chunk: StackElementChunk) => void,
  abortSignal?: AbortSignal
) {
  let current: StackElement | undefined = undefined;
  let stack: StackElement[] = [];

  let index = initialIndex;

  const parser = xmlStreamParser(tags, (tag, isClosingTag) => {
    if (current?.tag === tag && !isClosingTag && tag === "think") {
      return false;
    }

    if (current?.tag === tag && !isClosingTag && tag === "response") {
      return false;
    }

    if (current?.tag === tag && !isClosingTag && tag === "reasoning") {
      return false;
    }

    if (current?.tag === tag && !isClosingTag) {
      current._depth++;
      return false;
    }

    if (current?.tag === tag && isClosingTag) {
      if (current._depth > 0) {
        current._depth--;
        return false;
      }

      return true;
    }

    if (current === undefined || current?.tag === "response") return true;

    if (isClosingTag && stack.length > 0) {
      const stackIndex = stack.findIndex((el) => el.tag === tag);
      if (stackIndex === -1) return false;

      if (current) {
        push({
          ...current,
          done: true,
        });

        __pushChunk?.({ type: "end", index: current.index });

        current = undefined;
      }

      const closed = stack.splice(stackIndex + 1).reverse();

      for (const el of closed) {
        push({
          ...el,
          done: true,
        });

        __pushChunk?.({ type: "end", index: el.index });
      }

      current = stack.pop();

      return true;
    }

    return false;
  });

  parser.next();

  function handleChunk(chunk: string) {
    let result = parser.next(chunk);
    while (!result.done && result.value) {
      if (result.value.type === "start") {
        if (current) stack.push(current);
        current = {
          index: index++,
          tag: result.value.name,
          attributes: result.value.attributes,
          content: "",
          done: false,
          _depth: 0,
        };

        push(current);

        __pushChunk?.({ type: "el", el: structuredClone(current) });
      }

      if (result.value.type === "end") {
        if (current) {
          push({
            ...current,
            done: true,
          });

          __pushChunk?.({ type: "end", index: current.index });

          current = stack.pop();
        }
      }

      if (result.value.type === "text") {
        if (current) {
          __pushChunk?.({
            type: "content",
            index: current.index,
            content: result.value.content,
          });

          current.content += result.value.content;
          push(current);
        }

        // todo: we need to handle text when !current to a default output?
      }

      if (result.value.type === "self-closing") {
        const el = {
          index: index++,
          tag: result.value.name,
          attributes: result.value.attributes,
          content: "",
          done: true,
          _depth: 0,
        };

        push(el);

        __pushChunk?.({ type: "el", el });
      }
      result = parser.next();
    }
  }

  for await (const chunk of textStream) {
    if (abortSignal?.aborted) break;
    handleChunk(chunk);
  }

  parser.return?.();
}

export async function* wrapStream(
  stream: AsyncIterable<string>,
  prefix: string,
  suffix: string
) {
  yield prefix;
  let streamContent = "";
  for await (const chunk of stream) {
    streamContent += chunk;
    yield chunk;
  }

  // Clean up duplicate closing response tags for streaming
  if (suffix === "</response>") {
    // Count how many closing response tags are already in the content
    const closingTags = (streamContent.match(/<\/response>/g) || []).length;
    if (closingTags === 0) {
      yield suffix;
    }
    // If there are already closing tags, don't add another one
  } else {
    yield suffix;
  }
}

const defaultTags = new Set([
  "think",
  "thinking",
  "response",
  "output",
  "action_call",
  "reasoning",
]);

export function createContextStreamHandler({
  abortSignal,
  pushLog,
  __pushLogChunk,
}: {
  abortSignal?: AbortSignal;
  pushLog: (log: Log, done: boolean) => void;
  __pushLogChunk?: (chunk: LogChunk) => void;
}) {
  const streamState = {
    index: 0,
    logsByIndex: new Map<number, PartialLog>(),
  };

  function getOrCreateRef<
    TLog extends Omit<PartialLog, "id" | "timestamp" | "processed">
  >(
    index: number,
    ref: TLog
  ): TLog & Pick<PartialLog, "id" | "timestamp" | "processed"> {
    if (!streamState.logsByIndex.has(index)) {
      streamState.logsByIndex.set(index, {
        id: randomUUIDv7(),
        timestamp: Date.now(),
        processed: false,
        ...ref,
      });
    }

    streamState.index = Math.max(index, streamState.index);

    return streamState.logsByIndex.get(index)! as TLog &
      Pick<PartialLog, "id" | "timestamp" | "processed">;
  }

  function __streamChunkHandler(chunk: StackElementChunk) {
    if (abortSignal?.aborted) return;

    switch (chunk.type) {
      case "el": {
        const { el } = chunk;

        switch (el.tag) {
          case "think":
          case "thinking":
          case "reasoning": {
            const ref = getOrCreateRef(el.index, {
              ref: "thought",
            });

            __pushLogChunk?.({
              type: "log",
              log: {
                ...ref,
                content: "",
              },
              done: el.done,
            });

            break;
          }

          case "action_call": {
            const ref = getOrCreateRef(el.index, {
              ref: "action_call",
            });

            const { name, ...params } = el.attributes;

            __pushLogChunk?.({
              type: "log",
              log: {
                ...ref,
                name,
                params,
                content: "",
                data: undefined,
                processed: false,
              },
              done: el.done,
            });

            break;
          }

          case "output": {
            const ref = getOrCreateRef(el.index, {
              ref: "output",
            });

            const { name, ...params } = el.attributes;

            __pushLogChunk?.({
              type: "log",
              log: {
                ...ref,
                name,
                params,
                content: "",
                data: undefined,
              },
              done: el.done,
            });

            break;
          }

          default:
            break;
        }

        break;
      }
      case "content": {
        const log = streamState.logsByIndex.get(chunk.index);
        if (log) {
          __pushLogChunk?.({
            type: "content",
            id: log.id,
            content: chunk.content,
          });
        }
        break;
      }

      case "end": {
        const log = streamState.logsByIndex.get(chunk.index);
        if (log) {
          __pushLogChunk?.({
            type: "done",
            id: log.id,
          });
        }
        break;
      }
    }
  }

  function streamHandler(el: StackElement) {
    if (abortSignal?.aborted) return;
    switch (el.tag) {
      case "think":
      case "thinking":
      case "reasoning": {
        const ref = getOrCreateRef(el.index, {
          ref: "thought",
        });
        pushLog(
          {
            ...ref,
            content: el.content,
          },
          el.done
        );
        break;
      }
      case "action_call": {
        const ref = getOrCreateRef(el.index, {
          ref: "action_call",
        });

        const { name, ...params } = el.attributes;

        pushLog(
          {
            ...ref,
            name,
            params,
            content: el.content,
            data: undefined,
            processed: false,
          },
          el.done
        );
        break;
      }
      case "output": {
        const ref = getOrCreateRef(el.index, {
          ref: "output",
        });
        const { name, ...params } = el.attributes;
        pushLog(
          {
            ...ref,
            name,
            params,
            content: el.content,
            data: undefined,
          },
          el.done
        );
        break;
      }
      default:
        break;
    }
  }

  return {
    streamState,
    streamHandler,
    tags: defaultTags,
    __streamChunkHandler,
  };
}
