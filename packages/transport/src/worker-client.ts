import type { AnyContext, InferSchema, WorkingMemory } from "@daydreamsai/core";
import type { DeferredPromise } from "p-defer";
import defer from "p-defer";
import { z } from "zod";
import type {
  Handlers,
  ContextStateData,
  RunParams,
  SendParams,
} from "./types";

export function createMessagePortTransport(port: MessagePort): Handlers {
  const inflight = new Map<string, DeferredPromise<any>>();

  port.addEventListener("message", (ev) => {
    if (!ev || !ev.data) {
      return;
    }
    // if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
    //   console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
    //   return;
    // }

    try {
      const { id, data } = z
        .object({
          id: z.string(),
          data: z.any().optional(),
        })
        .parse(ev.data);

      const response = inflight.get(id)!;
      if (!response) return;
      inflight.delete(id);
      response.resolve(data);
    } catch {}
  });

  async function request<T = any>(method: string, args?: any): Promise<T> {
    const id = crypto.randomUUID();
    const response = defer<T>();
    inflight.set(id, response);

    port.postMessage(
      JSON.stringify({
        id,
        method,
        args,
      })
    );

    return response.promise;
  }

  port.start();

  return {
    getContext<T extends AnyContext = AnyContext>(params: {
      context: string;
      args: InferSchema<T>;
    }): Promise<ContextStateData<T>> {
      return request("getContext", [params]);
    },
    getContextById<T extends AnyContext = AnyContext>(
      contextId: string
    ): Promise<ContextStateData<T> | null> {
      return request("getContextById", [contextId]);
    },
    saveContext(contextId: string, state: ContextStateData): Promise<boolean> {
      return request("saveContext", [contextId, state]);
    },
    deleteContext(contextId: string): Promise<void> {
      return request("deleteContext", [contextId]);
    },
    getWorkingMemory(contextId: string): Promise<WorkingMemory> {
      return request("getWorkingMemory", [contextId]);
    },
    run(params: RunParams): Promise<void> {
      return request("run", [params]);
    },
    send(params: SendParams): Promise<void> {
      return request("send", [params]);
    },
  };
}
