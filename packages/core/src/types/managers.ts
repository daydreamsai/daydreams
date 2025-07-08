import type EventEmitter from "node:events";
import type { Container } from "./container";
import type { ContextManager } from "./context";
import type { KVStore, MemoryStoreManager } from "./memory";
import type { MaybePromise } from "./utils";
import type { TaskManager } from "@/managers/tasks";
import type { ModelManager } from "./models";

export type { EventEmitter };

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export type Logger = {
  error(context: string, message: string, data?: any): void;
  warn(context: string, message: string, data?: any): void;
  info(context: string, message: string, data?: any): void;
  debug(context: string, message: string, data?: any): void;
  trace(context: string, message: string, data?: any): void;
};

export interface Registry {
  register<T>(type: string, item: T): this;
  get<T>(type: string, item: T): T | null;
  resolve<T>(type: string, item: T): T;
  install(): Promise<void>;
}

export type ServiceProvider = {
  name: string;
  register?: (container: Container) => void;
  boot?: (container: Container) => MaybePromise<void>;
};

export type ServiceManagerState = {
  providers: ServiceProvider[];
  booted: Set<ServiceProvider>;
  registered: Set<ServiceProvider>;
};

export type ServiceManager = {
  state: ServiceManagerState;
  register: (provider: ServiceProvider) => void;
  bootAll: () => Promise<void>;
  isBooted: (provider: ServiceProvider) => boolean;
  isRegistered: (provider: ServiceProvider) => boolean;
};

export interface EventMap extends Record<string, any[]> {}

export interface Managers<TEventMap extends EventMap = EventMap> {
  container: Container;
  logger: Logger;
  store: KVStore;
  memory: MemoryStoreManager;
  ctxs: ContextManager;
  registry: Registry;
  services: ServiceManager;
  events: EventEmitter<TEventMap>;
  tasks: TaskManager;
  models: ModelManager;
}
