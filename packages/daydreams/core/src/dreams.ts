import * as z from "zod";
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
  Output,
} from "./types";
import { Logger } from "./logger";
import { createContainer } from "./container";
import { createServiceManager } from "./service-provider";
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
import { LogLevel } from "./types";
import { randomUUIDv7, tryAsync } from "./utils";
import { promptTemplate } from "./prompts/main";
import { defaultPromptBuilder } from "./prompts/default-builder";
import { defaultXmlResponseAdapter } from "./response/default-xml-adapter";
import type { DeferredPromise } from "p-defer";
import { runAgentContext } from "./tasks";
import { SimpleTracker } from "./utils";

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
    services = [],
    extensions = [],
    model,

    modelSettings,
    streaming = true,
  } = config;

  const container = config.container ?? createContainer();

  const logger =
    config.logger ??
    new Logger({
      level: config.logLevel ?? LogLevel.INFO,
    });

  // Extract task configuration with defaults
  const taskConfig = {
    concurrency: {
      default: config.tasks?.concurrency?.default ?? 3,
      llm: config.tasks?.concurrency?.llm ?? 3,
    },
    priority: {
      default: config.tasks?.priority?.default ?? 10,
      high: config.tasks?.priority?.high,
      low: config.tasks?.priority?.low,
    },
  };

  const taskRunner =
    config.taskRunner ?? new TaskRunner(taskConfig.concurrency.default, logger);

  // Setup shared resource queues
  if (!taskRunner.queues.has("llm")) {
    taskRunner.setQueue("llm", taskConfig.concurrency.llm); // Max concurrent LLM calls
  }

  if (config.logger && config.logLevel !== undefined) {
    logger.configure({ level: config.logLevel });
  }

  // Register logger in container for access by other components
  container.instance("logger", logger);

  // Log agent creation
  logger.info("agent:create", "Creating Daydreams agent", {
    model: model,

    logLevel: config.logLevel ?? LogLevel.INFO,
    streaming,
    extensionsCount: extensions.length,
    contextsCount: config.contexts?.length ?? 0,
    actionsCount: actions.length,
    servicesCount: services.length,
    taskConfig: {
      concurrency: taskConfig.concurrency,
      priority: taskConfig.priority,
    },
  });

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
    logger.debug("agent:create", "Registering contexts", {
      count: config.contexts.length,
      types: config.contexts.map((ctx) => ctx.type),
    });
    for (const ctx of config.contexts) {
      registry.contexts.set(ctx.type, ctx);
    }
  }

  for (const extension of extensions) {
    logger.debug("agent:create", `Processing extension: ${extension.name}`, {
      hasInputs: !!extension.inputs,
      hasOutputs: !!extension.outputs,
      hasEvents: !!extension.events,
      actionsCount: extension.actions?.length ?? 0,
      servicesCount: extension.services?.length ?? 0,
      contextsCount: extension.contexts
        ? Object.keys(extension.contexts).length
        : 0,
    });

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
      logger,
    });

  // Initialize export manager
  const exportManager = new ExportManager();
  exportManager.registerExporter(new JSONExporter());
  exportManager.registerExporter(new MarkdownExporter());

  // Create SimpleTracker by default - automatically extracts analytics from logger events
  const tracker = new SimpleTracker(logger);

  const agent: Agent<TContext> = {
    logger,
    tracker,
    prompt: config.prompt ?? defaultPromptBuilder,
    response: config.response ?? defaultXmlResponseAdapter,
    inputs,
    outputs,
    events,
    actions,
    memory,
    container,
    model,
    modelSettings,
    taskRunner,
    debugger: debug,
    context: config.context ?? undefined,
    registry,
    exports: exportManager,
    emit: (event: string, data: any) => {
      logger.debug("agent:event", event, data);
    },

    /**
     * Gets the configured task priority levels
     * @returns Object with priority levels
     */
    getPriorityLevels() {
      return {
        default: taskConfig.priority.default,
        high: taskConfig.priority.high ?? taskConfig.priority.default * 2,
        low:
          taskConfig.priority.low ??
          Math.floor(taskConfig.priority.default / 2),
      };
    },

    /**
     * Gets the task configuration
     * @returns Current task configuration
     */
    getTaskConfig() {
      return { ...taskConfig };
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
      if (contexts.has(id))
        return contexts.get(id)! as unknown as ContextState<TContext>;

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

          await this.saveContext(state as unknown as ContextState);

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
            (await createContextState({
              agent,
              context: params.context,
              args: params.args,
              settings: stateSnapshot.settings,
              contexts: stateSnapshot.contexts,
            })) as unknown as ContextState
          );
        }
      }

      if (!contexts.has(id)) {
        await this.saveContext(
          (await createContextState({
            agent,
            context: params.context,
            args: params.args,
          })) as unknown as ContextState
        );
      }

      return contexts.get(id)! as unknown as ContextState<
        typeof params.context
      >;
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
            (await createContextState({
              agent,
              context: params.context,
              args: params.args,
              settings: stateSnapshot.settings,
              contexts: stateSnapshot.contexts,
            })) as unknown as ContextState
          );
        }
      }

      return (
        (contexts.get(id) as unknown as ContextState<typeof params.context>) ??
        null
      );
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
      return getContextId(params.context, params.args as any);
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

      logger.info("agent:start", "Starting Daydreams agent", {
        args,
        booted,
        agentContext: agent.context?.type,
      });

      // Count context-specific components
      const contextCounts = Array.from(registry.contexts.values()).reduce(
        (counts, ctx) => {
          // Count actions
          if (ctx.actions) {
            counts.actions += Array.isArray(ctx.actions)
              ? ctx.actions.length
              : 1;
          }

          // Count inputs
          if (ctx.inputs) {
            counts.inputs += Object.keys(ctx.inputs).length;
          }

          // Count outputs
          if (ctx.outputs) {
            counts.outputs += Object.keys(ctx.outputs).length;
          }

          return counts;
        },
        { actions: 0, inputs: 0, outputs: 0 }
      );

      // Log configuration summary
      logger.info("agent:start", "Configuration summary", {
        memory: {
          providers: {
            kv: agent.memory.kv.constructor.name,
            vector: agent.memory.vector.constructor.name,
            graph: agent.memory.graph.constructor.name,
          },
        },
        model: {
          primary: model,
          settings: modelSettings,
        },
        registry: {
          contexts: Array.from(registry.contexts.keys()),
          actions: Array.from(registry.actions.keys()),
          contextActions: contextCounts.actions,
          totalActions: registry.actions.size + contextCounts.actions,
          inputs: Array.from(registry.inputs.keys()),
          contextInputs: contextCounts.inputs,
          totalInputs: registry.inputs.size + contextCounts.inputs,
          outputs: Array.from(registry.outputs.keys()),
          contextOutputs: contextCounts.outputs,
          totalOutputs: registry.outputs.size + contextCounts.outputs,
          extensions: Array.from(registry.extensions.keys()),
        },
      });

      booted = true;

      logger.debug("agent:start", "Initializing memory system");
      await agent.memory.initialize();
      logger.debug("agent:start", "Memory system initialized successfully");

      logger.debug("agent:start", "Booting services", {
        count: services.length,
      });
      await serviceManager.bootAll();

      logger.debug("agent:start", "Installing extensions", {
        count: extensions.length,
        names: extensions.map((ext) => ext.name),
      });

      for (const extension of extensions) {
        if (extension.install) {
          logger.trace(
            "agent:start",
            `Installing extension: ${extension.name}`
          );
          await tryAsync(extension.install, agent);
        }
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

      for (const [name, output] of Object.entries(outputs)) {
        if (output.install) {
          logger.trace("agent:start", "Installing output", { name });
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

        contexts.set("agent:context", agentState as unknown as ContextState);
      }

      logger.info("agent:start", "Agent started successfully", {
        registeredComponents: {
          contexts: registry.contexts.size,
          actions: registry.actions.size,
          contextActions: contextCounts.actions,
          totalActions: registry.actions.size + contextCounts.actions,
          inputs: Object.keys(inputs).length,
          contextInputs: contextCounts.inputs,
          totalInputs: registry.inputs.size + contextCounts.inputs,
          outputs: Object.keys(outputs).length,
          contextOutputs: contextCounts.outputs,
          totalOutputs: registry.outputs.size + contextCounts.outputs,
          extensions: extensions.length,
        },
        activeSubscriptions: inputSubscriptions.size,
        savedContexts: savedContexts?.length ?? 0,
        agentContext: agent.context
          ? {
              type: agent.context.type,
              id: contexts.get("agent:context")?.id,
            }
          : undefined,
      });

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
      if (!booted) {
        logger.error("agent:run", "Agent not booted");
        throw new Error("Not booted");
      }

      const { context, args } = params;
      const ctxId = agent.getContextId({ context, args });
      const queueKey = `context:${ctxId}`;

      // Create context-specific queue with concurrency = 1
      if (!taskRunner.queues.has(queueKey)) {
        taskRunner.setQueue(queueKey, 1);
        logger.debug("agent:run", "Created context queue", {
          contextId: ctxId,
          queueKey,
        });
      }

      // Use provided priority or configured default
      const priority = params.priority ?? taskConfig.priority.default;

      // Enqueue the entire context run as a task
      return await taskRunner.enqueueTask(
        runAgentContext,
        {
          agent,
          context: params.context,
          args: params.args,
          outputs: params.outputs,
          handlers: params.handlers,
          chain: params.chain,
          model: params.model,
        },
        {
          queueKey,
          priority,
          abortSignal: params.abortSignal,
          retry: false,
        }
      );
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
  };

  container.instance("agent", agent);

  logger.debug("agent:create", "Agent created successfully", {
    hasContext: !!agent.context,
    registrySize: {
      contexts: registry.contexts.size,
      actions: registry.actions.size,
      inputs: registry.inputs.size,
      outputs: registry.outputs.size,
      extensions: registry.extensions.size,
    },
  });

  return agent;
}
