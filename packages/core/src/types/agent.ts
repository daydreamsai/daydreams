import type {
  AnyContext,
  ContextManager,
  InferContextArgs,
  InferContextState,
} from "./context";
import type { EventMap, Managers, ServiceProvider } from "./managers";
import type { System } from "./system";
import type { RunParams } from "./run";
import type { WorkingMemoryCtx } from "./wm";
import type { Input, InputConfig, OutputConfig, SendInput } from "./components";
import type { Action } from "./action";
import type { Container } from "./container";
import type { EngineFactory } from "./engine";
import type { AnyMemory } from "./memory";

export type InferAgentContext<TAgent extends AnyAgent> =
  TAgent extends Agent<infer TContext> ? TContext : never;

export type InferAgentState<TAgent extends AnyAgent> = InferContextState<
  InferAgentContext<TAgent>
>;

export interface Agent<
  TContext extends AnyContext | undefined = undefined,
  TAgentEventMap extends EventMap = EventMap,
> {
  container: Container;
  ctxs: ContextManager;
  context?: TContext;
  isBooted(): boolean;

  run<
    RContext extends AnyContext,
    SubContextRefs extends AnyContext[],
    Systems extends System[],
  >(
    opts: RunParams<RContext, SubContextRefs, Systems>
  ): Promise<AnyMemory[]>;

  send<
    const TInput extends Input | string,
    SContext extends AnyContext,
    SubContextRefs extends AnyContext[],
    Systems extends System[],
  >(
    opts: RunParams<SContext, SubContextRefs, Systems> & {
      input: SendInput<TInput>;
    }
  ): Promise<AnyMemory[]>;

  send<
    const TInput extends Input | string,
    SContext extends AnyContext,
    SubContextRefs extends AnyContext[],
    Systems extends System[],
  >(
    opts: RunParams<SContext, SubContextRefs, Systems> & {
      input: SendInput<TInput>;
    }
  ): Promise<AnyMemory[]>;

  start: TContext extends AnyContext
    ? (args: InferContextArgs<TContext>) => Promise<AnyAgent>
    : (args?: undefined) => Promise<AnyAgent>;

  stop(): Promise<void>;

  getWorkingMemory(id: string): Promise<WorkingMemoryCtx>;
}

export type Extension = {
  name: string;
  install?: (agent: Agent) => Promise<void> | void;
} & Partial<BaseConfig>;

type BaseConfig = {
  services: ServiceProvider[];
  inputs: Record<string, InputConfig>;
  outputs: Record<string, OutputConfig>;
  actions: Action[];
  contexts: AnyContext[];
  systems: System[];
};

export type AnyAgent = Agent<any, any>;

export type DefaultComponents = {
  inputs: Record<string, InputConfig>;
  outputs: Record<string, OutputConfig>;
  actions: Action[];
  contexts: AnyContext[];
  engines: Record<string, EngineFactory>;
};

export interface AgentConfig<
  TContext extends AnyContext | undefined = undefined,
  TComponents extends Record<string, any> = DefaultComponents,
> {
  name: string;
  context: TContext;
  services: ServiceProvider[];
  systems: System[];
  managers: Partial<Managers>;

  extensions: Extension[];

  uses: Partial<TComponents>;
}
