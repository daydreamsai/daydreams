import {
  LogLevel,
  type Agent,
  type AnyContext,
  type Config,
  type Debugger,
  type Log,
  type Output,
  type Subscription,
} from "./types";
import { Logger } from "./logger";
import createContainer from "./container";
import { createServiceManager } from "./serviceProvider";
import { TaskRunner } from "./task";
import {
  getContextId,
  getContextState,
  getContextWorkingMemory,
  getWorkingMemoryLogs,
  saveContextWorkingMemory,
} from "./context";
import { createMemoryStore } from "./memory";
import { createMemory } from "./memory";
import { createVectorStore } from "./memory/base";
import { runGenerate, runGenerateResults } from "./tasks";
import { exportEpisodesAsTrainingData } from "./memory/utils";
import type { Episode, Memory } from "./types";
import { randomUUIDv7, trimWorkingMemory } from "./utils";
import { createContextStreamHandler, handleStream } from "./streaming";

export function createDreams<TContext extends AnyContext = AnyContext>(
  config: Config<TContext>
): Agent<TContext> {
  let booted = false;

  const inputSubscriptions = new Map<string, Subscription>();
  const contexts = new Map<string, { type: string; args?: any }>();
  const contextsRunning = new Set<string>();

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
    trimWorkingMemoryOptions,
  } = config;

  const container = config.container ?? createContainer();

  const taskRunner = config.taskRunner ?? new TaskRunner(3);

  const logger = new Logger({
    level: config.logger ?? LogLevel.INFO,
    enableTimestamp: true,
    enableColors: true,
  });

  container.instance("logger", logger);

  logger.debug("dreams", "Creating agent", {
    hasModel: !!model,
    hasReasoningModel: !!reasoningModel,
    inputsCount: Object.keys(inputs).length,
    outputsCount: Object.keys(outputs).length,
    actionsCount: actions.length,
    servicesCount: services.length,
    extensionsCount: extensions.length,
  });

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
  }

  const agent: Agent<TContext> = {
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
    trimWorkingMemoryOptions,
    emit: (event: string, data: any) => {
      logger.debug("agent:event", event, data);
    },

    async getContexts() {
      return Array.from(contexts.entries()).map(([id, { type, args }]) => ({
        id,
        type,
        args,
      }));
    },

    getContext(params) {
      logger.trace("agent:getContext", "Getting context state", params);
      return getContextState(agent, params.context, params.args);
    },

    getContextId(params) {
      logger.trace("agent:getContextId", "Getting context id", params);
      return getContextId(params.context, params.args);
    },

    getWorkingMemory(contextId) {
      logger.trace("agent:getWorkingMemory", "Getting working memory", {
        contextId,
      });
      return getContextWorkingMemory(agent, contextId);
    },

    async trimMemory(contextId, options) {
      logger.info("agent:trimMemory", "Manually trimming working memory", {
        contextId,
        hasCustomOptions: !!options,
      });

      const workingMemory = await getContextWorkingMemory(agent, contextId);

      // Use provided options, or fall back to global config options, or use default
      const trimOptions = options || trimWorkingMemoryOptions || undefined;

      trimWorkingMemory(workingMemory, trimOptions);

      // Save the trimmed working memory
      await saveContextWorkingMemory(agent, contextId, workingMemory);

      logger.debug("agent:trimMemory", "Working memory trimmed and saved", {
        contextId,
        inputsCount: workingMemory.inputs.length,
        outputsCount: workingMemory.outputs.length,
        thoughtsCount: workingMemory.thoughts.length,
        callsCount: workingMemory.calls.length,
        resultsCount: workingMemory.results.length,
      });
    },

    async start(args) {
      logger.info("agent:start", "Starting agent", { args, booted });
      if (booted) return agent;

      booted = true;

      logger.debug("agent:start", "Booting services");
      await serviceManager.bootAll();

      logger.debug("agent:start", "Installing extensions", {
        count: extensions.length,
      });

      for (const extension of extensions) {
        if (extension.install) await extension.install(agent);
      }

      logger.debug("agent:start", "Setting up inputs", {
        count: Object.keys(agent.inputs).length,
      });

      for (const [type, input] of Object.entries(agent.inputs)) {
        if (input.install) {
          logger.trace("agent:start", "Installing input", { type });
          await Promise.resolve(input.install(agent));
        }

        if (input.subscribe) {
          logger.trace("agent:start", "Subscribing to input", { type });
          let subscription = input.subscribe((context, args, data) => {
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
          }, agent);

          if (typeof subscription === "object") {
            subscription = await Promise.resolve(subscription);
          }

          if (subscription) inputSubscriptions.set(type, subscription);
        }
      }

      logger.debug("agent:start", "Setting up outputs", {
        count: Object.keys(outputs).length,
      });
      for (const [type, output] of Object.entries(outputs)) {
        if (output.install) {
          logger.trace("agent:start", "Installing output", { type });
          await Promise.resolve(output.install(agent));
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
          await Promise.resolve(action.install(agent));
        }
      }

      if (agent.context) {
        logger.debug("agent:start", "Setting up agent context", {
          type: agent.context.type,
        });
        const { id } = await getContextState(agent, agent.context, args);
        contexts.set(id, { type: agent.context.type, args });
        contexts.set("agent:context", { type: agent.context.type, args });
      }

      logger.debug("agent:start", "Loading saved contexts");
      const savedContexts =
        await agent.memory.store.get<[string, { type: string; args?: any }][]>(
          "contexts"
        );

      if (savedContexts) {
        logger.trace("agent:start", "Restoring saved contexts", {
          count: savedContexts.length,
        });
        for (const [id, { type, args }] of savedContexts) {
          contexts.set(id, { type, args });
        }
      }

      logger.info("agent:start", "Agent started successfully");
      return agent;
    },

    async stop() {
      logger.info("agent:stop", "Stopping agent");
    },

    run: async ({ context, args, outputs, handlers, abortSignal, model }) => {
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

      const ctxState = await getContextState(agent, context, args);
      logger.debug("agent:run", "Context state retrieved", { id: ctxState.id });

      contexts.set(ctxState.id, { type: context.type, args });

      await agent.memory.store.set<[string, { args?: any }][]>(
        "contexts",
        Array.from(contexts.entries())
      );

      if (contextsRunning.has(ctxState.id)) {
        logger.debug("agent:run", "Context already running", {
          id: ctxState.id,
        });
        return [];
      }

      contextsRunning.add(ctxState.id);
      logger.debug("agent:run", "Added context to running set", {
        id: ctxState.id,
      });

      const workingMemory = await getContextWorkingMemory(agent, ctxState.id);

      // Apply trim to working memory if options are set
      if (trimWorkingMemoryOptions) {
        logger.debug("agent:run", "Trimming working memory", {
          id: ctxState.id,
          options: trimWorkingMemoryOptions,
        });
        trimWorkingMemory(workingMemory, trimWorkingMemoryOptions);
      }

      logger.trace("agent:run", "Working memory retrieved", {
        id: ctxState.id,
        inputsCount: workingMemory.inputs.length,
        outputsCount: workingMemory.outputs.length,
        thoughtsCount: workingMemory.thoughts.length,
      });

      const contextOuputs: Output[] = Object.entries({
        ...agent.outputs,
        ...(outputs ?? {}),
      })
        .filter(([_, output]) =>
          output.enabled
            ? output.enabled({
                ...ctxState,
                context,
                workingMemory,
              })
            : true
        )
        .map(([type, output]) => ({
          type,
          ...output,
        }));

      logger.debug("agent:run", "Enabled outputs", {
        count: contextOuputs.length,
      });

      const agentCtxState = agent.context
        ? await getContextState(
            agent,
            agent.context,
            contexts.get("agent:context")!.args
          )
        : undefined;

      logger.debug("agent:run", "Preparing actions");

      const contextActions = await Promise.all(
        actions.map(async (action) => {
          if (action.context && action.context.type !== context.type)
            return undefined;

          let actionMemory: Memory | undefined = undefined;

          if (action.memory) {
            actionMemory =
              (await agent.memory.store.get(action.memory.key)) ??
              action.memory.create();
          }

          const enabled = action.enabled
            ? action.enabled({
                ...ctxState,
                context,
                workingMemory,
                actionMemory,
                agentMemory: agentCtxState?.memory,
              })
            : true;

          return enabled ? action : undefined;
        })
      ).then((r) => r.filter((a) => !!a));

      logger.debug("agent:run", "Enabled actions", {
        count: contextActions.length,
      });

      logger.debug("agent:run", "Agent context state", {
        hasAgentContext: !!agentCtxState,
        id: agentCtxState?.id,
      });

      const chain: Log[] = [];

      let hasError = false;
      let actionCalls: Promise<any>[] = [];

      const { state, handler, tags } = createContextStreamHandler({
        agent,
        chain,
        actions: contextActions,
        actionCalls,
        agentCtxState,
        ctxState,
        handlers,
        logger,
        outputs: contextOuputs,
        taskRunner,
        workingMemory,
        abortSignal,
      });

      let step = 1;
      const maxSteps = context.maxSteps ?? 5;

      while (maxSteps > step) {
        logger.info("agent:run", `Starting step ${step}/${maxSteps}`, {
          contextId: ctxState.id,
        });

        try {
          const { stream, response } = await taskRunner.enqueueTask(
            step > 1 ? runGenerateResults : runGenerate,
            {
              agent,
              model:
                model ?? context.model ?? config.reasoningModel ?? config.model,
              contexts: [agentCtxState, ctxState].filter((t) => !!t),
              contextId: ctxState.id,
              actions: contextActions,
              outputs: contextOuputs,
              workingMemory,
              logger,
              chain,
              abortSignal,
            },
            {
              debug: agent.debugger,
            }
          );

          logger.debug("agent:run", "Processing stream", { step });

          await handleStream(stream, state.index, handler, tags);

          state.index++;

          logger.debug("agent:run", "Waiting for action calls to complete", {
            pendingCalls: actionCalls.length,
          });

          await Promise.allSettled(actionCalls);

          actionCalls.length = 0;

          logger.debug("agent:run", "Saving context state", {
            id: ctxState.id,
          });

          await agent.memory.store.set(ctxState.id, ctxState.memory);

          if (agentCtxState) {
            logger.debug("agent:run", "Saving agent context state", {
              id: agentCtxState.id,
            });

            await agent.memory.store.set(
              agentCtxState.id,
              agentCtxState.memory
            );
          }

          logger.debug("agent:run", "Saving working memory", {
            id: ctxState.id,
            workingMemory,
          });

          step++;

          if (context.onStep) {
            await context.onStep({
              ...ctxState,
              workingMemory,
            });
          }

          if (hasError) {
            logger.warn("agent:run", "Continuing despite error", { step });
            continue;
          }

          await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

          const pendingResults = workingMemory.results.filter(
            (i) => i.processed === false
          );

          if (pendingResults.length === 0 || abortSignal?.aborted) break;
        } catch (error) {
          console.error(error);
          break;
        }
      }

      logger.debug("agent:run", "Marking all working memory as processed");

      getWorkingMemoryLogs(workingMemory).forEach((i) => {
        i.processed = true;
      });

      logger.debug("agent:run", "Removing context from running set", {
        id: ctxState.id,
      });

      contextsRunning.delete(ctxState.id);

      logger.info("agent:run", "Run completed", {
        contextId: ctxState.id,
        chainLength: chain.length,
      });

      return chain;
    },

    send: async (params) => {
      logger.info("agent:send", "Sending input", {
        inputType: params.input.type,
        contextType: params.context.type,
      });

      if (params.input.type in agent.inputs === false) {
        logger.error("agent:send", "Invalid input type", {
          type: params.input.type,
        });
        throw new Error("invalid input");
      }

      const args = params.context.schema.parse(params.args);

      const {
        key,
        id: contextId,
        options,
        memory,
      } = await getContextState(agent, params.context, args);

      logger.debug("agent:send", "Context state retrieved", {
        id: contextId,
        key,
      });

      const workingMemory = await getContextWorkingMemory(agent, contextId);

      // Apply trim to working memory if options are set
      if (trimWorkingMemoryOptions) {
        logger.debug("agent:send", "Trimming working memory", {
          id: contextId,
          options: trimWorkingMemoryOptions,
        });
        trimWorkingMemory(workingMemory, trimWorkingMemoryOptions);
      }

      logger.trace("agent:send", "Working memory retrieved", {
        id: contextId,
        inputsCount: workingMemory.inputs.length,
      });

      const input = agent.inputs[params.input.type];
      const data = input.schema.parse(params.input.data);

      logger.debug("agent:send", "Input data parsed", {
        type: params.input.type,
      });

      logger.debug("agent:send", "Querying episodic memory");

      const episodicMemory = await agent.memory.vector.query(
        `${contextId}`,
        JSON.stringify(data)
      );

      logger.trace("agent:send", "Episodic memory retrieved", {
        episodesCount: episodicMemory.length,
      });

      workingMemory.episodicMemory = {
        episodes: episodicMemory,
      };

      if (input.handler) {
        logger.debug("agent:send", "Using custom input handler", {
          type: params.input.type,
        });

        await input.handler(
          data,
          {
            id: contextId,
            context: params.context,
            args,
            type: params.context.type,
            key,
            memory,
            workingMemory,
            options,
          },
          agent
        );
      } else {
        logger.debug("agent:send", "Adding input to working memory", {
          type: params.context.type,
        });

        workingMemory.inputs.push({
          id: randomUUIDv7(),
          ref: "input",
          type: params.context.type,
          data,
          timestamp: Date.now(),
          formatted: input.format ? input.format(data) : undefined,
          processed: false,
        });
      }

      logger.debug("agent:send", "Running evaluator");
      await agent.evaluator({
        type: params.context.type,
        key,
        memory,
        options,
      } as any);

      logger.debug("agent:send", "Saving context memory", { id: contextId });
      await agent.memory.store.set(contextId, memory);

      logger.debug("agent:send", "Saving working memory");
      await saveContextWorkingMemory(agent, contextId, workingMemory);

      logger.debug("agent:send", "Running run method");
      return await agent.run(params);
    },

    evaluator: async (ctx) => {
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
          filePath || agent.trainingDataPath || "./training-data.jsonl"
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
