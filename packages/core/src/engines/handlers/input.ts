import type { AnyAgent } from "@/types/agent";
import type { Input } from "@/types/components";
import type { ContextState } from "@/types/context";
import type { Engine } from "@/types/engine";
import type { InputMemory, WorkingMemoryCtx } from "@/types/wm";
import { parseSchema } from "./parse";
import { NotFoundError, ParsingError } from "./errors";
import { z } from "zod";

export function resolveInput({
  memory,
  inputs,
}: {
  memory: InputMemory;
  inputs: Input[];
}) {
  const input = inputs.find((ref) => ref.name === memory.name);
  if (!input) throw new NotFoundError(memory);
  return input;
}

export async function handleInput({
  memory,
  input,
  ctx,
  wm,
  agent,
  engine,
}: {
  memory: InputMemory;
  input: Input;
  wm: WorkingMemoryCtx;
  ctx: ContextState;
  agent: AnyAgent;
  engine: Engine;
}) {
  let parsed;
  if (memory.content === undefined) {
    try {
      parsed = parseSchema(input.schema ?? z.string(), memory.raw);
    } catch (error) {
      throw new ParsingError(memory, error);
    }
  }

  if (input.handler) {
    const { content } = await Promise.try(
      input.handler,
      parsed ?? memory.content ?? memory.raw,
      {
        ctx,
        wm,
        engine,
        memory,
      },
      agent
    );

    memory.content = content;
  }

  // inputRef.formatted = input.format ? input.format(inputRef) : undefined;
}
