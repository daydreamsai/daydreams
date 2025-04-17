import { z } from "zod";
import type {
  Agent,
  AnyContext,
  Config,
  Debugger,
  Subscription,
  ContextState,
  Episode,
  Registry,
  InputRef,
  WorkingMemory,
  Log,
  AnyRef,
} from "./types";
import { Logger } from "./logger";
import { createContainer } from "./container";
import { createServiceManager } from "./serviceProvider";
import { TaskRunner } from "./task";
import {
  getContextId,
  createContextState,
  getContextWorkingMemory,
  saveContextWorkingMemory,
  saveContextState,
  saveContextsIndex,
  loadContextState,
  getContexts,
  deleteContext,
} from "./context";
import { createMemoryStore } from "./memory";
import { createMemory } from "./memory";
import { createVectorStore } from "./memory/base";
import { runGenerate } from "./tasks";
import { exportEpisodesAsTrainingData } from "./memory/utils";
import { LogLevel } from "./types";
import { randomUUIDv7, tryAsync } from "./utils";
import { createContextStreamHandler, handleStream } from "./streaming";
import { mainStep, promptTemplate } from "./prompts/main";

type RunState = ReturnType<typeof createContextStreamHandler>;

export function createDreams<TContext extends AnyContext = AnyContext>(
  config: Config<TContext>
): Agent<TContext> {
  let booted = false;

  const inputSubscriptions = new Map<string, Subscription>();

  const contextIds = new Set<string>();
  const contexts = new Map<string, ContextState>();
  const contextsRunning = new Map<string, RunState>();

  const workingMemories = new Map<string, WorkingMemory>();

  const ctxSubscriptions = new Map<
    string,
    Set<(ref: AnyRef, done: boolean) => void>
  >();

  // todo register everything into registry, remove from agent
  const registry: Registry = {
    contexts: new Map(),
    actions: new Map(),
    outputs: new Map(),
    inputs: new Map(),
    extensions: new Map(),
    models: new Map(),
    prompts: new Map(),
  };

  registry.prompts.set("step", promptTemplate);

  const {
    inputs = {},
    outputs = {},
    events = {},
    actions = [],
    experts = {},
    services = [],
    extensions = [],
    model,
    reasoningModel,
    exportTrainingData,
    trainingDataPath,
  } = config;

  const container = config.container ?? createContainer();

  const taskRunner = config.taskRunner ?? new TaskRunner(3);

  const logger =
    config.logger ??
    new Logger({
      level: config.logLevel ?? LogLevel.INFO,
    });

  if (config.logger && config.logLevel !== undefined) {
    logger.configure({ level: config.logLevel });
  }

  container.instance("logger", logger);

  const debug: Debugger = (...args) => {
    if (!config.debugger) return;
    try {
      config.debugger(...args);
    } catch {
      console.log("debugger failed");
    }
  };

  const serviceManager = createServiceManager(container);

  for (const service of services) {
    serviceManager.register(service);
  }

  if (config.contexts) {
    for (const ctx of config.contexts) {
      registry.contexts.set(ctx.type, ctx);
    }
  }

  for (const extension of extensions) {
    if (extension.inputs) Object.assign(inputs, extension.inputs);
    if (extension.outputs) Object.assign(outputs, extension.outputs);
    if (extension.events) Object.assign(events, extension.events);
    if (extension.actions) actions.push(...extension.actions);
    if (extension.services) {
      for (const service of extension.services) {
        serviceManager.register(service);
      }
    }

    if (extension.contexts) {
      for (const context of Object.values(extension.contexts)) {
        registry.contexts.set(context.type, context);
      }
    }
  }

  const agent: Agent<TContext> = {
    logger,
    inputs,
    outputs,
    events,
    actions,
    experts,
    memory:
      config.memory ?? createMemory(createMemoryStore(), createVectorStore()),
    container,
    model,
    reasoningModel,
    taskRunner,
    debugger: debug,
    context: config.context ?? undefined,
    exportTrainingData,
    trainingDataPath,
    registry,
    emit: (event: string, data: any) => {
      logger.debug("agent:event", event, data);
    },

    isBooted() {
      return booted;
    },

    subscribeContext(contextId, handler) {
      if (!ctxSubscriptions.has(contextId)) {
        ctxSubscriptions.set(contextId, new Set());
      }

      const subs = ctxSubscriptions.get(contextId)!;

      if (subs.has(handler)) {
        throw new Error("handler already registered");
      }

      subs.add(handler);

      return () => {
        subs.delete(handler);
      };
    },

    async getAgentContext() {
      return agent.context
        ? await agent.getContext({
            context: agent.context,
            args: contexts.get("agent:context")!.args,
          })
        : undefined;
    },

    async getContexts() {
      return getContexts(contextIds, contexts);
    },

    async getContextById<TContext extends AnyContext>(
      id: string
    ): Promise<ContextState<TContext> | null> {
      if (contexts.has(id)) return contexts.get(id)! as ContextState<TContext>;

      const [type] = id.split(":");

      const context = registry.contexts.get(type) as TContext | undefined;

      if (context && contextIds.has(id)) {
        const stateSnapshot = await loadContextState(agent, context, id);

        if (stateSnapshot) {
          const state = await createContextState({
            agent,
            context,
            args: stateSnapshot.args,
            settings: stateSnapshot.settings,
            contexts: stateSnapshot.contexts,
          });

          await this.saveContext(state);

          return state;
        }
      }

      return null;
    },

    async getContext(params) {
      if (!registry.contexts.has(params.context.type))
        registry.contexts.set(params.context.type, params.context);

      const ctxSchema =
        "parse" in params.context.schema
          ? params.context.schema
          : z.object(params.context.schema);

      const args = ctxSchema.parse(params.args);
      const id = getContextId(params.context, args);

      if (!contexts.has(id) && contextIds.has(id)) {
        const stateSnapshot = await loadContextState(agent, params.context, id);

        if (stateSnapshot) {
          await this.saveContext(
            await createContextState({
              agent,
              context: params.context,
              args: params.args,
              settings: stateSnapshot.settings,
              contexts: stateSnapshot.contexts,
            })
          );
        }
      }

      if (!contexts.has(id)) {
        await this.saveContext(
          await createContextState({
            agent,
            context: params.context,
            args: params.args,
          })
        );
      }

      return contexts.get(id)! as ContextState<typeof params.context>;
    },

    async loadContext(params) {
      if (!registry.contexts.has(params.context.type))
        registry.contexts.set(params.context.type, params.context);

      const ctxSchema =
        "parse" in params.context.schema
          ? params.context.schema
          : z.object(params.context.schema);

      const args = ctxSchema.parse(params.args);
      const id = getContextId(params.context, args);

      if (!contexts.has(id) && contextIds.has(id)) {
        const stateSnapshot = await loadContextState(agent, params.context, id);

        if (stateSnapshot) {
          await this.saveContext(
            await createContextState({
              agent,
              context: params.context,
              args: params.args,
              settings: stateSnapshot.settings,
              contexts: stateSnapshot.contexts,
            })
          );
        }
      }

      return (contexts.get(id) as ContextState<typeof params.context>) ?? null;
    },

    async saveContext(ctxState, workingMemory) {
      contextIds.add(ctxState.id);
      contexts.set(ctxState.id, ctxState);

      await saveContextState(agent, ctxState);

      if (workingMemory) {
        workingMemories.set(ctxState.id, workingMemory);
        await saveContextWorkingMemory(agent, ctxState.id, workingMemory);
      }

      await saveContextsIndex(agent, contextIds);

      return true;
    },

    getContextId(params) {
      // logger.trace("agent:getContextId", "Getting context id", params);
      return getContextId(params.context, params.args);
    },

    async getWorkingMemory(contextId) {
      logger.trace("agent:getWorkingMemory", "Getting working memory", {
        contextId,
      });

      if (!workingMemories.has(contextId)) {
        workingMemories.set(
          contextId,
          await getContextWorkingMemory(agent, contextId)
        );
      }

      return workingMemories.get(contextId)!;
    },

    async deleteContext(contextId) {
      //todo: handle if its running;

      contexts.delete(contextId);
      contextIds.delete(contextId);

      contextsRunning.delete(contextId);
      workingMemories.delete(contextId);

      await deleteContext(agent, contextId);

      await saveContextsIndex(agent, contextIds);
    },

    async start(args) {
      if (booted) return agent;
      logger.info("agent:start", "Starting agent", { args, booted });

      booted = true;

      logger.debug("agent:start", "Booting services");
      await serviceManager.bootAll();

      logger.debug("agent:start", "Installing extensions", {
        count: extensions.length,
      });

      for (const extension of extensions) {
        if (extension.install) await tryAsync(extension.install, agent);
      }

      logger.debug("agent:start", "Setting up inputs", {
        count: Object.keys(agent.inputs).length,
      });

      const inputs = {
        ...agent.inputs,
      };

      for (const ctx of registry.contexts.values()) {
        if (ctx.inputs) Object.assign(inputs, ctx.inputs);
      }

      for (const [type, input] of Object.entries(inputs)) {
        if (input.install) {
          logger.trace("agent:start", "Installing input", { type });
          await tryAsync(input.install, agent);
        }

        if (input.subscribe) {
          logger.trace("agent:start", "Subscribing to input", { type });
          let subscription = await tryAsync<Subscription>(
            input.subscribe,
            (context: any, args: any, data: any) => {
              logger.debug("agent", "input", { context, args, data });
              agent
                .send({
                  context,
                  input: { type, data },
                  args,
                })
                .catch((err) => {
                  logger.error("agent:input", "error", err);
                });
            },
            agent
          );

          if (subscription) inputSubscriptions.set(type, subscription);
        }
      }

      logger.debug("agent:start", "Setting up outputs", {
        count: Object.keys(outputs).length,
      });

      for (const [type, output] of Object.entries(outputs)) {
        if (output.install) {
          logger.trace("agent:start", "Installing output", { type });
          await tryAsync(output.install, agent);
        }
      }

      logger.debug("agent:start", "Setting up actions", {
        count: actions.length,
      });

      for (const action of actions) {
        if (action.install) {
          logger.trace("agent:start", "Installing action", {
            name: action.name,
          });
          await tryAsync(action.install, agent);
        }
      }

      logger.debug("agent:start", "Loading saved contexts");
      const savedContexts = await agent.memory.store.get<string[]>("contexts");

      if (savedContexts) {
        logger.trace("agent:start", "Restoring saved contexts", {
          count: savedContexts.length,
        });

        for (const id of savedContexts) {
          contextIds.add(id);
        }
      }

      if (agent.context) {
        logger.debug("agent:start", "Setting up agent context", {
          type: agent.context.type,
        });

        const agentState = await agent.getContext({
          context: agent.context,
          args: args!,
        });

        contexts.set("agent:context", agentState);
      }

      logger.info("agent:start", "Agent started successfully");
      return agent;
    },

    async stop() {
      logger.info("agent:stop", "Stopping agent");
    },

    async run(params) {
      const { context, args, outputs, handlers, abortSignal } = params;
      if (!booted) {
        logger.error("agent:run", "Agent not booted");
        throw new Error("Not booted");
      }

      logger.info("agent:run", "Running context", {
        contextType: context.type,
        hasArgs: !!args,
        hasCustomOutputs: !!outputs,
        hasHandlers: !!handlers,
      });

      const ctxId = agent.getContextId({ context, args });

      // try to move this to state
      // we need this here now because its needed to create the handler
      // and we will use that state from contextsRunning so we need to wait before checking and creating
      const ctxState = await agent.getContext({ context, args });
      const workingMemory = await agent.getWorkingMemory(ctxId);
      const agentCtxState = await agent.getAgentContext();

      // todo: allow to control what happens when new input is sent while the ctx is running
      // context.onInput?
      // we should allow to abort the current run, or just push it to current run
      // state.controller.abort()
      if (contextsRunning.has(ctxId)) {
        logger.debug("agent:run", "Context already running", {
          id: ctxId,
        });

        const { state, push } = contextsRunning.get(ctxId)!;
        params.chain?.forEach((el) => push(el, true));
        return state.defer.promise;
      }

      logger.debug("agent:run", "Added context to running set", {
        id: ctxId,
      });

      if (!ctxSubscriptions.has(ctxId)) {
        ctxSubscriptions.set(ctxId, new Set());
      }

      const { state, handler, push, tags, stepConfig } =
        createContextStreamHandler({
          agent,
          agentCtxState,
          ctxState,
          handlers,
          logger,
          taskRunner,
          workingMemory,
          abortSignal,
          stepConfig: mainStep,
          subscriptions: ctxSubscriptions.get(ctxId)!,
        });

      contextsRunning.set(ctxId, { state, handler, push, tags, stepConfig });

      let maxSteps = 0;

      function getMaxSteps() {
        return state.contexts.reduce(
          (maxSteps, ctxState) =>
            Math.max(
              maxSteps,
              ctxState.settings.maxSteps ?? ctxState.context.maxSteps ?? 0
            ),
          5
        );
      }

      await state.setParams({
        actions: params.actions,
        outputs: params.outputs,
        contexts: params.contexts,
      });

      if (params.chain) {
        await Promise.all(params.chain.map((log) => push(log, true)));
      }

      if (state.calls.length > 0) {
        await Promise.allSettled(state.calls);
        state.calls.length = 0;
      }

      let stepRef = await state.start();

      const model =
        params.model ?? context.model ?? config.reasoningModel ?? config.model;

      while ((maxSteps = getMaxSteps()) >= state.step) {
        logger.info("agent:run", `Starting step ${state.step}/${maxSteps}`, {
          contextId: ctxState.id,
        });

        try {
          if (state.step > 1) {
            stepRef = await state.nextStep();
          }

          const promptData = stepConfig.formatter({
            contexts: state.contexts,
            actions: state.actions,
            outputs: state.outputs,
            workingMemory,
            chainOfThoughtSize: 0,
            maxWorkingMemorySize: ctxState.settings.maxWorkingMemorySize,
          });

          const prompt = stepConfig.render(promptData);

          stepRef.data.prompt = prompt;

          let streamError: any = null;

          const unprocessed = [
            ...workingMemory.inputs.filter((i) => i.processed === false),
            ...state.chain.filter((i) => i.processed === false),
          ];

          const { stream, getTextResponse } = await taskRunner.enqueueTask(
            runGenerate,
            {
              model,
              prompt,
              workingMemory,
              logger,
              onError: (error) => {
                streamError = error;
                state.errors.push(error);
              },
            },
            {
              abortSignal,
            }
          );

          logger.debug("agent:run", "Processing stream", { step: state.step });

          await handleStream(stream, state.index, tags, handler, {});

          if (streamError) {
            throw streamError;
          }

          const response = await getTextResponse();
          stepRef.data.response = response;

          unprocessed.forEach((i) => {
            i.processed = true;
          });

          await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

          logger.debug("agent:run", "Waiting for action calls to complete", {
            pendingCalls: state.calls.length,
          });

          await Promise.allSettled(state.calls);

          state.calls.length = 0;

          stepRef.processed = true;

          await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

          await Promise.all(
            state.contexts.map((state) =>
              state.context.onStep?.(
                {
                  ...state,
                  workingMemory,
                },
                agent
              )
            )
          );

          await Promise.all(
            state.contexts.map((state) => agent.saveContext(state))
          );

          if (state.controller.signal.aborted) break;

          if (!state.shouldContinue()) break;

          state.step++;
        } catch (error) {
          await agent.saveContext(ctxState);

          console.error(error);

          await Promise.allSettled(
            state.contexts.map((state) => agent.saveContext(state))
          );

          if (context.onError) {
            try {
              await context.onError(
                error,
                {
                  ...ctxState,
                  workingMemory,
                },
                agent
              );
            } catch (error) {
              break;
            }
          } else {
            break;
          }
        }
      }

      await Promise.all(
        state.contexts.map((state) =>
          state.context.onRun?.(
            {
              ...state,
              workingMemory,
            },
            agent
          )
        )
      );

      await Promise.all(
        state.contexts.map((state) => agent.saveContext(state))
      );

      logger.debug("agent:run", "Removing context from running set", {
        id: ctxState.id,
      });

      contextsRunning.delete(ctxState.id);

      logger.info("agent:run", "Run completed", {
        contextId: ctxState.id,
        chainLength: state.chain.length,
      });

      state.defer.resolve(state.chain);

      return state.chain;
    },

    async send(params) {
      const inputRef: InputRef = {
        id: randomUUIDv7(),
        ref: "input",
        type: params.input.type,
        content: params.input.data,
        data: undefined,
        timestamp: Date.now(),
        processed: false,
      };

      return await agent.run({
        ...params,
        chain: params.chain ? [...params.chain, inputRef] : [inputRef],
      });
    },

    async evaluator(ctx) {
      const { id, memory } = ctx;
      logger.debug("agent:evaluator", "memory", memory);
    },

    /**
     * Exports all episodes as training data
     * @param filePath Optional path to save the training data
     */
    async exportAllTrainingData(filePath?: string) {
      logger.info(
        "agent:exportTrainingData",
        "Exporting episodes as training data"
      );

      // Get all contexts
      const contexts = await agent.getContexts();

      // Collect all episodes from all contexts
      const allEpisodes: Episode[] = [];

      for (const { id } of contexts) {
        const episodes = await agent.memory.vector.query(id, "");
        if (episodes.length > 0) {
          allEpisodes.push(...episodes);
        }
      }

      logger.info(
        "agent:exportTrainingData",
        `Found ${allEpisodes.length} episodes to export`
      );

      // Export episodes as training data
      if (allEpisodes.length > 0) {
        await exportEpisodesAsTrainingData(
          allEpisodes,
          filePath || config.trainingDataPath || "./training-data.jsonl"
        );
        logger.info(
          "agent:exportTrainingData",
          "Episodes exported successfully"
        );
      } else {
        logger.warn("agent:exportTrainingData", "No episodes found to export");
      }
    },
  };

  container.instance("agent", agent);

  return agent;
}
