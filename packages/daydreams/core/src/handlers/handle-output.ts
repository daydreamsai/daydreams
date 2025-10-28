import type { OutputCtxRef, OutputRef } from "../types";
import type { Logger } from "../logger";
import type { WorkingMemory } from "../memory";
import type { ContextState } from "../types";
import type { AnyAgent } from "../types";
import { randomUUIDv7 } from "../utils";

export async function handleOutput({
  outputRef,
  output,
  logger,
  state,
  workingMemory,
  agent,
}: {
  output: OutputCtxRef;
  outputRef: OutputRef;
  logger: Logger;
  workingMemory: WorkingMemory;
  state: ContextState;
  agent: AnyAgent;
}): Promise<OutputRef | OutputRef[]> {
  if (output.handler) {
    const response = await Promise.try(
      output.handler,
      outputRef.data,
      {
        ...state,
        workingMemory,
        outputRef,
      },
      agent
    );

    if (Array.isArray(response)) {
      const refs: OutputRef[] = [];
      for (const res of response) {
        const ref: OutputRef = {
          ...outputRef,
          id: randomUUIDv7(),
          processed: (res as any).processed ?? true,
          ...(res as any),
        };

        ref.formatted = output.format ? output.format(ref) : undefined;
        refs.push(ref);
      }
      return refs;
    } else if (response) {
      const ref: OutputRef = {
        ...outputRef,
        ...(response as any),
        processed: (response as any).processed ?? true,
      };

      ref.formatted = output.format ? output.format(ref) : undefined;

      return ref;
    }
  }

  return {
    ...outputRef,
    formatted: output.format ? output.format(outputRef.data) : undefined,
    processed: true,
  };
}
