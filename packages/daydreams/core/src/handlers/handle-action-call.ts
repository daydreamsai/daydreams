import type {
  ActionCall,
  ActionCallContext,
  AnyAction,
  AnyAgent,
  ActionResult,
} from "../types";
import { randomUUIDv7 } from "../utils";
import type { Logger } from "../logger";
import type { TaskRunner } from "../task";
import { runAction } from "../tasks";

export async function handleActionCall({
  action,
  logger,
  call,
  taskRunner,
  agent,
  abortSignal,
  callCtx,
  queueKey,
}: {
  callCtx: ActionCallContext;
  call: ActionCall;
  action: AnyAction;
  logger: Logger;
  taskRunner: TaskRunner;
  agent: AnyAgent;
  abortSignal?: AbortSignal;
  queueKey?: string;
}): Promise<ActionResult> {
  queueKey =
    queueKey ??
    (action.queueKey
      ? typeof action.queueKey === "function"
        ? action.queueKey(callCtx)
        : action.queueKey
      : undefined);

  const data = await taskRunner.enqueueTask(
    runAction,
    {
      action,
      agent,
      logger,
      ctx: callCtx,
    },
    {
      retry: action.retry,
      abortSignal,
      queueKey,
    }
  );

  const result: ActionResult = {
    ref: "action_result",
    id: randomUUIDv7(),
    callId: call.id,
    data,
    name: call.name,
    timestamp: Date.now(),
    processed: false,
  };

  if (action.format) result.formatted = action.format(result);

  if (callCtx.actionMemory && action.actionState) {
    await agent.memory.kv.set(action.actionState.key, callCtx.actionMemory);
  }

  if (action.onSuccess) {
    await Promise.try(action.onSuccess, result, callCtx, agent);
  }

  return result;
}
