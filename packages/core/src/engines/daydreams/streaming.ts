import {
  alphaSlashRegex,
  parseAttributes,
  xmlStreamParser,
} from "@/engines/xml/parser";
import type { ThoughtMemory, MemoryChunk } from "@/types/wm";
import type { AnyMemory, PartialMemory } from "@/types/memory";
import { z } from "zod";
import type { InferSchema, Pretty, Schema } from "@/types/utils";
import { createMemory, memorySchema } from "@/memory";
import { memory } from "@/definitions";
import {
  stream,
  tokens,
  type Stream,
  type TokenYieldRecord,
  type TokenYieldRecordApi,
  type TokenYieldRecordYield,
} from "@/definitions/stream";

export type StreamElement = {
  index: number;
  tag: string;
  attributes: Record<string, any>;
  content: string;
  done: boolean;
  _depth: number;
};

export type StreamElementChunk =
  | { type: "el"; el: StreamElement }
  | { type: "content"; index: number; content: string }
  | { type: "end"; index: number };

export async function handleStream(
  textStream: AsyncGenerator<string>,
  initialIndex: number,
  tags: Set<string>,
  push: (chunk: StreamElementChunk) => void
) {
  let current: StreamElement | undefined = undefined;
  let stack: StreamElement[] = [];

  let index = initialIndex;

  const parser = xmlStreamParser(tags, (tag, isClosingTag) => {
    if (
      current?.tag === tag &&
      !isClosingTag &&
      ["think", "response", "reasoning"].includes(tag)
    ) {
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
        push({ type: "end", index: current.index });
        current = undefined;
      }

      // force closed
      const closed = stack.splice(stackIndex + 1).reverse();

      for (const el of closed) {
        push({ type: "end", index: el.index });
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
        push({ type: "el", el: current });
      }

      if (result.value.type === "end") {
        if (current) {
          push({ type: "end", index: current.index });
          current = stack.pop();
        }
      }

      if (result.value.type === "text") {
        if (current) {
          current.content += result.value.content;
          push({
            type: "content",
            index: current.index,
            content: result.value.content,
          });
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
        push({ type: "el", el });
      }

      result = parser.next();
    }
  }

  for await (const chunk of textStream) {
    // console.log({ responseChunk: chunk });
    handleChunk(chunk);
  }

  parser.return?.();
}

const defaultTags = new Set([
  "think",
  "thinking",
  "response",
  "output",
  "action_call",
  "reasoning",
]);

//flip this
export function createStreamHandler({
  abortSignal,
  onMemoryChunk,
}: {
  abortSignal?: AbortSignal;
  onMemoryChunk: (chunk: MemoryChunk) => void;
}) {
  const state = {
    index: 0,
    memories: new Map<number, PartialMemory & { id: string }>(),
  };

  function upsertMemory<TMemoryItem extends AnyMemory>(
    index: number,
    memory: PartialMemory<TMemoryItem>
  ): TMemoryItem {
    if (!state.memories.has(index)) {
      const newMemory = createMemory<TMemoryItem>(memory);
      state.memories.set(index, newMemory);
      state.index = Math.max(index, state.index);
      return newMemory;
    } else {
      const saved = state.memories.get(index)! as TMemoryItem;
      Object.assign(saved, memory);
      return saved;
    }
  }

  function handleStreamElementChunk(chunk: StreamElementChunk) {
    // console.log({ elementChunk: chunk });
    if (abortSignal?.aborted) return;
    switch (chunk.type) {
      case "el": {
        const { el } = chunk;
        handleStreamElement(el, (memory, done) => {
          onMemoryChunk({
            type: "memory",
            memory,
            done,
          });
        });
        break;
      }

      case "content": {
        const memory = state.memories.get(chunk.index);
        if (memory) {
          onMemoryChunk({
            type: "content",
            id: memory.id,
            content: chunk.content,
          });
        }
        break;
      }

      case "end": {
        const memory = state.memories.get(chunk.index);
        if (memory) {
          onMemoryChunk({
            type: "done",
            id: memory.id,
          });
        }
        break;
      }
    }
  }

  function handleStreamElement(
    el: StreamElement,
    push: (memory: AnyMemory, done: boolean) => void
  ) {
    if (abortSignal?.aborted) return;
    switch (el.tag) {
      case "think":
      case "thinking":
      case "reasoning": {
        const memory = upsertMemory<ThoughtMemory>(el.index, {
          kind: "thought",
          raw: el.content,
        });
        push(memory, el.done);
        break;
      }
      case "action_call":
      case "tool_call":
      case "output": {
        const { name, ...params } = el.attributes;
        const memory = upsertMemory(el.index, {
          kind: el.tag,
          name,
          raw: el.content,
          metadata: {
            params,
          },
        });
        push(memory, el.done);
        break;
      }
      default:
        break;
    }
  }

  return {
    state,
    tags: defaultTags,
    streamHandler: handleStreamElementChunk,
  };
}

// const streamElementSchema = z.object({
//   index: z.number(),
//   tag: z.string(),
//   attributes: z.record(z.string()),
//   content: z.string(),
//   done: z.boolean(),
//   _depth: z.number(),
// });

// const xmlStreamElementTokens = tokens({
//   element: streamElementSchema,
//   content: { index: z.number(), content: z.string() },
//   end: { index: z.number() },
// });

// const xmlStreamTokens = tokens({
//   element: {
//     name: z.string(),
//     attributes: z.record(z.string()),
//     done: z.boolean().default(false).optional(),
//   },
//   end: { name: z.string() },
//   text: z.string(),
// });

// const memoryChunkTokens = tokens({
//   memory: z.object({
//     memory: memorySchema,
//     done: z.boolean().default(false).optional(),
//   }),
//   content: { id: z.string(), content: z.string() },
//   data: { id: z.string(), content: z.any() },
//   done: { id: z.string() },
// });

// function yields<TTokenYieldRecord extends TokenYieldRecord<any>>(
//   record: TTokenYieldRecord
// ): TTokenYieldRecord extends TokenYieldRecord<infer Record>
//   ? {
//       [Key in keyof Record]: { type: Key; data: InferSchema<Record[Key]> };
//     }[keyof Record]
//   : never {
//   return {} as any;
// }

// const t = yields(memoryChunkTokens);

// type T = TokenYieldRecordYield<typeof xmlStreamElementTokens>;

// const test: "foo" | "bar" = "bar";

// function from<Next = any>(
//   next: Next
// ): <
//   TSchema extends Schema = Schema,
//   TYield extends Schema | Record<string, Schema> = Schema,
//   TReturn extends Schema = Schema,
// >(
//   config: Omit<Stream<TSchema, TYield, Next, TReturn>, "next">
// ) => Stream<TSchema, TYield, Next, TReturn> {
//   return <
//     TSchema extends Schema = Schema,
//     TYield extends Schema | Record<string, Schema> = Schema,
//     TReturn extends Schema = Schema,
//   >(
//     config: Omit<Stream<TSchema, TYield, Next, TReturn>, "next">
//   ) => {
//     return stream<TSchema, TYield, Next, TReturn>({
//       next,
//       ...config,
//     });
//   };
// }

// function match<
//   RecordKey extends string,
//   ARecord extends { [key in RecordKey]: string },
//   ReturnType = any,
// >(
//   key: RecordKey,
//   record: ARecord,
//   fns: {
//     [Key in ARecord[RecordKey]]: (
//       params: ARecord extends { [key in RecordKey]: Key } ? ARecord : never
//     ) => ReturnType;
//   }
// ): ReturnType {
//   return {} as any;
// }

// // match("type", yields(xmlStreamElementTokens), {
// //   content: (item) => {},
// //   element: (item) => {},
// //   end: (item) => {},
// // });

// const memoryChunkStream = from(yields(xmlStreamElementTokens))({
//   args: { abortSignal: z.instanceof(AbortSignal) },
//   yields: memoryChunkTokens,
//   returns: z.void(),
//   async *handler({ abortSignal }, { tokens }) {
//     const state = {
//       index: 0,
//       memories: new Map<number, PartialMemory & { id: string }>(),
//     };

//     function upsertMemory(el: StreamElement): AnyMemory {
//       const { name, ...params } = el.attributes;
//       const partial: PartialMemory<AnyMemory> = {
//         kind: el.tag,
//         name,
//         raw: el.content,
//         metadata: {
//           params,
//         },
//       };

//       if (!state.memories.has(el.index)) {
//         const newMemory = createMemory<AnyMemory>(partial);
//         state.memories.set(el.index, newMemory);
//         state.index = Math.max(el.index, state.index);
//         return newMemory;
//       } else {
//         const saved = state.memories.get(el.index)! as AnyMemory;
//         Object.assign(saved, partial);
//         return saved;
//       }
//     }

//     while (true) {
//       if (abortSignal?.aborted) return;
//       const chunk = yield;
//       if (!chunk) return;

//       switch (chunk.type) {
//         case "element": {
//           yield tokens.memory({
//             memory: upsertMemory(chunk.data),
//             done: chunk.data.done,
//           });
//           break;
//         }
//         case "content": {
//           const memory = state.memories.get(chunk.data.index);
//           if (memory) {
//             yield tokens.content({
//               id: memory.id,
//               content: chunk.data.content,
//             });
//           }
//           break;
//         }
//         case "end": {
//           const memory = state.memories.get(chunk.data.index);
//           if (memory)
//             yield tokens.done({
//               id: memory.id,
//             });
//           break;
//         }
//       }
//     }
//   },
// });

// function yieldApi<YieldRecord extends Record<string, any>>(
//   a: YieldRecord
// ): TokenYieldRecordApi<YieldRecord> {
//   return {} as any;
// }

// const memoryStream = memoryChunkStream.handler(
//   { abortSignal: new AbortController().signal },
//   {
//     stream: memoryChunkStream,
//     tokens: yieldApi(memoryChunkStream.yields),
//   }
// );

// memoryStream.next();

// function joinRecords<
//   ARecord extends Record<string, any>,
//   BRecord extends Record<string, any>,
// >(a: ARecord, b: BRecord): Pretty<ARecord & BRecord> {
//   return {
//     ...a,
//     ...b,
//   };
// }

// async function* handler(): AsyncGenerator<
//   "yess" | undefined,
//   void,
//   string | void
// > {
//   const t = yield;
//   yield "yess";
// }

// const streaz = handler();

// const res = await memoryStream.next({
//   type: "content",
//   data: { index: 0, content: "" },
// });

// // memoryStream.return();

// const wrappers = ["'", "`", "(", ")"];

// const xmlTokenStream = stream({
//   args: {
//     tags: z.set(z.string()),
//     shouldParse: z
//       .function()
//       .args(z.string(), z.boolean())
//       .returns(z.boolean()),
//   },
//   next: z.string(),
//   yields: xmlStreamTokens,
//   returns: z.any(),

//   *handler({ tags, shouldParse }, { tokens }) {
//     let buffer = "";
//     let textContent = "";
//     let cachedLastContent = "";

//     while (true) {
//       // yield tokens.text({ content: "test" });
//       // yield
//       const chunk = yield;
//       if (!chunk) continue;

//       buffer += chunk;

//       while (buffer.length > 0) {
//         const tagStart = buffer.indexOf("<");
//         // detect wrapped tags ex:'<tag> and skip it
//         if (
//           tagStart === 0 &&
//           cachedLastContent &&
//           wrappers.includes(cachedLastContent.at(-1)!)
//         ) {
//           textContent += buffer[0];
//           buffer = buffer.slice(1);
//           continue;
//         }

//         if (tagStart > 0) {
//           if (wrappers.includes(buffer[tagStart - 1])) {
//             textContent += buffer.slice(0, tagStart + 1);
//             buffer = buffer.slice(tagStart + 1);
//           } else {
//             textContent += buffer.slice(0, tagStart);
//             buffer = buffer.slice(tagStart);
//           }

//           if (textContent.length > 0) {
//             yield tokens.text(textContent);
//             cachedLastContent = textContent;
//             textContent = "";
//           }

//           continue;
//         }

//         // todo: regex performance
//         if (
//           tagStart === -1 ||
//           (buffer.length > 1 && !alphaSlashRegex.test(buffer[tagStart + 1]))
//         ) {
//           textContent += buffer;
//           buffer = "";
//           break;
//         }

//         const tagEnd = buffer.indexOf(">", tagStart);
//         if (tagEnd === -1) {
//           break;
//         }

//         // wait for more content to detect wrapper
//         if (buffer.length === tagEnd) break;

//         if (wrappers.includes(buffer[tagEnd + 1])) {
//           textContent += buffer.slice(0, tagEnd + 1);
//           buffer = buffer.slice(tagEnd + 1);
//           if (textContent.length > 0) {
//             yield tokens.text(textContent);
//             cachedLastContent = textContent;
//             textContent = "";
//           }
//           break;
//         }

//         let tagContent = buffer.slice(tagStart + 1, tagEnd);
//         const isClosingTag = tagContent.startsWith("/");
//         const tagName = isClosingTag
//           ? tagContent.slice(1).trim().split(" ")[0]
//           : tagContent.trim().split(" ")[0];

//         if (tags.has(tagName) && shouldParse(tagName, isClosingTag)) {
//           // Emit accumulated text if any
//           if (textContent.length > 0) {
//             yield tokens.text(textContent);
//             cachedLastContent = textContent;
//             textContent = "";
//           }

//           if (isClosingTag) {
//             yield tokens.end({ name: tagName });
//           } else {
//             const attributes = parseAttributes(
//               tagContent.slice(tagName.length)
//             );
//             if (tagContent.endsWith("/")) {
//               yield tokens.element({ name: tagName, attributes, done: true });
//             } else {
//               yield tokens.element({ name: tagName, attributes });
//             }
//           }
//         } else {
//           // Not a tag we care about, treat as text
//           textContent += buffer.slice(0, tagEnd + 1);
//         }

//         buffer = buffer.slice(tagEnd + 1);
//       }

//       if (textContent.length > 0) {
//         yield tokens.text(textContent);
//         cachedLastContent = textContent;
//         textContent = "";
//       }
//       return;
//     }
//   },
// });
