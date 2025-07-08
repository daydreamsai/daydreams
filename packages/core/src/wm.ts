import { z } from "zod";
import type { WorkingMemory } from "./types/wm";
import { memoryStore } from "./definitions";
import type { AnyMemory, Memory } from "./types/memory";
import {
  customMemoryFactory,
  memories,
  memoryRef,
  memorySchema,
  mutation,
} from "./memory";

export const workingMemories = memories({
  run: {},

  step: { step: z.number() },

  thought: z.string(),

  error: {
    memory: memoryRef,
    error: z
      .object({
        name: z.string(),
        message: z.string(),
      })
      .or(z.string())
      .or(z.unknown()),
  },

  state: customMemoryFactory,

  event: customMemoryFactory,

  input: customMemoryFactory,
  output: customMemoryFactory,
  tool_call: customMemoryFactory,
  tool_result: customMemoryFactory,
  action_call: customMemoryFactory,
  action_result: customMemoryFactory,
});

export const workingMemory = memoryStore({
  name: "wm",
  schema: { id: z.string() },
  memories: workingMemories,
  create: (): WorkingMemory => {
    return {
      memories: [],
    };
  },
});

export const pushToWorkingMemory = mutation({
  store: workingMemory,
  name: "push",
  schema: {
    memory: memorySchema,
  },
  id: (params) => [params.memory.kind, params.memory.id].join(":"),
  handler: (params, { data }) => {
    data.memories.push(params.memory as AnyMemory);
  },
});

// function createMemoryStore<TMemoryStore extends AnyMemoryStore>(
//   config: TMemoryStore,
//   args: InferMemoryStoreArgs<TMemoryStore>,
//   agent: AnyAgent
// ): MemoryStoreCtx<TMemoryStore> & {
//   mutate: <TMutation extends MemoryMutation>(
//     mutation: TMutation,
//     args: InferMemoryMutationArgs<TMutation>
//   ) => Promise<void>;
// } {
//   return {} as any;
// }

// const store = createMemoryStore(workingMemory, { id: "2" }, createAgent({}));

// pushToWorkingMemory.handler(
//   {
//     memory: workingMemories.run("test"),
//   },
//   store
// );

// store.mutate(pushToWorkingMemory, {
//   memory: workingMemories.run("test"),
// });
