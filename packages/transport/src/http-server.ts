import type { AnyAgent } from "@daydreamsai/core";
import { createServerHandlers } from "./server";
import { z } from "zod";

export function createHttpServer({
  agent,
  port,
}: {
  agent: AnyAgent;
  port: number;
}) {
  const handlers = createServerHandlers(agent);
  return Bun.serve({
    port,
    error(error) {
      console.log(error);
    },
    fetch(request, server) {
      console.log(request.url);
      return new Response("NOT FOUND");
    },
    routes: {
      "/api/context": {
        GET: async (req) => {
          const { type, args: encoded } = z
            .object({
              type: z.string(),
              args: z.string(),
            })
            .parse(Object.fromEntries(new URL(req.url).searchParams.entries()));

          const args = JSON.parse(
            Buffer.from(encoded, "base64").toString("utf8")
          );

          // params
          const res = await handlers.getContext({
            context: type,
            args,
          });

          return Response.json(res);
        },
      },
      "/api/context/:id": {
        GET: async (req) => {
          const res = await handlers.getContextById(req.params.id);
          return Response.json(res);
        },
        POST: async (req) => {
          const body = (await req.json()) as any;
          const res = await handlers.saveContext(req.params.id, body);
          return Response.json(res);
        },
      },
      "/api/wm/:id": {
        GET: async (req) => {
          const res = await handlers.getWorkingMemory(req.params.id);
          return Response.json(res);
        },
      },
      "/api/run": {
        POST: async (req) => {
          const body = (await req.json()) as any;
          const res = await handlers.run(body);
          return Response.json(res);
        },
      },
      "/api/send": {
        POST: async (req) => {
          const body = (await req.json()) as any;
          const res = await handlers.run(body);
          return Response.json(res);
        },
      },
    },
  });
}
