import type { LanguageModelV1 } from "@/types";
import type { ContextState, ContextThreadState } from "@/types/context";
import type { LLMGenerateSettings } from "@/types/models";
import type {
  ActionResultMemory,
  RunMemory,
  StepMemory,
  ToolResultMemory,
  WorkingMemoryCtx,
} from "@/types/wm";
import type { DeferredPromise } from "p-defer";
import pDefer from "p-defer";
import type { ErrorRef } from "./handlers/errors";
import type { AnyMemory } from "@/types/memory";

// interface MemoryApi = {
//   append(): this
// }

export type EngineState<Components> = {
  running: boolean;

  chain: AnyMemory[];

  __queue: AnyMemory[];

  wm: WorkingMemoryCtx;
  ctx: ContextState;

  components: Components;
  promises: Promise<any>[];

  errors: ErrorRef[];

  results: Promise<ActionResultMemory | ToolResultMemory>[];

  params?: Partial<{
    components: Components;
    model: LanguageModelV1;
    settings: LLMGenerateSettings;
  }>;

  defer: DeferredPromise<AnyMemory[]>;

  run: RunMemory | undefined;
  currentStep: StepMemory | undefined;
  steps: StepMemory[];

  __memories: Map<string, AnyMemory>;
  __threads: ContextThreadState[];
};

// signals, streams, leases
export function createEngineState<Components>({
  ctx,
  wm,
  components,
}: {
  ctx: ContextState;
  wm: WorkingMemoryCtx;
  components: Components;
}): EngineState<Components> {
  return {
    running: false,

    ctx,
    wm,

    chain: [],

    components,

    results: [],
    promises: [],
    errors: [],

    defer: pDefer(),

    run: undefined,
    currentStep: undefined,
    steps: [],

    __memories: new Map(),
    //defer per thread
    __threads: [],
    __queue: [],
  };
}
