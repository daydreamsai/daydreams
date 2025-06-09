import { z } from "zod";
import type { Handlers } from "./types";

type HandlerMethod = keyof Handlers;

function isMethodHandler(
  handlers: Handlers,
  method: string
): method is HandlerMethod {
  return method in handlers;
}

export function createMessagePortServer(port: MessagePort, handlers: Handlers) {
  port.addEventListener("message", async (ev) => {
    console.log({ ev });
    if (!ev || !ev.data) {
      return;
    }
    // if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
    //   console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
    //   return;
    // }
    try {
      const { id, method, args } = z
        .object({
          id: z.string(),
          method: z.string(),
          args: z.array(z.any()),
        })
        .parse(JSON.parse(ev.data));

      console.log({ id, method, args });

      if (!isMethodHandler(handlers, method)) throw new Error("not found");

      const data = await Promise.try(handlers[method] as any, ...args);

      port.postMessage({
        id,
        data,
      });

      // ev.source.postMessage();
    } catch (error) {
      console.log(error);
    }
  });
}
