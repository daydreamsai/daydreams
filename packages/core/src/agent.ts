import { Logger } from "./managers/logger";
import { createContainer } from "./managers/container";
import { createServiceManager } from "./managers/service-provider";
import { resolve } from "./utils";
import {
  type Engine,
  type EngineEventMap,
  type EngineFactory,
} from "./types/engine";
import { defaultManagersProvider } from "./managers/provider";
import { workingMemories, workingMemory } from "./wm";
import pDefer from "p-defer";
import type { DefaultRegistry } from "./managers/registry";
import type { AnyContext, ContextManager } from "./types/context";
import type { AnyAgent, Agent, AgentConfig } from "./types/agent";
import type { EventEmitter } from "./types/managers";
import type { MemoryStoreManager } from "./types/memory";
import { createRunner, type Runner } from "./managers/runner";
import type { Input } from "./types/components";
import { z } from "zod";

export interface AgentEventMap extends EventMap, EngineEventMap {}

export function createAgent<
  TContext extends AnyContext | undefined = undefined,
  TAgentEventMap extends AgentEventMap = AgentEventMap,
  TRegistry extends DefaultRegistry = DefaultRegistry,
>(config: Partial<AgentConfig<TContext>>): Agent<TContext> {
  let state: "idle" | "booting" | "booted" = "idle";

  let boot = pDefer<AnyAgent>();

  const container = config.managers?.container ?? createContainer();
  const serviceManager =
    config.managers?.services ?? createServiceManager(container);

  const runner: Runner = createRunner();
  container.instance("runner", runner);
  container.instance("services", serviceManager);

  if (config.services) {
    for (const service of config.services) {
      serviceManager.register(service);
    }
  } else {
    serviceManager.register(defaultManagersProvider);
  }

  if (config.extensions) {
    const services = config.extensions.flatMap((ext) => ext.services ?? []);
    for (const service of services) {
      serviceManager.register(service);
    }
  }

  const registry: TRegistry = container.resolve("registry");
  const logger: Logger = container.resolve("logger");
  const events: EventEmitter = container.resolve("events");
  const memories: MemoryStoreManager = container.resolve("memories");
  const ctxs: ContextManager = container.resolve("ctxs");

  // registry.registerConfig({
  //   actions: config.uses?.actions,
  //   contexts: config.uses?.contexts,
  //   systems: config.systems,
  //   extensions: config.extensions,
  // });

  // registry.registerRecords({
  //   inputs: config.uses?.inputs,
  //   outputs: config.uses?.outputs,
  // });

  const running = new Map<string, Engine>();

  const agent: Agent<TContext> = {
    container,
    context: config.context,
    ctxs: container.resolve("ctxs"),
    // registry,
    // services: serviceManager,

    isBooted() {
      return state === "booted";
    },

    async getWorkingMemory(id) {
      return memories.get(workingMemory, { id });
    },

    // @ts-ignore
    async start(args: any) {
      if (state !== "idle") return boot.promise;
      state = "booting";
      try {
        await serviceManager.bootAll();
        await registry.install();
        boot.resolve(agent);
        logger.info("agent:start", "Agent started successfully");
      } catch (error) {
        logger.error("agent:start", "Agent start failed");
        boot.reject(error);
      } finally {
        state = "booted";
      }
      return boot.promise;
    },

    async stop() {
      logger.info("agent:stop", "Stopping agent");
    },

    async run(params) {
      if (state === "idle") throw new Error("agent not started");
      await boot.promise;

      const {
        context: { ref: context, args },
      } = params;

      const ctxId = ctxs.getId({ context, args });

      if (running.has(ctxId)) {
        const engine = running.get(ctxId)!;
        if (params.memories) engine.pushMemories(params.memories);
        return engine.results();
      }

      const ctx = await ctxs.get({ context, args });

      const wm = context.wm
        ? await memories.get(await resolve(context.wm, [ctx, agent]), {
            id: ctxId,
          })
        : await agent.getWorkingMemory(ctxId);

      const createEngine = resolve(
        context.engine,
        [ctx, agent],
        container.resolve("engine")
      ) as EngineFactory;

      const engine = createEngine({
        agent,
        ctx,
        wm,
        events: events as any,
        runner,
        // router:
      });

      running.set(ctxId, engine);

      if (params.abortSignal) {
        params.abortSignal.addEventListener("abort", engine.stop, {
          signal: engine.signal,
        });
      }

      try {
        await engine.start();
        await engine.prepareRun(params);
        await engine.run();
        while (engine.isRunning() && engine.shouldContinue()) {
          // console.log("here");
          await engine.settled();
        }
        await engine.stop();
      } catch (error) {
        console.log({ error });
      }

      // await runner.catch(
      //   "engine.run",
      //   async (params: RunParams<any, any, any>) => {},
      //   params
      // );

      console.log("engine ended waiting results");

      const results = await engine.results();
      console.log(results);
      running.delete(ctx.id);
      return results;
    },

    async send(params) {
      // wmKinds.input(, )

      // const inputLog = createInputLog({
      //   id: params.input.id,
      //   name:
      //     typeof params.input.ref === "object"
      //       ? params.input.ref.name
      //       : params.input.ref,
      //   content: params.input.args,
      //   data: undefined,
      //   processed: false,
      // });

      const input: Input =
        typeof params.input.ref !== "string"
          ? params.input.ref
          : (registry.get("inputs", params.input.ref) ?? {
              // kind: "input",
              name: params.input.ref,
              schema: z.any(),
            });

      // if (!input) throw new Error("invalid input");

      const memory = workingMemories.input({
        name: input.name,
        schema: input.schema,
        content: params.input.args,
      });

      return await agent.run({
        ...params,
        memories: params.memories ? [...params.memories, memory] : [memory],
      });
    },
  };

  container.instance("agent", agent);

  return agent;
}
