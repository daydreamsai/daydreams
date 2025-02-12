import { z } from "zod";
import type { AnyAgent, WorkingMemory } from "./types";

export type Instruction = string | string[];

export type AnyContext = Context<any, any, any, any>;

export type InferContextMemory<TContext extends AnyContext> =
  TContext extends Context<infer Memory> ? Memory : never;

export type InferContextCtx<TContext extends AnyContext> =
  TContext extends Context<any, any, infer Ctx> ? Ctx : never;

export type Context<
  Memory extends WorkingMemory = WorkingMemory,
  Args extends z.ZodTypeAny = never,
  Ctx = any,
  Exports = any,
> = {
  type: string;
  schema: Args;
  description?: string;
  key: (args: z.infer<Args>) => string;

  setup: (args: z.infer<Args>, agent: AnyAgent) => Promise<Ctx> | Ctx;

  instructions?:
    | Instruction
    | ((params: { key: string; args: z.infer<Args> }, ctx: Ctx) => Instruction);

  // memory
  create?: (params: { key: string; args: z.infer<Args> }, ctx: Ctx) => Memory;
  load?: (
    params: { key: string; args: z.infer<Args> },
    ctx: Ctx
  ) => Promise<Memory>;
  save?: (
    params: {
      key: string;
      args: z.infer<Args>;
      memory: Memory;
    },
    ctx: Ctx
  ) => Promise<void>;

  render?: (memory: Memory, ctx: Ctx) => string | string[];

  // exports?: () => Exports;
};

export function context<
  Memory extends WorkingMemory = WorkingMemory,
  Args extends z.ZodTypeAny = any,
  Ctx = any,
  Exports = any,
>(ctx: Context<Memory, Args, Ctx, Exports>) {
  return ctx;
}
