import type { Action, ActionCallContext, AnyAction } from "@/types/action";
import type { AnyAgent } from "@/types/agent";
import { task } from "@/definitions";

function isActionSchemaUndefined(
  action: AnyAction
): action is Action<any, undefined> {
  return action.schema === undefined;
}

export const runActionTask = task({
  name: "agent:run:action",
  async handler({
    ctx,
    action,
    agent,
  }: {
    ctx: ActionCallContext;
    action: Action;
    agent: AnyAgent;
  }) {
    try {
      const result = await Promise.try(
        action.handler,
        ctx.memory.content,
        ctx,
        agent
      );
      return result;
    } catch (error) {
      if (action.onError) {
        return await Promise.try(action.onError, error, ctx, agent);
      } else {
        throw error;
      }
    }
  },
});
