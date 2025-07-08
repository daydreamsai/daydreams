import type { AnyAction } from "./action";
import type { InputConfig, OutputConfig } from "./components";
import type {
  AnyContext,
  ContextRefArray,
  ContextState,
  ContextThreadState,
  InferContextArgs,
} from "./context";
import type { Engine, EngineFactory } from "./engine";
import type { WorkingMemory, MemoryChunk, WorkingMemoryCtx } from "./wm";
import type { MemoryStore, Memory } from "./memory";
import type { LanguageModel, LLMGenerateSettings } from "./models";
import type { System, SystemRefs } from "./system";

export interface RunContextState<
  TContext extends AnyContext = AnyContext,
  TEngine extends Engine = Engine,
> {
  ctx: ContextState<TContext>;
  wm: WorkingMemoryCtx;
  engine: TEngine;
}

export interface Hooks {
  onMemory: (memory: Memory, done: boolean) => void;
  onMemoryChunk: (chunk: MemoryChunk) => void;
}

export type RunParams<
  TContext extends AnyContext,
  SubContextRefs extends AnyContext[],
  Systems extends System[],
> = {
  context: { ref: TContext; args: InferContextArgs<TContext> };

  model?: LanguageModel;

  uses?: {
    actions?: AnyAction[];
    inputs?: Record<string, InputConfig>;
    outputs?: Record<string, OutputConfig>;
    contexts?: ContextRefArray<SubContextRefs>;
  };

  wm?: WorkingMemoryCtx | MemoryStore<WorkingMemory>;

  memories?: Memory[];

  abortSignal?: AbortSignal;

  hooks?: Partial<Hooks>;
  settings?: LLMGenerateSettings;
  systems?: SystemRefs<Systems>;
  engine?: EngineFactory | Engine;
};
