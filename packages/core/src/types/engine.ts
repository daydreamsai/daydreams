import type { MemoryChunk, Memory, AnyMemory } from "./memory";

export type EngineEventMap = {
  "engine.memory": [AnyMemory, boolean];
  "engine.memory.chunk": [MemoryChunk];
};

export type EngineFactory<
  TEngine extends AnyEngine = AnyEngine,
  CreateParams = any,
> = (params: CreateParams) => TEngine;

export type AnyEngine = Engine<any, any, any>;

export type Engine<State = any, Params = any, Components = any> = {
  name: string;
  version?: number;

  signal: AbortSignal;

  __state: State;

  components(): Components;

  start(): Promise<void>;
  stop(): Promise<void>;

  isRunning(): boolean;
  shouldContinue(): boolean;

  // getContextTree(): ContextStateTree;
  // pause(): Promise<void>;

  run(): Promise<void>;
  // params should be the extra routing handlers
  prepareRun(params: Partial<Params>): Promise<void>;

  push(memory: AnyMemory, done?: boolean): Promise<void>;
  pushChunk(chunk: MemoryChunk): Promise<void>;
  pushMemories(memories: AnyMemory[]): Promise<void>;
  __handlePromise(promise: Promise<any>): void;

  settled(): Promise<void>;
  results(): Promise<AnyMemory[]>;
  stream(): AsyncGenerator<AnyMemory, any>;
};

export type StepEngine<State = any> = Engine<State> & {
  getStep(): number;
  getMaxSteps(): number;

  runStep(): Promise<void>;
  prepareStep(): Promise<void>;
};
