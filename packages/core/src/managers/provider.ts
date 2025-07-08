import { TaskManager } from "./tasks";
import { createMemoryStoreManager } from "./memory-manager";
import { createContextManager, loadContexts } from "./context-manager";
import { dynamicRegistryFactory } from "./registry";
import { service } from "./service-provider";
import { Logger } from "./logger";
import { createModelsManager } from "./models-manager";
import { LogLevel } from "@/types/managers";
import { createKVStore } from "./kv";
import { createEventEmitter } from "./events";

export const defaultManagersProvider = service({
  name: "default-managers",
  register(container) {
    container
      .singleton("logger", () => new Logger({ level: LogLevel.INFO }))
      .singleton("events", createEventEmitter)
      .singleton("kv", createKVStore)
      .singleton("registry", dynamicRegistryFactory)
      .singleton("tasks", () => new TaskManager(3))
      .singleton("models", () => createModelsManager())
      .singleton("memories", () =>
        createMemoryStoreManager({
          kv: container.resolve("kv"),
        })
      )
      .singleton("ctxs", () => {
        return createContextManager({
          kv: container.resolve("kv"),
          registry: container.resolve("registry"),
          container: container,
          memories: container.resolve("memories"),
        });
      });
  },
  async boot(container) {
    await loadContexts({
      logger: container.resolve("logger"),
      kv: container.resolve("kv"),
      ctxs: container.resolve("ctxs"),
    });
  },
});
