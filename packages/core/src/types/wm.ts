import type { ErrorRef } from "@/engines/handlers/errors";
import type { AnyMemory, Memory, MemoryStore, MemoryStoreCtx } from "./memory";

export interface WorkingMemory {
  memories: Memory[];
}

export type WorkingMemoryStore = MemoryStore<WorkingMemory, any, any, any>;
export type WorkingMemoryCtx = MemoryStoreCtx<WorkingMemoryStore>;

export type MemoryChunk<TWorkingMemory extends AnyMemory = AnyMemory> =
  | { type: "memory"; memory: TWorkingMemory; done: boolean }
  | { type: "content"; id: string; content: string }
  | { type: "data"; id: string; data: any }
  | { type: "done"; id: string };

export type RunMemory = Memory<"run", any, any>;

export type StepMemory = Memory<
  "step",
  {
    step: number;
  }
>;

// save the tree as document
export type LLMRequestMemory = Memory<
  "llm.request",
  {
    modelId: string;
    prompt: string;
  }
>;

// export type LLMPromptMemory = Memory<"llm.request.prompt", string>;

export type LLMResponseMemory = Memory<"llm.response", string, {}>;

export type ErrorMemory = Memory<"error", ErrorRef>;
export type ThoughtMemory = Memory<"thought", string>;
export type EventMemory<Data = any> = Memory<"event", Data>;

export type InputMemory<Data = any> = Memory<"input", Data>;
export type OutputMemory<Data = any> = Memory<"output", Data>;

export type ActionCallMemory<Data = any> = Memory<"action_call", Data>;
export type ActionResultMemory<
  Name extends string = string,
  Data = any,
> = Memory<`action_result.${Name}`, Data>;

export type ToolCallMemory<Data = any> = Memory<"tool_call", Data>;
export type ToolResultMemory<Name extends string = string, Data = any> = Memory<
  `tool_result.${Name}`,
  Data
>;
