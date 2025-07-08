import type { EngineState } from "./state";
import type { Engine } from "@/types/engine";
import pDefer from "p-defer";
import type { Runner } from "@/managers/runner";
import type { ContextState, ContextStateApi } from "@/types/context";
import type { AnyAgent } from "@/types/agent";
import type {
  ActionCallMemory,
  ActionResultMemory,
  InputMemory,
  OutputMemory,
  ToolCallMemory,
  ToolResultMemory,
  WorkingMemoryCtx,
} from "@/types/wm";
import { handleInput, resolveInput } from "./handlers/input";
import {
  handleActionCall,
  prepareActionCall,
  resolveActionCall,
} from "./handlers/action";
import {
  handleOutput,
  prepareOutputMemory,
  resolveOutput,
} from "./handlers/output";
import type { LLMEngineComponents } from "./llm";
import {
  handleToolCall,
  prepareToolCall,
  resolveToolCall,
} from "./handlers/tool";
import type { AnyMemory } from "@/types/memory";
import { workingMemories } from "@/wm";
import { z } from "zod";
import { formatError } from "@/formatters";

export type MemoryHandlerParams<TMemory extends AnyMemory> = {
  memory: TMemory;
  wm: WorkingMemoryCtx;
  ctx: ContextState;
  agent: AnyAgent;
  engine: Engine;
};

export type RouterCtx<Components = LLMEngineComponents> = {
  router: Router;
  engine: Engine;
  state: EngineState<Components>;
  api: ContextStateApi;
  agent: AnyAgent;
  controller: AbortController;
};

export interface Router<Components = LLMEngineComponents> {
  input(memory: InputMemory, ctx: RouterCtx<Components>): Promise<void>;
  output(
    memory: OutputMemory,
    ctx: RouterCtx<Components>
  ): Promise<OutputMemory[]>;
  action_call(
    memory: ActionCallMemory,
    ctx: RouterCtx<Components>
  ): Promise<ActionResultMemory>;
  tool_call(
    memory: ToolCallMemory,
    ctx: RouterCtx<Components>
  ): Promise<ToolResultMemory>;
}

export function createRouter({
  agent,
  runner,
}: {
  agent: AnyAgent;
  runner: Runner;
}): Router {
  return {
    async input(memory, { state, engine }) {
      const input = runner.runSync("router.resolveInput", resolveInput, {
        memory,
        inputs: state.components.inputs,
      });

      await runner.run("router.handleInput", handleInput, {
        memory,
        agent,
        ctx: state.ctx,
        input,
        wm: state.wm,
        engine,
      });
    },

    async action_call(memory, { engine, state, controller, api }) {
      const defer = pDefer<ActionResultMemory>();
      // engine.__handlePromise(defer.promise);
      state.results.push(defer.promise);

      const actionRef = await runner.try(
        "router.resolveActionCall",
        resolveActionCall,
        {
          memory,
          actions: state.components.actions,
        }
      );

      const actionCtxState =
        state.components.contexts.find(
          (subCtxState: any) => subCtxState.id === actionRef.ctx.id
        ) ?? state.ctx;

      console.log({ actionCtxState: actionCtxState });

      const [prepareActionCallError, actionCallCtx] = await runner.run(
        "router.prepareActionCall",
        prepareActionCall,
        {
          memory,
          action: actionRef,
          ctx: actionCtxState,
          wm: state.wm,
          api,
          engine: engine,
          abortSignal: controller.signal,
        }
      );

      if (prepareActionCallError) {
        defer.reject(prepareActionCallError);
        throw prepareActionCallError;
      }

      let [actionCallError, actionResultsLog] = await runner.run(
        "router.handleActionCall",
        handleActionCall,
        {
          ctx: actionCallCtx,
          action: actionRef.action,
          agent,
          abortSignal: controller.signal,
          queueKey: undefined,
        }
      );

      if (actionCallError) {
        state.errors.push({ error: actionCallError, memory });
        actionResultsLog = workingMemories.action_result(
          {
            name: memory.kind,
            schema: { error: z.unknown() },
            content: { error: formatError(actionCallError) },
          },
          memory
        );
      }

      await engine.push(actionResultsLog!);
      defer.resolve(actionResultsLog);

      return actionResultsLog!;
    },

    async tool_call(memory, { engine, state, controller }) {
      const defer = pDefer<ToolResultMemory>();
      // engine.__handlePromise(defer.promise);
      state.results.push(defer.promise);

      const toolRef = await runner.try(
        "router.resolveToolCall",
        resolveToolCall,
        {
          memory,
          tools: state.components.tools,
        }
      );

      const ctx =
        state.components.contexts.find(
          (subCtxState: any) => subCtxState.id === toolRef.ctx.id
        ) ?? state.ctx;

      const [prepareToolCallError, toolCallCtx] = await runner.run(
        "router.prepareToolCall",
        prepareToolCall,
        {
          memory,
          ctx,
          tool: toolRef.tool,
          wm: state.wm,
          abortSignal: controller.signal,
          engine,
        }
      );

      if (prepareToolCallError) {
        defer.reject(prepareToolCallError);
        throw prepareToolCallError;
      }

      const [handleToolCallError, toolResultsLog] = await runner.run(
        "router.handleToolCall",
        handleToolCall,
        {
          ctx: toolCallCtx,
          tool: toolRef.tool,
          agent,
        }
      );

      if (handleToolCallError) {
        // return createToolResultMemory({
        //   name: log.name,
        //   callId: log.id,
        //   data: { error: formatError(handleToolCallError) },
        //   processed: false,
        // });
        throw new Error("");
      }

      defer.resolve(toolResultsLog);
      engine.push(toolResultsLog);

      return toolResultsLog;
    },

    async output(memory, { state, engine, controller }) {
      const [resolveOutputError, output] = await runner.run(
        "router.resolveOutput",
        resolveOutput,
        {
          memory,
          outputs: state.components.outputs,
        }
      );

      if (resolveOutputError) {
        throw resolveOutputError;
      }

      const [prepareOutputMemoryError] = await runner.run(
        "router.prepareOutputMemory",
        prepareOutputMemory,
        {
          memory,
          output,
        }
      );

      if (prepareOutputMemoryError) {
        throw prepareOutputMemoryError;
      }

      const outputCtx =
        state.components.contexts.find(
          (subCtxState) => subCtxState.id === output.ctx.id
        ) ?? state.ctx;

      const [handleOutputError, result] = await runner.run(
        "router.handleOutput",
        handleOutput,
        {
          memory,
          agent,
          ctx: outputCtx,
          wm: state.wm,
          output,
          engine,
        }
      );

      if (handleOutputError) {
        throw handleOutputError;
      }

      const memories = Array.isArray(result) ? result : [result];

      // for (const memory of memories) {
      //   await engine.push(memory);
      // }

      return memories;
    },
  };
}
