import { createHttpServer } from "@daydreamsai/transport/http/server";
import { context, createDreams } from "@daydreamsai/core";
import { z } from "zod";

const testContext = context({
  type: "test",
  schema: { id: z.string() },
  key: ({ id }) => id,
});

const agent = createDreams({
  contexts: [testContext],
});

createHttpServer({ agent, port: 8888 });
