import * as z from "zod/v4";
import type {
  Agent,
  AnyContext,
  Config,
  Debugger,
  Subscription,
  ContextState,
  Registry,
  InputRef,
  WorkingMemory,
  Log,
  AnyRef,
  LogChunk,
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
import {
  InMemoryGraphProvider,
  InMemoryKeyValueProvider,
  InMemoryVectorProvider,
  MemorySystem,
  ExportManager,
  JSONExporter,
  MarkdownExporter,
} from "./memory";
import { runGenerate } from "./tasks";
import { LogLevel } from "./types";
import { randomUUIDv7, tryAsync } from "./utils";
import { createContextStreamHandler, handleStream } from "./streaming";
import { mainPrompt, promptTemplate } from "./prompts/main";
import { createEngine } from "./engine";
import type { DeferredPromise } from "p-defer";
import {
  configureRequestTracking,
  getRequestTracker,
} from "./tracking/tracker";
import { StructuredLogger, LogEventType } from "./logging-events";
import { createRequestContext } from "./tracking";

/**
 * Creates and configures a new Dreams AI agent instance
 *
 * This is the main factory function for creating a Dreams agent with the specified
 * configuration. The agent manages contexts, actions, memory, and provides a complete
 * framework for building conversational AI applications.
 *
 * @template TContext - The primary context type for this agent
 * @param config - Configuration object defining the agent's capabilities and behavior
 * @returns A fully configured agent instance ready to be started and used
 *
 * @example
 * ```typescript
 * const agent = createDreams({
 *   model: openai("gpt-4"),
 *   memory: new MemorySystem({...}),
 *   actions: [myAction],
 *   contexts: [myContext]
 * });
 *
 * await agent.start();
 * const results = await agent.run({
 *   context: myContext,
 *   args: { message: "Hello" }
 * });
 * ```
 */
export function createDreams<TContext extends AnyContext = AnyContext>(
  config: Config<TContext>
): Agent<TContext> {
  // Agent state management
  let booted = false;

  // Subscription and execution state
  const inputSubscriptions = new Map<string, Subscription>();
  const contextIds = new Set<string>();
  const contexts = new Map<string, ContextState>();
  const contextsRunning = new Map<
    string,
    {
      defer: DeferredPromise<AnyRef[]>;
      controller: AbortController;
      push: (log: Log) => Promise<void>;
    }
  >();

  // Memory and event management
  const workingMemories = new Map<string, WorkingMemory>();
  const ctxSubscriptions = new Map<
    string,
    Set<(ref: AnyRef, done: boolean) => void>
  >();
  const __ctxChunkSubscriptions = new Map<
    string,
    Set<(chunk: LogChunk) => void>
  >();

  // Internal registry for managing agent components
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

  // Extract configuration with defaults
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
    modelSettings,
    exportTrainingData,
    trainingDataPath,
    streaming = true,
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

  // Create structured logger
  const structuredLogger = new StructuredLogger(logger);
  container.instance("structuredLogger", structuredLogger);

  // Configure request tracking with logger integration
  if (config.requestTrackingConfig) {
    // Pass the complete config including cost estimation to the global tracker
    configureRequestTracking(config.requestTrackingConfig, logger);
  }

  const debug: Debugger = (...args) => {
    if (!config.debugger) return;
    try {
      config.debugger(...args);
    } catch {
      logger.error("agent:debugger", "Debugger failed to execute");
    }
  };

  // Initialize service management
  const serviceManager = createServiceManager(container);

  for (const service of services) {
    serviceManager.register(service);
  }

  // Register contexts and process extensions
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

  // Initialize memory system
  const memory =
    config.memory ??
    new MemorySystem({
      providers: {
        kv: new InMemoryKeyValueProvider(),
        vector: new InMemoryVectorProvider(),
        graph: new InMemoryGraphProvider(),
      },
    });

  // Initialize export manager
  const exportManager = new ExportManager();
  exportManager.registerExporter(new JSONExporter());
  exportManager.registerExporter(new MarkdownExporter());

  const agent: Agent<TContext> = {
    logger,
    inputs,
    outputs,
    events,
    actions,
    experts,
    memory,
    container,
    model,
    reasoningModel,
    modelSettings,
    taskRunner,
    debugger: debug,
    context: config.context ?? undefined,
    exportTrainingData,
    trainingDataPath,
    registry,
    exports: exportManager,
    emit: (event: string, data: any) => {
      logger.debug("agent:event", event, data);
    },

    /**
     * Checks if the agent has been started and is ready to process requests
     * @returns True if the agent is booted and ready, false otherwise
     */
    isBooted() {
      return booted;
    },

    /**
     * Subscribes to log events for a specific context
     * @param contextId - The ID of the context to subscribe to
     * @param handler - Function to handle log events
     * @returns Unsubscribe function to remove the handler
     */
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

    __subscribeChunk(contextId, handler) {
      if (!__ctxChunkSubscriptions.has(contextId)) {
        __ctxChunkSubscriptions.set(contextId, new Set());
      }

      const subs = __ctxChunkSubscriptions.get(contextId)!;

      if (subs.has(handler)) {
        throw new Error("handler already registered");
      }

      subs.add(handler);

      return () => {
        subs.delete(handler);
      };
    },

    /**
     * Retrieves the agent's own context state if configured
     * @returns The agent's context state or undefined if not configured
     */
    async getAgentContext() {
      return agent.context
        ? await agent.getContext({
            context: agent.context,
            args: contexts.get("agent:context")!.args,
          })
        : undefined;
    },

    /**
     * Retrieves all active context states managed by this agent
     * @returns Array of context metadata objects
     */
    async getContexts() {
      return getContexts(contextIds, contexts);
    },

    /**
     * Retrieves a specific context state by its ID
     * @template TContext - The context type to retrieve
     * @param id - The unique identifier of the context
     * @returns The context state or null if not found
     */
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

    /**
     * Gets or creates a context state for the given context and arguments
     * This method will create a new context if it doesn't exist
     * @param params - Object containing context definition and arguments
     * @returns The context state (existing or newly created)
     */
    async getContext(params) {
      if (!registry.contexts.has(params.context.type))
        registry.contexts.set(params.context.type, params.context);

      const ctxSchema = params.context.schema
        ? "parse" in params.context.schema
          ? params.context.schema
          : z.object(params.context.schema)
        : undefined;

      const args = ctxSchema ? ctxSchema.parse(params.args) : {};
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

    /**
     * Loads an existing context state without creating a new one
     * @param params - Object containing context definition and arguments
     * @returns The existing context state or null if not found
     */
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

    /**
     * Saves a context state and optionally its working memory to persistent storage
     * @param ctxState - The context state to save
     * @param workingMemory - Optional working memory to save with the context
     * @returns Always returns true on successful save
     */
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

    /**
     * Generates a unique context ID from context definition and arguments
     * @param params - Object containing context and arguments
     * @returns Unique context identifier string
     */
    getContextId(params) {
      return getContextId(params.context, params.args);
    },

    /**
     * Retrieves the working memory for a specific context
     * @param contextId - The ID of the context
     * @returns The working memory data for the context
     * @throws Error if no working memory is found for the context
     */
    async getWorkingMemory(contextId) {
      logger.trace("agent:getWorkingMemory", "Getting working memory", {
        contextId,
      });

      if (!workingMemories.has(contextId)) {
        const memory = await getContextWorkingMemory(agent, contextId);
        if (!memory) {
          throw new Error(`No working memory found for context: ${contextId}`);
        }
        workingMemories.set(contextId, memory);
      }

      return workingMemories.get(contextId)!;
    },

    /**
     * Deletes a context and all its associated data
     * @param contextId - The ID of the context to delete
     * @note Currently does not handle running contexts - they should be stopped first
     */
    async deleteContext(contextId) {
      // TODO: handle if context is currently running

      contexts.delete(contextId);
      contextIds.delete(contextId);

      contextsRunning.delete(contextId);
      workingMemories.delete(contextId);

      await deleteContext(agent, contextId);

      await saveContextsIndex(agent, contextIds);
    },

    /**
     * Starts the agent and initializes all systems
     *
     * This method performs the complete agent startup sequence:
     * - Initializes the memory system
     * - Boots all services
     * - Installs extensions, inputs, outputs, and actions
     * - Loads saved contexts from storage
     * - Sets up the agent's own context if configured
     *
     * @param args - Optional arguments for the agent's context
     * @returns The agent instance for method chaining
     * @throws Error if agent is already booted
     */
    async start(args) {
      if (booted) return agent;
      logger.info("agent:start", "Starting agent", { args, booted });

      booted = true;

      logger.debug("agent:start", "Initializing memory system");
      await agent.memory.initialize();

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
      const savedContexts = await agent.memory.kv.get<string[]>("contexts");

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

    /**
     * Stops the agent and cleans up all resources
     *
     * This method performs graceful shutdown by:
     * - Unsubscribing from all input subscriptions
     * - Aborting any running contexts
     * - Stopping all services
     * - Closing the memory system
     */
    async stop() {
      logger.info("agent:stop", "Stopping agent");
      booted = false;

      for (const unsubscribe of Array.from(inputSubscriptions.values())) {
        try {
          unsubscribe();
        } catch (error) {}
      }

      for (const { controller } of contextsRunning.values()) {
        controller.abort();
      }

      try {
        await serviceManager.stopAll();
      } catch (error) {}

      try {
        await agent.memory.close();
      } catch (error) {}
    },

    /**
     * Runs the agent with a specific context and arguments
     *
     * This is the main execution method that processes a context through multiple
     * steps until completion. It handles:
     * - Context setup and validation
     * - Working memory management
     * - Step-by-step execution with LLM interactions
     * - Action calling and result processing
     * - Error handling and recovery
     * - Request tracking and structured logging
     *
     * @param params - Configuration object for the run
     * @param params.context - The context definition to execute
     * @param params.args - Arguments for the context
     * @param params.model - Optional model override
     * @param params.outputs - Optional custom outputs
     * @param params.handlers - Optional event handlers
     * @param params.abortSignal - Optional abort signal for cancellation
     * @param params.requestContext - Optional request tracking context
     * @param params.chain - Optional chain of previous logs to continue from
     * @returns Array of log references representing the execution history
     * @throws Error if agent is not booted or if no model is available
     */
    async run(params) {
      const { context, args, outputs, handlers, abortSignal, requestContext } =
        params;
      if (!booted) {
        logger.error("agent:run", "Agent not booted");
        throw new Error("Not booted");
      }

      const model =
        params.model ?? context.model ?? config.reasoningModel ?? config.model;

      if (!model) throw new Error("no model");

      // Create request context if not provided
      let effectiveRequestContext = requestContext;
      if (!effectiveRequestContext) {
        effectiveRequestContext = createRequestContext("agent:run", {
          trackingEnabled: config.requestTrackingConfig?.enabled ?? false,
        });
      }

      // Start agent run tracking if requestContext is provided
      let agentRunContext = effectiveRequestContext;
      const tracker = getRequestTracker();
      const startTime = Date.now();

      if (effectiveRequestContext && effectiveRequestContext.trackingEnabled) {
        agentRunContext = await tracker.startAgentRun(
          effectiveRequestContext,
          "agent"
        );
      }

      // Log structured agent start event
      structuredLogger.logEvent({
        eventType: LogEventType.AGENT_START,
        timestamp: startTime,
        requestContext: agentRunContext,
        agentName: "agent",
        configuration: {
          contextType: context.type,
          hasArgs: !!args,
          hasCustomOutputs: !!outputs,
          hasHandlers: !!handlers,
          model: model,
        },
      });

      logger.info("agent:run", "Running context", {
        contextType: context.type,
        hasArgs: !!args,
        hasCustomOutputs: !!outputs,
        hasHandlers: !!handlers,
      });

      try {
        const ctxId = agent.getContextId({ context, args });

        // Get context state and working memory - needed for engine creation
        const ctxState = await agent.getContext({ context, args });
        const workingMemory = await agent.getWorkingMemory(ctxId);
        const agentCtxState = await agent.getAgentContext();

        // Handle concurrent runs for the same context
        // TODO: Add configuration for concurrent execution behavior (abort, queue, or merge)
        if (contextsRunning.has(ctxId)) {
          logger.debug("agent:run", "Context already running", {
            id: ctxId,
          });

          const { defer, push } = contextsRunning.get(ctxId)!;
          params.chain?.forEach((el) => push(el));
          return defer.promise;
        }

        logger.debug("agent:run", "Added context to running set", {
          id: ctxId,
        });

        if (!ctxSubscriptions.has(ctxId)) {
          ctxSubscriptions.set(ctxId, new Set());
        }

        if (!__ctxChunkSubscriptions.has(ctxId)) {
          __ctxChunkSubscriptions.set(ctxId, new Set());
        }

        const engine = createEngine({
          agent,
          ctxState,
          workingMemory,
          handlers,
          agentCtxState,
          subscriptions: ctxSubscriptions.get(ctxId)!,
          __chunkSubscriptions: __ctxChunkSubscriptions.get(ctxId)!,
        });

        contextsRunning.set(ctxId, {
          controller: engine.controller,
          push: engine.push,
          defer: engine.state.defer,
        });

        const { streamState, streamHandler, tags, __streamChunkHandler } =
          createContextStreamHandler({
            abortSignal,
            pushLog(log, done) {
              engine.push(log, done, false);
            },
            __pushLogChunk(chunk) {
              engine.pushChunk(chunk);
            },
          });

        let maxSteps = 0;

        /**
         * Calculates the maximum steps allowed across all contexts
         * @returns The highest maxSteps value from all active contexts, with a minimum of 5
         */
        function getMaxSteps() {
          return engine.state.contexts.reduce(
            (maxSteps, ctxState) =>
              Math.max(
                maxSteps,
                ctxState.settings.maxSteps ?? ctxState.context.maxSteps ?? 0
              ),
            5
          );
        }

        await engine.setParams({
          actions: params.actions,
          outputs: params.outputs,
          contexts: params.contexts,
        });

        let stepRef = await engine.start();

        // TODO: Implement recovery for unprocessed/unfinished steps from previous runs

        if (params.chain) {
          for (const log of params.chain) {
            await engine.push(log);
          }
        }

        await engine.settled();

        const { state } = engine;

        while ((maxSteps = getMaxSteps()) >= state.step) {
          logger.info("agent:run", `Starting step ${state.step}/${maxSteps}`, {
            contextId: ctxState.id,
          });

          try {
            if (state.step > 1) {
              stepRef = await engine.nextStep();
              streamState.index++;
            }

            const promptData = mainPrompt.formatter({
              contexts: state.contexts,
              actions: state.actions,
              outputs: state.outputs,
              workingMemory,
              chainOfThoughtSize: 0,
              maxWorkingMemorySize: ctxState.settings.maxWorkingMemorySize,
            });

            const prompt = mainPrompt.render(promptData);

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
                structuredLogger,
                streaming,
                contextSettings: ctxState.settings,
                requestContext: agentRunContext,
                onError: (error) => {
                  streamError = error;
                  // state.errors.push(error);
                },
              },
              {
                abortSignal,
              }
            );
            logger.debug("agent:run", "Processing stream", {
              step: state.step,
            });

            await handleStream(
              stream,
              streamState.index,
              tags,
              streamHandler,
              __streamChunkHandler
            );

            if (streamError) {
              throw streamError;
            }

            const response = await getTextResponse();
            stepRef.data.response = response;

            unprocessed.forEach((i) => {
              i.processed = true;
            });

            logger.debug("agent:run", "Waiting for action calls to complete", {
              pendingCalls: state.promises.length,
            });

            await engine.settled();

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

            if (!engine.shouldContinue()) break;

            state.step++;
          } catch (error) {
            logger.error("agent:run", "Step execution failed", {
              error,
              step: state.step,
              contextId: ctxState.id,
            });

            await Promise.allSettled(
              [
                saveContextWorkingMemory(agent, ctxState.id, workingMemory),
                state.contexts.map((state) => agent.saveContext(state)),
              ].flat()
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

        // Complete agent run tracking
        if (
          agentRunContext &&
          agentRunContext.agentRunId &&
          agentRunContext.trackingEnabled
        ) {
          await tracker.completeAgentRun(
            agentRunContext.agentRunId,
            "completed"
          );
        }

        const executionTime = Date.now() - startTime;

        // Log structured agent complete event
        structuredLogger.logEvent({
          eventType: LogEventType.AGENT_COMPLETE,
          timestamp: Date.now(),
          requestContext: agentRunContext,
          agentName: "agent",
          executionTime,
          // Note: Token usage and cost will be available from tracking if enabled
        });

        logger.info("agent:run", "Run completed", {
          contextId: ctxState.id,
          chainLength: state.chain.length,
          executionTime,
        });

        state.defer.resolve(state.chain);

        return state.chain;
      } catch (error) {
        // Complete agent run tracking with error
        if (
          agentRunContext &&
          agentRunContext.agentRunId &&
          agentRunContext.trackingEnabled
        ) {
          await tracker.completeAgentRun(agentRunContext.agentRunId, "failed", {
            message: error instanceof Error ? error.message : "Unknown error",
            cause: error,
          });
        }

        // Log structured agent error event
        structuredLogger.logEvent({
          eventType: LogEventType.AGENT_ERROR,
          timestamp: Date.now(),
          requestContext: agentRunContext,
          agentName: "agent",
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            cause: error,
          },
        });

        logger.error("agent:run", "Agent run failed", {
          error,
          contextType: context.type,
        });

        throw error;
      }
    },

    /**
     * Sends input to the agent and runs it with the specified context
     *
     * This is a convenience method that creates an InputRef from the provided
     * input data and calls the run method with it added to the chain.
     *
     * @param params - Configuration object for sending input
     * @param params.context - The context definition to execute
     * @param params.args - Arguments for the context
     * @param params.input - Input data to send to the agent
     * @param params.input.type - Type identifier for the input
     * @param params.input.data - The actual input data
     * @returns Array of log references representing the execution history
     */
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

    /**
     * Evaluates the provided context (placeholder implementation)
     * @param ctx - The agent context to evaluate
     * @deprecated This method is not fully implemented
     */
    async evaluator(ctx) {
      const { id, memory } = ctx;
      logger.debug("agent:evaluator", "memory", memory);
    },
  };

  container.instance("agent", agent);

  return agent;
}
